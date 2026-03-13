// sonyMediaParser.js — Extrai clips de ZIPs de câmara Sony (FX6, FX3, Venice, etc.)
// Lê MEDIAPRO.XML + thumbnails JPG de cada ZIP

import JSZip from 'jszip'

/**
 * Parseia um ZIP de câmara Sony e extrai clips com thumbnails.
 * @param {File} zipFile — ficheiro .zip
 * @param {string} [cameraLabel] — label da câmara (ex: "CAM A"), auto-detecta se vazio
 * @returns {Promise<{ camera: string, clips: Array<ClipInfo> }>}
 *
 * ClipInfo: { id, uri, filename, dur, fps, resolution, videoType, audioType,
 *             umid, thumbnailUrl, thumbnailBlob, createdAt }
 */
export async function parseSonyCameraZip(zipFile, cameraLabel) {
  const zip = await JSZip.loadAsync(zipFile)

  // Encontrar MEDIAPRO.XML (pode estar em subpasta ex: CAM2/MEDIAPRO.XML)
  let mediaproEntry = null
  let basePath = ''
  zip.forEach((path, entry) => {
    if (!entry.dir && path.toUpperCase().endsWith('MEDIAPRO.XML')) {
      mediaproEntry = entry
      basePath = path.replace(/MEDIAPRO\.XML$/i, '')
    }
  })

  if (!mediaproEntry) {
    throw new Error('MEDIAPRO.XML não encontrado no ZIP. É uma estrutura de câmara Sony?')
  }

  // Parse XML
  const xmlText = await mediaproEntry.async('text')
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'application/xml')

  // Auto-detect camera label from folder name or system info
  if (!cameraLabel) {
    // Try folder name (e.g. "CAM2/" → "CAM 2")
    const folderMatch = basePath.match(/CAM\s*(\w+)/i)
    if (folderMatch) {
      cameraLabel = `CAM ${folderMatch[1].toUpperCase()}`
    } else {
      // Try system info
      const system = doc.querySelector('System')
      const systemId = system?.getAttribute('systemId') || ''
      const systemKind = system?.getAttribute('systemKind') || ''
      cameraLabel = systemKind ? systemKind.split(' ')[0] : `CAM-${systemId.slice(-4)}`
    }
  }

  // Extract system metadata
  const systemEl = doc.querySelector('System')
  const cameraModel = systemEl?.getAttribute('systemKind')?.replace(/\s*ver\.\d+\.\d+/, '') || 'Sony'

  // Parse clips
  const materials = doc.querySelectorAll('Material')
  const clips = []

  for (const mat of materials) {
    const uri = mat.getAttribute('uri') || ''
    const dur = parseInt(mat.getAttribute('dur') || '0', 10)
    const fps = mat.getAttribute('fps') || '25p'
    const fpsNum = parseInt(fps, 10) || 25
    const aspectRatio = mat.getAttribute('aspectRatio') || '16:9'
    const videoType = mat.getAttribute('videoType') || ''
    const audioType = mat.getAttribute('audioType') || ''
    const umid = mat.getAttribute('umid') || ''
    const channels = parseInt(mat.getAttribute('ch') || '0', 10)

    // Extract filename from uri (e.g. "./Clip/A027R001_251203IM.MXF" → "A027R001_251203IM")
    const filename = uri.split('/').pop()?.replace(/\.\w+$/, '') || ''

    // Calculate duration in seconds
    const durationSec = dur / fpsNum

    // Resolution from videoType (e.g. "AVC_3840_2160_H422IP@L51" → "3840x2160")
    const resMatch = videoType.match(/(\d{3,4})_(\d{3,4})/)
    const resolution = resMatch ? `${resMatch[1]}x${resMatch[2]}` : ''

    // Find thumbnail
    const thumbRef = mat.querySelector('RelevantInfo[type="JPG"]')
    const thumbUri = thumbRef?.getAttribute('uri') || ''
    let thumbnailUrl = null

    if (thumbUri) {
      // Resolve path relative to basePath
      const thumbPath = basePath + thumbUri.replace(/^\.\//, '')
      const thumbEntry = zip.file(thumbPath)
      if (thumbEntry) {
        const ab = await thumbEntry.async('arraybuffer')
        const bytes = new Uint8Array(ab)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
        thumbnailUrl = 'data:image/jpeg;base64,' + btoa(binary)
      }
    }

    // Try to extract date from filename or UMID
    // Filename pattern: A027R001_251203IM → 251203 → 2025-12-03
    const dateMatch = filename.match(/_(\d{2})(\d{2})(\d{2})/)
    let createdAt = null
    if (dateMatch) {
      const [, yy, mm, dd] = dateMatch
      createdAt = `20${yy}-${mm}-${dd}`
    }

    clips.push({
      id: `${cameraLabel.replace(/\s+/g, '_')}_${filename}`,
      uri,
      filename,
      dur,
      fps: fpsNum,
      fpsLabel: fps,
      durationSec: Math.round(durationSec * 100) / 100,
      durationDisplay: formatDuration(durationSec),
      resolution,
      aspectRatio,
      videoType,
      audioType,
      channels,
      umid,
      thumbnailUrl,
      createdAt,
    })
  }

  // Sort by filename (which is chronological for Sony cameras)
  clips.sort((a, b) => a.filename.localeCompare(b.filename))

  return {
    camera: cameraLabel,
    cameraModel,
    clipCount: clips.length,
    totalDuration: clips.reduce((sum, c) => sum + c.durationSec, 0),
    clips,
  }
}

/**
 * Parseia múltiplos ZIPs de câmaras.
 * @param {File[]} zipFiles
 * @returns {Promise<Array<CameraData>>}
 */
export async function parseMultipleCameras(zipFiles) {
  const results = []
  for (const file of zipFiles) {
    try {
      const data = await parseSonyCameraZip(file)
      results.push(data)
    } catch (err) {
      console.warn(`[sonyMediaParser] Erro ao processar ${file.name}:`, err.message)
      results.push({
        camera: file.name.replace(/\.zip$/i, ''),
        cameraModel: '?',
        clipCount: 0,
        totalDuration: 0,
        clips: [],
        error: err.message,
      })
    }
  }
  return results
}

function formatDuration(sec) {
  if (!sec || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Limpa thumbnails (no-op for base64 data URLs, kept for API compatibility).
 */
export function cleanupThumbnails(cameras) {
  // Base64 data URLs don't need cleanup (no blob URLs to revoke)
}
