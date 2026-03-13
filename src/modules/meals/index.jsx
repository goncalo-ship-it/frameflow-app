// Meals — Gestão de catering para dias de rodagem
// Menu por categoria · Contagem de pedidos · Restrições alimentares · RSVP

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UtensilsCrossed, Plus, Trash2, Edit3, Users, Clock,
  MapPin, ChefHat, Leaf, Fish, Beef, AlertCircle,
  CheckCircle2, XCircle, Clapperboard, ArrowRight,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { COLORS } from '../../core/design.js'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '../../core/i18n/index.js'
import styles from './Meals.module.css'

const CATEGORY_DEFS = [
  { id: 'carne',       tKey: 'meals.catMeat',       color: COLORS.error, icon: Beef },
  { id: 'peixe',       tKey: 'meals.catFish',       color: COLORS.info, icon: Fish },
  { id: 'vegetariano', tKey: 'meals.catVegetarian',  color: COLORS.emerald, icon: Leaf },
  { id: 'vegan',       tKey: 'meals.catVegan',        color: '#a855f7', icon: Leaf },
]
const CAT_MAP_DEFS = Object.fromEntries(CATEGORY_DEFS.map(c => [c.id, c]))
const CAT_CSS = { carne: styles.menuCardCarne, peixe: styles.menuCardPeixe, vegetariano: styles.menuCardVegetariano, vegan: styles.menuCardVegan }

const uid = () => `meal_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`

