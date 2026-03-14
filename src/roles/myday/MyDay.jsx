// MyDay — "O Teu Dia" — Dashboard pessoal (Figma FF_V04)
// Weather, próxima chamada, localização, department pills, cenas com fotos

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, MapPin, Calendar, Phone, Mail, ChevronLeft, ChevronRight,
  Film, Users, Sun, Sunset, CloudSun, Wind, Droplets, Sunrise,
  Radio, AlertTriangle, CheckCircle2, Circle, ExternalLink,
  Car, UtensilsCrossed, ChevronUp, Camera, Palette, Shirt,
  Clapperboard, Lightbulb, Megaphone, Zap,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { resolveRole, ROLES, getAccessLevel, getDepartment } from '../../core/roles.js'
import { getScenesForDay } from '../../utils/dashboardHelpers.js'
import { WeatherOverlay } from '../../components/shared/WeatherOverlay.jsx'
import { SceneDetailOverlay } from '../../components/shared/SceneDetailOverlay.jsx'
import { ScheduleOverlay } from '../../components/shared/ScheduleOverlay.jsx'
import { LocationOverlay } from '../../components/shared/LocationOverlay.jsx'
import styles from './MyDay.module.css'

const DEPT_ICONS = {
  camera: Camera, lighting: Lightbulb, art: Palette, wardrobe: Shirt,
  props: Clapperboard, sfx: Zap, sound: Megaphone, makeup: Palette,
  hair: Palette, vehicles: Car, stunts: Zap, vfx: Film,
}
const DEPT_COLORS = {
  camera: '#3b82f6', lighting: '#f59e0b', art: '#ef4444', wardrobe: '#ec4899',
  props: '#8b5cf6', sfx: '#f97316', sound: '#8b5cf6', makeup: '#ec4899',
  hair: '#f472b6', vehicles: '#6b7280', stunts: '#ef4444', vfx: '#6366f1',
}

