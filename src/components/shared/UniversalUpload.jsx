// UniversalUpload — wrapper full-screen drag & drop
// Envolve toda a app. Classifica ficheiros e encaminha para o módulo certo.
// NÃO interfere com SmartInput ou CaptureDrawer (verifica o target do evento).

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, CheckCircle, AlertCircle, X, Loader2, ArrowRight, Info } from 'lucide-react'
import { handleUniversalUpload } from '../../core/reactive-upload.js'
import { useStore } from '../../core/store.js'
import { COLORS } from '../../core/design.js'
import styles from './UniversalUpload.module.css'

// Elementos que gerem o próprio drag & drop — ignorar
function isInsideLocalDropZone(target) {
  if (!target) return false
  let el = target
  while (el && el !== document.body) {
    // SmartInput wrapper
    if (el.dataset?.smartInput) return true
    // CaptureDrawer / CaptureButton
    if (el.dataset?.captureZone) return true
    // BudgetImporter drop zone
    if (el.dataset?.budgetDrop) return true
    // BudgetDocuments drop zone
    if (el.dataset?.budgetDocsDrop) return true
    // Universe FilesTab drop zone
    if (el.dataset?.universeDrop) return true
    // Qualquer zona com data-local-drop
    if (el.dataset?.localDrop) return true
    el = el.parentElement
  }
  return false
}

export function UniversalUpload({ children }) {
  const [dragOver, setDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingFile, setProcessingFile] = useState('')
  const [toast, setToast] = useState(null) // { type: 'success'|'error'|'info', title, description, destination, navigate }
  const dragCountRef = useRef(0)
  const toastTimerRef = useRef(null)

  const navigate = useStore(s => s.navigate)
  const apiKey = useStore(s => s.apiKey)
  const activeModule = useStore(s => s.ui.activeModule)

  // ── Toast helpers ──────────────────────────────────────────────
  const showToast = useCallback((t) => {
    clearTimeout(toastTimerRef.current)
    setToast(t)
    toastTimerRef.current = setTimeout(() => setToast(null), t.type === 'error' ? 6000 : 5000)
  }, [])

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimerRef.current)
    setToast(null)
  }, [])

  // ── Drag events ────────────────────────────────────────────────
  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    if (isInsideLocalDropZone(e.target)) return
    dragCountRef.current++
    if (dragCountRef.current === 1) {
      // Verificar que tem ficheiros (não texto interno)
      if (e.dataTransfer?.types?.includes('Files')) {
        setDragOver(true)
      }
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    if (isInsideLocalDropZone(e.target)) return
    // Necessário para permitir drop
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    dragCountRef.current--
    if (dragCountRef.current <= 0) {
      dragCountRef.current = 0
      setDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    dragCountRef.current = 0
    setDragOver(false)

    // Se o drop é numa zona local, ignorar
    if (isInsideLocalDropZone(e.target)) return

    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return

    // Processar o primeiro ficheiro (ou todos sequencialmente)
    const file = files[0]
    setProcessing(true)
    setProcessingFile(file.name)

    try {
      const result = await handleUniversalUpload(file, {
        apiKey,
        currentModule: activeModule,
      })

      if (result.success) {
        showToast({
          type: result.suggestion ? 'info' : 'success',
          title: result.suggestion ? 'Ficheiro a verificar' : 'Ficheiro processado',
          description: result.description,
          destination: result.destination,
          destinationLabel: result.destinationLabel,
          navigate: result.navigate,
        })
      } else {
        showToast({
          type: 'error',
          title: 'Erro no upload',
          description: result.description,
        })
      }

      // Se há mais ficheiros, processar em sequência
      if (files.length > 1) {
        for (let i = 1; i < Math.min(files.length, 5); i++) {
          setProcessingFile(files[i].name)
          try {
            await handleUniversalUpload(files[i], {
              apiKey,
              currentModule: activeModule,
            })
          } catch { /* continue */ }
        }
        if (files.length > 1) {
          showToast({
            type: 'success',
            title: `${Math.min(files.length, 5)} ficheiros processados`,
            description: files.length > 5
              ? `Processados ${5} de ${files.length}. Os restantes foram ignorados.`
              : 'Todos os ficheiros foram classificados e encaminhados.',
          })
        }
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro no upload',
        description: err.message || 'Erro desconhecido ao processar ficheiro.',
      })
    }

    setProcessing(false)
    setProcessingFile('')
  }, [apiKey, activeModule, showToast])

  // ── Navigate to module ─────────────────────────────────────────
  const handleNavigate = useCallback((module) => {
    if (module) navigate(module)
    dismissToast()
  }, [navigate, dismissToast])

  return (
    <div
      className={styles.wrapper}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {/* ── Overlay de drag ── */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className={styles.overlayContent}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <Upload size={40} className={styles.overlayIcon} />
              <div className={styles.overlayTitle}>
                Larga aqui — o FrameFlow trata do resto
              </div>
              <div className={styles.overlaySubtitle}>
                Guiões, orçamentos, fotos, documentos, listas de equipa...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Processing indicator ── */}
      <AnimatePresence>
        {processing && (
          <motion.div
            className={styles.processing}
            initial={{ opacity: 0, y: 20, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Loader2 size={18} className={styles.spin} style={{ color: 'var(--accent)' }} />
            <span className={styles.processingText}>
              A classificar {processingFile}…
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast de resultado ── */}
      <AnimatePresence>
        {toast && !processing && (
          <motion.div
            className={`${styles.toast} ${
              toast.type === 'success' ? styles.toastSuccess :
              toast.type === 'error' ? styles.toastError :
              styles.toastInfo
            }`}
            initial={{ opacity: 0, y: 20, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className={styles.toastIcon}>
              {toast.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--health-green, #22C55E)' }} />}
              {toast.type === 'error' && <AlertCircle size={18} style={{ color: COLORS.error }} />}
              {toast.type === 'info' && <Info size={18} style={{ color: 'var(--accent, #F5A623)' }} />}
            </div>

            <div className={styles.toastBody}>
              <div className={styles.toastTitle}>{toast.title}</div>
              <div className={styles.toastDesc}>{toast.description}</div>
              {toast.navigate && toast.destination && (
                <button
                  className={styles.toastAction}
                  onClick={() => handleNavigate(toast.destination)}
                >
                  Abrir {toast.destinationLabel || toast.destination}
                  <ArrowRight size={12} />
                </button>
              )}
            </div>

            <button className={styles.toastClose} onClick={dismissToast}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
