// EpisodeArcsTab — arcos narrativos por episódio
// FrameBoard · Universo · Março 2026

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Film } from 'lucide-react'
import { SmartInput } from '../../components/shared/SmartInput.jsx'
import styles from './Universe.module.css'

const PHASE_COLORS = ['#15803d','#dc2626','#f97316','#7c3aed','#0369a1','#0891b2']

function makeId() {
  return `ea-${Date.now()}-${Math.random().toString(36).slice(2,7)}`
}

function blankArc(epNum) {
  return {
    id: makeId(),
    epNum: epNum || 1,
    title: '',
    phase: '',
    phaseColor: PHASE_COLORS[0],
    desire: '',
    description: '',
    anchorScene: '',
    notes: '',
  }
}

// ── Inline styles (dark theme, consistent with Universe module) ──

const cardStyle = {
  background: 'var(--bg-surface, #0F1520)',
  borderRadius: 12,
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
  transition: 'border-color 0.15s ease',
  position: 'relative',
}

const cardHoverBorder = 'rgba(160,106,255,0.25)'

const epNumStyle = (color) => ({
  width: 38,
  height: 38,
  borderRadius: 10,
  background: color || PHASE_COLORS[0],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-display, "Syne", sans-serif)',
  fontWeight: 800,
  fontSize: 16,
  color: '#fff',
  flexShrink: 0,
})

const fieldLabel = {
  fontSize: 'var(--text-xs, 12px)',
  color: 'var(--text-muted, #5A6070)',
  fontWeight: 600,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  marginBottom: 2,
}

const inlineInput = {
  background: 'transparent',
  border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
  borderRadius: 6,
  padding: '6px 10px',
  color: 'var(--text-primary, #E0E4EA)',
  fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  fontSize: 'var(--text-sm, 14px)',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s ease',
}

const titleInput = {
  ...inlineInput,
  fontFamily: 'var(--font-display, "Syne", sans-serif)',
  fontWeight: 700,
  fontSize: 'var(--text-base, 16px)',
}

const desireInput = {
  ...inlineInput,
  fontStyle: 'normal',
  fontSize: 'var(--text-sm, 14px)',
}

const anchorInput = {
  ...inlineInput,
  fontStyle: 'italic',
  fontSize: 'var(--text-xs, 12px)',
  color: 'var(--text-secondary, #9CA3AF)',
}

const notesInput = {
  ...inlineInput,
  fontSize: 'var(--text-xs, 12px)',
  color: 'var(--text-secondary, #9CA3AF)',
}

const phaseBadge = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderRadius: 20,
  background: `${color}22`,
  border: `1px solid ${color}55`,
  fontSize: 'var(--text-xs, 12px)',
  fontWeight: 600,
  color: color,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
})

const phaseInput = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'inherit',
  fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  fontSize: 'var(--text-xs, 12px)',
  fontWeight: 600,
  width: 100,
}

const colorDot = (c, active) => ({
  width: 14,
  height: 14,
  borderRadius: '50%',
  background: c,
  border: active ? '2px solid #fff' : '2px solid transparent',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'border-color 0.1s ease',
})

