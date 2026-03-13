// CrisisSimulator — simula 4 cenários de crise sem mutar o store real
// Critico: NUNCA muta estado real durante simulação

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, UserX, MapPinOff, CloudRain, Clock,
  ChevronDown, ChevronUp, Check, X, RefreshCw,
} from 'lucide-react'
import { useStore } from '../../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { useScheduleSimulation } from '../hooks/useScheduleEngine.js'
import styles from '../Schedule.module.css'

const CRISIS_TYPES = [
  {
    id: 'actor_doente',
    label: 'Actor Doente',
    icon: UserX,
    color: '#F87171',
    description: 'Remove o actor do plano e recalcula',
  },
  {
    id: 'local_recusado',
    label: 'Local Recusado',
    icon: MapPinOff,
    color: '#FBBF24',
    description: 'Remove todas as cenas do local',
  },
  {
    id: 'chuva_amanha',
    label: 'Chuva Amanhã',
    icon: CloudRain,
    color: '#60A5FA',
    description: 'Troca EXT por INT no dia selecionado',
  },
  {
    id: 'atraso_dia',
    label: 'Atraso no Dia',
    icon: Clock,
    color: '#A78BFA',
    description: 'Calcula impacto de N minutos de atraso',
  },
]

// ── SimDiff — mostra diferença antes/depois ───────────────────────
function SimDiff({ before, after }) {
  if (!before || !after) return null

  const addedDays    = after.days.length - before.days.length
  const changedScenes = Math.abs((after.meta?.assignedScenes || 0) - (before.meta?.assignedScenes || 0))
  const newOverflow  = (after.cenasSemDia?.length || 0) - (before.cenasSemDia?.length || 0)
  const newAlerts    = (after.alertas?.length || 0) - (before.alertas?.length || 0)

  return (
    <div className={styles.simDiff}>
      <div className={styles.simDiffTitle}>Impacto da simulação</div>
      <div className={styles.simDiffGrid}>
        <div className={styles.simDiffItem}>
          <span className={styles.simDiffNum} style={{ color: addedDays !== 0 ? 'var(--health-yellow)' : 'var(--health-green)' }}>
            {addedDays >= 0 ? `+${addedDays}` : addedDays}
          </span>
          <span className={styles.simDiffLabel}>dias</span>
        </div>
        <div className={styles.simDiffItem}>
          <span className={styles.simDiffNum} style={{ color: changedScenes > 0 ? 'var(--health-yellow)' : 'var(--health-green)' }}>
            {changedScenes}
          </span>
          <span className={styles.simDiffLabel}>cenas afectadas</span>
        </div>
        <div className={styles.simDiffItem}>
          <span className={styles.simDiffNum} style={{ color: newOverflow > 0 ? 'var(--health-red)' : 'var(--health-green)' }}>
            {newOverflow >= 0 ? `+${newOverflow}` : newOverflow}
          </span>
          <span className={styles.simDiffLabel}>sem dia</span>
        </div>
        <div className={styles.simDiffItem}>
          <span className={styles.simDiffNum} style={{ color: newAlerts > 0 ? 'var(--health-yellow)' : 'var(--health-green)' }}>
            {newAlerts >= 0 ? `+${newAlerts}` : newAlerts}
          </span>
          <span className={styles.simDiffLabel}>alertas</span>
        </div>
      </div>
    </div>
  )
}

