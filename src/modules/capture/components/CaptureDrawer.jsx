// CaptureDrawer.jsx — Drawer principal com as opções de capture

import { useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Mic, Video, FileText, X, Square, Inbox, Clapperboard, Cloud, RotateCcw } from 'lucide-react'
import { useI18n } from '../../../core/i18n/index.js'
import { useCapture } from '../hooks/useCapture.js'
import { useMediaCapture } from '../hooks/useMediaCapture.js'
import { CaptureInterpreter } from './CaptureInterpreter.jsx'
import { CaptureConfirmation } from './CaptureConfirmation.jsx'
import { CaptureInbox } from './CaptureInbox.jsx'
import styles from './Capture.module.css'

const SPRING = { type: 'spring', damping: 28, stiffness: 300 }


/**
 * CaptureDrawer
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 */
export function CaptureDrawer({ isOpen, onClose }) {
  const { t } = useI18n()
  const {
    state,
    capture,
    error,
    inboxCount,
    startCapture,
    submitInput,
    answerQuestion,
    proceedToConfirm,
    confirmCapture,
    cancelCapture,
    resumeCapture,
    setMode,
    setModeContext,
    canSetMode,
    toggleSetMode,
  } = useCapture()

  const {
    capturePhoto,
    captureAudio,
    captureVideo,
    stopAudio,
    isRecording,
    transcript,
  } = useMediaCapture()

  const [view, setView] = useState('main') // 'main' | 'text' | 'audio' | 'inbox'
  const [textValue, setTextValue] = useState('')
  const textareaRef = useRef(null)

  // Offline queue count
  const queueCount = useMemo(() => {
    try {
      const q = JSON.parse(localStorage.getItem('fb_capture_queue') || '[]')
      return q.length
    } catch { return 0 }
  }, [state]) // re-check when state changes

  const handleRetryQueue = useCallback(() => {
    if (navigator.onLine) {
      window.dispatchEvent(new Event('online'))
    }
  }, [])

  // ── Handlers ──────────────────────────────────────────────────

  const handlePhoto = useCallback(async () => {
    const file = await capturePhoto()
    if (file) {
      startCapture('image', file)
    }
  }, [capturePhoto, startCapture])

  const handleVideo = useCallback(async () => {
    try {
      const result = await captureVideo()
      if (result) {
        startCapture('video', result)
      }
    } catch (err) {
      if (err.message !== 'Captura cancelada') {
        console.error('[CaptureDrawer] Erro vídeo:', err)
      }
    }
  }, [captureVideo, startCapture])

  const handleTextMode = useCallback(() => {
    setView('text')
    setTimeout(() => textareaRef.current?.focus(), 80)
  }, [])

  const handleTextSubmit = useCallback(() => {
    if (!textValue.trim()) return
    setTextValue('')
    setView('main')
    submitInput(textValue.trim())
  }, [textValue, submitInput])

  const handleAudioMode = useCallback(async () => {
    setView('audio')
    try {
      await captureAudio()
    } catch (err) {
      console.error('[CaptureDrawer] Erro áudio:', err)
      setView('main')
    }
  }, [captureAudio])

  const handleStopAudio = useCallback(async () => {
    const result = await stopAudio()
    setView('main')
    if (result?.blob) {
      startCapture('audio', { blob: result.blob, transcript: result.transcript })
    }
  }, [stopAudio, startCapture])

  const handleCancel = useCallback(() => {
    cancelCapture()
    setView('main')
    setTextValue('')
  }, [cancelCapture])

  const handleClose = useCallback(() => {
    if (state !== 'idle') {
      cancelCapture()
    }
    setView('main')
    setTextValue('')
    onClose()
  }, [state, cancelCapture, onClose])

  const handleInboxClassify = useCallback((item) => {
    setView('main')
    resumeCapture(item)
  }, [resumeCapture])

  // ── Conteúdo do drawer ────────────────────────────────────────

  const renderContent = () => {
    // Estados do fluxo de capture
    if (state === 'interpreting' || state === 'questioning') {
      return (
        <CaptureInterpreter
          state={state}
          capture={capture}
          answers={capture?.answers || {}}
          onAnswer={answerQuestion}
          onContinue={proceedToConfirm}
          onCancel={handleCancel}
        />
      )
    }

    // Estado queued (offline)
    if (state === 'queued') {
      return (
        <div className={styles.queuedMessage}>
          <Cloud size={20} />
          <p>{t('capture.offline')}</p>
        </div>
      )
    }

    if (state === 'confirming' || state === 'routing' || state === 'done') {
      return (
        <CaptureConfirmation
          capture={capture}
          state={state}
          onConfirm={() => confirmCapture(false)}
          onSilent={() => confirmCapture(true)}
          onEdit={() => {
            // Volta para questioning se houver perguntas, senão para main
            const q = capture?.questions || []
            if (q.length > 0) proceedToConfirm() // não há retorno real, ignorar
            else handleCancel()
          }}
          onCancel={handleCancel}
        />
      )
    }

    // Inbox
    if (view === 'inbox') {
      return (
        <CaptureInbox
          onClassify={handleInboxClassify}
          onBack={() => setView('main')}
        />
      )
    }

    // Modo texto
    if (view === 'text') {
      return (
        <div className={styles.textInputArea}>
          <textarea
            ref={textareaRef}
            className={styles.textInput}
            placeholder={t('capture.textPlaceholder')}
            value={textValue}
            onChange={e => setTextValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleTextSubmit()
            }}
            rows={5}
          />
          <div className={styles.actionRow}>
            <button className={styles.btnSecondary} onClick={() => { setView('main'); setTextValue('') }}>
              {t('common.cancel')}
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleTextSubmit}
              disabled={!textValue.trim()}
            >
              {t('capture.interpret')}
            </button>
          </div>
        </div>
      )
    }

    // Modo áudio (gravação em curso)
    if (view === 'audio') {
      return (
        <div className={styles.audioArea}>
          {isRecording ? (
            <>
              <button
                className={`${styles.audioRecordBtn} ${styles.recording}`}
                onClick={handleStopAudio}
                aria-label="Parar gravação"
              >
                <Square size={22} />
              </button>
              <span className={styles.audioLabel}>
                {transcript ? transcript : t('capture.recording')}
              </span>
            </>
          ) : (
            <>
              <button
                className={styles.audioRecordBtn}
                onClick={handleAudioMode}
                aria-label="Iniciar gravação"
              >
                <Mic size={24} />
              </button>
              <span className={styles.audioLabel}>{t('capture.startMic')}</span>
            </>
          )}
          <button className={styles.btnSecondary} onClick={() => setView('main')}>
            {t('common.cancel')}
          </button>
        </div>
      )
    }

    // Vista principal — 4 opções
    return (
      <>
        {error && (
          <div className={styles.errorBox} style={{ marginBottom: 'var(--space-3)' }}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        <div className={styles.captureGrid}>
          {/* Foto */}
          <button
            className={styles.captureOption}
            onClick={handlePhoto}
            aria-label="Tirar foto"
          >
            <div
              className={styles.captureOptionIcon}
              style={{ background: 'rgba(46, 111, 160, 0.2)', color: 'var(--accent-light)' }}
            >
              <Camera size={20} />
            </div>
            <span>{t('capture.photo')}</span>
          </button>

          {/* Voz */}
          <button
            className={styles.captureOption}
            onClick={handleAudioMode}
            aria-label="Gravar voz"
          >
            <div
              className={styles.captureOptionIcon}
              style={{ background: 'rgba(231, 76, 60, 0.2)', color: '#E87C70' }}
            >
              <Mic size={20} />
            </div>
            <span>{t('capture.voice')}</span>
          </button>

          {/* Vídeo */}
          <button
            className={styles.captureOption}
            onClick={handleVideo}
            aria-label="Gravar vídeo"
          >
            <div
              className={styles.captureOptionIcon}
              style={{ background: 'rgba(139, 32, 48, 0.2)', color: '#E06A7A' }}
            >
              <Video size={20} />
            </div>
            <span>{t('capture.video')}</span>
          </button>

          {/* Texto */}
          <button
            className={styles.captureOption}
            onClick={handleTextMode}
            aria-label="Escrever nota"
          >
            <div
              className={styles.captureOptionIcon}
              style={{ background: 'rgba(79, 127, 63, 0.2)', color: '#72B05A' }}
            >
              <FileText size={20} />
            </div>
            <span>{t('capture.text')}</span>
          </button>
        </div>

        {/* Inbox button */}
        {inboxCount > 0 && (
          <button className={styles.inboxBtn} onClick={() => setView('inbox')}>
            <Inbox size={16} />
            <span>{t('capture.viewInbox')}</span>
            <span className={styles.inboxCount}>{inboxCount}</span>
          </button>
        )}

        {/* Offline Queue */}
        {queueCount > 0 && (
          <div className={styles.queueSection}>
            <div className={styles.queueHeader}>
              <Cloud size={14} />
              <span>{queueCount} item{queueCount !== 1 ? 's' : ''} em fila</span>
              <button className={styles.queueRetryBtn} onClick={handleRetryQueue} disabled={!navigator.onLine}>
                <RotateCcw size={12} /> Reenviar
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  // ── Títulos dinâmicos ─────────────────────────────────────────

  const drawerTitle = () => {
    if (state === 'interpreting') return t('capture.interpreting')
    if (state === 'questioning') return t('capture.questions')
    if (state === 'confirming') return t('capture.confirmCapture')
    if (state === 'routing') return t('capture.saving')
    if (state === 'done') return t('capture.saved')
    if (state === 'queued') return t('capture.queued')
    if (view === 'inbox') return t('capture.inbox')
    if (view === 'text') return t('capture.textNote')
    if (view === 'audio') return t('capture.voiceNote')
    return t('capture.title')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          {/* Modal card */}
          <motion.div
            className={styles.drawer}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={SPRING}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Capture"
            data-capture-zone="true"
          >
            {/* Header */}
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>{drawerTitle()}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {canSetMode && state === 'idle' && view === 'main' && (
                  <button
                    className={`${styles.setModeToggle} ${setMode ? styles.setModeActive : ''}`}
                    onClick={toggleSetMode}
                  >
                    <Clapperboard size={13} />
                    {setMode ? t('capture.setMode') : t('capture.normalMode')}
                  </button>
                )}
                <button
                  className={styles.drawerClose}
                  onClick={handleClose}
                  aria-label="Fechar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Set mode banner */}
            {setMode && setModeContext && state === 'idle' && view === 'main' && (
              <div className={styles.setModeBanner}>
                <Clapperboard size={14} />
                <span>
                  Dia {setModeContext.dayNumber}
                  {setModeContext.episode !== '?' && ` | Ep. ${setModeContext.episode}`}
                  {setModeContext.currentScene && ` | Cena ${setModeContext.currentScene}`}
                </span>
              </div>
            )}

            {/* Conteúdo dinâmico */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${state}-${view}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
