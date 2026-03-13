// FRAME Schedule Engine — algoritmo de 8 passos (v2)
// Baseado no FRAME_ALGORITMO_SCHEDULE_BRIEF.txt
// Função pura: não muta estado, retorna novo plano enriquecido
//
// Mudanças chave vs v1:
//   - Grupos de local são unidades ATÓMICAS (nunca partidos entre dias)
//   - FFD (First Fit Decreasing) com 2 passes
//   - Ordenação de blocos dentro do dia (EXT manhã, âncoras nunca no fim, golden last)
//   - Alocação de horas reais por bloco
//   - 7 oportunidades detectadas automaticamente
//   - Custo por dia estimado
//   - Normalização de nomes de locais

import {
  calcDuracao,
  classifyScene,
  DAY_WINDOWS,
  capacidadeSegura,
  calcMoveTime,
} from './sceneDuration.js'
import { validateDay } from './scheduleRules.js'
import { optimizeWithBacktracking, verificarRestricoes } from './scheduleConstraints.js'

// ── Cores por local (gerada deterministicamente) ──────────────────
const LOCATION_PALETTE = [
  '#2E6FA0', '#2EA080', '#A02E6F', '#7B4FBF', '#BF6A2E',
  '#4F7F3F', '#A07B2E', '#6F2EA0', '#1E7A6E', '#7A2E1E',
  '#2E5FA0', '#A04F2E', '#2EA05F', '#5F2EA0', '#A02E2E',
]

const locationColorMap = new Map()
let colorIdx = 0

function getLocationColor(loc) {
  if (!locationColorMap.has(loc)) {
    locationColorMap.set(loc, LOCATION_PALETTE[colorIdx % LOCATION_PALETTE.length])
    colorIdx++
  }
  return locationColorMap.get(loc)
}

// ── Normalização de nomes de locais ───────────────────────────────
// Detecta duplicados: "Cozinha João" vs "INT. Cozinha" → mesmo local
function normalizeLocationName(name) {
  if (!name) return 'SEM LOCAL'
  return name
    .replace(/^(INT\.?|EXT\.?|I\/E\.?)\s*/i, '')
    .replace(/\s*[-–—]\s*(DIA|NOITE|MANHÃ|TARDE|GOLDEN|ENTARDECER)$/i, '')
    .trim()
    .toLowerCase()
}

// Tokens partilhados > 60% → provavelmente o mesmo local
function locationSimilarity(a, b) {
  const tokA = normalizeLocationName(a).split(/\s+/)
  const tokB = normalizeLocationName(b).split(/\s+/)
  if (tokA.length === 0 || tokB.length === 0) return 0
  const shared = tokA.filter(t => tokB.includes(t)).length
  return shared / Math.max(tokA.length, tokB.length)
}

// Agrupa locais similares, retorna mapa de nome original → nome canónico
function buildLocationAliasMap(scenes) {
  const names = [...new Set(scenes.map(s => s.location || 'SEM LOCAL'))]
  const aliasMap = {}

  // Para cada par, verificar similaridade
  const merged = new Map() // canonical → [aliases]
  const assigned = new Set()

  for (let i = 0; i < names.length; i++) {
    if (assigned.has(names[i])) continue
    const group = [names[i]]
    assigned.add(names[i])

    for (let j = i + 1; j < names.length; j++) {
      if (assigned.has(names[j])) continue
      const sim = locationSimilarity(names[i], names[j])
      if (sim > 0.6) {
        group.push(names[j])
        assigned.add(names[j])
      }
    }

    // O nome mais curto é o canónico (mais provável de ser o "limpo")
    const canonical = group.sort((a, b) => a.length - b.length)[0]
    group.forEach(n => { aliasMap[n] = canonical })
  }

  return aliasMap
}

// ── Passo 1: Flatten e enriquecer todas as cenas ──────────────────
function flattenAndEnrich(parsedScripts, aliasMap) {
  const scenes = []
  colorIdx = 0
  locationColorMap.clear()

  Object.entries(parsedScripts || {}).forEach(([epId, epData]) => {
    ;(epData.scenes || []).forEach(scene => {
      const sceneType = classifyScene(scene)
      const rawLoc = scene.location || 'SEM LOCAL'
      const canonLoc = aliasMap[rawLoc] || rawLoc
      const intExt = scene.intExt
        || ((rawLoc).toUpperCase().startsWith('EXT') ? 'EXT' : 'INT')

      scenes.push({
        ...scene,
        sceneKey: `${epId}-${scene.sceneNumber || scene.id}`,
        epId,
        sceneType,
        intExt,
        locationRaw: rawLoc,
        location: canonLoc,
        locationColor: getLocationColor(canonLoc),
      })
    })
  })

  return scenes
}

