// EpisodeComparator — compare episodes side by side
// Metrics, character analysis, dramatic arc, AI deep analysis
// Crosses with bible, forces, universe data

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { fetchAPI } from '../../core/api.js'
import { Loader, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react'
import styles from './EpisodeComparator.module.css'

// ── Helpers ─────────────────────────────────────────────────
function countWords(text) { return (text || '').split(/\s+/).filter(Boolean).length }

function extractEpMetrics(parsed) {
  if (!parsed?.scenes?.length) return null
  const scenes = parsed.scenes
  const chars = new Map()
  let totalWords = 0, totalDialogueWords = 0, intCount = 0, extCount = 0
  let dayCount = 0, nightCount = 0, dialogueLines = 0, questions = 0
  const locations = new Set()
  const sceneTypes = {}

  for (const sc of scenes) {
    // INT/EXT
    const hdr = (sc.heading || sc.slugline || '').toUpperCase()
    if (hdr.includes('INT')) intCount++
    if (hdr.includes('EXT')) extCount++
    if (hdr.includes('NOITE') || hdr.includes('NIGHT')) nightCount++
    else dayCount++

    // Location
    const loc = sc.location || hdr.replace(/^(INT|EXT)[\s./]+/i, '').split(' - ')[0].trim()
    if (loc) locations.add(loc)

    // Scene type
    const type = sc.type || 'outro'
    sceneTypes[type] = (sceneTypes[type] || 0) + 1

    // Characters & dialogue
    for (const el of (sc.elements || sc.dialogue || [])) {
      if (el.type === 'dialogue' || el.character) {
        const name = (el.character || el.name || '').toUpperCase()
        if (!name) continue
        const words = countWords(el.text || el.content || '')
        if (!chars.has(name)) chars.set(name, { lines: 0, words: 0, scenes: new Set() })
        const c = chars.get(name)
        c.lines++; c.words += words; c.scenes.add(sc.id || sc.number)
        totalDialogueWords += words
        dialogueLines++
        if ((el.text || el.content || '').includes('?')) questions++
      }
      totalWords += countWords(el.text || el.content || '')
    }

    // Also check sc.characters array
    for (const ch of (sc.characters || [])) {
      const name = (typeof ch === 'string' ? ch : ch.name || '').toUpperCase()
      if (!name) continue
      if (!chars.has(name)) chars.set(name, { lines: 0, words: 0, scenes: new Set() })
      chars.get(name).scenes.add(sc.id || sc.number)
    }
  }

  // Duration estimate (minutes)
  let duration = 0
  for (const sc of scenes) {
    const type = sc.type || 'diálogo'
    const durMap = { âncora: 75, grupo: 50, diálogo: 45, gag: 35, solo: 30, transição: 25 }
    duration += (durMap[type] || 40) / 60
  }

  // Top characters by lines
  const charList = [...chars.entries()]
    .map(([name, data]) => ({ name, ...data, scenes: data.scenes.size }))
    .sort((a, b) => b.words - a.words)

  return {
    sceneCount: scenes.length,
    charCount: chars.size,
    totalWords,
    totalDialogueWords,
    dialogueLines,
    questions,
    questionRate: dialogueLines > 0 ? questions / dialogueLines : 0,
    intCount, extCount, dayCount, nightCount,
    locationCount: locations.size,
    locations: [...locations],
    sceneTypes,
    duration: Math.round(duration),
    charList,
    // For radar
    dialogueDensity: scenes.length > 0 ? totalDialogueWords / scenes.length : 0,
    avgCharsPerScene: scenes.length > 0 ? [...chars.values()].reduce((sum, c) => sum + c.scenes.size, 0) / scenes.length : 0,
    pacing: scenes.length > 0 ? duration / scenes.length : 0,
  }
}

// ── Bar Chart (canvas) ──────────────────────────────────────
function CompareBarChart({ label, valueA, valueB, nameA, nameB, format }) {
  const max = Math.max(valueA, valueB, 1)
  const fmt = format || (v => v)
  const pctA = (valueA / max) * 100
  const pctB = (valueB / max) * 100
  const diff = valueA > 0 ? ((valueB - valueA) / valueA * 100).toFixed(0) : '—'
  const DiffIcon = valueB > valueA ? TrendingUp : valueB < valueA ? TrendingDown : Minus
  const diffColor = valueB > valueA ? '#34d399' : valueB < valueA ? '#f87171' : '#94a3b8'

  return (
    <div className={styles.barGroup}>
      <div className={styles.barLabel}>{label}</div>
      <div className={styles.barPair}>
        <div className={styles.barRow}>
          <span className={styles.barEpName}>{nameA}</span>
          <div className={styles.barTrack}>
            <div className={styles.barFillA} style={{ width: `${pctA}%` }} />
          </div>
          <span className={styles.barValue}>{fmt(valueA)}</span>
        </div>
        <div className={styles.barRow}>
          <span className={styles.barEpName}>{nameB}</span>
          <div className={styles.barTrack}>
            <div className={styles.barFillB} style={{ width: `${pctB}%` }} />
          </div>
          <span className={styles.barValue}>{fmt(valueB)}</span>
        </div>
      </div>
      <div className={styles.barDiff} style={{ color: diffColor }}>
        <DiffIcon size={12} /> {diff}%
      </div>
    </div>
  )
}

// ── Radar Chart (canvas) ─────────────────────────────────────
function RadarChart({ metricsA, metricsB, nameA, nameB }) {
  const canvasRef = useRef(null)
  const axes = [
    { key: 'sceneCount', label: 'Cenas', max: 0 },
    { key: 'dialogueDensity', label: 'Diálogo', max: 0 },
    { key: 'charCount', label: 'Personagens', max: 0 },
    { key: 'locationCount', label: 'Locais', max: 0 },
    { key: 'questionRate', label: 'Perguntas', max: 1 },
    { key: 'avgCharsPerScene', label: 'Densidade', max: 0 },
  ]

  // Auto-max
  for (const ax of axes) {
    if (ax.max === 0) ax.max = Math.max(metricsA[ax.key] || 0, metricsB[ax.key] || 0, 1) * 1.2
  }

  const draw = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const size = 280
    cv.width = size * dpr; cv.height = size * dpr
    cv.style.width = size + 'px'; cv.style.height = size + 'px'
    cx.scale(dpr, dpr)

    const center = size / 2
    const R = size * 0.38
    const n = axes.length

    cx.clearRect(0, 0, size, size)

    // Grid
    for (let ring = 1; ring <= 4; ring++) {
      const r = R * ring / 4
      cx.beginPath()
      for (let i = 0; i <= n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        const px = center + Math.cos(angle) * r
        const py = center + Math.sin(angle) * r
        i === 0 ? cx.moveTo(px, py) : cx.lineTo(px, py)
      }
      cx.closePath()
      cx.strokeStyle = 'rgba(255,255,255,0.06)'
      cx.lineWidth = 1; cx.stroke()
    }

    // Axis lines + labels
    cx.font = '500 10px "DM Sans", sans-serif'
    cx.textAlign = 'center'; cx.textBaseline = 'middle'
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2
      const px = center + Math.cos(angle) * R
      const py = center + Math.sin(angle) * R
      cx.beginPath(); cx.moveTo(center, center); cx.lineTo(px, py)
      cx.strokeStyle = 'rgba(255,255,255,0.08)'; cx.lineWidth = 1; cx.stroke()

      const lx = center + Math.cos(angle) * (R + 18)
      const ly = center + Math.sin(angle) * (R + 18)
      cx.fillStyle = 'rgba(255,255,255,0.45)'
      cx.fillText(axes[i].label, lx, ly)
    }

    // Draw polygon helper
    function drawPoly(metrics, color, alpha) {
      cx.beginPath()
      for (let i = 0; i <= n; i++) {
        const idx = i % n
        const angle = (Math.PI * 2 * idx) / n - Math.PI / 2
        const val = Math.min(1, (metrics[axes[idx].key] || 0) / axes[idx].max)
        const px = center + Math.cos(angle) * R * val
        const py = center + Math.sin(angle) * R * val
        i === 0 ? cx.moveTo(px, py) : cx.lineTo(px, py)
      }
      cx.closePath()
      cx.fillStyle = color.replace('1)', alpha + ')')
      cx.fill()
      cx.strokeStyle = color; cx.lineWidth = 2; cx.stroke()
    }

    // EP A — purple
    drawPoly(metricsA, 'rgba(139,92,246,1)', 0.12)
    // EP B — teal
    drawPoly(metricsB, 'rgba(20,184,166,1)', 0.12)

    // Dots
    for (const [metrics, color] of [[metricsA, '#8b5cf6'], [metricsB, '#14b8a6']]) {
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        const val = Math.min(1, (metrics[axes[i].key] || 0) / axes[i].max)
        const px = center + Math.cos(angle) * R * val
        const py = center + Math.sin(angle) * R * val
        cx.beginPath(); cx.arc(px, py, 3.5, 0, Math.PI * 2)
        cx.fillStyle = color; cx.fill()
        cx.strokeStyle = '#fff'; cx.lineWidth = 1.5; cx.stroke()
      }
    }
  }, [metricsA, metricsB, axes])

  useEffect(() => { draw() }, [draw])

  return (
    <div className={styles.radarWrap}>
      <canvas ref={canvasRef} />
      <div className={styles.radarLegend}>
        <span className={styles.radarDotA} /> {nameA}
        <span className={styles.radarDotB} /> {nameB}
      </div>
    </div>
  )
}

