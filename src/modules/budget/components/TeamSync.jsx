// TeamSync — importa custos de equipa do store para linhas de orçamento
// Lê team[] + shootingDays[] → gera linhas com cachê diário × dias

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, X, Check, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { toCents, fmt } from '../utils/moneyUtils.js'
import { MARKUP_DEFAULTS } from '../utils/marketData.js'
import styles from '../Budget.module.css'

// ── Mapeamento Grupo UI → Categoria orçamento ───────────────────────
const GROUP_TO_CAT = {
  'Elenco':        2,   // Elenco
  'Produção':      3,   // Equipa Técnica
  'Realização':    3,
  'Imagem':        3,
  'Electricidade': 3,
  'Som':           9,   // Som
  'Arte':          5,   // Departamento de Arte
  'Pós-Produção': 10,   // Pós-Produção Vídeo
}

const GROUP_TO_MARKUP = {
  'Elenco':    MARKUP_DEFAULTS.elenco,
  'default':   MARKUP_DEFAULTS.equipa,
}

const CAT_LABELS = {
  2:  'Elenco',
  3:  'Equipa Técnica',
  5:  'Dep. Arte',
  9:  'Som',
  10: 'Pós-Produção',
}

// Inverso: Categoria orçamento → Grupo UI (para Budget→Team)
const CAT_TO_GROUP = {
  2:  'Elenco',
  3:  'Produção',
  5:  'Arte',
  9:  'Som',
  10: 'Pós-Produção',
}

// ── Component ────────────────────────────────────────────────────────

