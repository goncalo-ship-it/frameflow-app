/**
 * UniversalSearchModal — FrameFlow Liquid Glass
 * Adapted from Ffv04copy: useNavigate() → store.navigate
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Clock, TrendingUp, Film, Users, MapPin,
  FileText, Zap, Globe, Eye, ArrowRight, Command
} from 'lucide-react';
// @ts-expect-error JSX module
import { useStore } from '../../core/store';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: any;
  moduleId: string;
  color: string;
}

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ── Module-ID based navigation map ── */
const SEARCH_MODULE_MAP: Record<string, string> = {
  '/dashboard/dailies':              'dailies',
  '/dashboard/live-board':           'live-board',
  '/dashboard/producao/strip-board': 'production',
  '/dashboard/folha-servico':        'callsheet',
  '/dashboard/equipa':               'team',
  '/dashboard/locais':               'locations',
  '/dashboard/guioes':               'script',
  '/dashboard/universo':             'universe',
  '/dashboard/universo/episodios':   'universe',
  '/dashboard/orcamento':            'budget',
  '/dashboard/continuidade':         'continuity',
};

/* ── Static results ── */
const ALL_RESULTS: SearchResult[] = [
  { id: 'd1', title: 'Take 3 — Cena 12A',        subtitle: 'INT. DELEGACIA — INTERROGATÓRIO • BOM', category: 'Dailies',      icon: Film,     moduleId: 'dailies',      color: '#10b981' },
  { id: 'd2', title: 'Dailies — Dia 1',           subtitle: '8 takes aprovados',                     category: 'Dailies',      icon: Film,     moduleId: 'dailies',      color: '#10b981' },
  { id: 'p1', title: 'Live Board',                subtitle: 'Acompanhamento em tempo real',           category: 'Produção',     icon: Zap,      moduleId: 'live-board',   color: '#f59e0b' },
  { id: 'p2', title: 'Strip Board',               subtitle: 'Planeamento de cenas',                  category: 'Produção',     icon: Film,     moduleId: 'production',   color: '#f59e0b' },
  { id: 'p3', title: 'Folha de Serviço — Dia 1',  subtitle: '15 Mar 2025 • 4 cenas',                 category: 'Produção',     icon: FileText, moduleId: 'callsheet',    color: '#f59e0b' },
  { id: 't1', title: 'Crew',                      subtitle: 'Toda a equipa',                         category: 'Equipa',       icon: Users,    moduleId: 'team',         color: '#3b82f6' },
  { id: 'l1', title: 'Locais',                    subtitle: 'Mapa e detalhes',                       category: 'Locais',       icon: MapPin,   moduleId: 'locations',    color: '#8b5cf6' },
  { id: 's1', title: 'Guiões',                    subtitle: 'Análise de scripts FDX',                category: 'Guiões',       icon: FileText, moduleId: 'script',       color: '#06b6d4' },
  { id: 'u1', title: 'Universo',                  subtitle: 'Personagens, arcos, bíblia',            category: 'Universo',     icon: Globe,    moduleId: 'universe',     color: '#ec4899' },
  { id: 'b1', title: 'Orçamento',                 subtitle: 'Gestão financeira',                     category: 'Orçamento',    icon: FileText, moduleId: 'budget',       color: '#84cc16' },
  { id: 'c1', title: 'Continuidade',              subtitle: 'Roupa, Props, Maquilhagem',             category: 'Continuidade', icon: Eye,      moduleId: 'continuity',   color: '#f43f5e' },
];

const QUICK_ACTIONS = [
  { id: 'qa1', title: 'Folha de Serviço', icon: FileText, moduleId: 'callsheet', color: '#10b981' },
  { id: 'qa2', title: 'Equipa',           icon: Users,    moduleId: 'team',      color: '#3b82f6' },
  { id: 'qa3', title: 'Live Board',       icon: Zap,      moduleId: 'live-board',color: '#f59e0b' },
  { id: 'qa4', title: 'Dailies',          icon: Film,     moduleId: 'dailies',   color: '#8b5cf6' },
];

const RECENT_SEARCHES = ['Cena 12A', 'Dailies Dia 1', 'Equipa'];