// ── Character Venn ───────────────────────────────────────────
function CharacterVenn({ charsA, charsB, nameA, nameB }) {
  const setA = new Set(charsA.map(c => c.name))
  const setB = new Set(charsB.map(c => c.name))
  const common = [...setA].filter(n => setB.has(n))
  const onlyA = [...setA].filter(n => !setB.has(n))
  const onlyB = [...setB].filter(n => !setA.has(n))

  return (
    <div className={styles.vennWrap}>
      <div className={styles.vennCol}>
        <div className={styles.vennHeader} style={{ color: '#8b5cf6' }}>Só {nameA}</div>
        {onlyA.length === 0 && <span className={styles.vennEmpty}>—</span>}
        {onlyA.map(n => <span key={n} className={styles.vennChip} style={{ borderColor: '#8b5cf644' }}>{n}</span>)}
      </div>
      <div className={styles.vennCol}>
        <div className={styles.vennHeader} style={{ color: '#94a3b8' }}>Ambos ({common.length})</div>
        {common.map(n => <span key={n} className={styles.vennChip} style={{ borderColor: '#94a3b844' }}>{n}</span>)}
      </div>
      <div className={styles.vennCol}>
        <div className={styles.vennHeader} style={{ color: '#14b8a6' }}>Só {nameB}</div>
        {onlyB.length === 0 && <span className={styles.vennEmpty}>—</span>}
        {onlyB.map(n => <span key={n} className={styles.vennChip} style={{ borderColor: '#14b8a644' }}>{n}</span>)}
      </div>
    </div>
  )
}

