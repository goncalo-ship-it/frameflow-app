// LangPicker.jsx — Selector de língua com bandeiras
// Compacto: mostra bandeira actual, dropdown com as 4 opções

import { useState, useRef, useEffect } from 'react'
import { useStore } from '../../core/store.js'
import { LANGUAGES } from '../../core/i18n/index.js'

const PICKER_STYLE = {
  position: 'relative',
  display: 'inline-flex',
}

const BTN_STYLE = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  padding: '6px 10px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-body)',
  transition: 'background 0.15s, border-color 0.15s',
}

const DROPDOWN_STYLE = {
  position: 'absolute',
  bottom: '100%',
  left: 0,
  marginBottom: '6px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  borderRadius: '10px',
  padding: '4px',
  zIndex: 100,
  minWidth: '160px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
}

const OPTION_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '8px 12px',
  background: 'transparent',
  border: 'none',
  borderRadius: '7px',
  cursor: 'pointer',
  fontSize: '13px',
  fontFamily: 'var(--font-body)',
  color: 'var(--text-secondary)',
  transition: 'background 0.12s, color 0.12s',
  textAlign: 'left',
}

export function LangPicker({ compact = false }) {
  const lang = useStore(s => s.auth.lang) || 'pt'
  const setLang = useStore(s => s.setLang)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={PICKER_STYLE}>
      <button
        style={BTN_STYLE}
        onClick={() => setOpen(!open)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-overlay)'
          e.currentTarget.style.borderColor = 'var(--border-default)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-elevated)'
          e.currentTarget.style.borderColor = 'var(--border-subtle)'
        }}
        aria-label="Language"
      >
        <span style={{ fontSize: '16px', lineHeight: 1 }}>{current.flag}</span>
        {!compact && <span>{current.code.toUpperCase()}</span>}
      </button>

      {open && (
        <div style={DROPDOWN_STYLE}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              style={{
                ...OPTION_STYLE,
                ...(l.code === lang ? {
                  background: 'rgba(46,111,160,0.15)',
                  color: 'var(--accent-light)',
                  fontWeight: 600,
                } : {}),
              }}
              onClick={() => { setLang(l.code); setOpen(false) }}
              onMouseEnter={(e) => {
                if (l.code !== lang) {
                  e.currentTarget.style.background = 'var(--bg-overlay)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (l.code !== lang) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1 }}>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