export function TeamSync({ open, onClose, budget, onAddLine, onUpdateLine }) {
  const {  team, shootingDays, addMember  } = useStore(useShallow(s => ({ team: s.team, shootingDays: s.shootingDays, addMember: s.addMember })))
  const [selected, setSelected] = useState(new Set())
  const [tab, setTab] = useState('to-budget') // 'to-budget' | 'to-team'

  const totalDays = shootingDays.length

  // Membros com cachê diário definido
  const syncable = useMemo(() => {
    return team
      .filter(m => m.cacheDiario && m.cacheDiario > 0)
      .map(m => {
        const cat = GROUP_TO_CAT[m.group] || 3
        const markup = GROUP_TO_MARKUP[m.group] || GROUP_TO_MARKUP.default
        const dias = m.confirmedDays?.length || totalDays || 1
        const custoUnitarioCents = toCents(m.cacheDiario)
        const valorUnitarioCents = Math.round(custoUnitarioCents * markup)

        // Já existe no orçamento?
        const existingLine = budget?.lines?.find(l =>
          l.teamMemberId === m.id && l.origem === 'team-sync'
        )

        // Mudou desde última sync?
        const changed = existingLine && (
          existingLine.valorUnitario !== valorUnitarioCents ||
          existingLine.dias !== dias
        )

        return {
          member: m,
          cat,
          catLabel: CAT_LABELS[cat] || 'Equipa',
          markup,
          dias,
          custoUnitario: custoUnitarioCents,
          valorUnitario: valorUnitarioCents,
          totalVenda: valorUnitarioCents * dias,
          totalCusto: custoUnitarioCents * dias,
          existingLine,
          changed,
        }
      })
      .sort((a, b) => a.cat - b.cat || a.member.name.localeCompare(b.member.name))
  }, [team, shootingDays, budget, totalDays])

  const newMembers = syncable.filter(s => !s.existingLine)
  const updatedMembers = syncable.filter(s => s.existingLine && s.changed)
  const syncedMembers = syncable.filter(s => s.existingLine && !s.changed)
  const noRate = team.filter(m => !m.cacheDiario || m.cacheDiario <= 0)

  // ── Inverso: linhas do orçamento (cats 2,3,5,9,10) que não estão na equipa ──
  const budgetPeople = useMemo(() => {
    if (!budget?.lines) return []
    const peopleCats = [2, 3, 5, 9, 10]
    return budget.lines
      .filter(l => peopleCats.includes(l.categoria) && l.descricao)
      .filter(l => !l.teamMemberId) // não veio do TeamSync
      .map(l => {
        // Verificar se já existe na equipa por nome
        const nameClean = l.descricao?.split('—')[0].split('-')[0].trim()
        const alreadyInTeam = team.some(m =>
          m.name && nameClean && m.name.toLowerCase().includes(nameClean.toLowerCase())
        )
        return {
          line: l,
          name: nameClean,
          group: CAT_TO_GROUP[l.categoria] || 'Produção',
          catLabel: CAT_LABELS[l.categoria] || 'Equipa',
          alreadyInTeam,
          valorDia: l.valorUnitario || 0,
          dias: l.dias || 1,
        }
      })
      .filter(p => !p.alreadyInTeam && p.name.length > 1)
  }, [budget?.lines, team])

  const toggleAll = (items) => {
    const ids = items.map(s => s.member.id)
    const allSelected = ids.every(id => selected.has(id))
    setSelected(prev => {
      const next = new Set(prev)
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id))
      return next
    })
  }

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSync = () => {
    let added = 0, updated = 0

    for (const s of syncable) {
      if (!selected.has(s.member.id)) continue

      const lineData = {
        categoria: s.cat,
        descricao: `${s.member.name} — ${s.member.role || s.member.group || 'Equipa'}`,
        valorUnitario: s.valorUnitario,
        quantidade: 1,
        dias: s.dias,
        custoReal: s.totalCusto,
        markup: s.markup,
        taxaIva: 0.23,
        fornecedor: s.member.company || '',
        origem: 'team-sync',
        teamMemberId: s.member.id,
      }

      if (s.existingLine) {
        // Update existing
        onUpdateLine(s.existingLine.id, lineData)
        updated++
      } else {
        // Add new
        onAddLine(lineData)
        added++
      }
    }

    setSelected(new Set())
    if (added + updated > 0) {
      setTimeout(onClose, 400)
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        className={styles.teamSyncOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.teamSyncDrawer}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.teamSyncHeader}>
            <div>
              <h3 className={styles.teamSyncTitle}>
                <Users size={16} /> Sync Equipa ↔ Orçamento
              </h3>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                <button
                  className={`${styles.teamSyncTab} ${tab === 'to-budget' ? styles.teamSyncTabActive : ''}`}
                  onClick={() => { setTab('to-budget'); setSelected(new Set()) }}
                >
                  Equipa → Orçamento
                  {syncable.length > 0 && <span className={styles.teamSyncTabBadge}>{syncable.length}</span>}
                </button>
                <button
                  className={`${styles.teamSyncTab} ${tab === 'to-team' ? styles.teamSyncTabActive : ''}`}
                  onClick={() => { setTab('to-team'); setSelected(new Set()) }}
                >
                  Orçamento → Equipa
                  {budgetPeople.length > 0 && <span className={styles.teamSyncTabBadge}>{budgetPeople.length}</span>}
                </button>
              </div>
            </div>
            <button className={styles.teamSyncClose} onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <div className={styles.teamSyncBody}>
            {tab === 'to-budget' && (
              <>
                {syncable.length === 0 && (
                  <div className={styles.teamSyncEmpty}>
                    <AlertCircle size={20} color="var(--text-muted)" />
                    <p>Nenhum membro tem cachê diário definido.</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      Vai a Equipa &amp; Elenco → abre um membro → preenche "Cachê diário"
                    </p>
                  </div>
                )}

                {totalDays === 0 && syncable.length > 0 && (
                  <div className={styles.teamSyncWarning}>
                    <AlertCircle size={13} />
                    <span>Sem dias de rodagem — usando 1 dia por defeito. Configura em Produção.</span>
                  </div>
                )}

                {newMembers.length > 0 && (
                  <Section
                    title={`Novos (${newMembers.length})`}
                    items={newMembers}
                    selected={selected}
                    onToggle={toggle}
                    onToggleAll={() => toggleAll(newMembers)}
                    variant="new"
                  />
                )}

                {updatedMembers.length > 0 && (
                  <Section
                    title={`Actualizar (${updatedMembers.length})`}
                    items={updatedMembers}
                    selected={selected}
                    onToggle={toggle}
                    onToggleAll={() => toggleAll(updatedMembers)}
                    variant="update"
                  />
                )}

                {syncedMembers.length > 0 && (
                  <div className={styles.teamSyncSection}>
                    <p className={styles.teamSyncSectionTitle}>
                      <Check size={12} color="var(--health-green)" /> Em dia ({syncedMembers.length})
                    </p>
                    {syncedMembers.map(s => (
                      <div key={s.member.id} className={styles.teamSyncRow} style={{ opacity: 0.5 }}>
                        <div className={styles.teamSyncRowInfo}>
                          <span className={styles.teamSyncName}>{s.member.name}</span>
                          <span className={styles.teamSyncDetail}>
                            {s.member.role || s.member.group} · {fmt(s.totalVenda)}
                          </span>
                        </div>
                        <Check size={14} color="var(--health-green)" />
                      </div>
                    ))}
                  </div>
                )}

                {noRate.length > 0 && (
                  <div className={styles.teamSyncSection}>
                    <p className={styles.teamSyncSectionTitle} style={{ color: 'var(--text-muted)' }}>
                      Sem cachê ({noRate.length})
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: '0 var(--space-2)' }}>
                      {noRate.slice(0, 5).map(m => m.name).join(', ')}
                      {noRate.length > 5 ? ` +${noRate.length - 5}` : ''}
                    </p>
                  </div>
                )}
              </>
            )}

            {tab === 'to-team' && (
              <>
                {budgetPeople.length === 0 ? (
                  <div className={styles.teamSyncEmpty}>
                    <Check size={20} color="var(--health-green)" />
                    <p>Todos os membros do orçamento já estão na equipa.</p>
                  </div>
                ) : (
                  <div className={styles.teamSyncSection}>
                    <p className={styles.teamSyncSectionTitle}>
                      Pessoas no orçamento sem perfil na equipa ({budgetPeople.length})
                    </p>
                    {budgetPeople.map(p => {
                      const isSelected = selected.has(p.line.id)
                      return (
                        <motion.div
                          key={p.line.id}
                          className={`${styles.teamSyncRow} ${isSelected ? styles.teamSyncRowSelected : ''}`}
                          onClick={() => {
                            setSelected(prev => {
                              const next = new Set(prev)
                              next.has(p.line.id) ? next.delete(p.line.id) : next.add(p.line.id)
                              return next
                            })
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={styles.teamSyncCheck}>
                            {isSelected && <Check size={12} />}
                          </div>
                          <div className={styles.teamSyncRowInfo}>
                            <div className={styles.teamSyncRowTop}>
                              <span className={styles.teamSyncName}>{p.name}</span>
                              <span className={styles.teamSyncCatBadge}>{p.catLabel}</span>
                            </div>
                            <span className={styles.teamSyncDetail}>
                              {p.group} · {fmt(p.valorDia)}/dia × {p.dias} dia{p.dias !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {selected.size > 0 && tab === 'to-budget' && (
            <div className={styles.teamSyncFooter}>
              <span className={styles.teamSyncFooterCount}>
                {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
              </span>
              <button className={styles.teamSyncBtn} onClick={handleSync}>
                <ArrowRight size={14} /> Sincronizar → Orçamento
              </button>
            </div>
          )}

          {selected.size > 0 && tab === 'to-team' && (
            <div className={styles.teamSyncFooter}>
              <span className={styles.teamSyncFooterCount}>
                {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
              </span>
              <button className={styles.teamSyncBtn} onClick={() => {
                let added = 0
                for (const p of budgetPeople) {
                  if (!selected.has(p.line.id)) continue
                  addMember({
                    name: p.name,
                    role: p.line.descricao,
                    group: p.group,
                    cacheDiario: Math.round((p.valorDia || 0) / 100),
                    email: '', phone: '', photo: '',
                  })
                  added++
                }
                setSelected(new Set())
                if (added > 0) setTimeout(onClose, 400)
              }}>
                <ArrowRight size={14} /> Criar {selected.size} na Equipa
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Section de membros ───────────────────────────────────────────────

function Section({ title, items, selected, onToggle, onToggleAll, variant }) {
  const allSelected = items.every(s => selected.has(s.member.id))

  return (
    <div className={styles.teamSyncSection}>
      <div className={styles.teamSyncSectionHeader}>
        <p className={styles.teamSyncSectionTitle}>
          {variant === 'update' && <RefreshCw size={12} color="var(--health-yellow)" />}
          {title}
        </p>
        <button className={styles.teamSyncSelectAll} onClick={onToggleAll}>
          {allSelected ? 'Desseleccionar' : 'Seleccionar todos'}
        </button>
      </div>

      {items.map(s => {
        const isSelected = selected.has(s.member.id)
        return (
          <motion.div
            key={s.member.id}
            className={`${styles.teamSyncRow} ${isSelected ? styles.teamSyncRowSelected : ''}`}
            onClick={() => onToggle(s.member.id)}
            whileTap={{ scale: 0.98 }}
          >
            <div className={styles.teamSyncCheck}>
              {isSelected && <Check size={12} />}
            </div>
            <div className={styles.teamSyncRowInfo}>
              <div className={styles.teamSyncRowTop}>
                <span className={styles.teamSyncName}>{s.member.name}</span>
                <span className={styles.teamSyncCatBadge}>{s.catLabel}</span>
              </div>
              <span className={styles.teamSyncDetail}>
                {s.member.role || s.member.group}
                {' · '}€{s.member.cacheDiario}/dia
                {' × '}{s.dias} dia{s.dias !== 1 ? 's' : ''}
                {' = '}{fmt(s.totalVenda)}
                {s.markup > 1 ? ` (×${s.markup.toFixed(2)})` : ''}
              </span>
              {variant === 'update' && s.existingLine && (
                <span className={styles.teamSyncChanged}>
                  Antes: {fmt(s.existingLine.valorUnitario)} × {s.existingLine.dias}d
                </span>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
