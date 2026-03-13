// ScheduleWarnings — continuity & scheduling issue detection for 1st AD
// Detects temporal continuity, turnaround, heavy days, child actors, etc.

import { useMemo } from 'react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react'

const SEVERITY_CONFIG = {
  error:   { icon: AlertTriangle, color: '#f87171', bg: '#ef444415', border: '#ef444430', label: 'Erro' },
  warning: { icon: AlertCircle,   color: '#fbbf24', bg: '#f59e0b15', border: '#f59e0b30', label: 'Aviso' },
  info:    { icon: Info,           color: '#60a5fa', bg: '#3b82f615', border: '#3b82f630', label: 'Info' },
}

const NIGHT_TIMES = ['NOITE', 'MADRUGADA']
const DAY_TIMES = ['DIA', 'MANHÃ', 'TARDE', 'ALMOÇO']

export function ScheduleWarnings() {
  const { parsedScripts, shootingDays, sceneAssignments, team } = useStore(useShallow(s => ({
    parsedScripts: s.parsedScripts,
    shootingDays: s.shootingDays,
    sceneAssignments: s.sceneAssignments,
    team: s.team,
  })))

  const warnings = useMemo(() => {
    const warns = []

    // Collect all scenes
    const allScenes = []
    const sceneMap = {}
    Object.values(parsedScripts || {}).forEach(ps => {
      ;(ps?.scenes || []).forEach(sc => {
        allScenes.push(sc)
        const key = `${sc.episode}-${sc.sceneNumber || sc.id}`
        sceneMap[key] = sc
      })
    })

    if (!allScenes.length) return warns

    // ── 1. Temporal continuity ────────────────────────────────────
    // Group scenes by episode and sort by scene number
    const byEpisode = {}
    allScenes.forEach(sc => {
      if (!byEpisode[sc.episode]) byEpisode[sc.episode] = []
      byEpisode[sc.episode].push(sc)
    })

    Object.entries(byEpisode).forEach(([ep, scenes]) => {
      const sorted = [...scenes].sort((a, b) => parseInt(a.sceneNumber) - parseInt(b.sceneNumber))

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]

        // Same location, different time of day
        if (prev.location === curr.location && prev.timeOfDay !== curr.timeOfDay) {
          warns.push({
            severity: 'warning',
            category: 'continuidade',
            title: `Continuidade temporal suspeita`,
            description: `${prev.id}→${curr.id}: mesmo local (${prev.location}) mas ${prev.timeOfDay}→${curr.timeOfDay}`,
            scenes: [prev.id, curr.id],
          })
        }

        // Same character in consecutive scenes at different locations
        const commonChars = (prev.characters || []).filter(c => (curr.characters || []).includes(c))
        if (commonChars.length > 0 && prev.location !== curr.location) {
          warns.push({
            severity: 'info',
            category: 'continuidade',
            title: `Viagem entre locais`,
            description: `${commonChars.join(', ')} em ${prev.id} (${prev.location}) → ${curr.id} (${curr.location})`,
            scenes: [prev.id, curr.id],
          })
        }
      }
    })

    // ── 2. Scheduling warnings (only with shooting days) ──────────
    const sortedDays = [...(shootingDays || [])].sort((a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date)
      return 0
    })

    if (sortedDays.length && Object.keys(sceneAssignments || {}).length) {
      // Build day → scenes map
      const dayScenes = {}
      sortedDays.forEach(d => { dayScenes[d.id] = [] })
      Object.entries(sceneAssignments).forEach(([key, dayId]) => {
        const sc = sceneMap[key]
        if (sc && dayScenes[dayId]) dayScenes[dayId].push({ ...sc, sceneKey: key })
      })

      // Build day → characters map
      const dayChars = {}
      sortedDays.forEach(d => {
        const chars = {}
        ;(dayScenes[d.id] || []).forEach(sc => {
          ;(sc.characters || []).forEach(c => {
            if (!chars[c]) chars[c] = []
            chars[c].push(sc)
          })
        })
        dayChars[d.id] = chars
      })

      // A. Story-consecutive scenes on different days → continuity warning
      Object.entries(byEpisode).forEach(([ep, scenes]) => {
        const sorted = [...scenes].sort((a, b) => parseInt(a.sceneNumber) - parseInt(b.sceneNumber))
        for (let i = 1; i < sorted.length; i++) {
          const prevKey = `${sorted[i - 1].episode}-${sorted[i - 1].sceneNumber || sorted[i - 1].id}`
          const currKey = `${sorted[i].episode}-${sorted[i].sceneNumber || sorted[i].id}`
          const prevDay = sceneAssignments[prevKey]
          const currDay = sceneAssignments[currKey]
          if (prevDay && currDay && prevDay !== currDay) {
            const commonChars = (sorted[i - 1].characters || []).filter(c => (sorted[i].characters || []).includes(c))
            if (commonChars.length > 0) {
              warns.push({
                severity: 'warning',
                category: 'figurino',
                title: `Continuidade de figurino/maquilhagem`,
                description: `${sorted[i - 1].id}→${sorted[i].id} são consecutivas mas filmadas em dias diferentes. Atenção a: ${commonChars.join(', ')}`,
                scenes: [sorted[i - 1].id, sorted[i].id],
              })
            }
          }
        }
      })

      // B. Night → Day turnaround
      for (let di = 1; di < sortedDays.length; di++) {
        const prevDay = sortedDays[di - 1]
        const currDay = sortedDays[di]
        const prevScenes = dayScenes[prevDay.id] || []
        const currScenes = dayScenes[currDay.id] || []

        const prevHasNight = prevScenes.some(sc => NIGHT_TIMES.includes(sc.timeOfDay))
        const currHasDay = currScenes.some(sc => DAY_TIMES.includes(sc.timeOfDay))

        if (prevHasNight && currHasDay) {
          warns.push({
            severity: 'error',
            category: 'turnaround',
            title: `Turnaround insuficiente`,
            description: `Dia ${di} tem cenas nocturnas, seguido de dia ${di + 1} com cenas diurnas. Verificar se há 10h de descanso obrigatório.`,
            scenes: [],
          })
        }
      }

      // C. Child actors
      sortedDays.forEach((d, di) => {
        const scenes = dayScenes[d.id] || []
        const hasChildren = scenes.some(sc =>
          (sc.autoTags || []).includes('criancas') ||
          (sc.characters || []).some(c => /\bcriança\b|\bmiúd|\bbebé\b|\binfant/i.test(c))
        )
        if (hasChildren) {
          warns.push({
            severity: 'warning',
            category: 'legal',
            title: `Menores no dia ${di + 1}`,
            description: `Verificar limites legais de horário de menores (${d.label || d.date || d.id})`,
            scenes: scenes.filter(sc => (sc.autoTags || []).includes('criancas')).map(sc => sc.id),
          })
        }
      })

      // D. Heavy days (>5 scenes for same character)
      sortedDays.forEach((d, di) => {
        Object.entries(dayChars[d.id] || {}).forEach(([char, scenes]) => {
          if (scenes.length > 5) {
            warns.push({
              severity: 'warning',
              category: 'carga',
              title: `Dia pesado para ${char}`,
              description: `${scenes.length} cenas no dia ${di + 1} (${d.label || d.date || d.id})`,
              scenes: scenes.map(sc => sc.id),
            })
          }
        })
      })

      // E. EXT scenes without weather data
      sortedDays.forEach((d, di) => {
        const scenes = dayScenes[d.id] || []
        const hasExt = scenes.some(sc => sc.intExt === 'EXT' || sc.intExt === 'INT/EXT')
        if (hasExt && !d.weather) {
          warns.push({
            severity: 'info',
            category: 'meteo',
            title: `Sem meteo para cenas EXT`,
            description: `Dia ${di + 1} (${d.label || d.date || d.id}) tem ${scenes.filter(sc => sc.intExt === 'EXT' || sc.intExt === 'INT/EXT').length} cenas exteriores sem dados meteorológicos`,
            scenes: [],
          })
        }
      })
    }

    // Sort: errors first, then warnings, then info
    const order = { error: 0, warning: 1, info: 2 }
    warns.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9))

    return warns
  }, [parsedScripts, shootingDays, sceneAssignments, team])

  // Group by category
  const categories = useMemo(() => {
    const cats = {}
    warnings.forEach(w => {
      if (!cats[w.category]) cats[w.category] = []
      cats[w.category].push(w)
    })
    return cats
  }, [warnings])

  const catLabels = {
    continuidade: 'Continuidade Temporal',
    figurino: 'Figurino / Maquilhagem',
    turnaround: 'Descanso Obrigatório',
    legal: 'Requisitos Legais',
    carga: 'Carga de Trabalho',
    meteo: 'Meteorologia',
  }

  if (!Object.keys(parsedScripts || {}).length) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <ShieldAlert size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
        <p>Importa guiões para detectar avisos de produção.</p>
      </div>
    )
  }

  if (!warnings.length) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <ShieldAlert size={32} style={{ marginBottom: 12, opacity: 0.4, color: '#4ade80' }} />
        <p style={{ color: '#4ade80' }}>Sem avisos detectados.</p>
        <p style={{ fontSize: 12 }}>Tudo parece consistente.</p>
      </div>
    )
  }

  const counts = { error: 0, warning: 0, info: 0 }
  warnings.forEach(w => counts[w.severity]++)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 12, alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{warnings.length} avisos</span>
        {counts.error > 0 && <span style={{ color: '#f87171' }}>{counts.error} erros</span>}
        {counts.warning > 0 && <span style={{ color: '#fbbf24' }}>{counts.warning} avisos</span>}
        {counts.info > 0 && <span style={{ color: '#60a5fa' }}>{counts.info} info</span>}
      </div>

      {/* Warning cards by category */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(categories).map(([cat, warns]) => (
          <div key={cat}>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>
              {catLabels[cat] || cat} ({warns.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {warns.map((w, i) => {
                const cfg = SEVERITY_CONFIG[w.severity]
                const Icon = cfg.icon
                return (
                  <div key={`${cat}-${i}`} style={{
                    display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 8,
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    alignItems: 'flex-start',
                  }}>
                    <Icon size={14} style={{ color: cfg.color, marginTop: 1, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: cfg.color, marginBottom: 2 }}>{w.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{w.description}</div>
                      {w.scenes?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {w.scenes.map(s => (
                            <span key={s} style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
