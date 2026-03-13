// Schedule Module — orquestrador principal (v2)
// Tabs: Calendário · Timeline · Tabela · Locais · Actores · Cenas s/ dia
// Header: ModeToggle · CrisisSimulator colapsável
// Novo: painel de oportunidades detectadas pelo engine
// Guard: se não há dias → ScheduleSetup

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, Users, AlertTriangle, Save, Plus,
  Table2, MapPin, Lightbulb, ChevronDown, ChevronUp,
  Layers, Star, DollarSign, X, Download, ArrowLeft,
} from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { SPRING } from '../../../core/design.js'
import { useShallow } from 'zustand/react/shallow'
import { useScheduleEngine } from './hooks/useScheduleEngine.js'
import { exportScheduleCSV } from './utils/scheduleExport.js'
import { ScheduleSetup }    from './components/ScheduleSetup.jsx'
import { CalendarView }     from './components/CalendarView.jsx'
import { TimelineView }     from './components/TimelineView.jsx'
import { TableView }        from './components/TableView.jsx'
import { LocationView }     from './components/LocationView.jsx'
import { ActorView }        from './components/ActorView.jsx'
import { ModeToggle }       from './components/ModeToggle.jsx'
import { CrisisSimulator }  from './components/CrisisSimulator.jsx'
import { SceneDetailCard }  from './components/SceneDetailCard.jsx'
import styles from './Schedule.module.css'

