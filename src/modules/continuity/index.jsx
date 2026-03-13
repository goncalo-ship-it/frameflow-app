// Continuidade — guarda-roupa · adereços · maquilhagem · log de decisões
// Notas por cena e por personagem · comparar cenas consecutivas

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, ChevronDown, ChevronRight, Trash2, Camera,
  Shirt, Package, Palette, BookOpen, Star, AlertTriangle,
  Users, Film, Clock,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { SmartInput } from '../../components/shared/SmartInput.jsx'
import { useVirtualizer } from '@tanstack/react-virtual'
import styles from './Continuity.module.css'

// ── Categorias de continuidade ────────────────────────────────────
const CATEGORIES = [
  { id: 'wardrobe', label: 'Guarda-Roupa',  icon: Shirt,    color: '#8B6FBF' },
  { id: 'props',    label: 'Adereços',       icon: Package,  color: '#BF6A2E' },
  { id: 'makeup',   label: 'Maquilhagem',    icon: Palette,  color: '#A02E6F' },
  { id: 'notes',    label: 'Notas Gerais',   icon: BookOpen, color: '#2EA080' },
]
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

// Migração localStorage → store (uma só vez)
function migrateFromLocalStorage(store) {
  try {
    const LS_KEY = 'frame_continuity'
    const LS_DEC = 'frame_continuity_decisions'
    const data = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
    const decs = JSON.parse(localStorage.getItem(LS_DEC) || '[]')
    if (Object.keys(data).length > 0 && Object.keys(store.continuityData || {}).length === 0) {
      Object.entries(data).forEach(([k, v]) => store.setContinuityScene(k, v))
      localStorage.removeItem(LS_KEY)
    }
    if (decs.length > 0 && (store.continuityDecisions || []).length === 0) {
      decs.forEach(d => store.addContinuityDecision(d))
      localStorage.removeItem(LS_DEC)
    }
  } catch { /* silencioso */ }
}

