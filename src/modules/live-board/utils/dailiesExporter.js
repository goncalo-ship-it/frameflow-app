// dailiesExporter.js — Export multicâmara para Premiere/DaVinci Resolve
// FCPXML (multicam), EDL CMX3600, ALE (Avid)
// Clips ordenados por cena, synced por timecode (do MEDIAPRO.XML)

/**
 * Gera FCPXML multicâmara para Premiere Pro / Final Cut Pro.
 * Agrupa clips por cena, cria multicam clips com as câmaras sync por timecode.
 *
 * @param {Array} cameras — [{ camera, clips: [...] }]
 * @param {object} clipMeta — { clipId: { rating, notes, sceneId, selected } }
 * @param {Array} sceneOrder — IDs de cenas na ordem do guião
 * @param {object} scenes — { sceneId: { sceneNumber, location, ... } }
 * @param {object} options — { projectName, fps, onlySelected }
 * @returns {string} FCPXML
 */
export function exportFCPXML(cameras, clipMeta, sceneOrder, scenes, options = {}) {
  const {
    projectName = 'FrameFlow Dailies',
    fps = 25,
    onlySelected = false,
    audioTracks = [],
  } = options

  const frameDur = `${fps * 100}/${100 * fps}s`  // "2500/2500s" = 1 frame
  const timebase = fps

  // Collect all clips with metadata, sorted by scene
  const clipsWithMeta = []
  for (const cam of cameras) {
    for (const clip of cam.clips) {
      const meta = clipMeta[clip.id] || {}
      if (onlySelected && !meta.selected) continue
      clipsWithMeta.push({ ...clip, camera: cam.camera, meta })
    }
  }

  // Group by scene
  const byScene = new Map()
  const unlinked = []
  for (const clip of clipsWithMeta) {
    const sceneId = clip.meta.sceneId
    if (sceneId) {
      if (!byScene.has(sceneId)) byScene.set(sceneId, [])
      byScene.get(sceneId).push(clip)
    } else {
      unlinked.push(clip)
    }
  }

  // Order scenes by sceneOrder
  const orderedScenes = []
  for (const sid of (sceneOrder || [])) {
    if (byScene.has(sid)) {
      orderedScenes.push({ sceneId: sid, clips: byScene.get(sid) })
    }
  }
  // Append any scenes not in sceneOrder
  for (const [sid, clips] of byScene) {
    if (!orderedScenes.find(s => s.sceneId === sid)) {
      orderedScenes.push({ sceneId: sid, clips })
    }
  }
  // Append unlinked at the end
  if (unlinked.length > 0) {
    orderedScenes.push({ sceneId: '__unlinked__', clips: unlinked })
  }

  // Read resolution from the first clip that has it
  const firstClipWithRes = clipsWithMeta.find(c => c.resolution)
  const [resW, resH] = (firstClipWithRes?.resolution || '3840x2160').split('x')

  // Build FCPXML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<!DOCTYPE fcpxml>\n`
  xml += `<fcpxml version="1.10">\n`
  xml += `  <resources>\n`
  xml += `    <format id="r1" name="FFVideoFormat${fps === 25 ? '1080p25' : '1080p24'}" frameDuration="100/${fps * 100}s" width="${resW}" height="${resH}"/>\n`

  // Generate resource IDs for each clip
  let resourceId = 2
  const clipResources = []
  for (const clip of clipsWithMeta) {
    const rid = `r${resourceId++}`
    const durFrames = clip.dur || Math.round(clip.durationSec * fps)
    // If clip has cut points from audio analysis, use trimmed duration
    const meta = clipMeta[clip.id] || clip.meta || {}
    const hasCP = meta.inPoint !== undefined && meta.outPoint !== undefined
    const trimInFrames = hasCP ? Math.round(meta.inPoint * fps) : 0
    const trimOutFrames = hasCP ? Math.round(meta.outPoint * fps) : durFrames
    const trimDurFrames = trimOutFrames - trimInFrames

    clipResources.push({
      rid,
      clip,
      duration: `${durFrames * 100}/${fps * 100}s`,
      trimStart: `${trimInFrames * 100}/${fps * 100}s`,
      trimDuration: `${trimDurFrames * 100}/${fps * 100}s`,
      hasCutPoints: hasCP,
    })
    xml += `    <asset id="${rid}" name="${clip.filename}" src="file:///${encodeURI(clip.uri.replace(/^\.\//, ''))}" start="0s" duration="${durFrames * 100}/${fps * 100}s" format="r1">\n`
    xml += `      <metadata>\n`
    xml += `        <md key="com.apple.proapps.studio.reel" value="${clip.camera}"/>\n`
    xml += `        <md key="com.apple.proapps.studio.scene" value="${clip.meta.sceneId || ''}"/>\n`
    if (clip.meta.notes) xml += `        <md key="com.apple.proapps.studio.comment" value="${escapeXml(clip.meta.notes)}"/>\n`
    if (clip.meta.rating) xml += `        <md key="com.apple.proapps.mio.custom.rating" value="${clip.meta.rating}"/>\n`
    xml += `      </metadata>\n`
    xml += `    </asset>\n`
  }

  // Audio track resources (external audio from Sound Devices, Zoom, etc.)
  const audioResources = []
  for (const track of audioTracks) {
    const rid = `r${resourceId++}`
    const durFrames = Math.round(track.durationSec * fps)
    audioResources.push({ rid, track, duration: `${durFrames * 100}/${fps * 100}s` })
    xml += `    <asset id="${rid}" name="${escapeXml(track.filename)}" src="file:///${encodeURI(track.filename)}" start="0s" duration="${durFrames * 100}/${fps * 100}s" format="r1" hasAudio="1" hasVideo="0">\n`
    xml += `      <metadata>\n`
    if (track.scene) xml += `        <md key="com.apple.proapps.studio.scene" value="${escapeXml(track.scene)}"/>\n`
    if (track.originator) xml += `        <md key="com.apple.proapps.studio.reel" value="${escapeXml(track.originator)}"/>\n`
    xml += `      </metadata>\n`
    xml += `    </asset>\n`
  }

  // Build audio lookup: clipId → audioResource
  const audioByClip = {}
  for (const res of audioResources) {
    for (const clipId of (res.track.linkedClipIds || [])) {
      audioByClip[clipId] = res
    }
  }

  xml += `  </resources>\n`

  // Library → Event → Project with multicam sequences
  xml += `  <library>\n`
  xml += `    <event name="${escapeXml(projectName)}">\n`

  // Create multicam clips for scenes with multiple cameras
  let mcId = 1
  for (const { sceneId, clips } of orderedScenes) {
    const sceneName = sceneId === '__unlinked__'
      ? 'Sem Cena'
      : (() => {
          const s = scenes?.[sceneId]
          const num = s?.sceneNumber || sceneId
          return `Sc.${num} — ${s?.location || ''}`
        })()

    // Group clips by camera
    const byCam = new Map()
    for (const clip of clips) {
      if (!byCam.has(clip.camera)) byCam.set(clip.camera, [])
      byCam.get(clip.camera).push(clip)
    }

    // Collect linked audio tracks for this scene's clips
    const sceneAudioTracks = new Map() // audioTrackId → audioResource
    for (const clip of clips) {
      const audioRes = audioByClip[clip.id]
      if (audioRes && !sceneAudioTracks.has(audioRes.track.id)) {
        sceneAudioTracks.set(audioRes.track.id, audioRes)
      }
    }
    const hasExtAudio = sceneAudioTracks.size > 0

    if (byCam.size > 1 || hasExtAudio) {
      // Multicam clip — video angles + external audio angle
      xml += `      <mc-clip name="${escapeXml(sceneName)}" format="r1">\n`
      xml += `        <mc-source>\n`

      let angleIdx = 0
      for (const [camName, camClips] of byCam) {
        xml += `          <mc-angle name="${escapeXml(camName)}" angleID="${angleIdx}">\n`
        let offset = 0
        for (const clip of camClips) {
          const res = clipResources.find(r => r.clip.id === clip.id)
          if (!res) continue
          const clipDur = res.hasCutPoints ? res.trimDuration : res.duration
          const clipStart = res.hasCutPoints ? res.trimStart : '0s'
          // If external audio linked, mute camera audio (audioRole="")
          const muteAttr = audioByClip[clip.id] ? ' audioRole=""' : ''
          xml += `            <asset-clip name="${clip.filename}" ref="${res.rid}" offset="${offset * 100}/${fps * 100}s" start="${clipStart}" duration="${clipDur}"${muteAttr}>\n`
          if (clip.meta.rating === 'ok' || clip.meta.selected) {
            xml += `              <marker start="${clipStart}" value="${clip.meta.selected ? 'SELECTED' : 'BOM'}"/>\n`
          }
          xml += `            </asset-clip>\n`
          const advFrames = res.hasCutPoints
            ? (Math.round((clipMeta[clip.id]?.outPoint || clip.durationSec) * fps) - Math.round((clipMeta[clip.id]?.inPoint || 0) * fps))
            : (clip.dur || Math.round(clip.durationSec * fps))
          offset += advFrames
        }
        xml += `          </mc-angle>\n`
        angleIdx++
      }

      // External audio angle (Sound Devices / Zoom)
      if (hasExtAudio) {
        const audioLabel = sceneAudioTracks.size === 1
          ? [...sceneAudioTracks.values()][0].track.originator?.split(':')[0] || 'Áudio Externo'
          : 'Áudio Externo'
        xml += `          <mc-angle name="${escapeXml(audioLabel)}" angleID="${angleIdx}">\n`
        let audioOffset = 0
        for (const [, audioRes] of sceneAudioTracks) {
          xml += `            <asset-clip name="${escapeXml(audioRes.track.filename)}" ref="${audioRes.rid}" offset="${audioOffset * 100}/${fps * 100}s" duration="${audioRes.duration}" audioRole="dialogue"/>\n`
          audioOffset += Math.round(audioRes.track.durationSec * fps)
        }
        xml += `          </mc-angle>\n`
      }

      xml += `        </mc-source>\n`
      xml += `      </mc-clip>\n`
    } else {
      // Single camera — regular clips with scene marker
      for (const clip of clips) {
        const res = clipResources.find(r => r.clip.id === clip.id)
        if (!res) continue
        const clipDur = res.hasCutPoints ? res.trimDuration : res.duration
        const clipStart = res.hasCutPoints ? res.trimStart : '0s'
        xml += `      <asset-clip name="${escapeXml(`${sceneName} — ${clip.filename}`)}" ref="${res.rid}" start="${clipStart}" duration="${clipDur}">\n`
        if (clip.meta.notes) {
          xml += `        <note>${escapeXml(clip.meta.notes)}</note>\n`
        }
        if (clip.meta.rating === 'ok' || clip.meta.selected) {
          xml += `        <marker start="${clipStart}" value="${clip.meta.selected ? 'SELECTED' : 'BOM'}"/>\n`
        }
        xml += `      </asset-clip>\n`
      }
    }
  }

  xml += `    </event>\n`
  xml += `  </library>\n`
  xml += `</fcpxml>\n`

  return xml
}

