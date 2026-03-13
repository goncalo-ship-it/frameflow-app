import { useState } from 'react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { nanoid } from '../utils/moneyUtils.js'
import { createEmptyBudget } from '../utils/budgetEngine.js'

export function useBudget() {
  const { 
    budgets, addBudget, updateBudget, removeBudget,
    saveBudgetVersion, budgetVersions,
   } = useStore(useShallow(s => ({ budgets: s.budgets, addBudget: s.addBudget, updateBudget: s.updateBudget, removeBudget: s.removeBudget, saveBudgetVersion: s.saveBudgetVersion, budgetVersions: s.budgetVersions })))

  const [activeBudgetId, setActiveBudgetId] = useState(budgets[0]?.id || null)

  const activeBudget = budgets.find(b => b.id === activeBudgetId) || null
  const activeVersions = activeBudgetId ? (budgetVersions?.[activeBudgetId] || []) : []

  const createBudget = () => {
    const b = createEmptyBudget()
    addBudget(b)
    setActiveBudgetId(b.id)
    return b
  }

  const updateHeader = (patch) => {
    if (!activeBudgetId || !activeBudget) return
    updateBudget(activeBudgetId, { header: { ...activeBudget.header, ...patch } })
  }

  const addLine = (line) => {
    if (!activeBudgetId || !activeBudget) return
    const newLine = {
      id: nanoid(),
      isFixed: false,
      fixedField: null,
      executado: 0,
      origem: 'manual',
      ...line,
    }
    updateBudget(activeBudgetId, { lines: [...activeBudget.lines, newLine] })
  }

  const addLines = (lines) => {
    if (!activeBudgetId || !activeBudget) return
    const newLines = lines.map(line => ({
      id: nanoid(),
      isFixed: false,
      fixedField: null,
      executado: 0,
      origem: 'manual',
      ...line,
    }))
    updateBudget(activeBudgetId, { lines: [...activeBudget.lines, ...newLines] })
  }

  const updateLine = (lineId, patch) => {
    if (!activeBudgetId || !activeBudget) return
    updateBudget(activeBudgetId, {
      lines: activeBudget.lines.map(l => l.id === lineId ? { ...l, ...patch } : l),
    })
  }

  const removeLine = (lineId) => {
    if (!activeBudgetId || !activeBudget) return
    updateBudget(activeBudgetId, {
      lines: activeBudget.lines.filter(l => l.id !== lineId),
    })
  }

  const fixLine = (lineId, field) => updateLine(lineId, { isFixed: true, fixedField: field })
  const resetLine = (lineId) => updateLine(lineId, { isFixed: false, fixedField: null })

  const saveVersion = (label) => {
    if (!activeBudgetId) return
    saveBudgetVersion(activeBudgetId, label)
  }

  const setMode = (mode) => {
    if (!activeBudgetId) return
    updateBudget(activeBudgetId, { mode })
  }

  const updateBudgetField = (patch) => {
    if (!activeBudgetId) return
    updateBudget(activeBudgetId, patch)
  }

  // ── Financiamento ─────────────────────────────────────────────
  const addFinancing = (item) => {
    if (!activeBudgetId || !activeBudget) return
    updateBudget(activeBudgetId, {
      financing: [...(activeBudget.financing || []), { id: nanoid(), confirmado: false, ...item }],
    })
  }

  const updateFinancing = (id, patch) => {
    if (!activeBudgetId || !activeBudget) return
    updateBudget(activeBudgetId, {
      financing: (activeBudget.financing || []).map(f => f.id === id ? { ...f, ...patch } : f),
    })
  }

  const removeFinancing = (id) => {
    if (!activeBudgetId || !activeBudget) return
    updateBudget(activeBudgetId, {
      financing: (activeBudget.financing || []).filter(f => f.id !== id),
    })
  }

  // ── Despesas ─────────────────────────────────────────────────
  const addExpense = (exp) => {
    if (!activeBudgetId || !activeBudget) return
    updateBudget(activeBudgetId, {
      expenses: [...(activeBudget.expenses || []), { id: nanoid(), origem: 'manual', estado: 'pendente', ...exp }],
    })
  }

  const updateExpense = (id, patch) => {
    if (!activeBudgetId || !activeBudget) return
    updateBudget(activeBudgetId, {
      expenses: (activeBudget.expenses || []).map(e => e.id === id ? { ...e, ...patch } : e),
    })
  }

  const removeExpense = (id) => {
    if (!activeBudgetId || !activeBudget) return
    updateBudget(activeBudgetId, {
      expenses: (activeBudget.expenses || []).filter(e => e.id !== id),
    })
  }

  return {
    budgets,
    activeBudget,
    activeVersions,
    activeBudgetId,
    setActiveBudgetId,
    createBudget,
    updateHeader,
    addLine,
    addLines,
    updateLine,
    removeLine,
    fixLine,
    resetLine,
    saveVersion,
    setMode,
    updateBudgetField,
    removeBudget,
    // Financiamento
    addFinancing,
    updateFinancing,
    removeFinancing,
    // Despesas
    addExpense,
    updateExpense,
    removeExpense,
  }
}
