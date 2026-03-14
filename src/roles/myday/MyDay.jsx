/**
 * MyDay — "O Teu Dia" — Dashboard pessoal
 * Layout: three glass panels — Day Overview, Department Readiness, Scene Prep
 * Panels use SURFACE.panel. Cards use canonical entity cards. No new components.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Film } from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { resolveRole, getAccessLevel } from '../../core/roles.js'
import { getScenesForDay } from '../../utils/dashboardHelpers.js'
import { WeatherOverlay }     from '../../components/shared/WeatherOverlay.jsx'
import { SceneDetailOverlay } from '../../components/shared/SceneDetailOverlay.jsx'
import { ScheduleOverlay }    from '../../components/shared/ScheduleOverlay.jsx'
import { LocationOverlay }    from '../../components/shared/LocationOverlay.jsx'
import {
  WeatherCard, SceneCard, FilmLocationCard, DepartmentStatusCard,
} from '../../components/shared/ui'
import { SURFACE, C } from '../../components/shared/ui/tokens'
import { ScenePrepCard } from '../../app/components/ScenePrepCard'
import styles from './MyDay.module.css'

// ── Adapters: store shape → card prop types ────────────────────────

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
      id: t.id, number: i + 1, status: t.status, notes: t.notes, timestamp: t.timestamp,
    })),
    departmentItems: (deptItems || [])
      .filter(item => (item.scenes || []).includes(sc.sceneKey))
      .map(item => ({
        id: item.id, name: item.name, department: item.department,
        photos: item.photos, approved: item.approved,
      })),
  }
}

function toDeptStatuses(departmentConfig, departmentItems, team) {
  return (departmentConfig || [])
    .map(dept => {
      const items = (departmentItems || []).filter(i => i.department === dept.id)
      if (items.length === 0) return null
      const readyCount = items.filter(i => i.approved).length
      const pending    = items.filter(i => !i.approved).slice(0, 3).map(i => i.name || 'Sem nome')
      const hod        = (team || []).find(m => m.group === dept.id)
      return {
        id:           dept.id,
        department:   dept.id,
        label:        dept.label,
        color:        dept.color,
        ready:        readyCount === items.length,
        readyCount,
        totalCount:   items.length,
        pendingItems: pending,
        hod: hod ? { id: hod.id, name: hod.name, role: hod.role || '' } : undefined,
      }
    })
    .filter(Boolean)
}

function toPrepCardData(sc, departmentItems, sceneTakes) {
  const sceneItems = (departmentItems || []).filter(i => (i.scenes || []).includes(sc.sceneKey))
  const withPhoto  = sceneItems.find(i => i.photos?.length > 0)
  return {
    id:             sc.sceneKey,
    number:         sc.sceneNumber || sc.id || '?',
    title:          sc.location || `Cena ${sc.sceneNumber || sc.id}`,
    description:    sc.description || '',
    location:       sc.location || '',
    timeOfDay:      sc.intExt || sc.int_ext || 'INT',
    period:         sc.timeOfDay || sc.time || 'DIA',
    color:          C.emerald,
    thumbnail:      withPhoto?.photos?.[0] || null,
    items:          sceneItems.slice(0, 6).map(i => ({
      title:  i.name || 'Item',
      type:   i.department || 'Item',
      status: i.approved ? 'confirmed' : 'pending',
    })),
    script:          sc.dialogue || [],
    continuityNotes: sc.continuityNotes || [],
    characters:      sc.characters || [],
    wardrobe:        sceneItems
      .filter(i => i.department === 'wardrobe')
      .map(i => i.name)
      .filter(Boolean),
  }
}

// ── Component ──────────────────────────────────────────────────────

export function MyDay() {
  const {
    auth, team, shootingDays, sceneAssignments, parsedScripts,
    locations, sceneTakes, departmentItems, departmentConfig,
    navigate, owmApiKey,
  } = useStore(useShallow(s => ({
    auth: s.auth, team: s.team, shootingDays: s.shootingDays,
    sceneAssignments: s.sceneAssignments, parsedScripts: s.parsedScripts,
    locations: s.locations, sceneTakes: s.sceneTakes,
    departmentItems: s.departmentItems, departmentConfig: s.departmentConfig,
    navigate: s.navigate, owmApiKey: s.owmApiKey,
  })))

  const role    = resolveRole(auth.role)
  const level   = getAccessLevel(role)
  const isActor = level === 5

  // ── Day navigation ───────────────────────────────────────────────
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

  // ── Scenes ──────────────────────────────────────────────────────
  const dayScenes = useMemo(
    () => currentDay ? getScenesForDay(currentDay.id, sceneAssignments, parsedScripts) : [],
    [currentDay, sceneAssignments, parsedScripts]
  )

  const me = useMemo(() => {
    if (!auth.user) return null
    const name = typeof auth.user === 'string' ? auth.user : auth.user?.name
    if (!name) return null
    return team.find(m =>
      m.name === name ||
      m.name?.toLowerCase().includes(name.toLowerCase().split(' ')[0])
    )
  }, [auth.user, team])

  const charFirst = (
    me?.characterName ||
    (isActor ? (typeof auth.user === 'string' ? auth.user : auth.user?.name) : null)
  )?.toLowerCase().split(' ')[0]

  const myScenes = useMemo(() => {
    if (isActor && charFirst)
      return dayScenes.filter(sc =>
        (sc.characters || []).some(ch => ch.toLowerCase().includes(charFirst))
      )
    return dayScenes
  }, [dayScenes, isActor, charFirst])

  // ── Progress ─────────────────────────────────────────────────────
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

  // ── Location ─────────────────────────────────────────────────────
  const todayLocation = useMemo(() => {
    const loc = myScenes[0]?.location
    if (!loc) return null
    return (
      locations.find(l =>
        l.name === loc || l.name?.toLowerCase().includes(loc.toLowerCase())
      ) || { name: loc }
    )
  }, [myScenes, locations])

  // ── Next undone scene ────────────────────────────────────────────
  const nextScene = useMemo(() => {
    const undone = myScenes.find(sc => {
      const takes = sceneTakes?.[sc.sceneKey] || []
      return !takes.some(t => t.status === 'BOM' || t.status === 'bom')
    })
    return undone || myScenes[0] || null
  }, [myScenes, sceneTakes])

  // ── Weather ──────────────────────────────────────────────────────
  const demoWeather = {
    temp: 18, desc: 'Parcialmente nublado', wind: 12,
    humidity: 65, city: 'Lisboa', feelsLike: 16,
  }
  const [weather, setWeather] = useState(demoWeather)
  useEffect(() => {
    if (!owmApiKey) return
    const city = todayLocation?.city || todayLocation?.name || 'Lisboa'
    const url  = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},PT&appid=${owmApiKey}&units=metric&lang=pt`
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        setWeather({
          temp:     Math.round(d.main?.temp),
          desc:     d.weather?.[0]?.description || '',
          wind:     Math.round((d.wind?.speed || 0) * 3.6),
          humidity: d.main?.humidity,
          city:     d.name || city,
        })
      })
      .catch(() => {})
  }, [owmApiKey, todayLocation])

  // ── Clock ────────────────────────────────────────────────────────
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])
  const clockStr = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

  // ── Card data ────────────────────────────────────────────────────
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

  const locationCardData = useMemo(() => ({
    id:            todayLocation?.id || 'loc',
    name:          todayLocation?.displayName || todayLocation?.name || 'Sem localização',
    address:       todayLocation?.address,
    city:          todayLocation?.city,
    googleMapsUrl: todayLocation?.googleMapsUrl,
    travelTime:    todayLocation?.travelTime,
    photos:        todayLocation?.photos,
    accentColor:   C.purple,
  }), [todayLocation])

  const nextSceneCardData = useMemo(() =>
    nextScene
      ? toSceneData(nextScene, sceneTakes?.[nextScene.sceneKey], currentDay, dayNum, departmentItems)
      : null,
    [nextScene, sceneTakes, currentDay, dayNum, departmentItems]
  )

  const deptStatuses = useMemo(
    () => toDeptStatuses(departmentConfig, departmentItems, team),
    [departmentConfig, departmentItems, team]
  )

  const prepCardData = useMemo(() =>
    nextScene ? toPrepCardData(nextScene, departmentItems, sceneTakes) : null,
    [nextScene, departmentItems, sceneTakes]
  )

  // ── Strings ──────────────────────────────────────────────────────
  const dateStr  = (currentDay?.date
    ? new Date(currentDay.date)
    : new Date()
  ).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateCap  = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  const userName = typeof auth.user === 'string' ? auth.user : auth.user?.name || 'Utilizador'

  // ══════════════════════════════════════════════════════════════════
  return (
    <div className={styles.dashboard}>
      <div className={styles.content}>

        {/* ── Hero ── */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.heroTitleRow}>
              <h1 className={styles.heroTitle}>O TEU DIA</h1>
              {isFilming && <span className={styles.filmingBadge}>FILMANDO</span>}
            </div>
            <p className={styles.heroDate}>{dateCap}</p>
            <p className={styles.heroUser}>{userName}</p>
          </div>
          <div
            className={styles.heroRight}
            onClick={() => currentDay && setScheduleOpen(true)}
          >
            <span className={styles.heroClock}>{clockStr}</span>
          </div>
        </div>

        {/* ══ Panel 1: Day Overview ══ */}
        <div className={styles.panel} style={SURFACE.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>
              Dia {dayNum}
              {dayProgress.total > 0 && (
                <span className={styles.panelMeta}>
                  {' '}· {dayProgress.done}/{dayProgress.total} cenas
                </span>
              )}
            </span>
            <button
              className={styles.panelAction}
              onClick={() => navigate('callsheet')}
            >
              Folha de Serviço →
            </button>
          </div>

          <div className={styles.panelBody}>
            <div className={styles.overviewGrid}>
              <WeatherCard
                weather={weatherCardData}
                onPress={() => setWeatherOpen(true)}
              />

              {nextSceneCardData ? (
                <SceneCard
                  context="dashboard"
                  scene={nextSceneCardData}
                  highlighted
                  onPress={() => nextScene && setSceneDetail(nextScene)}
                />
              ) : (
                <div className={styles.emptyCard} style={SURFACE.inner}>
                  <Film size={24} />
                  <span>Sem cenas para hoje</span>
                  <button
                    className={styles.emptyBtn}
                    onClick={() => navigate('production')}
                  >
                    Ir para Produção
                  </button>
                </div>
              )}

              <FilmLocationCard
                location={locationCardData}
                onPress={() => todayLocation && setLocationOpen(true)}
                onMaps={todayLocation?.googleMapsUrl
                  ? () => window.open(todayLocation.googleMapsUrl, '_blank')
                  : undefined}
              />
            </div>
          </div>
        </div>

        {/* ══ Panel 2: Department Readiness ══ */}
        {deptStatuses.length > 0 && (
          <div className={styles.panel} style={SURFACE.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Departamentos</span>
              <button
                className={styles.panelAction}
                onClick={() => navigate('departments')}
              >
                Ver tudo →
              </button>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.deptScroll}>
                {deptStatuses.map(dept => (
                  <DepartmentStatusCard
                    key={dept.id}
                    dept={dept}
                    onPress={() => navigate('departments')}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ Panel 3: Scene Prep ══ */}
        {prepCardData && (
          <div className={styles.panel} style={SURFACE.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Em Preparação</span>
              <span className={styles.panelMeta}>Próxima cena por rodar</span>
            </div>
            <div className={styles.panelBody}>
              <ScenePrepCard {...prepCardData} isNext />
            </div>
          </div>
        )}

      </div>

      {/* ── Day navigation ── */}
      {sortedDays.length > 1 && (
        <div className={styles.dayNav}>
          <button className={styles.dayBtn} onClick={goPrev} disabled={dayIdx <= 0}>
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className={styles.dayIndicator}>D{dayNum} de {sortedDays.length}</span>
          <button
            className={styles.dayBtn}
            onClick={goNext}
            disabled={dayIdx >= sortedDays.length - 1}
          >
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
        sunset={currentDay?.sunset   || '18:42'}
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
