// ProducerView — Vista 4: blocos compactos de progresso por dia
// Sem texto de guião — só estrutura, estado, custo estimado

import { useState, useMemo } from 'react'
import { AlertTriangle, Scissors } from 'lucide-react'
import styles from '../Script.module.css'

const STATUS_COLORS = {
  por_filmar: 'var(--text-muted)',
  filmada: 'var(--health-green)',
  pick_pendente: 'var(--health-yellow)',
  cortada: 'var(--health-red)',
  condicional: '#8B5CF6',
}

const FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'por_filmar', label: 'Por filmar' },
  { id: 'filmada', label: 'Filmadas' },
  { id: 'pick_pendente', label: 'Picks' },
  { id: 'cortada', label: 'Cortadas' },
]

export function ProducerView({ scriptData }) {
  const { allScenes, cenasPorDia, progresso, costurasActivas } = scriptData
  const [filter, setFilter] = useState('todas')

  // Agrupar por dia (incluindo "sem dia")
  const dayGroups = useMemo(() => {
    const groups = []

    // Dias com cenas
    Object.entries(cenasPorDia).forEach(([dayId, { day, scenes }]) => {
      const filtered = filter === 'todas' ? scenes : scenes.filter(s => s.estado === filter)
      if (filtered.length === 0 && filter !== 'todas') return

      const filmadas = scenes.filter(s => s.estado === 'filmada').length
      const totalMin = scenes.reduce((s, sc) => s + (sc.durationMin || sc.duration || 0), 0)
      const costurasCount = costurasActivas.filter(c =>
        c.dayId_antes === dayId || c.dayId_depois === dayId
      ).length

      groups.push({
        dayId,
        label: `DIA ${day.dayNumber}`,
        date: day.date,
        location: scenes[0]?.location || '—',
        scenes: filtered,
        allScenes: scenes,
        filmadas,
        total: scenes.length,
        pct: scenes.length > 0 ? Math.round((filmadas / scenes.length) * 100) : 0,
        totalMin,
        costuras: costurasCount,
        dayNumber: day.dayNumber || 0,
      })
    })

    // Cenas sem dia
    const semDia = allScenes.filter(s => !s.dia_rodagem_id)
    const semDiaFiltered = filter === 'todas' ? semDia : semDia.filter(s => s.estado === filter)
    if (semDiaFiltered.length > 0) {
      groups.push({
        dayId: '__none',
        label: 'SEM DIA',
        scenes: semDiaFiltered,
        allScenes: semDia,
        filmadas: 0,
        total: semDia.length,
        pct: 0,
        totalMin: semDia.reduce((s, sc) => s + (sc.durationMin || sc.duration || 0), 0),
        costuras: 0,
        dayNumber: 999,
      })
    }

    return groups.sort((a, b) => a.dayNumber - b.dayNumber)
  }, [cenasPorDia, allScenes, filter, costurasActivas])

  return (
    <div className={styles.prodRoot}>
      {/* Filters */}
      <div className={styles.prodFilters}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`${styles.prodFilterBtn} ${filter === f.id ? styles.prodFilterBtnActive : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id !== 'todas' && (
              <span style={{ marginLeft: 3 }}>
                ({allScenes.filter(s => s.estado === f.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Day cards */}
      {dayGroups.map(group => (
        <div key={group.dayId} className={styles.prodDayCard}>
          <div className={styles.prodDayHeader}>
            <div>
              <span className={styles.prodDayTitle}>
                {group.label}
                {group.location && group.dayId !== '__none' && (
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
                    · {group.location}
                  </span>
                )}
                {group.date && (
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: 10 }}>
                    {new Date(group.date + 'T00:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </span>
            </div>
            <span className={styles.prodDayMeta}>
              {group.total} cenas · {Math.round(group.totalMin / 60 * 10) / 10}h est.
              {group.costuras > 0 && (
                <span style={{ color: 'var(--health-red)', marginLeft: 6 }}>
                  <Scissors size={9} /> {group.costuras}
                </span>
              )}
            </span>
          </div>

          {/* Mini progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div className={styles.prodProgressMini}>
              <div className={styles.prodProgressMiniFill} style={{ width: `${group.pct}%` }} />
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {group.filmadas}/{group.total} · {group.pct}%
            </span>
          </div>

          {/* Scene rows */}
          {group.scenes.map(scene => (
            <div key={scene.sceneKey} className={styles.prodSceneRow}>
              <div
                className={styles.prodStatusDot}
                style={{ background: STATUS_COLORS[scene.estado] || 'var(--text-muted)' }}
              />
              <span className={styles.prodSceneKey}>{scene.sceneKey}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                {scene.durationMin || scene.duration || '?'}min
              </span>
              <span style={{ flex: 1, color: 'var(--text-muted)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {scene.location}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: STATUS_COLORS[scene.estado],
              }}>
                {scene.estado !== 'por_filmar' ? scene.estado.replace('_', ' ').toUpperCase() : ''}
              </span>
            </div>
          ))}
        </div>
      ))}

      {dayGroups.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          Nenhuma cena corresponde ao filtro seleccionado
        </p>
      )}
    </div>
  )
}
