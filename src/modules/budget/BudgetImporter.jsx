// BudgetImporter — importação de orçamento via ficheiro ou texto
// Segue o mesmo padrão do TeamImporter (overlay → panel, fases: input/loading/preview/done)

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  X, Upload, Loader, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, FileText,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { fetchAPI } from '../../core/api.js'
import { toCents } from './utils/moneyUtils.js'
import { CATEGORIAS, MARKUP_DEFAULTS, IVA_DEFAULT_POR_CATEGORIA } from './utils/marketData.js'
import { getXLSX } from '../../core/xlsx-loader.js'
import styles from '../team/TeamImporter.module.css'

// ── Mapeamento de texto → categoria ──────────────────────────────────
// ORDEM IMPORTA: patterns mais específicos primeiro (ex: "EQUIPAMENTO" antes de "CÂMARA")
const CAT_MAP = [
  { patterns: ['PRÉ-PRODUÇÃO', 'PRE-PROD', 'PREPARAÇÃO'],                        catId: 1 },
  { patterns: ['ELENCO', 'ATOR', 'ACTRIZ', 'CASTING'],                           catId: 2 },
  { patterns: ['EQUIPAMENTO', 'EQUIP. CÂMARA', 'EQUIP. LUZ', 'EQUIP. SOM'],     catId: 4 },
  { patterns: ['EQUIPA', 'TÉCNICA', 'CREW'],                                     catId: 3 },
  { patterns: ['CENOGRAF', 'FIGURIN', 'ARTE', 'GUARDA-ROUPA'],                   catId: 5 },
  { patterns: ['CONSUMÍV', 'ESTÚDIO', 'DÉCOR', 'LOCAIS', 'LOCAÇÕES'],            catId: 6 },
  { patterns: ['TRANSPORT', 'HOTEL', 'HÓTEI', 'REFEIÇÃO', 'CATERING'],           catId: 7 },
  { patterns: ['OFFLINE', 'MONTAGEM'],                                            catId: 8 },
  { patterns: ['PÓS-PRODUÇÃO ÁUDIO', 'PÓS-PRODUÇÃO SOM', 'PÓS ÁUDIO'],          catId: 9 },
  { patterns: ['PÓS-PRODUÇÃO VÍDEO', 'PÓS-PRODUÇÃO IMAGEM', 'VFX', 'GRADING'],  catId: 10 },
  { patterns: ['PÓS-PRODUÇÃO FOTO', 'FOTOGRAFIA PÓS'],                           catId: 11 },
  { patterns: ['SEGURO', 'DIVERSOS', 'CONTINGÊNCIA'],                             catId: 12 },
]

function detectCatId(text) {
  const u = (text || '').toUpperCase()
  for (const { patterns, catId } of CAT_MAP) {
    if (patterns.some(p => u.includes(p))) return catId
  }
  return 12
}

// ── Detectar mapeamento de colunas a partir de header row ────────────
const COL_PATTERNS = {
  valorUnit: /val(?:or)?\.?\s*unit|unit\s*price|preço\s*unit|custo\s*unit/i,
  qty:       /^n\.?º$|^qt\.?d?e?$|^quant|^nº$|^un(?:id)?\.?$/i,
  dias:      /^semana|^dias?$|^meses?$|^dur|^period|^week|^day|^month/i,
  total:     /^total$|^valor$|^sub-?total$/i,
}

function detectColumns(headerRow) {
  const map = { valorUnit: -1, qty: -1, dias: -1, total: -1 }
  for (let i = 1; i < headerRow.length; i++) {
    const h = String(headerRow[i] || '').trim()
    if (!h) continue
    for (const [key, re] of Object.entries(COL_PATTERNS)) {
      if (map[key] === -1 && re.test(h)) { map[key] = i; break }
    }
  }
  return map
}