// Normalise dietary strings for grouping
const normalizeDietary = (raw) => {
  const s = raw.trim().toLowerCase()
  // Map common variants to canonical keys
  if (/vegan/i.test(s)) return 'Vegan'
  if (/vegetarian|vegetariano/i.test(s)) return 'Vegetariano'
  if (/gluten|celiac|celiaco|celíaco/i.test(s)) return 'Sem Glúten'
  if (/lactose|dairy|lactic|sem lactose/i.test(s)) return 'Sem Lactose'
  if (/kosher/i.test(s)) return 'Kosher'
  if (/halal/i.test(s)) return 'Halal'
  if (/nut|nozes|amendoim|frutos secos/i.test(s)) return 'Sem Frutos Secos'
  // Capitalise first letter for unknown
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function MealsModule() {
  const { t } = useI18n()
  const { shootingDays, team, updateShootingDay, rsvp, updateRsvp, auth, navigate } = useStore(useShallow(s => ({
    shootingDays: s.shootingDays,
    team: s.team,
    updateShootingDay: s.updateShootingDay,
    rsvp: s.rsvp,
    updateRsvp: s.updateRsvp,
    auth: s.auth,
    navigate: s.navigate,
  })))

  const CATEGORIES = CATEGORY_DEFS.map(c => ({ ...c, label: t(c.tKey) }))
  const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

  const [selectedDayId, setSelectedDayId] = useState(shootingDays[0]?.id || null)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)

  // Form state
  const [formCat, setFormCat] = useState('carne')
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')

  const selectedDay = useMemo(() => shootingDays.find(d => d.id === selectedDayId), [shootingDays, selectedDayId])
  const catering = selectedDay?.catering || { time: '', location: '', provider: '', menu: [] }

  const dietarySummary = useMemo(() => {
    const counts = {}
    team.forEach(m => {
      if (m.dietary) {
        const diet = m.dietary.trim().toLowerCase()
        if (diet) {
          const key = normalizeDietary(m.dietary)
          counts[key] = (counts[key] || 0) + 1
        }
      }
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [team])

  // Members with dietary restrictions listed by name for detail
  const dietaryMembers = useMemo(() => {
    const map = {}
    team.forEach(m => {
      if (m.dietary) {
        const key = normalizeDietary(m.dietary)
        if (!map[key]) map[key] = []
        map[key].push(m.name || m.role || 'Membro')
      }
    })
    return map
  }, [team])

  // Order counts computed from RSVP menuChoice data (persisted in store)
  const dayRsvp = selectedDayId ? (rsvp[selectedDayId] || {}) : {}
  const orderCounts = useMemo(() => {
    const counts = {}
    ;(catering.menu || []).forEach(item => { counts[item.id] = 0 })
    // Count from RSVP data: each member's menuChoice points to a menu item id
    Object.values(dayRsvp).forEach(r => {
      if (r.menuChoice && counts[r.menuChoice] !== undefined) {
        counts[r.menuChoice]++
      }
    })
    return counts
  }, [catering.menu, dayRsvp])

  // RSVP summary for the selected day
  const rsvpSummary = useMemo(() => {
    const entries = Object.values(dayRsvp)
    const confirmed = entries.filter(r => r.status === 'confirmed' || r.menuChoice).length
    const declined = entries.filter(r => r.status === 'declined').length
    const pending = team.length - confirmed - declined
    const totalWithChoice = entries.filter(r => r.menuChoice).length
    return { confirmed, declined, pending: Math.max(0, pending), totalWithChoice, total: team.length }
  }, [dayRsvp, team])

  const updateCatering = useCallback((patch) => {
    if (!selectedDay) return
    updateShootingDay(selectedDay.id, {
      catering: { ...catering, ...patch }
    })
  }, [selectedDay, catering, updateShootingDay])

  const addMenuItem = useCallback(() => {
    if (!formName.trim()) return
    const menu = [...(catering.menu || []), { id: uid(), category: formCat, name: formName.trim(), description: formDesc.trim(), orders: 0 }]
    updateCatering({ menu })
    setFormName(''); setFormDesc(''); setFormCat('carne'); setAdding(false)
  }, [formName, formDesc, formCat, catering, updateCatering])

  const removeMenuItem = useCallback((itemId) => {
    const menu = (catering.menu || []).filter(m => m.id !== itemId)
    updateCatering({ menu })
  }, [catering, updateCatering])

  // Record meal choice via RSVP (persisted in store)
  const currentMemberId = auth?.user?.uid || auth?.user?.email || 'anonymous'
  const myChoice = dayRsvp[currentMemberId]?.menuChoice || null

  const selectMeal = useCallback((itemId) => {
    if (!selectedDayId) return
    // Toggle: if already selected, deselect; otherwise select this item
    const choice = myChoice === itemId ? null : itemId
    updateRsvp(selectedDayId, currentMemberId, { menuChoice: choice })
  }, [selectedDayId, currentMemberId, myChoice, updateRsvp])

  // ── Empty state ──
  if (!shootingDays.length) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{t('meals.title')}</div>
            <div className={styles.sub}>{t('meals.sub')}</div>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.empty}>
            <UtensilsCrossed size={48} className={styles.emptyIcon} />
            <div className={styles.emptyText}>{t('meals.emptyTitle')}</div>
            <div className={styles.emptyHint}>{t('meals.emptyHint')}</div>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ marginTop: 16 }}
              onClick={() => navigate('production')}
            >
              <Clapperboard size={14} /> Ir para Produção <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{t('meals.title')}</div>
          <div className={styles.sub}>{t('meals.shootingDaysSub', { days: shootingDays.length, members: team.length })}</div>
        </div>
      </div>

      {/* ── Day Selector ── */}
      <div className={styles.daySelector}>
        {shootingDays.map(day => (
          <button
            key={day.id}
            className={day.id === selectedDayId ? styles.dayChipActive : styles.dayChip}
            onClick={() => setSelectedDayId(day.id)}
          >
            {day.label || day.date || t('meals.day', { id: day.id })}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>
        {/* Info bar */}
        <div className={styles.infoBar}>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>{t('meals.time')}</div>
            <div className={styles.infoValue}>{catering.time || '—'}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>{t('meals.location')}</div>
            <div className={styles.infoValue}>{catering.location || '—'}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>{t('meals.provider')}</div>
            <div className={styles.infoValue}>{catering.provider || '—'}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>{t('meals.menuOptions')}</div>
            <div className={styles.infoValue}>{(catering.menu || []).length}</div>
          </div>
        </div>

        {/* RSVP Summary */}
        {team.length > 0 && (
          <div className={styles.rsvpSection}>
            <div className={styles.sectionTitle}><Users size={16} /> RSVP</div>
            <div className={styles.rsvpGrid}>
              <div className={styles.rsvpCard}>
                <CheckCircle2 size={16} style={{ color: COLORS.emerald }} />
                <div className={styles.rsvpCardInner}>
                  <span className={styles.rsvpNumber}>{rsvpSummary.confirmed}</span>
                  <span className={styles.rsvpLabel}>Confirmados</span>
                </div>
              </div>
              <div className={styles.rsvpCard}>
                <XCircle size={16} style={{ color: COLORS.error }} />
                <div className={styles.rsvpCardInner}>
                  <span className={styles.rsvpNumber}>{rsvpSummary.declined}</span>
                  <span className={styles.rsvpLabel}>Recusados</span>
                </div>
              </div>
              <div className={styles.rsvpCard}>
                <Clock size={16} style={{ color: '#f59e0b' }} />
                <div className={styles.rsvpCardInner}>
                  <span className={styles.rsvpNumber}>{rsvpSummary.pending}</span>
                  <span className={styles.rsvpLabel}>Pendentes</span>
                </div>
              </div>
              <div className={styles.rsvpCard}>
                <ChefHat size={16} style={{ color: 'var(--accent-light)' }} />
                <div className={styles.rsvpCardInner}>
                  <span className={styles.rsvpNumber}>{rsvpSummary.totalWithChoice}</span>
                  <span className={styles.rsvpLabel}>Escolheram Menu</span>
                </div>
              </div>
            </div>
            {/* Per-option breakdown */}
            {(catering.menu || []).length > 0 && rsvpSummary.totalWithChoice > 0 && (
              <div className={styles.rsvpBreakdown}>
                {(catering.menu || []).map(item => {
                  const count = orderCounts[item.id] || 0
                  if (count === 0) return null
                  const cat = CAT_MAP[item.category] || CAT_MAP.carne
                  const pct = rsvpSummary.totalWithChoice > 0 ? Math.round((count / rsvpSummary.totalWithChoice) * 100) : 0
                  return (
                    <div key={item.id} className={styles.rsvpBreakdownRow}>
                      <div className={styles.rsvpBreakdownDot} style={{ background: cat.color }} />
                      <span className={styles.rsvpBreakdownName}>{item.name}</span>
                      <div className={styles.rsvpBreakdownBar}>
                        <div className={styles.rsvpBreakdownFill} style={{ width: `${pct}%`, background: cat.color }} />
                      </div>
                      <span className={styles.rsvpBreakdownCount}>{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Catering details editable */}
        <div className={styles.cateringSection}>
          <div className={styles.sectionTitle}><Clock size={16} /> {t('meals.cateringDetails')}</div>
          <div className={styles.editRow}>
            <input
              className={styles.editInput}
              placeholder={t('meals.timePlaceholder')}
              value={catering.time || ''}
              onChange={e => updateCatering({ time: e.target.value })}
            />
            <input
              className={styles.editInput}
              placeholder={t('meals.locationPlaceholder')}
              value={catering.location || ''}
              onChange={e => updateCatering({ location: e.target.value })}
            />
            <input
              className={styles.editInput}
              placeholder={t('meals.providerPlaceholder')}
              value={catering.provider || ''}
              onChange={e => updateCatering({ provider: e.target.value })}
            />
          </div>
        </div>

        {/* Menu section */}
        <div className={styles.cateringSection}>
          <div className={styles.sectionTitle} style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UtensilsCrossed size={16} /> {t('meals.dayMenu')}
            </span>
            <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={() => setAdding(true)}>
              <Plus size={14} /> {t('meals.addItem')}
            </button>
          </div>

          {(catering.menu || []).length === 0 && !adding && (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)' }}>
              <UtensilsCrossed size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <div style={{ fontSize: 'var(--text-sm)', marginBottom: 8 }}>Nenhum prato adicionado</div>
              <button className={`${styles.btn} ${styles.btnSmall}`} onClick={() => setAdding(true)}>
                <Plus size={12} /> Adicionar primeiro prato
              </button>
            </div>
          )}

          <div className={styles.menuGrid}>
            <AnimatePresence>
              {(catering.menu || []).map(item => {
                const cat = CAT_MAP[item.category] || CAT_MAP.carne
                const CatIcon = cat.icon
                return (
                  <motion.div
                    key={item.id}
                    className={`${styles.menuCard} ${CAT_CSS[item.category] || ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={styles.menuCategory} style={{ color: cat.color }}>
                      <CatIcon size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {cat.label}
                    </div>
                    <div className={styles.menuName}>{item.name}</div>
                    {item.description && <div className={styles.menuDesc}>{item.description}</div>}
                    <div className={styles.menuCount}>
                      <Users size={14} />
                      <span className={styles.menuCountBadge}>{orderCounts[item.id] || 0}</span>
                      {t('meals.orders')}
                    </div>
                    <div className={styles.menuActions}>
                      <button
                        className={`${styles.btn} ${styles.btnSmall}${myChoice === item.id ? ` ${styles.btnPrimary}` : ''}`}
                        onClick={() => selectMeal(item.id)}
                      >
                        {myChoice === item.id ? <><ChefHat size={12} /> {t('meals.selected') || 'Escolhido'}</> : <><Plus size={12} /> {t('meals.order')}</>}
                      </button>
                      <button className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`} onClick={() => removeMenuItem(item.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Add form */}
            {adding && (
              <motion.div
                className={styles.addForm}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <select className={styles.selectInput} value={formCat} onChange={e => setFormCat(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <input className={styles.editInput} placeholder={t('meals.dishNamePlaceholder')} value={formName} onChange={e => setFormName(e.target.value)} />
                <input className={styles.editInput} placeholder={t('meals.descriptionPlaceholder')} value={formDesc} onChange={e => setFormDesc(e.target.value)} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={addMenuItem}>{t('meals.addItem')}</button>
                  <button className={styles.btn} onClick={() => setAdding(false)}>{t('meals.cancel')}</button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Dietary restrictions */}
        <div className={styles.dietarySummary}>
          <div className={styles.sectionTitle}><AlertCircle size={16} /> {t('meals.dietaryRestrictions')}</div>
          {dietarySummary.length > 0 ? (
            <>
              <div className={styles.dietaryGrid}>
                {dietarySummary.map(([restriction, count]) => (
                  <div key={restriction} className={styles.dietaryChip} title={(dietaryMembers[restriction] || []).join(', ')}>
                    <span className={styles.dietaryCount}>{count}</span>
                    {restriction}
                  </div>
                ))}
              </div>
              <div className={styles.dietaryTotal}>
                {dietarySummary.reduce((sum, [, c]) => sum + c, 0)} de {team.length} membros com restrições alimentares
              </div>
            </>
          ) : (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', padding: '8px 0' }}>
              {team.length > 0
                ? 'Nenhum membro da equipa tem restrições alimentares registadas. Adicione no perfil de cada membro em Equipa.'
                : 'Adicione membros da equipa para ver restrições alimentares.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { MealsModule }
