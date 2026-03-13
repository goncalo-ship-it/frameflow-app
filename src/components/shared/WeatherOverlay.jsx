// WeatherOverlay — Liquid Glass weather detail card
// Matches Figma: temp hero, 2x2 stats, tides section

import { Sun, CloudSun, Wind, Droplets, Sunrise, Sunset, Waves, X } from 'lucide-react'
import { GlassOverlay } from './GlassOverlay.jsx'

const DEMO_TIDES = [
  { type: 'ALTA', time: '08:15', height: '3.2m' },
  { type: 'BAIXA', time: '14:30', height: '0.8m' },
  { type: 'ALTA', time: '20:45', height: '3.1m' },
]

const card = {
  background: 'rgba(255, 255, 255, 0.06)',
  border: '0.5px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 14,
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const sunCard = {
  ...card,
  background: 'rgba(245, 158, 11, 0.08)',
  border: '0.5px solid rgba(245, 158, 11, 0.2)',
}

const tideCard = {
  flex: 1,
  background: 'rgba(59, 130, 246, 0.08)',
  border: '0.5px solid rgba(59, 130, 246, 0.2)',
  borderRadius: 14,
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
}

const label = {
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255, 255, 255, 0.5)',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontFamily: 'Inter, system-ui, sans-serif',
}

const value = {
  fontSize: 28,
  fontWeight: 900,
  color: '#fff',
  lineHeight: 1,
  fontFamily: 'Inter, system-ui, sans-serif',
}

const sub = {
  fontSize: 11,
  color: '#6E6E78',
  fontFamily: 'Inter, system-ui, sans-serif',
}

export function WeatherOverlay({ open, onClose, weather, sunrise, sunset, location }) {
  const w = weather || {}
  const city = w.city || location || 'Lisboa, Portugal'
  const temp = w.temp ?? '—'
  const desc = w.desc || 'Sem dados'
  const feelsLike = w.feelsLike ?? (typeof w.temp === 'number' ? w.temp - 2 : '—')
  const wind = w.wind ?? '—'
  const humidity = w.humidity ?? '—'
  const visibility = w.visibility ? `${Math.round(w.visibility / 1000)}km` : '10km'

  return (
    <GlassOverlay open={open} onClose={onClose} width={480}>
      {/* Header — icon + city + temp + desc */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24, paddingRight: 28 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <CloudSun size={24} color="#fff" />
        </div>
        <div>
          <p style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
            margin: 0, fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            {city.toUpperCase()}
          </p>
          <p style={{
            fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1,
            margin: '4px 0 0', fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            {temp}&deg;
          </p>
          <p style={{
            fontSize: 14, color: '#A0A0AB', margin: '4px 0 0',
            textTransform: 'capitalize', fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            {desc}
          </p>
          <p style={{
            fontSize: 11, color: '#6E6E78', margin: '2px 0 0',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            Sensa&ccedil;&atilde;o {feelsLike}&deg; &nbsp;|&nbsp; Vis. {visibility}
          </p>
        </div>
      </div>

      {/* 2x2 stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {/* Vento */}
        <div style={card}>
          <span style={label}><Wind size={10} /> VENTO</span>
          <span style={value}>{wind}</span>
          <span style={sub}>km/h</span>
        </div>

        {/* Humidade */}
        <div style={card}>
          <span style={label}><Droplets size={10} /> HUMIDADE</span>
          <span style={value}>{humidity}</span>
          <span style={sub}>%</span>
        </div>

        {/* Nascer do sol */}
        <div style={sunCard}>
          <span style={label}><Sunrise size={10} color="rgba(245,158,11,0.7)" /> NASCER</span>
          <span style={value}>{sunrise || '07:24'}</span>
        </div>

        {/* Por do sol */}
        <div style={sunCard}>
          <span style={label}><Sunset size={10} color="rgba(245,158,11,0.7)" /> P&Ocirc;R DO SOL</span>
          <span style={value}>{sunset || '18:42'}</span>
        </div>
      </div>

      {/* Tides section */}
      <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
        <p style={{
          ...label,
          fontSize: 9, marginBottom: 10, gap: 5,
        }}>
          <Waves size={10} color="rgba(59,130,246,0.7)" />
          MAR&Eacute;S EM {city.split(',')[0].trim().toUpperCase()}
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          {DEMO_TIDES.map((tide, i) => (
            <div key={i} style={tideCard}>
              <Waves size={14} color="rgba(59,130,246,0.6)" />
              <span style={{ ...label, fontSize: 9 }}>{tide.type}</span>
              <span style={{ ...value, fontSize: 22 }}>{tide.time}</span>
              <span style={sub}>{tide.height}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassOverlay>
  )
}
