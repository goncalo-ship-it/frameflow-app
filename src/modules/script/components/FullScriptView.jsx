// FullScriptView — Leitura completa do guião para o realizador
// Liquid Glass design · Sidebar navigator · Screenplay formatting · Deep-link
// Mostra TODO o texto — nada removido

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronRight, ChevronsUpDown, ChevronsDownUp,
  Search, Sun, Moon, Sunrise, Sunset as SunsetIcon, X,
  Users, MessageSquare, StickyNote, Clapperboard,
  ArrowUp, Clock, MapPin, Film, Hash, Eye, FileText, Tag, Download,
} from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import styles from '../Script.module.css'

const TIME_ICON = {
  DIA: Sun, NOITE: Moon, AMANHECER: Sunrise, CREPÚSCULO: SunsetIcon,
  GOLDEN: Sunrise, TARDE: Sun, MANHÃ: Sunrise, ENTARDECER: SunsetIcon,
}
const TIME_COLOR = {
  DIA: '#F5A623', NOITE: '#5B8DEF', AMANHECER: '#E8A838',
  CREPÚSCULO: '#9B59B6', GOLDEN: '#F5A623', TARDE: '#F5A623',
  MANHÃ: '#E8A838', ENTARDECER: '#E05B8D',
}
const IE_COLOR = { INT: '#5B8DEF', EXT: '#34D399' }

// ── Build interleaved reading order ─────────────────────────────
function buildReadingOrder(scene) {
  const blocks = []
  const actions = scene.action || []
  const dialogues = scene.dialogue || []
  if (actions.length > 0 && dialogues.length === 0) {
    actions.forEach(text => blocks.push({ type: 'action', text }))
  } else if (dialogues.length > 0 && actions.length === 0) {
    dialogues.forEach(d => blocks.push({ type: 'dialogue', ...d }))
  } else {
    if (actions[0]) blocks.push({ type: 'action', text: actions[0] })
    dialogues.forEach(d => blocks.push({ type: 'dialogue', ...d }))
    actions.slice(1).forEach(text => blocks.push({ type: 'action', text }))
  }
  return blocks
}

