// Fórmulas puras — entradas/saídas em cêntimos (exceto indicado)

// ── Cálculos de linha ──────────────────────────────────────────────

export const calcLineTotal = (valorUnitario, quantidade, dias) =>
  Math.round((valorUnitario || 0) * (quantidade || 1) * (dias || 1))

export const calcLineCustoReal = (custoUnitario, quantidade, dias) =>
  Math.round((custoUnitario || 0) * (quantidade || 1) * (dias || 1))

export const calcMarkup = (total, custoReal) =>
  custoReal > 0 ? total / custoReal : 1.35

export const calcMargem = (total, custoReal) => total - custoReal

export const markupFromPct = (pct) => 1 / (1 - Math.min(pct, 0.99))

// valorUnitario a partir de custoUnitario e markup desejado
export const valorFromCusto = (custoUnitario, markup) =>
  Math.round((custoUnitario || 0) * (markup || 1))

// ── Agregações por categoria ───────────────────────────────────────

export const calcCategoryTotal = (lines, cat) =>
  (lines || []).filter(l => l.categoria === cat)
    .reduce((s, l) => s + calcLineTotal(l.valorUnitario, l.quantidade, l.dias), 0)

export const calcCategoryCusto = (lines, cat) =>
  (lines || []).filter(l => l.categoria === cat)
    .reduce((s, l) => s + (l.custoReal || 0), 0)

// ── Globais ────────────────────────────────────────────────────────

// Subtotal antes dos honorários (cats 1-12)
export const calcSubtotal = (lines) =>
  (lines || []).filter(l => l.categoria !== 13)
    .reduce((s, l) => s + calcLineTotal(l.valorUnitario, l.quantidade, l.dias), 0)

export const calcHonorarios = (subtotal, taxa) =>
  Math.round((subtotal || 0) * (taxa ?? 0.15))

export const calcTotalVenda = (lines, taxaHonorarios) => {
  const sub = calcSubtotal(lines)
  const hon = calcHonorarios(sub, taxaHonorarios)
  return sub + hon
}

// IVA por linha individual
export const calcIvaLinha = (totalLinha, taxaIva) =>
  Math.round((totalLinha || 0) * (taxaIva || 0.23))

// Breakdown global de IVA por taxa
export const calcIvaBreakdown = (lines, taxaHonorarios) => {
  const groups = {}
  ;(lines || []).filter(l => l.categoria !== 13).forEach(l => {
    const taxa = l.taxaIva || 0.23
    const total = calcLineTotal(l.valorUnitario, l.quantidade, l.dias)
    if (!groups[taxa]) groups[taxa] = 0
    groups[taxa] += total
  })
  // Honorários são sempre 23%
  const subtotal = calcSubtotal(lines)
  const hon = calcHonorarios(subtotal, taxaHonorarios)
  groups[0.23] = (groups[0.23] || 0) + hon

  const breakdown = Object.entries(groups)
    .map(([taxa, base]) => ({
      taxa: Number(taxa),
      base,
      iva: Math.round(base * Number(taxa)),
    }))
    .sort((a, b) => b.taxa - a.taxa)

  const totalIva = breakdown.reduce((s, g) => s + g.iva, 0)
  const totalBase = breakdown.reduce((s, g) => s + g.base, 0)
  return { breakdown, totalIva, totalBase }
}

// Mantido para compatibilidade
export const calcIva = (totalVenda, taxaIva) =>
  Math.round((totalVenda || 0) * (taxaIva || 0.23))

export const calcTotalComIva = (totalVenda, taxaIva) =>
  (totalVenda || 0) + calcIva(totalVenda, taxaIva)

export const calcMargemGlobal = (lines, taxaHonorarios) => {
  const total = calcTotalVenda(lines, taxaHonorarios)
  const custo = (lines || []).reduce((s, l) => s + (l.custoReal || 0), 0)
  return { margem: total - custo, pct: total > 0 ? ((total - custo) / total) * 100 : 0 }
}

// ── Desvio de execução ─────────────────────────────────────────────

export const calcDesvio = (orcamentado, executado) => (executado || 0) - (orcamentado || 0)
export const calcDesvioPct = (orcamentado, executado) =>
  orcamentado > 0 ? (((executado || 0) - orcamentado) / orcamentado) * 100 : 0
export const semaforoDesvio = (pct) =>
  Math.abs(pct) < 5 ? 'green' : Math.abs(pct) < 15 ? 'yellow' : 'red'