export function EpisodeArcsTab({ episodeArcs, setUniverseEpisodeArcs }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [colorPickerOpen, setColorPickerOpen] = useState(null)

  const arcs = episodeArcs || []

  const save = (updated) => setUniverseEpisodeArcs(updated)

  const addArc = () => {
    const nextEp = arcs.length > 0 ? Math.max(...arcs.map(a => a.epNum || 0)) + 1 : 1
    const colorIdx = arcs.length % PHASE_COLORS.length
    save([...arcs, { ...blankArc(nextEp), phaseColor: PHASE_COLORS[colorIdx] }])
  }

  const updateArc = (id, patch) => {
    save(arcs.map(a => a.id === id ? { ...a, ...patch } : a))
  }

  const deleteArc = (id) => {
    save(arcs.filter(a => a.id !== id))
  }

  return (
    <div className={styles.forcasTab}>
      {/* Header */}
      <div className={styles.forcasHeader}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary, #E0E4EA)' }}>
            Arcos por Episódio
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
            O fio narrativo de cada episódio — desejo, fase, cena-âncora.
          </p>
        </div>
        <button className={styles.btnAdd} onClick={addArc}>
          <Plus size={14} /> Novo arco
        </button>
      </div>

      {/* Cards list */}
      <div className={styles.forcesList}>
        {arcs.length === 0 && (
          <div className={styles.emptyState}>
            <Film size={32} color="var(--text-muted)" />
            <p>Ainda não há arcos de episódio.<br />Cada arco define o motor narrativo de um episódio.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {arcs.map(arc => (
            <motion.div
              key={arc.id}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, transition: { duration: 0.15 } }}
              style={{
                ...cardStyle,
                borderColor: hoveredId === arc.id ? cardHoverBorder : 'var(--border-subtle, rgba(255,255,255,0.07))',
                borderLeft: `4px solid ${arc.phaseColor || PHASE_COLORS[0]}`,
              }}
              onMouseEnter={() => setHoveredId(arc.id)}
              onMouseLeave={() => { setHoveredId(null); setColorPickerOpen(null) }}
            >
              {/* Row 1: ep number + title + phase + delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={epNumStyle(arc.phaseColor)}>
                  {arc.epNum || '?'}
                </div>

                <input
                  style={{ ...titleInput, flex: 1 }}
                  value={arc.title}
                  onChange={e => updateArc(arc.id, { title: e.target.value })}
                  placeholder="Título do episódio…"
                />

                {/* Phase badge with color picker */}
                <div style={{ position: 'relative' }}>
                  <div
                    style={phaseBadge(arc.phaseColor || PHASE_COLORS[0])}
                    onClick={() => setColorPickerOpen(colorPickerOpen === arc.id ? null : arc.id)}
                  >
                    <input
                      style={{ ...phaseInput, color: arc.phaseColor || PHASE_COLORS[0] }}
                      value={arc.phase || ''}
                      onChange={e => updateArc(arc.id, { phase: e.target.value })}
                      placeholder="Fase…"
                      onClick={e => e.stopPropagation()}
                    />
                  </div>

                  {/* Color picker popover */}
                  {colorPickerOpen === arc.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 6,
                        display: 'flex',
                        gap: 5,
                        padding: '6px 8px',
                        borderRadius: 8,
                        background: 'var(--bg-elevated, rgba(255,255,255,0.05))',
                        border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
                        zIndex: 10,
                      }}
                    >
                      {PHASE_COLORS.map(c => (
                        <button
                          key={c}
                          style={colorDot(c, arc.phaseColor === c)}
                          onClick={() => {
                            updateArc(arc.id, { phaseColor: c })
                            setColorPickerOpen(null)
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>

                <button className={styles.iconBtn} onClick={() => deleteArc(arc.id)} title="Apagar arco">
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Row 2: Episode number edit */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={fieldLabel}>Ep.</div>
                <input
                  type="number"
                  min={1}
                  style={{ ...inlineInput, width: 60, textAlign: 'center' }}
                  value={arc.epNum || ''}
                  onChange={e => updateArc(arc.id, { epNum: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Row 3: Desire line */}
              <div>
                <div style={fieldLabel}>Linha de desejo</div>
                <input
                  style={desireInput}
                  value={arc.desire || ''}
                  onChange={e => updateArc(arc.id, { desire: e.target.value })}
                  placeholder="João quer → conseguir que…"
                />
              </div>

              {/* Row 4: Description */}
              <div>
                <div style={fieldLabel}>Descrição</div>
                <SmartInput
                  value={arc.description || ''}
                  onChange={e => updateArc(arc.id, { description: e.target.value })}
                  placeholder="Sinopse do arco narrativo deste episódio…"
                  rows={3}
                  context="Descrição do arco narrativo de um episódio de série"
                />
              </div>

              {/* Row 5: Anchor scene */}
              <div>
                <div style={fieldLabel}>Cena-âncora</div>
                <input
                  style={anchorInput}
                  value={arc.anchorScene || ''}
                  onChange={e => updateArc(arc.id, { anchorScene: e.target.value })}
                  placeholder="A cena que define o episódio…"
                />
              </div>

              {/* Row 6: Notes */}
              <div>
                <div style={fieldLabel}>Notas / referência</div>
                <input
                  style={notesInput}
                  value={arc.notes || ''}
                  onChange={e => updateArc(arc.id, { notes: e.target.value })}
                  placeholder="Notas internas, referências, links…"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