// ── Passo 2: Calcular duração real com modificadores ──────────────
function enrichSceneDurations(scenes) {
  const locationFirstSeen = new Map()

  return scenes.map(scene => {
    const loc = scene.location || 'SEM LOCAL'
    const isPrimeiro = !locationFirstSeen.has(loc)
    if (isPrimeiro) locationFirstSeen.set(loc, true)

    const dur = calcDuracao(scene, isPrimeiro)

    return {
      ...scene,
      duration: dur.total,
      durationBase: dur.base,
      durationFactor: dur.factor,
      durationMods: dur.mods,
      isPrimeiroNoLocal: isPrimeiro,
    }
  })
}

// ── Passo 3: Agrupar cenas por local (unidades atómicas) ──────────
// Turnaround entre cenas no mesmo local: reposição câmara, prep actores
const TURNAROUND_ENTRE_CENAS = 10

function groupByLocation(scenes) {
  const groups = new Map()

  scenes.forEach(scene => {
    const loc = scene.location || 'SEM LOCAL'
    if (!groups.has(loc)) {
      groups.set(loc, {
        local_id: loc,
        location: loc,
        scenes: [],
        soma_duracao: 0,
        tem_ancora: false,
        tem_golden: false,
        tem_exterior: false,
        tem_menor: false,
        peso_narrativo: 0,
        episodios: new Set(),
        color: scene.locationColor,
        num_cenas: 0,
      })
    }

    const g = groups.get(loc)
    // Turnaround entre cenas (não na primeira)
    if (g.scenes.length > 0) {
      g.soma_duracao += TURNAROUND_ENTRE_CENAS
    }
    g.scenes.push(scene)
    g.soma_duracao += scene.duration || 45
    g.tem_ancora = g.tem_ancora || (scene.sceneType || '').toLowerCase() === 'âncora'
    g.tem_golden = g.tem_golden || !!scene.isGoldenHour
    g.tem_exterior = g.tem_exterior || scene.intExt === 'EXT'
    g.tem_menor = g.tem_menor || !!(scene.hasMinor || (scene.durationMods || []).some(m => m.key === 'menor'))
    g.peso_narrativo = Math.max(g.peso_narrativo, scene.peso_narrativo || scene.narrativeWeight || 1)
    g.episodios.add(scene.epId)
    g.num_cenas = g.scenes.length
  })

  return [...groups.values()]
}

// ── Passo 4: Score de prioridade global por grupo ─────────────────
function calcScoreGlobal(grupo) {
  let score = 0
  if (grupo.tem_ancora)     score += 100
  if (grupo.tem_golden)     score += 80
  if (grupo.tem_menor)      score += 70
  if (grupo.num_cenas > 5)  score += 60
  if (grupo.tem_exterior)   score += 50
  score += grupo.peso_narrativo * 10
  return score
}

function sortGroups(groups) {
  return [...groups]
    .map(g => ({ ...g, _score: calcScoreGlobal(g) }))
    .sort((a, b) => {
      // FFD: maiores primeiro (First Fit Decreasing por duração + score)
      const scoreDiff = b._score - a._score
      if (scoreDiff !== 0) return scoreDiff
      return b.soma_duracao - a.soma_duracao
    })
}

