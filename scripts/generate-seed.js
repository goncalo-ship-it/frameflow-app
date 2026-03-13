#!/usr/bin/env node
// Gera seed-data.json a partir dos ficheiros dummy
// Uso: node scripts/generate-seed.js
// Output: public/seed-data.json (para uso no DevSeed da app)

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DUMMY = resolve(__dirname, '../../DUMMY CONTENT')
const OUT = resolve(__dirname, '../public/seed-data.json')

// ── Read FDX files ──────────────────────────────────────────────────
function readFDX(path) {
  try {
    return readFileSync(path, 'utf-8')
  } catch (e) {
    console.error(`⚠ Não encontrou: ${path}`)
    return null
  }
}

// Simple FDX parser (subset — enough for seed data)
function parseFDX(text, filename) {
  const episode = filename.match(/EP[_\s]*(\d+)/i)?.[0]?.replace(/[_\s]/g, '') || 'EP01'
  const scenes = []
  const characters = new Map()

  // Extract scenes from <Paragraph Type="Scene Heading">
  const sceneRegex = /<Paragraph[^>]*Type="Scene Heading"[^>]*>([\s\S]*?)<\/Paragraph>/g
  const charRegex = /<Paragraph[^>]*Type="Character"[^>]*>([\s\S]*?)<\/Paragraph>/g
  const dialogueRegex = /<Paragraph[^>]*Type="Dialogue"[^>]*>([\s\S]*?)<\/Paragraph>/g

  // Split by scene headings
  const parts = text.split(/<Paragraph[^>]*Type="Scene Heading"/)
  let sceneNum = 0

  for (let i = 1; i < parts.length; i++) {
    sceneNum++
    const part = parts[i]

    // Extract heading text
    const headingMatch = part.match(/<Text>([\s\S]*?)<\/Text>/)
    const heading = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '').trim() : ''

    // Parse INT/EXT
    const intExtMatch = heading.match(/^(INT|EXT|INT\/EXT|EXT\/INT)\.?\s*/i)
    const intExt = intExtMatch ? intExtMatch[1].toUpperCase() : ''
    const rest = heading.replace(/^(INT|EXT|INT\/EXT|EXT\/INT)\.?\s*/i, '')

    // Parse time of day
    const timeMatch = rest.match(/(MANHÃ|DIA|NOITE|TARDE|MADRUGADA|AMANHECER|CREPÚSCULO|GOLDEN)/i)
    const timeOfDay = timeMatch ? timeMatch[1].toUpperCase() : 'DIA'
    const location = rest.replace(/(MANHÃ|DIA|NOITE|TARDE|MADRUGADA|AMANHECER|CREPÚSCULO|GOLDEN)/i, '')
      .replace(/[-–—.]+$/, '').replace(/^\s*[-–—.]+/, '').trim()

    // Extract characters in this scene block
    const sceneChars = new Set()
    const charMatches = part.matchAll(/<Paragraph[^>]*Type="Character"[^>]*>[\s\S]*?<Text>([\s\S]*?)<\/Text>/g)
    for (const m of charMatches) {
      const name = m[1].replace(/<[^>]+>/g, '').replace(/\(.*?\)/g, '').trim().toUpperCase()
      if (name && name.length > 1 && !/^(POV|FADE|CORTA|ATO|CUT|CONT)/i.test(name)) {
        sceneChars.add(name)
        characters.set(name, (characters.get(name) || 0) + 1)
      }
    }

    const sceneId = `SC${String(sceneNum).padStart(3, '0')}`
    scenes.push({
      id: sceneId,
      sceneNumber: sceneId,
      episode,
      intExt,
      location,
      timeOfDay,
      characters: [...sceneChars],
      dialogue: [],
      action: [],
      synopsis: heading,
      type: sceneChars.size > 2 ? 'grupo' : sceneChars.size === 1 ? 'solo' : 'diálogo',
      autoTags: [],
      durationMin: 2,
    })
  }

  const charList = [...characters.entries()]
    .map(([name, lineCount]) => ({
      name,
      scenes: scenes.filter(s => s.characters.includes(name)).map(s => s.sceneNumber),
      lineCount,
    }))
    .sort((a, b) => b.lineCount - a.lineCount)

  return {
    episode,
    scenes,
    metadata: {
      totalScenes: scenes.length,
      totalDialogues: [...characters.values()].reduce((a, b) => a + b, 0),
      characters: charList,
      parseErrors: [],
      confidence: 'alta',
      format: 'Final Draft FDX',
    },
  }
}

// ── Read Excel (using xlsx npm package) ─────────────────────────────
let XLSX
try {
  XLSX = (await import('xlsx')).default
} catch {
  console.error('⚠ xlsx package not found — run: npm install xlsx')
  process.exit(1)
}

