// Motor de orçamento — lógica de negócio de alto nível

import { toCents, nanoid } from './moneyUtils.js'
import { calcLineTotal, calcHonorarios, calcSubtotal } from './formulae.js'
import { MARKUP_DEFAULTS, IVA_DEFAULT_POR_CATEGORIA } from './marketData.js'

// Criar um orçamento em branco com valores padrão
export const createEmptyBudget = () => ({
  id: nanoid(),
  numero: `${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
  mode: 'fiction',
  status: 'draft',
  createdAt: Date.now(),
  header: {
    data: new Date().toISOString().split('T')[0],
    cliente: '',
    campanha: 'Novo Orçamento',
    agencia: '',
    meiosEDireitos: '',
    tecnicaESuporte: 'Vídeo',
    quantidade: 1,
    duracao: '30"',
    descricao: '',
    diasReperage: 0,
    diasRodagem: 1,
    local: 'Lisboa',
    notasGerais: '',
  },
  ceiling: null,
  taxaIva: 0.23,
  taxaHonorarios: 0.15,
  lines: [],
  financing: [],
  expenses: [],
  constraints: [],
  notes: '',
})

// Criar uma linha em branco
export const createEmptyLine = (categoria = 3) => ({
  id: nanoid(),
  categoria,
  descricao: '',
  valorUnitario: 0,    // em cêntimos
  quantidade: 1,
  dias: 1,
  custoReal: 0,        // total custo (não unitário), em cêntimos
  markup: MARKUP_DEFAULTS.default,
  taxaIva: IVA_DEFAULT_POR_CATEGORIA[categoria] || 0.23,
  fornecedor: '',
  isFixed: false,
  fixedField: null,
  origem: 'manual',
  executado: 0,
})

// Calcular valorUnitario a partir de custoUnitario e markup
export const calcValorFromCusto = (custoUnitario, markup) =>
  Math.round(custoUnitario * (markup || MARKUP_DEFAULTS.default))

// Recalcular markup de uma linha após edição manual
export const recalcLineMarkup = (line) => {
  const total = calcLineTotal(line.valorUnitario, line.quantidade, line.dias)
  return line.custoReal > 0 ? total / line.custoReal : line.markup
}

// Aplicar ajuste proporcional ao tecto do cliente (modo publicidade)
export const applyClientCeiling = (lines, ceiling, taxaIva, taxaHonorarios) => {
  if (!ceiling || lines.length === 0) return lines
  const subtotal = calcSubtotal(lines)
  const hon = calcHonorarios(subtotal, taxaHonorarios)
  const totalComIva = (subtotal + hon) * (1 + taxaIva)
  if (totalComIva <= ceiling) return lines
  const ratio = ceiling / totalComIva
  return lines.map(l => ({
    ...l,
    valorUnitario: Math.round(l.valorUnitario * ratio),
    custoReal: Math.round(l.custoReal * ratio),
  }))
}

// Formatar número de orçamento
export const formatNumero = (num) => {
  if (!num) return ''
  return `Orç. ${num}`
}