// ── Passo 5: FFD — distribuir GRUPOS pelos dias (atómico) ─────────
function fillDays(sortedGroups, days, mode, envelope, avgDuration, team = []) {
  const effectiveDays = mode === 'budget' && envelope
    ? days.slice(0, envelope)
    : days

  if (!effectiveDays.length) {
    return {
      dayGroups: {},
      dayLoad: {},
      overflow: sortedGroups,
      locaisPartidos: [],
    }
  }

  const dayGroups = {}    // { dayId: [grupo, ...] }
  const dayLoad = {}      // { dayId: minutosUsados }
  const dayMoveCount = {} // { dayId: número de mudanças de local }

  effectiveDays.forEach(d => {
    dayGroups[d.id] = []
    dayLoad[d.id] = 0
    dayMoveCount[d.id] = 0
  })

  const overflow = []
  const locaisPartidos = []
  const moveT = calcMoveTime(null, avgDuration)

  // Pass 1: Alocar grupos grandes primeiro (FFD) com verificação de restrições
  const pass2Candidates = [] // grupos pequenos para o pass 2

  for (const grupo of sortedGroups) {
    let alocado = false

    for (const day of effectiveDays) {
      const winType = day.windowType || 'completo'
      const cap = capacidadeSegura(winType)

      // Move time: se já há grupos neste dia, adicionar
      const moveMin = dayGroups[day.id].length > 0 ? moveT.entreLocais : 0
      const custoTotal = grupo.soma_duracao + moveMin

      if (dayLoad[day.id] + custoTotal <= cap) {
        // Verificar restrições antes de alocar
        const check = verificarRestricoes(grupo, day, dayGroups[day.id], team)
        if (check.passa) {
          dayGroups[day.id].push(grupo)
          dayLoad[day.id] += custoTotal
          dayMoveCount[day.id] += dayGroups[day.id].length > 1 ? 1 : 0
          alocado = true
          break
        }
        // Se não passa, tentar o próximo dia
      }
    }

    if (!alocado) {
      // Verificar se o grupo é IMPOSSÍVEL (maior que um dia inteiro)
      const maxCap = capacidadeSegura('completo')
      if (grupo.soma_duracao > maxCap) {
        // Partir o grupo em dois sub-grupos
        const split1Scenes = []
        const split2Scenes = []
        let acum = 0
        const target = maxCap * 0.85 // 85% do dia para o primeiro bloco

        grupo.scenes.forEach(scene => {
          if (acum + scene.duration <= target) {
            split1Scenes.push(scene)
            acum += scene.duration
          } else {
            split2Scenes.push(scene)
          }
        })

        if (split1Scenes.length > 0 && split2Scenes.length > 0) {
          const sub1 = { ...grupo, scenes: split1Scenes, soma_duracao: acum, num_cenas: split1Scenes.length }
          const sub2 = {
            ...grupo,
            scenes: split2Scenes,
            soma_duracao: split2Scenes.reduce((s, sc) => s + sc.duration, 0),
            num_cenas: split2Scenes.length,
          }

          locaisPartidos.push({
            local: grupo.location,
            totalMin: grupo.soma_duracao,
            partes: 2,
            cenas: grupo.num_cenas,
          })

          // Tentar alocar os sub-grupos
          for (const sub of [sub1, sub2]) {
            let subAlocado = false
            for (const day of effectiveDays) {
              const cap = capacidadeSegura(day.windowType || 'completo')
              const moveMin = dayGroups[day.id].length > 0 ? moveT.entreLocais : 0
              if (dayLoad[day.id] + sub.soma_duracao + moveMin <= cap) {
                dayGroups[day.id].push(sub)
                dayLoad[day.id] += sub.soma_duracao + moveMin
                subAlocado = true
                break
              }
            }
            if (!subAlocado) {
              overflow.push(sub)
            }
          }
          continue
        }
      }

      overflow.push(grupo)
    }
  }

  // Pass 2: tentar encaixar grupos do overflow nos espaços que sobram
  const stillOverflow = []
  for (const grupo of overflow) {
    let encaixado = false
    for (const day of effectiveDays) {
      const cap = capacidadeSegura(day.windowType || 'completo')
      const moveMin = dayGroups[day.id].length > 0 ? moveT.entreLocais : 0
      const remaining = cap - dayLoad[day.id]

      if (grupo.soma_duracao + moveMin <= remaining) {
        const check = verificarRestricoes(grupo, day, dayGroups[day.id], team)
        if (check.passa) {
          dayGroups[day.id].push(grupo)
          dayLoad[day.id] += grupo.soma_duracao + moveMin
          encaixado = true
          break
        }
      }
    }
    if (!encaixado) stillOverflow.push(grupo)
  }

  return { dayGroups, dayLoad, dayMoveCount, overflow: stillOverflow, locaisPartidos }
}

