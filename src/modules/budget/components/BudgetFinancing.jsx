// Módulo de Financiamento — fontes de financiamento do orçamento
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Check, X, Edit2, Landmark } from 'lucide-react'
import { fmt, toCents, toEuros } from '../utils/moneyUtils.js'
import { CATEGORIAS } from '../utils/marketData.js'
import styles from '../Budget.module.css'

// ── Auto-detect categoria por keywords ──
const GENEROS_KEYWORDS = [
  { cat: 2,  words: ['elenco', 'actor', 'actriz', 'figurante', 'casting'] },
  { cat: 3,  words: ['equipa', 'técnic', 'crew', 'câmara', 'operador', 'gaffer', 'grip', 'electricista', 'ad ', 'realizador', 'assistente'] },
  { cat: 4,  words: ['equipamento', 'câmara', 'lente', 'objectiva', 'tripé', 'gimbal', 'drone', 'monitor', 'cart'] },
  { cat: 5,  words: ['arte', 'cenografi', 'adereço', 'prop', 'decoração', 'guarda-roupa', 'guardaroupa', 'roupa', 'figurino', 'vestuário', 'fato', 'vestido', 'sapato', 'acessório', 'maquilhagem', 'cabelo', 'peruca', 'makeup'] },
  { cat: 6,  words: ['estúdio', 'local', 'location', 'sala', 'espaço', 'set', 'plateau'] },
  { cat: 7,  words: ['transporte', 'carrinha', 'van', 'catering', 'alimentação', 'comida', 'refeição', 'alojamento', 'hotel', 'gasolina', 'combustível'] },
  { cat: 8,  words: ['montagem', 'edição', 'offline', 'editor'] },
  { cat: 9,  words: ['som', 'áudio', 'música', 'compositor', 'sound', 'mix', 'foley'] },
  { cat: 10, words: ['pós', 'vfx', 'color', 'cor', 'grading', 'grafismo', 'gráfico', 'motion', 'conforming'] },
  { cat: 11, words: ['fotografia', 'foto', 'retoque'] },
  { cat: 12, words: ['seguro', 'licença', 'alvará', 'taxa', 'permissão'] },
]

function detectCategoria(text) {
  if (!text) return ''
  const lower = text.toLowerCase()
  for (const { cat, words } of GENEROS_KEYWORDS) {
    if (words.some(w => lower.includes(w))) return cat
  }
  return ''
}

const EMPTY_FORM = {
  nome: '',
  tipo: 'cash',
  valor: '',
  descricao: '',
  categoriaAbate: '',
  confirmado: false,
  dataPrevista: '',
}

