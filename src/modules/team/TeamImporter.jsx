// TeamImporter — importação inteligente de qualquer documento para cartões de equipa
// Suporta: TXT, CSV, PDF, imagens, emails (.eml), RTF, colagem de texto
// A API lê o conteúdo e extrai pessoas com os seus dados

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Upload, FileText, Image, Mail, Table, File,
  Loader, CheckCircle, AlertCircle, Plus, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { fetchAPI } from '../../core/api.js'
import { GROUPS } from './index.jsx'
import { ROLES, DEPARTMENTS, getRolesByDepartment } from '../../core/roles.js'
import styles from './TeamImporter.module.css'

// ── Leitura de ficheiros ───────────────────────────────────────────

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file, 'utf-8')
  })
}

async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      // e.target.result = "data:image/jpeg;base64,/9j/..."
      const base64 = e.target.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function fileIcon(file) {
  const type = typeof file === 'string' ? file : file?.type || ''
  const name = typeof file === 'string' ? '' : file?.name || ''
  const ext = name.split('.').pop().toLowerCase()
  if (type.startsWith('image/')) return <Image size={16} />
  if (type === 'application/pdf') return <FileText size={16} />
  if (ext === 'xlsx' || ext === 'xls' || type.includes('sheet') || type.includes('excel')) return <Table size={16} />
  if (type === 'text/csv') return <Table size={16} />
  if (type.includes('mail') || type === 'message/rfc822') return <Mail size={16} />
  return <File size={16} />
}

function fileLabel(file) {
  const kb = (file.size / 1024).toFixed(0)
  return `${file.name} · ${kb}KB`
}

const SUPPORTED = [
  'text/plain', 'text/csv', 'text/html',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'message/rfc822',
]
const SUPPORTED_EXT = ['.txt','.csv','.pdf','.jpg','.jpeg','.png','.webp','.eml','.rtf','.md','.vcf','.xlsx','.xls','.docx','.doc']

// ── Load XLSX dynamically ────────────────────────────────────────────
async function loadXLSX() {
  const { getXLSX } = await import('../../core/xlsx-loader.js')
  return getXLSX()
}

async function readExcelAsText(file) {
  const XLSX = await loadXLSX()
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  // Converter todas as sheets para CSV
  return wb.SheetNames.map(name => {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name])
    return `--- FOLHA: ${name} ---\n${csv}`
  }).join('\n\n')
}

// ── Motor de extracção via API ─────────────────────────────────────

