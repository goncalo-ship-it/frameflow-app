// Página de seed para desenvolvimento — carrega dados dummy no store
// Acesso: ?seed na URL
// Modo 1: drag & drop de ficheiros individuais (FDX, XLSX)
// Modo 2: botão "Seed Tudo" se o JSON gerado pelo script Node já existe em /seed-data.json

import { useState, useCallback, useRef } from 'react'
import { useStore } from '../core/store.js'
import { parseScript } from '../utils/script-parser.js'
import { parseFinancingExcel } from '../utils/financing-parser.js'
import { parseCallsheetExcel } from '../utils/callsheet-parser.js'
import { getXLSX } from '../core/xlsx-loader.js'
import { createEmptyBudget, createEmptyLine } from '../modules/budget/utils/budgetEngine.js'
import { toCents, nanoid } from '../modules/budget/utils/moneyUtils.js'
import { MARKUP_DEFAULTS, IVA_DEFAULT_POR_CATEGORIA } from '../modules/budget/utils/marketData.js'

// ── Category mapping from Excel categories to budget catIds ──
const BUDGET_CAT_MAP = {
  'ELENCO': 2,
  'EQUIPA': 3,
  'EQUIPAMENTO': 4,
  'CENOGRAFIA': 5,
  'CONSUMÍVEIS': 6,
  'TRANSPORTES': 7,
  'PÓS-PRODUÇÃO VÍDEO': 10,
  'PÓS-PRODUÇÃO ÁUDIO': 9,
}

function detectBudgetCat(text) {
  const u = (text || '').toUpperCase()
  for (const [pattern, catId] of Object.entries(BUDGET_CAT_MAP)) {
    if (u.includes(pattern)) return catId
  }
  return 12
}

