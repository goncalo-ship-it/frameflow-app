// FRAME — useScript hook
// Estado derivado do guião de produção: cenas enriquecidas, sequências, costuras

import { useMemo } from 'react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { enrichSequencias, detectCosturas } from '../utils/costuraCalculator.js'

/**
 * Hook principal do módulo Guião de Produção
 * Combina dados parsed + production layer + schedule
 */
export function useScript() {
  const { 
    parsedScripts,
    productionScript,
    sceneAssignments,
    shootingDays,
    continuityData,
    departmentItems,
    sceneTakes,
    universe,
    team,
   } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts, productionScript: s.productionScript, sceneAssignments: s.sceneAssignments, shootingDays: s.shootingDays, continuityData: s.continuityData, departmentItems: s.departmentItems, sceneTakes: s.sceneTakes, universe: s.universe, team: s.team })))

  // ── Flatten todas as cenas parsed com camada de produção ────
  const allScenes = useMemo(() => {
    const scenes = []
    const cenas = productionScript?.cenas || {}
    Object.entries(parsedScripts || {}).forEach(([epId, epData]) => {
      ;(epData?.scenes || []).forEach(scene => {
        const sceneKey = `${epId}-${scene.sceneNumber || scene.id}`
        const prodData = cenas[sceneKey] || {}
        const dayId = sceneAssignments?.[sceneKey]
        const day = dayId ? shootingDays.find(d => d.id === dayId) : null

        scenes.push({
          ...scene,
          sceneKey,
          epId,
          // Camada de produção
          estado: prodData.estado || 'por_filmar',
          picks_pendentes: prodData.picks_pendentes || [],
          notas_realizador: prodData.notas_realizador || [],
          notas_continuidade: prodData.notas_continuidade || [],
          sequencia_id: prodData.sequencia_id || null,
          versao_guiao: prodData.versao_guiao || productionScript?.versao_atual || 'v1',
          // Schedule
          dia_rodagem: day?.dayNumber || null,
          dia_rodagem_id: dayId || null,
          dia_rodagem_date: day?.date || null,
          bloco_horario: prodData.bloco_horario || null,
          hora_prevista: prodData.hora_prevista || null,
          // Continuidade
          continuidade: (continuityData || {})[sceneKey] || null,
          // Takes
          takes: (sceneTakes || {})[sceneKey] || [],
        })
      })
    })

    // Ordenar por ordem narrativa
    scenes.sort((a, b) => {
      if (a.epId !== b.epId) return a.epId.localeCompare(b.epId)
      const numA = parseInt(String(a.sceneNumber || a.id).replace(/\D/g, '')) || 0
      const numB = parseInt(String(b.sceneNumber || b.id).replace(/\D/g, '')) || 0
      return numA - numB
    })

    return scenes
  }, [parsedScripts, productionScript?.cenas, sceneAssignments, shootingDays, continuityData, sceneTakes])

  // ── Sequências enriquecidas com costuras ────────────────────
  const sequencias = useMemo(() => {
    return enrichSequencias(
      productionScript?.sequencias || [],
      sceneAssignments || {},
      shootingDays || []
    )
  }, [productionScript?.sequencias, sceneAssignments, shootingDays])

  // ── Costuras ────────────────────────────────────────────────
  const costuras = useMemo(() => {
    return detectCosturas(
      productionScript?.sequencias || [],
      sceneAssignments || {},
      shootingDays || []
    )
  }, [productionScript?.sequencias, sceneAssignments, shootingDays])

  // ── Progresso ────────────────────────────────────────────────
  const progresso = useMemo(() => {
    const total = allScenes.length
    const filmadas = allScenes.filter(s => s.estado === 'filmada').length
    const picks = allScenes.filter(s => s.estado === 'pick_pendente').length
    const cortadas = allScenes.filter(s => s.estado === 'cortada').length
    const porFilmar = allScenes.filter(s => s.estado === 'por_filmar').length
    const condicionais = allScenes.filter(s => s.estado === 'condicional').length

    return {
      total,
      filmadas,
      picks,
      cortadas,
      porFilmar,
      condicionais,
      percentagem: total > 0 ? Math.round((filmadas / (total - cortadas)) * 100) : 0,
    }
  }, [allScenes])

  // ── Cenas por dia (para vista Rodagem) ──────────────────────
  const cenasPorDia = useMemo(() => {
    const map = {}
    shootingDays.forEach(day => {
      map[day.id] = {
        day,
        scenes: allScenes
          .filter(s => s.dia_rodagem_id === day.id)
          .sort((a, b) => {
            // Ordenar pela hora prevista se disponível
            if (a.hora_prevista && b.hora_prevista) return a.hora_prevista.localeCompare(b.hora_prevista)
            return 0
          }),
      }
    })
    return map
  }, [allScenes, shootingDays])

  // ── Costuras activas (não verificadas) ──────────────────────
  const costurasActivas = useMemo(() => {
    return costuras.filter(c =>
      c.checklist.some(item => item.estado !== 'verificado')
    )
  }, [costuras])

  // ── Mapa sceneKey → sequência ──────────────────────────────
  const sceneToSequence = useMemo(() => {
    const map = {}
    sequencias.forEach(seq => {
      seq.cenas.forEach(sk => { map[sk] = seq })
    })
    return map
  }, [sequencias])

  return {
    allScenes,
    sequencias,
    costuras,
    costurasActivas,
    progresso,
    cenasPorDia,
    sceneToSequence,
    versao: productionScript?.versao_atual || 'v1',
    versoes: productionScript?.versoes || [],
  }
}
