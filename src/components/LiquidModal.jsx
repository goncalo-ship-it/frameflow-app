import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { SPRING, LIQUID_GLASS, RADIUS } from '../core/design.js'

const MAX_WIDTHS = { sm: 400, md: 600, lg: 800, xl: 1000 }

export function LiquidModal({ isOpen, onClose, children, title, maxWidth = 'md' }) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const w = MAX_WIDTHS[maxWidth] || MAX_WIDTHS.md

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={SPRING.default}
            style={{
              position: 'relative', width: '100%', maxWidth: w,
              maxHeight: 'calc(100vh - 64px)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              ...LIQUID_GLASS.strong,
              borderRadius: RADIUS.modal,
              background: 'rgba(30, 34, 42, 0.75)',
            }}
          >
            {/* Header */}
            {title && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '0.5px solid rgba(255,255,255,0.08)',
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