// ── Character Words Comparison ───────────────────────────────
function CharWordsBars({ charsA, charsB, nameA, nameB }) {
  // Merge characters, compare word counts
  const merged = new Map()
  for (const c of charsA) merged.set(c.name, { a: c.words, b: 0 })
  for (const c of charsB) {
    const e = merged.get(c.name) || { a: 0, b: 0 }
    e.b = c.words
    merged.set(c.name, e)
  }
  const sorted = [...merged.entries()]
    .map(([name, { a, b }]) => ({ name, a, b, total: a + b }))
    .sort((x, y) => y.total - x.total)
    .slice(0, 12)

  const max = Math.max(...sorted.map(s => Math.max(s.a, s.b)), 1)

  return (
    <div className={styles.charBarsWrap}>
      {sorted.map(c => (
        <div key={c.name} className={styles.charBarRow}>
          <span className={styles.charBarName}>{c.name}</span>
          <div className={styles.charBarDual}>
            <div className={styles.charBarTrack}>
              <div className={styles.barFillA} style={{ width: `${(c.a / max) * 100}%` }} />
            </div>
            <div className={styles.charBarTrack}>
              <div className={styles.barFillB} style={{ width: `${(c.b / max) * 100}%` }} />
            </div>
          </div>
          <div className={styles.charBarNums}>
            <span style={{ color: '#a78bfa' }}>{c.a}</span>
            <span style={{ color: '#5eead4' }}>{c.b}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════

export function EpisodeComparator() {
  const {  parsedScripts, apiKey, universe  } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts, apiKey: s.apiKey, universe: s.universe })))
  const episodes = Object.keys(parsedScripts || {}).sort()

  const [epA, setEpA] = useState(episodes[0] || '')
  const [epB, setEpB] = useState(episodes[1] || '')
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  // Update defaults when episodes change
  useEffect(() => {
    if (!epA && episodes.length > 0) setEpA(episodes[0])
    if (!epB && episodes.length > 1) setEpB(episodes[1])
  }, [episodes.length])

  const metricsA = useMemo(() => extractEpMetrics(parsedScripts?.[epA]), [epA, parsedScripts])
  const metricsB = useMemo(() => extractEpMetrics(parsedScripts?.[epB]), [epB, parsedScripts])

  // AI deep analysis
  const runAiAnalysis = async () => {
    if (!apiKey || !metricsA || !metricsB) return
    setAiLoading(true); setAiError(null); setAiAnalysis(null)

    // Build context from universe
    const bible = universe?.bible || {}
    const forces = (universe?.forces || []).map(f => `${f.num}. ${f.title}: ${f.text}`).join('\n')
    const glossary = (universe?.glossary || []).map(g => `${g.term}: ${g.definition}`).join('\n')
    const uChars = (universe?.chars || []).map(c => `${c.name} (${c.arcType}) — ${c.description || ''}`).join('\n')

    const sceneSummaryA = (parsedScripts[epA]?.scenes || []).slice(0, 25).map((s, i) =>
      `${i + 1}. ${s.heading || s.slugline || '?'} — ${(s.characters || []).slice(0, 5).map(c => typeof c === 'string' ? c : c.name).join(', ')}`
    ).join('\n')
    const sceneSummaryB = (parsedScripts[epB]?.scenes || []).slice(0, 25).map((s, i) =>
      `${i + 1}. ${s.heading || s.slugline || '?'} — ${(s.characters || []).slice(0, 5).map(c => typeof c === 'string' ? c : c.name).join(', ')}`
    ).join('\n')

    const prompt = `Analisa comparativamente estes dois episódios de uma série.

## ${epA}
Cenas: ${metricsA.sceneCount}, Personagens: ${metricsA.charCount}, Palavras diálogo: ${metricsA.totalDialogueWords}
Top personagens: ${metricsA.charList.slice(0, 8).map(c => `${c.name}(${c.words}pal)`).join(', ')}
Cenas:
${sceneSummaryA}

## ${epB}
Cenas: ${metricsB.sceneCount}, Personagens: ${metricsB.charCount}, Palavras diálogo: ${metricsB.totalDialogueWords}
Top personagens: ${metricsB.charList.slice(0, 8).map(c => `${c.name}(${c.words}pal)`).join(', ')}
Cenas:
${sceneSummaryB}

${bible.logline ? `## Bíblia da série\nLogline: ${bible.logline}\nGénero: ${bible.genre}\nTom: ${bible.tone}\nTemas: ${bible.themes}` : ''}
${forces ? `## Forças/Regras do Universo\n${forces}` : ''}
${uChars ? `## Personagens do Universo\n${uChars}` : ''}
${glossary ? `## Glossário\n${glossary}` : ''}

Responde em JSON com esta estrutura exacta:
{
  "strengths": ["força 1", "força 2", ...],
  "weaknesses": ["fraqueza 1", "fraqueza 2", ...],
  "characterIssues": [
    { "char": "NOME", "issue": "descrição do problema", "severity": "alta|média|baixa" }
  ],
  "continuityIssues": [
    { "description": "descrição", "episodes": ["${epA}", "${epB}"], "severity": "alta|média|baixa" }
  ],
  "pacingNotes": "análise de ritmo comparativo",
  "narrativeArc": "como o arco narrativo evolui entre os dois episódios",
  "recommendations": ["recomendação 1", "recomendação 2", ...]
}`

    try {
      const text = await fetchAPI({ apiKey, messages: [{ role: 'user', content: prompt }], maxTokens: 3000 })
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Resposta sem JSON válido')
      setAiAnalysis(JSON.parse(match[0]))
    } catch (err) {
      setAiError(err.message)
    }
    setAiLoading(false)
  }

  // ── Render ──────────────────────────────────────────────────
  if (episodes.length < 2) {
    return (
      <div className={styles.empty}>
        <AlertTriangle size={32} style={{ opacity: 0.3 }} />
        <p>Precisas de pelo menos 2 episódios importados para comparar.</p>
        <small>Vai ao tab "Guião" e importa os ficheiros FDX.</small>
      </div>
    )
  }

  const ready = metricsA && metricsB && epA !== epB

  return (
    <div className={styles.wrapper}>
      {/* Selector */}
      <div className={styles.selectorRow}>
        <div className={styles.selectorGroup}>
          <label className={styles.selectorLabel} style={{ color: '#a78bfa' }}>Episódio A</label>
          <div className={styles.selectWrap}>
            <select className={styles.select} value={epA} onChange={e => setEpA(e.target.value)} style={{ borderColor: '#8b5cf644' }}>
              {episodes.map(ep => <option key={ep} value={ep}>{ep}</option>)}
            </select>
            <ChevronDown size={14} className={styles.selectIcon} />
          </div>
        </div>

        <div className={styles.vsLabel}>vs</div>

        <div className={styles.selectorGroup}>
          <label className={styles.selectorLabel} style={{ color: '#5eead4' }}>Episódio B</label>
          <div className={styles.selectWrap}>
            <select className={styles.select} value={epB} onChange={e => setEpB(e.target.value)} style={{ borderColor: '#14b8a644' }}>
              {episodes.map(ep => <option key={ep} value={ep}>{ep}</option>)}
            </select>
            <ChevronDown size={14} className={styles.selectIcon} />
          </div>
        </div>

        {apiKey && ready && (
          <button className={styles.aiBtn} onClick={runAiAnalysis} disabled={aiLoading}>
            {aiLoading ? <Loader size={14} className={styles.spin} /> : <CheckCircle2 size={14} />}
            Análise Profunda IA
          </button>
        )}
      </div>

      {epA === epB && (
        <div className={styles.warning}>Selecciona episódios diferentes para comparar.</div>
      )}

      {ready && (
        <>
          {/* ── Metrics cards ──────────────────────────────────── */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Métricas Gerais</h3>
            <div className={styles.barsGrid}>
              <CompareBarChart label="Cenas" valueA={metricsA.sceneCount} valueB={metricsB.sceneCount} nameA={epA} nameB={epB} />
              <CompareBarChart label="Personagens" valueA={metricsA.charCount} valueB={metricsB.charCount} nameA={epA} nameB={epB} />
              <CompareBarChart label="Palavras (diálogo)" valueA={metricsA.totalDialogueWords} valueB={metricsB.totalDialogueWords} nameA={epA} nameB={epB} format={v => v.toLocaleString('pt-PT')} />
              <CompareBarChart label="Falas" valueA={metricsA.dialogueLines} valueB={metricsB.dialogueLines} nameA={epA} nameB={epB} />
              <CompareBarChart label="Locais" valueA={metricsA.locationCount} valueB={metricsB.locationCount} nameA={epA} nameB={epB} />
              <CompareBarChart label="INT / EXT" valueA={metricsA.intCount} valueB={metricsB.intCount} nameA={`${epA} INT`} nameB={`${epB} INT`} />
            </div>
          </div>

          {/* ── Radar ──────────────────────────────────────────── */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Perfil Comparativo</h3>
            <RadarChart metricsA={metricsA} metricsB={metricsB} nameA={epA} nameB={epB} />
          </div>

          {/* ── Characters ─────────────────────────────────────── */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Personagens — Presença</h3>
            <CharacterVenn charsA={metricsA.charList} charsB={metricsB.charList} nameA={epA} nameB={epB} />
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Personagens — Palavras</h3>
            <CharWordsBars charsA={metricsA.charList} charsB={metricsB.charList} nameA={epA} nameB={epB} />
          </div>

          {/* ── AI Analysis ────────────────────────────────────── */}
          {aiError && <div className={styles.aiError}>{aiError}</div>}

          {aiAnalysis && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Análise Profunda — IA</h3>

              <div className={styles.aiGrid}>
                {/* Strengths */}
                <div className={styles.aiCard}>
                  <div className={styles.aiCardTitle} style={{ color: '#34d399' }}>Forças</div>
                  <ul className={styles.aiList}>
                    {(aiAnalysis.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className={styles.aiCard}>
                  <div className={styles.aiCardTitle} style={{ color: '#f87171' }}>Fraquezas</div>
                  <ul className={styles.aiList}>
                    {(aiAnalysis.weaknesses || []).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>

                {/* Character Issues */}
                {(aiAnalysis.characterIssues || []).length > 0 && (
                  <div className={styles.aiCard} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.aiCardTitle} style={{ color: '#fbbf24' }}>Problemas de Personagem</div>
                    {aiAnalysis.characterIssues.map((ci, i) => (
                      <div key={i} className={styles.aiIssue}>
                        <span className={styles.aiIssueSev} data-sev={ci.severity}>{ci.severity}</span>
                        <strong>{ci.char}</strong>: {ci.issue}
                      </div>
                    ))}
                  </div>
                )}

                {/* Continuity Issues */}
                {(aiAnalysis.continuityIssues || []).length > 0 && (
                  <div className={styles.aiCard} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.aiCardTitle} style={{ color: '#f59e0b' }}>Continuidade</div>
                    {aiAnalysis.continuityIssues.map((ci, i) => (
                      <div key={i} className={styles.aiIssue}>
                        <span className={styles.aiIssueSev} data-sev={ci.severity}>{ci.severity}</span>
                        {ci.description}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pacing + Arc */}
                <div className={styles.aiCard}>
                  <div className={styles.aiCardTitle}>Ritmo</div>
                  <p className={styles.aiText}>{aiAnalysis.pacingNotes}</p>
                </div>
                <div className={styles.aiCard}>
                  <div className={styles.aiCardTitle}>Arco Narrativo</div>
                  <p className={styles.aiText}>{aiAnalysis.narrativeArc}</p>
                </div>

                {/* Recommendations */}
                <div className={styles.aiCard} style={{ gridColumn: '1 / -1' }}>
                  <div className={styles.aiCardTitle} style={{ color: '#a78bfa' }}>Recomendações</div>
                  <ul className={styles.aiList}>
                    {(aiAnalysis.recommendations || []).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
