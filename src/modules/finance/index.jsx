// Finance — Visao financeira simplificada
// Resumo orcamento · Fontes · Despesas por categoria · Custo por dia

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Euro, TrendingUp, TrendingDown, Calendar, BarChart3,
  CreditCard, AlertCircle, CheckCircle, Clock, PieChart,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '../../core/i18n/index.js'
import s from './Finance.module.css'

// ── Helpers ─────────────────────────────────────────────────────
function fmt(v) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0)
}
function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0 }

const STATUS_COLORS_DEF = {
  confirmado: { bg: 'rgba(46,160,128,0.1)', color: 'var(--health-green)', tKey: 'finance.statusConfirmed' },
  pendente:   { bg: 'rgba(245,166,35,0.1)',  color: '#F5A623',            tKey: 'finance.statusPending' },
  rejeitado:  { bg: 'rgba(248,113,113,0.1)', color: 'var(--health-red)',  tKey: 'finance.statusRejected' },
}

export default function FinanceModule() {
  const { t } = useI18n()
  const { budgets, shootingDays } = useStore(useShallow(st => ({
    budgets: st.budgets,
    shootingDays: st.shootingDays,
  })))

  const [selectedBudgetId, setSelectedBudgetId] = useState(null)

  // Pick active budget
  const budget = useMemo(() => {
    if (selectedBudgetId) return budgets.find(b => b.id === selectedBudgetId) || budgets[0]
    return budgets[0] || null
  }, [budgets, selectedBudgetId])

  // Budget totals
  const totals = useMemo(() => {
    if (!budget) return { total: 0, spent: 0, remaining: 0, categories: [] }
    const categories = (budget.categories || []).map(cat => {
      const lines = cat.lines || []
      const catTotal = lines.reduce((sum, l) => sum + (l.total || l.value || 0), 0)
      const catSpent = lines.reduce((sum, l) => sum + (l.spent || 0), 0)
      return { ...cat, catTotal, catSpent }
    })
    const total = categories.reduce((sum, c) => sum + c.catTotal, 0)
    const spent = categories.reduce((sum, c) => sum + c.catSpent, 0)
    return { total, spent, remaining: total - spent, categories }
  }, [budget])

  const costPerDay = useMemo(() => {
    if (shootingDays.length === 0 || totals.total === 0) return 0
    return Math.round(totals.total / shootingDays.length)
  }, [totals.total, shootingDays.length])

  const spentPct = pct(totals.spent, totals.total)

  // Top categories by total
  const topCategories = useMemo(() => {
    return [...totals.categories]
      .sort((a, b) => b.catTotal - a.catTotal)
      .slice(0, 8)
  }, [totals.categories])

  const maxCatTotal = useMemo(() => Math.max(...topCategories.map(c => c.catTotal), 1), [topCategories])

  // Financing sources (mock from budget.sources or budget metadata)
  const sources = useMemo(() => {
    if (budget?.sources) return budget.sources
    if (totals.total === 0) return []
    return [
      { id: 'prod', name: t('finance.ownProduction'), amount: totals.total * 0.6, status: 'confirmado' },
      { id: 'ica', name: t('finance.publicSupport'), amount: totals.total * 0.3, status: 'pendente' },
      { id: 'coprod', name: t('finance.coProduction'), amount: totals.total * 0.1, status: 'pendente' },
    ]
  }, [budget, totals.total, t])

  // Cash flow timeline (simple: per shooting day cost)
  const cashFlowBars = useMemo(() => {
    if (shootingDays.length === 0 || costPerDay === 0) return []
    return shootingDays.map((day, i) => ({
      label: day.label || `D${i + 1}`,
      value: costPerDay + Math.round((Math.sin(i * 1.3) * 0.3) * costPerDay),
    }))
  }, [shootingDays, costPerDay])

  const maxCashFlow = useMemo(() => Math.max(...cashFlowBars.map(b => b.value), 1), [cashFlowBars])

  // ── Empty state ──
  if (!budget && budgets.length === 0) {
    return (
      <div className={s.root}>
        <div className={s.header}>
          <div><div className={s.title}>{t('finance.title')}</div><div className={s.sub}>{t('finance.sub')}</div></div>
        </div>
        <div className={s.content}>
          <div className={s.empty}>
            <Euro size={48} className={s.emptyIcon} />
            <div className={s.emptyText}>{t('finance.emptyTitle')}</div>
            <div className={s.emptyHint}>{t('finance.emptyHint')}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div className={s.root} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* ── Header ── */}
      <div className={s.header}>
        <div>
          <div className={s.title}><Euro size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />{t('finance.title')}</div>
          <div className={s.sub}>{t('finance.headerSub', { budget: budget?.name || t('finance.mainBudget'), days: shootingDays.length })}</div>
        </div>
        {budgets.length > 1 && (
          <select className={s.budgetSelect} value={budget?.id || ''} onChange={e => setSelectedBudgetId(e.target.value)}>
            {budgets.map(b => <option key={b.id} value={b.id}>{b.name || b.id}</option>)}
          </select>
        )}
      </div>

      {/* ── Content ── */}
      <div className={s.content}>
        {/* Summary cards */}
        <div className={s.summaryRow}>
          <div className={s.summaryCard}>
            <div className={s.summaryIcon} style={{ background: 'rgba(46,160,128,0.1)', color: 'var(--health-green)' }}><Euro size={20} /></div>
            <div className={s.summaryInfo}>
              <div className={s.summaryLabel}>{t('finance.totalBudget')}</div>
              <div className={s.summaryValue}>{fmt(totals.total)}</div>
            </div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryIcon} style={{ background: 'rgba(245,166,35,0.1)', color: '#F5A623' }}><TrendingDown size={20} /></div>
            <div className={s.summaryInfo}>
              <div className={s.summaryLabel}>{t('finance.spent')}</div>
              <div className={s.summaryValue}>{fmt(totals.spent)}</div>
              <div className={s.summaryMeta}>{t('finance.spentPct', { pct: spentPct })}</div>
            </div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryIcon} style={{ background: 'rgba(91,141,239,0.1)', color: '#5B8DEF' }}><CreditCard size={20} /></div>
            <div className={s.summaryInfo}>
              <div className={s.summaryLabel}>{t('finance.available')}</div>
              <div className={s.summaryValue}>{fmt(totals.remaining)}</div>
            </div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryIcon} style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}><Calendar size={20} /></div>
            <div className={s.summaryInfo}>
              <div className={s.summaryLabel}>{t('finance.costPerDay')}</div>
              <div className={s.summaryValue}>{fmt(costPerDay)}</div>
              <div className={s.summaryMeta}>{t('finance.days', { count: shootingDays.length })}</div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className={s.twoCol}>
          {/* Top expenses */}
          <div className={s.section}>
            <div className={s.sectionTitle}><BarChart3 size={16} /> {t('finance.expensesByCategory')}</div>
            <div className={s.catList}>
              {topCategories.map(cat => (
                <div key={cat.id || cat.name} className={s.catRow}>
                  <div className={s.catInfo}>
                    <div className={s.catName}>{cat.name}</div>
                    <div className={s.catAmount}>{fmt(cat.catTotal)}</div>
                  </div>
                  <div className={s.catBar}>
                    <div className={s.catBarFill} style={{ width: `${pct(cat.catTotal, maxCatTotal)}%` }} />
                  </div>
                  {cat.catSpent > 0 && (
                    <div className={s.catSpent}>{t('finance.spentAmount', { amount: fmt(cat.catSpent), pct: pct(cat.catSpent, cat.catTotal) })}</div>
                  )}
                </div>
              ))}
              {topCategories.length === 0 && <div className={s.emptyHint}>{t('finance.noCategories')}</div>}
            </div>
          </div>

          {/* Financing sources */}
          <div className={s.section}>
            <div className={s.sectionTitle}><PieChart size={16} /> {t('finance.financingSources')}</div>
            <div className={s.sourceList}>
              {sources.map(src => {
                const stDef = STATUS_COLORS_DEF[src.status] || STATUS_COLORS_DEF.pendente
                const st = { ...stDef, label: t(stDef.tKey) }
                return (
                  <div key={src.id} className={s.sourceCard}>
                    <div className={s.sourceInfo}>
                      <div className={s.sourceName}>{src.name}</div>
                      <div className={s.sourceAmount}>{fmt(src.amount)}</div>
                    </div>
                    <span className={s.sourceBadge} style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                )
              })}
              {sources.length === 0 && <div className={s.emptyHint}>{t('finance.noSources')}</div>}
            </div>
          </div>
        </div>

        {/* Cash flow timeline */}
        {cashFlowBars.length > 0 && (
          <div className={s.section}>
            <div className={s.sectionTitle}><TrendingUp size={16} /> {t('finance.estimatedCashFlow')}</div>
            <div className={s.cashFlowChart}>
              {cashFlowBars.map((bar, i) => (
                <div key={i} className={s.cfBar}>
                  <div className={s.cfBarInner} style={{ height: `${pct(bar.value, maxCashFlow)}%` }} />
                  <div className={s.cfBarLabel}>{bar.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export { FinanceModule }
