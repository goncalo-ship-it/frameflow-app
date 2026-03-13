// Hook que corre o engine sobre dados do store e devolve o plano enriquecido

import { useMemo, useEffect, useRef } from 'react'
import { useStore } from '../../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { runScheduleEngine } from '../utils/scheduleEngine.js'
import { prewarmSolarCache } from '../utils/solarCalc.js'

/**
 * Retorna o resultado do schedule engine, derivado do store.
 *
 * @param {Object} opts
 * @param {boolean} opts.respectExisting — se true, honra atribuições manuais
 * @returns {{ result, isLoading, reload }}
 */
export function useScheduleEngine({ respectExisting = true } = {}) {
  const { 
    parsedScripts,
    shootingDays,
    sceneAssignments,
    team,
    scheduleMode,
    scheduleBudgetEnvelope,
   } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts, shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments, team: s.team, scheduleMode: s.scheduleMode, scheduleBudgetEnvelope: s.scheduleBudgetEnvelope })))

  // Pré-aquecer cache solar para as datas dos dias
  const datesRef = useRef([])
  useEffect(() => {
    const dates = shootingDays.map(d => d.date).filter(Boolean)
    const newDates = dates.filter(d => !datesRef.current.includes(d))
    if (newDates.length > 0) {
      datesRef.current = dates
      prewarmSolarCache(dates).catch(() => {})
    }
  }, [shootingDays])

  const result = useMemo(() => {
    if (!parsedScripts || Object.keys(parsedScripts).length === 0) {
      return {
        days: shootingDays.map(d => ({
          ...d,
          scenes: [],
          totalMin: 0,
          utilization: 0,
          utilStatus: 'green',
          locations: [],
          characters: [],
          validation: { valid: true, violations: [], severity: 'ok' },
          wrapTime: null,
        })),
        allScenes: [],
        assignments: sceneAssignments,
        cenasSemDia: [],
        alertas: [],
        meta: {
          totalScenes: 0,
          assignedScenes: 0,
          unassignedScenes: 0,
          totalMinutes: 0,
          totalHours: 0,
          daysUsed: shootingDays.length,
          mode: scheduleMode || 'creative',
          envelope: scheduleBudgetEnvelope,
        },
      }
    }

    return runScheduleEngine({
      parsedScripts,
      days: shootingDays,
      existingAssignments: sceneAssignments,
      team,
      mode: scheduleMode || 'creative',
      envelope: scheduleBudgetEnvelope,
      respectExisting,
    })
  }, [
    parsedScripts,
    shootingDays,
    sceneAssignments,
    team,
    scheduleMode,
    scheduleBudgetEnvelope,
    respectExisting,
  ])

  return result
}

// Hook especializado para simulação de crise (sem mutar o store)
export function useScheduleSimulation() {
  const base = useStore(useShallow(s => ({
    parsedScripts: s.parsedScripts, shootingDays: s.shootingDays,
    sceneAssignments: s.sceneAssignments, team: s.team,
    scheduleMode: s.scheduleMode, scheduleBudgetEnvelope: s.scheduleBudgetEnvelope,
  })))

  function simulate(overrides = {}) {
    const {
      parsedScripts,
      shootingDays,
      sceneAssignments,
      team,
      scheduleMode,
      scheduleBudgetEnvelope,
    } = { ...base, ...overrides }

    return runScheduleEngine({
      parsedScripts,
      days: shootingDays,
      existingAssignments: sceneAssignments,
      team,
      mode: scheduleMode || 'creative',
      envelope: scheduleBudgetEnvelope,
      respectExisting: false, // simulação recalcula tudo
    })
  }

  return { simulate }
}
