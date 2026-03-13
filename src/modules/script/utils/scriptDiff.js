// FRAME — Script Diff
// Comparação semântica entre versões de guião
// Detecta: cenas novas, removidas, texto alterado, personagens mudaram

/**
 * Compara duas versões de guião parsed
 * @param {Object} oldScripts - parsedScripts da versão anterior
 * @param {Object} newScripts - parsedScripts da versão nova
 * @returns {Object} { alteracoes[], resumo }
 */
export function diffScripts(oldScripts, newScripts) {
  const alteracoes = []

  // Flatten scenes with keys
  const oldScenes = flattenScenes(oldScripts)
  const newScenes = flattenScenes(newScripts)

  const oldKeys = new Set(Object.keys(oldScenes))
  const newKeys = new Set(Object.keys(newScenes))

  // Cenas novas
  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      const scene = newScenes[key]
      alteracoes.push({
        sceneKey: key,
        tipo: 'nova',
        descricao: `Cena nova: ${scene.intExt || 'INT'}. ${scene.location || '—'}`,
        detalhes: {
          cabecalho: `${scene.intExt || 'INT'}. ${(scene.location || '').toUpperCase()} — ${scene.timeOfDay || 'DIA'}`,
          characters: scene.characters || [],
          dialogueCount: (scene.dialogue || []).length,
        },
      })
    }
  }

  // Cenas removidas
  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      const scene = oldScenes[key]
      alteracoes.push({
        sceneKey: key,
        tipo: 'removida',
        descricao: `Cena removida: ${scene.intExt || 'INT'}. ${scene.location || '—'}`,
        detalhes: {
          cabecalho: `${scene.intExt || 'INT'}. ${(scene.location || '').toUpperCase()} — ${scene.timeOfDay || 'DIA'}`,
        },
      })
    }
  }

  // Cenas alteradas
  for (const key of newKeys) {
    if (!oldKeys.has(key)) continue
    const oldScene = oldScenes[key]
    const newScene = newScenes[key]
    const changes = compareScenes(oldScene, newScene)

    if (changes.length > 0) {
      alteracoes.push({
        sceneKey: key,
        tipo: 'alterada',
        descricao: changes.join('; '),
        detalhes: {
          cabecalho: `${newScene.intExt || 'INT'}. ${(newScene.location || '').toUpperCase()} — ${newScene.timeOfDay || 'DIA'}`,
          changes,
          oldScene: summarizeScene(oldScene),
          newScene: summarizeScene(newScene),
        },
      })
    }
  }

  // Ordenar: novas primeiro, depois alteradas, depois removidas
  const order = { nova: 0, alterada: 1, removida: 2 }
  alteracoes.sort((a, b) => (order[a.tipo] ?? 3) - (order[b.tipo] ?? 3))

  return {
    alteracoes,
    resumo: {
      novas: alteracoes.filter(a => a.tipo === 'nova').length,
      removidas: alteracoes.filter(a => a.tipo === 'removida').length,
      alteradas: alteracoes.filter(a => a.tipo === 'alterada').length,
      total: alteracoes.length,
    },
  }
}

/**
 * Flatten parsedScripts to { [sceneKey]: scene }
 */
function flattenScenes(scripts) {
  const map = {}
  Object.entries(scripts || {}).forEach(([epId, epData]) => {
    ;(epData.scenes || []).forEach(scene => {
      const key = `${epId}-${scene.sceneNumber || scene.id}`
      map[key] = { ...scene, epId }
    })
  })
  return map
}

/**
 * Compara duas cenas e retorna lista de mudanças
 */
