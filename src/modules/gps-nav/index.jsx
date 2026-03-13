// GPS Navigation — Navegacao para a equipa (sem tracking — RGPD safe)
// Locais do dia · Rota de hoje · Abrir no Maps · POIs · Emergencia · Meteo

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Navigation, MapPin, Phone, Fuel, Coffee, Building2, Car,
  ShieldCheck, ExternalLink, Clock, UtensilsCrossed, AlertTriangle,
  Cloud, Sun, CloudRain, Thermometer, ArrowRight, Route,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '../../core/i18n/index.js'
import { GoogleMapsEmbed } from '../../components/embeds/GoogleMapsEmbed.jsx'
import styles from './GpsNav.module.css'

function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

function mapsUrlAddress(address) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}

function mapsRouteUrl(locations) {
  if (locations.length < 2) return null
  const origin = locations[0]
  const dest = locations[locations.length - 1]
  const waypoints = locations.slice(1, -1)
  const originParam = origin.lat && origin.lng ? `${origin.lat},${origin.lng}` : encodeURIComponent(origin.address || origin.name)
  const destParam = dest.lat && dest.lng ? `${dest.lat},${dest.lng}` : encodeURIComponent(dest.address || dest.name)
  let url = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}`
  if (waypoints.length > 0) {
    const wp = waypoints.map(l => l.lat && l.lng ? `${l.lat},${l.lng}` : encodeURIComponent(l.address || l.name)).join('|')
    url += `&waypoints=${wp}`
  }
  return url
}

// Rough travel time estimate based on straight-line distance
function estimateTravel(loc1, loc2) {
  if (!loc1?.lat || !loc1?.lng || !loc2?.lat || !loc2?.lng) return null
  const R = 6371
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  // Assume ~40km/h average in urban areas
  const minutes = Math.round((km / 40) * 60)
  return { km: km.toFixed(1), minutes }
}

const WEATHER_ICONS = {
  clear: Sun,
  clouds: Cloud,
  rain: CloudRain,
  drizzle: CloudRain,
  thunderstorm: CloudRain,
}

const POI_ICONS = {
  hospital: Building2,
  fuel: Fuel,
  cafe: Coffee,
  parking: Car,
}

export default function GpsNavModule() {
  const { t } = useI18n()
  const { locations, shootingDays, sceneAssignments } = useStore(useShallow(s => ({
    locations: s.locations,
    shootingDays: s.shootingDays,
    sceneAssignments: s.sceneAssignments,
  })))

  const [weather, setWeather] = useState(null)

  // Find today's shooting day
  const today = new Date().toISOString().split('T')[0]
  const todayDay = useMemo(() => {
    return shootingDays.find(d => d.date === today) || shootingDays[0] || null
  }, [shootingDays, today])

  // Locations assigned for today
  const todayLocations = useMemo(() => {
    if (!todayDay) return []
    const assignedSceneKeys = Object.entries(sceneAssignments)
      .filter(([, dayId]) => dayId === todayDay.id)
      .map(([key]) => key)

    // Find locations from scenes (parse location from sceneKey or match all)
    // For now, show all confirmed locations as they're relevant
    return locations.filter(l => l.status === 'confirmado' && (l.address || l.lat))
  }, [todayDay, locations, sceneAssignments])

  const allLocations = useMemo(() => {
    return locations.filter(l => l.address || l.lat)
  }, [locations])

  const displayLocations = todayLocations.length > 0 ? todayLocations : allLocations
  const [selectedLocId, setSelectedLocId] = useState(null)

  // Selected location for map embed
  const mapLocation = useMemo(() => {
    if (selectedLocId) return displayLocations.find(l => l.id === selectedLocId) || null
    return displayLocations[0] || null
  }, [selectedLocId, displayLocations])

  const catering = todayDay?.catering || null

  // Travel estimates between consecutive today locations
  const travelEstimates = useMemo(() => {
    if (todayLocations.length < 2) return []
    const estimates = []
    for (let i = 0; i < todayLocations.length - 1; i++) {
      estimates.push(estimateTravel(todayLocations[i], todayLocations[i + 1]))
    }
    return estimates
  }, [todayLocations])

  // Fetch weather for first location with coords (lightweight, no API key needed for open-meteo)
  useEffect(() => {
    const loc = displayLocations.find(l => l.lat && l.lng)
    if (!loc) return
    const controller = new AbortController()
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.current) return
        const code = data.current.weather_code
        let condition = 'clear'
        if (code >= 51 && code <= 67) condition = 'drizzle'
        else if (code >= 71 && code <= 86) condition = 'clouds'
        else if (code >= 95) condition = 'thunderstorm'
        else if (code >= 1 && code <= 3) condition = 'clouds'
        else if (code >= 80 && code <= 82) condition = 'rain'
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          condition,
          wind: Math.round(data.current.wind_speed_10m),
          locationName: loc.displayName || loc.name,
        })
      })
      .catch(() => {})
    return () => controller.abort()
  }, [displayLocations])

  // POIs from location enrichment data (Overpass API), fallback to defaults
  const pois = useMemo(() => {
    const items = []
    // Priority: enrichment data from the selected location, then all locations
    const sourceLocs = mapLocation ? [mapLocation] : displayLocations
    sourceLocs.forEach(loc => {
      if (loc.enrichment) {
        const e = loc.enrichment
        ;(e.hospital || []).forEach(p => items.push({ type: 'hospital', name: p.name, notes: p.type, lat: p.lat, lng: p.lng }))
        ;(e.fuel || []).forEach(p => items.push({ type: 'fuel', name: p.name, notes: p.type, lat: p.lat, lng: p.lng }))
        ;(e.catering || []).forEach(p => items.push({ type: 'cafe', name: p.name, notes: p.type, lat: p.lat, lng: p.lng }))
        ;(e.parking || []).forEach(p => items.push({ type: 'parking', name: p.name, notes: p.type, lat: p.lat, lng: p.lng }))
      }
      // Legacy: also check nearbyPois if present
      if (loc.nearbyPois) {
        loc.nearbyPois.forEach(poi => items.push(poi))
      }
    })
    // Fallback: show default POIs only when no real data exists
    if (items.length === 0) {
      items.push(
        { type: 'hospital', name: t('gpsNav.defaultHospital'), notes: t('gpsNav.defaultHospitalNote') },
        { type: 'fuel', name: t('gpsNav.defaultFuel'), notes: t('gpsNav.defaultFuelNote') },
        { type: 'cafe', name: t('gpsNav.defaultCafe'), notes: t('gpsNav.defaultCafeNote') },
      )
    }
    return items
  }, [locations, mapLocation, displayLocations, t])

  return (
    <div className={styles.root}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{t('gpsNav.title')}</div>
          <div className={styles.sub}>
            {todayDay ? `${todayDay.label || todayDay.date || t('liveBoard.today')}` : t('gpsNav.noShootingDay')}
            {displayLocations.length > 0 && ` · ${displayLocations.length} ${t('gpsNav.locations')}`}
          </div>
        </div>
        {/* Weather widget in header */}
        {weather && (
          <div className={styles.weatherWidget}>
            {(() => { const WIcon = WEATHER_ICONS[weather.condition] || Sun; return <WIcon size={18} /> })()}
            <span className={styles.weatherTemp}>{weather.temp}°C</span>
            <span className={styles.weatherDetail}>{weather.wind} km/h</span>
            <span className={styles.weatherLoc}>{weather.locationName}</span>
          </div>
        )}
      </div>

      {/* ── Privacy Banner ── */}
      <div className={styles.privacyBanner}>
        <ShieldCheck size={16} className={styles.privacyIcon} />
        {t('gpsNav.privacyBanner')}
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>
        {/* Emergency — prominent red card */}
        <div className={styles.emergencyCardLarge}>
          <div className={styles.emergencyIconCircle}>
            <Phone size={24} />
          </div>
          <div className={styles.emergencyInfo}>
            <div className={styles.emergencyTitleLarge}>{t('gpsNav.emergency')}</div>
            <div className={styles.emergencyHint}>{t('gpsNav.emergencyHint')}</div>
          </div>
          <a href="tel:112" className={styles.emergencyBtnLarge}>
            <Phone size={20} /> 112
          </a>
        </div>

        {/* Today's Route */}
        {todayLocations.length > 1 && (
          <div className={styles.routeSection}>
            <div className={styles.sectionTitle} style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Route size={16} /> Rota de Hoje
              </span>
              {mapsRouteUrl(todayLocations) && (
                <a href={mapsRouteUrl(todayLocations)} target="_blank" rel="noopener noreferrer" className={styles.routeOpenBtn}>
                  <Navigation size={12} /> Abrir rota completa
                </a>
              )}
            </div>
            <div className={styles.routeTimeline}>
              {todayLocations.map((loc, i) => (
                <div key={loc.id}>
                  <div className={styles.routeStop} onClick={() => setSelectedLocId(loc.id)} style={{ cursor: 'pointer' }}>
                    <div className={styles.routeStopNumber}>{i + 1}</div>
                    <div className={styles.routeStopInfo}>
                      <span className={styles.routeStopName}>{loc.displayName || loc.name}</span>
                      {loc.address && <span className={styles.routeStopAddr}>{loc.address}</span>}
                    </div>
                    {loc.lat && loc.lng && (
                      <a
                        href={mapsUrl(loc.lat, loc.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.routeStopLink}
                        onClick={e => e.stopPropagation()}
                      >
                        Maps
                      </a>
                    )}
                  </div>
                  {i < todayLocations.length - 1 && (
                    <div className={styles.routeConnector}>
                      <div className={styles.routeConnectorLine} />
                      {travelEstimates[i] && (
                        <span className={styles.routeConnectorLabel}>
                          ~{travelEstimates[i].minutes} min ({travelEstimates[i].km} km)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's locations */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <MapPin size={16} /> {todayDay ? t('gpsNav.todayLocations') : t('gpsNav.projectLocations')}
          </div>
          {displayLocations.length === 0 ? (
            <div className={styles.empty}>
              <MapPin size={40} className={styles.emptyIcon} />
              <div className={styles.emptyText}>{t('gpsNav.emptyTitle')}</div>
              <div className={styles.emptyHint}>{t('gpsNav.emptyHint')}</div>
            </div>
          ) : (
            <div className={styles.locationList}>
              <AnimatePresence>
                {displayLocations.map(loc => (
                  <motion.div
                    key={loc.id}
                    className={`${styles.locationCard}${selectedLocId === loc.id ? ` ${styles.locationCardSelected}` : ''}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedLocId(loc.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.locationInfo}>
                      <div className={styles.locationName}>{loc.displayName || loc.name}</div>
                      {loc.address && <div className={styles.locationAddress}>{loc.address}</div>}
                      <div className={styles.locationMeta}>
                        {loc.type && <span className={styles.locationTag}>{loc.type}</span>}
                        {loc.status && <span className={styles.locationTag}>{loc.status}</span>}
                        {loc.accessNotes && <span className={styles.locationTag}>{loc.accessNotes}</span>}
                        {loc.parkingNotes && <span className={styles.locationTag}><Car size={10} /> {loc.parkingNotes}</span>}
                      </div>
                    </div>
                    <a
                      href={loc.lat && loc.lng ? mapsUrl(loc.lat, loc.lng) : mapsUrlAddress(loc.address || loc.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapsBtn}
                      onClick={e => e.stopPropagation()}
                    >
                      <Navigation size={14} /> {t('gpsNav.openInMaps')}
                    </a>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Map embed for selected location */}
        {mapLocation && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}><MapPin size={16} /> {t('gpsNav.map')}</div>
            <GoogleMapsEmbed
              address={mapLocation.address || mapLocation.name || ''}
              latitude={mapLocation.lat}
              longitude={mapLocation.lng}
            />
          </div>
        )}

        {/* Catering location */}
        {catering && catering.location && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}><UtensilsCrossed size={16} /> {t('gpsNav.todayCatering')}</div>
            <div className={styles.cateringCard}>
              <div className={styles.cateringInfo}>
                <div className={styles.cateringName}>{catering.location}</div>
                {catering.time && <div className={styles.cateringTime}><Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{catering.time}</div>}
                {catering.provider && <div className={styles.cateringTime}>{t('gpsNav.providerLabel', { name: catering.provider })}</div>}
              </div>
              <a
                href={mapsUrlAddress(catering.location)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapsBtn}
              >
                <Navigation size={14} /> Abrir no Maps
              </a>
            </div>
          </div>
        )}

        {/* POIs */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}><AlertTriangle size={16} /> {t('gpsNav.nearbyPois')}</div>
          <div className={styles.poiGrid}>
            {pois.map((poi, i) => {
              const Icon = POI_ICONS[poi.type] || MapPin
              return (
                <motion.div
                  key={i}
                  className={`${styles.poiCard}${poi.type === 'hospital' ? ` ${styles.poiCardHospital}` : ''}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  <div className={styles.poiIcon}><Icon size={18} /></div>
                  <div className={styles.poiInfo}>
                    <div className={styles.poiName}>{poi.name}</div>
                    <div className={styles.poiType}>{poi.notes || poi.type}</div>
                  </div>
                  {poi.lat && poi.lng && (
                    <a href={mapsUrl(poi.lat, poi.lng)} target="_blank" rel="noopener noreferrer" className={styles.poiNav}>
                      <Navigation size={12} />
                    </a>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export { GpsNavModule }