async function extractPeopleFromContent(files, pastedText, apiKey, projectContext) {
  const messages_content = []

  // Texto colado directamente
  if (pastedText.trim()) {
    messages_content.push({ type: 'text', text: `DOCUMENTO:\n${pastedText}` })
  }

  // Processar cada ficheiro
  for (const file of files) {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    const isImage = file.type.startsWith('image/')
    const isPdf   = file.type === 'application/pdf'
    const isExcel = ext === '.xlsx' || ext === '.xls'

    const isDocx  = ext === '.docx'

    if (isDocx) {
      const mammoth = await import('mammoth')
      const buf = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer: buf })
      const preview = result.value.slice(0, 10000)
      messages_content.push({ type: 'text', text: `DOCUMENTO WORD "${file.name}":\n${preview}` })
    } else if (isImage) {
      const b64 = await readFileAsBase64(file)
      const mediaType = file.type === 'image/jpg' ? 'image/jpeg' : file.type
      messages_content.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: b64 }
      })
      messages_content.push({ type: 'text', text: `(imagem acima: ${file.name})` })
    } else if (isPdf) {
      const b64 = await readFileAsBase64(file)
      messages_content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: b64 }
      })
      messages_content.push({ type: 'text', text: `(documento acima: ${file.name})` })
    } else if (isExcel) {
      // Excel → converter para texto CSV
      const text = await readExcelAsText(file)
      const preview = text.slice(0, 10000)
      messages_content.push({ type: 'text', text: `FICHEIRO EXCEL "${file.name}":\n${preview}` })
    } else {
      // Texto (txt, csv, eml, rtf, md, vcf, html)
      const text = await readFileAsText(file)
      const preview = text.slice(0, 8000) // limite razoável
      messages_content.push({ type: 'text', text: `FICHEIRO "${file.name}":\n${preview}` })
    }
  }

  if (messages_content.length === 0) return []

  const groupsList = GROUPS.map(g => g.id).join(' | ')

  // Construir lista de roles com departamentos para o prompt
  const deptsByRole = getRolesByDepartment()
  const rolesRef = deptsByRole.map(d =>
    `${d.label}: ${d.roles.map(r => `${r.label} (${r.id})`).join(', ')}`
  ).join('\n')

  const systemPrompt = `És um assistente de produção audiovisual. O teu papel é extrair informação de membros de equipa a partir de documentos fornecidos.

PROJECTO: ${projectContext.projectName}
PERSONAGENS EXISTENTES: ${(projectContext.parsedCharacters || []).map(c => c.name).join(', ') || 'nenhum'}

Para cada pessoa identificada nos documentos, extrai todos os campos que conseguires. Sê inteligente: se um email menciona "De: Maria Costa <maria@prod.pt>", o email é maria@prod.pt e o nome é Maria Costa. Numa tabela CSV, associa colunas a campos correctamente mesmo que os nomes das colunas estejam em inglês ou sejam abreviados. Numa tabela de orçamento ou mapa de produção, as linhas podem referir funções/cargos com valores — extrai as pessoas mesmo assim.

DEPARTAMENTOS E ROLES DISPONÍVEIS:
${rolesRef}

Grupos para UI: ${groupsList}
Mapeamento de departamento para grupo UI: Acima da Linha→Produção, Realização→Realização, Produção→Produção, Câmara→Imagem, Luz/Eléctrico→Electricidade, Grip→Electricidade, Som→Som, Arte/Cenografia→Arte, Guarda-Roupa→Arte, Maquilhagem→Arte, Elenco→Elenco, Pós-Produção→Pós-Produção, Logística→Produção.

Responde APENAS com JSON válido, sem texto adicional:
{
  "pessoas": [
    {
      "name": "Nome Completo",
      "role": "Função/Cargo (texto livre)",
      "roleId": "id exacto do role acima (ex: dir_fotografia, gaffer, etc.) ou null se não tens a certeza",
      "department": "id do departamento (ex: camara, realizacao, etc.) ou null",
      "group": "um dos grupos UI acima",
      "email": "email@exemplo.com ou null",
      "phone": "número ou null",
      "company": "empresa ou null",
      "characterName": "nome da personagem se for actor, ou null",
      "agent": "agente se mencionado ou null",
      "cacheDiario": "valor numérico em euros se mencionado, ou null",
      "nif": "NIF se mencionado, ou null",
      "notes": "qualquer outra informação relevante ou null",
      "confidence": 0.9
    }
  ],
  "fonte_resumo": "breve descrição do que foi encontrado (ex: email com 3 pessoas, Excel com 12 linhas)"
}`

  const text = await fetchAPI({
    apiKey,
    system: systemPrompt,
    messages: [{ role: 'user', content: messages_content }],
    maxTokens: 2500,
    beta: 'pdfs-2024-09-25',
    cache: true,
  })

  // Extrair JSON mesmo que venha com markdown code fence
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Resposta da API não contém JSON válido')

  let parsed
  try { parsed = JSON.parse(jsonMatch[0]) } catch { return { pessoas: [], fonte: '' } }
  return { pessoas: parsed.pessoas || [], fonte: parsed.fonte_resumo || '' }
}

// ── Card de pré-visualização de membro extraído ────────────────────

