/**
 * PÓS-PRODUÇÃO — SELECTS
 * Grid de clips de vídeo com selecção por director, filtros e estatísticas
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Film, Grid, List, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import {
  LiquidPage, LiquidCard, LiquidSection, LiquidButton, LiquidBadge, LiquidStatCard,
} from '../components/liquid-system';
import { PosNavPills } from '../components/PosNavPills';
import { glassCard, nestedCard, springConfigs } from '../utils/liquidGlassStyles';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type ClipStatus = 'selecionado' | 'pendente' | 'rejeitado';
type FilterTab  = 'todos' | 'selecionados' | 'pendentes' | 'rejeitados';

interface VideoClip {
  id: string;
  timecodeIn: string;
  timecodeOut: string;
  scene: string;
  take: number;
  directorCircle: boolean;
  intExt: 'INT' | 'EXT';
  description: string;
  status: ClipStatus;
  episode: string;
  duration: string;
}

/* ─────────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────────── */

const MOCK_CLIPS: VideoClip[] = [
  { id: 'c01', timecodeIn: '01:02:14:08', timecodeOut: '01:02:47:22', scene: 'SC003', take: 4, directorCircle: true,  intExt: 'INT', description: 'Confronto entre Marta e o inspector — close-up', status: 'selecionado', episode: 'EP01', duration: '0:33' },
  { id: 'c02', timecodeIn: '01:08:31:00', timecodeOut: '01:08:59:12', scene: 'SC007', take: 2, directorCircle: false, intExt: 'EXT', description: 'Chegada à quinta — wide shot estabelecimento', status: 'pendente',    episode: 'EP01', duration: '0:28' },
  { id: 'c03', timecodeIn: '01:22:04:15', timecodeOut: '01:22:38:06', scene: 'SC012', take: 6, directorCircle: true,  intExt: 'INT', description: 'Flashback infância — luz filtrada janela',    status: 'selecionado', episode: 'EP01', duration: '0:34' },
  { id: 'c04', timecodeIn: '02:04:11:20', timecodeOut: '02:04:29:08', scene: 'SC021', take: 1, directorCircle: false, intExt: 'EXT', description: 'Perseguição no mercado — câmara ao ombro',  status: 'rejeitado',   episode: 'EP02', duration: '0:18' },
  { id: 'c05', timecodeIn: '02:18:55:03', timecodeOut: '02:19:44:17', scene: 'SC028', take: 3, directorCircle: true,  intExt: 'INT', description: 'Monólogo final Ana — plano-sequência',      status: 'selecionado', episode: 'EP02', duration: '0:49' },
  { id: 'c06', timecodeIn: '03:01:08:12', timecodeOut: '03:01:37:00', scene: 'SC031', take: 5, directorCircle: false, intExt: 'EXT', description: 'Ponte Vasco da Gama — golden hour',          status: 'pendente',    episode: 'EP03', duration: '0:29' },
  { id: 'c07', timecodeIn: '03:14:22:09', timecodeOut: '03:14:55:18', scene: 'SC038', take: 2, directorCircle: true,  intExt: 'INT', description: 'Sala de interrogatório — two-shot tenso',    status: 'selecionado', episode: 'EP03', duration: '0:33' },
  { id: 'c08', timecodeIn: '04:07:44:22', timecodeOut: '04:08:12:05', scene: 'SC044', take: 7, directorCircle: false, intExt: 'EXT', description: 'Cemitério chuva — insert mão na pedra',      status: 'pendente',    episode: 'EP04', duration: '0:27' },
];

const STATUS_COLORS: Record<ClipStatus, string> = {
  selecionado: '#10b981',
  pendente:    '#f59e0b',
  rejeitado:   '#ef4444',
};

const STATUS_LABELS: Record<ClipStatus, string> = {
  selecionado: 'Selecionado',
  pendente:    'Pendente',
  rejeitado:   'Rejeitado',
};

/* ─────────────────────────────────────────────────────────────
   CLIP CARD
───────────────────────────────────────────────────────────── */

