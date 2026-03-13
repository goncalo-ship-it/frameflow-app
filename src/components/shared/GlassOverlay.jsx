// GlassOverlay — backdrop blur + floating card (iOS/visionOS style)
// Usage: <GlassOverlay open={bool} onClose={fn}><YourContent /></GlassOverlay>

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function GlassOverlay({ open, onClose, children, width = 520, title }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="glass-overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            style={{
              width: '90%',
              maxWidth: width,
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'rgba(30, 34, 42, 0.75)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '0.5px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 20,
              padding: 0,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3), inset 0 0.5px 0.5px rgba(255, 255, 255, 0.3)',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '0.5px solid rgba(255, 255, 255, 0.18)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                zIndex: 2,
              }}
            >
              <X size={16} />
            </button>
            <div style={{ position: 'relative', padding: '24px 24px 20px' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
