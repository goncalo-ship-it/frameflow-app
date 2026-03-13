// Script Enrichment — character classification, co-occurrence relations, voice extraction
// Pure local analysis — no API calls

// ── Portuguese stopwords ──────────────────────────────────────────
const STOPWORDS = new Set([
  'de', 'a', 'o', 'que', 'e', 'é', 'do', 'da', 'em', 'um', 'uma', 'para',
  'com', 'não', 'se', 'na', 'os', 'no', 'as', 'ao', 'mais', 'por', 'dos',
  'das', 'nos', 'nas', 'essa', 'este', 'eu', 'tu', 'ele', 'ela', 'isso',
  'isto', 'mas', 'já', 'lá', 'aqui', 'como', 'só', 'foi', 'ser', 'ter',
  'muito', 'bem', 'vou', 'vai', 'está', 'estou', 'me', 'te', 'lhe', 'nos',
  'vos', 'se', 'meu', 'minha', 'teu', 'tua', 'seu', 'sua', 'nós', 'eles',
  'elas', 'nem', 'ou', 'quando', 'onde', 'há', 'até', 'sem', 'pelo', 'pela',
  'num', 'numa', 'tens', 'tinha', 'foram', 'era', 'são',
])

/**
 * classifyCharacters(parsedScripts)
 * Analyzes ALL episodes to classify characters by importance.
 * Returns: { [charName]: { arcType, scale, sceneCount, wordCount, dialogueStats } }
 */
export function classifyCharacters(parsedScripts) {
  if (!parsedScripts || Object.keys(parsedScripts).length === 0) return {}

  // Aggregate across all episodes
  const charStats = {} // { CHARNAME: { sceneCount, wordCount, lineCount, questions, interruptions, scenes: Set } }

  for (const [epId, data] of Object.entries(parsedScripts)) {
    if (!data?.scenes) continue
    for (const scene of data.scenes) {
      const sceneChars = (scene.characters || []).map(c =>
        (typeof c === 'string' ? c : c.name || c).toUpperCase()
      )
      // Count scene presence
      for (const charName of sceneChars) {
        if (!charStats[charName]) {
          charStats[charName] = { sceneCount: 0, wordCount: 0, lineCount: 0, questions: 0, interruptions: 0, scenes: new Set() }
        }
        charStats[charName].scenes.add(`${epId}-${scene.id}`)
        charStats[charName].sceneCount++
      }
      // Count dialogue
      for (const d of (scene.dialogue || [])) {
        const name = (d.character || '').toUpperCase()
        if (!charStats[name]) {
          charStats[name] = { sceneCount: 0, wordCount: 0, lineCount: 0, questions: 0, interruptions: 0, scenes: new Set() }
        }
        const words = (d.text || '').split(/\s+/).filter(Boolean).length
        charStats[name].wordCount += words
        charStats[name].lineCount++
        if ((d.text || '').includes('?')) charStats[name].questions++
        if ((d.text || '').trim().endsWith('—') || (d.text || '').trim().endsWith('--')) charStats[name].interruptions++
      }
    }
  }

  const names = Object.keys(charStats)
  if (names.length === 0) return {}

  // Sort by scene count
  const byScenes = [...names].sort((a, b) => charStats[b].sceneCount - charStats[a].sceneCount)
  const byWords = [...names].sort((a, b) => charStats[b].wordCount - charStats[a].wordCount)

  const totalScenes = Math.max(1, ...names.map(n => charStats[n].sceneCount))

  // Protagonist: most scenes (and most words if same person, else take most scenes)
  const protagonist = byScenes[0]

  // Antagonist heuristic: high co-occurrence with protagonist + high question/interruption ratio
  let antagonist = null
  const protScenes = charStats[protagonist]?.scenes || new Set()
  let bestAntScore = 0

  for (const name of names) {
    if (name === protagonist) continue
    const cs = charStats[name]
    if (cs.sceneCount < 3) continue
    // Co-occurrence with protagonist
    let shared = 0
    for (const s of cs.scenes) { if (protScenes.has(s)) shared++ }
    const coRate = shared / Math.max(1, cs.sceneCount)
    // Argumentative ratio
    const questionRate = cs.lineCount > 0 ? cs.questions / cs.lineCount : 0
    const interruptRate = cs.lineCount > 0 ? cs.interruptions / cs.lineCount : 0
    const antScore = coRate * 0.4 + questionRate * 0.35 + interruptRate * 0.25
    if (antScore > bestAntScore && coRate > 0.3) {
      bestAntScore = antScore
      antagonist = name
    }
  }

  // Build results
  const result = {}

  for (const name of names) {
    const cs = charStats[name]
    const sceneRatio = cs.sceneCount / totalScenes

    let arcType, scale
    if (name === protagonist) {
      arcType = 'protagonista'
      scale = 'centro'
    } else if (name === antagonist) {
      arcType = 'antagonista'
      scale = 'real'
    } else if (byScenes.indexOf(name) <= 3 && sceneRatio > 0.5) {
      // Top 2-3 by scenes after protagonist
      arcType = cs.wordCount > charStats[protagonist].wordCount * 0.3 ? 'aliado' : 'secundário'
      scale = 'real'
    } else if (sceneRatio >= 0.3 && sceneRatio <= 0.7) {
      arcType = 'secundário'
      scale = 'social'
    } else {
      arcType = 'episódico'
      scale = 'liminar'
    }

    result[name] = {
      arcType,
      scale,
      sceneCount: cs.sceneCount,
      wordCount: cs.wordCount,
      dialogueStats: {
        lineCount: cs.lineCount,
        questions: cs.questions,
        interruptions: cs.interruptions,
        questionRate: cs.lineCount > 0 ? Math.round((cs.questions / cs.lineCount) * 100) : 0,
        interruptionRate: cs.lineCount > 0 ? Math.round((cs.interruptions / cs.lineCount) * 100) : 0,
      },
    }
  }

  return result
}