export function DevSeed() {
  const [log, setLog] = useState([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  const addLog = useCallback((msg, type = 'info') => {
    setLog(prev => [...prev, { msg, type, ts: Date.now() }])
  }, [])

  // ── Process a single file ──
  const processFile = useCallback(async (file) => {
    const store = useStore.getState()
    const name = file.name.toLowerCase()
    const buf = await file.arrayBuffer()

    // FDX script
    if (name.endsWith('.fdx')) {
      const text = new TextDecoder().decode(buf)
      const parsed = parseScript(text, file.name)
      store.populateFromScript(parsed)
      addLog(`✓ Guião ${file.name}: ${parsed.scenes?.length || 0} cenas, ${parsed.metadata?.characters?.length || 0} personagens`, 'success')
      return 'fdx'
    }

    // Excel files — detect type by content/name
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      // Financing
      if (/financ|rtp_financ/i.test(name)) {
        const entries = await parseFinancingExcel(buf, file.name)
        const budgets = useStore.getState().budgets
        if (budgets.length > 0 && entries.length > 0) {
          store.updateBudget(budgets[0].id, {
            financing: [...(budgets[0].financing || []), ...entries],
          })
        }
        addLog(`✓ Financiamento: ${entries.length} fonte(s) — €${entries[0] ? (entries[0].valor / 100).toLocaleString('pt-PT') : '0'}`, 'success')
        return 'financing'
      }

      // Callsheet / Folha de Serviço
      if (/folha|servico|callsheet/i.test(name)) {
        const cs = await parseCallsheetExcel(buf, file.name)
        const existingNames = new Set(useStore.getState().team.map(m => m.name?.toUpperCase()))
        let crewAdded = 0
        for (const member of cs.crew) {
          if (!existingNames.has(member.name.toUpperCase())) {
            store.addMember({
              id: member.id, name: member.name, role: member.role,
              group: member.group, phone: '', email: '', photo: null,
              notes: 'Importado da folha de serviço', availability: 'available',
            })
            existingNames.add(member.name.toUpperCase())
            crewAdded++
          }
        }
        const existingLocs = new Set(useStore.getState().locations.map(l => l.name?.toUpperCase()))
        let locsAdded = 0
        for (const loc of cs.locations) {
          if (!existingLocs.has(loc.name.toUpperCase())) {
            store.addLocation({
              id: loc.id, name: loc.name, address: loc.address,
              status: 'pendente', notes: [loc.decors?.join(', '), loc.notes].filter(Boolean).join(' — '),
              mapsLink: loc.mapsLink, photos: [],
            })
            existingLocs.add(loc.name.toUpperCase())
            locsAdded++
          }
        }
        addLog(`✓ Folha de Serviço: ${crewAdded} membros, ${locsAdded} locais`, 'success')
        if (cs.callTimes && Object.keys(cs.callTimes).length > 0) {
          addLog(`  Call times: ${Object.entries(cs.callTimes).map(([d,t]) => `${d}=${t}`).join(', ')}`, 'info')
        }
        return 'callsheet'
      }

      // Budget (default for other xlsx)
      return await importBudgetExcel(buf, file.name, store, addLog)
    }

    // JSON state import
    if (name.endsWith('.json')) {
      const text = new TextDecoder().decode(buf)
      const data = JSON.parse(text)
      importStateJSON(data, store, addLog)
      return 'json'
    }

    addLog(`⚠ Tipo não reconhecido: ${file.name}`, 'warn')
    return null
  }, [addLog])

  // ── Handle dropped/selected files ──
  const handleFiles = useCallback(async (files) => {
    setRunning(true)
    // Sort: FDX first, then budget xlsx, then financing, then callsheet
    const sorted = [...files].sort((a, b) => {
      const order = f => {
        const n = f.name.toLowerCase()
        if (n.endsWith('.fdx')) return 0
        if (/or\d|budget|orcamento/i.test(n)) return 1
        if (/financ/i.test(n)) return 2
        if (/folha|callsheet/i.test(n)) return 3
        return 4
      }
      return order(a) - order(b)
    })

    for (const file of sorted) {
      try {
        await processFile(file)
      } catch (e) {
        addLog(`✗ Erro em ${file.name}: ${e.message}`, 'error')
      }
    }

    // After all files, generate shooting days + dept items
    await generateShootingDays(addLog)
    await generateDeptItems(addLog)

    addLog('Seed completo!', 'success')
    setDone(true)
    setRunning(false)
  }, [processFile, addLog])

  // ── Try loading pre-generated seed-data.json ──
  const loadPreGenerated = useCallback(async () => {
    setRunning(true)
    try {
      const resp = await fetch('/seed-data.json')
      if (!resp.ok) throw new Error('seed-data.json não encontrado em /public/')
      const data = await resp.json()
      importStateJSON(data, useStore.getState(), addLog)
      addLog('Seed completo via seed-data.json!', 'success')
      setDone(true)
    } catch (e) {
      addLog(`✗ ${e.message}`, 'error')
      addLog('Use drag & drop para importar os ficheiros manualmente.', 'info')
    }
    setRunning(false)
  }, [addLog])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div style={{
      maxWidth: 700, margin: '40px auto', padding: '32px',
      fontFamily: 'var(--font-body, system-ui)', color: 'var(--text-primary, #fff)',
      background: 'var(--bg-surface, #3C424C)', borderRadius: 16,
      border: '1px solid var(--border-subtle, #333)',
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        DevSeed — Povoar Base Dummy
      </h1>
      <p style={{ color: 'var(--text-muted, #888)', fontSize: 14, marginBottom: 24 }}>
        Arrasta os ficheiros dummy (FDX, XLSX) ou usa o botão abaixo.
      </p>

      {!running && !done && (
        <>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent, #E8A838)' : 'var(--border-subtle, #444)'}`,
              borderRadius: 12, padding: '40px 20px', textAlign: 'center',
              cursor: 'pointer', marginBottom: 16,
              background: dragOver ? 'rgba(232,168,56,0.1)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary, #aaa)' }}>
              Arrasta ficheiros aqui ou clica para seleccionar
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted, #666)', marginTop: 4 }}>
              Suporta: .fdx (guiões), .xlsx (orçamento, financiamento, folha de serviço), .json (estado)
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".fdx,.xlsx,.xls,.json"
              style={{ display: 'none' }}
              onChange={e => e.target.files.length && handleFiles(e.target.files)}
            />
          </div>

          {/* Pre-generated seed button */}
          <button
            onClick={loadPreGenerated}
            style={{
              padding: '10px 24px', fontSize: 14, fontWeight: 600,
              background: 'transparent', color: 'var(--text-muted, #888)',
              border: '1px solid var(--border-subtle, #444)', borderRadius: 8,
              cursor: 'pointer', width: '100%',
            }}
          >
            Carregar seed-data.json (gerado pelo script Node)
          </button>
        </>
      )}

      {done && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => window.location.href = window.location.pathname + '?admin'}
            style={{
              padding: '12px 32px', fontSize: 16, fontWeight: 700,
              background: 'var(--health-green, #10b981)', color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer', flex: 1,
            }}
          >
            Entrar na App
          </button>
          <button
            onClick={() => {
              const json = exportStoreJSON()
              if (!json) return
              const blob = new Blob([json], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'seed-data.json'; a.click()
              URL.revokeObjectURL(url)
              addLog('JSON exportado!', 'success')
            }}
            style={{
              padding: '12px 24px', fontSize: 14, fontWeight: 600,
              background: 'var(--bg-elevated, #2a2a4e)', color: 'var(--text-primary, #fff)',
              border: '1px solid var(--border-subtle, #444)', borderRadius: 8, cursor: 'pointer',
            }}
          >
            Exportar JSON
          </button>
        </div>
      )}

      {/* Log */}
      <div style={{
        background: 'var(--bg-base, #0f0f23)', borderRadius: 8,
        padding: 16, maxHeight: 400, overflowY: 'auto',
        fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6,
        marginTop: 16,
      }}>
        {log.length === 0 && (
          <span style={{ color: 'var(--text-muted, #666)' }}>Pronto para semear…</span>
        )}
        {log.map((entry, i) => (
          <div key={i} style={{
            color: entry.type === 'error' ? '#ef4444'
              : entry.type === 'success' ? '#10b981'
              : entry.type === 'warn' ? '#f59e0b'
              : 'var(--text-secondary, #aaa)',
          }}>
            {entry.msg}
          </div>
        ))}
        {running && (
          <div style={{ color: 'var(--accent, #E8A838)', marginTop: 8 }}>
            A processar…
          </div>
        )}
      </div>
    </div>
  )
}