// ── Parser Excel (sem API) ────────────────────────────────────────────
function parseExcel(arrayBuffer, XLSX) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })

  let sheetName = wb.SheetNames[0]
  for (const name of wb.SheetNames) {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name])
    if (csv.includes('ORÇAMENTO') || csv.includes('ORCAMENTO') || csv.includes('BUDGET')) {
      sheetName = name; break
    }
  }

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })
  const cats = {}
  let currentCatId = 12
  // Default column map (fallback): desc=0, valorUnit=1, qty=2, dias=3, total=4
  let colMap = { valorUnit: 1, qty: 2, dias: 3, total: 4 }

  for (const row of rows) {
    const v0 = String(row[0] || '').trim()
    if (!v0) continue
    if (v0.match(/^(sub-?total|total|valor\s+por)/i)) continue

    // Detect header rows like "Descrição | Valor Unit. | N.º | Semana | Total"
    if (v0.match(/^(descrição|description|item)/i)) {
      const detected = detectColumns(row)
      // Only override if we found at least the total column
      if (detected.total !== -1) colMap = { ...colMap, ...Object.fromEntries(Object.entries(detected).filter(([,v]) => v !== -1)) }
      continue
    }

    // Find the total value using mapped column
    const totalCol = colMap.total
    const totalVal = totalCol >= 0 ? Number(row[totalCol]) : 0
    const isHeader = v0 === v0.toUpperCase() && v0.length > 3 && /[A-ZÁÀÃÉÍÓÚ]/.test(v0)
    const hasValue = totalVal > 0

    if (isHeader && !hasValue) {
      currentCatId = detectCatId(v0)
      if (!cats[currentCatId]) {
        cats[currentCatId] = { catId: currentCatId, catName: v0.trim(), lines: [] }
      }
    } else if (hasValue && v0) {
      if (!cats[currentCatId]) {
        const cat = CATEGORIAS.find(c => c.id === currentCatId)
        cats[currentCatId] = { catId: currentCatId, catName: cat?.label || 'Diversos', lines: [] }
      }
      const valorUnit = colMap.valorUnit >= 0 ? Number(row[colMap.valorUnit]) || 0 : 0
      const qty       = colMap.qty >= 0       ? Number(row[colMap.qty]) || 1       : 1
      const dias      = colMap.dias >= 0      ? Number(row[colMap.dias]) || 1      : 1

      cats[currentCatId].lines.push({
        description: v0.replace(/\s+/g, ' '),
        estimado: totalVal,
        valorUnit,
        qty,
        dias,
      })
    }
  }

  return Object.values(cats).filter(c => c.lines.length > 0).sort((a, b) => a.catId - b.catId)
}

// ── Extracção via API (Word, PDF, texto, etc.) ────────────────────────
async function extractViaAPI(text, fname, apiKey) {
  const catList = CATEGORIAS.filter(c => c.id <= 12).map(c => `${c.id}. ${c.label}`).join('\n')
  const response = await fetchAPI({
    apiKey,
    messages: [{ role: 'user', content: `Analisa este documento de orçamento audiovisual e extrai as linhas.\n\nDOCUMENTO (${fname}):\n"""\n${text.slice(0, 12000)}\n"""\n\nCATEGORIAS:\n${catList}\n\nResponde APENAS com JSON:\n{"linhas":[{"categoria":3,"descricao":"Realizador","valorEuros":1200,"quantidade":1,"dias":10}]}` }],
    maxTokens: 2000,
    cache: true,
  })
  const match = response.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Não foi possível extrair dados do documento')
  let data
  try { data = JSON.parse(match[0]) } catch { throw new Error('JSON inválido na resposta da API') }

  const cats = {}
  for (const line of (data.linhas || [])) {
    const catId = Math.max(1, Math.min(12, line.categoria || 12))
    if (!cats[catId]) {
      const cat = CATEGORIAS.find(c => c.id === catId)
      cats[catId] = { catId, catName: cat?.label || 'Diversos', lines: [] }
    }
    if (line.descricao && line.valorEuros > 0) {
      cats[catId].lines.push({
        description: line.descricao,
        estimado: line.valorEuros || 0,
        qty: line.quantidade || 1,
        dias: line.dias || 1,
      })
    }
  }
  return Object.values(cats).filter(c => c.lines.length > 0).sort((a, b) => a.catId - b.catId)
}

