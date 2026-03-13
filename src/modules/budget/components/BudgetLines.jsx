// Tabela discriminada — linhas agrupadas por categoria
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ChevronDown, ChevronRight, Eye, EyeOff,
  FileDown, Printer, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { BudgetLine } from './BudgetLine.jsx'
import { CATEGORIAS } from '../utils/marketData.js'
import { fmt, toCents, nanoid } from '../utils/moneyUtils.js'
import { calcLineTotal } from '../utils/formulae.js'
import styles from '../Budget.module.css'

function AddLineForm({ categoria, onAdd, onCancel }) {
  const [form, setForm] = useState({
    descricao: '', fornecedor: '',
    valorUnitario: '', quantidade: 1, dias: 1, custoReal: '',
  })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAdd = () => {
    if (!form.descricao.trim()) return
    const valorUnitario = toCents(Number(form.valorUnitario) || 0)
    const quantidade = Number(form.quantidade) || 1
    const dias = Number(form.dias) || 1
    const custoReal = toCents(Number(form.custoReal) || 0)
    const markup = custoReal > 0
      ? calcLineTotal(valorUnitario, quantidade, dias) / custoReal
      : 1.35
    onAdd({
      id: nanoid(),
      categoria,
      descricao: form.descricao.trim(),
      fornecedor: form.fornecedor,
      valorUnitario,
      quantidade,
      dias,
      custoReal,
      markup,
      isFixed: false, fixedField: null,
      origem: 'manual', executado: 0,
    })
  }

  return (
    <motion.div
      className={styles.addLineForm}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <div className={styles.addLineRow}>
        <input
          className={styles.lineInput}
          value={form.descricao}
          onChange={e => f('descricao', e.target.value)}
          placeholder="Descrição *"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onCancel() }}
          style={{ flex: 2 }}
        />
        <input
          className={styles.lineInput}
          value={form.fornecedor}
          onChange={e => f('fornecedor', e.target.value)}
          placeholder="Fornecedor"
          style={{ flex: 1 }}
        />
        <input
          className={styles.lineInputNum}
          type="number"
          value={form.valorUnitario}
          onChange={e => f('valorUnitario', e.target.value)}
          placeholder="Val. Unit. €"
        />
        <input
          className={styles.lineInputSm}
          type="number"
          value={form.quantidade}
          onChange={e => f('quantidade', e.target.value)}
          placeholder="Qtd"
          min="1"
        />
        <input
          className={styles.lineInputSm}
          type="number"
          value={form.dias}
          onChange={e => f('dias', e.target.value)}
          placeholder="Dias"
          min="1"
        />
        <input
          className={styles.lineInputNum}
          type="number"
          value={form.custoReal}
          onChange={e => f('custoReal', e.target.value)}
          placeholder="Custo Real €"
        />
      </div>
      <div className={styles.lineEditBtns}>
        <button className={styles.btnCancel} onClick={onCancel}>Cancelar</button>
        <button className={styles.btnConfirm} onClick={handleAdd} disabled={!form.descricao.trim()}>
          <Plus size={12} /> Adicionar
        </button>
      </div>
    </motion.div>
  )
}

