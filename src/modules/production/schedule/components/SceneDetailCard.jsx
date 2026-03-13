// SceneDetailCard — centered overlay modal de detalhe de cena
// Abre ao clicar qualquer cena em qualquer vista
// Cruza dados de: guião, continuidade, departamentos, universo, takes

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  X, Users, MapPin, FileText, Camera, Clock,
  AlertTriangle, Check, Repeat, Star, Eye,
  Shirt, Palette, Sparkles, Scissors, ScrollText,
} from 'lucide-react'
import { useStore } from '../../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { SCENE_TAGS } from '../../index.jsx'
import styles from '../Schedule.module.css'

const TYPE_COLORS = {
  'Âncora':    '#A02E6F',
  'Grupo':     '#2E6FA0',
  'Diálogo':   '#2EA080',
  'Gag':       '#BF6A2E',
  'Solo':      '#7B4FBF',
  'Transição': '#6E6E78',
}

const DEPT_ICONS = {
  wardrobe: Shirt,
  art: Palette,
  makeup: Sparkles,
  hair: Scissors,
}

export function SceneDetailCard({ scene, onClose }) {
  const { 
    parsedScripts, continuityData, continuityDecisions,
    departmentItems, sceneTakes, sceneTags, universe, sceneAssignments,
    shootingDays, team, locations,
    addSceneTag, removeSceneTag, navigateToScene,
   } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts, continuityData: s.continuityData, continuityDecisions: s.continuityDecisions, departmentItems: s.departmentItems, sceneTakes: s.sceneTakes, sceneTags: s.sceneTags, universe: s.universe, sceneAssignments: s.sceneAssignments, shootingDays: s.shootingDays, team: s.team, locations: s.locations, addSceneTag: s.addSceneTag, removeSceneTag: s.removeSceneTag, navigateToScene: s.navigateToScene })))

  if (!scene) return null

  const sceneKey = scene.sceneKey
  const epId = scene.epId

  // ── Dados do guião (diálogos, acções) ──────────────────────────
  const scriptScene = useMemo(() => {
    const ep = parsedScripts[epId]
    if (!ep?.scenes) return null
    return ep.scenes.find(s =>
      `${epId}-${s.sceneNumber || s.id}` === sceneKey ||
      s.id === scene.sceneNumber ||
      s.sceneNumber === scene.sceneNumber
    )
  }, [parsedScripts, epId, sceneKey, scene.sceneNumber])

  // ── Continuidade ───────────────────────────────────────────────
  const contData = continuityData[sceneKey] || null
  const contDecisions = useMemo(() =>
    (continuityDecisions || []).filter(d => d.scene === sceneKey),
    [continuityDecisions, sceneKey]
  )

  // ── Items de departamento para esta cena ───────────────────────
  const deptItems = useMemo(() =>
    (departmentItems || []).filter(d =>
      (d.scenes || []).includes(sceneKey)
    ),
    [departmentItems, sceneKey]
  )

  // ── Takes ──────────────────────────────────────────────────────
  const takes = sceneTakes[sceneKey] || []
  const bomCount = takes.filter(t => t.status === 'bom').length
  const totalTakes = takes.length

  // ── Personagens do universo ────────────────────────────────────
  const charDetails = useMemo(() => {
    const chars = scene.characters || scriptScene?.characters || []
    return chars.map(name => {
      const uChar = (universe?.chars || []).find(c =>
        c.name.toLowerCase() === name.toLowerCase()
      )
      const teamMember = (team || []).find(m =>
        m.name?.toLowerCase() === name.toLowerCase() || m.role?.toLowerCase() === name.toLowerCase()
      )
      return { name, uChar, teamMember }
    })
  }, [scene.characters, scriptScene?.characters, universe?.chars, team])

  // ── Dia atribuído ──────────────────────────────────────────────
  const dayId = sceneAssignments[sceneKey]
  const day = dayId ? shootingDays.find(d => d.id === dayId) : null

  // ── Local detalhado ────────────────────────────────────────────
  const locDetail = (locations || []).find(l =>
    l.name?.toLowerCase().includes((scene.location || '').toLowerCase()) ||
    (scene.location || '').toLowerCase().includes((l.name || '').toLowerCase())
  )

  const color = TYPE_COLORS[scene.sceneType] || '#6E6E78'

  return (
    <motion.div
      className={styles.sceneDetailOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.sceneDetailDrawer}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={styles.sdHeader} style={{ borderBottomColor: color }}>
          <div className={styles.sdHeaderTop}>
            <span className={styles.sdEp}>{epId}</span>
            <span className={styles.sdNum}>Cena #{scene.sceneNumber || scene.id}</span>
            <span
              className={styles.sdType}
              style={{ background: color + '22', color, borderColor: color + '55' }}
            >
              {scene.sceneType}
            </span>
            <span className={styles.sdIE} style={{ color: scene.intExt === 'EXT' ? '#F5A623' : 'var(--text-muted)' }}>
              {scene.intExt}
            </span>
            <button className={styles.sdClose} onClick={onClose}><X size={16} /></button>
          </div>
          <div className={styles.sdHeaderMeta}>
            <span><MapPin size={11} /> {scene.location || '—'}</span>
            <span><Clock size={11} /> {scene.duration}min</span>
            {day && <span><Camera size={11} /> D{day.dayNumber || '?'} — {day.date || '?'}</span>}
            {!day && <span style={{ color: 'var(--health-red)' }}><AlertTriangle size={11} /> Sem dia</span>}
          </div>
          {scriptScene && (
            <button
              onClick={() => { navigateToScene(scene.sceneNumber || scene.id); onClose() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                margin: '8px 0 0', padding: '6px 12px', borderRadius: 6,
                border: '1px solid var(--accent, #E07B39)',
                background: 'var(--accent, #E07B39)11',
                color: 'var(--accent, #E07B39)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent, #E07B39)22' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent, #E07B39)11' }}
            >
              <ScrollText size={13} /> Ver no Guião completo
            </button>
          )}
        </div>

        <div className={styles.sdBody}>
          {/* ── 1. Personagens (top priority) ── */}
          <Section title="Elenco" icon={<Users size={13} />} count={charDetails.length}>
            {charDetails.length === 0 && <p className={styles.sdEmpty}>Sem personagens identificadas</p>}
            {charDetails.map(({ name, uChar, teamMember }) => (
              <div key={name} className={styles.sdCharRow}>
                {uChar?.photo ? (
                  <img src={uChar.photo} className={styles.sdCharPhoto} alt={name} />
                ) : (
                  <div className={styles.sdCharPhotoPlaceholder}>{name[0]}</div>
                )}
                <div className={styles.sdCharInfo}>
                  <span className={styles.sdCharName}>{name}</span>
                  {uChar?.arcType && <span className={styles.sdCharArc}>{uChar.arcType}</span>}
                  {uChar?.description && <span className={styles.sdCharDesc}>{uChar.description}</span>}
                  {teamMember && (
                    <span className={styles.sdCharActor}>
                      Actor: {teamMember.name} {teamMember.phone && `· ${teamMember.phone}`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </Section>

          {/* ── 2. Local ── */}
          <Section title="Local" icon={<MapPin size={13} />}>
            <div className={styles.sdLocBlock}>
              <span className={styles.sdLocName}>{scene.location || '—'}</span>
              {scene.timeOfDay && <span className={styles.sdLocTime}>{scene.timeOfDay}</span>}
              {locDetail && (
                <>
                  {locDetail.address && <span className={styles.sdLocAddr}>{locDetail.address}</span>}
                  {locDetail.notes && <span className={styles.sdLocNotes}>{locDetail.notes}</span>}
                  {locDetail.photo && <img src={locDetail.photo} className={styles.sdLocPhoto} alt="" />}
                </>
              )}
            </div>
          </Section>

          {/* ── 3. Diálogos (formato guião) ── */}
          {scriptScene && (scriptScene.dialogue?.length > 0 || scriptScene.action?.length > 0) && (
            <Section title="Guião" icon={<FileText size={13} />}>
              <div className={styles.sdScript}>
                {/* Heading */}
                <div className={styles.sdScriptHeading}>
                  {scene.intExt}. {scene.location} — {scene.timeOfDay || 'DIA'}
                </div>

                {/* Acções e diálogos entrelaçados */}
                {scriptScene.action?.length > 0 && scriptScene.dialogue?.length === 0 && (
                  scriptScene.action.map((line, i) => (
                    <p key={i} className={styles.sdScriptAction}>{line}</p>
                  ))
                )}

                {scriptScene.dialogue?.map((d, i) => (
                  <div key={i} className={styles.sdDialogueBlock}>
                    <div className={styles.sdDialogueChar}>{d.character}</div>
                    <div className={styles.sdDialogueText}>{d.text}</div>
                  </div>
                ))}

                {scriptScene.action?.length > 0 && scriptScene.dialogue?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {scriptScene.action.map((line, i) => (
                      <p key={i} className={styles.sdScriptAction}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ── 4. Continuidade ── */}
          {(contData || contDecisions.length > 0) && (
            <Section title="Continuidade" icon={<Eye size={13} />}>
              {contData && (
                <div className={styles.sdContGrid}>
                  {contData.wardrobe && (
                    <div className={styles.sdContItem}>
                      <span className={styles.sdContLabel}>Guarda-roupa</span>
                      <span>{contData.wardrobe}</span>
                    </div>
                  )}
                  {contData.props && (
                    <div className={styles.sdContItem}>
                      <span className={styles.sdContLabel}>Adereços</span>
                      <span>{contData.props}</span>
                    </div>
                  )}
                  {contData.makeup && (
                    <div className={styles.sdContItem}>
                      <span className={styles.sdContLabel}>Caracterização</span>
                      <span>{contData.makeup}</span>
                    </div>
                  )}
                  {contData.notes && (
                    <div className={styles.sdContItem}>
                      <span className={styles.sdContLabel}>Notas</span>
                      <span>{contData.notes}</span>
                    </div>
                  )}
                  {contData.photos?.length > 0 && (
                    <div className={styles.sdContPhotos}>
                      {contData.photos.map((p, i) => (
                        <img key={i} src={p} className={styles.sdContPhoto} alt="" />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {contDecisions.length > 0 && (
                <div className={styles.sdContDecisions}>
                  {contDecisions.map(d => (
                    <div key={d.id} className={styles.sdContDecision}>
                      <span className={styles.sdContDecCat}>{d.category}</span>
                      <span>{d.decision}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* ── 5. Departamentos ── */}
          {deptItems.length > 0 && (
            <Section title="Departamentos" icon={<Palette size={13} />} count={deptItems.length}>
              {deptItems.map(item => {
                const Icon = DEPT_ICONS[item.department] || Palette
                return (
                  <div key={item.id} className={styles.sdDeptRow}>
                    <Icon size={11} />
                    <span className={styles.sdDeptLabel}>{item.department}</span>
                    <span className={styles.sdDeptNotes}>{item.notes || '—'}</span>
                    {item.approved && <Check size={10} color="var(--health-green)" />}
                  </div>
                )
              })}
            </Section>
          )}

          {/* ── 6. Takes (rodagem) ── */}
          {totalTakes > 0 && (
            <Section title="Takes" icon={<Camera size={13} />} count={`${bomCount}/${totalTakes}`}>
              <div className={styles.sdTakesList}>
                {takes.map(t => (
                  <div
                    key={t.id}
                    className={styles.sdTakeRow}
                    style={{
                      borderLeftColor: t.status === 'bom' ? 'var(--health-green)'
                        : t.status === 'parcial' ? 'var(--health-yellow)'
                        : 'var(--health-red)',
                    }}
                  >
                    <span className={styles.sdTakeStatus}>{t.status.toUpperCase()}</span>
                    {t.notes && <span className={styles.sdTakeNotes}>{t.notes}</span>}
                    <span className={styles.sdTakeTime}>
                      {new Date(t.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── 7. Sinopse / Synopsis ── */}
          {(scriptScene?.synopsis || scene.synopsis) && (
            <Section title="Sinopse" icon={<Star size={13} />}>
              <p className={styles.sdSynopsis}>{scriptScene?.synopsis || scene.synopsis}</p>
            </Section>
          )}

          {/* ── Modificadores de duração ── */}
          {scene.durationMods?.length > 0 && (
            <Section title="Modificadores" icon={<Clock size={13} />}>
              <div className={styles.sdModsList}>
                {scene.durationMods.map((m, i) => (
                  <span key={i} className={styles.sdModChip}>
                    {m.label} ({m.factor > 1 ? '+' : ''}{Math.round((m.factor - 1) * 100)}%)
                  </span>
                ))}
                <span className={styles.sdModTotal}>
                  Base: {scene.durationBase}m → Final: {scene.duration}m (×{scene.durationFactor?.toFixed(2)})
                </span>
              </div>
            </Section>
          )}

          {/* ── 8. Características (Scene Tags) ── */}
          <Section title="Características" icon={<Star size={13} />}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {SCENE_TAGS.map(tag => {
                const active = (sceneTags[sceneKey] || []).includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => active ? removeSceneTag(sceneKey, tag.id) : addSceneTag(sceneKey, tag.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      padding: '3px 8px', borderRadius: 4,
                      border: `1px solid ${active ? tag.color : 'var(--border-subtle, #333)'}`,
                      background: active ? tag.color + '22' : 'none',
                      color: active ? tag.color : 'var(--text-muted)',
                      fontSize: 11, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {tag.icon} {tag.label}
                  </button>
                )
              })}
            </div>
          </Section>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Section wrapper ──────────────────────────────────────────────
function Section({ title, icon, count, children }) {
  return (
    <div className={styles.sdSection}>
      <div className={styles.sdSectionTitle}>
        {icon}
        <span>{title}</span>
        {count != null && <span className={styles.sdSectionCount}>{count}</span>}
      </div>
      {children}
    </div>
  )
}
