// ShootingView — Vista 2: guião reordenado por ordem de filmagem
// Selector de dia + cenas por ordem de rodagem com acções rápidas

import { useState, useMemo } from 'react'
import { Check, Edit3, Scissors, Plus, MapPin, Clock, ArrowRight } from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import styles from '../Script.module.css'

export function ShootingView({ scriptData }) {
  const { cenasPorDia, allScenes } = scriptData
  const {  shootingDays, setSceneStatus, addSceneNote  } = useStore(useShallow(s => ({ shootingDays: s.shootingDays, setSceneStatus: s.setSceneStatus, addSceneNote: s.addSceneNote })))
  const [selectedDay, setSelectedDay] = useState(shootingDays[0]?.id || null)

  const dayData = cenasPorDia[selectedDay]
  const dayScenes = dayData?.scenes || []
  const day = dayData?.day

  // Progresso do dia
  const filmadas = dayScenes.filter(s => s.estado === 'filmada').length
  const total = dayScenes.length
  const pct = total > 0 ? Math.round((filmadas / total) * 100) : 0

  function handleMarkFilmada(sceneKey) {
    setSceneStatus(sceneKey, 'filmada')
  }

  function handleMarkPick(sceneKey) {
    const pick = prompt('Que parte falta filmar?')
    if (pick) {
      setSceneStatus(sceneKey, 'pick_pendente')
    }
  }

  function handleAddNota(sceneKey) {
    const nota = prompt('Nota de realização:')
    if (nota) {
      addSceneNote(sceneKey, nota)
    }
  }

  return (
    <div className={styles.shootRoot}>
      {/* Day selector */}
      <div className={styles.shootDaySelector}>
        {shootingDays.map(d => (
          <button
            key={d.id}
            className={`${styles.shootDayBtn} ${selectedDay === d.id ? styles.shootDayBtnActive : ''}`}
            onClick={() => setSelectedDay(d.id)}
          >
            D{d.dayNumber} · {d.date ? new Date(d.date + 'T00:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }) : '—'}
          </button>
        ))}
      </div>

      {!day && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          Selecciona um dia de rodagem
        </p>
      )}

      {day && (
        <>
          {/* Progress */}
          <div className={styles.shootProgress}>
            <span>{filmadas}/{total} cenas · {pct}%</span>
            <div className={styles.shootProgressBar}>
              <div className={styles.shootProgressFill} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Scenes in shooting order */}
          {dayScenes.map((scene, idx) => {
            const prevScene = idx > 0 ? dayScenes[idx - 1] : null
            const locationChanged = prevScene && prevScene.location !== scene.location
            const isFilmada = scene.estado === 'filmada'

            return (
              <div key={scene.sceneKey}>
                {/* Move block between locations */}
                {locationChanged && (
                  <div className={styles.shootMoveBlock}>
                    <ArrowRight size={10} />
                    DESLOCAÇÃO — {prevScene.location} → {scene.location}
                  </div>
                )}

                <div className={styles.shootTimeBlock}>
                  <span className={styles.shootTime}>
                    {scene.hora_prevista || '—'}
                  </span>

                  <div
                    className={styles.shootSceneCard}
                    style={{
                      borderLeftColor: isFilmada ? 'var(--health-green)' : 'var(--border-default)',
                      opacity: isFilmada ? 0.7 : 1,
                    }}
                  >
                    {/* Scene info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)' }}>
                        #{scene.sceneNumber || scene.id}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{scene.epId}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: scene.intExt === 'EXT' ? '#F5A623' : 'var(--text-muted)', fontWeight: 700 }}>
                        {scene.intExt}
                      </span>
                      <MapPin size={10} color="var(--text-muted)" />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {scene.location}
                      </span>
                      <Clock size={10} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {scene.durationMin || scene.duration || '—'}min
                      </span>
                    </div>

                    {/* Characters */}
                    {(scene.characters || []).length > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                        {scene.characters.join(' · ')}
                      </div>
                    )}

                    {/* Synopsis */}
                    {scene.synopsis && (
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0', lineHeight: 1.4 }}>
                        {scene.synopsis}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className={styles.shootActions}>
                      <button
                        className={`${styles.shootActionBtn} ${styles.shootActionFilmada}`}
                        onClick={() => handleMarkFilmada(scene.sceneKey)}
                        disabled={isFilmada}
                      >
                        <Check size={10} /> FILMADA
                      </button>
                      <button
                        className={`${styles.shootActionBtn} ${styles.shootActionPick}`}
                        onClick={() => handleMarkPick(scene.sceneKey)}
                      >
                        <Edit3 size={10} /> PICK
                      </button>
                      <button
                        className={`${styles.shootActionBtn} ${styles.shootActionNota}`}
                        onClick={() => handleAddNota(scene.sceneKey)}
                      >
                        <Plus size={10} /> NOTA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {dayScenes.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              Nenhuma cena atribuída a este dia
            </p>
          )}
        </>
      )}
    </div>
  )
}
