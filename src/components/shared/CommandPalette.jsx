// CommandPalette — Cmd+K fuzzy search & navigation (Figma spec 38)
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Command, ArrowRight, Clock, Hash, FileText, Users, Settings,
  MapPin, Film, Eye, DollarSign, Radio, Palette, Zap, Scissors,
  BookOpen, CalendarCheck, Utensils, BarChart3, Shield, LogOut,
  Clapperboard, Repeat, ScrollText,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'

// ── Icon map for dynamic lookup ──
const ICONS = {
  dashboard: Clapperboard, production: Film, 'pre-production': CalendarCheck,
  callsheet: ScrollText, script: FileText, continuity: Repeat,
  universe: BookOpen, 'script-analysis': BarChart3, mirror: Eye,
  locations: MapPin, team: Users, cast: Users, departments: Palette,
  optimization: Zap, budget: DollarSign, 'live-board': Radio,
  settings: Settings, meals: Utensils, progress: BarChart3,
  'post-production': Scissors, finance: DollarSign,
}

// ── All navigable modules ──
const NAV_COMMANDS = [
  { id: 'dashboard',        label: 'Dashboard',         keywords: ['inicio', 'home', 'principal', 'painel'] },
  { id: 'production',       label: 'Strip Board',       keywords: ['produção', 'plano', 'strip', 'board', 'cenas'] },
  { id: 'pre-production',   label: 'Schedule',          keywords: ['schedule', 'pré-produção', 'agenda', 'planeamento'] },
  { id: 'callsheet',        label: 'Folha de Serviço',  keywords: ['callsheet', 'folha', 'serviço', 'call'] },
  { id: 'script',           label: 'Guiões',            keywords: ['guião', 'script', 'fdx', 'texto'] },
  { id: 'continuity',       label: 'Continuidade',      keywords: ['continuidade', 'raccord', 'notas'] },
  { id: 'universe',         label: 'Universo',          keywords: ['universo', 'personagens', 'bible', 'mundo'] },
  { id: 'script-analysis',  label: 'Análise de Guião',  keywords: ['análise', 'episódios', 'breakdown'] },
  { id: 'locations',        label: 'Locais',            keywords: ['locais', 'localizações', 'mapa', 'local'] },
  { id: 'team',             label: 'Equipa',            keywords: ['equipa', 'crew', 'membros', 'pessoas'] },
  { id: 'cast',             label: 'Elenco',            keywords: ['elenco', 'actores', 'atores', 'casting'] },
  { id: 'departments',      label: 'Departamentos',     keywords: ['departamentos', 'arte', 'guarda-roupa', 'makeup', 'câmara', 'som'] },
  { id: 'optimization',     label: 'Optimização',       keywords: ['optimização', 'riscos', 'eficiência'] },
  { id: 'mirror',           label: 'Huddle AI',         keywords: ['espelho', 'huddle', 'ai', 'chat', 'realizador'] },
  { id: 'budget',           label: 'Orçamento',         keywords: ['orçamento', 'budget', 'custos', 'dinheiro'] },
  { id: 'finance',          label: 'Despesas',          keywords: ['despesas', 'finanças', 'financeiro'] },
  { id: 'progress',         label: 'Relatórios',        keywords: ['relatórios', 'progresso', 'reports'] },
  { id: 'live-board',       label: 'Live Board',        keywords: ['live', 'board', 'set', 'rodagem', 'tempo real'] },
  { id: 'meals',            label: 'Refeições',         keywords: ['refeições', 'meals', 'catering', 'almoço'] },
  { id: 'post-production',  label: 'Pós-Produção',      keywords: ['pós', 'post', 'edição', 'montagem'] },
  { id: 'settings',         label: 'Definições',        keywords: ['definições', 'settings', 'config', 'preferências'] },
]

const RECENT_KEY = 'ff_cmd_recent'
function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function addRecent(id) {
  const list = getRecent().filter(r => r !== id)
  list.unshift(id)
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)))
}

