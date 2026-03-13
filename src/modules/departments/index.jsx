// Módulo Departamentos (Look Book)
// Guarda-Roupa · Arte/Décor · Adereços · Caracterização · Cabelo
// SFX · Veículos · Stunts · Câmara · Iluminação · Som · VFX
// Vista por personagem ou por local, com fotos e aprovação

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Check, Upload, Image, Trash2, Search,
  ChevronRight, ChevronDown, Users, MapPin, Eye, EyeOff,
  Shirt, Palette, Package, Sparkles, Scissors, Flame,
  Car, Zap, Camera, Lightbulb, Mic, Wand2, Calendar,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { SPRING } from '../../core/design.js'
import { useShallow } from 'zustand/react/shallow'
import { ROLES, DEPARTMENTS, getAccessLevel } from '../../core/roles.js'
import { useVirtualizer } from '@tanstack/react-virtual'
import styles from './Departments.module.css'

// Mapa role department → departmentConfig ID (para filtro "O meu departamento")
const ROLE_DEPT_TO_CONFIG = {
  guardaroupa:   'wardrobe',
  arte:          'art',
  maquilhagem:   'makeup',
  camara:        'camera',
  luz_electrico: 'lighting',
  som:           'sound',
  grip:          'props',
  pos_producao:  'vfx',
}

// Roles que vêem TODOS os departamentos (1º AD, Realizador, Admin)
const SEE_ALL_ROLES = ['primeiro_ad', 'realizador', 'produtor_executivo', 'director_producao', 'chefe_producao', 'anotadora']

// ── Ícone por departamento ────────────────────────────────────────
const DEPT_ICONS = {
  wardrobe: Shirt, art: Palette, props: Package, makeup: Sparkles,
  hair: Scissors, sfx: Flame, vehicles: Car, stunts: Zap,
  camera: Camera, lighting: Lightbulb, sound: Mic, vfx: Wand2,
}

function DeptIcon({ deptId, size = 14 }) {
  const Icon = DEPT_ICONS[deptId] || Package
  return <Icon size={size} />
}

