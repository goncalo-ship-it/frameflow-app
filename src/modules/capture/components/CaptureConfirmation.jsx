// CaptureConfirmation.jsx — Ecrã de confirmação antes de encaminhar

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Bell, BellOff, Mic, Check, RotateCcw, Play, Pause } from 'lucide-react'
import { useI18n } from '../../../core/i18n/index.js'
import { getRecipientForType } from '../utils/captureNotifier.js'
import { destinoLabel } from '../utils/captureRouter.js'
import styles from './Capture.module.css'

/**
 * CaptureConfirmation
 *
 * @param {object} props
 * @param {object} props.capture — capture completo com interpretation
 * @param {'confirming'|'routing'|'done'} props.state
 * @param {function} props.onConfirm — () => void — confirma com notificação
 * @param {function} props.onSilent — () => void — confirma sem notificação
 * @param {function} props.onEdit — () => void — volta ao passo anterior
 * @param {function} props.onCancel — () => void
 */
export function CaptureConfirmation({ capture, state, onConfirm, onSilent, onEdit, onCancel }) {
  const { t } = useI18n()
  const [audioPlaying, setAudioPlaying] = useState(false)
  const audioRef = useRef(null)

  if (!capture) return null

  const { interpretation, type, thumbnail, textContent } = capture

  // Create object URLs for media blobs
  const mediaUrl = useMemo(() => {
    if (capture.blob && (type === 'video' || type === 'audio')) {
      return URL.createObjectURL(capture.blob)
    }
    return capture.videoUrl || capture.audioUrl || null
  }, [capture.blob, capture.videoUrl, capture.audioUrl, type])

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (mediaUrl && capture.blob) {
        URL.revokeObjectURL(mediaUrl)
      }
    }
  }, [mediaUrl, capture.blob])

  const toggleAudio = () => {
    if (!audioRef.current) return
    if (audioPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setAudioPlaying(!audioPlaying)
  }

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }
  const tipo = interpretation?.tipo || 'referencia'
  const destino = interpretation?.destinos_sugeridos?.[0]?.modulo || tipo
  const destinoNome = destinoLabel(destino)
  const recipient = getRecipientForType(tipo)

  // Done state
  if (state === 'done') {
    return (
      <motion.div
        className={styles.doneState}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        <div className={styles.doneCheck}>
          <Check size={28} />
        </div>
        <p className={styles.doneText}>{t('capture.savedTo')}</p>
        <p className={styles.doneSubText}>{t('capture.routedTo', { dest: destinoNome })}</p>
      </motion.div>
    )
  }

  // Routing state
  if (state === 'routing') {
    return (
      <div className={styles.routingState}>
        <div className={styles.spinner} />
        <p className={styles.routingText}>{t('capture.routing')}</p>
      </div>
    )
  }

  return (
    <motion.div
      className={styles.confirmationContainer}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      {/* Preview do conteúdo */}
      {type === 'video' && mediaUrl ? (
        <div className={styles.videoPlayer}>
          <video src={mediaUrl} controls muted playsInline />
          {capture.duration && (
            <div className={styles.videoDuration}>{formatDuration(capture.duration)}</div>
          )}
        </div>
      ) : type === 'video' && thumbnail ? (
        <div className={styles.videoPreview}>
          <img src={`data:image/jpeg;base64,${thumbnail}`} alt="preview" />
          {capture.duration && (
            <div className={styles.videoDuration}>{formatDuration(capture.duration)}</div>
          )}
        </div>
      ) : type === 'audio' ? (
        <div className={styles.audioPlayer}>
          <button className={styles.audioPlayBtn} onClick={toggleAudio} type="button">
            {audioPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          {mediaUrl && (
            <audio
              ref={audioRef}
              src={mediaUrl}
              onEnded={() => setAudioPlaying(false)}
              onPause={() => setAudioPlaying(false)}
              onPlay={() => setAudioPlaying(true)}
            />
          )}
          {textContent && (
            <p className={styles.audioTranscript}>{textContent}</p>
          )}
        </div>
      ) : type === 'image' && thumbnail ? (
        <div className={styles.confirmationPreview}>
          <img src={`data:image/jpeg;base64,${thumbnail}`} alt="preview" />
        </div>
      ) : (
        <div className={styles.confirmationPreview}>
          <p className={styles.confirmationTextPreview}>
            {textContent || interpretation?.texto_extraido || interpretation?.descricao || '—'}
          </p>
        </div>
      )}

      {/* Destino */}
      <div className={styles.destinationCard}>
        <span className={styles.destinationLabel}>{t('capture.destination')}</span>
        <div className={styles.destinationValue}>
          <span>{interpretation?.descricao?.slice(0, 60) || 'Capture'}</span>
          <span className={styles.destinationArrow}><ArrowRight size={14} /></span>
          <strong>{destinoNome}</strong>
        </div>
      </div>

      {/* Quem é notificado */}
      <div className={styles.notificationInfo}>
        <Bell size={14} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
        <span>
          {t('capture.willNotify')} <strong style={{ color: 'var(--text-primary)' }}>{recipient}</strong>
        </span>
      </div>

      {/* Acções */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div className={styles.actionRow}>
          <button className={styles.btnSecondary} onClick={onEdit}>
            <RotateCcw size={14} style={{ marginRight: 4 }} />
            {t('common.edit')}
          </button>
          <button className={styles.btnPrimary} onClick={onConfirm}>
            {t('capture.confirmWithNotify')}
          </button>
        </div>

        <button
          className={styles.btnSecondary}
          onClick={onSilent}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <BellOff size={13} />
          {t('capture.confirmSilent')}
        </button>

        <button className={styles.btnDanger} onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </motion.div>
  )
}
