// ConformityTab — verificação de conformidade entre forças, arcos, episódios e cenas
// Detecta inconsistências: personagens fora do arco, forças violadas, cenas problemáticas

import { useMemo } from 'react'
import { AlertTriangle, CheckCircle, Zap, Film, Users, MapPin, Shield } from 'lucide-react'

const S = {
  root: { display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 20px', overflowY: 'auto', height: '100%' },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  title: { fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 },
  card: { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 16px' },
  issue: (severity) => ({
    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, fontSize: 12, lineHeight: 1.5,
    background: severity === 'error' ? 'rgba(248,113,113,0.06)' : severity === 'warning' ? 'rgba(245,166,35,0.06)' : 'rgba(91,141,239,0.06)',
    border: `1px solid ${severity === 'error' ? 'rgba(248,113,113,0.2)' : severity === 'warning' ? 'rgba(245,166,35,0.2)' : 'rgba(91,141,239,0.15)'}`,
  }),
  badge: (bg, color) => ({ padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: bg, color }),
  ok: { display: 'flex', alignItems: 'center', gap: 8, padding: 16, color: '#34D399', fontSize: 13, fontWeight: 600 },
  stat: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' },
  forceCard: (color) => ({
    display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 14px', borderRadius: 8,
    borderLeft: `3px solid ${color}`, background: 'rgba(255,255,255,0.02)',
  }),
}

export function ConformityTab({ chars, forces, episodeArcs, relations, parsedScripts, decisions }) {
  const checks = useMemo(() => {
    const issues = []
    const epIds = Object.keys(parsedScripts || {}).sort()

    // ── 1. Characters without arc definition ──
    for (const c of chars) {
      if (!c.arcType || c.arcType === 'episódico') continue
      if (!c.description && !c.backstory && !c.arc) {
        issues.push({
          severity: 'warning',
          category: 'personagem',
          title: `${c.name} sem definição`,
          detail: `Personagem ${c.arcType} sem descrição, backstory ou arco definido. O universo precisa de saber quem é.`,
          icon: Users,
        })
      }
    }

    // ── 2. Protagonists without relations ──
    const protags = chars.filter(c => c.arcType === 'protagonista')
    for (const p of protags) {
      const rels = relations.filter(r => r.from === p.id || r.to === p.id)
      if (rels.length === 0) {
        issues.push({
          severity: 'error',
          category: 'relações',
          title: `${p.name} sem relações`,
          detail: `Protagonista sem nenhuma relação definida. Num universo funcional, o herói precisa de ligações.`,
          icon: Users,
        })
      }
    }

    // ── 3. Episode arcs vs available episodes ──
    for (const epId of epIds) {
      const epNum = parseInt(epId.replace(/\D/g, ''), 10)
      const arc = episodeArcs.find(a => a.epNum === epNum)
      if (!arc) {
        issues.push({
          severity: 'warning',
          category: 'arcos',
          title: `${epId} sem arco definido`,
          detail: `Episódio presente nos guiões mas sem arco dramático no Universo. Define fase, desejo do protagonista e cena âncora.`,
          icon: Film,
        })
      } else if (!arc.desire && !arc.description) {
        issues.push({
          severity: 'info',
          category: 'arcos',
          title: `${epId} — arco incompleto`,
          detail: `Arco definido mas sem "desire" ou descrição. O que quer o protagonista neste episódio?`,
          icon: Film,
        })
      }
    }

    // ── 4. Forces without episodes referencing them ──
    for (const force of forces) {
      // Check if any episode arc mentions the force (simple text search)
      const mentioned = episodeArcs.some(a =>
        (a.description || '').toLowerCase().includes(force.title.toLowerCase()) ||
        (a.notes || '').toLowerCase().includes(force.title.toLowerCase())
      )
      if (!mentioned && epIds.length > 0) {
        issues.push({
          severity: 'info',
          category: 'forças',
          title: `Força "${force.title}" sem referência`,
          detail: `Esta força do universo não é mencionada em nenhum arco de episódio. Está a ser respeitada na narrativa?`,
          icon: Zap,
        })
      }
    }

    // ── 5. Characters in scripts not in universe ──
    const knownNames = new Set(chars.map(c => (c.name || '').toUpperCase()))
    const unknownChars = new Map()
    for (const [epId, data] of Object.entries(parsedScripts || {})) {
      for (const scene of (data?.scenes || [])) {
        for (const charName of (scene.characters || [])) {
          const name = (typeof charName === 'string' ? charName : charName?.name || '').toUpperCase()
          if (name && !knownNames.has(name)) {
            if (!unknownChars.has(name)) unknownChars.set(name, new Set())
            unknownChars.get(name).add(epId)
          }
        }
      }
    }
    // Only flag chars with multiple appearances (not extras)
    for (const [name, eps] of unknownChars) {
      if (eps.size >= 1) {
        issues.push({
          severity: eps.size > 1 ? 'warning' : 'info',
          category: 'personagem',
          title: `"${name}" nos guiões mas não no Universo`,
          detail: `Aparece em ${eps.size} episódio${eps.size > 1 ? 's' : ''} (${[...eps].join(', ')}). Importar para o Universo?`,
          icon: Users,
        })
      }
    }

    // ── 6. Open decisions without resolution ──
    const openDecs = (decisions || []).filter(d => d.status === 'open')
    for (const d of openDecs) {
      if (d.urgency === 'alta') {
        issues.push({
          severity: 'error',
          category: 'decisões',
          title: `Decisão urgente aberta: "${d.title}"`,
          detail: d.description?.slice(0, 120) || 'Sem descrição',
          icon: AlertTriangle,
        })
      }
    }

    // ── 7. Scale consistency — characters without scale ──
    const hasAnyScale = chars.some(c => c.scale)
    if (hasAnyScale) {
      const noScale = chars.filter(c => !c.scale && c.arcType !== 'episódico')
      if (noScale.length > 0) {
        issues.push({
          severity: 'info',
          category: 'escalas',
          title: `${noScale.length} personagen${noScale.length > 1 ? 's' : ''} sem escala`,
          detail: `Define a escala (Real, Social, Liminar, Metafísico…) para: ${noScale.slice(0, 5).map(c => c.name).join(', ')}${noScale.length > 5 ? '…' : ''}`,
          icon: Shield,
        })
      }
    }

    return issues
  }, [chars, forces, episodeArcs, relations, parsedScripts, decisions])

  const errors = checks.filter(c => c.severity === 'error')
  const warnings = checks.filter(c => c.severity === 'warning')
  const infos = checks.filter(c => c.severity === 'info')

  // Force coverage per episode
  const forceCoverage = useMemo(() => {
    if (forces.length === 0 || episodeArcs.length === 0) return null
    return episodeArcs.map(arc => {
      const matches = forces.filter(f =>
        (arc.description || '').toLowerCase().includes(f.title.toLowerCase()) ||
        (arc.notes || '').toLowerCase().includes(f.title.toLowerCase())
      )
      return { epNum: arc.epNum, title: arc.title, phase: arc.phase, covered: matches.length, total: forces.length, forces: matches }
    }).sort((a, b) => a.epNum - b.epNum)
  }, [forces, episodeArcs])

  return (
    <div style={S.root}>
      {/* Summary */}
      <div style={{ ...S.card, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={S.stat}><Shield size={14} color="#A06AFF" /> Conformidade do Universo</div>
        {errors.length > 0 && <div style={{ ...S.stat, color: '#F87171' }}><AlertTriangle size={14} /> {errors.length} erro{errors.length > 1 ? 's' : ''}</div>}
        {warnings.length > 0 && <div style={{ ...S.stat, color: '#F5A623' }}><AlertTriangle size={14} /> {warnings.length} aviso{warnings.length > 1 ? 's' : ''}</div>}
        {infos.length > 0 && <div style={{ ...S.stat, color: '#5B8DEF' }}>{infos.length} sugestão{infos.length > 1 ? 'ões' : ''}</div>}
        {checks.length === 0 && <div style={S.ok}><CheckCircle size={16} /> Universo consistente</div>}
      </div>

      {/* Force coverage matrix */}
      {forceCoverage && (
        <div style={S.section}>
          <h3 style={S.title}><Zap size={16} color="#F5A623" /> Forças × Episódios</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            Quantas forças do universo são referenciadas em cada arco de episódio
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {forceCoverage.map(ep => (
              <div key={ep.epNum} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                background: 'rgba(255,255,255,0.02)', borderRadius: 8,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--mod-script)', minWidth: 38 }}>
                  EP{String(ep.epNum).padStart(2, '0')}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)' }}>{ep.title || ep.phase || '—'}</span>
                {/* Coverage bar */}
                <div style={{ width: 80, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.round((ep.covered / ep.total) * 100)}%`,
                    height: '100%', borderRadius: 3,
                    background: ep.covered === 0 ? '#F87171' : ep.covered < ep.total / 2 ? '#F5A623' : '#34D399',
                  }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: ep.covered === 0 ? '#F87171' : '#34D399', minWidth: 30, textAlign: 'right' }}>
                  {ep.covered}/{ep.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {checks.length > 0 && (
        <div style={S.section}>
          <h3 style={S.title}><AlertTriangle size={16} color="#F5A623" /> Verificações ({checks.length})</h3>
          {[...errors, ...warnings, ...infos].map((issue, i) => {
            const Icon = issue.icon
            const color = issue.severity === 'error' ? '#F87171' : issue.severity === 'warning' ? '#F5A623' : '#5B8DEF'
            return (
              <div key={i} style={S.issue(issue.severity)}>
                <Icon size={14} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', marginBottom: 2 }}>{issue.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{issue.detail}</div>
                </div>
                <span style={S.badge(
                  issue.severity === 'error' ? 'rgba(248,113,113,0.12)' : issue.severity === 'warning' ? 'rgba(245,166,35,0.12)' : 'rgba(91,141,239,0.1)',
                  color
                )}>{issue.category}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Forces reference */}
      {forces.length > 0 && (
        <div style={S.section}>
          <h3 style={S.title}><Zap size={16} color="#E05B8D" /> Forças do Universo ({forces.length})</h3>
          {forces.map(f => (
            <div key={f.id} style={S.forceCard(f.color)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{f.num}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{f.title}</span>
              </div>
              {f.text && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f.text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
