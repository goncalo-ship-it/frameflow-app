// LocationOverlay — Floating glass card for location details
// Matches Figma: photo gallery, GPS coords, infrastructure, restrictions, contacts

import { MapPin, Car, Wifi, Zap, AlertTriangle, Phone, ExternalLink, Clock, Users, Utensils, ShieldAlert } from 'lucide-react'
import { GlassOverlay } from './GlassOverlay.jsx'

const glassInner = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '0.5px solid rgba(255, 255, 255, 0.10)',
  borderRadius: 14,
  padding: '12px 14px',
  display: 'flex', alignItems: 'center', gap: 10,
}

const sectionLabel = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: 'var(--text-muted)',
  display: 'flex', alignItems: 'center', gap: 6,
  marginBottom: 8, marginTop: 20,
}

export function LocationOverlay({ open, onClose, location }) {
  if (!location) return null
  const loc = location

  // Demo infrastructure if none provided
  const infrastructure = loc.infrastructure || [
    { icon: Car, label: `Parking ${loc.parking || '20 viaturas'}`, color: '#10b981' },
    { icon: Utensils, label: 'Zona de catering', color: '#10b981' },
    { icon: Wifi, label: 'WiFi disponível', color: '#10b981' },
    { icon: Zap, label: 'Energia 220V (15A)', color: '#10b981' },
  ]

  const restrictions = loc.restrictions || loc.notes ? [loc.notes] : [
    'Horário: 09:00-18:00 apenas',
    'Sem barulho após 17:00',
    'Máximo 30 pessoas simultâneas',
  ]

  return (
    <GlassOverlay open={open} onClose={onClose} width={460}>
      {/* Status badge */}
      <div style={{ marginBottom: 6 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: loc.status === 'confirmado' ? '#10b981' : loc.status === 'recusado' ? '#ef4444' : '#f59e0b',
        }}>
          {loc.status === 'confirmado' ? 'CONFIRMADO' : loc.status === 'recusado' ? 'RECUSADO' : 'RECONHECIMENTO'}
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16, paddingRight: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(168,85,247,0.15)', border: '0.5px solid rgba(168,85,247,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <MapPin size={22} color="#a855f7" />
        </div>
        <div>
          <h2 style={{
            fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2,
            fontFamily: 'Inter, var(--font-display, system-ui)',
          }}>{loc.displayName || loc.name}</h2>
          <p style={{ fontSize: 13, color: '#A0A0AB', margin: '2px 0 0' }}>
            {loc.address || loc.city || ''}
          </p>
          {loc.city && (
            <span style={{ fontSize: 11, color: '#a855f7', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <MapPin size={10} /> {loc.city}
            </span>
          )}
        </div>
      </div>

      {/* Photo */}
      {(loc.photos?.length > 0 || loc.photo) && (
        <div style={{
          width: '100%', height: 180, borderRadius: 16, overflow: 'hidden',
          border: '0.5px solid rgba(255,255,255,0.10)', marginBottom: 16,
        }}>
          <img
            src={loc.photos?.[0] || loc.photo}
            alt={loc.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* GPS + Maps button */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
        <div style={glassInner}>
          <MapPin size={14} color="#6E6E78" />
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#6E6E78', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>GPS</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '2px 0 0' }}>
              {loc.lat && loc.lng ? `${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°W` : '—'}
            </p>
          </div>
        </div>
        {loc.googleMapsUrl && (
          <a href={loc.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{
            ...glassInner, textDecoration: 'none', cursor: 'pointer',
            background: 'rgba(59,130,246,0.08)', border: '0.5px solid rgba(59,130,246,0.15)',
            justifyContent: 'center',
          }}>
            <ExternalLink size={14} color="#3b82f6" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>ABRIR MAPS</span>
          </a>
        )}
      </div>

      {/* Infrastructure */}
      <div style={sectionLabel}>INFRAESTRUTURAS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {infrastructure.map((item, i) => {
          const Icon = item.icon || Zap
          return (
            <div key={i} style={{
              ...glassInner,
              background: 'rgba(16,185,129,0.04)',
              border: '0.5px solid rgba(16,185,129,0.08)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(16,185,129,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={14} color="#10b981" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E0E0E5' }}>{item.label}</span>
            </div>
          )
        })}
      </div>

      {/* Restrictions */}
      {restrictions.length > 0 && (
        <>
          <div style={sectionLabel}><AlertTriangle size={12} /> RESTRIÇÕES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {restrictions.map((r, i) => (
              <div key={i} style={{
                ...glassInner,
                background: 'rgba(245,158,11,0.04)',
                border: '0.5px solid rgba(245,158,11,0.08)',
              }}>
                <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#E0E0E5' }}>{r}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Contact */}
      {loc.contactName && (
        <>
          <div style={sectionLabel}>CONTACTOS LOCAIS</div>
          <div style={glassInner}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(59,130,246,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Phone size={14} color="#3b82f6" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>{loc.contactName}</p>
              <p style={{ fontSize: 11, color: '#6E6E78', margin: '1px 0 0' }}>{loc.contactRole || 'Responsável do Local'}</p>
              {loc.contactPhone && (
                <a href={`tel:${loc.contactPhone}`} style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}>
                  {loc.contactPhone}
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </GlassOverlay>
  )
}