// ── Passo 7: Ordenar blocos dentro do dia ─────────────────────────
// Prioridade: EXT manhã > menores cedo > grandes no meio > INT livre > âncoras NUNCA no fim > golden last
function ordenarBlocosDoDia(grupos) {
  if (grupos.length <= 1) return grupos

  return [...grupos].sort((a, b) => {
    // Golden hour → sempre último
    if (a.tem_golden && !b.tem_golden) return 1
    if (b.tem_golden && !a.tem_golden) return -1

    // Âncoras → nunca no fim (penalizar se ficarem por último)
    // Mover para posições anteriores
    if (a.tem_ancora && !b.tem_ancora) return -1
    if (b.tem_ancora && !a.tem_ancora) return 1

    // EXT sem golden → manhã (primeiro)
    if (a.tem_exterior && !a.tem_golden && !(b.tem_exterior && !b.tem_golden)) return -1
    if (b.tem_exterior && !b.tem_golden && !(a.tem_exterior && !a.tem_golden)) return 1

    // Menores → cedo
    if (a.tem_menor && !b.tem_menor) return -1
    if (b.tem_menor && !a.tem_menor) return 1

    // Maiores no meio (descendente por duração)
    return b.soma_duracao - a.soma_duracao
  })
}

// ── Passo 8: Alocar horas reais dentro do dia ─────────────────────
function alocarHorasDoDia(gruposOrdenados, day, avgDuration) {
  const callTime = day.callTime || '08:00'
  const [callH, callM] = callTime.split(':').map(Number)
  let cursor = callH * 60 + callM  // minutos desde meia-noite

  const winType = day.windowType || 'completo'
  const winData = DAY_WINDOWS[winType] || DAY_WINDOWS.completo
  const almocoStart = cursor + (winData.manha || 300) // 5h de manhã por defeito
  const almocoDur = winData.almoco || 60

  const moveT = calcMoveTime(null, avgDuration)
  const blocos = []
  let almocoInserido = false

  for (let i = 0; i < gruposOrdenados.length; i++) {
    const grupo = gruposOrdenados[i]
    const moveMin = i > 0 ? moveT.entreLocais : 0

    // Inserir almoço ANTES da deslocação se já cruzámos o almocoStart
    // (evita buracos mortos: o almoço segue-se ao bloco que cruzou a hora)
    if (!almocoInserido && almocoDur > 0 && cursor >= almocoStart) {
      blocos.push({
        tipo: 'almoco',
        location: 'ALMOÇO',
        color: 'var(--text-muted)',
        hora_inicio: minToTime(cursor),
        hora_fim: minToTime(cursor + almocoDur),
        inicio_min: cursor,
        fim_min: cursor + almocoDur,
        duracao: almocoDur,
        move_antes: 0,
        cenas: [],
        num_cenas: 0,
      })
      cursor += almocoDur
      almocoInserido = true
    }

    cursor += moveMin

    const horaInicio = cursor
    const horaFim = cursor + grupo.soma_duracao

    blocos.push({
      grupo_id: grupo.local_id,
      location: grupo.location,
      color: grupo.color,
      hora_inicio: minToTime(horaInicio),
      hora_fim: minToTime(horaFim),
      inicio_min: horaInicio,
      fim_min: horaFim,
      duracao: grupo.soma_duracao,
      move_antes: moveMin,
      cenas: grupo.scenes,
      num_cenas: grupo.num_cenas,
      tem_ancora: grupo.tem_ancora,
      tem_exterior: grupo.tem_exterior,
      episodios: [...grupo.episodios],
    })

    cursor = horaFim

    // Inserir almoço DEPOIS do bloco se acabámos de cruzar o almocoStart
    // e ainda há blocos para depois (evita almoço no fim do dia)
    if (!almocoInserido && almocoDur > 0 && cursor >= almocoStart && i < gruposOrdenados.length - 1) {
      blocos.push({
        tipo: 'almoco',
        location: 'ALMOÇO',
        color: 'var(--text-muted)',
        hora_inicio: minToTime(cursor),
        hora_fim: minToTime(cursor + almocoDur),
        inicio_min: cursor,
        fim_min: cursor + almocoDur,
        duracao: almocoDur,
        move_antes: 0,
        cenas: [],
        num_cenas: 0,
      })
      cursor += almocoDur
      almocoInserido = true
    }
  }

  const wrapMin = cursor
  const totalRodagem = gruposOrdenados.reduce((s, g) => s + g.soma_duracao, 0)
  const totalMoves = blocos.reduce((s, b) => s + b.move_antes, 0)
  const totalDia = totalRodagem + totalMoves + (almocoInserido ? almocoDur : 0)

  return {
    blocos,
    hora_wrap: minToTime(wrapMin),
    wrap_min: wrapMin,
    almoco_inserido: almocoInserido,
    utilizacao_pct: Math.round(
      totalRodagem / (winData.total || 600) * 100
    ),
    total_rodagem: totalRodagem,
    total_moves: totalMoves,
  }
}

