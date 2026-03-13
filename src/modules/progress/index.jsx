// Progress — Progresso da producao & analiticas
// KPIs · Progresso por episodio · Aderencia ao plano · Riscos

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Film, Calendar, CheckCircle, AlertTriangle,
  Clock, TrendingUp, Target, Layers, Shield,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '../../core/i18n/index.js'
import s from './Progress.module.css'

// ── Helpers ─────────────────────────────────────────────────────
function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0 }
function barColor(v) { return v >= 80 ? 'var(--health-green)' : v >= 50 ? 'var(--health-yellow)' : 'var(--health-red)' }

export default function ProgressModule() {
  const { t } = useI18n()
  const {
    shootingDays, sceneAssignments, sceneTakes, parsedScripts,
    departmentConfig, departmentItems,
  } = useStore(useShallow(st => ({
    shootingDays: st.shootingDays,
    sceneAssignments: st.sceneAssignments,
    sceneTakes: st.sceneTakes,
    parsedScripts: st.parsedScripts,
    departmentConfig: st.departmentConfig,
    departmentItems: st.departmentItems,
  })))

  const [tab, setTab] = useState('overview')

  // ── Derived data ─────────────────────────────────────────────
  const allScenes = useMemo(() => {
    return Object.entries(parsedScripts).flatMap(([epId, data]) =>
      (data.scenes || []).map(sc => ({
        ...sc, epId,
        key: `${epId}-${sc.sceneNumber || sc.id}`,
      }))
    )
  }, [parsedScripts])

  const episodes = useMemo(() => Object.keys(parsedScripts), [parsedScripts])

  const assignedCount = useMemo(() => Object.keys(sceneAssignments).length, [sceneAssignments])

  const filmedScenes = useMemo(() => {
    return Object.entries(sceneTakes).filter(([, takes]) =>
      takes.some(t => t.status === 'BOM')
    ).length
  }, [sceneTakes])

  const totalTakes = useMemo(() => {
    return Object.values(sceneTakes).reduce((sum, takes) => sum + takes.length, 0)
  }, [sceneTakes])

  const daysUsed = useMemo(() => {
    return shootingDays.filter(d => {
      const dayScenes = Object.entries(sceneAssignments).filter(([, did]) => did === d.id)
      return dayScenes.some(([key]) => sceneTakes[key]?.length > 0)
    }).length
  }, [shootingDays, sceneAssignments, sceneTakes])

  const totalScenes = allScenes.length
  const overallPct = pct(filmedScenes, totalScenes)
  const assignPct = pct(assignedCount, totalScenes)
  const daysPct = pct(daysUsed, shootingDays.length)

  // Per-episode stats
  const episodeStats = useMemo(() => {
    return episodes.map(epId => {
      const epScenes = allScenes.filter(sc => sc.epId === epId)
      const epFilmed = epScenes.filter(sc => {
        const takes = sceneTakes[sc.key] || []
        return takes.some(t => t.status === 'BOM')
      }).length
      const epAssigned = epScenes.filter(sc => sceneAssignments[sc.key]).length
      return { epId, total: epScenes.length, filmed: epFilmed, assigned: epAssigned }
    })
  }, [episodes, allScenes, sceneTakes, sceneAssignments])

  // Department readiness
  const deptReadiness = useMemo(() => {
    return (departmentConfig || []).map(dept => {
      const items = (departmentItems || []).filter(it => it.department === dept.id)
      const approved = items.filter(it => it.status === 'approved').length
      return { ...dept, total: items.length, approved, pct: pct(approved, items.length) }
    }).filter(d => d.total > 0)
  }, [departmentConfig, departmentItems])

  // Risks
  const risks = useMemo(() => {
    const list = []
    if (totalScenes > 0 && assignPct < 50) {
      list.push({ level: 'high', text: t('progress.riskAssignLow', { pct: assignPct }) })
    }
    if (shootingDays.length > 0 && daysPct > 80 && overallPct < 60) {
      list.push({ level: 'critical', text: t('progress.riskDaysVsFilmed', { daysPct, filmedPct: overallPct }) })
    }
    const unassignedScenes = totalScenes - assignedCount
    if (unassignedScenes > 10) {
      list.push({ level: 'medium', text: t('progress.riskUnassigned', { count: unassignedScenes }) })
    }
    deptReadiness.forEach(d => {
      if (d.pct < 30 && d.total > 2) {
        list.push({ level: 'medium', text: t('progress.riskDeptLow', { dept: d.label || d.id, pct: d.pct }) })
      }
    })
    if (list.length === 0) {
      list.push({ level: 'ok', text: t('progress.noRisks') })
    }
    return list
  }, [totalScenes, assignPct, shootingDays, daysPct, overallPct, assignedCount, deptReadiness, t])

  const TABS = [
    { id: 'overview', label: t('progress.tabOverview'), icon: BarChart3 },
    { id: 'episodes', label: t('progress.tabEpisodes'), icon: Film },
    { id: 'departments', label: t('progress.tabDepartments'), icon: Layers },
    { id: 'risks', label: t('progress.tabRisks'), icon: AlertTriangle },
  ]

  // ── Empty state ──
  if (totalScenes === 0 && shootingDays.length === 0) {
    return (
      <div className={s.root}>
        <div className={s.header}>
          <div><div className={s.title}>{t('progress.title')}</div><div className={s.sub}>{t('progress.sub')}</div></div>
        </div>
        <div className={s.content}>
          <div className={s.empty}>
            <BarChart3 size={48} className={s.emptyIcon} />
            <div className={s.emptyText}>{t('progress.emptyTitle')}</div>
            <div className={s.emptyHint}>{t('progress.emptyHint')}</div>
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
          <div className={s.title}><TrendingUp size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />{t('progress.title')}</div>
          <div className={s.sub}>{t('progress.headerSub', { scenes: totalScenes, days: shootingDays.length, takes: totalTakes })}</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={s.tabs}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} className={tab === t.id ? s.tabActive : s.tab} onClick={() => setTab(t.id)}>
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      <div className={s.content}>
        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div className={s.overviewGrid}>
            {/* KPI Cards */}
            <div className={s.kpiRow}>
              <div className={s.kpiCard}>
                <div className={s.kpiLabel}>{t('progress.scenesFilmed')}</div>
                <div className={s.kpiValue}>{filmedScenes} / {totalScenes}</div>
                <div className={s.progressBar}>
                  <div className={s.progressFill} style={{ width: `${overallPct}%`, background: barColor(overallPct) }} />
                </div>
                <div className={s.kpiPct} style={{ color: barColor(overallPct) }}>{overallPct}%</div>
              </div>

              <div className={s.kpiCard}>
                <div className={s.kpiLabel}>{t('progress.scenesAssigned')}</div>
                <div className={s.kpiValue}>{assignedCount} / {totalScenes}</div>
                <div className={s.progressBar}>
                  <div className={s.progressFill} style={{ width: `${assignPct}%`, background: barColor(assignPct) }} />
                </div>
                <div className={s.kpiPct} style={{ color: barColor(assignPct) }}>{assignPct}%</div>
              </div>

              <div className={s.kpiCard}>
                <div className={s.kpiLabel}>{t('progress.daysUsed')}</div>
                <div className={s.kpiValue}>{daysUsed} / {shootingDays.length}</div>
                <div className={s.progressBar}>
                  <div className={s.progressFill} style={{ width: `${daysPct}%`, background: barColor(daysPct) }} />
                </div>
                <div className={s.kpiPct} style={{ color: barColor(daysPct) }}>{daysPct}%</div>
              </div>

              <div className={s.kpiCard}>
                <div className={s.kpiLabel}>{t('progress.totalTakes')}</div>
                <div className={s.kpiValue}>{totalTakes}</div>
                <div className={s.kpiMeta}>{filmedScenes > 0 ? t('progress.perScene', { avg: Math.round(totalTakes / filmedScenes) }) : '—'}</div>
              </div>
            </div>

            {/* Schedule chart */}
            <div className={s.section}>
              <div className={s.sectionTitle}><Calendar size={16} /> {t('progress.progressByDay')}</div>
              <div className={s.chartArea}>
                {shootingDays.map((day, i) => {
                  const dayScenes = Object.entries(sceneAssignments).filter(([, did]) => did === day.id)
                  const dayFilmed = dayScenes.filter(([key]) => (sceneTakes[key] || []).some(t => t.status === 'BOM')).length
                  const dayPct = pct(dayFilmed, dayScenes.length)
                  return (
                    <div key={day.id} className={s.chartBar}>
                      <div className={s.chartBarInner} style={{ height: `${Math.max(dayPct, 4)}%`, background: barColor(dayPct) }} />
                      <div className={s.chartBarLabel}>{day.label || `D${i + 1}`}</div>
                      <div className={s.chartBarValue}>{dayFilmed}/{dayScenes.length}</div>
                    </div>
                  )
                })}
                {shootingDays.length === 0 && <div className={s.emptyHint}>{t('progress.noShootingDays')}</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── Episodes ── */}
        {tab === 'episodes' && (
          <div className={s.episodeList}>
            {episodeStats.map(ep => {
              const epPct = pct(ep.filmed, ep.total)
              return (
                <div key={ep.epId} className={s.episodeCard}>
                  <div className={s.episodeHeader}>
                    <Film size={16} />
                    <span className={s.episodeName}>{ep.epId}</span>
                    <span className={s.episodePct} style={{ color: barColor(epPct) }}>{epPct}%</span>
                  </div>
                  <div className={s.progressBar}>
                    <div className={s.progressFill} style={{ width: `${epPct}%`, background: barColor(epPct) }} />
                  </div>
                  <div className={s.episodeMeta}>
                    <span><CheckCircle size={12} /> {ep.filmed} {t('progress.filmed')}</span>
                    <span><Target size={12} /> {ep.assigned} {t('progress.assigned')}</span>
                    <span><Film size={12} /> {ep.total} {t('progress.total')}</span>
                  </div>
                </div>
              )
            })}
            {episodeStats.length === 0 && (
              <div className={s.empty}>
                <Film size={40} className={s.emptyIcon} />
                <div className={s.emptyText}>{t('progress.noEpisodes')}</div>
              </div>
            )}
          </div>
        )}

        {/* ── Departments ── */}
        {tab === 'departments' && (
          <div className={s.deptGrid}>
            {deptReadiness.map(dept => (
              <div key={dept.id} className={s.deptCard}>
                <div className={s.deptName}>{dept.label || dept.id}</div>
                <div className={s.deptCount}>{dept.approved} / {dept.total} {t('progress.approved')}</div>
                <div className={s.progressBar}>
                  <div className={s.progressFill} style={{ width: `${dept.pct}%`, background: barColor(dept.pct) }} />
                </div>
                <div className={s.deptPct} style={{ color: barColor(dept.pct) }}>{dept.pct}%</div>
              </div>
            ))}
            {deptReadiness.length === 0 && (
              <div className={s.empty}>
                <Layers size={40} className={s.emptyIcon} />
                <div className={s.emptyText}>{t('progress.noDeptItems')}</div>
                <div className={s.emptyHint}>{t('progress.noDeptItemsHint')}</div>
              </div>
            )}
          </div>
        )}

        {/* ── Risks ── */}
        {tab === 'risks' && (
          <div className={s.riskList}>
            {risks.map((risk, i) => (
              <motion.div
                key={i}
                className={`${s.riskCard} ${s[`risk_${risk.level}`] || ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {risk.level === 'ok' ? <Shield size={18} /> : <AlertTriangle size={18} />}
                <span>{risk.text}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export { ProgressModule }
