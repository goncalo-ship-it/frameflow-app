// Wrapper único para Anthropic API
// NUNCA chamar a API directamente nos componentes — usar fetchAPI()
// Queue + rate limiting + cache por hash de conteúdo

// ── Configuração ──────────────────────────────────────────────────
export const MODEL = 'claude-sonnet-4-6'
export const MODEL_FAST = 'claude-haiku-4-5-20251001'  // 10-20x mais barato — usar para classificação, OCR, extracção simples
const API_URL = 'https://api.anthropic.com/v1/messages'
const MAX_TOKENS = 8096
const RATE_LIMIT_MS = 1000      // 1 pedido por segundo máximo
const CACHE_TTL_MS  = 1000 * 60 * 60 * 8  // 8 horas — dados de guião e locais mudam raramente

// ── Cache por hash ────────────────────────────────────────────────
const _cache = new Map()

function hashContent(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

function getCached(key) {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    _cache.delete(key)
    return null
  }
  return entry.value
}

function setCache(key, value) {
  _cache.set(key, { value, timestamp: Date.now() })
  if (_cache.size > 500) {
    const oldest = [..._cache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 20)
    oldest.forEach(([k]) => _cache.delete(k))
  }
}

// ── Queue de pedidos ──────────────────────────────────────────────
const _queue = []
let _processing = false
let _lastRequest = 0

async function processQueue() {
  if (_processing || _queue.length === 0) return
  _processing = true

  while (_queue.length > 0) {
    const now = Date.now()
    const wait = Math.max(0, RATE_LIMIT_MS - (now - _lastRequest))
    if (wait > 0) await new Promise(r => setTimeout(r, wait))

    const { task, resolve, reject } = _queue.shift()
    _lastRequest = Date.now()

    try {
      const result = await task()
      resolve(result)
    } catch (err) {
      reject(err)
    }
  }

  _processing = false
}

function enqueue(task) {
  return new Promise((resolve, reject) => {
    _queue.push({ task, resolve, reject })
    processQueue()
  })
}

// ── Função principal — raw fetch com queue + cache ────────────────
// Todos os componentes devem usar esta função.
// apiKey: string — vem do store (useStore.getState().apiKey)
// system: string | undefined — system prompt
// messages: array — [{ role, content }]
// maxTokens: number — default 8096
// beta: string | undefined — header anthropic-beta (ex: 'pdfs-2024-09-25')
// cache: boolean — se deve usar cache (default true)

export async function fetchAPI({
  apiKey,
  system,
  messages,
  maxTokens = MAX_TOKENS,
  model,          // opcional: MODEL_FAST para tarefas simples (classificação, OCR, extracção)
  beta,
  cache = true,
}) {
  if (!apiKey) throw new Error('API key não definida — configurar em Definições')

  // Cache
  const cacheStr = (model || '') + (system || '') + JSON.stringify(messages)
  const key = hashContent(cacheStr)
  if (cache) {
    const cached = getCached(key)
    if (cached) return cached
  }

  // Enfileirar com rate limiting
  const result = await enqueue(async () => {
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    }
    if (beta) headers['anthropic-beta'] = beta

    const body = {
      model: model || MODEL,
      max_tokens: maxTokens,
      messages,
    }
    if (system) body.system = system

    const res = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `Erro API: ${res.status}`)
    }

    const data = await res.json()
    return data.content?.[0]?.text || ''
  })

  if (cache) setCache(key, result)
  return result
}

// ── Alias retrocompatível ─────────────────────────────────────────
// Para funções internas que já usavam callAPI com SDK
export const callAPI = fetchAPI

// ── Helpers ───────────────────────────────────────────────────────

function buildUniverseContext(project) {
  if (!project) return ''
  const { universe, meta } = project
  return `
PROJECTO: ${meta?.name || 'sem nome'}
TIPO: ${meta?.type || 'série'}
BROADCASTER: ${meta?.broadcaster || ''}

UNIVERSO — PERSONAGENS:
${(universe?.chars || universe?.characters)?.map(c =>
  `- ${c.name}: ${c.description} | Arco: ${c.arc || '—'}`
).join('\n') || '—'}

REGRAS DO UNIVERSO:
${universe?.rules?.map(r => `- ${r.rule}: ${r.description}`).join('\n') || '—'}

TOM E VOZ: ${universe?.toneVoice || '—'}

GLOSSÁRIO:
${universe?.glossary?.map(g => `- ${g.term}: ${g.definition}`).join('\n') || '—'}
`.trim()
}

