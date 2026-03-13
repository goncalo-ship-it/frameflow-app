// WeatherOverlay — Liquid Glass Weather Detail Card
// Spec: backdrop blur + spring scale + 5-layer glass + hero temp + 2×2 grid + tides
// Self-contained: sem GlassOverlay wrapper, all inline styles

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Wind, Droplets, Sunrise, Sunset, Waves, X } from 'lucide-react'

/* ── Static demo tides ─────────────────────────────────────────── */
const DEMO_TIDES = [
  { type: 'ALTA',  time: '08:15', height: '3.2m' },
  { type: 'BAIXA', time: '14:30', height: '0.8m' },
  { type: 'ALTA',  time: '20:45', height: '3.1m' },
]

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"

/* ── Glass layer constants ─────────────────────────────────────── */
const LAYER_BASE = {
  position: 'absolute', inset: 0, pointerEvents: 'none',
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px) saturate(120%)',
  WebkitBackdropFilter: 'blur(20px) saturate(120%)',
}
const LAYER_LENS = {
  position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 20,
  background: 'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(255,255,255,0.10) 0%, transparent 50%)',
  mixBlendMode: 'overlay',
}
const LAYER_HIGHLIGHT = {
  position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 20,
  boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,255,0.25)',
}
const LAYER_BORDER = {
  position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 20,
  border: '0.5px solid rgba(255,255,255,0.18)',
}
const LAYER_SHADOW = {
  position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 20,
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
}

/* ── Metric card helper ────────────────────────────────────────── */
function MetricCard({ icon: Icon, iconColor, label, value, unit }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: 12,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: iconColor || 'rgba(255,255,255,0.40)',
        fontFamily: FONT,
      }}>
        <Icon size={12} color={iconColor || 'rgba(255,255,255,0.40)'} />
        {label}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 700, lineHeight: 1.1,
        color: 'rgba(255,255,255,0.95)', marginTop: 6, fontFamily: FONT,
      }}>
        {value}
      </div>
      {unit && (
        <div style={{
          fontSize: 11, fontWeight: 500,
          color: 'rgba(255,255,255,0.50)', marginTop: 2, fontFamily: FONT,
        }}>
          {unit}
        </div>
      )}
    </div>
  )
}

/* ── Tide card helper ──────────────────────────────────────────── */
function TideCard({ type, time, height }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: 10, textAlign: 'center',
    }}>
      <Waves size={12} color="rgba(59,130,246,0.6)" style={{ margin: '0 auto 4px' }} />
      <div style={{
        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', fontFamily: FONT,
      }}>
        {type}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 700, lineHeight: 1,
        color: 'rgba(255,255,255,0.90)', marginTop: 4, fontFamily: FONT,
      }}>
        {time}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 500,
        color: 'rgba(255,255,255,0.45)', marginTop: 2, fontFamily: FONT,
      }}>
        {height}
      </div>
    </div>
  )
}

/* ── Main component ────────────────────────────────────────────── */
export function WeatherOverlay({ open, onClose, weather, sunrise, sunset, location }) {
  const w        = weather || {}
  const city     = w.city || location || 'Porto'
  const cityShort = city.split(',')[0].trim()
  const temp      = w.temp ?? 18
  const desc      = w.desc || 'Parcialmente Nublado'
  const feelsLike = w.feelsLike ?? (typeof w.temp === 'number' ? w.temp - 2 : 16)
  const wind      = w.wind ?? 12
  const humidity  = w.humidity ?? 65
  const visibility = w.visibility ? `${Math.round(w.visibility / 1000)}km` : '10km'
  const sr        = sunrise || '07:24'
  const ss        = sunset  || '18:42'

  /* ESC to close */
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* ── BACKDROP ─────────────────────────────────────── */}
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.70)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* ── CARD CONTAINER ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 4 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 101,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16, pointerEvents: 'none',
            }}
          >
            {/* ── GLASS CARD ───────────────────────────────── */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 340,
                borderRadius: 20, overflow: 'hidden',
                position: 'relative', pointerEvents: 'auto',
              }}
            >
              {/* Glass layers */}
              <div style={LAYER_BASE} />
              <div style={LAYER_LENS} />
              <div style={LAYER_HIGHLIGHT} />
              <div style={LAYER_BORDER} />
              <div style={LAYER_SHADOW} />

              {/* ── Content ─────────────────────────────────── */}
              <div style={{ position: 'relative', zIndex: 1 }}>

                {/* HEADER */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '0.5px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Icon bubble */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(59,130,246,0.15)',
                      border: '0.5px solid rgba(59,130,246,0.30)',
                    }}>
                      <Sun size={20} color="#3b82f6" />
                    </div>
                    {/* City */}
                    <span style={{
                      fontFamily: FONT, fontSize: 11, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: 'rgba(255,255,255,0.45)',
                    }}>
                      {cityShort.toUpperCase()}
                    </span>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    style={{
                      fontFamily: FONT,
                      width: 32, height: 32, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none', cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  >
                    <X size={16} color="rgba(255,255,255,0.6)" />
                  </button>
                </div>

                {/* TEMPERATURA HERO */}
                <div style={{ padding: '20px 24px', textAlign: 'center' }}>
                  <div style={{
                    fontFamily: FONT, fontSize: 72, fontWeight: 700, lineHeight: 1,
                    color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em',
                  }}>
                    {temp}°
                  </div>
                  <div style={{
                    fontFamily: FONT, fontSize: 14, fontWeight: 500,
                    color: 'rgba(255,255,255,0.65)', marginTop: 8,
                    textTransform: 'capitalize',
                  }}>
                    {desc}
                  </div>
                  <div style={{
                    fontFamily: FONT, fontSize: 12, fontWeight: 400,
                    color: 'rgba(255,255,255,0.45)', marginTop: 4,
                  }}>
                    Sensação {feelsLike}° | Vis. {visibility}
                  </div>
                </div>

                {/* 2×2 METRIC GRID */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8, padding: '0 16px 16px',
                }}>
                  <MetricCard icon={Wind}     label="Vento"    value={wind}     unit="km/h" />
                  <MetricCard icon={Droplets} label="Humidade" value={humidity} unit="%" />
                  <MetricCard icon={Sunrise}  iconColor="#f59e0b" label="Nascer"    value={sr} />
                  <MetricCard icon={Sunset}   iconColor="#ef4444" label="Pôr do Sol" value={ss} />
                </div>

                {/* MARÉS */}
                <div style={{ padding: '0 16px 16px', marginTop: 8 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: FONT, fontSize: 10, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'rgba(255,255,255,0.35)', marginBottom: 8,
                  }}>
                    <Waves size={12} />
                    Marés em {cityShort}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {DEMO_TIDES.map((tide, i) => (
                      <TideCard key={i} {...tide} />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
