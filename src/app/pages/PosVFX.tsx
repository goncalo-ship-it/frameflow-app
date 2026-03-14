/**
 * PÓS-PRODUÇÃO — VFX
 * Plano de efeitos visuais: lista de shots, complexidade, estado e fornecedor
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Layers, TrendingUp, Zap, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import {
  LiquidPage, LiquidCard, LiquidSection, LiquidBadge, LiquidStatCard,
} from '../components/liquid-system';
import { nestedCard, iconGradient, springConfigs } from '../utils/liquidGlassStyles';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type VFXStatus     = 'pending' | 'in_progress' | 'done';
type VFXComplexity = 'low' | 'mid' | 'high';
type VFXCategory   = 'compositing' | 'motion_graphics' | 'color_effects' | 'animation';

interface VFXShot {
  id: string;
  scene: string;
  episode: string;
  description: string;
  complexity: VFXComplexity;
  status: VFXStatus;
  vendor: string;
  category: VFXCategory;
  frames: number;
}

/* ─────────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────────── */

const MOCK_VFX: VFXShot[] = [
  { id: 'v01', scene: 'SC003', episode: 'EP01', description: 'Remoção de fios de microfone — close-up Marta',    complexity: 'low',  status: 'done',        vendor: 'In-house',        category: 'compositing',       frames: 240  },
  { id: 'v02', scene: 'SC007', episode: 'EP01', description: 'Sky replacement — quinta ao pôr-do-sol',           complexity: 'mid',  status: 'in_progress', vendor: 'Visuals Lab PT',  category: 'compositing',       frames: 480  },
  { id: 'v03', scene: 'SC012', episode: 'EP01', description: 'Flashback grain + vignette + light leak',          complexity: 'low',  status: 'done',        vendor: 'In-house',        category: 'color_effects',     frames: 820  },
  { id: 'v04', scene: 'SC015', episode: 'EP01', description: 'Título episódio — kinetic typography abertura',    complexity: 'high', status: 'in_progress', vendor: 'Forma Studio',    category: 'motion_graphics',   frames: 600  },
  { id: 'v05', scene: 'SC021', episode: 'EP02', description: 'Estabilização steadicam + remoção passante',       complexity: 'mid',  status: 'pending',     vendor: 'Visuals Lab PT',  category: 'compositing',       frames: 360  },
  { id: 'v06', scene: 'SC028', episode: 'EP02', description: 'Chuva CGI sobre janela — plano exterior',         complexity: 'high', status: 'pending',     vendor: 'Frame VFX',       category: 'animation',         frames: 720  },
  { id: 'v07', scene: 'SC031', episode: 'EP03', description: 'Lens flare orgânico — golden hour Ponte 25 Abril', complexity: 'low', status: 'done',        vendor: 'In-house',        category: 'color_effects',     frames: 190  },
  { id: 'v08', scene: 'SC038', episode: 'EP03', description: 'Counter UI overlay — écran laptop interrogatório', complexity: 'mid', status: 'in_progress', vendor: 'Forma Studio',    category: 'motion_graphics',   frames: 540  },
  { id: 'v09', scene: 'SC044', episode: 'EP04', description: 'Chuva digital + breath steam — cemitério noturno', complexity: 'high',status: 'pending',     vendor: 'Frame VFX',       category: 'animation',         frames: 890  },
];

const STATUS_META: Record<VFXStatus, { color: string; label: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }> = {
  done:        { color: '#10b981', label: 'Concluído',    icon: CheckCircle },
  in_progress: { color: '#a855f7', label: 'Em progresso', icon: AlertCircle },
  pending:     { color: 'rgba(255,255,255,0.35)', label: 'Pendente', icon: Clock },
};

const COMPLEXITY_META: Record<VFXComplexity, { color: string; label: string }> = {
  low:  { color: '#10b981', label: 'Baixa' },
  mid:  { color: '#f59e0b', label: 'Média' },
  high: { color: '#ef4444', label: 'Alta'  },
};

const CATEGORY_META: Record<VFXCategory, { label: string; color: string }> = {
  compositing:     { label: 'Compositing',      color: '#3b82f6' },
  motion_graphics: { label: 'Motion Graphics',  color: '#a855f7' },
  color_effects:   { label: 'Color Effects',    color: '#f97316' },
  animation:       { label: 'Animação 3D/CGI',  color: '#10b981' },
};

const ACCENT = '#a855f7';

/* ─────────────────────────────────────────────────────────────
   CATEGORY PROGRESS BAR
───────────────────────────────────────────────────────────── */