// ── Import budget Excel ──
async function importBudgetExcel(buf, filename, store, addLog) {
  const XLSX = await getXLSX()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  const budget = createEmptyBudget()
  budget.header.campanha = 'DESDOBRADO — 6 Episódios'
  budget.header.descricao = 'Orçamento de produção para série de ficção, 6 episódios'
  budget.header.diasRodagem = 18
  budget.header.local = 'Lisboa / Jamor'
  budget.mode = 'fiction'
  budget.status = 'approved'

  let currentCatId = 12
  let totalImported = 0

  for (const row of rows) {
    const v0 = String(row[0] || '').trim()
    if (!v0) continue
    if (/^(sub-?total|total|valor|descrição)/i.test(v0)) continue

    const totalVal = Number(row[4]) || 0
    const isHeader = v0 === v0.toUpperCase() && v0.length > 3 && /[A-ZÁÀÃÉÍÓÚ]/.test(v0)

    if (isHeader && totalVal === 0) {
      currentCatId = detectBudgetCat(v0)
    } else if (totalVal > 0) {
      const line = createEmptyLine(currentCatId)
      line.descricao = v0.replace(/\s+/g, ' ')
      line.valorUnitario = toCents(Number(row[1]) || 0)
      line.quantidade = Number(row[2]) || 1
      line.dias = Number(row[3]) || 1
      line.custoReal = toCents(totalVal)
      line.markup = MARKUP_DEFAULTS.default
      line.taxaIva = IVA_DEFAULT_POR_CATEGORIA[currentCatId] || 0.23
      line.origem = 'import'
      budget.lines.push(line)
      totalImported++
    }
  }

  store.addBudget(budget)
  addLog(`✓ Orçamento: ${totalImported} linhas em ${new Set(budget.lines.map(l => l.categoria)).size} categorias`, 'success')
  return 'budget'
}

// ── Generate shooting days from parsed scripts ──
async function generateShootingDays(addLog) {
  const store = useStore.getState()
  const scripts = store.parsedScripts || {}
  const allScenes = []
  for (const [epId, parsed] of Object.entries(scripts)) {
    for (const sc of (parsed.scenes || [])) {
      allScenes.push({ ...sc, episode: epId })
    }
  }

  if (allScenes.length === 0) {
    addLog('⚠ Sem cenas — dias de rodagem não criados', 'warn')
    return
  }
  if (store.shootingDays.length > 0) {
    addLog('⚠ Dias de rodagem já existem — ignorando', 'warn')
    return
  }

  const episodeIds = [...new Set(allScenes.map(s => s.episode))].sort()
  const daysPerEp = 3
  let dayNum = 0

  for (const epId of episodeIds) {
    const epScenes = allScenes.filter(s => s.episode === epId)
    const scenesPerDay = Math.ceil(epScenes.length / daysPerEp)

    for (let d = 0; d < daysPerEp; d++) {
      dayNum++
      const dayScenes = epScenes.slice(d * scenesPerDay, (d + 1) * scenesPerDay)
      if (dayScenes.length === 0) continue

      const dayId = `day_${nanoid()}`
      const dayDate = new Date()
      dayDate.setDate(dayDate.getDate() + 7 + dayNum - 1)
      while (dayDate.getDay() === 0 || dayDate.getDay() === 6) {
        dayDate.setDate(dayDate.getDate() + 1)
      }

      store.addShootingDay({
        id: dayId,
        date: dayDate.toISOString().split('T')[0],
        dayNumber: dayNum,
        episodeNumber: parseInt(epId.replace(/\D/g, '')) || 1,
        dayInEpisode: d + 1,
        location: dayScenes[0]?.location || '',
        callTime: '07:30',
        status: 'planned',
        notes: `Dia ${dayNum} — ${epId}`,
      })

      for (const sc of dayScenes) {
        const sceneKey = `${sc.episode}-${sc.sceneNumber || sc.id}`
        store.assignScene(sceneKey, dayId)
      }
    }
  }

  addLog(`✓ Rodagem: ${dayNum} dias criados, ${allScenes.length} cenas atribuídas`, 'success')
}

