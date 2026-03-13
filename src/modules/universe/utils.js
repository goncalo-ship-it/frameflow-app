// Universe utilities — arc types, relation types, episode data, force layout

export const ARC_TYPES = [
  { id: 'protagonista', label: 'Protagonista', color: '#5B8DEF' },
  { id: 'antagonista',  label: 'Antagonista',  color: '#E05B8D' },
  { id: 'secundário',   label: 'Secundário',   color: '#2EA080' },
  { id: 'episódico',    label: 'Episódico',    color: '#7F8C8D' },
  { id: 'mentor',       label: 'Mentor',       color: '#F5A623' },
  { id: 'aliado',       label: 'Aliado',       color: '#8B6FBF' },
]

export const ARC_MAP = Object.fromEntries(ARC_TYPES.map(a => [a.id, a]))

export const RELATION_TYPES = [
  { id: 'família',         label: 'Família',          color: '#F5A623', dash: [] },
  { id: 'amizade',         label: 'Amizade',          color: '#5B8DEF', dash: [] },
  { id: 'conflito',        label: 'Conflito',         color: '#E05B8D', dash: [6, 4] },
  { id: 'romance',         label: 'Romance',          color: '#FF6B6B', dash: [3, 5] },
  { id: 'rival',           label: 'Rival',            color: '#F87171', dash: [6, 4] },
  { id: 'colega',          label: 'Colega',            color: '#2EA080', dash: [] },
  { id: 'mentor-aprendiz', label: 'Mentor-Aprendiz',  color: '#8B6FBF', dash: [5, 3] },
  { id: 'interno',         label: 'Interno',          color: '#a78bfa', dash: [4, 6] },
  { id: 'afecto',          label: 'Afecto',           color: '#34d399', dash: [] },
  { id: 'porto-seguro',    label: 'Porto Seguro',     color: '#fb923c', dash: [] },
  { id: 'tensão',          label: 'Tensão',           color: '#ef4444', dash: [6, 4] },
  { id: 'anomalia',        label: 'Anomalia',         color: '#f472b6', dash: [3, 4] },
  { id: 'social',          label: 'Social',           color: '#f9a8d4', dash: [] },
]

export const REL_MAP = Object.fromEntries(RELATION_TYPES.map(r => [r.id, r]))

// ARC_TYPE weight for sorting (lower = more important)
export const ARC_WEIGHT = {
  protagonista: 0,
  antagonista:  1,
  mentor:       2,
  aliado:       3,
  secundário:   4,
  episódico:    5,
}

// Universe scales — concentric zones in the network
export const SCALES = [
  { id: 'centro',      label: 'Centro',       color: '#F5A623', desc: 'Protagonistas e forças centrais' },
  { id: 'real',         label: 'Real',          color: '#5B8DEF', desc: 'Mundo concreto, quotidiano, social' },
  { id: 'social',       label: 'Social',        color: '#2EA080', desc: 'Comunidade, família, instituições' },
  { id: 'liminar',      label: 'Liminar',       color: '#8B6FBF', desc: 'Fronteira entre o real e o metafísico' },
  { id: 'metafisico',   label: 'Metafísico',    color: '#E05B8D', desc: 'Forças invisíveis, destino, sobrenatural' },
  { id: 'sobrenatural',  label: 'Sobrenatural', color: '#F87171', desc: 'Magia, outro mundo, além' },
]
export const SCALE_MAP = Object.fromEntries(SCALES.map(s => [s.id, s]))

// Node size by arc type
export const ARC_NODE_SIZE = {
  protagonista: 30,
  antagonista:  26,
  mentor:       24,
  aliado:       22,
  secundário:   22,
  episódico:    18,
}

/**
 * buildEpisodeData(parsedScripts)
 * Returns { [epId]: { [CHARNAME_UPPERCASE]: { scenes: number, lines: number } } }
 */
export function buildEpisodeData(parsedScripts = {}) {
  const result = {}
  for (const [epId, data] of Object.entries(parsedScripts)) {
    if (!data) continue
    result[epId] = {}

    // Use metadata.characters if present
    if (data.metadata?.characters?.length) {
      for (const ch of data.metadata.characters) {
        const key = (ch.name || '').toUpperCase()
        if (!key) continue
        result[epId][key] = {
          scenes: Array.isArray(ch.scenes) ? ch.scenes.length : 0,
          lines:  ch.lineCount ?? 0,
        }
      }
    }

    // Also scan scenes for characters not in metadata
    if (Array.isArray(data.scenes)) {
      for (const scene of data.scenes) {
        if (!Array.isArray(scene.characters)) continue
        for (const charName of scene.characters) {
          const key = (charName || '').toUpperCase()
          if (!key) continue
          if (!result[epId][key]) {
            result[epId][key] = { scenes: 0, lines: 0 }
          }
          result[epId][key].scenes += 1
        }
      }
    }
  }
  return result
}

