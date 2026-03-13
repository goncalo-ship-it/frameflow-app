// LocationView — vista por locais: mostra cada local, em que dias é usado, cenas agrupadas
// O coração da lógica de produção: "o algoritmo distribui LOCAIS, não cenas"

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, ChevronDown, ChevronUp, Clock, Camera, Star,
  Sun, Users, Layers, AlertTriangle,
} from 'lucide-react'
import styles from '../Schedule.module.css'

const TYPE_COLORS = {
  'Âncora':    '#A02E6F',
  'Grupo':     '#2E6FA0',
  'Diálogo':   '#2EA080',
  'Gag':       '#BF6A2E',
  'Solo':      '#7B4FBF',
  'Transição': '#6E6E78',
}

export function LocationView({ engineResult, onSceneClick }) {
  const [expanded, setExpanded] = useState(null)
  const [sortBy, setSortBy] = useState('duracao') // duracao | cenas | dias | nome

  const { days = [], allScenes = [], assignments = {} } = engineResult || {}

  // Agrupar cenas por local
  const locations = useMemo(() => {
    const map = new Map()

    allScenes.forEach(scene => {
      const loc = scene.location || 'SEM LOCAL'
      if (!map.has(loc)) {
        map.set(loc, {
          location: loc,
          color: scene.locationColor || '#6E6E78',
          scenes: [],
          totalMin: 0,
          episodios: new Set(),
          dias: new Set(),
          tem_ancora: false,
          tem_exterior: false,
          tem_golden: false,
          unassigned: 0,
        })
      }
      const g = map.get(loc)
      g.scenes.push(scene)
      g.totalMin += scene.duration || 45
      g.episodios.add(scene.epId)

      const dayId = assignments[scene.sceneKey]
      if (dayId) {
        g.dias.add(dayId)
      } else {
        g.unassigned++
      }

      g.tem_ancora = g.tem_ancora || (scene.sceneType || '').toLowerCase() === 'âncora'
      g.tem_exterior = g.tem_exterior || scene.intExt === 'EXT'
      g.tem_golden = g.tem_golden || !!scene.isGoldenHour
    })

    return [...map.values()].map(g => ({
      ...g,
      episodios: [...g.episodios],
      diasArr: [...g.dias],
      numDias: g.dias.size,
      isEspelho: g.episodios.size > 1,
    }))
  }, [allScenes, assignments])

  // Sorting
  const sorted = useMemo(() => {
    return [...locations].sort((a, b) => {
      switch (sortBy) {
        case 'duracao': return b.totalMin - a.totalMin
        case 'cenas':   return b.scenes.length - a.scenes.length
        case 'dias':    return b.numDias - a.numDias
        case 'nome':    return a.location.localeCompare(b.location)
        default: return 0
      }
    })
  }, [locations, sortBy])

  // Resumo
  const totalLocais = locations.length
  const espelhos = locations.filter(l => l.isEspelho).length
  const semDia = locations.filter(l => l.unassigned > 0).length

  if (allScenes.length === 0) {
    return (
      <div className={styles.calEmpty}>
        <MapPin size={36} color="var(--text-muted)" style={{ opacity: 0.4 }} />
        <p>Nenhuma cena disponível</p>
      </div>
    )
  }

  return (
    <div className={styles.locRoot}>
      {/* Barra de resumo */}
      <div className={styles.locSummaryBar}>
        <div className={styles.locStat}>
          <span className={styles.locStatNum}>{totalLocais}</span>
          <span className={styles.locStatLabel}>locais</span>
        </div>
        {espelhos > 0 && (
          <>
            <div className={styles.locStatDiv} />
            <div className={styles.locStat}>
              <span className={styles.locStatNum} style={{ color: 'var(--mod-continuity)' }}>{espelhos}</span>
              <span className={styles.locStatLabel}>espelhos</span>
            </div>
          </>
        )}
        {semDia > 0 && (
          <>
            <div className={styles.locStatDiv} />
            <div className={styles.locStat}>
              <span className={styles.locStatNum} style={{ color: 'var(--health-red)' }}>{semDia}</span>
              <span className={styles.locStatLabel}>c/ cenas sem dia</span>
            </div>
          </>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Ordenar:</span>
          {[
            { id: 'duracao', label: 'Duração' },
            { id: 'cenas', label: 'Cenas' },
            { id: 'dias', label: 'Dias' },
            { id: 'nome', label: 'Nome' },
          ].map(opt => (
            <button
              key={opt.id}
              className={`${styles.locSortBtn} ${sortBy === opt.id ? styles.locSortBtnActive : ''}`}
              onClick={() => setSortBy(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de locais */}
      <div className={styles.locList}>
        {sorted.map((loc, idx) => {
          const isOpen = expanded === loc.location

          // Cenas por dia
          const scenesByDay = {}
          loc.scenes.forEach(s => {
            const dayId = assignments[s.sceneKey]
            const key = dayId || '__unassigned'
            if (!scenesByDay[key]) scenesByDay[key] = []
            scenesByDay[key].push(s)
          })

          return (
            <motion.div
              key={loc.location}
              className={styles.locCard}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.5) }}
            >
              {/* Header */}
              <div
                className={styles.locCardHeader}
                onClick={() => setExpanded(isOpen ? null : loc.location)}
                style={{ borderLeftColor: loc.color }}
              >
                <div className={styles.locCardLeft}>
                  <span className={styles.locCardDot} style={{ background: loc.color }} />
                  <span className={styles.locCardName}>{loc.location}</span>

                  {/* Badges */}
                  {loc.isEspelho && (
                    <span className={styles.locBadge} style={{ background: 'rgba(46,160,128,0.12)', color: 'var(--mod-continuity)', borderColor: 'rgba(46,160,128,0.3)' }}>
                      <Layers size={9} /> Espelho ({loc.episodios.join(', ')})
                    </span>
                  )}
                  {loc.tem_ancora && (
                    <span className={styles.locBadge} style={{ background: 'rgba(160,46,111,0.12)', color: '#A02E6F', borderColor: 'rgba(160,46,111,0.3)' }}>
                      <Star size={9} /> Âncora
                    </span>
                  )}
                  {loc.tem_exterior && (
                    <span className={styles.locBadge} style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623', borderColor: 'rgba(245,166,35,0.3)' }}>
                      <Sun size={9} /> EXT
                    </span>
                  )}
                  {loc.unassigned > 0 && (
                    <span className={styles.locBadge} style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--health-red)', borderColor: 'rgba(248,113,113,0.3)' }}>
                      <AlertTriangle size={9} /> {loc.unassigned} s/ dia
                    </span>
                  )}
                </div>

                <div className={styles.locCardRight}>
                  <span className={styles.locCardStat}>
                    <Camera size={10} /> {loc.scenes.length}
                  </span>
                  <span className={styles.locCardStat}>
                    <Clock size={10} /> {loc.totalMin}m
                  </span>
                  <span className={styles.locCardStat}>
                    <MapPin size={10} /> {loc.numDias}d
                  </span>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {/* Conteúdo expandido */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    className={styles.locCardExpanded}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Personagens únicos */}
                    {(() => {
                      const chars = [...new Set(loc.scenes.flatMap(s => s.characters || []))]
                      if (chars.length === 0) return null
                      return (
                        <div className={styles.locChars}>
                          <Users size={10} color="var(--text-muted)" />
                          {chars.map(c => (
                            <span key={c} className={styles.locCharChip}>{c}</span>
                          ))}
                        </div>
                      )
                    })()}

                    {/* Cenas agrupadas por dia */}
                    {Object.entries(scenesByDay).map(([dayKey, scenes]) => {
                      const day = days.find(d => d.id === dayKey)
                      const isUnassigned = dayKey === '__unassigned'

                      return (
                        <div key={dayKey} className={styles.locDayGroup}>
                          <div className={styles.locDayLabel}>
                            {isUnassigned
                              ? <span style={{ color: 'var(--health-red)', fontWeight: 700 }}>Sem dia atribuído</span>
                              : <span style={{ color: 'var(--mod-production)', fontWeight: 700 }}>
                                  D{day?.dayNumber || '?'} — {day?.date
                                    ? new Date(day.date + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })
                                    : '—'
                                  }
                                </span>
                            }
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                              {scenes.length} cenas · {scenes.reduce((s, sc) => s + (sc.duration || 0), 0)}m
                            </span>
                          </div>

                          {scenes.map(scene => {
                            const typeColor = TYPE_COLORS[scene.sceneType] || '#6E6E78'
                            return (
                              <div
                                key={scene.sceneKey}
                                className={styles.locSceneRow}
                                style={{ borderLeftColor: typeColor, cursor: 'pointer' }}
                                onClick={() => onSceneClick?.(scene)}
                              >
                                <span style={{ color: 'var(--mod-production)', fontWeight: 700, fontSize: 10, minWidth: 36 }}>
                                  {scene.epId}
                                </span>
                                <span style={{ fontWeight: 700, color: 'var(--text-secondary)', minWidth: 24 }}>
                                  #{scene.sceneNumber}
                                </span>
                                <span
                                  className={styles.typeBadge}
                                  style={{ background: typeColor + '22', color: typeColor, borderColor: typeColor + '55' }}
                                >
                                  {scene.sceneType}
                                </span>
                                <span style={{
                                  fontWeight: 700, fontSize: 10,
                                  color: scene.intExt === 'EXT' ? '#F5A623' : 'var(--text-muted)',
                                }}>
                                  {scene.intExt}
                                </span>
                                <span style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {(scene.characters || []).join(', ')}
                                </span>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', flexShrink: 0 }}>
                                  {scene.duration}m
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
