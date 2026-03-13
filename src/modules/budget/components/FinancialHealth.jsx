// Visão Geral — dashboard financeiro com gráficos dinâmicos
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, TrendingDown, TrendingUp, AlertTriangle, CheckCircle,
  Landmark, Receipt, Loader, Zap, ChevronDown, ChevronRight,
  Eye, EyeOff,
} from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { fetchAPI } from '../../../core/api.js'
import { fmt, fmtShort } from '../utils/moneyUtils.js'
import { CATEGORIAS } from '../utils/marketData.js'
import { calcLineTotal } from '../utils/formulae.js'
import styles from '../Budget.module.css'

// ── Cores para categorias ──
const CAT_COLORS = [
  '#5B8DEF', '#8B6FBF', '#E07B54', '#5BBF8B', '#D4A843',
  '#EF5B5B', '#5BCFCF', '#BF6FA0', '#8BBF5B', '#CF8B5B',
  '#6F8BBF', '#BFA05B', '#7B7B7B',
]

// ── Donut Chart SVG ──
function DonutChart({ data, size = 200, thickness = 32 }) {
  const radius = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  let cumulative = 0
  const arcs = data.map((d, i) => {
    const pct = d.value / total
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2
    cumulative += pct
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2

    const largeArc = pct > 0.5 ? 1 : 0
    const x1 = cx + radius * Math.cos(startAngle)
    const y1 = cy + radius * Math.sin(startAngle)
    const x2 = cx + radius * Math.cos(endAngle)
    const y2 = cy + radius * Math.sin(endAngle)

    // Tiny gap between segments
    const gap = data.length > 1 ? 0.01 : 0
    const adjustedPct = Math.max(0, pct - gap)
    if (adjustedPct <= 0) return null

    const aStartAngle = (cumulative - pct + gap / 2) * 2 * Math.PI - Math.PI / 2
    const aEndAngle = (cumulative - gap / 2) * 2 * Math.PI - Math.PI / 2
    const ax1 = cx + radius * Math.cos(aStartAngle)
    const ay1 = cy + radius * Math.sin(aStartAngle)
    const ax2 = cx + radius * Math.cos(aEndAngle)
    const ay2 = cy + radius * Math.sin(aEndAngle)

    return {
      ...d,
      pct,
      path: `M ${ax1} ${ay1} A ${radius} ${radius} 0 ${largeArc} 1 ${ax2} ${ay2}`,
      color: d.color || CAT_COLORS[i % CAT_COLORS.length],
    }
  }).filter(Boolean)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) => (
        <motion.path
          key={i}
          d={arc.path}
          fill="none"
          stroke={arc.color}
          strokeWidth={thickness}
          strokeLinecap="butt"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
        />
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="700" fontFamily="var(--font-display)">
        {fmtShort(total)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize="10">
        Total s/ IVA
      </text>
    </svg>
  )
}

// ── Horizontal Bar ──
function HBar({ label, value, maxValue, color, sub }) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0
  return (
    <div className={styles.vgBarRow}>
      <div className={styles.vgBarLabel}>
        <span>{label}</span>
        <span className={styles.vgBarValue} style={{ color }}>{fmtShort(value)}</span>
      </div>
      <div className={styles.vgBarTrack}>
        <motion.div
          className={styles.vgBarFill}
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      {sub && <span className={styles.vgBarSub}>{sub}</span>}
    </div>
  )
}

// ── KPI mini ──
function Kpi({ label, value, sub, color, icon: Icon }) {
  return (
    <div className={styles.vgKpi}>
      {Icon && <Icon size={16} className={styles.vgKpiIcon} style={{ color }} />}
      <span className={styles.vgKpiValue} style={{ color }}>{value}</span>
      <span className={styles.vgKpiLabel}>{label}</span>
      {sub && <span className={styles.vgKpiSub}>{sub}</span>}
    </div>
  )
}

