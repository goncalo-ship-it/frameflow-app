// Dashboard do Director de Fotografia — exteriores, distribuição, equipa
import { motion } from 'framer-motion'
import { Sun, MapPin, Camera, Users, Phone } from 'lucide-react'
import { Badge } from '../../components/ui/Badge.jsx'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { getTodayDay, getScenesForDay, formatDate } from '../../utils/dashboardHelpers.js'
import styles from './DopDashboard.module.css'

function getUpcomingDays(shootingDays) {
  const today = new Date().toISOString().slice(0, 10)
  return shootingDays.filter(d => d.date >= today)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DopDashboard() {
  const {  shootingDays, sceneAssignments, parsedScripts, team  } = useStore(useShallow(s => ({ shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments, parsedScripts: s.parsedScripts, team: s.team })))

  const todayDay = getTodayDay(shootingDays)
  const upcomingDays = getUpcomingDays(shootingDays)

  // Get today's scenes, or all upcoming scenes if no shooting today
  let primaryScenes = []
  let primaryLabel = ''
  if (todayDay) {
    primaryScenes = getScenesForDay(todayDay.id, sceneAssignments, parsedScripts)
    primaryLabel = 'hoje'
  } else if (upcomingDays.length > 0) {
    primaryScenes = getScenesForDay(upcomingDays[0].id, sceneAssignments, parsedScripts)
    primaryLabel = formatDate(upcomingDays[0].date)
  }

  const extScenes = primaryScenes.filter(s => s.intExt === 'EXT')
  const intScenes = primaryScenes.filter(s => s.intExt === 'INT')

  // All EXT scenes in the whole project
  const allEpisodes = Object.keys(parsedScripts)
  const allExtScenes = allEpisodes.flatMap(epId =>
    (parsedScripts[epId]?.scenes || []).filter(s => s.intExt === 'EXT')
  )

  // Unique locations from all parsed scenes
  const allSceneLocations = [...new Set(
    allEpisodes.flatMap(epId =>
      (parsedScripts[epId]?.scenes || []).map(s => s.location).filter(Boolean)
    )
  )].sort()

  // DOP / Camera team members
  const dopTeam = team.filter(m => {
    const r = (m.role || '').toLowerCase()
    return r.includes('dop') || r.includes('câmera') || r.includes('camera') ||
           r.includes('fotografia') || r.includes('foco') || r.includes('steadicam')
  })

  const today = new Date().toISOString().slice(0, 10)
  const todayFormatted = formatDate(today)

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Director de Fotografia</h1>
          <p className={styles.sub}>{todayFormatted}</p>
        </div>
        {extScenes.length > 0
          ? <Badge variant="warn" size="sm">{extScenes.length} EXT hoje</Badge>
          : <Badge variant="default" size="sm">Sem exteriores</Badge>
        }
      </div>

      <div className={styles.zones}>
        {/* ── Zone 1: Exteriores e golden hour ── */}
        <div className={styles.zone}>
          <p className={styles.zoneLabel}>
            Exteriores {primaryLabel ? `— ${primaryLabel}` : ''}
          </p>

          {primaryScenes.length === 0 && shootingDays.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Nenhum dia de rodagem planeado ainda
            </p>
          )}

          {primaryScenes.length > 0 && extScenes.length === 0 && (
            <div className={styles.goldenCard}>
              <p className={styles.goldenNote}>
                Sem exteriores {primaryLabel} — dia todo em interiores
              </p>
            </div>
          )}

          {extScenes.map((sc, i) => (
            <motion.div
              key={sc.sceneKey}
              className={`${styles.goldenCard} ${styles.critical}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className={styles.goldenTop}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sun size={14} color="#E8A838" />
                  <span className={styles.goldenId}>{sc.epId}-{sc.sceneNumber}</span>
                  <Badge variant="warn" size="sm">EXT</Badge>
                </div>
              </div>
              <p className={styles.goldenTime}>
                <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
                {sc.location || 'Local não definido'}
              </p>
              {sc.characters && sc.characters.length > 0 && (
                <p className={styles.goldenNote}>
                  {sc.characters.join(', ')}
                </p>
              )}
              {sc.description && (
                <p className={styles.goldenNote}>
                  {sc.description.slice(0, 80)}{sc.description.length > 80 ? '…' : ''}
                </p>
              )}
            </motion.div>
          ))}

          {extScenes.length > 0 && (
            <div className={styles.goldenCard} style={{ marginTop: 'var(--space-3)', background: 'rgba(232,168,56,0.05)', borderColor: 'rgba(232,168,56,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sun size={12} color="#E8A838" />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#E8A838' }}>
                  Golden Hour
                </span>
              </div>
              <p className={styles.goldenNote}>
                Verificar golden hour para cenas EXT — luz natural
              </p>
            </div>
          )}

          {/* INT scenes summary */}
          {intScenes.length > 0 && (
            <>
              <p className={styles.zoneLabel} style={{ marginTop: 'var(--space-5)' }}>
                Interiores — {intScenes.length} cenas
              </p>
              {intScenes.map((sc, i) => (
                <div key={sc.sceneKey} className={styles.lightRow}>
                  <span className={styles.lightScene}>{sc.epId}-{sc.sceneNumber}</span>
                  <div>
                    <p className={styles.lightSetup}>INT · {sc.location || '—'}</p>
                    {sc.characters && sc.characters.length > 0 && (
                      <p className={styles.lightMood}>{sc.characters.join(', ')}</p>
                    )}
                    {sc.description && (
                      <p className={styles.lightKit}>
                        {sc.description.slice(0, 60)}{sc.description.length > 60 ? '…' : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Zone 2: Distribuição e locais ── */}
        <div className={styles.zone}>
          <p className={styles.zoneLabel}>Distribuição de cenas</p>

          {/* INT/EXT counts for today */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', textAlign: 'center' }}>
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {intScenes.length}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>INT</p>
            </div>
            <div style={{ flex: 1, background: 'rgba(232,168,56,0.05)', border: '1px solid rgba(232,168,56,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', textAlign: 'center' }}>
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#E8A838' }}>
                {extScenes.length}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>EXT</p>
            </div>
          </div>

          {/* Total EXT in project */}
          <div className={styles.equipRow}>
            <div className={`${styles.equipDot} ${allExtScenes.length > 0 ? styles.dotWarn : styles.dotOk}`} />
            <div>
              <p className={styles.equipName}>{allExtScenes.length} exteriores no projecto</p>
              <p className={styles.equipNote}>
                {allSceneLocations.length} locais únicos no guião
              </p>
            </div>
          </div>

          {/* Unique locations from scripts */}
          {allSceneLocations.length > 0 && (
            <>
              <p className={styles.zoneLabel} style={{ marginTop: 'var(--space-5)' }}>
                Locais no guião
              </p>
              {allSceneLocations.slice(0, 10).map((loc, i) => (
                <div key={i} className={styles.equipRow}>
                  <MapPin size={11} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p className={styles.equipName} style={{ fontSize: 'var(--text-xs)' }}>{loc}</p>
                </div>
              ))}
              {allSceneLocations.length > 10 && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                  +{allSceneLocations.length - 10} locais adicionais
                </p>
              )}
            </>
          )}

          {/* DOP/Camera team */}
          {dopTeam.length > 0 && (
            <>
              <p className={styles.zoneLabel} style={{ marginTop: 'var(--space-5)' }}>
                Equipa de câmera
              </p>
              {dopTeam.map(m => (
                <div key={m.id} className={styles.equipRow}>
                  <Camera size={12} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className={styles.equipName}>{m.name}</p>
                    <p className={styles.equipNote}>{m.role}</p>
                    {m.phone && (
                      <a href={`tel:${m.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--mod-script)', textDecoration: 'none', marginTop: 2 }}>
                        <Phone size={10} /> {m.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {allSceneLocations.length === 0 && dopTeam.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}>
              Importar guiões para ver dados de locais e equipa
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