// ── Extracção PDF via API (base64 document block) ───────────────────
async function extractPDFViaAPI(base64, fname, apiKey) {
  const catList = CATEGORIAS.filter(c => c.id <= 12).map(c => `${c.id}. ${c.label}`).join('\n')
  const response = await fetchAPI({
    apiKey,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        },
        {
          type: 'text',
          text: `Analisa este documento de orçamento audiovisual e extrai as linhas.\n\nCATEGORIAS:\n${catList}\n\nResponde APENAS com JSON:\n{"linhas":[{"categoria":3,"descricao":"Realizador","valorEuros":1200,"quantidade":1,"dias":10}]}`
        }
      ]
    }],
    maxTokens: 2000,
    beta: 'pdfs-2024-09-25',
    cache: true,
  })
  const match = response.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Não foi possível extrair dados do PDF')
  let data
  try { data = JSON.parse(match[0]) } catch { throw new Error('JSON inválido na resposta da API') }

  const cats = {}
  for (const line of (data.linhas || [])) {
    const catId = Math.max(1, Math.min(12, line.categoria || 12))
    if (!cats[catId]) {
      const cat = CATEGORIAS.find(c => c.id === catId)
      cats[catId] = { catId, catName: cat?.label || 'Diversos', lines: [] }
    }
    if (line.descricao && line.valorEuros > 0) {
      cats[catId].lines.push({
        description: line.descricao,
        estimado: line.valorEuros || 0,
        qty: line.quantidade || 1,
        dias: line.dias || 1,
      })
    }
  }
  return Object.values(cats).filter(c => c.lines.length > 0).sort((a, b) => a.catId - b.catId)
}

const ACCEPT = '.xlsx,.xls,.docx,.doc,.txt,.csv,.eml,.pdf,.rtf,.md'

