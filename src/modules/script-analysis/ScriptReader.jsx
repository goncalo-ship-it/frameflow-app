// ScriptReader — leitura organizada do guião, cena a cena, collapsible
// Mostra cabeçalho de cena, acção, diálogos, personagens, tags

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronRight, MapPin, Sun, Moon, Users,
  Search, Film, MessageSquare, Tag, Clapperboard, Download, StickyNote,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { exportToFdx } from '../../utils/fdx-exporter.js'
import styles from './ScriptAnalysis.module.css'

const TIME_ICONS = { DIA: Sun, NOITE: Moon, AMANHECER: Sun, CREPÚSCULO: Moon, GOLDEN: Sun, TARDE: Sun, MANHÃ: Sun, ENTARDECER: Moon }
const TIME_COLORS = { DIA: '#F5A623', NOITE: '#5B8DEF', AMANHECER: '#F5A623', CREPÚSCULO: '#9B59B6', GOLDEN: '#F5A623', TARDE: '#F5A623', MANHÃ: '#F5A623', ENTARDECER: '#E05B8D' }

function SceneCard({ scene, index, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const TimeIcon = TIME_ICONS[scene.timeOfDay] || Sun
  const timeColor = TIME_COLORS[scene.timeOfDay] || '#F5A623'
  const charCount = scene.characters?.length || 0
  const dialogueCount = scene.dialogue?.length || 0

  return (
    <div style={{
      background: 'var(--bg-surface, #0F1520)',
      border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
      borderRadius: 10,
      borderLeft: `3px solid ${scene.intExt === 'EXT' ? '#34D399' : '#5B8DEF'}`,
      overflow: 'hidden',
    }}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
          color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
        }}
      >
        {open ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}

        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 700, color: 'var(--mod-script)', minWidth: 48 }}>
          {scene.id}
          {scene.sceneNumber && scene.id !== `SC${String(scene.sceneNumber).padStart(3, '0')}` && (
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 3 }}>({scene.sceneNumber})</span>
          )}
        </span>

        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          background: scene.intExt === 'EXT' ? 'rgba(52,211,153,0.12)' : 'rgba(91,141,239,0.12)',
          color: scene.intExt === 'EXT' ? '#34D399' : '#5B8DEF',
        }}>
          {scene.intExt}
        </span>

        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {scene.location}
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TimeIcon size={12} color={timeColor} />
          <span style={{ fontSize: 10, fontWeight: 600, color: timeColor }}>{scene.timeOfDay}</span>
        </span>

        <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Users size={10} /> {charCount}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
          <MessageSquare size={10} /> {dialogueCount}
        </span>

        {scene.durationMin && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>~{scene.durationMin}min</span>
        )}
      </button>

      {/* Body — collapsible */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Characters */}
              {charCount > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {scene.characters.map((c, i) => (
                    <span key={i} style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: 'rgba(160,106,255,0.12)', color: '#C4A0FF',
                      fontFamily: 'var(--font-body)',
                    }}>
                      {typeof c === 'string' ? c : c.name || c}
                    </span>
                  ))}
                </div>
              )}

              {/* Production Notes */}
              {scene.productionNotes?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {scene.productionNotes.map((note, i) => (
                    <div key={`note-${i}`} style={{
                      margin: 0, fontSize: 12, color: '#92700C',
                      lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 6,
                      padding: '6px 10px', background: 'rgba(245,200,35,0.1)', borderRadius: 6,
                      border: '1px solid rgba(245,200,35,0.2)',
                    }}>
                      <StickyNote size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action */}
              {scene.action?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {scene.action.map((a, i) => (
                    <p key={i} style={{
                      margin: 0, fontSize: 12, color: 'var(--text-secondary)',
                      fontStyle: 'italic', lineHeight: 1.5,
                      padding: '4px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 6,
                    }}>
                      {a}
                    </p>
                  ))}
                </div>
              )}

              {/* Dialogue */}
              {scene.dialogue?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {scene.dialogue.map((d, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 700,
                        color: '#A06AFF', minWidth: 80, flexShrink: 0, paddingTop: 2,
                        textTransform: 'uppercase',
                      }}>
                        {d.character}
                      </span>
                      <div style={{ flex: 1 }}>
                        {d.parenthetical && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', display: 'block', marginBottom: 2 }}>
                            {d.parenthetical}
                          </span>
                        )}
                        <span style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          {d.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {scene.autoTags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {scene.autoTags.map(t => (
                    <span key={t} style={{
                      padding: '1px 6px', borderRadius: 8, fontSize: 9, fontWeight: 600,
                      background: 'rgba(245,166,35,0.1)', color: '#F5A623',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Arc Beats / Director Notes */}
              {scene.arcBeats && Object.keys(scene.arcBeats).length > 0 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 4,
                  padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(160,106,255,0.06)', border: '1px solid rgba(160,106,255,0.15)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: '#C4A0FF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Clapperboard size={11} /> Notas do Realizador
                  </div>
                  {Object.entries(scene.arcBeats).map(([charName, note]) => (
                    <div key={charName} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12 }}>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: '#A06AFF', minWidth: 70, flexShrink: 0, fontSize: 11 }}>
                        {charName}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                        {note}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              {scene.synopsis && (
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, fontStyle: 'italic' }}>
                  {scene.synopsis}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ScriptReader() {
  const { parsedScripts } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts })))
  const [selectedEp, setSelectedEp] = useState(null)
  const [search, setSearch] = useState('')
  const [expandAll, setExpandAll] = useState(false)

  const epIds = useMemo(() => Object.keys(parsedScripts || {}).sort(), [parsedScripts])

  // Auto-select first episode
  const activeEp = selectedEp || epIds[0] || null
  const epData = activeEp ? parsedScripts[activeEp] : null
  const scenes = epData?.scenes || []

  // Filter
  const q = search.toLowerCase().trim()
  const filtered = q
    ? scenes.filter(s =>
        (s.location || '').toLowerCase().includes(q) ||
        (s.characters || []).some(c => (typeof c === 'string' ? c : c.name || '').toLowerCase().includes(q)) ||
        (s.dialogue || []).some(d => d.text?.toLowerCase().includes(q) || d.character?.toLowerCase().includes(q)) ||
        (s.action || []).some(a => a.toLowerCase().includes(q)) ||
        (s.id || '').toLowerCase().includes(q)
      )
    : scenes

  if (epIds.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <Film size={32} color="var(--text-muted)" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 14 }}>Nenhum guião carregado</p>
          <p style={{ fontSize: 12 }}>Vai ao tab "Guião" e importa os FDX</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Episode picker */}
        <div style={{ display: 'flex', gap: 4 }}>
          {epIds.map(ep => (
            <button key={ep} onClick={() => setSelectedEp(ep)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              background: activeEp === ep ? 'var(--mod-script)' : 'rgba(255,255,255,0.05)',
              color: activeEp === ep ? '#fff' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer',
            }}>
              {ep}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 150,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: '4px 10px',
        }}>
          <Search size={13} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Procurar local, personagem, diálogo…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-body)',
            }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>×</button>}
        </div>

        {/* Stats */}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {filtered.length}/{scenes.length} cenas
        </span>

        {/* Expand/collapse all */}
        <button onClick={() => setExpandAll(e => !e)} style={{
          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}>
          {expandAll ? 'Colapsar' : 'Expandir'} tudo
        </button>

        {/* Export FDX */}
        {activeEp && epData && (
          <button onClick={() => {
            const xmlString = exportToFdx(epData)
            const blob = new Blob([xmlString], { type: 'application/xml' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${activeEp}.fdx`
            a.click()
            URL.revokeObjectURL(url)
          }} style={{
            fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
            background: 'rgba(91,141,239,0.1)', border: '1px solid rgba(91,141,239,0.25)',
            color: '#5B8DEF', cursor: 'pointer', fontFamily: 'var(--font-body)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Download size={12} /> Exportar FDX
          </button>
        )}
      </div>

      {/* Scene list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map((scene, i) => (
          <SceneCard key={scene.id || i} scene={scene} index={i} defaultOpen={expandAll} />
        ))}
        {filtered.length === 0 && search && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <Search size={24} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13 }}>Nenhuma cena corresponde a "{search}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