function parseExcelBudget(path) {
  const buf = readFileSync(path)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  const CAT_MAP = {
    'ELENCO': 2, 'EQUIPA': 3, 'EQUIPAMENTO': 4, 'CENOGRAFIA': 5,
    'CONSUMÍVEIS': 6, 'TRANSPORTES': 7, 'PÓS-PRODUÇÃO VÍDEO': 10, 'PÓS-PRODUÇÃO ÁUDIO': 9,
  }

  const lines = []
  let currentCatId = 12

  for (const row of rows) {
    const v0 = String(row[0] || '').trim()
    if (!v0 || /^(sub-?total|total|valor|descrição)/i.test(v0)) continue

    const totalVal = Number(row[4]) || 0
    const isHeader = v0 === v0.toUpperCase() && v0.length > 3 && /[A-ZÁÀÃÉÍÓÚ]/.test(v0)

    if (isHeader && totalVal === 0) {
      const u = v0.toUpperCase()
      for (const [pat, cid] of Object.entries(CAT_MAP)) {
        if (u.includes(pat)) { currentCatId = cid; break }
      }
    } else if (totalVal > 0) {
      lines.push({
        id: `ln_${Math.random().toString(36).slice(2, 10)}`,
        categoria: currentCatId,
        descricao: v0.replace(/\s+/g, ' '),
        valorUnitario: Math.round((Number(row[1]) || 0) * 100),
        quantidade: Number(row[2]) || 1,
        dias: Number(row[3]) || 1,
        custoReal: Math.round(totalVal * 100),
        markup: 1.30,
        taxaIva: 0.23,
        fornecedor: '',
        isFixed: false,
        fixedField: null,
        origem: 'import',
        executado: 0,
      })
    }
  }

  return lines
}

function parseExcelFinancing(path) {
  const buf = readFileSync(path)
  const wb = XLSX.read(buf, { type: 'buffer' })

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    let fonte = '', tipo = 'cash', confirmed = false, total = 0

    for (const row of rows) {
      const joined = row.map(c => String(c)).join(' ').toUpperCase()
      if (/RTP|SIC|TVI|ICA/.test(joined)) {
        const m = joined.match(/\b(RTP|SIC|TVI|ICA)\b/)
        if (m) fonte = m[1]
      }
      if (/NUMER[AÁ]RIO|CASH/.test(joined)) tipo = 'cash'
      if (/APROVAD/.test(joined)) confirmed = true

      for (const cell of row) {
        const val = parseFloat(String(cell).replace(/[€\s]/g, '').replace(',', '.'))
        if (!isNaN(val) && val > 1000 && val > total) total = val
      }
    }

    if (total > 0) {
      return [{
        id: `fin_${Math.random().toString(36).slice(2, 10)}`,
        nome: fonte || 'Financiamento',
        tipo,
        valor: Math.round(total * 100),
        descricao: `Importado de ${path.split('/').pop()}`,
        confirmado: confirmed,
        dataPrevista: '',
      }]
    }
  }
  return []
}

function parseExcelCallsheet(path) {
  const buf = readFileSync(path)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  const ROLE_PATTERNS = [
    'PRODUÇÃO EXECUTIVA', 'REALIZADOR', 'DIRECTOR', 'CHEFE', 'ASS.',
    'ELECTRICISTA', 'SOM', 'GUARDA ROUPA', 'MAKEUP', 'FOTÓGRAFO',
  ]

  const crew = []
  const locations = []
  let date = null

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map(c => String(c).trim())

    // Date
    if (!date) {
      for (const cell of cells) {
        const m = cell.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/)
        if (m) { date = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; break }
      }
    }

    // Crew
    if (cells[1] && ROLE_PATTERNS.some(p => cells[1].toUpperCase().includes(p))) {
      const name = cells[3]
      if (name && name.length > 2 && !/^[\d.]+$/.test(name)) {
        crew.push({ name, role: cells[1], group: guessGroup(cells[1]) })
      }
    }

    // Locations
    if (/^LOCAL$/i.test(cells[0]) && /D[EÉ]COR/i.test(cells[1])) {
      for (let j = i + 1; j < rows.length; j++) {
        const lr = rows[j].map(c => String(c).trim())
        if (/^WRAP$/i.test(lr[0]) || lr.every(c => !c)) break
        if (/ALMO[CÇ]O/i.test(lr[1])) continue
        if (lr[0] && lr[0].length > 2 && !locations.find(l => l.name === lr[0])) {
          locations.push({ name: lr[0], address: (lr[3] || '').replace(/\n/g, ', '), decor: lr[1] || '' })
        }
      }
      break
    }
  }

  return { crew, locations, date }
}

