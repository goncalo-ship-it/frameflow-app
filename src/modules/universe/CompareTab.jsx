// CompareTab — compare episodes with universe overlay
// Visual comparison: characters, forces, arcs across selected episodes

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { GitCompare, Users, Zap, Film } from 'lucide-react'
import { ARC_MAP, ARC_WEIGHT } from './utils.js'
import styles from './Universe.module.css'

// ── Helpers ──────────────────────────────────────────────────────

function getCharsInEpisode(epId, chars, episodeData) {
  const epChars = episodeData[epId] || {}
  const nameSet = new Set(Object.keys(epChars))
  return chars.filter(c => nameSet.has((c.name || '').toUpperCase()))
}

function getOverlap(epIds, chars, episodeData) {
  if (epIds.length < 2) return { shared: [], unique: {} }

  // For each char, find which selected episodes they appear in
  const charEpMap = new Map()
  for (const c of chars) {
    const key = (c.name || '').toUpperCase()
    const presentIn = epIds.filter(epId => {
      const epChars = episodeData[epId] || {}
      return !!epChars[key]
    })
    if (presentIn.length > 0) charEpMap.set(c, presentIn)
  }

  const shared = []
  const unique = {}
  for (const epId of epIds) unique[epId] = []

  for (const [c, presentIn] of charEpMap) {
    if (presentIn.length >= 2) {
      shared.push(c)
    } else {
      unique[presentIn[0]].push(c)
    }
  }

  return { shared, unique }
}

// ── Intensity color (scene count -> opacity) ─────────────────────

function presenceColor(scenes, maxScenes, baseColor) {
  if (!scenes || scenes === 0) return 'transparent'
  const alpha = Math.max(0.15, Math.min(0.85, scenes / Math.max(maxScenes, 1)))
  // Convert hex to rgb
  const hex = baseColor || '#A06AFF'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ── Compare Modes ────────────────────────────────────────────────

const MODES = [
  { id: 'personagens', label: 'Personagens', icon: Users },
  { id: 'forcas',      label: 'Forças',      icon: Zap },
  { id: 'arcos',       label: 'Arcos',       icon: Film },
]

// ── Arc phase colors ─────────────────────────────────────────────

const PHASE_COLORS = {
  setup:        '#5B8DEF',
  confronto:    '#E05B8D',
  clímax:       '#F5A623',
  resolução:    '#2EA080',
  desenvolvimento: '#8B6FBF',
}

function phaseColor(phase) {
  if (!phase) return '#7F8C8D'
  const key = phase.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [k, c] of Object.entries(PHASE_COLORS)) {
    const kNorm = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (key.includes(kNorm) || kNorm.includes(key)) return c
  }
  return '#7F8C8D'
}

// ── Venn Indicator ───────────────────────────────────────────────

function VennIndicator({ shared, uniqueA, uniqueB, labelA, labelB }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={120} height={70} viewBox="0 0 120 70">
        {/* Circle A */}
        <circle cx={42} cy={35} r={28} fill="rgba(91,141,239,0.25)" stroke="#5B8DEF" strokeWidth={1.5} />
        {/* Circle B */}
        <circle cx={78} cy={35} r={28} fill="rgba(224,91,141,0.25)" stroke="#E05B8D" strokeWidth={1.5} />
        {/* Counts */}
        <text x={30} y={38} textAnchor="middle" fill="#5B8DEF" fontSize={14} fontWeight={700}>{uniqueA}</text>
        <text x={60} y={38} textAnchor="middle" fill="#A06AFF" fontSize={14} fontWeight={700}>{shared}</text>
        <text x={90} y={38} textAnchor="middle" fill="#E05B8D" fontSize={14} fontWeight={700}>{uniqueB}</text>
        {/* Labels */}
        <text x={30} y={9} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={9}>{labelA}</text>
        <text x={90} y={9} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={9}>{labelB}</text>
      </svg>
    </div>
  )
}

// ── Overlap Summary ──────────────────────────────────────────────

