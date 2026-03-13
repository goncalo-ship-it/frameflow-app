// Universal Upload — classifica qualquer ficheiro e encaminha para o módulo correcto
// 1 chamada API por ficheiro (classificação + extracção combinadas)
// .fdx → zero API calls (parser directo)
// Reutiliza: SmartInput patterns, fetchAPI, store actions existentes

import { fetchAPI, MODEL_FAST } from './api.js'
import { useStore } from './store.js'
import { parseScript } from '../utils/script-parser.js'

// ── Extracção de conteúdo por tipo de ficheiro ──────────────────────

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(file)
  })
}

function fileToArrayBuffer(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsArrayBuffer(file)
  })
}

async function extractContent(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const textTypes = ['txt', 'md', 'csv', 'eml', 'html', 'htm', 'json', 'xml', 'rtf', 'log']

  // FDX — parser directo, sem API
  if (ext === 'fdx') {
    const text = await file.text()
    return { type: 'fdx', text, ext }
  }

  // Imagens — base64 para vision
  if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif', 'bmp', 'tiff'].includes(ext) ||
      file.type.startsWith('image/')) {
    const base64 = await fileToBase64(file)
    const mediaType = file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`
    return { type: 'image', base64, mediaType, ext }
  }

  // Áudio — retorna base64 (transcribe mais tarde se necessário)
  if (['m4a', 'mp3', 'wav', 'ogg', 'aac', 'webm'].includes(ext) ||
      file.type.startsWith('audio/')) {
    return { type: 'audio', ext, name: file.name }
  }

  // PDF — base64 para document block
  if (ext === 'pdf' || file.type === 'application/pdf') {
    const buf = await fileToArrayBuffer(file)
    const bytes = new Uint8Array(buf)
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
    }
    const base64 = btoa(binary)
    return { type: 'pdf', base64, ext }
  }

  // Word (.docx)
  if (ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const mammoth = await import('mammoth')
      const buf = await fileToArrayBuffer(file)
      const result = await mammoth.extractRawText({ arrayBuffer: buf })
      return { type: 'text', text: result.value, ext }
    } catch {
      return { type: 'text', text: '', ext, error: 'Erro ao ler .docx' }
    }
  }

  // Excel (.xlsx, .xls)
  if (ext === 'xlsx' || ext === 'xls') {
    try {
      const { getXLSX } = await import('./xlsx-loader.js')
      const XLSX = await getXLSX()
      const buf = await fileToArrayBuffer(file)
      const wb = XLSX.read(buf, { type: 'array' })
      // Converter todas as folhas a texto para classificação
      const texts = wb.SheetNames.map(name => {
        const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name])
        return `--- ${name} ---\n${csv}`
      })
      return { type: 'spreadsheet', text: texts.join('\n\n'), ext, workbook: wb }
    } catch {
      return { type: 'text', text: '', ext, error: 'Erro ao ler Excel' }
    }
  }

  // Texto directo
  if (textTypes.includes(ext) || file.type.startsWith('text/')) {
    const text = await file.text()
    return { type: 'text', text, ext }
  }

  // Fallback: tentar ler como texto
  try {
    const text = await file.text()
    if (text && !text.includes('\x00')) return { type: 'text', text, ext }
  } catch { /* ignore */ }

  return { type: 'unknown', ext }
}

// ── Módulos e destinos possíveis ───────────────────────────────────

const MODULE_MAP = {
  'script':           { module: 'script-analysis', label: 'Análise de Guião' },
  'budget':           { module: 'budget',          label: 'Orçamento' },
  'team-list':        { module: 'team',            label: 'Equipa & Elenco' },
  'schedule':         { module: 'production',      label: 'Produção' },
  'location-photo':   { module: 'locations',       label: 'Locais' },
  'department-item':  { module: 'departments',     label: 'Departamentos' },
  'continuity-note':  { module: 'continuity',      label: 'Continuidade' },
  'reference-photo':  { module: 'universe',        label: 'Universo' },
  'creative-brief':   { module: 'universe',        label: 'Universo' },
  'meeting-notes':    { module: 'universe',        label: 'Universo' },
  'contract':         { module: 'budget',          label: 'Orçamento' },
  'invoice':          { module: 'budget',          label: 'Orçamento' },
}

// ── System prompt para classificação ───────────────────────────────

const CLASSIFICATION_SYSTEM = `És o classificador de ficheiros do FrameFlow, uma app de produção audiovisual.

Dado o conteúdo de um ficheiro, determina:
1. Tipo de documento (um dos seguintes): script, budget, team-list, schedule, location-photo, department-item, continuity-note, reference-photo, creative-brief, meeting-notes, contract, invoice
2. Módulo(s) de destino
3. Dados estruturados que podem ser extraídos

CONTEXTO DOS MÓDULOS:
- script: guiões, cenas, diálogos (ficheiros .fdx, .html com formato Final Draft)
- budget: orçamentos, facturas, recibos, contratos financeiros, tabelas de custos
- team-list: listas de equipa, contactos, elenco, fichas técnicas
- schedule: calendários de rodagem, plannings, cronogramas
- location-photo: fotos de locais, reconhecimentos, espaços de filmagem
- department-item: fotos de guarda-roupa, adereços, caracterização, arte, cenografia
- continuity-note: notas de continuidade, raccords, registos de cena
- reference-photo: imagens de referência visual, moodboards, inspiração
- creative-brief: documentos criativos, sinopses, tratamentos, bíblias
- meeting-notes: actas de reunião, notas de produção
- contract: contratos de equipa, acordos, termos
- invoice: facturas, recibos, comprovantes de despesa

REGRAS:
- Se o ficheiro tem dados financeiros (valores em euros, tabelas de custos), classifica como "budget"
- Se tem nomes + funções/roles + contactos, classifica como "team-list"
- Se tem descrições de cenas com INT./EXT., classifica como "script"
- Se é uma imagem de um espaço/local, classifica como "location-photo"
- Se é uma imagem de roupa/adereço/maquilhagem/cenário, classifica como "department-item" e indica o departamento
- Se tem datas + cenas + locais organizados, classifica como "schedule"

Responde APENAS com JSON válido, sem markdown:
{
  "type": "budget",
  "confidence": 0.92,
  "description": "Orçamento de produção com 45 linhas, total 380.000€",
  "module": "budget",
  "extractedData": {},
  "department": null,
  "suggestedAction": "Importar como orçamento via BudgetImporter"
}

Para type "department-item", inclui o campo "department" com um dos: wardrobe, art, props, makeup, hair, sfx, vehicles, stunts, camera, lighting, sound, vfx

Para type "team-list", extractedData deve ter:
{ "members": [{ "name": "...", "role": "...", "phone": "...", "email": "..." }] }

Para type "budget", extractedData deve ter:
{ "totalEstimado": 0, "numLinhas": 0, "categorias": ["..."] }

Para type "schedule", extractedData deve ter:
{ "numDays": 0, "dateRange": "..." }

Se a confiança é < 0.6, inclui:
{ "alternativeTypes": ["type1", "type2"] }`

// ── Handler principal ──────────────────────────────────────────────

export async function handleUniversalUpload(file, { apiKey, currentModule } = {}) {
  const store = useStore.getState()
  if (!apiKey) apiKey = store.apiKey

  // Step 1: Extrair conteúdo
  const content = await extractContent(file)

  // Step 2: Rotas directas (sem API)

  // .fdx → parser directo → populateFromScript
  if (content.type === 'fdx') {
    try {
      const parsed = parseScript(content.text, { episodeId: 'EP01' })
      if (parsed && parsed.scenes && parsed.scenes.length > 0) {
        // Determinar epId do próximo episódio
        const existingEps = Object.keys(store.parsedScripts)
        let epNum = 1
        if (existingEps.length > 0) {
          const nums = existingEps.map(e => parseInt(e.replace('EP', ''), 10)).filter(n => !isNaN(n))
          epNum = Math.max(...nums) + 1
        }
        const epId = `EP${String(epNum).padStart(2, '0')}`
        parsed.episode = epId
        parsed.fileName = file.name
        store.populateFromScript(parsed)

        return {
          success: true,
          destination: 'script-analysis',
          destinationLabel: 'Análise de Guião',
          description: `Guião importado: ${file.name} → ${epId} (${parsed.scenes.length} cenas, ${parsed.metadata?.characters?.length || 0} personagens)`,
          auto: true,
          navigate: true,
        }
      }
    } catch (err) {
      return {
        success: false,
        description: `Erro ao processar ${file.name}: ${err.message}`,
      }
    }
  }

  // HTML que pode ser FDX export
  if (content.type === 'text' && (content.ext === 'html' || content.ext === 'htm')) {
    if (content.text.includes('<pre>') && (content.text.includes('INT.') || content.text.includes('EXT.'))) {
      try {
        const parsed = parseScript(content.text, { episodeId: 'EP01' })
        if (parsed && parsed.scenes && parsed.scenes.length > 3) {
          const existingEps = Object.keys(store.parsedScripts)
          let epNum = 1
          if (existingEps.length > 0) {
            const nums = existingEps.map(e => parseInt(e.replace('EP', ''), 10)).filter(n => !isNaN(n))
            epNum = Math.max(...nums) + 1
          }
          const epId = `EP${String(epNum).padStart(2, '0')}`
          parsed.episode = epId
          parsed.fileName = file.name
          store.populateFromScript(parsed)

          return {
            success: true,
            destination: 'script-analysis',
            destinationLabel: 'Análise de Guião',
            description: `Guião HTML importado: ${file.name} → ${epId} (${parsed.scenes.length} cenas)`,
            auto: true,
            navigate: true,
          }
        }
      } catch { /* continue to AI classification */ }
    }
  }

  // Sem API key — só podemos processar formatos directos
  if (!apiKey) {
    // Áudio sem API — não podemos transcrever
    if (content.type === 'audio') {
      return {
        success: false,
        description: 'Ficheiro de áudio requer API key para transcrição. Configura em Definições.',
      }
    }
    // Ficheiros desconhecidos sem API
    if (content.type === 'unknown') {
      return {
        success: false,
        description: `Formato não suportado: .${content.ext}`,
      }
    }

    // Spreadsheet sem API — tentar como orçamento (padrão BudgetImporter)
    if (content.type === 'spreadsheet') {
      return {
        success: true,
        destination: 'budget',
        destinationLabel: 'Orçamento',
        description: `Folha de cálculo detectada: ${file.name}. Abre o módulo Orçamento para importar.`,
        auto: false,
        navigate: true,
        suggestion: true,
      }
    }

    // Texto sem API — guardar como ficheiro do universo
    if (content.type === 'text' && content.text) {
      store.addUniverseFile({
        id: `ufile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        filename: file.name,
        type: content.ext,
        extractedText: content.text.slice(0, 5000),
        rawContent: content.text,
        uploadedAt: Date.now(),
        tags: [],
        linkedTo: null,
        notes: '',
      })
      return {
        success: true,
        destination: 'universe',
        destinationLabel: 'Universo (Ficheiros)',
        description: `${file.name} guardado nos Ficheiros do Universo.`,
        auto: true,
        navigate: false,
      }
    }

    return {
      success: false,
      description: 'API key necessária para classificar este ficheiro. Configura em Definições.',
    }
  }

  // Step 3: Classificação via API (1 chamada)
  try {
    const messages = [{ role: 'user', content: buildClassificationContent(file, content) }]

    const raw = await fetchAPI({
      apiKey,
      system: CLASSIFICATION_SYSTEM,
      messages,
      maxTokens: 800,
      model: MODEL_FAST,
      cache: true,
      ...(content.type === 'pdf' ? { beta: 'pdfs-2024-09-25' } : {}),
    })

    // Parse JSON da resposta
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Resposta da API sem JSON')

    const classification = JSON.parse(jsonMatch[0])
    const { type, confidence, description, department, extractedData } = classification

    // Step 4: Executar acção baseada na classificação
    return await executeClassification({
      type,
      confidence: confidence || 0.5,
      description: description || '',
      department,
      extractedData: extractedData || {},
      file,
      content,
      store,
      currentModule,
    })
  } catch (err) {
    console.error('[UniversalUpload] Erro na classificação:', err)

    // Fallback: guardar nos ficheiros do universo
    const textContent = content.text || ''
    if (textContent) {
      store.addUniverseFile({
        id: `ufile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        filename: file.name,
        type: content.ext,
        extractedText: textContent.slice(0, 5000),
        rawContent: textContent,
        uploadedAt: Date.now(),
        tags: ['upload-auto'],
        linkedTo: null,
        notes: 'Classificação automática falhou — guardado como ficheiro.',
      })
      return {
        success: true,
        destination: 'universe',
        destinationLabel: 'Universo (Ficheiros)',
        description: `${file.name} guardado nos Ficheiros do Universo (classificação falhou).`,
        auto: true,
        navigate: false,
      }
    }

    return {
      success: false,
      description: `Erro ao classificar ${file.name}: ${err.message}`,
    }
  }
}

// ── Construir conteúdo para a chamada de classificação ─────────────

function buildClassificationContent(file, content) {
  const meta = `Ficheiro: ${file.name} (${(file.size / 1024).toFixed(0)} KB, tipo: ${file.type || content.ext})`

  if (content.type === 'image') {
    return [
      { type: 'image', source: { type: 'base64', media_type: content.mediaType, data: content.base64 } },
      { type: 'text', text: `${meta}\n\nClassifica esta imagem conforme as instruções.` },
    ]
  }

  if (content.type === 'pdf') {
    return [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: content.base64 } },
      { type: 'text', text: `${meta}\n\nClassifica este PDF conforme as instruções.` },
    ]
  }

  if (content.type === 'audio') {
    return `${meta}\n\nFicheiro de áudio. Não consigo transcrever directamente. Classifica como "meeting-notes" com confiança baixa e sugere transcrição manual.`
  }

  // Texto (inclui spreadsheet convertido a CSV)
  const textPreview = (content.text || '').slice(0, 6000)
  return `${meta}\n\nConteúdo (primeiros 6000 chars):\n---\n${textPreview}\n---\n\nClassifica conforme as instruções.`
}

// ── Executar acção baseada na classificação ─────────────────────────

async function executeClassification({ type, confidence, description, department, extractedData, file, content, store, currentModule }) {
  const dest = MODULE_MAP[type] || MODULE_MAP['creative-brief']

  // Alta confiança (>= 0.75): acção automática
  if (confidence >= 0.75) {
    // Team list — importar membros
    if (type === 'team-list' && extractedData?.members?.length > 0) {
      let imported = 0
      for (const m of extractedData.members) {
        const exists = store.team.some(t =>
          t.name.toLowerCase() === (m.name || '').toLowerCase()
        )
        if (!exists && m.name) {
          store.addMember({
            id: `tm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: m.name,
            role: m.role || '',
            group: m.group || 'Equipa',
            phone: m.phone || '',
            email: m.email || '',
            photo: '',
            notes: m.notes || '',
            availability: 'available',
            agent: '',
            driveLinks: [],
            origem: 'universal-upload',
          })
          imported++
        }
      }
      return {
        success: true,
        destination: dest.module,
        destinationLabel: dest.label,
        description: `${imported} membro(s) importado(s) de ${file.name}`,
        auto: true,
        navigate: true,
      }
    }

    // Department item (foto)
    if (type === 'department-item' && content.type === 'image') {
      store.addDepartmentItem({
        department: department || 'props',
        notes: description,
        photos: [`data:${content.mediaType};base64,${content.base64}`],
        scenes: [],
        approved: false,
        origem: 'universal-upload',
      })
      return {
        success: true,
        destination: 'departments',
        destinationLabel: 'Departamentos',
        description: `Item de ${department || 'departamento'} adicionado de ${file.name}`,
        auto: true,
        navigate: false,
      }
    }

    // Location photo
    if (type === 'location-photo' && content.type === 'image') {
      // Guardar como captura para revisão no módulo locais
      store.addCapture({
        id: `cap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'image',
        base64Key: `data:${content.mediaType};base64,${content.base64}`,
        textContent: null,
        interpretation: { tipo: 'local', confianca: confidence, descricao: description },
        questions: [],
        answers: {},
        status: 'pending',
        capturedAt: Date.now(),
        destinations: [{ modulo: 'locations', label: 'Locais' }],
      })
      return {
        success: true,
        destination: 'locations',
        destinationLabel: 'Locais',
        description: `Foto de local guardada de ${file.name}`,
        auto: true,
        navigate: false,
      }
    }

    // Creative brief / meeting notes / reference → Universe files
    if (['creative-brief', 'meeting-notes', 'reference-photo'].includes(type)) {
      const textContent = content.text || description || ''
      store.addUniverseFile({
        id: `ufile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        filename: file.name,
        type: content.ext,
        extractedText: textContent.slice(0, 5000),
        rawContent: textContent,
        uploadedAt: Date.now(),
        tags: [type],
        linkedTo: null,
        notes: description,
      })
      return {
        success: true,
        destination: 'universe',
        destinationLabel: 'Universo (Ficheiros)',
        description: `${file.name} adicionado ao Universo — ${description}`,
        auto: true,
        navigate: false,
      }
    }

    // Budget / contract / invoice → sugerir importação (requer BudgetImporter)
    if (['budget', 'contract', 'invoice'].includes(type)) {
      // Guardar documento financeiro
      const textContent = content.text || ''
      store.addBudgetDocument({
        id: `bdoc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        filename: file.name,
        type: content.ext,
        extractedText: textContent.slice(0, 8000),
        uploadedAt: Date.now(),
        tags: [type],
        category: type,
        notes: description,
      })
      return {
        success: true,
        destination: 'budget',
        destinationLabel: 'Orçamento',
        description: `${file.name} guardado nos documentos financeiros — ${description}`,
        auto: true,
        navigate: true,
      }
    }

    // Schedule → production
    if (type === 'schedule') {
      const textContent = content.text || ''
      store.addUniverseFile({
        id: `ufile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        filename: file.name,
        type: content.ext,
        extractedText: textContent.slice(0, 5000),
        rawContent: textContent,
        uploadedAt: Date.now(),
        tags: ['schedule', 'planning'],
        linkedTo: null,
        notes: description,
      })
      return {
        success: true,
        destination: 'production',
        destinationLabel: 'Produção',
        description: `Plano de rodagem detectado em ${file.name} — ${description}`,
        auto: false,
        navigate: true,
        suggestion: true,
      }
    }

    // Continuity note
    if (type === 'continuity-note') {
      const textContent = content.text || ''
      store.addUniverseFile({
        id: `ufile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        filename: file.name,
        type: content.ext,
        extractedText: textContent.slice(0, 5000),
        rawContent: textContent,
        uploadedAt: Date.now(),
        tags: ['continuity'],
        linkedTo: null,
        notes: description,
      })
      return {
        success: true,
        destination: 'continuity',
        destinationLabel: 'Continuidade',
        description: `Nota de continuidade de ${file.name} — ${description}`,
        auto: true,
        navigate: false,
      }
    }
  }

  // Confiança média/baixa (< 0.75): criar sugestão
  const textContent = content.text || ''
  store.addUniverseFile({
    id: `ufile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    filename: file.name,
    type: content.ext,
    extractedText: textContent.slice(0, 5000),
    rawContent: textContent,
    uploadedAt: Date.now(),
    tags: [type, 'upload-classificar'],
    linkedTo: null,
    notes: description,
  })

  // Criar sugestão para o utilizador decidir
  store.addSuggestion({
    type: 'universal-upload',
    source: 'upload',
    target: dest.module,
    title: `Ficheiro: ${file.name}`,
    description: `${description} (confiança: ${Math.round(confidence * 100)}%). Guardado nos Ficheiros do Universo. Verificar destino sugerido: ${dest.label}.`,
    data: { fileName: file.name, classifiedType: type, confidence },
  })

  return {
    success: true,
    destination: 'universe',
    destinationLabel: 'Universo (Ficheiros)',
    description: `${file.name} guardado nos Ficheiros — confiança ${Math.round(confidence * 100)}%. Sugestão criada para ${dest.label}.`,
    auto: false,
    navigate: false,
    suggestion: true,
  }
}
