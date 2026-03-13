// CalendarView — Mapa de Rodagem
// Cartões de dia compactos (RESUMO style) + DayLoreCard overlay (DIA X style)
// Inclui sunrise/sunset, pausas, deslocações, lighting changes, almoço

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Users, Clock, Sun, Sunset, Sunrise, AlertTriangle,
  Camera, Calendar, X, FileText, GripVertical, Star, ChevronRight,
  Coffee, Truck, Zap,
} from 'lucide-react'
import { useStore } from '../../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { validateDragDrop } from '../utils/scheduleConstraints.js'
import { exportCallSheet } from '../utils/scheduleExport.js'
import { getSunsetSync, prewarmSolarCache } from '../utils/solarCalc.js'
import styles from '../Schedule.module.css'

const TYPE_COLORS = {
  'Âncora':    '#A02E6F',
  'Grupo':     '#2E6FA0',
  'Diálogo':   '#2EA080',
  'Gag':       '#BF6A2E',
  'Solo':      '#7B4FBF',
  'Transição': '#6E6E78',
}

const STATUS_LABELS = {
  ok:       { text: 'OK',       color: 'var(--health-green)' },
  apertado: { text: 'APERTADO', color: 'var(--health-yellow)' },
  folga:    { text: 'FOLGA',    color: 'var(--health-green)' },
  overflow: { text: 'OVERFLOW', color: 'var(--health-red)' },
  confort:  { text: 'CONFORT.', color: 'var(--health-green)' },
}

function formatDate(dateStr) {
  if (!dateStr) return { weekday: '—', short: '—', day: '--', month: '--' }
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return {
      weekday: d.toLocaleDateString('pt-PT', { weekday: 'long' }),
      short: d.toLocaleDateString('pt-PT', { weekday: 'short' }),
      day: d.getDate(),
      month: d.toLocaleDateString('pt-PT', { month: 'short' }),
      full: d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' }),
    }
  } catch { return { weekday: '—', short: '—', day: '--', month: '--' } }
}

function getDayStatus(day) {
  if (!day.scenes?.length) return null
  const u = day.utilization || 0
  if (u >= 100) return STATUS_LABELS.overflow
  if (u >= 88) return STATUS_LABELS.apertado
  if (u >= 70) return STATUS_LABELS.ok
  if (u >= 50) return STATUS_LABELS.folga
  return STATUS_LABELS.confort
}