/**
 * Gera EDL CMX3600 multicâmara para DaVinci Resolve.
 * Uma EDL por câmara, clips ordenados por cena.
 *
 * @returns {{ [cameraName]: string }} — mapa de EDL por câmara
 */
export function exportEDL(cameras, clipMeta, sceneOrder, scenes, options = {}) {
  const {
    projectName = 'FrameFlow Dailies',
    fps = 25,
    onlySelected = false,
  } = options

  const edls = {}

  for (const cam of cameras) {
    let edl = `TITLE: ${projectName} — ${cam.camera}\n`
    edl += `FCM: NON-DROP FRAME\n\n`

    let editNum = 1
    let recordTC = 0 // running record timecode in frames

    // Collect & sort clips by scene order
    const sortedClips = getClipsSortedByScene(cam.clips, clipMeta, sceneOrder, onlySelected)

    for (const clip of sortedClips) {
      const meta = clipMeta[clip.id] || {}
      const durFrames = clip.dur || Math.round(clip.durationSec * fps)
      // Use cut points if available
      const hasCP = meta.inPoint !== undefined && meta.outPoint !== undefined
      const srcInFrames = hasCP ? Math.round(meta.inPoint * fps) : 0
      const srcOutFrames = hasCP ? Math.round(meta.outPoint * fps) : durFrames
      const editDur = srcOutFrames - srcInFrames
      const srcIn = framesToTC(srcInFrames, fps)
      const srcOut = framesToTC(srcOutFrames, fps)
      const recIn = framesToTC(recordTC, fps)
      const recOut = framesToTC(recordTC + editDur, fps)

      edl += `${String(editNum).padStart(3, '0')}  ${clip.filename.slice(0, 8).padEnd(8)} V     C        ${srcIn} ${srcOut} ${recIn} ${recOut}\n`

      // Comment line with scene + notes
      const sceneLabel = meta.sceneId ? (scenes?.[meta.sceneId]?.sceneNumber || meta.sceneId) : ''
      const ratingLabel = meta.rating ? ` [${RATING_MAP[meta.rating] || meta.rating}]` : ''
      const noteLabel = meta.notes ? ` ${meta.notes}` : ''
      if (sceneLabel || ratingLabel || noteLabel) {
        edl += `* FROM CLIP NAME: ${clip.filename}\n`
        if (sceneLabel) edl += `* SCENE: ${sceneLabel}\n`
        if (ratingLabel || noteLabel) edl += `* COMMENT:${ratingLabel}${noteLabel}\n`
      }
      if (meta.selected) {
        edl += `* SELECTED\n`
      }
      edl += `\n`

      recordTC += editDur
      editNum++
    }

    edls[cam.camera] = edl
  }

  return edls
}

