// TableView — vista tabular de todas as cenas com sorting e filtros
// Mostra: Dia · Ep · Cena · Tipo · INT/EXT · Local · Duração · Personagens

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpDown, Filter, Table2 } from 'lucide-react'
import styles from '../Schedule.module.css'

const TYPE_COLORS = {
  'Âncora':    '#A02E6F',
  'Grupo':     '#2E6FA0',
  'Diálogo':   '#2EA080',
  'Gag':       '#BF6A2E',
  'Solo':      '#7B4FBF',
  'Transição': '#6E6E78',
}

const COLUMNS = [
  { id: 'day',       label: 'Dia',         width: 70 },
  { id: 'epId',      label: 'Ep',          width: 50 },
  { id: 'sceneNum',  label: '#',           width: 40 },
  { id: 'sceneType', label: 'Tipo',        width: 80 },
  { id: 'intExt',    label: 'I/E',         width: 40 },
  { id: 'location',  label: 'Local',       width: 0 },  // flex
  { id: 'duration',  label: 'Duração',     width: 70 },
  { id: 'characters',label: 'Personagens', width: 0 },  // flex
]

export function TableView({ engineResult, onSceneClick }) {
  const [sortCol, setSortCol] = useState('day')
  const [sortDir, setSortDir] = useState('asc')
  const [filterType, setFilterType] = useState('')
  const [filterEp, setFilterEp] = useState('')
  const [filterLoc, setFilterLoc] = useState('')

  const { days = [], allScenes = [], assignments = {} } = engineResult || {}

  // Preparar linhas: cada cena + dia atribuído
  const rows = useMemo(() => {
    return allScenes.map(scene => {
      const dayId = assignments[scene.sceneKey]
      const day = days.find(d => d.id === dayId)
      return {
        ...scene,
        dayNumber: day?.dayNumber || null,
        dayLabel: day?.label || '—',
        dayDate: day?.date || '',
      }
    })
  }, [allScenes, assignments, days])

  // Filtros
  const filtered = useMemo(() => {
    let r = rows
    if (filterType) r = r.filter(s => s.sceneType === filterType)
    if (filterEp)   r = r.filter(s => s.epId === filterEp)
    if (filterLoc)  r = r.filter(s => (s.location || '').toLowerCase().includes(filterLoc.toLowerCase()))
    return r
  }, [rows, filterType, filterEp, filterLoc])

  // Sorting
  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      switch (sortCol) {
        case 'day':       return ((a.dayNumber || 999) - (b.dayNumber || 999)) * dir
        case 'epId':      return (a.epId || '').localeCompare(b.epId || '') * dir
        case 'sceneNum':  return ((a.sceneNumber || 0) - (b.sceneNumber || 0)) * dir
        case 'sceneType': return (a.sceneType || '').localeCompare(b.sceneType || '') * dir
        case 'intExt':    return (a.intExt || '').localeCompare(b.intExt || '') * dir
        case 'location':  return (a.location || '').localeCompare(b.location || '') * dir
        case 'duration':  return ((a.duration || 0) - (b.duration || 0)) * dir
        case 'characters':return ((a.characters || []).length - (b.characters || []).length) * dir
        default: return 0
      }
    })
  }, [filtered, sortCol, sortDir])

  // Listas únicas para filtros
  const types = [...new Set(allScenes.map(s => s.sceneType).filter(Boolean))].sort()
  const eps = [...new Set(allScenes.map(s => s.epId).filter(Boolean))].sort()

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  if (allScenes.length === 0) {
    return (
      <div className={styles.calEmpty}>
        <Table2 size={36} color="var(--text-muted)" style={{ opacity: 0.4 }} />
        <p>Nenhuma cena disponível</p>
      </div>
    )
  }

  return (
    <div className={styles.tableRoot}>
      {/* Filtros */}
      <div className={styles.tableFilters}>
        <Filter size={12} color="var(--text-muted)" />
        <select
          className={styles.tableFilterSelect}
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          className={styles.tableFilterSelect}
          value={filterEp}
          onChange={e => setFilterEp(e.target.value)}
        >
          <option value="">Todos os eps</option>
          {eps.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input
          className={styles.tableFilterInput}
          placeholder="Filtrar local..."
          value={filterLoc}
          onChange={e => setFilterLoc(e.target.value)}
        />
        <span className={styles.tableCount}>
          {sorted.length} / {allScenes.length} cenas
        </span>
      </div>

      {/* Tabela */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.id}
                  className={styles.tableTh}
                  style={col.width ? { width: col.width, minWidth: col.width } : {}}
                  onClick={() => handleSort(col.id)}
                >
                  <span className={styles.tableThInner}>
                    {col.label}
                    {sortCol === col.id && (
                      <ArrowUpDown size={10} style={{ opacity: 0.7 }} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((scene, idx) => {
              const typeColor = TYPE_COLORS[scene.sceneType] || '#6E6E78'
              const isUnassigned = !scene.dayNumber
              return (
                <motion.tr
                  key={scene.sceneKey}
                  className={`${styles.tableTr} ${isUnassigned ? styles.tableTrUnassigned : ''}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(idx * 0.01, 0.5) }}
                  onClick={() => onSceneClick?.(scene)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={styles.tableTd}>
                    {isUnassigned
                      ? <span style={{ color: 'var(--health-red)', fontWeight: 700, fontSize: 10 }}>SEM DIA</span>
                      : <span style={{ color: 'var(--mod-production)', fontWeight: 800 }}>D{scene.dayNumber}</span>
                    }
                  </td>
                  <td className={styles.tableTd}>
                    <span style={{ color: 'var(--mod-production)', fontWeight: 700, fontSize: 10 }}>
                      {scene.epId}
                    </span>
                  </td>
                  <td className={styles.tableTd} style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {scene.sceneNumber}
                  </td>
                  <td className={styles.tableTd}>
                    <span
                      className={styles.typeBadge}
                      style={{ background: typeColor + '22', color: typeColor, borderColor: typeColor + '55' }}
                    >
                      {scene.sceneType}
                    </span>
                  </td>
                  <td className={styles.tableTd}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: 10,
                      color: scene.intExt === 'EXT' ? '#F5A623' : 'var(--text-muted)',
                    }}>
                      {scene.intExt}
                    </span>
                  </td>
                  <td className={styles.tableTd}>
                    <span className={styles.tableLoc}>
                      <span
                        className={styles.tableLocDot}
                        style={{ background: scene.locationColor || '#6E6E78' }}
                      />
                      {scene.location || '—'}
                    </span>
                  </td>
                  <td className={styles.tableTd} style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{scene.duration}m</span>
                    {scene.durationMods?.length > 0 && (
                      <span style={{ fontSize: 9, color: 'var(--health-yellow)', marginLeft: 3 }}>
                        ×{scene.durationFactor}
                      </span>
                    )}
                  </td>
                  <td className={styles.tableTd}>
                    <div className={styles.tableChars}>
                      {(scene.characters || []).slice(0, 3).map(c => (
                        <span key={c} className={styles.tableCharChip}>{c}</span>
                      ))}
                      {(scene.characters || []).length > 3 && (
                        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                          +{scene.characters.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
