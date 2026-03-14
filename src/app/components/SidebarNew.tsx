import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Film,
  Zap,
  MapPin,
  Users,
  Settings,
  Mail,
  Plug,
  ChevronRight,
  X,
  Network,
  Clapperboard,
  BookOpen,
  Folder,
  Calendar,
  Target,
  Palette,
  Utensils,
  Heart,
  UserPlus,
  Eye,
  RefreshCw,
  PanelLeftClose,
  Scissors,
  Sparkles,
  Camera,
  Mic,
  Car,
  Flame,
  Drama,
  Brush,
  Sun,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';
import { motion } from 'motion/react';
// @ts-expect-error JSX module
import { useStore } from '../../core/store';
// @ts-expect-error JSX module
import { useShallow } from 'zustand/react/shallow';
// @ts-expect-error JSX module
import { FrameFlowLogo } from '../../components/shared/FrameFlowLogo';
import { GLASS, R, SHADOW } from '../../components/shared/ui/tokens';

interface MenuItem {
  icon: any;
  label: string;
  moduleId: string;
  badge?: string;
  emoji?: string;
  color?: string;
  submenu?: {
    label: string;
    moduleId: string;
    icon?: any;
  }[];
}

interface SidebarNewProps {
  onClose?: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export function SidebarNew({ onClose, expanded, onToggleExpand }: SidebarNewProps) {
  const { navigate, ui, auth } = useStore(useShallow((s: any) => ({
    navigate: s.navigate,
    ui: s.ui,
    auth: s.auth,
  })));

  const activeModule: string = ui?.activeModule || 'dashboard';
  const isSuperAdmin = auth?.isSuperAdmin;
  const userRole = auth?.role || '';

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [localExpanded, setLocalExpanded] = useState(true);
  const isExpanded = expanded !== undefined ? expanded : localExpanded;
  const setIsExpanded = onToggleExpand
    ? () => onToggleExpand()
    : (v: boolean | ((prev: boolean) => boolean)) => {
        setLocalExpanded(typeof v === 'function' ? v(localExpanded) : v);
      };

  const departmentTabs = [
    { label: 'Hoje',        moduleId: '',           icon: Calendar },
    { label: 'Planeamento', moduleId: '/planeamento', icon: Target },
    { label: 'Equipa',      moduleId: 'team',        icon: Users },
    { label: 'Inventário',  moduleId: '',            icon: Folder },
  ];

  const departmentMap: Record<string, { label: string; emoji: string; icon: any; moduleId: string }> = {
    sound:     { label: 'Som',          emoji: '🎙️', icon: Mic,      moduleId: 'dept-som' },
    art:       { label: 'Arte',         emoji: '🎨', icon: Palette,  moduleId: 'dept-arte' },
    wardrobe:  { label: 'Guarda-Roupa', emoji: '👔', icon: Scissors, moduleId: 'dept-guardaroupa' },
    makeup:    { label: 'Makeup & Hair',emoji: '💄', icon: Brush,    moduleId: 'dept-makeup' },
    camera:    { label: 'Câmara',       emoji: '📹', icon: Camera,   moduleId: 'dept-camara' },
    casting:   { label: 'Casting',      emoji: '🎭', icon: Drama,    moduleId: 'dept-casting' },
    transport: { label: 'Transporte',   emoji: '🚗', icon: Car,      moduleId: 'dept-transporte' },
    stunts:    { label: 'Stunts',       emoji: '🔥', icon: Flame,    moduleId: 'dept-stunts' },
  };

  // Mapa de aliases: moduleId do menu → IDs internos que o activam
  const MODULE_ALIASES: Record<string, string[]> = {
    'hoje':          ['myday', 'dashboard', 'live-board', 'realtime'],
    'planeamento':   ['production', 'pre-production', 'schedule', 'callsheet', 'optimization'],
    'filme':         ['universe', 'script', 'script-analysis', 'bible', 'writers-room', 'files', 'continuity', 'locations'],
    'equipa':        ['team', 'cast', 'departments', 'invites'],
    'departamentos': ['dept-arte', 'dept-guardaroupa', 'dept-makeup', 'dept-camara', 'dept-som', 'dept-casting', 'dept-transporte', 'dept-stunts'],
    'pos':           ['post-production', 'dailies', 'pos-selects', 'pos-montagem', 'pos-vfx', 'pos-cor', 'pos-som'],
    'mirror':        ['mirror-consultas', 'mirror-sugestoes', 'mirror-memoria'],
    'convites':      ['invites'],
    'definicoes':    ['settings'],
  };

  const fullMenu: MenuItem[] = [
    // ── 1. HOJE ──────────────────────────────────────────────────────
    {
      icon: Sun, label: 'Hoje', moduleId: 'hoje', emoji: '☀️', color: '#8b5cf6',
      submenu: [
        { label: 'Agenda de Hoje',    moduleId: 'hoje',      icon: Calendar },
        { label: 'Cenas do Dia',      moduleId: 'hoje',      icon: Clapperboard },
        { label: 'Meteorologia',      moduleId: 'hoje',      icon: Sun },
        { label: 'Call Sheet do Dia', moduleId: 'callsheet', icon: FileText },
        { label: 'Alertas',           moduleId: 'realtime',  icon: AlertTriangle },
        { label: 'Progresso do Filme',moduleId: 'hoje',      icon: Layers },
      ],
    },
    // ── 2. PLANEAMENTO ───────────────────────────────────────────────
    {
      icon: Calendar, label: 'Planeamento', moduleId: 'planeamento', emoji: '🎯', color: '#3b82f6',
      submenu: [
        { label: 'Strip Board',    moduleId: 'production', icon: Clapperboard },
        { label: 'Schedule',       moduleId: 'schedule',   icon: Calendar },
        { label: 'Shoot Days',     moduleId: 'production', icon: Clock },
        { label: 'Call Sheets',    moduleId: 'callsheet',  icon: FileText },
        { label: 'Day Out Of Days',moduleId: 'production', icon: Layers },
      ],
    },
    // ── 3. FILME ─────────────────────────────────────────────────────
    {
      icon: Film, label: 'Filme', moduleId: 'filme', emoji: '🎬', color: '#f59e0b',
      submenu: [
        { label: 'Guião',        moduleId: 'script',          icon: FileText },
        { label: 'Continuidade', moduleId: 'continuity',      icon: RefreshCw },
        { label: 'Episódios',    moduleId: 'script-analysis', icon: Clapperboard },
        { label: 'Universo',     moduleId: 'universe',        icon: Network },
        { label: 'Bíblia',       moduleId: 'bible',           icon: BookOpen },
        { label: 'Writers Room', moduleId: 'writers-room',    icon: Users },
        { label: 'Ficheiros',    moduleId: 'files',           icon: Folder },
      ],
    },
    // ── 4. EQUIPA ────────────────────────────────────────────────────
    {
      icon: Users, label: 'Equipa', moduleId: 'equipa', emoji: '👥', color: '#06b6d4',
      submenu: [
        { label: 'Crew',             moduleId: 'team',    icon: Users },
        { label: 'Elenco',           moduleId: 'cast',    icon: UserPlus },
        { label: 'Disponibilidades', moduleId: 'team',    icon: Calendar },
        { label: 'Contactos',        moduleId: 'team',    icon: Mail },
      ],
    },
    // ── 5. DEPARTAMENTOS ─────────────────────────────────────────────
    {
      icon: Network, label: 'Departamentos', moduleId: 'departamentos', emoji: '🎨', color: '#10b981',
      submenu: [
        { label: 'Arte',          moduleId: 'dept-arte',        icon: Palette },
        { label: 'Guarda-Roupa',  moduleId: 'dept-guardaroupa', icon: Scissors },
        { label: 'Makeup & Hair', moduleId: 'dept-makeup',      icon: Brush },
        { label: 'Câmara',        moduleId: 'dept-camara',      icon: Camera },
        { label: 'Som',           moduleId: 'dept-som',         icon: Mic },
        { label: 'Casting',       moduleId: 'dept-casting',     icon: Drama },
        { label: 'Transporte',    moduleId: 'dept-transporte',  icon: Car },
        { label: 'Stunts',        moduleId: 'dept-stunts',      icon: Flame },
      ],
    },
    // ── 6. PÓS ───────────────────────────────────────────────────────
    {
      icon: Sparkles, label: 'Pós', moduleId: 'pos', emoji: '✨', color: '#a855f7',
      submenu: [
        { label: 'Dailies',   moduleId: 'dailies',       icon: Film },
        { label: 'Selects',   moduleId: 'pos-selects',   icon: Target },
        { label: 'Montagem',  moduleId: 'pos-montagem',  icon: Scissors },
        { label: 'VFX',       moduleId: 'pos-vfx',       icon: Zap },
        { label: 'Color',     moduleId: 'pos-cor',       icon: Palette },
        { label: 'Sound Mix', moduleId: 'pos-som',       icon: Mic },
      ],
    },
    // ── 7. MIRROR ────────────────────────────────────────────────────
    {
      icon: Eye, label: 'Mirror', moduleId: 'mirror', emoji: '🪞', color: '#ec4899',
      submenu: [
        { label: 'Chat IA',              moduleId: 'mirror',            icon: Sparkles },
        { label: 'Perguntas ao Projeto', moduleId: 'mirror-consultas',  icon: FileText },
        { label: 'Sugestões',            moduleId: 'mirror-sugestoes',  icon: Zap },
        { label: 'Memória',              moduleId: 'mirror-memoria',    icon: BookOpen },
      ],
    },
  ];

  let menuItems: MenuItem[] = fullMenu;

  if (auth && !isSuperAdmin && userRole in departmentMap) {
    const dept = departmentMap[userRole];
    menuItems = [
      {
        icon: dept.icon,
        label: dept.label,
        moduleId: dept.moduleId,
        emoji: dept.emoji,
        submenu: departmentTabs.map((tab) => ({
          label: tab.label,
          moduleId: tab.moduleId || dept.moduleId,
          icon: tab.icon,
        })),
      },
    ];
  }

  const bottomItems: MenuItem[] = [
    { icon: Mail,     label: 'Convites',   moduleId: 'convites',  emoji: '✉️' },
    { icon: Settings, label: 'Definições', moduleId: 'definicoes', emoji: '⚙️' },
  ];

  // Resolve new IDs to internal IDs for navigation
  const NAV_RESOLVE: Record<string, string> = {
    'hoje':        'myday',
    'planeamento': 'production',
    'filme':       'universe',
    'equipa':      'team',
    'departamentos': 'departments',
    'pos':         'post-production',
    'convites':    'invites',
    'definicoes':  'settings',
  };

  const isActive = (moduleId: string) => {
    if (activeModule === moduleId) return true;
    const aliases = MODULE_ALIASES[moduleId];
    return aliases ? aliases.includes(activeModule) : false;
  };
  const hasActiveSubmenu = (item: MenuItem) => item.submenu?.some(sub => isActive(sub.moduleId)) ?? false;

  const handleNav = (moduleId: string) => {
    if (!moduleId || moduleId.startsWith('/')) return;
    navigate(NAV_RESOLVE[moduleId] || moduleId);
    onClose?.();
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.submenu) {
      setExpandedItem(expandedItem === item.label ? null : item.label);
    } else {
      handleNav(item.moduleId);
    }
  };

