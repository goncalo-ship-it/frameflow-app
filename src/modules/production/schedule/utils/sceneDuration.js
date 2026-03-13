// Durações base e modificadores de cena
// Fonte: FRAME_SCHEDULE_BRIEF — regras de cálculo de tempo

export const DURACOES_BASE = {
  'Âncora':    75,
  'Grupo':     50,
  'Diálogo':   45,
  'Gag':       35,
  'Solo':      30,
  'Transição': 25,
}

export const DAY_WINDOWS = {
  completo:    { manha: 300, tarde: 300, almoco: 60, total: 600 },
  leve:        { manha: 240, tarde: 240, almoco: 60, total: 480 },
  so_manha:    { manha: 300, tarde: 0,   almoco: 0,  total: 300 },
  so_tarde:    { manha: 0,   tarde: 300, almoco: 0,  total: 300 },
  golden_hour: { manha: 0,   tarde: 120, almoco: 0,  total: 120 }, // EXT only
  picks:       { manha: 180, tarde: 180, almoco: 60, total: 360 },
}

const MAX_MOD = 1.8

// Classificação de cena (compatível com classifyScene do StripBoard)
export function classifyScene(scene) {
  const chars = (scene.characters || []).length
  const desc = (scene.description || '').length
  if (chars >= 4 || (chars >= 3 && desc > 200)) return 'Âncora'
  if (chars === 3) return 'Grupo'
  if (chars === 2) return 'Diálogo'
  if (chars === 1) {
    const gag = /corre|salta|cai|luta|persegue|força|empurra/i.test(scene.description || '')
    return gag ? 'Gag' : 'Solo'
  }
  return 'Transição'
}

// Calcula os modificadores para uma cena
export function calcModificadores(scene, isPrimeiraNoLocal = false) {
  const mods = []
  const intExt = scene.intExt || (scene.type === 'EXT' ? 'EXT' : 'INT')
  const desc = (scene.description || '').toLowerCase()

  // × 1.3 exterior com condições especiais
  if (intExt === 'EXT' && /chuva|vento|noite|mar|rio|praia|neve/i.test(desc)) {
    mods.push({ key: 'ext_especial', value: 1.3, label: 'EXT especial' })
  }

  // × 1.2 cena com menor (menos de 16 anos)
  const hasMinor = (scene.characters || []).some(c =>
    /criança|miúdo|menor|kid|child|bebé|bebê|júnior/i.test(c)
  ) || /menor de 16|menor|criança/i.test(desc)
  if (hasMinor) {
    mods.push({ key: 'menor', value: 1.2, label: 'Menor de 16' })
  }

  // × 1.2 primeira cena no local (setup)
  if (isPrimeiraNoLocal) {
    mods.push({ key: 'setup', value: 1.2, label: 'Setup de local' })
  }

  // × 1.15 animal
  if (/cão|gato|cavalo|animal|dog|cat|horse|pássaro|passaro|peixe/i.test(desc)) {
    mods.push({ key: 'animal', value: 1.15, label: 'Animal' })
  }

  // × 1.15 efeitos especiais
  if (/efeito|explosão|explosao|pirotecnia|sfx|vfx|stunt|dobrar/i.test(desc)) {
    mods.push({ key: 'efx', value: 1.15, label: 'Efeitos especiais' })
  }

  // × 0.85 pick (refilmagem parcial)
  if (scene.isPick || /pick|pick-up|refilm|re-film/i.test(desc)) {
    mods.push({ key: 'pick', value: 0.85, label: 'Pick' })
  }

  // × 0.8 insert / detalhe
  if (scene.isInsert || /insert|detalhe|close.?up rápido|pormenor/i.test(desc)) {
    mods.push({ key: 'insert', value: 0.8, label: 'Insert' })
  }

  return mods
}

// Calcula duração final de uma cena com modificadores
export function calcDuracao(scene, isPrimeiraNoLocal = false) {
  const tipo = scene.sceneType || classifyScene(scene)
  const base = DURACOES_BASE[tipo] ?? 45

  const mods = calcModificadores(scene, isPrimeiraNoLocal)

  // Aplica modificadores multiplicativamente, com cap em MAX_MOD
  let factor = mods.reduce((acc, m) => acc * m.value, 1)
  factor = Math.min(factor, MAX_MOD)

  return {
    base,
    factor: Math.round(factor * 100) / 100,
    total: Math.round(base * factor),
    mods,
    tipo,
  }
}

// Calcula tempo de deslocação entre locais
export function calcMoveTime(scenes, avgDuration = 45) {
  return {
    entreLocais:   Math.round(avgDuration * 0.5),  // entre locais diferentes
    internoEdificio: 10,                            // mesmo edifício, sala diferente
  }
}

// Capacidade segura de um dia (90% da janela útil)
export function capacidadeSegura(windowType = 'completo') {
  const w = DAY_WINDOWS[windowType] || DAY_WINDOWS.completo
  return Math.round(w.total * 0.90)
}
