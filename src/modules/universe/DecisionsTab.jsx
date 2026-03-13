// DecisionsTab — Writers' Room decisions manager
// Universo module · FrameBoard

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, X, Check, AlertTriangle, MessageSquare } from 'lucide-react'
import { SmartInput } from '../../components/shared/SmartInput.jsx'
import styles from './Universe.module.css'

function uid() { return `d-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }

const URGENCY_COLORS = { alta: '#F87171', média: '#F5A623', baixa: '#34D399' }
const STATUS_COLORS  = { open: '#F5A623', decided: '#34D399' }
const STATUS_LABELS  = { open: 'Aberta', decided: 'Decidida' }
const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const SPRING = { type: 'spring', damping: 28, stiffness: 300 }

const cardStyle = {
  background: 'var(--bg-surface, #0F1520)',
  border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
  borderRadius: 'var(--radius-lg, 12px)',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const badgeBase = {
  fontSize: 'var(--text-xs, 11px)',
  fontWeight: 700,
  padding: '2px 10px',
  borderRadius: 999,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  lineHeight: '20px',
  userSelect: 'none',
}

const inputStyle = {
  background: 'var(--bg-input, rgba(255,255,255,0.04))',
  border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
  borderRadius: 'var(--radius-md, 8px)',
  color: 'var(--text-primary, #E8ECF4)',
  padding: '8px 12px',
  fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  fontSize: 'var(--text-sm, 14px)',
  width: '100%',
  outline: 'none',
}

const btnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 16px',
  borderRadius: 'var(--radius-md, 8px)',
  border: 'none',
  fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  fontSize: 'var(--text-sm, 14px)',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity .15s',
}

const FILTERS = [
  { id: 'all',     label: 'Todas' },
  { id: 'open',    label: 'Abertas' },
  { id: 'decided', label: 'Decididas' },
]

export function DecisionsTab({ decisions, setUniverseDecisions }) {
  const [filter, setFilter] = useState('all')

  const save = (updated) => setUniverseDecisions(updated)

  const addDecision = () => {
    save([
      {
        id: uid(),
        title: '',
        description: '',
        urgency: 'média',
        options: [],
        status: 'open',
        chosenOption: null,
        createdAt: new Date().toISOString(),
      },
      ...decisions,
    ])
  }

  const updateDecision = (id, patch) =>
    save(decisions.map(d => d.id === id ? { ...d, ...patch } : d))

  const deleteDecision = (id) =>
    save(decisions.filter(d => d.id !== id))

  const addOption = (decId) => {
    const dec = decisions.find(d => d.id === decId)
    if (!dec) return
    const idx = dec.options.length
    const label = `Opção ${OPTION_LETTERS[idx] || idx + 1}`
    updateDecision(decId, {
      options: [...dec.options, { id: uid(), label, text: '' }],
    })
  }

  const updateOption = (decId, optId, patch) => {
    const dec = decisions.find(d => d.id === decId)
    if (!dec) return
    updateDecision(decId, {
      options: dec.options.map(o => o.id === optId ? { ...o, ...patch } : o),
    })
  }

  const removeOption = (decId, optId) => {
    const dec = decisions.find(d => d.id === decId)
    if (!dec) return
    updateDecision(decId, {
      options: dec.options.filter(o => o.id !== optId),
      chosenOption: dec.chosenOption === optId ? null : dec.chosenOption,
      status: dec.chosenOption === optId ? 'open' : dec.status,
    })
  }

  const chooseOption = (decId, optId) => {
    const dec = decisions.find(d => d.id === decId)
    if (!dec) return
    // toggle: click again to reopen
    if (dec.chosenOption === optId) {
      updateDecision(decId, { status: 'open', chosenOption: null })
    } else {
      updateDecision(decId, { status: 'decided', chosenOption: optId })
    }
  }

  const filtered = filter === 'all'
    ? decisions
    : decisions.filter(d => d.status === filter)

  return (
    <div className={styles.forcasTab}>
      {/* Header */}
      <div className={styles.forcasHeader}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 800 }}>
            Decisões da Writers' Room
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
            Questões em aberto e decisões tomadas pela equipa de escrita.
          </p>
        </div>
        <button className={styles.btnAdd} onClick={addDecision}>
          <Plus size={14} /> Nova decisão
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, padding: '0 0 8px' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              ...btnStyle,
              padding: '5px 14px',
              fontSize: 'var(--text-xs, 12px)',
              background: filter === f.id ? 'rgba(160,106,255,0.18)' : 'rgba(255,255,255,0.04)',
              color: filter === f.id ? '#A06AFF' : 'var(--text-muted, #5A6070)',
              border: filter === f.id ? '1px solid rgba(160,106,255,0.3)' : '1px solid transparent',
            }}
          >
            {f.label}
            {f.id !== 'all' && (
              <span style={{ opacity: 0.6, marginLeft: 4 }}>
                {decisions.filter(d => f.id === 'all' ? true : d.status === f.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className={styles.forcesList} style={{ gap: 16 }}>
        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            <MessageSquare size={32} color="var(--text-muted)" />
            <p>
              {filter === 'all'
                ? <>Nenhuma decisão registada.<br />Adiciona a primeira questão da sala de escrita.</>
                : filter === 'open'
                  ? 'Nenhuma decisão em aberto.'
                  : 'Nenhuma decisão tomada ainda.'}
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {filtered.map(dec => (
            <motion.div
              key={dec.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={SPRING}
              style={cardStyle}
            >
              {/* Top row: title + badges + delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  style={{ ...inputStyle, fontWeight: 700, fontSize: 'var(--text-base, 15px)', flex: 1, border: 'none', background: 'transparent', padding: '0 4px' }}
                  value={dec.title}
                  onChange={e => updateDecision(dec.id, { title: e.target.value })}
                  placeholder="Título da decisão..."
                />

                {/* Urgency dropdown */}
                <select
                  value={dec.urgency}
                  onChange={e => updateDecision(dec.id, { urgency: e.target.value })}
                  style={{
                    ...badgeBase,
                    background: `${URGENCY_COLORS[dec.urgency]}22`,
                    color: URGENCY_COLORS[dec.urgency],
                    border: `1px solid ${URGENCY_COLORS[dec.urgency]}44`,
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    paddingRight: 10,
                    textAlign: 'center',
                  }}
                >
                  <option value="alta">Alta</option>
                  <option value="média">Média</option>
                  <option value="baixa">Baixa</option>
                </select>

                {/* Status badge */}
                <span style={{
                  ...badgeBase,
                  background: `${STATUS_COLORS[dec.status]}22`,
                  color: STATUS_COLORS[dec.status],
                  border: `1px solid ${STATUS_COLORS[dec.status]}44`,
                }}>
                  {STATUS_LABELS[dec.status]}
                </span>

                <button
                  className={styles.iconBtn}
                  onClick={() => deleteDecision(dec.id)}
                  title="Apagar decisão"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Description */}
              <SmartInput
                value={dec.description || ''}
                onChange={e => updateDecision(dec.id, { description: e.target.value })}
                placeholder="Contexto da decisão..."
                rows={2}
                context="Descrição de decisão da writers' room"
              />

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dec.options.map(opt => {
                  const isChosen = dec.status === 'decided' && dec.chosenOption === opt.id
                  return (
                    <motion.div
                      key={opt.id}
                      layout
                      onClick={() => chooseOption(dec.id, opt.id)}
                      style={{
                        background: isChosen
                          ? 'rgba(52,211,153,0.10)'
                          : 'var(--bg-input, rgba(255,255,255,0.03))',
                        border: isChosen
                          ? '1px solid rgba(52,211,153,0.35)'
                          : '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
                        borderRadius: 'var(--radius-md, 8px)',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        transition: 'border-color .2s, background .2s',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {isChosen && <Check size={14} color="#34D399" strokeWidth={3} />}
                        <input
                          value={opt.label}
                          onChange={e => { e.stopPropagation(); updateOption(dec.id, opt.id, { label: e.target.value }) }}
                          onClick={e => e.stopPropagation()}
                          style={{
                            ...inputStyle,
                            fontWeight: 700,
                            fontSize: 'var(--text-sm, 13px)',
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            flex: 1,
                            color: isChosen ? '#34D399' : 'var(--text-primary)',
                          }}
                          placeholder="Label da opção..."
                        />
                        <button
                          onClick={e => { e.stopPropagation(); removeOption(dec.id, opt.id) }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 2,
                            opacity: 0.5,
                            transition: 'opacity .15s',
                          }}
                          title="Remover opção"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <textarea
                        value={opt.text}
                        onChange={e => { e.stopPropagation(); updateOption(dec.id, opt.id, { text: e.target.value }) }}
                        onClick={e => e.stopPropagation()}
                        placeholder="Detalhe desta opção..."
                        rows={1}
                        style={{
                          ...inputStyle,
                          fontSize: 'var(--text-xs, 12px)',
                          border: 'none',
                          background: 'transparent',
                          padding: '2px 0 0',
                          resize: 'vertical',
                          color: 'var(--text-secondary, #8A90A0)',
                        }}
                      />
                    </motion.div>
                  )
                })}

                <button
                  onClick={() => addOption(dec.id)}
                  style={{
                    ...btnStyle,
                    background: 'rgba(160,106,255,0.08)',
                    color: '#A06AFF',
                    border: '1px dashed rgba(160,106,255,0.25)',
                    justifyContent: 'center',
                    fontSize: 'var(--text-xs, 12px)',
                    padding: '6px 12px',
                  }}
                >
                  <Plus size={13} /> Adicionar opção
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