// ── Compact Day Card ──────────────────────────────────────────────
function DayCard({ day, dayNumber, custo, onOpen, onDrop }) {
  const [dragOver, setDragOver] = useState(false)
  const date = formatDate(day.date)
  const isEmpty = !day.scenes?.length
  const status = getDayStatus(day)
  const hasAlerts = day.validation?.violations?.length > 0
  const hasError = day.validation?.severity === 'error'
  const hasExt = day.scenes?.some(s => s.intExt === 'EXT')
  const solar = day.date ? getSunsetSync(day.date) : null
  const buffer = day.bufferMin ?? ((day.windowMin || 600) - (day.totalMin || 0))

  // Location summary string (like "Casa do João — Cozinha/Sala/Hall")
  const locationSummary = useMemo(() => {
    const locs = (day.locations || []).map(l => l.name)
    if (locs.length === 0) return '—'
    if (locs.length === 1) return locs[0]
    return locs.join(' · ')
  }, [day.locations])

  // Elenco chips (max 6)
  const chars = (day.characters || []).slice(0, 6)
  const extraChars = Math.max(0, (day.characters?.length || 0) - 6)

  function handleDragOver(e) { e.preventDefault(); setDragOver(true) }
  function handleDragLeave() { setDragOver(false) }
  function handleDrop(e) {
    e.preventDefault(); setDragOver(false)
    const sceneKey = e.dataTransfer.getData('text/plain')
    if (sceneKey && onDrop) onDrop(sceneKey, day.id)
  }

  return (
    <motion.div
      className={`${styles.mapCard} ${isEmpty ? styles.mapCardEmpty : ''} ${dragOver ? styles.mapCardDragOver : ''} ${hasError ? styles.mapCardError : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      onClick={() => !isEmpty && onOpen?.(day)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Row 1: Day number + date + status */}
      <div className={styles.mapCardTop}>
        <span className={styles.mapCardDay}>D{dayNumber}</span>
        <span className={styles.mapCardDate}>
          {date.weekday}
          {date.day !== '--' && <span className={styles.mapCardDateNum}>{date.day} {date.month}</span>}
        </span>
        {hasAlerts && <AlertTriangle size={11} color={hasError ? 'var(--health-red)' : 'var(--health-yellow)'} />}
        {status && (
          <span className={styles.mapCardStatus} style={{ color: status.color }}>
            {status.text}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className={styles.mapCardEmptyMsg}>Sem cenas</div>
      ) : (
        <>
          {/* Row 2: Location summary */}
          <div className={styles.mapCardLoc}>{locationSummary}</div>

          {/* Row 3: Time + scenes + duration */}
          <div className={styles.mapCardMeta}>
            <span>{day.callTime || '08:00'} → {day.wrapTime || '—'}</span>
            <span>{day.scenes.length} cenas</span>
            <span>{day.totalMin || 0}min</span>
          </div>

          {/* Row 4: Utilisation bar */}
          <div className={styles.mapUtilRow}>
            <div className={styles.mapUtilTrack}>
              <div
                className={styles.mapUtilFill}
                style={{
                  width: `${Math.min(100, day.utilization || 0)}%`,
                  background: (day.utilization || 0) >= 100 ? 'var(--health-red)'
                    : (day.utilization || 0) >= 88 ? 'var(--health-yellow)'
                    : 'var(--health-green)',
                }}
              />
            </div>
            <span className={styles.mapUtilPct}>{day.utilization || 0}%</span>
            {buffer > 0 && <span className={styles.mapBuffer}>+{buffer}m</span>}
          </div>

          {/* Row 5: Scene types mini */}
          <div className={styles.mapTypes}>
            {Object.entries(
              (day.scenes || []).reduce((acc, s) => {
                const t = s.sceneType || 'Transição'
                acc[t] = (acc[t] || 0) + 1
                return acc
              }, {})
            ).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([type, count]) => (
              <span key={type} className={styles.mapTypeChip} style={{ color: TYPE_COLORS[type] || '#6E6E78' }}>
                {count}× {type}
              </span>
            ))}
          </div>

          {/* Row 6: Solar info (if has EXT) */}
          {hasExt && solar && !solar.pending && (
            <div className={styles.mapSolar}>
              <Sunrise size={10} />
              <span>{solar.raw?.sunrise ? new Date(solar.raw.sunrise).toTimeString().slice(0, 5) : '—'}</span>
              <Sunset size={10} />
              <span>{solar.sunset || '—'}</span>
              {solar.goldenHour && <span className={styles.mapGolden}>GH {solar.goldenHour}</span>}
            </div>
          )}

          {/* Row 7: Cast mini */}
          {chars.length > 0 && (
            <div className={styles.mapCast}>
              {chars.map(c => (
                <span key={c} className={styles.mapCastChip}>{c}</span>
              ))}
              {extraChars > 0 && <span className={styles.mapCastMore}>+{extraChars}</span>}
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

// ── Day Lore Card (Overlay) ────────────────────────────────────────
function DayLoreCard({ day, dayNumber, engineResult, onClose, onSceneClick }) {
  const date = formatDate(day.date)
  const solar = day.date ? getSunsetSync(day.date) : null
  const hasExt = day.scenes?.some(s => s.intExt === 'EXT')
  const status = getDayStatus(day)
  const buffer = day.bufferMin ?? ((day.windowMin || 600) - (day.totalMin || 0))

  // Location summary
  const locationSummary = (day.locations || []).map(l => l.name).join(' · ') || '—'

  // Group scenes by episode for summary
  const epSummary = useMemo(() => {
    const map = {}
    ;(day.scenes || []).forEach(s => {
      const ep = s.epId || 'EP?'
      if (!map[ep]) map[ep] = { count: 0, min: 0 }
      map[ep].count++
      map[ep].min += s.duration || 0
    })
    return Object.entries(map)
  }, [day.scenes])

  // Build full timeline: scenes + blocos + pauses + moves + lunch
  const timeline = useMemo(() => {
    const items = []
    const blocos = day.blocos || []

    if (blocos.length > 0) {
      // Use blocos (have time info)
      blocos.forEach(bloco => {
        if (bloco.tipo === 'almoco') {
          items.push({
            type: 'pause',
            subtype: 'almoco',
            start: bloco.hora_inicio,
            end: bloco.hora_fim,
            duration: bloco.duracao,
            label: 'ALMOÇO',
          })
        } else {
          // Add move before if any
          if (bloco.move_antes > 0) {
            const moveStartMin = (bloco.inicio_min || 0) - bloco.move_antes
            items.push({
              type: 'move',
              duration: bloco.move_antes,
              to: bloco.location,
              start: `${String(Math.floor(moveStartMin / 60)).padStart(2, '0')}h${String(moveStartMin % 60).padStart(2, '0')}`,
            })
          }

          // Add scenes within this bloco
          const blocoScenes = (bloco.cenas || []).length > 0
            ? bloco.cenas
            : (day.scenes || []).filter(s => s.location === bloco.location)

          let currentMin = bloco.inicio_min || 0
          blocoScenes.forEach(scene => {
            const dur = scene.duration || 0
            const startH = Math.floor(currentMin / 60)
            const startM = currentMin % 60
            const endMin = currentMin + dur
            const endH = Math.floor(endMin / 60)
            const endM = endMin % 60

            items.push({
              type: 'scene',
              scene,
              start: `${String(startH).padStart(2, '0')}h${String(startM).padStart(2, '0')}`,
              end: `${String(endH).padStart(2, '0')}h${String(endM).padStart(2, '0')}`,
              duration: dur,
              location: bloco.location,
              color: bloco.color,
            })
            currentMin = endMin
          })
        }
      })
    } else {
      // Fallback: just list scenes with estimated times
      let currentMin = timeToMin(day.callTime || '08:00')
      ;(day.scenes || []).forEach((scene, idx) => {
        // Move between locations
        if (idx > 0 && scene.location !== day.scenes[idx - 1]?.location) {
          const moveDur = 15 // estimated
          items.push({ type: 'move', duration: moveDur, to: scene.location })
          currentMin += moveDur
        }

        const dur = scene.duration || 30
        items.push({
          type: 'scene',
          scene,
          start: minToTime(currentMin),
          end: minToTime(currentMin + dur),
          duration: dur,
          location: scene.location,
          color: TYPE_COLORS[scene.sceneType] || '#6E6E78',
        })
        currentMin += dur

        // Auto-insert lunch around midday
        if (idx < day.scenes.length - 1 && currentMin >= 720 && currentMin <= 840 && !items.some(i => i.subtype === 'almoco')) {
          items.push({
            type: 'pause',
            subtype: 'almoco',
            start: minToTime(currentMin),
            end: minToTime(currentMin + 60),
            duration: 60,
            label: 'ALMOÇO',
          })
          currentMin += 60
        }
      })
    }

    return items
  }, [day])

  return (
    <motion.div
      className={styles.loreOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.loreCard}
        initial={{ y: 30, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={styles.loreHeader}>
          <div className={styles.loreHeaderTop}>
            <span className={styles.loreDayNum}>DIA {dayNumber}</span>
            <span className={styles.loreLoc}>{locationSummary}</span>
            <button className={styles.loreClose} onClick={onClose}><X size={16} /></button>
          </div>
          <div className={styles.loreHeaderMeta}>
            <span className={styles.loreDate}>{date.weekday}, {date.full || '—'}</span>
            {status && (
              <span className={styles.loreStatus} style={{ color: status.color }}>{status.text}</span>
            )}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className={styles.loreBody}>
          {/* Meta strip */}
          <div className={styles.loreMeta}>
            <div className={styles.loreMetaItem}>
              <span className={styles.loreMetaLabel}>CALL</span>
              <span className={styles.loreMetaValue}>{day.callTime || '08:00'}</span>
            </div>
            <div className={styles.loreMetaItem}>
              <span className={styles.loreMetaLabel}>WRAP</span>
              <span className={styles.loreMetaValue}>{day.wrapTime || '—'}</span>
            </div>
            <div className={styles.loreMetaItem}>
              <span className={styles.loreMetaLabel}>CENAS</span>
              <span className={styles.loreMetaValue}>{day.scenes?.length || 0}</span>
            </div>
            <div className={styles.loreMetaItem}>
              <span className={styles.loreMetaLabel}>DURAÇÃO</span>
              <span className={styles.loreMetaValue}>{day.totalMin || 0}min</span>
            </div>
            <div className={styles.loreMetaItem}>
              <span className={styles.loreMetaLabel}>UTIL.</span>
              <span className={styles.loreMetaValue} style={{
                color: (day.utilization || 0) >= 100 ? 'var(--health-red)' : (day.utilization || 0) >= 88 ? 'var(--health-yellow)' : 'var(--health-green)',
              }}>{day.utilization || 0}%</span>
            </div>
            <div className={styles.loreMetaItem}>
              <span className={styles.loreMetaLabel}>BUFFER</span>
              <span className={styles.loreMetaValue}>{buffer}min</span>
            </div>
          </div>

          {/* Solar strip (if has EXT) */}
          {hasExt && solar && (
            <div className={styles.loreSolar}>
              <Sunrise size={12} color="var(--health-yellow)" />
              <span>{solar.raw?.sunrise ? new Date(solar.raw.sunrise).toTimeString().slice(0, 5) : '—'}</span>
              <Sun size={12} color="var(--health-yellow)" />
              <Sunset size={12} color="#F5A623" />
              <span>{solar.sunset || '—'}</span>
              {solar.goldenHour && (
                <span className={styles.loreSolarGH}>Golden Hour: {solar.goldenHour}</span>
              )}
            </div>
          )}

          {/* Elenco */}
          {(day.characters || []).length > 0 && (
            <div className={styles.loreCast}>
              <span className={styles.loreCastLabel}>ELENCO</span>
              <div className={styles.loreCastList}>
                {day.characters.map(c => (
                  <span key={c} className={styles.loreCastChip}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {day.validation?.violations?.length > 0 && (
            <div className={styles.loreAlerts}>
              {day.validation.violations.map((v, i) => (
                <div key={i} className={styles.loreAlertRow} style={{
                  borderLeftColor: v.severity === 'error' ? 'var(--health-red)' : 'var(--health-yellow)',
                }}>
                  <AlertTriangle size={11} color={v.severity === 'error' ? 'var(--health-red)' : 'var(--health-yellow)'} />
                  <span>{v.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Timeline: scene by scene ── */}
          <div className={styles.loreTimeline}>
            <div className={styles.loreTimelineHeader}>
              <span>PLANO HORÁRIO</span>
              <button
                className={styles.loreExportBtn}
                onClick={() => engineResult && exportCallSheet(day, engineResult)}
              >
                <FileText size={10} /> Exportar PDF
              </button>
            </div>

            {timeline.map((item, idx) => {
              if (item.type === 'pause') {
                return (
                  <div key={`p-${idx}`} className={styles.lorePause}>
                    <Coffee size={12} />
                    <span className={styles.lorePauseTime}>{item.start} → {item.end}</span>
                    <span className={styles.lorePauseLabel}>{item.label} ({item.duration}min)</span>
                    <span className={styles.lorePauseLine}>PAUSA OBRIGATÓRIA</span>
                  </div>
                )
              }

              if (item.type === 'move') {
                return (
                  <div key={`m-${idx}`} className={styles.loreMove}>
                    <Truck size={10} />
                    {item.start && <span className={styles.loreMoveTime}>{item.start}</span>}
                    <span>DESLOCAÇÃO para {item.to} ({item.duration}min)</span>
                  </div>
                )
              }

              // Scene row
              const scene = item.scene
              const color = TYPE_COLORS[scene.sceneType] || '#6E6E78'
              return (
                <div
                  key={scene.sceneKey}
                  className={styles.loreSceneRow}
                  style={{ borderLeftColor: color }}
                  onClick={() => onSceneClick?.(scene)}
                >
                  <div className={styles.loreSceneTime}>
                    <span className={styles.loreSceneStart}>{item.start}</span>
                    <span className={styles.loreSceneEnd}>{item.end}</span>
                  </div>
                  <div className={styles.loreSceneBody}>
                    <div className={styles.loreSceneTop}>
                      <span className={styles.loreSceneKey}>{scene.sceneKey}</span>
                      <span className={styles.loreSceneEp}>{scene.epId}</span>
                      <span className={styles.loreSceneLoc}>
                        <MapPin size={9} /> {scene.location}
                      </span>
                      <span className={styles.loreSceneIE} style={{ color: scene.intExt === 'EXT' ? '#F5A623' : 'var(--text-muted)' }}>
                        {scene.intExt}
                      </span>
                      <span className={styles.loreSceneType} style={{ color }}>
                        {scene.sceneType}
                      </span>
                      <span className={styles.loreSceneDur}>{item.duration}min</span>
                    </div>
                    {scene.synopsis && (
                      <div className={styles.loreSceneSynopsis}>{scene.synopsis}</div>
                    )}
                    {(scene.characters || []).length > 0 && (
                      <div className={styles.loreSceneChars}>
                        {scene.characters.join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {timeline.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                Nenhuma cena atribuída
              </p>
            )}
          </div>

          {/* ── Summary footer ── */}
          <div className={styles.loreSummary}>
            {epSummary.map(([ep, data]) => (
              <span key={ep} className={styles.loreSummaryEp}>
                {ep}: {data.count} cenas · {data.min}min
              </span>
            ))}
            <span className={styles.loreSummaryTotal}>
              FIM: {day.wrapTime || '—'} · Buffer: {buffer}min · {day.utilization || 0}%
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function timeToMin(t) {
  if (!t) return 480
  const [h, m] = t.replace('h', ':').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function minToTime(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}

// ── CalendarView (Mapa de Rodagem) ──────────────────────────────
export function CalendarView({ engineResult, onSceneClick, onDaySelect, onDayClick }) {
  const [loreDay, setLoreDay] = useState(null)
  const handleDayOpen = (day) => {
    // Card stack: open day as stacked card
    if (onDayClick) { onDayClick(day); return }
    // Fallback: direct callsheet navigation or local lore card
    if (onDaySelect) { onDaySelect(day.id); return }
    setLoreDay(day)
  }
  const {  assignScene, unassignScene  } = useStore(useShallow(s => ({ assignScene: s.assignScene, unassignScene: s.unassignScene })))
  const team = useStore(s => s.team)

  const { days = [], alertas = [], meta = {}, custos = [] } = engineResult || {}

  // Prewarm solar cache
  useEffect(() => {
    const dates = days.map(d => d.date).filter(Boolean)
    if (dates.length > 0) prewarmSolarCache(dates)
  }, [days])

  const handleSceneDrop = useCallback((sceneKey, toDayId) => {
    if (!engineResult) return
    const validation = validateDragDrop(sceneKey, null, toDayId, engineResult, team)
    if (!validation.valid) {
      if (validation.canForce) {
        if (!window.confirm(`Aviso: ${validation.message}\n\nMover mesmo assim?`)) return
      } else {
        alert(`Não é possível mover: ${validation.message}`)
        return
      }
    }
    unassignScene(sceneKey)
    assignScene(sceneKey, toDayId)
  }, [engineResult, team, assignScene, unassignScene])

  // Group by week
  const weeks = useMemo(() => {
    const groups = {}
    days.forEach((day, idx) => {
      if (!day.date) { groups['sem-data'] = groups['sem-data'] || []; groups['sem-data'].push({ day, idx }); return }
      const d = new Date(day.date + 'T00:00:00')
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const key = weekStart.toISOString().slice(0, 10)
      if (!groups[key]) groups[key] = []
      groups[key].push({ day, idx })
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [days])

  const errors = alertas.filter(a => a.severity === 'error')

  if (days.length === 0) {
    return (
      <div className={styles.calEmpty}>
        <Calendar size={40} color="var(--text-muted)" style={{ opacity: 0.4 }} />
        <p>Nenhum dia de rodagem criado ainda</p>
      </div>
    )
  }

  return (
    <div className={styles.calRoot}>
      {/* ── Summary bar ── */}
      <div className={styles.calSummaryBar}>
        <div className={styles.calStat}>
          <span className={styles.calStatNum}>{days.length}</span>
          <span className={styles.calStatLabel}>DIAS</span>
        </div>
        <div className={styles.calStatDiv} />
        <div className={styles.calStat}>
          <span className={styles.calStatNum}>{meta.assignedScenes || 0}</span>
          <span className={styles.calStatLabel}>CENAS</span>
        </div>
        <div className={styles.calStatDiv} />
        <div className={styles.calStat}>
          <span className={styles.calStatNum}>{meta.totalHours || 0}h</span>
          <span className={styles.calStatLabel}>ESTIMADAS</span>
        </div>
        {meta.unassignedScenes > 0 && (
          <>
            <div className={styles.calStatDiv} />
            <div className={styles.calStat}>
              <span className={styles.calStatNum} style={{ color: 'var(--health-red)' }}>{meta.unassignedScenes}</span>
              <span className={styles.calStatLabel}>SEM DIA</span>
            </div>
          </>
        )}
        {errors.length > 0 && (
          <div className={styles.calAlert} style={{ background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.3)' }}>
            <AlertTriangle size={12} color="var(--health-red)" />
            <span>{errors.length} erro(s) crítico(s)</span>
          </div>
        )}
      </div>

      {/* ── Map grid ── */}
      <div className={styles.calBody}>
        {weeks.map(([weekKey, weekDays]) => {
          const weekLabel = weekKey === 'sem-data'
            ? 'Sem data'
            : (() => {
                try {
                  const d = new Date(weekKey + 'T00:00:00')
                  return `SEMANA DE ${d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' }).toUpperCase()}`
                } catch { return weekKey }
              })()

          return (
            <div key={weekKey} className={styles.weekGroup}>
              <div className={styles.weekLabel}>{weekLabel}</div>
              <div className={styles.mapGrid}>
                {weekDays.map(({ day, idx }) => (
                  <DayCard
                    key={day.id}
                    day={day}
                    dayNumber={day.dayNumber || idx + 1}
                    custo={null}
                    onOpen={handleDayOpen}
                    onDrop={handleSceneDrop}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Lore Card Overlay ── */}
      <AnimatePresence>
        {loreDay && (
          <DayLoreCard
            day={loreDay}
            dayNumber={loreDay.dayNumber || days.findIndex(d => d.id === loreDay.id) + 1}
            engineResult={engineResult}
            onClose={() => setLoreDay(null)}
            onSceneClick={(scene) => { setLoreDay(null); onSceneClick?.(scene) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
