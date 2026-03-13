// Corretor contextual — compara guião com universo via Anthropic API
// Mecanismo CORRIGIR / IGNORAR / ANOTAR

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, CheckCircle, EyeOff, MessageSquare, AlertTriangle, Info } from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { fetchAPI } from '../../core/api.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { SmartInput } from '../../components/shared/SmartInput.jsx'
import styles from './ContextualCorrector.module.css'

// Análise contextual via API centralizada
async function analyzeScriptWithApi(scenes, apiKey, parsedCharacters, parsedLocations) {
  const scenesSummary = scenes.slice(0, 20).map(s =>
    `Cena ${s.sceneNumber}: ${s.intExt || ''} ${s.location || ''} - ${s.timeOfDay || ''} - Personagens: ${(s.characters||[]).join(', ')} - ${(s.description||'').slice(0,100)}`
  ).join('\n')

  const charList = parsedCharacters.slice(0, 20).map(c => c.name).join(', ')
  const locList  = parsedLocations.slice(0, 15).join(', ')

  const prompt = `Analisa estas cenas de guião e identifica problemas de consistência, continuidade e qualidade narrativa.

PERSONAGENS CONHECIDAS: ${charList || 'não definidas'}
LOCAIS CONHECIDOS: ${locList || 'não definidos'}

CENAS:
${scenesSummary}

Responde APENAS com JSON no formato:
{
  "items": [
    {
      "sceneId": "Cena X",
      "severity": "ok|warn|error",
      "text": "Descrição do problema ou observação",
      "suggestion": "Sugestão de melhoria (opcional)"
    }
  ]
}

Identifica: inconsistências de personagens, problemas de continuidade, cenas muito longas ou curtas, locais mal definidos, ritmo narrativo, etc.
Máximo 15 items. Sê específico e útil.`

  const text = await fetchAPI({
    apiKey,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2048,
  })

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Resposta inválida da API')
  let data
  try { data = JSON.parse(jsonMatch[0]) } catch { return null }
  return data
}

const SEVERITY_CONFIG = {
  ok:   { icon: '🟢', label: 'Fantástico', color: 'var(--health-green)', badge: 'ok' },
  warn: { icon: '🟡', label: 'Atenção',    color: 'var(--health-yellow)', badge: 'warn' },
  error:{ icon: '🔴', label: 'Conflito',   color: 'var(--health-red)',    badge: 'danger' },
}

const ITEM_ACTIONS = {
  pending:  null,
  fixed:    'CORRIGIR',
  ignored:  'IGNORAR',
  annotated:'ANOTAR',
}

