// Parser de guião Final Draft
// Suporta: HTML export (preferido) e RTF (fallback)
// HTML Final Draft usa indentação fixa em <pre> — muito mais fiável que heurísticas

// ── Limites de indentação (Final Draft HTML export) ───────────────
// Acção:      indent ≤ 20
// Diálogo:    21–28
// Parentética:29–33
// Personagem: ≥ 34
// Cena:       indent < 5  e começa com INT/EXT
const INDENT = {
  SCENE_MAX:   4,    // < 5
  ACTION_MAX:  20,
  DIALOGUE_MIN:21, DIALOGUE_MAX: 28,
  PAREN_MIN:   29, PAREN_MAX:    33,
  CHAR_MIN:    34,
}

// ── Known time periods for Portuguese scripts ────────────────────
const KNOWN_TIMES = ['FIM DE DIA', 'DIA', 'NOITE', 'MANHÃ', 'MADRUGADA', 'TARDE', 'AMANHECER', 'CREPÚSCULO', 'ENTARDECER', 'GOLDEN', 'ALMOÇO']

// ── Smart scene heading parser ───────────────────────────────────
// Handles Portuguese FDX patterns:
//   Int. MANHÃ. COZINHA JOÃO.       (time BEFORE location)
//   Ext. Rua. MANHÃ.                (time AFTER location)
//   EXT. PÁTIO DA ESCOLA.           (no time)
//   INt. fim de dia. QUARTO JoãO    (mixed case, multi-word time)
//   EXT. RUA NOITE                  (no separator)
//   INT. NOITE. COZINHA             (time before location)
function parseSceneHeading(content) {
  // 1. Extract INT/EXT prefix
  const prefixMatch = content.match(/^(INT\.?(?:\/EXT\.?)?|EXT\.?(?:\/INT\.?)?)\.?\s*/i)
  const intExt = prefixMatch
    ? prefixMatch[1].replace(/[./]/g, '').trim().toUpperCase()
    : 'INT'
  let rest = prefixMatch ? content.slice(prefixMatch[0].length) : content

  // 2. Search for known time periods (longest first to match "FIM DE DIA" before "DIA")
  let timeOfDay = null
  const restUpper = rest.toUpperCase()
  for (const time of KNOWN_TIMES) {
    // Match as whole word (with optional surrounding dots/spaces/dashes)
    const escaped = time.replace(/\s+/g, '\\s+')
    const re = new RegExp(`(?:^|[\\s.\\-–—])${escaped}(?:[\\s.\\-–—]|$)`, 'i')
    if (re.test(restUpper)) {
      timeOfDay = time
      // Remove the time from rest (case-insensitive)
      const removeRe = new RegExp(`\\s*[-–—.]*\\s*${escaped}\\s*[-–—.]*\\s*`, 'ig')
      rest = rest.replace(removeRe, ' ')
      break
    }
  }

  // 3. Clean up location: remove leading/trailing dots, dashes, spaces
  let location = rest
    .replace(/^[\s.\-–—]+/, '')
    .replace(/[\s.\-–—]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()

  // If location ended up empty (e.g., heading was just "INT. DIA"), use original
  if (!location) location = content

  return {
    intExt,
    location,
    timeOfDay: timeOfDay || 'DIA',
    hadTimeOfDay: !!timeOfDay,
  }
}

// ── Production notes detection ───────────────────────────────────
const PRODUCTION_NOTE_RE = /^(NOTA:|N\.B\.|NOTA DO REALIZADOR:|NOTA DE PRODUÇÃO:)/i

// ── Articles for character detection in action text ──────────────
const PT_ARTICLES = ['o', 'a', 'os', 'as', 'do', 'da', 'dos', 'das', 'ao', 'à', 'pelo', 'pela', 'no', 'na']
const PT_ARTICLES_RE = new RegExp(`\\b(${PT_ARTICLES.join('|')})\\s+`, 'gi')

// ── Extract characters mentioned in action text ──────────────────
function extractActionCharacters(scenes) {
  // Collect all known character names from dialogue across all scenes
  const knownNames = new Set()
  for (const sc of scenes) {
    for (const c of (sc.characters || [])) {
      knownNames.add((typeof c === 'string' ? c : c.name || c).toUpperCase())
    }
  }

  for (const sc of scenes) {
    const actionText = (sc.action || []).join(' ')
    if (!actionText) continue

    const sceneChars = new Set((sc.characters || []).map(c =>
      (typeof c === 'string' ? c : c.name || c).toUpperCase()
    ))

    // 1. Search for known character names in action (case-insensitive)
    for (const name of knownNames) {
      if (sceneChars.has(name)) continue
      // Match as whole word
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`\\b${escaped}\\b`, 'i')
      if (re.test(actionText)) {
        sceneChars.add(name)
        if (Array.isArray(sc.characters)) {
          sc.characters.push(name)
        } else {
          sc.characters.add(name)
        }
      }
    }

    // 2. Look for CAPITALIZED names after Portuguese articles: "o JOÃO entra"
    for (const article of PT_ARTICLES) {
      const re = new RegExp(`\\b${article}\\s+([A-ZÁÀÃÂÉÊÍÓÔÕÚÜÇ][A-ZÁÀÃÂÉÊÍÓÔÕÚÜÇ]{1,})\\b`, 'g')
      let match
      while ((match = re.exec(actionText)) !== null) {
        const candidate = match[1].toUpperCase()
        if (sceneChars.has(candidate)) continue
        if (isCharName(candidate)) {
          sceneChars.add(candidate)
          knownNames.add(candidate)
          if (Array.isArray(sc.characters)) {
            sc.characters.push(candidate)
          } else {
            sc.characters.add(candidate)
          }
        }
      }
    }
  }
}

