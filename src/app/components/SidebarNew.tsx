import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Globe, FileText, Film, Zap, MapPin,
  Users, DollarSign, Settings, Mail, Plug, ChevronRight,
  X, Network, Clapperboard, BookOpen, Folder, Calendar,
  Target, Palette, Utensils, Heart, UserPlus, Eye,
  RefreshCw, PanelLeftClose, Scissors, Sparkles, Camera,
  Mic, Car, Flame, Theater, Paintbrush, MoreHorizontal, Key,
} from 'lucide-react';
// @ts-expect-error JSX module
import { useStore } from '../../core/store';
// @ts-expect-error JSX module
import { useShallow } from 'zustand/react/shallow';
// @ts-expect-error JSX module
import { FrameFlowLogo } from '../../components/shared/FrameFlowLogo';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

interface SubMenuItem {
  icon: React.ComponentType<any>;
  label: string;
  moduleId: string;
}

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  emoji: string;
  moduleId: string;
  badge?: string;
  submenu?: SubMenuItem[];
}

interface FlyoutInfo {
  label: string;
  item: MenuItem;
  left: number;
  top: number;
}

export interface SidebarNewProps {
  onClose?: () => void;
}

/* ─────────────────────────────────────────────────────────────
   STYLE TOKENS
───────────────────────────────────────────────────────────── */

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif"

const C_ACTIVE   = '#ffffff'
const C_INACTIVE = '#a0a0ab'   // --fb-text-secondary
const C_TERTIARY = '#6e6e78'   // --fb-text-tertiary
const BTN: React.CSSProperties = { fontFamily: FONT, WebkitFontSmoothing: 'antialiased' as any }
const ACT: React.CSSProperties = { background: 'linear-gradient(135deg, #10b981, #059669)', color: C_ACTIVE, boxShadow: '0 2px 12px rgba(16,185,129,0.4)' }
const INACT: React.CSSProperties = { background: 'transparent', color: C_INACTIVE }

/* ─────────────────────────────────────────────────────────────
   FULL MENU DATA
───────────────────────────────────────────────────────────── */

const FULL_MENU: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',     emoji: '📊', moduleId: 'dashboard' },
  { icon: Film,            label: 'Produção',       emoji: '🎬', moduleId: 'production',
    submenu: [
      { icon: Clapperboard, label: 'Strip Board',   moduleId: 'production' },
      { icon: Calendar,     label: 'Schedule',       moduleId: 'schedule' },
      { icon: FileText,     label: 'Folha Serviço',  moduleId: 'callsheet' },
    ],
  },
  { icon: Sparkles,        label: 'Pós-Produção',   emoji: '✨', moduleId: 'dailies' },
  { icon: Globe,           label: 'O Filme',         emoji: '🌍', moduleId: 'universe',
    submenu: [
      { icon: FileText,     label: 'Guiões',         moduleId: 'script' },
      { icon: RefreshCw,    label: 'Continuidade',   moduleId: 'continuity' },
      { icon: Network,      label: 'Universo',        moduleId: 'universe' },
      { icon: Clapperboard, label: 'Episódios',      moduleId: 'universe' },
      { icon: BookOpen,     label: 'Bíblia',         moduleId: 'bible' },
      { icon: Users,        label: 'Writers Room',   moduleId: 'writers-room' },
      { icon: Folder,       label: 'Ficheiros',      moduleId: 'files' },
    ],
  },
  { icon: MapPin,          label: 'Locais',          emoji: '📍', moduleId: 'locations' },
  { icon: Users,           label: 'Equipa',          emoji: '👥', moduleId: 'team',
    submenu: [
      { icon: Users,        label: 'Crew',            moduleId: 'team' },
      { icon: UserPlus,     label: 'Elenco',          moduleId: 'cast' },
    ],
  },
  { icon: Network,         label: 'Departamentos',   emoji: '🎨', moduleId: 'departments',
    submenu: [
      { icon: Palette,      label: 'Arte',            moduleId: 'dept-arte' },
      { icon: Scissors,     label: 'Guarda-Roupa',    moduleId: 'dept-guardaroupa' },
      { icon: Paintbrush,   label: 'Makeup & Hair',   moduleId: 'dept-makeup' },
      { icon: Camera,       label: 'Câmara',           moduleId: 'dept-camara' },
      { icon: Mic,          label: 'Som',              moduleId: 'dept-som' },
      { icon: Theater,      label: 'Casting',          moduleId: 'dept-casting' },
      { icon: Car,          label: 'Transporte',       moduleId: 'dept-transporte' },
      { icon: Flame,        label: 'Stunts',           moduleId: 'dept-stunts' },
    ],
  },
  { icon: Palette,         label: 'Optimização',     emoji: '⚡', moduleId: 'optimization',
    submenu: [
      { icon: Target,       label: 'Riscos',           moduleId: 'health-safety' },
      { icon: Clapperboard, label: 'Canon',            moduleId: 'canon' },
      { icon: Utensils,     label: 'Meals',            moduleId: 'meals' },
      { icon: Heart,        label: 'Saúde & Segurança',moduleId: 'health-safety' },
    ],
  },
  { icon: Eye,             label: 'Espelho',          emoji: '🪞', moduleId: 'mirror' },
  { icon: DollarSign,      label: 'Finanças',         emoji: '💰', moduleId: 'budget', badge: '🔒',
    submenu: [
      { icon: DollarSign,   label: 'Orçamento',       moduleId: 'budget' },
      { icon: FileText,     label: 'Despesas',        moduleId: 'budget' },
      { icon: FileText,     label: 'Relatórios',      moduleId: 'budget' },
    ],
  },
  { icon: Plug,            label: 'Real-Time Info',   emoji: '🔄', moduleId: 'realtime',  badge: '🔴' },
  { icon: Zap,             label: 'Live Board',       emoji: '⚡', moduleId: 'live-board', badge: '🔴' },
]

