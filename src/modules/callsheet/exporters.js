// ── Export Editorial — EDL, XML (FCPXML), ALE (Avid) ──────────────
// Gera ficheiros de edição a partir dos takes registados no Live Board
// O editor importa e tem um assembly cut com os good takes na ordem do guião

// ── FCPXML (Premiere Pro / DaVinci Resolve) ──────────────────────
export function generateFCPXML(projectName, takes) {
  const resources = takes.map((t, i) => `
      <asset id="r${i + 1}" name="${t.filename || `Sc${t.scene}_T${t.take}`}" src="file:///${t.filename || ''}" hasVideo="1" hasAudio="1" />`).join('')

  let offset = 0
  const clips = takes.map((t, i) => {
    const dur = t.duration || 30 // duração estimada em segundos se não tiver
    const clip = `
          <clip name="Sc.${t.scene} T${t.take}" ref="r${i + 1}" offset="${offset * 25}/25s" duration="${dur * 25}/25s">
            <note>${escapeXml(t.note || '')}</note>
          </clip>`
    offset += dur
    return clip
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>${resources}
  </resources>
  <library>
    <event name="${escapeXml(projectName)} — Assembly Cut">
      <project name="Good Takes — Scene Order">
        <sequence format="r0">
          <spine>${clips}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`
}

// ── EDL CMX3600 ──────────────────────────────────────────────────
export function generateEDL(projectName, takes) {
  const lines = [
    `TITLE: ${projectName} — Assembly Cut`,
    `FCM: NON-DROP FRAME`,
    '',
  ]

  let eventNum = 1
  let tcPos = [1, 0, 0, 0] // HH:MM:SS:FF running position

  takes.forEach(t => {
    const dur = t.duration || 30
    const durFrames = dur * 25

    const tcIn = formatTC(tcPos)
    const tcOut = formatTC(addFrames(tcPos, durFrames))

    const srcIn = '00:00:00:00'
    const srcOut = framesToTC(durFrames)

    lines.push(
      `${String(eventNum).padStart(3, '0')}  ${(t.filename || 'AX').padEnd(8)} V     C        ${srcIn} ${srcOut} ${tcIn} ${tcOut}`,
      `* Sc.${t.scene} Take ${t.take}${t.note ? ' — ' + t.note : ''}`,
      `* FROM CLIP NAME: ${t.filename || `Sc${t.scene}_T${t.take}`}`,
      '',
    )

    tcPos = addFrames(tcPos, durFrames)
    eventNum++
  })

  return lines.join('\n')
}

// ── ALE (Avid Log Exchange) ──────────────────────────────────────
export function generateALE(projectName, takes) {
  const lines = [
    'Heading',
    `FIELD_DELIM\tTABS`,
    `VIDEO_FORMAT\t1080`,
    `FPS\t25`,
    '',
    'Column',
    'Name\tScene\tTake\tStatus\tLens\tISO\tAperture\tFPS\tResolution\tNotes\tFilename',
    '',
    'Data',
  ]

  takes.forEach(t => {
    lines.push([
      `Sc${t.scene}_T${t.take}`,
      t.scene,
      t.take,
      t.status || 'ok',
      t.lens || '',
      t.iso || '',
      t.aperture || '',
      t.fps || 25,
      t.resolution || '4K',
      (t.note || '').replace(/\t/g, ' '),
      t.filename || '',
    ].join('\t'))
  })

  return lines.join('\n')
}

// ── Camera Report PDF (text-based, downloadable) ─────────────────
export function generateCameraReportText(report, projectName, date) {
  const lines = [
    `═══════════════════════════════════════════════════`,
    `  CAMERA REPORT`,
    `  ${projectName}  |  ${date}`,
    `═══════════════════════════════════════════════════`,
    `  Câmara: ${report.cameraId} — ${report.camera}`,
    `  Cartão: #${report.cardNumber} (${report.storageMedia || 'N/A'})`,
    `  Backup: ${report.backupStatus === 'backed_up' ? '✓ Confirmado' : '⚠ Pendente'} ${report.backupDestination ? '→ ' + report.backupDestination : ''}`,
    `───────────────────────────────────────────────────`,
    '',
  ]

  report.clips?.forEach((clip, i) => {
    const statusIcon = clip.status === 'ok' ? '✓' : clip.status === 'nok' ? '✗' : '?'
    lines.push(
      `  ${statusIcon} Sc.${clip.scene} Take ${clip.take}  |  ${clip.lens || '—'}  ${clip.iso ? 'ISO' + clip.iso : ''}  ${clip.aperture || ''}`,
      `    ${clip.filename || '(sem filename)'}  |  ${clip.fps || 25}fps ${clip.resolution || '4K'} ${clip.format || ''}`,
      clip.note ? `    Nota: ${clip.note}` : '',
      '',
    )
  })

  lines.push(`═══════════════════════════════════════════════════`)
  return lines.filter(l => l !== undefined).join('\n')
}

// ── Download helper ──────────────────────────────────────────────
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── TC Helpers ───────────────────────────────────────────────────
function formatTC([h, m, s, f]) {
  return [h, m, s, f].map(v => String(v).padStart(2, '0')).join(':')
}

function addFrames([h, m, s, f], frames) {
  let totalFrames = h * 90000 + m * 1500 + s * 25 + f + frames
  const newF = totalFrames % 25
  totalFrames = Math.floor(totalFrames / 25)
  const newS = totalFrames % 60
  totalFrames = Math.floor(totalFrames / 60)
  const newM = totalFrames % 60
  const newH = Math.floor(totalFrames / 60)
  return [newH, newM, newS, newF]
}

function framesToTC(frames) {
  return formatTC(addFrames([0, 0, 0, 0], frames))
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
