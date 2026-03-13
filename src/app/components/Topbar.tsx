import { forwardRef, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Clapperboard, Clock, AlertTriangle, Bell, Settings, LogOut,
  Search, Command, ArrowRight, CheckCircle2, Info, X,
  Sun, Moon, Sparkles,
} from 'lucide-react';
// @ts-expect-error JSX module
import { useStore } from '../../core/store';
// @ts-expect-error JSX module
import { useShallow } from 'zustand/react/shallow';
// @ts-expect-error JSX module
import { ROLES } from '../../core/roles';

/* ─────────────────────────────────────────────────────────────
   GLASS TOKENS
───────────────────────────────────────────────────────────── */

const pillGlass = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px) saturate(130%)',
  WebkitBackdropFilter: 'blur(20px) saturate(130%)',
  border: '0.5px solid rgba(255,255,255,0.16)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.10), inset 0 0.5px 0 rgba(255,255,255,0.22)',
} as const;

const iconBtnGlass = {
  ...pillGlass,
  borderRadius: 12,
} as const;

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

export interface TopbarProps {
  projectName?: string;
  healthScore?: number;   // 0-100
  shootDay?: number;
  totalDays?: number;
  onMenuClick?: () => void;
}

/* ─────────────────────────────────────────────────────────────
   BREADCRUMB MAP
───────────────────────────────────────────────────────────── */

const BREADCRUMB: Record<string, { section: string; page: string; emoji: string }> = {
  dashboard:          { section: 'FrameFlow',      page: 'Dashboard',    emoji: '📊' },
  production:         { section: 'Produção',        page: 'Strip Board',  emoji: '🎬' },
  schedule:           { section: 'Produção',        page: 'Schedule',     emoji: '📅' },
  'pre-production':   { section: 'Produção',        page: 'Schedule',     emoji: '📅' },
  callsheet:          { section: 'Produção',        page: 'Folha Serv.',  emoji: '📋' },
  'post-production':  { section: 'Pós-Produção',   page: 'Dailies',      emoji: '🎞️' },
  universe:           { section: 'O Filme',         page: 'Universo',     emoji: '🌍' },
  continuity:         { section: 'O Filme',         page: 'Continuidade', emoji: '🔄' },
  script:             { section: 'O Filme',         page: 'Guiões',       emoji: '📝' },
  'script-analysis':  { section: 'O Filme',         page: 'Episódios',    emoji: '📺' },
  bible:              { section: 'O Filme',         page: 'Bíblia',       emoji: '📖' },
  'writers-room':     { section: 'O Filme',         page: 'Writers',      emoji: '✍️' },
  files:              { section: 'O Filme',         page: 'Ficheiros',    emoji: '📁' },
  locations:          { section: 'Locais',          page: 'Mapa',         emoji: '📍' },
  team:               { section: 'Equipa',          page: 'Crew & El.',   emoji: '👥' },
  cast:               { section: 'Equipa',          page: 'Elenco',       emoji: '🎭' },
  departments:        { section: 'Departamentos',   page: 'Arte',         emoji: '🎨' },
  'dept-arte':        { section: 'Departamentos',   page: 'Arte',         emoji: '🎨' },
  'dept-guardaroupa': { section: 'Departamentos',   page: 'Gd.Roupa',     emoji: '👔' },
  'dept-makeup':      { section: 'Departamentos',   page: 'Makeup',       emoji: '💄' },
  'dept-camara':      { section: 'Departamentos',   page: 'Câmara',       emoji: '📹' },
  'dept-som':         { section: 'Departamentos',   page: 'Som',          emoji: '🎙️' },
  'dept-casting':     { section: 'Departamentos',   page: 'Casting',      emoji: '🎭' },
  'dept-transporte':  { section: 'Departamentos',   page: 'Transporte',   emoji: '🚗' },
  'dept-stunts':      { section: 'Departamentos',   page: 'Stunts',       emoji: '🔥' },
  optimization:       { section: 'Operações',       page: 'Optimização',  emoji: '⚡' },
  mirror:             { section: 'Operações',       page: 'Espelho',      emoji: '🪞' },
  budget:             { section: 'Finanças',        page: 'Orçamento',    emoji: '💰' },
  finance:            { section: 'Finanças',        page: 'Despesas',     emoji: '🧾' },
  progress:           { section: 'Finanças',        page: 'Relatórios',   emoji: '📊' },
  'live-board':       { section: 'Set',             page: 'Live Board',   emoji: '⚡' },
  settings:           { section: 'Sistema',         page: 'Definições',   emoji: '⚙️' },
  invites:            { section: 'Sistema',         page: 'Convites',     emoji: '✉️' },
};

