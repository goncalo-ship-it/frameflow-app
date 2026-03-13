// DailiesView.jsx — Tab "Dailies" no Live Board
// Import de ZIPs de câmara, review multi-câmara, associar clips a cenas
// Audio analysis com clap detection e cut points
// Persistido no store (dailies.cameras, dailies.clipMeta, dailies.audioTracks)

import { useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Camera, Film, Star, StarOff, MessageSquare,
  ChevronDown, ChevronUp, Check, X, Trash2, Maximize2,
  Link2, Unlink, Download, Music, Scissors, Volume2,
  Aperture, Focus, MapPin,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { parseMultipleCameras } from './utils/sonyMediaParser.js'
import { exportFCPXML, exportEDL, exportALE } from './utils/dailiesExporter.js'
import { analyzeAudio, matchAudioToClips, applyCutPointsToClips } from './utils/audioAnalyzer.js'
import { extractRTMDPreview, formatRTMDSummary } from './utils/rtmdParser.js'
import styles from './Dailies.module.css'

// Rating labels
const RATING_LABELS = { ok: 'BOM', nok: 'NOK', maybe: 'MAYBE', selected: 'SELECCIONADO' }
const RATING_COLORS = {
  ok: 'var(--health-green)',
  nok: 'var(--health-red)',
  maybe: 'var(--health-yellow)',
  selected: 'var(--accent)',
}

/**
 * DailiesView
 * @param {object} props
 * @param {object} props.shooting — shootingStore
 */
export function DailiesView({ shooting }) {
  // ── Store (persistent) ─────────────────────────────────────────
  const cameras = useStore(s => s.dailies.cameras)
  const clipMeta = useStore(s => s.dailies.clipMeta)
  const audioTracks = useStore(s => s.dailies.audioTracks)
  const addDailiesCamera = useStore(s => s.addDailiesCamera)
  const updateClipMeta = useStore(s => s.updateClipMeta)
  const addAudioTrack = useStore(s => s.addAudioTrack)
  const clearDailies = useStore(s => s.clearDailies)

  // ── Local state (UI only) ──────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedClip, setExpandedClip] = useState(null)
  const [filterRating, setFilterRating] = useState('all')
  const [filterScene, setFilterScene] = useState('all')
  const [compareMode, setCompareMode] = useState(false)
  const [compareClips, setCompareClips] = useState([])
  const [showAudioPanel, setShowAudioPanel] = useState(false)
  const [rtmdLoading, setRtmdLoading] = useState(null) // clipId being parsed
  const fileInputRef = useRef(null)
  const audioInputRef = useRef(null)
  const mp4InputRef = useRef(null)
  const mp4TargetClipRef = useRef(null)

  // Available scenes from shooting day
  const sceneOptions = useMemo(() => {
    if (!shooting?.sceneOrder) return []
    return shooting.sceneOrder.map(id => {
      const s = shooting.scenes[id]
      if (!s) return null
      const num = s.sceneNumber || s.id
      return { id, label: `Sc.${num} — ${s.location || '?'}` }
    }).filter(Boolean)
  }, [shooting?.sceneOrder, shooting?.scenes])

  // ── Import ZIPs ────────────────────────────────────────────────
  const handleImport = useCallback(async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const parsed = await parseMultipleCameras(files)
      for (const cam of parsed) {
        if (cam.error) {
          setError(prev => (prev ? prev + '\n' : '') + `${cam.camera}: ${cam.error}`)
        }
        // Save to store (thumbnailUrl is base64, persists; strip thumbnailBlob if present)
        const camForStore = {
          ...cam,
          clips: cam.clips.map(c => {
            const { thumbnailBlob, ...rest } = c
            return rest
          }),
        }
        addDailiesCamera(camForStore)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [addDailiesCamera])

  // ── Import Audio WAV/BWF ───────────────────────────────────────
  const handleAudioImport = useCallback(async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setAudioLoading(true)
    setError(null)

    try {
      const fps = cameras[0]?.clips[0]?.fps || 25

      for (const file of files) {
        const result = await analyzeAudio(file, { fps })
        addAudioTrack(result)

        // Auto-match to clips
        if (cameras.length > 0) {
          const matched = matchAudioToClips([result], cameras, fps)
          const cutPoints = applyCutPointsToClips(matched, clipMeta)

          // Apply cut points to matched clips
          for (const [clipId, meta] of Object.entries(cutPoints)) {
            if (meta.inPoint !== undefined) {
              updateClipMeta(clipId, {
                inPoint: meta.inPoint,
                outPoint: meta.outPoint,
                inPointInsert: meta.inPointInsert,
                clapFrame: meta.clapFrame,
                clapTimeSec: meta.clapTimeSec,
                audioTrackId: meta.audioTrackId,
              })
            }
          }
        }
      }
    } catch (err) {
      setError(`Erro ao analisar áudio: ${err.message}`)
    } finally {
      setAudioLoading(false)
      if (audioInputRef.current) audioInputRef.current.value = ''
    }
  }, [cameras, clipMeta, addAudioTrack, updateClipMeta])

  // ── Import MP4 RTMD metadata ──────────────────────────────────
  const handleRTMDImport = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const clipId = mp4TargetClipRef.current
    if (!clipId) return

    setRtmdLoading(clipId)
    try {
      const result = await extractRTMDPreview(file)
      if (result.found) {
        updateClipMeta(clipId, { rtmd: result.summary, rtmdFps: result.fps, rtmdFrames: result.frameCount })
      } else {
        setError('Sem metadata RTMD neste ficheiro. Apenas Sony XAVC com RTMD track.')
      }
    } catch (err) {
      setError(`Erro RTMD: ${err.message}`)
    } finally {
      setRtmdLoading(null)
      if (mp4InputRef.current) mp4InputRef.current.value = ''
    }
  }, [updateClipMeta])

  const triggerRTMDImport = useCallback((clipId) => {
    mp4TargetClipRef.current = clipId
    mp4InputRef.current?.click()
  }, [])

  // ── Clip metadata actions ──────────────────────────────────────
  const setClipRating = useCallback((clipId, rating) => {
    const current = clipMeta[clipId]?.rating
    updateClipMeta(clipId, { rating: current === rating ? null : rating })
  }, [clipMeta, updateClipMeta])

  const setClipNotes = useCallback((clipId, notes) => {
    updateClipMeta(clipId, { notes })
  }, [updateClipMeta])

  const setClipScene = useCallback((clipId, sceneId) => {
    updateClipMeta(clipId, { sceneId: sceneId || null })
  }, [updateClipMeta])

  const toggleSelected = useCallback((clipId) => {
    updateClipMeta(clipId, { selected: !clipMeta[clipId]?.selected })
  }, [clipMeta, updateClipMeta])

  // ── Compare mode ───────────────────────────────────────────────
  const toggleCompare = useCallback((clipId) => {
    setCompareClips(prev => {
      if (prev.includes(clipId)) return prev.filter(id => id !== clipId)
      if (prev.length >= 2) return [prev[1], clipId]
      return [...prev, clipId]
    })
  }, [])

  // Find clip by id across cameras
  const findClip = useCallback((clipId) => {
    for (const cam of cameras) {
      const clip = cam.clips.find(c => c.id === clipId)
      if (clip) return { ...clip, camera: cam.camera }
    }
    return null
  }, [cameras])

  // ── Filter clips ───────────────────────────────────────────────
  const filterClip = useCallback((clip) => {
    const meta = clipMeta[clip.id]
    if (filterRating !== 'all') {
      if (filterRating === 'selected' && !meta?.selected) return false
      if (filterRating === 'unrated' && meta?.rating) return false
      if (filterRating !== 'selected' && filterRating !== 'unrated' && meta?.rating !== filterRating) return false
    }
    if (filterScene !== 'all') {
      if (filterScene === 'unlinked' && meta?.sceneId) return false
      if (filterScene !== 'unlinked' && meta?.sceneId !== filterScene) return false
    }
    return true
  }, [clipMeta, filterRating, filterScene])

  // ── Stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let total = 0, rated = 0, selected = 0, linked = 0, withCutPoints = 0
    for (const cam of cameras) {
      for (const clip of cam.clips) {
        total++
        const m = clipMeta[clip.id]
        if (m?.rating) rated++
        if (m?.selected) selected++
        if (m?.sceneId) linked++
        if (m?.inPoint !== undefined) withCutPoints++
      }
    }
    return { total, rated, selected, linked, withCutPoints }
  }, [cameras, clipMeta])

  // ── Export ──────────────────────────────────────────────────────
  const handleExportFCPXML = useCallback(() => {
    const xml = exportFCPXML(cameras, clipMeta, shooting?.sceneOrder, shooting?.scenes, {
      projectName: 'FrameFlow Dailies',
      fps: cameras[0]?.clips[0]?.fps || 25,
      audioTracks,
    })
    downloadFile(xml, 'dailies_multicam.fcpxml', 'application/xml')
  }, [cameras, clipMeta, shooting, audioTracks])

  const handleExportEDL = useCallback(() => {
    const edls = exportEDL(cameras, clipMeta, shooting?.sceneOrder, shooting?.scenes, {
      fps: cameras[0]?.clips[0]?.fps || 25,
    })
    const entries = Object.entries(edls)
    if (entries.length === 1) {
      downloadFile(entries[0][1], `dailies_${entries[0][0].replace(/\s+/g, '_')}.edl`, 'text/plain')
    } else {
      for (const [camName, edl] of entries) {
        downloadFile(edl, `dailies_${camName.replace(/\s+/g, '_')}.edl`, 'text/plain')
      }
    }
  }, [cameras, clipMeta, shooting])

  const handleExportALE = useCallback(() => {
    const ale = exportALE(cameras, clipMeta, shooting?.sceneOrder, shooting?.scenes, {
      fps: cameras[0]?.clips[0]?.fps || 25,
    })
    downloadFile(ale, 'dailies_multicam.ale', 'text/plain')
  }, [cameras, clipMeta, shooting])

  // ── Clear all ──────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    if (!window.confirm('Limpar todos os dailies? Esta acção não pode ser desfeita.')) return
    clearDailies()
    setCompareClips([])
    setExpandedClip(null)
  }, [clearDailies])

  // ── Empty state ────────────────────────────────────────────────
  if (cameras.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Camera size={40} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
        <h2 className={styles.emptyTitle}>Dailies</h2>
        <p className={styles.emptySub}>
          Importa os cartões de câmara (ZIP) para rever footage multi-câmara
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          multiple
          style={{ display: 'none' }}
          onChange={handleImport}
        />

        <button
          className={styles.importBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <Upload size={16} />
          {loading ? 'A importar…' : 'Importar ZIPs de câmara'}
        </button>

        <p className={styles.emptyHint}>
          Suporta Sony FX6, FX3, Venice, Alpha (estrutura MEDIAPRO.XML).<br />
          Podes importar várias câmaras de uma vez.
        </p>

        {error && <p className={styles.errorText}>{error}</p>}
      </div>
    )
  }

  // ── Compare view ───────────────────────────────────────────────
  if (compareMode && compareClips.length === 2) {
    const clipA = findClip(compareClips[0])
    const clipB = findClip(compareClips[1])
    return (
      <div className={styles.compareContainer}>
        <div className={styles.compareHeader}>
          <h3 className={styles.compareTitle}>Comparar</h3>
          <button className={styles.compareExit} onClick={() => { setCompareMode(false); setCompareClips([]) }}>
            <X size={16} /> Sair
          </button>
        </div>
        <div className={styles.compareGrid}>
          {[clipA, clipB].map((clip, i) => clip && (
            <div key={i} className={styles.comparePane}>
              <div className={styles.compareCamLabel}>{clip.camera}</div>
              {clip.thumbnailUrl && (
                <img src={clip.thumbnailUrl} alt={clip.filename} className={styles.compareThumb} />
              )}
              <div className={styles.compareInfo}>
                <span className={styles.compareFilename}>{clip.filename}</span>
                <span className={styles.compareDur}>{clip.durationDisplay} · {clip.resolution}</span>
                {clipMeta[clip.id]?.inPoint !== undefined && (
                  <span className={styles.cutPointBadge}>
                    <Scissors size={10} /> IN {clipMeta[clip.id].inPoint}s → OUT {clipMeta[clip.id].outPoint}s
                  </span>
                )}
              </div>
              <div className={styles.ratingRow}>
                {['ok', 'nok', 'maybe', 'selected'].map(r => (
                  <button
                    key={r}
                    className={`${styles.ratingBtn} ${clipMeta[clip.id]?.rating === r ? styles.ratingBtnActive : ''}`}
                    style={clipMeta[clip.id]?.rating === r ? { borderColor: RATING_COLORS[r], color: RATING_COLORS[r] } : {}}
                    onClick={() => setClipRating(clip.id, r)}
                  >
                    {RATING_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Main view ──────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h3 className={styles.toolbarTitle}>
            Dailies
            <span className={styles.toolbarCount}>{stats.total} clips · {cameras.length} câmara{cameras.length > 1 ? 's' : ''}</span>
          </h3>
          {stats.selected > 0 && (
            <span className={styles.selectedBadge}>
              <Star size={11} /> {stats.selected} seleccionado{stats.selected > 1 ? 's' : ''}
            </span>
          )}
          {stats.withCutPoints > 0 && (
            <span className={styles.selectedBadge} style={{ borderColor: 'var(--health-green)', color: 'var(--health-green)' }}>
              <Scissors size={11} /> {stats.withCutPoints} com cut points
            </span>
          )}
        </div>

        <div className={styles.toolbarRight}>
          {/* Filters */}
          <select
            className={styles.filterSelect}
            value={filterRating}
            onChange={e => setFilterRating(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="ok">BOM</option>
            <option value="nok">NOK</option>
            <option value="maybe">MAYBE</option>
            <option value="selected">Seleccionados</option>
            <option value="unrated">Sem rating</option>
          </select>

          <select
            className={styles.filterSelect}
            value={filterScene}
            onChange={e => setFilterScene(e.target.value)}
          >
            <option value="all">Todas as cenas</option>
            <option value="unlinked">Sem cena</option>
            {sceneOptions.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          <button
            className={`${styles.toolbarBtn} ${compareMode ? styles.toolbarBtnActive : ''}`}
            onClick={() => { setCompareMode(!compareMode); setCompareClips([]) }}
          >
            <Maximize2 size={14} /> Comparar
          </button>

          {/* Feature 3: Bulk rating actions */}
          <select
            className={styles.filterSelect}
            value=""
            onChange={e => {
              if (!e.target.value) return
              const action = e.target.value
              for (const cam of cameras) {
                for (const clip of cam.clips) {
                  if (!filterClip(clip)) continue
                  if (action === 'select-all') updateClipMeta(clip.id, { selected: true })
                  if (action === 'deselect-all') updateClipMeta(clip.id, { selected: false })
                  if (action === 'rate-ok-selected') {
                    if (clipMeta[clip.id]?.selected) updateClipMeta(clip.id, { rating: 'ok' })
                  }
                }
              }
              e.target.selectedIndex = 0
            }}
          >
            <option value="">Acções…</option>
            <option value="select-all">Seleccionar todos (filtrados)</option>
            <option value="deselect-all">Desseleccionar todos</option>
            <option value="rate-ok-selected">Marcar seleccionados como BOM</option>
          </select>

          {/* Audio import */}
          <input
            ref={audioInputRef}
            type="file"
            accept=".wav,.bwf"
            multiple
            style={{ display: 'none' }}
            onChange={handleAudioImport}
          />
          <button
            className={`${styles.toolbarBtn} ${audioTracks.length > 0 ? styles.toolbarBtnActive : ''}`}
            onClick={() => setShowAudioPanel(!showAudioPanel)}
            title="Áudio / Clap detection"
          >
            <Music size={14} /> Áudio{audioTracks.length > 0 ? ` (${audioTracks.length})` : ''}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            multiple
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <button className={styles.toolbarBtn} onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <Upload size={14} /> {loading ? '…' : 'Importar'}
          </button>

          {/* Export dropdown */}
          <div className={styles.exportGroup}>
            <button className={styles.toolbarBtn} onClick={handleExportFCPXML} title="FCPXML multicâmara (Premiere/FCP)">
              <Download size={14} /> FCPXML
            </button>
            <button className={styles.toolbarBtn} onClick={handleExportEDL} title="EDL por câmara (DaVinci Resolve)">
              <Download size={14} /> EDL
            </button>
            <button className={styles.toolbarBtn} onClick={handleExportALE} title="ALE multicâmara (Avid)">
              <Download size={14} /> ALE
            </button>
          </div>

          <button className={styles.toolbarBtn} onClick={handleClear} title="Limpar tudo">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Hidden MP4 input for RTMD extraction */}
      <input
        ref={mp4InputRef}
        type="file"
        accept=".mp4,.mxf,.mov"
        style={{ display: 'none' }}
        onChange={handleRTMDImport}
      />

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Audio panel */}
      <AnimatePresence>
        {showAudioPanel && (
          <motion.div
            className={styles.audioPanel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.audioPanelHeader}>
              <h4 className={styles.audioPanelTitle}>
                <Volume2 size={14} /> Áudio & Clap Detection
              </h4>
              <button
                className={styles.toolbarBtn}
                onClick={() => audioInputRef.current?.click()}
                disabled={audioLoading}
              >
                <Upload size={14} /> {audioLoading ? 'A analisar…' : 'Importar WAV/BWF'}
              </button>
            </div>

            {audioTracks.length === 0 ? (
              <p className={styles.audioEmptyHint}>
                Importa ficheiros WAV/BWF com timecode para detecção automática de clap e cut points.
                O áudio é analisado para encontrar o transiente do clap (slate) e calcular pontos de corte.
              </p>
            ) : (
              <div className={styles.audioTrackList}>
                {audioTracks.map(track => (
                  <div key={track.id} className={styles.audioTrackCard}>
                    <div className={styles.audioTrackInfo}>
                      <span className={styles.audioTrackName}>
                        <Music size={12} /> {track.filename}
                        {track.scene && <span className={styles.audioScene}>{track.scene}{track.take ? ` T${track.take}` : ''}</span>}
                        {track.circled && <span className={styles.audioCircled}>BOM</span>}
                      </span>
                      <span className={styles.audioTrackMeta}>
                        {track.durationDisplay} · {track.sampleRate / 1000}kHz · {track.channels}ch
                        {track.timecodeStart && ` · TC ${track.timecodeStart}`}
                        {track.originator && ` · ${track.originator?.split(':')[0]}`}
                      </span>
                    </div>
                    {track.clap?.found ? (
                      <div className={styles.audioClap}>
                        <span className={styles.audioClapFound}>
                          <Check size={12} /> Clap detectado: {track.clap.timeDisplay}
                          <span className={styles.audioClapConf}>
                            ({Math.round(track.clap.confidence * 100)}% confiança)
                          </span>
                        </span>
                        <div className={styles.audioCutPoints}>
                          <span><Scissors size={10} /> IN Normal: {track.cutPoints.inNormal}s (frame {track.cutPoints.inNormalFrame})</span>
                          <span><Scissors size={10} /> IN Insert: {track.cutPoints.inInsert}s (frame {track.cutPoints.inInsertFrame})</span>
                          <span>OUT: {track.cutPoints.out}s (frame {track.cutPoints.outFrame})</span>
                        </div>
                        {track.linkedClipIds?.length > 0 && (
                          <span className={styles.audioLinked}>
                            <Link2 size={10} /> Linked a {track.linkedClipIds.length} clip{track.linkedClipIds.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {/* Feature 4: Audio waveform mini-visualization */}
                        <div style={{
                          height: 16, width: '100%', background: 'var(--bg-surface)',
                          borderRadius: 2, position: 'relative', overflow: 'hidden', marginTop: 2,
                        }}>
                          {/* Duration bar */}
                          <div style={{ position: 'absolute', inset: 0, background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }} />
                          {/* Clap position marker */}
                          <div style={{
                            position: 'absolute', top: 0, bottom: 0,
                            left: `${(track.clap.timeSec / track.durationSec) * 100}%`,
                            width: 2, background: 'var(--health-yellow)',
                          }} />
                          {/* IN point marker */}
                          {track.cutPoints && (
                            <>
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${(track.cutPoints.inNormal / track.durationSec) * 100}%`,
                                width: 1, background: 'var(--health-green)', opacity: 0.8,
                              }} />
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${(track.cutPoints.out / track.durationSec) * 100}%`,
                                width: 1, background: 'var(--health-red)', opacity: 0.8,
                              }} />
                              {/* Usable range highlight */}
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${(track.cutPoints.inNormal / track.durationSec) * 100}%`,
                                width: `${((track.cutPoints.out - track.cutPoints.inNormal) / track.durationSec) * 100}%`,
                                background: 'color-mix(in srgb, var(--health-green) 20%, transparent)',
                              }} />
                            </>
                          )}
                          {/* Labels */}
                          <div style={{ position: 'absolute', top: 1, left: 3, fontSize: 7, color: 'var(--text-muted)', lineHeight: 1 }}>
                            Clap
                          </div>
                          <div style={{ position: 'absolute', top: 1, right: 3, fontSize: 7, color: 'var(--text-muted)', lineHeight: 1 }}>
                            {track.durationDisplay}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className={styles.audioClapNone}>Sem clap detectado</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera columns */}
      <div className={styles.cameraGrid} style={{ gridTemplateColumns: `repeat(${cameras.length}, 1fr)` }}>
        {cameras.map(cam => (
          <div key={cam.camera} className={styles.cameraCol}>
            {/* Camera header */}
            <div className={styles.cameraHeader}>
              <Camera size={14} />
              <span className={styles.cameraName}>{cam.camera}</span>
              <span className={styles.cameraMeta}>
                {cam.cameraModel} · {cam.clips.filter(filterClip).length}/{cam.clipCount} clips
                {(() => {
                  const rated = cam.clips.filter(c => clipMeta[c.id]?.rating).length
                  const selected = cam.clips.filter(c => clipMeta[c.id]?.selected).length
                  return rated > 0 ? ` · ${rated} rated${selected > 0 ? ` · ${selected} sel.` : ''}` : ''
                })()}
              </span>
              {/* Feature 2: Bulk scene link for this camera */}
              <select
                style={{
                  marginLeft: 'auto', padding: '2px 6px', fontSize: 9,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                value=""
                onChange={e => {
                  if (!e.target.value) return
                  const sceneId = e.target.value
                  cam.clips.forEach(c => {
                    if (!clipMeta[c.id]?.sceneId) {
                      updateClipMeta(c.id, { sceneId })
                    }
                  })
                  e.target.value = ''
                }}
              >
                <option value="">Associar todos…</option>
                {sceneOptions.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Clips */}
            <div className={styles.clipList}>
              {cam.clips.filter(filterClip).map((clip, i) => {
                const meta = clipMeta[clip.id] || {}
                const isExpanded = expandedClip === clip.id
                const thumbUrl = clip.thumbnailUrl

                return (
                  <motion.div
                    key={clip.id}
                    className={`${styles.clipCard} ${meta.selected ? styles.clipCardSelected : ''} ${compareMode && compareClips.includes(clip.id) ? styles.clipCardCompare : ''}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    layout
                  >
                    {/* Thumbnail + overlay */}
                    <div className={styles.clipThumbWrap} onClick={() => setExpandedClip(isExpanded ? null : clip.id)}>
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={clip.filename} className={styles.clipThumb} />
                      ) : (
                        <div className={styles.clipThumbPlaceholder}>
                          <Film size={20} />
                        </div>
                      )}
                      <span className={styles.clipDurBadge}>{clip.durationDisplay}</span>
                      {meta.rating && (
                        <span className={styles.clipRatingBadge} style={{ background: RATING_COLORS[meta.rating] }}>
                          {RATING_LABELS[meta.rating]}
                        </span>
                      )}
                      {meta.selected && (
                        <span className={styles.clipStarBadge}><Star size={12} /></span>
                      )}
                      {meta.inPoint !== undefined && (
                        <span className={styles.clipCutBadge}>
                          <Scissors size={9} />
                        </span>
                      )}
                      {meta.rtmd && (
                        <span className={styles.rtmdBadge}>
                          <Aperture size={8} /> RTMD
                        </span>
                      )}
                    </div>

                    {/* Info row */}
                    <div className={styles.clipInfo}>
                      <span className={styles.clipFilename}>{clip.filename}</span>
                      <span className={styles.clipMeta}>
                        {clip.resolution} · {clip.fpsLabel} · {clip.channels}ch
                      </span>
                      {meta.sceneId && (
                        <span className={styles.clipLinkedScene}>
                          <Link2 size={10} /> {sceneOptions.find(s => s.id === meta.sceneId)?.label || meta.sceneId}
                        </span>
                      )}
                      {meta.inPoint !== undefined && (
                        <span className={styles.clipCutInfo}>
                          <Scissors size={10} /> IN {meta.inPoint}s → OUT {meta.outPoint}s
                          {meta.clapTimeSec && ` · Clap@${meta.clapTimeSec}s`}
                        </span>
                      )}
                      {/* RTMD mini summary on clip card */}
                      {meta.rtmd && (() => {
                        const items = formatRTMDSummary(meta.rtmd)
                        const key3 = items.slice(0, 3)
                        return key3.length > 0 ? (
                          <span style={{ fontSize: 9, color: 'var(--accent-light)', marginTop: 2, display: 'block' }}>
                            <Aperture size={9} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                            {key3.map(i => i.value).join(' · ')}
                          </span>
                        ) : null
                      })()}
                    </div>

                    {/* Compare checkbox */}
                    {compareMode && (
                      <button
                        className={`${styles.compareCheck} ${compareClips.includes(clip.id) ? styles.compareCheckActive : ''}`}
                        onClick={() => toggleCompare(clip.id)}
                      >
                        {compareClips.includes(clip.id) ? <Check size={12} /> : <span className={styles.compareCheckEmpty} />}
                      </button>
                    )}

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className={styles.clipExpanded}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Rating buttons */}
                          <div className={styles.ratingRow}>
                            {['ok', 'nok', 'maybe'].map(r => (
                              <button
                                key={r}
                                className={`${styles.ratingBtn} ${meta.rating === r ? styles.ratingBtnActive : ''}`}
                                style={meta.rating === r ? { borderColor: RATING_COLORS[r], color: RATING_COLORS[r] } : {}}
                                onClick={() => setClipRating(clip.id, r)}
                              >
                                {RATING_LABELS[r]}
                              </button>
                            ))}
                            <button
                              className={`${styles.ratingBtn} ${meta.selected ? styles.ratingBtnActive : ''}`}
                              style={meta.selected ? { borderColor: RATING_COLORS.selected, color: RATING_COLORS.selected } : {}}
                              onClick={() => toggleSelected(clip.id)}
                            >
                              {meta.selected ? <Star size={12} /> : <StarOff size={12} />}
                            </button>
                          </div>

                          {/* Feature 1: Cut points info — editable */}
                          {meta.inPoint !== undefined && (
                            <div className={styles.cutPointsDetail}>
                              <div className={styles.cutPointsRow}>
                                <span className={styles.cutPointLabel}>IN Normal</span>
                                <input
                                  type="number" step="0.1" min="0"
                                  className={styles.cutPointInput}
                                  value={meta.inPoint}
                                  onChange={e => updateClipMeta(clip.id, { inPoint: parseFloat(e.target.value) || 0 })}
                                  style={{ width: 60, padding: '2px 4px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--health-green)', fontSize: 10, textAlign: 'right' }}
                                />
                                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>s</span>
                              </div>
                              {meta.inPointInsert !== undefined && (
                                <div className={styles.cutPointsRow}>
                                  <span className={styles.cutPointLabel}>IN Insert</span>
                                  <input
                                    type="number" step="0.1" min="0"
                                    className={styles.cutPointInput}
                                    value={meta.inPointInsert}
                                    onChange={e => updateClipMeta(clip.id, { inPointInsert: parseFloat(e.target.value) || 0 })}
                                    style={{ width: 60, padding: '2px 4px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--health-green)', fontSize: 10, textAlign: 'right' }}
                                  />
                                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>s</span>
                                </div>
                              )}
                              <div className={styles.cutPointsRow}>
                                <span className={styles.cutPointLabel}>OUT</span>
                                <input
                                  type="number" step="0.1" min="0"
                                  className={styles.cutPointInput}
                                  value={meta.outPoint}
                                  onChange={e => updateClipMeta(clip.id, { outPoint: parseFloat(e.target.value) || 0 })}
                                  style={{ width: 60, padding: '2px 4px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--health-green)', fontSize: 10, textAlign: 'right' }}
                                />
                                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>s</span>
                              </div>
                              {meta.clapTimeSec && (
                                <div className={styles.cutPointsRow}>
                                  <span className={styles.cutPointLabel}>Clap</span>
                                  <span className={styles.cutPointValue}>{meta.clapTimeSec}s (frame {meta.clapFrame})</span>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Feature 1: Add cut points manually */}
                          {meta.inPoint === undefined && (
                            <button
                              onClick={() => updateClipMeta(clip.id, { inPoint: 2.0, outPoint: Math.max(2, clip.durationSec - 1), inPointInsert: 1.0 })}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 8px', background: 'var(--bg-elevated)',
                                border: '1px dashed var(--health-green)', borderRadius: 'var(--radius-sm)',
                                color: 'var(--health-green)', fontSize: 10, cursor: 'pointer', fontWeight: 600,
                              }}
                            >
                              <Scissors size={10} /> Adicionar cut points manualmente
                            </button>
                          )}

                          {/* RTMD metadata panel */}
                          {meta.rtmd ? (
                            <div className={styles.rtmdPanel}>
                              {formatRTMDSummary(meta.rtmd).map(item => (
                                <div key={item.label} className={styles.rtmdTag}>
                                  <span className={styles.rtmdTagLabel}>{item.label}</span>
                                  <span className={styles.rtmdTagValue}>{item.value}</span>
                                </div>
                              ))}
                              {meta.rtmd.gps && (
                                <a
                                  className={styles.rtmdGps}
                                  href={`https://www.google.com/maps?q=${meta.rtmd.gps.lat},${meta.rtmd.gps.lon}`}
                                  target="_blank"
                                  rel="noopener"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <MapPin size={9} /> Ver no mapa
                                </a>
                              )}
                            </div>
                          ) : (
                            <button
                              className={styles.rtmdImportBtn}
                              onClick={() => triggerRTMDImport(clip.id)}
                              disabled={rtmdLoading === clip.id}
                            >
                              <Aperture size={10} />
                              {rtmdLoading === clip.id ? 'A extrair RTMD…' : 'Importar metadata (MP4)'}
                            </button>
                          )}

                          {/* Scene link */}
                          <div className={styles.sceneLinkRow}>
                            <Link2 size={12} />
                            <select
                              className={styles.sceneSelect}
                              value={meta.sceneId || ''}
                              onChange={e => setClipScene(clip.id, e.target.value)}
                            >
                              <option value="">Associar a cena…</option>
                              {sceneOptions.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                            {meta.sceneId && (
                              <button className={styles.unlinkBtn} onClick={() => setClipScene(clip.id, null)}>
                                <Unlink size={12} />
                              </button>
                            )}
                          </div>

                          {/* Notes */}
                          <div className={styles.notesRow}>
                            <MessageSquare size={12} />
                            <input
                              className={styles.notesInput}
                              placeholder="Notas…"
                              value={meta.notes || ''}
                              onChange={e => setClipNotes(clip.id, e.target.value)}
                            />
                          </div>

                          {/* Tech info */}
                          <div className={styles.techInfo}>
                            <span>UMID: {clip.umid?.slice(-12)}</span>
                            <span>Codec: {clip.videoType}</span>
                            <span>Audio: {clip.audioType} {clip.channels}ch</span>
                            {clip.createdAt && <span>Data: {clip.createdAt}</span>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Compare mode footer */}
      {compareMode && compareClips.length < 2 && (
        <div className={styles.compareFooter}>
          Selecciona {2 - compareClips.length} clip{compareClips.length === 0 ? 's' : ''} para comparar
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
