// EpisodeGrid — Episode × Character comparison table
import styles from './Universe.module.css'
import { ARC_MAP, ARC_WEIGHT } from './utils.js'
import { AlertCircle } from 'lucide-react'

// Color intensity based on scene count (purple shades)
function cellColor(scenes, maxScenes) {
  if (!scenes || scenes === 0) return null
  const intensity = Math.max(0.18, Math.min(1, scenes / Math.max(maxScenes, 1)))
  // interpolate from #3D2060 (dim) to #A06AFF (bright)
  const r = Math.round(61  + (160 - 61)  * intensity)
  const g = Math.round(32  + (106 - 32)  * intensity)
  const b = Math.round(96  + (255 - 96)  * intensity)
  return `rgb(${r},${g},${b})`
}

export function EpisodeGrid({ chars, episodeData, episodeIds, alerts, onSelectChar }) {
  if (episodeIds.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span style={{ fontSize: 32 }}>📺</span>
        <p>Sem episódios importados</p>
        <small>Importa guiões FDX na secção Análise de Guião para ver a grelha</small>
      </div>
    )
  }

  // Sort chars by arc weight then name
  const sorted = [...chars].sort((a, b) => {
    const wa = ARC_WEIGHT[a.arcType] ?? 5
    const wb = ARC_WEIGHT[b.arcType] ?? 5
    if (wa !== wb) return wa - wb
    return (a.name || '').localeCompare(b.name || '')
  })

  // Build alert set for quick lookup
  const alertSet = new Set(alerts.map(a => a.char))

  // Also include script-only characters (from episodeData but not in chars)
  const charNames = new Set(chars.map(c => (c.name || '').toUpperCase()))
  const scriptOnlyChars = []
  for (const epChars of Object.values(episodeData)) {
    for (const name of Object.keys(epChars)) {
      if (!charNames.has(name) && !scriptOnlyChars.includes(name)) {
        scriptOnlyChars.push(name)
      }
    }
  }

  // Max scenes in any single cell (for color intensity)
  const allCounts = []
  for (const epChars of Object.values(episodeData)) {
    for (const d of Object.values(epChars)) {
      allCounts.push(d.scenes)
    }
  }
  const maxScenes = Math.max(1, ...allCounts)

  // Summary: per episode — unique chars
  const epCharCount = {}
  for (const epId of episodeIds) {
    epCharCount[epId] = Object.keys(episodeData[epId] || {}).length
  }

  // Per episode total scenes (for summary row)
  const epSceneTotal = {}
  for (const epId of episodeIds) {
    let total = 0
    for (const d of Object.values(episodeData[epId] || {})) {
      total += d.scenes
    }
    epSceneTotal[epId] = total
  }

  const renderRow = (charObj, nameKey, isScriptOnly = false) => {
    const arcInfo = ARC_MAP[charObj?.arcType] || { color: '#7F8C8D', label: '' }
    const hasAlert = alertSet.has(nameKey)
    return (
      <tr
        key={nameKey}
        style={{ cursor: charObj ? 'pointer' : 'default', opacity: isScriptOnly ? 0.6 : 1 }}
        onClick={() => charObj && onSelectChar(charObj)}
        className={styles.gridRow}
      >
        <td className={styles.gridCharName}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: arcInfo.color, flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: isScriptOnly ? 400 : 600, color: 'var(--text-primary)' }}>
              {charObj?.name || nameKey}
            </span>
            {charObj?.arcType && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 6px',
                borderRadius: 20, background: arcInfo.color + '22',
                color: arcInfo.color, flexShrink: 0,
              }}>
                {arcInfo.label}
              </span>
            )}
            {isScriptOnly && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>guião</span>
            )}
            {hasAlert && (
              <span className={styles.gridAlertBadge} title="Personagem nos guiões mas não no Universo">
                <AlertCircle size={11} />
              </span>
            )}
          </div>
        </td>
        {episodeIds.map(epId => {
          const data = (episodeData[epId] || {})[nameKey]
          if (!data || data.scenes === 0) {
            return (
              <td key={epId} className={styles.gridTd}>
                <span className={styles.gridCellEmpty}>—</span>
              </td>
            )
          }
          const color = cellColor(data.scenes, maxScenes)
          return (
            <td key={epId} className={styles.gridTd}>
              <div
                className={styles.gridCell}
                style={{ background: color }}
                title={`${data.scenes} cenas, ${data.lines} falas`}
              >
                {data.scenes}
              </div>
            </td>
          )
        })}
      </tr>
    )
  }

  return (
    <div className={styles.gridWrap}>
      <table className={styles.gridTable}>
        <thead>
          <tr>
            <th className={styles.gridTh} style={{ textAlign: 'left', minWidth: 200 }}>
              Personagem
            </th>
            {episodeIds.map(epId => (
              <th key={epId} className={styles.gridTh}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span>{epId}</span>
                  <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.6 }}>
                    {epCharCount[epId]}p
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(c => renderRow(c, (c.name || '').toUpperCase()))}
          {scriptOnlyChars.sort().map(name => renderRow(null, name, true))}
        </tbody>
        <tfoot>
          <tr className={styles.summaryRow}>
            <td className={styles.gridCharName} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total de cenas
            </td>
            {episodeIds.map(epId => (
              <td key={epId} className={styles.gridTd} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                {epSceneTotal[epId]}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