function minToTime(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ── Detecção de oportunidades ─────────────────────────────────────
function detectOpportunities(groups, enrichedDays, overflow, mode, envelope, days) {
  const oportunidades = []

  // 1. Cenas espelho — mesmo local em episódios diferentes
  const espelhos = groups.filter(g => g.episodios.size > 1)
  if (espelhos.length > 0) {
    const savedDays = espelhos.reduce((s, g) => s + (g.episodios.size - 1), 0)
    oportunidades.push({
      tipo: 'espelhos',
      severity: 'info',
      message: `${espelhos.length} local(ais) com cenas em múltiplos episódios — agrupados automaticamente`,
      detalhes: espelhos.map(g => ({
        local: g.location,
        episodios: [...g.episodios],
        cenas: g.num_cenas,
      })),
      poupanca_estimada: `~${savedDays * 0.5} dia(s)`,
    })
  }

  // 3. Dias subutilizados (< 40%)
  const subutilizados = enrichedDays.filter(d => d.utilization > 0 && d.utilization < 40)
  if (subutilizados.length > 0) {
    oportunidades.push({
      tipo: 'dias_subutilizados',
      severity: 'warn',
      message: `${subutilizados.length} dia(s) com utilização < 40% — considerar adicionar picks`,
      detalhes: subutilizados.map(d => ({
        dia: d.label || d.id,
        utilizacao: d.utilization + '%',
      })),
    })
  }

  // 4. Actores com janela curta (aparece em muitas cenas mas poucos dias)
  // Detectado através dos dados de presença
  const charDayCount = {}
  const charSceneCount = {}
  enrichedDays.forEach(d => {
    const chars = new Set()
    ;(d.scenes || []).forEach(s => {
      ;(s.characters || []).forEach(c => {
        chars.add(c)
        charSceneCount[c] = (charSceneCount[c] || 0) + 1
      })
    })
    chars.forEach(c => { charDayCount[c] = (charDayCount[c] || 0) + 1 })
  })

  const actoresCriticos = Object.entries(charSceneCount)
    .filter(([c, count]) => count >= 5 && (charDayCount[c] || 0) <= 2)
    .map(([c, count]) => ({ actor: c, cenas: count, dias: charDayCount[c] || 0 }))

  if (actoresCriticos.length > 0) {
    oportunidades.push({
      tipo: 'actores_criticos',
      severity: 'warn',
      message: `${actoresCriticos.length} actor(es) com muitas cenas concentradas em poucos dias`,
      detalhes: actoresCriticos,
    })
  }

  // 5. Dias impossíveis (overflow)
  if (overflow.length > 0) {
    const overflowScenes = overflow.flatMap(g => g.scenes || [])
    oportunidades.push({
      tipo: 'overflow',
      severity: 'error',
      message: `${overflowScenes.length} cena(s) de ${overflow.length} local(ais) sem dia — faltam dias ou capacidade`,
      detalhes: overflow.map(g => ({
        local: g.location,
        cenas: g.num_cenas,
        minutos: g.soma_duracao,
      })),
    })
  }

  // 6. Golden hour em conflito
  const goldenGroups = groups.filter(g => g.tem_golden)
  const goldenDays = enrichedDays.filter(d =>
    d.windowType === 'golden_hour' || d.hasGoldenHourSlot
  )
  if (goldenGroups.length > goldenDays.length && goldenGroups.length > 0) {
    oportunidades.push({
      tipo: 'golden_conflito',
      severity: 'warn',
      message: `${goldenGroups.length} locais precisam de golden hour mas só há ${goldenDays.length} dia(s) com janela golden`,
      detalhes: goldenGroups.map(g => ({ local: g.location, cenas: g.num_cenas })),
    })
  }

  // 7. Envelope apertado
  if (mode === 'budget' && envelope && overflow.length > 0) {
    const cenasExcluidas = overflow.flatMap(g => g.scenes || [])
    const ancoras = cenasExcluidas.filter(s => (s.sceneType || '').toLowerCase() === 'âncora')

    oportunidades.push({
      tipo: 'envelope_apertado',
      severity: ancoras.length > 0 ? 'error' : 'warn',
      message: `Com ${envelope} dias, ${cenasExcluidas.length} cenas ficam de fora` +
        (ancoras.length > 0 ? ` — incluindo ${ancoras.length} âncora(s)!` : ''),
      detalhes: {
        cenas_excluidas: cenasExcluidas.length,
        ancoras_excluidas: ancoras.map(s => `${s.epId} #${s.sceneNumber}`),
        sugestao: `Modo criativo precisa de ${days.length} dias`,
      },
    })
  }

  return oportunidades
}

// ── Cálculo de horas extra ────────────────────────────────────────
// Brief: se janela <= 8h: 0; 8-10h: (j-8)×0.125; >10h: 2×0.125+(j-10)×0.25
function calcHorasExtra(totalHorasDia) {
  if (totalHorasDia <= 8) return { fator: 0, custo_pct: 0 }
  if (totalHorasDia <= 10) {
    const extra = totalHorasDia - 8
    return { fator: extra * 0.125, custo_pct: Math.round(extra * 12.5) }
  }
  // > 10h
  const extra = 2 * 0.125 + (totalHorasDia - 10) * 0.25
  return { fator: extra, custo_pct: Math.round(extra * 100) }
}

// ── Custo por dia estimado (com overtime) ─────────────────────────
function calcCustosPorDia(enrichedDays, team) {
  return enrichedDays.map(day => {
    const chars = day.characters || []
    let custoEquipa = 0
    let custoElenco = 0

    ;(team || []).forEach(member => {
      const cache = member.cacheDiario || 0
      if (cache <= 0) return

      if (member.group === 'Elenco') {
        const isPresent = chars.includes(member.characterName || member.name)
        if (isPresent) {
          custoElenco += cache
          custoEquipa += cache
        }
      } else {
        custoEquipa += cache
      }
    })

    // Horas extra
    const totalH = (day.totalMin || 0) / 60
    const overtime = calcHorasExtra(totalH)
    const custoOvertime = Math.round(custoEquipa * overtime.fator)

    return {
      dayId: day.id,
      label: day.label,
      custoEquipa,
      custoElenco,
      custoOvertime,
      overtime,
      custoEstimado: custoEquipa + custoOvertime,
    }
  })
}

// ── Passo 6: Enriquecer dias com metadados ─────────────────────────
function enrichDays(days, dayGroups, dayAlloc, allScenes, team, allAssignments) {
  return days.map(day => {
    const grupos = dayGroups[day.id] || []
    const alloc = dayAlloc[day.id]
    const dayScenes = grupos.flatMap(g => g.scenes)
    const totalMin = dayScenes.reduce((s, sc) => s + (sc.duration || 45), 0)
    const winType = day.windowType || 'completo'
    const cap = capacidadeSegura(winType)
    const utilization = alloc ? alloc.utilizacao_pct : (cap > 0 ? Math.round((totalMin / cap) * 100) : 0)

    // Locais únicos do dia (em ordem de blocos)
    const locations = []
    const seenLocs = new Set()
    if (alloc?.blocos) {
      alloc.blocos.forEach(b => {
        if (!seenLocs.has(b.location)) {
          seenLocs.add(b.location)
          locations.push({ name: b.location, color: b.color || '#6E6E78' })
        }
      })
    } else {
      dayScenes.forEach(s => {
        const loc = s.location || 'SEM LOCAL'
        if (!seenLocs.has(loc)) {
          seenLocs.add(loc)
          locations.push({ name: loc, color: s.locationColor || '#6E6E78' })
        }
      })
    }

    // Personagens únicos do dia
    const characters = [...new Set(dayScenes.flatMap(s => s.characters || []))]

    // Construir assignments para este dia
    const dayAssignments = {}
    dayScenes.forEach(s => { dayAssignments[s.sceneKey] = day.id })

    // Validar regras
    const validation = validateDay(day, dayScenes, team, {
      allAssignments: allAssignments,
    })

    // Wrap time
    let wrapTime = null
    if (alloc) {
      wrapTime = alloc.hora_wrap
    } else if (day.callTime) {
      try {
        const [h, m] = day.callTime?.split(':').map(Number)
        const startMin = h * 60 + m
        const winData = DAY_WINDOWS[winType] || DAY_WINDOWS.completo
        const endMin = startMin + totalMin + winData.almoco + Math.round(totalMin * 0.1)
        const wrapH = Math.floor(endMin / 60)
        const wrapM = endMin % 60
        wrapTime = `${String(wrapH).padStart(2, '0')}:${String(wrapM).padStart(2, '0')}`
      } catch {}
    }

    return {
      ...day,
      scenes: dayScenes,
      blocos: alloc?.blocos || [],
      totalMin,
      utilization,
      utilStatus: utilization >= 100 ? 'red' : utilization >= 90 ? 'yellow' : 'green',
      locations,
      characters,
      validation,
      wrapTime,
      windowType: winType,
      grupos: grupos.length,
      moveTime: alloc?.total_moves || 0,
    }
  })
}

// ── Passo 7 global: Calcular alertas ─────────────────────────────
function calcAlertas(enrichedDays, overflow) {
  const alertas = []
  const overflowScenes = overflow.flatMap(g => g.scenes || [])

  if (overflowScenes.length > 0) {
    alertas.push({
      tipo: 'overflow',
      severity: 'error',
      message: `${overflowScenes.length} cena(s) sem dia atribuído — faltam dias de rodagem`,
      count: overflowScenes.length,
    })
  }

  enrichedDays.forEach(day => {
    if (day.utilization > 100) {
      alertas.push({
        tipo: 'sobrecarga',
        severity: 'error',
        dayId: day.id,
        message: `Dia ${day.label || day.id} sobrecarregado (${day.utilization}%)`,
      })
    } else if (day.utilization > 90) {
      alertas.push({
        tipo: 'quase_cheio',
        severity: 'warn',
        dayId: day.id,
        message: `Dia ${day.label || day.id} quase cheio (${day.utilization}%)`,
      })
    }

    day.validation?.violations?.forEach(v => {
      alertas.push({
        tipo: v.rule,
        severity: v.severity,
        dayId: day.id,
        message: `${day.label || day.id}: ${v.message}`,
      })
    })
  })

  return alertas
}

// ── Engine principal ──────────────────────────────────────────────
export function runScheduleEngine({
  parsedScripts = {},
  days = [],
  existingAssignments = {},
  team = [],
  mode = 'creative',
  envelope = null,
  respectExisting = true,
}) {
  // Passo 0: Normalizar nomes de locais
  const tempScenes = []
  Object.entries(parsedScripts || {}).forEach(([epId, epData]) => {
    ;(epData.scenes || []).forEach(scene => {
      tempScenes.push(scene)
    })
  })
  const aliasMap = buildLocationAliasMap(tempScenes)

  // Passo 1: Flatten + enrich
  let allScenes = flattenAndEnrich(parsedScripts, aliasMap)

  // Passo 2: Enriquecer durações
  allScenes = enrichSceneDurations(allScenes)

  // Calcular média global de durações (para move time)
  const avgDuration = allScenes.length > 0
    ? Math.round(allScenes.reduce((s, sc) => s + sc.duration, 0) / allScenes.length)
    : 45

  // Passo 3: Separar cenas já atribuídas manualmente
  const manuallyAssigned = respectExisting
    ? Object.fromEntries(
        Object.entries(existingAssignments).filter(([k]) =>
          allScenes.find(s => s.sceneKey === k)
        )
      )
    : {}

  const manualSceneKeys = new Set(Object.keys(manuallyAssigned))
  const unassigned = allScenes.filter(s => !manualSceneKeys.has(s.sceneKey))

  // Passo 4: Agrupar por local e ordenar (FFD)
  const groups = groupByLocation(unassigned)
  const sorted = sortGroups(groups)

  // Passo 5: Distribuir GRUPOS pelos dias (atómico) — FFD + 2 passes
  const fillResult = fillDays(sorted, days, mode, envelope, avgDuration, team)

  // Passo 5b: CSP backtracking — optimizar resultado do FFD
  const cspResult = optimizeWithBacktracking(
    fillResult.dayGroups, days, team, fillResult.overflow
  )
  const { dayGroups } = cspResult
  const overflow = cspResult.overflow
  const locaisPartidos = fillResult.locaisPartidos

  // Inserir cenas manualmente atribuídas nos dayGroups
  Object.entries(manuallyAssigned).forEach(([sceneKey, dayId]) => {
    if (!dayGroups[dayId]) return
    const scene = allScenes.find(s => s.sceneKey === sceneKey)
    if (!scene) return

    // Verificar se já existe um grupo para este local neste dia
    const loc = scene.location || 'SEM LOCAL'
    let existingGroup = dayGroups[dayId].find(g => g.location === loc)
    if (existingGroup) {
      if (!existingGroup.scenes.find(s => s.sceneKey === sceneKey)) {
        existingGroup.scenes.push(scene)
        existingGroup.soma_duracao += scene.duration || 45
        existingGroup.num_cenas++
      }
    } else {
      dayGroups[dayId].push({
        local_id: loc,
        location: loc,
        scenes: [scene],
        soma_duracao: scene.duration || 45,
        tem_ancora: (scene.sceneType || '').toLowerCase() === 'âncora',
        tem_golden: !!scene.isGoldenHour,
        tem_exterior: scene.intExt === 'EXT',
        tem_menor: !!(scene.hasMinor),
        peso_narrativo: scene.peso_narrativo || 1,
        episodios: new Set([scene.epId]),
        color: scene.locationColor,
        num_cenas: 1,
      })
    }
  })

  // Passo 7: Ordenar blocos dentro de cada dia
  const dayAllocations = {}
  Object.entries(dayGroups).forEach(([dayId, grupos]) => {
    const ordered = ordenarBlocosDoDia(grupos)
    dayGroups[dayId] = ordered
    const day = days.find(d => d.id === dayId)
    if (day) {
      dayAllocations[dayId] = alocarHorasDoDia(ordered, day, avgDuration)
    }
  })

  // Construir assignments finais
  const finalAssignments = {}
  Object.entries(dayGroups).forEach(([dayId, grupos]) => {
    grupos.forEach(g => {
      g.scenes.forEach(s => {
        finalAssignments[s.sceneKey] = dayId
      })
    })
  })

  // Passo 6: Enriquecer dias
  const enrichedDays = enrichDays(days, dayGroups, dayAllocations, allScenes, team, finalAssignments)

  // Passo 7: Alertas
  const alertas = calcAlertas(enrichedDays, overflow)

  // Oportunidades
  const oportunidades = detectOpportunities(groups, enrichedDays, overflow, mode, envelope, days)

  // Custos por dia
  const custos = calcCustosPorDia(enrichedDays, team)

  // Cenas sem dia (flatten overflow groups) — ordenadas por peso narrativo descendente
  // Âncoras primeiro (nunca devem ficar de fora), transições último
  const TIPO_PESO = { 'Âncora': 6, 'Grupo': 5, 'Diálogo': 4, 'Gag': 3, 'Solo': 2, 'Transição': 1 }
  const cenasSemDia = overflow.flatMap(g => g.scenes || [])
    .sort((a, b) => {
      const pa = (a.peso_narrativo || a.narrativeWeight || TIPO_PESO[a.sceneType] || 1)
      const pb = (b.peso_narrativo || b.narrativeWeight || TIPO_PESO[b.sceneType] || 1)
      return pb - pa
    })

  // Metadados
  const totalMin = allScenes.reduce((s, sc) => s + sc.duration, 0)
  const assignedCount = Object.keys(finalAssignments).length

  return {
    days: enrichedDays,
    allScenes,
    assignments: finalAssignments,
    cenasSemDia,
    alertas,
    oportunidades,
    custos,
    locaisPartidos,
    meta: {
      totalScenes: allScenes.length,
      assignedScenes: assignedCount,
      unassignedScenes: cenasSemDia.length,
      totalMinutes: totalMin,
      totalHours: Math.round(totalMin / 60 * 10) / 10,
      daysUsed: days.length,
      mode,
      envelope,
      avgDuration,
      utilizacao_media: enrichedDays.length > 0
        ? Math.round(enrichedDays.reduce((s, d) => s + d.utilization, 0) / enrichedDays.length)
        : 0,
      custoTotal: custos.reduce((s, c) => s + c.custoEstimado, 0),
    },
  }
}

// Helper público: classificação de cena (re-export para uso nos componentes)
export { classifyScene, getLocationColor }
