// Módulo de Produção — Strip Board · Analytics · Script RT · Folha de Serviço
// Lê parsedScripts do store · Shooting days persistidos · Engine de optimização

import { useState, useMemo, useCallback, useRef, memo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Radio, FileText, Plus, X,
  ChevronDown, ChevronRight, Star, Clock, MapPin, Users,
  Zap, Film, Sun, Moon, AlertTriangle, Check, RefreshCw,
  CheckCircle, Play, CalendarDays, ArrowUp, ArrowDown,
  BarChart3, Trash2, Edit3, Camera, Image, Sparkles, Loader,
} from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { fetchAPI } from '../../core/api.js'
import { ScheduleModule } from './schedule/index.jsx'
import { ScheduleSetup } from './schedule/components/ScheduleSetup.jsx'
import { runScheduleEngine } from './schedule/utils/scheduleEngine.js'
import { classifyScene as classifySceneRaw } from './schedule/utils/sceneDuration.js'
import { SmartInput } from '../../components/shared/SmartInput.jsx'
import { resolveLocation } from '../../utils/locationResolver.js'
import { CallSheetModule } from '../callsheet/index.jsx'
import styles from './Production.module.css'

// ── Tags / Características de cena ─────────────────────────────────
export const SCENE_TAGS = [
  { id: 'croma',       label: 'Croma/Green Screen', icon: '\u{1F7E9}', color: '#00C853' },
  { id: 'stunts',      label: 'Stunts',             icon: '\u{1F938}', color: '#FF6D00' },
  { id: 'sfx',         label: 'Efeitos Especiais',  icon: '\u{1F4A5}', color: '#FF1744' },
  { id: 'vfx',         label: 'VFX',                icon: '\u2728',    color: '#AA00FF' },
  { id: 'criancas',    label: 'Crian\u00E7as/Menores', icon: '\u{1F476}', color: '#FFD600' },
  { id: 'animais',     label: 'Animais',            icon: '\u{1F415}', color: '#795548' },
  { id: 'agua',        label: '\u00C1gua/Chuva',    icon: '\u{1F4A7}', color: '#2196F3' },
  { id: 'noite_amer',  label: 'Noite Americana',    icon: '\u{1F319}', color: '#1A237E' },
  { id: 'intimidade',  label: 'Intimidade',         icon: '\u{1F91D}', color: '#E91E63' },
  { id: 'veiculos',    label: 'Ve\u00EDculos',      icon: '\u{1F697}', color: '#607D8B' },
  { id: 'armas',       label: 'Armas/Pirotecnia',   icon: '\u26A0\uFE0F', color: '#F44336' },
  { id: 'multidao',    label: 'Figura\u00E7\u00E3o/Multid\u00E3o', icon: '\u{1F465}', color: '#9C27B0' },
  { id: 'exterior_remoto', label: 'Exterior Remoto', icon: '\u{1F3D4}\uFE0F', color: '#4CAF50' },
  { id: 'playback',    label: 'Playback/M\u00FAsica', icon: '\u{1F3B5}', color: '#00BCD4' },
  { id: 'refeicao',    label: 'Cena de Refei\u00E7\u00E3o', icon: '\u{1F37D}\uFE0F', color: '#FF9800' },
]

// ── Tipos de cena e durações ──────────────────────────────────────
const SCENE_TYPES = {
  âncora:    { duration: 75, color: '#A02E6F', label: 'Âncora' },
  grupo:     { duration: 50, color: '#2E6FA0', label: 'Grupo' },
  diálogo:   { duration: 45, color: '#2EA080', label: 'Diálogo' },
  gag:       { duration: 35, color: '#BF6A2E', label: 'Gag' },
  solo:      { duration: 30, color: '#7B4FBF', label: 'Solo' },
  transição: { duration: 25, color: '#6E6E78', label: 'Transição' },
}

const DAY_CAPACITY = 570

// Single source of truth: sceneDuration.js (returns capitalised);
// production UI expects lowercase keys matching SCENE_TYPES.
function classifyScene(scene) {
  return classifySceneRaw(scene).toLowerCase()
}

function sceneKey(epId, scene) {
  return `${epId}-${scene.sceneNumber || scene.id}`
}

// ── Shared UI ─────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const t = SCENE_TYPES[type] || SCENE_TYPES.transição
  return (
    <span className={styles.typeBadge} style={{ background: t.color + '22', color: t.color, borderColor: t.color + '44' }}>
      {t.label}
    </span>
  )
}

// ── Hook partilhado: todas as cenas enriquecidas ──────────────────
function useAllScenes() {
  const {  parsedScripts  } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts })))
  return useMemo(() => {
    const scenes = []
    Object.entries(parsedScripts).forEach(([epId, data]) => {
      ;(data.scenes || []).forEach(sc => {
        const key = sceneKey(epId, sc)
        const type = classifyScene(sc)
        scenes.push({
          ...sc, key, epId, type,
          duration: SCENE_TYPES[type]?.duration || 45,
          intExt: sc.intExt || (sc.location || '').startsWith('EXT') ? 'EXT' : 'INT',
        })
      })
    })
    return scenes
  }, [parsedScripts])
}

// ── Progresso de rodagem ──────────────────────────────────────────
function useProgress(allScenes) {
  const {  sceneTakes, sceneAssignments  } = useStore(useShallow(s => ({ sceneTakes: s.sceneTakes, sceneAssignments: s.sceneAssignments })))
  return useMemo(() => {
    let shot = 0, total = allScenes.length
    const byDay = {}

    allScenes.forEach(sc => {
      const takes = sceneTakes[sc.key] || []
      const lastStatus = takes.length > 0 ? takes[takes.length - 1].status : null
      const isDone = lastStatus === 'bom'
      if (isDone) shot++

      const dayId = sceneAssignments[sc.key]
      if (dayId) {
        if (!byDay[dayId]) byDay[dayId] = { total: 0, done: 0 }
        byDay[dayId].total++
        if (isDone) byDay[dayId].done++
      }
    })

    return { shot, total, pct: total > 0 ? Math.round((shot / total) * 100) : 0, byDay }
  }, [allScenes, sceneTakes, sceneAssignments])
}

// ── Ordenação por sceneOrder ──────────────────────────────────────
function useSortedScenes(dayScenes, dayId) {
  const {  sceneOrder  } = useStore(useShallow(s => ({ sceneOrder: s.sceneOrder })))
  return useMemo(() => {
    const order = sceneOrder[dayId] || []
    if (order.length === 0) return dayScenes
    const orderMap = Object.fromEntries(order.map((k, i) => [k, i]))
    return [...dayScenes].sort((a, b) => {
      const ia = orderMap[a.key] ?? 999
      const ib = orderMap[b.key] ?? 999
      return ia - ib
    })
  }, [dayScenes, dayId, sceneOrder])
}

// ── Take status config ────────────────────────────────────────────
const TAKE_STATUS = {
  bom:     { label: 'BOM',     color: 'var(--health-green)', icon: Check },
  parcial: { label: 'PARCIAL', color: 'var(--health-yellow)', icon: AlertTriangle },
  repetir: { label: 'REPETIR', color: '#F87171', icon: RefreshCw },
}

