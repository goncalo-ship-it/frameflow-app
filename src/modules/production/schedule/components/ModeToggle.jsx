// ModeToggle — alterna entre modo Criativo e modo Orçamental
// v2: comparação side-by-side com custos e cenas excluídas

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, DollarSign, AlertTriangle } from 'lucide-react'
import { useStore } from '../../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { useScheduleSimulation } from '../hooks/useScheduleEngine.js'
import styles from '../Schedule.module.css'

export function ModeToggle({ creativeMeta }) {
  const {  scheduleMode, scheduleBudgetEnvelope, setScheduleMode, setScheduleBudgetEnvelope  } = useStore(useShallow(s => ({ scheduleMode: s.scheduleMode, scheduleBudgetEnvelope: s.scheduleBudgetEnvelope, setScheduleMode: s.setScheduleMode, setScheduleBudgetEnvelope: s.setScheduleBudgetEnvelope })))
  const mode = scheduleMode || 'creative'

  // Simular o modo alternativo para comparação
  const { simulate } = useScheduleSimulation()

  const comparison = useMemo(() => {
    if (!creativeMeta || !scheduleBudgetEnvelope) return null
    if (mode === 'creative') {
      // Simular modo budget para comparar
      try {
        const budgetResult = simulate({
          scheduleMode: 'budget',
          scheduleBudgetEnvelope,
        })
        return {
          creativeDays: creativeMeta.daysUsed,
          creativeCenas: creativeMeta.assignedScenes,
          creativeCusto: creativeMeta.custoTotal || 0,
          budgetDays: scheduleBudgetEnvelope,
          budgetCenas: budgetResult.meta.assignedScenes,
          budgetCusto: budgetResult.meta.custoTotal || 0,
          budgetOverflow: budgetResult.cenasSemDia || [],
          diff: creativeMeta.daysUsed - scheduleBudgetEnvelope,
        }
      } catch { return null }
    }
    // Se já está em budget, comparar com criativo
    try {
      const creativeResult = simulate({ scheduleMode: 'creative' })
      return {
        creativeDays: creativeResult.meta.daysUsed,
        creativeCenas: creativeResult.meta.assignedScenes,
        creativeCusto: creativeResult.meta.custoTotal || 0,
        budgetDays: scheduleBudgetEnvelope,
        budgetCenas: creativeMeta.assignedScenes,
        budgetCusto: creativeMeta.custoTotal || 0,
        budgetOverflow: [],
        diff: creativeResult.meta.daysUsed - (scheduleBudgetEnvelope || 0),
      }
    } catch { return null }
  }, [creativeMeta, scheduleBudgetEnvelope, mode, simulate])

  return (
    <div className={styles.modeToggleWrap}>
      <div className={styles.modeToggle}>
        <motion.button
          className={`${styles.modeBtn} ${mode === 'creative' ? styles.modeBtnActive : ''}`}
          onClick={() => setScheduleMode('creative')}
          whileTap={{ scale: 0.96 }}
        >
          <Zap size={13} />
          Criativo
        </motion.button>
        <motion.button
          className={`${styles.modeBtn} ${mode === 'budget' ? styles.modeBtnActiveBudget : ''}`}
          onClick={() => setScheduleMode('budget')}
          whileTap={{ scale: 0.96 }}
        >
          <DollarSign size={13} />
          Orçamental
        </motion.button>
      </div>

      {/* Envelope em modo budget */}
      <AnimatePresence>
        {mode === 'budget' && (
          <motion.div
            className={styles.envelopeWrap}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
          >
            <span className={styles.envelopeLabel}>Máx dias:</span>
            <input
              type="number"
              className={styles.envelopeInput}
              value={scheduleBudgetEnvelope || ''}
              min={1}
              max={200}
              placeholder="—"
              onChange={e => setScheduleBudgetEnvelope(e.target.value ? Number(e.target.value) : null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparação criativo vs orçamental */}
      {comparison && comparison.diff > 0 && (
        <div className={styles.modeComparison}>
          <span>
            <Zap size={10} /> <strong>{comparison.creativeDays}d</strong>
            {comparison.creativeCusto > 0 && (
              <span style={{ marginLeft: 4, fontSize: 10 }}>
                ({(comparison.creativeCusto).toLocaleString('pt-PT')}€)
              </span>
            )}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>vs</span>
          <span>
            <DollarSign size={10} /> <strong>{comparison.budgetDays}d</strong>
            {comparison.budgetCusto > 0 && (
              <span style={{ marginLeft: 4, fontSize: 10 }}>
                ({(comparison.budgetCusto).toLocaleString('pt-PT')}€)
              </span>
            )}
          </span>
          <span style={{ color: 'var(--health-yellow)', fontWeight: 700 }}>
            Δ {comparison.diff}d
          </span>
          {comparison.budgetOverflow.length > 0 && (
            <span style={{ color: 'var(--health-red)', display: 'flex', alignItems: 'center', gap: 2, fontSize: 10 }}>
              <AlertTriangle size={9} />
              {comparison.budgetOverflow.length} cenas fora
            </span>
          )}
        </div>
      )}
    </div>
  )
}