export function MyDay() {
  const {
    auth, team, shootingDays, sceneAssignments, parsedScripts,
    locations, sceneTakes, departmentItems, departmentConfig,
    preProduction, navigate, rsvp, updateRsvp, owmApiKey,
  } = useStore(useShallow(s => ({
    auth: s.auth, team: s.team, shootingDays: s.shootingDays,
    sceneAssignments: s.sceneAssignments, parsedScripts: s.parsedScripts,
    locations: s.locations, sceneTakes: s.sceneTakes,
    departmentItems: s.departmentItems, departmentConfig: s.departmentConfig,
    preProduction: s.preProduction, navigate: s.navigate,
    rsvp: s.rsvp, updateRsvp: s.updateRsvp, owmApiKey: s.owmApiKey,
  })))

  const role = resolveRole(auth.role)
  const roleInfo = ROLES[role]
  const level = getAccessLevel(role)
  const isActor = level === 5

  // ── Day navigation ──────────────────────────────────────────────
  const sortedDays = useMemo(
    () => [...shootingDays].sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    [shootingDays]
  )
  const today = new Date().toISOString().slice(0, 10)
  const todayIdx = useMemo(() => {
    const idx = sortedDays.findIndex(d => d.date === today)
    return idx >= 0 ? idx : 0
  }, [sortedDays, today])

  const [selectedIdx, setSelectedIdx] = useState(null)
  const [expandedScene, setExpandedScene] = useState(null)
  const [weatherOpen, setWeatherOpen] = useState(false)
  const [sceneDetail, setSceneDetail] = useState(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const dayIdx = selectedIdx !== null ? selectedIdx : todayIdx
  const currentDay = sortedDays[dayIdx] || null
  const dayNum = currentDay?.dayNumber || dayIdx + 1

  const goNext = useCallback(() => setSelectedIdx(Math.min((selectedIdx ?? todayIdx) + 1, sortedDays.length - 1)), [selectedIdx, todayIdx, sortedDays.length])
  const goPrev = useCallback(() => setSelectedIdx(Math.max((selectedIdx ?? todayIdx) - 1, 0)), [selectedIdx, todayIdx])

  // ── Scenes ──────────────────────────────────────────────────────
  const dayScenes = useMemo(
    () => currentDay ? getScenesForDay(currentDay.id, sceneAssignments, parsedScripts) : [],
    [currentDay, sceneAssignments, parsedScripts]
  )

  // Me
  const me = useMemo(() => {
    if (!auth.user) return null
    const name = typeof auth.user === 'string' ? auth.user : auth.user?.name
    if (!name) return null
    return team.find(m => m.name === name || m.name?.toLowerCase().includes(name.toLowerCase().split(' ')[0]))
  }, [auth.user, team])

  const characterName = me?.characterName || (isActor ? (typeof auth.user === 'string' ? auth.user : auth.user?.name) : null)
  const charFirst = characterName?.toLowerCase().split(' ')[0]

  const myScenes = useMemo(() => {
    if (isActor && charFirst) return dayScenes.filter(sc => (sc.characters || []).some(ch => ch.toLowerCase().includes(charFirst)))
    return dayScenes
  }, [dayScenes, isActor, charFirst])

  // ── Progress ────────────────────────────────────────────────────
  const dayProgress = useMemo(() => {
    let total = 0, done = 0
    for (const sc of myScenes) {
      total++
      const takes = sceneTakes?.[sc.sceneKey] || []
      if (takes.some(t => t.status === 'BOM' || t.status === 'bom')) done++
    }
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [myScenes, sceneTakes])

  const isFilming = dayProgress.done > 0 && dayProgress.done < dayProgress.total

  // ── Location ────────────────────────────────────────────────────
  const todayLocation = useMemo(() => {
    const loc = myScenes[0]?.location
    if (!loc) return null
    return locations.find(l => l.name === loc || l.name?.toLowerCase().includes(loc.toLowerCase())) || { name: loc }
  }, [myScenes, locations])

  // ── Next scene ──────────────────────────────────────────────────
  const nextScene = useMemo(() => {
    const undone = myScenes.find(sc => {
      const takes = sceneTakes?.[sc.sceneKey] || []
      return !takes.some(t => t.status === 'BOM' || t.status === 'bom')
    })
    return undone || myScenes[0] || null
  }, [myScenes, sceneTakes])

  // ── Department pills ────────────────────────────────────────────
  const deptPills = useMemo(() => {
    const map = {}
    for (const item of departmentItems) {
      const d = item.department || 'other'
      map[d] = (map[d] || 0) + 1
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [departmentItems])

  // ── Scene department items (photos) ─────────────────────────────
  const scenePhotos = useCallback((sceneKey) => {
    return departmentItems
      .filter(item => (item.scenes || []).includes(sceneKey) && item.photos?.length > 0)
      .slice(0, 3)
  }, [departmentItems])

  // ── Weather ─────────────────────────────────────────────────────
  // Demo weather fallback
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
      })
    }).catch(() => {})
  }, [owmApiKey, todayLocation])

  // ── RSVP ──────────────────────────────────────────────────────────
  const myRsvp = currentDay && me ? rsvp?.[currentDay.id]?.[me.id] : null

  const callTime = currentDay?.callTime || '08:00'
  const userName = typeof auth.user === 'string' ? auth.user : auth.user?.name || 'Utilizador'

  // Clock
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])
  const clockStr = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

  // Date formatted
  const dateStr = currentDay?.date
    ? new Date(currentDay.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const dateCap = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  // Dept config map
  const deptMap = useMemo(() => {
    const m = {}; for (const d of (departmentConfig || [])) m[d.id] = d; return m
  }, [departmentConfig])

  // ══════════════════════════════════════════════════════════════════
  return (
    <div className={styles.dashboard}>

{/* ── Scrollable content ── */}
      <div className={styles.content}>

        {/* ── "O TEU DIA" Header Card ── */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>O TEU DIA</h1>
            <p className={styles.heroSub}>{dateCap} &bull; {userName}</p>
          </div>
          <div className={styles.heroRight} style={{ cursor: 'pointer' }} onClick={() => currentDay && setScheduleOpen(true)}>
            <span className={styles.heroClock}>{clockStr}</span>
          </div>
        </div>

        {/* ── Service Sheet Button ── */}
        <button className={styles.serviceBtn} onClick={() => navigate('callsheet')}>
          <Calendar size={16} />
          <span>FOLHA DE SERVIÇO DO DIA</span>
        </button>

        {/* ── 3 Info Cards ── */}
        <div className={styles.infoRow}>
          {/* Weather — clickable to open full overlay */}
          <div className={styles.infoCard} style={{ cursor: 'pointer' }} onClick={() => setWeatherOpen(true)}>
            <div className={styles.infoIcon} style={{ background: 'rgba(59,130,246,0.15)' }}>
              <CloudSun size={20} color="#3b82f6" />
            </div>
            <div className={styles.infoBody}>
              <span className={styles.infoLabel}>METEOROLOGIA</span>
              <span className={styles.infoValue}>{weather ? `${weather.temp}°C` : '—'}</span>
              <span className={styles.infoDesc}>{weather?.desc || 'Sem dados'}</span>
              {(currentDay?.sunrise || currentDay?.sunset) && (
                <div className={styles.infoMeta}>
                  {currentDay.sunrise && <span><Sunrise size={10} /> {currentDay.sunrise}</span>}
                  {currentDay.sunset && <span><Sunset size={10} /> {currentDay.sunset}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Next Call — clickable for schedule overlay */}
          <div className={styles.infoCard} style={{ cursor: 'pointer' }} onClick={() => currentDay && setScheduleOpen(true)}>
            <div className={styles.infoIcon} style={{ background: 'rgba(16,185,129,0.15)' }}>
              <Clock size={20} color="#10b981" />
            </div>
            <div className={styles.infoBody}>
              <span className={styles.infoLabel}>PRÓXIMA CHAMADA</span>
              <span className={styles.infoValue}>{callTime}</span>
              <span className={styles.infoDesc}>
                {nextScene ? `Cena ${nextScene.sceneNumber} \u2022 ${nextScene.location || '—'}` : 'Sem cenas'}
              </span>
            </div>
          </div>

          {/* Next Location — clickable to open overlay */}
          <div className={styles.infoCard} style={{ cursor: 'pointer' }} onClick={() => todayLocation && setLocationOpen(true)}>
            <div className={styles.infoIcon} style={{ background: 'rgba(168,85,247,0.15)' }}>
              <MapPin size={20} color="#a855f7" />
            </div>
            <div className={styles.infoBody}>
              <span className={styles.infoLabel}>PRÓXIMA LOCALIZAÇÃO</span>
              <span className={styles.infoValue}>{todayLocation?.displayName || todayLocation?.name || '—'}</span>
              <span className={styles.infoDesc}>
                {todayLocation?.address || todayLocation?.city || ''}
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
              const color = DEPT_COLORS[dept] || deptMap[dept]?.color || '#6E6E78'
              const label = deptMap[dept]?.label || dept
              return (
                <button key={dept} className={styles.pill}
                  style={{ borderColor: color + '40', background: color + '12' }}
                  onClick={() => navigate('departments')}
                >
                  <Icon size={12} style={{ color }} />
                  <span style={{ color }}>{label}</span>
                  <span className={styles.pillCount} style={{ background: color, color: '#fff' }}>{count}</span>
                </button>
              )
            })}
          </div>
          {isFilming && (
            <span className={styles.filmingBadge}>FILMANDO</span>
          )}
        </div>

        {/* ── Scenes with Photos ── */}
        {myScenes.map((sc, i) => {
          const takes = sceneTakes?.[sc.sceneKey] || []
          const done = takes.some(t => t.status === 'BOM' || t.status === 'bom')
          const photos = scenePhotos(sc.sceneKey)
          const isExpanded = expandedScene === sc.sceneKey
          const dotColors = ['#10B981', '#F59E0B', '#3B82F6', '#A855F7', '#EF4444']

          return (
            <motion.div key={sc.sceneKey} className={styles.sceneSection}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>

              {/* Scene header */}
              <div className={styles.sceneHeader} onClick={() => setExpandedScene(isExpanded ? null : sc.sceneKey)}>
                <span className={styles.sceneDot} style={{ background: dotColors[i % dotColors.length] }} />
                <div className={styles.sceneHeaderText}>
                  <span className={styles.sceneTitle}>
                    {i === 0 ? 'Próxima Cena' : `Cena ${i + 1}`} - {sc.sceneNumber} - {sc.location || '—'}
                  </span>
                  <span className={styles.sceneMeta}>
                    {sc.intExt || ''} {sc.timeOfDay ? `/ ${sc.timeOfDay}` : ''} - {callTime}
                  </span>
                </div>
                {done && <CheckCircle2 size={16} color="#10B981" />}
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronUp size={16} className={styles.sceneChevron} />
                </motion.div>
              </div>

              {/* Photos */}
              <AnimatePresence>
                {(isExpanded || i === 0) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    {photos.length > 0 && (
                      <div className={styles.photoGrid}>
                        {photos.map(item => (
                          <div key={item.id} className={styles.photoCard}>
                            <div className={styles.photoImg}>
                              {item.photos[0] ? (
                                <img src={item.photos[0]} alt={item.name} />
                              ) : (
                                <div className={styles.photoPlaceholder}>
                                  <Film size={20} />
                                </div>
                              )}
                            </div>
                            <div className={styles.photoInfo}>
                              <span className={styles.photoName}>{item.name}</span>
                              <span className={styles.photoDept}>
                                {deptMap[item.department]?.label || item.department}
                                <span className={styles.photoDot} style={{ background: item.approved ? '#10B981' : '#F59E0B' }} />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Characters */}
                    {(sc.characters || []).length > 0 && (
                      <div className={styles.charRow}>
                        <Users size={12} />
                        <span>{sc.characters.join(', ')}</span>
                      </div>
                    )}

                    {/* Description */}
                    {sc.description && (
                      <p className={styles.sceneDesc}>{sc.description}</p>
                    )}

                    {/* Detail button — opens scene overlay */}
                    <button className={styles.detailBtn} onClick={() => setSceneDetail(sc)}>
                      <ExternalLink size={14} />
                      VER DETALHES DA CENA
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}

        {myScenes.length === 0 && (
          <div className={styles.emptyScenes}>
            <Film size={28} />
            <p>Sem cenas atribuídas para este dia</p>
            <button className={styles.emptyBtn} onClick={() => navigate('production')}>
              Ir para Produção
            </button>
          </div>
        )}

        {/* ── Crew Quick View ── */}
        <CrewQuickView team={team} currentDay={currentDay} auth={auth} navigate={navigate} rsvp={rsvp} />

      </div>

      {/* ── Day nav (bottom) ── */}
      {sortedDays.length > 1 && (
        <div className={styles.dayNav}>
          <button className={styles.dayBtn} onClick={goPrev} disabled={dayIdx <= 0}>
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className={styles.dayIndicator}>D{dayNum} de {sortedDays.length}</span>
          <button className={styles.dayBtn} onClick={goNext} disabled={dayIdx >= sortedDays.length - 1}>
            Seguinte <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── Overlays ── */}
      <WeatherOverlay
        open={weatherOpen}
        onClose={() => setWeatherOpen(false)}
        weather={weather || { temp: 18, desc: 'Parcialmente nublado', wind: 12, humidity: 65, feelsLike: 16, visibility: 10000 }}
        sunrise={currentDay?.sunrise || '07:24'}
        sunset={currentDay?.sunset || '18:42'}
        location={weather?.city || todayLocation?.city || 'Porto'}
      />
      <SceneDetailOverlay
        open={!!sceneDetail}
        onClose={() => setSceneDetail(null)}
        scene={sceneDetail}
        dayLabel={currentDay ? `DIA ${dayNum}` : null}
      />
      <ScheduleOverlay
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        day={currentDay}
      />
      <LocationOverlay
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        location={todayLocation}
      />
    </div>
  )
}

// ── Crew Quick View Sub-component ─────────────────────────────────
function CrewQuickView({ team, currentDay, auth, navigate, rsvp }) {
  const todayCrew = useMemo(() => {
    return team.filter(m => {
      const userName = typeof auth.user === 'string' ? auth.user : auth.user?.name
      if (m.name === userName) return false
      if (currentDay && m.confirmedDays?.includes(currentDay.id)) return true
      if (currentDay && rsvp?.[currentDay.id]?.[m.id]?.status === 'confirmed') return true
      const r = (m.role || '').toLowerCase()
      return r.includes('realiz') || r.includes('produção') || r.includes('dop') || r.includes('câmara') || r.includes('som')
    }).slice(0, 8)
  }, [team, auth.user, currentDay, rsvp])

  if (todayCrew.length === 0) return null

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Users size={14} />
        <span>CREW DE HOJE</span>
        <button className={styles.seeAllBtn} onClick={() => navigate('team')}>Ver Todos</button>
      </div>
      <div className={styles.crewGrid}>
        {todayCrew.map(m => (
          <div key={m.id} className={styles.crewChip}>
            {m.photo
              ? <img src={m.photo} alt="" className={styles.crewChipImg} />
              : <span className={styles.crewChipFallback}>{(m.name || '?')[0]}</span>
            }
            <div className={styles.crewChipInfo}>
              <span className={styles.crewChipName}>{m.name}</span>
              <span className={styles.crewChipRole}>{m.role || m.group || ''}</span>
            </div>
            {m.phone && (
              <a href={`tel:${m.phone}`} className={styles.crewChipCall} onClick={e => e.stopPropagation()}>
                <Phone size={10} />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
