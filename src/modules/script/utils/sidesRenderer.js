// FRAME — Sides Renderer
// Gera HTML formatado de sides com marca de água e código de rastreio
// Formato guião profissional (Courier, margens tradicionais)

/**
 * Renderiza HTML de sides para actor (Tipo A/B/C)
 */
export function renderSidesActorHTML(side, { projectName = 'FRAME' } = {}) {
  const { content, titulo, codigo_rastreio, destinatario_nome, versao_guiao } = side
  const isDay = side.tipo === 'actor-dia'
  const scenes = isDay ? content.scenes : (Array.isArray(content) && content[0]?.cenas ? content.flatMap(ep => ep.cenas) : content)

  const watermark = destinatario_nome || 'CONFIDENCIAL'
  const footerDate = new Date(side.gerado_em).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
  @page { margin: 1in 1.2in; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
    background: #fff;
    position: relative;
  }
  /* Watermark */
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 72pt;
    color: rgba(0,0,0,0.04);
    font-weight: 900;
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
    letter-spacing: 0.1em;
  }
  .content { position: relative; z-index: 1; }

  /* Cover page */
  .cover {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 90vh;
    text-align: center;
    page-break-after: always;
  }
  .cover-title { font-size: 24pt; font-weight: 700; margin-bottom: 20pt; text-transform: uppercase; }
  .cover-sub { font-size: 14pt; color: #666; margin-bottom: 8pt; }
  .cover-conf { font-size: 10pt; color: #999; margin-top: 30pt; letter-spacing: 0.15em; text-transform: uppercase; }
  .cover-code { font-size: 9pt; color: #aaa; margin-top: 6pt; font-family: monospace; }

  /* Day header (Tipo B) */
  .day-header {
    border: 2px solid #000;
    padding: 12pt;
    margin-bottom: 20pt;
    text-align: center;
  }
  .day-header h2 { font-size: 16pt; margin-bottom: 4pt; }
  .day-header .meta { font-size: 10pt; color: #555; }

  /* Scene */
  .scene { margin-bottom: 24pt; page-break-inside: avoid; }
  .scene-sep {
    text-align: center;
    font-size: 10pt;
    color: #888;
    padding: 8pt 0;
    border-top: 1px solid #ddd;
    margin-top: 16pt;
    page-break-before: auto;
  }
  .heading {
    font-weight: 700;
    text-transform: uppercase;
    text-decoration: underline;
    margin-bottom: 12pt;
    font-size: 12pt;
  }
  .action { margin: 6pt 0; }
  .dialogue-block { margin: 8pt 0; padding-left: 1.5in; }
  .char-name {
    text-transform: uppercase;
    font-weight: 700;
    padding-left: 1in;
  }
  .char-name.highlight {
    background: rgba(224,123,57,0.12);
    padding: 1pt 6pt;
    border-radius: 2pt;
  }
  .parenthetical {
    padding-left: 0.8in;
    font-style: italic;
    color: #555;
  }
  .dialogue-text { max-width: 3.5in; }
  .dialogue-text.highlight {
    font-weight: 700;
  }
  .dialogue-text.faded { color: #777; }

  /* Emotional state */
  .emotional-state {
    margin: 6pt 0;
    padding: 4pt 8pt;
    background: #f5f5f5;
    border-left: 3px solid #E07B39;
    font-size: 10pt;
    color: #555;
    font-style: italic;
  }

  /* Costura alert */
  .costura-alert {
    margin: 6pt 0;
    padding: 4pt 8pt;
    background: #fff5f5;
    border-left: 3px solid #e53e3e;
    font-size: 10pt;
    color: #c53030;
  }

  /* Footer */
  .page-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 8pt;
    color: #aaa;
    padding: 6pt;
    border-top: 1px solid #eee;
  }

  @media print {
    .page-footer { position: fixed; }
    .watermark { position: fixed; }
  }
</style>
</head>
<body>
<div class="watermark">${watermark}</div>
<div class="content">

<!-- Cover -->
<div class="cover">
  <div class="cover-title">${projectName}</div>
  <div class="cover-sub">${titulo}</div>
  ${isDay && content.day ? `
    <div class="cover-sub">Dia ${content.day.dayNumber} · ${content.day.date ? new Date(content.day.date + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}</div>
    <div class="cover-sub">Call Time: ${content.day.callTime}</div>
  ` : ''}
  <div class="cover-conf">CONFIDENCIAL</div>
  <div class="cover-code">${codigo_rastreio} · ${versao_guiao} · ${footerDate}</div>
</div>

${isDay && content.day ? `
<div class="day-header">
  <h2>DIA ${content.day.dayNumber}</h2>
  <div class="meta">
    ${content.day.date ? new Date(content.day.date + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
    · Call: ${content.day.callTime}
    · ${(scenes || []).length} cena(s)
  </div>
</div>
` : ''}

${(scenes || []).map((scene, i) => `
  ${i > 0 ? `<div class="scene-sep">CENA ${scene.sceneNumber || scene.sceneKey} · DIA ${scene.dia_rodagem || '—'}</div>` : ''}
  <div class="scene">
    <div class="heading">${scene.cabecalho}</div>

    ${scene.estadoEmocional ? `<div class="emotional-state">Estado: ${scene.estadoEmocional}</div>` : ''}

    ${scene.costura ? `
      <div class="costura-alert">
        ✂ COSTURA — ${scene.costura.intervalo_dias} dia(s) de intervalo com ${scene.costura.cena_ligada || '—'}
        ${scene.costura.checklist?.length ? '<br>Verificar: ' + scene.costura.checklist.map(c => c.categoria).join(', ') : ''}
      </div>
    ` : ''}

    ${isDay && scene.hora_prevista ? `<div style="font-size:10pt;color:#888;margin-bottom:6pt;">⏰ ${scene.hora_prevista} · ${scene.location}</div>` : ''}

    ${(scene.acao || []).map(a => `<div class="action">${escapeHtml(a)}</div>`).join('')}

    ${(scene.dialogos || []).map(d => `
      <div class="dialogue-block">
        <div class="char-name ${d.isActor ? 'highlight' : ''}">${escapeHtml(d.personagem)}</div>
        ${d.didascalia ? `<div class="parenthetical">(${escapeHtml(d.didascalia)})</div>` : ''}
        <div class="dialogue-text ${d.isActor ? 'highlight' : 'faded'}">${escapeHtml(d.texto)}</div>
      </div>
    `).join('')}
  </div>
`).join('')}

</div>
<div class="page-footer">${codigo_rastreio} · ${versao_guiao} · ${footerDate} · ${projectName}</div>
</body>
</html>`
}

/**
 * Renderiza HTML de sides do realizador (Tipo D)
 */
export function renderSidesRealizadorHTML(side, { projectName = 'FRAME' } = {}) {
  const { content, titulo, codigo_rastreio, versao_guiao } = side
  const footerDate = new Date(side.gerado_em).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
  @page { margin: 0.8in 1in; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 12pt; line-height: 1.5; color: #000; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72pt; color: rgba(0,0,0,0.03); font-weight: 900; white-space: nowrap; pointer-events: none; }
  .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; text-align: center; page-break-after: always; }
  .cover-title { font-size: 24pt; font-weight: 700; text-transform: uppercase; margin-bottom: 20pt; }
  .cover-sub { font-size: 14pt; color: #666; margin-bottom: 8pt; }
  .scene { margin-bottom: 20pt; page-break-inside: avoid; border-bottom: 1px solid #eee; padding-bottom: 12pt; }
  .heading { font-weight: 700; text-transform: uppercase; text-decoration: underline; margin-bottom: 8pt; }
  .scene-meta { display: flex; gap: 16pt; font-size: 9pt; color: #888; margin-bottom: 8pt; flex-wrap: wrap; }
  .scene-meta span { white-space: nowrap; }
  .action { margin: 4pt 0; }
  .dialogue-block { margin: 6pt 0; padding-left: 1.5in; }
  .char-name { text-transform: uppercase; font-weight: 700; padding-left: 1in; }
  .dialogue-text { max-width: 3.5in; }
  .parenthetical { padding-left: 0.8in; font-style: italic; color: #555; }
  .director-notes { margin: 8pt 0; padding: 6pt 8pt; background: #fffbeb; border-left: 3px solid #F59E0B; font-size: 10pt; }
  .director-notes strong { color: #B45309; }
  .intent { margin: 4pt 0; padding: 4pt 8pt; background: #f0f9ff; border-left: 3px solid #3B82F6; font-size: 10pt; color: #1e40af; font-style: italic; }
  .costura-alert { margin: 4pt 0; padding: 4pt 8pt; background: #fff5f5; border-left: 3px solid #e53e3e; font-size: 10pt; color: #c53030; }
  .status-badge { display: inline-block; font-size: 9pt; font-weight: 700; padding: 1pt 6pt; border-radius: 3pt; }
  .status-filmada { background: #dcfce7; color: #166534; }
  .status-pick { background: #fef9c3; color: #854d0e; }
  .status-cortada { background: #fee2e2; color: #991b1b; text-decoration: line-through; }
  .page-footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8pt; color: #aaa; padding: 6pt; }
</style>
</head>
<body>
<div class="watermark">REALIZADOR</div>
<div class="cover">
  <div class="cover-title">${projectName}</div>
  <div class="cover-sub">${titulo}</div>
  <div class="cover-sub">${(content || []).length} cenas</div>
  <div style="font-size:10pt;color:#999;margin-top:30pt;">${codigo_rastreio} · ${footerDate}</div>
</div>

${(content || []).map(scene => `
  <div class="scene">
    <div class="heading">${scene.cabecalho}</div>
    <div class="scene-meta">
      <span>${scene.sceneKey}</span>
      <span>DIA ${scene.dia_rodagem || '—'}</span>
      <span>${scene.hora_prevista || '—'}</span>
      ${scene.estado !== 'por_filmar' ? `<span class="status-badge status-${scene.estado === 'filmada' ? 'filmada' : scene.estado === 'pick_pendente' ? 'pick' : 'cortada'}">${scene.estado.toUpperCase()}</span>` : ''}
    </div>

    ${scene.intencao ? `<div class="intent">${escapeHtml(scene.intencao)}</div>` : ''}
    ${scene.costura ? `<div class="costura-alert">✂ COSTURA — ${scene.costura.intervalo_dias} dia(s) de intervalo</div>` : ''}

    ${scene.notas_realizador.length > 0 ? `
      <div class="director-notes">
        <strong>NOTAS:</strong><br>
        ${scene.notas_realizador.map(n => `— ${escapeHtml(n)}`).join('<br>')}
      </div>
    ` : ''}

    ${(scene.acao || []).map(a => `<div class="action">${escapeHtml(a)}</div>`).join('')}
    ${(scene.dialogos || []).map(d => `
      <div class="dialogue-block">
        <div class="char-name">${escapeHtml(d.personagem)}</div>
        ${d.didascalia ? `<div class="parenthetical">(${escapeHtml(d.didascalia)})</div>` : ''}
        <div class="dialogue-text">${escapeHtml(d.texto)}</div>
      </div>
    `).join('')}
  </div>
`).join('')}

<div class="page-footer">${codigo_rastreio} · ${versao_guiao} · ${footerDate}</div>
</body>
</html>`
}

/**
 * Renderiza HTML de sides do script supervisor (Tipo E)
 */
export function renderSidesScriptSupervisorHTML(side, { projectName = 'FRAME' } = {}) {
  const { content, codigo_rastreio, versao_guiao, titulo } = side
  const footerDate = new Date(side.gerado_em).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
  @page { margin: 0.6in; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #000; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60pt; color: rgba(0,0,0,0.03); font-weight: 900; white-space: nowrap; pointer-events: none; }
  .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; text-align: center; page-break-after: always; }
  .cover h1 { font-size: 20pt; margin-bottom: 12pt; }
  .scene { margin-bottom: 16pt; border: 1px solid #ddd; border-radius: 4pt; overflow: hidden; page-break-inside: avoid; }
  .scene-header { background: #f5f5f5; padding: 6pt 10pt; font-weight: 700; font-size: 11pt; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; }
  .scene-body { padding: 8pt 10pt; }
  .scene-body h4 { font-size: 9pt; text-transform: uppercase; color: #888; letter-spacing: 0.1em; margin: 8pt 0 4pt; }
  .scene-body ul { margin-left: 14pt; font-size: 9pt; }
  .scene-body li { margin-bottom: 2pt; }
  .costura-box { background: #fff5f5; border: 1px solid #fecaca; padding: 6pt 8pt; margin-top: 6pt; border-radius: 3pt; }
  .costura-box strong { color: #dc2626; font-size: 9pt; }
  .check-item { display: flex; gap: 6pt; font-size: 9pt; padding: 2pt 0; }
  .check-box { width: 10pt; height: 10pt; border: 1pt solid #000; display: inline-block; flex-shrink: 0; margin-top: 1pt; }
  .notes-area { margin-top: 8pt; border: 1px dashed #ccc; padding: 4pt; min-height: 40pt; font-size: 8pt; color: #aaa; }
  .page-footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 7pt; color: #aaa; padding: 4pt; }
</style>
</head>
<body>
<div class="watermark">SCRIPT SUPERVISOR</div>
<div class="cover">
  <h1>${projectName}</h1>
  <p>${titulo}</p>
  <p style="font-size:9pt;color:#888;margin-top:20pt;">${codigo_rastreio} · ${footerDate}</p>
</div>

${(content || []).map(scene => `
<div class="scene">
  <div class="scene-header">
    <span>${scene.sceneKey} — ${scene.cabecalho}</span>
    <span>DIA ${scene.dia_rodagem || '—'}</span>
  </div>
  <div class="scene-body">
    <h4>Personagens</h4>
    <p>${(scene.characters || []).join(' · ') || '—'}</p>

    ${scene.props?.length ? `<h4>Adereços</h4><ul>${scene.props.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>` : ''}

    ${scene.wardrobe?.length ? `
      <h4>Guarda-Roupa</h4>
      <ul>${scene.wardrobe.map(w => `<li><strong>${escapeHtml(w.character)}</strong>: ${escapeHtml(w.descricao)}</li>`).join('')}</ul>
    ` : ''}

    ${scene.continuidade?.wardrobe || scene.continuidade?.props || scene.continuidade?.makeup ? `
      <h4>Continuidade</h4>
      <ul>
        ${scene.continuidade.wardrobe ? `<li>Guarda-roupa: ${escapeHtml(scene.continuidade.wardrobe)}</li>` : ''}
        ${scene.continuidade.props ? `<li>Adereços: ${escapeHtml(scene.continuidade.props)}</li>` : ''}
        ${scene.continuidade.makeup ? `<li>Maquilhagem: ${escapeHtml(scene.continuidade.makeup)}</li>` : ''}
      </ul>
    ` : ''}

    ${scene.costura ? `
      <div class="costura-box">
        <strong>✂ COSTURA — ${scene.costura.intervalo_dias} dia(s)</strong>
        ${(scene.costura.checklist || []).map(item => `
          <div class="check-item">
            <span class="check-box"></span>
            <span><strong>${item.categoria}</strong>: ${escapeHtml(item.descricao)}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="notes-area">Notas de rodagem:</div>
  </div>
</div>
`).join('')}

<div class="page-footer">${codigo_rastreio} · ${versao_guiao} · ${footerDate}</div>
</body>
</html>`
}

/**
 * Abre o HTML num popup para impressão/PDF
 */
export function openSidesPrintWindow(html) {
  const win = window.open('', '_blank', 'width=800,height=1100')
  if (!win) return false
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 300)
  return true
}

/**
 * Download como ficheiro HTML
 */
export function downloadSidesHTML(html, filename) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'sides.html'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Selecciona o renderer correcto por tipo de side
 */
export function renderSideHTML(side, opts = {}) {
  switch (side.tipo) {
    case 'actor-ep':
    case 'actor-dia':
    case 'actor-completo':
      return renderSidesActorHTML(side, opts)
    case 'realizador':
      return renderSidesRealizadorHTML(side, opts)
    case 'script-supervisor':
      return renderSidesScriptSupervisorHTML(side, opts)
    default:
      return renderSidesActorHTML(side, opts) // fallback
  }
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
