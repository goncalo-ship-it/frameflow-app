// Biblioteca de guiões — painel esquerdo (eps) + workspace direito
// Quick-load FDX · Popula store ao confirmar

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Upload, Trash2, CheckCircle, AlertTriangle, X, FileText } from 'lucide-react'
import { parseScript } from '../../utils/script-parser.js'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { Badge } from '../../components/ui/Badge.jsx'
import styles from './ScriptUploader.module.css'

const MAX_EPISODES = 20
const ACCEPT = '.fdx,.html,.htm,.rtf,.txt,.doc,.docx,.eml,.msg,.md,.csv'
const FORMATS = ['.fdx', '.html', '.rtf', '.txt', '.docx']

function nextEpId(episodes) {
  if (episodes.length === 0) return 'EP01'
  const nums = episodes.map(e => parseInt(e.epId.replace('EP', ''), 10))
  return `EP${String(Math.max(...nums) + 1).padStart(2, '0')}`
}

export function ScriptUploader({ onParsed }) {
  const {  populateFromScript, parsedScripts  } = useStore(useShallow(s => ({ populateFromScript: s.populateFromScript, parsedScripts: s.parsedScripts })))

  const [episodes, setEpisodes]   = useState([])
  const [activeEp, setActiveEp]   = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState(null)
  const [preview, setPreview]     = useState(null)
  const inputRef = useRef(null)

  // ── Restaurar tabs dos guiões já confirmados ─────────────────
  useEffect(() => {
    const confirmed = Object.entries(parsedScripts)
    if (confirmed.length === 0 || episodes.length > 0) return
    const restored = confirmed
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([epId, data]) => ({
        epId,
        fileName: data.fileName || `${epId}.fdx`,
        result: data,
      }))
    setEpisodes(restored)
    const first = restored[0]
    setActiveEp(first.epId)
    onParsed({ ...first.result, episode: first.epId, fileName: first.fileName })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Gestão de slots ──────────────────────────────────────────
  const addEpisode = () => {
    if (episodes.length >= MAX_EPISODES) return
    const id = nextEpId(episodes)
    const slot = { epId: id, fileName: null, result: null }
    setEpisodes(prev => [...prev, slot])
    setActiveEp(id)
    setPreview(null)
    setUploadErr(null)
  }

  const removeEpisode = (epId) => {
    setEpisodes(prev => {
      const updated = prev.filter(e => e.epId !== epId)
      if (activeEp === epId) {
        const next = updated[updated.length - 1]
        setActiveEp(next?.epId || null)
        onParsed(next?.result ? { ...next.result, episode: next.epId, fileName: next.fileName } : null)
      }
      return updated
    })
    if (preview?.epId === epId) setPreview(null)
  }

  const selectEp = (epId) => {
    setActiveEp(epId)
    setPreview(null)
    setUploadErr(null)
    const ep = episodes.find(e => e.epId === epId)
    if (ep?.result) onParsed({ ...ep.result, episode: ep.epId, fileName: ep.fileName })
    else onParsed(null)
  }

  // ── Upload ───────────────────────────────────────────────────
  const processRaw = async (raw, fileName, epId) => {
    const result = parseScript(raw, { episodeId: epId })
    setPreview({ epId, fileName, result })
  }

  const handleFile = async (file, targetEp) => {
    if (!file) return
    const epId = targetEp || activeEp
    if (!epId) return
    setUploading(true); setUploadErr(null); setPreview(null)
    try {
      await processRaw(await file.text(), file.name, epId)
    } catch (err) {
      setUploadErr(`Erro: ${err.message}`)
    } finally { setUploading(false) }
  }

  // Smart drop: auto-create episodes from dropped FDX files
  const handleSmartDrop = async (e) => {
    e.preventDefault()
    const files = [...e.dataTransfer.files].filter(f => ACCEPT.split(',').some(ext => f.name.toLowerCase().endsWith(ext)))
    if (files.length === 0) return

    for (const file of files) {
      // Try to detect episode ID from filename (e.g. "DESDOBRADO_EP_01.fdx" → EP01)
      const epMatch = file.name.match(/EP[_\s-]?(\d+)/i)
      let epId = epMatch ? `EP${String(parseInt(epMatch[1], 10)).padStart(2, '0')}` : null

      // Check if episode slot exists, if not create one
      const existing = episodes.find(e => e.epId === epId)
      if (!existing) {
        if (!epId) epId = nextEpId(episodes)
        const slot = { epId, fileName: null, result: null }
        setEpisodes(prev => [...prev, slot])
      }
      setActiveEp(epId)

      // Parse and auto-confirm
      setUploading(true); setUploadErr(null)
      try {
        const raw = await file.text()
        const result = parseScript(raw, { episodeId: epId })
        // Auto-confirm: update episode and populate store
        setEpisodes(prev => prev.map(e => e.epId === epId ? { ...e, fileName: file.name, result } : e))
        const payload = { ...result, episode: epId, fileName: file.name }
        onParsed(payload)
        populateFromScript(payload)
      } catch (err) {
        setUploadErr(`Erro ${epId}: ${err.message}`)
      } finally { setUploading(false) }
    }
  }

  const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }

  // ── Confirmar parse → popula store ──────────────────────────
  const handleConfirm = () => {
    if (!preview) return
    setEpisodes(prev => prev.map(e =>
      e.epId === preview.epId ? { ...e, fileName: preview.fileName, result: preview.result } : e
    ))
    const payload = { ...preview.result, episode: preview.epId, fileName: preview.fileName }
    onParsed(payload)
    populateFromScript(payload)
    setPreview(null)
  }

  const activeEpData = episodes.find(e => e.epId === activeEp)

  // ── Totals ───────────────────────────────────────────────────
  const loaded    = episodes.filter(e => e.result)
  const totalScenes = loaded.reduce((s, e) => s + (e.result?.metadata?.totalScenes || 0), 0)
  const totalChars  = loaded.reduce((s, e) => s + (e.result?.metadata?.characters?.length || 0), 0)

  return (
    <div className={styles.root} onDrop={handleSmartDrop} onDragOver={e => e.preventDefault()}>

      {/* ── Sidebar ── */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarLabel}>Episódios</span>
        </div>

        <div className={styles.epList}>
          {episodes.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Adiciona um episódio<br />para começar
              </p>
            </div>
          )}
          {episodes.map(ep => (
            <div
              key={ep.epId}
              className={`${styles.epRow} ${activeEp === ep.epId ? styles.epRowActive : ''}`}
              onClick={() => selectEp(ep.epId)}
            >
              <span className={`${styles.epDot} ${ep.result ? styles.epDotLoaded : ''}`} />
              <span className={styles.epId}>{ep.epId}</span>
              {ep.result && (
                <span className={styles.epSceneCount}>
                  {ep.result.metadata?.totalScenes ?? 0}
                </span>
              )}
              <button
                className={styles.epClose}
                onClick={e => { e.stopPropagation(); removeEpisode(ep.epId) }}
                title="Remover episódio"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>

        {episodes.length < MAX_EPISODES && (
          <button className={styles.addBtn} onClick={addEpisode}>
            <Plus size={14} />
            Novo episódio
          </button>
        )}

        {loaded.length > 0 && (
          <div className={styles.totals}>
            <div className={styles.totalsGrid}>
              <div className={styles.totalItem}>
                <span className={styles.totalValue}>{loaded.length}</span>
                <span className={styles.totalLabel}>ep.</span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.totalValue}>{totalScenes}</span>
                <span className={styles.totalLabel}>cenas</span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.totalValue}>{totalChars}</span>
                <span className={styles.totalLabel}>pers.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Workspace ── */}
      <div className={styles.workspace}>
        <div className={styles.workspaceScroll}>
          {!activeEp && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <FileText size={22} color="var(--text-muted)" />
              </div>
              <p className={styles.emptyTitle}>Nenhum episódio seleccionado</p>
              <p className={styles.emptySub}>Cria um episódio no painel da esquerda<br />e arrasta o ficheiro de guião</p>
            </div>
          )}

          {activeEp && activeEpData && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeEp}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
              >
                {/* Drop zone — episódio vazio */}
                {!activeEpData.result && !preview && (
                  <div
                    className={styles.dropZone}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    data-local-drop="true"
                    onClick={() => inputRef.current?.click()}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept={ACCEPT}
                      style={{ display: 'none' }}
                      onChange={e => handleFile(e.target.files[0])}
                    />
                    {uploading ? (
                      <div className={styles.loading}>
                        <div className={styles.spinner} />
                        <span>A processar {activeEp}…</span>
                      </div>
                    ) : (
                      <>
                        <div className={styles.dropZoneIcon}>
                          <Upload size={20} color="var(--mod-script)" />
                        </div>
                        <p className={styles.dropTitle}>
                          Arrastar guião para <span className={styles.dropEp}>{activeEp}</span>
                        </p>
                        <p className={styles.dropSub}>ou clicar para seleccionar ficheiro</p>
                        <div className={styles.dropFormats}>
                          {FORMATS.map(f => <span key={f} className={styles.fmtPill}>{f}</span>)}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Preview antes de confirmar */}
                {preview?.epId === activeEp && (
                  <div className={styles.previewBox}>
                    <div className={styles.previewHeader}>
                      <div className={styles.previewLeft}>
                        <CheckCircle size={15} color="var(--mod-script)" />
                        <strong style={{ fontSize: 'var(--text-sm)', fontFamily: 'DM Mono, monospace' }}>
                          {preview.epId}
                        </strong>
                        <span className={styles.previewFile}>{preview.fileName}</span>
                        <Badge variant="ok"   size="sm">{preview.result.metadata?.totalScenes ?? 0} cenas</Badge>
                        <Badge variant="info" size="sm">{preview.result.metadata?.totalDialogues ?? 0} diálogos</Badge>
                        <Badge
                          variant={preview.result.metadata?.confidence === 'alta' ? 'ok' : 'warn'}
                          size="sm"
                        >
                          confiança {preview.result.metadata?.confidence ?? '?'}
                        </Badge>
                      </div>
                      <div className={styles.previewBtns}>
                        <button className={styles.btnCancel} onClick={() => { setPreview(null); setUploadErr(null) }}>
                          <X size={13} /> Cancelar
                        </button>
                        <button className={styles.btnConfirm} onClick={handleConfirm}>
                          <CheckCircle size={13} /> Confirmar
                        </button>
                      </div>
                    </div>

                    <div className={styles.charList}>
                      <span className={styles.charListLabel}>Personagens:</span>
                      {preview.result?.metadata?.characters?.slice(0, 12).map(c => (
                        <span key={c.name} className={styles.charTag}>{c.name}</span>
                      ))}
                      {(preview.result?.metadata?.characters?.length || 0) > 12 && (
                        <span className={styles.charTag}>
                          +{preview.result?.metadata?.characters.length - 12}
                        </span>
                      )}
                    </div>

                    {/* Parse warnings banner */}
                    {preview.result?.metadata?.parseErrors?.length > 0 && (
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8,
                        padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#F5A623' }}>
                          <AlertTriangle size={12} />
                          {preview.result?.metadata?.parseErrors.length} aviso{preview.result?.metadata?.parseErrors.length > 1 ? 's' : ''} de parse — verificar antes de confirmar
                        </div>
                        {preview.result?.metadata?.parseErrors.map((err, i) => (
                          <div key={i} style={{
                            fontSize: 11, lineHeight: 1.4, paddingLeft: 18,
                            color: err.type === 'error' ? '#F87171' : err.type === 'warning' ? '#F5A623' : '#5B8DEF',
                          }}>
                            {err.type === 'error' ? '✗' : err.type === 'warning' ? '⚠' : 'ℹ'} {err.msg}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Guião carregado — visão geral */}
                {activeEpData.result && !preview && (
                  <div className={styles.loaded}>
                    <div className={styles.loadedTop}>
                      <div className={styles.loadedInfo}>
                        <CheckCircle size={14} color="var(--mod-script)" />
                        <span className={styles.loadedFile}>{activeEpData.fileName}</span>
                        <Badge variant="default" size="sm">{activeEpData.result?.metadata?.format}</Badge>
                      </div>
                      <button
                        className={styles.btnReplace}
                        onClick={() =>
                          setEpisodes(prev => prev.map(e =>
                            e.epId === activeEp ? { ...e, result: null, fileName: null } : e
                          ))
                        }
                      >
                        Substituir
                      </button>
                    </div>

                    {/* KPIs grandes */}
                    <div className={styles.statsRow}>
                      <KpiCard label="Cenas"       value={activeEpData.result?.metadata?.totalScenes ?? 0} />
                      <KpiCard label="Diálogos"    value={activeEpData.result?.metadata?.totalDialogues ?? 0} />
                      <KpiCard label="Personagens" value={activeEpData.result?.metadata?.characters?.length || 0} />
                      <KpiCard
                        label="Confiança"
                        value={activeEpData.result?.metadata?.confidence ?? '?'}
                        badge={activeEpData.result?.metadata?.confidence === 'alta' ? 'ok' : 'warn'}
                      />
                    </div>

                    {/* Grelha de personagens */}
                    {activeEpData.result?.metadata?.characters?.length > 0 && (
                      <div className={styles.charSection}>
                        <p className={styles.sectionTitle}>
                          Personagens — {activeEpData.result?.metadata?.characters.length}
                        </p>
                        <div className={styles.charGrid}>
                          {activeEpData.result?.metadata?.characters.map(c => (
                            <div key={c.name} className={styles.charItem}>
                              <div className={styles.charAvatar}>
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div className={styles.charInfo}>
                                <span className={styles.charName}>{c.name}</span>
                                <span className={styles.charMeta}>{c.scenes.length} cenas · {c.lineCount} palavras</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Parse warnings (persistent) */}
                    {activeEpData.result?.metadata?.parseErrors?.length > 0 && (
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12,
                        padding: '10px 14px', borderRadius: 8,
                        background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#F5A623' }}>
                          <AlertTriangle size={13} />
                          {activeEpData.result?.metadata?.parseErrors.length} aviso{activeEpData.result?.metadata?.parseErrors.length > 1 ? 's' : ''} — vai ao Diagnóstico para rever
                        </div>
                        {activeEpData.result?.metadata?.parseErrors.map((err, i) => (
                          <div key={i} style={{
                            fontSize: 11, lineHeight: 1.4, paddingLeft: 20,
                            color: err.type === 'error' ? '#F87171' : err.type === 'warning' ? '#F5A623' : '#5B8DEF',
                          }}>
                            {err.type === 'error' ? '✗' : err.type === 'warning' ? '⚠' : 'ℹ'} {err.msg}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {uploadErr && (
                  <div className={styles.errorMsg}>
                    <AlertTriangle size={13} /> {uploadErr}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, badge }) {
  return (
    <div className={styles.kpiCard}>
      <span className={styles.kpiLabel}>{label}</span>
      {badge
        ? <Badge variant={badge} size="sm">{value}</Badge>
        : <span className={styles.kpiValue}>{value}</span>
      }
    </div>
  )
}
