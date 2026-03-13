import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Film, MapPin, Users, MoreHorizontal,
  Globe, FileText, Palette, RefreshCw, Eye, DollarSign,
  Plug, Settings, Mail, X, Zap,
} from 'lucide-react';
// @ts-expect-error JSX module
import { useStore } from '../../core/store';
// @ts-expect-error JSX module
import { useShallow } from 'zustand/react/shallow';

/* ─────────────────────────────────────────────────────────────
   MORE MODAL DATA
───────────────────────────────────────────────────────────── */

const MORE_GROUPS: { category: string; items: { icon: any; label: string; moduleId: string; emoji: string; badge?: string }[] }[] = [
  {
    category: 'PRODUÇÃO',
    items: [
      { icon: Globe,     label: 'Universo',    moduleId: 'universe',     emoji: '🌍' },
      { icon: FileText,  label: 'Guiões',      moduleId: 'script',       emoji: '📝' },
      { icon: Palette,   label: 'Optimização', moduleId: 'optimization', emoji: '⚡' },
    ],
  },
  {
    category: 'RODAGEM',
    items: [
      { icon: RefreshCw, label: 'Continuidade', moduleId: 'continuity', emoji: '🔄' },
      { icon: Eye,       label: 'Espelho',      moduleId: 'mirror',     emoji: '👁️' },
    ],
  },
  {
    category: 'GESTÃO',
    items: [
      { icon: DollarSign, label: 'Orçamento', moduleId: 'budget', emoji: '💰' },
    ],
  },
  {
    category: 'FERRAMENTAS',
    items: [
      { icon: Plug, label: 'Integrações',  moduleId: 'integrations', emoji: '🔌' },
      { icon: Zap,  label: 'Live Board',   moduleId: 'live-board',   emoji: '⚡', badge: '🔴' },
    ],
  },
  {
    category: 'CONFIGURAÇÃO',
    items: [
      { icon: Settings, label: 'Definições', moduleId: 'settings', emoji: '⚙️' },
      { icon: Mail,     label: 'Convites',   moduleId: 'invites',  emoji: '✉️' },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */

export function MobileBottomNav() {
  const { navigate, ui } = useStore(useShallow((s: any) => ({
    navigate: s.navigate,
    ui: s.ui,
  })));

  const activeModule: string = ui?.activeModule || 'dashboard';
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Esconder em desktop — sem Tailwind, usamos resize listener
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isMobile) return null;

  const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', moduleId: 'dashboard' },
    { icon: Film,            label: 'Produção',  moduleId: 'production' },
    { icon: MapPin,          label: 'Locais',    moduleId: 'locations' },
    { icon: Users,           label: 'Equipa',    moduleId: 'team' },
  ];

  return (
    <>
      {/* Bottom bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: 64,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          borderTop: '0.5px solid rgba(255,255,255,0.12)',
          boxShadow: '0 -1px 3px rgba(0,0,0,0.20), inset 0 0.5px 0.5px rgba(255,255,255,0.10)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = activeModule === item.moduleId;
          return (
            <button
              key={item.moduleId}
              onClick={() => navigate(item.moduleId)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <div style={{
                width: 40, height: 40,
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                background: active ? 'rgba(16,185,129,0.18)' : 'transparent',
                border: active ? '0.5px solid rgba(16,185,129,0.40)' : '0.5px solid transparent',
                backdropFilter: active ? 'blur(12px)' : undefined,
                boxShadow: active
                  ? '0 0 16px rgba(16,185,129,0.20), inset 0 0.5px 0 rgba(255,255,255,0.15)'
                  : undefined,
              }}>
                <item.icon
                  style={{ width: 20, height: 20, color: active ? '#ffffff' : 'rgba(255,255,255,0.60)' }}
                />
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: active ? '#10b981' : '#6e6e78' }}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Mais button */}
        <button
          onClick={() => setShowMoreModal(true)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div style={{
            width: 40, height: 40,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)',
            border: '0.5px solid rgba(255,255,255,0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 0.5px 0.5px rgba(255,255,255,0.20)',
          }}>
            <MoreHorizontal style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.60)' }} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6e6e78' }}>Mais</span>
        </button>
      </div>

      {/* More Modal */}
      <AnimatePresence>
        {showMoreModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowMoreModal(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.80)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 40,
              }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed', inset: 0,
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                background: '#0d0d0d',
              }}
            >
              {/* Modal header */}
              <div style={{
                padding: 16,
                borderBottom: '0.5px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: 'rgba(255,255,255,0.95)' }}>
                  Todos os Módulos
                </span>
                <button
                  onClick={() => setShowMoreModal(false)}
                  style={{
                    width: 40, height: 40, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none', cursor: 'pointer', color: '#a0a0ab',
                  }}
                >
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              {/* Modal content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 80 }}>
                {MORE_GROUPS.map((group) => (
                  <div key={group.category} style={{ marginBottom: 24 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 900,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: '#6e6e78', marginBottom: 12, padding: '0 8px',
                    }}>
                      {group.category}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {group.items.map((item) => {
                        const active = activeModule === item.moduleId;
                        return (
                          <button
                            key={item.moduleId}
                            onClick={() => { navigate(item.moduleId); setShowMoreModal(false); }}
                            style={{
                              borderRadius: 12, padding: 16,
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', gap: 8,
                              position: 'relative',
                              border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                              cursor: 'pointer',
                              background: active ? '#10b981' : 'rgba(255,255,255,0.06)',
                            }}
                          >
                            {item.badge && (
                              <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 12 }}>
                                {item.badge}
                              </span>
                            )}
                            <div style={{
                              width: 48, height: 48, borderRadius: 12,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: active ? 'rgba(255,255,255,0.20)' : 'rgba(13,13,13,0.8)',
                            }}>
                              <item.icon style={{ width: 24, height: 24, color: active ? '#ffffff' : '#6e6e78' }} />
                            </div>
                            <span style={{
                              fontSize: 11, fontWeight: 700,
                              textAlign: 'center', lineHeight: 1.2,
                              color: active ? '#ffffff' : 'rgba(255,255,255,0.95)',
                            }}>
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
