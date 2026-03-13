// PWAInstallPrompt — C3
// beforeinstallprompt (Android/Chrome) + iOS fallback
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Share } from 'lucide-react'

const DISMISS_KEY = 'ff_pwa_dismissed'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIOS, setShowIOS] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Already dismissed or already installed
    if (localStorage.getItem(DISMISS_KEY) || isStandalone()) return

    if (isIOS()) {
      // Show iOS instructions after 3s
      const t = setTimeout(() => { setShowIOS(true); setVisible(true) }, 3000)
      return () => clearTimeout(t)
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
    if (outcome === 'accepted') localStorage.setItem(DISMISS_KEY, '1')
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="pwa-prompt"
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 8000,
            width: 'calc(100% - 32px)',
            maxWidth: 420,
            background: 'rgba(20, 24, 32, 0.92)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: 20,
            border: '0.5px solid rgba(255,255,255,0.14)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.12)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Icon */}
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.06))',
            border: '0.5px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {showIOS
              ? <Share size={18} color="#10b981" />
              : <Download size={18} color="#10b981" />
            }
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
              Instalar FrameFlow
            </div>
            {showIOS ? (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                Toca em <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Partilhar</strong> → <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Adicionar ao ecrã inicial</strong>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                Acesso rápido sem browser
              </div>
            )}
          </div>

          {/* Actions */}
          {!showIOS && (
            <button
              onClick={install}
              style={{
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                padding: '7px 14px', fontSize: 12, fontWeight: 700,
                color: '#fff', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
              }}
            >
              Instalar
            </button>
          )}

          <button
            onClick={dismiss}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)', padding: 4, flexShrink: 0,
              borderRadius: 6, display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
