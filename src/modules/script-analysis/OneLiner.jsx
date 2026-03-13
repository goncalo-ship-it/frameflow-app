// One-Liner — compact one-line-per-scene table for 1st AD
// Sortable, color-coded INT/EXT, export CSV

import { useState, useMemo, useCallback } from 'react'
import { ArrowUpDown, Download, FileText } from 'lucide-react'

export function OneLiner({ scenes }) {
  const [sortBy, setSortBy] = useState('scene')  // scene | location | duration
  const [sortDir, setSortDir] = useState('asc')

  const allScenes = useMemo(() => scenes || [], [scenes])

  const sorted = useMemo(() => {
    const arr = [...allScenes]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      if (sortBy === 'scene') return dir * (parseInt(a.sceneNumber) - parseInt(b.sceneNumber))
      if (sortBy === 'location') return dir * (a.location || '').localeCompare(b.location || '')
      if (sortBy === 'duration') return dir * ((a.durationMin || 0) - (b.durationMin || 0))
      return 0
    })
    return arr
  }, [allScenes, sortBy, sortDir])

  const toggleSort = useCallback((field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('asc') }
  }, [sortBy])

  // Summary
  const summary = useMemo(() => {
    let totalEighths = 0
    let totalDuration = 0
    let intCount = 0, extCount = 0
    allScenes.forEach(sc => {
      totalDuration += sc.durationMin || 0
      if (sc.intExt === 'INT') intCount++
      else if (sc.intExt === 'EXT') extCount++
      else { intCount++; extCount++ }
      // Parse pageLength to eighths
      if (sc.pageLength) {
        const parts = String(sc.pageLength).trim().split(/\s+/)
        for (const p of parts) {
          if (p.includes('/')) {
            const [n, d] = p.split('/')
            totalEighths += Math.round((parseInt(n) / parseInt(d)) * 8)
          } else totalEighths += parseInt(p) * 8
        }
      }
    })
    const whole = Math.floor(totalEighths / 8)
    const frac = totalEighths % 8
    const pagesStr = whole && frac ? `${whole} ${frac}/8` : whole ? `${whole}` : frac ? `${frac}/8` : '—'
    return { totalScenes: allScenes.length, totalPages: pagesStr, totalDuration, intCount, extCount }
  }, [allScenes])

  // Export CSV
  const exportCSV = useCallback(() => {
    const header = 'Cena;INT/EXT;Local;Período;Páginas;Elenco;Duração;Tags'
    const rows = sorted.map(sc => [
      sc.id,
      sc.intExt,
      `"${(sc.location || '').replace(/"/g, '""')}"`,
      sc.timeOfDay || '',
      sc.pageLength || '',
      `"${(sc.characters || []).join(', ')}"`,
      `~${sc.durationMin || 0}s`,
      `"${(sc.autoTags || []).join(', ')}"`,
    ].join(';'))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'one-liner.csv'; a.click()
    URL.revokeObjectURL(url)
  }, [sorted])

  if (!allScenes.length) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <FileText size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
        <p>Importa um guião para ver o one-liner.</p>
      </div>
    )
  }

  const SortHeader = ({ field, label, style: st }) => (
    <th onClick={() => toggleSort(field)} style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', ...st }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {label}
        {sortBy === field && <ArrowUpDown size={10} style={{ opacity: 0.6 }} />}
      </span>
    </th>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {summary.totalScenes} cenas · {summary.totalPages} págs · ~{Math.round(summary.totalDuration / 60)}min · INT:{summary.intCount} EXT:{summary.extCount}
        </span>
        <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <Download size={12} /> CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
          <thead>
            <tr>
              <SortHeader field="scene" label="Cena" style={{ minWidth: 56 }} />
              <th style={thStyle}>I/E</th>
              <SortHeader field="location" label="Local" style={{ minWidth: 120 }} />
              <th style={thStyle}>Período</th>
              <th style={thStyle}>Págs</th>
              <th style={{ ...thStyle, minWidth: 140 }}>Elenco</th>
              <SortHeader field="duration" label="Dur." />
              <th style={thStyle}>Tags</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(sc => {
              const isExt = sc.intExt === 'EXT'
              const rowBg = isExt ? '#22c55e06' : 'transparent'
              return (
                <tr key={sc.id} style={{ background: rowBg }}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--text-primary)' }}>{sc.id}</td>
                  <td style={{ ...tdStyle }}>
                    <span style={{
                      padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700,
                      background: isExt ? '#22c55e20' : '#3b82f620',
                      color: isExt ? '#4ade80' : '#60a5fa',
                    }}>{sc.intExt}</span>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sc.location}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{sc.timeOfDay}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', textAlign: 'center' }}>{sc.pageLength || '—'}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(sc.characters || []).join(', ')}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', textAlign: 'right' }}>~{sc.durationMin || 0}s</td>
                  <td style={{ ...tdStyle }}>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {(sc.autoTags || []).slice(0, 3).map(t => (
                        <span key={t} style={{ padding: '0 4px', borderRadius: 3, fontSize: 9, background: '#64748b20', color: '#94a3b8' }}>{t}</span>
                      ))}
                      {(sc.autoTags || []).length > 3 && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{sc.autoTags.length - 3}</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const thStyle = {
  padding: '8px 6px',
  borderBottom: '2px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  fontWeight: 700,
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  textAlign: 'left',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '5px 6px',
  borderBottom: '1px solid var(--border-subtle)',
}