/**
 * getEpisodeIds(parsedScripts)
 * Returns sorted array of epIds
 */
export function getEpisodeIds(parsedScripts = {}) {
  return Object.keys(parsedScripts).sort()
}

/**
 * checkConsistency(universeChars, episodeData)
 * Returns alerts: [{ type, char, ep, severity }]
 * Finds characters in episodes not yet in Main Universe
 */
export function checkConsistency(universeChars = [], episodeData = {}) {
  const knownNames = new Set(universeChars.map(c => (c.name || '').toUpperCase()))
  const alerts = []

  for (const [epId, chars] of Object.entries(episodeData)) {
    for (const charName of Object.keys(chars)) {
      if (!knownNames.has(charName)) {
        alerts.push({
          type:     'unknown_char',
          char:     charName,
          ep:       epId,
          severity: 'info',
        })
      }
    }
  }
  return alerts
}

/**
 * computeForceLayout(chars, relations, W, H)
 * Simple force-directed layout over ITERATIONS steps.
 * Returns { [id]: { x, y } }
 */
export function computeForceLayout(chars = [], relations = [], W = 700, H = 500) {
  if (chars.length === 0) return {}

  const ITERATIONS = 180
  const CX = W / 2
  const CY = H / 2

  // Init positions: use existing x,y if set, else circular arrangement
  const pos = {}
  chars.forEach((c, i) => {
    const angle = (2 * Math.PI * i) / chars.length
    const radius = Math.min(W, H) * 0.35
    pos[c.id] = {
      x: (c.x != null && c.x > 0) ? c.x : CX + radius * Math.cos(angle),
      y: (c.y != null && c.y > 0) ? c.y : CY + radius * Math.sin(angle),
    }
  })

  // Velocity
  const vel = {}
  chars.forEach(c => { vel[c.id] = { x: 0, y: 0 } })

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const cooling = Math.pow(1 - iter / ITERATIONS, 1.5)
    const forces  = {}
    chars.forEach(c => { forces[c.id] = { x: 0, y: 0 } })

    // Repulsion between all pairs
    for (let i = 0; i < chars.length; i++) {
      for (let j = i + 1; j < chars.length; j++) {
        const a = chars[i]
        const b = chars[j]
        const dx  = pos[b.id].x - pos[a.id].x
        const dy  = pos[b.id].y - pos[a.id].y
        const d2  = dx * dx + dy * dy
        const d   = Math.max(Math.sqrt(d2), 1)
        const f   = 9000 / d2
        const fx  = (dx / d) * f
        const fy  = (dy / d) * f
        forces[a.id].x -= fx
        forces[a.id].y -= fy
        forces[b.id].x += fx
        forces[b.id].y += fy
      }
    }

    // Edge attraction
    for (const rel of relations) {
      if (!pos[rel.from] || !pos[rel.to]) continue
      const dx = pos[rel.to].x - pos[rel.from].x
      const dy = pos[rel.to].y - pos[rel.from].y
      const d  = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const f  = d * 0.018
      const fx = (dx / d) * f
      const fy = (dy / d) * f
      forces[rel.from].x += fx
      forces[rel.from].y += fy
      forces[rel.to].x   -= fx
      forces[rel.to].y   -= fy
    }

    // Center gravity
    for (const c of chars) {
      forces[c.id].x += (CX - pos[c.id].x) * 0.012
      forces[c.id].y += (CY - pos[c.id].y) * 0.012
    }

    // Apply forces with cooling
    for (const c of chars) {
      vel[c.id].x = (vel[c.id].x + forces[c.id].x) * 0.6
      vel[c.id].y = (vel[c.id].y + forces[c.id].y) * 0.6
      pos[c.id].x += vel[c.id].x * cooling
      pos[c.id].y += vel[c.id].y * cooling
      // Clamp
      pos[c.id].x = Math.max(50, Math.min(W - 50, pos[c.id].x))
      pos[c.id].y = Math.max(50, Math.min(H - 50, pos[c.id].y))
    }
  }

  return pos
}
