// Folha de Caixa — despesas diárias + OCR de recibos
import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Check, X, Edit2, Receipt, Camera, Loader } from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { fetchAPI, MODEL_FAST } from '../../../core/api.js'
import { fmt, toCents, toEuros } from '../utils/moneyUtils.js'
import { CATEGORIAS } from '../utils/marketData.js'
import styles from '../Budget.module.css'

const ESTADOS = ['pendente', 'aprovado', 'rejeitado']
const ESTADO_COLORS = {
  pendente:  { bg: 'rgba(251,185,44,0.15)', color: '#FBB92C' },
  aprovado:  { bg: 'rgba(52,211,153,0.15)', color: 'var(--health-green)' },
  rejeitado: { bg: 'rgba(248,113,113,0.15)', color: '#F87171' },
}
const EMPTY_FORM = {
  data: new Date().toISOString().split('T')[0],
  descricao: '',
  fornecedor: '',
  valor: '',
  taxaIva: 0.23,
  categoria: 7,
  dayId: '',
  estado: 'pendente',
}

function groupByDate(expenses) {
  const groups = {}
  expenses.forEach(e => {
    const d = e.data || 'sem-data'
    if (!groups[d]) groups[d] = []
    groups[d].push(e)
  })
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

function ExpenseRow({ expense, onUpdate, onRemove, shootingDays }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  const startEdit = () => {
    setForm({
      data:       expense.data || '',
      descricao:  expense.descricao || '',
      fornecedor: expense.fornecedor || '',
      valor:      toEuros(expense.valor),
      taxaIva:    expense.taxaIva ?? 0.23,
      categoria:  expense.categoria ?? 7,
      dayId:      expense.dayId || '',
      estado:     expense.estado || 'pendente',
    })
    setEditing(true)
  }

  const cancelEdit = () => { setForm(null); setEditing(false) }

  const saveEdit = () => {
    const valor = toCents(Number(form.valor) || 0)
    const taxaIva = Number(form.taxaIva) || 0.23
    const valorSemIva = Math.round(valor / (1 + taxaIva))
    onUpdate({
      data:        form.data,
      descricao:   form.descricao,
      fornecedor:  form.fornecedor,
      valor,
      valorSemIva,
      taxaIva,
      categoria:   Number(form.categoria),
      dayId:       form.dayId || null,
      estado:      form.estado,
    })
    setEditing(false)
    setForm(null)
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  if (editing && form) {
    return (
      <motion.div className={styles.expenseEditRow} layout>
        <div className={styles.expenseEditGrid}>
          <input className={styles.lineInput} type="date" value={form.data} onChange={e => f('data', e.target.value)} />
          <input className={styles.lineInput} value={form.fornecedor} onChange={e => f('fornecedor', e.target.value)} placeholder="Fornecedor" />
          <input className={styles.lineInput} value={form.descricao} onChange={e => f('descricao', e.target.value)} placeholder="Descrição" style={{ gridColumn: '1 / 3' }} />
          <input className={styles.lineInputNum} type="number" value={form.valor} onChange={e => f('valor', e.target.value)} placeholder="Total c/IVA €" />
          <select className={styles.lineInput} value={form.taxaIva} onChange={e => f('taxaIva', Number(e.target.value))}>
            <option value={0.23}>IVA 23%</option>
            <option value={0.13}>IVA 13%</option>
            <option value={0.06}>IVA 6%</option>
          </select>
          <select className={styles.lineInput} value={form.categoria} onChange={e => f('categoria', e.target.value)}>
            {CATEGORIAS.map(c => (
              <option key={c.id} value={c.id}>{c.id.toString().padStart(2, '0')} {c.label}</option>
            ))}
          </select>
          {shootingDays && shootingDays.length > 0 && (
            <select className={styles.lineInput} value={form.dayId} onChange={e => f('dayId', e.target.value)}>
              <option value="">— Dia de rodagem (opcional) —</option>
              {shootingDays.map(d => (
                <option key={d.id} value={d.id}>{d.date || d.id}</option>
              ))}
            </select>
          )}
          <select className={styles.lineInput} value={form.estado} onChange={e => f('estado', e.target.value)}>
            {ESTADOS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div className={styles.lineEditBtns}>
          <button className={styles.btnCancel} onClick={cancelEdit}><X size={12} /> Cancelar</button>
          <button className={styles.btnConfirm} onClick={saveEdit}><Check size={12} /> Guardar</button>
        </div>
      </motion.div>
    )
  }

  const estadoStyle = ESTADO_COLORS[expense.estado] || ESTADO_COLORS.pendente
  const cat = CATEGORIAS.find(c => c.id === expense.categoria)

  return (
    <motion.div
      className={styles.expenseRow}
      layout
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.expenseRowInfo}>
        <span className={styles.expenseRowFornecedor}>{expense.fornecedor || '—'}</span>
        <span className={styles.expenseRowDesc}>{expense.descricao || ''}</span>
      </div>
      <div className={styles.expenseRowMeta}>
        {cat && (
          <span className={styles.expenseCatBadge}>
            {String(cat.id).padStart(2, '0')} {cat.label}
          </span>
        )}
        <span className={styles.expenseIvaBadge}>IVA {Math.round((expense.taxaIva || 0.23) * 100)}%</span>
        {expense.origem === 'ocr' && <span className={styles.expenseOcrBadge}>OCR</span>}
      </div>
      <span className={styles.expenseRowValue}>{fmt(expense.valor || 0)}</span>
      <span
        className={styles.expenseEstadoBadge}
        style={{ background: estadoStyle.bg, color: estadoStyle.color }}
      >
        {expense.estado || 'pendente'}
      </span>
      <div className={styles.expenseRowActions}>
        <button className={styles.lineActionBtn} onClick={startEdit} title="Editar"><Edit2 size={11} /></button>
        <button
          className={styles.lineActionBtn}
          onClick={() => onRemove(expense.id)}
          title="Eliminar"
          style={{ color: '#F87171' }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  )
}

function AddExpenseForm({ onAdd, onCancel, shootingDays, initialValues }) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(initialValues || {}),
  })

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    const valor = toCents(Number(form.valor) || 0)
    const taxaIva = Number(form.taxaIva) || 0.23
    const valorSemIva = Math.round(valor / (1 + taxaIva))
    onAdd({
      data:        form.data,
      descricao:   form.descricao,
      fornecedor:  form.fornecedor,
      valor,
      valorSemIva,
      taxaIva,
      categoria:   Number(form.categoria),
      dayId:       form.dayId || null,
      estado:      form.estado,
    })
  }

  return (
    <div className={styles.expenseAddForm}>
      <div className={styles.expenseEditGrid}>
        <input className={styles.lineInput} type="date" value={form.data} onChange={e => f('data', e.target.value)} />
        <input className={styles.lineInput} value={form.fornecedor} onChange={e => f('fornecedor', e.target.value)} placeholder="Fornecedor" autoFocus />
        <input className={styles.lineInput} value={form.descricao} onChange={e => f('descricao', e.target.value)} placeholder="Descrição" style={{ gridColumn: '1 / 3' }} />
        <input className={styles.lineInputNum} type="number" value={form.valor} onChange={e => f('valor', e.target.value)} placeholder="Total c/IVA €" />
        <select className={styles.lineInput} value={form.taxaIva} onChange={e => f('taxaIva', Number(e.target.value))}>
          <option value={0.23}>IVA 23%</option>
          <option value={0.13}>IVA 13%</option>
          <option value={0.06}>IVA 6%</option>
        </select>
        <select className={styles.lineInput} value={form.categoria} onChange={e => f('categoria', e.target.value)}>
          {CATEGORIAS.map(c => (
            <option key={c.id} value={c.id}>{c.id.toString().padStart(2, '0')} {c.label}</option>
          ))}
        </select>
        {shootingDays && shootingDays.length > 0 && (
          <select className={styles.lineInput} value={form.dayId} onChange={e => f('dayId', e.target.value)}>
            <option value="">— Dia de rodagem (opcional) —</option>
            {shootingDays.map(d => (
              <option key={d.id} value={d.id}>{d.date || d.id}</option>
            ))}
          </select>
        )}
        <select className={styles.lineInput} value={form.estado} onChange={e => f('estado', e.target.value)}>
          {ESTADOS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <div className={styles.lineEditBtns}>
        <button className={styles.btnCancel} onClick={onCancel}><X size={12} /> Cancelar</button>
        <button className={styles.btnConfirm} onClick={handleSave}><Check size={12} /> Adicionar</button>
      </div>
    </div>
  )
}