export function UniversalSearchModal({ isOpen, onClose }: UniversalSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = useStore((s: any) => s.navigate);

  const handleNav = (moduleId: string) => {
    if (typeof navigate === 'function') navigate(moduleId);
    onClose();
  };

  /* ── Filter ── */
  const filteredResults = searchQuery.trim() === ''
    ? []
    : ALL_RESULTS.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const grouped = filteredResults.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  /* ── Keyboard nav ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(p => Math.min(p + 1, filteredResults.length - 1)); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIndex(p => Math.max(p - 1, 0)); }
      else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
        e.preventDefault();
        handleNav(filteredResults[selectedIndex].moduleId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, filteredResults, selectedIndex]);

  /* ── Focus ── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => { setSelectedIndex(0); }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center" style={{ paddingTop: '10vh' }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative w-full mx-4"
        style={{ maxWidth: 640, maxHeight: '72vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Glass box */}
        <div
          className="rounded-[22px] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px) saturate(120%)',
            WebkitBackdropFilter: 'blur(20px) saturate(120%)',
            border: '0.5px solid rgba(255,255,255,0.18)',
            boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,255,0.25), 0 24px 64px -10px rgba(0,0,0,0.55)',
          }}
        >
          {/* Search input row */}
          <div
            className="flex items-center gap-3 px-5 py-4 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(13,13,20,0.25)' }}
          >
            <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.40)' }} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Procurar cenas, pessoas, locais, takes..."
              className="flex-1 bg-transparent outline-none text-base"
              style={{ color: 'rgba(255,255,255,0.90)', caretColor: '#10b981' }}
            />
            <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.40)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results area */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(72vh - 80px)' }}>

            {/* Empty state — quick actions */}
            {searchQuery.trim() === '' && (
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 px-2 mb-3">
                    <Clock className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Recentes
                    </span>
                  </div>
                  {RECENT_SEARCHES.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(s)}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-[13px] mb-1 transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.65)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex items-center gap-2 px-2 mb-3">
                    <TrendingUp className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Acções Rápidas
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleNav(action.moduleId)}
                        className="p-4 rounded-xl text-left transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${action.color}20` }}>
                          <action.icon className="w-4 h-4" style={{ color: action.color }} />
                        </div>
                        <div className="text-[12px] font-black" style={{ color: 'rgba(255,255,255,0.85)' }}>{action.title}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center justify-center gap-3 text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <span>↑↓ navegar</span><span>•</span>
                    <span>⏎ seleccionar</span><span>•</span>
                    <span>ESC fechar</span>
                  </div>
                </div>
              </div>
            )}

            {/* Search results */}
            {searchQuery.trim() !== '' && (
              <div className="p-4 space-y-5">
                {Object.keys(grouped).length === 0 ? (
                  <div className="py-12 text-center">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'rgba(255,255,255,0.6)' }} />
                    <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                      Nenhum resultado para "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, results]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 px-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>{category}</span>
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}>{results.length}</span>
                      </div>
                      <div className="space-y-1">
                        {results.map(r => {
                          const gIdx = filteredResults.indexOf(r);
                          const isSel = gIdx === selectedIndex;
                          return (
                            <motion.button
                              key={r.id}
                              onClick={() => handleNav(r.moduleId)}
                              onMouseEnter={() => setSelectedIndex(gIdx)}
                              whileHover={{ scale: 1.01 }}
                              className="w-full p-3.5 rounded-xl flex items-center gap-3 text-left transition-all"
                              style={{
                                background: isSel ? '#10b981' : 'rgba(255,255,255,0.05)',
                                border: `0.5px solid ${isSel ? '#10b981' : 'rgba(255,255,255,0.09)'}`,
                              }}
                            >
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: isSel ? 'rgba(255,255,255,0.20)' : `${r.color}20` }}
                              >
                                <r.icon className="w-4 h-4" style={{ color: isSel ? '#fff' : r.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold truncate" style={{ color: isSel ? '#fff' : 'rgba(255,255,255,0.90)' }}>{r.title}</div>
                                <div className="text-[11px] truncate" style={{ color: isSel ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.40)' }}>{r.subtitle}</div>
                              </div>
                              <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform" style={{ color: isSel ? '#fff' : 'rgba(255,255,255,0.30)' }} />
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-3 text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px]"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.35)' }}
          >
            <Command className="w-3 h-3" />
            Pressiona <kbd className="px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(255,255,255,0.08)' }}>⌘K</kbd> em qualquer lugar
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
