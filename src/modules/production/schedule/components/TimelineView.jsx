// TimelineView — linha do tempo horizontal por dia
// Eixo X = horas (08:00–22:00), blocos coloridos por local, marcador golden hour

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sun, Clock, MapPin } from 'lucide-react'
import { getSunsetSync } from '../utils/solarCalc.js'
import styles from '../Schedule.module.css'

const TIMELINE_START = 8 * 60   // 08:00 em minutos
const TIMELINE_END   = 22 * 60  // 22:00 em minutos
const TIMELINE_SPAN  = TIMELINE_END - TIMELINE_START

const HOURS = Array.from({ length: 15 }, (_, i) => 8 + i) // 8..22

function timeToMin(timeStr) {
  if (!timeStr) return TIMELINE_START
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minToX(min) {
  return ((min - TIMELINE_START) / TIMELINE_SPAN) * 100
}

function minToWidth(min) {
  return (min / TIMELINE_SPAN) * 100
}

// ── DayTimeline ───────────────────────────────────────────────────
function DayTimeline({ day, dayNumber, isExpanded, onToggle, onSceneClick }) {
  const callMin  = timeToMin(day.callTime || '08:00')
  const solar    = getSunsetSync(day.date)
  const goldenMin = timeToMin(solar.goldenHour)

  // Agrupar cenas por local mantendo ordem
  const blocks = useMemo(() => {
    const result = []
    let cursor = callMin

    // Separar manhã/tarde com almoço a meio
    const halfDayMin = callMin + 300 // 5h de manhã
    const lunchEnd   = halfDayMin + 60

    ;(day.scenes || []).forEach((scene, idx) => {
      const dur = scene.duration || 45

      // Inserir almoço se cursor ultrapassou 5h de manhã
      if (cursor < lunchEnd && cursor + dur > halfDayMin && result.length > 0) {
        result.push({
          type: 'lunch',
          startMin: halfDayMin,
          duration: 60,
          x: minToX(halfDayMin),
          w: minToWidth(60),
        })
        cursor = lunchEnd
      }

      result.push({
        type: 'scene',
        scene,
        startMin: cursor,
        duration: dur,
        x: minToX(cursor),
        w: minToWidth(dur),
        color: scene.locationColor || '#2E6FA0',
      })
      cursor += dur
    })

    return result
  }, [day.scenes, callMin])

  const wrapMin = blocks.length > 0
    ? blocks[blocks.length - 1].startMin + blocks[blocks.length - 1].duration
    : callMin

  const goldenXPct = minToX(goldenMin)
  const showGolden = goldenMin >= TIMELINE_START && goldenMin <= TIMELINE_END

  return (
    <div className={styles.tlDayRow}>
      {/* Label do dia */}
      <div className={styles.tlDayLabel} onClick={onToggle} style={{ cursor: 'pointer' }}>
        <span className={styles.tlDayNum}>D{dayNumber}</span>
        <span className={styles.tlDayDate}>
          {day.date
            ? new Date(day.date + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })
            : '—'
          }
        </span>
        <span className={styles.tlDaySceneCount}>{day.scenes?.length || 0} cenas</span>
      </div>

      {/* Faixa de tempo */}
      <div className={styles.tlTrack}>
        {/* Call time marker */}
        <div
          className={styles.tlCallMarker}
          style={{ left: `${minToX(callMin)}%` }}
          title={`Call: ${day.callTime}`}
        />

        {/* Blocos de cena e almoço */}
        {blocks.map((block, bIdx) => {
          if (block.type === 'lunch') {
            return (
              <div
                key={`lunch-${bIdx}`}
                className={styles.tlLunch}
                style={{ left: `${block.x}%`, width: `${block.w}%` }}
                title="Almoço"
              />
            )
          }
          const { scene, x, w, color } = block
          return (
            <motion.div
              key={scene.sceneKey || bIdx}
              className={styles.tlSceneBlock}
              style={{ left: `${x}%`, width: `${Math.max(w, 0.5)}%`, background: color, borderColor: color, cursor: 'pointer' }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: bIdx * 0.02 }}
              title={`#${scene.sceneNumber} · ${scene.location} · ${scene.duration}min`}
              onClick={() => onSceneClick?.(scene)}
            >
              <span className={styles.tlSceneLabel}>
                #{scene.sceneNumber} {scene.location}
              </span>
            </motion.div>
          )
        })}

        {/* Golden hour marker */}
        {showGolden && (
          <div
            className={styles.tlGoldenMarker}
            style={{ left: `${goldenXPct}%` }}
            title={`Golden Hour: ${solar.goldenHour}`}
          >
            <Sun size={10} color="#F5A623" />
          </div>
        )}

        {/* Wrap marker */}
        {wrapMin < TIMELINE_END && (
          <div
            className={styles.tlWrapMarker}
            style={{ left: `${minToX(wrapMin)}%` }}
            title={`Wrap estimado: ${String(Math.floor(wrapMin / 60)).padStart(2,'0')}:${String(wrapMin % 60).padStart(2,'0')}`}
          />
        )}
      </div>

      {/* Legenda de locais quando expandido */}
      {isExpanded && (day.locations?.length > 0) && (
        <div className={styles.tlLocationLegend}>
          {day.locations.map(loc => (
            <span key={loc.name} className={styles.tlLegendItem}>
              <span className={styles.tlLegendDot} style={{ background: loc.color }} />
              {loc.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── TimelineView ──────────────────────────────────────────────────
export function TimelineView({ engineResult, onSceneClick }) {
  const [expandedDay, setExpandedDay] = useState(null)

  const { days = [] } = engineResult || {}

  if (days.length === 0) {
    return (
      <div className={styles.calEmpty}>
        <Clock size={36} color="var(--text-muted)" style={{ opacity: 0.4 }} />
        <p>Nenhum dia criado ainda</p>
      </div>
    )
  }

  return (
    <div className={styles.tlRoot}>
      {/* Eixo de horas */}
      <div className={styles.tlAxisRow}>
        <div className={styles.tlDayLabelSpacer} />
        <div className={styles.tlAxis}>
          {HOURS.map(h => (
            <div
              key={h}
              className={styles.tlHourMark}
              style={{ left: `${minToX(h * 60)}%` }}
            >
              {h}h
            </div>
          ))}
          {/* Golden hour zone shading */}
          <div
            className={styles.tlGoldenZone}
            style={{
              left:  `${minToX(19 * 60 + 30)}%`,
              width: `${minToWidth(90)}%`,
            }}
          />
        </div>
      </div>

      {/* Linhas de dias */}
      <div className={styles.tlDays}>
        {days.map((day, idx) => (
          <DayTimeline
            key={day.id}
            day={day}
            dayNumber={day.dayNumber || idx + 1}
            isExpanded={expandedDay === day.id}
            onToggle={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
            onSceneClick={onSceneClick}
          />
        ))}
      </div>

      {/* Legenda */}
      <div className={styles.tlLegendBar}>
        <div className={styles.tlLegendItem}>
          <div style={{ width: 12, height: 8, background: 'var(--bg-overlay)', border: '1px dashed var(--text-muted)', borderRadius: 2 }} />
          <span>Almoço</span>
        </div>
        <div className={styles.tlLegendItem}>
          <Sun size={10} color="#F5A623" />
          <span>Golden Hour</span>
        </div>
        <div className={styles.tlLegendItem}>
          <div style={{ width: 2, height: 10, background: 'var(--health-green)' }} />
          <span>Wrap estimado</span>
        </div>
      </div>
    </div>
  )
}