// ── API pública — funções de produto ─────────────────────────────

export async function analyzeScriptContext(scenes, project, apiKey) {
  const universeContext = buildUniverseContext(project)
  const scriptSummary = scenes.slice(0, 30).map(s =>
    `${s.id}: ${s.characters.join(', ')} — ${s.synopsis?.slice(0, 100)}`
  ).join('\n')

  const response = await fetchAPI({
    apiKey,
    system: `${universeContext}\n\nÉs um script editor especializado em séries portuguesas. Respondes sempre em JSON válido.`,
    messages: [{ role: 'user', content: `GUIÃO:\n${scriptSummary}\n\nAnalisa o guião em relação ao universo da série.\nPara cada problema encontrado indica:\n- ID da cena\n- Tipo: FANTÁSTICO (🟢) | ATENÇÃO (🟡) | CONFLITO (🔴)\n- Descrição do problema ou ponto positivo\n- Sugestão de correcção (se aplicável)\n\nResponde em JSON com o formato:\n{ "items": [{ "sceneId": "SC001", "type": "warn", "text": "...", "suggestion": "..." }] }\n\nFoca em: consistência de personagens, regras do universo, continuidade narrativa.` }],
    maxTokens: 2000,
  })

  try {
    return JSON.parse(response)
  } catch {
    return { items: [], error: 'Erro ao processar resposta da API' }
  }
}

export async function mirrorResponse(entry, project, history = [], apiKey) {
  const universeContext = buildUniverseContext(project)

  const messages = [
    ...history.slice(-8).map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: entry },
  ]

  return fetchAPI({
    apiKey,
    system: `${universeContext}\n\nÉs o Espelho do Realizador do FRAME. O teu papel:\n- Fazer as perguntas certas, não dar respostas directas\n- Identificar contradições possíveis com o universo\n- Sugerir referências internas (cenas, personagens já definidos)\n- Detectar padrões no diário criativo\n- Nunca prescrever — apresentar para reflexão\n- Escreves em português europeu, tom íntimo e preciso`,
    messages,
    maxTokens: 2000,
    cache: false,
  })
}

export async function describeLocationPhoto(imageBase64, locationName, apiKey) {
  return fetchAPI({
    apiKey,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
        },
        {
          type: 'text',
          text: `Descreve este espaço para uso em produção audiovisual. Local: ${locationName}. Inclui: dimensão aproximada, tipo de luz, acústica aparente, desafios de produção, oportunidades criativas. Máximo 100 palavras. Português europeu.`,
        },
      ],
    }],
    maxTokens: 300,
    model: MODEL_FAST,
  })
}

export async function generateWritersRoomQuestions(scenes, universe, existingQuestions = [], apiKey) {
  const existing = existingQuestions.map(q => q.question).join('\n')

  const response = await fetchAPI({
    apiKey,
    system: buildUniverseContext({ universe, meta: {} }),
    messages: [{
      role: 'user',
      content: `Com base no universo e nas cenas disponíveis, gera 5 questões para a writers' room.\nQuestões existentes (não repetir): ${existing}\nFormato JSON: { "questions": [{ "question": "...", "urgency": "alta|media|baixa", "episode": "EP03" }] }`,
    }],
    maxTokens: 1000,
  })

  try {
    return JSON.parse(response)
  } catch {
    return { questions: [] }
  }
}

export async function suggestBudgetOptimizations(budget, schedule, universe, apiKey) {
  const response = await fetchAPI({
    apiKey,
    system: 'És um produtor executivo experiente no mercado português. Analisas orçamentos de forma criativa e pragmática. Respondes em JSON.',
    messages: [{
      role: 'user',
      content: `Analisa este orçamento e sugere optimizações:\n- Total aprovado: €${budget.envelopes?.total?.approved || 0}\n- Dias de rodagem: ${schedule?.days?.length || 0}\n\nPara cada sugestão: { title, explanation, impactEuros, creativeRisk, category }\nNUNCA sugeres: cortar personagens, eliminar cenas âncora, reduzir ensaios.\n\nRetorna JSON: { "suggestions": [...] }`,
    }],
  })

  try {
    return JSON.parse(response)
  } catch {
    return { suggestions: [] }
  }
}
