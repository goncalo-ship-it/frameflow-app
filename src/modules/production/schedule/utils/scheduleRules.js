// As 7 Regras de Rodagem — FRAME Schedule
// Cada regra retorna { valid, message, severity: 'warn'|'error' }
// NUNCA violadas silenciosamente — sempre mostram aviso

import { DAY_WINDOWS, capacidadeSegura } from './sceneDuration.js'

// ── Regra 1: LOCAL CONTÍNUO ───────────────────────────────────────
// Um local num dia é um bloco contínuo — não se volta ao mesmo local depois de mudar
export function localContinuo(day, scenes) {
  if (!scenes || scenes.length < 2) return { valid: true }

  const locationSequence = scenes.map(s => s.location || 'SEM LOCAL')
  const seen = new Set()
  const violations = []

  for (let i = 0; i < locationSequence.length; i++) {
    const loc = locationSequence[i]
    if (seen.has(loc)) {
      // Verificar se há interrupção — se já passou por este local e saiu
      const lastIdx = locationSequence.lastIndexOf(loc, i - 1)
      const between = locationSequence.slice(lastIdx + 1, i)
      const hasInterruption = between.some(l => l !== loc)
      if (hasInterruption) {
        violations.push(loc)
      }
    }
    seen.add(loc)
  }

  if (violations.length > 0) {
    return {
      valid: false,
      message: `Local(ais) não contínuo(s): ${[...new Set(violations)].join(', ')}`,
      severity: 'warn',
      rule: 'localContinuo',
    }
  }

  return { valid: true, rule: 'localContinuo' }
}

// ── Regra 2: ÂNCORAS NUNCA NO FIM ────────────────────────────────
// Cenas âncora não podem ser o último bloco do dia
export function ancoraNuncaNoFim(day, scenes) {
  if (!scenes || scenes.length === 0) return { valid: true }

  const lastScene = scenes[scenes.length - 1]
  const tipo = lastScene?.sceneType || lastScene?.type || ''

  if (tipo.toLowerCase() === 'âncora' || tipo.toLowerCase() === 'ancora') {
    return {
      valid: false,
      message: `Cena âncora (#${lastScene.sceneNumber}) está no último bloco do dia — reorganizar`,
      severity: 'error',
      rule: 'ancoraNuncaNoFim',
    }
  }

  return { valid: true, rule: 'ancoraNuncaNoFim' }
}

// ── Regra 3: EXTERIORES DE MANHÃ ─────────────────────────────────
// Cenas EXT devem ser de manhã ou golden hour
export function exterioresManha(day, scenes) {
  if (!scenes || scenes.length === 0) return { valid: true }

  const windowType = day.windowType || 'completo'
  const isSoTarde = windowType === 'so_tarde'
  const isGoldenHour = windowType === 'golden_hour'

  if (isSoTarde || isGoldenHour) return { valid: true, rule: 'exterioresManha' }

  const extScenes = scenes.filter(s =>
    (s.intExt || '').toUpperCase() === 'EXT' &&
    s.scheduledBlock === 'tarde' // Se está agendado para tarde sem golden
  )

  if (extScenes.length > 0) {
    return {
      valid: false,
      message: `${extScenes.length} cena(s) EXT agendada(s) para tarde — mover para manhã`,
      severity: 'warn',
      rule: 'exterioresManha',
    }
  }

  return { valid: true, rule: 'exterioresManha' }
}

// ── Regra 4: GOLDEN HOUR SAGRADO ─────────────────────────────────
// Cenas golden hour só nessa janela; outras cenas não invadem esse bloco
export function goldenHourSagrado(day, scenes, goldenHourInfo) {
  if (!scenes || scenes.length === 0) return { valid: true }

  const goldenScenes = scenes.filter(s => s.goldenHour || s.solarDependent || s.isGoldenHour)
  const windowType = day.windowType || 'completo'

  // Se há cenas golden hour mas o dia não tem janela golden
  if (goldenScenes.length > 0 && windowType !== 'golden_hour' && !day.hasGoldenHourSlot) {
    return {
      valid: false,
      message: `${goldenScenes.length} cena(s) golden hour sem janela dedicada no dia`,
      severity: 'error',
      rule: 'goldenHourSagrado',
    }
  }

  // Se o dia é golden_hour mas tem cenas INT
  if (windowType === 'golden_hour') {
    const intScenes = scenes.filter(s => (s.intExt || '').toUpperCase() === 'INT')
    if (intScenes.length > 0) {
      return {
        valid: false,
        message: `Dia golden hour contém ${intScenes.length} cena(s) INT — só EXT permitido`,
        severity: 'error',
        rule: 'goldenHourSagrado',
      }
    }
  }

  return { valid: true, rule: 'goldenHourSagrado' }
}

