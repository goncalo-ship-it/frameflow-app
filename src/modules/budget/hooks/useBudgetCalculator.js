import { useMemo } from 'react'
import { CATEGORIAS } from '../utils/marketData.js'
import {
  calcLineTotal,
  calcCategoryTotal,
  calcCategoryCusto,
  calcSubtotal,
  calcHonorarios,
  calcIvaBreakdown,
  calcMargemGlobal,
  calcDesvio,
  calcDesvioPct,
  semaforoDesvio,
} from '../utils/formulae.js'

export function useBudgetCalculator(budget) {
  return useMemo(() => {
    if (!budget) return null
    const { lines = [], taxaHonorarios = 0.15 } = budget

    const subtotal = calcSubtotal(lines)
    const honorarios = calcHonorarios(subtotal, taxaHonorarios)
    const totalVenda = subtotal + honorarios

    const { breakdown: ivaBreakdown, totalIva, totalBase } = calcIvaBreakdown(lines, taxaHonorarios)
    const totalComIva = totalVenda + totalIva

    const { margem, pct: margemPct } = calcMargemGlobal(lines, taxaHonorarios)

    const categorySummary = CATEGORIAS.map(cat => {
      const total = cat.id === 13
        ? honorarios
        : calcCategoryTotal(lines, cat.id)
      const custo = cat.id === 13 ? 0 : calcCategoryCusto(lines, cat.id)
      const catMargem = total - custo
      const catMargemPct = total > 0 ? (catMargem / total) * 100 : 0
      return { ...cat, total, custo, margem: catMargem, margemPct: catMargemPct }
    })

    const totalExecutado = lines.reduce((s, l) => s + (l.executado || 0), 0)
    const desvioGlobal = calcDesvio(totalVenda, totalExecutado)
    const desvioPct = calcDesvioPct(totalVenda, totalExecutado)

    const fixedCount = lines.filter(l => l.isFixed).length

    const lineCalcs = lines.map(l => {
      const total = calcLineTotal(l.valorUnitario, l.quantidade, l.dias)
      const lineMargem = total - (l.custoReal || 0)
      const lineMarkup = (l.custoReal || 0) > 0 ? total / l.custoReal : (l.markup || 1.35)
      const desvio = calcDesvio(total, l.executado || 0)
      const devPct = calcDesvioPct(total, l.executado || 0)
      return {
        id: l.id,
        total,
        margem: lineMargem,
        markup: lineMarkup,
        desvio,
        desvioPct: devPct,
        semaforo: semaforoDesvio(devPct),
      }
    })

    // ── Financiamento ──────────────────────────────────────────
    const financing = budget.financing || []
    // Total inclui TODAS as fontes (confirmadas + pendentes)
    const totalCash = financing
      .filter(f => f.tipo === 'cash')
      .reduce((s, f) => s + (f.valor || 0), 0)
    const totalGeneros = financing
      .filter(f => f.tipo === 'generos')
      .reduce((s, f) => s + (f.valor || 0), 0)
    const totalFinanciamento = totalCash + totalGeneros

    // Apenas confirmado (para decomposição e alertas)
    const confirmedCash = financing
      .filter(f => f.tipo === 'cash' && f.confirmado)
      .reduce((s, f) => s + (f.valor || 0), 0)
    const confirmedGeneros = financing
      .filter(f => f.tipo === 'generos' && f.confirmado)
      .reduce((s, f) => s + (f.valor || 0), 0)
    const confirmedTotal = confirmedCash + confirmedGeneros
    const pendingTotal = totalFinanciamento - confirmedTotal

    // Géneros por categoria — quanto cada categoria tem coberto (todas as fontes)
    const generosByCategory = {}
    financing
      .filter(f => f.tipo === 'generos' && f.categoriaAbate)
      .forEach(f => {
        generosByCategory[f.categoriaAbate] = (generosByCategory[f.categoriaAbate] || 0) + (f.valor || 0)
      })

    // Custo real de caixa por categoria (total - géneros que cobrem)
    const cashByCategory = {}
    categorySummary.forEach(cat => {
      const genCoverage = generosByCategory[cat.id] || 0
      cashByCategory[cat.id] = Math.max(0, cat.total - genCoverage)
    })

    // Necessidade de caixa = total s/IVA - cash confirmado
    const necessidadeCaixa = totalVenda - totalCash
    const gap = totalVenda - totalFinanciamento

    // ── Despesas (Folha de Caixa) ──────────────────────────────
    const expenses = budget.expenses || []
    const totalExpenses = expenses
      .filter(e => e.estado !== 'rejeitado')
      .reduce((s, e) => s + (e.valor || 0), 0)
    const expensesByCategory = {}
    expenses.filter(e => e.estado !== 'rejeitado').forEach(e => {
      expensesByCategory[e.categoria] = (expensesByCategory[e.categoria] || 0) + (e.valor || 0)
    })

    return {
      categorySummary,
      subtotal,
      honorarios,
      totalVenda,
      ivaBreakdown,
      totalIva,
      totalBase,
      totalComIva,
      margem,
      margemPct,
      totalExecutado,
      desvioGlobal,
      desvioPct,
      fixedCount,
      lineCalcs,
      // Financiamento
      totalCash,
      totalGeneros,
      totalFinanciamento,
      confirmedCash,
      confirmedGeneros,
      confirmedTotal,
      pendingTotal,
      generosByCategory,
      cashByCategory,
      necessidadeCaixa,
      gap,
      financing,
      // Despesas
      totalExpenses,
      expensesByCategory,
    }
  }, [budget])
}
