// Universo — bible da série · mapa de personagens · rede de relações · glossário · episódios
// Inclui sub-secções: Universo, Guiões, Espelho
// Rebuild completo v3 — Março 2026

import { lazy, Suspense, useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2, BarChart2, Users, BookOpen, Hash, Zap, ScrollText,
  Plus, X, Sparkles, AlertCircle, Search, Download,
  Loader, Trash2, Film, MessageSquare, Upload, GitCompare, RefreshCw, Shield,
  Globe, Eye,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { fetchAPI } from '../../core/api.js'
import {
  ARC_TYPES, ARC_MAP, ARC_WEIGHT, RELATION_TYPES, REL_MAP,
  buildEpisodeData, getEpisodeIds, checkConsistency,
} from './utils.js'
import { CharacterDrawer } from './CharacterDrawer.jsx'
import { CharacterNet }    from './CharacterNet.jsx'
import { EmotionalArc }    from './EmotionalArc.jsx'
import { EpisodeGrid }     from './EpisodeGrid.jsx'
import { EpisodeArcsTab }  from './EpisodeArcsTab.jsx'
import { DecisionsTab }    from './DecisionsTab.jsx'
import { FilesTab }        from './FilesTab.jsx'
import { CompareTab }      from './CompareTab.jsx'
import { ConformityTab }   from './ConformityTab.jsx'
import { applySeed }       from './seed-desdobrado.js'
import { SmartInput } from '../../components/shared/SmartInput.jsx'
import styles from './Universe.module.css'

// Lazy-load sub-modules
const ScriptAnalysisModule = lazy(() => import('../script-analysis/index.jsx').then(m => ({ default: m.ScriptAnalysisModule })))
const MirrorModule = lazy(() => import('../mirror/index.jsx').then(m => ({ default: m.MirrorModule })))
const ScriptModule = lazy(() => import('../script/index.jsx').then(m => ({ default: m.ScriptModule })))

// Section tabs for the merged module
const SECTIONS = [
  { id: 'universo', label: 'Universo', icon: Globe,      color: '#7B4FBF' },
  { id: 'guioes',   label: 'Guiões',   icon: BookOpen,   color: 'var(--mod-script, #F5A623)' },
  { id: 'guiao',    label: 'Guião',    icon: ScrollText, color: 'var(--mod-script, #E07B39)' },
  { id: 'espelho',  label: 'Espelho',  icon: Eye,        color: 'var(--mod-mirror, #5B8DEF)' },
]

// ── Tabs ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'rede',        label: 'Rede',           icon: Share2        },
  { id: 'episodios',   label: 'Episódios',      icon: BarChart2     },
  { id: 'forcas',      label: 'Forças',         icon: Zap           },
  { id: 'bible',       label: 'Bible',          icon: BookOpen      },
  { id: 'room',        label: 'Writers\' Room', icon: MessageSquare },
  { id: 'ficheiros',   label: 'Ficheiros',      icon: Upload        },
]

// Unique ID
let _uid = 1
function uid() { return `u-${Date.now()}-${_uid++}` }

const SPRING = { type: 'spring', damping: 28, stiffness: 300 }

// ── Forças do Universo ────────────────────────────────────────────
const FORCE_COLORS = ['#E05B8D','#8B6FBF','#F5A623','#2EA080','#5B8DEF','#F87171','#34D399']