function FinancingRow({ item, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  const startEdit = () => {
    setForm({
      nome:           item.nome,
      tipo:           item.tipo,
      valor:          toEuros(item.valor),
      descricao:      item.descricao || '',
      categoriaAbate: item.categoriaAbate ?? '',
      confirmado:     item.confirmado,
      dataPrevista:   item.dataPrevista || '',
    })
    setEditing(true)
  }

  const cancelEdit = () => { setForm(null); setEditing(false) }

  const saveEdit = () => {
    onUpdate({
      nome:           form.nome,
      tipo:           form.tipo,
      valor:          toCents(Number(form.valor) || 0),
      descricao:      form.descricao,
      categoriaAbate: form.categoriaAbate !== '' ? Number(form.categoriaAbate) : null,
      confirmado:     form.confirmado,
      dataPrevista:   form.dataPrevista,
    })
    setEditing(false)
    setForm(null)
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  if (editing && form) {
    return (
      <motion.div className={styles.financingEditRow} layout>
        <div className={styles.financingEditGrid}>
          <input
            className={styles.lineInput}
            value={form.nome}
            onChange={e => f('nome', e.target.value)}
            placeholder="Nome da fonte *"
            autoFocus
            style={{ gridColumn: '1 / 3' }}
          />
          <select
            className={styles.lineInput}
            value={form.tipo}
            onChange={e => f('tipo', e.target.value)}
          >
            <option value="cash">Dinheiro (cash)</option>
            <option value="generos">Em géneros</option>
          </select>
          <input
            className={styles.lineInputNum}
            type="number"
            value={form.valor}
            onChange={e => f('valor', e.target.value)}
            placeholder="Valor €"
          />
          <input
            className={styles.lineInput}
            value={form.descricao}
            onChange={e => f('descricao', e.target.value)}
            placeholder="Descrição"
            style={{ gridColumn: '1 / 3' }}
          />
          {form.tipo === 'generos' && (
            <select
              className={styles.lineInput}
              value={form.categoriaAbate}
              onChange={e => f('categoriaAbate', e.target.value)}
            >
              <option value="">— Categoria que abate —</option>
              {CATEGORIAS.map(c => (
                <option key={c.id} value={c.id}>{c.id.toString().padStart(2, '0')} {c.label}</option>
              ))}
            </select>
          )}
          <input
            className={styles.lineInput}
            type="date"
            value={form.dataPrevista}
            onChange={e => f('dataPrevista', e.target.value)}
          />
          <label className={styles.financingCheckLabel}>
            <input
              type="checkbox"
              checked={form.confirmado}
              onChange={e => f('confirmado', e.target.checked)}
            />
            Confirmado
          </label>
        </div>
        <div className={styles.lineEditBtns}>
          <button className={styles.btnCancel} onClick={cancelEdit}><X size={12} /> Cancelar</button>
          <button className={styles.btnConfirm} onClick={saveEdit} disabled={!form.nome?.trim()}>
            <Check size={12} /> Guardar
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`${styles.financingRow} ${item.confirmado ? styles.financingRowConfirmed : ''}`}
      layout
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className={`${styles.financingTypeBadge} ${item.tipo === 'cash' ? styles.financingCash : styles.financingGeneros}`}>
        {item.tipo === 'cash' ? 'CASH' : 'GÉNEROS'}
      </span>
      <div className={styles.financingRowInfo}>
        <span className={styles.financingRowName}>{item.nome || '—'}</span>
        {item.descricao && <span className={styles.financingRowDesc}>{item.descricao}</span>}
        {item.tipo === 'generos' && item.categoriaAbate && (
          <span className={styles.financingRowCat}>
            abate: cat. {String(item.categoriaAbate).padStart(2, '0')} {CATEGORIAS.find(c => c.id === item.categoriaAbate)?.label || ''}
          </span>
        )}
        {item.dataPrevista && <span className={styles.financingRowDate}>{item.dataPrevista}</span>}
      </div>
      <div className={styles.financingRowRight}>
        <span className={styles.financingRowValue}>{fmt(item.valor || 0)}</span>
        {item.confirmado
          ? <span className={styles.financingConfirmed}><Check size={10} /> Confirmado</span>
          : <span className={styles.financingPending}>Pendente</span>
        }
      </div>
      <div className={styles.financingRowActions}>
        <button className={styles.lineActionBtn} onClick={startEdit} title="Editar"><Edit2 size={11} /></button>
        <button
          className={styles.lineActionBtn}
          onClick={() => onRemove(item.id)}
          title="Eliminar"
          style={{ color: '#F87171' }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  )
}

export function BudgetFinancing({ budget, calc, onAdd, onUpdate, onRemove }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const financing = budget?.financing || []

  const f = (k, v) => {
    setForm(p => {
      const next = { ...p, [k]: v }
      // Auto-detect categoria quando tipo é géneros e nome muda
      if (k === 'nome' && next.tipo === 'generos') {
        const detected = detectCategoria(v)
        if (detected && !p.categoriaAbate) next.categoriaAbate = detected
      }
      // Auto-detect ao mudar para géneros
      if (k === 'tipo' && v === 'generos' && next.nome && !next.categoriaAbate) {
        next.categoriaAbate = detectCategoria(next.nome)
      }
      return next
    })
  }

  const handleAdd = () => {
    if (!form.nome?.trim()) return
    onAdd({
      nome:           form.nome,
      tipo:           form.tipo,
      valor:          toCents(Number(form.valor) || 0),
      descricao:      form.descricao,
      categoriaAbate: form.categoriaAbate !== '' ? Number(form.categoriaAbate) : null,
      confirmado:     form.confirmado,
      dataPrevista:   form.dataPrevista,
    })
    setForm({ ...EMPTY_FORM })
    setShowForm(false)
  }

  const totalCash = calc?.totalCash || 0
  const totalGeneros = calc?.totalGeneros || 0
  const totalFinanciamento = calc?.totalFinanciamento || 0
  const totalComIva = calc?.totalComIva || 0
  const totalVenda = calc?.totalVenda || 0
  const subtotal = calc?.subtotal || 0
  const totalIva = calc?.totalIva || 0
  const necessidadeCaixa = calc?.necessidadeCaixa ?? totalComIva
  const gap = calc?.gap ?? totalComIva

  const gapColor = gap === 0
    ? 'var(--health-green)'
    : gap > 0
      ? 'var(--health-yellow)'
      : '#F87171'

  const gapLabel = gap === 0
    ? 'Totalmente financiado'
    : gap > 0
      ? `Falta ${fmt(gap)}`
      : `Excesso de ${fmt(Math.abs(gap))} (rever)`

  return (
    <div className={styles.financingRoot}>
      {/* Header */}
      <div className={styles.financingRootHeader}>
        <div className={styles.financingRootHeaderLeft}>
          <Landmark size={16} color="var(--mod-budget, #E8A838)" />
          <h3 className={styles.financingRootTitle}>Financiamento</h3>
          <span className={styles.financingRootCount}>{financing.length}</span>
        </div>
        <button
          className={styles.btnAdd}
          onClick={() => setShowForm(v => !v)}
        >
          <Plus size={13} /> Adicionar fonte
        </button>
      </div>

      {/* Formulário de adição */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className={styles.financingAddForm}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.financingEditGrid}>
              <input
                className={styles.lineInput}
                value={form.nome}
                onChange={e => f('nome', e.target.value)}
                placeholder="Nome da fonte *"
                autoFocus
                style={{ gridColumn: '1 / 3' }}
              />
              <select
                className={styles.lineInput}
                value={form.tipo}
                onChange={e => f('tipo', e.target.value)}
              >
                <option value="cash">Dinheiro (cash)</option>
                <option value="generos">Em géneros</option>
              </select>
              <input
                className={styles.lineInputNum}
                type="number"
                value={form.valor}
                onChange={e => f('valor', e.target.value)}
                placeholder="Valor €"
              />
              <input
                className={styles.lineInput}
                value={form.descricao}
                onChange={e => f('descricao', e.target.value)}
                placeholder="Descrição"
                style={{ gridColumn: '1 / 3' }}
              />
              {form.tipo === 'generos' && (
                <select
                  className={styles.lineInput}
                  value={form.categoriaAbate}
                  onChange={e => f('categoriaAbate', e.target.value)}
                >
                  <option value="">— Categoria que abate —</option>
                  {CATEGORIAS.map(c => (
                    <option key={c.id} value={c.id}>{c.id.toString().padStart(2, '0')} {c.label}</option>
                  ))}
                </select>
              )}
              <input
                className={styles.lineInput}
                type="date"
                value={form.dataPrevista}
                onChange={e => f('dataPrevista', e.target.value)}
              />
              <label className={styles.financingCheckLabel}>
                <input
                  type="checkbox"
                  checked={form.confirmado}
                  onChange={e => f('confirmado', e.target.checked)}
                />
                Confirmado
              </label>
            </div>
            <div className={styles.lineEditBtns}>
              <button className={styles.btnCancel} onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }) }}>
                <X size={12} /> Cancelar
              </button>
              <button className={styles.btnConfirm} onClick={handleAdd} disabled={!form.nome?.trim()}>
                <Check size={12} /> Adicionar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de fontes */}
      <div className={styles.financingList}>
        {financing.length === 0 ? (
          <div className={styles.financingEmpty}>
            <Landmark size={32} color="var(--text-muted)" />
            <p>Nenhuma fonte de financiamento</p>
            <span>Adicionar subsídio, pré-venda, ou parceria</span>
          </div>
        ) : (
          <AnimatePresence>
            {financing.map(item => (
              <FinancingRow
                key={item.id}
                item={item}
                onUpdate={(patch) => onUpdate(item.id, patch)}
                onRemove={onRemove}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Resumo totais */}
      <div className={styles.financingSummary}>
        <div className={styles.financingSummaryTitle}>Financiamento</div>
        <div className={styles.financingSummaryRow}>
          <span>Cash</span>
          <span className={styles.financingSummaryValue}>{fmt(totalCash)}</span>
        </div>
        <div className={styles.financingSummaryRow}>
          <span>Em géneros</span>
          <span className={styles.financingSummaryValue}>{fmt(totalGeneros)}</span>
        </div>
        <div className={`${styles.financingSummaryRow} ${styles.financingSummaryRowBold}`}>
          <span>Total financiado</span>
          <span className={styles.financingSummaryValue}>{fmt(totalFinanciamento)}</span>
        </div>
        {(calc?.pendingTotal || 0) > 0 && (
          <div className={styles.financingSummaryRow} style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <span>({fmt(calc.confirmedTotal)} confirmado · {fmt(calc.pendingTotal)} pendente)</span>
            <span />
          </div>
        )}
        <div className={styles.financingSummaryDivider} />
        <div className={styles.financingSummaryRow}>
          <span>Orçamento s/ IVA</span>
          <span className={styles.financingSummaryValue}>{fmt(totalVenda)}</span>
        </div>
        <div className={styles.financingSummaryRow} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <span>IVA</span>
          <span>{fmt(totalIva)}</span>
        </div>
        <div className={`${styles.financingSummaryRow} ${styles.financingSummaryRowBold}`}>
          <span>Orçamento c/ IVA</span>
          <span className={styles.financingSummaryValue}>{fmt(totalComIva)}</span>
        </div>
        <div className={styles.financingSummaryDivider} />
        <div className={styles.financingSummaryRow}>
          <span>Cobertura s/ IVA</span>
          <span className={styles.financingSummaryValue} style={{ color: totalFinanciamento >= totalVenda ? 'var(--health-green)' : 'var(--text-secondary)' }}>
            {Math.round((totalFinanciamento / (totalVenda || 1)) * 100)}%
          </span>
        </div>
        <div className={styles.financingSummaryRow}>
          <span>Cobertura c/ IVA</span>
          <span className={styles.financingSummaryValue} style={{ color: totalFinanciamento >= totalComIva ? 'var(--health-green)' : 'var(--text-secondary)' }}>
            {Math.round((totalFinanciamento / (totalComIva || 1)) * 100)}%
          </span>
        </div>
        <div className={styles.financingSummaryDivider} />
        <div className={styles.financingSummaryRow}>
          <span>Necessidade de caixa</span>
          <span className={styles.financingSummaryValue}>{fmt(necessidadeCaixa)}</span>
        </div>
        <div className={`${styles.financingSummaryRow} ${styles.financingSummaryRowGap}`} style={{ color: gapColor }}>
          <span>GAP</span>
          <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)' }}>{gapLabel}</span>
        </div>
      </div>
    </div>
  )
}