function ClipCard({ clip, viewMode }: { clip: VideoClip; viewMode: 'grid' | 'list' }) {
  const accent = '#a855f7';
  const statusColor = STATUS_COLORS[clip.status];

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfigs.gentle}
        style={{
          ...nestedCard(),
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Thumbnail placeholder */}
        <div style={{
          width: 72, height: 44, borderRadius: 8, flexShrink: 0,
          background: `linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))`,
          border: '0.5px solid rgba(168,85,247,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Film size={16} style={{ color: accent, opacity: 0.7 }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{clip.episode} · {clip.scene}</span>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>T{clip.take}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
              background: clip.intExt === 'INT' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
              color: clip.intExt === 'INT' ? '#60a5fa' : '#34d399',
              border: `0.5px solid ${clip.intExt === 'INT' ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}`,
            }}>{clip.intExt}</span>
            {clip.directorCircle && <CheckCircle size={12} style={{ color: '#10b981' }} />}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{clip.description}</span>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>{clip.timecodeIn}</div>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: `rgba(${statusColor === '#10b981' ? '16,185,129' : statusColor === '#f59e0b' ? '245,158,11' : '239,68,68'},0.15)`,
            color: statusColor,
            border: `0.5px solid ${statusColor}40`,
          }}>{STATUS_LABELS[clip.status]}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springConfigs.gentle}
      style={{ ...nestedCard(), padding: 0, overflow: 'hidden' }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 90,
        background: `linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(139,69,191,0.1) 100%)`,
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <Film size={24} style={{ color: accent, opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
            background: clip.intExt === 'INT' ? 'rgba(59,130,246,0.35)' : 'rgba(16,185,129,0.35)',
            color: clip.intExt === 'INT' ? '#93c5fd' : '#6ee7b7',
          }}>{clip.intExt}</span>
        </div>
        {clip.directorCircle && (
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <CheckCircle size={14} style={{ color: '#10b981' }} />
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 6, right: 8,
          color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace',
        }}>{clip.duration}</div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{clip.episode} · {clip.scene} · T{clip.take}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999,
            background: `${statusColor}20`, color: statusColor, border: `0.5px solid ${statusColor}40`,
          }}>{STATUS_LABELS[clip.status]}</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0, lineHeight: 1.4 }}>{clip.description}</p>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace', marginTop: 6 }}>{clip.timecodeIn}</div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────── */

export function PosSelectsModule() {
  const [filter, setFilter]     = useState<FilterTab>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = MOCK_CLIPS.filter(c => {
    if (filter === 'todos')         return true;
    if (filter === 'selecionados')  return c.status === 'selecionado';
    if (filter === 'pendentes')     return c.status === 'pendente';
    if (filter === 'rejeitados')    return c.status === 'rejeitado';
    return true;
  });

  const total      = MOCK_CLIPS.length;
  const selected   = MOCK_CLIPS.filter(c => c.status === 'selecionado').length;
  const pending    = MOCK_CLIPS.filter(c => c.status === 'pendente').length;
  const withCircle = MOCK_CLIPS.filter(c => c.directorCircle).length;

  const FILTERS: { key: FilterTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: 'todos',        label: 'Todos',       icon: Eye },
    { key: 'selecionados', label: 'Selecionados', icon: CheckCircle },
    { key: 'pendentes',    label: 'Pendentes',    icon: Clock },
    { key: 'rejeitados',   label: 'Rejeitados',   icon: XCircle },
  ];

  return (
    <LiquidPage
      title="Selects"
      description="Revisão e selecção de takes — DESDOBRADO"
      section="pos"
    >
      <PosNavPills activeTab="pos-selects" onTabChange={() => {}} />
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <LiquidStatCard label="Total clips"   value={total}      accent="#a855f7" />
        <LiquidStatCard label="Selecionados"  value={selected}   accent="#10b981" />
        <LiquidStatCard label="Pendentes"     value={pending}    accent="#f59e0b" />
        <LiquidStatCard label="Director ✓"   value={withCircle} accent="#3b82f6" />
      </div>

      <LiquidCard>
        {/* Filter + View toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map(f => {
              const active = filter === f.key;
              const Icon = f.icon;
              return (
                <motion.button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                    color: active ? '#d8b4fe' : 'rgba(255,255,255,0.5)',
                    fontSize: 12, fontWeight: active ? 600 : 400,
                    outline: active ? '0.5px solid rgba(168,85,247,0.4)' : '0.5px solid transparent',
                  }}
                >
                  <Icon size={12} />
                  {f.label}
                </motion.button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {(['grid', 'list'] as const).map(v => {
              const Icon = v === 'grid' ? Grid : List;
              return (
                <motion.button
                  key={v}
                  onClick={() => setViewMode(v)}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: viewMode === v ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                    color: viewMode === v ? '#d8b4fe' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  <Icon size={14} />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Clip grid / list */}
        <div style={viewMode === 'grid'
          ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }
          : { display: 'flex', flexDirection: 'column', gap: 8 }
        }>
          {filtered.map(clip => (
            <ClipCard key={clip.id} clip={clip} viewMode={viewMode} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            Nenhum clip encontrado para este filtro.
          </div>
        )}
      </LiquidCard>
    </LiquidPage>
  );
}
