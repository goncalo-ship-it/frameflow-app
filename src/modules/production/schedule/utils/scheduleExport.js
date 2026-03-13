// FRAME — Schedule Export (PDF via print + CSV download)
// Gera folha de serviço e tabela completa para exportação

// ── Helpers ───────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-PT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return dateStr }
}

function escapeCSV(val) {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

// ── Export CSV (tabela completa de cenas) ──────────────────────────
export function exportScheduleCSV(engineResult) {
  const { days = [], allScenes = [], assignments = {}, meta = {} } = engineResult

  const headers = [
    'Dia', 'Data', 'Episódio', 'Cena', 'Tipo', 'INT/EXT',
    'Local', 'Duração (min)', 'Personagens', 'Modificadores',
  ]

  const rows = allScenes.map(scene => {
    const dayId = assignments[scene.sceneKey]
    const day = days.find(d => d.id === dayId)
    return [
      day ? `D${day.dayNumber}` : 'SEM DIA',
      day?.date || '',
      scene.epId || '',
      scene.sceneNumber || '',
      scene.sceneType || '',
      scene.intExt || '',
      scene.location || '',
      scene.duration || '',
      (scene.characters || []).join('; '),
      (scene.durationMods || []).map(m => m.label).join('; '),
    ]
  })

  // Ordenar por dia, depois cena
  rows.sort((a, b) => {
    const dayA = a[0] === 'SEM DIA' ? 999 : parseInt(a[0].replace('D', ''))
    const dayB = b[0] === 'SEM DIA' ? 999 : parseInt(b[0].replace('D', ''))
    if (dayA !== dayB) return dayA - dayB
    return (parseInt(a[3]) || 0) - (parseInt(b[3]) || 0)
  })

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
    '',
    `Total cenas,${meta.totalScenes}`,
    `Cenas atribuídas,${meta.assignedScenes}`,
    `Cenas sem dia,${meta.unassignedScenes}`,
    `Total horas estimadas,${meta.totalHours}h`,
    `Utilização média,${meta.utilizacao_media}%`,
  ].join('\n')

  downloadFile(csv, `schedule_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
}

// ── Export folha de serviço por dia (HTML → print) ────────────────
export function exportCallSheet(day, engineResult) {
  const { meta = {} } = engineResult

  const scenes = day.scenes || []
  const blocos = day.blocos || []

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<title>Folha de Serviço — ${day.label || 'Dia'}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 20px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 13px; color: #666; margin-bottom: 16px; }
  .meta { display: flex; gap: 24px; margin-bottom: 16px; padding: 8px 12px; background: #f5f5f5; border-radius: 4px; }
  .meta-item { display: flex; flex-direction: column; }
  .meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; }
  .meta-value { font-size: 14px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #2E6FA0; color: white; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
  td { padding: 6px 8px; border-bottom: 1px solid #e0e0e0; font-size: 11px; }
  tr:nth-child(even) { background: #fafafa; }
  .type-badge { display: inline-block; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: 700; }
  .ext { color: #F5A623; font-weight: 700; }
  .int { color: #888; }
  .section { margin-top: 16px; }
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #2E6FA0; border-bottom: 2px solid #2E6FA0; padding-bottom: 4px; margin-bottom: 8px; }
  .chars-list { display: flex; flex-wrap: wrap; gap: 4px; }
  .char-chip { padding: 2px 8px; background: #e8f5e9; border-radius: 10px; font-size: 10px; font-weight: 600; }
  .locations-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .loc-item { display: flex; align-items: center; gap: 4px; }
  .loc-dot { width: 8px; height: 8px; border-radius: 50%; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 9px; color: #888; display: flex; justify-content: space-between; }
  @media print { body { padding: 10px; } .no-print { display: none; } }
</style>
</head>
<body>
  <h1>FOLHA DE SERVIÇO — ${(day.label || '').toUpperCase()}</h1>
  <h2>${formatDate(day.date)}</h2>

  <div class="meta">
    <div class="meta-item">
      <span class="meta-label">Call Time</span>
      <span class="meta-value">${day.callTime || '08:00'}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Wrap Estimado</span>
      <span class="meta-value">${day.wrapTime || '—'}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Cenas</span>
      <span class="meta-value">${scenes.length}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Total Minutos</span>
      <span class="meta-value">${day.totalMin || 0}m</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Utilização</span>
      <span class="meta-value">${day.utilization || 0}%</span>
    </div>
  </div>

  <!-- Locais -->
  <div class="section">
    <div class="section-title">Locais</div>
    <div class="locations-list">
      ${(day.locations || []).map(loc =>
        `<div class="loc-item"><div class="loc-dot" style="background:${loc.color}"></div>${loc.name}</div>`
      ).join('')}
    </div>
  </div>

  <!-- Elenco do dia -->
  <div class="section">
    <div class="section-title">Elenco</div>
    <div class="chars-list">
      ${(day.characters || []).map(c => `<span class="char-chip">${c}</span>`).join('')}
    </div>
  </div>

  <!-- Blocos horários -->
  ${blocos.length > 0 ? `
  <div class="section">
    <div class="section-title">Plano Horário</div>
    <table>
      <thead>
        <tr><th>Hora</th><th>Local</th><th>Cenas</th><th>Duração</th><th>Move</th></tr>
      </thead>
      <tbody>
        ${blocos.map(b => b.tipo === 'almoco' ? `
          <tr style="background:#f0f0f0;font-style:italic;">
            <td><strong>${b.hora_inicio} — ${b.hora_fim}</strong></td>
            <td colspan="4" style="text-align:center;color:#666;">🍽 ALMOÇO (${b.duracao}min)</td>
          </tr>
        ` : `
          <tr>
            <td><strong>${b.hora_inicio} — ${b.hora_fim}</strong></td>
            <td>${b.location}</td>
            <td>${b.num_cenas} cenas (${b.episodios?.join(', ') || ''})</td>
            <td>${b.duracao}m</td>
            <td>${b.move_antes > 0 ? b.move_antes + 'm' : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- Cenas detalhadas -->
  <div class="section">
    <div class="section-title">Cenas</div>
    <table>
      <thead>
        <tr><th>#</th><th>Ep</th><th>Cena</th><th>Tipo</th><th>I/E</th><th>Local</th><th>Dur.</th><th>Personagens</th></tr>
      </thead>
      <tbody>
        ${scenes.map((sc, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${sc.epId || ''}</td>
            <td><strong>#${sc.sceneNumber || ''}</strong></td>
            <td><span class="type-badge">${sc.sceneType || ''}</span></td>
            <td><span class="${(sc.intExt || '') === 'EXT' ? 'ext' : 'int'}">${sc.intExt || ''}</span></td>
            <td>${sc.location || '—'}</td>
            <td>${sc.duration || '—'}m</td>
            <td>${(sc.characters || []).join(', ')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${day.notes ? `
  <div class="section">
    <div class="section-title">Notas</div>
    <p>${day.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <span>FRAME — Plano de Rodagem</span>
    <span>Gerado: ${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
  </div>

  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

// ── Download helper ───────────────────────────────────────────────
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