function ForcasTab({ forces, setUniverseForces }) {
  const [adding, setAdding] = useState(false)
  const [draft,  setDraft]  = useState({ title: '', text: '', reference: '', color: FORCE_COLORS[0] })

  const save = (updated) => setUniverseForces(updated)

  const addForce = () => {
    if (!draft.title.trim()) return
    const num = forces.length + 1
    save([...forces, { id: `f-${Date.now()}`, num, ...draft }])
    setDraft({ title: '', text: '', reference: '', color: FORCE_COLORS[num % FORCE_COLORS.length] })
    setAdding(false)
  }

  const updateForce = (id, patch) => save(forces.map(f => f.id === id ? { ...f, ...patch } : f))
  const deleteForce = (id) => save(forces.filter(f => f.id !== id).map((f, i) => ({ ...f, num: i + 1 })))

  return (
    <div className={styles.forcasTab}>
      <div className={styles.forcasHeader}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 800 }}>Forças do Universo</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
            As regras que existem antes do primeiro episódio ser escrito.
          </p>
        </div>
        <button className={styles.btnAdd} onClick={() => setAdding(v => !v)}>
          <Plus size={14} /> Nova força
        </button>
      </div>

      {adding && (
        <motion.div className={styles.addForceForm}
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className={styles.forceNum} style={{ background: draft.color }}>{forces.length + 1}</div>
            <input className={styles.input} style={{ flex: 1 }}
              value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="Regra do universo…" autoFocus />
            <div style={{ display: 'flex', gap: 4 }}>
              {FORCE_COLORS.map(c => (
                <button key={c} onClick={() => setDraft(d => ({ ...d, color: c }))}
                  style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: draft.color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <SmartInput rows={3}
            value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))}
            placeholder="Descrição completa da regra…"
            context="Regra/força do universo narrativo da série" />
          <input className={styles.input}
            value={draft.reference} onChange={e => setDraft(d => ({ ...d, reference: e.target.value }))}
            placeholder="→ Referência: Bulgakov, GGM, ou nota interna…" style={{ fontStyle: 'italic', fontSize: 'var(--text-xs)' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={styles.btnCancel} onClick={() => setAdding(false)}>Cancelar</button>
            <button className={styles.btnAdd} onClick={addForce} disabled={!draft.title.trim()}>Guardar</button>
          </div>
        </motion.div>
      )}

      <div className={styles.forcesList}>
        {forces.length === 0 && !adding && (
          <div className={styles.emptyState}>
            <Zap size={32} color="var(--text-muted)" />
            <p>As forças definem o que o mundo aceita sem questionar.<br/>Adiciona a primeira regra do universo.</p>
          </div>
        )}
        {forces.map(force => (
          <div key={force.id} className={styles.forceCard} style={{ borderLeft: `4px solid ${force.color}` }}>
            <div className={styles.forceCardTop}>
              <div className={styles.forceNum} style={{ background: force.color, color: '#fff' }}>{force.num}</div>
              <input className={styles.forceTitle}
                value={force.title}
                onChange={e => updateForce(force.id, { title: e.target.value })}
                onBlur={e => updateForce(force.id, { title: e.target.value })} />
              <button className={styles.iconBtn} onClick={() => deleteForce(force.id)}><Trash2 size={13} /></button>
            </div>
            <SmartInput
              value={force.text || ''}
              onChange={e => updateForce(force.id, { text: e.target.value })}
              placeholder="Descrição da regra…" rows={3}
              context="Descrição de regra/força do universo narrativo" />
            {force.reference && (
              <div className={styles.forceRef}>{force.reference}</div>
            )}
            {!force.reference && (
              <input className={styles.forceRefInput}
                value={force.reference || ''}
                onChange={e => updateForce(force.id, { reference: e.target.value })}
                placeholder="→ referência ou nota interna…" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export function UniverseModule({ initialSection = 'universo', initialTab = 'rede' }) {
  const [section, setSection] = useState(initialSection)
  const { 
    universe,
    parsedScripts,
    parsedCharacters,
    parsedLocations,
    apiKey,
    projectName,
    team,
    locations,
    continuityData,
    continuityDecisions,
    captures,
    captureNotes,
    preProduction,
    shootingDays,
    setUniverseChars,
    setUniverseRelations,
    setUniverseArcs,
    setUniverseBible,
    setUniverseGlossary,
    setUniverseForces,
    setUniverseEpisodeArcs,
    setUniverseDecisions,
    setUniverseFiles,
    addUniverseFile,
    removeUniverseFile,
    setBibleSections,
   } = useStore(useShallow(s => ({ universe: s.universe, parsedScripts: s.parsedScripts, parsedCharacters: s.parsedCharacters, parsedLocations: s.parsedLocations, apiKey: s.apiKey, projectName: s.projectName, team: s.team, locations: s.locations, continuityData: s.continuityData, continuityDecisions: s.continuityDecisions, captures: s.captures, captureNotes: s.captureNotes, preProduction: s.preProduction, shootingDays: s.shootingDays, setUniverseChars: s.setUniverseChars, setUniverseRelations: s.setUniverseRelations, setUniverseArcs: s.setUniverseArcs, setUniverseBible: s.setUniverseBible, setUniverseGlossary: s.setUniverseGlossary, setUniverseForces: s.setUniverseForces, setUniverseEpisodeArcs: s.setUniverseEpisodeArcs, setUniverseDecisions: s.setUniverseDecisions, setUniverseFiles: s.setUniverseFiles, addUniverseFile: s.addUniverseFile, removeUniverseFile: s.removeUniverseFile, setBibleSections: s.setBibleSections })))

  const chars        = universe.chars        || []
  const relations    = universe.relations    || []
  const bible        = universe.bible        || {}
  const glossary     = universe.glossary     || []
  const forces       = universe.forces       || []
  const episodeArcs  = universe.episodeArcs  || []
  const decisions    = universe.decisions    || []
  const files        = universe.files        || []

  const [activeTab,      setActiveTab]      = useState(initialTab)
  const [selectedCharId, setSelectedCharId] = useState(null)
  const [episodeFilter,  setEpisodeFilter]  = useState(null)  // null = Todos
  const [arcFilter,      setArcFilter]      = useState(null)  // for personagens sub-view
  const [epSubView,      setEpSubView]      = useState('grid')     // grid | arcos | comparar | personagens
  const [forcasSubView,  setForcasSubView]  = useState('forcas')   // forcas | conformidade
  const [bibleSubView,   setBibleSubView]   = useState('bible')    // bible | glossario
  const [glossarySearch, setGlossarySearch] = useState('')
  const [aiLoading,      setAiLoading]      = useState(false)
  const [aiError,        setAiError]        = useState(null)
  const [showAddChar,    setShowAddChar]     = useState(false)
  const [showAddGloss,   setShowAddGloss]   = useState(false)
  const [newCharName,    setNewCharName]     = useState('')
  const [newCharArc,     setNewCharArc]      = useState('secundário')
  const [newGlossTerm,   setNewGlossTerm]   = useState('')
  const [newGlossDef,    setNewGlossDef]    = useState('')
  const [newGlossCat,    setNewGlossCat]    = useState('')

  // Derived data
  const episodeData = useMemo(() => buildEpisodeData(parsedScripts), [parsedScripts])
  const episodeIds  = useMemo(() => getEpisodeIds(parsedScripts),    [parsedScripts])
  const alerts      = useMemo(() => checkConsistency(chars, episodeData), [chars, episodeData])

  // Characters not yet in universe
  const unimportedChars = useMemo(() => {
    const known = new Set(chars.map(c => (c.name || '').toUpperCase()))
    return (parsedCharacters || []).filter(pc => !known.has((pc.name || '').toUpperCase()))
  }, [chars, parsedCharacters])

  const selectedChar = selectedCharId ? chars.find(c => c.id === selectedCharId) : null

  // ── Handlers ──────────────────────────────────────────────────

  const updateChar = useCallback((id, patch) => {
    setUniverseChars(chars.map(c => c.id === id ? { ...c, ...patch } : c))
  }, [chars, setUniverseChars])

  const deleteChar = useCallback((id) => {
    setUniverseChars(chars.filter(c => c.id !== id))
    setUniverseRelations(relations.filter(r => r.from !== id && r.to !== id))
    if (selectedCharId === id) setSelectedCharId(null)
  }, [chars, relations, selectedCharId, setUniverseChars, setUniverseRelations])

  const addChar = () => {
    if (!newCharName.trim()) return
    const newChar = {
      id:          uid(),
      name:        newCharName.trim(),
      arcType:     newCharArc,
      description: '',
      notes:       '',
      x:           0,
      y:           0,
      relations:   [],
    }
    setUniverseChars([...chars, newChar])
    setNewCharName('')
    setNewCharArc('secundário')
    setShowAddChar(false)
  }

  const importFromScripts = useCallback(() => {
    const known = new Set(chars.map(c => (c.name || '').toUpperCase()))
    const candidates = (parsedCharacters || [])
      .filter(pc => !known.has((pc.name || '').toUpperCase()))

    if (candidates.length === 0) return

    // Smart arcType detection: relative to the cast
    // Combine with already-imported chars for overall ranking
    const allByLines = [...(parsedCharacters || [])]
      .sort((a, b) => (b.lineCount || 0) - (a.lineCount || 0))
    const maxLines = allByLines[0]?.lineCount || 1
    const topName = allByLines[0]?.name?.toUpperCase()

    // Also count total scenes across all episodes
    const allSceneCounts = {}
    for (const pc of (parsedCharacters || [])) {
      allSceneCounts[pc.name?.toUpperCase()] = pc.scenes?.length || 0
    }
    const maxScenes = Math.max(1, ...Object.values(allSceneCounts))

    // Compute scores for all chars to find protagonist threshold
    const allScores = allByLines.map(pc => {
      const lines = pc.lineCount || 0
      const scenes = pc.scenes?.length || 0
      return (lines / maxLines) * 0.6 + (scenes / maxScenes) * 0.4
    })
    const topScore = allScores[0] || 0
    // Multiple protagonists: anyone within 80% of the top scorer qualifies
    const protagonistThreshold = topScore * 0.8

    function detectArcType(pc) {
      const lines = pc.lineCount || 0
      const scenes = pc.scenes?.length || 0
      const score = (lines / maxLines) * 0.6 + (scenes / maxScenes) * 0.4

      // Protagonists: score within 80% of top AND at least 10 lines
      if (score >= protagonistThreshold && lines > 10) return 'protagonista'
      if (score > 0.35) return 'secundário'
      return 'episódico'
    }

    function detectGroup(arcType, rank) {
      if (arcType === 'protagonista') return 'Principal'
      if (rank <= 5) return 'Núcleo'
      return 'Secundários'
    }

    const toAdd = candidates.map((pc, i) => {
      const arcType = detectArcType(pc)
      // Rank among all chars by lines
      const rank = allByLines.findIndex(c => c.name === pc.name) + 1
      return {
        id:          uid(),
        name:        pc.name,
        arcType,
        group:       detectGroup(arcType, rank),
        description: pc.directorNotes?.join(' · ') || '',
        notes:       `${pc.scenes?.length ?? 0} cenas · ${pc.lineCount ?? 0} falas`,
        x:           0,
        y:           0,
        relations:   [],
      }
    })

    if (toAdd.length > 0) setUniverseChars([...chars, ...toAdd])
  }, [chars, parsedCharacters, setUniverseChars])

  // Reimportar: limpa personagens existentes, reimporta com detecção inteligente, e gera relações via API
  const reimportFromScripts = useCallback(async () => {
    if (!parsedCharacters?.length) return

    const allByLines = [...parsedCharacters].sort((a, b) => (b.lineCount || 0) - (a.lineCount || 0))
    const maxLines = allByLines[0]?.lineCount || 1
    const allSceneCounts = {}
    for (const pc of parsedCharacters) allSceneCounts[pc.name?.toUpperCase()] = pc.scenes?.length || 0
    const maxScenes = Math.max(1, ...Object.values(allSceneCounts))

    // Compute scores for all to find protagonist threshold
    const allScores = allByLines.map(pc => {
      const lines = pc.lineCount || 0
      const scenes = pc.scenes?.length || 0
      return (lines / maxLines) * 0.6 + (scenes / maxScenes) * 0.4
    })
    const topScore = allScores[0] || 0
    const protagonistThreshold = topScore * 0.8

    function detectArcType(pc) {
      const lines = pc.lineCount || 0
      const scenes = pc.scenes?.length || 0
      const score = (lines / maxLines) * 0.6 + (scenes / maxScenes) * 0.4
      if (score >= protagonistThreshold && lines > 10) return 'protagonista'
      if (score > 0.35) return 'secundário'
      return 'episódico'
    }
    function detectGroup(arcType, rank) {
      if (arcType === 'protagonista') return 'Principal'
      if (rank <= 5) return 'Núcleo'
      return 'Secundários'
    }

    const fresh = parsedCharacters.map((pc) => {
      const arcType = detectArcType(pc)
      const rank = allByLines.findIndex(c => c.name === pc.name) + 1
      return {
        id: uid(), name: pc.name, arcType,
        group: detectGroup(arcType, rank),
        description: pc.directorNotes?.join(' · ') || '',
        notes: `${pc.scenes?.length ?? 0} cenas · ${pc.lineCount ?? 0} falas`,
        x: 0, y: 0, relations: [],
      }
    })

    setUniverseChars(fresh)
    setUniverseRelations([])

    // Auto-generate relations via API if key available
    if (apiKey && parsedScripts && Object.keys(parsedScripts).length > 0) {
      setAiLoading(true)
      setAiError(null)
      try {
        // Build co-occurrence data: which chars appear in same scenes
        const coScenes = {}
        for (const [epId, data] of Object.entries(parsedScripts)) {
          for (const scene of (data?.scenes || [])) {
            const sceneChars = (scene.characters || []).map(c => (c.name || c).toString().toUpperCase())
            for (let i = 0; i < sceneChars.length; i++) {
              for (let j = i + 1; j < sceneChars.length; j++) {
                const pair = [sceneChars[i], sceneChars[j]].sort().join('|')
                coScenes[pair] = (coScenes[pair] || 0) + 1
              }
            }
          }
        }

        const topPairs = Object.entries(coScenes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 30)
          .map(([pair, count]) => `${pair.replace('|', ' + ')} (${count} cenas juntos)`)
          .join('\n')

        const charSummary = fresh.map(c => `${c.name} (${c.arcType}, ${c.group})`).join(', ')

        const prompt = `Analisa estes personagens e as suas co-ocorrências em cenas para propor relações emocionais entre eles.

Personagens: ${charSummary}

Co-ocorrências mais frequentes:
${topPairs}

Tipos de relação disponíveis: família, amizade, conflito, romance, rival, colega, mentor-aprendiz, interno, afecto, porto-seguro, tensão, anomalia, social

Para cada relação, inclui um "label" descritivo e emocional (ex: "Cas fala o que João pensa sem filtro", "paz interior — Forasteiros silenciam-se", "sabe algo — futuro mentor").

Responde APENAS em JSON válido:
{
  "relations": [
    { "from": "NOME_A", "to": "NOME_B", "type": "tipo", "label": "descrição emocional da relação" }
  ]
}`

        const text = await fetchAPI({
          apiKey,
          messages: [{ role: 'user', content: prompt }],
          maxTokens: 1500,
        })
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0])
          const nameToId = {}
          fresh.forEach(c => { nameToId[(c.name || '').toUpperCase()] = c.id })

          const newRels = (result.relations || [])
            .map(r => ({
              from:  nameToId[(r.from || '').toUpperCase()],
              to:    nameToId[(r.to || '').toUpperCase()],
              type:  r.type || 'colega',
              label: r.label || '',
            }))
            .filter(r => r.from && r.to && r.from !== r.to)

          setUniverseRelations(newRels)
        }
      } catch (err) {
        setAiError('Reimport OK, mas falhou gerar relações: ' + err.message)
      }
      setAiLoading(false)
    }
  }, [parsedCharacters, parsedScripts, apiKey, setUniverseChars, setUniverseRelations, setAiLoading, setAiError])

  // Auto-importar quando chegam novos personagens dos guiões
  useEffect(() => {
    if (!parsedCharacters?.length) return
    importFromScripts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedCharacters?.length])

  const updatePositions = useCallback((positions) => {
    setUniverseChars(chars.map(c => ({
      ...c,
      x: positions[c.id]?.x ?? c.x,
      y: positions[c.id]?.y ?? c.y,
    })))
  }, [chars, setUniverseChars])

  // ── Build full project context for AI ──────────────────────────
  const buildProjectContext = useCallback(() => {
    const sections = []

    // 1. Project basics
    sections.push(`PROJECTO: ${projectName || 'Sem nome'}`)

    // 2. Scripts summary
    if (Object.keys(parsedScripts || {}).length > 0) {
      const scriptLines = Object.entries(parsedScripts).map(([epId, data]) => {
        const charList = (data?.metadata?.characters || [])
          .slice(0, 20)
          .map(c => `${c.name} (${c.lineCount ?? 0} falas, ${c.scenes?.length ?? 0} cenas)`)
          .join(', ')
        const sceneCount = data?.scenes?.length ?? 0
        return `  ${epId}: ${sceneCount} cenas. Personagens: ${charList}`
      })
      sections.push(`GUIÕES:\n${scriptLines.join('\n')}`)
    }

    // 3. Uploaded files — Espelho (mirror) files first, then others
    const uFiles = files.filter(f => f.extractedText && f.extractedText.length > 10)
    const mirrorFiles = uFiles.filter(f => f.source === 'mirror')
    const otherFiles = uFiles.filter(f => f.source !== 'mirror')
    if (mirrorFiles.length > 0) {
      const mSummaries = mirrorFiles.slice(0, 10).map(f => {
        const text = f.extractedText.slice(0, 1200)
        return `  [${f.filename}] ${f.tags?.length ? `(tags: ${f.tags.join(', ')})` : ''}\n  ${text}`
      })
      sections.push(`INSIGHTS DO ESPELHO (${mirrorFiles.length} conversas guardadas — PRIORIDADE ALTA):\n${mSummaries.join('\n\n')}`)
    }
    if (otherFiles.length > 0) {
      const fileSummaries = otherFiles.slice(0, 8).map(f => {
        const text = f.extractedText.slice(0, 800)
        return `  [${f.filename}] ${f.tags?.length ? `(tags: ${f.tags.join(', ')})` : ''}\n  ${text}`
      })
      sections.push(`FICHEIROS CARREGADOS (${otherFiles.length} com texto):\n${fileSummaries.join('\n\n')}`)
    }

    // 3b. Writers' Room decisions (full detail for AI context)
    if (decisions.length > 0) {
      const decLines = decisions.map(d => {
        const opts = (d.options || []).map(o => `  - ${o.label}: ${o.text}`).join('\n')
        return `  [${d.urgency}] ${d.title} (${d.status})\n  ${d.description || ''}${opts ? '\n' + opts : ''}${d.chosenOption ? `\n  → Decidido: ${d.chosenOption}` : ''}`
      })
      sections.push(`WRITERS' ROOM (${decisions.length} decisões):\n${decLines.join('\n\n')}`)
    }

    // 4. Team & cast
    const castMembers = (team || []).filter(m => m.characterName)
    if (castMembers.length > 0) {
      const castLines = castMembers.map(m =>
        `  ${m.name} → personagem: ${m.characterName}${m.notes ? ` (${m.notes.slice(0, 60)})` : ''}`
      )
      sections.push(`ELENCO:\n${castLines.join('\n')}`)
    }
    const crewMembers = (team || []).filter(m => !m.characterName && m.role)
    if (crewMembers.length > 0) {
      const crewLines = crewMembers.slice(0, 15).map(m => `  ${m.name} — ${m.role} (${m.group || ''})`)
      sections.push(`EQUIPA (${crewMembers.length} membros):\n${crewLines.join('\n')}`)
    }

    // 5. Locations
    const locs = locations || []
    if (locs.length > 0) {
      const locLines = locs.slice(0, 20).map(l =>
        `  ${l.displayName || l.name} — ${l.type || ''} ${l.status || ''} ${l.address ? `(${l.address})` : ''}${l.notes ? ` · ${l.notes.slice(0, 60)}` : ''}`
      )
      sections.push(`LOCAIS (${locs.length}):\n${locLines.join('\n')}`)
    }
    // Parsed locations from scripts
    if (parsedLocations?.length > 0) {
      sections.push(`LOCAIS DOS GUIÕES: ${parsedLocations.slice(0, 30).join(', ')}`)
    }

    // 6. Continuity notes
    const contEntries = Object.entries(continuityData || {}).filter(([, v]) => v.notes || v.wardrobe || v.props)
    if (contEntries.length > 0) {
      const contLines = contEntries.slice(0, 15).map(([key, v]) => {
        const parts = [v.wardrobe && `roupa: ${v.wardrobe.slice(0, 50)}`, v.props && `adereços: ${v.props.slice(0, 50)}`, v.notes && `notas: ${v.notes.slice(0, 60)}`].filter(Boolean)
        return `  ${key}: ${parts.join(' · ')}`
      })
      sections.push(`CONTINUIDADE:\n${contLines.join('\n')}`)
    }
    if (continuityDecisions?.length > 0) {
      const decLines = continuityDecisions.slice(0, 10).map(d => `  ${d.scene}: ${d.decision} (${d.category})`)
      sections.push(`DECISÕES DE CONTINUIDADE:\n${decLines.join('\n')}`)
    }

    // 7. Captures & notes
    const textCaptures = (captures || []).filter(c => c.textContent || c.interpretation)
    if (textCaptures.length > 0) {
      const capLines = textCaptures.slice(0, 10).map(c =>
        `  [${c.type}] ${(c.textContent || c.interpretation || '').slice(0, 100)}`
      )
      sections.push(`CAPTURAS:\n${capLines.join('\n')}`)
    }
    if (captureNotes?.length > 0) {
      const noteLines = captureNotes.slice(0, 10).map(n => `  ${n.categoria || ''}: ${(n.texto || n.descricao || '').slice(0, 80)}`)
      sections.push(`NOTAS CAPTURADAS:\n${noteLines.join('\n')}`)
    }

    // 8. Pre-production status
    const casting = preProduction?.castingStatus || {}
    const castingEntries = Object.entries(casting).filter(([, s]) => s)
    if (castingEntries.length > 0) {
      const castingDetails = preProduction?.castingDetails || {}
      const castLines = castingEntries.map(([name, status]) => {
        const det = castingDetails[name]
        return `  ${name}: ${status}${det?.actorName ? ` (${det.actorName})` : ''}${det?.notes ? ` — ${det.notes.slice(0, 50)}` : ''}`
      })
      sections.push(`CASTING:\n${castLines.join('\n')}`)
    }

    // 9. Shooting days
    if (shootingDays?.length > 0) {
      sections.push(`DIAS DE RODAGEM: ${shootingDays.length} dias planeados`)
    }

    // 10. Existing universe data (so AI knows what exists and can expand, not repeat)
    if (chars.length > 0) {
      const charSummary = chars.slice(0, 20).map(c => `${c.name} (${c.arcType}, ${c.group || ''})`).join(', ')
      sections.push(`PERSONAGENS JÁ NO UNIVERSO: ${charSummary}`)
    }
    if (relations.length > 0) {
      sections.push(`RELAÇÕES EXISTENTES: ${relations.length} relações definidas`)
    }
    if (forces.length > 0) {
      const forceNames = forces.map(f => f.title).join(', ')
      sections.push(`FORÇAS EXISTENTES: ${forceNames}`)
    }
    if (bible.logline || bible.text) {
      sections.push(`BIBLE EXISTENTE: logline="${bible.logline || ''}", género="${bible.genre || ''}", tom="${bible.tone || ''}"${bible.text ? `\n  ${bible.text.slice(0, 300)}` : ''}`)
    }
    if (glossary.length > 0) {
      sections.push(`GLOSSÁRIO EXISTENTE: ${glossary.map(g => g.term).join(', ')}`)
    }

    return sections.join('\n\n')
  }, [projectName, parsedScripts, files, team, locations, parsedLocations, continuityData, continuityDecisions, captures, captureNotes, preProduction, shootingDays, chars, relations, forces, bible, glossary])

  const handleAiBuild = async () => {
    if (!apiKey) {
      setAiError('API key não configurada. Vai às Definições para adicionar a tua chave Anthropic.')
      return
    }
    const hasScripts = Object.keys(parsedScripts || {}).length > 0
    const hasFiles = files.some(f => f.extractedText?.length > 10)
    const hasTeam = team?.length > 0
    const hasLocs = locations?.length > 0 || parsedLocations?.length > 0
    if (!hasScripts && !hasFiles && !hasTeam && !hasLocs) {
      setAiError('Sem dados no projecto. Importa guiões, carrega ficheiros, ou adiciona equipa/locais primeiro.')
      return
    }
    setAiLoading(true)
    setAiError(null)

    const projectContext = buildProjectContext()

    const prompt = `Analisa TODO o contexto deste projecto audiovisual e constrói o universo completo da série: personagens, relações emocionais, forças/regras do universo, arcos por episódio, glossário de termos, e bible da série.

Usa TODA a informação disponível — guiões, ficheiros carregados, equipa, elenco, locais, notas de continuidade, capturas, casting.

CONTEXTO COMPLETO DO PROJECTO:
${projectContext}

Tipos de relação: família, amizade, conflito, romance, rival, colega, mentor-aprendiz, interno, afecto, porto-seguro, tensão, anomalia, social
Para cada relação, inclui um "label" descritivo e emocional.
Se já existem dados no universo, EXPANDE — não repitas o que já existe.

Responde APENAS em JSON válido, sem texto extra:
{
  "chars": [
    { "name": "NOME", "arcType": "protagonista|antagonista|secundário|episódico|mentor|aliado", "group": "Principal|Núcleo|Secundários", "description": "breve descrição" }
  ],
  "relations": [
    { "from": "NOME_A", "to": "NOME_B", "type": "tipo", "label": "descrição emocional" }
  ],
  "forces": [
    { "title": "Regra do universo", "text": "Descrição da regra", "color": "#hex" }
  ],
  "episodeArcs": [
    { "epNum": 1, "title": "Título do episódio", "phase": "Fase narrativa", "phaseColor": "#hex", "desire": "O protagonista quer...", "description": "Sinopse do arco", "anchorScene": "Cena âncora" }
  ],
  "glossary": [
    { "term": "Termo", "definition": "Definição", "category": "Categoria" }
  ],
  "bible": {
    "logline": "A história em uma frase",
    "genre": "Género",
    "tone": "Tom",
    "themes": "Temas principais",
    "text": "Descrição do universo"
  },
  "decisions": [
    { "title": "Questão para a writers room", "description": "Contexto", "urgency": "alta|média|baixa", "options": [{"label": "Opção A", "text": "Detalhe"}] }
  ]
}`

    try {
      const text = await fetchAPI({
        apiKey,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 3000,
      })
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido')

      const suggested = JSON.parse(jsonMatch[0])

      // ── Chars ──
      const existing    = new Set(chars.map(c => (c.name || '').toUpperCase()))
      const newCharsRaw = (suggested.chars || [])
        .filter(c => !existing.has((c.name || '').toUpperCase()))
        .map(c => ({ id: uid(), name: c.name, arcType: c.arcType || 'secundário', group: c.group || 'Secundários', description: c.description || '', notes: '', x: 0, y: 0, relations: [] }))

      const allChars = [...chars, ...newCharsRaw]
      setUniverseChars(allChars)

      // ── Relations ──
      const nameToId = {}
      allChars.forEach(c => { nameToId[(c.name || '').toUpperCase()] = c.id })

      const newRels = (suggested.relations || [])
        .map(r => ({
          from:  nameToId[(r.from || '').toUpperCase()],
          to:    nameToId[(r.to   || '').toUpperCase()],
          type:  r.type  || 'colega',
          label: r.label || r.type || '',
        }))
        .filter(r => r.from && r.to)

      setUniverseRelations([...relations, ...newRels])

      // ── Forces (merge — add new ones by title) ──
      if (suggested.forces?.length) {
        const FORCE_COLORS_AI = ['#dc2626','#7c3aed','#d97706','#15803d','#ea580c','#6366f1','#0369a1']
        const existingTitles = new Set(forces.map(f => (f.title || '').toLowerCase()))
        const newForces = suggested.forces
          .filter(f => f.title && !existingTitles.has(f.title.toLowerCase()))
          .map((f, i) => ({
            id: uid(), num: forces.length + i + 1,
            title: f.title || '', text: f.text || '', reference: f.reference || '',
            color: f.color || FORCE_COLORS_AI[(forces.length + i) % FORCE_COLORS_AI.length],
          }))
        if (newForces.length > 0) setUniverseForces([...forces, ...newForces])
      }

      // ── Episode Arcs (merge — add missing episodes) ──
      if (suggested.episodeArcs?.length) {
        const existingEps = new Set(episodeArcs.map(a => a.epNum))
        const newArcs = suggested.episodeArcs
          .filter(a => !existingEps.has(a.epNum))
          .map(a => ({
            id: uid(), epNum: a.epNum || 1,
            title: a.title || '', phase: a.phase || '',
            phaseColor: a.phaseColor || '#7c3aed',
            desire: a.desire || '', description: a.description || '',
            anchorScene: a.anchorScene || '', notes: a.notes || '',
          }))
        if (newArcs.length > 0) setUniverseEpisodeArcs([...episodeArcs, ...newArcs])
      }

      // ── Glossary (merge — add new terms) ──
      if (suggested.glossary?.length) {
        const existingTerms = new Set(glossary.map(g => (g.term || '').toLowerCase()))
        const newTerms = suggested.glossary
          .filter(g => g.term && !existingTerms.has(g.term.toLowerCase()))
          .map(g => ({
            id: uid(), term: g.term || '', definition: g.definition || '',
            category: g.category || '',
          }))
        if (newTerms.length > 0) setUniverseGlossary([...glossary, ...newTerms])
      }

      // ── Bible (fill empty fields, don't overwrite existing) ──
      if (suggested.bible) {
        const patch = {}
        if (!bible.logline && suggested.bible.logline) patch.logline = suggested.bible.logline
        if (!bible.genre && suggested.bible.genre) patch.genre = suggested.bible.genre
        if (!bible.tone && suggested.bible.tone) patch.tone = suggested.bible.tone
        if (!bible.themes && suggested.bible.themes) patch.themes = suggested.bible.themes
        if (!bible.text && suggested.bible.text) patch.text = suggested.bible.text
        if (Object.keys(patch).length > 0) setUniverseBible(patch)
      }

      // ── Decisions (add new ones) ──
      if (suggested.decisions?.length) {
        const existingDecTitles = new Set(decisions.map(d => (d.title || '').toLowerCase()))
        const newDecs = suggested.decisions
          .filter(d => d.title && !existingDecTitles.has(d.title.toLowerCase()))
          .map(d => ({
            id: uid(), title: d.title || '', description: d.description || '',
            urgency: d.urgency || 'média', status: 'open', chosenOption: null,
            createdAt: Date.now(),
            options: (d.options || []).map(o => ({ id: uid(), label: o.label || '', text: o.text || '' })),
          }))
        if (newDecs.length > 0) setUniverseDecisions([...decisions, ...newDecs])
      }

      setAiLoading(false)
    } catch (err) {
      setAiError(err.message)
      setAiLoading(false)
    }
  }

  const addGlossaryEntry = () => {
    if (!newGlossTerm.trim()) return
    const entry = { id: uid(), term: newGlossTerm.trim(), definition: newGlossDef, category: newGlossCat }
    setUniverseGlossary([...glossary, entry])
    setNewGlossTerm('')
    setNewGlossDef('')
    setNewGlossCat('')
    setShowAddGloss(false)
  }

  const removeGlossaryEntry = (id) => {
    setUniverseGlossary(glossary.filter(e => e.id !== id))
  }

  // Sorted chars for personagens tab
  const sortedChars = useMemo(() => {
    let filtered = arcFilter ? chars.filter(c => c.arcType === arcFilter) : chars
    return [...filtered].sort((a, b) => {
      const wa = ARC_WEIGHT[a.arcType] ?? 5
      const wb = ARC_WEIGHT[b.arcType] ?? 5
      if (wa !== wb) return wa - wb
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [chars, arcFilter])

  const filteredGlossary = useMemo(() =>
    glossary.filter(e =>
      !glossarySearch ||
      (e.term || '').toLowerCase().includes(glossarySearch.toLowerCase()) ||
      (e.definition || '').toLowerCase().includes(glossarySearch.toLowerCase())
    ),
  [glossary, glossarySearch])

  // Total scene counts per char
  const charSceneTotal = useCallback((charName) =>
    Object.values(episodeData).reduce((sum, ep) => {
      return sum + ((ep[(charName || '').toUpperCase()]?.scenes) ?? 0)
    }, 0),
  [episodeData])

  const relCountForChar = useCallback((id) =>
    relations.filter(r => r.from === id || r.to === id).length,
  [relations])

  const showEpFilter = activeTab === 'rede' || (activeTab === 'episodios' && epSubView === 'grid')

  // If showing Guiões or Espelho sub-section, render those modules directly
  if (section !== 'universo') {
    return (
      <div className={styles.root}>
        {/* Section selector bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '0 20px', flexShrink: 0 }}>
          {SECTIONS.map(s => {
            const Icon = s.icon
            const active = section === s.id
            return (
              <button key={s.id} onClick={() => setSection(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '12px 18px', fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? s.color : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: active ? `2px solid ${s.color}` : '2px solid transparent', transition: 'all 0.15s',
              }}>
                <Icon size={15} />
                {s.label}
              </button>
            )
          })}
        </div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>A carregar…</div>}>
            {section === 'guioes'  && <ScriptAnalysisModule />}
            {section === 'guiao'   && <ScriptModule />}
            {section === 'espelho' && <MirrorModule />}
          </Suspense>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>

      {/* Section selector bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '0 20px', flexShrink: 0 }}>
        {SECTIONS.map(s => {
          const Icon = s.icon
          const active = section === s.id
          return (
            <button key={s.id} onClick={() => setSection(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '12px 18px', fontSize: 13, fontWeight: active ? 700 : 500,
              color: active ? s.color : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: active ? `2px solid ${s.color}` : '2px solid transparent', transition: 'all 0.15s',
            }}>
              <Icon size={15} />
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Universo</h1>
          <p className={styles.sub}>
            {chars.length} personagens · {relations.length} relações · {episodeArcs.length} arcos · {forces.length} forças · {decisions.filter(d => d.status === 'open').length} decisões abertas · {files.length} ficheiros
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Import from scripts */}
          {unimportedChars.length > 0 && (
            <button className={styles.btnImport} onClick={importFromScripts} title={`${unimportedChars.length} personagens por importar`}>
              <Download size={14} />
              Importar dos guiões ({unimportedChars.length})
            </button>
          )}

          {/* Reimport from scripts (clear & redo with smart detection) */}
          {parsedCharacters?.length > 0 && chars.length > 0 && (
            <button
              className={styles.btnImport}
              onClick={() => {
                if (window.confirm('Reimportar personagens dos guiões? Isto substitui todos os personagens actuais pela nova detecção inteligente (protagonistas, núcleo, secundários).')) {
                  reimportFromScripts()
                }
              }}
              style={{ borderColor: '#f59e0b44', color: '#f59e0b' }}
              title="Limpa e reimporta com detecção inteligente de protagonista(s)"
            >
              <RefreshCw size={14} />
              Reimportar dos guiões
            </button>
          )}

          {/* AI Build */}
          <button
            className={styles.btnImport}
            onClick={handleAiBuild}
            disabled={aiLoading}
            style={{ borderColor: '#7B4FBF44', color: '#A06AFF' }}
          >
            {aiLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
            Construir com IA
          </button>

          {/* Seed de exemplo */}
          {chars.length === 0 && forces.length === 0 && (
            <button
              className={styles.btnImport}
              onClick={() => {
                if (window.confirm('Carregar dados de exemplo (DESDOBRADO)? Podes apagar tudo depois.')) {
                  applySeed({
                    setUniverseChars, setUniverseRelations, setUniverseForces,
                    setUniverseGlossary, setUniverseBible, setBibleSections,
                    setUniverseEpisodeArcs, setUniverseDecisions,
                  })
                }
              }}
              style={{ borderColor: '#15803d44', color: '#34D399' }}
            >
              <Sparkles size={14} /> Exemplo: DESDOBRADO
            </button>
          )}

          {/* Add character */}
          <button className={styles.btnAdd} onClick={() => setShowAddChar(v => !v)}>
            <Plus size={14} /> Personagem
          </button>
        </div>

        {/* Tab bar */}
        <div className={styles.tabBar} style={{ width: '100%', marginTop: 4 }}>
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {activeTab === t.id && (
                  <motion.div
                    layoutId="universeActiveTab"
                    className={styles.tabIndicator}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Episode filter (only for rede + episodios) */}
        {showEpFilter && episodeIds.length > 0 && (
          <div className={styles.epFilterBar}>
            <button
              className={`${styles.epFilterBtn} ${!episodeFilter ? styles.epFilterBtnActive : ''}`}
              onClick={() => setEpisodeFilter(null)}
            >
              Todos
            </button>
            {episodeIds.map(ep => (
              <button
                key={ep}
                className={`${styles.epFilterBtn} ${episodeFilter === ep ? styles.epFilterBtnActive : ''}`}
                onClick={() => setEpisodeFilter(ep === episodeFilter ? null : ep)}
              >
                {ep}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI error */}
      <AnimatePresence>
        {aiError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ background: '#4A1020', borderBottom: '1px solid #E05B8D44', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <AlertCircle size={14} color="#E05B8D" />
            <span style={{ fontSize: 13, color: '#F87171' }}>{aiError}</span>
            <button onClick={() => setAiError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add char inline form */}
      <AnimatePresence>
        {showAddChar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.addCharForm}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  className={styles.input}
                  style={{ flex: '1 1 180px' }}
                  placeholder="Nome da personagem"
                  value={newCharName}
                  onChange={e => setNewCharName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChar()}
                  autoFocus
                />
                <select
                  className={styles.input}
                  style={{ flex: '0 0 160px' }}
                  value={newCharArc}
                  onChange={e => setNewCharArc(e.target.value)}
                >
                  {ARC_TYPES.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
                <button className={styles.btnAdd} onClick={addChar}>Adicionar</button>
                <button className={styles.btnCancel} onClick={() => setShowAddChar(false)}>Cancelar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content area */}
      <div className={styles.content}>

        {/* TAB: Rede + Arco Emocional */}
        {activeTab === 'rede' && (
          <div className={styles.networkLayout}>
            <CharacterNet
              chars={chars}
              relations={relations}
              episodeData={episodeData}
              episodeFilter={episodeFilter}
              onSelectChar={c => setSelectedCharId(c.id)}
              onUpdatePositions={updatePositions}
            />
            {episodeArcs.length > 0 && (
              <EmotionalArc
                episodeArcs={episodeArcs}
                episodeFilter={episodeFilter}
                onSelectEpisode={setEpisodeFilter}
              />
            )}
          </div>
        )}

        {/* TAB: Episódios (sub-views: grid, arcos, comparar, personagens) */}
        {activeTab === 'episodios' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Sub-view toggle */}
            <div className={styles.epFilterBar} style={{ borderBottom: '1px solid var(--border-subtle)', padding: '8px 24px', gap: 6 }}>
              {[
                { id: 'grid', label: 'Grelha' },
                { id: 'arcos', label: 'Arcos' },
                { id: 'comparar', label: 'Comparar' },
                { id: 'personagens', label: 'Personagens' },
              ].map(sv => (
                <button
                  key={sv.id}
                  className={`${styles.epFilterBtn} ${epSubView === sv.id ? styles.epFilterBtnActive : ''}`}
                  onClick={() => setEpSubView(sv.id)}
                  style={epSubView === sv.id ? { background: '#5B8DEF15', borderColor: '#5B8DEF66', color: '#5B8DEF' } : {}}
                >
                  {sv.label}
                </button>
              ))}
            </div>

            {/* Sub-view: Grid */}
            {epSubView === 'grid' && (
              <EpisodeGrid
                chars={chars}
                episodeData={episodeFilter
                  ? { [episodeFilter]: episodeData[episodeFilter] || {} }
                  : episodeData
                }
                episodeIds={episodeFilter ? [episodeFilter] : episodeIds}
                alerts={alerts}
                onSelectChar={c => setSelectedCharId(c.id)}
              />
            )}

            {/* Sub-view: Arcos */}
            {epSubView === 'arcos' && (
              <EpisodeArcsTab episodeArcs={episodeArcs} setUniverseEpisodeArcs={setUniverseEpisodeArcs} />
            )}

            {/* Sub-view: Comparar */}
            {epSubView === 'comparar' && (
              <CompareTab
                chars={chars}
                episodeArcs={episodeArcs}
                forces={forces}
                parsedScripts={parsedScripts}
                episodeData={episodeData}
                episodeIds={episodeIds}
              />
            )}

            {/* Sub-view: Personagens */}
            {epSubView === 'personagens' && (
              <>
                {/* Arc filter */}
                <div className={styles.epFilterBar} style={{ borderBottom: '1px solid var(--border-subtle)', padding: '8px 24px' }}>
                  <button
                    className={`${styles.epFilterBtn} ${!arcFilter ? styles.epFilterBtnActive : ''}`}
                    onClick={() => setArcFilter(null)}
                  >
                    Todos
                  </button>
                  {ARC_TYPES.map(a => (
                    <button
                      key={a.id}
                      className={`${styles.epFilterBtn} ${arcFilter === a.id ? styles.epFilterBtnActive : ''}`}
                      onClick={() => setArcFilter(arcFilter === a.id ? null : a.id)}
                      style={arcFilter === a.id ? { borderColor: a.color + '66', color: a.color, background: a.color + '15' } : {}}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, display: 'inline-block', marginRight: 4 }} />
                      {a.label}
                    </button>
                  ))}
                </div>

                {sortedChars.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span style={{ fontSize: 36 }}>👥</span>
                    <p>Sem personagens{arcFilter ? ' nesta categoria' : ''}</p>
                    <small>Adiciona personagens ou importa dos guiões</small>
                  </div>
                ) : (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                    <div className={styles.charGrid}>
                      {sortedChars.map(c => {
                        const arcInfo = ARC_MAP[c.arcType] || ARC_TYPES[0]
                        const total   = charSceneTotal(c.name)
                        const rels    = relCountForChar(c.id)
                        const myEps   = episodeIds.filter(ep => {
                          const key = (c.name || '').toUpperCase()
                          return !!(episodeData[ep]?.[key])
                        })
                        return (
                          <button
                            key={c.id}
                            className={styles.charCard}
                            style={{ borderLeftColor: arcInfo.color }}
                            onClick={() => setSelectedCharId(c.id)}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <div>
                                <div className={styles.charCardName}>{c.name}</div>
                                <span
                                  className={styles.charCardArc}
                                  style={{ background: arcInfo.color + '22', color: arcInfo.color }}
                                >
                                  {arcInfo.label}
                                </span>
                              </div>
                              {c.photo && (
                                <img src={c.photo} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${arcInfo.color}44` }} />
                              )}
                            </div>

                            {c.description && (
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 6, marginBottom: 0 }}>
                                {c.description.slice(0, 80)}{c.description.length > 80 ? '…' : ''}
                              </p>
                            )}

                            <div className={styles.epDots}>
                              {episodeIds.map(ep => {
                                const present = myEps.includes(ep)
                                return (
                                  <span
                                    key={ep}
                                    className={styles.epDot}
                                    style={{
                                      background: present ? arcInfo.color : 'var(--bg-elevated)',
                                      border: `1px solid ${present ? arcInfo.color : 'var(--border-subtle)'}`,
                                    }}
                                    title={ep}
                                  />
                                )
                              })}
                              {episodeIds.length === 0 && myEps.length === 0 && (
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sem episódios</span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                              {total > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{total} cenas</span>}
                              {rels  > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rels} relações</span>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}


        {/* TAB: Forças (sub-views: forcas, conformidade) */}
        {activeTab === 'forcas' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.epFilterBar} style={{ borderBottom: '1px solid var(--border-subtle)', padding: '8px 24px', gap: 6 }}>
              {[
                { id: 'forcas', label: 'Forças' },
                { id: 'conformidade', label: 'Conformidade' },
              ].map(sv => (
                <button
                  key={sv.id}
                  className={`${styles.epFilterBtn} ${forcasSubView === sv.id ? styles.epFilterBtnActive : ''}`}
                  onClick={() => setForcasSubView(sv.id)}
                  style={forcasSubView === sv.id ? { background: '#E05B8D15', borderColor: '#E05B8D66', color: '#E05B8D' } : {}}
                >
                  {sv.label}
                </button>
              ))}
            </div>
            {forcasSubView === 'forcas' && (
              <ForcasTab forces={forces} setUniverseForces={setUniverseForces} />
            )}
            {forcasSubView === 'conformidade' && (
              <ConformityTab
                chars={chars}
                forces={forces}
                episodeArcs={episodeArcs}
                relations={relations}
                parsedScripts={parsedScripts}
                decisions={decisions}
              />
            )}
          </div>
        )}

        {/* TAB: Bible (sub-views: bible, glossario) */}
        {activeTab === 'bible' && (
          <div className={styles.bibleTab}>
            <div className={styles.epFilterBar} style={{ borderBottom: '1px solid var(--border-subtle)', padding: '8px 24px', gap: 6, marginBottom: 16 }}>
              {[
                { id: 'bible', label: 'Bible' },
                { id: 'glossario', label: 'Glossário' },
              ].map(sv => (
                <button
                  key={sv.id}
                  className={`${styles.epFilterBtn} ${bibleSubView === sv.id ? styles.epFilterBtnActive : ''}`}
                  onClick={() => setBibleSubView(sv.id)}
                  style={bibleSubView === sv.id ? { background: '#8B6FBF15', borderColor: '#8B6FBF66', color: '#8B6FBF' } : {}}
                >
                  {sv.label}
                </button>
              ))}
            </div>
            {/* Sub-view: Bible */}
            {bibleSubView === 'bible' && (
            <div className={styles.bibleGrid}>
              <div className={styles.bibleField}>
                <label className={styles.bibleLabel}>Logline</label>
                <input
                  className={styles.bibleInput}
                  value={bible.logline || ''}
                  onChange={e => setUniverseBible({ logline: e.target.value })}
                  placeholder="A história em uma frase..."
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className={styles.bibleField}>
                  <label className={styles.bibleLabel}>Género</label>
                  <input
                    className={styles.bibleInput}
                    value={bible.genre || ''}
                    onChange={e => setUniverseBible({ genre: e.target.value })}
                    placeholder="Drama, comédia, thriller..."
                  />
                </div>
                <div className={styles.bibleField}>
                  <label className={styles.bibleLabel}>Tom</label>
                  <input
                    className={styles.bibleInput}
                    value={bible.tone || ''}
                    onChange={e => setUniverseBible({ tone: e.target.value })}
                    placeholder="Sombrio, esperançoso, irónico..."
                  />
                </div>
              </div>
              <div className={styles.bibleField}>
                <label className={styles.bibleLabel}>Temas</label>
                <input
                  className={styles.bibleInput}
                  value={bible.themes || ''}
                  onChange={e => setUniverseBible({ themes: e.target.value })}
                  placeholder="Identidade, família, redenção..."
                />
              </div>
              <div className={styles.bibleField}>
                <label className={styles.bibleLabel}>Texto da Bible</label>
                <SmartInput
                  rows={12}
                  value={bible.text || ''}
                  onChange={e => setUniverseBible({ text: e.target.value })}
                  placeholder="Descrição detalhada do universo da série — mundo, regras, história, personagens, arcos principais..."
                  context="Bible da série — universo, mundo, regras, história, personagens, arcos principais" />
              </div>

              {/* Antes da Série */}
              <div className={styles.bibleField} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginTop: 10 }}>
                <label className={styles.bibleLabel} style={{ color: '#F5A623' }}>Antes da Série</label>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                  O que existia antes do primeiro episódio. Backstory do mundo, acontecimentos passados, relações anteriores, estado emocional das personagens no arranque.
                </p>
                <SmartInput
                  rows={10}
                  value={bible.beforeSeries || ''}
                  onChange={e => setUniverseBible({ beforeSeries: e.target.value })}
                  placeholder="Há 10 anos, a vila... / O João e a Maria eram... / A empresa foi fundada quando..."
                  context="Antes da série — backstory do mundo e personagens, pré-história da série" />
              </div>

              {/* Escalas do Universo */}
              <div className={styles.bibleField} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginTop: 10 }}>
                <label className={styles.bibleLabel} style={{ color: '#8B6FBF' }}>Escalas do Universo</label>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                  Define as camadas de realidade da série. Cada personagem pertence a uma escala, visível na rede como anéis concêntricos.
                </p>
                <SmartInput
                  rows={6}
                  value={bible.scales || ''}
                  onChange={e => setUniverseBible({ scales: e.target.value })}
                  placeholder="Real: o quotidiano da vila, trabalho, escola...\nSocial: famílias, instituições, poder...\nLiminar: sonhos, presságios, memórias...\nMetafísico: destino, forças invisíveis, maldição..."
                  context="Escalas do universo — camadas de realidade (real, social, liminar, metafísico, sobrenatural)" />
              </div>

              {/* Secções dinâmicas */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <label className={styles.bibleLabel} style={{ margin: 0 }}>Secções</label>
                  <button className={styles.btnAdd} style={{ padding: '4px 12px', fontSize: 12 }}
                    onClick={() => {
                      const secs = bible.sections || []
                      setBibleSections([...secs, {
                        id: `bs-${Date.now()}`,
                        title: 'Nova Secção',
                        text: '',
                        order: secs.length,
                      }])
                    }}>
                    <Plus size={12} /> Secção
                  </button>
                </div>
                {(bible.sections || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map(sec => (
                  <div key={sec.id} style={{
                    background: 'var(--bg-elevated)', borderRadius: 10, padding: 14, marginBottom: 12,
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <input
                        className={styles.bibleInput}
                        style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}
                        value={sec.title}
                        onChange={e => {
                          const updated = (bible.sections || []).map(s => s.id === sec.id ? { ...s, title: e.target.value } : s)
                          setBibleSections(updated)
                        }}
                        placeholder="Título da secção…"
                      />
                      <button className={styles.iconBtn} onClick={() => {
                        setBibleSections((bible.sections || []).filter(s => s.id !== sec.id))
                      }}><Trash2 size={13} /></button>
                    </div>
                    <SmartInput
                      rows={6}
                      value={sec.text || ''}
                      onChange={e => {
                        const updated = (bible.sections || []).map(s => s.id === sec.id ? { ...s, text: e.target.value } : s)
                        setBibleSections(updated)
                      }}
                      placeholder="Conteúdo da secção…"
                      context={`Secção "${sec.title}" da bible da série`}
                    />
                  </div>
                ))}
                {(bible.sections || []).length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>
                    Adiciona secções para Tom &amp; Voz, Influências, Regras de Escrita, Cenas de Referência…
                  </p>
                )}
              </div>
            </div>
            )}

            {/* Sub-view: Glossário */}
            {bibleSubView === 'glossario' && (
            <div className={styles.glossaryTab}>
              <div className={styles.glossaryToolbar}>
                <span className={styles.glossaryCount}>{glossary.length} entradas</span>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    className={styles.searchInput}
                    style={{ paddingLeft: 28 }}
                    placeholder="Pesquisar..."
                    value={glossarySearch}
                    onChange={e => setGlossarySearch(e.target.value)}
                  />
                </div>
                <button className={styles.btnAdd} onClick={() => setShowAddGloss(v => !v)} style={{ padding: '6px 12px' }}>
                  <Plus size={14} /> Entrada
                </button>
              </div>

              <AnimatePresence>
                {showAddGloss && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className={styles.addEntryForm}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <input
                          className={styles.input}
                          style={{ flex: '1 1 160px' }}
                          placeholder="Termo"
                          value={newGlossTerm}
                          onChange={e => setNewGlossTerm(e.target.value)}
                        />
                        <input
                          className={styles.input}
                          style={{ flex: '0 0 140px' }}
                          placeholder="Categoria (opcional)"
                          value={newGlossCat}
                          onChange={e => setNewGlossCat(e.target.value)}
                        />
                      </div>
                      <SmartInput
                        rows={2}
                        placeholder="Definição..."
                        value={newGlossDef}
                        onChange={e => setNewGlossDef(e.target.value)}
                        context="Definição de termo do glossário do universo da série" />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className={styles.btnAdd} onClick={addGlossaryEntry}>Guardar</button>
                        <button className={styles.btnCancel} onClick={() => setShowAddGloss(false)}>Cancelar</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={styles.glossaryList}>
                {filteredGlossary.length === 0 && (
                  <div className={styles.emptyState} style={{ marginTop: 40 }}>
                    <Hash size={32} style={{ opacity: 0.3 }} />
                    <p>{glossarySearch ? 'Sem resultados' : 'Glossário vazio'}</p>
                    {!glossarySearch && <small>Adiciona termos específicos do universo da série</small>}
                  </div>
                )}
                {filteredGlossary.map(entry => (
                  <div key={entry.id} className={styles.glossaryEntry}>
                    <div className={styles.glossaryEntryTop}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={styles.glossaryTerm}>{entry.term}</span>
                        {entry.category && (
                          <span style={{ fontSize: 10, padding: '1px 6px', background: '#7B4FBF22', color: '#A06AFF', borderRadius: 20, fontWeight: 700 }}>
                            {entry.category}
                          </span>
                        )}
                      </div>
                      <button
                        className={styles.iconBtn}
                        onClick={() => removeGlossaryEntry(entry.id)}
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <p className={styles.glossaryDef}>{entry.definition}</p>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        )}

        {/* TAB: Writers' Room (decisões) */}
        {activeTab === 'room' && (
          <DecisionsTab decisions={decisions} setUniverseDecisions={setUniverseDecisions} />
        )}

        {/* TAB: Ficheiros */}
        {activeTab === 'ficheiros' && (
          <FilesTab
            files={files}
            addUniverseFile={addUniverseFile}
            removeUniverseFile={removeUniverseFile}
            setUniverseFiles={setUniverseFiles}
            chars={chars}
            episodeArcs={episodeArcs}
            forces={forces}
            apiKey={apiKey}
          />
        )}
      </div>

      {/* Character Drawer */}
      <AnimatePresence>
        {selectedChar && (
          <CharacterDrawer
            key={selectedChar.id}
            char={selectedChar}
            allChars={chars}
            episodeData={episodeData}
            parsedScripts={parsedScripts}
            team={team}
            onClose={() => setSelectedCharId(null)}
            onUpdate={updateChar}
            onDelete={deleteChar}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