/* ─────────────────────────────────────────────────────────────
   NOTIFICATION TYPES
───────────────────────────────────────────────────────────── */

interface Notification {
  id: string;
  priority: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFS: Notification[] = [
  { id: 'n1', priority: 'critical', title: 'Orçamento Excedido',  body: 'Equipamento +18% vs. budget. Requer aprovação.', time: '5m',  read: false },
  { id: 'n2', priority: 'warning',  title: 'Chuva prevista',      body: 'EXT Marginal – 15 Mar está em risco. Ver Schedule.', time: '22m', read: false },
  { id: 'n3', priority: 'info',     title: 'Dailies prontos',     body: 'Dia 4 – 23 clips disponíveis para review.', time: '1h',  read: false },
  { id: 'n4', priority: 'success',  title: 'Cena 2B aprovada',    body: 'Director confirmou take 4 como seleccionado.', time: '3h',  read: true  },
];

const PRIORITY_CONFIG = {
  critical: { color: '#ef4444', Icon: AlertTriangle },
  warning:  { color: '#f59e0b', Icon: AlertTriangle },
  info:     { color: '#3b82f6', Icon: Info },
  success:  { color: '#10b981', Icon: CheckCircle2 },
} as const;

/* ─────────────────────────────────────────────────────────────
   HEALTH DOT
───────────────────────────────────────────────────────────── */

function HealthDot({ score }: { score: number }) {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px ${color}, 0 0 12px ${color}60`,
        animation: 'pulse 2s ease-in-out infinite',
      }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.70)' }}>
        {score}%
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */

export const Topbar = forwardRef<HTMLDivElement, TopbarProps>(({
  projectName: projectNameProp,
  healthScore: healthScoreProp,
  shootDay: shootDayProp,
  totalDays: totalDaysProp,
  onMenuClick,
}, ref) => {

  /* ── State ── */
  const [notifOpen, setNotifOpen]     = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [notifs, setNotifs]           = useState<Notification[]>(INITIAL_NOTIFS);

  /* ── Refs ── */
  const notifRef      = useRef<HTMLDivElement>(null);
  const menuRef       = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ── Store ── */
  const {
    projectName: storeName, shootingDays, suggestions, auth, navigate, ui,
    team, locations, parsedScripts, parsedCharacters, departmentItems, logout,
  } = useStore(useShallow((s: any) => ({
    projectName:      s.projectName,
    shootingDays:     s.shootingDays,
    suggestions:      s.suggestions,
    auth:             s.auth,
    navigate:         s.navigate,
    ui:               s.ui,
    team:             s.team,
    locations:        s.locations,
    parsedScripts:    s.parsedScripts,
    parsedCharacters: s.parsedCharacters,
    departmentItems:  s.departmentItems,
    logout:           s.logout,
  })));

  const activeModule = ui?.activeModule || 'dashboard';

  /* ── Computed values ── */
  const today = new Date().toISOString().slice(0, 10);
  const todayIdx = (shootingDays || []).findIndex((d: any) => d.date === today);
  const computedShootDay = todayIdx >= 0 ? todayIdx + 1 : (shootDayProp || 0);

  const pendingCount = (suggestions || []).filter((s: any) => s.status === 'pending').length;
  const autoHealth   = Math.max(0, 100 - pendingCount * 8);
  const score        = healthScoreProp ?? autoHealth;

  const criticalCount = score < 40 ? 1 : 0;
  const warningCount  = pendingCount > 3 ? pendingCount : (score < 70 && score >= 40 ? 1 : 0);

  const finalProjectName = storeName || projectNameProp || 'FrameFlow';
  const totalDays        = (shootingDays || []).length || totalDaysProp || 0;

  const unreadCount = notifs.filter(n => !n.read).length;

  const theme = auth?.theme || 'dark';

  const userName    = auth?.user?.name || 'GPS';
  const userInitials = userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const roleLabel = ROLES?.[auth?.role]?.label || auth?.role || '';

  const bc = BREADCRUMB[activeModule] || { section: 'FrameFlow', page: 'Dashboard', emoji: '🎬' };

  /* ── ⌘K shortcut ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(v => !v); }
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false); setMenuOpen(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* ── Click outside — notif panel ── */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Click outside — user menu ── */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Focus search input when modal opens ── */
  useEffect(() => {
    if (searchOpen) {
      setSearchQuery('');
      setSelectedIdx(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  /* ── Search results ── */
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const out: any[] = [];

    function match(text: string) { return text?.toLowerCase().includes(q); }

    // Nav modules
    Object.entries(BREADCRUMB).forEach(([id, bcEntry]) => {
      if (match(bcEntry.page) || match(bcEntry.section)) {
        out.push({ id: `nav-${id}`, label: bcEntry.page, sub: bcEntry.section, emoji: bcEntry.emoji, color: '#10b981', action: () => navigate(id) });
      }
    });

    // Team
    (team || []).forEach((m: any) => {
      if (match(m.name || '')) out.push({ id: `m-${m.id}`, label: m.name, sub: m.role || m.group, emoji: '👤', color: '#3b82f6', action: () => navigate('team') });
    });

    // Locations
    (locations || []).forEach((l: any) => {
      if (match(l.name || '')) out.push({ id: `l-${l.id}`, label: l.name, sub: l.address || 'Local', emoji: '📍', color: '#10b981', action: () => navigate('locations') });
    });

    // Scenes
    Object.entries(parsedScripts || {}).forEach(([epId, ep]: any) => {
      (ep?.scenes || []).forEach((s: any) => {
        const h = s.heading?.full || s.heading?.location || '';
        if (match(h)) out.push({ id: `sc-${epId}-${s.id}`, label: h, sub: `${epId}`, emoji: '🎬', color: '#3b82f6', action: () => navigate('script') });
      });
    });

    return out.slice(0, 12);
  }, [searchQuery, team, locations, parsedScripts, navigate]);

  /* ── Keyboard nav for search ── */
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, searchResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const r = searchResults[selectedIdx];
      if (r) { r.action(); setSearchOpen(false); }
    } else if (e.key === 'Escape') { setSearchOpen(false); }
  }, [searchResults, selectedIdx]);

  /* ── Theme setter ── */
  const setTheme = (t: string) => {
    (useStore as any).setState((s: any) => ({ auth: { ...s.auth, theme: t } }));
  };

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */

  return (
    <div
      ref={ref}
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        gap: 12,
        position: 'relative',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ── LEFT ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>

        {/* PROJECT PILL */}
        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 999, overflow: 'hidden', flexShrink: 0, ...pillGlass }}>
          {/* Clapperboard bubble */}
          <div style={{
            width: 36, height: 36, marginLeft: 4, borderRadius: '50%',
            background: 'rgba(16,185,129,0.15)',
            border: '0.5px solid rgba(16,185,129,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clapperboard size={16} style={{ color: '#10b981' }} />
          </div>

          {/* Project name */}
          <span
            style={{
              paddingLeft: 10, paddingRight: 4,
              fontSize: 14, fontWeight: 600,
              color: 'rgba(255,255,255,0.95)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: 120,
            }}
            className="md:max-w-[180px]"
          >
            {finalProjectName}
          </span>

          {/* Separator */}
          <div style={{
            width: 1, height: 16, marginLeft: 8, marginRight: 8,
            background: 'rgba(255,255,255,0.14)', flexShrink: 0,
          }} />

          {/* Shoot day cluster */}
          {totalDays > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 12 }}>
              <Clock size={12} style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.60)' }}>Dia</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.90)' }}>
                {computedShootDay || shootDayProp || '—'}
              </span>
              <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>/{totalDays}</span>
            </div>
          )}
        </div>

        {/* HEALTH PILL — hidden on small, flex on md+ */}
        <div
          className="hidden md:flex"
          style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: 999, flexShrink: 0, ...pillGlass }}
        >
          <HealthDot score={score} />
        </div>

        {/* ALERT BADGES — hidden lg:flex */}
        <div className="hidden lg:flex" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {criticalCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 700,
              color: '#ef4444',
              background: 'rgba(239,68,68,0.14)',
              border: '0.5px solid rgba(239,68,68,0.35)',
              boxShadow: '0 0 8px rgba(239,68,68,0.15)',
            }}>
              <AlertTriangle size={12} />
              {criticalCount} Crítico
            </div>
          )}
          {warningCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 700,
              color: '#f59e0b',
              background: 'rgba(245,158,11,0.13)',
              border: '0.5px solid rgba(245,158,11,0.30)',
              boxShadow: '0 0 8px rgba(245,158,11,0.12)',
            }}>
              <AlertTriangle size={12} />
              {warningCount} Avisos
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER BREADCRUMB — hidden xl:flex, absolute ─────── */}
      <div
        className="hidden xl:flex"
        style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none', userSelect: 'none',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{bc.emoji}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>{bc.section}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.20)' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.80)' }}>{bc.page}</span>
        </div>
      </div>

      {/* ── RIGHT ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

        {/* SEARCH BUTTON — hidden sm:flex */}
        <motion.button
          className="hidden sm:flex"
          whileTap={{ scale: 0.95 }}
          onClick={() => setSearchOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', ...iconBtnGlass, transition: 'all 150ms', cursor: 'pointer' }}
        >
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <circle cx={7} cy={7} r={4.5} stroke="rgba(255,255,255,0.55)" strokeWidth={1.2} />
            <line x1={11} y1={11} x2={13.5} y2={13.5} stroke="rgba(255,255,255,0.55)" strokeWidth={1.3} strokeLinecap="round" />
          </svg>
          <span className="hidden lg:block" style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)' }}>Procurar...</span>
          <kbd className="hidden lg:flex" style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 16, padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>⌘</span>K
          </kbd>
        </motion.button>

        {/* BELL BUTTON + NOTIFICATION PANEL */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <motion.button
            whileTap={{ scale: 0.90 }}
            onClick={() => setNotifOpen(v => !v)}
            style={{
              width: 40, height: 40, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: notifOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
              border: '0.5px solid rgba(255,255,255,0.16)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.10), inset 0 0.5px 0 rgba(255,255,255,0.22)',
              position: 'relative', cursor: 'pointer',
            }}
          >
            <Bell size={18} style={{ color: notifOpen ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)' }} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 400 }}
                  style={{
                    position: 'absolute', top: 5, right: 5,
                    width: unreadCount > 9 ? 18 : 14, height: 14,
                    borderRadius: 7, background: '#ef4444',
                    border: '1.5px solid rgba(0,0,0,0.3)',
                    boxShadow: '0 0 8px rgba(239,68,68,0.7)',
                    fontSize: 9, fontWeight: 800, color: '#fff',
                    lineHeight: 1, letterSpacing: '-0.02em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* NOTIFICATION PANEL */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380, mass: 0.7 }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 340, borderRadius: 20, overflow: 'hidden', zIndex: 50,
                  background: 'rgba(18,22,34,0.85)',
                  backdropFilter: 'blur(40px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(160%)',
                  border: '0.5px solid rgba(255,255,255,0.18)',
                  boxShadow: '0 16px 56px rgba(0,0,0,0.45), inset 0 0.5px 0 rgba(255,255,255,0.18)',
                }}
              >
                {/* Lensing top line */}
                <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.32) 50%, transparent 100%)', pointerEvents: 'none' }} />

                {/* HEADER */}
                <div style={{ padding: '16px 16px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={16} style={{ color: 'rgba(255,255,255,0.70)' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.90)' }}>Notificações</span>
                    {unreadCount > 0 && (
                      <div style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: '#ef4444', color: '#fff' }}>{unreadCount}</div>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => setNotifs(n => n.map(x => ({ ...x, read: true })))}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                      style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                    >
                      Marcar todas
                    </button>
                  )}
                </div>

                {/* NOTIFICATION LIST */}
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  <AnimatePresence initial={false}>
                    {notifs.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Bell size={20} style={{ color: 'rgba(255,255,255,0.25)' }} />
                        </div>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Tudo em dia</span>
                      </div>
                    ) : notifs.map((n, idx) => {
                      const { color, Icon } = PRIORITY_CONFIG[n.priority];
                      return (
                        <motion.div key={n.id} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
                          <div
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(255,255,255,0.025)')}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
                              background: n.read ? 'transparent' : 'rgba(255,255,255,0.025)',
                              borderBottom: idx < notifs.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                              cursor: 'default', transition: 'background 0.15s',
                            }}
                          >
                            {/* Priority icon */}
                            <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, marginTop: 2, background: `${color}18`, border: `0.5px solid ${color}40`, boxShadow: `0 0 8px ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon size={16} style={{ color }} />
                            </div>
                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: n.read ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.92)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                                {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: color, boxShadow: `0 0 4px ${color}` }} />}
                              </div>
                              <p style={{ margin: 0, fontSize: 11, lineHeight: 1.4, color: 'rgba(255,255,255,0.45)' }}>{n.body}</p>
                            </div>
                            {/* Time + dismiss */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)' }}>{n.time}</span>
                              <button
                                onClick={e => { e.stopPropagation(); setNotifs(prev => prev.filter(x => x.id !== n.id)); }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                                style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                              >
                                <X size={12} style={{ color: 'rgba(255,255,255,0.50)' }} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* FOOTER */}
                {notifs.length > 0 && (
                  <div style={{ padding: '12px 16px', borderTop: '0.5px solid rgba(255,255,255,0.09)' }}>
                    <button
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.40)')}
                      style={{ width: '100%', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.40)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                    >
                      Ver todas as notificações →
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* USER AVATAR + DROPDOWN */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setMenuOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
              borderRadius: 8, minHeight: 44,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: menuOpen ? '0.5px solid #10b981' : '0.5px solid rgba(255,255,255,0.15)',
              boxShadow: menuOpen
                ? '0 2px 8px rgba(0,0,0,0.08), inset 0 0.5px 0.5px rgba(255,255,255,0.2), 0 0 0 2px rgba(16,185,129,0.25)'
                : '0 2px 8px rgba(0,0,0,0.08), inset 0 0.5px 0.5px rgba(255,255,255,0.2)',
              cursor: 'pointer', transition: 'all 200ms',
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {userInitials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.90)' }}>{userName}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>{roleLabel}</div>
            </div>
          </motion.button>

          {/* USER DROPDOWN */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 288, borderRadius: 12, overflow: 'hidden', zIndex: 50,
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                  border: '0.5px solid rgba(255,255,255,0.18)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.30), inset 0 0.5px 0.5px rgba(255,255,255,0.2)',
                }}
              >
                {/* USER INFO HEADER */}
                <div style={{ padding: 16, borderBottom: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {userInitials}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.90)' }}>{userName}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)' }}>{roleLabel}</div>
                  </div>
                </div>

                {/* THEME TOGGLE */}
                <div style={{ padding: 16, borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Settings size={16} style={{ color: 'rgba(255,255,255,0.60)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.80)' }}>Tema</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {([
                      { id: 'light', label: 'Light', Icon: Sun },
                      { id: 'dark',  label: 'Dark',  Icon: Moon },
                      { id: 'auto',  label: 'Auto',  Icon: Sparkles },
                    ] as const).map(({ id, label, Icon: ThemeIcon }) => {
                      const isActive = theme === id || (id === 'dark' && theme === 'dark') || (id === 'light' && theme === 'bright');
                      return (
                        <button
                          key={id}
                          onClick={() => setTheme(id === 'light' ? 'bright' : id)}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, cursor: 'pointer',
                            background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                            border: isActive ? '0.5px solid #10b981' : '0.5px solid rgba(255,255,255,0.10)',
                          }}
                        >
                          <ThemeIcon size={16} style={{ color: isActive ? '#10b981' : 'rgba(255,255,255,0.40)' }} />
                          <span style={{ fontSize: 11, fontWeight: 500, color: isActive ? '#10b981' : 'rgba(255,255,255,0.40)' }}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {theme === 'auto' && (
                    <div style={{ marginTop: 12, padding: 10, borderRadius: 8, fontSize: 11, background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.2)', color: 'rgba(255,255,255,0.50)' }}>
                      ⚡ Modo automático: Dark de 19h-7h, Light de dia
                    </div>
                  )}
                </div>

                {/* MENU ITEMS */}
                <div>
                  <button
                    onClick={() => { navigate('settings'); setMenuOpen(false); }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                  >
                    <Settings size={16} style={{ color: 'rgba(255,255,255,0.60)' }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.90)' }}>Todas as Definições</span>
                  </button>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.10)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderTop: '0.5px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 0.15s' }}
                  >
                    <LogOut size={16} style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: 13, color: '#ef4444' }}>Terminar Sessão</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── SEARCH MODAL (⌘K) — portal so it escapes overflow:hidden + stacking context ── */}
      {createPortal(
        <AnimatePresence>
          {searchOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSearchOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              />
              {/* Modal */}
              <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh', paddingLeft: 16, paddingRight: 16 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{ width: '100%', maxWidth: 672, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
              >
                {/* Search box */}
                <div style={{ borderRadius: 24, overflow: 'hidden', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px) saturate(120%)', border: '0.5px solid rgba(255,255,255,0.18)', boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,255,0.25), 0 20px 60px -10px rgba(0,0,0,0.5), 0 40px 100px -20px rgba(0,0,0,0.3)' }}>
                  {/* Input bar */}
                  <div style={{ padding: '20px 24px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,20,0.30)', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Search size={24} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.40)' }} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setSelectedIdx(0); }}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Procurar cenas, pessoas, locais, takes..."
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 18, color: 'rgba(255,255,255,0.90)', fontFamily: "'Inter',sans-serif" }}
                    />
                    <kbd style={{ padding: '4px 8px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', flexShrink: 0, background: 'rgba(42,42,62,0.6)', backdropFilter: 'blur(20px)', border: '0.5px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.40)' }}>ESC</kbd>
                  </div>

                  {/* Results area */}
                  <div style={{ padding: 16, overflowY: 'auto', maxHeight: 'calc(70vh - 80px)' }}>
                    {!searchQuery ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Quick Actions */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 12 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>Acções Rápidas</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {[
                              { label: 'Strip Board', color: '#3b82f6', emoji: '🎬', mod: 'production' },
                              { label: 'Live Board',  color: '#ef4444', emoji: '📡', mod: 'live-board' },
                              { label: 'Espelho AI',  color: '#10b981', emoji: '🪞', mod: 'mirror' },
                              { label: 'Orçamento',   color: '#f59e0b', emoji: '💰', mod: 'budget' },
                            ].map(a => (
                              <button
                                key={a.mod}
                                onClick={() => { navigate(a.mod); setSearchOpen(false); }}
                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                style={{ padding: 16, borderRadius: 12, textAlign: 'left', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'transform 0.1s' }}
                              >
                                <div style={{ width: 40, height: 40, borderRadius: 8, marginBottom: 12, background: `${a.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: 18 }}>{a.emoji}</span>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.90)' }}>{a.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Keyboard hints */}
                        <div style={{ padding: 16, borderRadius: 12, textAlign: 'center', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.30)' }}>
                          <span>↑↓ navegar</span>
                          <span>⏎ seleccionar</span>
                          <span>ESC fechar</span>
                        </div>
                      </div>
                    ) : (
                      searchResults.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
                          Sem resultados para "{searchQuery}"
                        </div>
                      ) : (
                        <div>
                          {searchResults.map((r: any, i: number) => {
                            const isSelected = i === selectedIdx;
                            return (
                              <motion.button
                                key={r.id}
                                whileTap={{ scale: 0.99 }}
                                onMouseEnter={() => setSelectedIdx(i)}
                                onClick={() => { r.action(); setSearchOpen(false); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 16, width: '100%', padding: 16, borderRadius: 12, marginBottom: 8, textAlign: 'left',
                                  background: isSelected ? '#10b981' : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${isSelected ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
                                  cursor: 'pointer',
                                }}
                              >
                                <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, background: isSelected ? 'rgba(255,255,255,0.2)' : `${r.color || '#3b82f6'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: 18 }}>{r.emoji || '📄'}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 900, color: isSelected ? '#fff' : 'rgba(255,255,255,0.90)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{r.label}</div>
                                  <div style={{ fontSize: 12, color: isSelected ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.40)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</div>
                                </div>
                                <ArrowRight size={16} style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.30)', flexShrink: 0 }} />
                              </motion.button>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Footer hint */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  style={{ display: 'inline-flex', alignSelf: 'center', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, marginTop: 12, fontSize: 12, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)', color: 'rgba(255,255,255,0.35)' }}
                >
                  <Command size={12} />
                  Pressiona ⌘K em qualquer lugar para abrir
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
});

Topbar.displayName = 'Topbar';