function CategoryGroup({ cat, lines, lineCalcs, onAddLine, onUpdateLine, onRemoveLine, onFixLine, onResetLine, catTotal, showInternal, defaultOpen = false, generosCoverage = 0 }) {
  const [open, setOpen] = useState(defaultOpen)
  const [adding, setAdding] = useState(false)

  // Pre-build Map to avoid O(n²) .find() per line
  const lineCalcMap = useMemo(() => {
    const map = new Map()
    for (const c of (lineCalcs || [])) map.set(c.id, c)
    return map
  }, [lineCalcs])

  const catLines = lines.filter(l => l.categoria === cat.id)

  return (
    <div className={styles.catGroup}>
      <div className={styles.catGroupHeader} onClick={() => setOpen(v => !v)}>
        <button className={styles.catGroupToggle}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <span className={styles.catGroupNum}>{String(cat.id).padStart(2, '0')}</span>
        <span className={styles.catGroupLabel}>{cat.label}</span>
        <span className={styles.catGroupCount}>{catLines.length > 0 ? `${catLines.length} linha${catLines.length !== 1 ? 's' : ''}` : ''}</span>
        {generosCoverage > 0 && (
          <span className={styles.catGroupGeneros} title="Coberto por géneros">
            -{fmt(generosCoverage)} gén.
          </span>
        )}
        <span className={styles.catGroupTotal}>{catTotal > 0 ? fmt(catTotal) : ''}</span>
        <button
          className={styles.catGroupAddBtn}
          onClick={e => { e.stopPropagation(); setOpen(true); setAdding(v => !v) }}
          title="Adicionar linha"
        >
          <Plus size={12} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            {catLines.length > 0 && (
              <div className={styles.linesTableHeader}>
                <span className={styles.thDesc}>Descrição</span>
                <span className={styles.thCell}>Val. Unit.</span>
                <span className={styles.thSm}>Nº</span>
                <span className={styles.thSm}>Dias</span>
                <span className={styles.thCell}>Total</span>
                {showInternal && (
                  <>
                    <span className={styles.thCell}>Custo Real</span>
                    <span className={styles.thCell}>Markup</span>
                    <span className={styles.thCell}>Margem</span>
                  </>
                )}
                <span className={styles.thActions} />
              </div>
            )}

            <AnimatePresence>
              {catLines.map(line => {
                const calc = lineCalcMap.get(line.id)
                return (
                  <BudgetLine
                    key={line.id}
                    line={line}
                    calc={calc}
                    showInternal={showInternal}
                    onUpdate={(patch) => onUpdateLine(line.id, patch)}
                    onRemove={onRemoveLine}
                    onFix={onFixLine}
                    onReset={onResetLine}
                  />
                )
              })}
            </AnimatePresence>

            <AnimatePresence>
              {adding && (
                <AddLineForm
                  categoria={cat.id}
                  onAdd={(line) => { onAddLine(line); setAdding(false) }}
                  onCancel={() => setAdding(false)}
                />
              )}
            </AnimatePresence>

            {catLines.length === 0 && !adding && (
              <div className={styles.catGroupEmpty}>
                <button className={styles.catGroupEmptyBtn} onClick={() => setAdding(true)}>
                  <Plus size={12} /> Adicionar linha a {cat.label}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Tabela de Valores por Equipa ─────────────────────────────────────
function RateTable({ budget, calc }) {
  if (!budget || !calc) return null
  const lines = budget.lines || []

  // Group team-related lines (cats 2=Elenco, 3=Equipa Técnica)
  const teamCats = [
    { id: 2, label: 'Elenco' },
    { id: 3, label: 'Equipa Técnica' },
  ]

  const allTeamLines = teamCats.flatMap(cat => {
    const catLines = lines.filter(l => l.categoria === cat.id)
    return catLines.map(l => {
      const total = calcLineTotal(l.valorUnitario, l.quantidade, l.dias)
      return { ...l, catLabel: cat.label, total }
    })
  })

  if (allTeamLines.length === 0) {
    return (
      <div className={styles.rateTableEmpty}>
        Sem linhas de elenco ou equipa no orçamento.
      </div>
    )
  }

  return (
    <div className={styles.rateTableRoot}>
      <table className={styles.rateTable}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Função</th>
            <th>Categoria</th>
            <th>Val. Unit.</th>
            <th>Nº</th>
            <th>Dias</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {allTeamLines.map(l => (
            <tr key={l.id}>
              <td className={styles.rtName}>{l.descricao}</td>
              <td className={styles.rtCat}>{l.catLabel}</td>
              <td className={styles.rtVal}>{fmt(l.valorUnitario)}</td>
              <td className={styles.rtCenter}>{l.quantidade}</td>
              <td className={styles.rtCenter}>{l.dias}</td>
              <td className={styles.rtTotal}>{fmt(l.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className={styles.rtFootLabel}>Total Equipa + Elenco</td>
            <td className={styles.rtFootTotal}>
              {fmt(allTeamLines.reduce((s, l) => s + l.total, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export function BudgetLines({ budget, calc, onAddLine, onUpdateLine, onRemoveLine, onFixLine, onResetLine, onUpdateBudgetField }) {
  const [showInternal, setShowInternal] = useState(false)
  const [showRateTable, setShowRateTable] = useState(false)

  if (!budget) return null

  const hasLines = (budget.lines || []).length > 0
  const taxaH = budget.taxaHonorarios ?? 0.15
  const honorariosEnabled = taxaH > 0

  const toggleHonorarios = () => {
    if (!onUpdateBudgetField) return
    onUpdateBudgetField({ taxaHonorarios: honorariosEnabled ? 0 : 0.15 })
  }

  const setHonorariosPct = (pct) => {
    if (!onUpdateBudgetField) return
    const val = Math.max(0, Math.min(100, Number(pct) || 0)) / 100
    onUpdateBudgetField({ taxaHonorarios: val })
  }

  const handlePrint = (mode) => {
    document.body.setAttribute('data-print-mode', mode)
    window.print()
    setTimeout(() => document.body.removeAttribute('data-print-mode'), 1000)
  }

  // Non-empty categories only (for cleaner view)
  const catsWithLines = CATEGORIAS.filter(c => c.id !== 13)
  const nonEmptyCats = catsWithLines.filter(c => (budget.lines || []).some(l => l.categoria === c.id))
  const emptyCats = catsWithLines.filter(c => !(budget.lines || []).some(l => l.categoria === c.id))

  return (
    <div className={styles.budgetLinesRoot}>
      {/* ── Toolbar ── */}
      <div className={styles.linesToolbar}>
        <div className={styles.linesToolbarLeft}>
          <button
            className={`${styles.toolbarBtn} ${showInternal ? styles.toolbarBtnActive : ''}`}
            onClick={() => setShowInternal(v => !v)}
            title={showInternal ? 'Esconder custos internos' : 'Mostrar custos internos'}
          >
            {showInternal ? <EyeOff size={13} /> : <Eye size={13} />}
            {showInternal ? 'Esconder custos' : 'Custos internos'}
          </button>
          <button
            className={`${styles.toolbarBtn} ${showRateTable ? styles.toolbarBtnActive : ''}`}
            onClick={() => setShowRateTable(v => !v)}
          >
            Tabela de Valores
          </button>
        </div>
        <div className={styles.linesToolbarRight}>
          <button className={styles.toolbarBtn} onClick={() => handlePrint('client')}>
            <Printer size={13} /> PDF Cliente
          </button>
          <button className={styles.toolbarBtn} onClick={() => handlePrint('internal')}>
            <FileDown size={13} /> PDF Interno
          </button>
        </div>
      </div>

      {/* ── Rate Table ── */}
      <AnimatePresence>
        {showRateTable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <RateTable budget={budget} calc={calc} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Categories with lines ── */}
      {nonEmptyCats.map(cat => {
        const catData = calc?.categorySummary?.find(cs => cs.id === cat.id)
        return (
          <CategoryGroup
            key={cat.id}
            cat={cat}
            lines={budget.lines || []}
            lineCalcs={calc?.lineCalcs || []}
            catTotal={catData?.total || 0}
            showInternal={showInternal}
            generosCoverage={0}
            onAddLine={onAddLine}
            onUpdateLine={onUpdateLine}
            onRemoveLine={onRemoveLine}
            onFixLine={onFixLine}
            onResetLine={onResetLine}
          />
        )
      })}

      {/* ── Empty categories (collapsed) ── */}
      {emptyCats.length > 0 && (
        <EmptyCategories
          cats={emptyCats}
          onAddLine={onAddLine}
        />
      )}

      {/* ── Totais ── */}
      {calc && hasLines && (
        <div className={styles.budgetTotalsFooter}>
          {/* Subtotal */}
          <div className={styles.totalRowBold}>
            <span className={styles.totalLabel}>Subtotal (Categorias 1–12)</span>
            <span className={styles.totalValue}>{fmt(calc.subtotal)}</span>
          </div>

          {/* Honorários toggle */}
          <div className={styles.honorariosRow}>
            <div className={styles.honorariosLeft}>
              <button
                className={styles.honorariosToggle}
                onClick={toggleHonorarios}
                title={honorariosEnabled ? 'Desactivar honorários' : 'Activar honorários'}
              >
                {honorariosEnabled
                  ? <ToggleRight size={18} style={{ color: 'var(--accent)' }} />
                  : <ToggleLeft size={18} style={{ color: 'var(--text-muted)' }} />
                }
              </button>
              <span className={styles.totalLabel} style={{ opacity: honorariosEnabled ? 1 : 0.5 }}>
                Honorários Produtora
              </span>
              {honorariosEnabled && (
                <span className={styles.honorariosPctWrap}>
                  <input
                    className={styles.honorariosPctInput}
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(taxaH * 100)}
                    onChange={e => setHonorariosPct(e.target.value)}
                  />
                  <span className={styles.honorariosPctLabel}>%</span>
                </span>
              )}
            </div>
            <span className={styles.totalValue} style={{ opacity: honorariosEnabled ? 1 : 0.4 }}>
              {honorariosEnabled ? fmt(calc.honorarios) : '—'}
            </span>
          </div>

          {/* ── BLOCO TOTAL s/ IVA ── */}
          <div className={styles.totalRowHighlight}>
            <span className={styles.totalLabel}>Total s/ IVA</span>
            <span className={styles.totalValueLg}>{fmt(calc.totalVenda)}</span>
          </div>

          {/* IVA breakdown */}
          <div className={styles.ivaSection}>
            {(calc.ivaBreakdown || []).map(g => (
              <div key={g.taxa} className={styles.totalRow}>
                <span className={styles.totalLabel}>
                  IVA {Math.round(g.taxa * 100)}%
                  <span className={styles.ivaBase}> (sobre {fmt(g.base)})</span>
                </span>
                <span className={styles.totalValue}>{fmt(g.iva)}</span>
              </div>
            ))}
            {(calc.ivaBreakdown || []).length > 1 && (
              <div className={styles.totalRowBold} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <span className={styles.totalLabel}>Total IVA</span>
                <span className={styles.totalValue}>{fmt(calc.totalIva)}</span>
              </div>
            )}
          </div>

          {/* ── GRANDE TOTAL c/ IVA ── */}
          <div className={styles.totalRowGrand}>
            <span className={styles.totalLabel}>Total c/ IVA</span>
            <span className={styles.totalValue}>{fmt(calc.totalComIva)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Categorias vazias colapsadas ─────────────────────────────────────
function EmptyCategories({ cats, onAddLine }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={styles.emptyCatsSection}>
      <button
        className={styles.emptyCatsToggle}
        onClick={() => setExpanded(v => !v)}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {cats.length} categoria{cats.length !== 1 ? 's' : ''} sem linhas
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            {cats.map(cat => (
              <CategoryGroup
                key={cat.id}
                cat={cat}
                lines={[]}
                lineCalcs={[]}
                catTotal={0}
                showInternal={false}
                onAddLine={onAddLine}
                onUpdateLine={() => {}}
                onRemoveLine={() => {}}
                onFixLine={() => {}}
                onResetLine={() => {}}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
