// BreakdownSheet — 1st AD scene breakdown cards
// Shows cast, extras, props, tags, production notes per scene

import { useState, useMemo } from 'react'
import { Users, UserPlus, Package, Tag, FileText, Filter, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'

// ── Parse page length string to eighths ─────────────────────────
function pageLengthToEighths(pl) {
  if (!pl) return 0
  const str = String(pl).trim()
  // "1 2/8" → 10, "3/8" → 3, "1" → 8
  const parts = str.split(/\s+/)
  let total = 0
  for (const p of parts) {
    if (p.includes('/')) {
      const [num, den] = p.split('/')
      total += Math.round((parseInt(num, 10) / parseInt(den, 10)) * 8)
    } else {
      total += parseInt(p, 10) * 8
    }
  }
  return total || 0
}

function eighthsToDisplay(e) {
  if (!e) return '—'
  const whole = Math.floor(e / 8)
  const frac = e % 8
  if (whole && frac) return `${whole} ${frac}/8`
  if (whole) return `${whole}`
  return `${frac}/8`
}

// ── Prop detection in action text ───────────────────────────────
const PROP_PATTERNS = [
  { re: /\btelefone\b|\btelemóvel\b|\bsmartphone\b|\bcelular\b/gi, label: 'Telefone' },
  { re: /\bfaca\b|\bcanivete\b/gi, label: 'Faca' },
  { re: /\barma\b|\bpistola\b|\bespingarda\b|\brevólver\b/gi, label: 'Arma' },
  { re: /\bcarta\b|\benvelope\b|\bbilhete\b/gi, label: 'Carta' },
  { re: /\bchave\b|\bchaves\b/gi, label: 'Chave' },
  { re: /\bfotografia\b|\bfoto\b|\bretrato\b/gi, label: 'Fotografia' },
  { re: /\bmala\b|\bmochila\b|\bsaco\b|\bbolsa\b/gi, label: 'Mala/Saco' },
  { re: /\blivro\b|\bcaderno\b|\bdiário\b/gi, label: 'Livro' },
  { re: /\bcopo\b|\bgarra?fa\b|\bcerveja\b|\bvinho\b|\bwhisky\b/gi, label: 'Bebida' },
  { re: /\bcigarro\b|\bisqueiro\b|\bcinzeiro\b/gi, label: 'Cigarro' },
  { re: /\bcomputador\b|\bportátil\b|\blaptop\b|\btablet\b/gi, label: 'Computador' },
  { re: /\bdinheiro\b|\bnotas\b|\bmoedas\b|\bcarteira\b/gi, label: 'Dinheiro' },
  { re: /\banel\b|\bcolar\b|\bpulseira\b|\brelógio\b/gi, label: 'Jóia/Relógio' },
  { re: /\bmedicamento\b|\bcomprimido\b|\bseringa\b|\bpílula\b/gi, label: 'Medicamento' },
  { re: /\bflor(?:es)?\b|\bramalhete\b|\bbouquet\b/gi, label: 'Flores' },
  { re: /\bdocumento\b|\bcontrato\b|\bprocesso\b|\bpapel\b/gi, label: 'Documento' },
]

function detectProps(scene) {
  const actionText = (scene.action || []).join(' ')
  if (!actionText) return []
  const found = new Set()
  for (const pp of PROP_PATTERNS) {
    if (pp.re.test(actionText)) found.add(pp.label)
    pp.re.lastIndex = 0
  }
  return [...found]
}

// ── Tag colors ──────────────────────────────────────────────────
const TAG_COLORS = {
  croma: '#22d3ee', stunts: '#f43f5e', sfx: '#f97316', vfx: '#a78bfa',
  criancas: '#fbbf24', animais: '#84cc16', agua: '#38bdf8', noite_amer: '#6366f1',
  intimidade: '#ec4899', veiculos: '#64748b', armas: '#dc2626', multidao: '#8b5cf6',
  playback: '#06b6d4', refeicao: '#f59e0b', telefone: '#10b981', comida: '#eab308',
  musica: '#7c3aed', sangue: '#b91c1c',
}

export function BreakdownSheet({ scenes, episodeId }) {
  const [filterIntExt, setFilterIntExt] = useState('all')
  const [filterChar, setFilterChar] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [expandedIds, setExpandedIds] = useState(new Set())

  const allScenes = useMemo(() => scenes || [], [scenes])

  // Collect all characters and tags for filter dropdowns
  const allChars = useMemo(() => {
    const s = new Set()
    allScenes.forEach(sc => (sc.characters || []).forEach(c => s.add(c)))
    return [...s].sort()
  }, [allScenes])

  const allTags = useMemo(() => {
    const s = new Set()
    allScenes.forEach(sc => (sc.autoTags || []).forEach(t => s.add(t)))
    return [...s].sort()
  }, [allScenes])

  // Filter
  const filtered = useMemo(() => {
    let res = allScenes
    if (filterIntExt !== 'all') res = res.filter(s => s.intExt === filterIntExt)
    if (filterChar) res = res.filter(s => (s.characters || []).includes(filterChar))
    if (filterTag) res = res.filter(s => (s.autoTags || []).includes(filterTag))
    return res
  }, [allScenes, filterIntExt, filterChar, filterTag])

  // Summary
  const summary = useMemo(() => {
    const totalEighths = filtered.reduce((s, sc) => s + pageLengthToEighths(sc.pageLength), 0)
    const allCast = new Set()
    let totalExtras = 0
    filtered.forEach(sc => {
      ;(sc.characters || []).forEach(c => allCast.add(c))
      ;(sc.extras || []).forEach(e => { totalExtras += e.estimatedCount })
    })
    return { totalPages: eighthsToDisplay(totalEighths), totalEighths, totalCast: allCast.size, totalExtras }
  }, [filtered])

  // Speaking characters per scene
  const speakingChars = useMemo(() => {
    const map = {}
    allScenes.forEach(sc => {
      const speaking = new Set()
      ;(sc.dialogue || []).forEach(d => speaking.add(d.character))
      map[sc.id] = speaking
    })
    return map
  }, [allScenes])

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  if (!allScenes.length) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <FileText size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
        <p>Importa um guião para ver o breakdown de cenas.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 20, padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
        <span><strong>{filtered.length}</strong> cenas</span>
        <span><strong>{summary.totalPages}</strong> páginas</span>
        <span><strong>{summary.totalCast}</strong> personagens</span>
        <span><strong>~{summary.totalExtras}</strong> figurantes est.</span>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={13} style={{ color: 'var(--text-muted)' }} />
        <select value={filterIntExt} onChange={e => setFilterIntExt(e.target.value)} style={selectStyle}>
          <option value="all">INT/EXT</option>
          <option value="INT">INT</option>
          <option value="EXT">EXT</option>
          <option value="INT/EXT">INT/EXT</option>
        </select>
        <select value={filterChar} onChange={e => setFilterChar(e.target.value)} style={selectStyle}>
          <option value="">Personagem...</option>
          {allChars.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={selectStyle}>
          <option value="">Tag...</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterIntExt !== 'all' || filterChar || filterTag) && (
          <button onClick={() => { setFilterIntExt('all'); setFilterChar(''); setFilterTag('') }} style={{ ...selectStyle, cursor: 'pointer', color: '#f87171' }}>Limpar</button>
        )}
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(sc => {
          const expanded = expandedIds.has(sc.id)
          const speaking = speakingChars[sc.id] || new Set()
          const props = detectProps(sc)

          return (
            <div key={sc.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
              {/* Header */}
              <div
                onClick={() => toggleExpand(sc.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none' }}
              >
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', minWidth: 52 }}>{sc.id}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                  background: sc.intExt === 'INT' ? '#3b82f620' : sc.intExt === 'EXT' ? '#22c55e20' : '#f59e0b20',
                  color: sc.intExt === 'INT' ? '#60a5fa' : sc.intExt === 'EXT' ? '#4ade80' : '#fbbf24',
                }}>{sc.intExt}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{sc.location}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sc.timeOfDay}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 40, textAlign: 'right' }}>{sc.pageLength || '—'}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 40, textAlign: 'right' }}>~{sc.durationMin}s</span>
                {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
              </div>

              {expanded && (
                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Elenco */}
                  <div>
                    <div style={sectionTitle}><Users size={12} /> Elenco ({(sc.characters || []).length})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(sc.characters || []).map(c => (
                        <span key={c} style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: speaking.has(c) ? '#3b82f620' : '#64748b20',
                          color: speaking.has(c) ? '#60a5fa' : '#94a3b8',
                          border: '1px solid ' + (speaking.has(c) ? '#3b82f640' : '#64748b30'),
                        }}>
                          {c} {speaking.has(c) ? '' : '(silêncio)'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Figuração */}
                  {(sc.extras || []).length > 0 && (
                    <div>
                      <div style={sectionTitle}><UserPlus size={12} /> Figuração</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {sc.extras.map((e, i) => (
                          <span key={i} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: '#f59e0b15', color: '#fbbf24', border: '1px solid #f59e0b30' }}>
                            {e.description} (~{e.estimatedCount})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Adereços */}
                  {props.length > 0 && (
                    <div>
                      <div style={sectionTitle}><Package size={12} /> Adereços</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {props.map(p => (
                          <span key={p} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: '#a78bfa15', color: '#a78bfa', border: '1px solid #a78bfa30' }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notas de Produção */}
                  {(sc.productionNotes || []).length > 0 && (
                    <div>
                      <div style={sectionTitle}><MessageSquare size={12} /> Notas de Produção</div>
                      {sc.productionNotes.map((n, i) => (
                        <p key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0', paddingLeft: 8, borderLeft: '2px solid #f59e0b40' }}>{n}</p>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {(sc.autoTags || []).length > 0 && (
                    <div>
                      <div style={sectionTitle}><Tag size={12} /> Tags</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {sc.autoTags.map(t => (
                          <span key={t} style={{
                            padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                            background: (TAG_COLORS[t] || '#64748b') + '20',
                            color: TAG_COLORS[t] || '#94a3b8',
                          }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scene title from FDX */}
                  {sc.sceneTitle && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>FDX: {sc.sceneTitle}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const selectStyle = {
  padding: '4px 8px', borderRadius: 6, fontSize: 11, border: '1px solid var(--border-subtle)',
  background: 'var(--bg-surface)', color: 'var(--text-secondary)', outline: 'none',
}

const sectionTitle = {
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
}
