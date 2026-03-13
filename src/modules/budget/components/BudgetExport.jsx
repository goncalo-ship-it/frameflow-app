// Exportação do orçamento para PDF via impressão do browser
import { useState } from 'react'
import { Printer, FileDown, ChevronDown } from 'lucide-react'
import { fmt } from '../utils/moneyUtils.js'
import styles from '../Budget.module.css'

function PrintableInternal({ budget, calc }) {
  if (!budget || !calc) return null
  const { categorySummary, subtotal, honorarios, totalVenda, totalIva: iva, totalComIva, margem, margemPct } = calc
  const h = budget.header || {}

  return (
    <div id="print-internal" style={{ display: 'none' }}>
      <div className="print-header">
        <h1>Orçamento Discriminado — {budget.numero}</h1>
        <p>{h.campanha || ''} · {h.cliente || ''}</p>
        <p>Data: {h.data || ''} · Rodagem: {h.diasRodagem || 0} dia(s) · Local: {h.local || ''}</p>
      </div>
    </div>
  )
}

export function BudgetExport({ budget, calc }) {
  const [open, setOpen] = useState(false)

  const printMode = (mode) => {
    document.body.setAttribute('data-print-mode', mode)
    window.print()
    setTimeout(() => document.body.removeAttribute('data-print-mode'), 1000)
    setOpen(false)
  }

  return (
    <div className={styles.exportWrapper}>
      <button
        className={styles.btnExport}
        onClick={() => setOpen(v => !v)}
      >
        <Printer size={13} />
        Exportar
        <ChevronDown size={11} style={{ marginLeft: 2 }} />
      </button>

      {open && (
        <>
          <div className={styles.exportBackdrop} onClick={() => setOpen(false)} />
          <div className={styles.exportDropdown}>
            <button
              className={styles.exportOption}
              onClick={() => printMode('internal')}
            >
              <FileDown size={13} />
              <div>
                <div className={styles.exportOptionTitle}>PDF Interno</div>
                <div className={styles.exportOptionDesc}>Com custos reais, markup e margens</div>
              </div>
            </button>
            <button
              className={styles.exportOption}
              onClick={() => printMode('client')}
            >
              <Printer size={13} />
              <div>
                <div className={styles.exportOptionTitle}>PDF Cliente</div>
                <div className={styles.exportOptionDesc}>Apenas totais por categoria, sem margens</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
