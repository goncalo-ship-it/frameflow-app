// Resumo por categoria — vista consolidada com pesquisa, collapse e export
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, Search, X, ChevronDown, ChevronRight,
  Printer, FileDown,
} from 'lucide-react'
import { CATEGORIAS } from '../utils/marketData.js'
import { fmt } from '../utils/moneyUtils.js'
import { calcLineTotal } from '../utils/formulae.js'
import styles from '../Budget.module.css'

export function BudgetSummary({ calc, budget }) {
  const [showInternal, setShowInternal] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedCats, setExpandedCats] = useState({})

  if (!calc || !budget) return null

  const {
    categorySummary,
    subtotal, honorarios, totalVenda,
    ivaBreakdown, totalIva, totalComIva,
    margem, margemPct,
  } = calc

  const lines = budget.lines || []
  const taxaH = budget.taxaHonorarios ?? 0.15
  const q = search.toLowerCase().trim()

  // Filter lines by search
  const filteredLines = useMemo(() => {
    if (!q) return lines
    return lines.filter(l =>
      (l.descricao || '').toLowerCase().includes(q) ||
      (l.fornecedor || '').toLowerCase().includes(q)
    )
  }, [lines, q])

  // Categories with their filtered lines
  const catsWithData = useMemo(() => {
    return categorySummary
      .filter(cat => cat.id !== 13)
      .map(cat => {
        const catLines = filteredLines.filter(l => l.categoria === cat.id)
        const filteredTotal = catLines.reduce((s, l) => s + calcLineTotal(l.valorUnitario, l.quantidade, l.dias), 0)
        return { ...cat, lines: catLines, filteredTotal }
      })
      .filter(cat => !q || cat.lines.length > 0) // hide empty categories when searching
  }, [categorySummary, filteredLines, q])

  const toggleCat = (id) => setExpandedCats(p => ({ ...p, [id]: !p[id] }))
  const allExpanded = catsWithData.every(c => expandedCats[c.id])
  const toggleAll = () => {
    const next = !allExpanded
    const map = {}
    catsWithData.forEach(c => { map[c.id] = next })
    setExpandedCats(map)
  }

  const handlePrint = (mode) => {
    document.body.setAttribute('data-print-mode', mode)
    window.print()
    setTimeout(() => document.body.removeAttribute('data-print-mode'), 1000)
  }

  const filteredSubtotal = q
    ? filteredLines.reduce((s, l) => s + calcLineTotal(l.valorUnitario, l.quantidade, l.dias), 0)
    : subtotal

  return (
    <div className={styles.summaryRoot}>
      {/* ── Header toolbar ── */}
      <div className={styles.summaryHeaderRow}>
        <h3 className={styles.summaryTitle}>Resumo Consolidado</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className={styles.toggleInternalBtn} onClick={() => setShowInternal(v => !v)}>
            {showInternal ? <EyeOff size={13} /> : <Eye size={13} />}
            {showInternal ? 'Esconder custos' : 'Custos internos'}
          </button>
          <button className={styles.toggleInternalBtn} onClick={() => handlePrint('client')}>
            <Printer size={13} /> PDF
          </button>
          <button className={styles.toggleInternalBtn} onClick={() => handlePrint('internal')}>
            <FileDown size={13} /> PDF Interno
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className={styles.summarySearchWrap}>
        <Search size={14} className={styles.summarySearchIcon} />
        <input
          className={styles.summarySearchInput}
          placeholder="Pesquisar linhas… (descrição, fornecedor)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.summarySearchClear} onClick={() => setSearch('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Expand/Collapse all ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className={styles.summaryToggleAll} onClick={toggleAll}>
          {allExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {allExpanded ? 'Fechar todas' : 'Expandir todas'}
        </button>
        {q && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {filteredLines.length} resultado{filteredLines.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Category table ── */}
      <div className={styles.summaryTable}>
        {/* Header */}
        <div className={styles.summaryTableHeader}>
          <span className={styles.summaryTh} style={{ flex: 1, textAlign: 'left' }}>Categoria</span>
          <span className={styles.summaryTh}>Total s/ IVA</span>
          {showInternal && (
            <>
              <span className={styles.summaryTh}>Custo Real</span>
              <span className={styles.summaryTh}>Margem</span>
              <span className={styles.summaryTh} style={{ width: 60 }}>%</span>
            </>
          )}
        </div>

        {/* Categories */}
        {catsWithData.map(cat => {
          const isOpen = expandedCats[cat.id]
          const displayTotal = q ? cat.filteredTotal : cat.total
          const isEmpty = displayTotal === 0

          return (
            <div key={cat.id}>
              <div
                className={`${styles.summaryRow} ${isEmpty ? styles.summaryRowEmpty : ''}`}
                onClick={() => cat.lines.length > 0 && toggleCat(cat.id)}
                style={{ cursor: cat.lines.length > 0 ? 'pointer' : 'default' }}
              >
                {cat.lines.length > 0 && (
                  <span className={styles.summaryRowChevron}>
                    {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  </span>
                )}
                <span className={styles.summaryRowNum}>{String(cat.id).padStart(2, '0')}</span>
                <span className={styles.summaryRowLabel} style={{ flex: 1 }}>{cat.label}</span>
                <span className={styles.summaryRowValue}>{displayTotal > 0 ? fmt(displayTotal) : '—'}</span>
                {showInternal && (
                  <>
                    <span className={`${styles.summaryRowValue} ${styles.summaryRowMuted}`}>
                      {cat.custo > 0 ? fmt(cat.custo) : '—'}
                    </span>
                    <span className={`${styles.summaryRowValue} ${cat.margem > 0 ? styles.summaryRowGreen : ''}`}>
                      {cat.total > 0 ? fmt(cat.margem) : '—'}
                    </span>
                    <span className={`${styles.summaryRowPct} ${cat.margemPct > 0 ? styles.summaryRowGreen : ''}`}>
                      {cat.total > 0 ? `${cat.margemPct.toFixed(1)}%` : '—'}
                    </span>
                  </>
                )}
              </div>

              {/* Expanded lines */}
              <AnimatePresence>
                {isOpen && cat.lines.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    {cat.lines.map(l => {
                      const lineTotal = calcLineTotal(l.valorUnitario, l.quantidade, l.dias)
                      return (
                        <div key={l.id} className={styles.summaryLineRow}>
                          <span className={styles.summaryLineDesc}>
                            {l.descricao}
                            {l.fornecedor && <span className={styles.summaryLineForn}> — {l.fornecedor}</span>}
                          </span>
                          <span className={styles.summaryLineDetail}>
                            {fmt(l.valorUnitario)} × {l.quantidade || 1} × {l.dias || 1}d
                          </span>
                          <span className={styles.summaryLineTotal}>{fmt(lineTotal)}</span>
                          {showInternal && (
                            <>
                              <span className={styles.summaryLineMuted}>{fmt(l.custoReal || 0)}</span>
                              <span className={styles.summaryLineMuted}>{fmt(lineTotal - (l.custoReal || 0))}</span>
                              <span className={styles.summaryLinePct}>
                                {(l.custoReal || 0) > 0 ? `${(((lineTotal - l.custoReal) / lineTotal) * 100).toFixed(0)}%` : '—'}
                              </span>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* ── Totais ── */}
      <div className={styles.summaryTotals}>
        <div className={styles.summaryTotalRow}>
          <span>Subtotal</span>
          <span className={styles.summaryTotalValue}>{fmt(filteredSubtotal)}</span>
        </div>

        {taxaH > 0 && (
          <div className={styles.summaryTotalRow}>
            <span>Honorários Produtora ({Math.round(taxaH * 100)}%)</span>
            <span className={styles.summaryTotalValue}>{fmt(honorarios)}</span>
          </div>
        )}

        {/* Total s/ IVA — destaque */}
        <div className={`${styles.summaryTotalRow} ${styles.summaryTotalRowBold}`}>
          <span>Total s/ IVA</span>
          <span className={styles.summaryTotalValueLg}>{fmt(totalVenda)}</span>
        </div>

        {/* IVA por taxa */}
        {(ivaBreakdown || []).map(g => (
          <div key={g.taxa} className={styles.summaryTotalRow}>
            <span className={styles.ivaBreakdownLabel}>
              IVA {Math.round(g.taxa * 100)}%
              <span className={styles.ivaBreakdownBase}> (sobre {fmt(g.base)})</span>
            </span>
            <span className={styles.summaryTotalValue}>{fmt(g.iva)}</span>
          </div>
        ))}
        {(ivaBreakdown || []).length > 1 && (
          <div className={styles.summaryTotalRow} style={{ fontWeight: 600 }}>
            <span>Total IVA</span>
            <span className={styles.summaryTotalValue}>{fmt(totalIva)}</span>
          </div>
        )}

        {/* TOTAL c/ IVA */}
        <div className={`${styles.summaryTotalRow} ${styles.summaryTotalRowFinal}`}>
          <span>Total c/ IVA</span>
          <span className={styles.summaryTotalValueXl}>{fmt(totalComIva)}</span>
        </div>

        {showInternal && margem !== undefined && (
          <div className={`${styles.summaryTotalRow} ${styles.summaryTotalRowMargem}`}>
            <span>Margem Global</span>
            <span className={margem >= 0 ? styles.summaryGreen : styles.summaryRed}>
              {fmt(margem)} ({margemPct.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
