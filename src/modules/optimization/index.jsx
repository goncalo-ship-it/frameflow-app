// Optimização — análise de riscos · sugestões de orçamento · simulador de crise
// Usa dados reais do store: cenas, locais, equipa, schedule

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, CheckCircle, TrendingDown, Zap, RefreshCw,
  MapPin, Users, Film, Calendar, Clock, Euro, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import ProgressModule from '../progress/index.jsx'
import styles from './Optimization.module.css'

const DAY_CAPACITY = 570

// ── Tipos de risco ────────────────────────────────────────────────
const RISK_LEVELS = {
  critical: { label: 'Crítico',   color: '#F87171', bg: 'rgba(248,113,113,0.08)' },
  high:     { label: 'Alto',      color: '#F5A623', bg: 'rgba(245,166,35,0.08)'  },
  medium:   { label: 'Médio',     color: 'var(--health-yellow)', bg: 'rgba(245,196,35,0.08)' },
  low:      { label: 'Baixo',     color: 'var(--health-green)', bg: 'rgba(46,160,128,0.08)' },
}

// ── Motor de análise de riscos ────────────────────────────────────
function analyzeRisks(store) {
  const { parsedScripts, locations, team, shootingDays, sceneAssignments, preProduction, projectParams } = store
  const risks = []

  const allScenes = Object.entries(parsedScripts).flatMap(([epId, data]) =>
    (data.scenes || []).map(sc => ({ ...sc, epId, key: `${epId}-${sc.sceneNumber}` }))
  )

  // ── Locais ────────────────────────────────────────────────────
  const confirmedLocations = locations.filter(l => l.status === 'confirmado')
  const refusedLocations   = locations.filter(l => l.status === 'recusado')
  const pendingLocations   = locations.filter(l => l.status === 'autorização pendente')
  const unidentified       = locations.filter(l => l.status === 'por identificar')

  if (refusedLocations.length > 0) {
    risks.push({
      id: 'loc-refused', level: 'critical',
      category: 'Locais',
      title: `${refusedLocations.length} local(is) recusado(s)`,
      description: `${refusedLocations.map(l => l.displayName || l.name).join(', ')} estão recusados. Cenas atribuídas a estes locais ficam sem local.`,
      action: 'Encontrar alternativas e reatribuir cenas afectadas.',
    })
  }

  if (pendingLocations.length > 2) {
    risks.push({
      id: 'loc-pending', level: 'high',
      category: 'Locais',
      title: `${pendingLocations.length} autorizações pendentes`,
      description: `${pendingLocations.map(l => l.displayName || l.name).join(', ')} ainda aguardam autorização.`,
      action: 'Agilizar pedidos de autorização. Identificar alternativas como backup.',
    })
  }

  if (unidentified.length > 3) {
    risks.push({
      id: 'loc-unidentified', level: 'medium',
      category: 'Locais',
      title: `${unidentified.length} locais por identificar`,
      description: 'Vários locais dos guiões ainda não têm morada ou contacto definido.',
      action: 'Fazer recce e preencher dados antes do início da rodagem.',
    })
  }

  // ── Schedule ────────────────────────────────────────────────
  const unassignedScenes = allScenes.filter(sc => !sceneAssignments[sc.key])
  if (unassignedScenes.length > 0 && shootingDays.length > 0) {
    risks.push({
      id: 'schedule-unassigned', level: unassignedScenes.length > 10 ? 'critical' : 'high',
      category: 'Schedule',
      title: `${unassignedScenes.length} cenas sem dia atribuído`,
      description: `${unassignedScenes.length} cenas ainda não têm dia de rodagem.`,
      action: 'Atribuir todas as cenas a dias no módulo Produção → Strip Board.',
    })
  }

  if (allScenes.length > 0 && shootingDays.length === 0) {
    risks.push({
      id: 'schedule-nodays', level: 'critical',
      category: 'Schedule',
      title: 'Nenhum dia de rodagem definido',
      description: `${allScenes.length} cenas existem mas não há nenhum dia de rodagem criado.`,
      action: 'Ir a Produção → Strip Board e adicionar os dias de rodagem.',
    })
  }

  // Verificar dias sobrecarregados (>95% utilização)
  const overloadedDays = shootingDays.filter(day => {
    const dayScenes = allScenes.filter(sc => sceneAssignments[sc.key] === day.id)
    const totalMin = dayScenes.reduce((s, sc) => {
      const chars = (sc.characters || []).length
      const dur = chars >= 4 ? 75 : chars === 3 ? 50 : chars === 2 ? 45 : 30
      return s + dur
    }, 0)
    return (totalMin / DAY_CAPACITY) > 0.95
  })

  if (overloadedDays.length > 0) {
    risks.push({
      id: 'schedule-overload', level: 'high',
      category: 'Schedule',
      title: `${overloadedDays.length} dia(s) sobrecarregado(s)`,
      description: `Os dias ${overloadedDays.map(d => `D${d.dayNumber}`).join(', ')} têm >95% de utilização. Risco de atraso.`,
      action: 'Redistribuir cenas ou adicionar mais um dia de rodagem.',
    })
  }

  // ── Equipa ────────────────────────────────────────────────
  const castingStatuses = preProduction?.castingStatus || {}
  const uncasted = Object.entries(castingStatuses).filter(([, s]) => s === 'a contactar' || s === 'em audição')
  if (uncasted.length > 2) {
    risks.push({
      id: 'casting-pending', level: 'high',
      category: 'Casting',
      title: `${uncasted.length} personagens sem actor confirmado`,
      description: `${uncasted.slice(0,5).map(([n]) => n).join(', ')} ainda não têm actor contratado.`,
      action: 'Acelerar processo de casting. Preparar actores substitutos.',
    })
  }

  const noPhone = team.filter(m => !m.phone && !m.email)
  if (noPhone.length > 0) {
    risks.push({
      id: 'team-contacts', level: 'medium',
      category: 'Equipa',
      title: `${noPhone.length} pessoas sem contacto`,
      description: `${noPhone.slice(0,5).map(m => m.name).join(', ')} não têm telefone nem email registado.`,
      action: 'Completar contactos de toda a equipa antes do início da rodagem.',
    })
  }

  const noRole = team.filter(m => !m.role)
  if (noRole.length > 3) {
    risks.push({
      id: 'team-roles', level: 'low',
      category: 'Equipa',
      title: `${noRole.length} pessoas sem função definida`,
      description: 'Funções por definir na equipa.',
      action: 'Atribuir funções claras a toda a equipa.',
    })
  }

  // ── Guiões ────────────────────────────────────────────────
  const totalEps = parseInt(projectParams?.episodes || '0', 10)
  const loadedEps = Object.keys(parsedScripts).length
  if (totalEps > 0 && loadedEps < totalEps) {
    risks.push({
      id: 'scripts-missing', level: totalEps - loadedEps > 2 ? 'high' : 'medium',
      category: 'Guiões',
      title: `${totalEps - loadedEps} guiões em falta`,
      description: `Definiste ${totalEps} episódios mas só carregaste ${loadedEps}.`,
      action: 'Carregar os guiões em falta em Análise de Guião.',
    })
  }

  // ── Exterior sem horário golden ───────────────────────────
  const extScenes = allScenes.filter(sc => sc.intExt === 'EXT' || (sc.location || '').startsWith('EXT'))
  const goldenDays = shootingDays.filter(d => {
    const dayScenes = allScenes.filter(sc => sceneAssignments[sc.key] === d.id && (sc.intExt === 'EXT'))
    return dayScenes.length > 3
  })
  if (extScenes.length > 0 && goldenDays.length > 0) {
    risks.push({
      id: 'golden-hour', level: 'medium',
      category: 'Schedule',
      title: `${goldenDays.length} dias com muitos exteriores`,
      description: 'Dias com 4+ cenas de exterior — risco de falta de luz no fim do dia.',
      action: 'Planear exteriores para manhã cedo. Reservar golden hour (19h30) para cenas especiais.',
    })
  }

  return risks.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    return order[a.level] - order[b.level]
  })
}

