// FilesTab — gestão de ficheiros e notas do universo
// Suporta drag & drop, extracção de texto, tags, linkagem a entidades

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, FileText, Music, Trash2, X, ChevronDown, ChevronUp, Search, Link, Tag, Sparkles, Globe } from 'lucide-react'
import { fetchAPI, MODEL_FAST } from '../../core/api.js'
import styles from './Universe.module.css'

// ── Extractors (dynamic imports) ────────────────────────────────
const extractDocx = async (arrayBuffer) => {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  } catch { return '[docx: instalar mammoth para extrair texto]' }
}

const extractXlsx = async (arrayBuffer) => {
  try {
    const XLSX = await (await import('../../core/xlsx-loader.js')).getXLSX()
    const wb = XLSX.read(arrayBuffer, { type: 'array' })
    return wb.SheetNames.map(n => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n\n')
  } catch { return '[xlsx: instalar xlsx para extrair texto]' }
}

// ── Helpers ──────────────────────────────────────────────────────
const TEXT_EXTS = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.eml']
const AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.ogg']
const SHEET_EXTS = ['.xlsx', '.xls']

function genId() {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getExt(name) {
  const m = name.match(/\.[^.]+$/)
  return m ? m[0].toLowerCase() : ''
}

function fileTypeFromExt(ext) {
  if (TEXT_EXTS.includes(ext)) return 'text'
  if (ext === '.docx') return 'docx'
  if (ext === '.pdf') return 'pdf'
  if (SHEET_EXTS.includes(ext)) return 'spreadsheet'
  if (AUDIO_EXTS.includes(ext)) return 'audio'
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
  const months = Math.floor(days / 30)
  return months === 1 ? 'há 1 mês' : `há ${months} meses`
}

function typeIcon(type) {
  if (type === 'audio') return Music
  if (type === 'text' || type === 'docx' || type === 'pdf') return FileText
  return File
}

function typeBadge(type) {
  const map = {
    text: { label: 'Texto', bg: 'rgba(94,186,130,0.15)', color: '#5EBA82' },
    docx: { label: 'DOCX', bg: 'rgba(91,141,239,0.15)', color: '#5B8DEF' },
    pdf: { label: 'PDF', bg: 'rgba(248,113,113,0.15)', color: '#F87171' },
    spreadsheet: { label: 'Excel', bg: 'rgba(46,160,128,0.15)', color: '#2EA080' },
    audio: { label: 'Áudio', bg: 'rgba(245,166,35,0.15)', color: '#F5A623' },
    other: { label: 'Ficheiro', bg: 'rgba(255,255,255,0.07)', color: '#9CA3AF' },
  }
  return map[type] || map.other
}

// ── Process file ────────────────────────────────────────────────
async function processFile(file) {
  const ext = getExt(file.name)
  const type = fileTypeFromExt(ext)
  let extractedText = ''

  if (TEXT_EXTS.includes(ext)) {
    extractedText = await file.text()
  } else if (ext === '.docx') {
    const buf = await file.arrayBuffer()
    extractedText = await extractDocx(buf)
  } else if (SHEET_EXTS.includes(ext)) {
    const buf = await file.arrayBuffer()
    extractedText = await extractXlsx(buf)
  } else if (ext === '.pdf') {
    extractedText = '[PDF: extracção requer API — ficheiro guardado sem texto]'
  } else if (AUDIO_EXTS.includes(ext)) {
    extractedText = '[Áudio: transcrição requer API]'
  }

  return {
    id: genId(),
    filename: file.name,
    type,
    extractedText,
    uploadedAt: Date.now(),
    tags: [],
    linkedTo: null,
    notes: '',
  }
}

// ── Inline style constants ──────────────────────────────────────
const S = {
  wrap: {
    display: 'flex', flexDirection: 'column', gap: 16,
    padding: '20px 24px', height: '100%', overflow: 'hidden',
  },
  dropZone: (active) => ({
    border: `2px dashed ${active ? 'rgba(160,106,255,0.7)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: 12,
    padding: '28px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    background: active ? 'rgba(123,79,191,0.1)' : 'rgba(255,255,255,0.02)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    flexShrink: 0,
  }),
  dropLabel: {
    fontSize: 'var(--text-sm, 14px)', color: 'var(--text-muted, #5A6070)',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)', textAlign: 'center',
  },
  browseBtn: {
    padding: '5px 14px', borderRadius: 20,
    border: '1px solid rgba(160,106,255,0.4)', background: 'rgba(123,79,191,0.12)',
    color: '#A06AFF', fontSize: 12, fontWeight: 600,
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    cursor: 'pointer', transition: 'all 0.15s ease',
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg-elevated, rgba(255,255,255,0.05))',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
    borderRadius: 8, padding: '6px 12px', flexShrink: 0,
  },
  searchInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: 'var(--text-primary, #E8EAF0)', fontSize: 13,
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  },
  list: {
    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10,
    paddingBottom: 20,
  },
  card: {
    background: 'var(--bg-surface, #0F1520)',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
    borderRadius: 10, padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 10,
    transition: 'box-shadow 0.15s ease',
  },
  cardTop: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
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
    transition: 'all 0.15s ease',
  },
  section: {
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted, #5A6070)',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  tagsWrap: {
    display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center',
  },
  tag: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 10px', borderRadius: 12,
    background: 'rgba(160,106,255,0.12)', color: '#C4A0FF',
    fontSize: 12, fontWeight: 500,
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
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
  linkSelect: {
    background: 'var(--bg-elevated, rgba(255,255,255,0.05))',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
    borderRadius: 6, padding: '4px 8px', fontSize: 12,
    color: 'var(--text-primary, #E8EAF0)',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    cursor: 'pointer', outline: 'none', minWidth: 140,
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
}

// ── AI auto-tag extraction ───────────────────────────────────────
async function extractTagsAI(apiKey, text, filename) {
  if (!apiKey || !text || text.length < 50) return []
  try {
    const snippet = text.slice(0, 3000)
    const reply = await fetchAPI({
      apiKey,
      system: 'Classificas documentos de produção audiovisual. Responde APENAS com tags separadas por vírgula, sem explicação. Máximo 6 tags curtas em português (ex: personagem, locação, referência visual, casting, orçamento, cenografia, guarda-roupa, tom, narrativa, produção, investigação, inspiração).',
      messages: [{ role: 'user', content: `Ficheiro: "${filename}"\n\nConteúdo:\n${snippet}\n\nTags:` }],
      maxTokens: 100,
      model: MODEL_FAST,
    })
    return reply.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 1 && t.length < 30).slice(0, 6)
  } catch { return [] }
}

// ── Component ───────────────────────────────────────────────────
export function FilesTab({
  files = [],
  addUniverseFile,
  removeUniverseFile,
  setUniverseFiles,
  chars = [],
  episodeArcs = [],
  forces = [],
  apiKey,
}) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedPreviews, setExpandedPreviews] = useState({})
  const [tagInputs, setTagInputs] = useState({})
  const [processing, setProcessing] = useState(false)
  const [autoTag, setAutoTag] = useState(true)
  const [aiTagging, setAiTagging] = useState({})

  // ── Drag handlers ───────────────────────────────────────────
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragOut = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFiles = Array.from(e.dataTransfer?.files || [])
    if (droppedFiles.length) await ingestFiles(droppedFiles)
  }, [])

  const handleBrowse = () => inputRef.current?.click()

  const handleFileInput = async (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length) await ingestFiles(selected)
    if (inputRef.current) inputRef.current.value = ''
  }

  // Queue for pending AI tags — apply via effect to avoid stale closures
  const [pendingTags, setPendingTags] = useState({}) // {fileId: tags[]}
  useEffect(() => {
    const keys = Object.keys(pendingTags)
    if (keys.length === 0) return
    const updated = files.map(f => {
      const pt = pendingTags[f.id]
      return pt ? { ...f, tags: [...new Set([...(f.tags || []), ...pt])] } : f
    })
    setUniverseFiles(updated)
    setPendingTags({})
  }, [pendingTags]) // eslint-disable-line react-hooks/exhaustive-deps

  const ingestFiles = async (rawFiles) => {
    setProcessing(true)
    try {
      for (const file of rawFiles) {
        const entry = await processFile(file)
        addUniverseFile(entry)
        // AI auto-tag in background
        if (autoTag && apiKey && entry.extractedText && !entry.extractedText.startsWith('[')) {
          const fileId = entry.id
          setAiTagging(prev => ({ ...prev, [fileId]: true }))
          extractTagsAI(apiKey, entry.extractedText, entry.filename).then(tags => {
            if (tags.length > 0) {
              setPendingTags(prev => ({ ...prev, [fileId]: tags }))
            }
            setAiTagging(prev => { const n = { ...prev }; delete n[fileId]; return n })
          })
        }
      }
    } finally {
      setProcessing(false)
    }
  }

  // ── File mutations ──────────────────────────────────────────
  const updateFile = (id, patch) => {
    setUniverseFiles(files.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  const addTag = (id, tag) => {
    const f = files.find(x => x.id === id)
    if (!f || !tag.trim() || f.tags.includes(tag.trim())) return
    updateFile(id, { tags: [...f.tags, tag.trim()] })
  }

  const removeTag = (id, tag) => {
    const f = files.find(x => x.id === id)
    if (!f) return
    updateFile(id, { tags: f.tags.filter(t => t !== tag) })
  }

  const togglePreview = (id) => {
    setExpandedPreviews(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // ── Link options ────────────────────────────────────────────
  const linkOptions = [
    { value: '', label: 'Nenhum' },
    ...chars.map(c => ({ value: `char:${c.id}`, label: `${c.name || c.id}` })),
    ...episodeArcs.map(a => ({ value: `arc:${a.id}`, label: `Arco: ${a.title || a.id}` })),
    ...forces.map(f => ({ value: `force:${f.id}`, label: `Forca: ${f.title || f.id}` })),
  ]

  const parseLinkValue = (val) => {
    if (!val) return null
    const [type, id] = val.split(':')
    return { type, id }
  }

  const linkValueStr = (linkedTo) => {
    if (!linkedTo) return ''
    return `${linkedTo.type}:${linkedTo.id}`
  }

  // ── Filter ──────────────────────────────────────────────────
  const q = search.toLowerCase().trim()
  const filtered = q
    ? files.filter(f =>
        f.filename.toLowerCase().includes(q) ||
        (f.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (f.extractedText || '').toLowerCase().includes(q)
      )
    : files

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
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
        <Upload size={28} color={dragActive ? '#A06AFF' : 'var(--text-muted, #5A6070)'} />
        <span style={S.dropLabel}>
          {processing
            ? 'A processar...'
            : dragActive
              ? 'Larga aqui'
              : 'Arrasta referências, notas, emails, moodboards, áudio'}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={S.browseBtn} onClick={(e) => { e.stopPropagation(); handleBrowse() }}>
            Procurar ficheiros
          </button>
          {apiKey && (
            <label
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: autoTag ? '#A06AFF' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
              onClick={e => e.stopPropagation()}
            >
              <input type="checkbox" checked={autoTag} onChange={e => setAutoTag(e.target.checked)} style={{ accentColor: '#A06AFF' }} />
              <Sparkles size={11} /> Auto-tag AI
            </label>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          accept=".txt,.md,.csv,.json,.xml,.html,.eml,.docx,.pdf,.xlsx,.xls,.mp3,.wav,.m4a,.ogg,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileInput}
        />
      </div>

      {/* Stats bar */}
      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0, fontSize: 11, color: 'var(--text-muted)', padding: '0 2px' }}>
          <span style={{ fontWeight: 700, color: '#A06AFF' }}>{files.length} ficheiro{files.length !== 1 ? 's' : ''}</span>
          {files.filter(f => f.source === 'mirror').length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Globe size={10} /> {files.filter(f => f.source === 'mirror').length} do Espelho
            </span>
          )}
          {Object.keys(aiTagging).length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#A06AFF' }}>
              <Sparkles size={10} /> A classificar...
            </span>
          )}
        </div>
      )}

      {/* Search */}
      {files.length > 0 && (
        <div style={S.searchWrap}>
          <Search size={14} color="var(--text-muted, #5A6070)" />
          <input
            style={S.searchInput}
            placeholder="Procurar por nome, tag ou conteúdo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              style={{ ...S.deleteBtn, padding: 2 }}
              onClick={() => setSearch('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* File list */}
      <div style={S.list}>
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 && files.length === 0 && (
            <div className={styles.emptyState}>
              <FileText size={32} color="var(--text-muted)" />
              <p>Arrasta ficheiros aqui — notas, documentos, emails, áudio</p>
            </div>
          )}

          {filtered.length === 0 && files.length > 0 && (
            <div className={styles.emptyState}>
              <Search size={28} color="var(--text-muted)" />
              <p>Nenhum ficheiro corresponde a "{search}"</p>
            </div>
          )}

          {filtered.map(file => {
            const Icon = typeIcon(file.type)
            const badge = typeBadge(file.type)
            const expanded = expandedPreviews[file.id]
            const hasPreview = file.extractedText && file.extractedText.length > 0

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
                {/* Top row: icon + name + badge + date + delete */}
                <div style={S.cardTop}>
                  <Icon size={16} color={badge.color} />
                  <span style={S.filename} title={file.filename}>{file.filename}</span>
                  <span style={S.badge(badge.bg, badge.color)}>{badge.label}</span>
                  {file.source === 'mirror' && (
                    <span style={S.badge('rgba(155,89,182,0.15)', '#9B59B6')}>Espelho</span>
                  )}
                  <span style={S.date}>{relativeDate(file.uploadedAt)}</span>
                  <button
                    style={S.deleteBtn}
                    onClick={() => removeUniverseFile(file.id)}
                    title="Apagar"
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted, #5A6070)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Tags */}
                <div style={S.section}>
                  <div style={S.sectionLabel}>
                    <Tag size={10} /> Tags
                  </div>
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

                {/* Link to entity */}
                <div style={S.section}>
                  <div style={S.sectionLabel}>
                    <Link size={10} /> Ligar a
                  </div>
                  <select
                    style={S.linkSelect}
                    value={linkValueStr(file.linkedTo)}
                    onChange={(e) => updateFile(file.id, { linkedTo: parseLinkValue(e.target.value) })}
                  >
                    {linkOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Extracted text preview */}
                {hasPreview && (
                  <div style={S.section}>
                    <button style={S.previewToggle} onClick={() => togglePreview(file.id)}>
                      {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {expanded ? 'Esconder pré-visualização' : 'Ver texto extraído'}
                    </button>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
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
                  <div style={S.sectionLabel}>Notas</div>
                  <textarea
                    style={S.notesInput}
                    rows={2}
                    placeholder="Notas sobre este ficheiro..."
                    value={file.notes || ''}
                    onChange={(e) => updateFile(file.id, { notes: e.target.value })}
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