// ── Parser HTML (Final Draft export) ─────────────────────────────
export function parseScriptHtml(htmlContent, options = {}) {
  const { episodeId = 'EP01' } = options

  // Extrair conteúdo do <pre>
  const preMatch = htmlContent.match(/<pre>([\s\S]*?)<\/pre>/i)
  if (!preMatch) return parseScriptText(htmlContent, options)  // fallback

  const rawLines = preMatch[1]
    .replace(/<[^>]+>/g, '')   // remover tags HTML residuais
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .split('\n')

  const scenes   = []
  const errors   = []

  let currentScene = null
  let currentChar  = null
  let lastDialogue = null
  let sceneCounter = 0

  rawLines.forEach((rawLine, lineIdx) => {
    // Ignorar linhas vazias e separadores
    if (!rawLine.trim() || /^[-=]{3,}/.test(rawLine.trim())) return

    const indent   = rawLine.search(/\S/)   // posição do primeiro char não-espaço
    const content  = rawLine.trim()
    if (!content || indent < 0) return

    // ── Detectar tipo por indentação ──────────────────────────────

    // Cabeçalho de cena
    if (indent <= INDENT.SCENE_MAX && /^(\d+[\s.]*)?s*(INT|EXT)\b/i.test(content)) {
      if (currentScene) scenes.push(finalizeScene(currentScene))
      sceneCounter++
      currentChar  = null
      lastDialogue = null

      // Extrair scene number do início: "1. INT..." ou "12 INT..."
      const numPrefix = content.match(/^(\d+)\s*[.\s]\s*/)
      const origNum = numPrefix ? numPrefix[1] : null
      const cleanContent = origNum ? content.slice(numPrefix[0].length) : content

      const heading = parseSceneHeading(cleanContent)
      const sceneId = origNum
        ? `SC${String(origNum).padStart(3, '0')}`
        : `SC${String(sceneCounter).padStart(3, '0')}`
      currentScene = {
        id:        sceneId,
        sceneNumber: origNum || String(sceneCounter),
        episode:   episodeId,
        intExt:    heading.intExt,
        location:  heading.location,
        timeOfDay: heading.timeOfDay,
        _hadTimeOfDay: heading.hadTimeOfDay,
        synopsis:  '',
        characters: new Set(),
        dialogue:  [],
        action:    [],
      }
      return
    }

    // Nome de personagem
    if (indent >= INDENT.CHAR_MIN) {
      const cleaned = content.replace(/\s*\(.*?\)\s*/g, '').trim()
      if (isCharName(cleaned)) {
        currentChar = cleaned.toUpperCase()
        if (currentScene) currentScene.characters.add(currentChar)
      } else {
        // É acção/instrução de câmara centrada — tratar como acção
        if (currentScene) currentScene.action.push(content)
        currentChar = null
      }
      lastDialogue = null
      return
    }

    // Parentética
    if (indent >= INDENT.PAREN_MIN && indent <= INDENT.PAREN_MAX) {
      // ignorar — não altera o currentChar
      return
    }

    // Diálogo
    if (indent >= INDENT.DIALOGUE_MIN && indent <= INDENT.DIALOGUE_MAX && currentChar) {
      if (!currentScene) return
      if (lastDialogue?.character === currentChar) {
        lastDialogue.text += ' ' + content
      } else {
        lastDialogue = { character: currentChar, text: content }
        currentScene.dialogue.push(lastDialogue)
      }
      currentScene.synopsis = (currentScene.synopsis + ' ' + content).slice(0, 250)
      return
    }

    // Acção (e transições, sequências, etc.)
    if (currentScene) {
      // Transições não entram no synopsis
      if (/^(FADE|CORTE|DISSOLVE|SMASH)/i.test(content) || /^[A-Z\s]+:\s*$/.test(content)) {
        currentChar = null
        return
      }
      currentScene.action.push(content)
      currentScene.synopsis = (currentScene.synopsis + ' ' + content).slice(0, 250)
      // Acção reseta o personagem activo (evita que texto de acção seja confundido com diálogo)
      if (indent <= INDENT.ACTION_MAX) currentChar = null
    }
  })

  if (currentScene) scenes.push(finalizeScene(currentScene))

  extractActionCharacters(scenes)
  const allCharacters = extractAllCharacters(scenes)

  return {
    scenes,
    metadata: {
      totalScenes:    scenes.length,
      totalDialogues: scenes.reduce((s, sc) => s + sc.dialogue.length, 0),
      characters:     allCharacters,
      parseErrors:    errors,
      confidence:     scenes.length > 3 ? 'alta' : 'média',
      format:         'Final Draft HTML',
    },
  }
}