// ══════════════════════════════════════════════════════════════════
// ── SVG MINI CHARTS ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function BarChartSVG({ data, width = 280, height = 140, labelKey = 'label', valueKey = 'value', colorKey = 'color' }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  const barW = Math.min(32, (width - 20) / data.length - 4)
  const gap = 4
  const totalW = data.length * (barW + gap) - gap
  const offsetX = (width - totalW) / 2

  return (
    <svg width={width} height={height + 24} viewBox={`0 0 ${width} ${height + 24}`}>
      {data.map((d, i) => {
        const barH = max > 0 ? (d[valueKey] / max) * (height - 20) : 0
        const x = offsetX + i * (barW + gap)
        const y = height - barH - 2
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={3}
              fill={d[colorKey] || 'var(--mod-production)'} opacity={0.85} />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle"
              fontSize="9" fontWeight="700" fill="var(--text-secondary)">
              {d[valueKey]}
            </text>
            <text x={x + barW / 2} y={height + 12} textAnchor="middle"
              fontSize="8" fill="var(--text-muted)" fontWeight="600">
              {d[labelKey]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ segments, size = 100, thickness = 14 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.filter(s => s.value > 0).map((seg, i) => {
        const pct = seg.value / total
        const dashLen = pct * circumference
        const dashOff = -offset * circumference
        offset += pct
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
            strokeDashoffset={dashOff}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round" />
        )
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--text-primary)">
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="var(--text-muted)" fontWeight="600">
        CENAS
      </text>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── ANALYTICS DASHBOARD ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
function AnalyticsDashboard() {
  const {  parsedScripts, shootingDays, sceneAssignments, sceneTakes, team  } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts, shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments, sceneTakes: s.sceneTakes, team: s.team })))
  const allScenes = useAllScenes()
  const progress = useProgress(allScenes)

  const episodes = Object.keys(parsedScripts)

  // ── Type distribution ──
  const typeDistribution = useMemo(() => {
    const counts = {}
    Object.keys(SCENE_TYPES).forEach(t => { counts[t] = 0 })
    allScenes.forEach(sc => { counts[sc.type] = (counts[sc.type] || 0) + 1 })
    return Object.entries(SCENE_TYPES).map(([key, cfg]) => ({
      label: cfg.label, value: counts[key] || 0, color: cfg.color,
    })).filter(d => d.value > 0)
  }, [allScenes])

  // ── INT vs EXT ──
  const intExtRatio = useMemo(() => {
    let int = 0, ext = 0
    allScenes.forEach(sc => { sc.intExt === 'EXT' ? ext++ : int++ })
    return [
      { label: 'INT', value: int, color: '#5B8DEF' },
      { label: 'EXT', value: ext, color: '#F5A623' },
    ]
  }, [allScenes])

  // ── Load per day ──
  const dayLoad = useMemo(() => {
    return shootingDays.map(day => {
      const dayScenes = allScenes.filter(sc => sceneAssignments[sc.key] === day.id)
      const totalMin = dayScenes.reduce((s, sc) => s + sc.duration, 0)
      const util = Math.round((totalMin / DAY_CAPACITY) * 100)
      return {
        label: `D${day.dayNumber}`,
        value: totalMin,
        color: util >= 90 ? '#F87171' : util >= 70 ? 'var(--health-yellow)' : 'var(--mod-production)',
        util,
        scenes: dayScenes.length,
      }
    })
  }, [shootingDays, allScenes, sceneAssignments])

  // ── Scenes per episode ──
  const epDistribution = useMemo(() => {
    return episodes.map(ep => {
      const count = (parsedScripts[ep]?.scenes || []).length
      return { label: ep, value: count, color: 'var(--mod-production)' }
    })
  }, [episodes, parsedScripts])

  // ── Top actors by scene count ──
  const actorLoad = useMemo(() => {
    const counts = {}
    allScenes.forEach(sc => {
      (sc.characters || []).forEach(c => { counts[c] = (counts[c] || 0) + 1 })
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ label: name.slice(0, 8), value: count, color: 'var(--mod-script)' }))
  }, [allScenes])

  // ── Top locations by scene count ──
  const locationLoad = useMemo(() => {
    const counts = {}
    allScenes.forEach(sc => {
      const loc = sc.location || 'SEM LOCAL'
      counts[loc] = (counts[loc] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ label: name.slice(0, 10), value: count, color: '#2EA080' }))
  }, [allScenes])

  // ── Total takes ──
  const takeStats = useMemo(() => {
    let total = 0, bom = 0, parcial = 0, repetir = 0
    Object.values(sceneTakes).forEach(takes => {
      takes.forEach(t => {
        total++
        if (t.status === 'bom') bom++
        else if (t.status === 'parcial') parcial++
        else if (t.status === 'repetir') repetir++
      })
    })
    return { total, bom, parcial, repetir }
  }, [sceneTakes])

  const totalMin = allScenes.reduce((s, sc) => s + sc.duration, 0)
  const assignedCount = allScenes.filter(sc => sceneAssignments[sc.key]).length
  const unassignedCount = allScenes.length - assignedCount

  if (allScenes.length === 0) {
    return (
      <div className={styles.analyticsEmpty}>
        <BarChart3 size={40} color="var(--text-muted)" />
        <p>Carrega guiões em Análise de Guião para ver os gráficos</p>
      </div>
    )
  }

  return (
    <div className={styles.analyticsRoot}>
      {/* ── KPI Cards ── */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{allScenes.length}</span>
          <span className={styles.kpiLabel}>Cenas</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{episodes.length}</span>
          <span className={styles.kpiLabel}>Episódios</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{shootingDays.length}</span>
          <span className={styles.kpiLabel}>Dias</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{Math.round(totalMin / 60)}h</span>
          <span className={styles.kpiLabel}>Estimado</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue} style={{ color: 'var(--health-green)' }}>{progress.pct}%</span>
          <span className={styles.kpiLabel}>Filmado</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{takeStats.total}</span>
          <span className={styles.kpiLabel}>Takes</span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {progress.total > 0 && (
        <div className={styles.analyticsProgress}>
          <div className={styles.analyticsProgressBar}>
            <div className={styles.analyticsProgressFill}
              style={{ width: `${(assignedCount / progress.total) * 100}%`, background: 'var(--mod-production)', opacity: 0.3 }} />
            <div className={styles.analyticsProgressFill}
              style={{ width: `${progress.pct}%`, background: 'var(--health-green)' }} />
          </div>
          <div className={styles.analyticsProgressLegend}>
            <span><span style={{ background: 'var(--health-green)', width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} /> {progress.shot} filmadas</span>
            <span><span style={{ background: 'var(--mod-production)', width: 8, height: 8, borderRadius: '50%', display: 'inline-block', opacity: 0.4 }} /> {assignedCount} atribuídas</span>
            <span style={{ color: 'var(--text-muted)' }}>{unassignedCount} por atribuir</span>
          </div>
        </div>
      )}

      {/* ── Charts grid ── */}
      <div className={styles.chartsGrid}>
        {/* Type distribution */}
        <div className={styles.chartCard}>
          <h4 className={styles.chartTitle}>Tipos de Cena</h4>
          <div className={styles.chartBody}>
            <DonutChart segments={typeDistribution} />
            <div className={styles.chartLegend}>
              {typeDistribution.map(d => (
                <div key={d.label} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: d.color }} />
                  <span className={styles.legendLabel}>{d.label}</span>
                  <span className={styles.legendValue}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INT vs EXT */}
        <div className={styles.chartCard}>
          <h4 className={styles.chartTitle}>Interior / Exterior</h4>
          <div className={styles.chartBody}>
            <DonutChart segments={intExtRatio} size={80} thickness={12} />
            <div className={styles.chartLegend}>
              {intExtRatio.map(d => (
                <div key={d.label} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: d.color }} />
                  <span className={styles.legendLabel}>{d.label}</span>
                  <span className={styles.legendValue}>{d.value} ({allScenes.length > 0 ? Math.round((d.value / allScenes.length) * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cenas por episódio */}
        {epDistribution.length > 1 && (
          <div className={styles.chartCard}>
            <h4 className={styles.chartTitle}>Cenas por Episódio</h4>
            <BarChartSVG data={epDistribution} width={260} height={100} />
          </div>
        )}

        {/* Carga por dia */}
        {dayLoad.length > 0 && (
          <div className={styles.chartCard} style={{ gridColumn: dayLoad.length > 6 ? '1 / -1' : undefined }}>
            <h4 className={styles.chartTitle}>Carga por Dia (min)</h4>
            <BarChartSVG data={dayLoad} width={Math.max(280, dayLoad.length * 36)} height={110} />
          </div>
        )}

        {/* Top actors */}
        {actorLoad.length > 0 && (
          <div className={styles.chartCard}>
            <h4 className={styles.chartTitle}>Actores + Activos</h4>
            <BarChartSVG data={actorLoad} width={280} height={100} />
          </div>
        )}

        {/* Top locations */}
        {locationLoad.length > 0 && (
          <div className={styles.chartCard}>
            <h4 className={styles.chartTitle}>Locais + Usados</h4>
            <BarChartSVG data={locationLoad} width={260} height={100} />
          </div>
        )}

        {/* Takes breakdown */}
        {takeStats.total > 0 && (
          <div className={styles.chartCard}>
            <h4 className={styles.chartTitle}>Takes</h4>
            <div className={styles.chartBody}>
              <DonutChart segments={[
                { value: takeStats.bom, color: 'var(--health-green)' },
                { value: takeStats.parcial, color: 'var(--health-yellow)' },
                { value: takeStats.repetir, color: '#F87171' },
              ]} size={80} thickness={12} />
              <div className={styles.chartLegend}>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--health-green)' }} /><span className={styles.legendLabel}>BOM</span><span className={styles.legendValue}>{takeStats.bom}</span></div>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--health-yellow)' }} /><span className={styles.legendLabel}>PARCIAL</span><span className={styles.legendValue}>{takeStats.parcial}</span></div>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#F87171' }} /><span className={styles.legendLabel}>REPETIR</span><span className={styles.legendValue}>{takeStats.repetir}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Timeline Map ── */}
      {shootingDays.length > 0 && (
        <div className={styles.timelineSection}>
          <h4 className={styles.chartTitle} style={{ marginBottom: 12 }}>Mapa de Rodagem</h4>
          <div className={styles.timelineScroll}>
            {shootingDays.map(day => {
              const ds = allScenes.filter(sc => sceneAssignments[sc.key] === day.id)
              const totalMin = ds.reduce((s, sc) => s + sc.duration, 0)
              const util = Math.round((totalMin / DAY_CAPACITY) * 100)
              const dayProg = progress.byDay[day.id]
              const locs = [...new Set(ds.map(sc => sc.location).filter(Boolean))]
              const types = {}
              ds.forEach(sc => { types[sc.type] = (types[sc.type] || 0) + 1 })
              const donePct = dayProg ? Math.round((dayProg.done / dayProg.total) * 100) : 0

              return (
                <div key={day.id} className={styles.timelineDay}>
                  <div className={styles.timelineDayHead}>
                    <span className={styles.timelineDayNum}>D{day.dayNumber}</span>
                    <span className={styles.timelineDayDate}>{formatDate(day.date)}</span>
                    {day.episodeNumber && <span className={styles.timelineDayEp}>Ep{String(day.episodeNumber).padStart(2, '0')}</span>}
                  </div>

                  {/* Utilization bar */}
                  <div className={styles.timelineUtil}>
                    <div className={styles.timelineUtilFill} style={{
                      width: `${Math.min(100, util)}%`,
                      background: util >= 90 ? '#F87171' : util >= 70 ? 'var(--health-yellow)' : 'var(--mod-production)',
                    }} />
                  </div>

                  {/* Scene type breakdown as colored blocks */}
                  <div className={styles.timelineBlocks}>
                    {ds.map(sc => {
                      const t = SCENE_TYPES[sc.type] || SCENE_TYPES.transição
                      const takes = sceneTakes[sc.key] || []
                      const done = takes.length > 0 && takes[takes.length - 1].status === 'bom'
                      return (
                        <div key={sc.key} className={styles.timelineBlock}
                          style={{
                            background: t.color,
                            opacity: done ? 0.35 : 0.85,
                            width: Math.max(6, (sc.duration / DAY_CAPACITY) * 140),
                          }}
                          title={`${sc.epId} #${sc.sceneNumber || sc.id} — ${t.label} ${sc.duration}min${done ? ' (filmada)' : ''}`} />
                      )
                    })}
                    {ds.length === 0 && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>vazio</span>}
                  </div>

                  <div className={styles.timelineMeta}>
                    <span>{ds.length} cenas</span>
                    <span>{totalMin}min</span>
                    <span>{util}%</span>
                  </div>

                  {locs.length > 0 && (
                    <div className={styles.timelineLocs}>
                      {locs.slice(0, 2).map(l => (
                        <span key={l} className={styles.timelineLoc}>{l.length > 15 ? l.slice(0, 14) + '…' : l}</span>
                      ))}
                      {locs.length > 2 && <span className={styles.timelineLoc}>+{locs.length - 2}</span>}
                    </div>
                  )}

                  {dayProg && dayProg.done > 0 && (
                    <div className={styles.timelineDone}>
                      <div className={styles.timelineDoneFill} style={{ width: `${donePct}%` }} />
                      <span>{dayProg.done}/{dayProg.total}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── VIRTUALIZED UNASSIGNED SCENES LIST ──────────────────────────
// ══════════════════════════════════════════════════════════════════
function VirtualUnassignedList({ allScenes, visibleUnassigned, unassigned, activeDay, assignScene, sceneTags }) {
  const unassignedRef = useRef(null)
  const [noDay, setNoDay] = useState(false)
  const virtualizer = useVirtualizer({
    count: visibleUnassigned.length,
    getScrollElement: () => unassignedRef.current,
    estimateSize: () => 68,
    overscan: 10,
  })

  // Reset scroll when filter changes
  useEffect(() => {
    virtualizer.scrollToOffset(0)
  }, [visibleUnassigned.length])

  if (allScenes.length === 0) {
    return (
      <div className={styles.unassignedList}>
        <div className={styles.emptyDays} style={{ padding: 'var(--space-8)' }}>
          <Film size={24} color="var(--text-muted)" />
          <p style={{ fontSize: 'var(--text-xs)', textAlign: 'center' }}>
            Carrega guiões em<br/>Análise de Guião
          </p>
        </div>
      </div>
    )
  }

  if (allScenes.length > 0 && unassigned.length === 0) {
    return (
      <div className={styles.unassignedList}>
        <div className={styles.allAssigned}>
          <CheckCircle size={20} color="var(--health-green)" />
          <p>Todas as cenas atribuídas!</p>
        </div>
      </div>
    )
  }

  if (unassigned.length > 0 && visibleUnassigned.length === 0) {
    return (
      <div className={styles.unassignedList}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--space-4)' }}>Sem resultados</p>
      </div>
    )
  }

  return (
    <div ref={unassignedRef} className={styles.unassignedList}>
      {noDay && (
        <div style={{
          padding: '6px 10px', fontSize: 'var(--text-xs)', fontWeight: 600,
          color: 'var(--health-red)', background: 'rgba(248,113,113,0.1)',
          borderRadius: 'var(--radius-sm)', margin: '0 var(--space-2) var(--space-2)',
          textAlign: 'center',
        }}>
          Selecciona um dia primeiro!
        </div>
      )}
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map(vRow => {
          const sc = visibleUnassigned[vRow.index]
          return (
            <div
              key={sc.key}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vRow.start}px)` }}
              ref={virtualizer.measureElement}
              data-index={vRow.index}
            >
              <button className={styles.unassignedCard}
                style={{ width: '100%', marginBottom: 4 }}
                onClick={() => {
                  if (!activeDay) { setNoDay(true); setTimeout(() => setNoDay(false), 3000); return }
                  assignScene(sc.key, activeDay.id)
                }}>
                <div className={styles.unassignedTop}>
                  <span className={styles.unassignedEp}>{sc.epId}</span>
                  <span className={styles.unassignedNum}>#{sc.sceneNumber || sc.id}</span>
                  <TypeBadge type={sc.type} />
                  <span className={styles.unassignedDur}>{sc.duration}m</span>
                </div>
                <div className={styles.unassignedLoc}><MapPin size={10} /> {sc.location || '—'}</div>
                {(sc.characters || []).length > 0 && (
                  <div className={styles.unassignedChars}>
                    {sc.characters.slice(0, 3).map(c => <span key={c} className={styles.charChip}>{c}</span>)}
                    {sc.characters.length > 3 && <span className={styles.charMore}>+{sc.characters.length - 3}</span>}
                  </div>
                )}
                {(sceneTags[sc.key] || []).length > 0 && (
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                    {(sceneTags[sc.key] || []).map(tagId => {
                      const tag = SCENE_TAGS.find(t => t.id === tagId)
                      return tag ? (
                        <span key={tagId} style={{
                          fontSize: 9, padding: '1px 4px', borderRadius: 3,
                          background: tag.color + '22', color: tag.color,
                          fontWeight: 600, lineHeight: 1.3,
                        }}>
                          {tag.icon} {tag.label}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── STRIP BOARD ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
function StripBoard() {
  const { 
    parsedScripts, shootingDays, sceneAssignments, sceneTakes, sceneTags, sceneOrder,
    addShootingDay, removeShootingDay,
    assignScene, unassignScene, setSceneOrder, batchAssignScenes,
    projectName, team, scheduleMode, scheduleBudgetEnvelope,
    apiKey, locations,
   } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts, shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments, sceneTakes: s.sceneTakes, sceneTags: s.sceneTags, sceneOrder: s.sceneOrder, addShootingDay: s.addShootingDay, removeShootingDay: s.removeShootingDay, assignScene: s.assignScene, unassignScene: s.unassignScene, setSceneOrder: s.setSceneOrder, batchAssignScenes: s.batchAssignScenes, projectName: s.projectName, team: s.team, scheduleMode: s.scheduleMode, scheduleBudgetEnvelope: s.scheduleBudgetEnvelope, apiKey: s.apiKey, locations: s.locations })))

  const [selectedDay, setSelectedDay]   = useState(null)
  const [addingDay, setAddingDay]       = useState(false)
  const [showSetup, setShowSetup]       = useState(false)
  const [newDay, setNewDay]             = useState({ date: '', label: '', callTime: '08:00', notes: '' })
  const [search, setSearch]             = useState('')
  const [aiDistributing, setAiDistributing] = useState(false)
  const [aiResult, setAiResult]         = useState(null)

  const allScenes = useAllScenes()
  const progress = useProgress(allScenes)

  const unassigned = allScenes.filter(sc => !sceneAssignments[sc.key])
  const visibleUnassigned = search
    ? unassigned.filter(sc => (sc.location || '').toLowerCase().includes(search.toLowerCase()) ||
        (sc.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (sc.characters || []).some(c => c.toLowerCase().includes(search.toLowerCase())))
    : unassigned

  // Stats por dia
  const dayStats = useMemo(() => {
    const stats = {}
    shootingDays.forEach(day => {
      const ds = allScenes.filter(sc => sceneAssignments[sc.key] === day.id)
      const totalMin = ds.reduce((s, sc) => s + sc.duration, 0)
      stats[day.id] = {
        count: ds.length,
        totalMin,
        utilization: Math.min(100, Math.round((totalMin / DAY_CAPACITY) * 100)),
        scenes: ds,
        locations: [...new Set(ds.map(sc => sc.location).filter(Boolean))],
        characters: [...new Set(ds.flatMap(sc => sc.characters || []))],
        hasAnchor: ds.some(sc => sc.type === 'âncora'),
        hasExt: ds.some(sc => sc.intExt === 'EXT'),
      }
    })
    return stats
  }, [shootingDays, allScenes, sceneAssignments])

  const totalAssigned = allScenes.filter(sc => sceneAssignments[sc.key]).length

  const handleAddDay = () => {
    if (!newDay.date) return
    addShootingDay({
      id: `day_${Date.now()}`, date: newDay.date,
      label: newDay.label || `Dia ${shootingDays.length + 1}`,
      callTime: newDay.callTime || '08:00', notes: newDay.notes,
      dayNumber: shootingDays.length + 1,
    })
    setNewDay({ date: '', label: '', callTime: '08:00', notes: '' }); setAddingDay(false)
  }

  const handleAutoSchedule = () => {
    if (!shootingDays.length) return
    const result = runScheduleEngine({
      parsedScripts, days: shootingDays, existingAssignments: {},
      team, mode: scheduleMode || 'creative', envelope: scheduleBudgetEnvelope,
      respectExisting: false,
    })
    batchAssignScenes(result.assignments)
  }

  const handleUnassignAll = () => {
    if (!window.confirm('Limpar todas as atribuições de dias?')) return
    batchAssignScenes({})
  }

  const handleAIDistribute = async () => {
    if (!apiKey || !shootingDays.length || aiDistributing) return
    setAiDistributing(true)
    setAiResult(null)
    try {
      const scenesForAI = unassigned.map(sc => ({
        sceneKey: sc.key,
        episodeId: sc.epId,
        sceneNumber: sc.sceneNumber || sc.id,
        location: sc.location || 'SEM LOCAL',
        intExt: sc.intExt || 'INT',
        dayNight: sc.dayNight || (sc.timeOfDay === 'NIGHT' ? 'NOITE' : 'DIA'),
        characters: sc.characters || [],
        type: sc.type,
        durationMin: sc.duration,
        tags: sceneTags[sc.key] || sc.autoTags || [],
        synopsis: (sc.description || sc.synopsis || '').slice(0, 120),
      }))

      if (scenesForAI.length === 0) {
        setAiResult({ ok: true, count: 0, msg: 'Todas as cenas já estão atribuídas.' })
        setAiDistributing(false)
        return
      }

      const daysForAI = shootingDays.map(d => {
        const assigned = allScenes.filter(sc => sceneAssignments[sc.key] === d.id)
        const usedMin = assigned.reduce((s, sc) => s + sc.duration, 0)
        return {
          dayId: d.id,
          dayNumber: d.dayNumber,
          date: d.date,
          label: d.label,
          assignedCount: assigned.length,
          usedMinutes: usedMin,
          capacityMinutes: DAY_CAPACITY,
          assignedLocations: [...new Set(assigned.map(sc => sc.location).filter(Boolean))],
        }
      })

      const locsForAI = (locations || []).map(l => ({
        name: l.name,
        address: l.address || '',
        available: l.status !== 'recusado',
      }))

      const userPrompt = `Distribui estas ${scenesForAI.length} cenas não atribuídas pelos ${daysForAI.length} dias de rodagem disponíveis. Optimiza por:
1. Agrupar cenas do mesmo local no mesmo dia (reduz mudanças de set)
2. Agrupar cenas com os mesmos actores (reduz convocatórias)
3. Respeitar INT/EXT e dia/noite (agrupar EXT de dia, EXT de noite, etc.)
4. Equilibrar a carga de trabalho entre dias (capacidade: ${DAY_CAPACITY} min/dia)
5. Manter continuidade narrativa quando possível (cenas do mesmo episódio juntas)
6. Agrupar cenas com características especiais (croma, stunts, crianças, etc.) no mesmo dia quando possível

CENAS NÃO ATRIBUÍDAS:
${JSON.stringify(scenesForAI, null, 1)}

DIAS DE RODAGEM (com carga actual):
${JSON.stringify(daysForAI, null, 1)}

LOCAIS DO PROJECTO:
${JSON.stringify(locsForAI, null, 1)}

Responde APENAS com JSON válido, sem markdown:
{"assignments": [{"sceneKey": "EP01-SC003", "dayId": "day_xxx"}, ...]}`

      const response = await fetchAPI({
        apiKey,
        system: 'És um assistente de produção audiovisual especializado em planeamento de rodagens. Distribui cenas pelos dias de rodagem de forma óptima. Respondes APENAS com JSON válido.',
        messages: [{ role: 'user', content: userPrompt }],
        maxTokens: 2500,
        cache: true,
      })

      // Parse JSON — handle possible markdown wrapping
      let json
      try {
        const cleaned = response.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim()
        json = JSON.parse(cleaned)
      } catch {
        throw new Error('Resposta da API não é JSON válido')
      }

      if (!json.assignments || !Array.isArray(json.assignments)) {
        throw new Error('Formato de resposta inválido — falta "assignments"')
      }

      // Validate and apply
      const validDayIds = new Set(shootingDays.map(d => d.id))
      const validSceneKeys = new Set(unassigned.map(sc => sc.key))
      let applied = 0

      json.assignments.forEach(({ sceneKey: sk, dayId }) => {
        if (validSceneKeys.has(sk) && validDayIds.has(dayId)) {
          assignScene(sk, dayId)
          applied++
        }
      })

      setAiResult({ ok: true, count: applied, msg: `${applied} cenas distribuídas por IA.` })
    } catch (err) {
      console.error('AI Distribute error:', err)
      setAiResult({ ok: false, count: 0, msg: err.message || 'Erro na distribuição AI' })
    } finally {
      setAiDistributing(false)
    }
  }

  const activeDay = shootingDays.find(d => d.id === selectedDay)
  const dayScenes = useMemo(() =>
    activeDay ? allScenes.filter(sc => sceneAssignments[sc.key] === activeDay.id) : [],
    [activeDay, allScenes, sceneAssignments]
  )
  const sortedDayScenes = useSortedScenes(dayScenes, selectedDay)

  const handleMoveScene = useCallback((sk, dir) => {
    const order = sceneOrder[selectedDay] || dayScenes.map(s => s.key)
    const idx = order.indexOf(sk)
    if (idx < 0) return
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= order.length) return
    const newOrder = [...order]
    ;[newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]]
    setSceneOrder(selectedDay, newOrder)
  }, [selectedDay, sceneOrder, dayScenes, setSceneOrder])

  // If no days exist, show ScheduleSetup
  if (shootingDays.length === 0 && !showSetup) {
    return (
      <div style={{ flex: 1, display: 'flex' }}>
        <ScheduleSetup />
      </div>
    )
  }

  return (
    <div className={styles.stripRoot}>
      {/* ── Painel esquerdo: dias ── */}
      <div className={styles.dayPanel}>
        <div className={styles.dayPanelHeader}>
          <div>
            <span className={styles.dayPanelTitle}>{projectName}</span>
            <span className={styles.dayPanelSub}>
              {shootingDays.length} dias · {totalAssigned}/{allScenes.length} cenas
              {progress.shot > 0 && ` · ${progress.pct}% filmado`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {allScenes.length > 0 && shootingDays.length > 0 && (
              <>
                <button className={styles.btnAuto} onClick={handleAutoSchedule} title="Auto-distribuir cenas por dias">
                  <Zap size={13} /> Auto
                </button>
                <button
                  className={styles.btnAI}
                  onClick={handleAIDistribute}
                  disabled={aiDistributing || !apiKey || unassigned.length === 0}
                  title={!apiKey ? 'Configura a API key primeiro' : unassigned.length === 0 ? 'Sem cenas por atribuir' : 'Distribuir cenas com IA'}
                >
                  {aiDistributing ? <Loader size={13} className={styles.spin} /> : <Sparkles size={13} />}
                  {aiDistributing ? 'A distribuir…' : 'AI Distribuir'}
                </button>
              </>
            )}
            <button className={styles.btnIconSm} onClick={() => setAddingDay(true)} title="Novo dia">
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Progresso geral */}
        {progress.total > 0 && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress.pct}%` }} />
            <span className={styles.progressLabel}>{progress.shot}/{progress.total} filmadas ({progress.pct}%)</span>
          </div>
        )}

        {/* AI result toast */}
        {aiResult && (
          <div className={styles.aiToast} style={{ background: aiResult.ok ? 'var(--health-green)' : 'var(--health-red)' }}>
            <span>{aiResult.msg}</span>
            <button onClick={() => setAiResult(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginLeft: 8 }}><X size={12} /></button>
          </div>
        )}

        {/* Adicionar dia */}
        <AnimatePresence>
          {addingDay && (
            <motion.div className={styles.addDayForm}
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div style={{ display: 'flex', gap: 8, padding: 'var(--space-3)', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="date" className={styles.inputSm} value={newDay.date}
                    onChange={e => setNewDay(v => ({ ...v, date: e.target.value }))} style={{ flex: 1 }} />
                  <input type="time" className={styles.inputSm} value={newDay.callTime}
                    onChange={e => setNewDay(v => ({ ...v, callTime: e.target.value }))} style={{ width: 80 }} />
                </div>
                <input className={styles.inputSm} placeholder="Etiqueta (ex: Escola EP01)" value={newDay.label}
                  onChange={e => setNewDay(v => ({ ...v, label: e.target.value }))} />
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button className={styles.btnCancelSm} onClick={() => setAddingDay(false)}>Cancelar</button>
                  <button className={styles.btnConfirmSm} onClick={handleAddDay} disabled={!newDay.date}>
                    <Plus size={12} /> Dia
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de dias */}
        <div className={styles.dayList}>
          {shootingDays.map(day => {
            const s = dayStats[day.id] || { utilization: 0, count: 0, totalMin: 0, hasAnchor: false }
            const active = selectedDay === day.id
            const util = s.utilization
            const dayProg = progress.byDay[day.id]
            return (
              <button key={day.id}
                className={`${styles.dayBtn} ${active ? styles.dayBtnActive : ''}`}
                onClick={() => setSelectedDay(active ? null : day.id)}>
                <div className={styles.dayBtnRow}>
                  <span className={styles.dayBtnNum}>D{day.dayNumber}</span>
                  <span className={styles.dayBtnDate}>{formatDate(day.date)}</span>
                  {dayProg && dayProg.done > 0 && (
                    <span className={styles.dayProgressBadge}>
                      {dayProg.done}/{dayProg.total}
                    </span>
                  )}
                  <span className={styles.dayBtnUtil} style={{ color: util >= 85 ? 'var(--health-yellow)' : util >= 60 ? 'var(--health-green)' : 'var(--text-muted)' }}>
                    {util}%
                  </span>
                  <button className={styles.removeDayBtn}
                    onClick={e => { e.stopPropagation(); if (window.confirm('Remover dia?')) removeShootingDay(day.id) }}>
                    <X size={11} />
                  </button>
                </div>
                {day.label && <div className={styles.dayBtnLabel}>{day.label}</div>}
                <div className={styles.dayBtnLabel} style={{ opacity: 0.6 }}>
                  {day.callTime && `Call ${day.callTime} · `}{s.count} cenas · {s.totalMin}min
                </div>
                <div className={styles.utilBar}>
                  <div className={styles.utilFill} style={{
                    width: `${util}%`,
                    background: util >= 90 ? '#F87171' : util >= 70 ? 'var(--health-yellow)' : 'var(--mod-production)',
                  }} />
                </div>
              </button>
            )
          })}

          {shootingDays.length > 0 && totalAssigned > 0 && (
            <button className={styles.clearBtn} onClick={handleUnassignAll}>
              <RefreshCw size={11} /> Limpar atribuições
            </button>
          )}
        </div>
      </div>

      {/* ── Painel central: detalhe do dia seleccionado ── */}
      <div className={styles.dayDetail}>
        {!activeDay ? (
          <div className={styles.dayDetailEmpty}>
            <Film size={32} color="var(--text-muted)" />
            <p>Selecciona um dia para ver e gerir as cenas atribuídas</p>
            {Object.keys(parsedScripts).length === 0 && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Carrega guiões em Análise de Guião primeiro
              </p>
            )}
          </div>
        ) : (
          <>
            <div className={styles.dayDetailHeader}>
              <div>
                <h3 className={styles.dayDetailTitle}>D{activeDay.dayNumber} · {formatDate(activeDay.date)}</h3>
                <div className={styles.dayDetailMeta}>
                  <span><Clock size={12} /> Call {activeDay.callTime}</span>
                  {dayStats[activeDay.id]?.locations.map(l => (
                    <span key={l}><MapPin size={12} /> {l}</span>
                  ))}
                  {dayStats[activeDay.id]?.characters.length > 0 && (
                    <span><Users size={12} /> {dayStats[activeDay.id].characters.length} actores</span>
                  )}
                </div>
              </div>
              <div className={styles.dayDetailStats}>
                {progress.byDay[activeDay.id] && (
                  <span className={styles.statChip} style={{
                    color: progress.byDay[activeDay.id].done === progress.byDay[activeDay.id].total && progress.byDay[activeDay.id].total > 0
                      ? 'var(--health-green)' : 'var(--text-secondary)',
                  }}>
                    {progress.byDay[activeDay.id].done}/{progress.byDay[activeDay.id].total} filmadas
                  </span>
                )}
                <span className={styles.statChip} style={{ background: 'var(--mod-production)22', color: 'var(--mod-production)' }}>
                  {dayStats[activeDay.id]?.totalMin || 0}min
                </span>
                <span className={styles.statChip} style={{ color: dayStats[activeDay.id]?.utilization >= 85 ? '#F87171' : 'var(--health-green)' }}>
                  {dayStats[activeDay.id]?.utilization || 0}%
                </span>
              </div>
            </div>

            {activeDay.notes && (
              <div className={styles.dayNotes}>
                <AlertTriangle size={13} color="var(--health-yellow)" /> {activeDay.notes}
              </div>
            )}

            <div className={styles.sceneStrips}>
              {sortedDayScenes.length === 0 && (
                <div className={styles.emptyStrips}>
                  <p>Nenhuma cena atribuída a este dia</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Clica numa cena não atribuída (painel direito) para a atribuir aqui
                  </p>
                </div>
              )}
              {sortedDayScenes.map((sc, idx) => (
                <SceneStrip key={sc.key} scene={sc} idx={idx}
                  onUnassign={() => unassignScene(sc.key)}
                  onMoveUp={() => handleMoveScene(sc.key, -1)}
                  onMoveDown={() => handleMoveScene(sc.key, 1)}
                  isFirst={idx === 0}
                  isLast={idx === sortedDayScenes.length - 1}
                  shotStatus={(() => {
                    const takes = sceneTakes[sc.key] || []
                    return takes.length > 0 ? takes[takes.length - 1].status : null
                  })()}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Painel direito: cenas não atribuídas ── */}
      <div className={styles.unassignedPanel}>
        <div className={styles.unassignedHeader}>
          <span className={styles.unassignedTitle}>Não atribuídas</span>
          <span className={styles.unassignedCount}>{unassigned.length}</span>
        </div>
        {allScenes.length > 0 && (
          <input className={styles.inputSm} placeholder="Filtrar…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ margin: 'var(--space-2) var(--space-3)', width: 'calc(100% - var(--space-6))' }} />
        )}
        <VirtualUnassignedList
          allScenes={allScenes}
          visibleUnassigned={visibleUnassigned}
          unassigned={unassigned}
          activeDay={activeDay}
          assignScene={assignScene}
          sceneTags={sceneTags}
        />
      </div>
    </div>
  )
}

// ── Strip de cena no dia ──────────────────────────────────────────
const SceneStrip = memo(function SceneStrip({ scene, idx, onUnassign, onMoveUp, onMoveDown, isFirst, isLast, shotStatus }) {
  const [open, setOpen] = useState(false)
  const sceneTags = useStore(s => s.sceneTags)
  const t = SCENE_TYPES[scene.type] || SCENE_TYPES.transição
  const isDone = shotStatus === 'bom'
  const statusInfo = shotStatus ? TAKE_STATUS[shotStatus] : null

  return (
    <motion.div
      className={`${styles.strip} ${isDone ? styles.stripDone : ''}`}
      style={{ borderLeft: `4px solid ${t.color}` }}
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.03 }}>
      <div className={styles.stripTop} onClick={() => setOpen(!open)}>
        <div className={styles.stripLeft}>
          <span className={styles.stripNum}>{idx + 1}</span>
          <TypeBadge type={scene.type} />
          <span className={styles.stripEp}>{scene.epId} #{scene.sceneNumber || scene.id}</span>
          {scene.type === 'âncora' && <Star size={12} color={t.color} fill={t.color} />}
          {statusInfo && (
            <span className={styles.stripStatus} style={{ color: statusInfo.color }}>
              {statusInfo.label}
            </span>
          )}
        </div>
        <div className={styles.stripRight}>
          <span className={styles.stripIntExt} style={{ color: scene.intExt === 'EXT' ? '#F5A623' : 'var(--text-muted)' }}>
            {scene.intExt}
          </span>
          <span className={styles.stripDur}>{scene.duration}min</span>
          <div className={styles.stripActions}>
            {!isFirst && (
              <button className={styles.moveBtn} onClick={e => { e.stopPropagation(); onMoveUp() }} title="Mover para cima">
                <ArrowUp size={11} />
              </button>
            )}
            {!isLast && (
              <button className={styles.moveBtn} onClick={e => { e.stopPropagation(); onMoveDown() }} title="Mover para baixo">
                <ArrowDown size={11} />
              </button>
            )}
            <button className={styles.removeDayBtn} onClick={e => { e.stopPropagation(); onUnassign() }} title="Remover do dia">
              <X size={11} />
            </button>
          </div>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
      </div>
      <div className={styles.stripLoc}><MapPin size={11} /> {scene.location || '—'}</div>
      {(sceneTags[scene.key] || []).length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', padding: '2px 8px 0' }}>
          {(sceneTags[scene.key] || []).map(tagId => {
            const tag = SCENE_TAGS.find(t => t.id === tagId)
            return tag ? (
              <span key={tagId} style={{
                fontSize: 9, padding: '1px 4px', borderRadius: 3,
                background: tag.color + '22', color: tag.color,
                fontWeight: 600, lineHeight: 1.3,
              }}>
                {tag.icon} {tag.label}
              </span>
            ) : null
          })}
        </div>
      )}
      <AnimatePresence>
        {open && (
          <motion.div className={styles.stripDetail}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {scene.description && <p className={styles.stripDesc}>{scene.description}</p>}
            {(scene.characters || []).length > 0 && (
              <div className={styles.stripChars}>
                {scene.characters.map(c => <span key={c} className={styles.charChip}>{c}</span>)}
              </div>
            )}
            {scene.timeOfDay && <span className={styles.stripTime}>{scene.timeOfDay === 'DIA' ? <Sun size={11}/> : <Moon size={11}/>} {scene.timeOfDay}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

// ══════════════════════════════════════════════════════════════════
// ── SCRIPT EM TEMPO REAL ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
function ScriptRT() {
  const { 
    parsedScripts, sceneTakes, addTake, updateTake, removeTake,
    shootingDays, sceneAssignments, sceneOrder,
    addDepartmentItem,
   } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts, sceneTakes: s.sceneTakes, addTake: s.addTake, updateTake: s.updateTake, removeTake: s.removeTake, shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments, sceneOrder: s.sceneOrder, addDepartmentItem: s.addDepartmentItem })))

  const [mode, setMode]                 = useState('day')
  const [selectedDay, setSelectedDay]   = useState(() => shootingDays[0]?.id || null)
  const [activeEp, setActiveEp]         = useState(() => Object.keys(parsedScripts)[0] || null)
  const [activeScene, setActiveScene]   = useState(null)
  const [takeNote, setTakeNote]         = useState('')
  const [editingTake, setEditingTake]   = useState(null) // { sceneKey, takeId, notes }
  const [takePhotos, setTakePhotos]     = useState([]) // base64 photos pending for next take
  const [viewPhoto, setViewPhoto]       = useState(null)
  const photoInputRef = useRef(null)

  const allScenes = useAllScenes()

  const scenes = useMemo(() => {
    if (mode === 'day' && selectedDay) {
      const dayScenes = allScenes.filter(sc => sceneAssignments[sc.key] === selectedDay)
      const order = sceneOrder[selectedDay] || []
      if (order.length > 0) {
        const orderMap = Object.fromEntries(order.map((k, i) => [k, i]))
        return [...dayScenes].sort((a, b) => (orderMap[a.key] ?? 999) - (orderMap[b.key] ?? 999))
      }
      return dayScenes
    }
    if (mode === 'episode' && activeEp) {
      return (parsedScripts[activeEp]?.scenes || []).map(sc => ({
        ...sc,
        key: sceneKey(activeEp, sc),
        epId: activeEp,
        type: classifyScene(sc),
        duration: SCENE_TYPES[classifyScene(sc)]?.duration || 45,
      }))
    }
    return []
  }, [mode, selectedDay, activeEp, allScenes, sceneAssignments, sceneOrder, parsedScripts])

  const episodes = Object.keys(parsedScripts)
  const activeDay = shootingDays.find(d => d.id === selectedDay)

  const getSceneTakes = (sc) => sceneTakes[sc.key] || []
  const getSceneStatus = (sc) => {
    const takes = getSceneTakes(sc)
    if (!takes.length) return null
    return takes[takes.length - 1].status
  }

  const handlePhotoCapture = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (ev) => setTakePhotos(prev => [...prev, ev.target.result])
      reader.readAsDataURL(file)
    })
    if (photoInputRef.current) photoInputRef.current.value = ''
  }, [])

  const recordTake = (sc, status) => {
    const photos = [...takePhotos]
    addTake(sc.key, {
      id: Date.now(), status, notes: takeNote.trim(),
      timestamp: new Date().toISOString(),
      photos: photos.length > 0 ? photos : undefined,
    })

    // Auto-create department item for each photo
    if (photos.length > 0 && addDepartmentItem) {
      const deptGuess = takeNote.toLowerCase().includes('cabelo') || takeNote.toLowerCase().includes('hair') ? 'hair'
        : takeNote.toLowerCase().includes('maq') || takeNote.toLowerCase().includes('makeup') ? 'makeup'
        : takeNote.toLowerCase().includes('décor') || takeNote.toLowerCase().includes('set') ? 'art'
        : takeNote.toLowerCase().includes('adereço') || takeNote.toLowerCase().includes('prop') ? 'props'
        : 'wardrobe'

      addDepartmentItem({
        name: `Take ${sc.epId} #${sc.sceneNumber || sc.id} — ${takeNote.trim() || status}`,
        department: deptGuess,
        characterName: (sc.characters || [])[0] || '',
        locationName: sc.location || '',
        scenes: [sc.key],
        photos,
        notes: `Capturado em rodagem · ${status.toUpperCase()} · ${new Date().toLocaleString('pt-PT')}`,
        approved: false,
        episodeBlock: sc.epId || '',
      })
    }

    setTakeNote('')
    setTakePhotos([])
    if (status === 'bom') {
      const currentIdx = scenes.findIndex(s => s.key === sc.key)
      if (currentIdx >= 0 && currentIdx < scenes.length - 1) {
        setActiveScene(currentIdx + 1)
      }
    }
  }

  const handleDeleteTake = (sceneKey, takeId) => {
    if (!window.confirm('Apagar este take?')) return
    removeTake(sceneKey, takeId)
  }

  const handleEditTake = (sceneKey, takeId, notes) => {
    setEditingTake({ sceneKey, takeId, notes })
  }

  const handleSaveEditTake = () => {
    if (!editingTake) return
    updateTake(editingTake.sceneKey, editingTake.takeId, { notes: editingTake.notes })
    setEditingTake(null)
  }

  const doneCount = scenes.filter(sc => getSceneStatus(sc) === 'bom').length
  const totalCount = scenes.length

  return (
    <div className={styles.rtRoot}>
      <div className={styles.rtHeader}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 2, marginRight: 8 }}>
            <button className={`${styles.epPill} ${mode === 'day' ? styles.epPillActive : ''}`}
              onClick={() => { setMode('day'); setActiveScene(null) }}>
              <Calendar size={11} /> Dia
            </button>
            <button className={`${styles.epPill} ${mode === 'episode' ? styles.epPillActive : ''}`}
              onClick={() => { setMode('episode'); setActiveScene(null) }}>
              <Film size={11} /> Episódio
            </button>
          </div>

          {mode === 'day' && shootingDays.map(d => (
            <button key={d.id}
              className={`${styles.epPill} ${selectedDay === d.id ? styles.epPillActive : ''}`}
              onClick={() => { setSelectedDay(d.id); setActiveScene(null) }}>
              D{d.dayNumber}
            </button>
          ))}

          {mode === 'episode' && episodes.map(ep => (
            <button key={ep}
              className={`${styles.epPill} ${activeEp === ep ? styles.epPillActive : ''}`}
              onClick={() => { setActiveEp(ep); setActiveScene(null) }}>
              {ep}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {totalCount > 0 && (
            <div className={styles.rtProgressBar}>
              <div className={styles.rtProgressFill} style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }} />
            </div>
          )}
          <span className={styles.rtSubtitle}>
            {doneCount}/{totalCount} concluídas
            {mode === 'day' && activeDay && ` · D${activeDay.dayNumber}`}
          </span>
        </div>
      </div>

      {scenes.length === 0 ? (
        <div className={styles.emptyDays} style={{ flex: 1, justifyContent: 'center' }}>
          <Film size={32} color="var(--text-muted)" />
          <p>{mode === 'day'
            ? (shootingDays.length === 0 ? 'Adiciona dias de rodagem no Strip Board' : 'Sem cenas atribuídas a este dia')
            : 'Carrega guiões em Análise de Guião'
          }</p>
        </div>
      ) : (
        <div className={styles.rtBody}>
          <div className={styles.rtSceneList}>
            {scenes.map((sc, i) => {
              const status = getSceneStatus(sc)
              const takes = getSceneTakes(sc)
              const ts = status ? TAKE_STATUS[status] : null
              const active = activeScene === i
              return (
                <button key={sc.key}
                  className={`${styles.rtSceneRow} ${active ? styles.rtSceneRowActive : ''} ${status === 'bom' ? styles.rtSceneDone : ''}`}
                  onClick={() => setActiveScene(active ? null : i)}>
                  <div className={styles.rtSceneTop}>
                    <span className={styles.rtSceneNum}>#{sc.sceneNumber || sc.id}</span>
                    <span className={styles.rtSceneLoc}>{sc.location || '—'}</span>
                    {ts && (
                      <span className={styles.rtStatusPill} style={{ color: ts.color, borderColor: ts.color + '44', background: ts.color + '11' }}>
                        {ts.label}
                      </span>
                    )}
                    {takes.length > 0 && (
                      <span className={styles.takeCount}>{takes.length}T</span>
                    )}
                  </div>
                  {(sc.characters || []).length > 0 && (
                    <div className={styles.rtSceneChars}>
                      {sc.characters.slice(0, 4).map(c => <span key={c}>{c}</span>)}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className={styles.rtTakePanel}>
            {activeScene === null ? (
              <div className={styles.rtTakeEmpty}>
                <Play size={28} color="var(--text-muted)" />
                <p>Selecciona uma cena para registar takes</p>
              </div>
            ) : (() => {
              const sc = scenes[activeScene]
              if (!sc) return null
              const takes = getSceneTakes(sc)
              const type = sc.type || classifyScene(sc)
              const t = SCENE_TYPES[type]
              return (
                <div className={styles.rtTakeContent}>
                  <div className={styles.rtTakeHeader} style={{ borderBottom: `3px solid ${t.color}` }}>
                    <h3>Cena #{sc.sceneNumber || sc.id}</h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <TypeBadge type={type} />
                      <span className={styles.rtTakeLoc}><MapPin size={11} /> {sc.location}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{sc.duration}min est.</span>
                    </div>
                    {(sc.characters || []).length > 0 && (
                      <div className={styles.rtTakeChars}>
                        {sc.characters.map(c => <span key={c} className={styles.charChip}>{c}</span>)}
                      </div>
                    )}
                    {(sc.description || sc.synopsis) && <p className={styles.rtTakeDesc}>{sc.description || sc.synopsis}</p>}
                  </div>

                  <div className={styles.rtTakeLog}>
                    <span className={styles.rtTakeLogTitle}>TAKES ({takes.length})</span>
                    {takes.map((tk, ti) => {
                      const ts = TAKE_STATUS[tk.status]
                      const isEditing = editingTake?.takeId === tk.id
                      return (
                        <div key={tk.id} className={styles.rtTakeRow}>
                          <span className={styles.rtTakeN}>T{ti + 1}</span>
                          <span style={{ color: ts.color, fontWeight: 700, fontSize: 'var(--text-xs)' }}>{ts.label}</span>
                          {isEditing ? (
                            <input className={styles.rtTakeEditInput}
                              value={editingTake.notes}
                              onChange={e => setEditingTake(prev => ({ ...prev, notes: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveEditTake(); if (e.key === 'Escape') setEditingTake(null) }}
                              autoFocus />
                          ) : (
                            tk.notes && <span className={styles.rtTakeNote}>{tk.notes}</span>
                          )}
                          {(tk.photos || []).length > 0 && (
                            <div style={{ display: 'flex', gap: 3 }}>
                              {tk.photos.map((p, pi) => (
                                <img key={pi} src={p} alt="" onClick={(e) => { e.stopPropagation(); setViewPhoto(p) }}
                                  style={{ width: 24, height: 24, borderRadius: 3, objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border-subtle)' }} />
                              ))}
                            </div>
                          )}
                          <span className={styles.rtTakeTime}>
                            {tk.timestamp ? new Date(tk.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          <div className={styles.rtTakeRowActions}>
                            {isEditing ? (
                              <button className={styles.moveBtn} onClick={handleSaveEditTake} title="Guardar">
                                <Check size={11} />
                              </button>
                            ) : (
                              <button className={styles.moveBtn} onClick={() => handleEditTake(sc.key, tk.id, tk.notes || '')} title="Editar nota">
                                <Edit3 size={10} />
                              </button>
                            )}
                            <button className={styles.moveBtn} onClick={() => handleDeleteTake(sc.key, tk.id)} title="Apagar take"
                              style={{ color: '#F87171' }}>
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {takes.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', padding: 'var(--space-4)' }}>Sem takes registados</p>}
                  </div>

                  <div className={styles.rtTakeActions}>
                    {/* Pending photos preview */}
                    {takePhotos.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: 'var(--mod-departments)', fontWeight: 700 }}>
                          <Camera size={11} /> {takePhotos.length} foto{takePhotos.length > 1 ? 's' : ''} — será enviada para Departamentos
                        </span>
                        {takePhotos.map((p, i) => (
                          <div key={i} style={{ position: 'relative' }}>
                            <img src={p} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
                            <button onClick={() => setTakePhotos(prev => prev.filter((_, pi) => pi !== i))}
                              style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>
                              <X size={8} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <SmartInput value={takeNote}
                          onChange={e => setTakeNote(e.target.value)}
                          placeholder="Nota (opcional)…" rows={2}
                          context="Nota do take — observações de rodagem, indicações do realizador" />
                      </div>
                      <button className={styles.rtPhotoBtn}
                        onClick={() => photoInputRef.current?.click()}
                        title="Anexar foto (guarda-roupa, décor, continuidade…)">
                        <Camera size={16} />
                      </button>
                      <input ref={photoInputRef} type="file" accept="image/*" multiple capture="environment"
                        style={{ display: 'none' }} onChange={handlePhotoCapture} />
                    </div>

                    <div className={styles.rtTakeBtns}>
                      {Object.entries(TAKE_STATUS).map(([status, ts]) => {
                        const Icon = ts.icon
                        return (
                          <button key={status}
                            className={styles.rtTakeBtn}
                            style={{ background: ts.color + '22', color: ts.color, borderColor: ts.color + '44' }}
                            onClick={() => recordTake(sc, status)}>
                            <Icon size={14} /> {ts.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Photo lightbox */}
      <AnimatePresence>
        {viewPhoto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setViewPhoto(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
              zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
            <img src={viewPhoto} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── FOLHA DE SERVIÇO ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
function CallSheet() {
  const {  shootingDays, sceneAssignments, sceneOrder, parsedScripts, team, locations, projectName, sceneTakes  } = useStore(useShallow(s => ({ shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments, sceneOrder: s.sceneOrder, parsedScripts: s.parsedScripts, team: s.team, locations: s.locations, projectName: s.projectName, sceneTakes: s.sceneTakes })))
  const [selectedDay, setSelectedDay] = useState(shootingDays[0]?.id || null)

  const activeDay = shootingDays.find(d => d.id === selectedDay)
  const allScenes = useAllScenes()

  const dayScenes = useMemo(() => {
    if (!activeDay) return []
    const ds = allScenes.filter(sc => sceneAssignments[sc.key] === activeDay.id)
    const order = sceneOrder[activeDay.id] || []
    if (order.length > 0) {
      const orderMap = Object.fromEntries(order.map((k, i) => [k, i]))
      return [...ds].sort((a, b) => (orderMap[a.key] ?? 999) - (orderMap[b.key] ?? 999))
    }
    return ds
  }, [activeDay, allScenes, sceneAssignments, sceneOrder])

  const dayLocations = [...new Set(dayScenes.map(sc => sc.location).filter(Boolean))]
  const dayChars = [...new Set(dayScenes.flatMap(sc => sc.characters || []))]

  // Estimated schedule: accumulate durations from call time
  const sceneSchedule = useMemo(() => {
    if (!activeDay?.callTime) return []
    const [h, m] = activeDay.callTime?.split(':').map(Number)
    let currentMin = h * 60 + m
    return dayScenes.map(sc => {
      const start = currentMin
      currentMin += sc.duration
      return {
        ...sc,
        estStart: `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`,
        estEnd: `${String(Math.floor(currentMin / 60)).padStart(2, '0')}:${String(currentMin % 60).padStart(2, '0')}`,
      }
    })
  }, [activeDay, dayScenes])

  const totalMin = dayScenes.reduce((s, sc) => s + sc.duration, 0)
  const doneCount = dayScenes.filter(sc => {
    const takes = sceneTakes[sc.key] || []
    return takes.length > 0 && takes[takes.length - 1].status === 'bom'
  }).length

  return (
    <div className={styles.callRoot}>
      <div className={styles.callDayBar}>
        {shootingDays.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)' }}>
            Adiciona dias de rodagem no Strip Board
          </p>
        )}
        {shootingDays.map(d => (
          <button key={d.id}
            className={`${styles.callDayPill} ${selectedDay === d.id ? styles.callDayPillActive : ''}`}
            onClick={() => setSelectedDay(d.id)}>
            D{d.dayNumber} · {formatDate(d.date)}
          </button>
        ))}
      </div>

      {activeDay && (
        <div className={styles.callBody}>
          <div className={styles.callHeader}>
            <div>
              <h2 className={styles.callTitle}>{projectName}</h2>
              <p className={styles.callDate}>
                DIA {activeDay.dayNumber} · {formatDate(activeDay.date)} · Call {activeDay.callTime}
                {activeDay.episodeNumber && ` · Ep${String(activeDay.episodeNumber).padStart(2, '0')}`}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                {dayScenes.length} cenas · {totalMin}min estimados · {doneCount} filmadas
              </p>
            </div>
            <button className={styles.btnPrint} onClick={() => window.print()}>Imprimir</button>
          </div>

          <div className={styles.callGrid}>
            {/* Cenas com horário estimado */}
            <div className={styles.callSection} style={{ gridColumn: '1/-1' }}>
              <div className={styles.callSectionTitle}>Plano do Dia ({dayScenes.length} cenas)</div>
              {sceneSchedule.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Nenhuma cena atribuída</p>
                : sceneSchedule.map((sc, i) => {
                    const t = SCENE_TYPES[sc.type || classifyScene(sc)]
                    const takes = sceneTakes[sc.key] || []
                    const lastStatus = takes.length > 0 ? takes[takes.length - 1].status : null
                    return (
                      <div key={sc.key} className={styles.callSceneRow} style={{
                        borderLeft: `3px solid ${t.color}`,
                        opacity: lastStatus === 'bom' ? 0.5 : 1,
                      }}>
                        <span className={styles.callSceneTime}>{sc.estStart}</span>
                        <span className={styles.callSceneN}>{i + 1}. #{sc.sceneNumber || sc.id}</span>
                        <span className={styles.callSceneLoc}>{sc.location}</span>
                        <TypeBadge type={sc.type || classifyScene(sc)} />
                        <span className={styles.callSceneDur}>{t.duration}min</span>
                        <span className={styles.callSceneIntExt} style={{ color: sc.intExt === 'EXT' ? '#F5A623' : 'var(--text-muted)' }}>
                          {sc.intExt}
                        </span>
                        {(sc.characters || []).length > 0 && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {sc.characters.slice(0, 3).join(', ')}
                            {sc.characters.length > 3 && ` +${sc.characters.length - 3}`}
                          </span>
                        )}
                        {lastStatus && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: TAKE_STATUS[lastStatus]?.color, marginLeft: 'auto' }}>
                            {TAKE_STATUS[lastStatus]?.label}
                          </span>
                        )}
                      </div>
                    )
                  })
              }
            </div>

            {/* Locais */}
            <div className={styles.callSection}>
              <div className={styles.callSectionTitle}>Locais do Dia</div>
              {dayLocations.map(loc => {
                const locData = resolveLocation(locations, loc)
                return (
                  <div key={loc} className={styles.callLocRow}>
                    <MapPin size={13} color="var(--text-muted)" />
                    <div>
                      <div className={styles.callLocName}>{locData?.displayName || loc}</div>
                      {locData?.address && <div className={styles.callLocAddr}>{locData.address}</div>}
                      {locData?.contact && <div className={styles.callLocContact}>{locData.contact}</div>}
                    </div>
                  </div>
                )
              })}
              {dayLocations.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>—</p>}
            </div>

            {/* Elenco */}
            <div className={styles.callSection}>
              <div className={styles.callSectionTitle}>Elenco do Dia ({dayChars.length})</div>
              {dayChars.map(charName => {
                const actor = team.find(m => m.characterName === charName)
                return (
                  <div key={charName} className={styles.callActorRow}>
                    <span className={styles.callCharName}>{charName}</span>
                    {actor ? (
                      <>
                        <span className={styles.callActorName}>{actor.name}</span>
                        {actor.phone && <span className={styles.callActorPhone}>{actor.phone}</span>}
                      </>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Sem actor</span>}
                  </div>
                )
              })}
              {dayChars.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>—</p>}
            </div>

            {/* Equipa técnica do dia */}
            <div className={styles.callSection}>
              <div className={styles.callSectionTitle}>Equipa Técnica</div>
              {team.filter(m => m.group !== 'Elenco').map(m => (
                <div key={m.id} className={styles.callActorRow}>
                  <span className={styles.callCharName} style={{ color: 'var(--text-primary)' }}>{m.role || m.group}</span>
                  <span className={styles.callActorName}>{m.name}</span>
                  {m.phone && <span className={styles.callActorPhone}>{m.phone}</span>}
                </div>
              ))}
            </div>

            {activeDay.notes && (
              <div className={styles.callSection} style={{ gridColumn: '1/-1' }}>
                <div className={styles.callSectionTitle}>Notas</div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{activeDay.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helper ────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch { return dateStr }
}

// ── Módulo principal ──────────────────────────────────────────────
const TABS = [
  { id: 'stripboard', label: 'Strip Board',      icon: Calendar },
  { id: 'analytics',  label: 'Análise',          icon: BarChart3 },
  { id: 'schedule',   label: 'Schedule',         icon: CalendarDays },
  { id: 'script-rt',  label: 'Tempo Real',       icon: Radio },
  { id: 'callsheet',  label: 'Folha de Serviço', icon: FileText },
]

export function ProductionModule({ initialTab = 'stripboard' }) {
  const [activeTab, setActiveTab]   = useState(initialTab)
  const [openDayId, setOpenDayId]   = useState('')
  const {  projectName, parsedScripts, shootingDays, sceneTakes, sceneAssignments  } = useStore(useShallow(s => ({ projectName: s.projectName, parsedScripts: s.parsedScripts, shootingDays: s.shootingDays, sceneTakes: s.sceneTakes, sceneAssignments: s.sceneAssignments })))
  const totalScenes = Object.values(parsedScripts).reduce((s, d) => s + (d.scenes?.length || 0), 0)

  const shotCount = useMemo(() => {
    let count = 0
    Object.entries(sceneAssignments).forEach(([key]) => {
      const takes = sceneTakes[key] || []
      if (takes.length > 0 && takes[takes.length - 1].status === 'bom') count++
    })
    return count
  }, [sceneAssignments, sceneTakes])

  // Clicar num DayCard no Schedule → abre a Folha de Serviço desse dia
  const handleDaySelect = (dayId) => {
    setOpenDayId(dayId)
    setActiveTab('callsheet')
  }

  return (
    <div className={styles.module}>
      {/* ── Nav vertical à esquerda ── */}
      <div className={styles.layout}>
        <nav className={styles.sidenav}>
          <div className={styles.sidenavTitle}>
            <span className={styles.sidenavLabel}>Produção</span>
            <span className={styles.sidenavSub}>
              {totalScenes} cenas · {shootingDays.length} dias
              {shotCount > 0 && ` · ${shotCount} ✓`}
            </span>
          </div>
          {TABS.map(tab => (
            <button key={tab.id}
              className={`${styles.sidenavItem} ${activeTab === tab.id ? styles.sidenavItemActive : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              <tab.icon size={15} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* ── Conteúdo ── */}
        <div className={styles.sideContent}>
          {activeTab === 'stripboard' && <StripBoard />}
          {activeTab === 'analytics'  && <AnalyticsDashboard />}
          {activeTab === 'schedule'   && <ScheduleModule onDaySelect={handleDaySelect} />}
          {activeTab === 'script-rt'  && <ScriptRT />}
          {activeTab === 'callsheet'  && (
            <CallSheetModule embedded initialDayId={openDayId} key={openDayId} />
          )}
        </div>
      </div>
    </div>
  )
}
