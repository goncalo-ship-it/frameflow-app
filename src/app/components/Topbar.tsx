/**
 * TOPBAR — FrameFlow Liquid Glass
 *
 * Layout: [hamburger | project-pill | shoot-day | health | alerts] ·· [page-context] ·· [search | bell | user]
 *
 * Regras Liquid Glass:
 *  - blur 20px, border 0.5px, inner highlight 0.5px, sombra ultra-suave
 *  - Pill shapes para itens agrupados
 *  - Spring animations (motion/react)
 *  - Notificações em painel dropdown glass
 *  - Search abre UniversalSearchModal (⌘K)
 */

import { forwardRef, HTMLAttributes, useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { clsx } from 'clsx';
import { Menu, Bell, Clapperboard, AlertTriangle, Info, CheckCircle2, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// @ts-expect-error JSX module
import { useStore } from '../../core/store';
// @ts-expect-error JSX module
import { useShallow } from 'zustand/react/shallow';
import { UserMenu } from './UserMenu';
import { UniversalSearchModal } from './UniversalSearchModal';

/* ─────────────────────────────────────────────────────────────────────────────
   MODULE → PAGE CONTEXT MAP  (moduleId keys, not URL paths)
───────────────────────────────────────────────────────────────────────────── */

const ROUTE_LABELS: Record<string, { section: string; page: string; emoji: string }> = {
  // Novos IDs
  'hoje':          { section: 'FrameFlow',     page: 'Hoje',         emoji: '☀️' },
  'planeamento':   { section: 'Produção',      page: 'Planeamento',  emoji: '🎯' },
  'filme':         { section: 'O Filme',       page: 'Filme',        emoji: '🎬' },
  'equipa':        { section: 'Equipa',        page: 'Equipa',       emoji: '👥' },
  'departamentos': { section: 'Departamentos', page: 'Departamentos',emoji: '🎨' },
  'pos':           { section: 'Pós-Produção',  page: 'Pós',          emoji: '✨' },
  'convites':      { section: 'Sistema',       page: 'Convites',     emoji: '✉️' },
  'definicoes':    { section: 'Sistema',       page: 'Definições',   emoji: '⚙️' },
  // IDs originais
  'dashboard':          { section: 'FrameFlow',     page: 'Dashboard',        emoji: '📊' },
  'production':         { section: 'Produção',      page: 'Strip Board',      emoji: '🎬' },
  'schedule':           { section: 'Produção',      page: 'Schedule',         emoji: '📅' },
  'callsheet':          { section: 'Produção',      page: 'Folha de Serviço', emoji: '📋' },
  'post-production':    { section: 'Pós-Produção',  page: 'Visão Geral',      emoji: '✨' },
  'dailies':            { section: 'Pós-Produção',  page: 'Dailies',          emoji: '🎞️' },
  'universe':           { section: 'O Filme',       page: 'Universo',         emoji: '🌍' },
  'script-analysis':    { section: 'O Filme',       page: 'Episódios',        emoji: '📺' },
  'bible':              { section: 'O Filme',       page: 'Bíblia',           emoji: '📖' },
  'writers-room':       { section: 'O Filme',       page: 'Writers Room',     emoji: '✍️' },
  'files':              { section: 'O Filme',       page: 'Ficheiros',        emoji: '📁' },
  'script':             { section: 'O Filme',       page: 'Guiões',           emoji: '📝' },
  'continuity':         { section: 'O Filme',       page: 'Continuidade',     emoji: '🔄' },
  'locations':          { section: 'Locais',        page: 'Mapa',             emoji: '📍' },
  'team':               { section: 'Equipa',        page: 'Crew & Elenco',    emoji: '👥' },
  'cast':               { section: 'Equipa',        page: 'Elenco',           emoji: '🎭' },
  'departments':        { section: 'Departamentos', page: 'Visão Geral',      emoji: '🎨' },
  'dept-arte':          { section: 'Departamentos', page: 'Arte',             emoji: '🎨' },
  'dept-guardaroupa':   { section: 'Departamentos', page: 'Guarda-Roupa',     emoji: '👔' },
  'dept-makeup':        { section: 'Departamentos', page: 'Makeup & Hair',    emoji: '💄' },
  'dept-camara':        { section: 'Departamentos', page: 'Câmara',           emoji: '📹' },
  'dept-som':           { section: 'Departamentos', page: 'Som',              emoji: '🎙️' },
  'dept-casting':       { section: 'Departamentos', page: 'Casting',          emoji: '🎭' },
  'dept-transporte':    { section: 'Departamentos', page: 'Transporte',       emoji: '🚗' },
  'dept-stunts':        { section: 'Departamentos', page: 'Stunts',           emoji: '🔥' },
  'optimization':       { section: 'Operações',     page: 'Optimização',      emoji: '⚡' },
  'health-safety':      { section: 'Operações',     page: 'Saúde & Segurança',emoji: '🛡️' },
  'canon':              { section: 'Operações',     page: 'Canon',            emoji: '📜' },
  'meals':              { section: 'Operações',     page: 'Meals',            emoji: '🍽️' },
  'mirror':             { section: 'Operações',     page: 'Espelho',          emoji: '🪞' },
  'budget':             { section: 'Finanças',      page: 'Orçamento',        emoji: '💰' },
  'finance':            { section: 'Finanças',      page: 'Finanças',         emoji: '💰' },
  'realtime':           { section: 'Set',           page: 'Real-Time Info',   emoji: '🔴' },
  'live-board':         { section: 'Set',           page: 'Live Board',       emoji: '⚡' },
  'settings':           { section: 'Sistema',       page: 'Definições',       emoji: '⚙️' },
  'invites':            { section: 'Sistema',       page: 'Convites',         emoji: '✉️' },
  'myday':              { section: 'FrameFlow',     page: 'O Meu Dia',        emoji: '☀️' },
  // Pós-Produção sub-pages
  'pos-selects':        { section: 'Pós-Produção',  page: 'Selects',          emoji: '🎯' },
  'pos-montagem':       { section: 'Pós-Produção',  page: 'Montagem',         emoji: '✂️' },
  'pos-vfx':            { section: 'Pós-Produção',  page: 'VFX',              emoji: '⚡' },
  'pos-cor':            { section: 'Pós-Produção',  page: 'Color',            emoji: '🎨' },
  'pos-som':            { section: 'Pós-Produção',  page: 'Sound Mix',        emoji: '🎵' },
  // Mirror sub-pages
  'mirror-consultas':   { section: 'Mirror',        page: 'Consultas',        emoji: '❓' },
  'mirror-sugestoes':   { section: 'Mirror',        page: 'Sugestões',        emoji: '💡' },
  'mirror-memoria':     { section: 'Mirror',        page: 'Memória',          emoji: '🧠' },
};

/* ─────────────────────────────────────────────────────────────────────────────
   NOTIFICATION TYPES
───────────────────────────────────────────────────────────────────────────── */

type NotifPriority = 'critical' | 'warning' | 'info' | 'success';

interface Notif {
  id: string;
  priority: NotifPriority;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFS: Notif[] = [
  {
    id: 'n1',
    priority: 'critical',
    title: 'Orçamento Excedido',
    body: 'Equipamento +18% vs. budget. Requer aprovação.',
    time: '5m',
    read: false,
  },
  {
    id: 'n2',
    priority: 'warning',
    title: 'Chuva prevista',
    body: 'EXT Marginal – 15 Mar está em risco. Ver Schedule.',
    time: '22m',
    read: false,
  },
  {
    id: 'n3',
    priority: 'info',
    title: 'Dailies prontos',
    body: 'Dia 4 – 23 clips disponíveis para review.',
    time: '1h',
    read: false,
  },
  {
    id: 'n4',
    priority: 'success',
    title: 'Cena 2B aprovada',
    body: 'Director confirmou take 4 como seleccionado.',
    time: '3h',
    read: true,
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   PILL GLASS — base style reutilizável
───────────────────────────────────────────────────────────────────────────── */

const pillGlass: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.07)',
  backdropFilter: 'blur(20px) saturate(130%)',
  WebkitBackdropFilter: 'blur(20px) saturate(130%)',
  border: '0.5px solid rgba(255, 255, 255, 0.16)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.10), inset 0 0.5px 0 rgba(255,255,255,0.22)',
};

const iconBtnGlass: CSSProperties = {
  ...pillGlass,
  borderRadius: '12px',
};

/* ─────────────────────────────────────────────────────────────────────────────
   PRIORITY HELPERS
───────────────────────────────────────────────────────────────────────────── */

function priorityColor(p: NotifPriority) {
  switch (p) {
    case 'critical': return '#ef4444';
    case 'warning':  return '#f59e0b';
    case 'success':  return '#10b981';
    default:         return '#3b82f6';
  }
}

function priorityIcon(p: NotifPriority) {
  switch (p) {
    case 'critical': return AlertTriangle;
    case 'warning':  return AlertTriangle;
    case 'success':  return CheckCircle2;
    default:         return Info;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   NOTIFICATION PANEL
───────────────────────────────────────────────────────────────────────────── */

function NotifPanel({
  notifs,
  onDismiss,
  onDismissAll,
}: {
  notifs: Notif[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}) {
  const unread = notifs.filter(n => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ type: 'spring', damping: 28, stiffness: 380, mass: 0.7 }}
      className="absolute right-0 top-full mt-2 w-[340px] rounded-[20px] overflow-hidden z-50"
      style={{
        background: 'rgba(78, 80, 88, 0.18)',
        backdropFilter: 'blur(20px) saturate(120%)',
        WebkitBackdropFilter: 'blur(20px) saturate(120%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
      }}
    >
      {/* Inner top lensing highlight */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.32) 50%, transparent 100%)' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.09)' }}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.7)' }} />
          <span className="text-[14px] font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Notificações
          </span>
          {unread > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background: '#ef4444', color: '#fff' }}
            >
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={onDismissAll}
            className="text-[12px] transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          >
            Marcar todas
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {notifs.map((n, i) => {
            const IconComp = priorityIcon(n.priority);
            const color = priorityColor(n.priority);
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="relative flex items-start gap-3 px-4 py-3 group"
                style={{
                  borderBottom: i < notifs.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                  background: n.read ? 'transparent' : 'rgba(255,255,255,0.025)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(255,255,255,0.025)')}
              >
                {/* Priority dot + icon */}
                <div
                  className="mt-0.5 w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${color}18`,
                    border: `0.5px solid ${color}40`,
                    boxShadow: `0 0 8px ${color}25`,
                  }}
                >
                  <IconComp className="w-4 h-4" style={{ color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold truncate" style={{ color: n.read ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.92)' }}>
                      {n.title}
                    </span>
                    {!n.read && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: color, boxShadow: `0 0 4px ${color}` }}
                      />
                    )}
                  </div>
                  <p className="text-[11px] leading-[1.4]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {n.body}
                  </p>
                </div>

                {/* Time + dismiss */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {n.time}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); onDismiss(n.id); }}
                    className="opacity-60 transition-opacity w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer' }}
                  >
                    <X className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.5)' }} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {notifs.length === 0 && (
          <div className="flex flex-col items-center py-10 gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.10)' }}
            >
              <Bell className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.25)' }} />
            </div>
            <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Tudo em dia
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifs.length > 0 && (
        <div
          className="px-4 py-3"
          style={{ borderTop: '0.5px solid rgba(255,255,255,0.09)' }}
        >
          <button
            className="w-full text-center text-[12px] transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            Ver todas as notificações →
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HEALTH DOT
───────────────────────────────────────────────────────────────────────────── */

function HealthDot({ score }: { score: number }) {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ background: color, boxShadow: `0 0 6px ${color}, 0 0 12px ${color}60` }}
      />
      <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {score}%
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN TOPBAR COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export interface TopbarProps extends HTMLAttributes<HTMLDivElement> {
  projectName?: string;
  healthScore?: number;
  shootDay?: number;
  totalDays?: number;
  onMenuClick?: () => void;
}

