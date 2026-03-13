// Board de tarefas — filtros, assignees, status
import { useState, useMemo } from 'react'
import { User, Filter, CheckSquare, Clock, Circle } from 'lucide-react'
import { Badge } from '../../components/ui/Badge.jsx'
import styles from './TaskBoard.module.css'

const TEAM = [
  { id: 'producer',  label: 'Produtor',     color: '#BF6A2E' },
  { id: 'director',  label: 'Realizador',   color: '#7B4FBF' },
  { id: 'dop',       label: 'DOP',          color: '#2E6FA0' },
  { id: 'ap',        label: 'AP',           color: '#2EA080' },
  { id: 'art',       label: 'Director Arte',color: '#A02E6F' },
]

const STATUS_ICON = {
  'feito':    <CheckSquare size={14} color="var(--health-green)" />,
  'em curso': <Clock size={14} color="var(--health-yellow)" />,
  'a fazer':  <Circle size={14} color="var(--border-default)" />,
}
const STATUS_BADGE = { 'feito': 'ok', 'em curso': 'warn', 'a fazer': 'default' }

const PHASE_LABELS = {
  casting: 'Casting', locais: 'Locais', equipa: 'Equipa',
  técnico: 'Técnico', recce: 'Recce', arte: 'Arte',
  ensaio: 'Ensaios', prep: 'Prep Final', desen: 'Desenvolvimento',
}

export function TaskBoard({ tasks: initialTasks }) {
  // Assignees guardados em memória local (não persiste — bastará o store depois)
  const [assignees, setAssignees] = useState({})
  const [filterPhase,  setFilterPhase]  = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTeam,   setFilterTeam]   = useState('all')

  const phases  = [...new Set(initialTasks.map(t => t.phase))]
  const statuses = ['a fazer', 'em curso', 'feito']

  const tasks = useMemo(() => {
    return initialTasks.filter(t => {
      if (filterPhase  !== 'all' && t.phase  !== filterPhase)  return false
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (filterTeam   !== 'all' && assignees[t.id] !== filterTeam) return false
      return true
    }).sort((a, b) => a.deadline - b.deadline)
  }, [initialTasks, filterPhase, filterStatus, filterTeam, assignees])

  const assign = (taskId, memberId) => {
    setAssignees(prev => ({ ...prev, [taskId]: memberId === prev[taskId] ? null : memberId }))
  }

  const done    = initialTasks.filter(t => t.status === 'feito').length
  const inprog  = initialTasks.filter(t => t.status === 'em curso').length
  const todo    = initialTasks.filter(t => t.status === 'a fazer').length

  return (
    <div className={styles.wrapper}>
      {/* Sumário */}
      <div className={styles.summary}>
        <Kpi label="Feito"    value={done}   color="var(--health-green)" />
        <Kpi label="Em curso" value={inprog}  color="var(--health-yellow)" />
        <Kpi label="Por fazer" value={todo}  color="var(--text-muted)" />
        <Kpi label="Total"    value={initialTasks.length} color="var(--text-secondary)" />
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <Filter size={13} color="var(--text-muted)" />

        <select className={styles.select} value={filterPhase} onChange={e => setFilterPhase(e.target.value)}>
          <option value="all">Todas as fases</option>
          {phases.map(p => <option key={p} value={p}>{PHASE_LABELS[p] || p}</option>)}
        </select>

        <select className={styles.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Todos os estados</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className={styles.select} value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
          <option value="all">Toda a equipa</option>
          {TEAM.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div className={styles.list}>
        {tasks.map(task => {
          const assigned = TEAM.find(m => m.id === assignees[task.id])
          return (
            <div key={task.id} className={`${styles.task} ${task.status === 'feito' ? styles.taskDone : ''}`}>
              <div className={styles.taskLeft}>
                {STATUS_ICON[task.status] || STATUS_ICON['a fazer']}
              </div>

              <div className={styles.taskBody}>
                <div className={styles.taskTop}>
                  <span className={styles.taskTitle}>{task.title}</span>
                  <div className={styles.taskMeta}>
                    <Badge variant={STATUS_BADGE[task.status] || 'default'} size="sm">{task.status}</Badge>
                    {task.priority === 'alta' && <Badge variant="danger" size="sm">prioritário</Badge>}
                    <span className={styles.taskDeadline}>D{task.deadline}</span>
                    <span className={styles.taskPhase}>{PHASE_LABELS[task.phase] || task.phase}</span>
                  </div>
                </div>

                {task.notes && (
                  <p className={styles.taskNotes}>{task.notes}</p>
                )}

                {/* Assignees */}
                <div className={styles.assignees}>
                  {TEAM.map(member => (
                    <button
                      key={member.id}
                      className={`${styles.assigneeBtn} ${assignees[task.id] === member.id ? styles.assigneeActive : ''}`}
                      style={{ '--member-color': member.color }}
                      onClick={() => assign(task.id, member.id)}
                      title={member.label}
                    >
                      {member.label.slice(0, 2).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
        {tasks.length === 0 && (
          <div className={styles.empty}>Nenhuma tarefa com estes filtros</div>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, color }) {
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiValue} style={{ color }}>{value}</span>
      <span className={styles.kpiLabel}>{label}</span>
    </div>
  )
}