function CategoryProgress({ category, shots }: { category: VFXCategory; shots: VFXShot[] }) {
  const meta  = CATEGORY_META[category];
  const total = shots.filter(s => s.category === category).length;
  const done  = shots.filter(s => s.category === category && s.status === 'done').length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>{meta.label}</span>
        <span style={{ color: meta.color, fontSize: 12, fontWeight: 700 }}>{pct}% <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({done}/{total})</span></span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ ...springConfigs.smooth, duration: 0.8, delay: 0.1 }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${meta.color}, ${meta.color}99)`, borderRadius: 999 }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VFX SHOT ROW
───────────────────────────────────────────────────────────── */

function VFXRow({ shot }: { shot: VFXShot }) {
  const status     = STATUS_META[shot.status];
  const complexity = COMPLEXITY_META[shot.complexity];
  const category   = CATEGORY_META[shot.category];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
      style={{ ...nestedCard(), padding: '12px 14px', marginBottom: 8 }}
      whileTap={{ scale: 0.99 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <div style={{ ...iconGradient(status.color, 'sm'), marginTop: 2 }}>
          <StatusIcon size={13} style={{ color: status.color }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{shot.episode} · {shot.scene}</span>
            {/* Complexity */}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
              background: `${complexity.color}20`, color: complexity.color, border: `0.5px solid ${complexity.color}40`,
            }}>{complexity.label}</span>
            {/* Category */}
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
              background: `${category.color}15`, color: category.color, border: `0.5px solid ${category.color}35`,
            }}>{category.label}</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0, lineHeight: 1.4 }}>{shot.description}</p>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4, display: 'block' }}>
            {shot.vendor} · {shot.frames} frames
          </span>
        </div>

        {/* Status */}
        <div style={{ flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
            background: `${status.color}20`, color: status.color, border: `0.5px solid ${status.color}40`,
          }}>{status.label}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────── */

export function PosVFXModule() {
  const [filterStatus, setFilterStatus] = useState<VFXStatus | 'all'>('all');

  const shots   = MOCK_VFX;
  const total   = shots.length;
  const done    = shots.filter(s => s.status === 'done').length;
  const inProg  = shots.filter(s => s.status === 'in_progress').length;
  const pending = shots.filter(s => s.status === 'pending').length;

  const filtered = filterStatus === 'all' ? shots : shots.filter(s => s.status === filterStatus);

  const STATUS_FILTERS: { key: VFXStatus | 'all'; label: string }[] = [
    { key: 'all',         label: 'Todos'        },
    { key: 'done',        label: 'Concluídos'   },
    { key: 'in_progress', label: 'Em progresso' },
    { key: 'pending',     label: 'Pendentes'    },
  ];

  return (
    <LiquidPage
      title="VFX"
      description="Efeitos visuais — DESDOBRADO"
      section="pos"
    >
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <LiquidStatCard label="Total shots"  value={total}   accent={ACCENT} />
        <LiquidStatCard label="Concluídos"   value={done}    accent="#10b981" />
        <LiquidStatCard label="Em progresso" value={inProg}  accent={ACCENT} />
        <LiquidStatCard label="Pendentes"    value={pending} accent="#f59e0b" />
      </div>

      {/* Category progress */}
      <LiquidCard style={{ marginBottom: 16 }}>
        <LiquidSection title="Progresso por categoria" icon={TrendingUp}>
          <div style={{ padding: '4px 0' }}>
            {(['compositing', 'motion_graphics', 'color_effects', 'animation'] as VFXCategory[]).map(cat => (
              <CategoryProgress key={cat} category={cat} shots={shots} />
            ))}
          </div>
        </LiquidSection>
      </LiquidCard>

      {/* Shot list */}
      <LiquidCard>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {STATUS_FILTERS.map(f => {
            const active = filterStatus === f.key;
            return (
              <motion.button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12,
                  background: active ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#d8b4fe' : 'rgba(255,255,255,0.5)',
                  fontWeight: active ? 600 : 400,
                  outline: active ? '0.5px solid rgba(168,85,247,0.4)' : '0.5px solid transparent',
                }}
              >{f.label}</motion.button>
            );
          })}
        </div>

        <LiquidSection title={`VFX Shots (${filtered.length})`} icon={Layers}>
          {filtered.map(shot => <VFXRow key={shot.id} shot={shot} />)}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              Nenhum shot encontrado.
            </div>
          )}
        </LiquidSection>
      </LiquidCard>
    </LiquidPage>
  );
}
