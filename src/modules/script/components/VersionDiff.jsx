// VersionDiff — Controlo de versões do guião
// Importar nova versão, ver diff semântico, aceitar/rejeitar alterações

import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Check, X, ChevronDown, ChevronUp,
  AlertTriangle, FileText, Plus, Minus, Edit3,
  RefreshCw,
} from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { diffScripts, getAffectedActors, getAffectedSides } from '../utils/scriptDiff.js'
import styles from '../Script.module.css'

const TIPO_COLORS = {
  nova: 'var(--health-green)',
  removida: 'var(--health-red)',
  alterada: 'var(--health-yellow)',
}

const TIPO_ICONS = {
  nova: Plus,
  removida: Minus,
  alterada: Edit3,
}

const TIPO_LABELS = {
  nova: 'NOVA',
  removida: 'REMOVIDA',
  alterada: 'ALTERADA',
}

export function VersionDiff({ scriptData }) {
  const { versao, versoes } = scriptData
  const { 
    parsedScripts, setScriptVersion, invalidateSide,
    sidesGerados, productionScript,
   } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts, setScriptVersion: s.setScriptVersion, invalidateSide: s.invalidateSide, sidesGerados: s.sidesGerados, productionScript: s.productionScript })))

  const [diffResult, setDiffResult] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [accepted, setAccepted] = useState(new Set())
  const [rejected, setRejected] = useState(new Set())
  const [importing, setImporting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const fileRef = useRef(null)

  // Simulated new version import (in reality would parse FDX/HTML)
  // For now, show diff UI with existing data
  const canShowDiff = diffResult !== null

  // Affected actors
  const affectedActors = useMemo(() => {
    if (!diffResult) return []
    return getAffectedActors(diffResult.alteracoes, scriptData.allScenes)
  }, [diffResult, scriptData.allScenes])

  // Affected sides
  const affectedSidesCount = useMemo(() => {
    if (!diffResult) return 0
    return getAffectedSides(diffResult.alteracoes, sidesGerados).length
  }, [diffResult, sidesGerados])

  function handleImportClick() {
    // For demo/prototype: generate diff from current data
    // In production: would accept a file upload and parse it
    setImporting(true)

    // Simulate a diff with some mock changes based on current scenes
    setTimeout(() => {
      // Create a mock "previous version" by modifying current
      const mockOld = JSON.parse(JSON.stringify(parsedScripts))
      const firstEp = Object.keys(mockOld)[0]

      if (firstEp && mockOld[firstEp]?.scenes?.length > 2) {
        // Simulate: modify a dialogue in scene 2
        const scene2 = mockOld[firstEp].scenes[1]
        if (scene2?.dialogue?.[0]) {
          scene2.dialogue[0].text = scene2.dialogue[0].text + ' [versão anterior]'
        }
      }

      const result = diffScripts(mockOld, parsedScripts)

      // Se não há diff real, mostrar mensagem
      if (result.alteracoes.length === 0) {
        // Criar alterações de demonstração
        result.alteracoes = Object.keys(parsedScripts).slice(0, 1).flatMap(epId => {
          const scenes = parsedScripts[epId]?.scenes || []
          return scenes.slice(0, Math.min(3, scenes.length)).map((s, i) => ({
            sceneKey: `${epId}-${s.sceneNumber || s.id}`,
            tipo: i === 0 ? 'alterada' : i === 1 ? 'nova' : 'alterada',
            descricao: i === 0
              ? '2 fala(s) alterada(s)'
              : i === 1
              ? `Cena nova: ${s.intExt || 'INT'}. ${s.location || '—'}`
              : 'Acção alterada (±5 palavras)',
            detalhes: {
              cabecalho: `${s.intExt || 'INT'}. ${(s.location || '').toUpperCase()} — ${s.timeOfDay || 'DIA'}`,
              characters: s.characters || [],
              changes: [i === 0 ? '2 fala(s) alterada(s)' : 'Acção reformulada'],
            },
          }))
        })
        result.resumo = {
          novas: result.alteracoes.filter(a => a.tipo === 'nova').length,
          removidas: result.alteracoes.filter(a => a.tipo === 'removida').length,
          alteradas: result.alteracoes.filter(a => a.tipo === 'alterada').length,
          total: result.alteracoes.length,
        }
      }

      setDiffResult(result)
      setImporting(false)
      setAccepted(new Set())
      setRejected(new Set())
    }, 800)
  }

  function handleAccept(sceneKey) {
    setAccepted(prev => new Set([...prev, sceneKey]))
    setRejected(prev => {
      const next = new Set(prev)
      next.delete(sceneKey)
      return next
    })
  }

  function handleReject(sceneKey) {
    setRejected(prev => new Set([...prev, sceneKey]))
    setAccepted(prev => {
      const next = new Set(prev)
      next.delete(sceneKey)
      return next
    })
  }

  function handleAcceptAll() {
    const allKeys = new Set(diffResult.alteracoes.map(a => a.sceneKey))
    setAccepted(allKeys)
    setRejected(new Set())
  }

  function handleApply() {
    if (accepted.size === 0) return

    // Incrementar versão
    const nextNum = parseInt(versao.replace('v', '')) + 1
    const nextVersionId = `v${nextNum}`

    // Registar alterações aceites
    const alteracoes = diffResult.alteracoes
      .filter(a => accepted.has(a.sceneKey))
      .map(a => ({
        sceneId: a.sceneKey,
        tipo: a.tipo,
        descricao: a.descricao,
      }))

    setScriptVersion(nextVersionId, alteracoes)

    // Invalidar sides afectados
    const affectedSides = getAffectedSides(diffResult.alteracoes.filter(a => accepted.has(a.sceneKey)), sidesGerados)
    affectedSides.forEach(side => {
      invalidateSide?.(side.id)
    })

    // Reset
    setDiffResult(null)
    setAccepted(new Set())
    setRejected(new Set())
  }

  const pending = diffResult
    ? diffResult.alteracoes.filter(a => !accepted.has(a.sceneKey) && !rejected.has(a.sceneKey))
    : []

  return (
    <div className={styles.versionRoot}>
      {/* ── Current version info ── */}
      <div className={styles.versionHeader}>
        <div>
          <span className={styles.versionCurrent}>{versao}</span>
          <span className={styles.versionLabel}>versão actual</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={styles.versionImportBtn}
            onClick={handleImportClick}
            disabled={importing}
          >
            <Upload size={13} />
            {importing ? 'A processar...' : 'Importar Nova Versão'}
          </button>
          {(versoes || []).length > 0 && (
            <button
              className={styles.versionHistoryBtn}
              onClick={() => setShowHistory(v => !v)}
            >
              <FileText size={13} />
              Histórico ({versoes.length})
            </button>
          )}
        </div>
      </div>

      {/* ── Version history ── */}
      <AnimatePresence>
        {showHistory && (versoes || []).length > 0 && (
          <motion.div
            className={styles.versionHistory}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {[...versoes].reverse().map(v => (
              <div key={v.id} className={styles.versionHistoryItem}>
                <span className={styles.versionHistoryId}>{v.id}</span>
                <span className={styles.versionHistoryDate}>
                  {v.importadoEm ? new Date(v.importadoEm).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
                {(v.alteracoes_vs_anterior || []).length > 0 && (
                  <span className={styles.versionHistoryChanges}>
                    {v.alteracoes_vs_anterior.length} alteração(ões)
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Diff results ── */}
      <AnimatePresence>
        {diffResult && (
          <motion.div
            className={styles.diffPanel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Summary */}
            <div className={styles.diffSummary}>
              <div className={styles.diffSummaryTitle}>
                {versao} → v{parseInt(versao.replace('v', '')) + 1}
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                  {diffResult.resumo.total} alteração(ões) detectada(s)
                </span>
              </div>
              <div className={styles.diffSummaryStats}>
                {diffResult.resumo.novas > 0 && (
                  <span style={{ color: 'var(--health-green)' }}>
                    +{diffResult.resumo.novas} nova(s)
                  </span>
                )}
                {diffResult.resumo.alteradas > 0 && (
                  <span style={{ color: 'var(--health-yellow)' }}>
                    ~{diffResult.resumo.alteradas} alterada(s)
                  </span>
                )}
                {diffResult.resumo.removidas > 0 && (
                  <span style={{ color: 'var(--health-red)' }}>
                    -{diffResult.resumo.removidas} removida(s)
                  </span>
                )}
              </div>

              {/* Affected info */}
              {(affectedActors.length > 0 || affectedSidesCount > 0) && (
                <div className={styles.diffAffected}>
                  {affectedActors.length > 0 && (
                    <span>
                      <AlertTriangle size={10} /> {affectedActors.length} actor(es) afectado(s): {affectedActors.slice(0, 5).join(', ')}
                    </span>
                  )}
                  {affectedSidesCount > 0 && (
                    <span>
                      <FileText size={10} /> {affectedSidesCount} sides a regenerar
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className={styles.diffActions}>
                <button className={styles.diffAcceptAllBtn} onClick={handleAcceptAll}>
                  <Check size={12} /> Aceitar Todas
                </button>
                <button
                  className={styles.diffApplyBtn}
                  onClick={handleApply}
                  disabled={accepted.size === 0}
                >
                  <RefreshCw size={12} /> Aplicar ({accepted.size})
                </button>
                <button
                  className={styles.diffCancelBtn}
                  onClick={() => { setDiffResult(null); setAccepted(new Set()); setRejected(new Set()) }}
                >
                  <X size={12} /> Cancelar
                </button>
              </div>
            </div>

            {/* Individual changes */}
            {diffResult.alteracoes.map(alt => {
              const isExpanded = expanded === alt.sceneKey
              const isAccepted = accepted.has(alt.sceneKey)
              const isRejected = rejected.has(alt.sceneKey)
              const Icon = TIPO_ICONS[alt.tipo]

              return (
                <div
                  key={alt.sceneKey}
                  className={`${styles.diffItem} ${isAccepted ? styles.diffItemAccepted : ''} ${isRejected ? styles.diffItemRejected : ''}`}
                  style={{ borderLeftColor: TIPO_COLORS[alt.tipo] }}
                >
                  <div className={styles.diffItemHeader} onClick={() => setExpanded(isExpanded ? null : alt.sceneKey)}>
                    <Icon size={12} style={{ color: TIPO_COLORS[alt.tipo], flexShrink: 0 }} />
                    <span className={styles.diffItemKey}>{alt.sceneKey}</span>
                    <span className={styles.diffItemBadge} style={{ color: TIPO_COLORS[alt.tipo], borderColor: TIPO_COLORS[alt.tipo] }}>
                      {TIPO_LABELS[alt.tipo]}
                    </span>
                    <span className={styles.diffItemDesc}>{alt.descricao}</span>
                    <div className={styles.diffItemActions} onClick={e => e.stopPropagation()}>
                      <button
                        className={`${styles.diffAcceptBtn} ${isAccepted ? styles.diffBtnActive : ''}`}
                        onClick={() => handleAccept(alt.sceneKey)}
                        title="Aceitar"
                      >
                        <Check size={11} />
                      </button>
                      <button
                        className={`${styles.diffRejectBtn} ${isRejected ? styles.diffBtnActive : ''}`}
                        onClick={() => handleReject(alt.sceneKey)}
                        title="Rejeitar"
                      >
                        <X size={11} />
                      </button>
                    </div>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className={styles.diffItemExpanded}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className={styles.diffDetailRow}>
                          <span className={styles.diffDetailLabel}>Cabeçalho</span>
                          <span>{alt.detalhes?.cabecalho || '—'}</span>
                        </div>
                        {(alt.detalhes?.characters || []).length > 0 && (
                          <div className={styles.diffDetailRow}>
                            <span className={styles.diffDetailLabel}>Personagens</span>
                            <span>{alt.detalhes.characters.join(' · ')}</span>
                          </div>
                        )}
                        {(alt.detalhes?.changes || []).length > 0 && (
                          <div className={styles.diffDetailRow}>
                            <span className={styles.diffDetailLabel}>Detalhes</span>
                            <ul className={styles.diffChangesList}>
                              {alt.detalhes.changes.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}

            {/* Pending counter */}
            {pending.length > 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-3)', fontSize: 11, color: 'var(--text-muted)' }}>
                {pending.length} alteração(ões) por decidir
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state when no diff active */}
      {!diffResult && (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
          <Upload size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>Importa uma nova versão do guião para ver as diferenças.</p>
          <p style={{ fontSize: 10, marginTop: 4 }}>
            O FRAME detecta automaticamente cenas novas, removidas e alteradas.
          </p>
        </div>
      )}
    </div>
  )
}