function OverlapSummary({ selectedEps, overlap }) {
  const { shared, unique } = overlap
  const epIds = selectedEps

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '12px 16px',
        background: 'rgba(160,106,255,0.06)',
        borderRadius: 10,
        border: '1px solid rgba(160,106,255,0.15)',
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      {epIds.length === 2 && (
        <VennIndicator
          shared={shared.length}
          uniqueA={(unique[epIds[0]] || []).length}
          uniqueB={(unique[epIds[1]] || []).length}
          labelA={epIds[0]}
          labelB={epIds[1]}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
        <span style={{ color: '#A06AFF', fontWeight: 700 }}>
          {shared.length} personagens partilhadas
        </span>
        {epIds.map(epId => (
          <span key={epId} style={{ color: 'var(--text-muted)' }}>
            {(unique[epId] || []).length} personagens unicas de {epId}
          </span>
        ))}
      </div>

      {shared.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginLeft: 'auto' }}>
          {shared.slice(0, 8).map(c => {
            const arc = ARC_MAP[c.arcType] || { color: '#7F8C8D', label: '' }
            return (
              <span
                key={c.id}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: arc.color + '22',
                  color: arc.color,
                  border: `1px solid ${arc.color}33`,
                }}
              >
                {c.name}
              </span>
            )
          })}
          {shared.length > 8 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
              +{shared.length - 8}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── Personagens View ─────────────────────────────────────────────

function PersonagensView({ selectedEps, chars, episodeData }) {
  // Sort chars by arc weight
  const sorted = useMemo(() =>
    [...chars].sort((a, b) => {
      const wa = ARC_WEIGHT[a.arcType] ?? 5
      const wb = ARC_WEIGHT[b.arcType] ?? 5
      if (wa !== wb) return wa - wb
      return (a.name || '').localeCompare(b.name || '')
    }),
  [chars])

  // Only show chars present in at least one selected episode
  const visible = useMemo(() =>
    sorted.filter(c => {
      const key = (c.name || '').toUpperCase()
      return selectedEps.some(epId => (episodeData[epId] || {})[key])
    }),
  [sorted, selectedEps, episodeData])

  // Max scene count across selected episodes for intensity
  const maxScenes = useMemo(() => {
    let mx = 1
    for (const epId of selectedEps) {
      for (const d of Object.values(episodeData[epId] || {})) {
        if (d.scenes > mx) mx = d.scenes
      }
    }
    return mx
  }, [selectedEps, episodeData])

  // Which chars appear in multiple episodes
  const sharedSet = useMemo(() => {
    const s = new Set()
    for (const c of visible) {
      const key = (c.name || '').toUpperCase()
      let count = 0
      for (const epId of selectedEps) {
        if ((episodeData[epId] || {})[key]) count++
      }
      if (count >= 2) s.add(c.id)
    }
    return s
  }, [visible, selectedEps, episodeData])

  if (visible.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        <Users size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
        <p>Nenhuma personagem encontrada nos episodios seleccionados</p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0 2px',
        fontSize: 13,
      }}>
        <thead>
          <tr>
            <th style={{
              textAlign: 'left', padding: '8px 12px', fontSize: 11,
              color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.06em', minWidth: 180,
            }}>
              Personagem
            </th>
            {selectedEps.map(epId => (
              <th key={epId} style={{
                textAlign: 'center', padding: '8px 12px', fontSize: 12,
                color: 'var(--text-secondary)', fontWeight: 700, minWidth: 80,
              }}>
                {epId}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map(c => {
            const key = (c.name || '').toUpperCase()
            const arc = ARC_MAP[c.arcType] || { color: '#7F8C8D', label: '' }
            const isShared = sharedSet.has(c.id)

            return (
              <motion.tr
                key={c.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  background: isShared ? 'rgba(160,106,255,0.04)' : 'transparent',
                  borderRadius: 6,
                }}
              >
                <td style={{
                  padding: '6px 12px',
                  borderLeft: isShared ? '3px solid rgba(160,106,255,0.5)' : '3px solid transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: arc.color, flexShrink: 0,
                    }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.name}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 6px',
                      borderRadius: 20, background: arc.color + '22',
                      color: arc.color, flexShrink: 0,
                    }}>
                      {arc.label}
                    </span>
                    {isShared && (
                      <GitCompare size={11} style={{ color: '#A06AFF', opacity: 0.6 }} />
                    )}
                  </div>
                </td>
                {selectedEps.map(epId => {
                  const data = (episodeData[epId] || {})[key]
                  const scenes = data?.scenes || 0
                  const bg = presenceColor(scenes, maxScenes, arc.color)
                  return (
                    <td key={epId} style={{ textAlign: 'center', padding: '6px 8px' }}>
                      {scenes > 0 ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36, height: 28,
                            borderRadius: 6,
                            background: bg,
                            fontWeight: 700,
                            fontSize: 13,
                            color: '#fff',
                          }}
                          title={`${scenes} cenas, ${data?.lines || 0} falas`}
                        >
                          {scenes}
                        </div>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  )
                })}
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Forcas View ──────────────────────────────────────────────────

const FORCE_KEYWORDS = [
  'regra', 'lei', 'poder', 'magia', 'segredo', 'maldição', 'herança',
  'destino', 'pacto', 'proibição', 'código', 'ritual', 'tabu',
  'obrigação', 'sacrifício', 'transformação', 'limite',
]

function forceTouchesEpisode(force, epId, episodeArcs) {
  // Check if any episode arc description for this episode mentions force keywords or the force title
  const arcForEp = episodeArcs.filter(a =>
    a.epNum === epId || `EP${String(a.epNum).padStart(2, '0')}` === epId
  )
  if (arcForEp.length === 0) return false

  const forceWords = (force.title + ' ' + (force.text || '')).toLowerCase()
  for (const arc of arcForEp) {
    const arcText = ((arc.description || '') + ' ' + (arc.title || '') + ' ' + (arc.notes || '')).toLowerCase()
    // Direct title match
    if (arcText.includes(force.title?.toLowerCase())) return true
    // Keyword overlap
    const forceTokens = forceWords.split(/\s+/).filter(w => w.length > 3)
    for (const token of forceTokens) {
      if (arcText.includes(token)) return true
    }
  }
  return false
}

function ForcasView({ selectedEps, forces, episodeArcs }) {
  if (forces.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        <Zap size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
        <p>Sem forcas definidas no universo</p>
        <small>Adiciona forcas no separador Forcas</small>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {forces.map(force => {
        const epPresence = selectedEps.map(epId => ({
          epId,
          active: forceTouchesEpisode(force, epId, episodeArcs),
        }))

        return (
          <motion.div
            key={force.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 10,
              borderLeft: `4px solid ${force.color}`,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: force.color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, flexShrink: 0,
            }}>
              {force.num}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                {force.title}
              </div>
              {force.text && (
                <div style={{
                  fontSize: 12, color: 'var(--text-muted)',
                  marginTop: 2, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: 400,
                }}>
                  {force.text}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {epPresence.map(({ epId, active }) => (
                <div
                  key={epId}
                  style={{
                    width: 32, height: 24, borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    background: active ? force.color + '33' : 'rgba(255,255,255,0.03)',
                    color: active ? force.color : 'rgba(255,255,255,0.15)',
                    border: active ? `1px solid ${force.color}55` : '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s ease',
                  }}
                  title={`${force.title} — ${epId}: ${active ? 'presente' : 'sem referencia'}`}
                >
                  {epId.replace(/^EP0?/, '')}
                </div>
              ))}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Arcos View ───────────────────────────────────────────────────

function ArcosView({ selectedEps, episodeArcs }) {
  const arcsByEp = useMemo(() => {
    const map = {}
    for (const epId of selectedEps) {
      map[epId] = episodeArcs.filter(a =>
        a.epNum === epId || `EP${String(a.epNum).padStart(2, '0')}` === epId
      )
    }
    return map
  }, [selectedEps, episodeArcs])

  const hasAny = Object.values(arcsByEp).some(a => a.length > 0)

  if (!hasAny) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        <Film size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
        <p>Sem arcos definidos para os episodios seleccionados</p>
        <small>Adiciona arcos de episodio no separador Episodios</small>
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${selectedEps.length}, 1fr)`,
      gap: 16,
    }}>
      {selectedEps.map(epId => (
        <div key={epId}>
          <div style={{
            fontSize: 14, fontWeight: 800, color: '#A06AFF',
            marginBottom: 10, textAlign: 'center',
            fontFamily: 'var(--font-display)',
          }}>
            {epId}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(arcsByEp[epId] || []).map((arc, i) => {
              const pColor = arc.phaseColor || phaseColor(arc.phase)
              return (
                <motion.div
                  key={arc.id || i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    borderLeft: `3px solid ${pColor}`,
                  }}
                >
                  {arc.phase && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 20, background: pColor + '22',
                      color: pColor, display: 'inline-block', marginBottom: 6,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {arc.phase}
                    </span>
                  )}

                  <div style={{
                    fontWeight: 700, fontSize: 13,
                    color: 'var(--text-primary)', marginBottom: 4,
                  }}>
                    {arc.title || 'Sem titulo'}
                  </div>

                  {arc.desire && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                      Desejo: {arc.desire}
                    </div>
                  )}

                  {arc.description && (
                    <div style={{
                      fontSize: 11, color: 'var(--text-muted)',
                      lineHeight: 1.4, marginTop: 4,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {arc.description}
                    </div>
                  )}

                  {arc.anchorScene && (
                    <div style={{
                      fontSize: 10, color: '#F5A623', marginTop: 6,
                      fontWeight: 600,
                    }}>
                      Cena ancora: {arc.anchorScene}
                    </div>
                  )}
                </motion.div>
              )
            })}

            {(arcsByEp[epId] || []).length === 0 && (
              <div style={{
                textAlign: 'center', padding: 20,
                color: 'rgba(255,255,255,0.15)', fontSize: 12,
              }}>
                Sem arcos
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── CompareTab — main export
// ══════════════════════════════════════════════════════════════════

export function CompareTab({ chars, episodeArcs, forces, parsedScripts, episodeData, episodeIds }) {
  const [selectedEps, setSelectedEps] = useState([])
  const [mode, setMode]               = useState('personagens')

  // Toggle episode selection
  const toggleEp = (epId) => {
    setSelectedEps(prev =>
      prev.includes(epId) ? prev.filter(e => e !== epId) : [...prev, epId]
    )
  }

  // Overlap data
  const overlap = useMemo(
    () => getOverlap(selectedEps, chars, episodeData),
    [selectedEps, chars, episodeData]
  )

  // All available episode IDs (merge episodeArcs epNums + parsedScripts keys)
  const allEpIds = useMemo(() => {
    const ids = new Set(episodeIds || [])
    for (const arc of (episodeArcs || [])) {
      if (arc.epNum) {
        const formatted = arc.epNum.toString().startsWith('EP')
          ? arc.epNum
          : `EP${String(arc.epNum).padStart(2, '0')}`
        ids.add(formatted)
      }
    }
    return [...ids].sort()
  }, [episodeIds, episodeArcs])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Episode Selector Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        flexWrap: 'wrap',
      }}>
        <GitCompare size={16} style={{ color: '#A06AFF', flexShrink: 0 }} />
        <span style={{
          fontSize: 12, color: 'var(--text-muted)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4,
        }}>
          Comparar:
        </span>
        {allEpIds.map(epId => {
          const active = selectedEps.includes(epId)
          return (
            <motion.button
              key={epId}
              onClick={() => toggleEp(epId)}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: active
                  ? '1px solid rgba(160,106,255,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
                background: active
                  ? 'rgba(160,106,255,0.18)'
                  : 'rgba(255,255,255,0.03)',
                color: active ? '#A06AFF' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s ease',
              }}
            >
              {epId}
            </motion.button>
          )
        })}

        {selectedEps.length > 0 && (
          <button
            onClick={() => setSelectedEps([])}
            style={{
              padding: '4px 10px', borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* ── Empty state ── */}
      {selectedEps.length < 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'var(--text-muted)',
          }}
        >
          <GitCompare size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            Selecciona pelo menos 2 episodios para comparar
          </p>
          <p style={{ fontSize: 13, opacity: 0.6 }}>
            Clica nos episodios acima para iniciar a comparacao
          </p>
        </motion.div>
      )}

      {/* ── Active comparison ── */}
      {selectedEps.length >= 2 && (
        <>
          {/* Overlap Summary */}
          <OverlapSummary selectedEps={selectedEps} overlap={overlap} />

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            {MODES.map(m => {
              const Icon = m.icon
              const active = mode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 8,
                    border: 'none',
                    background: active ? 'rgba(160,106,255,0.15)' : 'transparent',
                    color: active ? '#A06AFF' : 'var(--text-muted)',
                    fontSize: 13, fontWeight: active ? 700 : 500,
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} />
                  {m.label}
                </button>
              )
            })}
          </div>

          {/* View content */}
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {mode === 'personagens' && (
              <PersonagensView
                selectedEps={selectedEps}
                chars={chars}
                episodeData={episodeData}
              />
            )}
            {mode === 'forcas' && (
              <ForcasView
                selectedEps={selectedEps}
                forces={forces || []}
                episodeArcs={episodeArcs || []}
              />
            )}
            {mode === 'arcos' && (
              <ArcosView
                selectedEps={selectedEps}
                episodeArcs={episodeArcs || []}
              />
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
