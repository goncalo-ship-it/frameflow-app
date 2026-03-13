// Day Out of Days (DOOD) — character × shooting day matrix
// SW = Start Work, W = Work, WF = Work Finish, H = Hold

import { useMemo } from 'react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { CalendarDays, Users } from 'lucide-react'

const STATUS_STYLE = {
  SW: { bg: '#22c55e25', color: '#4ade80', label: 'SW' },
  W:  { bg: '#3b82f625', color: '#60a5fa', label: 'W' },
  WF: { bg: '#ef444425', color: '#f87171', label: 'WF' },
  H:  { bg: '#f59e0b20', color: '#fbbf24', label: 'H' },
}

export function DayOutOfDays() {
  const { parsedScripts, shootingDays, sceneAssignments, team } = useStore(useShallow(s => ({
    parsedScripts: s.parsedScripts,
    shootingDays: s.shootingDays,
    sceneAssignments: s.sceneAssignments,
    team: s.team,
  })))

  // Collect all scenes from all parsed scripts
  const allScenes = useMemo(() => {
    const scenes = []
    Object.values(parsedScripts || {}).forEach(ps => {
      ;(ps?.scenes || []).forEach(sc => scenes.push(sc))
    })
    return scenes
  }, [parsedScripts])

  // Build sceneKey → scene map
  const sceneByKey = useMemo(() => {
    const m = {}
    allScenes.forEach(sc => {
      const key = `${sc.episode}-${sc.sceneNumber || sc.id}`
      m[key] = sc
    })
    return m
  }, [allScenes])

  // All unique characters
  const characters = useMemo(() => {
    const s = new Set()
    allScenes.forEach(sc => (sc.characters || []).forEach(c => s.add(c)))
    return [...s].sort()
  }, [allScenes])

  // Sort shooting days by date or order
  const sortedDays = useMemo(() => {
    return [...(shootingDays || [])].sort((a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date)
      return 0
    })
  }, [shootingDays])

  // Build matrix: character → dayId → status
  const matrix = useMemo(() => {
    if (!sortedDays.length || !characters.length) return {}

    // dayId → set of characters working that day
    const dayChars = {}
    sortedDays.forEach(d => { dayChars[d.id] = new Set() })

    Object.entries(sceneAssignments || {}).forEach(([sceneKey, dayId]) => {
      const scene = sceneByKey[sceneKey]
      if (!scene) return
      ;(scene.characters || []).forEach(c => {
        if (dayChars[dayId]) dayChars[dayId].add(c)
      })
    })

    const result = {}
    for (const char of characters) {
      const dayStatuses = {}
      let firstWork = -1
      let lastWork = -1

      // Find first and last work indices
      sortedDays.forEach((d, idx) => {
        if (dayChars[d.id]?.has(char)) {
          if (firstWork === -1) firstWork = idx
          lastWork = idx
        }
      })

      if (firstWork === -1) continue // character not assigned to any day

      sortedDays.forEach((d, idx) => {
        const works = dayChars[d.id]?.has(char)
        if (idx === firstWork && idx === lastWork && works) {
          dayStatuses[d.id] = 'SWF' // single day — show as SW
        } else if (idx === firstWork && works) {
          dayStatuses[d.id] = 'SW'
        } else if (idx === lastWork && works) {
          dayStatuses[d.id] = 'WF'
        } else if (works) {
          dayStatuses[d.id] = 'W'
        } else if (idx > firstWork && idx < lastWork) {
          dayStatuses[d.id] = 'H'
        }
      })

      // Count work days
      const workDays = Object.values(dayStatuses).filter(s => s !== 'H').length
      const holdDays = Object.values(dayStatuses).filter(s => s === 'H').length

      result[char] = { statuses: dayStatuses, workDays, holdDays }
    }

    return result
  }, [characters, sortedDays, sceneAssignments, sceneByKey])

  // Cast count per day
  const castPerDay = useMemo(() => {
    const counts = {}
    sortedDays.forEach(d => {
      let count = 0
      for (const char of characters) {
        const st = matrix[char]?.statuses[d.id]
        if (st && st !== 'H') count++
      }
      counts[d.id] = count
    })
    return counts
  }, [matrix, sortedDays, characters])

  // Empty state
  if (!sortedDays.length || !Object.keys(sceneAssignments || {}).length) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <CalendarDays size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
        <p style={{ margin: '0 0 8px' }}>Day Out of Days</p>
        <p style={{ fontSize: 12 }}>
          {!sortedDays.length
            ? 'Cria dias de rodagem no módulo Produção para ver o DOOD.'
            : 'Atribui cenas aos dias de rodagem para ver o DOOD.'}
        </p>
      </div>
    )
  }

  const activeChars = characters.filter(c => matrix[c])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Legenda:</span>
        {Object.entries(STATUS_STYLE).map(([k, v]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 20, height: 16, borderRadius: 3, background: v.bg, color: v.color, fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: '16px' }}>{v.label}</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {k === 'SW' ? 'Início' : k === 'W' ? 'Trabalho' : k === 'WF' ? 'Fim' : 'Hold'}
            </span>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>{activeChars.length} personagens · {sortedDays.length} dias</span>
      </div>

      {/* Scrollable table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 0 12px' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, position: 'sticky', left: 0, zIndex: 2, background: 'var(--bg-elevated)', minWidth: 140 }}>Personagem</th>
              {sortedDays.map(d => (
                <th key={d.id} style={{ ...thStyle, minWidth: 40, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {d.label || d.date || d.id.slice(-4)}
                </th>
              ))}
              <th style={{ ...thStyle, minWidth: 40, textAlign: 'center' }}>Total</th>
              <th style={{ ...thStyle, minWidth: 40, textAlign: 'center' }}>Hold</th>
            </tr>
          </thead>
          <tbody>
            {activeChars.map(char => (
              <tr key={char}>
                <td style={{ ...tdStyle, position: 'sticky', left: 0, zIndex: 1, background: 'var(--bg-surface)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {char}
                </td>
                {sortedDays.map(d => {
                  let st = matrix[char]?.statuses[d.id]
                  // SWF = single day work, display as SW
                  const displayKey = st === 'SWF' ? 'SW' : st
                  const style = displayKey ? STATUS_STYLE[displayKey] : null
                  return (
                    <td key={d.id} style={{ ...tdStyle, textAlign: 'center', background: style?.bg || 'transparent', color: style?.color || 'transparent', fontWeight: 700 }}>
                      {style?.label || ''}
                    </td>
                  )
                })}
                <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>{matrix[char]?.workDays || 0}</td>
                <td style={{ ...tdStyle, textAlign: 'center', color: '#fbbf24', fontWeight: 600 }}>{matrix[char]?.holdDays || 0}</td>
              </tr>
            ))}
            {/* Summary row */}
            <tr>
              <td style={{ ...tdStyle, position: 'sticky', left: 0, zIndex: 1, background: 'var(--bg-elevated)', fontWeight: 700, color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase' }}>Elenco/dia</td>
              {sortedDays.map(d => (
                <td key={d.id} style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>
                  {castPerDay[d.id] || 0}
                </td>
              ))}
              <td style={{ ...tdStyle, background: 'var(--bg-elevated)' }} />
              <td style={{ ...tdStyle, background: 'var(--bg-elevated)' }} />
            </tr>
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
}

const tdStyle = {
  padding: '6px',
  borderBottom: '1px solid var(--border-subtle)',
  fontSize: 11,
}
