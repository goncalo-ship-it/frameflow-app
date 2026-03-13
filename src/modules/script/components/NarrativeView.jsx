// NarrativeView — Vista 1: guião na ordem narrativa do autor
// SC001 → SC002 → SC003 → ... com camada de produção visual

import { useMemo } from 'react'
import { Scissors, MessageSquare, AlertTriangle } from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import styles from '../Script.module.css'

const TYPE_COLORS = {
  'Âncora': '#A02E6F', 'âncora': '#A02E6F',
  'Grupo': '#2E6FA0', 'grupo': '#2E6FA0',
  'Diálogo': '#2EA080', 'diálogo': '#2EA080',
  'Gag': '#BF6A2E', 'gag': '#BF6A2E',
  'Solo': '#7B4FBF', 'solo': '#7B4FBF',
  'Transição': '#6E6E78', 'transição': '#6E6E78',
}

const STATUS_STYLES = {
  por_filmar: { bg: 'transparent', color: 'var(--text-muted)', label: 'Por filmar' },
  filmada: { bg: 'rgba(34,197,94,0.12)', color: 'var(--health-green)', label: 'Filmada' },
  pick_pendente: { bg: 'rgba(251,191,36,0.12)', color: 'var(--health-yellow)', label: 'Pick' },
  cortada: { bg: 'rgba(248,113,113,0.1)', color: 'var(--health-red)', label: 'Cortada' },
  condicional: { bg: 'rgba(139,92,246,0.1)', color: '#8B5CF6', label: 'Condicional' },
}

export function NarrativeView({ scriptData }) {
  const { allScenes, sceneToSequence, costuras } = scriptData
  const {  parsedScripts  } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts })))

  // Agrupar por episódio
  const episodes = useMemo(() => {
    const map = {}
    allScenes.forEach(scene => {
      if (!map[scene.epId]) map[scene.epId] = []
      map[scene.epId].push(scene)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [allScenes])

  // Mapa de costuras por cena
  const costuraMap = useMemo(() => {
    const map = {}
    costuras.forEach(c => {
      map[c.cena_antes] = c
      map[c.cena_depois] = c
    })
    return map
  }, [costuras])

  return (
    <div className={styles.narrRoot}>
      {episodes.map(([epId, scenes]) => (
        <div key={epId}>
          <div className={styles.narrEpHeader}>
            {epId} — {scenes.length} cenas
          </div>

          {scenes.map(scene => {
            const seq = sceneToSequence[scene.sceneKey]
            const costura = costuraMap[scene.sceneKey]
            const status = STATUS_STYLES[scene.estado] || STATUS_STYLES.por_filmar
            const typeColor = TYPE_COLORS[scene.type || scene.sceneType] || '#6E6E78'

            const stateClass = scene.estado === 'filmada' ? styles.narrSceneFilmada
              : scene.estado === 'cortada' ? styles.narrSceneCortada
              : scene.estado === 'pick_pendente' ? styles.narrScenePick
              : scene.estado === 'condicional' ? styles.narrSceneCondicional
              : ''

            return (
              <div
                key={scene.sceneKey}
                className={`${styles.narrScene} ${stateClass}`}
                style={seq ? { borderLeftColor: seq.cor } : {}}
              >
                {/* Heading */}
                <div className={styles.narrHeading}>
                  {scene.intExt}. {scene.location} — {scene.timeOfDay || 'DIA'}
                </div>

                {/* Meta badges */}
                <div className={styles.narrMeta}>
                  {scene.dia_rodagem ? (
                    <span className={styles.narrDayBadge}>DIA {scene.dia_rodagem}</span>
                  ) : (
                    <span className={`${styles.narrDayBadge} ${styles.narrDayBadgeNone}`}>SEM DIA</span>
                  )}

                  <span
                    className={styles.narrTypeBadge}
                    style={{ background: typeColor + '22', color: typeColor, borderColor: typeColor + '55' }}
                  >
                    {scene.type || scene.sceneType || '—'}
                  </span>

                  {scene.estado !== 'por_filmar' && (
                    <span
                      className={styles.narrStatusBadge}
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  )}

                  {costura && (
                    <span className={styles.narrCosturaBadge} title="Ponto de costura">
                      <Scissors size={10} />
                      costura
                    </span>
                  )}

                  {(scene.notas_realizador || []).length > 0 && (
                    <span className={styles.narrNoteCount}>
                      <MessageSquare size={9} /> {scene.notas_realizador.length} nota(s)
                    </span>
                  )}
                </div>

                {/* Script text */}
                <div className={styles.narrScriptText}>
                  {/* Action lines */}
                  {(scene.action || []).length > 0 && scene.dialogue?.length === 0 && (
                    scene.action.map((line, i) => (
                      <p key={i} className={styles.narrAction}>{line}</p>
                    ))
                  )}

                  {/* Dialogue blocks */}
                  {(scene.dialogue || []).map((d, i) => (
                    <div key={i} className={styles.narrDialogueBlock}>
                      <div className={styles.narrDialogueChar}>{d.character}</div>
                      <div className={styles.narrDialogueText}>{d.text}</div>
                    </div>
                  ))}

                  {/* Action after dialogue */}
                  {(scene.action || []).length > 0 && (scene.dialogue || []).length > 0 && (
                    scene.action.map((line, i) => (
                      <p key={`a-${i}`} className={styles.narrAction}>{line}</p>
                    ))
                  )}

                  {/* Fallback: synopsis */}
                  {!scene.dialogue?.length && !scene.action?.length && scene.synopsis && (
                    <p className={styles.narrAction}>{scene.synopsis}</p>
                  )}
                </div>

                {/* Side panel (hover) */}
                <div className={styles.narrSidePanel}>
                  {scene.notas_realizador?.[0] && (
                    <div className={styles.narrSideNote}>
                      {scene.notas_realizador[0]}
                    </div>
                  )}
                  {costura && (
                    <div className={styles.narrSideNote} style={{ color: 'var(--health-red)' }}>
                      <Scissors size={8} /> Costura: {costura.intervalo_dias}d intervalo
                    </div>
                  )}
                  {scene.continuidade?.photos?.[0] && (
                    <img src={scene.continuidade.photos[0]} className={styles.narrSidePhoto} alt="" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
