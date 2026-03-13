// ScriptDiagnostics — detecção de redundâncias, locais duplicados, cenas problemáticas
// Análise automática dos guiões importados

import { useMemo, useState, useCallback } from 'react'
import { MapPin, AlertTriangle, Merge, Users, Film, CheckCircle, Layers, UserX } from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'

// ── Location similarity (Levenshtein-lite + normalization) ─────
function normalize(s) {
  return (s || '').toUpperCase().trim()
    .replace(/[./]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^(INT|EXT|INT\/EXT|EXT\/INT)\s*/i, '')
    .replace(/\s*[-–—]\s*(DIA|NOITE|AMANHECER|CREPÚSCULO|GOLDEN|TARDE|MANHÃ|ENTARDECER)\s*$/i, '')
    .trim()
}

function similarity(a, b) {
  if (a === b) return 1
  const shorter = a.length < b.length ? a : b
  const longer  = a.length < b.length ? b : a
  if (longer.length === 0) return 1
  // Check containment
  if (longer.includes(shorter) && shorter.length > 3) return 0.85
  // Simple Jaccard on words
  const wa = new Set(a.split(/\s+/))
  const wb = new Set(b.split(/\s+/))
  const inter = [...wa].filter(w => wb.has(w)).length
  const union = new Set([...wa, ...wb]).size
  return union > 0 ? inter / union : 0
}

function findDuplicateLocations(scenes) {
  const locMap = {} // normalized → [{original, scenes}]
  for (const s of scenes) {
    const raw = s.location || ''
    const norm = normalize(raw)
    if (!norm) continue
    if (!locMap[norm]) locMap[norm] = { original: raw, norm, scenes: [], intExts: new Set() }
    locMap[norm].scenes.push(s.id)
    locMap[norm].intExts.add(s.intExt)
  }

  // Find similar groups
  const norms = Object.keys(locMap)
  const groups = []
  const used = new Set()

  for (let i = 0; i < norms.length; i++) {
    if (used.has(norms[i])) continue
    const group = [norms[i]]
    used.add(norms[i])
    for (let j = i + 1; j < norms.length; j++) {
      if (used.has(norms[j])) continue
      if (similarity(norms[i], norms[j]) >= 0.6) {
        group.push(norms[j])
        used.add(norms[j])
      }
    }
    if (group.length > 1) {
      groups.push(group.map(n => locMap[n]))
    }
  }

  return { locMap, groups }
}

