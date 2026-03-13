// ScheduleOverlay — Floating glass timeline card for the shooting day
// Matches Figma: 12 MAR. header, timeline with colored left border

import { GlassOverlay } from './GlassOverlay.jsx'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { useMemo } from 'react'
import { getScenesForDay } from '../../utils/dashboardHelpers.js'
import { X } from 'lucide-react'

const timeStyle = {
  fontSize: 14, fontWeight: 700, color: '#6E6E78', minWidth: 52,
  fontFamily: 'Inter, var(--font-display, system-ui)',
}

const entryCard = {
  flex: 1,
  padding: '10px 0',
  borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
}

const entryTitle = {
  fontSize: 15, fontWeight: 700, color: '#fff',
  fontFamily: 'Inter, var(--font-display, system-ui)',
}

const entrySub = {
  fontSize: 12, color: '#6E6E78', marginTop: 2,
}

export function ScheduleOverlay({ open, onClose, day }) {
  const { sceneAssignments, parsedScripts, locations } = useStore(useShallow(s => ({
    sceneAssignments: s.sceneAssignments,
    parsedScripts: s.parsedScripts,
    locations: s.locations,
  })))

  if (!day) return null

  const dayScenes = useMemo(
    () => getScenesForDay(day.id, sceneAssignments, parsedScripts),
    [day, sceneAssignments, parsedScripts]
  )

  const dateObj = day.date ? new Date(day.date) : new Date()
  const dayNum = dateObj.getDate()
  const monthStr = dateObj.toLocaleDateString('pt-PT', { month: 'short' }).toUpperCase().replace('.', '')
  const weekdayStr = dateObj.toLocaleDateString('pt-PT', { weekday: 'long' })
  const weekdayCap = weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1)

  // Build timeline entries
  const callTime = day.callTime || '07:00'
  const entries = []

  // Catering/Crew call
  const [callH] = callTime.split(':').map(Number)
  entries.push({
    time: `${String(callH - 1).padStart(2, '0')}:30`,
    title: 'Catering',
    sub: 'Base de Produção',
    color: '#F59E0B',
  })
  entries.push({
    time: callTime,
    title: 'Crew Call',
    sub: 'Base de Produção',
    color: '#10B981',
  })

  // Setup
  entries.push({
    time: `${String(callH).padStart(2, '0')}:30`,
    title: 'Montagem',
    sub: dayScenes[0]?.location || '—',
    color: '#3b82f6',
    duration: '30min',
  })

  // Scenes
  let currentHour = callH + 1
  for (const sc of dayScenes) {
    const dur = sc.pageCount ? Math.max(1, Math.round(sc.pageCount * 1.5)) : 2
    entries.push({
      time: `${String(currentHour).padStart(2, '0')}:00`,
      title: `Cena ${sc.sceneNumber || sc.id}`,
      sub: `${sc.intExt || ''} ${sc.location || '—'} • ${dur}h`,
      color: '#a855f7',
      isScene: true,
      scene: sc,
    })
    currentHour += dur

    // Lunch break after ~4h of work
    if (currentHour >= callH + 4 && !entries.find(e => e.title === 'Almoço')) {
      entries.push({
        time: `${String(currentHour).padStart(2, '0')}:00`,
        title: 'Almoço',
        sub: 'Catering Exterior • 45min',
        color: '#F59E0B',
      })
      currentHour += 1
    }
  }

  // Wrap
  entries.push({
    time: `${String(Math.min(currentHour + 1, 23)).padStart(2, '0')}:00`,
    title: 'Wrap',
    sub: 'Fim de rodagem',
    color: '#EF4444',
  })

  return (
    <GlassOverlay open={open} onClose={onClose} width={440}>
      {/* Date Header */}
      <div style={{ textAlign: 'center', marginBottom: 24, paddingRight: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
          <span style={{
            fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 1,
            fontFamily: 'Inter, var(--font-display, system-ui)',
          }}>{dayNum}</span>
          <span style={{
            fontSize: 28, fontWeight: 800, color: '#6E6E78',
            fontFamily: 'Inter, var(--font-display, system-ui)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{monthStr}.</span>
        </div>
        <p style={{ fontSize: 13, color: '#6E6E78', margin: '4px 0 0' }}>
          {weekdayCap} • Produção
        </p>
        {day.dayNumber && (
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 999,
            background: 'rgba(16,185,129,0.12)', color: '#10B981',
            border: '0.5px solid rgba(16,185,129,0.2)', letterSpacing: '0.06em',
            display: 'inline-block', marginTop: 8,
          }}>DIA {day.dayNumber}</span>
        )}
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {entries.map((entry, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            position: 'relative',
          }}>
            <span style={timeStyle}>{entry.time}</span>
            <div style={{
              width: 3, background: entry.color, borderRadius: 2,
              alignSelf: 'stretch', minHeight: 44, flexShrink: 0,
              boxShadow: `0 0 8px ${entry.color}40`,
            }} />
            <div style={entryCard}>
              <p style={entryTitle}>{entry.title}</p>
              <p style={entrySub}>
                {entry.sub}
                {entry.duration && ` • ${entry.duration}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassOverlay>
  )
}