// ── Regra 5: MENORES LIMITE LEGAL ────────────────────────────────
// Actores com menos de 16: máx 6h de presença; alerta aos 5.5h
export function menoresLimite(day, scenes, team) {
  if (!scenes || scenes.length === 0 || !team) return { valid: true }

  const menores = (team || []).filter(m =>
    m.isMinor || (m.birthDate && isUnder16(m.birthDate))
  )
  if (menores.length === 0) return { valid: true, rule: 'menoresLimite' }

  const violations = []

  menores.forEach(menor => {
    // Cenas em que este menor aparece
    const scenesWithMinor = scenes.filter(s =>
      (s.characters || []).includes(menor.characterName || menor.name)
    )
    if (scenesWithMinor.length === 0) return

    const totalMin = scenesWithMinor.reduce((s, sc) => s + (sc.duration || 45), 0)
    const totalH = totalMin / 60

    if (totalH > 6) {
      violations.push({
        name: menor.characterName || menor.name,
        hours: totalH.toFixed(1),
        severity: 'error',
        message: `${menor.characterName || menor.name}: ${totalH.toFixed(1)}h (máx legal 6h)`,
      })
    } else if (totalH >= 5.5) {
      violations.push({
        name: menor.characterName || menor.name,
        hours: totalH.toFixed(1),
        severity: 'warn',
        message: `${menor.characterName || menor.name}: ${totalH.toFixed(1)}h (aproxima limite legal de 6h)`,
      })
    }
  })

  if (violations.length > 0) {
    const hasError = violations.some(v => v.severity === 'error')
    return {
      valid: false,
      message: violations.map(v => v.message).join('; '),
      severity: hasError ? 'error' : 'warn',
      rule: 'menoresLimite',
      details: violations,
    }
  }

  return { valid: true, rule: 'menoresLimite' }
}

function isUnder16(birthDateStr) {
  try {
    const birth = new Date(birthDateStr)
    const today = new Date()
    const age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    return age < 16 || (age === 16 && m < 0)
  } catch { return false }
}

// ── Regra 6: CENAS ESPELHO JUNTAS ────────────────────────────────
// Cenas "espelho" (mirror scenes) devem ser filmadas no mesmo dia
export function cenasEspelhoJuntas(day, scenes, allDays, allAssignments) {
  if (!scenes || scenes.length === 0) return { valid: true }

  // Cenas espelho: marcadas com isMirror ou mirrorOf
  const mirrorScenes = scenes.filter(s => s.isMirror || s.mirrorOf)
  if (mirrorScenes.length === 0) return { valid: true, rule: 'cenasEspelhoJuntas' }

  const violations = []

  mirrorScenes.forEach(scene => {
    const mirrorKey = scene.mirrorOf
    if (!mirrorKey) return

    // Verificar se a cena espelho está no mesmo dia
    const mirrorDayId = allAssignments?.[mirrorKey]
    if (mirrorDayId && mirrorDayId !== day.id) {
      violations.push(`Cena #${scene.sceneNumber} separada da sua cena espelho`)
    }
  })

  if (violations.length > 0) {
    return {
      valid: false,
      message: violations.join('; '),
      severity: 'warn',
      rule: 'cenasEspelhoJuntas',
    }
  }

  return { valid: true, rule: 'cenasEspelhoJuntas' }
}

// ── Regra 7: ACTORES DISPONÍVEIS ─────────────────────────────────
// Disponibilidade do actor verificada antes de alocar
export function actoresDisponiveis(day, scenes, team) {
  if (!scenes || scenes.length === 0 || !team) return { valid: true }

  const violations = []
  const dayDate = day.date

  scenes.forEach(scene => {
    ;(scene.characters || []).forEach(charName => {
      const actor = team.find(m =>
        m.characterName === charName || m.name === charName
      )
      if (!actor) return

      // Normalizar availability — suporta string legacy e novo objecto estruturado
      const avail = typeof actor.availability === 'object' && actor.availability !== null
        ? actor.availability
        : {}

      // Se tem lista de datas disponíveis e o dia não está na lista
      if (avail.dates && avail.dates.length > 0 && dayDate) {
        if (!avail.dates.includes(dayDate)) {
          violations.push(`${charName}: indisponível em ${dayDate}`)
          return
        }
      }

      // Se marcado como explicitamente indisponível
      if (avail.unavailable?.includes(dayDate)) {
        violations.push(`${charName}: marcado indisponível em ${dayDate}`)
      }
    })
  })

  if (violations.length > 0) {
    return {
      valid: false,
      message: violations.join('; '),
      severity: 'error',
      rule: 'actoresDisponiveis',
      details: violations,
    }
  }

  return { valid: true, rule: 'actoresDisponiveis' }
}

// ── Validador completo do dia ─────────────────────────────────────
export const RULES = {
  localContinuo,
  ancoraNuncaNoFim,
  exterioresManha,
  goldenHourSagrado,
  menoresLimite,
  cenasEspelhoJuntas,
  actoresDisponiveis,
}

export function validateDay(day, scenes, team = [], options = {}) {
  const { allDays = [], allAssignments = {}, goldenHourInfo = null } = options

  const results = [
    RULES.localContinuo(day, scenes),
    RULES.ancoraNuncaNoFim(day, scenes),
    RULES.exterioresManha(day, scenes),
    RULES.goldenHourSagrado(day, scenes, goldenHourInfo),
    RULES.menoresLimite(day, scenes, team),
    RULES.cenasEspelhoJuntas(day, scenes, allDays, allAssignments),
    RULES.actoresDisponiveis(day, scenes, team),
  ]

  const violations = results.filter(r => !r.valid)
  const hasError = violations.some(r => r.severity === 'error')
  const hasWarn  = violations.some(r => r.severity === 'warn')

  return {
    valid: violations.length === 0,
    violations,
    severity: hasError ? 'error' : hasWarn ? 'warn' : 'ok',
    results,
  }
}