// ── Scene accordion item ────────────────────────────────────────
function SceneAccordion({ scene, epId, isOpen, onToggle, index, sceneRef, shootingDay, sceneDayMap }) {
  const TIcon = TIME_ICON[scene.timeOfDay] || Sun
  const tColor = TIME_COLOR[scene.timeOfDay] || '#F5A623'
  const ieColor = IE_COLOR[scene.intExt] || '#5B8DEF'
  const charCount = scene.characters?.length || 0
  const dialogueCount = scene.dialogue?.length || 0
  const hasNotes = (scene.productionNotes?.length || 0) > 0
  const hasArcBeats = scene.arcBeats && Object.keys(scene.arcBeats).length > 0
  const wordCount = useMemo(() => {
    let w = 0
    ;(scene.action || []).forEach(a => { w += a.split(/\s+/).length })
    ;(scene.dialogue || []).forEach(d => { w += (d.text || '').split(/\s+/).length })
    return w
  }, [scene])

  const sceneNum = scene.id || `SC${String(index + 1).padStart(3, '0')}`
  const synopsis = (scene.action?.[0] || scene.synopsis || '').slice(0, 100)

  return (
    <div
      ref={sceneRef}
      className={`${styles.fsScene} ${isOpen ? styles.fsSceneOpen : ''}`}
      style={{ '--ie-color': ieColor }}
    >
      {/* ── Accordion header ── */}
      <button className={styles.fsSceneHeader} onClick={onToggle}>
        {/* Expand icon */}
        <div className={styles.fsExpandIcon} style={{
          background: isOpen ? 'var(--accent, #E07B39)' : 'rgba(255,255,255,0.05)',
          color: isOpen ? '#fff' : 'var(--text-muted)',
        }}>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        {/* Scene number box */}
        <div className={styles.fsNumBox} style={{
          background: ieColor + '18',
          borderColor: ieColor,
        }}>
          <span style={{ color: ieColor }}>{sceneNum}</span>
        </div>

        {/* Center: heading + synopsis */}
        <div className={styles.fsHeaderCenter}>
          <div className={styles.fsHeaderRow1}>
            <span className={styles.fsIntExtPill} style={{ background: ieColor + '20', color: ieColor }}>
              {scene.intExt}
            </span>
            <TIcon size={12} style={{ color: tColor, flexShrink: 0 }} />
            <span className={styles.fsTimePill} style={{ color: tColor }}>{scene.timeOfDay || 'DIA'}</span>
            {scene.type && (
              <span className={styles.fsTypePill} style={{ background: 'rgba(196,160,255,0.15)', color: '#C4A0FF' }}>
                {scene.type}
              </span>
            )}
          </div>
          <div className={styles.fsHeaderRow2}>
            <span className={styles.fsLocation}>{scene.location || '—'}</span>
            {scene.sceneTitle && <span className={styles.fsSceneTitle}>— {scene.sceneTitle}</span>}
          </div>
          {!isOpen && synopsis && (
            <div className={styles.fsSynopsisPreview}>{synopsis}{synopsis.length >= 100 ? '…' : ''}</div>
          )}
        </div>

        {/* Right: meta chips */}
        <div className={styles.fsHeaderRight}>
          {shootingDay && (
            <span className={styles.fsChip} style={{ background: 'rgba(91,141,239,0.15)', color: '#5B8DEF' }}>
              <Film size={10} /> D{shootingDay}
            </span>
          )}
          <span className={styles.fsChip}><Users size={10} /> {charCount}</span>
          <span className={styles.fsChip}><MessageSquare size={10} /> {dialogueCount}</span>
          {scene.pageLength && <span className={styles.fsChip}><FileText size={10} /> {scene.pageLength}</span>}
        </div>
      </button>

      {/* ── Accordion body ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
            animate={{ height: 'auto', opacity: 1, overflow: 'visible',
              transitionEnd: { overflow: 'visible' } }}
            exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className={styles.fsBodyWrap}>
              {/* Scene heading (classic screenplay) */}
              <div className={styles.fsHeading} style={{ borderLeftColor: ieColor }}>
                <span className={styles.fsHeadingIE} style={{ color: ieColor }}>{scene.intExt}.</span>
                {' '}{scene.location} — {scene.timeOfDay || 'DIA'}
                {scene.pageNumber && (
                  <span className={styles.fsPageNum}>p.{scene.pageNumber}</span>
                )}
              </div>

              {/* Production Notes */}
              {hasNotes && scene.productionNotes.map((note, i) => (
                <div key={i} className={styles.fsProdNote}>
                  <StickyNote size={12} style={{ flexShrink: 0 }} />
                  <span>{note}</span>
                </div>
              ))}

              {/* ── FULL SCREENPLAY TEXT ── */}
              <div className={styles.fsContent}>
                {buildReadingOrder(scene).map((block, i) => {
                  if (block.type === 'action') {
                    return <p key={`a${i}`} className={styles.fsAction}>{block.text}</p>
                  }
                  if (block.type === 'dialogue') {
                    return (
                      <div key={`d${i}`} className={styles.fsDialogue}>
                        <div className={styles.fsDialogueChar}>{block.character}</div>
                        {block.parenthetical && (
                          <div className={styles.fsDialogueParen}>{block.parenthetical}</div>
                        )}
                        <div className={styles.fsDialogueText}>{block.text}</div>
                      </div>
                    )
                  }
                  return null
                })}
              </div>

              {/* Director arc beats */}
              {hasArcBeats && (
                <div className={styles.fsArcBeats}>
                  <div className={styles.fsArcBeatsTitle}>
                    <Clapperboard size={11} /> Notas do Realizador
                  </div>
                  {Object.entries(scene.arcBeats).map(([charName, note]) => (
                    <div key={charName} className={styles.fsArcBeat}>
                      <span className={styles.fsArcBeatChar}>{charName}</span>
                      <span className={styles.fsArcBeatNote}>{note}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {scene.autoTags?.length > 0 && (
                <div className={styles.fsTags}>
                  {scene.autoTags.map(t => (
                    <span key={t} className={styles.fsTag}>{t}</span>
                  ))}
                </div>
              )}

              {/* Extras */}
              {scene.extras?.length > 0 && (
                <div className={styles.fsExtras}>
                  <span className={styles.fsExtrasLabel}>Figuracao:</span>
                  {scene.extras.map((ex, i) => (
                    <span key={i} className={styles.fsExtra}>
                      {ex.description}{ex.estimatedCount > 1 ? ` (x${ex.estimatedCount})` : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Characters footer */}
              {charCount > 0 && (
                <div className={styles.fsCharFooter}>
                  <div className={styles.fsCharFooterLabel}>Personagens nesta cena</div>
                  <div className={styles.fsCharChips}>
                    {scene.characters.map((c, i) => (
                      <span key={i} className={styles.fsCharChip}>
                        {typeof c === 'string' ? c : c.name || c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Synopsis fallback */}
              {!scene.action?.length && !scene.dialogue?.length && scene.synopsis && (
                <p className={styles.fsSynopsis}>{scene.synopsis}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export function FullScriptView({ initialSceneId }) {
  const { parsedScripts, sceneAssignments, shootingDays, deepLinkSceneId, clearDeepLink } = useStore(useShallow(s => ({
    parsedScripts: s.parsedScripts, sceneAssignments: s.sceneAssignments, shootingDays: s.shootingDays,
    deepLinkSceneId: s.ui.deepLinkSceneId, clearDeepLink: s.clearDeepLink,
  })))
  const effectiveSceneId = initialSceneId || deepLinkSceneId
  const [selectedEp, setSelectedEp] = useState(null)
  const [search, setSearch] = useState('')
  const [openScenes, setOpenScenes] = useState(new Set())
  const [allOpen, setAllOpen] = useState(false)
  const [activeSceneIdx, setActiveSceneIdx] = useState(-1)
  const scrollRef = useRef(null)
  const sceneRefs = useRef({})
  const [showTop, setShowTop] = useState(false)
  const [sidebarSearch, setSidebarSearch] = useState('')

  const epIds = useMemo(() => Object.keys(parsedScripts || {}).sort(), [parsedScripts])
  const activeEp = selectedEp || epIds[0] || null
  const scenes = (activeEp ? parsedScripts[activeEp]?.scenes : null) || []

  // Shooting day map: sceneKey → day label
  const sceneDayMap = useMemo(() => {
    const map = {}
    Object.entries(sceneAssignments || {}).forEach(([sceneKey, dayId]) => {
      const day = (shootingDays || []).find(d => d.id === dayId)
      if (day) map[sceneKey] = day.label || day.dayNumber || '?'
    })
    return map
  }, [sceneAssignments, shootingDays])

  // Search filter (main)
  const q = search.toLowerCase().trim()
  const filtered = useMemo(() => {
    if (!q) return scenes
    return scenes.filter(s =>
      (s.location || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q) ||
      (s.characters || []).some(c => (typeof c === 'string' ? c : c.name || '').toLowerCase().includes(q)) ||
      (s.dialogue || []).some(d => d.text?.toLowerCase().includes(q) || d.character?.toLowerCase().includes(q)) ||
      (s.action || []).some(a => a.toLowerCase().includes(q)) ||
      (s.productionNotes || []).some(n => n.toLowerCase().includes(q))
    )
  }, [scenes, q])

  // Sidebar search filter
  const sidebarFiltered = useMemo(() => {
    const sq = sidebarSearch.toLowerCase().trim()
    if (!sq) return scenes
    return scenes.filter(s =>
      (s.location || '').toLowerCase().includes(sq) ||
      (s.id || '').toLowerCase().includes(sq) ||
      (s.characters || []).some(c => (typeof c === 'string' ? c : c.name || '').toLowerCase().includes(sq))
    )
  }, [scenes, sidebarSearch])

  // Toggle all
  const toggleAll = useCallback(() => {
    if (allOpen) {
      setOpenScenes(new Set())
      setAllOpen(false)
    } else {
      setOpenScenes(new Set(filtered.map(s => s.id)))
      setAllOpen(true)
    }
  }, [allOpen, filtered])

  // Toggle single
  const toggleScene = useCallback((id, idx) => {
    setOpenScenes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setActiveSceneIdx(idx)
  }, [])

  // Jump to scene (from sidebar or deep-link)
  const jumpToScene = useCallback((sceneId) => {
    const idx = filtered.findIndex(s => s.id === sceneId)
    if (idx < 0) return
    setOpenScenes(prev => new Set([...prev, sceneId]))
    setActiveSceneIdx(idx)
    setTimeout(() => {
      const el = sceneRefs.current[sceneId]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }, [filtered])

  // Deep-link: open + scroll to scene (via prop or store)
  useEffect(() => {
    if (!effectiveSceneId || !scenes.length) return
    for (const epId of epIds) {
      const ep = parsedScripts[epId]
      const idx = (ep?.scenes || []).findIndex(s => s.id === effectiveSceneId)
      if (idx >= 0) {
        setSelectedEp(epId)
        setTimeout(() => {
          setOpenScenes(new Set([effectiveSceneId]))
          setActiveSceneIdx(idx)
          setTimeout(() => {
            const el = sceneRefs.current[effectiveSceneId]
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }, 50)
        break
      }
    }
    if (deepLinkSceneId) clearDeepLink()
  }, [effectiveSceneId, scenes.length, epIds, parsedScripts])

  // Reset on episode change
  useEffect(() => {
    setOpenScenes(new Set())
    setAllOpen(false)
    setSearch('')
    setActiveSceneIdx(-1)
  }, [activeEp])

  // Scroll listener
  const handleScroll = useCallback((e) => {
    setShowTop(e.target.scrollTop > 300)
  }, [])

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Stats
  const totalDialogues = useMemo(() => scenes.reduce((sum, s) => sum + (s.dialogue?.length || 0), 0), [scenes])
  const totalChars = useMemo(() => {
    const set = new Set()
    scenes.forEach(s => (s.characters || []).forEach(c => set.add(typeof c === 'string' ? c : c.name)))
    return set.size
  }, [scenes])
  const totalPages = useMemo(() => {
    let p = 0
    scenes.forEach(s => {
      if (s.pageLength) {
        const m = s.pageLength.match(/(\d+)\s*(\d+)?\/(\d+)?/)
        if (m) p += parseInt(m[1]) + (m[2] && m[3] ? parseInt(m[2]) / parseInt(m[3]) : 0)
      }
    })
    return p > 0 ? Math.round(p) : null
  }, [scenes])

  return (
    <div className={styles.fsRoot}>
      <div className={styles.fsLayout}>
        {/* ══ MAIN READER PANEL ══ */}
        <div className={styles.fsMain}>
          {/* ── Glass Header ── */}
          <div className={styles.fsGlassHeader}>
            <div className={styles.fsGlassHeaderInner}>
              <div>
                <h1 className={styles.fsTitle}>
                  {activeEp || 'Guiao'}
                </h1>
                <div className={styles.fsMetaRow}>
                  {totalPages && <span>{totalPages} paginas</span>}
                  <span>{filtered.length} cenas</span>
                  <span>{totalChars} personagens</span>
                  <span>{totalDialogues} falas</span>
                </div>
              </div>

              <div className={styles.fsHeaderActions}>
                {/* Episode picker */}
                {epIds.length > 1 && (
                  <div className={styles.fsEpPicker}>
                    {epIds.map(ep => (
                      <button key={ep} className={`${styles.fsEpBtn} ${activeEp === ep ? styles.fsEpBtnActive : ''}`} onClick={() => setSelectedEp(ep)}>
                        {ep}
                      </button>
                    ))}
                  </div>
                )}

                <button className={styles.fsGlassBtn} onClick={toggleAll}>
                  {allOpen ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
                  {allOpen ? 'Colapsar' : 'Expandir'}
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div className={styles.fsSearchWrap}>
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                className={styles.fsSearchInput}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Procurar no guiao..."
              />
              {search && (
                <button className={styles.fsSearchClear} onClick={() => setSearch('')}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* ── Scenes ── */}
          <div className={styles.fsSceneList} ref={scrollRef} onScroll={handleScroll}>
            {filtered.map((scene, i) => {
              const sceneKey = `${activeEp}-${scene.sceneNumber || scene.id}`
              return (
                <SceneAccordion
                  key={scene.id || i}
                  scene={scene}
                  epId={activeEp}
                  index={i}
                  isOpen={allOpen || openScenes.has(scene.id)}
                  onToggle={() => toggleScene(scene.id, i)}
                  shootingDay={sceneDayMap[sceneKey]}
                  sceneDayMap={sceneDayMap}
                  sceneRef={el => { if (el) sceneRefs.current[scene.id] = el }}
                />
              )
            })}

            {filtered.length === 0 && search && (
              <div className={styles.fsEmpty}>
                <Search size={24} style={{ opacity: 0.3 }} />
                <p>Nenhuma cena corresponde a "<strong>{search}</strong>"</p>
              </div>
            )}
            {filtered.length === 0 && !search && (
              <div className={styles.fsEmpty}>
                <Eye size={24} style={{ opacity: 0.3 }} />
                <p>Nenhuma cena neste episodio.</p>
              </div>
            )}

            {/* End marker */}
            {filtered.length > 0 && !search && (
              <div className={styles.fsEndMarker}>FIM DO EPISODIO</div>
            )}
          </div>

          {/* ── Scroll to top FAB ── */}
          <AnimatePresence>
            {showTop && (
              <motion.button className={styles.fsScrollTop} onClick={scrollToTop}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                <ArrowUp size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ══ SIDEBAR NAVIGATOR ══ */}
        <div className={styles.fsSidebar}>
          <div className={styles.fsSidebarHeader}>
            <h3 className={styles.fsSidebarTitle}>Cenas</h3>
            <div className={styles.fsSidebarSearchWrap}>
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                className={styles.fsSidebarSearchInput}
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                placeholder="Procurar cena..."
              />
            </div>
          </div>

          <div className={styles.fsSidebarList}>
            {sidebarFiltered.map((scene) => {
              const ieColor = IE_COLOR[scene.intExt] || '#5B8DEF'
              const isActive = openScenes.has(scene.id)
              const TIcon = TIME_ICON[scene.timeOfDay] || Sun
              const sceneKey = `${activeEp}-${scene.sceneNumber || scene.id}`
              return (
                <button
                  key={scene.id}
                  className={`${styles.fsSidebarItem} ${isActive ? styles.fsSidebarItemActive : ''}`}
                  onClick={() => jumpToScene(scene.id)}
                >
                  <div className={styles.fsSidebarItemRow1}>
                    <span className={styles.fsSidebarNum} style={{ color: ieColor }}>
                      {scene.id}
                    </span>
                    <span className={styles.fsSidebarIE} style={{ background: ieColor + '20', color: ieColor }}>
                      {scene.intExt}
                    </span>
                    <TIcon size={10} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div className={styles.fsSidebarLoc}>{scene.location || '—'}</div>
                  <div className={styles.fsSidebarMeta}>
                    <span>{(scene.characters || []).length} chars</span>
                    {scene.pageLength && <><span>·</span><span>{scene.pageLength}</span></>}
                    {sceneDayMap[sceneKey] && <><span>·</span><span>D{sceneDayMap[sceneKey]}</span></>}
                  </div>
                </button>
              )
            })}
          </div>

          <div className={styles.fsSidebarFooter}>
            <div className={styles.fsSidebarStat}>
              <span>Total:</span>
              <span>{scenes.length}</span>
            </div>
            <div className={styles.fsSidebarStat}>
              <span>Abertas:</span>
              <span style={{ color: 'var(--accent, #E07B39)' }}>{openScenes.size}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
