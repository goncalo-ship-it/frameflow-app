// Linha individual do orçamento discriminado
import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Lock, Unlock, Check, X, Edit2 } from 'lucide-react'
import { fmt, toCents, toEuros } from '../utils/moneyUtils.js'
import { calcLineTotal } from '../utils/formulae.js'
import { IVA_DEFAULT_POR_CATEGORIA } from '../utils/marketData.js'
import styles from '../Budget.module.css'

export const BudgetLine = memo(function BudgetLine({ line, calc, showInternal = true, onUpdate, onRemove, onFix, onReset }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  const startEdit = () => {
    setForm({
      descricao:      line.descricao,
      fornecedor:     line.fornecedor || '',
      valorUnitario:  toEuros(line.valorUnitario),
      quantidade:     line.quantidade || 1,
      dias:           line.dias || 1,
      custoReal:      toEuros(line.custoReal || 0),
      markup:         line.markup || 1.35,
      executado:      toEuros(line.executado || 0),
      taxaIva:        line.taxaIva ?? IVA_DEFAULT_POR_CATEGORIA[line.categoria] ?? 0.23,
    })
    setEditing(true)
  }

  const cancelEdit = () => {
    setForm(null)
    setEditing(false)
  }

  const saveEdit = () => {
    const valorUnitario = toCents(Number(form.valorUnitario) || 0)
    const custoReal = toCents(Number(form.custoReal) || 0)
    const quantidade = Number(form.quantidade) || 1
    const dias = Number(form.dias) || 1
    const markup = custoReal > 0
      ? calcLineTotal(valorUnitario, quantidade, dias) / custoReal
      : (Number(form.markup) || 1.35)
    onUpdate({
      descricao:     form.descricao,
      fornecedor:    form.fornecedor,
      valorUnitario,
      quantidade,
      dias,
      custoReal,
      markup,
      executado:     toCents(Number(form.executado) || 0),
      taxaIva:       Number(form.taxaIva) || 0.23,
    })
    setEditing(false)
    setForm(null)
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const total = calc?.total ?? calcLineTotal(line.valorUnitario, line.quantidade, line.dias)
  const margem = calc?.margem ?? (total - (line.custoReal || 0))
  const displayMarkup = calc?.markup ?? (line.custoReal > 0 ? total / line.custoReal : line.markup || 1.35)

  if (editing && form) {
    return (
      <motion.div className={`${styles.lineRow} ${styles.lineRowEditing}`} layout>
        <div className={styles.lineEditGrid}>
          <input
            className={styles.lineInput}
            value={form.descricao}
            onChange={e => f('descricao', e.target.value)}
            placeholder="Descrição *"
            autoFocus
            style={{ gridColumn: '1 / 3' }}
          />
          <input
            className={styles.lineInput}
            value={form.fornecedor}
            onChange={e => f('fornecedor', e.target.value)}
            placeholder="Fornecedor"
          />
          <input
            className={styles.lineInputNum}
            type="number"
            value={form.valorUnitario}
            onChange={e => f('valorUnitario', e.target.value)}
            placeholder="Val. Unit. €"
          />
          <input
            className={styles.lineInputNum}
            type="number"
            value={form.quantidade}
            onChange={e => f('quantidade', e.target.value)}
            placeholder="Qtd"
          />
          <input
            className={styles.lineInputNum}
            type="number"
            value={form.dias}
            onChange={e => f('dias', e.target.value)}
            placeholder="Dias"
          />
          <input
            className={styles.lineInputNum}
            type="number"
            value={form.custoReal}
            onChange={e => f('custoReal', e.target.value)}
            placeholder="Custo Total €"
          />
          <input
            className={styles.lineInputNum}
            type="number"
            value={form.executado}
            onChange={e => f('executado', e.target.value)}
            placeholder="Executado €"
          />
          <select
            className={styles.lineInput}
            value={form.taxaIva}
            onChange={e => f('taxaIva', Number(e.target.value))}
            title="Taxa IVA"
          >
            <option value={0.23}>IVA 23%</option>
            <option value={0.13}>IVA 13%</option>
            <option value={0.06}>IVA 6%</option>
          </select>
        </div>
        <div className={styles.lineEditBtns}>
          <button className={styles.btnCancel} onClick={cancelEdit}><X size={12} /> Cancelar</button>
          <button className={styles.btnConfirm} onClick={saveEdit} disabled={!form.descricao?.trim()}>
            <Check size={12} /> Guardar
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`${styles.lineRow} ${line.isFixed ? styles.lineRowFixed : ''}`}
      layout
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.lineDesc}>
        {line.isFixed && <Lock size={10} className={styles.lockIcon} />}
        <div className={styles.lineDescContent}>
          <span className={styles.lineDescText}>{line.descricao || '—'}</span>
          {line.fornecedor && <span className={styles.lineFornecedor}>{line.fornecedor}</span>}
        </div>
      </div>
      <span className={styles.lineCell}>{fmt(line.valorUnitario)}</span>
      <span className={styles.lineCellSm}>{line.quantidade || 1}</span>
      <span className={styles.lineCellSm}>{line.dias || 1}</span>
      <span className={`${styles.lineCell} ${styles.lineCellBold}`}>{fmt(total)}</span>
      {showInternal && (
        <>
          <span className={`${styles.lineCell} ${styles.lineCellMuted}`}>{fmt(line.custoReal || 0)}</span>
          <span className={`${styles.lineCell} ${styles.lineCellMuted}`}>{displayMarkup.toFixed(2)}×</span>
          <span className={`${styles.lineCell} ${margem >= 0 ? styles.lineCellGreen : styles.lineCellRed}`}>
            {fmt(margem)}
          </span>
        </>
      )}
      <div className={styles.lineActions}>
        <button className={styles.lineActionBtn} onClick={startEdit} title="Editar"><Edit2 size={11} /></button>
        {line.isFixed
          ? <button className={styles.lineActionBtn} onClick={() => onReset(line.id)} title="Libertar valor fixo" style={{ color: '#FBB92C' }}>
              <Unlock size={11} />
            </button>
          : <button className={styles.lineActionBtn} onClick={() => onFix(line.id, 'total')} title="Fixar valor">
              <Lock size={11} />
            </button>
        }
        <button
          className={styles.lineActionBtn}
          onClick={() => onRemove(line.id)}
          title="Eliminar linha"
          style={{ color: '#F87171' }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  )
})