// ── Parser RTF (fallback) ─────────────────────────────────────────
export function stripRtf(rtfContent) {
  if (!rtfContent) return ''
  const hexMap = {
    'e3':'ã','c3':'Ã','e1':'á','c1':'Á','e0':'à','c0':'À','e2':'â','c2':'Â',
    'e9':'é','c9':'É','ea':'ê','ca':'Ê','ed':'í','cd':'Í','f3':'ó','d3':'Ó',
    'f4':'ô','d4':'Ô','fa':'ú','da':'Ú','e7':'ç','c7':'Ç','f5':'õ','d5':'Õ',
    'fc':'ü','85':'...','96':'–','97':'—','a0':' ',
  }
  return rtfContent
    .replace(/\\'([0-9a-fA-F]{2})/g, (_, h) => hexMap[h.toLowerCase()] || '')
    .replace(/\\par\b/g, '\n')
    .replace(/\\\n/g, ' ')
    .replace(/\\[a-zA-Z*]+[-\d]* ?/g, '')
    .replace(/\{[^{}]{0,200}\}/g, '')
    .replace(/[{}]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

// ── Entry point unificado ─────────────────────────────────────────
export function parseScript(rawContent, options = {}) {
  // FDX — Final Draft XML (formato nativo, mais fiável)
  if (rawContent.includes('<FinalDraft') || rawContent.includes('<?xml') && rawContent.includes('Paragraph Type=')) {
    return parseScriptFdx(rawContent, options)
  }
  // HTML export Final Draft
  if (rawContent.includes('<pre>') || rawContent.includes('<html')) {
    return parseScriptHtml(rawContent, options)
  }
  // RTF → texto → parser de texto
  const isRtf = rawContent.startsWith('{\\rtf') || rawContent.includes('\\ansi')
  const text  = isRtf ? stripRtf(rawContent) : rawContent
  return parseScriptText(text, options)
}

// ── Parser FDX (Final Draft XML nativo) ──────────────────────────
export function parseScriptFdx(xmlContent, options = {}) {
  const { episodeId = 'EP01' } = options

  // Usar DOMParser para interpretar XML
  const parser  = new DOMParser()
  const doc     = parser.parseFromString(xmlContent, 'application/xml')
  const parseErr = doc.querySelector('parsererror')
  if (parseErr) throw new Error('FDX inválido: ' + parseErr.textContent.slice(0, 120))

  const paragraphs = Array.from(doc.querySelectorAll('Content > Paragraph'))

  const scenes   = []
  const errors   = []
  let currentScene = null
  let currentChar  = null
  let lastDialogue = null
  let sceneCounter = 0
  let orphanText   = []  // Texto antes da 1ª Scene Heading

  // Extrai todo o texto de um elemento Paragraph (pode ter vários <Text>)
  const getText = (el) =>
    Array.from(el.querySelectorAll('Text'))
      .map(t => t.textContent)
      .join('')
      .trim()

  paragraphs.forEach(para => {
    const type    = para.getAttribute('Type') || ''
    const content = getText(para)
    if (!content) return

    // Capturar texto antes da primeira cena
    if (!currentScene && type !== 'Scene Heading') {
      orphanText.push(content)
      return
    }

    switch (type) {

      case 'Scene Heading': {
        if (currentScene) scenes.push(finalizeScene(currentScene))
        sceneCounter++
        currentChar  = null
        lastDialogue = null
        // Smart heading parser handles all Portuguese patterns
        const heading = parseSceneHeading(content)
        // Extrair CharacterArcBeat (notas do realizador por personagem)
        const arcBeats = {}
        para.querySelectorAll('CharacterArcBeat').forEach(beat => {
          const charName = beat.getAttribute('Name')?.toUpperCase()
          if (charName) {
            const note = Array.from(beat.querySelectorAll('Text')).map(t => t.textContent).join(' ').trim()
            if (note) arcBeats[charName] = note
          }
        })
        // Extrair SceneProperties: Length, Page, Title
        const sceneProps = para.querySelector('SceneProperties')
        const pageLength = sceneProps?.getAttribute('Length') || null   // e.g. "3/8", "1 2/8"
        const pageNumber = sceneProps?.getAttribute('Page') || null     // e.g. "2"
        const sceneTitle = sceneProps?.getAttribute('Title') || null    // scene title from FDX
        // Preservar scene number original do FDX
        const fdxNumber = para.getAttribute('Number')
          || sceneProps?.getAttribute('Number')
          || null
        const sceneId = fdxNumber
          ? `SC${String(fdxNumber).padStart(3, '0')}`
          : `SC${String(sceneCounter).padStart(3, '0')}`
        currentScene = {
          id:        sceneId,
          sceneNumber: fdxNumber || String(sceneCounter),
          episode:   episodeId,
          intExt:    heading.intExt,
          location:  heading.location,
          timeOfDay: heading.timeOfDay,
          _hadTimeOfDay: heading.hadTimeOfDay,
          synopsis:  '',
          characters: new Set(),
          dialogue:  [],
          action:    [],
          productionNotes: [],
          arcBeats,
          pageLength,
          pageNumber,
          sceneTitle,
        }
        break
      }

      case 'Character': {
        const cleaned = content.replace(/\s*\(.*?\)\s*/g, '').trim()
        if (isCharName(cleaned)) {
          currentChar = cleaned.toUpperCase()
          if (currentScene) currentScene.characters.add(currentChar)
        } else {
          currentChar = null
        }
        lastDialogue = null
        break
      }

      case 'Parenthetical':
        // Guardar parentética associada ao diálogo seguinte
        if (currentScene && currentChar) {
          if (!currentScene._nextParen) currentScene._nextParen = {}
          currentScene._nextParen[currentChar] = content
        }
        break

      case 'Dialogue': {
        if (!currentScene || !currentChar) break
        const paren = currentScene._nextParen?.[currentChar] || null
        if (paren) { delete currentScene._nextParen[currentChar] }
        if (lastDialogue?.character === currentChar && !paren) {
          lastDialogue.text += ' ' + content
        } else {
          lastDialogue = { character: currentChar, text: content, ...(paren ? { parenthetical: paren } : {}) }
          currentScene.dialogue.push(lastDialogue)
        }
        currentScene.synopsis = (currentScene.synopsis + ' ' + content).slice(0, 250)
        break
      }

      case 'Action': {
        if (!currentScene) break
        // Detect production notes (NOTA:, N.B., etc.)
        if (PRODUCTION_NOTE_RE.test(content)) {
          if (!currentScene.productionNotes) currentScene.productionNotes = []
          currentScene.productionNotes.push(content)
        } else {
          currentScene.action.push(content)
          currentScene.synopsis = (currentScene.synopsis + ' ' + content).slice(0, 250)
        }
        currentChar  = null
        lastDialogue = null
        break
      }

      case 'Transition':
      case 'Shot':
      case 'New Act':
        // Transições e actos não são cenas nem personagens
        currentChar  = null
        lastDialogue = null
        break

      default:
        if (content && currentScene) {
          currentScene.action.push(content)
        }
    }
  })

  if (currentScene) scenes.push(finalizeScene(currentScene))

  // Extract characters mentioned in action text
  extractActionCharacters(scenes)

  // Avisos de qualidade
  if (orphanText.length > 0) {
    errors.push({ type: 'warning', msg: `Texto antes da 1ª cena ignorado (${orphanText.length} parágrafo${orphanText.length > 1 ? 's' : ''}): "${orphanText[0].slice(0, 80)}…"` })
  }
  // Detectar gaps nos números de cena
  const sceneNums = scenes.map(s => parseInt(s.sceneNumber, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b)
  for (let i = 1; i < sceneNums.length; i++) {
    if (sceneNums[i] - sceneNums[i - 1] > 1) {
      const missing = []
      for (let n = sceneNums[i - 1] + 1; n < sceneNums[i]; n++) missing.push(n)
      errors.push({ type: 'error', msg: `Cena(s) em falta: ${missing.join(', ')} (entre SC${String(sceneNums[i - 1]).padStart(3, '0')} e SC${String(sceneNums[i]).padStart(3, '0')})` })
    }
  }
  // Cenas sem timeOfDay detectado
  const noTime = scenes.filter(s => !s._hadTimeOfDay)
  if (noTime.length > 0) {
    errors.push({ type: 'info', msg: `${noTime.length} cena(s) sem período do dia explícito (assumido DIA): ${noTime.slice(0, 5).map(s => s.id).join(', ')}${noTime.length > 5 ? '…' : ''}` })
  }

  // ── Mirror scene linking ──────────────────────────────────────
  // Ligar pares de cenas espelho: mesma localização OU personagens partilhados,
  // dentro de 10 posições no guião, bidireccional
  const mirrorIdxs = scenes.reduce((acc, s, i) => (s.isMirror ? [...acc, i] : acc), [])
  mirrorIdxs.forEach(i => {
    if (scenes[i].mirrorOf) return
    let bestJ = -1, bestDist = Infinity
    mirrorIdxs.forEach(j => {
      if (i === j || scenes[j].mirrorOf) return
      const dist = Math.abs(i - j)
      if (dist > 10 || dist >= bestDist) return
      const sc = scenes[i], other = scenes[j]
      const sameLocation = sc.location && other.location &&
        sc.location.toLowerCase() === other.location.toLowerCase()
      const sharedChar = (sc.characters || []).some(c => (other.characters || []).includes(c))
      if (sameLocation || sharedChar) { bestJ = j; bestDist = dist }
    })
    if (bestJ >= 0) {
      const mkI = `${episodeId}-${scenes[i].sceneNumber || scenes[i].id}`
      const mkJ = `${episodeId}-${scenes[bestJ].sceneNumber || scenes[bestJ].id}`
      scenes[i].mirrorOf = mkJ
      scenes[bestJ].mirrorOf = mkI
    }
  })

  const allCharacters = extractAllCharacters(scenes)

  return {
    scenes,
    orphanText: orphanText.length > 0 ? orphanText : undefined,
    metadata: {
      totalScenes:    scenes.length,
      totalDialogues: scenes.reduce((s, sc) => s + sc.dialogue.length, 0),
      characters:     allCharacters,
      parseErrors:    errors,
      confidence:     errors.some(e => e.type === 'error') ? 'média' : 'alta',
      format:         'Final Draft FDX',
    },
  }
}

// ── Parser de texto puro (último fallback) ───────────────────────
function parseScriptText(text, options = {}) {
  const { episodeId = 'EP01' } = options
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const scenes = []
  const errors = []
  let currentScene = null
  let currentChar  = null
  let sceneCounter = 0
  let orphanText   = []

  lines.forEach(line => {
    // Capturar texto antes da primeira cena
    if (!currentScene && !/^(\d+[\s.]\s*)?(INT|EXT)\b/i.test(line)) {
      orphanText.push(line)
      return
    }
    if (/^(\d+[\s.]\s*)?(INT|EXT)\b/i.test(line)) {
      if (currentScene) scenes.push(finalizeScene(currentScene))
      sceneCounter++
      const numPrefix = line.match(/^(\d+)\s*[.\s]\s*/)
      const origNum = numPrefix ? numPrefix[1] : null
      const cleanLine = origNum ? line.slice(numPrefix[0].length) : line
      const sceneId = origNum
        ? `SC${String(origNum).padStart(3, '0')}`
        : `SC${String(sceneCounter).padStart(3, '0')}`
      const heading = parseSceneHeading(cleanLine)
      currentScene = {
        id: sceneId, sceneNumber: origNum || String(sceneCounter), episode: episodeId,
        intExt: heading.intExt,
        location: heading.location, timeOfDay: heading.timeOfDay,
        _hadTimeOfDay: heading.hadTimeOfDay,
        synopsis: '', characters: new Set(), dialogue: [], action: [],
      }
      currentChar = null
    } else if (line === line.toUpperCase() && isCharName(line.replace(/\s*\(.*?\)\s*/g, '').trim())) {
      currentChar = line.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase()
      if (currentScene) currentScene.characters.add(currentChar)
    } else if (currentChar && currentScene) {
      const last = currentScene.dialogue[currentScene.dialogue.length - 1]
      if (last?.character === currentChar) last.text += ' ' + line
      else currentScene.dialogue.push({ character: currentChar, text: line })
      currentScene.synopsis = (currentScene.synopsis + ' ' + line).slice(0, 250)
    } else if (currentScene) {
      currentScene.action.push(line)
      currentScene.synopsis = (currentScene.synopsis + ' ' + line).slice(0, 250)
      currentChar = null
    }
  })
  if (currentScene) scenes.push(finalizeScene(currentScene))

  extractActionCharacters(scenes)

  // Avisos de qualidade
  if (orphanText.length > 0) {
    errors.push({ type: 'warning', msg: `Texto antes da 1ª cena ignorado (${orphanText.length} linha${orphanText.length > 1 ? 's' : ''}): "${orphanText[0].slice(0, 80)}…"` })
  }
  const sceneNums = scenes.map(s => parseInt(s.sceneNumber, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b)
  for (let i = 1; i < sceneNums.length; i++) {
    if (sceneNums[i] - sceneNums[i - 1] > 1) {
      const missing = []
      for (let n = sceneNums[i - 1] + 1; n < sceneNums[i]; n++) missing.push(n)
      errors.push({ type: 'error', msg: `Cena(s) em falta: ${missing.join(', ')} (entre SC${String(sceneNums[i - 1]).padStart(3, '0')} e SC${String(sceneNums[i]).padStart(3, '0')})` })
    }
  }
  const noTime = scenes.filter(s => !s._hadTimeOfDay)
  if (noTime.length > 0) {
    errors.push({ type: 'info', msg: `${noTime.length} cena(s) sem período do dia explícito (assumido DIA): ${noTime.slice(0, 5).map(s => s.id).join(', ')}${noTime.length > 5 ? '…' : ''}` })
  }

  return {
    scenes,
    orphanText: orphanText.length > 0 ? orphanText : undefined,
    metadata: {
      totalScenes: scenes.length,
      totalDialogues: scenes.reduce((s, sc) => s + sc.dialogue.length, 0),
      characters: extractAllCharacters(scenes),
      parseErrors: errors, confidence: errors.some(e => e.type === 'error') ? 'baixa' : scenes.length > 3 ? 'média' : 'baixa',
      format: 'Texto',
    },
  }
}

// ── Helpers ───────────────────────────────────────────────────────

// Valida se uma string é um nome de personagem legítimo
function isCharName(str) {
  if (!str || str.length < 2 || str.length > 40) return false
  // Contém dígito → título de ato, numeração, etc.
  if (/\d/.test(str)) return false
  // Contém " - " → título de ato ("ATO 2 - DONT DARE ME")
  if (/\s[-–—]\s/.test(str)) return false
  // Palavras-chave que nunca são personagens
  const NOT_CHARS = /^(POV|OK|ATO|EXT|INT|VEMOS|CUT TO|CUT|FADE|DISSOLVE|CORTE|SMASH|SEQUÊNCIA|SHOT|BACK TO|THE END|FIM|NEGRO|PRETO|BLACK|TITULO|TÍTULO|FLASHBACK|FLASH BACK|CONTINUA|CONTINUAÇÃO|NOTA|NOTE)\b/i
  if (NOT_CHARS.test(str)) return false
  // Deve começar por letra
  if (!/^[A-ZÁÀÃÂÉÊÍÓÔÕÚÜÇ]/i.test(str)) return false
  return true
}

// Normalizar nome de personagem (acentos, V.O., CONT'D, etc.)
function normalizeCharName(name) {
  return name
    .toUpperCase()
    .replace(/\s*\(.*?\)\s*/g, '')  // remove (V.O.), (OFF), (CONT'D)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove acentos para comparação
    .trim()
}

// Deduplica personagens por variantes (JOÃO=JOAO, MARIA (V.O.)=MARIA)
function deduplicateCharacters(characters) {
  const canonical = {}  // normalizedName → best original name (com acentos)
  const merged = {}     // normalizedName → merged data

  for (const c of characters) {
    const norm = normalizeCharName(c.name)
    if (!merged[norm]) {
      merged[norm] = { ...c, scenes: [...c.scenes], directorNotes: [...(c.directorNotes || [])] }
      canonical[norm] = c.name
    } else {
      // Merge dados
      merged[norm].scenes = [...new Set([...merged[norm].scenes, ...c.scenes])]
      merged[norm].lineCount += c.lineCount
      merged[norm].directorNotes = [...(merged[norm].directorNotes || []), ...(c.directorNotes || [])]
      // Preferir o nome com acentos (mais longo em bytes = tem acentos)
      if (c.name.length > canonical[norm].length || new Blob([c.name]).size > new Blob([canonical[norm]]).size) {
        canonical[norm] = c.name
      }
    }
  }

  return Object.entries(merged).map(([norm, data]) => ({
    ...data,
    name: canonical[norm],
  })).sort((a, b) => b.lineCount - a.lineCount)
}

function finalizeScene(scene) {
  const chars = Array.from(scene.characters)
  const wordCount = scene.dialogue.reduce((s, d) => s + d.text.split(' ').length, 0)

  let type = 'diálogo'
  if (chars.length >= 4)                                     type = 'grupo'
  else if (chars.length === 1 && wordCount > 30)             type = 'solo'
  else if (scene.action.length > 3 && wordCount < 20)        type = 'transição'

  const anchorKw = ['corar por dentro','golden','árvore','sc027','sc021','mais importante']
  if (anchorKw.some(kw => scene.synopsis.toLowerCase().includes(kw))) type = 'âncora'

  // ── Auto-detect scene tags/characteristics ──────────────────────
  const autoTags = []
  const fullText = (scene.action || []).join(' ').toLowerCase() + ' ' + scene.synopsis.toLowerCase()
  if (/croma|green\s*screen|chroma/i.test(fullText)) autoTags.push('croma')
  if (/stunt|acrobacia|luta|queda|perseguição/i.test(fullText)) autoTags.push('stunts')
  if (/explosão|pirotecnia|sfx|efeito especial/i.test(fullText)) autoTags.push('sfx')
  if (/vfx|efeito visual|cgi|composição/i.test(fullText)) autoTags.push('vfx')
  if (/criança|menor|miúd|bebé|infant/i.test(fullText)) autoTags.push('criancas')
  if (/cão|gato|cavalo|animal|pássaro|galinha/i.test(fullText)) autoTags.push('animais')
  if (/piscina|mar|rio|praia|chuva|água|mergulh/i.test(fullText)) autoTags.push('agua')
  if (/noite americana|day.for.night/i.test(fullText)) autoTags.push('noite_amer')
  if (/beij|nud|sexo|intim|cama /i.test(fullText)) autoTags.push('intimidade')
  if (/carro|mota|carrinha|autocarro|táxi|veículo|conduz/i.test(fullText)) autoTags.push('veiculos')
  if (/arma|pistola|espingarda|tiro|disparo|pirotecnia/i.test(fullText)) autoTags.push('armas')
  if (/figuração|multidão|figurantes|crowd|grupo grande/i.test(fullText)) autoTags.push('multidao')
  if (/playback|música ao vivo|concerto|dança/i.test(fullText)) autoTags.push('playback')
  if (/refeição|jantar|almoço|come[mr]|cozinha.*prepara/i.test(fullText)) autoTags.push('refeicao')
  if (/telefone|telemóvel|smartphone|celular/i.test(fullText)) autoTags.push('telefone')
  if (/comer|comida|refeição/i.test(fullText) && !autoTags.includes('refeicao')) autoTags.push('comida')
  if (/música|coluna|headphones|phones|rádio/i.test(fullText)) autoTags.push('musica')
  if (/sangue|ferida|corte(?:\s|$)|sangrar/i.test(fullText)) autoTags.push('sangue')

  // ── Detect figuração (extras) in action text ──────────────────
  const extras = []
  const actionJoined = (scene.action || []).join(' ')
  if (actionJoined) {
    const actionLower = actionJoined.toLowerCase()
    // Numbered groups: "4 pessoas", "3 estão sentados", "grupo de 5"
    const numberedRe = /(\d+)\s+(?:pessoas|homens|mulheres|jovens|crianças|idosos|alunos|convidados|soldados|figurantes|transeuntes|clientes|vizinhos|amigos|trabalhadores)/gi
    let m
    while ((m = numberedRe.exec(actionJoined)) !== null) {
      extras.push({ description: m[0].trim(), estimatedCount: parseInt(m[1], 10) })
    }
    const groupOfRe = /grupo\s+de\s+(\d+)/gi
    while ((m = groupOfRe.exec(actionJoined)) !== null) {
      extras.push({ description: m[0].trim(), estimatedCount: parseInt(m[1], 10) })
    }
    // Named groups without explicit count
    const namedGroups = [
      { re: /\b(?:os\s+)?convidados\b/i, desc: 'convidados', est: 8 },
      { re: /\b(?:os\s+)?alunos\b/i, desc: 'alunos', est: 15 },
      { re: /\bgrupo\s+de\s+amigos\b/i, desc: 'grupo de amigos', est: 5 },
      { re: /\bmultidão\b/i, desc: 'multidão', est: 30 },
      { re: /\bfigurantes?\b/i, desc: 'figurantes', est: 10 },
      { re: /\btranseuntes?\b/i, desc: 'transeuntes', est: 8 },
      { re: /\b(?:os\s+)?clientes?\b/i, desc: 'clientes', est: 6 },
      { re: /\bpúblico\b/i, desc: 'público', est: 20 },
      { re: /\b(?:os\s+)?vizinhos\b/i, desc: 'vizinhos', est: 5 },
    ]
    for (const ng of namedGroups) {
      if (ng.re.test(actionJoined) && !extras.some(e => e.description.toLowerCase().includes(ng.desc))) {
        extras.push({ description: ng.desc, estimatedCount: ng.est })
      }
    }
    // Implicit extras
    if (/\bsala\s+(está\s+)?cheia\b/i.test(actionLower)) {
      extras.push({ description: 'figuração implícita (sala cheia)', estimatedCount: 15 })
    }
    if (/\brua\s+movimentada\b/i.test(actionLower)) {
      extras.push({ description: 'figuração implícita (rua movimentada)', estimatedCount: 20 })
    }
    if (/\b(?:bar|café|restaurante)\s+(?:está\s+)?(?:cheio|lotado|movimentad)/i.test(actionLower)) {
      extras.push({ description: 'figuração implícita (estabelecimento cheio)', estimatedCount: 12 })
    }
  }

  delete scene._nextParen
  const hadTimeOfDay = scene._hadTimeOfDay
  delete scene._hadTimeOfDay

  return {
    ...scene,
    _hadTimeOfDay: hadTimeOfDay,
    characters:    chars,
    type,
    autoTags,
    extras,
    productionNotes: scene.productionNotes || [],
    pageLength:    scene.pageLength || null,
    pageNumber:    scene.pageNumber || null,
    sceneTitle:    scene.sceneTitle || null,
    durationMin:   estimateDuration(scene),
    synopsis:      scene.synopsis.trim(),
    goldenHour:    /golden/i.test(scene.timeOfDay || ''),
    solarDependent:scene.intExt === 'EXT' && /golden|amanhecer|crepúsculo/i.test(scene.timeOfDay || ''),
    isMirror:      /\bespelho\b|\bmirror\b|\bcena.{0,10}inversa\b|\bcontra.?campo\b/i.test(scene.description || '') || /\bespelho\b|\bmirror\b/i.test(scene.action?.join(' ') || ''),
    mirrorScenes:  [],
  }
}

function estimateDuration(scene) {
  const words  = scene.dialogue.reduce((s, d) => s + d.text.split(' ').length, 0)
  const action = scene.action.join(' ').split(' ').length
  return Math.max(10, Math.round((words / 130 + action / 200) * 60))
}

function extractAllCharacters(scenes) {
  const chars = {}
  scenes.forEach(sc => {
    sc.characters.forEach(c => {
      if (!chars[c]) chars[c] = { name: c, scenes: [], lineCount: 0, directorNotes: [] }
      chars[c].scenes.push(sc.id)
    })
    sc.dialogue.forEach(d => {
      if (chars[d.character]) chars[d.character].lineCount += d.text.split(' ').length
    })
    // Agregar CharacterArcBeat notes (notas do realizador do FDX)
    if (sc.arcBeats) {
      Object.entries(sc.arcBeats).forEach(([charName, note]) => {
        if (!chars[charName]) chars[charName] = { name: charName, scenes: [], lineCount: 0, directorNotes: [] }
        chars[charName].directorNotes.push(note)
      })
    }
  })
  return deduplicateCharacters(Object.values(chars))
}

// ── Análise de diálogo ────────────────────────────────────────────
export function analyzeDialogue(scenes) {
  const stats = {}
  scenes.forEach(sc => {
    sc.dialogue.forEach(d => {
      if (!d.character) return
      if (!stats[d.character]) stats[d.character] = {
        name: d.character, totalWords: 0, totalLines: 0,
        questions: 0, statements: 0, interruptions: 0, scenes: new Set(),
      }
      const s = stats[d.character]
      s.totalWords += d.text.split(' ').length
      s.totalLines += 1
      s.scenes.add(sc.id)
      if (d.text.includes('?')) s.questions++
      else s.statements++
      if (d.text.trim().endsWith('—') || d.text.trim().endsWith('--')) s.interruptions++
    })
  })
  return Object.values(stats).map(s => ({
    ...s, scenes: Array.from(s.scenes),
    avgLineLength: s.totalLines > 0 ? Math.round(s.totalWords / s.totalLines) : 0,
  })).sort((a, b) => b.totalWords - a.totalWords)
}

// ── Mapa de tensão ────────────────────────────────────────────────
export function buildTensionMap(scenes) {
  return scenes.map(sc => {
    let score = 40
    score += Math.min(20, sc.characters.length * 5)
    const q = sc.dialogue.filter(d => d.text?.includes('?')).length
    score += Math.min(15, q * 3)
    const intr = sc.dialogue.filter(d => d.text?.trim().endsWith('—')).length
    score += Math.min(10, intr * 5)
    if (sc.type === 'âncora')    score = Math.max(score, 80)
    if (sc.type === 'solo')      score = Math.min(score, 65)
    if (sc.type === 'transição') score = Math.min(score, 35)
    if (sc.goldenHour)           score = Math.max(score, 75)
    return { sceneId: sc.id, score: Math.min(100, Math.max(0, score)), episode: sc.episode, location: sc.location, type: sc.type }
  })
}

// ── Comparador de versões ─────────────────────────────────────────
export function compareVersions(scenesA, scenesB) {
  const idsA = new Set(scenesA.map(s => s.id))
  const idsB = new Set(scenesB.map(s => s.id))
  return {
    added:    scenesB.filter(s => !idsA.has(s.id)).map(s => s.id),
    removed:  scenesA.filter(s => !idsB.has(s.id)).map(s => s.id),
    modified: scenesA.filter(s => idsB.has(s.id)).filter(s => {
      const b = scenesB.find(x => x.id === s.id)
      return s.synopsis !== b?.synopsis
    }).map(s => ({ id: s.id, changes: ['content'] })),
  }
}