// ── Componente de nota de cena ────────────────────────────────────
function SceneNote({ sceneKey, epId, scene, data, onUpdate, deptItemsForScene, actorsForScene }) {
  const [open, setOpen] = useState(false)
  const cats = ['wardrobe', 'props', 'makeup', 'notes']
  const hasData = cats.some(c => (data?.[c] || '').trim())
  const hasPhotos = (data?.photos || []).length > 0
  const hasDeptPhotos = (deptItemsForScene || []).some(i => i.photos?.length > 0)
  const hasActorPhotos = (actorsForScene || []).length > 0
  const [newPhotoUrl, setNewPhotoUrl] = useState('')

  const up = (field, val) => onUpdate(sceneKey, { ...data, [field]: val })

  const addPhoto = () => {
    if (!newPhotoUrl.trim()) return
    up('photos', [...(data?.photos || []), { id: Date.now(), url: newPhotoUrl.trim(), caption: '' }])
    setNewPhotoUrl('')
  }

  const removePhoto = (id) => up('photos', (data?.photos || []).filter(p => p.id !== id))

  return (
    <motion.div className={`${styles.sceneCard} ${hasData ? styles.sceneCardFilled : ''}`}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className={styles.sceneCardTop} onClick={() => setOpen(!open)}>
        <div className={styles.sceneCardLeft}>
          <span className={styles.sceneCardEp}>{epId}</span>
          <span className={styles.sceneCardNum}>#{scene.sceneNumber}</span>
          <span className={styles.sceneCardLoc}>{scene.location || '—'}</span>
          {scene.timeOfDay && <span className={styles.sceneCardTime}>{scene.timeOfDay}</span>}
        </div>
        <div className={styles.sceneCardRight}>
          {cats.filter(c => (data?.[c] || '').trim()).map(c => (
            <span key={c} className={styles.catDot} style={{ background: CAT_MAP[c].color }} title={CAT_MAP[c].label} />
          ))}
          {hasPhotos && <Camera size={12} color="var(--text-muted)" />}
          {hasActorPhotos && <Users size={12} color="var(--mod-team, #5B8DEF)" title="Fotos de elenco" />}
          {hasDeptPhotos && <Palette size={12} color="var(--mod-departments)" title="Fotos de departamentos" />}
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {/* Personagens */}
      {(scene.characters || []).length > 0 && (
        <div className={styles.sceneChars}>
          {scene.characters.map(c => <span key={c} className={styles.charChip}>{c}</span>)}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div className={styles.sceneDetail}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className={styles.contGrid}>
              {CATEGORIES.map(cat => (
                <div key={cat.id} className={styles.contField}>
                  <label className={styles.contLabel} style={{ color: cat.color }}>
                    <cat.icon size={12} /> {cat.label}
                  </label>
                  <SmartInput
                    value={data?.[cat.id] || ''}
                    onChange={e => up(cat.id, e.target.value)}
                    placeholder={`${cat.label} desta cena…`}
                    rows={3}
                    context={`Continuidade — ${cat.label} da cena`} />
                </div>
              ))}
            </div>

            {/* Fotos de elenco */}
            {(actorsForScene || []).length > 0 && (
              <div className={styles.actorPhotosSection}>
                <span className={styles.photosLabel}><Users size={12} /> Elenco</span>
                <div className={styles.photoGrid}>
                  {actorsForScene.map(actor => (
                    <div key={actor.id} className={styles.photoThumb} title={`${actor.characterName} — ${actor.name}`}>
                      <img src={actor.photo} alt="" onError={e => { e.target.style.display='none' }} />
                      <span className={styles.actorPhotoLabel}>{actor.characterName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fotos de departamentos (auto-importadas) */}
            {(deptItemsForScene || []).length > 0 && (
              <div className={styles.deptPhotosSection}>
                <span className={styles.photosLabel}><Palette size={12} /> Fotos de Departamentos</span>
                <div className={styles.photoGrid}>
                  {deptItemsForScene.map(item => (
                    <React.Fragment key={item.id}>
                      {(item.photos || []).map((photo, pi) => (
                        <div key={`${item.id}-${pi}`} className={styles.photoThumb} title={`${item.department}: ${item.name}${item.characterName ? ' — ' + item.characterName : ''}`}>
                          <img src={photo} alt="" onError={e => { e.target.style.display='none' }} />
                          <span className={styles.deptPhotoLabel}>{item.department}</span>
                        </div>
                      ))}
                      {item.wardrobeRepeat?.enabled && (
                        <div style={{ width: '100%', marginTop: 2 }}>
                          <span style={{ fontSize: 9, color: 'var(--accent-light)' }}>
                            ↻ recorrente
                            {item.wardrobeRepeat.exceptions?.includes(sceneKey) && (
                              <span style={{ color: 'var(--health-red)', marginLeft: 4 }}>-- exceção nesta cena</span>
                            )}
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Fotos de referência */}
            <div className={styles.photosSection}>
              <span className={styles.photosLabel}><Camera size={12} /> Fotos de referência</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input className={styles.photoInput} placeholder="URL da foto…" value={newPhotoUrl}
                  onChange={e => setNewPhotoUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPhoto()} />
                <button className={styles.btnSmall} onClick={addPhoto}><Plus size={13} /></button>
              </div>
              {(data?.photos || []).length > 0 && (
                <div className={styles.photoGrid}>
                  {(data.photos || []).map(photo => (
                    <div key={photo.id} className={styles.photoThumb}>
                      <img src={photo.url} alt="" onError={e => { e.target.style.display='none' }} />
                      <button className={styles.photoRemove} onClick={() => removePhoto(photo.id)}><X size={9}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Aba: Notas por Cena ───────────────────────────────────────────
function SceneNotesTab({ continuityData, onUpdate }) {
  const {  parsedScripts, departmentItems, team, navigate  } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts, departmentItems: s.departmentItems, team: s.team, navigate: s.navigate })))
  const [filterChar, setFilterChar] = useState('all')
  const [filterEp,   setFilterEp]   = useState('all')
  const [search,     setSearch]     = useState('')

  const allScenes = useMemo(() => {
    const scenes = []
    Object.entries(parsedScripts || {}).forEach(([epId, data]) => {
      ;(data.scenes || []).forEach(sc => {
        scenes.push({ ...sc, epId, key: `${epId}-${sc.sceneNumber}` })
      })
    })
    return scenes
  }, [parsedScripts])

  // Pre-build lookup maps to avoid O(n²) filtering per scene
  const deptItemsByScene = useMemo(() => {
    const map = {}
    for (const item of (departmentItems || [])) {
      for (const key of (item.scenes || [])) {
        if (!map[key]) map[key] = []
        map[key].push(item)
      }
    }
    return map
  }, [departmentItems])

  const actorsByScene = useMemo(() => {
    const actorsWithPhotos = team.filter(m => m.photo && m.characterName)
    const map = {}
    for (const sc of allScenes) {
      const chars = sc.characters || []
      if (chars.length === 0) continue
      const matching = actorsWithPhotos.filter(m => chars.includes(m.characterName))
      if (matching.length > 0) map[sc.key] = matching
    }
    return map
  }, [team, allScenes])

  const episodes = [...new Set(allScenes.map(s => s.epId))]
  const allChars = [...new Set(allScenes.flatMap(s => s.characters || []))]

  const visible = allScenes
    .filter(s => filterEp === 'all' || s.epId === filterEp)
    .filter(s => filterChar === 'all' || (s.characters || []).includes(filterChar))
    .filter(s => !search || (s.location || '').toLowerCase().includes(search.toLowerCase()) || (s.description || '').toLowerCase().includes(search.toLowerCase()))

  const parentRef = useRef(null)

  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  })

  return (
    <div className={styles.sceneNotesTab}>
      {/* Filtros */}
      <div className={styles.filterBar}>
        <input className={styles.searchInput} placeholder="Pesquisar cenas…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className={styles.filterSelect} value={filterEp} onChange={e => setFilterEp(e.target.value)}>
          <option value="all">Todos os episódios</option>
          {episodes.map(ep => <option key={ep} value={ep}>{ep}</option>)}
        </select>
        <select className={styles.filterSelect} value={filterChar} onChange={e => setFilterChar(e.target.value)}>
          <option value="all">Todas as personagens</option>
          {allChars.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className={styles.filterCount}>{visible.length} cenas</span>
      </div>

      <div className={styles.sceneList} ref={parentRef}>
        {allScenes.length === 0 && (
          <div className={styles.empty}>
            <Film size={32} color="var(--text-muted)" />
            <p>Carrega guiões em Análise de Guião para ver as cenas aqui</p>
            <button onClick={() => navigate('script')} style={{
              marginTop: 12, padding: '8px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
              color: 'var(--accent-light)', cursor: 'pointer', fontSize: 'var(--text-sm)',
              fontWeight: 500,
            }}>
              Ir para Análise de Guião →
            </button>
          </div>
        )}
        {visible.length > 0 && (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
            {virtualizer.getVirtualItems().map(virtualRow => {
              const sc = visible[virtualRow.index]
              return (
                <div
                  key={sc.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: virtualRow.start,
                    width: '100%',
                    paddingBottom: 'var(--space-2)',
                  }}
                >
                  <SceneNote
                    sceneKey={sc.key}
                    epId={sc.epId}
                    scene={sc}
                    data={continuityData[sc.key]}
                    onUpdate={onUpdate}
                    deptItemsForScene={deptItemsByScene[sc.key] || []}
                    actorsForScene={actorsByScene[sc.key] || []}
                  />
                </div>
              )
            })}
          </div>
        )}
        {visible.length === 0 && allScenes.length > 0 && (
          <div className={styles.empty}><p>Sem cenas com estes filtros</p></div>
        )}
      </div>
    </div>
  )
}

// ── Aba: Por Personagem ───────────────────────────────────────────
function CharacterTab({ continuityData, onUpdate }) {
  const {  parsedCharacters, parsedScripts, team, navigate  } = useStore(useShallow(s => ({ parsedCharacters: s.parsedCharacters, parsedScripts: s.parsedScripts, team: s.team, navigate: s.navigate })))
  const [selectedChar, setSelectedChar] = useState(null)
  const [category, setCategory] = useState('wardrobe')

  const allScenes = useMemo(() => {
    const scenes = []
    Object.entries(parsedScripts || {}).forEach(([epId, data]) => {
      ;(data.scenes || []).forEach(sc => {
        scenes.push({ ...sc, epId, key: `${epId}-${sc.sceneNumber}` })
      })
    })
    return scenes
  }, [parsedScripts])

  const charScenes = selectedChar
    ? allScenes.filter(s => (s.characters || []).includes(selectedChar))
    : []

  const cat = CAT_MAP[category]
  const actor = team.find(m => m.characterName === selectedChar)

  return (
    <div className={styles.charTab}>
      {/* Lista de personagens */}
      <div className={styles.charTabSidebar}>
        {(parsedCharacters || []).length === 0 && (
          <div className={styles.empty} style={{ padding: 'var(--space-8)' }}>
            <Users size={24} color="var(--text-muted)" />
            <p style={{ textAlign: 'center' }}>Carrega guiões para ver personagens</p>
            <button onClick={() => navigate('script')} style={{
              marginTop: 12, padding: '8px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
              color: 'var(--accent-light)', cursor: 'pointer', fontSize: 'var(--text-sm)',
              fontWeight: 500,
            }}>
              Ir para Guiões →
            </button>
          </div>
        )}
        {(parsedCharacters || []).map(char => {
          const isSelected = selectedChar === char.name
          const hasContData = charScenes.some(s => (continuityData[s.key]?.['wardrobe'] || '').trim())
          return (
            <button key={char.name}
              className={`${styles.charTabRow} ${isSelected ? styles.charTabRowActive : ''}`}
              onClick={() => setSelectedChar(isSelected ? null : char.name)}>
              <div>
                <span className={styles.charTabName}>{char.name}</span>
                {actor && <span className={styles.charTabActor}>{actor.name}</span>}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {hasContData && <span className={styles.filledDot} />}
                <span className={styles.charTabCount}>{char.scenes?.length || 0}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Notas desta personagem por categoria */}
      <div className={styles.charTabContent}>
        {!selectedChar ? (
          <div className={styles.empty}>
            <Users size={28} color="var(--text-muted)" />
            <p>Selecciona uma personagem para ver a continuidade</p>
          </div>
        ) : (
          <>
            <div className={styles.charTabHeader}>
              <h3 className={styles.charTabTitle}>{selectedChar}</h3>
              {actor && <span className={styles.charTabActorLabel}>→ {actor.name}</span>}
              <span className={styles.charTabSceneCount}>{charScenes.length} cenas</span>
            </div>
            <div className={styles.catBar}>
              {CATEGORIES.map(c => (
                <button key={c.id}
                  className={`${styles.catBtn} ${category === c.id ? styles.catBtnActive : ''}`}
                  style={{ '--cc': c.color }}
                  onClick={() => setCategory(c.id)}>
                  <c.icon size={12} /> {c.label}
                </button>
              ))}
            </div>
            <div className={styles.charSceneList}>
              {charScenes.map(sc => (
                <div key={sc.key} className={styles.charSceneRow}>
                  <div className={styles.charSceneId}>
                    <span>{sc.epId} #{sc.sceneNumber}</span>
                    <span className={styles.charSceneLoc}>{sc.location}</span>
                  </div>
                  <SmartInput
                    value={continuityData[sc.key]?.[category] || ''}
                    onChange={e => onUpdate(sc.key, { ...continuityData[sc.key], [category]: e.target.value })}
                    placeholder={`${cat.label} de ${selectedChar} nesta cena…`}
                    rows={2}
                    context={`Continuidade — ${cat.label} de ${selectedChar}`} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Aba: Log de Decisões ──────────────────────────────────────────
function DecisionLog({ decisions, onAdd, onDelete }) {
  const [form, setForm] = useState({ scene: '', decision: '', category: 'notes', importance: 'normal' })
  const [adding, setAdding] = useState(false)

  const submit = () => {
    if (!form.decision.trim()) return
    onAdd({ ...form, id: Date.now(), timestamp: new Date().toISOString() })
    setForm({ scene: '', decision: '', category: 'notes', importance: 'normal' }); setAdding(false)
  }

  const sorted = [...decisions].sort((a, b) => b.id - a.id)

  return (
    <div className={styles.logTab}>
      <div className={styles.logToolbar}>
        <span className={styles.logCount}>{decisions.length} decisões registadas</span>
        <button className={styles.btnAdd} onClick={() => setAdding(true)}><Plus size={14}/> Registar decisão</button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div className={styles.addLogForm}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <input className={styles.input} placeholder="Cena (ex: EP01-12)" value={form.scene}
                onChange={e => setForm(v => ({ ...v, scene: e.target.value }))} />
              <select className={styles.input} value={form.category} onChange={e => setForm(v => ({ ...v, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <select className={styles.input} value={form.importance} onChange={e => setForm(v => ({ ...v, importance: e.target.value }))}>
                <option value="normal">Normal</option>
                <option value="critical">Crítica</option>
                <option value="note">Nota</option>
              </select>
            </div>
            <SmartInput placeholder="Decisão de continuidade…" rows={3}
              value={form.decision} onChange={e => setForm(v => ({ ...v, decision: e.target.value }))} autoFocus
              context="Decisão de continuidade — guarda-roupa, adereços, maquilhagem, raccords" />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={styles.btnCancel} onClick={() => setAdding(false)}>Cancelar</button>
              <button className={styles.btnConfirm} onClick={submit} disabled={!form.decision.trim()}>Guardar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.logList}>
        {decisions.length === 0 && !adding && (
          <div className={styles.empty} style={{ padding: 'var(--space-12)' }}>
            <BookOpen size={28} color="var(--text-muted)" />
            <p>Sem decisões de continuidade registadas</p>
          </div>
        )}
        {sorted.map(d => {
          const cat = CAT_MAP[d.category] || CAT_MAP.notes
          const isCritical = d.importance === 'critical'
          return (
            <div key={d.id} className={`${styles.logEntry} ${isCritical ? styles.logEntryCritical : ''}`}
              style={{ borderLeft: `4px solid ${cat.color}` }}>
              <div className={styles.logEntryTop}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <cat.icon size={13} color={cat.color} />
                  {d.scene && <span className={styles.logScene}>{d.scene}</span>}
                  {isCritical && <AlertTriangle size={12} color="#F87171" />}
                  <span className={styles.logTime}>{d.timestamp ? new Date(d.timestamp).toLocaleDateString('pt-PT') : ''}</span>
                </div>
                <button className={styles.iconBtn} onClick={() => onDelete(d.id)}><Trash2 size={12}/></button>
              </div>
              <p className={styles.logDecision}>{d.decision}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Módulo principal ──────────────────────────────────────────────
const TABS = [
  { id: 'scenes',  label: 'Por Cena',       icon: Film },
  { id: 'chars',   label: 'Por Personagem', icon: Users },
  { id: 'log',     label: 'Log de Decisões',icon: BookOpen },
]

export function ContinuityModule() {
  const store = useStore(useShallow(s => ({
    projectName: s.projectName, parsedScripts: s.parsedScripts,
    continuityData: s.continuityData, continuityDecisions: s.continuityDecisions,
    setContinuityScene: s.setContinuityScene, addContinuityDecision: s.addContinuityDecision,
    removeContinuityDecision: s.removeContinuityDecision,
  })))
  const { projectName, parsedScripts, continuityData, continuityDecisions,
          setContinuityScene, addContinuityDecision, removeContinuityDecision } = store
  const [activeTab, setActiveTab] = useState('scenes')
  const [migrated, setMigrated] = useState(false)

  // Migrar dados de localStorage na primeira vez
  useEffect(() => {
    if (!migrated) { migrateFromLocalStorage(store); setMigrated(true) }
  }, [migrated, store])

  const decisions = continuityDecisions || []

  const updateScene = (sceneKey, data) => setContinuityScene(sceneKey, data)
  const addDecision = (d) => addContinuityDecision(d)
  const deleteDecision = (id) => removeContinuityDecision(id)

  const totalScenes = Object.values(parsedScripts || {}).reduce((s, d) => s + (d.scenes?.length || 0), 0)
  const filledScenes = Object.keys(continuityData || {}).filter(k => {
    const d = (continuityData || {})[k]
    return d && ['wardrobe','props','makeup','notes'].some(c => (d[c] || '').trim())
  }).length

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Continuidade</h2>
          <p className={styles.sub}>{projectName} · {filledScenes}/{totalScenes} cenas documentadas · {decisions.length} decisões</p>
        </div>
        <nav className={styles.tabBar}>
          {TABS.map(tab => (
            <button key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <motion.div key={activeTab} className={styles.content}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {activeTab === 'scenes' && <SceneNotesTab continuityData={continuityData} onUpdate={updateScene} />}
        {activeTab === 'chars'  && <CharacterTab  continuityData={continuityData} onUpdate={updateScene} />}
        {activeTab === 'log'    && <DecisionLog   decisions={decisions} onAdd={addDecision} onDelete={deleteDecision} />}
      </motion.div>
    </div>
  )
}
