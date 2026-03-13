// DayView — Vista 5: folha de serviço integrada com guião
// Vista do dia actual ou seleccionado, com timeline, cenas, elenco, props

import { useState, useMemo } from 'react'
import {
  Clock, MapPin, Users, Camera, Sun, FileText,
  AlertTriangle, Scissors, ChevronDown,
} from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { exportCallSheet } from '../../production/schedule/utils/scheduleExport.js'
import styles from '../Script.module.css'

export function DayView({ scriptData }) {
  const { cenasPorDia, allScenes, costuras } = scriptData
  const {  shootingDays, universe  } = useStore(useShallow(s => ({ shootingDays: s.shootingDays, universe: s.universe })))

  // Default to first day or today
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayDay = shootingDays.find(d => d.date === todayStr)
  const [selectedDay, setSelectedDay] = useState(todayDay?.id || shootingDays[0]?.id || null)

  const dayData = cenasPorDia[selectedDay]
  const day = dayData?.day
  const dayScenes = dayData?.scenes || []

  // Characters with universe photos
  const dayChars = useMemo(() => {
    const charSet = new Set()
    dayScenes.forEach(s => (s.characters || []).forEach(c => charSet.add(c)))
    return [...charSet].map(name => {
      const uChar = (universe?.chars || []).find(c => c.name.toLowerCase() === name.toLowerCase())
      return { name, photo: uChar?.photo || null }
    })
  }, [dayScenes, universe?.chars])

  // Locations
  const dayLocations = useMemo(() => {
    const locs = new Set()
    dayScenes.forEach(s => { if (s.location) locs.add(s.location) })
    return [...locs]
  }, [dayScenes])

  // Day costuras
  const dayCosturas = useMemo(() => {
    return costuras.filter(c =>
      c.dayId_antes === selectedDay || c.dayId_depois === selectedDay
    )
  }, [costuras, selectedDay])

  const filmadas = dayScenes.filter(s => s.estado === 'filmada').length
  const totalMin = dayScenes.reduce((s, sc) => s + (sc.durationMin || sc.duration || 0), 0)

  return (
    <div className={styles.dayRoot}>
      {/* Day selector */}
      <div className={styles.shootDaySelector} style={{ marginBottom: 'var(--space-4)' }}>
        {shootingDays.map(d => (
          <button
            key={d.id}
            className={`${styles.shootDayBtn} ${selectedDay === d.id ? styles.shootDayBtnActive : ''}`}
            onClick={() => setSelectedDay(d.id)}
          >
            D{d.dayNumber}
          </button>
        ))}
      </div>

      {!day && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          Selecciona um dia
        </p>
      )}

      {day && (
        <>
          {/* Day header */}
          <div className={styles.dayHeader}>
            <div className={styles.dayTitle}>
              DIA {day.dayNumber} · {dayLocations[0] || '—'}
            </div>
            <div className={styles.daySubtitle}>
              {day.date
                ? new Date(day.date + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
                : '—'
              }
            </div>

            <div className={styles.dayMeta}>
              <div className={styles.dayMetaItem}>
                <span className={styles.dayMetaLabel}>INÍCIO</span>
                <span className={styles.dayMetaValue}>{day.callTime || '08:00'}</span>
              </div>
              <div className={styles.dayMetaItem}>
                <span className={styles.dayMetaLabel}>CENAS</span>
                <span className={styles.dayMetaValue}>{dayScenes.length}</span>
              </div>
              <div className={styles.dayMetaItem}>
                <span className={styles.dayMetaLabel}>TOTAL</span>
                <span className={styles.dayMetaValue}>{totalMin}min</span>
              </div>
              <div className={styles.dayMetaItem}>
                <span className={styles.dayMetaLabel}>PROGRESSO</span>
                <span className={styles.dayMetaValue} style={{
                  color: filmadas === dayScenes.length && dayScenes.length > 0
                    ? 'var(--health-green)' : 'var(--text-primary)',
                }}>
                  {filmadas}/{dayScenes.length}
                </span>
              </div>
              {dayCosturas.length > 0 && (
                <div className={styles.dayMetaItem}>
                  <span className={styles.dayMetaLabel}>COSTURAS</span>
                  <span className={styles.dayMetaValue} style={{ color: 'var(--health-red)' }}>
                    {dayCosturas.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cast thumbnails */}
          {dayChars.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-4)' }}>
              <Users size={12} color="var(--text-muted)" />
              <div className={styles.dayCharThumbs}>
                {dayChars.map(({ name, photo }) => (
                  photo ? (
                    <img key={name} src={photo} className={styles.dayCharThumb} alt={name} title={name} />
                  ) : (
                    <div key={name} className={styles.dayCharThumbPlaceholder} title={name}>
                      {name[0]}
                    </div>
                  )
                ))}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {dayChars.map(c => c.name).join(', ')}
              </span>
            </div>
          )}

          {/* Costura alerts */}
          {dayCosturas.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', marginBottom: 6,
              background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
              borderRadius: 'var(--radius-md)', fontSize: 11,
            }}>
              <Scissors size={11} color="var(--health-red)" />
              <span style={{ color: 'var(--health-red)', fontWeight: 700 }}>
                {c.cena_depois} é costura com {c.cena_antes} (DIA {c.dia_antes})
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                — {c.intervalo_dias}d intervalo · ver fotos de continuidade
              </span>
            </div>
          ))}

          {/* Scene cards */}
          {dayScenes.map((scene, idx) => {
            const prevScene = idx > 0 ? dayScenes[idx - 1] : null
            const locationChanged = prevScene && prevScene.location !== scene.location
            const isFilmada = scene.estado === 'filmada'

            return (
              <div key={scene.sceneKey}>
                {locationChanged && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 0', color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic',
                  }}>
                    → DESLOCAÇÃO para {scene.location}
                  </div>
                )}

                <div
                  className={styles.daySceneCard}
                  style={{
                    borderLeftColor: isFilmada ? 'var(--health-green)' : scene.locationColor || 'var(--border-default)',
                    opacity: isFilmada ? 0.6 : 1,
                  }}
                >
                  <div className={styles.daySceneHeader}>
                    <span className={styles.daySceneNum}>#{scene.sceneNumber || scene.id}</span>
                    <span style={{ fontSize: 10, color: 'var(--mod-production)', fontWeight: 700 }}>{scene.epId}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: scene.intExt === 'EXT' ? '#F5A623' : 'var(--text-muted)' }}>
                      {scene.intExt}
                    </span>
                    <span className={styles.daySceneLoc}>
                      <MapPin size={9} /> {scene.location}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
                      {scene.hora_prevista || '—'} · {scene.durationMin || scene.duration || '?'}min
                    </span>
                  </div>

                  {/* Characters */}
                  {(scene.characters || []).length > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {scene.characters.join(' · ')}
                    </div>
                  )}

                  {/* Synopsis */}
                  {scene.synopsis && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {scene.synopsis}
                    </p>
                  )}

                  {/* Continuity notes */}
                  {scene.continuidade && (
                    <div style={{ marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                      {scene.continuidade.wardrobe && <span>👗 {scene.continuidade.wardrobe} · </span>}
                      {scene.continuidade.props && <span>🎭 {scene.continuidade.props}</span>}
                    </div>
                  )}

                  {/* Estado badge */}
                  {isFilmada && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: 'var(--health-green)',
                      background: 'rgba(34,197,94,0.1)', padding: '1px 6px', borderRadius: 'var(--radius-sm)',
                      marginTop: 4, display: 'inline-block',
                    }}>
                      FILMADA
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {dayScenes.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              Nenhuma cena atribuída a este dia
            </p>
          )}

          {/* Bottom links */}
          <div className={styles.dayLinks}>
            <button className={styles.dayLinkBtn}>
              <FileText size={12} /> FOLHA DE SERVIÇO PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
