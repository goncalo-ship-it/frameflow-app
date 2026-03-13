// Dashboard do Produtor — redesign Figma FF08
// Horizontal scene cards with thumbnails, dept items list, Próximas Cenas

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, MapPin, Film, CheckCircle, Clock, Zap,
  ChevronDown, CloudSun, Sunrise, Sunset, ExternalLink,
  Camera, Palette, Shirt, Clapperboard, Lightbulb, Megaphone,
  Car, Sparkles, Sun,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '../../core/i18n/index.js'
import { getScenesForDay } from '../../utils/dashboardHelpers.js'
import { EmptyState } from '../../components/shared/EmptyState.jsx'
import { WeatherOverlay } from '../../components/shared/WeatherOverlay.jsx'
import { SceneDetailOverlay } from '../../components/shared/SceneDetailOverlay.jsx'
import { ScheduleOverlay } from '../../components/shared/ScheduleOverlay.jsx'
import styles from './ProducerDashboard.module.css'

const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0)

const DEPT_COLORS = {
  camera: '#3b82f6', lighting: '#f59e0b', art: '#ef4444', wardrobe: '#ec4899',
  props: '#8b5cf6', sfx: '#f97316', sound: '#8b5cf6', makeup: '#ec4899',
  hair: '#f472b6', vehicles: '#6b7280', stunts: '#ef4444', vfx: '#6366f1',
}

const DEPT_ICONS = {
  camera: Camera, lighting: Lightbulb, art: Sparkles, wardrobe: Shirt,
  props: Clapperboard, sfx: Zap, sound: Megaphone, makeup: Palette,
  hair: Palette, vehicles: Car, stunts: Zap, vfx: Film,
}

const TAG_COLORS = {
  INT: '#10B981', EXT: '#EF4444', 'INT/EXT': '#6366f1',
  DIA: '#6B7280', NOITE: '#4B5563', ANOITECER: '#92400E', AMANHECER: '#D97706',
}

const BAR_COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1']
const DOT_COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#A855F7', '#EF4444']

