// ActorView — grelha actores × dias
// Verde = presente, Cinza = não necessário, Vermelho = tem cenas mas indisponível

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { useStore } from '../../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import styles from '../Schedule.module.css'

function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'numeric' })
  } catch { return dateStr }
}

export function ActorView({ engineResult, onSceneClick }) {
  const {  team  } = useStore(useShallow(s => ({ team: s.team })))
  const { days = [] } = engineResult || {}

  // Apenas membros do Elenco
  const actors = useMemo(
    () => team.filter(m => m.group === 'Elenco'),
    [team]
  )

  // Mapa: actorId → dias em que o actor tem cenas
  const actorDayMap = useMemo(() => {
    const map = {}
    actors.forEach(actor => {
      map[actor.id] = {}
      days.forEach(day => {
        const hasScenes = (day.scenes || []).some(sc =>
          (sc.characters || []).includes(actor.characterName || actor.name)
        )
        const isUnavailable = (actor.availability?.unavailable || []).includes(day.date)
          || (actor.availability?.dates?.length > 0
              && !actor.availability.dates.includes(day.date))

        if (hasScenes && isUnavailable) {
          map[actor.id][day.id] = 'conflict'
        } else if (hasScenes) {
          map[actor.id][day.id] = 'present'
        } else {
          map[actor.id][day.id] = 'absent'
        }
      })
    })
    return map
  }, [actors, days])

  // Contagens por actor
  const actorStats = useMemo(() => {
    const stats = {}
    actors.forEach(actor => {
      const dayStatus = actorDayMap[actor.id] || {}
      stats[actor.id] = {
        present:  Object.values(dayStatus).filter(v => v === 'present').length,
        conflicts: Object.values(dayStatus).filter(v => v === 'conflict').length,
      }
    })
    return stats
  }, [actors, actorDayMap])

  if (actors.length === 0) {
    return (
      <div className={styles.calEmpty}>
        <Users size={36} color="var(--text-muted)" style={{ opacity: 0.4 }} />
        <p>Nenhum actor adicionado à equipa</p>
        <p style={{ fontSize: 'var(--text-xs)' }}>
          Adiciona actores com o grupo "Elenco" no módulo Equipa
        </p>
      </div>
    )
  }

  if (days.length === 0) {
    return (
      <div className={styles.calEmpty}>
        <Users size={36} color="var(--text-muted)" style={{ opacity: 0.4 }} />
        <p>Nenhum dia de rodagem criado</p>
      </div>
    )
  }

  const cellStatus = {
    present:  { bg: 'var(--health-green)', title: 'Presente' },
    absent:   { bg: 'var(--bg-elevated)',  title: 'Não necessário' },
    conflict: { bg: 'var(--health-red)',   title: 'Tem cenas mas marcado indisponível' },
  }

  return (
    <div className={styles.actorRoot}>
      <div className={styles.actorGrid}>
        {/* Cabeçalho: dias */}
        <div className={styles.actorHeaderRow}>
          <div className={styles.actorNameCol}>Elenco</div>
          <div className={styles.actorDaysHeader}>
            {days.map((day, idx) => (
              <div key={day.id} className={styles.actorDayHeader}>
                <span className={styles.actorDayNum}>D{day.dayNumber || idx + 1}</span>
                <span className={styles.actorDayDate}>{formatDateShort(day.date)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Linhas por actor */}
        {actors.map((actor, aIdx) => {
          const stat = actorStats[actor.id] || {}
          const dayStatus = actorDayMap[actor.id] || {}
          return (
            <motion.div
              key={actor.id}
              className={styles.actorRow}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: aIdx * 0.03 }}
            >
              <div className={styles.actorNameCol}>
                <div className={styles.actorNameBlock}>
                  <span className={styles.actorCharName}>{actor.characterName || '—'}</span>
                  <span className={styles.actorRealName}>{actor.name}</span>
                </div>
                <div className={styles.actorStatBlock}>
                  <span className={styles.actorStatPresent}>{stat.present}d</span>
                  {stat.conflicts > 0 && (
                    <span className={styles.actorStatConflict}>{stat.conflicts} conflito(s)</span>
                  )}
                </div>
              </div>

              <div className={styles.actorDayCells}>
                {days.map(day => {
                  const status = dayStatus[day.id] || 'absent'
                  const cell = cellStatus[status] || cellStatus.absent
                  return (
                    <div
                      key={day.id}
                      className={styles.actorCell}
                      style={{ background: (cell.bg || 'transparent') + (status === 'absent' ? '' : '33') }}
                      title={cell.title}
                    >
                      {status !== 'absent' && (
                        <div
                          className={styles.actorCellDot}
                          style={{ background: cell.bg || 'transparent' }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Legenda */}
      <div className={styles.actorLegend}>
        <div className={styles.actorLegendItem}>
          <div className={styles.actorLegendDot} style={{ background: 'var(--health-green)' }} />
          <span>Presente (tem cenas)</span>
        </div>
        <div className={styles.actorLegendItem}>
          <div className={styles.actorLegendDot} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }} />
          <span>Não necessário</span>
        </div>
        <div className={styles.actorLegendItem}>
          <div className={styles.actorLegendDot} style={{ background: 'var(--health-red)' }} />
          <span>Conflito de disponibilidade</span>
        </div>
      </div>
    </div>
  )
}
