// Linha de tempo — milestones por fase, D-countdown
import { useMemo } from 'react'
import { MapPin, Users, Camera, Wrench, BookOpen, Star, Clapperboard } from 'lucide-react'
import styles from './Timeline.module.css'

const PHASE_META = {
  casting: { label: 'Casting',      icon: Users,       color: '#7B4FBF' },
  locais:  { label: 'Locais',       icon: MapPin,      color: '#2E6FA0' },
  equipa:  { label: 'Equipa',       icon: Users,       color: '#2EA080' },
  técnico: { label: 'Técnico',      icon: Camera,      color: '#BF6A2E' },
  recce:   { label: 'Recce',        icon: MapPin,      color: '#4F7F3F' },
  arte:    { label: 'Arte',         icon: Star,        color: '#A02E6F' },
  ensaio:  { label: 'Ensaios',      icon: BookOpen,    color: '#2E5FA0' },
  prep:    { label: 'Prep Final',   icon: Wrench,      color: '#6E6E78' },
  desen:   { label: 'Desenvolvimento', icon: BookOpen, color: '#6A4A72' },
}

const MILESTONES = [
  { d: -119, label: 'Hoje', today: true },
  { d: -42,  label: 'D-42 · Casting & Locais' },
  { d: -28,  label: 'D-28 · Equipa Técnica' },
  { d: -21,  label: 'D-21 · Recces' },
  { d: -14,  label: 'D-14 · Arte & Continuidade' },
  { d: -7,   label: 'D-7 · Ensaios' },
  { d: -3,   label: 'D-3 · Prep Final' },
  { d: 0,    label: '🎬 Rodagem', shoot: true },
]

export function Timeline({ tasks, shootDate }) {
  const byPhase = useMemo(() => {
    const map = {}
    tasks.forEach(t => {
      if (!map[t.phase]) map[t.phase] = []
      map[t.phase].push(t)
    })
    return map
  }, [tasks])

  const byDeadline = useMemo(() => {
    const map = {}
    tasks.forEach(t => {
      const key = t.deadline
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return map
  }, [tasks])

  return (
    <div className={styles.wrapper}>
      {/* Linha horizontal */}
      <div className={styles.timelineWrap}>
        <div className={styles.line} />
        {MILESTONES.map((m, i) => (
          <div
            key={i}
            className={`${styles.milestone} ${m.today ? styles.today : ''} ${m.shoot ? styles.shoot : ''}`}
            style={{ left: `${((m.d + 119) / 119) * 100}%` }}
          >
            <div className={styles.milestonePin} />
            <span className={styles.milestoneLabel}>{m.label}</span>
            {/* Tasks agrupadas neste deadline */}
            {byDeadline[m.d] && (
              <div className={styles.milestoneTasks}>
                {byDeadline[m.d].map(t => (
                  <div key={t.id} className={`${styles.taskPill} ${t.status === 'feito' ? styles.done : t.status === 'em curso' ? styles.inprogress : ''}`}>
                    {t.title.slice(0, 32)}{t.title.length > 32 ? '…' : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lanes por fase */}
      <div className={styles.lanes}>
        <p className={styles.lanesTitle}>Tarefas por fase</p>
        {Object.entries(byPhase).map(([phase, phaseTasks]) => {
          const meta = PHASE_META[phase] || { label: phase, color: '#6E6E78', icon: Star }
          const Icon = meta.icon
          const done = phaseTasks.filter(t => t.status === 'feito').length
          return (
            <div key={phase} className={styles.lane}>
              <div className={styles.laneHeader} style={{ borderLeftColor: meta.color }}>
                <Icon size={13} color={meta.color} />
                <span className={styles.laneLabel}>{meta.label}</span>
                <span className={styles.laneCount}>{done}/{phaseTasks.length}</span>
                <div className={styles.laneBar}>
                  <div
                    className={styles.laneBarFill}
                    style={{ width: `${(done / phaseTasks.length) * 100}%`, background: meta.color }}
                  />
                </div>
              </div>
              <div className={styles.laneTasks}>
                {phaseTasks.sort((a, b) => a.deadline - b.deadline).map(t => (
                  <div key={t.id} className={`${styles.laneTask} ${t.status === 'feito' ? styles.taskDone : t.status === 'em curso' ? styles.taskInProgress : ''}`}>
                    <span className={styles.laneTaskDeadline}>D{t.deadline}</span>
                    <span className={styles.laneTaskTitle}>{t.title}</span>
                    {t.priority === 'alta' && <span className={styles.highPriority}>!</span>}
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