function compareScenes(oldScene, newScene) {
  const changes = []

  // Texto de acção
  const oldAction = normalizeText((oldScene.action || []).map(a => typeof a === 'string' ? a : a.text || '').join(' '))
  const newAction = normalizeText((newScene.action || []).map(a => typeof a === 'string' ? a : a.text || '').join(' '))
  if (oldAction !== newAction) {
    const oldWords = oldAction.split(/\s+/).length
    const newWords = newAction.split(/\s+/).length
    const diff = Math.abs(newWords - oldWords)
    changes.push(`Acção alterada (${diff > 0 ? `±${diff} palavras` : 'reformulada'})`)
  }

  // Diálogos
  const oldDialogues = (oldScene.dialogue || []).map(d => `${d.character}:${normalizeText(d.text)}`).join('|')
  const newDialogues = (newScene.dialogue || []).map(d => `${d.character}:${normalizeText(d.text)}`).join('|')
  if (oldDialogues !== newDialogues) {
    const oldCount = (oldScene.dialogue || []).length
    const newCount = (newScene.dialogue || []).length
    if (newCount !== oldCount) {
      changes.push(`Diálogos alterados (${oldCount}→${newCount} falas)`)
    } else {
      // Contar quantas falas mudaram
      let changedLines = 0
      for (let i = 0; i < Math.min(oldCount, newCount); i++) {
        const oldLine = normalizeText((oldScene.dialogue || [])[i]?.text || '')
        const newLine = normalizeText((newScene.dialogue || [])[i]?.text || '')
        if (oldLine !== newLine) changedLines++
      }
      changes.push(`${changedLines} fala(s) alterada(s)`)
    }
  }

  // Personagens
  const oldChars = new Set((oldScene.characters || []).map(c => c.toLowerCase()))
  const newChars = new Set((newScene.characters || []).map(c => c.toLowerCase()))
  const addedChars = [...newChars].filter(c => !oldChars.has(c))
  const removedChars = [...oldChars].filter(c => !newChars.has(c))
  if (addedChars.length > 0) changes.push(`Personagem adicionado: ${addedChars.join(', ')}`)
  if (removedChars.length > 0) changes.push(`Personagem removido: ${removedChars.join(', ')}`)

  // Local
  if (normalizeText(oldScene.location || '') !== normalizeText(newScene.location || '')) {
    changes.push(`Local alterado: ${oldScene.location} → ${newScene.location}`)
  }

  // INT/EXT
  if (oldScene.intExt !== newScene.intExt) {
    changes.push(`${oldScene.intExt} → ${newScene.intExt}`)
  }

  return changes
}

/**
 * Normaliza texto para comparação (minúsculas, sem espaços extra)
 */
function normalizeText(text) {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Resumo compacto de uma cena para exibir no diff
 */
function summarizeScene(scene) {
  return {
    cabecalho: `${scene.intExt || 'INT'}. ${(scene.location || '').toUpperCase()} — ${scene.timeOfDay || 'DIA'}`,
    characters: scene.characters || [],
    dialogueCount: (scene.dialogue || []).length,
    actionPreview: (scene.action || []).map(a => typeof a === 'string' ? a : a.text || '').join(' ').slice(0, 100),
  }
}

/**
 * Identifica quais actores são afectados pelas alterações
 */
export function getAffectedActors(alteracoes, allScenes) {
  const affected = new Set()

  alteracoes.forEach(alt => {
    if (alt.tipo === 'removida') {
      // Personagens da cena removida
      ;(alt.detalhes?.characters || []).forEach(c => affected.add(c))
    } else {
      // Encontrar personagens na cena actual
      const scene = allScenes.find(s => s.sceneKey === alt.sceneKey)
      ;(scene?.characters || []).forEach(c => affected.add(c))
    }
  })

  return [...affected]
}

/**
 * Identifica quais sides precisam ser regenerados
 */
export function getAffectedSides(alteracoes, sidesGerados) {
  const affectedSceneKeys = new Set(alteracoes.map(a => a.sceneKey))

  return (sidesGerados || [])
    .filter(side => side.status === 'activo')
    .filter(side => {
      // Um side é afectado se contém qualquer cena alterada
      // Para actor-ep: verificar se o episódio tem cenas afectadas
      if (side.episodio_id) {
        return alteracoes.some(a => a.sceneKey.startsWith(side.episodio_id))
      }
      // Para outros: marcar todos como potencialmente afectados
      return true
    })
}
