// ── GoogleMapsEmbed ──────────────────────────────────────────────
// Embed de Google Maps via iframe — widget autónomo
import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, ExternalLink, AlertCircle } from 'lucide-react'
import s from './GoogleMapsEmbed.module.css'

/**
 * Constrói o URL de embed do Google Maps
 * Se apiKey fornecida: usa Embed API (sem limites visuais)
 * Senão: link directo como fallback
 */
function buildEmbedUrl({ address, latitude, longitude, zoom, apiKey }) {
  if (apiKey) {
    // Google Maps Embed API (requer API key)
    const q = address
      ? encodeURIComponent(address)
      : `${latitude},${longitude}`
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${q}&zoom=${zoom}`
  }
  // Fallback sem API key — output/embed mode do Google Maps
  const q = address
    ? encodeURIComponent(address)
    : `${latitude},${longitude}`
  return `https://maps.google.com/maps?q=${q}&z=${zoom}&output=embed`
}

function buildMapsLink({ address, latitude, longitude }) {
  if (latitude && longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }
  return null
}

export function GoogleMapsEmbed({
  address = '',
  latitude,
  longitude,
  zoom = 15,
  apiKey = '',
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  // Necessitamos de pelo menos um: address ou lat/lng
  const hasLocation = address || (latitude != null && longitude != null)

  if (!hasLocation) {
    return (
      <div className={s.container}>
        <div className={s.fallback}>
          <AlertCircle size={24} />
          <span>Localização não definida</span>
        </div>
      </div>
    )
  }

  const embedUrl = buildEmbedUrl({ address, latitude, longitude, zoom, apiKey })
  const directLink = buildMapsLink({ address, latitude, longitude })

  return (
    <motion.div
      className={s.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cabeçalho com info do local */}
      <div className={s.header}>
        <MapPin size={16} />
        <div className={s.headerInfo}>
          <span className={s.title}>
            {address || `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}
          </span>
          {latitude != null && longitude != null && address && (
            <span className={s.coords}>{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
          )}
        </div>
        {directLink && (
          <a
            href={directLink}
            target="_blank"
            rel="noopener noreferrer"
            className={s.externalLink}
            title="Abrir no Google Maps"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Área do mapa */}
      <div className={s.mapWrap}>
        {!loaded && !error && (
          <div className={s.loading}>A carregar mapa...</div>
        )}

        {error ? (
          <div className={s.fallback}>
            <AlertCircle size={20} />
            <span>Não foi possível carregar o mapa</span>
            {directLink && (
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className={s.fallbackLink}
              >
                Abrir no Google Maps
              </a>
            )}
          </div>
        ) : (
          <iframe
            className={s.iframe}
            src={embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            title={`Mapa: ${address || 'localização'}`}
          />
        )}
      </div>

      {/* Link de fallback sempre visível */}
      {directLink && (
        <div className={s.footer}>
          <a
            href={directLink}
            target="_blank"
            rel="noopener noreferrer"
            className={s.footerLink}
          >
            <ExternalLink size={12} />
            Abrir no Google Maps
          </a>
        </div>
      )}
    </motion.div>
  )
}
