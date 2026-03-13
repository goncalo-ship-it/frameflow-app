// Dashboard do Realizador — cenas de hoje com dados reais do store
import { motion } from 'framer-motion'
import { MapPin, Star, AlertTriangle, Users, Film, Layers } from 'lucide-react'
import { Badge } from '../../components/ui/Badge.jsx'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { getTodayDay, getNextDay, getScenesForDay, classifyScene, SCENE_TYPE_COLORS as TYPE_COLOR, formatDate } from '../../utils/dashboardHelpers.js'
import styles from './DirectorDashboard.module.css'

// ── Component ─────────────────────────────────────────────────────────────────

export function DirectorDashboard() {
  const {  shootingDays, sceneAssignments, parsedScripts, parsedCharacters  } = useStore(useShallow(s => ({ shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments, parsedScripts: s.parsedScripts, parsedCharacters: s.parsedCharacters })))

  const todayDay  = getTodayDay(shootingDays)
  const nextDay   = !todayDay ? getNextDay(shootingDays) : null
  const todayScenes = todayDay
    ? getScenesForDay(todayDay.id, sceneAssignments, parsedScripts)
    : []

  // project stats
  const episodeIds = Object.keys(parsedScripts)
  const totalScenes = episodeIds.reduce((acc, epId) => acc + (parsedScripts[epId]?.scenes?.length || 0), 0)
  const assignedCount = Object.keys(sceneAssignments).length
  const topChars = [...parsedCharacters]
    .sort((a, b) => (b.scenes?.length || 0) - (a.scenes?.length || 0))
    .slice(0, 5)

  // scenes with 0 characters (need attention)
  const emptyCharScenes = episodeIds.flatMap(epId =>
    (parsedScripts[epId]?.scenes || [])
      .filter(s => !s.characters || s.characters.length === 0)
      .map(s => ({ ...s, epId }))
  )

  // date display
  const today = new Date().toISOString().slice(0, 10)
  const todayLabel = formatDate(today)
  const dayLabel = todayDay
    ? (todayDay.label || `Ep${todayDay.episodeNumber || '?'} · Dia ${todayDay.dayInEpisode || '?'}`)
    : 'Pré-Produção'

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Realizador</h1>
          <p className={styles.sub}>{todayLabel} · {dayLabel}</p>
        </div>
        {todayDay
          ? <Badge variant="ok" size="sm">Rodagem</Badge>
          : <Badge variant="warn" size="sm">Pré-Produção</Badge>
        }
      </div>

      <div className={styles.zones}>
        {/* ── Zone 1: Cenas de hoje ── */}
        <div className={styles.zone}>
          <p className={styles.zoneLabel}>
            {todayDay ? `Cenas de hoje — ${todayScenes.length} cenas` : 'Próxima rodagem'}
          </p>

          {/* No shooting days at all */}
          {shootingDays.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Nenhuma rodagem planeada — configurar em Produção
            </p>
          )}

          {/* Today exists but no scenes assigned */}
          {todayDay && todayScenes.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Nenhuma cena atribuída a hoje — verificar Strip Board
            </p>
          )}

          {/* No today, show next day info */}
          {!todayDay && nextDay && (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-3)',
            }}>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {formatDate(nextDay.date)}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                {nextDay.label || 'Dia de rodagem'} ·{' '}
                {getScenesForDay(nextDay.id, sceneAssignments, parsedScripts).length} cenas atribuídas
              </p>
              {nextDay.callTime && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Call time: <strong>{nextDay.callTime}</strong>
                </p>
              )}
            </div>
          )}

          {/* Scene cards */}
          <div className={styles.sceneList}>
            {todayScenes.map((sc, i) => {
              const type = classifyScene(sc)
              return (
                <motion.div
                  key={sc.sceneKey}
                  className={styles.sceneCard}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ borderLeftColor: TYPE_COLOR[type] || '#6E6E78' }}
                >
                  <div className={styles.sceneTop}>
                    <div className={styles.sceneId}>
                      {type === 'âncora' && <Star size={11} color="#E8A838" fill="#E8A838" />}
                      <span>{sc.epId}-{sc.sceneNumber}</span>
                      <Badge variant="default" size="sm">{type}</Badge>
                    </div>
                    <div className={styles.sceneMeta}>
                      <Badge variant={sc.intExt === 'EXT' ? 'info' : 'default'} size="sm">
                        {sc.intExt || '—'}
                      </Badge>
                    </div>
                  </div>
                  <p className={styles.sceneLocation}>
                    <MapPin size={11} /> {sc.location || 'Local não definido'}
                  </p>
                  {sc.description && (
                    <p className={styles.sceneNote}>{sc.description.slice(0, 100)}{sc.description.length > 100 ? '…' : ''}</p>
                  )}
                  {sc.characters && sc.characters.length > 0 && (
                    <div className={styles.sceneCast}>
                      {sc.characters.map(c => (
                        <span key={c} className={styles.castTag}>{c}</span>
                      ))}
                    </div>
                  )}
                  {sc.pageCount && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {sc.pageCount} pág.
                    </p>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ── Zone 2: Estado do projecto ── */}
        <div className={styles.zone}>
          <p className={styles.zoneLabel}>Estado do projecto</p>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
            <div className={styles.alert} style={{ border: 'none', padding: 'var(--space-2) 0', background: 'transparent' }}>
              <Film size={13} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{episodeIds.length}</strong> episódios analisados
              </span>
            </div>
            <div className={styles.alert} style={{ border: 'none', padding: 'var(--space-2) 0', background: 'transparent' }}>
              <Layers size={13} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{totalScenes}</strong> cenas no total
              </span>
            </div>
            <div className={styles.alert} style={{ border: 'none', padding: 'var(--space-2) 0', background: 'transparent' }}>
              <Users size={13} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{assignedCount}</strong> / {totalScenes} cenas atribuídas
              </span>
            </div>
          </div>

          {/* Top characters */}
          {topChars.length > 0 && (
            <>
              <p className={styles.zoneLabel} style={{ marginTop: 'var(--space-1)' }}>
                Personagens principais
              </p>
              {topChars.map((ch, i) => (
                <div key={ch.name || i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2) 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {ch.name}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {ch.scenes?.length || 0} cenas
                    {ch.lineCount ? ` · ${ch.lineCount} falas` : ''}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* Alert: scenes with no characters */}
          {emptyCharScenes.length > 0 && (
            <div style={{ marginTop: 'var(--space-5)' }}>
              <p className={styles.zoneLabel}>Atenção</p>
              <div className={styles.alert}>
                <AlertTriangle size={13} color="var(--status-warn)" />
                <span>
                  {emptyCharScenes.length} cena{emptyCharScenes.length > 1 ? 's' : ''} sem personagens
                  atribuídos — verificar guião
                </span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {episodeIds.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}>
              Nenhum guião analisado — importar em Análise de Guião
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