function guessGroup(role) {
  const r = (role || '').toUpperCase()
  if (/PRODU[CÇ]|CHEFE.*PRODU/.test(r)) return 'Produção'
  if (/REALIZA|1.*ASS.*REALIZA/.test(r)) return 'Realização'
  if (/FOT|IMAGEM|CÂMARA/.test(r)) return 'Câmara'
  if (/ELECTRI|GAFFER/.test(r)) return 'Luz'
  if (/SOM|ÁUDIO/.test(r)) return 'Som'
  if (/GUARDA.*ROUPA/.test(r)) return 'Guarda-Roupa'
  if (/MAKEUP|MAQUIL/.test(r)) return 'Maquilhagem'
  if (/ARTE|CENÓGRAF/.test(r)) return 'Arte'
  return 'Equipa'
}

// ══ Main ════════════════════════════════════════════════════════════

console.log('🌱 FrameFlow Seed Generator\n')

const state = {
  parsedScripts: {},
  team: [],
  locations: [],
  budgets: [],
  shootingDays: [],
  sceneAssignments: {},
  departmentItems: [],
}

// 1. Parse FDX
for (const [label, fname] of [['EP01', 'DESDOBRADO_EP_01.fdx'], ['EP02', 'DESDOBRADO_EP_02.fdx']]) {
  const path = resolve(DUMMY, 'GUIOES', fname)
  const text = readFDX(path)
  if (text) {
    const parsed = parseFDX(text, fname)
    state.parsedScripts[label] = parsed
    console.log(`✓ ${label}: ${parsed.scenes.length} cenas, ${parsed.metadata.characters.length} personagens`)
  }
}

// 2. Parse Budget
try {
  const budgetPath = resolve(DUMMY, 'BUDGET  #TRADICIONAL#', 'OR2026_13R_Desdobrado_6EPS_Flaming.xlsx')
  const lines = parseExcelBudget(budgetPath)
  const budget = {
    id: `bud_${Math.random().toString(36).slice(2, 10)}`,
    numero: '2026-001',
    mode: 'fiction',
    status: 'approved',
    createdAt: Date.now(),
    header: {
      data: new Date().toISOString().split('T')[0],
      cliente: '', campanha: 'DESDOBRADO — 6 Episódios',
      agencia: '', meiosEDireitos: '', tecnicaESuporte: 'Vídeo',
      quantidade: 6, duracao: '6×30\'', descricao: 'Série ficção, 6 episódios',
      diasReperage: 3, diasRodagem: 18, local: 'Lisboa / Jamor', notasGerais: '',
    },
    ceiling: null, taxaIva: 0.23, taxaHonorarios: 0.15,
    lines, financing: [], expenses: [], constraints: [], notes: '',
  }

  // 3. Parse Financing
  try {
    const finPath = resolve(DUMMY, 'FINANCIAMENTO', 'RTP_FINANC.xlsx')
    const fin = parseExcelFinancing(finPath)
    budget.financing = fin
    console.log(`✓ Financiamento: ${fin.length} fonte(s)`)
  } catch (e) {
    console.error('⚠ Financiamento:', e.message)
  }

  state.budgets.push(budget)
  console.log(`✓ Orçamento: ${lines.length} linhas`)
} catch (e) {
  console.error('⚠ Orçamento:', e.message)
}

// 4. Parse Callsheet
try {
  const csPath = resolve(DUMMY, 'FOLHA SERVICO #TRADICIONAL#', 'Folha Servico_SKIP_v4.xlsx')
  const cs = parseExcelCallsheet(csPath)

  for (const m of cs.crew) {
    state.team.push({
      id: `mem_${Math.random().toString(36).slice(2, 10)}`,
      name: m.name, role: m.role, group: m.group,
      phone: '', email: '', photo: null,
      notes: 'Importado da folha de serviço', availability: 'available',
    })
  }
  for (const l of cs.locations) {
    state.locations.push({
      id: `loc_${Math.random().toString(36).slice(2, 10)}`,
      name: l.name, address: l.address, status: 'pendente',
      notes: l.decor, mapsLink: '', photos: [],
    })
  }
  console.log(`✓ Folha: ${cs.crew.length} membros, ${cs.locations.length} locais`)
} catch (e) {
  console.error('⚠ Folha de Serviço:', e.message)
}

