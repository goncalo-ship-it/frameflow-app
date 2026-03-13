// FAB.jsx — Floating Action Button system (Figma spec 16)
// Used as the Capture entry point in FrameFlow

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Mic, Type, Video, Plus, X } from 'lucide-react'
import { SPRING } from '../../core/design.js'
import styles from './FAB.module.css'

// ── Default capture actions ──────────────────────────────────
const CAPTURE_ACTIONS = [
  { id: 'photo',  icon: Camera, label: 'Foto',   color: '#10b981' },
  { id: 'voice',  icon: Mic,    label: 'Voz',    color: '#8b5cf6' },
  { id: 'text',   icon: Type,   label: 'Texto',  color: '#3b82f6' },
  { id: 'video',  icon: Video,  label: 'Vídeo',  color: '#f59e0b' },
]

/**
 * FAB — Floating Action Button with expandable sub-actions.
 *
 * @param {Array}    actions    — [{ id, icon, label, color, onClick }] (defaults to CAPTURE_ACTIONS)
 * @param {function} onAction   — called with action id when no per-action onClick exists
 * @param {number}   badge      — badge count (top-right)
 * @param {string}   className  — extra class on wrapper
 */
export function FAB({ actions = CAPTURE_ACTIONS, onAction, badge = 0, className = '' }) {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen(prev => !prev), [])

  const close = useCallback(() => setOpen(false), [])

  // Close on ESC
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, close])

  const handleAction = useCallback((action) => {
    close()
    if (action.onClick) {
      action.onClick()
    } else if (onAction) {
      onAction(action.id)
    }
  }, [close, onAction])

  return (
    <div className={className}>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* Sub-action buttons */}
      <AnimatePresence>
        {open && actions.map((action, idx) => {
          const Icon = action.icon
          // Stack upward from FAB: each sub-button is 56px + 12px gap
          const bottomOffset = 24 + 64 + 16 + idx * (56 + 12)

          return (
            <motion.button
              key={action.id}
              className={styles.subBtn}
              style={{ bottom: bottomOffset }}
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.3, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
                delay: idx * 0.05,
              }}
              onClick={() => handleAction(action)}
              aria-label={action.label}
            >
              <Icon size={22} style={{ color: action.color || '#fff' }} />
              <span className={styles.subLabel}>{action.label}</span>
            </motion.button>
          )
        })}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={toggle}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        animate={{ rotate: open ? 45 : 0 }}
        transition={SPRING.subtle}
        aria-label={open ? 'Fechar menu de captura' : 'Abrir menu de captura'}
      >
        {open ? <X size={24} /> : <Plus size={24} />}

        {/* Badge */}
        <AnimatePresence>
          {!open && badge > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 400 }}
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                background: '#ef4444',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
                border: '2px solid var(--bg-base, #3C424C)',
                pointerEvents: 'none',
              }}
            >
              {badge > 9 ? '9+' : badge}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}

export { CAPTURE_ACTIONS }
