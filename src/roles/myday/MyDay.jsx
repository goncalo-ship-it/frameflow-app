/**
 * MyDay — "O Teu Dia" — Dashboard pessoal
 * MIGRATED: visual layer now uses shared entity cards.
 * Domain logic (hooks, memos, overlays) unchanged.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Clock, MapPin, Calendar, ChevronLeft, ChevronRight,
  Film, Camera, Palette, Shirt, Clapperboard, Lightbulb,
  Megaphone, Zap, Car, UtensilsCrossed,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { resolveRole, getAccessLevel } from '../../core/roles.js'
import { getScenesForDay } from '../../utils/dashboardHelpers.js'
import { WeatherOverlay }    from '../../components/shared/WeatherOverlay.jsx'
import { SceneDetailOverlay }from '../../components/shared/SceneDetailOverlay.jsx'
import { ScheduleOverlay }   from '../../components/shared/ScheduleOverlay.jsx'
import { LocationOverlay }   from '../../components/shared/LocationOverlay.jsx'
import {
  WeatherCard, SceneCard, FilmLocationCard, MetricCard,
  PersonCard, DayTimelineItemCard,
} from '../../components/shared/ui'
import { C } from '../../components/shared/ui/tokens'
import styles from './MyDay.module.css'

// ── Dept pill config ──────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────
function addTime(timeStr, minutes) {
  if (!timeStr) return '09:00'
  const [h, m] = timeStr.split(':').map(Number)
  const total = (h || 0) * 60 + (m || 0) + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ── Adapters: store shape → UI types ─────────────────────────────
function toSceneData(sc, rawTakes, currentDay, dayNum, deptItems) {
  return {
    sceneKey:    sc.sceneKey,
    sceneNumber: sc.sceneNumber || sc.id || '?',
    epId:        sc.epId || '',
    intExt:      sc.intExt,
    location:    sc.location,
    timeOfDay:   sc.timeOfDay,
    description: sc.description,
    characters:  sc.characters || [],
    duration:    sc.duration,
    callTime:    currentDay?.callTime,
    dayNumber:   dayNum,
    takes: (rawTakes || []).map((t, i) => ({
      id:        t.id,
      number:    i + 1,
      status:    t.status,
      notes:     t.notes,
      timestamp: t.timestamp,
    })),
    departmentItems: (deptItems || [])
      .filter(item => (item.scenes || []).includes(sc.sceneKey))
      .map(item => ({
        id:         item.id,
        name:       item.name,
        department: item.department,
        photos:     item.photos,
        approved:   item.approved,
      })),
  }
}

function toPersonData(m) {
  return {
    id:         m.id,
    name:       m.name || '?',
    role:       m.role || m.group || '',
    photo:      m.photo,
    phone:      m.phone,
    department: m.group,
    status:     (m.confirmedDays?.length > 0) ? 'confirmed' : 'pending',
  }
}

// ── Component ─────────────────────────────────────────────────────
export function MyDay() {
  const {
    auth, team, shootingDays, sceneAssignments, parsedScripts,
    locations, sceneTakes, departmentItems, departmentConfig,
    navigate, rsvp, updateRsvp, owmApiKey,
  } = useStore(useShallow(s => ({
    auth: s.auth, team: s.team, shootingDays: s.shootingDays,
    sceneAssignments: s.sceneAssignments, parsedScripts: s.parsedScripts,
    locations: s.locations, sceneTakes: s.sceneTakes,
    departmentItems: s.departmentItems, departmentConfig: s.departmentConfig,
    navigate: s.navigate, rsvp: s.rsvp, updateRsvp: s.updateRsvp,
    owmApiKey: s.owmApiKey,
  })))

  const role   = resolveRole(auth.role)
  const level  = getAccessLevel(role)
  const isActor = level === 5

  // ── Day navigation ──────────────────────────────────────────────
  const sortedDays = useMemo(
    () => [...shootingDays].sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    [shootingDays]
  )
  const today    = new Date().toISOString().slice(0, 10)
  const todayIdx = useMemo(() => {
    const idx = sortedDays.findIndex(d => d.date === today)
    return idx >= 0 ? idx : 0
  }, [sortedDays, today])

  const [selectedIdx, setSelectedIdx] = useState(null)
  const [weatherOpen, setWeatherOpen]   = useState(false)
  const [sceneDetail, setSceneDetail]   = useState(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)

  const dayIdx     = selectedIdx !== null ? selectedIdx : todayIdx
  const currentDay = sortedDays[dayIdx] || null
  const dayNum     = currentDay?.dayNumber || dayIdx + 1

  const goNext = useCallback(
    () => setSelectedIdx(Math.min((selectedIdx ?? todayIdx) + 1, sortedDays.length - 1)),
    [selectedIdx, todayIdx, sortedDays.length]
  )
  const goPrev = useCallback(
    () => setSelectedIdx(Math.max((selectedIdx ?? todayIdx) - 1, 0)),
    [selectedIdx, todayIdx]
  )

  // ── Scenes ─────────────────────────────────────────────────────
  const dayScenes = useMemo(
    () => currentDay ? getScenesForDay(currentDay.id, sceneAssignments, parsedScripts) : [],
    [currentDay, sceneAssignments, parsedScripts]
  )

  const me = useMemo(() => {
    if (!auth.user) return null
    const name = typeof auth.user === 'string' ? auth.user : auth.user?.name
    if (!name) return null
    return team.find(m => m.name === name || m.name?.toLowerCase().includes(name.toLowerCase().split(' ')[0]))
  }, [auth.user, team])

  const charFirst = (me?.characterName || (isActor ? (typeof auth.user === 'string' ? auth.user : auth.user?.name) : null))
    ?.toLowerCase().split(' ')[0]

  const myScenes = useMemo(() => {
    if (isActor && charFirst)
      return dayScenes.filter(sc => (sc.characters || []).some(ch => ch.toLowerCase().includes(charFirst)))
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

  // ── Dept pills ──────────────────────────────────────────────────
  const deptPills = useMemo(() => {
    const map = {}
    for (const item of departmentItems) {
      const d = item.department || 'other'
      map[d] = (map[d] || 0) + 1
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [departmentItems])

  const deptMap = useMemo(() => {
    const m = {}; for (const d of (departmentConfig || [])) m[d.id] = d; return m
  }, [departmentConfig])

  // ── Weather ─────────────────────────────────────────────────────
  const demoWeather = { temp: 18, desc: 'Parcialmente nublado', wind: 12, humidity: 65, city: 'Lisboa', feelsLike: 16 }
  const [weather, setWeather] = useState(demoWeather)
  useEffect(() => {
    if (!owmApiKey) return
    const city = todayLocation?.city || todayLocation?.name || 'Lisboa'
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},PT&appid=${owmApiKey}&units=metric&lang=pt`
    fetch(url).then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return
      setWeather({ temp: Math.round(d.main?.temp), desc: d.weather?.[0]?.description || '', wind: Math.round((d.wind?.speed || 0) * 3.6), humidity: d.main?.humidity, city: d.name || city })
    }).catch(() => {})
  }, [owmApiKey, todayLocation])

  // ── Clock ───────────────────────────────────────────────────────
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])
  const clockStr = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

  // ── Crew ────────────────────────────────────────────────────────
  const todayCrew = useMemo(() => {
    return team.filter(m => {
      const uname = typeof auth.user === 'string' ? auth.user : auth.user?.name
      if (m.name === uname) return false
      if (currentDay && m.confirmedDays?.includes(currentDay.id)) return true
      if (currentDay && rsvp?.[currentDay.id]?.[m.id]?.status === 'confirmed') return true
      const r = (m.role || '').toLowerCase()
      return r.includes('realiz') || r.includes('produção') || r.includes('dop') || r.includes('câmara') || r.includes('som')
    }).slice(0, 6)
  }, [team, auth.user, currentDay, rsvp])

  // ── Entity card data ────────────────────────────────────────────
  const weatherCardData = useMemo(() => ({
    temp:        weather?.temp ?? 18,
    feelsLike:   weather?.feelsLike,
    description: weather?.desc || weather?.description || '',
    wind:        weather?.wind,
    humidity:    weather?.humidity,
    city:        weather?.city || 'Lisboa',
    sunrise:     currentDay?.sunrise,
    sunset:      currentDay?.sunset,
  }), [weather, currentDay])

  const callMetric = useMemo(() => ({
    label:       'PRÓXIMA CHAMADA',
    value:       currentDay?.callTime || '—',
    accentColor: C.emerald,
    icon:        <Clock size={18} />,
    delta: dayProgress.total > 0 ? {
      value:     dayProgress.done,
      direction: dayProgress.done > 0 ? 'up' : 'neutral',
      label:     `de ${dayProgress.total} cenas`,
    } : undefined,
  }), [currentDay, dayProgress])

  const locationCardData = useMemo(() => ({
    id:           todayLocation?.id || 'loc',
    name:         todayLocation?.displayName || todayLocation?.name || 'Sem localização',
    address:      todayLocation?.address,
    city:         todayLocation?.city,
    googleMapsUrl:todayLocation?.googleMapsUrl,
    travelTime:   todayLocation?.travelTime,
    photos:       todayLocation?.photos,
    accentColor:  C.purple,
  }), [todayLocation])

  const dayCardData = useMemo(() => currentDay ? ({
    id:         currentDay.id,
    date:       currentDay.date,
    dayNumber:  dayNum,
    callTime:   currentDay.callTime,
    wrapTime:   currentDay.wrapTime,
    location:   todayLocation?.name,
    sceneCount: myScenes.length,
    status:     isFilming ? 'filming' : dayProgress.pct === 100 && dayProgress.total > 0 ? 'done' : 'planned',
  }) : null, [currentDay, dayNum, todayLocation, myScenes.length, isFilming, dayProgress])

  const timelineItems = useMemo(() => {
    if (!currentDay) return []
    const base = currentDay.callTime || '08:00'
    const items = [
      { id: 'call', type: 'call', time: base, label: 'Chamada Geral', sublabel: todayLocation?.name || '' },
    ]
    myScenes.forEach((sc, i) => {
      const takes = sceneTakes?.[sc.sceneKey] || []
      const done  = takes.some(t => t.status === 'BOM' || t.status === 'bom')
      items.push({
        id:       `scene-${sc.sceneKey}`,
        type:     'scene',
        time:     addTime(base, 30 + i * 45),
        label:    `Cena ${sc.sceneNumber || sc.id}`,
        sublabel: sc.location || '',
        duration: sc.duration ? Math.round((sc.duration / 8) * 90) : 45,
        status:   done ? 'done' : i === 0 ? 'active' : 'upcoming',
      })
    })
    if (myScenes.length > 0) {
      items.push({ id: 'lunch', type: 'meal', time: '13:00', label: 'Almoço', duration: 60, status: 'upcoming' })
    }
    if (currentDay.wrapTime) {
      items.push({ id: 'wrap', type: 'wrap', time: currentDay.wrapTime, label: 'Wrap', status: 'upcoming' })
    }
    return items.sort((a, b) => a.time.localeCompare(b.time))
  }, [currentDay, myScenes, sceneTakes, todayLocation])

  // ── Date string ─────────────────────────────────────────────────
  const dateStr = currentDay?.date
    ? new Date(currentDay.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const dateCap  = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  const userName = typeof auth.user === 'string' ? auth.user : auth.user?.name || 'Utilizador'
  const callTime = currentDay?.callTime || '08:00'

  // ══════════════════════════════════════════════════════════════════
  return (
    <div className={styles.dashboard}>
      <div className={styles.content}>

        {/* ── Hero header ── */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>O TEU DIA</h1>
            <p className={styles.heroSub}>{dateCap} &bull; {userName}</p>
          </div>
          <div className={styles.heroRight} style={{ cursor: 'pointer' }} onClick={() => currentDay && setScheduleOpen(true)}>
            <span className={styles.heroClock}>{clockStr}</span>
          </div>
        </div>

        {/* ── Service sheet CTA ── */}
        <button className={styles.serviceBtn} onClick={() => navigate('callsheet')}>
          <Calendar size={16} />
          <span>FOLHA DE SERVIÇO DO DIA</span>
        </button>

        {/* ── Info cards row — entity cards ── */}
        <div className={styles.infoRow}>
          <WeatherCard
            weather={weatherCardData}
            onPress={() => setWeatherOpen(true)}
          />
          <MetricCard metric={callMetric} />
          <FilmLocationCard
            location={locationCardData}
            onPress={() => todayLocation && setLocationOpen(true)}
            onMaps={todayLocation?.googleMapsUrl
              ? () => window.open(todayLocation.googleMapsUrl, '_blank')
              : undefined}
          />
        </div>

        {/* ── Day timeline card ── */}
        {dayCardData && (
          <DayTimelineItemCard
            day={dayCardData}
            items={timelineItems}
            onPress={() => currentDay && setScheduleOpen(true)}
          />
        )}

        {/* ── Dept pills ── */}
        <div className={styles.pillRow}>
          <div className={styles.pillGroup}>
            {deptPills.map(([dept, count]) => {
              const Icon  = DEPT_ICONS[dept] || Film
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
          {isFilming && <span className={styles.filmingBadge}>FILMANDO</span>}
        </div>

        {/* ── Cenas ── */}
        {myScenes.length > 0 && (
          <>
            <span className={styles.sectionLabel}>Cenas do Dia</span>
            <div className={styles.cardGrid}>
              {myScenes.map((sc, i) => (
                <SceneCard
                  key={sc.sceneKey}
                  context="dashboard"
                  highlighted={nextScene?.sceneKey === sc.sceneKey && i > 0}
                  scene={toSceneData(sc, sceneTakes?.[sc.sceneKey], currentDay, dayNum, departmentItems)}
                  onPress={() => setSceneDetail(sc)}
                />
              ))}
            </div>
          </>
        )}

        {myScenes.length === 0 && (
          <div className={styles.emptyScenes}>
            <Film size={28} />
            <p>Sem cenas atribuídas para este dia</p>
            <button className={styles.emptyBtn} onClick={() => navigate('production')}>
              Ir para Produção
            </button>
          </div>
        )}

        {/* ── Equipa ── */}
        {todayCrew.length > 0 && (
          <>
            <span className={styles.sectionLabel}>Equipa Hoje</span>
            <div className={styles.cardGrid}>
              {todayCrew.map(m => (
                <PersonCard
                  key={m.id}
                  person={toPersonData(m)}
                  onCall={m.phone ? () => { window.location.href = `tel:${m.phone}` } : undefined}
                />
              ))}
            </div>
          </>
        )}

      </div>

      {/* ── Day navigation ── */}
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

      {/* ── Overlays (unchanged) ── */}
      <WeatherOverlay
        open={weatherOpen}
        onClose={() => setWeatherOpen(false)}
        weather={weather || demoWeather}
        sunrise={currentDay?.sunrise || '07:24'}
        sunset={currentDay?.sunset  || '18:42'}
        location={weather?.city || todayLocation?.city || 'Lisboa'}
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