export function FolhaCaixa({ budget, calc, onAdd, onUpdate, onRemove }) {
  const {  apiKey, shootingDays  } = useStore(useShallow(s => ({ apiKey: s.apiKey, shootingDays: s.shootingDays })))
  const fileInputRef = useRef(null)
  const [showForm, setShowForm] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState(null)
  const [ocrPrefill, setOcrPrefill] = useState(null)
  const [dateFilter, setDateFilter] = useState('all')

  const expenses = budget?.expenses || []

  const filteredExpenses = useMemo(() => {
    if (dateFilter === 'all') return expenses
    return expenses.filter(e => e.data === dateFilter)
  }, [expenses, dateFilter])

  const grouped = useMemo(() => groupByDate(filteredExpenses), [filteredExpenses])

  const totalExpenses = calc?.totalExpenses || 0
  const totalComIva = calc?.totalComIva || 0
  const totalVenda = calc?.totalVenda || 0
  const totalIva = calc?.totalIva || 0
  const totalExecutado = calc?.totalExecutado || 0
  const totalGasto = totalExpenses + totalExecutado
  const disponivel = totalComIva - totalGasto

  // Datas únicas para o filtro
  const uniqueDates = useMemo(() => {
    const s = new Set(expenses.map(e => e.data).filter(Boolean))
    return Array.from(s).sort((a, b) => b.localeCompare(a))
  }, [expenses])

  const handleOcrClick = () => {
    setOcrError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!apiKey) { setOcrError('Chave API não configurada.'); return }

    setOcrLoading(true)
    setOcrError(null)

    try {
      const base64 = await fileToBase64(file)
      const mediaType = file.type || 'image/jpeg'

      const text = await fetchAPI({
        apiKey,
        system: 'Extrai dados de fatura/recibo português. Devolve apenas JSON válido sem markdown: { "fornecedor": string, "total_com_iva": number, "taxa_iva": 0.23|0.13|0.06, "total_sem_iva": number, "data": "YYYY-MM-DD"|null, "descricao": string }',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              { type: 'text', text: 'Extrai os dados desta fatura/recibo.' },
            ],
          },
        ],
        maxTokens: 256,
        model: MODEL_FAST,
        cache: true,
      })
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Resposta inválida da API')
      const parsed = JSON.parse(jsonMatch[0])

      setOcrPrefill({
        fornecedor: parsed.fornecedor || '',
        descricao:  parsed.descricao || '',
        valor:      parsed.total_com_iva || '',
        taxaIva:    parsed.taxa_iva || 0.23,
        data:       parsed.data || new Date().toISOString().split('T')[0],
      })
      setShowForm(true)
    } catch (err) {
      setOcrError(`Erro OCR: ${err.message}`)
    } finally {
      setOcrLoading(false)
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAdd = (exp) => {
    onAdd({ ...exp, origem: ocrPrefill ? 'ocr' : 'manual' })
    setShowForm(false)
    setOcrPrefill(null)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setOcrPrefill(null)
  }

  return (
    <div className={styles.caixaRoot}>
      {/* Header */}
      <div className={styles.caixaHeader}>
        <div className={styles.caixaHeaderLeft}>
          <Receipt size={16} color="var(--mod-budget, #E8A838)" />
          <h3 className={styles.caixaTitle}>Folha de Caixa</h3>
          <span className={styles.financingRootCount}>{expenses.length} despesas</span>
        </div>
        <div className={styles.caixaHeaderActions}>
          {/* Date filter */}
          <select
            className={styles.lineInput}
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ width: 160 }}
          >
            <option value="all">Todas as datas</option>
            {uniqueDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* OCR button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className={styles.btnSecondary}
            onClick={handleOcrClick}
            disabled={ocrLoading}
            title="Ler fatura por foto"
          >
            {ocrLoading ? <Loader size={13} className={styles.spinIcon} /> : <Camera size={13} />}
            {ocrLoading ? 'A ler...' : 'Ler fatura'}
          </button>

          <button className={styles.btnAdd} onClick={() => { setOcrPrefill(null); setShowForm(v => !v) }}>
            <Plus size={13} /> Nova despesa
          </button>
        </div>
      </div>

      {ocrError && <div className={styles.chatError}>{ocrError}</div>}

      {/* Formulário */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            {ocrPrefill && (
              <div className={styles.ocrPrefillBanner}>
                <Camera size={13} /> Dados extraídos do recibo — confirme antes de guardar
              </div>
            )}
            <AddExpenseForm
              onAdd={handleAdd}
              onCancel={handleCancelForm}
              shootingDays={shootingDays}
              initialValues={ocrPrefill ? {
                fornecedor: ocrPrefill.fornecedor,
                descricao:  ocrPrefill.descricao,
                valor:      ocrPrefill.valor,
                taxaIva:    ocrPrefill.taxaIva,
                data:       ocrPrefill.data,
              } : null}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout: lista + sidebar */}
      <div className={styles.caixaBody}>
        {/* Lista de despesas */}
        <div className={styles.caixaList}>
          {grouped.length === 0 ? (
            <div className={styles.financingEmpty}>
              <Receipt size={32} color="var(--text-muted)" />
              <p>Nenhuma despesa registada</p>
              <span>Adiciona despesas ou lê uma fatura por foto</span>
            </div>
          ) : (
            <AnimatePresence>
              {grouped.map(([date, items]) => {
                const dayTotal = items.reduce((s, e) => s + (e.valor || 0), 0)
                return (
                  <div key={date} className={styles.expenseDateGroup}>
                    <div className={styles.expenseDateHeader}>
                      <span className={styles.expenseDateLabel}>{date === 'sem-data' ? 'Sem data' : date}</span>
                      <span className={styles.expenseDateTotal}>{fmt(dayTotal)}</span>
                    </div>
                    {items.map(exp => (
                      <ExpenseRow
                        key={exp.id}
                        expense={exp}
                        onUpdate={(patch) => onUpdate(exp.id, patch)}
                        onRemove={onRemove}
                        shootingDays={shootingDays}
                      />
                    ))}
                  </div>
                )
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Sidebar de resumo */}
        <div className={styles.caixaSidebar}>
          <div className={styles.caixaSidebarTitle}>Resumo</div>
          <div className={styles.caixaSidebarRow}>
            <span>Despesas aprovadas</span>
            <span className={styles.caixaSidebarValue}>{fmt(totalExpenses)}</span>
          </div>
          <div className={styles.caixaSidebarRow}>
            <span>Orçamento executado</span>
            <span className={styles.caixaSidebarValue}>{fmt(totalExecutado)}</span>
          </div>
          <div className={`${styles.caixaSidebarRow} ${styles.caixaSidebarRowBold}`}>
            <span>Total gasto</span>
            <span className={styles.caixaSidebarValue}>{fmt(totalGasto)}</span>
          </div>
          <div className={styles.caixaSidebarDivider} />
          <div className={styles.caixaSidebarRow}>
            <span>Orçamento s/ IVA</span>
            <span className={styles.caixaSidebarValue}>{fmt(totalVenda)}</span>
          </div>
          <div className={styles.caixaSidebarRow} style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <span>IVA</span>
            <span>{fmt(totalIva)}</span>
          </div>
          <div className={styles.caixaSidebarRow}>
            <span>Orçamento c/ IVA</span>
            <span className={styles.caixaSidebarValue}>{fmt(totalComIva)}</span>
          </div>
          <div className={`${styles.caixaSidebarRow} ${styles.caixaSidebarRowBold}`}>
            <span>Disponível</span>
            <span
              className={styles.caixaSidebarValue}
              style={{ color: disponivel >= 0 ? 'var(--health-green)' : '#F87171' }}
            >
              {fmt(disponivel)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
