// Parser de Financiamento Excel → budget.financing[]
// Lê ficheiros como RTP_FINANC.xlsx e extrai fontes de financiamento

import { getXLSX } from '../core/xlsx-loader.js'
import { toCents, nanoid } from '../modules/budget/utils/moneyUtils.js'

/**
 * Parsa um ArrayBuffer de Excel de financiamento e devolve um array de financing entries
 * compatível com budget.financing[]
 */
export async function parseFinancingExcel(arrayBuffer, filename = '') {
  const XLSX = await getXLSX()
  const wb = XLSX.read(arrayBuffer, { type: 'array' })

  const results = []

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    // Procurar padrões conhecidos: fonte, tipo, valor, status
    let fonte = ''
    let tipo = 'cash'
    let status = false
    let totalGeral = 0
    const lineItems = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const cells = row.map(c => String(c).trim())
      const joined = cells.join(' ').toUpperCase()

      // Detectar fonte (RTP, SIC, TVI, ICA, etc.)
      if (/\b(RTP|SIC|TVI|ICA|CANAL|PORTUGAL|FINANC)/i.test(joined) && !fonte) {
        const match = joined.match(/\b(RTP|SIC|TVI|ICA|CANAL\s*\d*)\b/i)
        if (match) fonte = match[1].toUpperCase()
      }

      // Detectar tipo (NUMERÁRIO = cash, GÉNEROS = inkind)
      if (/NUMER[AÁ]RIO|CASH/i.test(joined)) tipo = 'cash'
      if (/G[EÉ]NEROS|IN.?KIND/i.test(joined)) tipo = 'generos'

      // Detectar status (APROVADO/PENDENTE)
      if (/APROVAD[OA]/i.test(joined)) status = true

      // Procurar linhas com valores numéricos (orçamento por episódio ou total)
      for (let j = 0; j < cells.length; j++) {
        const val = parseFloat(String(cells[j]).replace(/[€\s]/g, '').replace(',', '.'))
        if (!isNaN(val) && val > 100) {
          // Verificar se é total geral ou sub-item
          const label = cells.slice(0, j).filter(Boolean).join(' ') || `${sheetName}`
          const isTotal = /TOTAL|GLOBAL|GERAL/i.test(label)
          if (isTotal && val > totalGeral) {
            totalGeral = val
          } else if (!isTotal) {
            lineItems.push({ label, value: val })
          }
        }
      }
    }

    // Se encontrámos um total mas nenhum line item, usar o total como entrada única
    if (totalGeral > 0 && lineItems.length === 0) {
      results.push({
        id: nanoid(),
        nome: fonte || filename.replace(/\.[^.]+$/, ''),
        tipo,
        valor: toCents(totalGeral),
        descricao: `Importado de ${filename}`,
        confirmado: status,
        dataPrevista: '',
      })
    } else if (lineItems.length > 0) {
      // Se temos line items, criar uma entrada com o total
      const sum = totalGeral || lineItems.reduce((a, b) => a + b.value, 0)
      results.push({
        id: nanoid(),
        nome: fonte || filename.replace(/\.[^.]+$/, ''),
        tipo,
        valor: toCents(sum),
        descricao: lineItems.map(l => `${l.label}: €${l.value.toLocaleString('pt-PT')}`).join('; '),
        confirmado: status,
        dataPrevista: '',
      })
    }
  }

  return results
}
