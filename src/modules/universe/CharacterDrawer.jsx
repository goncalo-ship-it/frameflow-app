// CharacterDrawer — ficha completa de personagem
// Secções: Identidade · Voz · Traits · Backstory · Arco · Para a Room · Regra do Universo · Relações · Notas

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Trash2, Plus, ChevronDown, ChevronRight, Tag, Camera, Users, BarChart3 } from 'lucide-react'
import { ARC_TYPES, ARC_MAP, RELATION_TYPES, REL_MAP, SCALES } from './utils.js'
import { getScriptStatsForChar } from '../../utils/script-enrichment.js'
import { SmartInput } from '../../components/shared/SmartInput.jsx'
import styles from './Universe.module.css'

const SPRING = { type: 'spring', damping: 28, stiffness: 300 }

function Section({ title, children, defaultOpen = true, accent }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={styles.section} style={accent ? { borderColor: accent + '33' } : {}}>
      <button className={styles.sectionHeader} onClick={() => setOpen(o => !o)}
        style={accent ? { borderBottomColor: open ? accent + '22' : 'transparent' } : {}}>
        <span className={styles.sectionTitle} style={accent ? { color: accent } : {}}>{title}</span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  )
}

export function CharacterDrawer({ char, allChars, episodeData, parsedScripts = {}, team = [], onClose, onUpdate, onDelete }) {
  const [draft, setDraft]               = useState(() => ({ ...char }))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [newRelTarget, setNewRelTarget]   = useState('')
  const [newRelType,   setNewRelType]     = useState('amizade')
  const [newTrait,     setNewTrait]       = useState('')
  const photoInputRef = useRef(null)

  useEffect(() => { setDraft({ ...char }) }, [char.id])

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Resize to max 256px and convert to base64
    const img = new Image()
    const reader = new FileReader()
    reader.onload = () => {
      img.onload = () => {
        const MAX = 256
        let w = img.width, h = img.height
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else       { w = Math.round(w * MAX / h); h = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        save({ photo: dataUrl })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const save = (patch) => {
    const updated = { ...draft, ...patch }
    setDraft(updated)
    onUpdate(char.id, patch)
  }

  const saveVoice = (field, value) => {
    const voice = { ...(draft.voice || {}), [field]: value }
    save({ voice })
  }

  // Episode presence
  const charNameUp = (char.name || '').toUpperCase()
  const epPresence = {}
  for (const [epId, chars] of Object.entries(episodeData)) {
    if (chars[charNameUp]) epPresence[epId] = chars[charNameUp]
  }
  const presentEps = Object.keys(epPresence).sort()

  // Traits
  const traits = draft.traits || []
  const addTrait = () => {
    if (!newTrait.trim()) return
    save({ traits: [...traits, newTrait.trim()] })
    setNewTrait('')
  }
  const removeTrait = (i) => save({ traits: traits.filter((_, idx) => idx !== i) })

  // Relations
  const charRelations = draft.relations || []
  const addRelation = () => {
    if (!newRelTarget) return
    save({ relations: [...charRelations, { targetId: newRelTarget, type: newRelType, notes: '' }] })
    setNewRelTarget('')
    setNewRelType('amizade')
  }
  const removeRelation = (idx) => save({ relations: charRelations.filter((_, i) => i !== idx) })
  const updateRelNote  = (idx, notes) => save({ relations: charRelations.map((r, i) => i === idx ? { ...r, notes } : r) })

  const arcInfo  = ARC_MAP[draft.arcType] || ARC_TYPES[0]
  const initials = (draft.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const voice    = draft.voice || {}

  return (
    <motion.div
      className={styles.drawerOverlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className={styles.drawer}
        data-glass
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={SPRING}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={styles.drawerHeader} style={{ borderBottom: `3px solid ${arcInfo.color}44` }}>
          <div className={styles.drawerHeaderTop}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className={styles.charAvatar}
                style={{ background: `${arcInfo.color}18`, border: `2px solid ${arcInfo.color}55`, cursor: 'pointer', position: 'relative' }}
                onClick={() => photoInputRef.current?.click()}
                title="Carregar foto">
                {draft.photo
                  ? <img src={draft.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: arcInfo.color }}>{initials}</span>
                }
                {!draft.photo && (
                  <Camera size={12} style={{ position: 'absolute', bottom: -2, right: -2, color: arcInfo.color, opacity: 0.6 }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input className={styles.drawerNameInput}
                  value={draft.name || ''}
                  onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                  onBlur={e => save({ name: e.target.value })}
                  placeholder="Nome da personagem" />
                <input className={styles.drawerRoleInput}
                  value={draft.alias || ''}
                  onChange={e => setDraft(d => ({ ...d, alias: e.target.value }))}
                  onBlur={e => save({ alias: e.target.value })}
                  placeholder="Alcunha · função · papel" />
              </div>
            </div>
            <button className={styles.iconBtn} onClick={onClose}><X size={18} /></button>
          </div>

          {/* Arc + episodes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            <select className={styles.arcSelect}
              value={draft.arcType || 'secundário'}
              style={{ color: arcInfo.color, borderColor: arcInfo.color + '66', background: arcInfo.color + '11' }}
              onChange={e => save({ arcType: e.target.value })}>
              {ARC_TYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
            <select className={styles.arcSelect}
              value={draft.scale || 'real'}
              style={{ color: (SCALES.find(s => s.id === (draft.scale || 'real'))?.color || '#5B8DEF'), borderColor: (SCALES.find(s => s.id === (draft.scale || 'real'))?.color || '#5B8DEF') + '66', background: (SCALES.find(s => s.id === (draft.scale || 'real'))?.color || '#5B8DEF') + '11', fontSize: 11 }}
              onChange={e => save({ scale: e.target.value })}>
              {SCALES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {presentEps.map(ep => (
                <span key={ep} className={styles.epBadge} title={`${epPresence[ep].scenes} cenas · ${epPresence[ep].lines} falas`}>
                  {ep} <span style={{ opacity: 0.65 }}>{epPresence[ep].scenes}c</span>
                </span>
              ))}
              {presentEps.length === 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Não nos guiões</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className={styles.drawerBody}>

          {/* Identidade */}
          <Section title="Identidade">
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Descrição breve</label>
              <input className={styles.input}
                value={draft.description || ''}
                onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                onBlur={e => save({ description: e.target.value })}
                placeholder="Uma frase que define quem é..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Idade</label>
                <input className={styles.input} value={draft.age || ''}
                  onChange={e => setDraft(d => ({ ...d, age: e.target.value }))}
                  onBlur={e => save({ age: e.target.value })} placeholder="ex: 16" />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Ocupação</label>
                <input className={styles.input} value={draft.occupation || ''}
                  onChange={e => setDraft(d => ({ ...d, occupation: e.target.value }))}
                  onBlur={e => save({ occupation: e.target.value })} placeholder="Estudante, porteiro…" />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Foto</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {draft.photo && (
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={draft.photo} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: `2px solid ${arcInfo.color}44` }} />
                    <button onClick={() => save({ photo: '' })} style={{
                      position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%',
                      background: '#F87171', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><X size={10} /></button>
                  </div>
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => photoInputRef.current?.click()} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    background: 'rgba(160,106,255,0.08)', border: '1px dashed rgba(160,106,255,0.3)',
                    borderRadius: 8, color: '#A06AFF', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                  }}>
                    <Camera size={14} /> Carregar foto
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                  <input className={styles.input} value={draft.photo?.startsWith('data:') ? '' : (draft.photo || '')}
                    onChange={e => setDraft(d => ({ ...d, photo: e.target.value }))}
                    onBlur={e => { if (e.target.value) save({ photo: e.target.value }) }}
                    placeholder="…ou URL da foto" style={{ fontSize: 12 }} />
                </div>
              </div>
            </div>
          </Section>

          {/* Actor / Elenco */}
          <Section title="Actor / Elenco" accent="#5B8DEF">
            <div className={styles.field}>
              <label className={styles.fieldLabel}><Users size={11} style={{ marginRight: 4 }} />Ligado a membro da equipa</label>
              <select className={styles.input}
                value={draft.actorId || ''}
                onChange={e => save({ actorId: e.target.value || null })}>
                <option value="">Nenhum — escolher actor…</option>
                {team.filter(m => m.group === 'Elenco' || m.characterName).map(m => (
                  <option key={m.id} value={m.id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>
                ))}
                <optgroup label="Toda a equipa">
                  {team.filter(m => m.group !== 'Elenco' && !m.characterName).map(m => (
                    <option key={m.id} value={m.id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>
                  ))}
                </optgroup>
              </select>
              {draft.actorId && (() => {
                const actor = team.find(m => m.id === draft.actorId)
                return actor ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, padding: '8px 12px', background: 'rgba(91,141,239,0.08)', borderRadius: 8, border: '1px solid rgba(91,141,239,0.2)' }}>
                    {actor.photo
                      ? <img src={actor.photo} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#5B8DEF22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#5B8DEF', fontSize: 14 }}>{(actor.name || '?')[0]}</div>
                    }
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{actor.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{[actor.role, actor.group].filter(Boolean).join(' · ')}{actor.phone ? ` · ${actor.phone}` : ''}</div>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Notas de casting</label>
              <SmartInput rows={2}
                value={draft.castingNotes || ''}
                onChange={e => setDraft(d => ({ ...d, castingNotes: e.target.value }))}
                placeholder="Perfil físico, referências de actores, tom da audição…"
                context={`Notas de casting para ${draft.name}`} />
            </div>
          </Section>

          {/* Script Stats */}
          {(() => {
            const ss = getScriptStatsForChar(parsedScripts, char.name)
            if (!ss) return null
            return (
              <Section title="Dados do Guião" accent="#F5A623">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Cenas', value: ss.sceneCount },
                    { label: 'Falas', value: ss.lineCount },
                    { label: 'Palavras', value: ss.wordCount },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '10px 6px', background: 'rgba(245,166,35,0.06)', borderRadius: 8, border: '1px solid rgba(245,166,35,0.15)' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#F5A623', fontFamily: 'var(--font-display)' }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {ss.episodes.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    Presente em: {ss.episodes.join(', ')}
                  </div>
                )}
                {ss.topCoChars.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <BarChart3 size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Mais cenas com
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {ss.topCoChars.map(co => (
                        <span key={co.name} style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 999,
                          background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)',
                          color: '#F5A623', fontWeight: 600,
                        }}>
                          {co.name} <span style={{ opacity: 0.6 }}>{co.count}×</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {ss.voice && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(160,106,255,0.06)', borderRadius: 8, border: '1px solid rgba(160,106,255,0.15)' }}>
                    <div style={{ fontSize: 11, color: '#A06AFF', fontWeight: 700, marginBottom: 4 }}>Padrão de fala (auto)</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ss.voice.when}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{ss.voice.what}</div>
                    {ss.voice.example && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6, borderLeft: '2px solid rgba(160,106,255,0.3)', paddingLeft: 8 }}>
                        "{ss.voice.example}"
                      </div>
                    )}
                  </div>
                )}
              </Section>
            )
          })()}

          {/* Lore */}
          <Section title="Lore & Mundo" accent="#2EA080" defaultOpen={false}>
            <SmartInput rows={4}
              value={draft.lore || ''}
              onChange={e => setDraft(d => ({ ...d, lore: e.target.value }))}
              placeholder="O contexto do mundo que rodeia esta personagem. História pessoal, regras que só se aplicam a ela, segredos que o espectador não sabe…"
              context={`Lore/mundo da personagem ${draft.name}`} />
          </Section>

          {/* Voz — quando fala, o que revela, exemplo */}
          <Section title="Voz" accent="#A06AFF">
            <div className={styles.voiceBlock} style={{ borderColor: arcInfo.color, background: arcInfo.color + '0C' }}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} style={{ color: arcInfo.color, letterSpacing: '0.18em' }}>
                  Fala quando…
                </label>
                <SmartInput rows={2}
                  value={voice.when || ''}
                  onChange={e => setDraft(d => ({ ...d, voice: { ...(d.voice||{}), when: e.target.value } }))}
                  placeholder="Em que estado interior ou situação esta personagem se manifesta?"
                  context={`Voz da personagem ${draft.name} — quando fala`} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel} style={{ color: arcInfo.color, letterSpacing: '0.18em' }}>
                  O que revela do protagonista
                </label>
                <SmartInput rows={2}
                  value={voice.what || ''}
                  onChange={e => setDraft(d => ({ ...d, voice: { ...(d.voice||{}), what: e.target.value } }))}
                  placeholder="Se transferisses as falas dela directamente para o protagonista, o que mudaria?"
                  context={`Voz da personagem ${draft.name} — o que revela do protagonista`} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel} style={{ color: arcInfo.color, letterSpacing: '0.18em' }}>
                  Fala de referência
                </label>
                <SmartInput rows={2}
                  value={voice.example || ''}
                  onChange={e => setDraft(d => ({ ...d, voice: { ...(d.voice||{}), example: e.target.value } }))}
                  placeholder='"Uma fala que define a voz desta personagem."'
                  context={`Fala de referência da personagem ${draft.name}`} />
              </div>
            </div>
          </Section>

          {/* Traits */}
          <Section title="Características" defaultOpen={false}>
            <div className={styles.traitsWrap}>
              {traits.map((t, i) => (
                <span key={i} className={styles.traitTag}>
                  {t}
                  <button onClick={() => removeTrait(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4, padding: 0, color: 'inherit', opacity: 0.6, fontSize: 11 }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: traits.length ? 8 : 0 }}>
              <input className={styles.input} style={{ flex: 1 }}
                value={newTrait}
                onChange={e => setNewTrait(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTrait()}
                placeholder="curiosidade, impulsividade…" />
              <button className={styles.btnAdd} onClick={addTrait} style={{ padding: '7px 12px' }}>
                <Tag size={13} />
              </button>
            </div>
          </Section>

          {/* Backstory */}
          <Section title="Backstory" defaultOpen={false}>
            <SmartInput rows={5}
              value={draft.backstory || ''}
              onChange={e => setDraft(d => ({ ...d, backstory: e.target.value }))}
              placeholder="O que aconteceu antes da história começar. Feridas, contexto, família…"
              context={`Backstory da personagem ${draft.name}`} />
          </Section>

          {/* Arco Dramático */}
          <Section title="Arco Dramático" defaultOpen={false}>
            <SmartInput rows={4}
              value={draft.arc || ''}
              onChange={e => setDraft(d => ({ ...d, arc: e.target.value }))}
              placeholder="Onde começa, o que muda, onde termina na série…"
              context={`Arco dramático da personagem ${draft.name}`} />
          </Section>

          {/* Para a Room */}
          <Section title="Para a Writers' Room" accent="#F5A623" defaultOpen={false}>
            <div className={styles.roomNotesBlock}>
              <SmartInput rows={4}
                value={draft.roomNotes || ''}
                onChange={e => setDraft(d => ({ ...d, roomNotes: e.target.value }))}
                placeholder="O que a room precisa de saber que o espectador não precisa de saber. Backstory interno, decisões de escrita, perguntas abertas…"
                context={`Writers' Room — notas internas sobre ${draft.name}`} />
            </div>
          </Section>

          {/* Regra do Universo */}
          <Section title="Regra do Universo" accent="#2EA080" defaultOpen={false}>
            <div className={styles.universeRuleBlock}>
              <SmartInput rows={3}
                value={draft.universeRule || ''}
                onChange={e => setDraft(d => ({ ...d, universeRule: e.target.value }))}
                placeholder="A regra especial que governa esta personagem neste universo. O que é que o mundo aceita sem questionar sobre ela?"
                context={`Regra do universo para ${draft.name}`} />
            </div>
          </Section>

          {/* Relações */}
          <Section title="Relações">
            {charRelations.length === 0 && (
              <p className={styles.emptyNote}>Sem relações definidas</p>
            )}
            {charRelations.map((rel, idx) => {
              const target  = allChars.find(c => c.id === rel.targetId)
              const relInfo = REL_MAP[rel.type] || RELATION_TYPES[0]
              return (
                <div key={idx} className={styles.relRow}>
                  <span className={styles.relTarget}>{target?.name || '(desconhecido)'}</span>
                  <span className={styles.relType} style={{ color: relInfo.color, borderColor: relInfo.color + '44' }}>{rel.type}</span>
                  <input
                    value={rel.notes || ''}
                    onChange={e => updateRelNote(idx, e.target.value)}
                    placeholder="nota…"
                    style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
                  />
                  <button className={styles.removeRelBtn} onClick={() => removeRelation(idx)}><X size={12} /></button>
                </div>
              )
            })}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <select className={styles.input} style={{ flex: '1 1 120px' }}
                value={newRelTarget} onChange={e => setNewRelTarget(e.target.value)}>
                <option value="">Escolher personagem…</option>
                {allChars.filter(c => c.id !== char.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select className={styles.input} style={{ flex: '0 0 150px' }}
                value={newRelType} onChange={e => setNewRelType(e.target.value)}>
                {RELATION_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <button className={styles.btnAdd} onClick={addRelation} disabled={!newRelTarget} style={{ padding: '7px 12px' }}>
                <Plus size={14} /> Adicionar
              </button>
            </div>
          </Section>

          {/* Notas */}
          <Section title="Notas livres" defaultOpen={false}>
            <SmartInput rows={3}
              value={draft.notes || ''}
              onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
              placeholder="Costume, comportamentos, cenas chave, decisões de realização…"
              context={`Notas livres sobre a personagem ${draft.name}`} />
          </Section>

        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {confirmDelete ? (
            <>
              <span style={{ fontSize: 13, color: '#F87171', alignSelf: 'center' }}>Tem a certeza?</span>
              <button className={styles.btnCancel} onClick={() => setConfirmDelete(false)}>Cancelar</button>
              <button className={styles.btnDanger} onClick={() => { onDelete(char.id); onClose() }}>
                <Trash2 size={14} style={{ marginRight: 4 }} /> Eliminar
              </button>
            </>
          ) : (
            <button className={styles.deleteBtnDrawer} onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