const BOTTOM_ITEMS: MenuItem[] = [
  { icon: Settings, label: 'Definições', emoji: '⚙️', moduleId: 'settings' },
  { icon: Mail,     label: 'Convites',   emoji: '✉️', moduleId: 'invites' },
]

/* ─────────────────────────────────────────────────────────────
   DEPT MAP
───────────────────────────────────────────────────────────── */

const DEPT_MAP: Record<string, { label: string; emoji: string; icon: any; moduleId: string }> = {
  sound:     { label: 'Som',          emoji: '🎙️', icon: Mic,        moduleId: 'dept-som' },
  art:       { label: 'Arte',         emoji: '🎨', icon: Palette,    moduleId: 'dept-arte' },
  wardrobe:  { label: 'Guarda-Roupa', emoji: '👔', icon: Scissors,   moduleId: 'dept-guardaroupa' },
  makeup:    { label: 'Makeup',       emoji: '💄', icon: Paintbrush, moduleId: 'dept-makeup' },
  camera:    { label: 'Câmara',        emoji: '📹', icon: Camera,     moduleId: 'dept-camara' },
  casting:   { label: 'Casting',      emoji: '🎭', icon: Theater,    moduleId: 'dept-casting' },
  transport: { label: 'Transporte',   emoji: '🚗', icon: Car,        moduleId: 'dept-transporte' },
  stunts:    { label: 'Stunts',       emoji: '🔥', icon: Flame,      moduleId: 'dept-stunts' },
}

/* ─────────────────────────────────────────────────────────────
   MORE GROUPS (mobile modal)
───────────────────────────────────────────────────────────── */

const MORE_GROUPS = [
  { category: 'PRODUÇÃO', items: [
    { icon: Globe,      label: 'Universo',    moduleId: 'universe',     emoji: '🌍' },
    { icon: FileText,   label: 'Guiões',      moduleId: 'script',       emoji: '📝' },
    { icon: Palette,    label: 'Optimização', moduleId: 'optimization', emoji: '⚡' },
  ]},
  { category: 'RODAGEM', items: [
    { icon: RefreshCw,  label: 'Continuidade', moduleId: 'continuity', emoji: '🔄' },
    { icon: Eye,        label: 'Espelho',       moduleId: 'mirror',     emoji: '👁️' },
  ]},
  { category: 'GESTÃO', items: [
    { icon: DollarSign, label: 'Orçamento',    moduleId: 'budget',      emoji: '💰' },
  ]},
  { category: 'FERRAMENTAS', items: [
    { icon: Plug,       label: 'Integrações',  moduleId: 'integrations', emoji: '🔌' },
    { icon: MapPin,     label: 'GPS Tracking', moduleId: 'gps-nav',      emoji: '📍', badge: '🔴' },
  ]},
  { category: 'CONFIGURAÇÃO', items: [
    { icon: Settings,   label: 'Definições',  moduleId: 'settings', emoji: '⚙️' },
    { icon: Key,        label: 'Chave API',   moduleId: 'settings', emoji: '🔑' },
    { icon: Mail,       label: 'Convites',    moduleId: 'invites',  emoji: '✉️' },
  ]},
]

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */

export function SidebarNew({ onClose }: SidebarNewProps) {
  const { navigate, ui, auth } = useStore(useShallow((s: any) => ({
    navigate: s.navigate,
    ui: s.ui,
    auth: s.auth,
  })))

  const activeModule: string = ui?.activeModule || 'dashboard'

  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try { return localStorage.getItem('sidebar-expanded') === 'true' } catch { return false }
  })
  const [flyoutInfo, setFlyoutInfo] = useState<FlyoutInfo | null>(null)
  const [showMoreModal, setShowMoreModal] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<number | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => { if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current) }
  }, [])

  const toggleExpanded = () => {
    const next = !isExpanded
    setIsExpanded(next)
    try { localStorage.setItem('sidebar-expanded', String(next)) } catch {}
    // Clear flyout when expanding
    if (next) { setFlyoutInfo(null); setHoveredItem(null) }
  }

  // Active state helpers
  const isActive = (moduleId: string) => activeModule === moduleId
  const hasActiveChild = (item: MenuItem) => item.submenu?.some(s => isActive(s.moduleId)) ?? false
  const itemIsActive = (item: MenuItem) => isActive(item.moduleId) || hasActiveChild(item)

  const handleNav = (moduleId: string) => {
    navigate(moduleId)
    onClose?.()
    setFlyoutInfo(null)
    setHoveredItem(null)
  }

  const handleItemClick = (item: MenuItem) => {
    if (item.submenu) {
      setExpandedItem(expandedItem === item.label ? null : item.label)
    } else {
      handleNav(item.moduleId)
    }
  }

  // Flyout hover with delay to bridge gap between item and flyout
  const showFlyout = (label: string, item: MenuItem, e: React.MouseEvent) => {
    if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null }
    const el = e.currentTarget as HTMLElement
    const itemRect = el.getBoundingClientRect()
    const wrapperRect = wrapperRef.current?.getBoundingClientRect()
    setFlyoutInfo({ label, item, left: (wrapperRect?.right ?? 70) + 4, top: itemRect.top })
    setHoveredItem(label)
  }

  const hideFlyout = () => {
    hideTimeoutRef.current = window.setTimeout(() => {
      setHoveredItem(null)
      setFlyoutInfo(null)
    }, 120)
  }

  const keepFlyout = () => {
    if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null }
  }

  // Department mode
  const role = auth?.role || ''
  const deptEntry = DEPT_MAP[role]
  const isDeptMode = auth && !auth.isSuperAdmin && !!deptEntry

  const menuItems = isDeptMode
    ? [{
        icon: deptEntry.icon,
        label: deptEntry.label,
        emoji: deptEntry.emoji,
        moduleId: deptEntry.moduleId,
        submenu: [
          { icon: Calendar,  label: 'Hoje',        moduleId: deptEntry.moduleId },
          { icon: Target,    label: 'Planeamento', moduleId: deptEntry.moduleId },
          { icon: Users,     label: 'Equipa',      moduleId: 'team' },
          { icon: Folder,    label: 'Inventário',  moduleId: deptEntry.moduleId },
        ],
      }]
    : FULL_MENU

  // ── RENDER ITEM ──────────────────────────────────────────────
  const renderItem = (item: MenuItem) => {
    const active = itemIsActive(item)
    const Icon = item.icon

    return (
      <div key={item.label} style={{ position: 'relative' }}>
        {/* Main button */}
        <button
          onClick={() => handleItemClick(item)}
          title={!isExpanded ? item.label : undefined}
          onMouseEnter={(e) => { if (!isExpanded && item.submenu) showFlyout(item.label, item, e) }}
          onMouseLeave={() => { if (!isExpanded && item.submenu) hideFlyout() }}
          style={{
            ...BTN,
            display: 'flex', alignItems: 'center',
            width: '100%', height: 44, borderRadius: 8,
            position: 'relative', cursor: 'pointer',
            paddingLeft: isExpanded ? 12 : 0,
            paddingRight: 0,
            justifyContent: isExpanded ? 'flex-start' : 'center',
            border: 'none', transition: 'all 0.2s',
            ...(active ? ACT : INACT),
          }}
        >
          <Icon style={{ width: 20, height: 20, flexShrink: 0, color: active ? C_ACTIVE : C_INACTIVE }} />

          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ fontFamily: FONT, marginLeft: 12, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', color: active ? C_ACTIVE : C_INACTIVE, flex: 1, textAlign: 'left' }}
            >
              {item.label}
            </motion.span>
          )}

          {/* Chevron expanded */}
          {isExpanded && item.submenu && (
            <ChevronRight style={{
              width: 16, height: 16, flexShrink: 0,
              marginLeft: 'auto', marginRight: 8, opacity: 0.5,
              color: active ? C_ACTIVE : C_INACTIVE,
              transform: expandedItem === item.label ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }} />
          )}

          {/* Chevron collapsed */}
          {!isExpanded && item.submenu && (
            <ChevronRight style={{
              width: 12, height: 12, position: 'absolute', right: 2, bottom: 2,
              opacity: 0.5, color: active ? C_ACTIVE : C_INACTIVE,
            }} />
          )}

          {/* Badge */}
          {item.badge && (
            <span style={{ position: 'absolute', top: 2, right: 2, fontSize: 10, lineHeight: 1 }}>
              {item.badge}
            </span>
          )}
        </button>

        {/* Inline submenu (expanded mode) */}
        <AnimatePresence>
          {isExpanded && expandedItem === item.label && item.submenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginTop: 2 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {item.submenu.map((sub) => {
                  const subActive = isActive(sub.moduleId)
                  const SubIcon = sub.icon
                  return (
                    <button
                      key={sub.label}
                      onClick={() => handleNav(sub.moduleId)}
                      style={{
                        ...BTN,
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: 'calc(100% - 32px)', marginLeft: 32,
                        height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                        paddingLeft: 12, paddingRight: 8,
                        background: subActive ? 'rgba(16,185,129,0.18)' : 'transparent',
                        color: subActive ? '#10b981' : C_TERTIARY,
                        transition: 'all 0.15s',
                      }}
                    >
                      <SubIcon style={{ width: 14, height: 14, flexShrink: 0, color: subActive ? '#10b981' : C_TERTIARY }} />
                      <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {sub.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── FLYOUT PORTAL ────────────────────────────────────────────
  const flyoutPortal = flyoutInfo && !isExpanded && hoveredItem === flyoutInfo.label
    ? createPortal(
        <div
          onMouseEnter={keepFlyout}
          onMouseLeave={hideFlyout}
          style={{
            position: 'fixed',
            left: flyoutInfo.left,
            top: flyoutInfo.top,
            width: 220,
            zIndex: 50,
            borderRadius: 16,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px) saturate(120%)',
            WebkitBackdropFilter: 'blur(20px) saturate(120%)',
            border: '0.5px solid rgba(255,255,255,0.18)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          {/* Flyout header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>{flyoutInfo.item.emoji}</span>
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.95)' }}>
                {flyoutInfo.item.label}
              </span>
            </div>
            <div style={{ fontFamily: FONT, fontSize: 9, color: C_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {flyoutInfo.item.submenu?.length} módulos
            </div>
          </div>

          {/* Flyout items */}
          <div style={{ padding: 8 }}>
            {flyoutInfo.item.submenu?.map((sub) => {
              const subActive = isActive(sub.moduleId)
              const SubIcon = sub.icon
              return (
                <button
                  key={sub.label}
                  onClick={() => handleNav(sub.moduleId)}
                  style={{
                    ...BTN,
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '10px 12px',
                    borderRadius: 8, border: 'none', cursor: 'pointer',
                    marginBottom: 2,
                    background: subActive ? '#10b981' : 'transparent',
                    color: subActive ? '#ffffff' : C_INACTIVE,
                    transition: 'all 0.15s',
                  }}
                >
                  <SubIcon style={{ width: 16, height: 16, flexShrink: 0, color: subActive ? '#ffffff' : C_TERTIARY }} />
                  <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700 }}>
                    {sub.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )
    : null

  // ── MAIN RENDER ──────────────────────────────────────────────
  return (
    <>
      <motion.div
        ref={wrapperRef}
        style={{
          height: '100vh',
          display: 'flex',
          padding: 12,
          background: 'transparent',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
        animate={{ width: isExpanded ? 260 : 64 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Glass panel */}
        <div style={{
          height: '100%', width: '100%',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', position: 'relative',
          borderRadius: isExpanded ? 20 : 9999,
          transition: 'border-radius 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Layer 1 — Base glass */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px) saturate(120%)', WebkitBackdropFilter: 'blur(20px) saturate(120%)' }} />
          {/* Layer 2 — Lensing */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 20, background: 'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(255,255,255,0.10) 0%, transparent 50%)', mixBlendMode: 'overlay' as any }} />
          {/* Layer 3 — Inner highlight */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 20, boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,255,0.25)' }} />
          {/* Layer 4 — Border */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.18)' }} />
          {/* Layer 5 — Outer shadow */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 20, boxShadow: '0 2px 20px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(255,255,255,0.08)' }} />

          {/* Content above glass layers */}
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* ── HEADER ── */}
            <div style={{ flexShrink: 0, borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
              {onClose ? (
                /* Mobile drawer header */
                <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
                  <FrameFlowLogo size={120} variant="icon" />
                  <button
                    onClick={onClose}
                    style={{ ...BTN, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer' }}
                  >
                    <X style={{ width: 16, height: 16, color: C_INACTIVE }} />
                  </button>
                </div>
              ) : (
                /* Desktop toggle button */
                <button
                  onClick={toggleExpanded}
                  style={{ ...BTN, height: 64, width: '100%', display: 'flex', alignItems: 'center', padding: '0 16px', background: 'none', border: 'none', cursor: 'pointer', justifyContent: 'center' }}
                >
                  {isExpanded ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                      <FrameFlowLogo size={120} variant="icon" />
                      <PanelLeftClose style={{ width: 16, height: 16, marginLeft: 'auto', color: C_TERTIARY }} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <div style={{ width: 20, height: 2, borderRadius: 9999, background: C_INACTIVE }} />
                      <div style={{ width: 20, height: 2, borderRadius: 9999, background: C_INACTIVE }} />
                      <div style={{ width: 20, height: 2, borderRadius: 9999, background: C_INACTIVE }} />
                    </div>
                  )}
                </button>
              )}
            </div>

            {/* ── MAIN MENU ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: isExpanded ? 12 : '8px 4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {menuItems.map(renderItem)}
              </div>
            </div>

            {/* ── BOTTOM MENU ── */}
            {!isDeptMode && (
              <div style={{ flexShrink: 0, borderTop: '0.5px solid rgba(255,255,255,0.08)', padding: isExpanded ? 12 : '8px 4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {BOTTOM_ITEMS.map((item) => {
                    const active = isActive(item.moduleId)
                    const Icon = item.icon
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleNav(item.moduleId)}
                        title={!isExpanded ? item.label : undefined}
                        style={{
                          ...BTN,
                          display: 'flex', alignItems: 'center',
                          width: '100%', height: 44, borderRadius: 8,
                          border: 'none', cursor: 'pointer',
                          paddingLeft: isExpanded ? 12 : 0,
                          justifyContent: isExpanded ? 'flex-start' : 'center',
                          transition: 'all 0.2s',
                          ...(active ? ACT : INACT),
                        }}
                      >
                        <Icon style={{ width: 20, height: 20, flexShrink: 0, color: active ? C_ACTIVE : C_INACTIVE }} />
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ fontFamily: FONT, marginLeft: 12, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', color: active ? C_ACTIVE : C_INACTIVE }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </motion.div>

      {/* Flyout via portal */}
      {flyoutPortal}

      {/* More Modal (mobile) */}
      <AnimatePresence>
        {showMoreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'flex-end',
            }}
            onClick={() => setShowMoreModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxHeight: '80vh', overflowY: 'auto',
                borderRadius: '24px 24px 0 0',
                background: 'rgba(18,18,24,0.97)',
                border: '0.5px solid rgba(255,255,255,0.12)',
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: C_ACTIVE }}>
                  Mais módulos
                </span>
                <button
                  onClick={() => setShowMoreModal(false)}
                  style={{ ...BTN, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer' }}
                >
                  <X style={{ width: 16, height: 16, color: C_INACTIVE }} />
                </button>
              </div>
              {MORE_GROUPS.map((group) => (
                <div key={group.category} style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: C_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    {group.category}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {group.items.map((it) => {
                      const ItemIcon = it.icon
                      const active = isActive(it.moduleId)
                      return (
                        <button
                          key={it.label}
                          onClick={() => { handleNav(it.moduleId); setShowMoreModal(false) }}
                          style={{
                            ...BTN,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            padding: '12px 8px', borderRadius: 12, border: 'none', cursor: 'pointer',
                            background: active ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.06)',
                            color: active ? '#10b981' : C_INACTIVE,
                          }}
                        >
                          <span style={{ fontSize: 20 }}>{it.emoji}</span>
                          <ItemIcon style={{ width: 18, height: 18, color: active ? '#10b981' : C_INACTIVE }} />
                          <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, textAlign: 'center', color: active ? '#10b981' : C_INACTIVE }}>
                            {it.label}
                          </span>
                          {'badge' in it && (it as any).badge && (
                            <span style={{ fontSize: 10 }}>{(it as any).badge}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