// ── Mapa de Caixa — orçamento vs géneros vs cash necessário ──
function CashMap({ categorySummary, generosByCategory, cashByCategory, totalVenda, totalGeneros }) {
  const [open, setOpen] = useState(true)
  const catsWithValue = categorySummary.filter(c => c.total > 0 && c.id !== 13)
  const totalCashNeeded = catsWithValue.reduce((s, c) => s + (cashByCategory[c.id] || c.total), 0)

  return (
    <div className={styles.vgCashMap}>
      <button className={styles.vgCashMapToggle} onClick={() => setOpen(v => !v)}>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        Mapa de Caixa
        <span className={styles.vgCashMapBadge}>
          Cash: {fmtShort(totalCashNeeded)} · Géneros: {fmtShort(totalGeneros)}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <table className={styles.vgCashTable}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Categoria</th>
                  <th>Orçamento</th>
                  <th>Géneros</th>
                  <th>Cash necessário</th>
                </tr>
              </thead>
              <tbody>
                {catsWithValue.map(cat => {
                  const gen = generosByCategory[cat.id] || 0
                  const cash = cashByCategory[cat.id] || cat.total
                  return (
                    <tr key={cat.id} className={gen > 0 ? styles.vgCashRowHasGen : ''}>
                      <td className={styles.vgCashCatName}>
                        <span className={styles.vgCashCatNum}>{String(cat.id).padStart(2, '0')}</span>
                        {cat.label}
                      </td>
                      <td className={styles.vgCashVal}>{fmt(cat.total)}</td>
                      <td className={styles.vgCashGen}>
                        {gen > 0 ? <span style={{ color: 'var(--health-green)' }}>-{fmt(gen)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className={styles.vgCashCash}>
                        {fmt(cash)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className={styles.vgCashFooter}>
                  <td>Total</td>
                  <td className={styles.vgCashVal}>{fmt(totalVenda)}</td>
                  <td className={styles.vgCashGen}>
                    <span style={{ color: 'var(--health-green)' }}>-{fmt(totalGeneros)}</span>
                  </td>
                  <td className={styles.vgCashCash} style={{ fontWeight: 800 }}>
                    {fmt(totalCashNeeded)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FinancialHealth({ budget, calc }) {
  const {  apiKey, shootingDays  } = useStore(useShallow(s => ({ apiKey: s.apiKey, shootingDays: s.shootingDays })))
  const [savingsLoading, setSavingsLoading] = useState(false)
  const [savings, setSavings] = useState(null)
  const [savingsError, setSavingsError] = useState(null)
  const [showDecomposition, setShowDecomposition] = useState(false)
  const [showInternal, setShowInternal] = useState(false)

  // Dados derivados
  const totalComIva = calc?.totalComIva || 0
  const totalVenda = calc?.totalVenda || 0
  const totalCash = calc?.totalCash || 0
  const totalGeneros = calc?.totalGeneros || 0
  const totalFinanciamento = calc?.totalFinanciamento || 0
  const totalExpenses = calc?.totalExpenses || 0
  const totalExecutado = calc?.totalExecutado || 0
  const totalGasto = totalExpenses + totalExecutado
  const gap = calc?.gap ?? totalComIva
  const necessidadeCaixa = calc?.necessidadeCaixa ?? totalComIva
  const disponivel = totalComIva - totalGasto
  const subtotal = calc?.subtotal || 0
  const honorarios = calc?.honorarios || 0
  const totalIva = calc?.totalIva || 0
  const margem = calc?.margem || 0
  const margemPct = calc?.margemPct || 0

  // Burn rate
  const daysCompleted = shootingDays.filter(d => d.date && new Date(d.date) <= new Date()).length
  const totalDays = shootingDays.length
  const burnRate = daysCompleted > 0 ? totalGasto / daysCompleted : 0
  const projectedTotal = totalDays > 0 && burnRate > 0 ? burnRate * totalDays : 0

  // Géneros
  const generosByCategory = calc?.generosByCategory || {}
  const cashByCategory = calc?.cashByCategory || {}
  const hasGeneros = Object.keys(generosByCategory).length > 0

  // Dados para donut — categorias com valor > 0
  const donutData = useMemo(() => {
    if (!calc?.categorySummary) return []
    return calc.categorySummary
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((c, i) => ({
        label: c.label,
        value: c.total,
        color: CAT_COLORS[c.id - 1] || CAT_COLORS[i % CAT_COLORS.length],
        id: c.id,
        custo: c.custo,
        margem: c.margem,
        margemPct: c.margemPct,
        generos: generosByCategory[c.id] || 0,
        cashNeeded: cashByCategory[c.id] || c.total,
      }))
  }, [calc?.categorySummary, generosByCategory, cashByCategory])

  // Top categories for bar chart
  const topCats = useMemo(() => {
    return donutData.slice(0, 8)
  }, [donutData])

  const maxCatValue = topCats.length > 0 ? Math.max(...topCats.map(c => c.value)) : 0

  // Alertas por categoria
  const categoryAlerts = useMemo(() => {
    if (!calc?.categorySummary) return []
    return calc.categorySummary
      .filter(c => c.custo > 0 && c.total > 0)
      .map(c => ({ ...c, desvio: c.custo - c.total, desvioPct: ((c.custo - c.total) / c.total) * 100 }))
      .filter(c => c.desvioPct > 10)
      .sort((a, b) => b.desvioPct - a.desvioPct)
  }, [calc?.categorySummary])

  // Financing
  const financing = budget?.financing || []
  const confirmedCount = financing.filter(f => f.confirmado).length
  const pendingCount = financing.length - confirmedCount
  const confirmedTotal = calc?.confirmedTotal || 0
  const pendingTotal = calc?.pendingTotal || 0

  // Semáforo
  const healthStatus = useMemo(() => {
    if (totalComIva === 0) return { color: 'var(--text-muted)', label: 'Sem dados', icon: Heart }
    if (gap <= 0 && disponivel >= 0 && categoryAlerts.length === 0)
      return { color: 'var(--health-green)', label: 'Saudável', icon: CheckCircle }
    if (gap > 0 || disponivel < 0 || categoryAlerts.length > 2)
      return { color: 'var(--health-red)', label: 'Atenção', icon: AlertTriangle }
    return { color: 'var(--health-yellow)', label: 'Vigilância', icon: AlertTriangle }
  }, [totalComIva, gap, disponivel, categoryAlerts])

  // ── Savings API ──
  const requestSavings = async () => {
    if (!apiKey || !budget) return
    setSavingsLoading(true)
    setSavingsError(null)
    try {
      const lines = (budget.lines || []).map(l => ({
        cat: l.categoria, desc: l.descricao,
        total: l.valorUnitario * (l.quantidade || 1) * (l.dias || 1),
        custo: l.custoReal || 0,
      }))
      const text = await fetchAPI({
        apiKey,
        system: `És um director de produção audiovisual português experiente. Analisa o orçamento e sugere formas concretas de poupar dinheiro sem comprometer a qualidade.
Contexto: ${totalDays} dias de rodagem, orçamento total ${fmt(totalComIva)}, financiamento confirmado ${fmt(totalFinanciamento)}, gap ${fmt(gap)}.
Responde em JSON: { "suggestions": [{ "categoria": number, "descricao": string, "saving_estimado": number (cêntimos), "confianca": "alta"|"media"|"baixa", "risco": string }] }
Máximo 8 sugestões, ordenadas por impacto. Valores em cêntimos.`,
        messages: [{ role: 'user', content: `Linhas:\n${JSON.stringify(lines, null, 2)}\n\nFinanciamento:\n${JSON.stringify(financing.map(f => ({ nome: f.nome, tipo: f.tipo, valor: f.valor, confirmado: f.confirmado })), null, 2)}\n\nSugere savings concretos.` }],
        maxTokens: 1200,
        cache: true,
      })
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Resposta inválida')
      const parsed = JSON.parse(jsonMatch[0])
      setSavings(parsed.suggestions || [])
    } catch (e) {
      setSavingsError(e.message || 'Erro ao analisar')
    }
    setSavingsLoading(false)
  }

  const HealthIcon = healthStatus.icon
  const lines = budget?.lines || []

  return (
    <div className={styles.vgRoot}>
      {/* ── Header ── */}
      <div className={styles.vgHeader}>
        <div className={styles.vgHeaderLeft}>
          <div className={styles.vgStatusDot} style={{ background: healthStatus.color, boxShadow: `0 0 12px ${healthStatus.color}` }} />
          <div>
            <h3 className={styles.vgTitle}>Visão Geral</h3>
            <span className={styles.vgStatusLabel} style={{ color: healthStatus.color }}>
              <HealthIcon size={13} /> {healthStatus.label}
            </span>
          </div>
        </div>
        <button
          className={`${styles.toolbarBtn} ${showInternal ? styles.toolbarBtnActive : ''}`}
          onClick={() => setShowInternal(v => !v)}
        >
          {showInternal ? <EyeOff size={13} /> : <Eye size={13} />}
          {showInternal ? 'Esconder margens' : 'Ver margens'}
        </button>
      </div>

      {/* ── KPIs em linha ── */}
      <div className={styles.vgKpiRow}>
        <Kpi icon={Landmark} label="Total s/ IVA" value={fmtShort(totalVenda)}
          sub={`c/ IVA: ${fmtShort(totalComIva)}`}
          color="var(--text-primary)" />
        <Kpi icon={Landmark} label="Financiado" value={fmtShort(totalFinanciamento)}
          sub={pendingTotal > 0 ? `${fmtShort(confirmedTotal)} conf. · ${fmtShort(pendingTotal)} pend.` : `${confirmedCount} conf.`}
          color={totalFinanciamento >= totalComIva ? 'var(--health-green)' : totalFinanciamento > 0 ? 'var(--health-yellow)' : 'var(--text-muted)'} />
        <Kpi icon={Receipt} label="Gasto" value={fmtShort(totalGasto)}
          sub={daysCompleted > 0 ? `${fmt(burnRate)}/dia` : undefined}
          color={totalGasto > totalComIva ? 'var(--health-red)' : 'var(--text-primary)'} />
        <Kpi icon={gap > 0 ? TrendingDown : TrendingUp} label="GAP"
          value={gap === 0 ? 'Zero' : gap > 0 ? `- ${fmtShort(gap)}` : `+ ${fmtShort(Math.abs(gap))}`}
          color={gap === 0 ? 'var(--health-green)' : gap > 0 ? 'var(--health-red)' : 'var(--health-yellow)'} />
        {showInternal && (
          <Kpi label="Margem" value={`${margemPct.toFixed(1)}%`}
            sub={fmtShort(margem)}
            color={margem >= 0 ? 'var(--health-green)' : 'var(--health-red)'} />
        )}
      </div>

      {/* ── Donut + Legend + Bars ── */}
      {donutData.length > 0 && (
        <div className={styles.vgChartsRow}>
          {/* Donut */}
          <div className={styles.vgDonutSection}>
            <DonutChart data={donutData} size={190} thickness={28} />
          </div>

          {/* Legend + bars */}
          <div className={styles.vgBarsSection}>
            {topCats.map((cat, i) => (
              <div key={cat.id} className={styles.vgCatRow}>
                <div className={styles.vgCatDot} style={{ background: cat.color }} />
                <span className={styles.vgCatLabel}>{String(cat.id).padStart(2, '0')} {cat.label}</span>
                <div className={styles.vgCatBarWrap}>
                  <motion.div
                    className={styles.vgCatBar}
                    style={{ background: cat.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(cat.value / maxCatValue) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04 }}
                  />
                </div>
                <span className={styles.vgCatValue}>{fmtShort(cat.value)}</span>
                {showInternal && (
                  <span className={styles.vgCatMargin} style={{ color: cat.margemPct > 0 ? 'var(--health-green)' : 'var(--text-muted)' }}>
                    {cat.margemPct > 0 ? `${cat.margemPct.toFixed(0)}%` : '—'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Progress bars ── */}
      <div className={styles.vgProgressSection}>
        <HBar label={`Financiamento vs Orçamento s/ IVA (${fmtShort(totalVenda)})`} value={totalFinanciamento} maxValue={totalVenda}
          color={totalFinanciamento >= totalVenda ? 'var(--health-green)' : 'var(--health-yellow)'}
          sub={`${Math.round((totalFinanciamento / (totalVenda || 1)) * 100)}% s/ IVA · ${Math.round((totalFinanciamento / (totalComIva || 1)) * 100)}% c/ IVA`} />
        <HBar label="Execução" value={totalGasto} maxValue={totalComIva}
          color={totalGasto > totalComIva * 0.9 ? 'var(--health-red)' : totalGasto > totalComIva * 0.7 ? 'var(--health-yellow)' : 'var(--health-green)'}
          sub={disponivel >= 0 ? `${fmtShort(disponivel)} disponível` : `${fmtShort(Math.abs(disponivel))} acima`} />
        {projectedTotal > 0 && (
          <HBar label="Projecção" value={projectedTotal} maxValue={totalComIva}
            color={projectedTotal > totalComIva ? 'var(--health-red)' : 'var(--health-green)'}
            sub={`${fmtShort(projectedTotal)} estimado (${daysCompleted}/${totalDays} dias)`} />
        )}
      </div>

      {/* ── Decomposição (colapsável) ── */}
      <div className={styles.vgDecompSection}>
        <button className={styles.vgDecompToggle} onClick={() => setShowDecomposition(v => !v)}>
          {showDecomposition ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          Decomposição do orçamento
        </button>
        <AnimatePresence>
          {showDecomposition && (
            <motion.div
              className={styles.vgDecompBody}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div className={styles.vgDecompRow}>
                <span>Subtotal s/ IVA</span><span>{fmt(subtotal)}</span>
              </div>
              {honorarios > 0 && (
                <div className={styles.vgDecompRow}>
                  <span>Honorários produtora</span><span>{fmt(honorarios)}</span>
                </div>
              )}
              <div className={styles.vgDecompRow} style={{ fontWeight: 600 }}>
                <span>Total s/ IVA</span><span>{fmt(totalVenda)}</span>
              </div>
              <div className={styles.vgDecompRow}>
                <span>IVA</span><span>{fmt(totalIva)}</span>
              </div>
              <div className={styles.vgDecompRow} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                <span>Total c/ IVA</span><span>{fmt(totalComIva)}</span>
              </div>
              <div className={styles.vgDecompDivider} />
              <div className={styles.vgDecompRow}>
                <span>Cash</span>
                <span style={{ color: 'var(--health-green)' }}>- {fmt(totalCash)}</span>
              </div>
              <div className={styles.vgDecompRow}>
                <span>Em géneros</span>
                <span style={{ color: 'var(--accent)' }}>- {fmt(totalGeneros)}</span>
              </div>
              {pendingTotal > 0 && (
                <div className={styles.vgDecompRow} style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>({fmtShort(confirmedTotal)} confirmado · {fmtShort(pendingTotal)} pendente)</span>
                  <span />
                </div>
              )}
              <div className={styles.vgDecompDivider} />
              <div className={styles.vgDecompRow} style={{ fontWeight: 800 }}>
                <span>Necessidade de caixa</span>
                <span style={{ color: necessidadeCaixa > 0 ? 'var(--health-yellow)' : 'var(--health-green)' }}>
                  {fmt(necessidadeCaixa)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mapa de Caixa (géneros vs cash) ── */}
      {hasGeneros && (
        <CashMap
          categorySummary={calc?.categorySummary || []}
          generosByCategory={generosByCategory}
          cashByCategory={cashByCategory}
          totalVenda={totalVenda}
          totalGeneros={totalGeneros}
        />
      )}

      {/* ── Alertas ── */}
      {categoryAlerts.length > 0 && (
        <div className={styles.vgAlerts}>
          <h4 className={styles.vgAlertsTitle}>
            <AlertTriangle size={14} color="var(--health-yellow)" />
            Categorias com desvio (&gt;10%)
          </h4>
          {categoryAlerts.map(c => (
            <div key={c.id} className={styles.vgAlertRow}>
              <span className={styles.vgAlertCat}>{String(c.id).padStart(2, '0')} {c.label}</span>
              <span className={styles.vgAlertDetail}>Custo {fmt(c.custo)} vs {fmt(c.total)}</span>
              <span style={{ color: c.desvioPct > 20 ? 'var(--health-red)' : 'var(--health-yellow)', fontWeight: 700 }}>
                +{Math.round(c.desvioPct)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Savings IA ── */}
      <div className={styles.vgSavings}>
        <div className={styles.vgSavingsHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="var(--accent)" />
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Análise de Savings</h4>
          </div>
          <button className={styles.btnAdd} onClick={requestSavings} disabled={savingsLoading || !apiKey}>
            {savingsLoading
              ? <><Loader size={13} className={styles.spinIcon} /> A analisar...</>
              : <><Zap size={13} /> {savings ? 'Re-analisar' : 'Analisar'}</>}
          </button>
        </div>

        {savingsError && <div className={styles.chatError}>{savingsError}</div>}

        <AnimatePresence>
          {savings && savings.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              {savings.map((s, i) => {
                const cat = CATEGORIAS.find(c => c.id === s.categoria)
                const confColor = s.confianca === 'alta' ? 'var(--health-green)' : s.confianca === 'media' ? 'var(--health-yellow)' : 'var(--text-muted)'
                return (
                  <div key={i} className={styles.vgSavingItem}>
                    <div className={styles.vgSavingTop}>
                      {cat && <span className={styles.vgSavingCat}>{String(cat.id).padStart(2, '0')} {cat.label}</span>}
                      <span style={{ color: 'var(--health-green)', fontWeight: 700 }}>- {fmt(s.saving_estimado)}</span>
                      <span style={{ color: confColor, fontSize: 10 }}>{s.confianca}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{s.descricao}</p>
                    {s.risco && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--health-yellow)' }}>{s.risco}</p>}
                  </div>
                )
              })}
              <div className={styles.vgSavingsTotal}>
                <span>Poupança potencial</span>
                <span style={{ color: 'var(--health-green)', fontWeight: 800 }}>
                  {fmt(savings.reduce((sum, s) => sum + (s.saving_estimado || 0), 0))}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {savings && savings.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>Orçamento parece optimizado.</p>
        )}
      </div>
    </div>
  )
}