export function ProducerDashboard() {
  const [weatherOpen, setWeatherOpen] = useState(false)
  const [sceneDetail, setSceneDetail] = useState(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [expandedScene, setExpandedScene] = useState(null)
  const [nextScenesOpen, setNextScenesOpen] = useState(false)
  const {
    projectName, auth, team, locations, shootingDays, budgets,
    parsedScripts, parsedCharacters, navigate,
    sceneAssignments, sceneTakes, departmentItems, departmentConfig, owmApiKey,
  } = useStore(useShallow(s => ({
    projectName: s.projectName, auth: s.auth, team: s.team, locations: s.locations,
    shootingDays: s.shootingDays, budgets: s.budgets,
    parsedScripts: s.parsedScripts, parsedCharacters: s.parsedCharacters,
    navigate: s.navigate,
    sceneAssignments: s.sceneAssignments, sceneTakes: s.sceneTakes,
    departmentItems: s.departmentItems, departmentConfig: s.departmentConfig,
    owmApiKey: s.owmApiKey,
  })))
  const { t } = useI18n()

  // ── Clock ─────────────────────────────────────────────────────────
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])
  const clockStr = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

  // ── Métricas ──────────────────────────────────────────────────────
  const allScenes = useMemo(() => Object.values(parsedScripts).flatMap(s => s.scenes || []), [parsedScripts])
  const scenesCount = allScenes.length

  const scenesFilmed = useMemo(() =>
    new Set(Object.entries(sceneTakes).filter(([, t]) => t.some(x => x.status === 'BOM' || x.status === 'bom')).map(([k]) => k)).size
  , [sceneTakes])

  // ── Hoje ──────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const todayDay = useMemo(() => shootingDays.find(d => d.date === today), [shootingDays, today])
  const todayIdx = useMemo(() => shootingDays.findIndex(d => d.date === today), [shootingDays, today])
  const dayNum = todayDay ? (todayDay.dayNumber || todayIdx + 1) : null

  const todayScenes = useMemo(
    () => todayDay ? getScenesForDay(todayDay.id, sceneAssignments, parsedScripts) : [],
    [todayDay, sceneAssignments, parsedScripts]
  )

  const todayLocation = useMemo(() => {
    const loc = todayScenes[0]?.location
    if (!loc) return null
    return locations.find(l => l.name === loc || l.name?.toLowerCase().includes(loc.toLowerCase())) || { name: loc }
  }, [todayScenes, locations])

  const todayFormatted = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const todayCap = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1)
  const callTime = todayDay?.callTime || '08:00'
  const userName = typeof auth?.user === 'string' ? auth.user : auth?.user?.name || 'Produtor'

  // ── Next scene ────────────────────────────────────────────────────
  const nextScene = useMemo(() => {
    const undone = todayScenes.find(sc => {
      const takes = sceneTakes?.[sc.sceneKey] || []
      return !takes.some(t => t.status === 'BOM' || t.status === 'bom')
    })
    return undone || todayScenes[0] || null
  }, [todayScenes, sceneTakes])

  // ── Weather ───────────────────────────────────────────────────────
  const demoWeather = { temp: 18, desc: 'Parcialmente nublado', wind: 12, humidity: 65, city: 'Porto', feelsLike: 16, visibility: 10000 }
  const [weather, setWeather] = useState(demoWeather)
  useEffect(() => {
    if (!owmApiKey) return
    const loc = todayLocation
    const city = loc?.city || loc?.name || 'Lisboa'
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},PT&appid=${owmApiKey}&units=metric&lang=pt`
    fetch(url).then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return
      setWeather({
        temp: Math.round(d.main?.temp),
        desc: d.weather?.[0]?.description || '',
        wind: Math.round(d.wind?.speed * 3.6),
        humidity: d.main?.humidity,
        city: d.name || city,
        feelsLike: Math.round(d.main?.feels_like),
        visibility: d.visibility,
      })
    }).catch(() => {})
  }, [owmApiKey, todayLocation])

  // ── Department pills ──────────────────────────────────────────────
  const deptConfigMap = useMemo(() => {
    const m = {}
    for (const d of (departmentConfig || [])) m[d.id] = d
    return m
  }, [departmentConfig])

  const deptPills = useMemo(() => {
    const map = {}
    for (const item of departmentItems) {
      const d = item.department || 'other'
      map[d] = (map[d] || 0) + 1
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [departmentItems])

  // ── Scene department items (all, not just photos) ─────────────────
  const sceneDeptItems = useCallback((sceneKey) => {
    return departmentItems.filter(item => (item.scenes || []).includes(sceneKey))
  }, [departmentItems])

  // ── Scene thumbnail (first photo from dept items or location) ─────
  const sceneThumb = useCallback((sc) => {
    const items = departmentItems.filter(item => (item.scenes || []).includes(sc.sceneKey) && item.photos?.length)
    if (items.length > 0) return items[0].photos[0]
    const loc = locations.find(l => l.name === sc.location || l.name?.toLowerCase().includes((sc.location || '').toLowerCase()))
    return loc?.photo || null
  }, [departmentItems, locations])

  // ── Carga por dia ─────────────────────────────────────────────────
  const loadPerDay = useMemo(() => {
    return shootingDays.slice(0, 17).map((d, i) => {
      const scenes = getScenesForDay(d.id, sceneAssignments, parsedScripts)
      const hours = scenes.reduce((s, sc) => s + (sc.pageCount || 1) * 0.5, 0)
      return { label: `D${d.dayNumber || i + 1}`, hours: Math.round(hours * 10) / 10, count: scenes.length, isToday: d.date === today }
    })
  }, [shootingDays, sceneAssignments, parsedScripts, today])
  const maxHours = Math.max(...loadPerDay.map(d => d.hours), 1)

  // ── Upcoming scenes (future days) ─────────────────────────────────
  const upcomingScenes = useMemo(() => {
    const futureDays = shootingDays.filter(d => d.date > today).slice(0, 3)
    return futureDays.flatMap(d => getScenesForDay(d.id, sceneAssignments, parsedScripts).slice(0, 2)).slice(0, 5)
  }, [shootingDays, today, sceneAssignments, parsedScripts])

  // ── Next location (from next day or upcoming scenes) ──────────────
  const nextLocation = useMemo(() => {
    const nextDay = shootingDays.find(d => d.date > today)
    if (!nextDay) return null
    const scenes = getScenesForDay(nextDay.id, sceneAssignments, parsedScripts)
    const loc = scenes[0]?.location
    if (!loc) return null
    const found = locations.find(l => l.name === loc || l.name?.toLowerCase().includes(loc.toLowerCase()))
    return found || { name: loc }
  }, [shootingDays, today, sceneAssignments, parsedScripts, locations])

  // Auto-expand first scene
  useEffect(() => {
    if (todayScenes.length > 0 && !expandedScene) {
      setExpandedScene(todayScenes[0].sceneKey)
    }
  }, [todayScenes])

  // ══════════════════════════════════════════════════════════════════
  return (
    <div className={styles.dashboard}>
      <div className={styles.content}>

        {/* ── "O TEU DIA" Header ── */}
        <div className={styles.dayHeader}>
          <div className={styles.dayHeaderLeft}>
            <h1 className={styles.dayHeaderTitle}>O TEU DIA</h1>
            <p className={styles.dayHeaderSub}>{todayCap} &bull; {userName}</p>
          </div>
          <div className={styles.dayHeaderRight} onClick={() => todayDay && setScheduleOpen(true)} style={{ cursor: todayDay ? 'pointer' : 'default' }}>
            <span className={styles.dayHeaderClock}>{clockStr}</span>
          </div>
        </div>

        {/* ── Service Sheet Button ── */}
        <button className={styles.serviceBtn} onClick={() => navigate('callsheet')}>
          <Calendar size={16} />
          <span>{'\uD83D\uDCCB'} FOLHA DE SERVIÇO DO DIA</span>
        </button>

        {/* ── 3 Stat Cards ── */}
        <div className={styles.statRow}>
          {/* Weather */}
          <div className={styles.statCard} onClick={() => setWeatherOpen(true)}>
            <div className={styles.statIcon} style={{ background: 'rgba(59,130,246,0.15)' }}>
              <CloudSun size={20} color="#3b82f6" />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>METEOROLOGIA</span>
              <span className={styles.statValue}>{weather ? `${weather.temp}°C` : '—'}</span>
              <span className={styles.statDesc}>{weather?.desc || 'Sem dados'}</span>
              <div className={styles.statMeta}>
                <span><Sunrise size={10} /> {todayDay?.sunrise || '07:24'}</span>
                <span><Sunset size={10} /> {todayDay?.sunset || '18:42'}</span>
              </div>
            </div>
          </div>

          {/* Next Call */}
          <div className={`${styles.statCard} ${styles.statCardHighlight}`} onClick={() => todayDay && setScheduleOpen(true)}>
            <div className={styles.statIcon} style={{ background: 'rgba(59,130,246,0.15)' }}>
              <Clock size={20} color="#3b82f6" />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>PRÓXIMA CHAMADA</span>
              <span className={styles.statValue}>{callTime}</span>
              <span className={styles.statDesc}>
                {nextScene ? `Cena ${nextScene.sceneNumber} \u2022 ${nextScene.location || '—'}` : 'Sem cenas'}
              </span>
            </div>
          </div>

          {/* Next Location */}
          <div className={styles.statCard} onClick={() => todayLocation && navigate('locations')}>
            <div className={styles.statIcon} style={{ background: 'rgba(168,85,247,0.15)' }}>
              <MapPin size={20} color="#a855f7" />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>PRÓXIMA LOCALIZAÇÃO</span>
              <span className={styles.statValue}>{todayLocation?.displayName || todayLocation?.name || '—'}</span>
              <span className={styles.statDesc}>
                {todayLocation?.city || todayLocation?.address || ''}
                {todayLocation?.travelTime ? ` \u2022 ${todayLocation.travelTime}` : ''}
              </span>
              {todayLocation?.googleMapsUrl && (
                <a href={todayLocation.googleMapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}
                  onClick={e => e.stopPropagation()}>
                  <MapPin size={10} /> Abrir no Maps
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Department Pills ── */}
        <div className={styles.pillRow}>
          <div className={styles.pillGroup}>
            {deptPills.map(([dept, count]) => {
              const Icon = DEPT_ICONS[dept] || Film
              const color = DEPT_COLORS[dept] || deptConfigMap[dept]?.color || '#6E6E78'
              const label = deptConfigMap[dept]?.label || dept
              return (
                <button key={dept} className={styles.pill}
                  style={{ borderColor: color + '66', background: color + '33' }}
                  onClick={() => navigate('departments')}
                >
                  <Icon size={13} style={{ color }} />
                  <span style={{ color: '#fff' }}>{label}</span>
                  <span className={styles.pillCount} style={{ background: color }}>{count}</span>
                </button>
              )
            })}
          </div>
          {scenesFilmed > 0 && (
            <span className={styles.filmedBadge}>FILMANDO</span>
          )}
        </div>

        {/* ── Scene Cards (horizontal with thumbnails) ── */}
        {todayScenes.map((sc, i) => {
          const takes = sceneTakes?.[sc.sceneKey] || []
          const done = takes.some(t => t.status === 'BOM' || t.status === 'bom')
          const isExpanded = expandedScene === sc.sceneKey
          const items = sceneDeptItems(sc.sceneKey)
          const thumb = sceneThumb(sc)
          const isFirst = i === 0

          return (
            <motion.div key={sc.sceneKey} className={styles.sceneCard}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>

              {/* Scene row: thumbnail + info + chevron */}
              <div className={styles.sceneRow} onClick={() => setExpandedScene(isExpanded ? null : sc.sceneKey)}>
                {/* Thumbnail */}
                <div className={styles.sceneThumb}>
                  {thumb ? (
                    <img src={thumb} alt="" className={styles.sceneThumbImg} />
                  ) : (
                    <div className={styles.sceneThumbPlaceholder}>
                      <Film size={22} />
                    </div>
                  )}
                  <span className={styles.sceneBadge}>{sc.sceneNumber || `${i + 1}`}</span>
                  {isFirst && <span className={styles.sceneNextBadge}>PRÓX</span>}
                </div>

                {/* Info */}
                <div className={styles.sceneInfo}>
                  <div className={styles.sceneTitleRow}>
                    <span className={styles.sceneDot} style={{ background: DOT_COLORS[i % DOT_COLORS.length] }} />
                    <span className={styles.sceneTitle}>
                      {sc.sceneNumber} - {sc.location || sc.setting || '—'}
                    </span>
                  </div>
                  {sc.description && (
                    <p className={styles.sceneDesc}>{sc.description}</p>
                  )}
                  <div className={styles.sceneTags}>
                    {sc.intExt && (
                      <span className={styles.sceneTag} style={{ background: TAG_COLORS[sc.intExt] || '#6B7280' }}>
                        {sc.intExt}
                      </span>
                    )}
                    {sc.timeOfDay && (
                      <span className={styles.sceneTag} style={{ background: TAG_COLORS[sc.timeOfDay?.toUpperCase()] || '#4B5563' }}>
                        {sc.timeOfDay?.toUpperCase()}
                      </span>
                    )}
                    {sc.location && (
                      <span className={styles.sceneLocText}>
                        <MapPin size={10} /> {todayLocation?.displayName || sc.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <motion.div className={styles.sceneChevron}
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}>
                  <ChevronDown size={18} />
                </motion.div>
              </div>

              {/* Expanded: department items list */}
              <AnimatePresence>
                {isExpanded && items.length > 0 && (
                  <motion.div className={styles.sceneItems}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}>
                    {items.map(item => {
                      const DeptIcon = DEPT_ICONS[item.department] || Film
                      const deptColor = DEPT_COLORS[item.department] || deptConfigMap[item.department]?.color || '#6E6E78'
                      const deptLabel = deptConfigMap[item.department]?.label || item.department
                      return (
                        <div key={item.id} className={styles.deptItem}>
                          <div className={styles.deptItemIcon} style={{ color: deptColor, background: deptColor + '18' }}>
                            <DeptIcon size={16} />
                          </div>
                          <div className={styles.deptItemInfo}>
                            <span className={styles.deptItemName}>{item.name}</span>
                            <span className={styles.deptItemLabel} style={{ color: deptColor }}>{deptLabel}</span>
                          </div>
                          <span className={styles.deptItemDot} style={{ background: item.approved ? '#10B981' : '#F59E0B' }} />
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}

        {todayScenes.length === 0 && (
          <div className={styles.emptyScenes}>
            <Film size={28} />
            <p>Sem cenas agendadas para hoje</p>
            <button className={styles.emptyBtn} onClick={() => navigate('production')}>
              Planear rodagem
            </button>
          </div>
        )}

        {/* ── Two-Column Bottom ── */}
        <div className={styles.twoCol}>
          {/* Left: Carga por Dia */}
          <div className={styles.colLeft}>
            <div className={styles.glassCard}>
              <div className={styles.cardTitleRow}>
                <span className={styles.cardTitleDot} style={{ background: '#F59E0B' }} />
                <h3 className={styles.cardTitle}>Carga por Dia (Horas)</h3>
              </div>
              {loadPerDay.length === 0 ? (
                <EmptyState icon={Calendar} title="Sem dias planeados" />
              ) : (
                <div className={styles.barChart}>
                  {loadPerDay.map((d, i) => (
                    <div key={i} className={`${styles.barCol} ${d.isToday ? styles.barColToday : ''}`}>
                      <span className={styles.barValue}>{d.hours || ''}</span>
                      <div className={styles.barTrack}>
                        <motion.div
                          className={styles.barFill}
                          style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                          initial={{ height: 0 }}
                          animate={{ height: `${(d.hours / maxHours) * 100}%` }}
                          transition={{ delay: i * 0.03, duration: 0.4 }}
                        />
                      </div>
                      <span className={styles.barLabel}>{d.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Próximas Cenas + Próxima Location */}
          <div className={styles.colRight}>
            {/* Próximas Cenas */}
            <div className={styles.glassCard}>
              <div className={styles.nextHeader} onClick={() => setNextScenesOpen(!nextScenesOpen)}>
                <div className={styles.nextIcon} style={{ background: '#F97316' }}>
                  <Clock size={18} color="#fff" />
                </div>
                <div className={styles.nextInfo}>
                  <span className={styles.nextTitle}>Próximas Cenas</span>
                  <span className={styles.nextSub}>{upcomingScenes.length} CENAS AGENDADAS</span>
                </div>
                <motion.div animate={{ rotate: nextScenesOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </motion.div>
              </div>
              <AnimatePresence>
                {nextScenesOpen && upcomingScenes.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}>
                    <div className={styles.nextScenesList}>
                      {upcomingScenes.map((sc, i) => (
                        <div key={sc.sceneKey || i} className={styles.nextSceneRow} onClick={() => setSceneDetail(sc)}>
                          <span className={styles.sceneDot} style={{ background: DOT_COLORS[i % DOT_COLORS.length] }} />
                          <span className={styles.nextSceneName}>{sc.sceneNumber} - {sc.location || '—'}</span>
                          <span className={styles.nextSceneMeta}>{sc.intExt || ''}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Próxima Location */}
            <div className={styles.glassCard}>
              <div className={styles.cardTitleRow}>
                <span className={styles.cardTitleDot} style={{ background: '#F97316' }} />
                <h3 className={styles.cardTitle}>Próxima Location</h3>
              </div>
              {nextLocation ? (
                <div className={styles.nextLocCard}>
                  <div className={styles.nextLocIcon}>
                    <MapPin size={18} color="#a855f7" />
                  </div>
                  <div className={styles.nextLocInfo}>
                    <span className={styles.nextLocName}>{nextLocation.displayName || nextLocation.name}</span>
                    <span className={styles.nextLocMeta}>
                      {nextLocation.type || 'Exterior'} / {nextLocation.timeOfDay || 'Dia'}
                    </span>
                    {nextLocation.schedule && (
                      <span className={styles.nextLocTime}>
                        <Clock size={10} /> {nextLocation.schedule}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span className={styles.emptyText}>Sem locais planeados</span>
              )}
              {weather && (
                <div className={styles.nextLocWeather}>
                  <span><Sun size={12} /> {weather.temp}°C &bull; {weather.desc}</span>
                  {nextLocation?.status === 'confirmado' && (
                    <span className={styles.nextLocConfirm}><CheckCircle size={10} /> Confirmado</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── Overlays ── */}
      <WeatherOverlay
        open={weatherOpen}
        onClose={() => setWeatherOpen(false)}
        weather={weather || demoWeather}
        sunrise={todayDay?.sunrise || '07:24'}
        sunset={todayDay?.sunset || '18:42'}
        location={weather?.city || todayLocation?.city || 'Porto'}
      />
      <SceneDetailOverlay
        open={!!sceneDetail}
        onClose={() => setSceneDetail(null)}
        scene={sceneDetail}
        dayLabel={dayNum ? `DIA ${dayNum}` : null}
      />
      <ScheduleOverlay
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        day={todayDay}
      />
    </div>
  )
}
