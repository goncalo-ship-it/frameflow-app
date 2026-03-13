// SceneDetailOverlay — Floating glass card with scene details
// Shows: description, location, storyboard, dialogue, continuity, director notes, characters, equipment, wardrobe

import { Film, Users, Shirt, Camera, MessageSquare, MapPin, Clapperboard, ExternalLink, BookOpen, CheckCircle, Megaphone } from 'lucide-react'
import { GlassOverlay } from './GlassOverlay.jsx'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { useMemo } from 'react'

const sectionTitle = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: 'var(--text-muted)',
  display: 'flex', alignItems: 'center', gap: 6,
  marginBottom: 8, marginTop: 20,
}

const glassInner = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '0.5px solid rgba(255, 255, 255, 0.10)',
  borderRadius: 14,
  padding: '14px 16px',
}

const SHOT_COLORS = ['#10B981', '#3b82f6', '#F59E0B', '#EF4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const CONTINUITY_LABELS = {
  wardrobe: 'Guarda-roupa',
  props: 'Adereços',
  makeup: 'Maquilhagem',
  emotionalState: 'Estado emocional',
  lighting: 'Iluminação',
}

export function SceneDetailOverlay({ open, onClose, scene, dayLabel }) {
  const { departmentItems, departmentConfig, sceneTakes, navigate } = useStore(useShallow(s => ({
    departmentItems: s.departmentItems,
    departmentConfig: s.departmentConfig,
    sceneTakes: s.sceneTakes,
    navigate: s.navigate,
  })))

  const deptMap = useMemo(() => {
    const m = {}
    for (const d of (departmentConfig || [])) m[d.id] = d
    return m
  }, [departmentConfig])

  if (!scene) return null

  const sc = scene
  const sceneKey = sc.sceneKey || `${sc.epId}-${sc.sceneNumber || sc.id}`
  const takes = sceneTakes?.[sceneKey] || []
  const takeCount = takes.length

  // Department items for this scene
  const sceneItems = departmentItems.filter(item =>
    (item.scenes || []).includes(sceneKey)
  )
  const wardrobeItems = sceneItems.filter(i => i.department === 'wardrobe' || i.department === 'makeup' || i.department === 'hair')
  const techItems = sceneItems.filter(i => i.department === 'camera' || i.department === 'lighting' || i.department === 'sound')

  // Director notes
  const directorNotes = sc.notas_realizador || sc.directorNotes || null

  // Continuity data
  const continuity = sc.continuidade || null

  // Storyboard / shots
  const shots = sc.shots || sc.storyboard || []

  // Dialogue
  const dialogue = sc.dialogue || []

  return (
    <GlassOverlay open={open} onClose={onClose} width={560}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: 6, paddingRight: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {sc.timeOfDay && (
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              border: '0.5px solid rgba(255,255,255,0.15)', letterSpacing: '0.06em',
            }}>{sc.timeOfDay === 'DIA' ? '13:00' : sc.timeOfDay === 'NOITE' ? '21:00' : sc.timeOfDay}</span>
          )}
          {sc.pageCount && (
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
              background: 'rgba(59,130,246,0.12)', color: '#3b82f6',
              border: '0.5px solid rgba(59,130,246,0.2)', letterSpacing: '0.06em',
            }}>{sc.pageCount} PÁGINAS</span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
            background: 'rgba(16,185,129,0.12)', color: '#10B981',
            border: '0.5px solid rgba(16,185,129,0.2)', letterSpacing: '0.06em',
          }}>{sc.sceneNumber || sc.id}</span>
        </div>

        <h2 style={{
          fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2,
          fontFamily: 'Inter, var(--font-display, system-ui)',
        }}>
          {sc.name || sc.title || `Cena ${sc.sceneNumber || sc.id}`}
        </h2>

        {(sc.intExt || sc.location) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            {sc.intExt && (
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                background: 'rgba(59,130,246,0.12)', color: '#3b82f6',
                border: '0.5px solid rgba(59,130,246,0.2)', letterSpacing: '0.06em',
              }}>{sc.intExt}</span>
            )}
            {sc.location && (
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {sc.location}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 1. DESCRIÇÃO ── */}
      {sc.description && (
        <>
          <div style={sectionTitle}><MessageSquare size={12} /> DESCRIÇÃO</div>
          <div style={glassInner}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
              {sc.description}
            </p>
          </div>
        </>
      )}

      {/* ── 2. LOCALIZAÇÃO ── */}
      {sc.location && (
        <>
          <div style={sectionTitle}><MapPin size={12} /> LOCALIZAÇÃO</div>
          <div style={{ ...glassInner, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{sc.location}</span>
            <button
              onClick={() => {
                const q = encodeURIComponent(sc.location)
                window.open(`https://www.google.com/maps/search/${q}`, '_blank')
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 999,
                background: 'rgba(59,130,246,0.12)', border: '0.5px solid rgba(59,130,246,0.25)',
                color: '#3b82f6', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <ExternalLink size={11} /> Abrir no Maps
            </button>
          </div>
        </>
      )}

      {/* ── 3. ABRIR GUIÃO COMPLETO ── */}
      <button
        onClick={() => { onClose(); navigate('script') }}
        style={{
          width: '100%', marginTop: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px 20px', borderRadius: 14,
          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
          border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', transition: 'all 0.15s',
          boxShadow: '0 4px 16px rgba(109,40,217,0.3)',
        }}
      >
        <BookOpen size={16} /> Abrir Guião Completo
      </button>

      {/* ── 4. STORYBOARD ── */}
      {shots.length > 0 && (
        <>
          <div style={sectionTitle}><Camera size={12} /> STORYBOARD</div>
          <div style={{
            display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6,
            scrollbarWidth: 'thin',
          }}>
            {shots.map((shot, i) => {
              const color = SHOT_COLORS[i % SHOT_COLORS.length]
              return (
                <div key={shot.id || i} style={{
                  ...glassInner,
                  padding: 0, minWidth: 140, maxWidth: 160, flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '8px 12px',
                    background: `${color}18`,
                    borderBottom: `0.5px solid ${color}30`,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color }}>{i + 1}</span>
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
                      {shot.description || shot.text || shot.name || `Plano ${i + 1}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── 5. DIÁLOGOS COMPLETOS ── */}
      {dialogue.length > 0 && (
        <>
          <div style={sectionTitle}><MessageSquare size={12} /> DIÁLOGOS COMPLETOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {dialogue.map((d, i) => (
              <div key={i} style={glassInner}>
                <p style={{
                  fontSize: 12, fontWeight: 800, color: '#fff',
                  textTransform: 'uppercase', margin: '0 0 4px', letterSpacing: '0.04em',
                }}>
                  {d.character}
                </p>
                {d.parenthetical && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', fontStyle: 'italic' }}>
                    ({d.parenthetical})
                  </p>
                )}
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>
                  {d.text}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 6. CONTINUIDADE ── */}
      {continuity && (
        <>
          <div style={sectionTitle}><CheckCircle size={12} /> CONTINUIDADE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(CONTINUITY_LABELS).map(([key, label]) => {
              const value = continuity[key]
              const isDone = value && value !== '' && value !== false
              return (
                <div key={key} style={{
                  ...glassInner,
                  padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  {isDone ? (
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#10B981', fontSize: 11, fontWeight: 800, flexShrink: 0,
                    }}>✓</span>
                  ) : (
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                    </span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 600, color: isDone ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {label}
                  </span>
                  {isDone && typeof value === 'string' && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>
                      {value}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── 7. NOTAS DO REALIZADOR ── */}
      <>
        <div style={sectionTitle}><Megaphone size={12} /> NOTAS DO REALIZADOR</div>
        {directorNotes ? (
          <div style={{
            background: 'rgba(239,68,68,0.06)',
            border: '0.5px solid rgba(239,68,68,0.15)',
            borderRadius: 14,
            padding: '14px 16px',
          }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
              {directorNotes}
            </p>
          </div>
        ) : (
          <div style={{
            background: 'rgba(239,68,68,0.06)',
            border: '0.5px solid rgba(239,68,68,0.15)',
            borderRadius: 14,
            padding: '14px 16px',
          }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, fontStyle: 'italic' }}>
              Sem notas do realizador
            </p>
          </div>
        )}
      </>

      {/* ── 8. PERSONAGENS ── */}
      {(sc.characters || []).length > 0 && (
        <>
          <div style={sectionTitle}><Users size={12} /> PERSONAGENS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {sc.characters.map(ch => (
              <span key={ch} style={{
                fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 999,
                background: 'rgba(139,95,191,0.12)', color: '#a78bfa',
                border: '0.5px solid rgba(139,95,191,0.25)',
              }}>{ch}</span>
            ))}
          </div>
        </>
      )}

      {/* ── 9. ARTE & TÉCNICA ── */}
      {techItems.length > 0 && (
        <>
          <div style={sectionTitle}><Camera size={12} /> ARTE & TÉCNICA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {techItems.map(item => (
              <div key={item.id} style={{ ...glassInner, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {item.photos?.[0] && (
                  <img
                    src={item.photos[0]}
                    alt={item.name}
                    style={{
                      width: 64, height: 64, borderRadius: 8,
                      objectFit: 'cover', flexShrink: 0,
                      border: '0.5px solid rgba(255,255,255,0.1)',
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.name}</div>
                  {item.description && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{item.description}</div>
                  )}
                  {item.notes && (
                    <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, fontStyle: 'italic' }}>
                      ↳ {item.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 10. GUARDA-ROUPA ── */}
      {wardrobeItems.length > 0 && (
        <>
          <div style={sectionTitle}><Shirt size={12} /> GUARDA-ROUPA & CONTINUIDADE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {wardrobeItems.map(item => (
              <div key={item.id} style={{ ...glassInner, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {item.photos?.[0] && (
                  <img
                    src={item.photos[0]}
                    alt={item.name}
                    style={{
                      width: 64, height: 64, borderRadius: 8,
                      objectFit: 'cover', flexShrink: 0,
                      border: '0.5px solid rgba(255,255,255,0.1)',
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.name}</div>
                  {item.description && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{item.description}</div>
                  )}
                  {item.notes && (
                    <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, fontStyle: 'italic' }}>
                      ↳ {item.notes}
                    </div>
                  )}
                  {item.photos?.length > 1 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {item.photos.slice(1).map((p, i) => (
                        <img key={i} src={p} alt="" style={{
                          width: 40, height: 40, borderRadius: 6, objectFit: 'cover',
                          border: '0.5px solid rgba(255,255,255,0.1)',
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── TAKES ── */}
      {takes.length > 0 && (
        <>
          <div style={sectionTitle}><Clapperboard size={12} /> TAKES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {takes.slice(0, 5).map((t, i) => {
              const statusColors = { BOM: '#10B981', bom: '#10B981', PARCIAL: '#F59E0B', parcial: '#F59E0B', REPETIR: '#EF4444', repetir: '#EF4444' }
              const color = statusColors[t.status] || '#6E6E78'
              return (
                <div key={t.id || i} style={{
                  ...glassInner,
                  padding: '8px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', background: color,
                    boxShadow: `0 0 6px ${color}`, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Take {i + 1}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' }}>{t.status}</span>
                  {t.notes && <span style={{ fontSize: 11, color: '#6E6E78', marginLeft: 'auto' }}>{t.notes}</span>}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── ACTION BUTTONS ── */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <button
          onClick={() => { onClose(); navigate('continuity') }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '12px 16px', borderRadius: 14,
            background: 'rgba(16,185,129,0.12)', border: '0.5px solid rgba(16,185,129,0.25)',
            color: '#10B981', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Film size={14} /> Continuidade
        </button>
        <button
          onClick={() => { onClose(); navigate('live-board') }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '12px 16px', borderRadius: 14,
            background: 'rgba(59,130,246,0.12)', border: '0.5px solid rgba(59,130,246,0.25)',
            color: '#3b82f6', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Clapperboard size={14} /> Live Board
        </button>
      </div>
    </GlassOverlay>
  )
}
