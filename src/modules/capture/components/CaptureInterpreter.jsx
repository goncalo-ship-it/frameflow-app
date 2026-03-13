// CaptureInterpreter.jsx — Mostra resultado da interpretação e perguntas

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useI18n } from '../../../core/i18n/index.js'
import styles from './Capture.module.css'

// Mapeamento tipo → classe CSS de cor
const TIPO_CLASS = {
  'guarda-roupa':    styles.tipoGuardaRoupa,
  'local':           styles.tipoLocal,
  'nota-realizador': styles.tipoNotaRealizador,
  'prop':            styles.tipoProp,
  'recibo':          styles.tipoRecibo,
  'casting':         styles.tipoCasting,
  'referencia':      styles.tipoReferencia,
}

function TipoChip({ tipo, t }) {
  const label = t(`capture.types.${tipo}`) || tipo
  const cls = TIPO_CLASS[tipo] || styles.tipoReferencia
  return (
    <span className={`${styles.tipoChip} ${cls}`}>
      {label}
    </span>
  )
}

function ConfidenceBar({ value, t }) {
  const pct = Math.round((value || 0) * 100)
  const color = value >= 0.7
    ? 'var(--health-green)'
    : value >= 0.4
    ? 'var(--health-yellow)'
    : 'var(--health-red)'

  return (
    <div className={styles.confidenceBar}>
      <div className={styles.confidenceTrack}>
        <div
          className={styles.confidenceFill}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className={styles.confidenceLabel}>{t('capture.confidence', { pct })}</span>
    </div>
  )
}

/**
 * CaptureInterpreter
 *
 * @param {object} props
 * @param {'interpreting'|'questioning'|'confirming'} props.state
 * @param {object} props.capture — capture com interpretation e questions
 * @param {object} props.answers — { [campo]: resposta }
 * @param {function} props.onAnswer — (campo, resposta) => void
 * @param {function} props.onContinue — () => void — avança para confirmar
 * @param {function} props.onCancel — () => void
 */
export function CaptureInterpreter({ state, capture, answers, onAnswer, onContinue, onCancel }) {
  const { t } = useI18n()
  const interpretation = capture?.interpretation
  const questions = capture?.questions || []

  // Verificar se todas as perguntas foram respondidas
  const allAnswered = questions.length === 0 ||
    questions.every(q => answers?.[q.campo])

  if (state === 'interpreting') {
    return (
      <div className={styles.interpreterContainer}>
        <div className={styles.interpreterLoading}>
          <div className={styles.spinner} />
          <p className={styles.interpreterLoadingText}>
            {t('capture.analyzing')}<br />
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{t('capture.analyzingHint')}</span>
          </p>
        </div>
        <div className={styles.actionRow}>
          <button className={styles.btnSecondary} onClick={onCancel}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    )
  }

  if (!interpretation) return null

  return (
    <div className={styles.interpreterContainer}>

      {/* Resultado da classificação */}
      <motion.div
        className={styles.interpretationResult}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <TipoChip tipo={interpretation.tipo} t={t} />

        {interpretation.baixa_confianca && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--health-yellow)', fontSize: 'var(--text-xs)' }}>
            <AlertTriangle size={13} />
            <span>{t('capture.lowConfidence')}</span>
          </div>
        )}

        <p className={styles.interpretationDesc}>{interpretation.descricao}</p>

        {interpretation.texto_extraido && (
          <p className={styles.interpretationTextExtraido}>
            "{interpretation.texto_extraido}"
          </p>
        )}

        <ConfidenceBar value={interpretation.confianca} t={t} />
      </motion.div>

      {/* Perguntas */}
      <AnimatePresence>
        {questions.length > 0 && (
          <motion.div
            className={styles.questionsSection}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            {questions.map((q, i) => (
              <div key={q.campo || i} className={styles.questionBlock}>
                <p className={styles.questionText}>{q.texto}</p>
                <div className={styles.questionOptions}>
                  {(q.opcoes || []).map((opt) => (
                    <button
                      key={opt}
                      className={`${styles.questionOption} ${
                        answers?.[q.campo] === opt ? styles.questionOptionSelected : ''
                      }`}
                      onClick={() => onAnswer(q.campo, opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Destinos sugeridos (info) */}
      {(interpretation.destinos_sugeridos || []).length > 0 && questions.length === 0 && (
        <div style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>{t('capture.destination')}:</span>
          <strong style={{ color: 'var(--text-secondary)' }}>
            {t(`capture.types.${interpretation.destinos_sugeridos[0]?.modulo}`) ||
             interpretation.destinos_sugeridos[0]?.label ||
             t('capture.types.referencia')}
          </strong>
        </div>
      )}

      {/* Acções */}
      <div className={styles.actionRow}>
        <button className={styles.btnSecondary} onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button
          className={styles.btnPrimary}
          onClick={onContinue}
          disabled={!allAnswered}
        >
          {t('capture.continue')}
        </button>
      </div>
    </div>
  )
}