// ── Generate department items ──
async function generateDeptItems(addLog) {
  const store = useStore.getState()
  if (store.departmentItems.length > 0) {
    addLog('⚠ Items de departamento já existem — ignorando', 'warn')
    return
  }

  const scripts = store.parsedScripts || {}
  const chars = Object.values(scripts).flatMap(p => (p.metadata?.characters || []).map(c => c.name)).slice(0, 3)
  const scenes = Object.entries(scripts).flatMap(([ep, p]) => (p.scenes || []).map(s => `${ep}-${s.sceneNumber || s.id}`))

  const items = [
    { department: 'wardrobe', name: `Fato principal ${chars[0] || 'Protagonista'}`, scenes: scenes.slice(0, 2), notes: 'Fato cinzento, gravata azul' },
    { department: 'wardrobe', name: `Vestido festa ${chars[1] || 'Personagem B'}`, scenes: scenes.slice(2, 3), notes: 'Vermelho, longo' },
    { department: 'props', name: 'Carta misteriosa', scenes: scenes.slice(1, 3), notes: 'Envelope amarelado, selo antigo' },
    { department: 'props', name: `Telemóvel ${chars[0] || 'protagonista'}`, scenes: scenes.slice(0, 2), notes: 'iPhone preto, ecrã partido' },
    { department: 'art', name: 'Decoração sala estar', scenes: scenes.slice(0, 2), notes: 'Estante com livros, molduras família' },
    { department: 'makeup', name: `Cicatriz ${chars[0] || 'protagonista'}`, scenes: scenes.slice(3, 5), notes: 'Cicatriz no queixo, silicone + pintura' },
    { department: 'sfx', name: 'Fumo exterior', scenes: scenes.slice(5, 6), notes: 'Máquina de fumo baixo' },
    { department: 'vehicles', name: `Carro ${chars[0] || 'protagonista'}`, scenes: scenes.slice(4, 6), notes: 'BMW série 3 preto, matrícula falsa' },
    { department: 'camera', name: 'Drone shot abertura', scenes: scenes.slice(0, 1), notes: 'DJI Inspire 3, plano 30s, golden hour' },
    { department: 'lighting', name: 'Setup noite exterior', scenes: scenes.slice(5, 7), notes: 'HMI 4kW + LED panels warm' },
  ]

  for (const item of items) {
    store.addDepartmentItem({
      department: item.department,
      name: item.name,
      scenes: item.scenes,
      notes: item.notes,
      photos: [],
      status: 'pendente',
      capturedBy: 'seed',
    })
  }
  addLog(`✓ Departamentos: ${items.length} items criados`, 'success')
}

// ── Import full state JSON ──
function importStateJSON(data, store, addLog) {
  const state = data.state || data
  let count = 0

  if (state.team?.length) {
    for (const m of state.team) store.addMember(m)
    count += state.team.length
    addLog(`✓ Equipa: ${state.team.length} membros`, 'success')
  }
  if (state.locations?.length) {
    for (const l of state.locations) store.addLocation(l)
    addLog(`✓ Locais: ${state.locations.length}`, 'success')
  }
  if (state.budgets?.length) {
    for (const b of state.budgets) store.addBudget(b)
    addLog(`✓ Orçamentos: ${state.budgets.length}`, 'success')
  }
  if (state.shootingDays?.length) {
    for (const d of state.shootingDays) store.addShootingDay(d)
    addLog(`✓ Dias de rodagem: ${state.shootingDays.length}`, 'success')
  }
  if (state.departmentItems?.length) {
    for (const i of state.departmentItems) store.addDepartmentItem(i)
    addLog(`✓ Dept items: ${state.departmentItems.length}`, 'success')
  }
  if (state.parsedScripts && Object.keys(state.parsedScripts).length) {
    for (const [ep, parsed] of Object.entries(state.parsedScripts)) {
      store.populateFromScript(parsed)
    }
    addLog(`✓ Guiões: ${Object.keys(state.parsedScripts).length} episódios`, 'success')
  }

  addLog(`Total: ${count}+ entidades importadas`, 'success')
}

// ── Export store JSON ──
export function exportStoreJSON() {
  const raw = localStorage.getItem('frame-v1')
  if (!raw) return null
  const parsed = JSON.parse(raw)
  return JSON.stringify(parsed.state || parsed, null, 2)
}
