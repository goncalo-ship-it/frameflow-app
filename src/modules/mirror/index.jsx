// Espelho do Realizador — chat com API Anthropic
// Contexto: universo, guiões, equipa, locais, planeamento

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, X, RotateCcw, Copy, Film, Users, MapPin,
  Calendar, BookOpen, Sparkles, AlertTriangle, Check, Globe,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { fetchAPI } from '../../core/api.js'
import { SmartInput } from '../../components/shared/SmartInput.jsx'
import styles from './Mirror.module.css'

// ── Compressed system prompt builder ──────────────────────────────
function buildSystemPrompt(ctx) {
  const { projectName, parsedCharacters, parsedLocations, parsedScripts, team, locations, shootingDays, preProduction, universe,
    budgets, sceneAssignments, sceneTakes, departmentItems, continuityData, continuityDecisions, suggestions } = ctx

  const parts = []

  // ── Header ──
  parts.push(`És o Espelho do Realizador para "${projectName}". Consultor criativo e de produção para séries de ficção portuguesa. Tens contexto completo da produção. Responde em PT-PT, directo e prático.`)

  // ── Episódios & Cenas (digest) ──
  const epKeys = Object.keys(parsedScripts)
  const totalScenes = Object.values(parsedScripts).reduce((s, d) => s + (d.scenes?.length || 0), 0)
  parts.push(`\nPRODUÇÃO: ${projectName} | ${epKeys.length || 0} episódios (${epKeys.join(', ') || '-'}) | ${totalScenes} cenas`)

  // Script locations digest
  const allScriptLocs = new Set()
  Object.values(parsedScripts).forEach(d => (d.scenes || []).forEach(s => s.location && allScriptLocs.add(s.location)))
  if (allScriptLocs.size > 0) parts.push(`Locais guião: ${[...allScriptLocs].slice(0, 15).join(', ')}`)

  // ── Parsed characters: name (N cenas) ──
  if (parsedCharacters.length > 0) {
    parts.push(`Personagens guião: ${parsedCharacters.slice(0, 30).map(c => `${c.name}(${c.scenes?.length || 0})`).join(', ')}`)
  }

  // ── Locations: "Name (type, status)" ──
  if (locations.length > 0) {
    parts.push(`\nLOCAIS:\n${locations.map(l => `${l.name} (${l.type || '?'}, ${l.status || '?'})`).join('\n')}`)
  }

  // ── Team: "Name — Role (Group)" ──
  if (team.length > 0) {
    parts.push(`\nEQUIPA:\n${team.map(m => {
      const r = [m.role, m.group].filter(Boolean).join(', ')
      return `${m.name}${r ? ' — ' + r : ''}`
    }).join('\n')}`)
  }

  // ── Casting status (compact) ──
  const castEntries = Object.entries(preProduction?.castingStatus || {})
  if (castEntries.length > 0) {
    parts.push(`Casting: ${castEntries.slice(0, 15).map(([n, s]) => `${n}:${s}`).join(', ')}`)
  }

  // ── Shooting days: "Day N: date, X scenes" ──
  if (shootingDays.length > 0) {
    const assignments = sceneAssignments || {}
    parts.push(`\nRODAGEM: ${shootingDays.length} dias (${shootingDays[0]?.date || '?'} → ${shootingDays[shootingDays.length - 1]?.date || '?'})`)
    parts.push(shootingDays.map((day, i) => {
      const count = Object.values(assignments).filter(did => did === day.id).length
      return `D${i + 1} ${day.date || '?'}: ${count} cenas`
    }).join('\n'))
  }

  // ── Universe ──
  const uni = universe || {}

  // Bible (compact)
  const bible = uni.bible || {}
  const bibleHeader = [bible.logline, bible.genre && `Género:${bible.genre}`, bible.tone && `Tom:${bible.tone}`, bible.themes && `Temas:${bible.themes}`].filter(Boolean)
  if (bibleHeader.length > 0) {
    parts.push(`\nBIBLE: ${bibleHeader.join(' | ')}`)
    if (bible.text) parts.push(bible.text.slice(0, 200))
    if (bible.sections?.length > 0) {
      parts.push(bible.sections.map(s => `[${s.title}] ${(s.text || '').slice(0, 100)}`).join('\n'))
    }
  }

  // Universe characters: name + arcType + group only
  if (uni.chars?.length > 0) {
    parts.push(`\nPERSONAGENS:\n${uni.chars.slice(0, 40).map(c => {
      const g = c.group ? ` [${c.group}]` : ''
      return `${c.name} (${c.arcType || '?'})${g}`
    }).join('\n')}`)
  }

  // Relations: "A→B (type)" one per line
  if (uni.relations?.length > 0) {
    const charMap = Object.fromEntries((uni.chars || []).map(c => [c.id, c.name]))
    parts.push(`\nRELAÇÕES:\n${uni.relations.slice(0, 40).map(r =>
      `${charMap[r.from] || r.from}→${charMap[r.to] || r.to} (${r.type})`
    ).join('\n')}`)
  }

  // Forces: name + description truncated to 80 chars
  if (uni.forces?.length > 0) {
    parts.push(`\nFORÇAS:\n${uni.forces.map(f =>
      `${f.num}. ${f.title}: ${(f.text || '').slice(0, 80)}`
    ).join('\n')}`)
  }

  // Episode arcs: "Ep N: phase, desire" one per line
  if (uni.episodeArcs?.length > 0) {
    parts.push(`\nARCOS:\n${uni.episodeArcs.map(a =>
      `EP${String(a.epNum).padStart(2, '0')}: ${a.phase}, ${a.desire || '-'}`
    ).join('\n')}`)
  }

  // Glossary: keep as-is (usually small)
  if (uni.glossary?.length > 0) {
    parts.push(`\nGLOSSÁRIO:\n${uni.glossary.slice(0, 30).map(g =>
      `${g.term}: ${(g.definition || '').slice(0, 100)}`
    ).join('\n')}`)
  }

  // Writers room decisions: only open/undecided
  const openDecisions = (uni.decisions || []).filter(d => d.status === 'open')
  if (openDecisions.length > 0) {
    parts.push(`\nDECISÕES ABERTAS:\n${openDecisions.map(d =>
      `${d.title} (${d.urgency}): ${(d.description || '').slice(0, 80)} [${(d.options || []).length} opções]`
    ).join('\n')}`)
  }

  // Files: name + tags only, NO extractedText
  if (uni.files?.length > 0) {
    parts.push(`\nFICHEIROS: ${uni.files.length} carregados\n${uni.files.slice(0, 20).map(f =>
      `${f.filename} (${f.type})${f.tags?.length ? ' #' + f.tags.join(' #') : ''}`
    ).join('\n')}`)
  }

  // ── Budget: category totals only ──
  const ab = (budgets || []).find(b => b.status === 'approved') || (budgets || [])[0]
  if (ab) {
    const lines = ab.lines || []
    const catTotals = {}
    lines.forEach(l => {
      if (l.categoria === 13) return
      const val = Math.round((l.valorUnitario || 0) * (l.quantidade || 1) * (l.dias || 1))
      catTotals[l.categoria] = (catTotals[l.categoria] || 0) + val
    })
    const totalSIVA = Object.values(catTotals).reduce((s, v) => s + v, 0)
    const funded = ab.funded || 0
    const gap = totalSIVA - funded
    parts.push(`\nORÇAMENTO "${ab.numero || 'draft'}" (${ab.status}):`)
    parts.push(Object.entries(catTotals).map(([cat, val]) => `Cat.${cat}: €${(val / 100).toLocaleString('pt-PT')}`).join(' | '))
    parts.push(`Total s/IVA: €${(totalSIVA / 100).toLocaleString('pt-PT')}${funded ? ` | Financiado: €${(funded / 100).toLocaleString('pt-PT')} | Gap: €${(gap / 100).toLocaleString('pt-PT')}` : ''}`)
  }

  // ── Departments: group by dept, count + approved/pending ──
  if (departmentItems?.length > 0) {
    const byDept = {}
    departmentItems.forEach(item => {
      if (!byDept[item.department]) byDept[item.department] = { total: 0, approved: 0 }
      byDept[item.department].total++
      if (item.approved) byDept[item.department].approved++
    })
    parts.push(`\nDEPARTAMENTOS:\n${Object.entries(byDept).map(([d, c]) =>
      `${d}: ${c.total} items (${c.approved} aprovados, ${c.total - c.approved} pendentes)`
    ).join('\n')}`)
  }

  // ── Continuity: coverage percentage only ──
  if (totalScenes > 0) {
    const filled = Object.keys(continuityData || {}).filter(k => {
      const d = (continuityData || {})[k]
      return d && ['wardrobe', 'props', 'makeup', 'notes'].some(c => (d[c] || '').trim())
    }).length
    const pct = Math.round((filled / totalScenes) * 100)
    const criticalDecs = (continuityDecisions || []).filter(d => d.importance === 'critical').length
    parts.push(`\nCONTINUIDADE: ${pct}% cobertura (${filled}/${totalScenes} cenas)${criticalDecs > 0 ? ` | ${criticalDecs} decisões CRÍTICAS` : ''}`)
  }

  // ── Suggestions: last 5 pending only ──
  const pending = (suggestions || []).filter(s => s.status === 'pending')
  if (pending.length > 0) {
    parts.push(`\nSUGESTÕES PENDENTES (${pending.length}):\n${pending.slice(-5).map(s =>
      `[${s.source}→${s.target}] ${s.title}`
    ).join('\n')}`)
  }

  // ── Capabilities ──
  parts.push(`\nPodes: analisar decisões criativas, resolver desafios de produção, responder sobre personagens/cenas/continuidade, conflitos de schedule, cenas problemáticas, riscos, decisões Writers' Room, cruzar ficheiros com universo. Pede esclarecimentos quando precisares.`)

  return parts.join('\n')
}

