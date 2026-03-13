// SidesView — Vista 6: geração e gestão de sides
// Seleccionar tipo, destinatário, gerar, ver lista, preview, partilhar

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Users, Film, Camera, Palette, Volume2, Shirt,
  Download, ExternalLink, Eye, EyeOff, Copy, Check, Trash2,
  RefreshCw, AlertTriangle, X,
} from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { generateSide } from '../utils/sidesGenerator.js'
import { renderSideHTML, openSidesPrintWindow, downloadSidesHTML } from '../utils/sidesRenderer.js'
import styles from '../Script.module.css'

const SIDE_TYPES = [
  { id: 'actor-ep',          label: 'Actor + Episódio',       icon: Users,    desc: 'Cenas do actor num episódio (ordem narrativa)' },
  { id: 'actor-dia',         label: 'Actor + Dia',            icon: Film,     desc: 'Cenas de amanhã na ordem de rodagem' },
  { id: 'actor-completo',    label: 'Actor Completo',         icon: FileText, desc: 'Todas as cenas do actor em todos os episódios' },
  { id: 'realizador',        label: 'Realizador',             icon: Camera,   desc: 'Guião completo com notas de realização' },
  { id: 'script-supervisor', label: 'Script Supervisor',      icon: Eye,      desc: 'Foco em continuidade e checklists' },
  { id: 'dept-arte',         label: 'Dir. Arte',              icon: Palette,  desc: 'Locais, adereços, set dressing' },
  { id: 'dept-som',          label: 'Dir. Som',               icon: Volume2,  desc: 'Ambientes sonoros, efeitos, alertas' },
  { id: 'dept-guardaroupa',  label: 'Guarda-Roupa',           icon: Shirt,    desc: 'Looks por personagem, costuras' },
]