/**
 * buildCoOccurrenceRelations(parsedScripts)
 * Builds relations from scene co-occurrence — no API needed.
 * Returns: [{ from: charName, to: charName, type, label, strength }]
 */
export function buildCoOccurrenceRelations(parsedScripts) {
  if (!parsedScripts || Object.keys(parsedScripts).length === 0) return []

  // Count scenes per character and shared scenes per pair
  const charScenes = {} // { CHARNAME: Set<sceneKey> }
  const pairCount = {}  // { "A|B": count }

  for (const [epId, data] of Object.entries(parsedScripts)) {
    if (!data?.scenes) continue
    for (const scene of data.scenes) {
      const sceneChars = [...new Set(
        (scene.characters || []).map(c =>
          (typeof c === 'string' ? c : c.name || c).toUpperCase()
        )
      )]
      const sceneKey = `${epId}-${scene.id}`

      for (const name of sceneChars) {
        if (!charScenes[name]) charScenes[name] = new Set()
        charScenes[name].add(sceneKey)
      }

      // Count pairs
      for (let i = 0; i < sceneChars.length; i++) {
        for (let j = i + 1; j < sceneChars.length; j++) {
          const pair = [sceneChars[i], sceneChars[j]].sort().join('|')
          pairCount[pair] = (pairCount[pair] || 0) + 1
        }
      }
    }
  }

  // Build relations for pairs with 3+ shared scenes
  const relations = []
  for (const [pair, count] of Object.entries(pairCount)) {
    if (count < 3) continue
    const [a, b] = pair.split('|')
    const maxScenes = Math.max(
      charScenes[a]?.size || 1,
      charScenes[b]?.size || 1
    )
    const strength = count / maxScenes

    let type
    if (strength > 0.7) type = 'afecto'
    else if (strength > 0.4) type = 'amizade'
    else if (strength > 0.2) type = 'colega'
    else type = 'social'

    relations.push({
      from: a,
      to: b,
      type,
      label: `${count} cenas juntos`,
      strength,
    })
  }

  // Sort by strength descending, limit to top 20
  relations.sort((a, b) => b.strength - a.strength)
  return relations.slice(0, 20)
}