export function ContextualCorrector({ script }) {
  const {  apiKey, parsedCharacters, parsedLocations  } = useStore(useShallow(s => ({ apiKey: s.apiKey, parsedCharacters: s.parsedCharacters, parsedLocations: s.parsedLocations })))
  const [loading, setLoading]   = useState(false)
  const [items, setItems]       = useState([])
  const [apiError, setApiError] = useState(null)
  const [annotating, setAnnotating] = useState(null)
  const [annotationText, setAnnotationText] = useState('')

  const hasScript = script && script.scenes?.length > 0

  const runAnalysis = async () => {
    if (!hasScript) return
    if (!apiKey) {
      setApiError('Sem chave API. Adiciona a tua chave Anthropic na sidebar (☰ → campo API Key).')
      return
    }
    setLoading(true)
    setApiError(null)

    try {
      const result = await analyzeScriptWithApi(script.scenes, apiKey, parsedCharacters, parsedLocations)
      setItems((result.items || []).map((item, i) => ({
        ...item,
        id:     i,
        status: 'pending',
        note:   '',
      })))
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const act = (id, action, note = '') => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: action, note } : item
    ))
    if (action === 'annotated') setAnnotating(null)
  }

  const pendingCount  = items.filter(i => i.status === 'pending').length
  const conflictCount = items.filter(i => i.severity === 'error').length
  const conformScore  = items.length > 0
    ? Math.round(((items.length - conflictCount) / items.length) * 100)
    : null

  return (
    <div className={styles.wrapper}>

      {/* Sem chave API */}
      {!apiKey && (
        <div className={styles.apiKeyPanel}>
          <Info size={14} color="var(--accent-light)" />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Adiciona a tua chave Anthropic na sidebar (☰ → campo API Key) para activar o corretor.
          </p>
        </div>
      )}

      {/* Header e acção principal */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Corretor Contextual</h3>
          <p className={styles.subtitle}>
            Compara o guião com o universo da série via Anthropic API
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {conformScore !== null && (
            <div className={styles.scoreCircle}>
              <span className={styles.scoreValue}>{conformScore}%</span>
              <span className={styles.scoreLabel}>conformidade</span>
            </div>
          )}
          <button
            className={styles.runBtn}
            onClick={runAnalysis}
            disabled={loading || !hasScript}
          >
            {loading ? (
              <><div className={styles.spinner} /> A analisar...</>
            ) : (
              <><Zap size={15} /> Correr análise</>
            )}
          </button>
        </div>
      </div>

      {/* Sem guião */}
      {!hasScript && (
        <div className={styles.empty}>
          <AlertTriangle size={24} color="var(--text-muted)" />
          <p>Carrega um guião no tab "Guião" primeiro</p>
        </div>
      )}

      {/* Erro de API */}
      {apiError && (
        <div className={styles.apiError}>
          <AlertTriangle size={14} />
          {apiError}
        </div>
      )}

      {/* Resumo */}
      {items.length > 0 && (
        <div className={styles.summary}>
          <SummaryStat label="Por resolver" value={pendingCount} badge="warn" />
          <SummaryStat label="Conflitos"    value={conflictCount} badge="danger" />
          <SummaryStat label="Corrigidos"   value={items.filter(i => i.status === 'fixed').length} badge="ok" />
          <SummaryStat label="Anotados"     value={items.filter(i => i.status === 'annotated').length} badge="info" />
        </div>
      )}

      {/* Lista de items */}
      <div className={styles.itemList}>
        {items.map(item => {
          const cfg = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.warn
          const isDone = item.status !== 'pending'

          return (
            <motion.div
              key={item.id}
              className={`${styles.item} ${isDone ? styles.itemDone : ''}`}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Indicador de severidade */}
              <span className={styles.severity} style={{ color: cfg.color }}>
                {cfg.icon}
              </span>

              {/* Conteúdo */}
              <div className={styles.itemContent}>
                <div className={styles.itemTop}>
                  <Badge variant="default" size="sm">{item.sceneId || '—'}</Badge>
                  <Badge variant={cfg.badge} size="sm">{cfg.label}</Badge>
                  {item.status !== 'pending' && (
                    <Badge variant={item.status === 'fixed' ? 'ok' : item.status === 'ignored' ? 'default' : 'info'} size="sm">
                      {item.status === 'fixed' ? 'Corrigido' : item.status === 'ignored' ? 'Ignorado' : 'Anotado'}
                    </Badge>
                  )}
                </div>
                <p className={styles.itemText}>{item.text}</p>
                {item.suggestion && (
                  <p className={styles.itemSuggestion}>💡 {item.suggestion}</p>
                )}
                {item.note && (
                  <p className={styles.itemNote}>📝 {item.note}</p>
                )}

                {/* Campo de anotação */}
                <AnimatePresence>
                  {annotating === item.id && (
                    <motion.div
                      className={styles.annotateBox}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <SmartInput
                        placeholder="Porquê esta decisão? Enriquece o universo..."
                        value={annotationText}
                        onChange={e => setAnnotationText(e.target.value)}
                        rows={2}
                        autoFocus
                        context="Anotação de decisão de guião — justificação criativa"
                      />
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className={styles.btnCancel} onClick={() => setAnnotating(null)}>Cancelar</button>
                        <button className={styles.btnSaveNote} onClick={() => act(item.id, 'annotated', annotationText)}>
                          Guardar nota
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Acções CORRIGIR / IGNORAR / ANOTAR */}
              {item.status === 'pending' && (
                <div className={styles.actions}>
                  <button className={`${styles.actionBtn} ${styles.fix}`} onClick={() => act(item.id, 'fixed')} title="Corrigir">
                    <CheckCircle size={14} />
                  </button>
                  <button className={`${styles.actionBtn} ${styles.ignore}`} onClick={() => act(item.id, 'ignored')} title="Ignorar">
                    <EyeOff size={14} />
                  </button>
                  <button className={`${styles.actionBtn} ${styles.annotate}`} onClick={() => { setAnnotating(item.id); setAnnotationText('') }} title="Anotar">
                    <MessageSquare size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function SummaryStat({ label, value, badge }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
      <Badge variant={badge} size="md">{value}</Badge>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}