// 5. Create shooting days from scenes
const allScenes = Object.entries(state.parsedScripts).flatMap(([ep, p]) =>
  (p.scenes || []).map(s => ({ ...s, episode: ep }))
)
if (allScenes.length > 0) {
  const episodeIds = [...new Set(allScenes.map(s => s.episode))].sort()
  let dayNum = 0
  for (const epId of episodeIds) {
    const epScenes = allScenes.filter(s => s.episode === epId)
    const daysPerEp = 3
    const scenesPerDay = Math.ceil(epScenes.length / daysPerEp)
    for (let d = 0; d < daysPerEp; d++) {
      dayNum++
      const dayScenes = epScenes.slice(d * scenesPerDay, (d + 1) * scenesPerDay)
      if (!dayScenes.length) continue
      const dayId = `day_${Math.random().toString(36).slice(2, 10)}`
      const date = new Date()
      date.setDate(date.getDate() + 7 + dayNum - 1)
      while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1)
      state.shootingDays.push({
        id: dayId,
        date: date.toISOString().split('T')[0],
        dayNumber: dayNum,
        episodeNumber: parseInt(epId.replace(/\D/g, '')) || 1,
        dayInEpisode: d + 1,
        location: dayScenes[0]?.location || '',
        callTime: '07:30',
        status: 'planned',
        notes: `Dia ${dayNum} — ${epId}`,
      })
      for (const sc of dayScenes) {
        state.sceneAssignments[`${sc.episode}-${sc.sceneNumber || sc.id}`] = dayId
      }
    }
  }
  console.log(`✓ Rodagem: ${dayNum} dias, ${allScenes.length} cenas atribuídas`)
}

// 6. Department items
const chars = Object.values(state.parsedScripts).flatMap(p => (p.metadata?.characters || []).map(c => c.name)).slice(0, 3)
const sceneKeys = Object.entries(state.parsedScripts).flatMap(([ep, p]) =>
  (p.scenes || []).map(s => `${ep}-${s.sceneNumber || s.id}`)
)
state.departmentItems = [
  { id: 'di1', department: 'wardrobe', name: `Fato ${chars[0] || 'protagonista'}`, scenes: sceneKeys.slice(0, 2), notes: 'Fato cinzento, gravata azul', photos: [], status: 'pendente', capturedBy: 'seed', createdAt: new Date().toISOString() },
  { id: 'di2', department: 'wardrobe', name: `Vestido ${chars[1] || 'personagem B'}`, scenes: sceneKeys.slice(2, 3), notes: 'Vestido vermelho, longo', photos: [], status: 'pendente', capturedBy: 'seed', createdAt: new Date().toISOString() },
  { id: 'di3', department: 'props', name: 'Carta misteriosa', scenes: sceneKeys.slice(1, 3), notes: 'Envelope amarelado', photos: [], status: 'pendente', capturedBy: 'seed', createdAt: new Date().toISOString() },
  { id: 'di4', department: 'props', name: `Telemóvel ${chars[0] || 'protagonista'}`, scenes: sceneKeys.slice(0, 2), notes: 'iPhone preto', photos: [], status: 'pendente', capturedBy: 'seed', createdAt: new Date().toISOString() },
  { id: 'di5', department: 'art', name: 'Decoração sala', scenes: sceneKeys.slice(0, 2), notes: 'Estante livros, molduras', photos: [], status: 'pendente', capturedBy: 'seed', createdAt: new Date().toISOString() },
  { id: 'di6', department: 'makeup', name: `Cicatriz ${chars[0] || 'protagonista'}`, scenes: sceneKeys.slice(3, 5), notes: 'Silicone + pintura', photos: [], status: 'pendente', capturedBy: 'seed', createdAt: new Date().toISOString() },
  { id: 'di7', department: 'sfx', name: 'Fumo exterior', scenes: sceneKeys.slice(5, 6), notes: 'Máquina de fumo baixo', photos: [], status: 'pendente', capturedBy: 'seed', createdAt: new Date().toISOString() },
  { id: 'di8', department: 'vehicles', name: `Carro ${chars[0] || 'protagonista'}`, scenes: sceneKeys.slice(4, 6), notes: 'BMW preto', photos: [], status: 'pendente', capturedBy: 'seed', createdAt: new Date().toISOString() },
  { id: 'di9', department: 'camera', name: 'Drone abertura', scenes: sceneKeys.slice(0, 1), notes: 'DJI Inspire 3', photos: [], status: 'pendente', capturedBy: 'seed', createdAt: new Date().toISOString() },
  { id: 'di10', department: 'lighting', name: 'Setup noite ext', scenes: sceneKeys.slice(5, 7), notes: 'HMI 4kW + LED', photos: [], status: 'pendente', capturedBy: 'seed', createdAt: new Date().toISOString() },
]
console.log(`✓ Departamentos: ${state.departmentItems.length} items`)

// ── Write output ──
writeFileSync(OUT, JSON.stringify(state, null, 2))
console.log(`\n✅ Escrito: ${OUT}`)
console.log(`   ${(readFileSync(OUT).length / 1024).toFixed(1)} KB`)
