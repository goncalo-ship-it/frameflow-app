// Dashboard do Actor — as minhas cenas, resumo do papel, call time
import { motion } from 'framer-motion'
import { Clock, MapPin, BookOpen, Film, Calendar } from 'lucide-react'
import { Badge } from '../../components/ui/Badge.jsx'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { getTodayDay, getNextDay, getScenesForDay, formatDate } from '../../utils/dashboardHelpers.js'
import styles from './ActorDashboard.module.css'

function isPastDay(dayDate) {
  const today = new Date().toISOString().slice(0, 10)
  return dayDate < today
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActorDashboard() {
  const {  auth, team, parsedCharacters, shootingDays, sceneAssignments, parsedScripts  } = useStore(useShallow(s => ({ auth: s.auth, team: s.team, parsedCharacters: s.parsedCharacters, shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments, parsedScripts: s.parsedScripts })))

  // Find actor's team member entry
  const teamMember = team.find(m =>
    m.name === auth.user ||
    (auth.user && m.name?.toLowerCase().includes(auth.user.toLowerCase().split(' ')[0]))
  )
  const characterName = teamMember?.characterName || auth.user || 'Actor'
  const charFirstWord = (characterName || '').toLowerCase().split(' ')[0]

  // Find character data from parsed scripts
  const charData = parsedCharacters.find(c =>
    c.name?.toLowerCase() === characterName?.toLowerCase() ||
    (charFirstWord && c.name?.toLowerCase().includes(charFirstWord))
  )

  // Today's shooting day
  const todayDay = getTodayDay(shootingDays)
  const nextDay  = getNextDay(shootingDays)

  // Today's scenes for this character
  const todayScenes = todayDay
    ? getScenesForDay(todayDay.id, sceneAssignments, parsedScripts)
        .filter(sc =>
          (sc.characters || []).some(ch =>
            charFirstWord && ch.toLowerCase().includes(charFirstWord)
          )
        )
    : []

  // All scenes for this character across the whole project (from parsedCharacters)
  const totalCharScenes = charData?.scenes?.length || 0

  // Scenes already shot (past days that had this character)
  const shotScenes = shootingDays
    .filter(d => isPastDay(d.date))
    .flatMap(d => getScenesForDay(d.id, sceneAssignments, parsedScripts))
    .filter(sc =>
      (sc.characters || []).some(ch =>
        charFirstWord && ch.toLowerCase().includes(charFirstWord)
      )
    )

  // Next scene day (first upcoming day with this character's scenes)
  let nextCharDay = null
  if (!todayDay || todayScenes.length === 0) {
    const today = new Date().toISOString().slice(0, 10)
    for (const d of [...shootingDays].sort((a, b) => a.date.localeCompare(b.date))) {
      if (d.date <= today) continue
      const dayScs = getScenesForDay(d.id, sceneAssignments, parsedScripts)
        .filter(sc =>
          (sc.characters || []).some(ch =>
            charFirstWord && ch.toLowerCase().includes(charFirstWord)
          )
        )
      if (dayScs.length > 0) {
        nextCharDay = { day: d, scenes: dayScs }
        break
      }
    }
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{characterName}</h1>
          <p className={styles.sub}>
            {auth.user ? auth.user : 'Actor'} · {todayDay ? formatDate(todayDay.date) : 'Hoje'}
          </p>
        </div>
        {todayDay?.callTime && (
          <div className={styles.callTime}>
            <Clock size={14} color="var(--mod-production)" />
            <span>Call time</span>
            <strong>{todayDay.callTime}</strong>
          </div>
        )}
      </div>

      <div className={styles.zones}>
        {/* ── Zone 1: As minhas cenas hoje ── */}
        <div className={styles.zone}>
          <p className={styles.zoneLabel}>As minhas cenas hoje</p>

          {!todayDay && shootingDays.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Nenhum dia de rodagem planeado ainda
            </p>
          )}

          {!todayDay && shootingDays.length > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Sem rodagem hoje
            </p>
          )}

          {todayDay && todayScenes.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Sem cenas de {characterName} hoje
            </p>
          )}

          {todayScenes.map((sc, i) => {
            const coStars = (sc.characters || []).filter(ch =>
              !ch.toLowerCase().includes(charFirstWord)
            )
            return (
              <motion.div
                key={sc.sceneKey}
                className={styles.sceneCard}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={styles.sceneTop}>
                  <span className={styles.sceneId}>{sc.epId}-{sc.sceneNumber}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Badge variant={sc.intExt === 'EXT' ? 'info' : 'default'} size="sm">
                      {sc.intExt || '—'}
                    </Badge>
                  </div>
                </div>
                <p className={styles.sceneLocation}>
                  <MapPin size={11} /> {sc.location || 'Local não definido'}
                </p>
                {coStars.length > 0 && (
                  <p className={styles.sceneWith}>
                    Com: {coStars.join(', ')}
                  </p>
                )}
                {sc.description && (
                  <p className={styles.sceneNote}>
                    {sc.description.slice(0, 100)}{sc.description.length > 100 ? '…' : ''}
                  </p>
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

        {/* ── Zone 2: Resumo do papel ── */}
        <div className={styles.zone}>
          <p className={styles.zoneLabel}>Resumo do papel</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Film size={16} color="var(--mod-script)" />
              <div>
                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {totalCharScenes}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>cenas no total</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <BookOpen size={16} color="var(--mod-script)" />
              <div>
                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {charData?.lineCount || 0}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>falas no guião</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Calendar size={16} color="var(--health-green)" />
              <div>
                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {shotScenes.length}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  cenas já rodadas
                  {totalCharScenes > 0 ? ` de ${totalCharScenes}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Next scene day */}
          {nextCharDay && (
            <>
              <p className={styles.zoneLabel}>Próxima rodagem</p>
              <div className={styles.nextCard}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDate(nextCharDay.day.date)}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                  {nextCharDay.day.label || 'Dia de rodagem'} · {nextCharDay.scenes.length} cena{nextCharDay.scenes.length > 1 ? 's' : ''}
                </p>
                {nextCharDay.day.callTime && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--mod-production)', marginTop: 4, fontWeight: 600 }}>
                    Call: {nextCharDay.day.callTime}
                  </p>
                )}
              </div>
            </>
          )}

          {/* No character data found */}
          {!charData && parsedCharacters.length > 0 && (
            <div className={styles.reminder} style={{ marginTop: 'var(--space-3)' }}>
              <BookOpen size={12} color="var(--mod-script)" />
              <span>
                Personagem "{characterName}" não encontrado no guião — verificar nome de personagem no perfil de equipa
              </span>
            </div>
          )}

          {parsedCharacters.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}>
              Importar guião para ver dados do papel
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