// ── Vista: Por Personagem ─────────────────────────────────────────
function CharacterView({ onSelectChar }) {
  const {  parsedCharacters, departmentItems, team, navigate  } = useStore(useShallow(s => ({ parsedCharacters: s.parsedCharacters, departmentItems: s.departmentItems, team: s.team, navigate: s.navigate })))

  const characters = useMemo(() => {
    // All characters from scripts + any from department items
    const charNames = new Set(parsedCharacters.map(c => c.name))
    departmentItems.forEach(it => { if (it.characterName) charNames.add(it.characterName) })

    return [...charNames].map(name => {
      const items = departmentItems.filter(it => it.characterName === name)
      const actor = team.find(m => m.characterName === name)
      const depts = [...new Set(items.map(i => i.department))]
      const photoItem = items.find(it => it.photos?.length > 0)
      return { name, items, actor, depts, photo: actor?.photo || photoItem?.photos?.[0] || null }
    }).sort((a, b) => b.items.length - a.items.length)
  }, [parsedCharacters, departmentItems, team])

  if (characters.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Users size={40} />
        <p>Carrega guiões para ver personagens<br/>ou cria items de departamento manualmente</p>
        <button onClick={() => navigate('script')} style={{
          marginTop: 12, padding: '8px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--accent-dim)', border: '1px solid var(--accent)',
          color: 'var(--accent-light)', cursor: 'pointer', fontSize: 'var(--text-sm)',
          fontWeight: 500,
        }}>
          Ir para Guiões →
        </button>
      </div>
    )
  }

  return (
    <div className={styles.charGrid}>
      {characters.map(char => (
        <div key={char.name} className={styles.charCard} onClick={() => onSelectChar(char.name)}>
          <div className={styles.charAvatar}>
            {char.photo
              ? <img src={char.photo} alt={char.name} />
              : char.name.charAt(0)
            }
          </div>
          <div className={styles.charName}>{char.name}</div>
          {char.actor && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{char.actor.name}</span>}
          <div className={styles.charItemCount}>{char.items.length} item{char.items.length !== 1 ? 's' : ''}</div>
          {char.depts.length > 0 && (
            <div className={styles.charDeptDots}>
              {char.depts.map(d => {
                const cfg = useStore.getState().departmentConfig.find(c => c.id === d)
                return <span key={d} className={styles.deptDot} style={{ background: cfg?.color || 'var(--text-muted)' }}
                  title={cfg?.label || d} />
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Vista: Por Local ──────────────────────────────────────────────
function LocationView({ onSelectLoc }) {
  const {  parsedLocations, departmentItems, locations, navigate  } = useStore(useShallow(s => ({ parsedLocations: s.parsedLocations, departmentItems: s.departmentItems, locations: s.locations, navigate: s.navigate })))

  const locs = useMemo(() => {
    const locNames = new Set(parsedLocations)
    departmentItems.forEach(it => { if (it.locationName) locNames.add(it.locationName) })

    return [...locNames].map(name => {
      const items = departmentItems.filter(it => it.locationName === name)
      const depts = [...new Set(items.map(i => i.department))]
      const locData = locations.find(l => l.name === name || l.displayName === name)
      const photoItem = items.find(it => it.photos?.length > 0)
      return { name, items, depts, locData, photo: locData?.photo || photoItem?.photos?.[0] || null }
    }).sort((a, b) => b.items.length - a.items.length)
  }, [parsedLocations, departmentItems, locations])

  if (locs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <MapPin size={40} />
        <p>Carrega guiões para ver locais<br/>ou cria items de departamento manualmente</p>
        <button onClick={() => navigate('script')} style={{
          marginTop: 12, padding: '8px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--accent-dim)', border: '1px solid var(--accent)',
          color: 'var(--accent-light)', cursor: 'pointer', fontSize: 'var(--text-sm)',
          fontWeight: 500,
        }}>
          Ir para Guiões →
        </button>
      </div>
    )
  }

  return (
    <div className={styles.charGrid}>
      {locs.map(loc => (
        <div key={loc.name} className={styles.charCard} onClick={() => onSelectLoc(loc.name)}>
          <div className={styles.charAvatar} style={{ borderRadius: 'var(--radius-lg)', width: 80, height: 56 }}>
            {loc.photo
              ? <img src={loc.photo} alt={loc.name} style={{ borderRadius: 'var(--radius-md)' }} />
              : <MapPin size={24} />
            }
          </div>
          <div className={styles.charName}>{loc.name.length > 25 ? loc.name.slice(0, 24) + '…' : loc.name}</div>
          <div className={styles.charItemCount}>{loc.items.length} item{loc.items.length !== 1 ? 's' : ''}</div>
          {loc.depts.length > 0 && (
            <div className={styles.charDeptDots}>
              {loc.depts.map(d => {
                const cfg = useStore.getState().departmentConfig.find(c => c.id === d)
                return <span key={d} className={styles.deptDot} style={{ background: cfg?.color || 'var(--text-muted)' }}
                  title={cfg?.label || d} />
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Grid de Items (virtualized for 200+ items) ───────────────────
const ITEM_MIN_WIDTH = 220
const ITEM_GAP = 16 // matches var(--space-4)
const ROW_HEIGHT = 280 // estimated height per card row

function ItemsGrid({ items, onSelect, departmentConfig, sceneToDayMap = {}, dayLabels = {}, onAdd }) {
  const parentRef = useRef(null)
  const [itemsPerRow, setItemsPerRow] = useState(3)

  // Calculate items per row based on container width
  useEffect(() => {
    const el = parentRef.current
    if (!el) return
    const calc = () => {
      const w = el.clientWidth - 48 // padding (var(--space-6) * 2)
      const cols = Math.max(1, Math.floor((w + ITEM_GAP) / (ITEM_MIN_WIDTH + ITEM_GAP)))
      setItemsPerRow(cols)
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const rowCount = Math.ceil(items.length / itemsPerRow)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 3,
  })

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Image size={32} />
        <p>Sem items nesta vista</p>
        {onAdd ? (
          <button
            onClick={onAdd}
            style={{
              marginTop: 8, padding: '6px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
              color: 'var(--accent-light)', cursor: 'pointer', fontSize: 'var(--text-sm)',
              fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            <Plus size={14} /> Adicionar Item
          </button>
        ) : (
          <p style={{ fontSize: 'var(--text-xs)' }}>Clica + para adicionar</p>
        )}
      </div>
    )
  }

  return (
    <div ref={parentRef} className={styles.itemsGrid}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualizer.getVirtualItems().map(virtualRow => {
          const startIdx = virtualRow.index * itemsPerRow
          const rowItems = items.slice(startIdx, startIdx + itemsPerRow)
          return (
            <div
              key={virtualRow.index}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
                gap: ITEM_GAP,
                padding: `0 var(--space-6)`,
              }}
            >
              {rowItems.map(item => {
                const cfg = departmentConfig.find(d => d.id === item.department)
                const firstPhoto = item.photos?.[0]
                return (
                  <div key={item.id} className={styles.itemCard}
                    onClick={() => onSelect(item)}>
                    {firstPhoto ? (
                      <div className={styles.itemPhoto}>
                        <img src={firstPhoto} alt={item.name} />
                      </div>
                    ) : (
                      <div className={styles.itemPhotoPlaceholder}>
                        <DeptIcon deptId={item.department} size={24} />
                      </div>
                    )}
                    <div className={styles.itemBody}>
                      <div className={styles.itemName}>{item.name || 'Sem nome'}</div>
                      <div className={styles.itemMeta}>
                        <span className={styles.itemDeptBadge}
                          style={{ color: cfg?.color, borderColor: cfg?.color + '44', background: cfg?.color + '11' }}>
                          {cfg?.label || item.department}
                        </span>
                        {item.characterName && <span><Users size={10} /> {item.characterName}</span>}
                        {item.locationName && <span><MapPin size={10} /> {item.locationName.slice(0, 12)}</span>}
                      </div>
                      {(item.scenes || []).length > 0 && (
                        <div className={styles.itemScenes}>
                          {item.scenes.slice(0, 4).map(s => (
                            <span key={s} className={styles.itemSceneChip}>{s}</span>
                          ))}
                          {item.scenes.length > 4 && <span className={styles.itemSceneChip}>+{item.scenes.length - 4}</span>}
                        </div>
                      )}
                      {/* Shooting days derived from scenes */}
                      {(() => {
                        const dayIds = [...new Set((item.scenes || []).map(s => sceneToDayMap[s]).filter(Boolean))]
                        return dayIds.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
                            {dayIds.slice(0, 3).map(dId => (
                              <span key={dId} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4,
                                background: 'var(--accent-alpha-10)', color: 'var(--accent)', fontWeight: 600 }}>
                                {dayLabels[dId] || dId}
                              </span>
                            ))}
                            {dayIds.length > 3 && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{dayIds.length - 3}</span>}
                          </div>
                        ) : null
                      })()}
                      {/* Price subtotal */}
                      {item.price > 0 && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                          {((item.price || 0) * (item.quantity || 1)).toFixed(2)} €
                        </span>
                      )}
                      {item.wardrobeRepeat?.enabled && (
                        <span style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 'var(--radius-full)',
                          background: 'var(--accent-dim)', color: 'var(--accent-light)',
                          border: '1px solid var(--accent)',
                        }}>
                          ↻ {item.wardrobeRepeat.scope === 'series' ? 'Série' :
                             item.wardrobeRepeat.scope === 'episode' ? 'Episódio' :
                             item.wardrobeRepeat.scope === 'multi-episode' ? 'Multi-ep' : 'Bloco'}
                          {item.wardrobeRepeat.exceptions?.length > 0 && ` (${item.wardrobeRepeat.exceptions.length} exc.)`}
                          {item.wardrobeRepeat.variants?.length > 0 && ` · ${item.wardrobeRepeat.variants.length} var.`}
                        </span>
                      )}
                      {item.approved
                        ? <span className={styles.itemApproved}><Check size={10} /> Aprovado</span>
                        : <span className={styles.itemPending}>Pendente</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Drawer: criar/editar item ─────────────────────────────────────
function ItemDrawer({ item, onClose, onSave, onDelete }) {
  const {  departmentConfig, parsedCharacters, parsedLocations, parsedScripts  } = useStore(useShallow(s => ({ departmentConfig: s.departmentConfig, parsedCharacters: s.parsedCharacters, parsedLocations: s.parsedLocations, parsedScripts: s.parsedScripts })))
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(() => ({
    name: item?.name || '',
    department: item?.department || departmentConfig[0]?.id || 'wardrobe',
    characterName: item?.characterName || '',
    locationName: item?.locationName || '',
    scenes: item?.scenes || [],
    photos: item?.photos || [],
    notes: item?.notes || '',
    approved: item?.approved || false,
    episodeBlock: item?.episodeBlock || '',
    price: item?.price ?? '',
    quantity: item?.quantity ?? 1,
    supplier: item?.supplier || '',
    budgetLineId: item?.budgetLineId || '',
    wardrobeRepeat: item?.wardrobeRepeat || { enabled: false, scope: 'series', episodeRange: [], exceptions: [], exceptionsNote: '', variants: [] },
  }))

  const [viewPhoto, setViewPhoto] = useState(null)

  // All scene keys from scripts
  const allSceneKeys = useMemo(() => {
    const keys = []
    Object.entries(parsedScripts).forEach(([epId, data]) => {
      ;(data.scenes || []).forEach(sc => {
        keys.push(`${epId}-${sc.sceneNumber || sc.id}`)
      })
    })
    return keys
  }, [parsedScripts])

  const characters = useMemo(() => parsedCharacters.map(c => c.name), [parsedCharacters])
  const locationNames = useMemo(() => [...new Set(parsedLocations)], [parsedLocations])

  const handlePhotoUpload = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        setForm(prev => ({ ...prev, photos: [...prev.photos, ev.target.result] }))
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const removePhoto = (idx) => {
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }))
  }

  const toggleScene = (key) => {
    setForm(prev => ({
      ...prev,
      scenes: prev.scenes.includes(key)
        ? prev.scenes.filter(s => s !== key)
        : [...prev.scenes, key],
    }))
  }

  const handleSave = () => {
    if (!form.name.trim() && !form.characterName && !form.locationName) return
    onSave({
      ...item,
      ...form,
      name: form.name.trim() || `${departmentConfig.find(d => d.id === form.department)?.label || ''} — ${form.characterName || form.locationName || 'item'}`,
    })
    onClose()
  }

  const activeDept = departmentConfig.find(d => d.id === form.department)

  return (
    <>
      <motion.div className={styles.drawerOverlay}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}>
      <motion.div className={styles.drawer} data-glass
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <div>
            <h3 className={styles.drawerTitle}>{item?.id ? 'Editar Item' : 'Novo Item'}</h3>
            {activeDept && <span style={{ fontSize: 'var(--text-xs)', color: activeDept.color }}>{activeDept.label}</span>}
          </div>
          <button className={styles.btnIconSm} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={styles.drawerBody}>
          {/* Department */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Departamento</label>
            <select className={styles.fieldInput} value={form.department}
              onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}>
              {departmentConfig.map(d => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Nome / Descrição</label>
            <input className={styles.fieldInput} value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Vestido azul marinho, Relógio de bolso…" />
          </div>

          {/* Character */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Personagem</label>
            <select className={styles.fieldInput} value={form.characterName}
              onChange={e => setForm(prev => ({ ...prev, characterName: e.target.value }))}>
              <option value="">— nenhuma —</option>
              {characters.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Location */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Local</label>
            <select className={styles.fieldInput} value={form.locationName}
              onChange={e => setForm(prev => ({ ...prev, locationName: e.target.value }))}>
              <option value="">— nenhum —</option>
              {locationNames.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Episode block */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Bloco / Episódio</label>
            <input className={styles.fieldInput} value={form.episodeBlock}
              onChange={e => setForm(prev => ({ ...prev, episodeBlock: e.target.value }))}
              placeholder="Ex: EP01-EP03, Todo o projecto…" />
          </div>

          {/* Cost fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Preço unitário (EUR)</label>
              <input className={styles.fieldInput} type="number" min="0" step="0.01"
                value={form.price}
                onChange={e => setForm(prev => ({ ...prev, price: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 }))}
                placeholder="0.00" />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Quantidade</label>
              <input className={styles.fieldInput} type="number" min="1" step="1"
                value={form.quantity}
                onChange={e => setForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                placeholder="1" />
            </div>
          </div>
          {form.price !== '' && form.price > 0 && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: -8, marginBottom: 4 }}>
              Subtotal: <strong style={{ color: 'var(--text-primary)' }}>{((form.price || 0) * (form.quantity || 1)).toFixed(2)} €</strong>
            </div>
          )}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Fornecedor</label>
            <input className={styles.fieldInput} value={form.supplier}
              onChange={e => setForm(prev => ({ ...prev, supplier: e.target.value }))}
              placeholder="Nome do fornecedor…" />
          </div>

          {/* Photos */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Fotos ({form.photos.length})</label>
            <div className={styles.photosGrid}>
              {form.photos.map((photo, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={photo} alt="" className={styles.photoThumb}
                    onClick={() => setViewPhoto(photo)} />
                  <button style={{
                    position: 'absolute', top: 2, right: 2, width: 16, height: 16,
                    borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 10,
                  }} onClick={() => removePhoto(i)}>
                    <X size={8} />
                  </button>
                </div>
              ))}
              <button className={styles.addPhotoBtn} onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} />
                Foto
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple
              style={{ display: 'none' }} onChange={handlePhotoUpload} />
          </div>

          {/* Scenes */}
          {allSceneKeys.length > 0 && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Cenas onde aparece</label>
              <div className={styles.sceneChips}>
                {allSceneKeys.slice(0, 40).map(key => (
                  <button key={key}
                    className={`${styles.sceneChip} ${form.scenes.includes(key) ? styles.sceneChipActive : ''}`}
                    onClick={() => toggleScene(key)}>
                    {key}
                  </button>
                ))}
                {allSceneKeys.length > 40 && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{allSceneKeys.length - 40} cenas</span>
                )}
              </div>
            </div>
          )}

          {/* Wardrobe Repeat — only for wardrobe department */}
          {form.department === 'wardrobe' && (
            <div className={styles.fieldGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
                <input type="checkbox"
                  checked={form.wardrobeRepeat.enabled}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    wardrobeRepeat: { ...prev.wardrobeRepeat, enabled: e.target.checked }
                  }))} />
                <Shirt size={14} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: form.wardrobeRepeat.enabled ? 'var(--accent-light)' : 'var(--text-muted)' }}>
                  Figurino recorrente
                </span>
              </label>

              {form.wardrobeRepeat.enabled && (
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {/* Scope selector */}
                  <div>
                    <label className={styles.fieldLabel} style={{ fontSize: 'var(--text-xs)' }}>Âmbito</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      {[
                        { value: 'scene-block', label: 'Bloco de cenas' },
                        { value: 'episode', label: 'Episódio' },
                        { value: 'multi-episode', label: 'Multi-episódio' },
                        { value: 'series', label: 'Série toda' },
                      ].map(opt => (
                        <button key={opt.value}
                          type="button"
                          style={{
                            padding: '4px 10px', borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--text-xs)', fontWeight: 500, cursor: 'pointer',
                            border: form.wardrobeRepeat.scope === opt.value ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                            background: form.wardrobeRepeat.scope === opt.value ? 'var(--accent-dim)' : 'transparent',
                            color: form.wardrobeRepeat.scope === opt.value ? 'var(--accent-light)' : 'var(--text-secondary)',
                          }}
                          onClick={() => setForm(prev => ({
                            ...prev,
                            wardrobeRepeat: { ...prev.wardrobeRepeat, scope: opt.value }
                          }))}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Episode range for multi-episode */}
                  {form.wardrobeRepeat.scope === 'multi-episode' && (
                    <div>
                      <label className={styles.fieldLabel} style={{ fontSize: 'var(--text-xs)' }}>Episódios</label>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {Object.keys(parsedScripts).map(epId => (
                          <button key={epId}
                            type="button"
                            style={{
                              padding: '3px 8px', borderRadius: 'var(--radius-full)',
                              fontSize: 10, cursor: 'pointer',
                              border: form.wardrobeRepeat.episodeRange.includes(epId) ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                              background: form.wardrobeRepeat.episodeRange.includes(epId) ? 'var(--accent-dim)' : 'transparent',
                              color: form.wardrobeRepeat.episodeRange.includes(epId) ? 'var(--accent-light)' : 'var(--text-muted)',
                            }}
                            onClick={() => setForm(prev => ({
                              ...prev,
                              wardrobeRepeat: {
                                ...prev.wardrobeRepeat,
                                episodeRange: prev.wardrobeRepeat.episodeRange.includes(epId)
                                  ? prev.wardrobeRepeat.episodeRange.filter(e => e !== epId)
                                  : [...prev.wardrobeRepeat.episodeRange, epId]
                              }
                            }))}
                          >{epId}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exceptions — scene chips where NOT worn */}
                  <div>
                    <label className={styles.fieldLabel} style={{ fontSize: 'var(--text-xs)' }}>
                      Exceções <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(cenas onde NÃO usa)</span>
                    </label>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4, maxHeight: 120, overflow: 'auto' }}>
                      {allSceneKeys.slice(0, 60).map(key => (
                        <button key={key}
                          type="button"
                          style={{
                            padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                            fontSize: 9, cursor: 'pointer',
                            border: form.wardrobeRepeat.exceptions.includes(key) ? '1px solid var(--health-red)' : '1px solid var(--border-subtle)',
                            background: form.wardrobeRepeat.exceptions.includes(key) ? 'var(--health-red-dim, rgba(248,113,113,0.1))' : 'transparent',
                            color: form.wardrobeRepeat.exceptions.includes(key) ? 'var(--health-red)' : 'var(--text-muted)',
                            textDecoration: form.wardrobeRepeat.exceptions.includes(key) ? 'line-through' : 'none',
                          }}
                          onClick={() => setForm(prev => ({
                            ...prev,
                            wardrobeRepeat: {
                              ...prev.wardrobeRepeat,
                              exceptions: prev.wardrobeRepeat.exceptions.includes(key)
                                ? prev.wardrobeRepeat.exceptions.filter(e => e !== key)
                                : [...prev.wardrobeRepeat.exceptions, key]
                            }
                          }))}
                        >{key}</button>
                      ))}
                    </div>
                    <input
                      className={styles.fieldInput}
                      style={{ marginTop: 6, fontSize: 'var(--text-xs)' }}
                      value={form.wardrobeRepeat.exceptionsNote}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        wardrobeRepeat: { ...prev.wardrobeRepeat, exceptionsNote: e.target.value }
                      }))}
                      placeholder="Ex: Não usa óculos em INT, camisola suja só no EP03…"
                    />
                  </div>

                  {/* Variants */}
                  <div>
                    <label className={styles.fieldLabel} style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Variantes</span>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}
                        onClick={() => setForm(prev => ({
                          ...prev,
                          wardrobeRepeat: {
                            ...prev.wardrobeRepeat,
                            variants: [...prev.wardrobeRepeat.variants, {
                              id: `var_${Date.now()}`,
                              name: '',
                              sceneKeys: [],
                              condition: 'alternate',
                              photos: [],
                              notes: '',
                            }]
                          }
                        }))}
                      >+ Variante</button>
                    </label>
                    {form.wardrobeRepeat.variants.map((variant, vi) => (
                      <div key={variant.id} style={{
                        padding: 8, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)',
                        marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4,
                        border: '1px solid var(--border-subtle)',
                      }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            style={{
                              flex: 1, background: 'transparent', border: 'none',
                              color: 'var(--text-primary)', fontSize: 'var(--text-xs)', outline: 'none',
                            }}
                            value={variant.name}
                            onChange={e => {
                              const newVariants = [...form.wardrobeRepeat.variants]
                              newVariants[vi] = { ...newVariants[vi], name: e.target.value }
                              setForm(prev => ({ ...prev, wardrobeRepeat: { ...prev.wardrobeRepeat, variants: newVariants } }))
                            }}
                            placeholder="Ex: Versão suja, Rasgado, Com chapéu…"
                          />
                          <select
                            style={{
                              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 9, padding: '2px 4px',
                            }}
                            value={variant.condition}
                            onChange={e => {
                              const newVariants = [...form.wardrobeRepeat.variants]
                              newVariants[vi] = { ...newVariants[vi], condition: e.target.value }
                              setForm(prev => ({ ...prev, wardrobeRepeat: { ...prev.wardrobeRepeat, variants: newVariants } }))
                            }}
                          >
                            <option value="clean">Limpo</option>
                            <option value="dirty">Sujo</option>
                            <option value="damaged">Danificado</option>
                            <option value="wet">Molhado</option>
                            <option value="alternate">Alternativo</option>
                          </select>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: 'var(--health-red)', cursor: 'pointer' }}
                            onClick={() => {
                              const newVariants = form.wardrobeRepeat.variants.filter((_, i) => i !== vi)
                              setForm(prev => ({ ...prev, wardrobeRepeat: { ...prev.wardrobeRepeat, variants: newVariants } }))
                            }}
                          ><X size={12} /></button>
                        </div>
                        <input
                          style={{
                            background: 'transparent', border: 'none',
                            color: 'var(--text-muted)', fontSize: 9, outline: 'none',
                          }}
                          value={variant.notes}
                          onChange={e => {
                            const newVariants = [...form.wardrobeRepeat.variants]
                            newVariants[vi] = { ...newVariants[vi], notes: e.target.value }
                            setForm(prev => ({ ...prev, wardrobeRepeat: { ...prev.wardrobeRepeat, variants: newVariants } }))
                          }}
                          placeholder="Notas desta variante…"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Notas</label>
            <textarea className={styles.fieldInput} value={form.notes} rows={3}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Indicações do realizador, referências, etc." style={{ resize: 'vertical' }} />
          </div>

          {/* Approved */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.approved}
              onChange={e => setForm(prev => ({ ...prev, approved: e.target.checked }))} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: form.approved ? 'var(--health-green)' : 'var(--text-muted)' }}>
              {form.approved ? 'Aprovado pelo realizador' : 'Pendente aprovação'}
            </span>
          </label>
        </div>

        <div className={styles.drawerFooter}>
          {item?.id && (
            <button className={styles.btnDanger} onClick={() => { onDelete(item.id); onClose() }}>
              <Trash2 size={14} /> Apagar
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleSave}>
            <Check size={14} /> {item?.id ? 'Guardar' : 'Criar'}
          </button>
        </div>
      </motion.div>
      </motion.div>

      {/* Photo lightbox */}
      <AnimatePresence>
        {viewPhoto && (
          <motion.div className={styles.photoOverlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setViewPhoto(null)}>
            <img src={viewPhoto} alt="" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Bulk Import ───────────────────────────────────────────────────
function BulkImport() {
  const {  addDepartmentItem, departmentConfig, parsedCharacters, auth  } = useStore(useShallow(s => ({ addDepartmentItem: s.addDepartmentItem, departmentConfig: s.departmentConfig, parsedCharacters: s.parsedCharacters, auth: s.auth })))
  const fileInputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState(null)

  const handleFiles = useCallback((files) => {
    setImporting(true)
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    let processed = 0
    const items = []

    if (imageFiles.length === 0) {
      setImporting(false)
      setResults({ count: 0, message: 'Nenhuma imagem encontrada' })
      return
    }

    const charNames = parsedCharacters.map(c => c.name?.toLowerCase())

    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        // Try to detect character from filename
        const fname = file.name.toLowerCase().replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
        const matchedChar = charNames.find(c => fname.includes(c.toLowerCase()))

        // Try to detect department from path/name
        let dept = 'wardrobe'
        const fnLower = (file.webkitRelativePath || file.name).toLowerCase()
        if (/d[eé]cor|art[e ]|set\s*dress|cen[aá]rio/i.test(fnLower)) dept = 'art'
        else if (/prop|adere[cç]o|objeto/i.test(fnLower)) dept = 'props'
        else if (/maq|makeup|caract/i.test(fnLower)) dept = 'makeup'
        else if (/cabel|hair/i.test(fnLower)) dept = 'hair'
        else if (/sfx|efeito|explos/i.test(fnLower)) dept = 'sfx'
        else if (/ve[ií]culo|car|vehicle/i.test(fnLower)) dept = 'vehicles'
        else if (/stunt|acrobacia/i.test(fnLower)) dept = 'stunts'
        else if (/cam|câm/i.test(fnLower)) dept = 'camera'
        else if (/luz|light|ilum/i.test(fnLower)) dept = 'lighting'
        else if (/som|sound|[aá]udio/i.test(fnLower)) dept = 'sound'
        else if (/vfx|visual/i.test(fnLower)) dept = 'vfx'
        else if (/guard|ward|roupa|vest|figur/i.test(fnLower)) dept = 'wardrobe'

        items.push({
          name: file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
          department: dept,
          characterName: matchedChar ? parsedCharacters.find(c => c.name.toLowerCase() === matchedChar)?.name || '' : '',
          locationName: '',
          scenes: [],
          photos: [ev.target.result],
          notes: `Importado de: ${file.webkitRelativePath || file.name}`,
          approved: false,
          capturedBy: auth?.user?.name || auth?.user?.email || null,
        })

        processed++
        if (processed === imageFiles.length) {
          items.forEach(it => addDepartmentItem(it))
          setImporting(false)
          setResults({ count: items.length, message: `${items.length} item${items.length > 1 ? 's' : ''} importado${items.length > 1 ? 's' : ''}` })
        }
      }
      reader.readAsDataURL(file)
    })
  }, [addDepartmentItem, parsedCharacters])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div style={{ flex: 1, padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div
        className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: 'pointer', flex: 1 }}>
        <Upload size={40} />
        <p><strong>Arrasta fotos ou uma pasta aqui</strong></p>
        <p style={{ fontSize: 'var(--text-xs)' }}>
          O FRAME detecta automaticamente o departamento e personagem pelo nome do ficheiro/pasta.
          <br/>Subpastas com nomes como "guarda-roupa", "décor", "adereços" são reconhecidas.
        </p>
        {importing && <p style={{ color: 'var(--mod-departments)' }}>A importar…</p>}
        {results && (
          <p style={{ color: results.count > 0 ? 'var(--health-green)' : 'var(--text-muted)' }}>
            {results.message}
          </p>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple webkitdirectory=""
        style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
    </div>
  )
}

// ── Vista: Necessidades por Dia de Rodagem ──────────────────────
function NeedsByDayView() {
  const { departmentItems, departmentConfig, shootingDays, sceneAssignments, navigate } = useStore(
    useShallow(s => ({
      departmentItems: s.departmentItems,
      departmentConfig: s.departmentConfig,
      shootingDays: s.shootingDays,
      sceneAssignments: s.sceneAssignments,
      navigate: s.navigate,
    }))
  )

  const [expandedDay, setExpandedDay] = useState(null)

  // Build: for each shooting day, find scenes → find dept items for those scenes → group by dept
  const dayNeeds = useMemo(() => {
    // Invert sceneAssignments: dayId → [sceneKey, ...]
    const dayScenes = {}
    Object.entries(sceneAssignments || {}).forEach(([sceneKey, dayId]) => {
      if (!dayScenes[dayId]) dayScenes[dayId] = []
      dayScenes[dayId].push(sceneKey)
    })

    // Index dept items by scene
    const sceneToItems = {}
    departmentItems.forEach(item => {
      ;(item.scenes || []).forEach(sceneKey => {
        if (!sceneToItems[sceneKey]) sceneToItems[sceneKey] = []
        sceneToItems[sceneKey].push(item)
      })
    })

    return (shootingDays || []).map((day, idx) => {
      const scenes = dayScenes[day.id] || []
      // Collect unique items for this day (avoid duplicates if item appears in multiple scenes of same day)
      const itemSet = new Map()
      scenes.forEach(sceneKey => {
        ;(sceneToItems[sceneKey] || []).forEach(item => {
          if (!itemSet.has(item.id)) itemSet.set(item.id, item)
        })
      })
      const items = [...itemSet.values()]

      // Group by department
      const byDept = {}
      items.forEach(item => {
        if (!byDept[item.department]) byDept[item.department] = []
        byDept[item.department].push(item)
      })

      // Sort departments by item count desc
      const deptEntries = Object.entries(byDept)
        .map(([deptId, deptItems]) => ({
          deptId,
          config: departmentConfig.find(d => d.id === deptId),
          items: deptItems,
        }))
        .sort((a, b) => b.items.length - a.items.length)

      const dateStr = day.date
        ? new Date(day.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
        : ''

      return {
        dayId: day.id,
        label: day.label || `Dia ${idx + 1}`,
        date: dateStr,
        sceneCount: scenes.length,
        totalItems: items.length,
        deptEntries,
      }
    })
  }, [shootingDays, sceneAssignments, departmentItems, departmentConfig])

  if ((shootingDays || []).length === 0) {
    return (
      <div className={styles.emptyState}>
        <Calendar size={40} />
        <p>Sem dias de rodagem configurados</p>
        <p style={{ fontSize: 'var(--text-xs)' }}>Cria dias no módulo Produção para ver necessidades por dia</p>
        <button onClick={() => navigate('production')} style={{
          marginTop: 12, padding: '8px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--accent-dim)', border: '1px solid var(--accent)',
          color: 'var(--accent-light)', cursor: 'pointer', fontSize: 'var(--text-sm)',
          fontWeight: 500,
        }}>
          Ir para Produção →
        </button>
      </div>
    )
  }

  const totalWithNeeds = dayNeeds.filter(d => d.totalItems > 0).length

  return (
    <div className={styles.needsByDay}>
      <div className={styles.needsSummary}>
        <Calendar size={14} />
        <span>{dayNeeds.length} dias de rodagem · {totalWithNeeds} com necessidades de departamento</span>
      </div>
      <div className={styles.needsList}>
        {dayNeeds.map(day => {
          const isExpanded = expandedDay === day.dayId
          return (
            <div key={day.dayId} className={styles.needsDayCard}>
              <button
                className={`${styles.needsDayHeader} ${isExpanded ? styles.needsDayHeaderExpanded : ''}`}
                onClick={() => setExpandedDay(isExpanded ? null : day.dayId)}
              >
                <div className={styles.needsDayInfo}>
                  <span className={styles.needsDayLabel}>{day.label}</span>
                  {day.date && <span className={styles.needsDayDate}>{day.date}</span>}
                  <span className={styles.needsDayScenes}>{day.sceneCount} cena{day.sceneCount !== 1 ? 's' : ''}</span>
                </div>
                <div className={styles.needsDayBadges}>
                  {day.deptEntries.map(de => (
                    <span
                      key={de.deptId}
                      className={styles.needsDeptBadge}
                      style={{
                        color: de.config?.color || 'var(--text-muted)',
                        borderColor: (de.config?.color || 'var(--text-muted)') + '44',
                        background: (de.config?.color || 'var(--text-muted)') + '11',
                      }}
                    >
                      {de.items.length} {de.config?.label || de.deptId}
                    </span>
                  ))}
                  {day.totalItems === 0 && (
                    <span className={styles.needsNone}>Sem necessidades</span>
                  )}
                </div>
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexShrink: 0 }}
                >
                  <ChevronDown size={16} />
                </motion.span>
              </button>
              <AnimatePresence>
                {isExpanded && day.deptEntries.length > 0 && (
                  <motion.div
                    className={styles.needsDayBody}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  >
                    {day.deptEntries.map(de => {
                      const Icon = DEPT_ICONS[de.deptId] || Package
                      return (
                        <div key={de.deptId} className={styles.needsDeptGroup}>
                          <div className={styles.needsDeptTitle} style={{ color: de.config?.color }}>
                            <Icon size={13} />
                            <span>{de.config?.label || de.deptId}</span>
                            <span className={styles.needsDeptCount}>{de.items.length}</span>
                          </div>
                          <div className={styles.needsItemList}>
                            {de.items.map(item => (
                              <div key={item.id} className={styles.needsItem}>
                                {item.photos?.[0] ? (
                                  <img src={item.photos[0]} alt="" className={styles.needsItemThumb} />
                                ) : (
                                  <div className={styles.needsItemThumbPlaceholder}>
                                    <Icon size={10} />
                                  </div>
                                )}
                                <div className={styles.needsItemInfo}>
                                  <span className={styles.needsItemName}>{item.name || 'Sem nome'}</span>
                                  {item.characterName && (
                                    <span className={styles.needsItemMeta}>{item.characterName}</span>
                                  )}
                                </div>
                                {item.approved
                                  ? <Check size={12} style={{ color: 'var(--health-green)', flexShrink: 0 }} />
                                  : <span style={{ fontSize: 9, color: 'var(--health-yellow)', fontWeight: 700, flexShrink: 0 }}>Pendente</span>
                                }
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── MÓDULO PRINCIPAL ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
const VIEW_TABS = [
  { id: 'all',        label: 'Todos' },
  { id: 'mine',       label: 'Meus' },
  { id: 'characters', label: 'Por Personagem' },
  { id: 'locations',  label: 'Por Local' },
  { id: 'needs',      label: 'Necessidades por Dia' },
  { id: 'import',     label: 'Importar' },
]

export function DepartmentsModule() {
  const {
    departmentItems, departmentConfig, auth,
    addDepartmentItem, updateDepartmentItem, removeDepartmentItem,
    sceneAssignments, shootingDays, parsedScripts,
   } = useStore(useShallow(s => ({ departmentItems: s.departmentItems, departmentConfig: s.departmentConfig, auth: s.auth, addDepartmentItem: s.addDepartmentItem, updateDepartmentItem: s.updateDepartmentItem, removeDepartmentItem: s.removeDepartmentItem, sceneAssignments: s.sceneAssignments, shootingDays: s.shootingDays, parsedScripts: s.parsedScripts })))

  // ── Role-based visibility ──────────────────────────────────────────
  const userRole = auth?.role
  const roleData = userRole ? ROLES[userRole] : null
  const userDeptId = roleData?.dept ? ROLE_DEPT_TO_CONFIG[roleData.dept] : null
  const accessLevel = userRole ? getAccessLevel(userRole) : 1
  const canSeeAll = accessLevel <= 2 || SEE_ALL_ROLES.includes(userRole) || !userRole

  // Auto-filter by user department on first load (for HODs/technicians)
  const [view, setView] = useState('all')
  const [activeDept, setActiveDept] = useState(() => {
    // Level 3+ with a mappable dept → auto-filter to their department
    if (!canSeeAll && userDeptId) return userDeptId
    return null // admins/chefia see all
  })
  const [search, setSearch] = useState('')
  const [drawer, setDrawer] = useState(null) // null | 'new' | item
  const [filterChar, setFilterChar] = useState(null)
  const [filterLoc, setFilterLoc] = useState(null)

  // Resolve user name for "Meus" filter
  const userName = auth?.user ? (typeof auth.user === 'object' ? auth.user.name || auth.user.email : auth.user) : null

  // Filtered items
  const filteredItems = useMemo(() => {
    let items = departmentItems

    // "Meus" filter — items captured by current user OR belonging to user's department
    if (view === 'mine') {
      items = items.filter(i => {
        // Items captured by this user
        if (i.capturedBy) {
          const capturedName = typeof i.capturedBy === 'object' ? i.capturedBy.name || i.capturedBy.email : i.capturedBy
          if (userName && capturedName && capturedName === userName) return true
        }
        // Items in user's department (if user has a dept)
        if (userDeptId && i.department === userDeptId) return true
        return false
      })
    }

    if (activeDept) items = items.filter(i => i.department === activeDept)
    if (filterChar) items = items.filter(i => i.characterName === filterChar)
    if (filterLoc) items = items.filter(i => i.locationName === filterLoc)
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(i =>
        (i.name || '').toLowerCase().includes(q) ||
        (i.characterName || '').toLowerCase().includes(q) ||
        (i.locationName || '').toLowerCase().includes(q) ||
        (i.notes || '').toLowerCase().includes(q)
      )
    }
    return items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [departmentItems, activeDept, filterChar, filterLoc, search, view, userName, userDeptId])

  // Counts per department
  const deptCounts = useMemo(() => {
    const counts = {}
    departmentItems.forEach(i => { counts[i.department] = (counts[i.department] || 0) + 1 })
    return counts
  }, [departmentItems])

  // Scene coverage: scenes with at least one dept item vs total scenes
  const sceneCoverage = useMemo(() => {
    const allSceneKeys = new Set()
    Object.entries(parsedScripts || {}).forEach(([epId, data]) => {
      ;(data.scenes || []).forEach(sc => {
        allSceneKeys.add(`${epId}-${sc.sceneNumber || sc.id}`)
      })
    })
    const coveredScenes = new Set()
    departmentItems.forEach(it => {
      ;(it.scenes || []).forEach(s => coveredScenes.add(s))
    })
    return { covered: coveredScenes.size, total: allSceneKeys.size }
  }, [parsedScripts, departmentItems])

  // Map sceneKey → dayId for shooting day derivation on item cards
  const sceneToDayMap = useMemo(() => {
    const map = {}
    Object.entries(sceneAssignments || {}).forEach(([sceneKey, dayId]) => {
      map[sceneKey] = dayId
    })
    return map
  }, [sceneAssignments])

  // Day label lookup
  const dayLabels = useMemo(() => {
    const map = {}
    ;(shootingDays || []).forEach((d, i) => {
      map[d.id] = d.label || `Dia ${i + 1}`
    })
    return map
  }, [shootingDays])

  const handleSave = (itemData) => {
    if (itemData.id) {
      updateDepartmentItem(itemData.id, itemData)
    } else {
      // Set capturedBy to current user on creation
      const capturedBy = auth?.user?.name || auth?.user?.email || userName || null
      addDepartmentItem({ ...itemData, capturedBy })
    }
  }

  const handleSelectChar = (name) => {
    setFilterChar(name)
    setFilterLoc(null)
    setView('all')
  }

  const handleSelectLoc = (name) => {
    setFilterLoc(name)
    setFilterChar(null)
    setView('all')
  }

  const activeDeptConfig = activeDept ? departmentConfig.find(d => d.id === activeDept) : null

  return (
    <div className={styles.module}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Departamentos</h2>
          <p className={styles.sub}>
            {departmentItems.length} item{departmentItems.length !== 1 ? 's' : ''} ·{' '}
            {departmentItems.filter(i => i.approved).length} aprovados ·{' '}
            {departmentItems.filter(i => i.photos?.length > 0).length} com foto
            {sceneCoverage.total > 0 && <> · {sceneCoverage.covered} de {sceneCoverage.total} cenas cobertas</>}
          </p>
        </div>
        <nav className={styles.tabs}>
          {VIEW_TABS.map(tab => (
            <button key={tab.id}
              className={`${styles.tab} ${view === tab.id ? styles.tabActive : ''}`}
              onClick={() => { setView(tab.id); setFilterChar(null); setFilterLoc(null) }}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className={styles.content}>
        {/* Sidebar departamentos */}
        <div className={styles.deptSidebar}>
          <div className={styles.deptSidebarTitle}>Departamentos</div>
          <div className={styles.deptList}>
            {canSeeAll && (
              <button
                className={`${styles.deptBtn} ${!activeDept ? styles.deptBtnActive : ''}`}
                onClick={() => setActiveDept(null)}>
                <span className={styles.deptDot} style={{ background: 'var(--text-muted)' }} />
                <span className={styles.deptLabel}>Todos</span>
                <span className={styles.deptCount}>{departmentItems.length}</span>
              </button>
            )}
            {userDeptId && (
              <button
                className={`${styles.deptBtn} ${activeDept === userDeptId ? styles.deptBtnActive : ''}`}
                onClick={() => setActiveDept(userDeptId)}
                style={{ borderLeft: `3px solid ${departmentConfig.find(d => d.id === userDeptId)?.color || 'var(--accent)'}` }}>
                <span className={styles.deptDot} style={{ background: departmentConfig.find(d => d.id === userDeptId)?.color || 'var(--accent)' }} />
                <span className={styles.deptLabel} style={{ fontWeight: 600 }}>O meu Dept.</span>
                <span className={styles.deptCount}>{departmentItems.filter(i => i.department === userDeptId).length}</span>
              </button>
            )}
            {departmentConfig.map(dept => (
              <button key={dept.id}
                className={`${styles.deptBtn} ${activeDept === dept.id ? styles.deptBtnActive : ''}`}
                onClick={() => setActiveDept(dept.id)}>
                <span className={styles.deptDot} style={{ background: dept.color }} />
                <span className={styles.deptLabel}>{dept.label}</span>
                <span className={styles.deptCount}>{deptCounts[dept.id] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main area */}
        <div className={styles.mainArea}>
          {/* Sub-header with search + add */}
          <div className={styles.mainHeader}>
            <div>
              <h3 className={styles.mainTitle}>
                {filterChar ? filterChar : filterLoc ? filterLoc : activeDeptConfig?.label || 'Todos os Items'}
              </h3>
              <p className={styles.mainSub}>{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</p>
            </div>
            <div className={styles.headerActions}>
              {(filterChar || filterLoc) && (
                <button className={styles.btnSecondary} onClick={() => { setFilterChar(null); setFilterLoc(null) }}>
                  <X size={12} /> Limpar filtro
                </button>
              )}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className={styles.fieldInput} value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Procurar…"
                  style={{ paddingLeft: 28, width: 160, fontSize: 'var(--text-xs)' }} />
              </div>
              <button className={styles.btnPrimary} onClick={() => setDrawer('new')}>
                <Plus size={14} /> Novo Item
              </button>
            </div>
          </div>

          {/* Content based on view */}
          {view === 'characters' && <CharacterView onSelectChar={handleSelectChar} />}
          {view === 'locations' && <LocationView onSelectLoc={handleSelectLoc} />}
          {view === 'needs' && <NeedsByDayView />}
          {view === 'import' && <BulkImport />}
          {(view === 'all' || view === 'mine') && (
            <ItemsGrid items={filteredItems} onSelect={setDrawer} departmentConfig={departmentConfig}
              sceneToDayMap={sceneToDayMap} dayLabels={dayLabels} onAdd={() => setDrawer('new')} />
          )}
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {drawer && (
          <ItemDrawer
            item={drawer === 'new' ? null : drawer}
            onClose={() => setDrawer(null)}
            onSave={handleSave}
            onDelete={(id) => { removeDepartmentItem(id); setDrawer(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