// ── Fuzzy match ──
function fuzzyMatch(text, query) {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (t.includes(q)) return true
  // character-by-character fuzzy
  let ti = 0
  for (let qi = 0; qi < q.length; qi++) {
    const found = t.indexOf(q[qi], ti)
    if (found === -1) return false
    ti = found + 1
  }
  return true
}

function fuzzyScore(text, query) {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 90
  if (t.includes(q)) return 70
  return 50 // fuzzy char match
}

export function CommandPalette({ isOpen, onClose }) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const { navigate, team, locations, shootingDays, parsedScripts, parsedCharacters, universe, departmentItems, logout } = useStore(useShallow(s => ({
    navigate: s.navigate,
    team: s.team,
    locations: s.locations,
    shootingDays: s.shootingDays,
    parsedScripts: s.parsedScripts,
    parsedCharacters: s.parsedCharacters,
    universe: s.universe,
    departmentItems: s.departmentItems,
    logout: s.logout,
  })))

  // Build command list
  const commands = useMemo(() => {
    const cmds = []
    const recent = getRecent()

    // Recent items (show when no search)
    if (!search) {
      recent.forEach(id => {
        const nav = NAV_COMMANDS.find(n => n.id === id)
        if (nav) {
          cmds.push({
            id: `recent-${nav.id}`,
            navId: nav.id,
            label: nav.label,
            category: 'recent',
            icon: ICONS[nav.id] || Hash,
            action: () => { navigate(nav.id); addRecent(nav.id) },
          })
        }
      })
    }

    // Navigation commands
    NAV_COMMANDS.forEach(nav => {
      const matchLabel = !search || fuzzyMatch(nav.label, search)
      const matchKeyword = !search || nav.keywords.some(kw => fuzzyMatch(kw, search))
      if (matchLabel || matchKeyword) {
        cmds.push({
          id: `nav-${nav.id}`,
          navId: nav.id,
          label: nav.label,
          category: 'navigation',
          icon: ICONS[nav.id] || Hash,
          action: () => { navigate(nav.id); addRecent(nav.id) },
          score: search ? Math.max(
            fuzzyScore(nav.label, search),
            ...nav.keywords.map(kw => fuzzyScore(kw, search))
          ) : 0,
        })
      }
    })

    // Search store data when query has 2+ chars
    if (search && search.length >= 2) {
      // Team members
      ;(team || []).forEach(m => {
        if (fuzzyMatch(m.name || '', search) || fuzzyMatch(m.role || '', search)) {
          cmds.push({
            id: `member-${m.id}`,
            label: m.name,
            sublabel: m.role || m.group,
            category: 'data',
            icon: Users,
            action: () => { navigate('team'); addRecent('team') },
            score: fuzzyScore(m.name || '', search),
          })
        }
      })

      // Locations
      ;(locations || []).forEach(loc => {
        if (fuzzyMatch(loc.name || '', search) || fuzzyMatch(loc.address || '', search)) {
          cmds.push({
            id: `loc-${loc.id}`,
            label: loc.name,
            sublabel: loc.address,
            category: 'data',
            icon: MapPin,
            action: () => { navigate('locations'); addRecent('locations') },
            score: fuzzyScore(loc.name || '', search),
          })
        }
      })

      // Shooting days
      ;(shootingDays || []).forEach((day, i) => {
        const dayLabel = `Dia ${i + 1}${day.date ? ` — ${day.date}` : ''}`
        if (fuzzyMatch(dayLabel, search) || fuzzyMatch(day.location || '', search)) {
          cmds.push({
            id: `day-${day.id}`,
            label: dayLabel,
            sublabel: day.location,
            category: 'data',
            icon: Film,
            action: () => { navigate('production'); addRecent('production') },
            score: fuzzyScore(dayLabel, search),
          })
        }
      })

      // Scenes from parsed scripts
      Object.entries(parsedScripts || {}).forEach(([epId, ep]) => {
        ;(ep?.scenes || []).forEach(scene => {
          const heading = scene.heading?.full || scene.heading?.location || ''
          const action = scene.action || ''
          if (fuzzyMatch(heading, search) || fuzzyMatch(action, search)) {
            cmds.push({
              id: `scene-${epId}-${scene.id}`,
              label: heading || `Cena ${scene.sceneNumber || scene.id}`,
              sublabel: `${epId} · ${scene.heading?.interior_exterior || ''} ${scene.heading?.time_of_day || ''}`.trim(),
              category: 'data',
              icon: FileText,
              action: () => { navigate('script'); addRecent('script') },
              score: fuzzyScore(heading, search),
            })
          }
        })
      })

      // Parsed characters (from FDX scripts)
      ;(parsedCharacters || []).forEach(c => {
        const name = typeof c === 'string' ? c : (c.name || '')
        if (name && fuzzyMatch(name, search)) {
          cmds.push({
            id: `pchar-${name}`,
            label: name,
            sublabel: 'Personagem (guião)',
            category: 'data',
            icon: Users,
            action: () => { navigate('script-analysis'); addRecent('script-analysis') },
            score: fuzzyScore(name, search),
          })
        }
      })

      // Universe characters
      ;(universe?.chars || []).forEach(c => {
        if (fuzzyMatch(c.name || '', search) || fuzzyMatch(c.role || '', search)) {
          cmds.push({
            id: `char-${c.id}`,
            label: c.name,
            sublabel: c.role || c.group,
            category: 'data',
            icon: Users,
            action: () => { navigate('universe'); addRecent('universe') },
            score: fuzzyScore(c.name || '', search),
          })
        }
      })

      // Department items
      ;(departmentItems || []).forEach(item => {
        if (fuzzyMatch(item.name || '', search) || fuzzyMatch(item.department || '', search) || fuzzyMatch(item.description || '', search)) {
          cmds.push({
            id: `dept-${item.id}`,
            label: item.name,
            sublabel: item.department,
            category: 'data',
            icon: Palette,
            action: () => { navigate('departments'); addRecent('departments') },
            score: fuzzyScore(item.name || '', search),
          })
        }
      })
    }

    // Actions
    if (!search || fuzzyMatch('logout sair', search)) {
      cmds.push({
        id: 'action-logout',
        label: 'Terminar Sessão',
        category: 'action',
        icon: LogOut,
        action: async () => {
          try { const { firebaseSignOut } = await import('../../core/firebase.js'); await firebaseSignOut() } catch {}
          logout()
        },
      })
    }

    // Sort by score when searching
    if (search) {
      cmds.sort((a, b) => (b.score || 0) - (a.score || 0))
    }

    return cmds
  }, [search, navigate, team, locations, shootingDays, parsedScripts, parsedCharacters, universe, departmentItems, logout])

  // Build flat render list (headers + items) for clean indexing
  const { renderList, flatItems } = useMemo(() => {
    const items = commands.filter(c => c.category !== 'recent' || !search)
    const groups = { recent: [], navigation: [], data: [], action: [] }
    items.forEach(cmd => { if (groups[cmd.category]) groups[cmd.category].push(cmd) })

    const list = []
    const flat = []
    const LABELS = { recent: 'Recentes', navigation: 'Navegação', data: 'Resultados', action: 'Acções' }
    for (const [cat, catItems] of Object.entries(groups)) {
      if (!catItems.length) continue
      list.push({ type: 'header', label: LABELS[cat] || cat, key: `h-${cat}` })
      catItems.forEach(cmd => {
        const idx = flat.length
        flat.push(cmd)
        list.push({ type: 'item', cmd, idx, key: cmd.id })
      })
    }
    return { renderList: list, flatItems: flat }
  }, [commands, search])

  // Reset selection on search change
  useEffect(() => { setSelectedIndex(0) }, [search])

  // Focus input
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector('[data-selected="true"]')
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Keyboard nav
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = flatItems[selectedIndex]
      if (cmd) { cmd.action(); onClose() }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [flatItems, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
            onClick={onClose}
          />

          {/* Palette */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '18vh', pointerEvents: 'none',
          }}>
            <motion.div
              key="cmd-palette"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                width: '100%', maxWidth: 600,
                margin: '0 16px',
                background: 'rgba(30, 34, 42, 0.75)',
                backdropFilter: 'blur(32px) saturate(180%)',
                WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                borderRadius: 24,
                border: '0.5px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 0 0 0.5px rgba(16, 185, 129, 0.25), 0 25px 50px rgba(0, 0, 0, 0.5), inset 0 0.5px 0.5px rgba(255, 255, 255, 0.3)',
                overflow: 'hidden',
                pointerEvents: 'auto',
              }}
              onKeyDown={handleKeyDown}
            >
              {/* Search input */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px 20px',
                borderBottom: '0.5px solid rgba(255, 255, 255, 0.08)',
              }}>
                <Command size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar módulos, equipa, locais..."
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#ffffff', fontSize: 16,
                    fontFamily: 'var(--font-body)',
                  }}
                />
                <kbd style={{
                  padding: '3px 8px', borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '0.5px solid rgba(255, 255, 255, 0.12)',
                  fontSize: 11, fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontFamily: 'var(--font-body)',
                }}>ESC</kbd>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                style={{ maxHeight: 380, overflowY: 'auto', padding: 8 }}
              >
                {flatItems.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '40px 0',
                    color: 'rgba(255, 255, 255, 0.4)', fontSize: 14,
                  }}>
                    Nenhum resultado para "{search}"
                  </div>
                ) : (
                  renderList.map(entry => {
                    if (entry.type === 'header') {
                      return (
                        <div key={entry.key} style={{
                          padding: '6px 12px', fontSize: 10, fontWeight: 800,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          color: 'rgba(255, 255, 255, 0.35)',
                          marginTop: 4,
                        }}>
                          {entry.label}
                        </div>
                      )
                    }

                    const { cmd, idx } = entry
                    const isSelected = idx === selectedIndex
                    const Icon = cmd.icon

                    return (
                      <button
                        key={entry.key}
                        data-selected={isSelected}
                        onClick={() => { cmd.action(); onClose() }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          width: '100%', padding: '10px 12px',
                          borderRadius: 12, border: 'none', cursor: 'pointer',
                          textAlign: 'left',
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)'
                            : 'transparent',
                          outline: isSelected
                            ? '0.5px solid rgba(16, 185, 129, 0.25)'
                            : 'none',
                          transition: 'background 0.1s',
                        }}
                      >
                        <Icon
                          size={16}
                          style={{
                            color: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.45)',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {cmd.label}
                          </div>
                          {cmd.sublabel && (
                            <div style={{
                              fontSize: 11, color: 'rgba(255, 255, 255, 0.35)',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              marginTop: 1,
                            }}>
                              {cmd.sublabel}
                            </div>
                          )}
                        </div>
                        {cmd.category === 'recent' && (
                          <Clock size={12} style={{ color: 'rgba(255, 255, 255, 0.25)', flexShrink: 0 }} />
                        )}
                        {isSelected && (
                          <ArrowRight size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                        )}
                      </button>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 20px',
                borderTop: '0.5px solid rgba(255, 255, 255, 0.06)',
                fontSize: 11, color: 'rgba(255, 255, 255, 0.3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontSize: 10 }}>↑↓</kbd>
                    navegar
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontSize: 10 }}>↵</kbd>
                    seleccionar
                  </span>
                </div>
                <span>{flatItems.length} resultado{flatItems.length !== 1 ? 's' : ''}</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