export function CrisisSimulator({ currentResult, onApply }) {
  const [open, setOpen]         = useState(false)
  const [activeCrisis, setActiveCrisis] = useState(null)
  const [selectedActor, setSelectedActor]   = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedDay, setSelectedDay]           = useState('')
  const [delayMin, setDelayMin]                 = useState(30)
  const [simResult, setSimResult]               = useState(null)
  const [running, setRunning]                   = useState(false)

  const { team, parsedScripts, shootingDays, sceneAssignments } = useStore(useShallow(s => ({
    team: s.team, parsedScripts: s.parsedScripts, shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments,
  })))
  const { simulate } = useScheduleSimulation()

  const actors    = team.filter(m => m.group === 'Elenco')
  const locations = [...new Set(
    Object.values(parsedScripts || {})
      .flatMap(ep => (ep.scenes || []).map(s => s.location))
      .filter(Boolean)
  )]
  const days = shootingDays

  // ── Funções de simulação ──────────────────────────────────────
  function runSim() {
    setRunning(true)
    try {
      let overrides = {}

      if (activeCrisis === 'actor_doente' && selectedActor) {
        // Remove o actor: filtra as cenas onde ele aparece nas personagens
        const newScripts = {}
        Object.entries(parsedScripts || {}).forEach(([epId, epData]) => {
          newScripts[epId] = {
            ...epData,
            scenes: (epData.scenes || []).map(sc => ({
              ...sc,
              characters: (sc.characters || []).filter(c => c !== selectedActor),
            })),
          }
        })
        overrides.parsedScripts = newScripts
      }

      if (activeCrisis === 'local_recusado' && selectedLocation) {
        // Remove cenas do local: filtra do sceneAssignments
        const newAssignments = {}
        Object.entries(sceneAssignments || {}).forEach(([key, dayId]) => {
          const scene = findScene(key, parsedScripts)
          if (scene?.location !== selectedLocation) {
            newAssignments[key] = dayId
          }
        })
        overrides.sceneAssignments = newAssignments
      }

      if (activeCrisis === 'chuva_amanha' && selectedDay) {
        // Troca EXT por INT no dia selecionado: marca cenas EXT como não atribuídas
        const day = days.find(d => d.id === selectedDay)
        if (day) {
          const newAssignments = { ...sceneAssignments }
          Object.entries(sceneAssignments || {}).forEach(([key, dayId]) => {
            if (dayId === selectedDay) {
              const scene = findScene(key, parsedScripts)
              if (scene && (scene.intExt || '').toUpperCase() === 'EXT') {
                delete newAssignments[key]
              }
            }
          })
          overrides.sceneAssignments = newAssignments
        }
      }

      if (activeCrisis === 'atraso_dia' && selectedDay) {
        // Atraso: recalcula wrap, mostra impacto (não muta dias reais)
        overrides._delayDay = selectedDay
        overrides._delayMin = delayMin
      }

      const result = simulate(overrides)
      setSimResult(result)
    } catch (err) {
      console.error('[CrisisSimulator]', err)
    } finally {
      setRunning(false)
    }
  }

  function findScene(sceneKey, parsedScripts) {
    const [epId, ...rest] = sceneKey.split('-')
    const sceneNumber = rest.join('-')
    return (parsedScripts?.[epId]?.scenes || []).find(
      s => String(s.sceneNumber) === String(sceneNumber)
    )
  }

  function handleApply() {
    if (simResult && onApply) {
      onApply(simResult)
    }
    setSimResult(null)
    setActiveCrisis(null)
  }

  function handleDiscard() {
    setSimResult(null)
  }

  return (
    <div className={styles.crisisWrap}>
      {/* Toggle header */}
      <button className={styles.crisisToggle} onClick={() => setOpen(!open)}>
        <AlertTriangle size={14} color="var(--health-red)" />
        <span>Simulador de Crise</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.crisisPanel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Botões de cenário */}
            <div className={styles.crisisBtns}>
              {CRISIS_TYPES.map(crisis => {
                const Icon = crisis.icon
                const isActive = activeCrisis === crisis.id
                return (
                  <button
                    key={crisis.id}
                    className={`${styles.crisisBtn} ${isActive ? styles.crisisBtnActive : ''}`}
                    style={{ '--crisis-color': crisis.color }}
                    onClick={() => {
                      setActiveCrisis(isActive ? null : crisis.id)
                      setSimResult(null)
                    }}
                  >
                    <Icon size={14} color={crisis.color} />
                    {crisis.label}
                  </button>
                )
              })}
            </div>

            {/* Configuração do cenário seleccionado */}
            <AnimatePresence mode="wait">
              {activeCrisis && (
                <motion.div
                  key={activeCrisis}
                  className={styles.crisisConfig}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                >
                  <p className={styles.crisisDesc}>
                    {CRISIS_TYPES.find(c => c.id === activeCrisis)?.description}
                  </p>

                  {activeCrisis === 'actor_doente' && (
                    <select
                      className={styles.crisisSelect}
                      value={selectedActor}
                      onChange={e => setSelectedActor(e.target.value)}
                    >
                      <option value="">Seleccionar actor…</option>
                      {actors.map(a => (
                        <option key={a.id} value={a.characterName || a.name}>
                          {a.characterName || a.name} ({a.name})
                        </option>
                      ))}
                    </select>
                  )}

                  {activeCrisis === 'local_recusado' && (
                    <select
                      className={styles.crisisSelect}
                      value={selectedLocation}
                      onChange={e => setSelectedLocation(e.target.value)}
                    >
                      <option value="">Seleccionar local…</option>
                      {locations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  )}

                  {(activeCrisis === 'chuva_amanha' || activeCrisis === 'atraso_dia') && (
                    <select
                      className={styles.crisisSelect}
                      value={selectedDay}
                      onChange={e => setSelectedDay(e.target.value)}
                    >
                      <option value="">Seleccionar dia…</option>
                      {days.map((d, i) => (
                        <option key={d.id} value={d.id}>
                          D{d.dayNumber || i + 1} · {d.date} {d.label ? `· ${d.label}` : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  {activeCrisis === 'atraso_dia' && (
                    <div className={styles.crisisDelayWrap}>
                      <span className={styles.crisisDelayLabel}>Atraso:</span>
                      <input
                        type="number"
                        className={styles.crisisDelayInput}
                        value={delayMin}
                        min={5}
                        max={480}
                        step={5}
                        onChange={e => setDelayMin(Number(e.target.value))}
                      />
                      <span className={styles.crisisDelayLabel}>min</span>
                    </div>
                  )}

                  <button
                    className={styles.crisisRunBtn}
                    onClick={runSim}
                    disabled={running}
                  >
                    <RefreshCw size={13} className={running ? styles.spin : ''} />
                    {running ? 'A calcular…' : 'Simular'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resultado da simulação */}
            <AnimatePresence>
              {simResult && (
                <motion.div
                  className={styles.simResult}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <SimDiff before={currentResult} after={simResult} />

                  <div className={styles.simActions}>
                    <button className={styles.simApply} onClick={handleApply}>
                      <Check size={13} /> Aplicar
                    </button>
                    <button className={styles.simDiscard} onClick={handleDiscard}>
                      <X size={13} /> Descartar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