  return (
    <motion.div
      className="flex overflow-hidden"
      style={{
        height: onClose ? '100%' : '100vh',
        background: 'transparent',
        padding: onClose ? '12px' : isExpanded ? '12px 0 12px 12px' : '12px 0 12px 12px',
        flexShrink: 0,
        width: onClose ? 240 : undefined,
      }}
      animate={onClose ? undefined : { width: isExpanded ? 240 : 56 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      {/* ── Liquid Glass panel ── */}
      <div
        className="h-full flex flex-col w-full overflow-hidden relative"
        style={{
          borderRadius: isExpanded ? `${R.xl}px` : '0',
          transition: 'border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Camada 1: base glass transparente com blur */}
        <div
          className="absolute inset-0"
          style={{
            background: GLASS.bg,
            backdropFilter: GLASS.blur,
            WebkitBackdropFilter: GLASS.blur,
          }}
        />

        {/* Camada 2: lensing — só no expanded */}
        {isExpanded && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: `${R.xl}px`,
              background: GLASS.lensing,
              mixBlendMode: 'overlay',
            }}
          />
        )}

        {/* Camada 3: top-edge highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: isExpanded ? `${R.xl}px` : '0',
            boxShadow: GLASS.highlight,
          }}
        />

        {/* Camada 4: border — right-only em collapsed, all-around em expanded */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: isExpanded ? `${R.xl}px` : '0',
            border: isExpanded ? GLASS.border : 'none',
            borderRight: isExpanded ? undefined : '1px solid rgba(255, 255, 255, 0.08)',
          }}
        />

        {/* Camada 5: sombra — só no expanded */}
        {isExpanded && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: `${R.xl}px`,
              boxShadow: SHADOW.md,
            }}
          />
        )}

        {/* ── Conteúdo real — z-10 acima das camadas glass ── */}
        <div className="relative z-10 h-full flex flex-col">

          {/* LOGO HEADER */}
          <div
            className="flex-shrink-0 flex items-center gap-2 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.08)', height: 56, padding: isExpanded ? '0 12px' : '0 8px', justifyContent: isExpanded ? undefined : 'center' }}
          >
            {/* Conic-gradient orb */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'conic-gradient(from 180deg, #ec4899, #a855f7, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899)',
              boxShadow: '0 2px 10px rgba(168,85,247,0.35)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Highlight overlay */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35) 0%, transparent 60%)',
              }} />
            </div>
            {/* Title */}
            {isExpanded && (
              <div style={{
                fontSize: 15, fontWeight: 900, letterSpacing: '-0.02em',
                color: 'var(--fb-text-primary, #f5f5f7)',
                flex: 1, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden',
              }}>
                Frame<br />Flow
              </div>
            )}
            {/* Toggle button — collapses/expands sidebar */}
            {!onClose && (
              <button
                onClick={() => {
                  setIsExpanded(v => !v);
                  if (onToggleExpand) onToggleExpand();
                }}
                style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.35)',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  marginLeft: isExpanded ? 0 : 'auto',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)';
                }}
              >
                <PanelLeftClose style={{ width: 16, height: 16, transform: isExpanded ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
              </button>
            )}
          </div>

          {/* MAIN MENU */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {menuItems.map((item) => {
                const active = isActive(item.moduleId) || hasActiveSubmenu(item);
                const Icon = item.icon;
                const showFlyout = !isExpanded && (hoveredItem === item.label || expandedItem === item.label);
                const sectionColor = item.color || '#10b981';

                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => !isExpanded && setHoveredItem(item.label)}
                    onMouseLeave={() => !isExpanded && setHoveredItem(null)}
                  >
                    <button
                      onClick={() => {
                        if (item.submenu) {
                          setExpandedItem(expandedItem === item.label ? null : item.label);
                        } else {
                          handleNav(item.moduleId);
                        }
                      }}
                      className="w-full flex items-center transition-all relative group overflow-hidden"
                      style={{
                        height: '40px',
                        borderRadius: '10px',
                        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: active ? '#ffffff' : 'var(--fb-text-secondary, rgba(255,255,255,0.6))',
                        padding: isExpanded ? '0 10px' : '0',
                        justifyContent: isExpanded ? 'flex-start' : 'center',
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      title={!isExpanded ? item.label : undefined}
                    >
                      {/* Icon */}
                      <span style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon style={{ width: 20, height: 20 }} />
                      </span>

                      {/* Label */}
                      {isExpanded && (
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: 10 }}>
                          {item.label}
                        </span>
                      )}

                      {/* Chevron */}
                      {item.submenu && isExpanded && (
                        <span style={{ width: 14, height: 14, opacity: 0.4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ChevronRight
                            style={{
                              width: 14, height: 14,
                              transform: expandedItem === item.label ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s',
                            }}
                          />
                        </span>
                      )}
                    </button>

                    {/* Expanded Submenu */}
                    {item.submenu && isExpanded && expandedItem === item.label && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-1 space-y-0.5 overflow-hidden"
                      >
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const subActive = isActive(subItem.moduleId);
                          return (
                            <button
                              key={subItem.label}
                              onClick={() => handleNav(subItem.moduleId)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all ml-8"
                              style={{
                                background: subActive ? `${sectionColor}30` : 'transparent',
                                color: subActive ? sectionColor : 'var(--fb-text-tertiary, rgba(255,255,255,0.4))',
                                border: 'none',
                                cursor: 'pointer',
                                width: 'calc(100% - 32px)',
                              }}
                            >
                              {SubIcon && (
                                <SubIcon
                                  className="w-3.5 h-3.5 flex-shrink-0"
                                  style={{ color: subActive ? sectionColor : 'var(--fb-text-tertiary, rgba(255,255,255,0.4))' }}
                                />
                              )}
                              <span className="text-[11px] font-bold">{subItem.label}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}

                    {/* Flyout Submenu (collapsed mode) */}
                    {item.submenu && showFlyout && (
                      <div
                        className="absolute top-0 w-[220px] overflow-hidden z-50"
                        style={{
                          left: 'calc(100% + 8px)',
                          borderRadius: `${R.lg}px`,
                          background: GLASS.bg,
                          backdropFilter: GLASS.blur,
                          WebkitBackdropFilter: GLASS.blur,
                          border: GLASS.border,
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                        }}
                        onMouseEnter={() => setHoveredItem(item.label)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[16px]">{item.emoji}</span>
                            <h3 className="text-[13px] font-black" style={{ color: 'rgba(255,255,255,0.95)' }}>{item.label}</h3>
                          </div>
                          <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {item.submenu.length} módulos
                          </p>
                        </div>
                        <div className="p-2">
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const subActive = isActive(subItem.moduleId);
                            return (
                              <button
                                key={subItem.label}
                                onClick={() => handleNav(subItem.moduleId)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full"
                                style={{
                                  background: subActive ? sectionColor : 'transparent',
                                  color: subActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                {SubIcon && (
                                  <SubIcon
                                    className="w-4 h-4 flex-shrink-0"
                                    style={{ color: subActive ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
                                  />
                                )}
                                <span className="text-[12px] font-bold">{subItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM MENU */}
          <div className="flex-shrink-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', padding: '8px' }}>
            {bottomItems.map((item) => {
              const active = isActive(item.moduleId);
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.moduleId)}
                  className="w-full flex items-center transition-all"
                  style={{
                    height: '40px',
                    borderRadius: '10px',
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--fb-text-secondary, rgba(255,255,255,0.6))',
                    padding: isExpanded ? '0 10px' : '0',
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                  }}
                  title={!isExpanded ? item.label : undefined}
                >
                  <span style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 18, height: 18 }} />
                  </span>
                  {isExpanded && (
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: 10 }}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>{/* fim z-10 */}
      </div>
    </motion.div>
  );
}