/**
 * Gera ALE (Avid Log Exchange) para Avid Media Composer.
 * Todas as câmaras num único ficheiro, com colunas por campo.
 */
export function exportALE(cameras, clipMeta, sceneOrder, scenes, options = {}) {
  const {
    projectName = 'FrameFlow Dailies',
    fps = 25,
    onlySelected = false,
  } = options

  let ale = `Heading\n`
  ale += `FIELD_DELIM\tTABS\n`
  ale += `VIDEO_FORMAT\t${fps}fps\n`
  ale += `FILM_FORMAT\t35mm\n`
  ale += `TAPE\t${projectName}\n\n`

  ale += `Column\n`
  ale += `Name\tTape\tStart\tEnd\tDuration\tScene\tCamera\tRating\tSelected\tNotes\tResolution\tCodec\n\n`

  ale += `Data\n`

  const allClips = []
  for (const cam of cameras) {
    for (const clip of cam.clips) {
      const meta = clipMeta[clip.id] || {}
      if (onlySelected && !meta.selected) continue
      allClips.push({ ...clip, camera: cam.camera, meta })
    }
  }

  const sorted = getClipsSortedByScene(allClips, clipMeta, sceneOrder, false)

  for (const clip of sorted) {
    const meta = clip.meta || clipMeta[clip.id] || {}
    const durFrames = clip.dur || Math.round(clip.durationSec * fps)
    const sceneLabel = meta.sceneId ? (scenes?.[meta.sceneId]?.sceneNumber || meta.sceneId) : ''

    ale += [
      clip.filename,
      clip.camera,
      framesToTC(0, fps),
      framesToTC(durFrames, fps),
      clip.durationDisplay,
      sceneLabel,
      clip.camera,
      meta.rating || '',
      meta.selected ? 'YES' : '',
      (meta.notes || '').replace(/\t/g, ' '),
      clip.resolution,
      clip.videoType,
    ].join('\t') + '\n'
  }

  return ale
}

