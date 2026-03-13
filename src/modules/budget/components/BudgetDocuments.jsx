// BudgetDocuments — repositório de documentos financeiros
// Contratos, facturas, recibos, propostas, etc.

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, File, Music, Trash2, X,
  ChevronDown, ChevronUp, Search, Tag, FolderOpen,
} from 'lucide-react'
import { useStore } from '../../../core/store.js'

// ── Extractors ──────────────────────────────────────────────────
const extractDocx = async (buf) => {
  try {
    const mammoth = await import('mammoth')
    return (await mammoth.extractRawText({ arrayBuffer: buf })).value
  } catch { return '[docx: instalar mammoth para extrair texto]' }
}

const extractXlsx = async (buf) => {
  try {
    const XLSX = await (await import('../../../core/xlsx-loader.js')).getXLSX()
    const wb = XLSX.read(buf, { type: 'array' })
    return wb.SheetNames.map(n => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n\n')
  } catch { return '[xlsx: instalar xlsx para extrair texto]' }
}

// ── Helpers ──────────────────────────────────────────────────────
const TEXT_EXTS = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.eml']
const SHEET_EXTS = ['.xlsx', '.xls']

function genId() { return `fd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
function getExt(name) { const m = name.match(/\.[^.]+$/); return m ? m[0].toLowerCase() : '' }

function fileTypeFromExt(ext) {
  if (TEXT_EXTS.includes(ext)) return 'text'
  if (ext === '.docx') return 'docx'
  if (ext === '.pdf') return 'pdf'
  if (SHEET_EXTS.includes(ext)) return 'spreadsheet'
  return 'other'
}

function relativeDate(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'há 1 dia'
  if (days < 30) return `há ${days} dias`
  return `há ${Math.floor(days / 30)} meses`
}

const CATEGORIES = [
  { value: '', label: 'Sem categoria' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'factura', label: 'Factura' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'orcamento-ext', label: 'Orçamento externo' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'licenca', label: 'Licença / Autorização' },
  { value: 'acordo', label: 'Acordo / Protocolo' },
  { value: 'outro', label: 'Outro' },
]

function categoryBadge(cat) {
  const map = {
    contrato:      { label: 'Contrato',     bg: 'rgba(91,141,239,0.15)',  color: '#5B8DEF' },
    factura:       { label: 'Factura',       bg: 'rgba(248,113,113,0.15)', color: '#F87171' },
    recibo:        { label: 'Recibo',        bg: 'rgba(94,186,130,0.15)',  color: '#5EBA82' },
    proposta:      { label: 'Proposta',      bg: 'rgba(160,106,255,0.15)', color: '#A06AFF' },
    'orcamento-ext': { label: 'Orç. Externo', bg: 'rgba(245,166,35,0.15)', color: '#F5A623' },
    seguro:        { label: 'Seguro',        bg: 'rgba(46,160,128,0.15)',  color: '#2EA080' },
    licenca:       { label: 'Licença',       bg: 'rgba(236,201,75,0.15)', color: '#ECC94B' },
    acordo:        { label: 'Acordo',        bg: 'rgba(139,111,191,0.15)', color: '#8B6FBF' },
    outro:         { label: 'Outro',         bg: 'rgba(255,255,255,0.07)', color: '#9CA3AF' },
  }
  return map[cat] || null
}

function typeBadge(type) {
  const map = {
    text:        { label: 'Texto', bg: 'rgba(94,186,130,0.15)', color: '#5EBA82' },
    docx:        { label: 'DOCX',  bg: 'rgba(91,141,239,0.15)', color: '#5B8DEF' },
    pdf:         { label: 'PDF',   bg: 'rgba(248,113,113,0.15)', color: '#F87171' },
    spreadsheet: { label: 'Excel', bg: 'rgba(46,160,128,0.15)', color: '#2EA080' },
    other:       { label: 'Ficheiro', bg: 'rgba(255,255,255,0.07)', color: '#9CA3AF' },
  }
  return map[type] || map.other
}

async function processFile(file) {
  const ext = getExt(file.name)
  const type = fileTypeFromExt(ext)
  let extractedText = ''

  if (TEXT_EXTS.includes(ext)) {
    extractedText = await file.text()
  } else if (ext === '.docx') {
    extractedText = await extractDocx(await file.arrayBuffer())
  } else if (SHEET_EXTS.includes(ext)) {
    extractedText = await extractXlsx(await file.arrayBuffer())
  } else if (ext === '.pdf') {
    extractedText = '[PDF: extracção requer API — ficheiro guardado sem texto]'
  }

  return {
    id: genId(),
    filename: file.name,
    type,
    extractedText,
    uploadedAt: Date.now(),
    tags: [],
    category: '',
    notes: '',
  }
}

// ── Styles ──────────────────────────────────────────────────────
const S = {
  wrap: {
    display: 'flex', flexDirection: 'column', gap: 16,
    padding: '20px 24px', height: '100%', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  title: {
    fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #E8EAF0)',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  },
  count: {
    fontSize: 12, color: 'var(--text-muted, #5A6070)',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  },
  dropZone: (active) => ({
    border: `2px dashed ${active ? 'rgba(160,106,255,0.7)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: 12,
    padding: '24px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    background: active ? 'rgba(123,79,191,0.1)' : 'rgba(255,255,255,0.02)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    flexShrink: 0,
  }),
  dropLabel: {
    fontSize: 14, color: 'var(--text-muted, #5A6070)',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)', textAlign: 'center',
  },
  browseBtn: {
    padding: '5px 14px', borderRadius: 20,
    border: '1px solid rgba(160,106,255,0.4)', background: 'rgba(123,79,191,0.12)',
    color: '#A06AFF', fontSize: 12, fontWeight: 600,
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    cursor: 'pointer',
  },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap',
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160,
    background: 'var(--bg-elevated, rgba(255,255,255,0.05))',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
    borderRadius: 8, padding: '6px 12px',
  },
  searchInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: 'var(--text-primary, #E8EAF0)', fontSize: 13,
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  },
  filterBtn: (active) => ({
    padding: '4px 10px', borderRadius: 14,
    border: active ? '1px solid rgba(160,106,255,0.5)' : '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
    background: active ? 'rgba(123,79,191,0.15)' : 'transparent',
    color: active ? '#C4A0FF' : 'var(--text-muted, #5A6070)',
    fontSize: 11, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  }),
  list: {
    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10,
    paddingBottom: 20,
  },
  card: {
    background: 'var(--bg-surface, #0F1520)',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
    borderRadius: 10, padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 10 },
  filename: {
    flex: 1, fontSize: 14, fontWeight: 600,
    color: 'var(--text-primary, #E8EAF0)',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  badge: (bg, color) => ({
    padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
    background: bg, color, textTransform: 'uppercase', letterSpacing: '0.04em',
  }),
  date: {
    fontSize: 11, color: 'var(--text-muted, #5A6070)',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  },
  deleteBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted, #5A6070)', padding: 4, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  sectionLabel: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted, #5A6070)',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  select: {
    background: 'var(--bg-elevated, rgba(255,255,255,0.05))',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
    borderRadius: 6, padding: '4px 8px', fontSize: 12,
    color: 'var(--text-primary, #E8EAF0)',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    cursor: 'pointer', outline: 'none',
  },
  tagsWrap: { display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' },
  tag: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 10px', borderRadius: 12,
    background: 'rgba(160,106,255,0.12)', color: '#C4A0FF',
    fontSize: 12, fontWeight: 500,
  },
  tagRemove: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#C4A0FF', padding: 0, display: 'flex', opacity: 0.6,
  },
  tagInput: {
    background: 'none', border: 'none', outline: 'none',
    color: 'var(--text-primary, #E8EAF0)', fontSize: 12, width: 80,
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  },
  previewToggle: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted, #5A6070)', fontSize: 12, padding: 0,
    display: 'flex', alignItems: 'center', gap: 4,
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  },
  previewText: {
    fontSize: 12, color: 'var(--text-secondary, #9CA3AF)',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    background: 'rgba(255,255,255,0.03)', borderRadius: 6,
    padding: '8px 10px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    maxHeight: 200, overflowY: 'auto', lineHeight: 1.5,
  },
  notesInput: {
    background: 'var(--bg-elevated, rgba(255,255,255,0.05))',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
    borderRadius: 6, padding: '6px 10px', fontSize: 12,
    color: 'var(--text-primary, #E8EAF0)',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    resize: 'vertical', minHeight: 36, outline: 'none', width: '100%',
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 10, padding: 40, color: 'var(--text-muted, #5A6070)',
    fontSize: 14, fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  },
}

