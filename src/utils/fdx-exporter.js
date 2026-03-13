// FDX Exporter — generates valid Final Draft XML from parsed script data

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function escapeXml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function exportToFdx(parsedResult, options = {}) {
  const scenes = parsedResult?.scenes || []
  const lines = []

  lines.push('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>')
  lines.push('<FinalDraft DocumentType="Script" Template="No" Version="6">')
  lines.push('  <Content>')

  for (const scene of scenes) {
    const headingId = generateUUID()
    const intExt = scene.intExt || 'INT'
    const location = scene.location || ''
    const time = scene.timeOfDay || 'DIA'
    const headingText = `${intExt}. ${location} - ${time}`

    // Scene Heading
    lines.push(`    <Paragraph Type="Scene Heading" id="${headingId}">`)

    // SceneProperties with arc beats
    const arcBeats = scene.arcBeats || {}
    const hasArcBeats = Object.keys(arcBeats).length > 0
    lines.push(`      <SceneProperties Length="" Page="" Title="">`)
    if (hasArcBeats) {
      lines.push(`        <SceneArcBeats>`)
      for (const [charName, note] of Object.entries(arcBeats)) {
        const beatId = generateUUID()
        lines.push(`          <CharacterArcBeat Name="${escapeXml(charName)}">`)
        lines.push(`            <Paragraph Type="Action" id="${beatId}">`)
        lines.push(`              <Text>${escapeXml(note)}</Text>`)
        lines.push(`            </Paragraph>`)
        lines.push(`          </CharacterArcBeat>`)
      }
      lines.push(`        </SceneArcBeats>`)
    }
    lines.push(`      </SceneProperties>`)
    lines.push(`      <Text>${escapeXml(headingText)}</Text>`)
    lines.push(`    </Paragraph>`)

    // Production Notes (as Action with NOTA: prefix)
    if (scene.productionNotes?.length > 0) {
      for (const note of scene.productionNotes) {
        const noteId = generateUUID()
        lines.push(`    <Paragraph Type="Action" id="${noteId}">`)
        lines.push(`      <Text>${escapeXml(note)}</Text>`)
        lines.push(`    </Paragraph>`)
      }
    }

    // Action paragraphs
    if (scene.action?.length > 0) {
      for (const actionText of scene.action) {
        const actionId = generateUUID()
        lines.push(`    <Paragraph Type="Action" id="${actionId}">`)
        lines.push(`      <Text>${escapeXml(actionText)}</Text>`)
        lines.push(`    </Paragraph>`)
      }
    }

    // Dialogue blocks (Character + optional Parenthetical + Dialogue)
    if (scene.dialogue?.length > 0) {
      for (const d of scene.dialogue) {
        const charId = generateUUID()
        lines.push(`    <Paragraph Type="Character" id="${charId}">`)
        lines.push(`      <Text>${escapeXml(d.character)}</Text>`)
        lines.push(`    </Paragraph>`)

        if (d.parenthetical) {
          const parenId = generateUUID()
          lines.push(`    <Paragraph Type="Parenthetical" id="${parenId}">`)
          lines.push(`      <Text>${escapeXml(d.parenthetical)}</Text>`)
          lines.push(`    </Paragraph>`)
        }

        const dialogueId = generateUUID()
        lines.push(`    <Paragraph Type="Dialogue" id="${dialogueId}">`)
        lines.push(`      <Text>${escapeXml(d.text)}</Text>`)
        lines.push(`    </Paragraph>`)
      }
    }
  }

  lines.push('  </Content>')
  lines.push('</FinalDraft>')

  return lines.join('\n')
}