// ── Sugestões rápidas ─────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: 'Análise de risco', prompt: 'Quais são os maiores riscos desta produção com base no que sabes?' },
  { label: 'Cenas problemáticas', prompt: 'Que cenas dos guiões identificas como mais difíceis de filmar?' },
  { label: 'Casting insights', prompt: 'Com base nas personagens, que perfil de actor idealizas para cada protagonista?' },
  { label: 'Ordem de rodagem', prompt: 'Que cenas deviam ser filmadas primeiro, e porquê?' },
  { label: 'Locais alternativos', prompt: 'Se um dos locais ficar indisponível, que alternativas sugerias?' },
  { label: 'Arcos dramáticos', prompt: 'Como descreves os arcos dramáticos principais desta série?' },
]

// ── Componente de mensagem ────────────────────────────────────────
function Message({ msg, onSaveToUniverse }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const isUser = msg.role === 'user'

  const copy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const saveToUniverse = () => {
    onSaveToUniverse?.(msg)
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  return (
    <motion.div className={`${styles.msg} ${isUser ? styles.msgUser : styles.msgAssistant}`}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {!isUser && (
        <div className={styles.msgHeader}>
          <Sparkles size={14} color="var(--mod-mirror, #9B59B6)" />
          <span className={styles.msgSender}>Espelho</span>
          <button className={styles.copyBtn} onClick={copy} title="Copiar">
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
          <button className={styles.copyBtn} onClick={saveToUniverse} title="Guardar no Universo">
            {saved ? <Check size={11} color="var(--health-green)" /> : <Globe size={11} />}
          </button>
        </div>
      )}
      <div className={styles.msgBody}>
        {msg.content?.split('\n').map((line, i) => (
          line ? <p key={i}>{line}</p> : <br key={i} />
        ))}
      </div>
    </motion.div>
  )
}

// ── Módulo principal ──────────────────────────────────────────────
export function MirrorModule() {
  const store = useStore(useShallow(s => ({
    apiKey: s.apiKey, projectName: s.projectName, parsedCharacters: s.parsedCharacters,
    parsedLocations: s.parsedLocations, parsedScripts: s.parsedScripts, team: s.team,
    locations: s.locations, shootingDays: s.shootingDays, preProduction: s.preProduction,
    universe: s.universe, budgets: s.budgets, sceneAssignments: s.sceneAssignments,
    sceneTakes: s.sceneTakes, departmentItems: s.departmentItems,
    continuityData: s.continuityData, continuityDecisions: s.continuityDecisions,
    suggestions: s.suggestions, addUniverseFile: s.addUniverseFile,
  })))
  const { apiKey, projectName, addUniverseFile } = store

  const saveToUniverse = (msg) => {
    const timestamp = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    addUniverseFile({
      id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      filename: `Espelho — ${timestamp}.md`,
      type: 'text',
      extractedText: msg.content,
      uploadedAt: Date.now(),
      tags: ['espelho', 'ai'],
      linkedTo: null,
      notes: '',
      source: 'mirror',
    })
  }

  // ── Memoized system prompt — only rebuilds when store data changes ──
  const systemPrompt = useMemo(() => {
    return buildSystemPrompt(store)
  }, [
    store.projectName, store.parsedCharacters, store.parsedLocations, store.parsedScripts,
    store.team, store.locations, store.shootingDays, store.preProduction, store.universe,
    store.budgets, store.sceneAssignments, store.sceneTakes, store.departmentItems,
    store.continuityData, store.continuityDecisions, store.suggestions,
  ])

  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [contextOpen, setContextOpen] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Mensagem de boas-vindas
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 0,
        role: 'assistant',
        content: `Olá! Sou o Espelho do Realizador para "${projectName}".\n\nTenho acesso ao universo completo desta produção — guiões, personagens, locais, equipa e planeamento.\n\nO que queres explorar hoje?`,
      }])
    }
  }, [])

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return
    if (!apiKey) {
      setError('Precisas de uma chave API Anthropic. Abre a sidebar (botão ☰) para a adicionar.')
      return
    }

    const userMsg = { id: Date.now(), role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const apiMessages = newMessages
        .filter(m => m.role !== 'system')
        .slice(-10)  // últimas 10 mensagens — poupa tokens em conversas longas
        .map(m => ({ role: m.role, content: m.content }))

      const reply = await fetchAPI({
        apiKey,
        system: systemPrompt,
        messages: apiMessages,
        maxTokens: 1500,
        cache: false,
      })
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply }])
    } catch (err) {
      setError(`Erro: ${err.message}`)
    }
    setLoading(false)
  }

  const clear = () => {
    if (window.confirm('Limpar conversa?')) {
      setMessages([{
        id: Date.now(),
        role: 'assistant',
        content: `Conversa reiniciada. Como posso ajudar com "${projectName}"?`,
      }])
    }
  }

  const episodeCount = Object.keys(store.parsedScripts).length
  const sceneCount   = Object.values(store.parsedScripts).reduce((s, d) => s + (d.scenes?.length || 0), 0)

  return (
    <div className={styles.root} data-glass>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Espelho do Realizador</h2>
          <p className={styles.sub}>{projectName} · IA com contexto completo da produção</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Contexto summary */}
          <div className={styles.contextChips}>
            <span className={styles.ctxChip}><Film size={11} /> {episodeCount} ep · {sceneCount} cenas</span>
            <span className={styles.ctxChip}><Users size={11} /> {store.team.length} equipa</span>
            <span className={styles.ctxChip}><MapPin size={11} /> {store.locations.length} locais</span>
            <span className={styles.ctxChip}><Calendar size={11} /> {store.shootingDays.length} dias</span>
            {store.departmentItems.length > 0 && <span className={styles.ctxChip}>🎨 {store.departmentItems.length} dept</span>}
            {store.budgets.length > 0 && <span className={styles.ctxChip}>💰 {store.budgets.length} orç</span>}
          </div>
          <button className={styles.clearBtn} onClick={clear} title="Limpar conversa"><RotateCcw size={15}/></button>
        </div>
      </div>

      {/* Aviso sem API key */}
      {!apiKey && (
        <div className={styles.noKeyBanner}>
          <AlertTriangle size={16} color="var(--health-yellow)" />
          <span>Sem chave API. Adiciona a tua chave Anthropic na sidebar (☰ → campo API Key) para activar o Espelho.</span>
        </div>
      )}

      {/* Sugestões rápidas */}
      <div className={styles.quickBar}>
        {QUICK_PROMPTS.map(q => (
          <button key={q.label} className={styles.quickBtn} onClick={() => sendMessage(q.prompt)} disabled={loading}>
            {q.label}
          </button>
        ))}
      </div>

      {/* Mensagens */}
      <div className={styles.msgList}>
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <Message key={msg.id} msg={msg} onSaveToUniverse={saveToUniverse} />
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div className={`${styles.msg} ${styles.msgAssistant}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={styles.msgHeader}>
              <Sparkles size={14} color="var(--mod-mirror, #9B59B6)" />
              <span className={styles.msgSender}>Espelho</span>
            </div>
            <div className={styles.typing}>
              <span/><span/><span/>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div className={styles.errorMsg}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AlertTriangle size={14} color="#F87171" />
            {error}
            <button className={styles.dismissError} onClick={() => setError(null)}><X size={12}/></button>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <SmartInput
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
          }}
          placeholder="Pergunta sobre personagens, cenas, decisões criativas, riscos de produção… (Enter para enviar)"
          rows={4}
          disabled={loading}
          context="Pergunta ou contexto para o espelho do realizador — pode incluir emails, notas de reunião, decisões de equipa"
        />
        <button className={styles.sendBtn} onClick={() => sendMessage()} disabled={loading || !input.trim()}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
