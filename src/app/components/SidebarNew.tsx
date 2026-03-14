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
}

export function SidebarNew({ onClose }: SidebarNewProps) {
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
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

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
    'pos':           ['post-production', 'dailies'],
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
        { label: 'Dailies',   moduleId: 'dailies',         icon: Film },
        { label: 'Selects',   moduleId: 'post-production', icon: Target },
        { label: 'Rough Cut', moduleId: 'post-production', icon: Scissors },
        { label: 'VFX',       moduleId: 'post-production', icon: Zap },
        { label: 'Color',     moduleId: 'post-production', icon: Palette },
        { label: 'Sound Mix', moduleId: 'post-production', icon: Mic },
      ],
    },
    // ── 7. MIRROR ────────────────────────────────────────────────────
    {
      icon: Eye, label: 'Mirror', moduleId: 'mirror', emoji: '🪞', color: '#ec4899',
      submenu: [
        { label: 'Chat IA',              moduleId: 'mirror', icon: Sparkles },
        { label: 'Perguntas ao Projeto', moduleId: 'mirror', icon: FileText },
        { label: 'Sugestões',            moduleId: 'mirror', icon: Zap },
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
      className="h-screen flex"
      animate={{ width: isExpanded ? 260 : 56 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      style={{ background: 'transparent', padding: isExpanded ? '12px' : '0', flexShrink: 0 }}
    >
      {/* ── Liquid Glass panel ── */}
      <div
        className="h-full flex flex-col w-full overflow-hidden relative"
        style={{
          borderRadius: isExpanded ? '28px' : '0',
          transition: 'border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Camada 1: base glass transparente com blur */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(78, 80, 88, 0.18)',
            backdropFilter: 'blur(20px) saturate(120%)',
            WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          }}
        />

        {/* Camada 2: lensing — só no expanded */}
        {isExpanded && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '28px',
              background: 'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(255, 255, 255, 0.10) 0%, transparent 50%)',
              mixBlendMode: 'overlay',
            }}
          />
        )}

        {/* Camada 3: top-edge highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: isExpanded ? '28px' : '0',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          }}
        />

        {/* Camada 4: border — right-only em collapsed, all-around em expanded */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: isExpanded ? '28px' : '0',
            border: isExpanded ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
            borderRight: isExpanded ? undefined : '1px solid rgba(255, 255, 255, 0.08)',
          }}
        />

        {/* Camada 5: sombra — só no expanded */}
        {isExpanded && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '28px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
            }}
          />
        )}

        {/* ── Conteúdo real — z-10 acima das camadas glass ── */}
        <div className="relative z-10 h-full flex flex-col">

          {/* LOGO + TOGGLE */}
          <div className="flex-shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            {!onClose && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-14 w-full flex items-center justify-center transition-all"
                style={{ padding: isExpanded ? '0 16px' : '0', background: 'none', border: 'none', cursor: 'pointer' }}
                title={isExpanded ? 'Recolher sidebar' : 'Expandir sidebar'}
              >
                {isExpanded ? (
                  <div className="flex items-center gap-3 flex-1">
                    <FrameFlowLogo size={120} variant="icon" />
                    <PanelLeftClose className="w-4 h-4 ml-auto" style={{ color: 'var(--fb-text-tertiary, rgba(255,255,255,0.4))' }} />
                  </div>
                ) : (
                  <FrameFlowLogo size={24} variant="icon" />
                )}
              </button>
            )}
            {onClose && (
              <div className="h-14 flex items-center justify-between px-4">
                <FrameFlowLogo size={120} variant="icon" />
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* MAIN MENU */}
          <div className="flex-1 overflow-y-auto" style={{ padding: isExpanded ? '12px' : '6px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isExpanded ? '4px' : '2px' }}>
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
                      className="w-full rounded-lg flex items-center transition-all relative group overflow-hidden"
                      style={{
                        height: isExpanded ? '44px' : '38px',
                        background: active ? `linear-gradient(135deg, ${sectionColor}, ${sectionColor}cc)` : 'transparent',
                        color: active ? '#ffffff' : 'var(--fb-text-secondary, rgba(255,255,255,0.6))',
                        paddingLeft: isExpanded ? '12px' : '0',
                        justifyContent: isExpanded ? 'flex-start' : 'center',
                        boxShadow: active ? `0 2px 12px ${sectionColor}66` : 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      title={!isExpanded ? item.label : undefined}
                    >
                      <Icon className="flex-shrink-0" style={{ width: isExpanded ? 20 : 18, height: isExpanded ? 20 : 18 }} />

                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="ml-3 text-[13px] font-bold whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}

                      {item.badge && isExpanded && (
                        <span className="absolute top-1 right-1 text-[10px]">
                          {item.badge}
                        </span>
                      )}

                      {/* Collapsed: subtle dot indicator for items with submenu */}
                      {item.submenu && !isExpanded && (
                        <div
                          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                          style={{ background: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}
                        />
                      )}

                      {item.submenu && isExpanded && (
                        <ChevronRight
                          className="w-4 h-4 ml-auto mr-2 opacity-50 transition-transform"
                          style={{
                            transform: expandedItem === item.label ? 'rotate(90deg)' : 'rotate(0deg)',
                          }}
                        />
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
                        className="absolute top-0 w-[220px] rounded-[16px] overflow-hidden z-50"
                        style={{
                          left: 'calc(100% + 8px)',
                          background: 'rgba(78, 80, 88, 0.18)',
                          backdropFilter: 'blur(20px) saturate(120%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
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
          <div className="flex-shrink-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', padding: isExpanded ? '12px' : '6px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isExpanded ? '4px' : '2px' }}>
              {bottomItems.map((item) => {
                const active = isActive(item.moduleId);
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNav(item.moduleId)}
                    className="w-full rounded-lg flex items-center transition-all relative group"
                    style={{
                      height: isExpanded ? '44px' : '38px',
                      background: active ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                      color: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
                      paddingLeft: isExpanded ? '12px' : '0',
                      justifyContent: isExpanded ? 'flex-start' : 'center',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <Icon className="flex-shrink-0" style={{ width: isExpanded ? 20 : 18, height: isExpanded ? 20 : 18 }} />
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-3 text-[13px] font-bold whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>{/* fim z-10 */}
      </div>
    </motion.div>
  );
}