export function SidesView({ scriptData }) {
  const { allScenes, costuras, sequencias } = scriptData
  const { 
    parsedScripts, parsedCharacters, productionScript, sceneAssignments,
    shootingDays, continuityData, departmentItems, sceneTakes, universe,
    team, locations, sidesGerados, projectName,
   } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts, parsedCharacters: s.parsedCharacters, productionScript: s.productionScript, sceneAssignments: s.sceneAssignments, shootingDays: s.shootingDays, continuityData: s.continuityData, departmentItems: s.departmentItems, sceneTakes: s.sceneTakes, universe: s.universe, team: s.team, locations: s.locations, sidesGerados: s.sidesGerados, projectName: s.projectName })))
  const addSide = useStore(s => s.addSide)
  const removeSide = useStore(s => s.removeSide)
  const invalidateSide = useStore(s => s.invalidateSide)

  const [selectedType, setSelectedType] = useState(null)
  const [selectedChar, setSelectedChar] = useState('')
  const [selectedEp, setSelectedEp] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [generating, setGenerating] = useState(false)
  const [previewSide, setPreviewSide] = useState(null)
  const [copiedLink, setCopiedLink] = useState(null)

  // Available characters (from parsed scripts)
  const characters = useMemo(() => {
    const chars = new Set()
    allScenes.forEach(s => (s.characters || []).forEach(c => chars.add(c)))
    return [...chars].sort()
  }, [allScenes])

  // Available episodes
  const episodes = useMemo(() => {
    return [...new Set(allScenes.map(s => s.epId))].sort()
  }, [allScenes])

  // Needs character selection?
  const needsChar = selectedType?.startsWith('actor')
  const needsEp = selectedType === 'actor-ep'
  const needsDay = selectedType === 'actor-dia'

  const canGenerate = (() => {
    if (!selectedType) return false
    if (needsChar && !selectedChar) return false
    if (needsEp && !selectedEp) return false
    if (needsDay && !selectedDay) return false
    return true
  })()

  // Context for generator
  const ctx = {
    universe,
    team,
    productionScript,
    costuras,
    shootingDays,
    sceneAssignments,
    continuityData,
    departmentItems,
    locations,
  }

  function handleGenerate() {
    if (!canGenerate) return
    setGenerating(true)

    // Determinar departamento se tipo dept-*
    let tipo = selectedType
    let departamento = null
    if (selectedType.startsWith('dept-')) {
      tipo = 'departamento'
      departamento = selectedType.replace('dept-', '')
      if (departamento === 'guardaroupa') departamento = 'guarda-roupa'
    }

    const side = generateSide({
      tipo,
      destinatarioId: needsChar ? selectedChar : tipo,
      destinatarioNome: needsChar ? selectedChar : (tipo === 'realizador' ? 'Realizador' : tipo === 'script-supervisor' ? 'Script Supervisor' : departamento || tipo),
      episodioId: needsEp ? selectedEp : null,
      dayId: needsDay ? selectedDay : null,
      departamento,
      allScenes,
      ctx,
    })

    addSide?.(side)
    setGenerating(false)
    setSelectedType(null)
    setSelectedChar('')
    setSelectedEp('')
    setSelectedDay('')
  }

  function handlePreview(side) {
    const html = renderSideHTML(side, { projectName })
    setPreviewSide({ ...side, html })
  }

  function handlePrint(side) {
    const html = renderSideHTML(side, { projectName })
    openSidesPrintWindow(html)
  }

  function handleDownload(side) {
    const html = renderSideHTML(side, { projectName })
    const filename = `sides_${side.tipo}_${side.destinatario_nome}_${side.versao_guiao}.html`
      .replace(/\s+/g, '_').toLowerCase()
    downloadSidesHTML(html, filename)
  }

  function handleCopyLink(side) {
    const link = `${window.location.origin}/sides/${side.link_token}`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(side.id)
      setTimeout(() => setCopiedLink(null), 2000)
    })
  }

  // Group sides by status
  const activeSides = (sidesGerados || []).filter(s => s.status === 'activo')
  const outdatedSides = (sidesGerados || []).filter(s => s.status === 'desactualizado')

  return (
    <div className={styles.sidesRoot}>
      {/* ── Generator ── */}
      <div className={styles.sidesGenerator}>
        <h3 className={styles.sidesSectionTitle}>Gerar Sides</h3>

        {/* Type selector */}
        <div className={styles.sidesTypeGrid}>
          {SIDE_TYPES.map(t => (
            <button
              key={t.id}
              className={`${styles.sidesTypeCard} ${selectedType === t.id ? styles.sidesTypeCardActive : ''}`}
              onClick={() => setSelectedType(selectedType === t.id ? null : t.id)}
            >
              <t.icon size={16} />
              <span className={styles.sidesTypeLabel}>{t.label}</span>
              <span className={styles.sidesTypeDesc}>{t.desc}</span>
            </button>
          ))}
        </div>

        {/* Options */}
        <AnimatePresence>
          {selectedType && (
            <motion.div
              className={styles.sidesOptions}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {needsChar && (
                <div className={styles.sidesField}>
                  <label>Personagem / Actor</label>
                  <select value={selectedChar} onChange={e => setSelectedChar(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {characters.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {needsEp && (
                <div className={styles.sidesField}>
                  <label>Episódio</label>
                  <select value={selectedEp} onChange={e => setSelectedEp(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {episodes.map(ep => <option key={ep} value={ep}>{ep}</option>)}
                  </select>
                </div>
              )}

              {needsDay && (
                <div className={styles.sidesField}>
                  <label>Dia de Rodagem</label>
                  <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {shootingDays.map(d => (
                      <option key={d.id} value={d.id}>
                        Dia {d.dayNumber}{d.date ? ` (${d.date})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                className={styles.sidesGenerateBtn}
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
              >
                <FileText size={14} />
                {generating ? 'A gerar...' : 'Gerar Sides'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Active sides list ── */}
      {activeSides.length > 0 && (
        <div className={styles.sidesList}>
          <h3 className={styles.sidesSectionTitle}>
            Sides Activos
            <span className={styles.sidesCount}>{activeSides.length}</span>
          </h3>

          {activeSides.map(side => (
            <div key={side.id} className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <span className={styles.sideCardTitle}>{side.titulo}</span>
                <span className={styles.sideCardCode}>{side.codigo_rastreio}</span>
              </div>
              <div className={styles.sideCardMeta}>
                <span>{new Date(side.gerado_em).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <span>·</span>
                <span>{side.versao_guiao}</span>
                {side.num_acessos > 0 && (
                  <>
                    <span>·</span>
                    <span style={{ color: 'var(--health-green)' }}>
                      {side.num_acessos}× aberto
                    </span>
                  </>
                )}
              </div>
              <div className={styles.sideCardActions}>
                <button onClick={() => handlePreview(side)} title="Preview">
                  <Eye size={12} /> Ver
                </button>
                <button onClick={() => handlePrint(side)} title="Imprimir/PDF">
                  <Download size={12} /> PDF
                </button>
                <button onClick={() => handleDownload(side)} title="Download HTML">
                  <ExternalLink size={12} /> HTML
                </button>
                <button onClick={() => handleCopyLink(side)} title="Copiar link">
                  {copiedLink === side.id ? <Check size={12} /> : <Copy size={12} />}
                  {copiedLink === side.id ? 'Copiado' : 'Link'}
                </button>
                <button
                  onClick={() => invalidateSide?.(side.id)}
                  title="Marcar como desactualizado"
                  style={{ color: 'var(--health-yellow)' }}
                >
                  <AlertTriangle size={12} />
                </button>
                <button
                  onClick={() => removeSide?.(side.id)}
                  title="Remover"
                  style={{ color: 'var(--health-red)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Outdated sides ── */}
      {outdatedSides.length > 0 && (
        <div className={styles.sidesList}>
          <h3 className={styles.sidesSectionTitle} style={{ color: 'var(--health-yellow)' }}>
            <AlertTriangle size={13} /> Desactualizados
            <span className={styles.sidesCount}>{outdatedSides.length}</span>
          </h3>

          {outdatedSides.map(side => (
            <div key={side.id} className={`${styles.sideCard} ${styles.sideCardOutdated}`}>
              <div className={styles.sideCardHeader}>
                <span className={styles.sideCardTitle}>{side.titulo}</span>
                <span className={styles.sideCardBadge}>DESACTUALIZADO</span>
              </div>
              <div className={styles.sideCardMeta}>
                <span>{new Date(side.gerado_em).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>
                <span>·</span>
                <span>{side.versao_guiao}</span>
              </div>
              <div className={styles.sideCardActions}>
                <button onClick={() => handlePreview(side)} title="Ver">
                  <Eye size={12} /> Ver
                </button>
                <button
                  onClick={() => removeSide?.(side.id)}
                  title="Remover"
                  style={{ color: 'var(--health-red)' }}
                >
                  <Trash2 size={12} /> Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {activeSides.length === 0 && outdatedSides.length === 0 && !selectedType && (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
          <FileText size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>Nenhum side gerado ainda.</p>
          <p style={{ fontSize: 10, marginTop: 4 }}>Selecciona um tipo acima para começar.</p>
        </div>
      )}

      {/* ── Preview overlay ── */}
      <AnimatePresence>
        {previewSide && (
          <motion.div
            className={styles.sidesPreviewOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewSide(null)}
          >
            <motion.div
              className={styles.sidesPreviewPanel}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.sidesPreviewHeader}>
                <span>{previewSide.titulo}</span>
                <span className={styles.sidesPreviewCode}>{previewSide.codigo_rastreio}</span>
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                  <button onClick={() => handlePrint(previewSide)} className={styles.sidesPreviewBtn}>
                    <Download size={12} /> PDF
                  </button>
                  <button onClick={() => handleDownload(previewSide)} className={styles.sidesPreviewBtn}>
                    <ExternalLink size={12} /> HTML
                  </button>
                  <button onClick={() => setPreviewSide(null)} className={styles.sidesPreviewClose}>
                    <X size={14} />
                  </button>
                </div>
              </div>
              <iframe
                className={styles.sidesPreviewFrame}
                srcDoc={previewSide.html}
                title="Sides Preview"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