// ── Component ──────────────────────────────────────────────────
export function BudgetDocuments() {
  const docs = useStore(s => s.budgetDocuments) || []
  const addDoc = useStore(s => s.addBudgetDocument)
  const updateDoc = useStore(s => s.updateBudgetDocument)
  const removeDoc = useStore(s => s.removeBudgetDocument)

  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [expandedPreviews, setExpandedPreviews] = useState({})
  const [tagInputs, setTagInputs] = useState({})
  const [processing, setProcessing] = useState(false)

  // ── Drag & drop ────────────────────────────────────────────
  const handleDrag = useCallback((e) => { e.preventDefault(); e.stopPropagation() }, [])
  const handleDragIn = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true) }, [])
  const handleDragOut = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false) }, [])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    const files = Array.from(e.dataTransfer?.files || [])
    if (files.length) await ingestFiles(files)
  }, [])

  const handleBrowse = () => inputRef.current?.click()

  const handleFileInput = async (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length) await ingestFiles(selected)
    if (inputRef.current) inputRef.current.value = ''
  }

  const ingestFiles = async (rawFiles) => {
    setProcessing(true)
    try {
      for (const file of rawFiles) {
        const entry = await processFile(file)
        addDoc(entry)
      }
    } finally { setProcessing(false) }
  }

  // ── Mutations ──────────────────────────────────────────────
  const addTag = (id, tag) => {
    const f = docs.find(x => x.id === id)
    if (!f || !tag.trim() || (f.tags || []).includes(tag.trim())) return
    updateDoc(id, { tags: [...(f.tags || []), tag.trim()] })
  }

  const removeTag = (id, tag) => {
    const f = docs.find(x => x.id === id)
    if (!f) return
    updateDoc(id, { tags: (f.tags || []).filter(t => t !== tag) })
  }

  // ── Filter ─────────────────────────────────────────────────
  const q = search.toLowerCase().trim()
  let filtered = docs
  if (q) {
    filtered = filtered.filter(f =>
      f.filename.toLowerCase().includes(q) ||
      (f.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (f.notes || '').toLowerCase().includes(q) ||
      (f.extractedText || '').toLowerCase().includes(q)
    )
  }
  if (filterCat) {
    filtered = filtered.filter(f => f.category === filterCat)
  }

  const usedCategories = [...new Set(docs.map(d => d.category).filter(Boolean))]

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <FolderOpen size={20} color="var(--text-muted)" />
        <span style={S.title}>Documentos</span>
        <span style={S.count}>{docs.length} ficheiro{docs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Drop zone */}
      <div
        style={S.dropZone(dragActive)}
        onDragEnter={handleDragIn}
        onDragOver={handleDrag}
        onDragLeave={handleDragOut}
        onDrop={handleDrop}
        onClick={handleBrowse}
        data-local-drop="true"
      >
        <Upload size={24} color={dragActive ? '#A06AFF' : 'var(--text-muted, #5A6070)'} />
        <span style={S.dropLabel}>
          {processing
            ? 'A processar...'
            : dragActive
              ? 'Larga aqui'
              : 'Arrasta contratos, facturas, recibos, propostas...'}
        </span>
        <button style={S.browseBtn} onClick={(e) => { e.stopPropagation(); handleBrowse() }}>
          Procurar ficheiros
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          accept=".txt,.md,.csv,.json,.xml,.html,.eml,.docx,.pdf,.xlsx,.xls"
          onChange={handleFileInput}
        />
      </div>

      {/* Search + category filters */}
      {docs.length > 0 && (
        <div style={S.toolbar}>
          <div style={{ ...S.searchWrap, flex: 1 }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              style={S.searchInput}
              placeholder="Procurar por nome, tag ou conteúdo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button style={S.deleteBtn} onClick={() => setSearch('')}>
                <X size={12} />
              </button>
            )}
          </div>
          {usedCategories.map(cat => {
            const badge = categoryBadge(cat)
            if (!badge) return null
            return (
              <button
                key={cat}
                style={S.filterBtn(filterCat === cat)}
                onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
              >
                {badge.label}
              </button>
            )
          })}
        </div>
      )}

      {/* File list */}
      <div style={S.list}>
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 && docs.length === 0 && (
            <div style={S.empty}>
              <FileText size={32} color="var(--text-muted)" />
              <p>Sem documentos — arrasta ficheiros para começar</p>
            </div>
          )}

          {filtered.length === 0 && docs.length > 0 && (
            <div style={S.empty}>
              <Search size={24} color="var(--text-muted)" />
              <p>Nenhum documento corresponde à pesquisa</p>
            </div>
          )}

          {filtered.map(file => {
            const tBadge = typeBadge(file.type)
            const cBadge = categoryBadge(file.category)
            const expanded = expandedPreviews[file.id]
            const hasPreview = file.extractedText && file.extractedText.length > 0 && !file.extractedText.startsWith('[')

            return (
              <motion.div
                key={file.id}
                style={S.card}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {/* Top row */}
                <div style={S.cardTop}>
                  <FileText size={16} color={tBadge.color} />
                  <span style={S.filename} title={file.filename}>{file.filename}</span>
                  <span style={S.badge(tBadge.bg, tBadge.color)}>{tBadge.label}</span>
                  {cBadge && <span style={S.badge(cBadge.bg, cBadge.color)}>{cBadge.label}</span>}
                  <span style={S.date}>{relativeDate(file.uploadedAt)}</span>
                  <button
                    style={S.deleteBtn}
                    onClick={() => removeDoc(file.id)}
                    title="Apagar"
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Category + Tags row */}
                <div style={S.row}>
                  <select
                    style={S.select}
                    value={file.category || ''}
                    onChange={(e) => updateDoc(file.id, { category: e.target.value })}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>

                  <div style={S.tagsWrap}>
                    {(file.tags || []).map(tag => (
                      <span key={tag} style={S.tag}>
                        {tag}
                        <button style={S.tagRemove} onClick={() => removeTag(file.id, tag)}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <input
                      style={S.tagInput}
                      placeholder="+ tag"
                      value={tagInputs[file.id] || ''}
                      onChange={(e) => setTagInputs(prev => ({ ...prev, [file.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInputs[file.id]?.trim()) {
                          addTag(file.id, tagInputs[file.id])
                          setTagInputs(prev => ({ ...prev, [file.id]: '' }))
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Preview */}
                {hasPreview && (
                  <div style={S.section}>
                    <button style={S.previewToggle} onClick={() => setExpandedPreviews(prev => ({ ...prev, [file.id]: !prev[file.id] }))}>
                      {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {expanded ? 'Esconder' : 'Ver conteúdo'}
                    </button>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={S.previewText}>
                            {file.extractedText.length > 2000
                              ? file.extractedText.slice(0, 2000) + '...'
                              : file.extractedText}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Notes */}
                <div style={S.section}>
                  <textarea
                    style={S.notesInput}
                    rows={2}
                    placeholder="Notas sobre este documento..."
                    value={file.notes || ''}
                    onChange={(e) => updateDoc(file.id, { notes: e.target.value })}
                  />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