// ── Componente principal ──────────────────────────────────────────────
export function BudgetImporter({ onClose, onAddLine, onAddLines, onUpdateLine }) {
  const {  apiKey, addMember, team  } = useStore(useShallow(s => ({ apiKey: s.apiKey, addMember: s.addMember, team: s.team })))

  const [files, setFiles]         = useState([])
  const [pastedText, setPasted]   = useState('')
  const [dragging, setDragging]   = useState(false)
  const [phase, setPhase]         = useState('input')   // input | loading | preview | populating | done
  const [categories, setCategories] = useState([])
  const [expandedCat, setExpanded]  = useState(null)
  const [error, setError]           = useState('')
  const [importedCount, setImportedCount] = useState(0)
  const [populateResult, setPopulateResult] = useState(null)
  const [autoTeam, setAutoTeam] = useState(true)
  const fileRef = useRef(null)

  const addFiles = (newFiles) => {
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...newFiles.filter(f => !names.has(f.name))]
    })
  }

  const handleExtract = async () => {
    if (files.length === 0 && !pastedText.trim()) {
      setError('Adiciona um ficheiro ou cola texto.')
      return
    }
    setError('')
    setPhase('loading')

    try {
      let cats = []
      const file = files[0]

      if (file) {
        const ext = file.name.split('.').pop().toLowerCase()
        if (ext === 'xlsx' || ext === 'xls') {
          const XLSX = await getXLSX()
          cats = parseExcel(await file.arrayBuffer(), XLSX)
        } else if (ext === 'pdf') {
          if (!apiKey) throw new Error('Chave API necessária para PDF. Adiciona-a nas Definições.')
          const buf = await file.arrayBuffer()
          const bytes = new Uint8Array(buf)
          let binary = ''
          const chunkSize = 8192
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
          }
          const base64 = btoa(binary)
          cats = await extractPDFViaAPI(base64, file.name, apiKey)
        } else {
          if (!apiKey) throw new Error('Chave API necessária para este formato. Adiciona-a nas Definições.')
          let text = ''
          if (ext === 'docx') {
            const mammoth = await import('mammoth')
            const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
            text = result.value
          } else {
            text = await file.text()
          }
          cats = await extractViaAPI(text, file.name, apiKey)
        }
      } else {
        if (!apiKey) throw new Error('Chave API necessária. Adiciona-a nas Definições.')
        cats = await extractViaAPI(pastedText, 'texto colado', apiKey)
      }

      if (cats.length === 0) throw new Error('Não foram encontradas linhas de orçamento.')

      setCategories(cats)
      setExpanded(cats[0]?.catId ?? null)
      setPhase('preview')
    } catch (err) {
      setError(err.message || 'Erro desconhecido')
      setPhase('input')
    }
  }

  // Mapeamento catId → grupo de equipa
  const CAT_TO_GROUP = {
    2: 'Elenco',
    3: 'Produção', // default, refinado abaixo por keyword
  }
  const ROLE_GROUP_MAP = [
    { kw: ['realizador','1º ad','2º ad','assistente real','anotador','script'], group: 'Realização' },
    { kw: ['fotografia','câmara','operador de câm','foquista','dit','steadicam'], group: 'Imagem' },
    { kw: ['iluminad','electrici','gaffer','maquinist','grip','gerador'], group: 'Electricidade' },
    { kw: ['som','perchist','boom','áudio'], group: 'Som' },
    { kw: ['arte','cenograf','figurin','guarda-roupa','makeup','cabelo','maquilh','aderecist','caracteriza'], group: 'Arte' },
    { kw: ['montagm','editor','montador','colorist','vfx','grading','pós-prod','offline','grafism'], group: 'Pós-Produção' },
    { kw: ['driver','motorist','catering','limpeza','segurança'], group: 'Logística' },
    { kw: ['elenco','actor','atriz','figuração','figurant'], group: 'Elenco' },
  ]

  function guessGroup(desc, catId) {
    if (catId === 2) return 'Elenco'
    const d = (desc || '').toLowerCase()
    for (const { kw, group } of ROLE_GROUP_MAP) {
      if (kw.some(k => d.includes(k))) return group
    }
    return 'Produção'
  }

  const handleConfirm = async () => {
    const allLines = []
    for (const cat of categories) {
      for (const line of cat.lines) {
        const qty = line.qty || 1
        const dias = line.dias || 1
        const valorUnitario = line.valorUnit
          ? toCents(line.valorUnit)
          : toCents((line.estimado || 0) / (qty * dias))
        const markup = MARKUP_DEFAULTS.default
        allLines.push({
          categoria: cat.catId,
          descricao: line.description,
          valorUnitario,
          quantidade: qty,
          dias,
          custoReal: Math.round(valorUnitario * qty * dias / markup),
          markup,
          taxaIva: IVA_DEFAULT_POR_CATEGORIA[cat.catId] || 0.23,
          origem: 'import',
        })
      }
    }
    if (onAddLines) {
      onAddLines(allLines)
    } else {
      allLines.forEach(l => onAddLine(l))
    }
    setImportedCount(allLines.length)

    // Auto-populate team from cat 2 (Elenco) + cat 3 (Equipa) — no API needed
    if (autoTeam) {
      const teamLines = allLines.filter(l => l.categoria === 2 || l.categoria === 3)
      const existingNames = new Set(team.map(m => (m.name || '').toLowerCase()))
      let added = 0
      for (const l of teamLines) {
        const name = l.descricao
        if (!name || existingNames.has(name.toLowerCase())) continue
        existingNames.add(name.toLowerCase())
        const cacheDiario = l.valorUnitario ? l.valorUnitario : 0 // já em cêntimos
        addMember({
          id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name,
          role: name,
          group: guessGroup(name, l.categoria),
          cacheDiario,
          cacheTotal: 0,
          nif: '', iban: '',
          confirmedDays: [],
          origem: 'budget-import',
        })
        added++
      }
      setPopulateResult({ team: added })
    }

    setPhase('done')
    setTimeout(onClose, 2500)
  }

  const fmt = (n) => '€\u00A0' + Number(n || 0).toLocaleString('pt-PT', { maximumFractionDigits: 0 })
  const total = categories.reduce((s, c) => s + c.lines.reduce((cs, l) => cs + (l.estimado || 0), 0), 0)
  const lineCount = categories.reduce((s, c) => s + c.lines.length, 0)

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className={styles.panel}
        style={{ maxWidth: 700 }}
        initial={{ y: 32, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 16, scale: 0.98, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Cabeçalho */}
        <div className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle}>Importar Orçamento</h3>
            <p className={styles.panelSub}>
              {phase === 'input'   && 'Excel, Word, PDF, texto — extracção automática de linhas'}
              {phase === 'loading' && 'A analisar o documento…'}
              {phase === 'preview' && `${lineCount} linhas encontradas · Total ${fmt(total)}`}
              {phase === 'done'    && 'Importação concluída!'}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
        </div>

        {/* Corpo */}
        <div className={styles.panelBody}>

          {/* ── INPUT ── */}
          {phase === 'input' && (
            <div className={styles.inputPhase}>
              <div
                className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); addFiles([...e.dataTransfer.files]) }}
                onClick={() => fileRef.current?.click()}
                data-local-drop="true"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT}
                  style={{ display: 'none' }}
                  onChange={e => e.target.files[0] && addFiles([...e.target.files])}
                />
                <Upload size={32} style={{ color: dragging ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 8 }}/>
                <p className={styles.dropTitle}>{dragging ? 'Larga aqui' : 'Arrasta o ficheiro ou clica para escolher'}</p>
                <p className={styles.dropSub}>Excel (sem API) · Word · PDF · CSV · TXT · Email</p>
              </div>

              {files.length > 0 && (
                <div className={styles.fileList}>
                  {files.map((f, i) => (
                    <div key={i} className={styles.fileItem}>
                      <span className={styles.fileIcon}><FileText size={16}/></span>
                      <span className={styles.fileLabel}>{f.name} · {(f.size/1024).toFixed(0)}KB</span>
                      <button className={styles.fileRemove} onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.divider}><span>ou cola texto directamente</span></div>

              <textarea
                className={styles.pasteArea}
                placeholder={'Cola aqui o orçamento em texto, tabela, email…\n\nExemplo:\nREALIZAÇÃO\nRealizador  1 pessoa  10 dias  1.200€/dia  12.000€\nAssist. Realização  1  10 dias  600€/dia  6.000€'}
                value={pastedText}
                onChange={e => setPasted(e.target.value)}
                rows={6}
              />

              {error && <div className={styles.errorMsg}><AlertCircle size={14}/> {error}</div>}
            </div>
          )}

          {/* ── LOADING ── */}
          {phase === 'loading' && (
            <div className={styles.loadingPhase}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                <Loader size={36} style={{ color: 'var(--accent)' }}/>
              </motion.div>
              <p className={styles.loadingText}>
                {files[0]?.name.match(/\.xlsx?$/i) ? 'A analisar Excel…' : 'A extrair linhas via IA…'}
              </p>
              <p className={styles.loadingHint}>Este processo demora 5–15 segundos</p>
            </div>
          )}

          {/* ── PREVIEW ── */}
          {phase === 'preview' && (
            <div className={styles.previewPhase}>
              {categories.map(cat => {
                const catTotal = cat.lines.reduce((s, l) => s + (l.estimado || 0), 0)
                const isOpen = expandedCat === cat.catId
                return (
                  <div key={cat.catId} className={styles.previewCard}>
                    <button
                      style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', color: 'var(--text-primary)' }}
                      onClick={() => setExpanded(isOpen ? null : cat.catId)}
                    >
                      <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 600, textAlign: 'left' }}>{cat.catName}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginRight: 4 }}>{cat.lines.length} linhas</span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent)', minWidth: 80, textAlign: 'right' }}>{fmt(catTotal)}</span>
                      {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>
                    {isOpen && (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {cat.lines.map((line, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: 'var(--bg-base)', borderRadius: 6 }}>
                            <span style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{line.description}</span>
                            {(line.valorUnit > 0 || line.qty > 1 || line.dias > 1) && (
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                {line.valorUnit > 0 ? `${fmt(line.valorUnit)}` : ''}{line.qty > 1 ? ` ×${line.qty}` : ''}{line.dias > 1 ? ` ×${line.dias}d` : ''}
                              </span>
                            )}
                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(line.estimado)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── DONE ── */}
          {phase === 'done' && (
            <div className={styles.loadingPhase}>
              <CheckCircle size={40} style={{ color: 'var(--health-green)' }}/>
              <p className={styles.loadingText}>{importedCount} linha{importedCount !== 1 ? 's' : ''} adicionada{importedCount !== 1 ? 's' : ''} ao orçamento!</p>
              {populateResult?.team > 0 && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', background: 'var(--accent-light)', padding: '4px 10px', borderRadius: 12, marginTop: 8 }}>
                  +{populateResult.team} na Equipa
                </span>
              )}
            </div>
          )}

        </div>

        {/* Rodapé */}
        {(phase === 'input' || phase === 'preview') && (
          <div className={styles.panelFooter}>
            {phase === 'input' && (
              <>
                <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
                <button
                  className={styles.btnExtract}
                  onClick={handleExtract}
                  disabled={files.length === 0 && !pastedText.trim()}
                >
                  <Upload size={14}/> Analisar e extrair linhas
                </button>
              </>
            )}
            {phase === 'preview' && (
              <>
                <button className={styles.btnCancel} onClick={() => { setCategories([]); setPhase('input') }}>← Voltar</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={autoTeam} onChange={e => setAutoTeam(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                  Auto Equipa
                </label>
                <span className={styles.countLabel}>{lineCount} linhas · {fmt(total)}</span>
                <button className={styles.btnExtract} onClick={handleConfirm}>
                  <CheckCircle size={14}/> Importar para orçamento
                </button>
              </>
            )}
          </div>
        )}

      </motion.div>
    </motion.div>
  )
}
