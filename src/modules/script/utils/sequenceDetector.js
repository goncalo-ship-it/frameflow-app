// FrameBoard — Sequence Detector
// Agrupa cenas em sequências narrativas (para validação pelo realizador)
// Detecção automática baseada em: local contínuo, personagens, tom
import { fetchAPI, MODEL_FAST } from '../../../core/api.js'

const SEQ_COLORS = [
  '#E07B39', '#2E6FA0', '#A02E6F', '#2EA080', '#7B4FBF',
  '#BF6A2E', '#5B8DEF', '#22C55E', '#E11D48', '#F5A623',
  '#8B5CF6', '#6E6E78', '#1E7A6E', '#A07B2E', '#6F2EA0',
]

/**
 * Detecta sequências automaticamente a partir de cenas parsed
 * @param {Array} scenes - cenas flatten com sceneKey, location, characters, etc.
 * @returns {Array} sequências sugeridas (para validação)
 */
export function detectSequences(scenes) {
  if (!scenes || scenes.length === 0) return []

  // Ordenar por ordem narrativa (epId + sceneNumber)
  const sorted = [...scenes].sort((a, b) => {
    if (a.epId !== b.epId) return a.epId.localeCompare(b.epId)
    const numA = parseInt(String(a.sceneNumber || a.id).replace(/\D/g, '')) || 0
    const numB = parseInt(String(b.sceneNumber || b.id).replace(/\D/g, '')) || 0
    return numA - numB
  })

  const sequences = []
  let current = null
  let colorIdx = 0

  for (let i = 0; i < sorted.length; i++) {
    const scene = sorted[i]
    const loc = normalizeLocation(scene.location)

    if (!current) {
      // Iniciar nova sequência
      current = startSequence(scene, loc, colorIdx++)
      continue
    }

    // Verificar se a cena continua a sequência actual
    const prevScene = sorted[i - 1]
    const sameLocation = normalizeLocation(prevScene.location) === loc
    const sharedChars = countSharedCharacters(prevScene.characters, scene.characters)
    const consecutive = isConsecutive(prevScene, scene)

    // Regra: mesmo local E cenas consecutivas → mesma sequência
    // OU: muitas personagens em comum E consecutivas → mesma sequência
    if (sameLocation && consecutive) {
      current.cenas.push(scene.sceneKey)
      continue
    }

    if (sharedChars >= 2 && consecutive && !sameLocation) {
      // Mesmo grupo de personagens mas local diferente — pode ser sequência
      // Só agrupar se for muito próximo (máx 1 cena de distância)
      current.cenas.push(scene.sceneKey)
      continue
    }

    // Fechar sequência actual e abrir nova
    if (current.cenas.length >= 2) {
      sequences.push(current)
    }
    current = startSequence(scene, loc, colorIdx++)
  }

  // Fechar última
  if (current && current.cenas.length >= 2) {
    sequences.push(current)
  }

  return sequences
}

function startSequence(scene, loc, colorIdx) {
  return {
    id: `seq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    nome: loc || `Sequência ${colorIdx + 1}`,
    cor: SEQ_COLORS[colorIdx % SEQ_COLORS.length],
    cenas: [scene.sceneKey],
    descricao: '',
    arco_emocional: '',
    dias_de_rodagem: [],
    tem_costura: false,
    costuras: [],
  }
}

function normalizeLocation(loc) {
  if (!loc) return ''
  return loc
    .replace(/^(INT\.?|EXT\.?|I\/E\.?)\s*/i, '')
    .replace(/\s*[-–—]\s*(DIA|NOITE|MANHÃ|TARDE|GOLDEN|ENTARDECER)$/i, '')
    .trim()
    .toLowerCase()
}

function countSharedCharacters(charsA, charsB) {
  if (!charsA || !charsB) return 0
  const setB = new Set(charsB.map(c => c.toLowerCase()))
  return charsA.filter(c => setB.has(c.toLowerCase())).length
}

function isConsecutive(sceneA, sceneB) {
  // Mesma ep E números consecutivos (ou com gap de 1-2)
  if (sceneA.epId !== sceneB.epId) return false
  const numA = parseInt(String(sceneA.sceneNumber || sceneA.id).replace(/\D/g, '')) || 0
  const numB = parseInt(String(sceneB.sceneNumber || sceneB.id).replace(/\D/g, '')) || 0
  return Math.abs(numB - numA) <= 3
}

/**
 * Detecta sequências via API para resultados mais ricos
 * @param {Array} scenes - cenas parsed
 * @param {string} apiKey
 * @returns {Promise<Array>} sequências sugeridas
 */
export async function detectSequencesViaAPI(scenes, apiKey) {
  if (!apiKey || scenes.length === 0) return detectSequences(scenes)

  // Preparar resumo compacto para a API
  const resumo = scenes.map(s => ({
    key: s.sceneKey,
    loc: s.location,
    ie: s.intExt,
    chars: (s.characters || []).slice(0, 5),
    type: s.sceneType,
    synopsis: (s.synopsis || '').slice(0, 100),
  }))

  try {
    const text = await fetchAPI({
      apiKey,
      messages: [{ role: 'user', content: JSON.stringify(resumo) }],
      system: `Analisa estas cenas de um guião e agrupa-as em SEQUÊNCIAS narrativas. Uma sequência é um conjunto de cenas narrativamente contínuas no mesmo espaço-tempo da história.

Devolve JSON:
\`\`\`json
[{ "nome": "Nome da sequência", "cenas": ["EP01-SC001", "EP01-SC003"], "descricao": "breve", "arco_emocional": "o que acontece emocionalmente" }]
\`\`\`

Agrupa cenas do mesmo local consecutivas ou com continuidade de personagens. Mínimo 2 cenas por sequência. Máximo 15 sequências. Nomes curtos e descritivos.`,
      maxTokens: 1500,
      model: MODEL_FAST,
      cache: true,
    })

    // Extrair JSON
    const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\[[\s\S]*\]/)
    if (match) {
      const parsed = JSON.parse(match[1] || match[0])
      let colorIdx = 0
      return parsed.map(seq => ({
        id: `seq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        nome: seq.nome,
        cor: SEQ_COLORS[colorIdx++ % SEQ_COLORS.length],
        cenas: seq.cenas || [],
        descricao: seq.descricao || '',
        arco_emocional: seq.arco_emocional || '',
        dias_de_rodagem: [],
        tem_costura: false,
        costuras: [],
      }))
    }
  } catch (err) {
    console.warn('API sequence detection failed, falling back to local:', err)
  }

  return detectSequences(scenes)
}
