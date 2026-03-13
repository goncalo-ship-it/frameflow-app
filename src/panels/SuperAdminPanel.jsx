// Painel SuperAdmin — Projectos (Figma FF_V04)
// Grid de projectos com gradientes, fase, stats, favoritos

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Film, Calendar, Search, Grid3X3, List,
  LogOut, Star, MoreVertical, X, Clapperboard,
} from 'lucide-react'
import { useStore } from '../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { FrameFlowLogo } from '../components/shared/FrameFlowLogo.jsx'
import styles from './SuperAdminPanel.module.css'

const PHASE_LABELS = {
  'pre-production': 'Pré-Produção',
  'shooting':       'Produção',
  'post-production': 'Pós-Produção',
  'delivered':      'Entregue',
}
const PHASE_COLORS = {
  'pre-production': '#10B981',
  'shooting':       '#F59E0B',
  'post-production': '#A78BFA',
  'delivered':      '#6B7280',
}

// Gradient covers — rotated per project
const COVER_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
]

export function SuperAdminPanel() {
  const {
    auth, projects, projectName, team, locations, shootingDays, parsedScripts,
    sceneTakes, setPreviewPanel, createProject, setCurrentProject, setProjectName, logout,
  } = useStore(useShallow(s => ({
    auth: s.auth, projects: s.projects, projectName: s.projectName,
    team: s.team, locations: s.locations, shootingDays: s.shootingDays,
    parsedScripts: s.parsedScripts, sceneTakes: s.sceneTakes,
    setPreviewPanel: s.setPreviewPanel, createProject: s.createProject,
    setCurrentProject: s.setCurrentProject, setProjectName: s.setProjectName, logout: s.logout,
  })))

  const [showCreate, setShowCreate] = useState(false)
  const [newProject, setNewProject] = useState({ title: '', client: '', episodes: '', phase: 'pre-production' })
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid')

  const handleLogout = async () => {
    try { const { firebaseSignOut } = await import('../core/firebase.js'); await firebaseSignOut() } catch {}
    logout()
  }

  // Calculate progress for current project
  const scenesCount = useMemo(() => Object.values(parsedScripts).flatMap(s => s.scenes || []).length, [parsedScripts])
  const scenesFilmed = useMemo(() =>
    new Set(Object.entries(sceneTakes || {}).filter(([, t]) => t.some(x => x.status === 'BOM' || x.status === 'bom')).map(([k]) => k)).size
  , [sceneTakes])
  const progressPct = scenesCount > 0 ? Math.round((scenesFilmed / scenesCount) * 100) : 0

  const currentProject = {
    id: 'current',
    title: projectName || 'Projecto Actual',
    client: '',
    phase: 'pre-production',
    teamCount: team.length,
    locationCount: locations.length,
    daysCount: shootingDays.length,
    episodeCount: Object.keys(parsedScripts).length,
    scenesCount,
    progress: progressPct,
    archived: false,
    favorite: true,
    updatedAt: new Date().toISOString(),
  }

  const allProjects = useMemo(() => [
    currentProject,
    ...Object.values(projects).map((p, i) => ({
      id: p.id,
      title: p.meta?.title || p.id,
      client: p.meta?.client || '',
      phase: p.meta?.phase || 'pre-production',
      teamCount: p.team?.members?.length || 0,
      locationCount: Object.keys(p.locations || {}).length,
      daysCount: p.schedule?.days?.length || 0,
      episodeCount: Object.keys(p.scripts || {}).length,
      scenesCount: 0,
      progress: p.meta?.progress || 0,
      archived: p.meta?.archived || false,
      favorite: p.meta?.favorite || false,
      updatedAt: p.meta?.updatedAt || '',
    })),
  ], [currentProject, projects])

  const filtered = useMemo(() => {
    let list = allProjects.filter(p => tab === 'active' ? !p.archived : p.archived)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.client?.toLowerCase().includes(q))
    }
    return list
  }, [allProjects, tab, search])

  const activeCount = allProjects.filter(p => !p.archived).length
  const archivedCount = allProjects.filter(p => p.archived).length

  const handleCreate = () => {
    if (!newProject.title.trim()) return
    createProject({ title: newProject.title, client: newProject.client, episodes: Number(newProject.episodes) || 0, phase: newProject.phase })
    setProjectName(newProject.title)
    setNewProject({ title: '', client: '', episodes: '', phase: 'pre-production' })
    setShowCreate(false)
  }

  const enterProject = (proj) => {
    if (proj.id !== 'current') setCurrentProject(proj.id)
    setPreviewPanel('management')
  }

  const timeAgo = (date) => {
    if (!date) return ''
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `Há ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Há ${hours} hora${hours > 1 ? 's' : ''}`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Ontem'
    if (days < 30) return `Há ${days} dias`
    return `Há ${Math.floor(days / 30)} mês`
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <FrameFlowLogo size={36} />
          <h1 className={styles.headerTitle}>Projectos</h1>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Novo Projecto
          </button>
          <button className={styles.iconBtn} onClick={handleLogout} title="Sair">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.glassContainer}>

          {/* Tabs + View toggle */}
          <div className={styles.toolbar}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${tab === 'active' ? styles.tabActive : ''}`} onClick={() => setTab('active')}>
                Ativos <span className={styles.tabCount}>{activeCount}</span>
              </button>
              <button className={`${styles.tab} ${tab === 'archived' ? styles.tabActive : ''}`} onClick={() => setTab('archived')}>
                Arquivados <span className={styles.tabCount}>{archivedCount}</span>
              </button>
            </div>
          </div>

          {/* Search + view mode */}
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <Search size={14} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder={`Pesquisar em ${tab === 'active' ? 'ativos' : 'arquivados'}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.viewToggle}>
              <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('grid')}>
                <Grid3X3 size={14} />
              </button>
              <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('list')}>
                <List size={14} />
              </button>
            </div>
          </div>

          {/* Create form */}
          <AnimatePresence>
            {showCreate && (
              <motion.div className={styles.createForm}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className={styles.createHeader}>
                  <h3 className={styles.createTitle}>Novo Projecto</h3>
                  <button className={styles.closeBtn} onClick={() => setShowCreate(false)}><X size={16} /></button>
                </div>
                <div className={styles.createGrid}>
                  <input className={styles.input} placeholder="Nome do projecto *"
                    value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} autoFocus />
                  <input className={styles.input} placeholder="Cliente"
                    value={newProject.client} onChange={e => setNewProject(p => ({ ...p, client: e.target.value }))} />
                  <input className={styles.input} placeholder="Nº episódios" type="number"
                    value={newProject.episodes} onChange={e => setNewProject(p => ({ ...p, episodes: e.target.value }))} />
                  <select className={styles.input} value={newProject.phase}
                    onChange={e => setNewProject(p => ({ ...p, phase: e.target.value }))}>
                    {Object.entries(PHASE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className={styles.createActions}>
                  <button className={styles.cancelBtn} onClick={() => setShowCreate(false)}>Cancelar</button>
                  <button className={styles.confirmBtn} onClick={handleCreate} disabled={!newProject.title.trim()}>
                    <Plus size={14} /> Criar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Project grid */}
          <div className={viewMode === 'grid' ? styles.projectGrid : styles.projectList}>
            {filtered.map((proj, idx) => (
              <motion.div
                key={proj.id}
                className={styles.projectCard}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ y: -3 }}
                onClick={() => enterProject(proj)}
              >
                {/* Gradient cover */}
                <div className={styles.cardCover} style={{ background: COVER_GRADIENTS[idx % COVER_GRADIENTS.length] }}>
                  <button className={`${styles.starBtn} ${proj.favorite ? styles.starActive : ''}`}
                    onClick={e => { e.stopPropagation() }}>
                    <Star size={16} fill={proj.favorite ? '#FBBF24' : 'none'} />
                  </button>
                  <span className={styles.phaseBadge} style={{
                    background: PHASE_COLORS[proj.phase] + '22',
                    color: PHASE_COLORS[proj.phase],
                    borderColor: PHASE_COLORS[proj.phase] + '44',
                  }}>
                    {PHASE_LABELS[proj.phase] || proj.phase}
                  </span>
                </div>

                {/* Card body */}
                <div className={styles.cardBody}>
                  <div className={styles.cardTitleRow}>
                    <h3 className={styles.cardTitle}>{proj.title}</h3>
                    <button className={styles.menuBtn} onClick={e => e.stopPropagation()}>
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <p className={styles.cardTime}>{timeAgo(proj.updatedAt)}</p>
                  <div className={styles.cardStats}>
                    <span><Film size={11} /> {proj.episodeCount} eps</span>
                    <span><span className={styles.dotGreen} /> {proj.scenesCount || 0}</span>
                    <span><Calendar size={11} /> {proj.daysCount}d</span>
                    <span className={styles.progressText}>{proj.progress || 0}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className={styles.empty}>
              <Clapperboard size={32} />
              <p>{search ? 'Nenhum projecto encontrado' : tab === 'archived' ? 'Sem projectos arquivados' : 'Cria o teu primeiro projecto'}</p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