// ── Helpers ──────────────────────────────────────────────────────

const RATING_MAP = { ok: 'BOM', nok: 'NOK', maybe: 'MAYBE', selected: 'SELECTED' }

function escapeXml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function framesToTC(frames, fps) {
  const totalSec = Math.floor(frames / fps)
  const f = frames % fps
  const s = totalSec % 60
  const m = Math.floor(totalSec / 60) % 60
  const h = Math.floor(totalSec / 3600)
  return [h, m, s, f].map(v => String(v).padStart(2, '0')).join(':')
}

function getClipsSortedByScene(clips, clipMeta, sceneOrder, onlySelected) {
  // Build scene order map
  const sceneIdx = new Map()
  ;(sceneOrder || []).forEach((id, i) => sceneIdx.set(id, i))

  return [...clips]
    .filter(c => !onlySelected || clipMeta[c.id]?.selected)
    .sort((a, b) => {
      const metaA = clipMeta[a.id] || {}
      const metaB = clipMeta[b.id] || {}
      const idxA = metaA.sceneId ? (sceneIdx.get(metaA.sceneId) ?? 9999) : 9999
      const idxB = metaB.sceneId ? (sceneIdx.get(metaB.sceneId) ?? 9999) : 9999
      if (idxA !== idxB) return idxA - idxB
      // Same scene → sort by filename (chronological)
      return (a.filename || '').localeCompare(b.filename || '')
    })
}