// ── Sugestões de optimização ──────────────────────────────────────
function generateSuggestions(store) {
  const { parsedScripts, locations, team, shootingDays, sceneAssignments } = store
  const suggestions = []

  const allScenes = Object.entries(parsedScripts).flatMap(([epId, data]) =>
    (data.scenes || []).map(sc => ({ ...sc, epId, key: `${epId}-${sc.sceneNumber}` }))
  )

  // Agrupar cenas por local para minimizar deslocações
  const locationGroups = {}
  allScenes.forEach(sc => {
    const loc = sc.location || 'SEM LOCAL'
    if (!locationGroups[loc]) locationGroups[loc] = []
    locationGroups[loc].push(sc)
  })

  const multiDayLocations = Object.entries(locationGroups)
    .filter(([, scenes]) => {
      const days = new Set(scenes.map(sc => sceneAssignments[sc.key]).filter(Boolean))
      return days.size > 1
    })

  if (multiDayLocations.length > 0) {
    suggestions.push({
      id: 'loc-consolidate',
      icon: MapPin,
      category: 'Schedule',
      title: 'Consolidar deslocações',
      description: `${multiDayLocations.length} locais têm cenas em dias diferentes. Agrupar todas as cenas do mesmo local no mesmo dia poupa tempo e custo.`,
      saving: 'Estimativa: -15% tempo de produção',
    })
  }

  // Cenas de 1 personagem que podem ser agrupadas
  const soloScenes = allScenes.filter(sc => (sc.characters || []).length === 1)
  if (soloScenes.length > 5) {
    const singleActors = [...new Set(soloScenes.map(sc => sc.characters?.[0]).filter(Boolean))]
    suggestions.push({
      id: 'solo-group',
      icon: Users,
      category: 'Casting',
      title: 'Agrupar cenas solo por actor',
      description: `${soloScenes.length} cenas solo identificadas. Agrupar todas as cenas de cada actor minimiza cachês diários desnecessários.`,
      saving: `${singleActors.length} actores em causa`,
    })
  }

  // Dias com poucos minutos de rodagem
  if (shootingDays.length > 0) {
    const lightDays = shootingDays.filter(day => {
      const dayScenes = allScenes.filter(sc => sceneAssignments[sc.key] === day.id)
      const totalMin = dayScenes.reduce((s, sc) => {
        const chars = (sc.characters || []).length
        return s + (chars >= 4 ? 75 : chars === 3 ? 50 : chars === 2 ? 45 : 30)
      }, 0)
      return dayScenes.length > 0 && (totalMin / DAY_CAPACITY) < 0.5
    })

    if (lightDays.length > 0) {
      suggestions.push({
        id: 'light-days',
        icon: Calendar,
        category: 'Schedule',
        title: `${lightDays.length} dias abaixo de 50% de utilização`,
        description: `Os dias ${lightDays.map(d => `D${d.dayNumber}`).join(', ')} têm pouco volume de rodagem. Podem ser combinados ou usados para picks de outros dias.`,
        saving: 'Potencial eliminação de 1+ dia de rodagem',
      })
    }
  }

  // Equipa sem cachê
  const teamWithoutRate = team.filter(m => !m.cacheDiario && m.group !== 'Elenco')
  if (teamWithoutRate.length > 5) {
    suggestions.push({
      id: 'team-rates',
      icon: Euro,
      category: 'Orçamento',
      title: 'Faltam cachês diários da equipa',
      description: `${teamWithoutRate.length} membros da equipa sem cachê diário definido. Impossível calcular custos reais.`,
      saving: 'Necessário para orçamentação precisa',
    })
  }

  return suggestions
}