export const Topbar = forwardRef<HTMLDivElement, TopbarProps>(
  (
    {
      onMenuClick,
      className,
      ...props
    },
    ref
  ) => {
    // Pull real data from store
    const { ui, shootingDays, projectName: storeProjectName } = useStore(useShallow((s: any) => ({
      ui: s.ui,
      shootingDays: s.shootingDays,
      projectName: s.projectName,
    })));

    const activeModule: string = ui?.activeModule || 'dashboard';
    const projectName = storeProjectName || 'DESDOBRADO';
    const totalDays = shootingDays?.length ?? 32;
    // shootDay: find index of first future or current day
    const shootDay = Math.max(1, Math.min(
      (shootingDays?.findIndex((d: any) => new Date(d.date) >= new Date()) ?? 0) + 1,
      totalDays
    ));
    const healthScore = 35; // static until health module exists

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifs, setNotifs] = useState<Notif[]>(MOCK_NOTIFS);
    const notifRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifs.filter(n => !n.read).length;

    /* ── ⌘K global shortcut ── */
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, []);

    /* ── Close notif panel on outside click ── */
    useEffect(() => {
      if (!isNotifOpen) return;
      const handler = (e: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
          setIsNotifOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [isNotifOpen]);

    /* ── Notif actions ── */
    const dismissNotif = useCallback((id: string) => {
      setNotifs(prev => prev.filter(n => n.id !== id));
    }, []);

    const dismissAll = useCallback(() => {
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    /* ── Page context from active module ── */
    const pageCtx = ROUTE_LABELS[activeModule] ?? {
      section: 'FrameFlow',
      page: 'Dashboard',
      emoji: '🎬',
    };

    /* ── Alert pill counts (static mock, replace with real state) ── */
    const criticalCount = 1;
    const warningCount  = 2;

    return (
      <>
        <div
          ref={ref}
          className={clsx('h-16 flex items-center justify-between px-3 md:px-5 gap-3', className)}
          style={{ background: 'transparent', position: 'relative' }}
          {...props}
        >

          {/* ════════════════════════════════════ LEFT ═══════════════════════════════ */}
          <div className="flex items-center gap-2 min-w-0">

            {/* Hamburger */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onMenuClick}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-[12px] transition-colors flex-shrink-0"
              style={{ ...iconBtnGlass, background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer' }}
            >
              <Menu className="w-[18px] h-[18px]" style={{ color: 'rgba(255,255,255,0.85)' }} />
            </motion.button>

            {/* Project pill — nome + dia de rodagem */}
            <div
              className="flex items-center gap-0 rounded-full overflow-hidden flex-shrink-0"
              style={pillGlass}
            >
              {/* Clapperboard icon bubble */}
              <div
                className="w-9 h-9 flex items-center justify-center ml-1"
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  borderRadius: '50%',
                  border: '0.5px solid rgba(16,185,129,0.30)',
                }}
              >
                <Clapperboard className="w-4 h-4" style={{ color: '#10b981' }} />
              </div>

              {/* Name */}
              <span
                className="pl-2.5 pr-1 text-[14px] font-semibold truncate max-w-[120px] md:max-w-[180px]"
                style={{ color: 'rgba(255,255,255,0.95)' }}
              >
                {projectName}
              </span>

              {/* Separator */}
              <div className="w-px h-4 mx-2" style={{ background: 'rgba(255,255,255,0.14)' }} />

              {/* Shoot day */}
              <div className="flex items-center gap-1 pr-3">
                <Clock className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }} />
                <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Dia
                </span>
                <span className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {shootDay}
                </span>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  /{totalDays}
                </span>
              </div>
            </div>

            {/* Health score pill (md+) */}
            <div
              className="hidden md:flex items-center px-3 py-2 rounded-full flex-shrink-0"
              style={pillGlass}
            >
              <HealthDot score={healthScore} />
            </div>

            {/* Alert badges (lg+) */}
            <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
              {criticalCount > 0 && (
                <span
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{
                    background: 'rgba(239,68,68,0.14)',
                    border: '0.5px solid rgba(239,68,68,0.35)',
                    color: '#ef4444',
                    boxShadow: '0 0 8px rgba(239,68,68,0.15)',
                  }}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {criticalCount} Crítico
                </span>
              )}
              {warningCount > 0 && (
                <span
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{
                    background: 'rgba(245,158,11,0.13)',
                    border: '0.5px solid rgba(245,158,11,0.30)',
                    color: '#f59e0b',
                    boxShadow: '0 0 8px rgba(245,158,11,0.12)',
                  }}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {warningCount} Avisos
                </span>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════ CENTER ═══════════════════════════════ */}
          {/* Page context — só visível em ecrãs largos */}
          <div className="hidden xl:flex items-center gap-2 absolute left-1/2 -translate-x-1/2 pointer-events-none select-none">
            <span className="text-[18px] leading-none">{pageCtx.emoji}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {pageCtx.section}
              </span>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
              <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {pageCtx.page}
              </span>
            </div>
          </div>

          {/* ════════════════════════════════════ RIGHT ══════════════════════════════ */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Search button — sm+ */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-[12px] transition-all duration-150 group"
              style={{ ...iconBtnGlass, border: 'none', cursor: 'pointer' }}
            >
              {/* Magnifying glass — custom path for sharpness */}
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                className="flex-shrink-0"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span
                className="hidden lg:block text-[13px]"
                style={{ color: 'rgba(255,255,255,0.50)' }}
              >
                Procurar...
              </span>
              <kbd
                className="hidden lg:flex items-center gap-0.5 ml-4 px-1.5 py-0.5 rounded-[6px] text-[11px] font-medium flex-shrink-0"
                style={{
                  color: 'rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '0.5px solid rgba(255,255,255,0.12)',
                }}
              >
                <span style={{ fontSize: '13px', lineHeight: 1 }}>⌘</span>K
              </kbd>
            </motion.button>

            {/* Notifications bell */}
            <div ref={notifRef} className="relative">
              <motion.button
                whileTap={{ scale: 0.90 }}
                onClick={() => setIsNotifOpen(v => !v)}
                className="relative w-10 h-10 flex items-center justify-center rounded-[12px] transition-all duration-150"
                style={{
                  ...iconBtnGlass,
                  background: isNotifOpen
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(255,255,255,0.07)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Bell
                  className="w-[18px] h-[18px]"
                  style={{ color: isNotifOpen ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)' }}
                />
                {/* Unread dot */}
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.div
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', damping: 18, stiffness: 400 }}
                      className="absolute flex items-center justify-center"
                      style={{
                        top: '5px',
                        right: '5px',
                        width: unreadCount > 9 ? '18px' : '14px',
                        height: '14px',
                        borderRadius: '7px',
                        background: '#ef4444',
                        border: '1.5px solid rgba(0,0,0,0.3)',
                        boxShadow: '0 0 8px rgba(239,68,68,0.7)',
                        fontSize: '9px',
                        fontWeight: 800,
                        color: '#fff',
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Notification Panel */}
              <AnimatePresence>
                {isNotifOpen && (
                  <NotifPanel
                    notifs={notifs}
                    onDismiss={dismissNotif}
                    onDismissAll={dismissAll}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>

        {/* Universal Search Modal */}
        <UniversalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      </>
    );
  }
);