// ── Scene diagnostics ──────────────────────────────────────────
function diagnoseScenes(scenes) {
  const issues = []

  for (const s of scenes) {
    const chars = s.characters || []
    const dialogues = s.dialogue || []
    const actions = s.action || []

    // No characters
    if (chars.length === 0) {
      issues.push({ scene: s.id, type: 'warning', msg: 'Cena sem personagens identificadas', category: 'personagens' })
    }

    // No dialogue and no action
    if (dialogues.length === 0 && actions.length === 0) {
      issues.push({ scene: s.id, type: 'warning', msg: 'Cena vazia — sem diálogo nem acção', category: 'conteúdo' })
    }

    // Very short scene (might be misidentified)
    if (dialogues.length === 0 && actions.length <= 1 && (actions[0]?.length || 0) < 20) {
      issues.push({ scene: s.id, type: 'info', msg: 'Cena muito curta — pode ser transição ou cabeçalho mal identificado', category: 'estrutura' })
    }

    // Character in dialogue but not in characters list
    for (const d of dialogues) {
      const charName = (d.character || '').toUpperCase()
      const inList = chars.some(c => (typeof c === 'string' ? c : c.name || '').toUpperCase() === charName)
      if (!inList && charName) {
        issues.push({ scene: s.id, type: 'info', msg: `"${d.character}" fala mas não está na lista de personagens`, category: 'personagens' })
      }
    }

    // Missing location
    if (!s.location || s.location.length < 3) {
      issues.push({ scene: s.id, type: 'error', msg: 'Localização em falta ou muito curta', category: 'locais' })
    }

    // Very long scene (potential merge issue)
    if (dialogues.length > 40) {
      issues.push({ scene: s.id, type: 'info', msg: `Cena com ${dialogues.length} diálogos — possível fusão de cenas?`, category: 'estrutura' })
    }

    // timeOfDay assumed (not explicit in source)
    if (s._hadTimeOfDay === false) {
      issues.push({ scene: s.id, type: 'info', msg: 'Período do dia não especificado — assumido DIA', category: 'locais' })
    }
  }

  // Scene number gaps
  const sceneNums = scenes.map(s => parseInt(s.sceneNumber, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b)
  for (let i = 1; i < sceneNums.length; i++) {
    if (sceneNums[i] - sceneNums[i - 1] > 1) {
      const missing = []
      for (let n = sceneNums[i - 1] + 1; n < sceneNums[i]; n++) missing.push(n)
      issues.push({ scene: `SC${String(sceneNums[i]).padStart(3, '0')}`, type: 'error', msg: `Numeração com gap — cena(s) em falta: ${missing.join(', ')}`, category: 'estrutura' })
    }
  }

  // Duplicate scene numbers
  const seenNums = {}
  for (const s of scenes) {
    const key = `${s._ep || s.episode}-${s.id}`
    if (seenNums[key]) {
      issues.push({ scene: s.id, type: 'error', msg: `Número de cena duplicado (${s.id}) — duas cenas com o mesmo ID`, category: 'estrutura' })
    }
    seenNums[key] = true
  }

  return issues
}

// ── Styles ─────────────────────────────────────────────────────
const S = {
  root: { display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 20px', overflowY: 'auto', height: '100%' },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 },
  card: { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 16px' },
  group: { display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 14px', background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 8 },
  locItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 },
  badge: (bg, color) => ({ padding: '2px 7px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: bg, color }),
  issue: (type) => ({
    display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.4,
    background: type === 'error' ? 'rgba(248,113,113,0.06)' : type === 'warning' ? 'rgba(245,166,35,0.06)' : 'rgba(91,141,239,0.06)',
    border: `1px solid ${type === 'error' ? 'rgba(248,113,113,0.2)' : type === 'warning' ? 'rgba(245,166,35,0.2)' : 'rgba(91,141,239,0.15)'}`,
    color: type === 'error' ? '#F87171' : type === 'warning' ? '#F5A623' : '#5B8DEF',
  }),
  empty: { textAlign: 'center', padding: 40, color: 'var(--text-muted)' },
  stat: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' },
}

// ── Detect similar character names ──────────────────────────────
function findSimilarCharacters(scenes) {
  const allChars = new Set()
  for (const s of scenes) {
    for (const c of (s.characters || [])) {
      allChars.add(typeof c === 'string' ? c : c.name || c)
    }
  }
  const names = [...allChars].sort()
  const pairs = []
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i].toUpperCase()
      const b = names[j].toUpperCase()
      if (a === b) continue
      // Substring match: "MARIA" is contained in "MARIA JOSÉ"
      if ((a.length >= 3 && b.startsWith(a)) || (b.length >= 3 && a.startsWith(b))) {
        pairs.push({ a: names[i], b: names[j], reason: 'podem ser a mesma?' })
      }
    }
  }
  return pairs
}

// ── Group sub-locations (décors) ────────────────────────────────
function groupSubLocations(scenes) {
  const locMap = {}
  for (const s of scenes) {
    const raw = s.location || ''
    // Split on " - " or ". " to find parent/child
    const splitMatch = raw.match(/^(.+?)\s*[-–—]\s*(.+)$/) || raw.match(/^(.+?)\.\s+(.+)$/)
    if (splitMatch) {
      const parent = splitMatch[1].trim().toUpperCase()
      const child = splitMatch[2].trim()
      if (!locMap[parent]) locMap[parent] = { parent: splitMatch[1].trim(), children: new Set(), scenes: [] }
      locMap[parent].children.add(child)
      locMap[parent].scenes.push(s.id)
    }
  }
  // Only return groups with 2+ sub-locations
  return Object.values(locMap).filter(g => g.children.size >= 2).map(g => ({
    parent: g.parent,
    children: [...g.children],
    sceneCount: g.scenes.length,
  }))
}

// ── Cross-validate team vs script characters ────────────────────
function crossValidateTeamScript(team, parsedScripts) {
  // Collect all character names from parsed scripts
  const scriptChars = new Set()
  for (const data of Object.values(parsedScripts || {})) {
    for (const s of (data?.scenes || [])) {
      for (const c of (s.characters || [])) {
        scriptChars.add((typeof c === 'string' ? c : c.name || c).toUpperCase())
      }
    }
  }

  // Team members in Elenco group with characterName
  const castMembers = (team || []).filter(m => m.group === 'Elenco')

  const unmatched = []
  const orphanActors = []

  // Characters without a matching team member
  for (const charName of scriptChars) {
    const hasActor = castMembers.some(m =>
      m.characterName && m.characterName.toUpperCase() === charName
    )
    if (!hasActor) {
      unmatched.push(charName)
    }
  }

  // Actors without a matching character
  for (const m of castMembers) {
    if (!m.characterName) {
      orphanActors.push({ name: m.name, reason: 'sem personagem atribuída' })
      continue
    }
    if (!scriptChars.has(m.characterName.toUpperCase())) {
      orphanActors.push({ name: m.name, character: m.characterName, reason: 'personagem não encontrada no guião' })
    }
  }

  return { unmatched, orphanActors }
}

export function ScriptDiagnostics() {
  const { parsedScripts, setParsedScripts, team } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts, setParsedScripts: s.setParsedScripts, team: s.team })))
  const epIds = Object.keys(parsedScripts || {}).sort()
  const [mergedGroups, setMergedGroups] = useState(new Set())

  const mergeLocations = useCallback((group) => {
    // Use first location name as canonical
    const canonical = group[0].original
    const allNorms = group.map(g => g.norm)
    const updated = { ...parsedScripts }
    for (const [epId, data] of Object.entries(updated)) {
      if (!data?.scenes) continue
      const newScenes = data.scenes.map(s => {
        const norm = (s.location || '').toUpperCase().trim()
          .replace(/[./]/g, '').replace(/\s+/g, ' ')
          .replace(/^(INT|EXT|INT\/EXT|EXT\/INT)\s*/i, '')
          .replace(/\s*[-–—]\s*(DIA|NOITE|AMANHECER|CREPÚSCULO|GOLDEN|TARDE|MANHÃ|ENTARDECER)\s*$/i, '')
          .trim()
        if (allNorms.includes(norm)) return { ...s, location: canonical }
        return s
      })
      updated[epId] = { ...data, scenes: newScenes }
    }
    setParsedScripts(updated)
    setMergedGroups(prev => new Set([...prev, allNorms.join('|')]))
  }, [parsedScripts, setParsedScripts])

  const allScenes = useMemo(() => {
    const scenes = []
    for (const [epId, data] of Object.entries(parsedScripts || {})) {
      for (const s of (data?.scenes || [])) {
        scenes.push({ ...s, _ep: epId })
      }
    }
    return scenes
  }, [parsedScripts])

  const { locMap, groups: dupGroups } = useMemo(() => findDuplicateLocations(allScenes), [allScenes])
  const issues = useMemo(() => diagnoseScenes(allScenes), [allScenes])
  const similarChars = useMemo(() => findSimilarCharacters(allScenes), [allScenes])
  const subLocGroups = useMemo(() => groupSubLocations(allScenes), [allScenes])
  const teamValidation = useMemo(() => crossValidateTeamScript(team, parsedScripts), [team, parsedScripts])

  // Stats
  const totalLocs = Object.keys(locMap).length
  const errors = issues.filter(i => i.type === 'error')
  const warnings = issues.filter(i => i.type === 'warning')
  const infos = issues.filter(i => i.type === 'info')

  if (epIds.length === 0) {
    return (
      <div style={S.empty}>
        <AlertTriangle size={32} color="var(--text-muted)" style={{ marginBottom: 8 }} />
        <p style={{ fontSize: 14 }}>Nenhum guião carregado</p>
        <p style={{ fontSize: 12 }}>Importa guiões no tab "Guião" para ver diagnóstico</p>
      </div>
    )
  }

  return (
    <div style={S.root}>
      {/* Summary */}
      <div style={{ ...S.card, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={S.stat}><Film size={14} /> {allScenes.length} cenas em {epIds.length} episódio{epIds.length > 1 ? 's' : ''}</div>
        <div style={S.stat}><MapPin size={14} /> {totalLocs} locais únicos</div>
        <div style={S.stat}><Merge size={14} color="#F5A623" /> {dupGroups.length} grupo{dupGroups.length !== 1 ? 's' : ''} de locais semelhantes</div>
        {errors.length > 0 && <div style={{ ...S.stat, color: '#F87171' }}><AlertTriangle size={14} /> {errors.length} erro{errors.length > 1 ? 's' : ''}</div>}
        {warnings.length > 0 && <div style={{ ...S.stat, color: '#F5A623' }}><AlertTriangle size={14} /> {warnings.length} aviso{warnings.length > 1 ? 's' : ''}</div>}
        {errors.length === 0 && warnings.length === 0 && <div style={{ ...S.stat, color: '#34D399' }}><CheckCircle size={14} /> Sem problemas graves</div>}
      </div>

      {/* Parse-level warnings from parser */}
      {(() => {
        const parseErrs = Object.values(parsedScripts || {}).flatMap(d => d?.metadata?.parseErrors || [])
        const orphans = Object.entries(parsedScripts || {}).filter(([, d]) => d?.orphanText?.length > 0)
        if (parseErrs.length === 0 && orphans.length === 0) return null
        return (
          <div style={S.section}>
            <h3 style={S.sectionTitle}>
              <AlertTriangle size={16} color="#F5A623" /> Avisos do Parser ({parseErrs.length + orphans.length})
            </h3>
            {parseErrs.map((err, i) => (
              <div key={`pe-${i}`} style={S.issue(err.type)}>
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{err.msg}</span>
              </div>
            ))}
            {orphans.map(([epId, data]) => (
              <div key={`orph-${epId}`} style={S.issue('warning')}>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{epId}</span>
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                  Texto antes da 1ª cena: "{data.orphanText[0].slice(0, 100)}{data.orphanText[0].length > 100 ? '…' : ''}"
                  {data.orphanText.length > 1 && ` (+${data.orphanText.length - 1} linha${data.orphanText.length > 2 ? 's' : ''})`}
                </span>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Duplicate locations */}
      {dupGroups.length > 0 && (
        <div style={S.section}>
          <h3 style={S.sectionTitle}>
            <Merge size={16} color="#F5A623" /> Locais semelhantes — possíveis duplicados
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Locais referenciados de forma diferente mas que podem ser o mesmo sítio. Ex: "COZINHA DO JOÃO" e "COZINHA - CASA DO JOÃO".
          </p>
          {dupGroups.map((group, gi) => {
            const groupKey = group.map(g => g.norm).join('|')
            const wasMerged = mergedGroups.has(groupKey)
            return (
              <div key={gi} style={{ ...S.group, opacity: wasMerged ? 0.5 : 1 }}>
                {group.map((loc, li) => (
                  <div key={li} style={S.locItem}>
                    <MapPin size={12} color="#F5A623" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{loc.original}</span>
                    <span style={S.badge('rgba(245,166,35,0.12)', '#F5A623')}>{loc.scenes.length} cenas</span>
                    {[...loc.intExts].map(ie => (
                      <span key={ie} style={S.badge(
                        ie === 'EXT' ? 'rgba(52,211,153,0.12)' : 'rgba(91,141,239,0.12)',
                        ie === 'EXT' ? '#34D399' : '#5B8DEF'
                      )}>{ie}</span>
                    ))}
                  </div>
                ))}
                {!wasMerged && (
                  <button
                    onClick={() => mergeLocations(group)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)',
                      color: '#F5A623', cursor: 'pointer', alignSelf: 'flex-end',
                      marginTop: 4, fontFamily: 'var(--font-body)',
                    }}
                  >
                    <Merge size={12} /> Fundir → "{group[0].original}"
                  </button>
                )}
                {wasMerged && (
                  <span style={{ fontSize: 11, color: '#34D399', alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <CheckCircle size={12} /> Fundido
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Scene issues */}
      {issues.length > 0 && (
        <div style={S.section}>
          <h3 style={S.sectionTitle}>
            <AlertTriangle size={16} color="#F87171" /> Cenas com problemas ({issues.length})
          </h3>
          {/* Errors first, then warnings, then info */}
          {[...errors, ...warnings, ...infos].map((issue, i) => (
            <div key={i} style={S.issue(issue.type)}>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                {issue.scene}
              </span>
              <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{issue.msg}</span>
              <span style={S.badge('rgba(255,255,255,0.05)', 'var(--text-muted)')}>{issue.category}</span>
            </div>
          ))}
        </div>
      )}

      {/* Similar characters */}
      {similarChars.length > 0 && (
        <div style={S.section}>
          <h3 style={S.sectionTitle}>
            <Users size={16} color="#C4A0FF" /> Personagens Semelhantes ({similarChars.length})
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Nomes de personagens que podem ser a mesma pessoa com grafias diferentes.
          </p>
          {similarChars.map((pair, i) => (
            <div key={i} style={S.issue('warning')}>
              <span style={{ fontWeight: 700 }}>"{pair.a}"</span>
              <span style={{ color: 'var(--text-muted)' }}>vs</span>
              <span style={{ fontWeight: 700 }}>"{pair.b}"</span>
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', flex: 1, textAlign: 'right' }}>{pair.reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sub-location grouping (Décors) */}
      {subLocGroups.length > 0 && (
        <div style={S.section}>
          <h3 style={S.sectionTitle}>
            <Layers size={16} color="#34D399" /> Locais Agrupados / Décors ({subLocGroups.length})
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Locais com sub-divisões detectadas (ex: "CASA DO JOÃO" com cozinha, quarto, etc.)
          </p>
          {subLocGroups.map((group, i) => (
            <div key={i} style={{ ...S.group, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                {group.parent}
                <span style={{ ...S.badge('rgba(52,211,153,0.12)', '#34D399'), marginLeft: 8 }}>{group.sceneCount} cenas</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {group.children.map((child, ci) => (
                  <span key={ci} style={{
                    padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 500,
                    background: 'rgba(52,211,153,0.08)', color: '#34D399',
                  }}>
                    {child}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team vs Script cross-validation */}
      {(teamValidation.unmatched.length > 0 || teamValidation.orphanActors.length > 0) && (
        <div style={S.section}>
          <h3 style={S.sectionTitle}>
            <UserX size={16} color="#E05B8D" /> Elenco vs Guião
          </h3>
          {teamValidation.unmatched.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Personagens sem actor atribuído:</p>
              {teamValidation.unmatched.map((name, i) => (
                <div key={`uc-${i}`} style={S.issue('warning')}>
                  <span style={{ fontWeight: 700, flex: 1 }}>{name}</span>
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>sem actor atribuído</span>
                </div>
              ))}
            </>
          )}
          {teamValidation.orphanActors.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>Actores sem personagem no guião:</p>
              {teamValidation.orphanActors.map((actor, i) => (
                <div key={`oa-${i}`} style={S.issue('info')}>
                  <span style={{ fontWeight: 700, flex: 1 }}>{actor.name}{actor.character ? ` (${actor.character})` : ''}</span>
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{actor.reason}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Location frequency table */}
      <div style={S.section}>
        <h3 style={S.sectionTitle}>
          <MapPin size={16} color="#5B8DEF" /> Todos os locais ({totalLocs})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.values(locMap)
            .sort((a, b) => b.scenes.length - a.scenes.length)
            .map((loc, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderRadius: 6, fontSize: 12,
              }}>
                <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: loc.scenes.length >= 5 ? 600 : 400 }}>
                  {loc.original}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{loc.scenes.length} cenas</span>
                {[...loc.intExts].map(ie => (
                  <span key={ie} style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                    background: ie === 'EXT' ? 'rgba(52,211,153,0.1)' : 'rgba(91,141,239,0.1)',
                    color: ie === 'EXT' ? '#34D399' : '#5B8DEF',
                  }}>{ie}</span>
                ))}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