// ── Mapa de categoria → módulo destino ───────────────────────────
const RISK_MODULE_MAP = {
  'Locais': 'locations',
  'Schedule': 'production',
  'Casting': 'team',
  'Equipa': 'team',
  'Guiões': 'script',
  'Orçamento': 'budget',
}

const SUGG_MODULE_MAP = {
  'Schedule': 'production',
  'Casting': 'team',
  'Orçamento': 'budget',
}

// ── Card de risco ─────────────────────────────────────────────────
function RiskCard({ risk, navigate }) {
  const [open, setOpen] = useState(false)
  const rl = RISK_LEVELS[risk.level] || RISK_LEVELS.low
  const targetModule = RISK_MODULE_MAP[risk.category]
  return (
    <motion.div className={styles.riskCard} style={{ background: rl.bg || 'transparent', borderColor: (rl.color || '#888') + '33' }}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className={styles.riskTop} onClick={() => setOpen(!open)}>
        <div className={styles.riskLeft}>
          <AlertTriangle size={15} color={rl.color} />
          <div>
            <span className={styles.riskTitle}>{risk.title}</span>
            <span className={styles.riskCat}>{risk.category}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={styles.riskLevel} style={{ color: rl.color, borderColor: rl.color + '44', background: rl.color + '11' }}>
            {rl.label}
          </span>
          {open ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className={styles.riskDetail}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <p className={styles.riskDesc}>{risk.description}</p>
            <div className={styles.riskAction}>
              <CheckCircle size={12} color="var(--health-green)" />
              <span>{risk.action}</span>
            </div>
            {targetModule && navigate && (
              <button onClick={() => navigate(targetModule)} style={{
                marginTop: 8, padding: '6px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                color: 'var(--accent-light)', cursor: 'pointer', fontSize: 'var(--text-sm)',
                fontWeight: 500,
              }}>
                Resolver em {risk.category} →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Card de sugestão ──────────────────────────────────────────────
function SuggestionCard({ s, navigate }) {
  const Icon = s.icon
  const targetModule = SUGG_MODULE_MAP[s.category]
  return (
    <motion.div className={styles.suggCard}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className={styles.suggIcon}><Icon size={18} color="var(--mod-optimization, #27AE60)" /></div>
      <div className={styles.suggBody}>
        <div className={styles.suggTop}>
          <span className={styles.suggTitle}>{s.title}</span>
          <span className={styles.suggCat}>{s.category}</span>
        </div>
        <p className={styles.suggDesc}>{s.description}</p>
        {s.saving && (
          <div className={styles.suggSaving}><TrendingDown size={11} /> {s.saving}</div>
        )}
        {targetModule && navigate && (
          <button onClick={() => navigate(targetModule)} style={{
            marginTop: 8, padding: '6px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--accent-dim)', border: '1px solid var(--accent)',
            color: 'var(--accent-light)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 500,
          }}>
            Ver {s.category} →
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Módulo principal ──────────────────────────────────────────────
export function OptimizationModule({ initialTab }) {
  const store = useStore(useShallow(s => ({
    projectName: s.projectName, parsedScripts: s.parsedScripts, team: s.team,
    locations: s.locations, shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments,
    preProduction: s.preProduction, projectParams: s.projectParams, navigate: s.navigate,
  })))
  const { projectName, parsedScripts, team, locations, shootingDays, sceneAssignments } = store
  const navigate = store.navigate

  const risks = useMemo(() => analyzeRisks(store), [parsedScripts, locations, team, shootingDays, sceneAssignments, store.preProduction])
  const suggestions = useMemo(() => generateSuggestions(store), [parsedScripts, locations, team, shootingDays, sceneAssignments])

  const criticalCount = risks.filter(r => r.level === 'critical').length
  const highCount     = risks.filter(r => r.level === 'high').length
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState(initialTab === 'progress' ? 'progress' : 'optimization')

  const visibleRisks = filter === 'all' ? risks : risks.filter(r => r.level === filter)

  const allScenes = Object.values(parsedScripts).reduce((s, d) => s + (d.scenes?.length || 0), 0)
  const assigned  = Object.keys(sceneAssignments).length
  const readiness = allScenes > 0
    ? Math.round(
        (locations.filter(l => l.status === 'confirmado').length / Math.max(1, locations.length) * 30) +
        (team.filter(m => m.phone || m.email).length / Math.max(1, team.length) * 30) +
        (Math.min(assigned, allScenes) / Math.max(1, allScenes) * 40)
      )
    : 0

  // ── Progress sub-view ──
  if (view === 'progress') {
    return (
      <div className={styles.root}>
        <div style={{ display: 'flex', gap: 4, padding: '12px 20px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setView('optimization')}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none', borderBottom: '2px solid transparent',
              color: 'var(--text-muted)',
            }}
          >
            <Zap size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Riscos & Sugestões
          </button>
          <button
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none', borderBottom: '2px solid var(--accent)',
              color: 'var(--accent)',
            }}
          >
            <RefreshCw size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Progresso
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <ProgressModule />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 20px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'none', border: 'none', borderBottom: '2px solid var(--accent)',
            color: 'var(--accent)',
          }}
        >
          <Zap size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Riscos & Sugestões
        </button>
        <button
          onClick={() => setView('progress')}
          style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'none', border: 'none', borderBottom: '2px solid transparent',
            color: 'var(--text-muted)',
          }}
        >
          <RefreshCw size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Progresso
        </button>
      </div>

      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Optimização</h2>
          <p className={styles.sub}>{projectName} · {risks.length} riscos identificados · {suggestions.length} sugestões</p>
        </div>
        {/* Readiness score */}
        <div className={styles.readinessWrap}>
          <div className={styles.readinessCircle} style={{ '--pct': readiness }}>
            <span className={styles.readinessPct}>{readiness}%</span>
            <span className={styles.readinessLabel}>prontos</span>
          </div>
          {criticalCount > 0 && (
            <div className={styles.alertBadge} style={{ background: '#F8717122', color: '#F87171', borderColor: '#F8717144' }}>
              <AlertTriangle size={12} /> {criticalCount} críticos
            </div>
          )}
        </div>
      </div>

      <div className={styles.body}>
        {/* ── Riscos ── */}
        <div className={styles.column}>
          <div className={styles.colHeader}>
            <span className={styles.colTitle}>Análise de Riscos</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['all','critical','high','medium','low'].map(l => (
                <button key={l}
                  className={`${styles.filterPill} ${filter === l ? styles.filterPillActive : ''}`}
                  onClick={() => setFilter(l)}>
                  {l === 'all' ? 'Todos' : RISK_LEVELS[l]?.label || l}
                </button>
              ))}
            </div>
          </div>

          {visibleRisks.length === 0 && (
            <div className={styles.allGood}>
              <CheckCircle size={32} color="var(--health-green)" />
              <p>{filter === 'all' ? 'Nenhum risco detectado!' : 'Nenhum risco neste nível.'}</p>
            </div>
          )}

          <div className={styles.riskList}>
            {visibleRisks.map(risk => <RiskCard key={risk.id} risk={risk} navigate={navigate} />)}
          </div>
        </div>

        {/* ── Sugestões ── */}
        <div className={styles.column}>
          <div className={styles.colHeader}>
            <span className={styles.colTitle}>Sugestões de Optimização</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{suggestions.length} encontradas</span>
          </div>

          {suggestions.length === 0 && (
            <div className={styles.allGood}>
              <Zap size={28} color="var(--text-muted)" />
              <p>Carrega guiões, equipa e locais para ver sugestões.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => navigate('script')} style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                  color: 'var(--accent-light)', cursor: 'pointer', fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                }}>
                  Guiões →
                </button>
                <button onClick={() => navigate('production')} style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                  color: 'var(--accent-light)', cursor: 'pointer', fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                }}>
                  Produção →
                </button>
              </div>
            </div>
          )}

          <div className={styles.suggList}>
            {suggestions.map(s => <SuggestionCard key={s.id} s={s} navigate={navigate} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
