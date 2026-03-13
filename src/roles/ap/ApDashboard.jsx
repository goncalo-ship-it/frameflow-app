// Dashboard do Assistente de Produção — tarefas, equipa, logística, contactos
import { motion } from 'framer-motion'
import { CheckSquare, Clock, Phone, MapPin, AlertTriangle, Users } from 'lucide-react'
import { Badge } from '../../components/ui/Badge.jsx'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { getTodayDay, getNextDay, getScenesForDay, formatDate } from '../../utils/dashboardHelpers.js'
import styles from './ApDashboard.module.css'

const PRIORITY_ORDER = { high: 0, urgente: 0, medium: 1, normal: 1, low: 2 }

// ── Component ─────────────────────────────────────────────────────────────────

export function ApDashboard() {
  const { 
    preProduction,
    team,
    locations,
    shootingDays,
    sceneAssignments,
    parsedScripts,
    navigate,
   } = useStore(useShallow(s => ({ preProduction: s.preProduction, team: s.team, locations: s.locations, shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments, parsedScripts: s.parsedScripts, navigate: s.navigate })))

  const tasks = preProduction?.tasks || []

  // Sort: undone first, then by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const pa = PRIORITY_ORDER[a.priority] ?? 1
    const pb = PRIORITY_ORDER[b.priority] ?? 1
    return pa - pb
  })

  const doneCount    = tasks.filter(t => t.done).length
  const pendingCount = tasks.length - doneCount

  // Team members missing contact info
  const incompleteMembers = team.filter(m => !m.phone && !m.email)

  // Locations with pending status
  const pendingLocations = locations.filter(l =>
    l.status === 'por identificar' ||
    l.status === 'autorização pendente' ||
    l.status === 'pendente'
  )

  // Today / next shooting info
  const todayDay = getTodayDay(shootingDays)
  const nextDay  = !todayDay ? getNextDay(shootingDays) : null
  const activeDay = todayDay || nextDay
  const activeDayScenes = activeDay
    ? getScenesForDay(activeDay.id, sceneAssignments, parsedScripts)
    : []

  // Quick contacts: Elenco first, then anyone with a phone, top 5
  const quickContacts = [
    ...team.filter(m => m.group === 'Elenco' && m.phone),
    ...team.filter(m => m.group !== 'Elenco' && m.phone),
  ].slice(0, 5)

  const today = new Date().toISOString().slice(0, 10)
  const todayFormatted = formatDate(today)

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Assistente de Produção</h1>
          <p className={styles.sub}>{todayFormatted}</p>
        </div>
        <Badge variant={pendingCount > 3 ? 'danger' : pendingCount > 0 ? 'warn' : 'ok'} size="sm">
          {pendingCount > 0 ? `${pendingCount} tarefas por fazer` : 'Tarefas em dia'}
        </Badge>
      </div>

      <div className={styles.zones}>
        {/* ── Zone 1: Tarefas pendentes ── */}
        <div className={styles.zone}>
          <p className={styles.zoneLabel}>
            Tarefas pendentes — {doneCount} de {tasks.length} concluídas
          </p>

          {tasks.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Sem tarefas pendentes — ir a Pré-Produção para gerir
            </p>
          )}

          {sortedTasks.map((t, i) => {
            const isUrgent = !t.done && (t.priority === 'high' || t.priority === 'urgente')
            return (
              <motion.div
                key={t.id || i}
                className={`${styles.task} ${t.done ? styles.taskDone : ''} ${isUrgent ? styles.taskUrgent : ''}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                title="Gerir em Pré-Produção"
                style={{ cursor: 'default' }}
              >
                <div className={`${styles.taskCheck} ${t.done ? styles.checked : ''}`}>
                  {t.done && <CheckSquare size={16} color="var(--health-green)" />}
                </div>
                <span className={styles.taskText}>{t.text}</span>
                {isUrgent && <Badge variant="danger" size="sm">urgente</Badge>}
              </motion.div>
            )
          })}
        </div>

        {/* ── Zone 2: Equipa + Logística ── */}
        <div className={styles.zone}>
          {/* Today's shooting day info */}
          {activeDay && (
            <>
              <p className={styles.zoneLabel}>
                {todayDay ? 'Rodagem hoje' : 'Próxima rodagem'}
              </p>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {activeDay.label || formatDate(activeDay.date)}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                  {activeDayScenes.length} cenas planeadas
                  {activeDay.callTime ? ` · Call: ${activeDay.callTime}` : ''}
                </p>
              </div>
            </>
          )}

          {/* Incomplete team members warning */}
          {incompleteMembers.length > 0 && (
            <>
              <p className={styles.zoneLabel}>Contactos incompletos</p>
              {incompleteMembers.slice(0, 4).map((m, i) => (
                <div key={m.id || i} className={styles.logRow}>
                  <div className={`${styles.logDot} ${styles.dotWarn}`} />
                  <div>
                    <p className={styles.logItem}>{m.name}</p>
                    <p className={styles.logDetail}>{m.role || 'Sem função'} — sem telefone nem email</p>
                  </div>
                </div>
              ))}
              {incompleteMembers.length > 4 && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                  +{incompleteMembers.length - 4} membros com contacto incompleto
                </p>
              )}
            </>
          )}

          {/* Pending locations */}
          {pendingLocations.length > 0 && (
            <>
              <p className={styles.zoneLabel} style={{ marginTop: 'var(--space-5)' }}>
                Locais pendentes
              </p>
              {pendingLocations.map((loc, i) => (
                <div key={loc.id || i} className={styles.logRow}>
                  <div className={`${styles.logDot} ${styles.dotWarn}`} />
                  <div>
                    <p className={styles.logItem}>{loc.name || loc.displayName || 'Local sem nome'}</p>
                    <p className={styles.logDetail}>
                      {loc.status || 'estado desconhecido'}
                      {loc.address ? ` · ${loc.address}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Quick contacts */}
          {quickContacts.length > 0 && (
            <>
              <p className={styles.zoneLabel} style={{ marginTop: 'var(--space-5)' }}>
                Contactos rápidos
              </p>
              {quickContacts.map((m, i) => (
                <div key={m.id || i} className={styles.contact}>
                  <div>
                    <p className={styles.contactName}>{m.name}</p>
                    <p className={styles.contactRole}>{m.role || m.group || '—'}</p>
                  </div>
                  <a href={`tel:${m.phone}`} className={styles.contactPhone}>
                    <Phone size={12} /> {m.phone}
                  </a>
                </div>
              ))}
            </>
          )}

          {/* Empty state for zone 2 */}
          {team.length === 0 && locations.length === 0 && !activeDay && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Adicionar equipa e locais para ver alertas de logística
            </p>
          )}

          {/* Team summary */}
          {team.length > 0 && (
            <div style={{ marginTop: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Users size={13} color="var(--text-muted)" />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {team.length} membro{team.length > 1 ? 's' : ''} na equipa
                {incompleteMembers.length > 0
                  ? ` · ${incompleteMembers.length} com contacto incompleto`
                  : ' · todos com contacto'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
