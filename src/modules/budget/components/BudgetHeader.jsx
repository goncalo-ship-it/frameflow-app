// Cabeçalho editável do orçamento
import { useState } from 'react'
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useStore } from '../../../core/store.js'
import styles from '../Budget.module.css'

const Field = ({ label, value, onChange, type = 'text', placeholder = '', readOnly = false }) => (
  <div className={styles.headerField}>
    <label className={styles.headerFieldLabel}>{label}</label>
    {readOnly
      ? <div className={styles.headerFieldReadOnly}>{value || '—'}</div>
      : <input
          className={styles.headerInput}
          type={type}
          value={value || ''}
          onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
        />
    }
  </div>
)

const TextareaField = ({ label, value, onChange, placeholder = '' }) => (
  <div className={`${styles.headerField} ${styles.headerFieldFull}`}>
    <label className={styles.headerFieldLabel}>{label}</label>
    <textarea
      className={styles.headerTextarea}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
    />
  </div>
)

export function BudgetHeader({ budget, onUpdateHeader, onUpdateField }) {
  const [collapsed, setCollapsed] = useState(false)
  const shootingDays = useStore(s => s.shootingDays)

  if (!budget) return null
  const { header = {}, numero, mode, taxaIva, taxaHonorarios } = budget
  const h = (field) => (val) => onUpdateHeader({ [field]: val })

  return (
    <div className={styles.headerSection}>
      <div className={styles.headerSectionTop}>
        <div className={styles.headerMeta}>
          <span className={styles.headerNumero}>{numero}</span>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === 'fiction' ? styles.modeBtnActive : ''}`}
              onClick={() => onUpdateField({ mode: 'fiction' })}
            >
              Ficção / Série
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'advertising' ? styles.modeBtnActive : ''}`}
              onClick={() => onUpdateField({ mode: 'advertising' })}
            >
              Publicidade
            </button>
          </div>
        </div>
        <button className={styles.collapseBtn} onClick={() => setCollapsed(v => !v)}>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {collapsed ? 'Expandir' : 'Recolher'}
        </button>
      </div>

      {!collapsed && (
        <div className={styles.headerGrid}>
          <Field label="Data" value={header.data} onChange={h('data')} type="date" />
          <Field label="Cliente" value={header.cliente} onChange={h('cliente')} placeholder="Nome do cliente" />
          <Field label="Campanha / Projecto" value={header.campanha} onChange={h('campanha')} placeholder="Nome da campanha ou série" />
          {mode === 'advertising' && (
            <Field label="Agência" value={header.agencia} onChange={h('agencia')} placeholder="Agência de publicidade" />
          )}
          <Field label="Técnica e Suporte" value={header.tecnicaESuporte} onChange={h('tecnicaESuporte')} placeholder="Vídeo, Cinema, etc." />
          {mode === 'advertising' && (
            <>
              <Field label="Meios e Direitos" value={header.meiosEDireitos} onChange={h('meiosEDireitos')} placeholder="TV, Digital, etc." />
              <Field label="Quantidade" value={header.quantidade} onChange={h('quantidade')} type="number" />
              <Field label="Duração" value={header.duracao} onChange={h('duracao')} placeholder='30", 60"…' />
            </>
          )}
          <Field label="Dias de Repérage" value={header.diasReperage} onChange={h('diasReperage')} type="number" />
          <div className={styles.headerField}>
            <label className={styles.headerFieldLabel}>
              Dias de Rodagem
              {shootingDays.length > 0 && header.diasRodagem !== shootingDays.length && (
                <button
                  onClick={() => h('diasRodagem')(shootingDays.length)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--mod-script)',
                    cursor: 'pointer', fontSize: 'var(--text-xs)', marginLeft: 'var(--space-2)',
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}
                  title={`Sincronizar com Produção (${shootingDays.length} dias)`}
                >
                  <RefreshCw size={10} /> {shootingDays.length} em Produção
                </button>
              )}
            </label>
            <input
              className={styles.headerInput}
              type="number"
              value={header.diasRodagem || ''}
              onChange={e => h('diasRodagem')(Number(e.target.value))}
            />
          </div>
          <Field label="Local de Rodagem" value={header.local} onChange={h('local')} placeholder="Lisboa, Porto…" />

          <div className={styles.headerField}>
            <label className={styles.headerFieldLabel}>Taxa IVA</label>
            <div className={styles.headerRateRow}>
              <input
                className={styles.headerInputSm}
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={taxaIva || 0.23}
                onChange={e => onUpdateField({ taxaIva: Number(e.target.value) })}
              />
              <span className={styles.headerRateLabel}>{Math.round((taxaIva || 0.23) * 100)}%</span>
            </div>
          </div>

          <div className={styles.headerField}>
            <label className={styles.headerFieldLabel}>Taxa Honorários</label>
            <div className={styles.headerRateRow}>
              <input
                className={styles.headerInputSm}
                type="number"
                step="0.01"
                min="0"
                max="0.5"
                value={taxaHonorarios || 0.15}
                onChange={e => onUpdateField({ taxaHonorarios: Number(e.target.value) })}
              />
              <span className={styles.headerRateLabel}>{Math.round((taxaHonorarios || 0.15) * 100)}%</span>
            </div>
          </div>

          {mode === 'advertising' && (
            <div className={styles.headerField}>
              <label className={styles.headerFieldLabel}>Tecto do Cliente (c/IVA)</label>
              <input
                className={styles.headerInput}
                type="number"
                value={budget.ceiling ? budget.ceiling / 100 : ''}
                onChange={e => onUpdateField({ ceiling: e.target.value ? Math.round(Number(e.target.value) * 100) : null })}
                placeholder="Valor máximo aprovado pelo cliente"
              />
            </div>
          )}

          <TextareaField
            label="Descrição"
            value={header.descricao}
            onChange={h('descricao')}
            placeholder="Breve descrição do projecto…"
          />
          <TextareaField
            label="Notas Gerais"
            value={header.notasGerais}
            onChange={h('notasGerais')}
            placeholder="Condições especiais, notas para o cliente…"
          />
        </div>
      )}
    </div>
  )
}