function PreviewCard({ member, index, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const g = GROUPS.find(g => g.id === member.group) || GROUPS[0]
  const f = (k, v) => onChange(index, { ...member, [k]: v })

  return (
    <motion.div
      className={styles.previewCard}
      style={{ borderColor: g.color + '44', background: g.bg }}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Linha principal */}
      <div className={styles.previewCardTop}>
        <div className={styles.previewAvatar} style={{ background: g.color + '33', color: g.color }}>
          {(member.name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
        </div>
        <div className={styles.previewInfo}>
          <input
            className={styles.previewName}
            value={member.name || ''}
            onChange={e => f('name', e.target.value)}
            placeholder="Nome"
          />
          <input
            className={styles.previewRole}
            value={member.role || ''}
            onChange={e => f('role', e.target.value)}
            placeholder="Função"
            style={{ color: g.color + 'BB' }}
          />
        </div>
        <div className={styles.previewActions}>
          {member.confidence < 0.6 && (
            <span className={styles.lowConf} title="Confiança baixa — verifica os dados">⚠</span>
          )}
          <button className={styles.expandBtn} onClick={() => setExpanded(v => !v)}>
            {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
          <button className={styles.removeBtn} onClick={() => onRemove(index)}>
            <Trash2 size={13}/>
          </button>
        </div>
      </div>

      {/* Campos rápidos sempre visíveis */}
      <div className={styles.previewQuickFields}>
        {member.email && <span className={styles.previewChip}>✉ {member.email}</span>}
        {member.phone && <span className={styles.previewChip}>📞 {member.phone}</span>}
        {member.company && <span className={styles.previewChip}>🏢 {member.company}</span>}
        {member.characterName && <span className={styles.previewChip} style={{ color: g.color }}>→ {member.characterName}</span>}
      </div>

      {/* Campos expandidos */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className={styles.previewExpanded}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className={styles.previewGrid}>
              <label>Grupo
                <select value={member.group || 'Produção'} onChange={e => f('group', e.target.value)} className={styles.previewSelect}>
                  {GROUPS.map(g => <option key={g.id} value={g.id}>{g.id}</option>)}
                </select>
              </label>
              <label>Role (sistema)
                <select value={member.roleId || ''} onChange={e => f('roleId', e.target.value)} className={styles.previewSelect}>
                  <option value="">— não atribuído —</option>
                  {Object.values(ROLES).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </label>
              <label>Email
                <input value={member.email || ''} onChange={e => f('email', e.target.value)} className={styles.previewInput} placeholder="email@…"/>
              </label>
              <label>Telefone
                <input value={member.phone || ''} onChange={e => f('phone', e.target.value)} className={styles.previewInput} placeholder="+351 9…"/>
              </label>
              <label>Empresa
                <input value={member.company || ''} onChange={e => f('company', e.target.value)} className={styles.previewInput} placeholder="Empresa"/>
              </label>
              {member.cacheDiario && (
                <label>Cachê/dia
                  <input value={member.cacheDiario || ''} onChange={e => f('cacheDiario', e.target.value)} className={styles.previewInput} placeholder="€/dia"/>
                </label>
              )}
              {member.group === 'Elenco' && (
                <label>Personagem
                  <input value={member.characterName || ''} onChange={e => f('characterName', e.target.value)} className={styles.previewInput} placeholder="Nome da personagem"/>
                </label>
              )}
              <label style={{ gridColumn: '1/-1' }}>Notas
                <input value={member.notes || ''} onChange={e => f('notes', e.target.value)} className={styles.previewInput} placeholder="Notas adicionais"/>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Componente principal ───────────────────────────────────────────

export function TeamImporter({ onClose }) {
  const {  apiKey, addMember, parsedCharacters, projectName, team  } = useStore(useShallow(s => ({ apiKey: s.apiKey, addMember: s.addMember, parsedCharacters: s.parsedCharacters, projectName: s.projectName, team: s.team })))

  const [files, setFiles]           = useState([])
  const [pastedText, setPastedText] = useState('')
  const [dragging, setDragging]     = useState(false)
  const [phase, setPhase]           = useState('input')   // input | loading | preview | done
  const [extracted, setExtracted]   = useState([])
  const [fonte, setFonte]           = useState('')
  const [error, setError]           = useState('')
  const fileInputRef = useRef(null)

  // ── Drag & drop ──────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = [...e.dataTransfer.files]
    addFiles(dropped)
  }, [])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const addFiles = (newFiles) => {
    const valid = newFiles.filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase()
      return SUPPORTED.includes(f.type) || SUPPORTED_EXT.includes(ext) || f.type.startsWith('image/')
    })
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...valid.filter(f => !names.has(f.name))]
    })
  }

  // ── Extracção ────────────────────────────────────────────────────
  const handleExtract = async () => {
    if (!apiKey) { setError('Configura a chave API nas Definições primeiro.'); return }
    if (files.length === 0 && !pastedText.trim()) { setError('Adiciona pelo menos um ficheiro ou cola texto.'); return }

    setError('')
    setPhase('loading')

    try {
      const result = await extractPeopleFromContent(
        files, pastedText,
        apiKey,
        { projectName, parsedCharacters }
      )

      // Marcar duplicados
      const existingNames = new Set(team.map(m => m.name.toLowerCase()))
      const pessoas = result.pessoas.map(p => ({
        ...p,
        id: `import_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        driveLinks: [],
        availability: '',
        photo: '',
        isDuplicate: existingNames.has((p.name || '').toLowerCase()),
      }))

      setExtracted(pessoas)
      setFonte(result.fonte)
      setPhase('preview')
    } catch (err) {
      setError(err.message || 'Erro desconhecido')
      setPhase('input')
    }
  }

  // ── Confirmar importação ─────────────────────────────────────────
  const handleConfirm = () => {
    const toAdd = extracted.filter(m => !m._skip && m.name?.trim())
    toAdd.forEach(m => {
      const { isDuplicate, _skip, confidence, ...member } = m
      addMember({ ...member, id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}` })
    })
    setPhase('done')
    setTimeout(onClose, 1200)
  }

  const updateMember = (index, updated) => {
    setExtracted(prev => prev.map((m, i) => i === index ? updated : m))
  }
  const removeMember = (index) => {
    setExtracted(prev => prev.filter((_, i) => i !== index))
  }

  const toAdd = extracted.filter(m => !m._skip && m.name?.trim()).length

  return (
    <motion.div className={styles.overlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div className={styles.panel}
        initial={{ y: 32, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 16, scale: 0.98, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Cabeçalho */}
        <div className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle}>Importar Equipa</h3>
            <p className={styles.panelSub}>
              {phase === 'input' && 'Arrasta ficheiros ou cola texto — a IA extrai as pessoas automaticamente'}
              {phase === 'loading' && 'A analisar documentos…'}
              {phase === 'preview' && `${extracted.length} pessoa${extracted.length !== 1 ? 's' : ''} encontrada${extracted.length !== 1 ? 's' : ''} · ${fonte}`}
              {phase === 'done' && 'Importação concluída!'}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
        </div>

        {/* Corpo */}
        <div className={styles.panelBody}>

          {/* ── FASE: INPUT ── */}
          {phase === 'input' && (
            <div className={styles.inputPhase}>

              {/* Drop zone */}
              <div
                className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                data-local-drop="true"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.csv,.pdf,.jpg,.jpeg,.png,.webp,.eml,.rtf,.md,.vcf,.xlsx,.xls,.docx,.doc"
                  style={{ display: 'none' }}
                  onChange={e => addFiles([...e.target.files])}
                />
                <Upload size={32} style={{ color: dragging ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 8 }} />
                <p className={styles.dropTitle}>
                  {dragging ? 'Larga aqui' : 'Arrasta ficheiros ou clica para escolher'}
                </p>
                <p className={styles.dropSub}>Excel · Word · PDF · CSV · TXT · Email · Imagem · RTF · vCard</p>
              </div>

              {/* Lista de ficheiros adicionados */}
              {files.length > 0 && (
                <div className={styles.fileList}>
                  {files.map((f, i) => (
                    <div key={i} className={styles.fileItem}>
                      <span className={styles.fileIcon}>{fileIcon(f)}</span>
                      <span className={styles.fileLabel}>{fileLabel(f)}</span>
                      <button className={styles.fileRemove} onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Divisor */}
              <div className={styles.divider}>
                <span>ou cola texto directamente</span>
              </div>

              {/* Textarea para colar */}
              <textarea
                className={styles.pasteArea}
                placeholder={"Cola aqui emails, listas, tabelas, assinaturas digitais, qualquer texto com nomes e contactos…\n\nExemplo:\nMaria Costa — Produtora Executiva · maria@prod.pt · 912 345 678\nJoão Silva — Realizador · joao@realizador.pt"}
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                rows={6}
              />

              {error && (
                <div className={styles.errorMsg}>
                  <AlertCircle size={14}/> {error}
                </div>
              )}
            </div>
          )}

          {/* ── FASE: LOADING ── */}
          {phase === 'loading' && (
            <div className={styles.loadingPhase}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader size={36} style={{ color: 'var(--accent)' }} />
              </motion.div>
              <p className={styles.loadingText}>A IA está a ler os documentos e a identificar as pessoas…</p>
              <p className={styles.loadingHint}>
                {files.length > 0 && `${files.length} ficheiro${files.length > 1 ? 's' : ''} · `}
                Este processo demora 5–15 segundos
              </p>
            </div>
          )}

          {/* ── FASE: PREVIEW ── */}
          {phase === 'preview' && (
            <div className={styles.previewPhase}>
              {extracted.length === 0 ? (
                <div className={styles.emptyResult}>
                  <AlertCircle size={32} style={{ color: 'var(--text-muted)' }} />
                  <p>Não foram encontradas pessoas nos documentos.</p>
                  <button className={styles.btnRetry} onClick={() => setPhase('input')}>
                    Tentar com outros ficheiros
                  </button>
                </div>
              ) : (
                <>
                  {extracted.some(m => m.isDuplicate) && (
                    <div className={styles.dupWarning}>
                      <AlertCircle size={14}/>
                      Algumas pessoas já existem na equipa (marcadas com ⚠). Remove-as ou mantém para criar duplicados.
                    </div>
                  )}
                  <div className={styles.previewList}>
                    {extracted.map((m, i) => (
                      <div key={m.id}>
                        {m.isDuplicate && (
                          <p className={styles.dupLabel}>⚠ Possível duplicado — já existe na equipa</p>
                        )}
                        <PreviewCard
                          member={m}
                          index={i}
                          onChange={updateMember}
                          onRemove={removeMember}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── FASE: DONE ── */}
          {phase === 'done' && (
            <div className={styles.loadingPhase}>
              <CheckCircle size={40} style={{ color: 'var(--health-green)' }} />
              <p className={styles.loadingText}>{toAdd} pessoa{toAdd !== 1 ? 's' : ''} adicionada{toAdd !== 1 ? 's' : ''} à equipa!</p>
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
                  <Plus size={14}/> Analisar e extrair pessoas
                </button>
              </>
            )}
            {phase === 'preview' && extracted.length > 0 && (
              <>
                <button className={styles.btnCancel} onClick={() => setPhase('input')}>← Voltar</button>
                <span className={styles.countLabel}>{toAdd} para adicionar</span>
                <button className={styles.btnExtract} onClick={handleConfirm} disabled={toAdd === 0}>
                  <CheckCircle size={14}/> Adicionar à equipa
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
