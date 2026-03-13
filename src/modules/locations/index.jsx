// Locais — módulo completo
// Grid de cards · Drawer com Info | Mapa | Fotos | Cenas
// OpenStreetMap + Nominatim geocoding + Overpass API 500m
// 3 momentos de foto · Cenas ligadas dos guiões

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, MapPin, Phone, Camera, Film, Navigation,
  Search, ExternalLink, Link2, Trash2, Upload,
  Sun, Moon, Home, Coffee, Car, AlertTriangle,
  ChevronDown, CheckCircle, Palette, Calendar, DollarSign, Sunrise, Sunset, Zap,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { SmartInput } from '../../components/shared/SmartInput.jsx'
import { scenesForLocation } from '../../utils/locationResolver.js'
import { fetchWeather, weatherIcon } from '../callsheet/weather.js'
import { WeatherWidget } from '../../components/embeds/WeatherWidget.jsx'
import styles from './Locations.module.css'

// ── Constantes ────────────────────────────────────────────────────
const STATUSES = [
  { id: 'por identificar',      label: 'Por identificar',      color: 'var(--text-muted)' },
  { id: 'recce feito',          label: 'Recce feito',          color: 'var(--health-yellow)' },
  { id: 'autorização pendente', label: 'Autorização pendente', color: '#F5A623' },
  { id: 'confirmado',           label: 'Confirmado',           color: 'var(--health-green)' },
  { id: 'recusado',             label: 'Recusado',             color: '#F87171' },
]
const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.id, s]))
const STATUS_CYCLE = {
  'por identificar': 'recce feito',
  'recce feito': 'autorização pendente',
  'autorização pendente': 'confirmado',
  'confirmado': 'por identificar',
  'recusado': 'por identificar',
}

const PHOTO_MOMENTS = [
  { id: 'before', label: 'Antes de Rodar',   icon: Sun,    desc: 'O espaço como chegou — referência base' },
  { id: 'scene',  label: 'Estado de Cena',   icon: Camera, desc: 'Foto pelo script supervisor no fim de cada cena' },
  { id: 'after',  label: 'Ao Fechar',        icon: Moon,   desc: 'Prova para o dono · referência para voltar' },
]

const DRAWER_TABS = ['Info', 'Mapa', 'Fotos', 'Cenas', 'Dept']

// ── Constantes de cor por tipo ────────────────────────────────────
const TYPE_COLORS = { INT: '#5B8DEF', EXT: '#2EA080', 'INT/EXT': '#9B59B6' }

// ── Helpers ───────────────────────────────────────────────────────
function extractType(name = '') {
  const u = name.toUpperCase()
  if (u.startsWith('INT./EXT.') || u.startsWith('INT/EXT') || u.startsWith('INT./ EXT.')) return 'INT/EXT'
  if (u.startsWith('EXT.') || u.startsWith('EXT ')) return 'EXT'
  return 'INT'
}

// Strip time-of-day suffix and INT./EXT. prefix to get a canonical key for deduplication
function canonicalLocKey(name = '') {
  return name
    .replace(/\s*-\s*(DIA|NOITE|TARDE|MANHÃ|AMANHECER|ANOITECER|DIA\/NOITE|TARDE\/NOITE|MADRUGADA|ENTARDECER)(\s*\/\s*\w+)*\s*$/i, '')
    .trim()
    .toUpperCase()
}

// Friendly display name from raw script name (strip INT./EXT. prefix + time suffix, title-case)
function friendlyDisplayName(rawName = '') {
  const stripped = rawName
    .replace(/^(INT\.\/EXT\.|EXT\.\/INT\.|INT\.\s*\/\s*EXT\.|INT\.|EXT\.)\s*/i, '')
    .replace(/\s*-\s*(DIA|NOITE|TARDE|MANHÃ|AMANHECER|ANOITECER|DIA\/NOITE|TARDE\/NOITE|MADRUGADA|ENTARDECER)(\s*\/\s*\w+)*\s*$/i, '')
    .trim()
  // Title-case first letter only, preserve rest (respects proper nouns in all-caps scripts)
  if (!stripped) return ''
  return stripped.charAt(0).toUpperCase() + stripped.slice(1).toLowerCase()
}

// Deduplicate location names: "INT. SALA - DIA" + "INT. SALA - NOITE" → one entry
function deduplicateLocationNames(names = []) {
  const seen = new Map() // canonicalKey → first raw name
  names.forEach(name => {
    const key = canonicalLocKey(name)
    if (!seen.has(key)) seen.set(key, name)
  })
  return [...seen.values()]
}

