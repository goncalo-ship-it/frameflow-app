// SequenceView — Vista 3: sequências narrativas com costuras
// Cards expandíveis com visual ████ DIA 2 ···✂··· DIA 5 ████

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scissors, ChevronDown, ChevronUp, Check, AlertTriangle,
  Wand2, Camera,
} from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { detectSequences, detectSequencesViaAPI } from '../utils/sequenceDetector.js'
import styles from '../Script.module.css'

export function SequenceView({ scriptData }) {
  const { sequencias, allScenes, costuras } = scriptData
  const [expanded, setExpanded] = useState(null)
  const [detecting, setDetecting] = useState(false)
  const {  setSequencias, updateCosturaChecklist, apiKey  } = useStore(useShallow(s => ({ setSequencias: s.setSequencias, updateCosturaChecklist: s.updateCosturaChecklist, apiKey: s.apiKey })))

  const hasSequences = sequencias.length > 0

  // Mapa de cenas
  const sceneMap = useMemo(() => {
    const map = {}
    allScenes.forEach(s => { map[s.sceneKey] = s })
    return map
  }, [allScenes])

  // Auto-detect sequences
  async function handleDetect() {
    setDetecting(true)
    try {
      const seqs = apiKey
        ? await detectSequencesViaAPI(allScenes, apiKey)
        : detectSequences(allScenes)
      setSequencias(seqs)
    } catch (err) {
      console.error('Sequence detection failed:', err)
    }
    setDetecting(false)
  }

  function handleCheckItem(costuraId, idx) {
    updateCosturaChecklist(costuraId, idx, { estado: 'verificado' })
  }

  function handleUncheckItem(costuraId, idx) {
    updateCosturaChecklist(costuraId, idx, { estado: 'por-verificar' })
  }

  if (!hasSequences) {
    return (
      <div className={styles.seqRoot}>
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
          <Scissors size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ marginBottom: 12 }}>Nenhuma sequência definida ainda.</p>
          <button
            onClick={handleDetect}
            disabled={detecting}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              background: 'rgba(224, 123, 57, 0.15)', border: '1px solid rgba(224, 123, 57, 0.3)',
              color: 'var(--mod-script, #E07B39)', fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <Wand2 size={14} />
            {detecting ? 'A detectar...' : 'Detectar sequências automaticamente'}
          </button>
          <p style={{ fontSize: 10, marginTop: 8, color: 'var(--text-muted)' }}>
            {apiKey ? 'Usa API para resultados mais ricos' : 'Detecção local por proximidade de local e personagens'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.seqRoot}>
      {/* Re-detect button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
        <button
          onClick={handleDetect}
          disabled={detecting}
          style={{
            padding: '3px 10px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <Wand2 size={10} /> {detecting ? 'A detectar...' : 'Re-detectar'}
        </button>
      </div>

      {sequencias.map(seq => {
        const isExpanded = expanded === seq.id
        const seqScenes = seq.cenas.map(sk => sceneMap[sk]).filter(Boolean)
        const seqCosturas = seq.costuras || []

        return (
          <div
            key={seq.id}
            className={styles.seqCard}
            style={{ borderLeftColor: seq.cor }}
          >
            {/* Header */}
            <div
              className={styles.seqCardHeader}
              onClick={() => setExpanded(isExpanded ? null : seq.id)}
            >
              <div style={{ flex: 1 }}>
                <div className={styles.seqName}>{seq.nome}</div>
                <div className={styles.seqSceneList}>
                  {seq.cenas.join(' · ')}
                </div>

                {/* Day line visual: ████ DIA 2 ···✂··· DIA 5 ████ */}
                {(seq.dias_de_rodagem || []).length > 0 && (
                  <div className={styles.seqDayLine}>
                    {seq.dias_de_rodagem.map((dayNum, i) => (
                      <span key={dayNum}>
                        {i > 0 && seqCosturas.length > 0 && (
                          <span className={styles.seqCosturaIcon}>···✂···</span>
                        )}
                        {i > 0 && seqCosturas.length === 0 && (
                          <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>·</span>
                        )}
                        <span
                          className={styles.seqDayBlock}
                          style={{ background: seq.cor + '22', color: seq.cor }}
                        >
                          DIA {dayNum}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Costura count */}
              {seqCosturas.length > 0 && (
                <span className={styles.seqCosturaCount}>
                  <Scissors size={11} />
                  {seqCosturas.length}
                </span>
              )}

              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>

            {/* Expanded content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className={styles.seqExpanded}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Description */}
                  {seq.descricao && (
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '8px 0', lineHeight: 1.4 }}>
                      {seq.descricao}
                    </p>
                  )}
                  {seq.arco_emocional && (
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                      Arco: {seq.arco_emocional}
                    </p>
                  )}

                  {/* Scenes */}
                  {seqScenes.map(scene => {
                    const costura = seqCosturas.find(
                      c => c.cena_antes === scene.sceneKey || c.cena_depois === scene.sceneKey
                    )
                    const isCosturaAfter = costura?.cena_depois === scene.sceneKey

                    return (
                      <div key={scene.sceneKey}>
                        {/* Costura panel before this scene */}
                        {isCosturaAfter && (
                          <div className={styles.seqCosturaPanel}>
                            <div className={styles.seqCosturaTitle}>
                              <Scissors size={11} />
                              COSTURA — {costura.intervalo_dias} dia(s) de intervalo
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
                              {costura.cena_antes} (DIA {costura.dia_antes}) → {costura.cena_depois} (DIA {costura.dia_depois})
                            </div>

                            {/* Checklist */}
                            {(costura.checklist || []).map((item, idx) => (
                              <div key={idx} className={styles.seqCheckItem}>
                                <button
                                  className={`${styles.seqCheckbox} ${item.estado === 'verificado' ? styles.seqCheckboxChecked : ''}`}
                                  onClick={() =>
                                    item.estado === 'verificado'
                                      ? handleUncheckItem(costura.id, idx)
                                      : handleCheckItem(costura.id, idx)
                                  }
                                >
                                  {item.estado === 'verificado' && <Check size={10} color="white" />}
                                </button>
                                <span className={styles.seqCheckCat}>{item.categoria}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{item.descricao}</span>
                                {item.foto_referencia && <Camera size={10} color="var(--text-muted)" />}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Scene row */}
                        <div className={styles.seqSceneRow}>
                          <span style={{ fontWeight: 700, color: 'var(--text-secondary)', minWidth: 80 }}>
                            {scene.sceneKey}
                          </span>
                          <span style={{ color: 'var(--text-muted)', minWidth: 50 }}>
                            {scene.dia_rodagem ? `DIA ${scene.dia_rodagem}` : '—'}
                          </span>
                          <span style={{ flex: 1, color: 'var(--text-muted)' }}>
                            {scene.location}
                          </span>
                          <span style={{
                            fontSize: 9, fontWeight: 700,
                            color: scene.estado === 'filmada' ? 'var(--health-green)'
                              : scene.estado === 'cortada' ? 'var(--health-red)'
                              : 'var(--text-muted)',
                          }}>
                            {scene.estado === 'por_filmar' ? '' : scene.estado.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