/**
 * extractCharacterVoice(parsedScripts, charName)
 * Extracts speaking patterns for a character.
 * Returns: { when, what, example, avgWords, questionRate, exclamationRate, interruptionRate, vocabularySize, topWords, sampleLines }
 */
export function extractCharacterVoice(parsedScripts, charName) {
  if (!parsedScripts || !charName) return null

  const nameUp = charName.toUpperCase()
  const allLines = []

  for (const [, data] of Object.entries(parsedScripts)) {
    if (!data?.scenes) continue
    for (const scene of data.scenes) {
      for (const d of (scene.dialogue || [])) {
        if ((d.character || '').toUpperCase() === nameUp) {
          allLines.push(d.text || '')
        }
      }
    }
  }

  if (allLines.length === 0) return null

  // Stats
  const totalLines = allLines.length
  const wordCounts = allLines.map(l => l.split(/\s+/).filter(Boolean).length)
  const totalWords = wordCounts.reduce((s, w) => s + w, 0)
  const avgWords = Math.round(totalWords / totalLines)
  const questions = allLines.filter(l => l.includes('?')).length
  const exclamations = allLines.filter(l => l.includes('!')).length
  const interruptions = allLines.filter(l => l.trim().endsWith('—') || l.trim().endsWith('--')).length
  const questionRate = Math.round((questions / totalLines) * 100)
  const exclamationRate = Math.round((exclamations / totalLines) * 100)
  const interruptionRate = Math.round((interruptions / totalLines) * 100)

  // Vocabulary
  const wordFreq = {}
  for (const line of allLines) {
    const words = line.toLowerCase().split(/[\s.,!?;:"""''()\-–—]+/).filter(Boolean)
    for (const w of words) {
      if (w.length < 2 || STOPWORDS.has(w)) continue
      wordFreq[w] = (wordFreq[w] || 0) + 1
    }
  }
  const vocabularySize = Object.keys(wordFreq).length
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w)

  // Sample lines: 3 longest unique lines
  const uniqueLines = [...new Set(allLines)].filter(l => l.length > 15)
  uniqueLines.sort((a, b) => b.length - a.length)
  const sampleLines = uniqueLines.slice(0, 3)

  return {
    when: `Fala ${avgWords} palavras em média, ${questionRate}% perguntas`,
    what: `Vocabulário de ${vocabularySize} palavras, usa muito: ${topWords.join(', ')}`,
    example: sampleLines[0] || '',
    avgWords,
    questionRate,
    exclamationRate,
    interruptionRate,
    vocabularySize,
    topWords,
    sampleLines,
  }
}

/**
 * getScriptStatsForChar(parsedScripts, charName)
 * Returns aggregated stats for a character across all episodes.
 * { sceneCount, lineCount, wordCount, episodes[], topCoChars[], voice }
 */
export function getScriptStatsForChar(parsedScripts, charName) {
  if (!parsedScripts || !charName) return null

  const nameUp = charName.toUpperCase()
  let sceneCount = 0
  let lineCount = 0
  let wordCount = 0
  const episodes = new Set()
  const coCharCounts = {} // { CHARNAME: count }

  for (const [epId, data] of Object.entries(parsedScripts)) {
    if (!data?.scenes) continue
    for (const scene of data.scenes) {
      const sceneChars = (scene.characters || []).map(c =>
        (typeof c === 'string' ? c : c.name || c).toUpperCase()
      )
      if (!sceneChars.includes(nameUp)) continue

      sceneCount++
      episodes.add(epId)

      // Co-occurring characters
      for (const other of sceneChars) {
        if (other === nameUp) continue
        coCharCounts[other] = (coCharCounts[other] || 0) + 1
      }

      // Dialogue
      for (const d of (scene.dialogue || [])) {
        if ((d.character || '').toUpperCase() === nameUp) {
          lineCount++
          wordCount += (d.text || '').split(/\s+/).filter(Boolean).length
        }
      }
    }
  }

  if (sceneCount === 0) return null

  const topCoChars = Object.entries(coCharCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const voice = extractCharacterVoice(parsedScripts, charName)

  return {
    sceneCount,
    lineCount,
    wordCount,
    episodes: [...episodes].sort(),
    topCoChars,
    voice,
  }
}
