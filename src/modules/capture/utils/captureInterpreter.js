// captureInterpreter.js — Classifica um capture via API Anthropic
// Versão 2: classificação context-aware com departamento, cena, personagem e continuidade
import { fetchAPI, MODEL_FAST } from '../../../core/api.js'

// Departamentos válidos (IDs do departmentConfig no store)
const DEPT_IDS = [
  'wardrobe', 'art', 'props', 'makeup', 'hair', 'sfx',
  'vehicles', 'stunts', 'camera', 'lighting', 'sound', 'vfx',
]

// Tipos de capture legacy (mantidos para compatibilidade)
const TIPOS_VALIDOS = [
  'department-item', 'guarda-roupa', 'local', 'nota-realizador', 'prop',
  'recibo', 'casting', 'referencia',
]

// Mapa de role department (roles.js) → departmentConfig ID
const ROLE_DEPT_TO_CONFIG = {
  guardaroupa:   'wardrobe',
  arte:          'art',
  maquilhagem:   'makeup',
  camara:        'camera',
  luz_electrico: 'lighting',
  som:           'sound',
  grip:          'props',    // grip não tem dept item, mapear a props como fallback
  pos_producao:  'vfx',
  elenco:        null,
  producao:      null,
  realizacao:    null,
  acima_linha:   null,
  logistica:     null,
}

/**
 * Constrói o system prompt com contexto do projecto + contexto de set.
 */
function buildSystemPrompt(projectContext, setModeContext, authContext) {
  const {
    projectName = 'Projecto',
    parsedCharacters = [],
    parsedLocations = [],
    parsedScripts = {},
  } = projectContext

  // Contexto compacto — só nomes, sem repetição
  const chars = parsedCharacters.slice(0, 30).map(c => c.name).join(', ') || 'nenhum'
  const locs = parsedLocations.slice(0, 20).join(', ') || 'nenhum'

  // Cenas compactas: só ID + local (sem descrição longa)
  const scenes = Object.entries(parsedScripts)
    .flatMap(([epId, data]) =>
      (data.scenes || []).slice(0, 20).map(s =>
        `${epId}-SC${String(s.sceneNumber || s.id).padStart(3, '0')} ${s.location || '?'} [${(s.characters || []).slice(0, 3).join(',')}]`
      )
    )
    .slice(0, 20)
    .join('\n') || 'nenhuma'

  // Auth compacto
  let auth = ''
  if (authContext) {
    auth = `\nUSER: ${authContext.userName || 'Equipa'} | ${authContext.roleLabel || authContext.role || '?'}`
    if (authContext.deptConfigId) auth += ` | dept=${authContext.deptConfigId}`
  }

  // Set mode compacto
  let set = ''
  if (setModeContext) {
    set = `\nSET: D${setModeContext.dayNumber} Ep${setModeContext.episode}`
    if (setModeContext.currentScene) set += ` Cena=${setModeContext.currentScene}`
    if (setModeContext.currentLocation) set += ` Local=${setModeContext.currentLocation}`
    if (setModeContext.currentSceneCharacters?.length) set += ` Chars=${setModeContext.currentSceneCharacters.join(',')}`
    if (setModeContext.dayScenes?.length) set += ` (${setModeContext.dayScenes.length} cenas no dia)`
    set += `\nEm set mode: preenche scene/location/character automaticamente. Perguntas só sobre classificação.`
  }

  return `Classificador de captures para produção audiovisual "${projectName}".
Personagens: ${chars}
Locais: ${locs}
Cenas:
${scenes}${auth}${set}

Depts válidos: wardrobe,art,props,makeup,hair,sfx,vehicles,stunts,camera,lighting,sound,vfx

Responde APENAS JSON válido. Tipos possíveis:
- "department-item": item físico (roupa,adereço,décor,maquilhagem,equipamento). Campos extra: department(ID),name,character,scene,location,continuity(bool)
- "local": espaço/localização
- "nota-realizador": nota criativa
- "recibo": despesa/factura. Campos extra: extractedAmount(number),budgetCategory(3=equipa,4=equip,5=arte,7=catering)
- "casting": actor/extra
- "referencia": moodboard/inspiração

Formato: {"tipo","confianca"(0-1),"descricao","texto_extraido","department?","name?","character?","scene?","location?","continuity?","extractedAmount?","budgetCategory?","destinos_sugeridos":[{"modulo","contexto":{},"confianca","label"}],"perguntas":[{"texto","opcoes":[],"campo"}]}

Regras: dept do user → priorizar esse dept. Set mode → cena/local auto. Max 3 perguntas. Confiança>0.85 → 0-1 perguntas. Guarda-roupa/prop → department-item.`
}

