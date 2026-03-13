import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const MODAL_SPRING = { type: 'spring', damping: 28, stiffness: 300 }

export function DrawerBase({ isOpen, onClose, title, subtitle, width = 480, children, actions }) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={MODAL_SPRING}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width, maxWidth: '96vw', maxHeight: '88vh',
              display: 'flex', flexDirection: 'column',
              borderRadius: 28,
              background: 'rgba(30, 34, 42, 0.70)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              border: '0.5px solid rgba(255,255,255,0.18)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.4), inset 0 0.5px 0.5px rgba(255,255,255,0.3)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.08)',
              flexShrink: 0,
            }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>
                  {title}
                </h3>
                {subtitle && (
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {subtitle}
                  </p>
                )}
              </div>
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

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {children}
            </div>

            {/* Footer actions */}
            {actions && (
              <div style={{
                padding: '12px 20px',
                borderTop: '0.5px solid rgba(255,255,255,0.08)',
                display: 'flex', gap: 8, justifyContent: 'flex-end',
                flexShrink: 0,
              }}>
                {actions}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