// ── Cenas sem dia ────────────────────────────────────────────────
function UnscheduledView({ cenasSemDia, onSceneClick }) {
  const TYPE_COLORS = {
    'Âncora':    '#A02E6F',
    'Grupo':     '#2E6FA0',
    'Diálogo':   '#2EA080',
    'Gag':       '#BF6A2E',
    'Solo':      '#7B4FBF',
    'Transição': '#6E6E78',
  }

  if (cenasSemDia.length === 0) {
    return (
      <div className={styles.unscheduledRoot}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', color: 'var(--health-green)', padding: 'var(--space-12)' }}>
          <Calendar size={36} />
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Todas as cenas têm dia atribuído!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.unscheduledRoot}>
      <div className={styles.unscheduledHeader}>
        <span className={styles.unscheduledTitle}>Cenas sem dia</span>
        <span className={styles.unscheduledCount}>{cenasSemDia.length}</span>
      </div>
      <div className={styles.unscheduledList}>
        {cenasSemDia.map(scene => {
          const color = TYPE_COLORS[scene.sceneType] || '#6E6E78'
          return (
            <div
              key={scene.sceneKey}
              className={styles.unschedCard}
              style={{ borderLeftColor: color, cursor: 'pointer' }}
              onClick={() => onSceneClick?.(scene)}
            >
              <div className={styles.unschedTop}>
                <span className={styles.unschedEp}>{scene.epId}</span>
                <span className={styles.unschedNum}>#{scene.sceneNumber}</span>
                <span
                  className={styles.typeBadge}
                  style={{ background: color + '22', color, borderColor: color + '55' }}
                >
                  {scene.sceneType}
                </span>
                <span className={styles.unschedDur}>{scene.duration}m</span>
              </div>
              <div className={styles.unschedLoc}>
                <AlertTriangle size={10} color="var(--text-muted)" />
                {scene.location || '—'}
              </div>
              {(scene.characters || []).length > 0 && (
                <div className={styles.unschedChars}>
                  {scene.characters.slice(0, 3).map(c => (
                    <span key={c} className={styles.unschedCharChip}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Painel de oportunidades (com acções) ─────────────────────────
function OpportunitiesPanel({ oportunidades = [], custos = [], meta = {}, onAction }) {
  const [open, setOpen] = useState(false)

  const count = oportunidades.length
  const hasErrors = oportunidades.some(o => o.severity === 'error')
  const custoTotal = meta.custoTotal || 0

  if (count === 0 && custoTotal === 0) return null

  const severityColor = {
    error: 'var(--health-red)',
    warn: 'var(--health-yellow)',
    info: 'var(--mod-continuity)',
  }

  const severityIcon = {
    error: AlertTriangle,
    warn: Lightbulb,
    info: Layers,
  }

  // Mapa de acções possíveis por tipo de oportunidade
  const actionLabels = {
    dias_subutilizados: 'Redistribuir',
    overflow: 'Adicionar dia',
    sobrecarga: 'Aliviar dia',
    envelope_apertado: 'Mudar para criativo',
  }

  return (
    <div className={styles.oppsWrap}>
      <button
        className={styles.oppsToggle}
        onClick={() => setOpen(!open)}
        style={hasErrors ? { color: 'var(--health-red)' } : {}}
      >
        <Lightbulb size={12} />
        {count} oportunidade(s) detectada(s)
        {custoTotal > 0 && (
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
            <DollarSign size={10} />
            Custo estimado: {(custoTotal / 100).toLocaleString('pt-PT', { minimumFractionDigits: 0 })}€/dia
          </span>
        )}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.oppsPanel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {oportunidades.map((opp, idx) => {
              const Icon = severityIcon[opp.severity] || Lightbulb
              const color = severityColor[opp.severity] || 'var(--text-muted)'
              const actionLabel = actionLabels[opp.tipo]
              return (
                <div key={idx} className={styles.oppRow} style={{ borderLeftColor: color }}>
                  <Icon size={12} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div className={styles.oppContent}>
                    <span className={styles.oppType}>{opp.tipo}</span>
                    <span className={styles.oppMsg}>{opp.message}</span>
                    {opp.poupanca_estimada && (
                      <span className={styles.oppSaving}>Poupança: {opp.poupanca_estimada}</span>
                    )}
                  </div>
                  {actionLabel && onAction && (
                    <button
                      className={styles.oppAction}
                      onClick={() => onAction(opp)}
                    >
                      <Lightbulb size={10} /> {actionLabel}
                    </button>
                  )}
                </div>
              )
            })}

            {/* Resumo de utilização */}
            {meta.utilizacao_media > 0 && (
              <div className={styles.oppSummary}>
                <span>Utilização média: <strong>{meta.utilizacao_media}%</strong></span>
                <span>Duração média/cena: <strong>{meta.avgDuration}m</strong></span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────
const VIEWS = [
  { id: 'calendar',    label: 'Mapa',        icon: Calendar },
  { id: 'timeline',    label: 'Timeline',    icon: Clock },
  { id: 'table',       label: 'Tabela',      icon: Table2 },
  { id: 'locations',   label: 'Locais',      icon: MapPin },
  { id: 'actors',      label: 'Actores',     icon: Users },
  { id: 'unscheduled', label: 'Sem dia',     icon: AlertTriangle },
]

// ── Componente principal ──────────────────────────────────────────
export function ScheduleModule({ onDaySelect }) {
  const [activeView, setActiveView] = useState('calendar')
  const [selectedScene, setSelectedScene] = useState(null)

  // ── Card Stack ──────────────────────────────────────────────
  // Stack of { type: 'day'|'scene', data: object }
  const [cardStack, setCardStack] = useState([])

  const pushCard = useCallback((type, data) => {
    setCardStack(prev => [...prev, { type, data, id: `${type}_${Date.now()}` }])
  }, [])

  const popCard = useCallback(() => {
    setCardStack(prev => prev.length > 0 ? prev.slice(0, -1) : prev)
  }, [])

  const clearStack = useCallback(() => {
    setCardStack([])
  }, [])
  const { 
    shootingDays, scheduleVersions, saveScheduleVersion,
    addShootingDay, setScheduleMode, assignScene, unassignScene,
   } = useStore(useShallow(s => ({ shootingDays: s.shootingDays, scheduleVersions: s.scheduleVersions, saveScheduleVersion: s.saveScheduleVersion, addShootingDay: s.addShootingDay, setScheduleMode: s.setScheduleMode, assignScene: s.assignScene, unassignScene: s.unassignScene })))

  const engineResult = useScheduleEngine()

  const hasShootingDays = shootingDays.length > 0
  const unscheduledCount = engineResult?.cenasSemDia?.length || 0
  const alertCount = engineResult?.alertas?.filter(a => a.severity === 'error').length || 0
  const oppsCount = engineResult?.oportunidades?.length || 0

  // Aplicar resultado de simulação de crise
  function handleCrisisApply(simResult) {
    if (window.confirm('Aplicar resultado da simulação? Esta acção irá alterar as atribuições de cenas.')) {
      const state = useStore.getState()
      Object.entries(simResult.assignments || {}).forEach(([key, dayId]) => {
        state.assignScene(key, dayId)
      })
    }
  }

  // Guardar versão do plano
  function handleSaveVersion() {
    const name = prompt('Nome da versão (ex: "v1 - antes do recce"):')
    if (name) {
      saveScheduleVersion?.(name)
    }
  }

  // Acções das oportunidades
  function handleOpportunityAction(opp) {
    switch (opp.tipo) {
      case 'overflow': {
        // Adicionar um dia de rodagem extra
        if (window.confirm('Adicionar um dia de rodagem extra para acomodar cenas sem dia?')) {
          const lastDay = shootingDays[shootingDays.length - 1]
          const nextDate = lastDay?.date
            ? (() => {
                const d = new Date(lastDay.date + 'T00:00:00')
                d.setDate(d.getDate() + 1)
                // Saltar fins-de-semana
                while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
                return d.toISOString().slice(0, 10)
              })()
            : null
          addShootingDay?.({
            id: `day_${Date.now()}`,
            date: nextDate,
            label: `Dia ${shootingDays.length + 1}`,
            dayNumber: shootingDays.length + 1,
            callTime: '08:00',
          })
        }
        break
      }
      case 'dias_subutilizados': {
        // Re-run auto-schedule (já acontece reactivamente ao store mudar)
        if (window.confirm('Redistribuir automaticamente? O motor irá re-optimizar a alocação.')) {
          // Force re-run by toggling mode briefly
          const current = useStore.getState().scheduleMode
          setScheduleMode(current === 'creative' ? 'budget' : 'creative')
          setTimeout(() => setScheduleMode(current), 100)
        }
        break
      }
      case 'sobrecarga': {
        if (opp.dayId && window.confirm(`Mover a última cena do ${opp.dayId} para o dia seguinte?`)) {
          const day = engineResult?.days?.find(d => d.id === opp.dayId)
          if (day?.scenes?.length > 0) {
            const lastScene = day.scenes[day.scenes.length - 1]
            const dayIdx = shootingDays.findIndex(d => d.id === opp.dayId)
            const nextDay = shootingDays[dayIdx + 1]
            if (nextDay) {
              unassignScene(lastScene.sceneKey)
              assignScene(lastScene.sceneKey, nextDay.id)
            }
          }
        }
        break
      }
      case 'envelope_apertado': {
        if (window.confirm('Mudar para modo Criativo (sem envelope de dias)?')) {
          setScheduleMode('creative')
        }
        break
      }
      default:
        break
    }
  }

  // Abrir detalhe de cena — empilha no card stack
  function handleSceneClick(scene) {
    pushCard('scene', scene)
  }

  // Abrir detalhe de dia — empilha no card stack
  function handleDayClick(day) {
    pushCard('day', day)
  }

  if (!hasShootingDays) {
    return (
      <div className={styles.schedRoot}>
        <ScheduleSetup />
      </div>
    )
  }

  return (
    <div className={styles.schedRoot}>
      {/* ── Header ── */}
      <div className={styles.schedHeader}>
        <div className={styles.schedHeaderLeft}>
          <span className={styles.schedTitle}>Mapa de Rodagem</span>

          {/* Tabs de vista */}
          <nav className={styles.viewTabs}>
            {VIEWS.map(view => {
              const Icon = view.icon
              const isBad = view.id === 'unscheduled' && unscheduledCount > 0
              return (
                <button
                  key={view.id}
                  className={`${styles.viewTab} ${activeView === view.id ? styles.viewTabActive : ''}`}
                  onClick={() => setActiveView(view.id)}
                  style={isBad ? { color: activeView === view.id ? 'var(--health-red)' : undefined } : {}}
                >
                  <Icon size={13} />
                  {view.label}
                  {view.id === 'unscheduled' && unscheduledCount > 0 && (
                    <span style={{
                      marginLeft: 2,
                      fontSize: 10,
                      fontWeight: 800,
                      color: 'var(--health-red)',
                      background: 'rgba(248,113,113,0.15)',
                      padding: '0 5px',
                      borderRadius: 'var(--radius-full)',
                    }}>
                      {unscheduledCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* ModeToggle + export + salvar versão */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <ModeToggle creativeMeta={engineResult?.meta} />
          <button
            className={styles.exportBtn}
            onClick={() => engineResult && exportScheduleCSV(engineResult)}
            title="Exportar CSV completo"
          >
            <Download size={11} /> CSV
          </button>
          <button
            className={styles.saveVersionBtn}
            onClick={handleSaveVersion}
            title="Guardar versão do plano"
          >
            <Save size={11} /> Versão
          </button>
        </div>
      </div>

      {/* ── Painel de oportunidades ── */}
      <OpportunitiesPanel
        oportunidades={engineResult?.oportunidades || []}
        custos={engineResult?.custos || []}
        meta={engineResult?.meta || {}}
        onAction={handleOpportunityAction}
      />

      {/* ── Vista activa ── */}
      <div className={styles.schedContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeView === 'calendar'    && <CalendarView engineResult={engineResult} onSceneClick={handleSceneClick} onDaySelect={onDaySelect} onDayClick={handleDayClick} />}
            {activeView === 'timeline'    && <TimelineView engineResult={engineResult} onSceneClick={handleSceneClick} />}
            {activeView === 'table'       && <TableView    engineResult={engineResult} onSceneClick={handleSceneClick} />}
            {activeView === 'locations'   && <LocationView engineResult={engineResult} onSceneClick={handleSceneClick} />}
            {activeView === 'actors'      && <ActorView    engineResult={engineResult} onSceneClick={handleSceneClick} />}
            {activeView === 'unscheduled' && <UnscheduledView cenasSemDia={engineResult?.cenasSemDia || []} onSceneClick={handleSceneClick} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Simulador de crise (colapsável em baixo) ── */}
      <CrisisSimulator
        currentResult={engineResult}
        onApply={handleCrisisApply}
      />

      {/* ── Card Stack (modal overlay — show top card only) ── */}
      <AnimatePresence>
        {cardStack.length > 0 && (() => {
          const topCard = cardStack[cardStack.length - 1]

          if (topCard.type === 'scene') {
            return (
              <SceneDetailCard
                key={topCard.id}
                scene={topCard.data}
                onClose={popCard}
              />
            )
          }

          if (topCard.type === 'day') {
            return (
              <motion.div
                key={topCard.id}
                className={styles.stackOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={popCard}
              >
                <motion.div
                  className={styles.stackCard}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Day card header */}
                  <div className={styles.stackCardHeader}>
                    <button className={styles.stackBackBtn} onClick={popCard}>
                      <ArrowLeft size={16} />
                    </button>
                    <span className={styles.stackCardTitle}>DIA {topCard.data.dayNumber || '?'}</span>
                    <span className={styles.stackCardSub}>
                      {topCard.data.date ? new Date(topCard.data.date + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
                    </span>
                    <span style={{ flex: 1 }} />
                    {onDaySelect && (
                      <button
                        className={styles.stackCallsheetBtn}
                        onClick={() => { clearStack(); onDaySelect(topCard.data.id) }}
                      >
                        Folha de Serviço →
                      </button>
                    )}
                    <button className={styles.stackCloseBtn} onClick={clearStack}>
                      <X size={16} />
                    </button>
                  </div>

                  {/* Day card body — scrollable */}
                  <div className={styles.stackCardBody}>
                    {/* Meta strip */}
                    <div className={styles.stackDayMeta}>
                      <div className={styles.stackDayMetaItem}>
                        <span className={styles.stackDayMetaLabel}>CALL</span>
                        <span>{topCard.data.callTime || '08:00'}</span>
                      </div>
                      <div className={styles.stackDayMetaItem}>
                        <span className={styles.stackDayMetaLabel}>WRAP</span>
                        <span>{topCard.data.wrapTime || '—'}</span>
                      </div>
                      <div className={styles.stackDayMetaItem}>
                        <span className={styles.stackDayMetaLabel}>CENAS</span>
                        <span>{topCard.data.scenes?.length || 0}</span>
                      </div>
                      <div className={styles.stackDayMetaItem}>
                        <span className={styles.stackDayMetaLabel}>UTIL.</span>
                        <span style={{
                          color: (topCard.data.utilization || 0) >= 100 ? 'var(--health-red)' : (topCard.data.utilization || 0) >= 88 ? 'var(--health-yellow)' : 'var(--health-green)',
                        }}>{topCard.data.utilization || 0}%</span>
                      </div>
                    </div>

                    {/* Locations */}
                    {(topCard.data.locations || []).length > 0 && (
                      <div className={styles.stackDayLocations}>
                        <MapPin size={12} />
                        {topCard.data.locations.map(l => l.name).join(' · ')}
                      </div>
                    )}

                    {/* Alerts */}
                    {topCard.data.validation?.violations?.length > 0 && (
                      <div className={styles.stackDayAlerts}>
                        {topCard.data.validation.violations.map((v, i) => (
                          <div key={i} className={styles.stackDayAlert} style={{
                            borderLeftColor: v.severity === 'error' ? 'var(--health-red)' : 'var(--health-yellow)',
                          }}>
                            <AlertTriangle size={11} />
                            <span>{v.message}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Cast */}
                    {(topCard.data.characters || []).length > 0 && (
                      <div className={styles.stackDayCast}>
                        <span className={styles.stackDaySectionLabel}>ELENCO</span>
                        <div className={styles.stackDayCastList}>
                          {topCard.data.characters.map(c => (
                            <span key={c} className={styles.stackDayCastChip}>{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scenes list — clickable to push scene card */}
                    <div className={styles.stackDayScenes}>
                      <span className={styles.stackDaySectionLabel}>CENAS</span>
                      {(topCard.data.scenes || []).map(scene => (
                        <motion.div
                          key={scene.sceneKey}
                          className={styles.stackDaySceneRow}
                          onClick={() => handleSceneClick(scene)}
                          whileHover={{ x: 4, backgroundColor: 'rgba(232, 168, 56, 0.06)' }}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className={styles.stackDaySceneKey}>{scene.sceneKey}</span>
                          <span className={styles.stackDaySceneLoc}>{scene.location}</span>
                          <span className={styles.stackDaySceneIE} style={{ color: scene.intExt === 'EXT' ? '#F5A623' : 'var(--text-muted)' }}>
                            {scene.intExt}
                          </span>
                          <span className={styles.stackDaySceneDur}>{scene.duration || 0}min</span>
                          <ArrowLeft size={12} style={{ transform: 'rotate(180deg)', opacity: 0.3 }} />
                        </motion.div>
                      ))}
                      {(!topCard.data.scenes || topCard.data.scenes.length === 0) && (
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', padding: '12px 0' }}>
                          Nenhuma cena atribuída a este dia
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          }
          return null
        })()}
      </AnimatePresence>

      {/* Legacy: single scene detail (for backwards compat with other views) */}
      <AnimatePresence>
        {selectedScene && cardStack.length === 0 && (
          <SceneDetailCard
            scene={selectedScene}
            onClose={() => setSelectedScene(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