function newLocation(name = '', fromScript = false) {
  return {
    id: `loc_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    name,
    displayName: fromScript ? friendlyDisplayName(name) : '',
    type: extractType(name),
    status: 'por identificar',
    address: '', lat: null, lng: null,
    contact: '', accessNotes: '', notes: '',
    photos: { before: [], scene: [], after: [] },
    driveLinks: [],
    fromScript,
  }
}

// ── Avatar do local ───────────────────────────────────────────────
function TypeBadge({ type }) {
  const colors = { INT: '#5B8DEF', EXT: '#2EA080', 'INT/EXT': '#9B59B6' }
  return (
    <span className={styles.typeBadge} style={{ background: (colors[type] || '#888') + '22', color: colors[type] || '#888', borderColor: (colors[type] || '#888') + '44' }}>
      {type}
    </span>
  )
}

function StatusPill({ status, onClick }) {
  const s = STATUS_MAP[status] || STATUS_MAP['por identificar']
  return (
    <button className={styles.statusPill} style={{ color: s.color, borderColor: s.color + '55', background: s.color + '11' }}
      onClick={onClick} title="Clica para avançar">
      {s.label}
    </button>
  )
}

// ── Card do local ─────────────────────────────────────────────────
function LocationCard({ loc, sceneCount, shootingDayCount, onClick }) {
  const s = STATUS_MAP[loc.status] || STATUS_MAP['por identificar']
  const tc = TYPE_COLORS[loc.type] || '#888'
  return (
    <motion.div className={styles.card} onClick={onClick}
      style={{ borderTop: `3px solid ${tc}` }}
      whileHover={{ y: -2, boxShadow: `0 8px 28px ${tc}22` }} whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className={styles.cardTop}>
        <div className={styles.cardIcon} style={{ background: tc + '18', borderColor: tc + '33' }}>
          <MapPin size={16} color={tc} />
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <TypeBadge type={loc.type} />
          {shootingDayCount > 0 && (
            <span className={styles.shootingDayBadge}>
              <Calendar size={10} /> {shootingDayCount} {shootingDayCount === 1 ? 'dia' : 'dias'}
            </span>
          )}
        </div>
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardName}>{loc.displayName || loc.name}</span>
        {loc.displayName && <span className={styles.cardScript}>{loc.name}</span>}
        {loc.address && <span className={styles.cardAddress}>{loc.address}</span>}
        {loc.cost > 0 && <span className={styles.cardAddress} style={{ color: 'var(--health-yellow)' }}>{Number(loc.cost).toLocaleString('pt-PT')} EUR</span>}
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.cardStatus} style={{ color: s.color }}>{s.label}</span>
        {sceneCount > 0 && <span className={styles.cardScenes}><Film size={11} /> {sceneCount} cenas</span>}
      </div>
    </motion.div>
  )
}

// ── Drawer — detalhe completo ─────────────────────────────────────
function LocationDrawer({ loc, onClose, onUpdate, onDelete, allScenes, shootingDaysForLoc }) {
  const owmApiKey = useStore(s => s.owmApiKey)
  const [tab, setTab] = useState('Info')
  const [geocoding, setGeocoding] = useState(false)
  const [pois, setPois] = useState(null)
  const [loadingPois, setLoadingPois] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [addingLink, setAddingLink] = useState(false)
  const [newLink, setNewLink] = useState({ label: '', url: '' })
  const [newPhotoUrl, setNewPhotoUrl] = useState({ before: '', scene: '', after: '' })
  const [sunData, setSunData] = useState(null)
  const [loadingSun, setLoadingSun] = useState(false)
  const [weather, setWeather] = useState(null)
  const [enriching, setEnriching] = useState(false)

  const up = (k, v) => onUpdate(loc.id, { [k]: v })
  const s = STATUS_MAP[loc.status] || STATUS_MAP['por identificar']

  // Scenes for this location
  const scenes = scenesForLocation(allScenes, loc)

  // Geocoding via Nominatim
  const geocode = async () => {
    if (!loc.address) return
    setGeocoding(true)
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc.address)}&format=json&limit=1`, {
        headers: { 'Accept-Language': 'pt', 'User-Agent': 'FrameFlow-App' },
      })
      const d = await r.json()
      if (d[0]) {
        onUpdate(loc.id, { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) })
        // Auto-enrich on first geocode if not already enriched
        if (!loc.enrichment) setTimeout(enrichLocation, 500)
      }
    } catch { /* silent */ }
    setGeocoding(false)
  }

  // Overpass API nearby POIs
  const fetchPois = async () => {
    if (!loc.lat || !loc.lng) return
    setLoadingPois(true)
    try {
      const q = `[out:json][timeout:10];(node["amenity"~"restaurant|cafe|parking|fuel|supermarket"](around:500,${loc.lat},${loc.lng}););out body;`
      const r = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`)
      const d = await r.json()
      setPois(d.elements || [])
    } catch { setPois([]) }
    setLoadingPois(false)
  }

  // Photo management
  const addPhoto = (moment, url) => {
    if (!url.trim()) return
    const updated = { ...loc.photos, [moment]: [...(loc.photos[moment] || []), { id: Date.now(), url: url.trim(), caption: '', date: new Date().toISOString().slice(0, 10) }] }
    up('photos', updated)
    setNewPhotoUrl(prev => ({ ...prev, [moment]: '' }))
  }
  const removePhoto = (moment, id) => {
    const updated = { ...loc.photos, [moment]: (loc.photos[moment] || []).filter(p => p.id !== id) }
    up('photos', updated)
  }
  const updateCaption = (moment, id, caption) => {
    const updated = { ...loc.photos, [moment]: (loc.photos[moment] || []).map(p => p.id === id ? { ...p, caption } : p) }
    up('photos', updated)
  }

  // Drive links
  const addLink = () => {
    if (!newLink.url.trim()) return
    up('driveLinks', [...(loc.driveLinks || []), { ...newLink, id: Date.now() }])
    setNewLink({ label: '', url: '' }); setAddingLink(false)
  }
  const removeLink = (id) => up('driveLinks', (loc.driveLinks || []).filter(l => l.id !== id))

  // Sunrise/sunset fetch
  useEffect(() => {
    if (!loc.lat || !loc.lng) { setSunData(null); return }
    let cancelled = false
    setLoadingSun(true)
    fetch(`https://api.sunrise-sunset.org/json?lat=${loc.lat}&lng=${loc.lng}&formatted=0&date=today`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d.status === 'OK') setSunData(d.results)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingSun(false) })
    return () => { cancelled = true }
  }, [loc.lat, loc.lng])

  // Weather fetch
  useEffect(() => {
    if (!loc.lat || !loc.lng) { setWeather(null); return }
    let cancelled = false
    if (owmApiKey) {
      fetchWeather(loc.lat, loc.lng, owmApiKey).then(w => { if (!cancelled) setWeather(w) }).catch(() => {})
    }
    return () => { cancelled = true }
  }, [loc.lat, loc.lng, owmApiKey])

  // Manual enrichment via Overpass API (parking, catering, hospital, fuel within 800m)
  const enrichLocation = async () => {
    if (!loc.lat || !loc.lng) return
    setEnriching(true)
    try {
      const categories = [
        { key: 'parking',  query: '"amenity"="parking"' },
        { key: 'catering', query: '"amenity"~"restaurant|cafe|fast_food"' },
        { key: 'hospital', query: '"amenity"~"hospital|clinic"' },
        { key: 'fuel',     query: '"amenity"="fuel"' },
      ]
      const enrichment = {}
      for (const cat of categories) {
        const q = `[out:json][timeout:10];(node[${cat.query}](around:800,${loc.lat},${loc.lng}););out body;`
        const r = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`)
        const d = await r.json()
        enrichment[cat.key] = (d.elements || []).slice(0, 5).map(e => ({
          name: e.tags?.name || e.tags?.amenity || cat.key,
          type: e.tags?.amenity || cat.key,
          lat: e.lat, lng: e.lon,
        }))
      }
      onUpdate(loc.id, { enrichment })
    } catch { /* silent */ }
    setEnriching(false)
  }

  const mapSrc = loc.lat && loc.lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng - 0.008},${loc.lat - 0.006},${loc.lng + 0.008},${loc.lat + 0.006}&layer=mapnik&marker=${loc.lat},${loc.lng}`
    : null

  const poiIcon = (amenity) => {
    if (/restaurant|cafe/.test(amenity)) return <Coffee size={12} />
    if (/parking|fuel/.test(amenity)) return <Car size={12} />
    return <MapPin size={12} />
  }

  return (
    <motion.div className={styles.drawerOverlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}>
      <motion.div className={styles.drawer} data-glass
        initial={{ y: 28, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 16, scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.drawerHeader} style={{ borderBottom: `3px solid ${s.color}` }}>
          <div className={styles.drawerHeaderTop}>
            <button className={styles.iconBtn} onClick={onClose}><X size={18} /></button>
            <div style={{ display: 'flex', gap: 8 }}>
              {!confirmDelete
                ? <button className={styles.deleteBtnDrawer} onClick={() => setConfirmDelete(true)}><Trash2 size={14} /></button>
                : <>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', alignSelf: 'center' }}>Confirmar?</span>
                    <button className={styles.btnCancel} onClick={() => setConfirmDelete(false)}>Não</button>
                    <button className={styles.btnDanger} onClick={() => { onDelete(loc.id); onClose() }}>Eliminar</button>
                  </>
              }
            </div>
          </div>

          <div className={styles.drawerIdentity}>
            <div className={styles.drawerIcon} style={{ background: s.color + '18', borderColor: s.color + '33' }}>
              <MapPin size={24} color={s.color} />
            </div>
            <div className={styles.drawerNames}>
              <input className={styles.drawerNameInput}
                value={loc.displayName || ''} onChange={e => up('displayName', e.target.value)}
                placeholder={loc.name || 'Nome amigável do local'} />
              <input className={styles.drawerRoleInput}
                value={loc.name} onChange={e => up('name', e.target.value)}
                placeholder="Nome no guião (INT. ESCOLA - DIA)" />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <TypeBadge type={loc.type} />
                <select className={styles.typeSelect} value={loc.type} onChange={e => up('type', e.target.value)}>
                  {['INT', 'EXT', 'INT/EXT'].map(t => <option key={t}>{t}</option>)}
                </select>
                <StatusPill status={loc.status} onClick={() => up('status', STATUS_CYCLE[loc.status])} />
              </div>
            </div>
          </div>

          {/* Drawer tabs */}
          <div className={styles.drawerTabs}>
            {DRAWER_TABS.map(t => (
              <button key={t} className={`${styles.drawerTab} ${tab === t ? styles.drawerTabActive : ''}`}
                onClick={() => setTab(t)}>
                {t}
                {t === 'Fotos' && Object.values(loc.photos || {}).flat().length > 0 && (
                  <span className={styles.drawerTabBadge}>{Object.values(loc.photos).flat().length}</span>
                )}
                {t === 'Cenas' && scenes.length > 0 && (
                  <span className={styles.drawerTabBadge}>{scenes.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Corpo */}
        <div className={styles.drawerBody}>

          {/* ── INFO ── */}
          {tab === 'Info' && (
            <div className={styles.tabContent}>
              <Section title="Localização">
                <Field label="Morada">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className={styles.input} style={{ flex: 1 }} value={loc.address || ''}
                      onChange={e => up('address', e.target.value)} placeholder="Rua, nº, cidade, código postal" />
                    <button className={styles.btnSecondary} onClick={geocode} disabled={!loc.address || geocoding} title="Geocodificar morada">
                      {geocoding ? '…' : <Navigation size={14} />}
                    </button>
                  </div>
                  {loc.lat && loc.lng && (
                    <span className={styles.coordsLabel}>📍 {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)} ·
                      <a href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}`} target="_blank" rel="noopener noreferrer" className={styles.mapLink}> Ver no mapa</a>
                    </span>
                  )}
                </Field>
              </Section>

              <Section title="Contacto">
                <Field label="Responsável / Dono">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input className={styles.input} style={{ flex: 1 }} value={loc.contact || ''}
                      onChange={e => up('contact', e.target.value)} placeholder="Nome + telefone ou email" />
                    {loc.contact && loc.contact.includes('@') &&
                      <a href={`mailto:${loc.contact}`} className={styles.contactLink}><Phone size={14} /></a>}
                  </div>
                </Field>
                <Field label="Acesso e restrições">
                  <SmartInput value={loc.accessNotes || ''}
                    onChange={e => up('accessNotes', e.target.value)}
                    placeholder="Código de porta, estacionamento, horários de acesso, regras do dono…" rows={3}
                    context={`Acesso e restrições do local "${loc.name || 'local'}"`} />
                </Field>
              </Section>

              <Section title="Notas de produção">
                <SmartInput value={loc.notes || ''}
                  onChange={e => up('notes', e.target.value)}
                  placeholder="Acústica, luz natural, desafios técnicos, observações do recce…" rows={4}
                  context={`Notas de produção do local "${loc.name || 'local'}" — técnicas, acústica, luz, desafios`} />
              </Section>

              <Section title="Custo">
                <Field label="Valor (EUR)">
                  <input className={styles.input} type="number" min="0" step="0.01"
                    value={loc.cost || ''} onChange={e => up('cost', e.target.value ? parseFloat(e.target.value) : 0)}
                    placeholder="0.00" />
                </Field>
                <Field label="Notas de custo">
                  <input className={styles.input}
                    value={loc.costNotes || ''} onChange={e => up('costNotes', e.target.value)}
                    placeholder="Inclui limpeza, seguro, caução…" />
                </Field>
              </Section>

              {/* Sunrise / Sunset */}
              {loc.lat && loc.lng && (
                <Section title="Sol (hoje)">
                  {loadingSun ? (
                    <p className={styles.emptyNote}>A carregar dados solares…</p>
                  ) : sunData ? (
                    <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sunrise size={14} color="var(--health-yellow)" />
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {new Date(sunData.sunrise).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>nascer</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sunset size={14} color="#F5A623" />
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {new Date(sunData.sunset).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>por do sol</span>
                      </div>
                      {sunData.civil_twilight_begin && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Moon size={14} color="var(--text-muted)" />
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            Crepusculo {new Date(sunData.civil_twilight_begin).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} — {new Date(sunData.civil_twilight_end).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className={styles.emptyNote}>Sem dados solares disponíveis</p>
                  )}
                </Section>
              )}

              {/* Meteo */}
              {weather?.current && weather.current.temp !== '--' && (
                <Section title="Meteo (hoje)">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 28 }}>{weatherIcon(weather.current.icon)}</span>
                    <div>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{weather.current.temp}°C</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{weather.current.description}</span>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
                      <div>Sensação {weather.current.feelsLike}°C</div>
                      <div>Humidade {weather.current.humidity}%</div>
                      <div>Vento {weather.current.wind.speed} km/h</div>
                    </div>
                  </div>
                  {weather.hourly?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
                      {weather.hourly.slice(0, 6).map((h, i) => (
                        <div key={i} style={{
                          minWidth: 52, padding: '6px 4px', textAlign: 'center', borderRadius: 8,
                          background: h.pop > 50 ? 'rgba(248,113,113,0.1)' : 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)', fontSize: 10,
                        }}>
                          <div style={{ fontWeight: 600 }}>{h.time}</div>
                          <div style={{ fontSize: 16 }}>{weatherIcon(h.icon)}</div>
                          <div style={{ fontWeight: 700 }}>{h.temp}°</div>
                          {h.pop > 0 && <div style={{ color: '#5B8DEF', fontSize: 9 }}>{h.pop}%</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {/* WeatherWidget embed */}
              {loc.lat && loc.lng && (
                <Section title="Meteo detalhado">
                  <WeatherWidget
                    apiKey={owmApiKey || ''}
                    latitude={loc.lat}
                    longitude={loc.lng}
                  />
                </Section>
              )}

              {/* Dias de rodagem */}
              {shootingDaysForLoc.length > 0 && (
                <Section title={`Dias de rodagem (${shootingDaysForLoc.length})`}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {shootingDaysForLoc.map(day => (
                      <span key={day.id} style={{
                        padding: '3px 10px', borderRadius: 'var(--radius-full)',
                        background: 'color-mix(in srgb, var(--mod-production) 12%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--mod-production) 25%, transparent)',
                        fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--mod-production)',
                      }}>
                        <Calendar size={10} style={{ marginRight: 4, verticalAlign: -1 }} />
                        {day.label || day.date || day.id}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              <Section title="Links & Drive"
                action={<button className={styles.addLinkBtn} onClick={() => setAddingLink(v => !v)}><Plus size={12} /> Link</button>}>
                <AnimatePresence>
                  {addingLink && (
                    <motion.div className={styles.addLinkForm}
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <input className={styles.input} placeholder="Etiqueta (ex: Fotos recce)" value={newLink.label} onChange={e => setNewLink(v => ({ ...v, label: e.target.value }))} />
                      <input className={styles.input} placeholder="URL (Google Drive, Maps…)" value={newLink.url} onChange={e => setNewLink(v => ({ ...v, url: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addLink()} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className={styles.btnCancel} onClick={() => setAddingLink(false)}>Cancelar</button>
                        <button className={styles.btnConfirm} onClick={addLink}>Guardar</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {(loc.driveLinks || []).length === 0 && !addingLink && (
                  <p className={styles.emptyNote}>Nenhum link adicionado</p>
                )}
                {(loc.driveLinks || []).map(link => (
                  <div key={link.id} className={styles.linkRow}>
                    <Link2 size={13} color="var(--text-muted)" />
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.linkLabel}>{link.label || link.url}</a>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.contactLink}><ExternalLink size={12} /></a>
                    <button className={styles.removeLinkBtn} onClick={() => removeLink(link.id)}><X size={11} /></button>
                  </div>
                ))}
              </Section>
            </div>
          )}

          {/* ── MAPA ── */}
          {tab === 'Mapa' && (
            <div className={styles.tabContent}>
              {!loc.lat || !loc.lng ? (
                <div className={styles.mapEmpty}>
                  <MapPin size={32} color="var(--text-muted)" />
                  <p>Introduz a morada no tab Info e clica em <Navigation size={12} /> para geocodificar</p>
                  {loc.address && (
                    <button className={styles.btnConfirm} onClick={geocode} disabled={geocoding}>
                      {geocoding ? 'A geocodificar…' : <><Navigation size={14} /> Geocodificar agora</>}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <iframe
                    src={mapSrc}
                    className={styles.mapFrame}
                    title={`Mapa de ${loc.displayName || loc.name}`}
                    allowFullScreen
                  />
                  <div className={styles.mapActions}>
                    <a href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`} target="_blank" rel="noopener noreferrer" className={styles.btnSecondary}>
                      <ExternalLink size={13} /> Google Maps
                    </a>
                    <a href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}&zoom=17`} target="_blank" rel="noopener noreferrer" className={styles.btnSecondary}>
                      <ExternalLink size={13} /> OpenStreetMap
                    </a>
                    <button className={styles.btnSecondary} onClick={fetchPois} disabled={loadingPois}>
                      <Search size={13} /> {loadingPois ? 'A pesquisar…' : 'Arredores 500m'}
                    </button>
                    <button className={styles.btnConfirm} onClick={enrichLocation} disabled={enriching}
                      title="Pesquisa estacionamento, alimentação, hospital e combustível (800m)">
                      <Zap size={13} /> {enriching ? 'A enriquecer…' : 'Enriquecer'}
                    </button>
                  </div>

                  {/* POIs manuais */}
                  {pois !== null && (
                    <div className={styles.poisSection}>
                      <span className={styles.poisTitle}>Pontos de interesse encontrados ({pois.length})</span>
                      {pois.length === 0
                        ? <p className={styles.emptyNote}>Nenhum ponto encontrado no raio de 500m</p>
                        : (
                          <div className={styles.poisList}>
                            {pois.slice(0, 20).map(poi => (
                              <div key={poi.id} className={styles.poiRow}>
                                {poiIcon(poi.tags?.amenity)}
                                <span className={styles.poiName}>{poi.tags?.name || poi.tags?.amenity}</span>
                                <span className={styles.poiType}>{poi.tags?.amenity}</span>
                                {poi.lat && poi.lon && (
                                  <a href={`https://www.google.com/maps?q=${poi.lat},${poi.lon}`} target="_blank" rel="noopener noreferrer" className={styles.poiLink}><ExternalLink size={10} /></a>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      }
                    </div>
                  )}

                  {/* Auto-enrichment (ReactiveCore: preenchido ao confirmar local) */}
                  {loc.enrichment && (
                    <div className={styles.poisSection}>
                      <span className={styles.poisTitle} style={{ color: 'var(--health-green)' }}>
                        ✓ Arredores (auto)
                      </span>

                      {loc.enrichment.parking?.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <span className={styles.enrichLabel}><Car size={11} /> Estacionamento</span>
                          {loc.enrichment.parking.map((p, i) => (
                            <div key={i} className={styles.poiRow}>
                              <Car size={12} />
                              <span className={styles.poiName}>{p.name}</span>
                              {p.lat && p.lng && (
                                <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" className={styles.poiLink}><ExternalLink size={10} /></a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {loc.enrichment.catering?.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <span className={styles.enrichLabel}><Coffee size={11} /> Alimentação</span>
                          {loc.enrichment.catering.map((p, i) => (
                            <div key={i} className={styles.poiRow}>
                              <Coffee size={12} />
                              <span className={styles.poiName}>{p.name}</span>
                              <span className={styles.poiType}>{p.type}</span>
                              {p.lat && p.lng && (
                                <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" className={styles.poiLink}><ExternalLink size={10} /></a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {loc.enrichment.hospital?.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <span className={styles.enrichLabel}><AlertTriangle size={11} /> Hospital</span>
                          {loc.enrichment.hospital.map((p, i) => (
                            <div key={i} className={styles.poiRow}>
                              <AlertTriangle size={12} color="var(--health-red)" />
                              <span className={styles.poiName}>{p.name}</span>
                              {p.lat && p.lng && (
                                <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" className={styles.poiLink}><ExternalLink size={10} /></a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {loc.enrichment.fuel?.length > 0 && (
                        <div>
                          <span className={styles.enrichLabel}><Car size={11} /> Combustível</span>
                          {loc.enrichment.fuel.map((p, i) => (
                            <div key={i} className={styles.poiRow}>
                              <Car size={12} />
                              <span className={styles.poiName}>{p.name}</span>
                              {p.lat && p.lng && (
                                <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" className={styles.poiLink}><ExternalLink size={10} /></a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {loc.enrichment.parking?.length === 0 && loc.enrichment.catering?.length === 0 && (
                        <p className={styles.emptyNote}>Sem pontos encontrados no raio de 800m</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── FOTOS ── */}
          {tab === 'Fotos' && (
            <div className={styles.tabContent}>
              {PHOTO_MOMENTS.map(moment => {
                const MIcon = moment.icon
                const photos = (loc.photos || {})[moment.id] || []
                return (
                  <Section key={moment.id} title={moment.label}
                    subtitle={moment.desc}>
                    {/* Adicionar foto via URL */}
                    <div className={styles.addPhotoRow}>
                      <input className={styles.input} style={{ flex: 1 }}
                        placeholder="URL da foto (Google Drive, Dropbox…)"
                        value={newPhotoUrl[moment.id] || ''}
                        onChange={e => setNewPhotoUrl(prev => ({ ...prev, [moment.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addPhoto(moment.id, newPhotoUrl[moment.id])} />
                      <button className={styles.btnSecondary} onClick={() => addPhoto(moment.id, newPhotoUrl[moment.id])}>
                        <Plus size={14} />
                      </button>
                    </div>
                    {photos.length === 0 && (
                      <div className={styles.photoEmpty}>
                        <MIcon size={20} color="var(--text-muted)" />
                        <span>Sem fotos</span>
                      </div>
                    )}
                    <div className={styles.photoGrid}>
                      {photos.map(photo => (
                        <div key={photo.id} className={styles.photoCard}>
                          <div className={styles.photoThumb}>
                            <img src={photo.url} alt={photo.caption || moment.label}
                              onError={e => { e.target.style.display = 'none' }} />
                            <button className={styles.photoRemove} onClick={() => removePhoto(moment.id, photo.id)}><X size={10} /></button>
                          </div>
                          <input className={styles.photoCaption}
                            value={photo.caption || ''}
                            onChange={e => updateCaption(moment.id, photo.id, e.target.value)}
                            placeholder="Legenda…" />
                          <span className={styles.photoDate}>{photo.date}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )
              })}
            </div>
          )}

          {/* ── CENAS ── */}
          {tab === 'Cenas' && (
            <div className={styles.tabContent}>
              {scenes.length === 0 ? (
                <div className={styles.mapEmpty}>
                  <Film size={28} color="var(--text-muted)" />
                  <p>Nenhuma cena dos guiões carregados associada a este local</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>O match faz-se pelo nome do local no guião</p>
                </div>
              ) : (
                <div className={styles.sceneList}>
                  {scenes.map((sc, i) => (
                    <div key={i} className={styles.sceneRow}>
                      <span className={styles.sceneId}>{sc.episode && `${sc.episode} · `}{sc.sceneNumber ? `Cena ${sc.sceneNumber}` : `Cena ${i + 1}`}</span>
                      <div className={styles.sceneInfo}>
                        <span className={styles.sceneLoc}>{sc.location}</span>
                        {sc.timeOfDay && <span className={styles.sceneTime}>{sc.timeOfDay}</span>}
                        {sc.description && <p className={styles.sceneDesc}>{sc.description}</p>}
                        {sc.characters && sc.characters.length > 0 && (
                          <div className={styles.sceneChars}>
                            {sc.characters.slice(0, 5).map(c => (
                              <span key={c} className={styles.sceneChar}>{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'Dept' && <LocationDeptTab locationName={loc.displayName || loc.name} />}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Items de departamento para este local ────────────────────────
function LocationDeptTab({ locationName }) {
  const {  departmentItems, departmentConfig, navigate  } = useStore(useShallow(s => ({ departmentItems: s.departmentItems, departmentConfig: s.departmentConfig, navigate: s.navigate })))
  const items = departmentItems.filter(i =>
    i.locationName && locationName &&
    i.locationName?.toLowerCase().includes(locationName?.toLowerCase())
  )

  if (items.length === 0) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.mapEmpty}>
          <Palette size={28} color="var(--text-muted)" />
          <p>Sem items de departamento para este local</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Fotos adicionadas no Script RT ou Departamentos aparecerão aqui
          </p>
        </div>
      </div>
    )
  }

  const byDept = {}
  items.forEach(i => {
    if (!byDept[i.department]) byDept[i.department] = []
    byDept[i.department].push(i)
  })

  return (
    <div className={styles.tabContent}>
      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {Object.entries(byDept).map(([deptId, dItems]) => {
          const cfg = departmentConfig.find(d => d.id === deptId)
          return (
            <div key={deptId}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg?.color || 'var(--accent)' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: cfg?.color }}>{cfg?.label || deptId}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>({dItems.length})</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {dItems.map(item => (
                  <div key={item.id} style={{
                    width: 80, borderRadius: 'var(--radius-md)', overflow: 'hidden',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }} onClick={() => navigate('departments')}>
                    {item.photos?.[0] ? (
                      <img src={item.photos[0]} alt="" style={{ width: '100%', height: 60, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Palette size={16} color="var(--text-muted)" />
                      </div>
                    )}
                    <div style={{ padding: '4px 6px' }}>
                      <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || '—'}</p>
                      {item.approved && <span style={{ fontSize: 8, color: 'var(--health-green)', fontWeight: 600 }}>Aprovado</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────
function Section({ title, subtitle, children, action }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionTitle}>{title}</span>
          {subtitle && <span className={styles.sectionSub}>{subtitle}</span>}
        </div>
        {action}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  )
}

// ── Módulo principal ──────────────────────────────────────────────
export function LocationsModule() {
  const {  locations, addLocation, updateLocation, removeLocation, parsedLocations, parsedScripts, projectName, shootingDays, sceneAssignments  } = useStore(useShallow(s => ({ locations: s.locations, addLocation: s.addLocation, updateLocation: s.updateLocation, removeLocation: s.removeLocation, parsedLocations: s.parsedLocations, parsedScripts: s.parsedScripts, projectName: s.projectName, shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments })))

  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [search,       setSearch]       = useState('')
  const [selectedId,   setSelectedId]   = useState(null)
  const [addingManual, setAddingManual] = useState(false)
  const [newName,      setNewName]      = useState('')

  const selectedLoc = locations.find(l => l.id === selectedId)

  // Extrair todas as cenas de todos os guiões para o tab Cenas
  const allScenes = Object.entries(parsedScripts).flatMap(([epId, data]) =>
    (data.scenes || []).map(sc => ({ ...sc, episode: epId }))
  )

  // Deduplica locais dos guiões (mesmo local em diferentes horas/episódios → uma entrada)
  const dedupedLocations = deduplicateLocationNames(parsedLocations)

  // Importar locais que ainda não existem (compara por chave canónica)
  const existingKeys = new Set(locations.map(l => canonicalLocKey(l.name)))
  const unimported = dedupedLocations.filter(name => !existingKeys.has(canonicalLocKey(name)))

  const importFromScripts = () => {
    // Small delay between adds to ensure unique IDs
    unimported.forEach((name, i) =>
      setTimeout(() => addLocation(newLocation(name, true)), i * 2)
    )
  }

  const addManual = () => {
    if (!newName.trim()) return
    const loc = newLocation(newName.trim(), false)
    addLocation(loc)
    setNewName(''); setAddingManual(false)
    setSelectedId(loc.id)
  }

  const visible = locations
    .filter(l => statusFilter === 'all' || l.status === statusFilter)
    .filter(l => typeFilter === 'all' || l.type === typeFilter)
    .filter(l => !search || (l.displayName || l.name).toLowerCase().includes(search.toLowerCase()))

  // Pre-compute scene counts per location to avoid O(n²) filtering per card
  const sceneCountByLoc = useMemo(() => {
    const map = {}
    for (const loc of locations) {
      map[loc.id] = scenesForLocation(allScenes, loc).length
    }
    return map
  }, [locations, allScenes])

  // Pre-compute shooting days per location: loc → scenes → sceneKeys → assigned dayIds → unique days
  const shootingDaysByLoc = useMemo(() => {
    const map = {}
    const dayMap = Object.fromEntries(shootingDays.map(d => [d.id, d]))
    for (const loc of locations) {
      const locScenes = scenesForLocation(allScenes, loc)
      const dayIds = new Set()
      for (const sc of locScenes) {
        const epId = sc.episode || ''
        const scNum = sc.sceneNumber || sc.id
        const key = `${epId}-${scNum}`
        const dayId = sceneAssignments[key]
        if (dayId && dayMap[dayId]) dayIds.add(dayId)
      }
      map[loc.id] = [...dayIds].map(id => dayMap[id]).filter(Boolean)
    }
    return map
  }, [locations, allScenes, shootingDays, sceneAssignments])

  // Stats
  const confirmed = locations.filter(l => l.status === 'confirmado').length
  const recused   = locations.filter(l => l.status === 'recusado').length

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Locais</h2>
          <p className={styles.sub}>{projectName} · {locations.length} locais</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          {[{ v: confirmed, l: 'confirmados', c: 'var(--health-green)' }, { v: recused, l: 'recusados', c: '#F87171' }]
            .filter(s => s.v > 0)
            .map(s => (
              <span key={s.l} style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: s.c }}>{s.v} {s.l}</span>
            ))
          }
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input className={styles.searchInput} placeholder="Pesquisar…" value={search} onChange={e => setSearch(e.target.value)} />
          {unimported.length > 0 && (
            <button className={styles.btnImport} onClick={importFromScripts}
              title={`${unimported.length} locais únicos (${parsedLocations.length} entradas de guião, duplicados fundidos)`}>
              <Film size={14} /> Importar ({unimported.length})
            </button>
          )}
          <button className={styles.btnAdd} onClick={() => setAddingManual(v => !v)}>
            <Plus size={14} /> Adicionar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filterBar}>
        {/* Status */}
        <button className={`${styles.filterPill} ${statusFilter === 'all' ? styles.filterPillActive : ''}`}
          onClick={() => setStatusFilter('all')}>Todos</button>
        {STATUSES.map(s => {
          const n = locations.filter(l => l.status === s.id).length
          if (n === 0) return null
          return (
            <button key={s.id}
              className={`${styles.filterPill} ${statusFilter === s.id ? styles.filterPillActive : ''}`}
              style={{ '--fc': s.color }}
              onClick={() => setStatusFilter(statusFilter === s.id ? 'all' : s.id)}>
              {s.label} <span className={styles.filterCount}>{n}</span>
            </button>
          )
        })}
        <div className={styles.filterDivider} />
        {['all', 'INT', 'EXT', 'INT/EXT'].map(t => (
          <button key={t}
            className={`${styles.filterPill} ${typeFilter === t ? styles.filterPillActive : ''}`}
            onClick={() => setTypeFilter(t)}>
            {t === 'all' ? 'Todos tipos' : t}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Form de adicionar manual */}
        <AnimatePresence>
          {addingManual && (
            <motion.div className={styles.addForm}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <input className={styles.input} value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Nome do local (ex: INT. CAFÉ DO BAIRRO - DIA)" autoFocus
                onKeyDown={e => e.key === 'Enter' && addManual()} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={styles.btnCancel} onClick={() => setAddingManual(false)}>Cancelar</button>
                <button className={styles.btnConfirm} onClick={addManual} disabled={!newName.trim()}>
                  <Plus size={14} /> Adicionar local
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {locations.length === 0 && (
          <div className={styles.empty}>
            <MapPin size={36} color="var(--text-muted)" />
            <p>Nenhum local ainda</p>
            {unimported.length > 0 && (
              <button className={styles.btnImport} onClick={importFromScripts}>
                <Film size={14} /> Importar {unimported.length} locais{parsedLocations.length !== unimported.length ? ` (${parsedLocations.length - unimported.length} duplicados removidos)` : ''}
              </button>
            )}
            <button className={styles.btnAdd} onClick={() => setAddingManual(true)}>
              <Plus size={14} /> Adicionar manualmente
            </button>
          </div>
        )}

        {/* Grid */}
        {visible.length === 0 && locations.length > 0 && (
          <div className={styles.empty}><p>Nenhum local com estes filtros</p></div>
        )}

        {/* Agrupar por status */}
        {statusFilter === 'all'
          ? STATUSES.map(s => {
              const group = visible.filter(l => l.status === s.id)
              if (group.length === 0) return null
              return (
                <div key={s.id} className={styles.statusGroup}>
                  <div className={styles.statusGroupHeader} style={{ color: s.color }}>
                    <span className={styles.statusGroupDot} style={{ background: s.color }} />
                    {s.label}
                    <span className={styles.statusGroupCount}>{group.length}</span>
                  </div>
                  <div className={styles.cardGrid}>
                    {group.map(loc => (
                      <LocationCard key={loc.id} loc={loc} sceneCount={sceneCountByLoc[loc.id] || 0} shootingDayCount={(shootingDaysByLoc[loc.id] || []).length} onClick={() => setSelectedId(loc.id)} />
                    ))}
                  </div>
                </div>
              )
            })
          : (
            <div className={styles.cardGrid}>
              {visible.map(loc => (
                <LocationCard key={loc.id} loc={loc} sceneCount={sceneCountByLoc[loc.id] || 0} shootingDayCount={(shootingDaysByLoc[loc.id] || []).length} onClick={() => setSelectedId(loc.id)} />
              ))}
            </div>
          )
        }
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selectedLoc && (
          <LocationDrawer
            loc={selectedLoc}
            allScenes={allScenes}
            shootingDaysForLoc={shootingDaysByLoc[selectedLoc.id] || []}
            onClose={() => setSelectedId(null)}
            onUpdate={updateLocation}
            onDelete={removeLocation}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