/**
 * Interpreta um capture via API Anthropic.
 *
 * @param {object} params
 * @param {'image'|'text'|'audio'} params.type
 * @param {string} [params.base64] — base64 da imagem (para type='image')
 * @param {string} [params.text] — texto (para type='text')
 * @param {string} params.apiKey — Anthropic API key do store
 * @param {object} params.projectContext — { projectName, parsedCharacters, parsedLocations, parsedScripts }
 * @param {object} [params.setModeContext] — contexto de set mode (dia, cena, etc.)
 * @param {object} [params.authContext] — { role, department, userName, roleLabel, departmentLabel, deptConfigId }
 * @returns {Promise<object>} resultado parsed
 */
export async function interpretCapture({ type, base64, text, apiKey, projectContext, setModeContext, authContext }) {
  if (!apiKey) {
    throw new Error('API key não configurada. Vai ao painel de definições.')
  }

  const systemPrompt = buildSystemPrompt(projectContext, setModeContext, authContext)

  // Construir o conteúdo da mensagem consoante o tipo
  let userContent

  if (type === 'image' && base64) {
    // Build text hint based on context
    let imageHint = 'Analisa esta imagem e classifica-a conforme as instruções.'
    if (authContext?.deptConfigId) {
      imageHint += ` O utilizador pertence ao departamento "${authContext.deptConfigId}".`
    }
    if (setModeContext?.currentScene) {
      imageHint += ` Cena actual: ${setModeContext.currentScene}.`
    }

    userContent = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: base64,
        },
      },
      {
        type: 'text',
        text: imageHint,
      },
    ]
  } else if (type === 'text' && text) {
    let textHint = `Analisa este texto e classifica-o conforme as instruções:\n\n"${text}"`
    if (authContext?.deptConfigId) {
      textHint += `\n\n(Utilizador do departamento "${authContext.deptConfigId}")`
    }
    userContent = [
      {
        type: 'text',
        text: textHint,
      },
    ]
  } else {
    // Fallback — nota de voz sem transcrição
    userContent = [
      {
        type: 'text',
        text: 'Uma nota de voz foi capturada. Sem transcrição disponível. Classifica como nota-realizador com baixa confiança.',
      },
    ]
  }

  const raw = await fetchAPI({
    apiKey,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
    maxTokens: 400,
    model: MODEL_FAST,
    cache: type === 'text',  // imagens são únicas, texto pode repetir
  })

  // Extrair JSON — pode estar dentro de blocos ```json ... ```
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) ||
                    raw.match(/```\s*([\s\S]*?)\s*```/) ||
                    [null, raw]
  const jsonStr = jsonMatch[1] || raw

  let parsed
  try {
    parsed = JSON.parse(jsonStr.trim())
  } catch {
    console.error('[interpretCapture] JSON inválido:', jsonStr)
    // Fallback seguro
    parsed = {
      tipo: 'referencia',
      confianca: 0.3,
      descricao: 'Não foi possível interpretar automaticamente.',
      texto_extraido: text || null,
      destinos_sugeridos: [{ modulo: 'referencia', contexto: {}, confianca: 0.3, label: 'Referência' }],
      perguntas: [
        {
          texto: 'Onde devo guardar este capture?',
          opcoes: ['Guarda-Roupa', 'Local', 'Nota Realizador', 'Adereço', 'Referência', 'Departamento'],
          campo: 'destino_manual',
        },
      ],
    }
  }

  // Converter tipos legacy para department-item se aplicável
  if (parsed.tipo === 'guarda-roupa') {
    parsed.tipo = 'department-item'
    parsed.department = parsed.department || 'wardrobe'
  } else if (parsed.tipo === 'prop') {
    parsed.tipo = 'department-item'
    parsed.department = parsed.department || 'props'
  }

  // Validar tipo
  if (!TIPOS_VALIDOS.includes(parsed.tipo)) {
    parsed.tipo = 'referencia'
  }

  // Validar department ID para department-item
  if (parsed.tipo === 'department-item') {
    if (!DEPT_IDS.includes(parsed.department)) {
      // Tentar mapear do nome
      const deptLower = (parsed.department || '').toLowerCase()
      const mapped = DEPT_IDS.find(d => deptLower.includes(d)) || 'props'
      parsed.department = mapped
    }
    // Garantir campos obrigatórios
    parsed.name = parsed.name || parsed.descricao || 'Item capturado'
    parsed.continuity = parsed.continuity !== false // default true
  }

  // Injectar cena do set mode se não definida
  if (setModeContext?.currentScene && !parsed.scene) {
    parsed.scene = setModeContext.currentScene
  }
  if (setModeContext?.currentLocation && !parsed.location) {
    parsed.location = setModeContext.currentLocation
  }

  // Garantir arrays
  if (!Array.isArray(parsed.destinos_sugeridos)) parsed.destinos_sugeridos = []
  if (!Array.isArray(parsed.perguntas)) parsed.perguntas = []

  // Limitar perguntas a 3
  parsed.perguntas = parsed.perguntas.slice(0, 3)

  // Marcar baixa confiança
  parsed.baixa_confianca = (parsed.confianca || 0) < 0.7

  return parsed
}

// Exportar utilidades para outros módulos
export { ROLE_DEPT_TO_CONFIG, DEPT_IDS }
