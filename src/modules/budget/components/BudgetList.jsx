// Lista de orçamentos + criação de novo
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, Trash2, Check, X } from 'lucide-react'
import { useState } from 'react'
import { fmt } from '../utils/moneyUtils.js'
import { calcTotalComIva, calcTotalVenda } from '../utils/formulae.js'
import { STATUS_LABELS } from '../utils/marketData.js'
import styles from '../Budget.module.css'

export function BudgetList({ budgets, activeBudgetId, onSelect, onCreate, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleDelete = (id) => {
    onDelete(id)
    setConfirmDelete(null)
  }

  return (
    <div className={styles.budgetList}>
      <div className={styles.budgetListHeader}>
        <span className={styles.budgetListTitle}>Orçamentos</span>
        <button className={styles.btnCreateBudget} onClick={onCreate} title="Novo orçamento">
          <Plus size={13} />
        </button>
      </div>

      <div className={styles.budgetListItems}>
        {budgets.length === 0 && (
          <div className={styles.budgetListEmpty}>
            <FileText size={24} color="var(--text-muted)" />
            <p>Sem orçamentos</p>
            <button className={styles.btnAdd} onClick={onCreate}>
              <Plus size={13} /> Criar primeiro
            </button>
          </div>
        )}

        <AnimatePresence>
          {budgets.map(b => {
            const totalVenda = calcTotalVenda(b.lines || [], b.taxaHonorarios || 0.15)
            const totalComIva = totalVenda + Math.round(totalVenda * (b.taxaIva || 0.23))
            const status = STATUS_LABELS[b.status] || STATUS_LABELS.draft
            const isActive = b.id === activeBudgetId

            return (
              <motion.div
                key={b.id}
                className={`${styles.budgetCard} ${isActive ? styles.budgetCardActive : ''}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onClick={() => onSelect(b.id)}
              >
                <div className={styles.budgetCardTop}>
                  <span className={styles.budgetCardNum}>{b.numero}</span>
                  <span className={styles.budgetCardStatus} style={{ color: status.color }}>
                    {status.label}
                  </span>
                </div>
                <div className={styles.budgetCardCampanha}>
                  {b.header?.campanha || b.header?.cliente || 'Sem título'}
                </div>
                {b.header?.cliente && b.header?.campanha && (
                  <div className={styles.budgetCardCliente}>{b.header.cliente}</div>
                )}
                {totalComIva > 0 && (
                  <div className={styles.budgetCardTotal}>{fmt(totalComIva)} c/IVA</div>
                )}

                {confirmDelete === b.id ? (
                  <div className={styles.budgetCardDeleteConfirm} onClick={e => e.stopPropagation()}>
                    <span>Eliminar?</span>
                    <button className={styles.btnDangerSm} onClick={() => handleDelete(b.id)}><Check size={11} /></button>
                    <button className={styles.btnMutedSm} onClick={() => setConfirmDelete(null)}><X size={11} /></button>
                  </div>
                ) : (
                  <button
                    className={styles.budgetCardDelete}
                    onClick={e => { e.stopPropagation(); setConfirmDelete(b.id) }}
                    title="Eliminar orçamento"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
