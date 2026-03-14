/**
 * PÓS-PRODUÇÃO — SOM
 * Sessões de mix, audio tracks e deliverables
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, Music, Mic, Wind, Disc, CheckSquare, Square } from 'lucide-react';
import {
  LiquidPage, LiquidCard, LiquidSection, LiquidBadge, LiquidStatCard,
} from '../components/liquid-system';
import { PosNavPills } from '../components/PosNavPills';
import { nestedCard, iconGradient, springConfigs } from '../utils/liquidGlassStyles';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type TrackStatus   = 'ok' | 'atencao' | 'problema';
type SessionStatus = 'concluída' | 'agendada' | 'em_progresso';

interface AudioTrack {
  id: string;
  type: 'dialogue' | 'music' | 'sfx' | 'ambience' | 'foley';
  label: string;
  sceneCoverage: string;
  status: TrackStatus;
  notes: string;
}

interface MixSession {
  id: string;
  date: string;
  mixer: string;
  studio: string;
  episodeFocus: string;
  duration: string;
  status: SessionStatus;
  notes: string;
}

interface Deliverable {
  id: string;
  label: string;
  done: boolean;
  format: string;
}

/* ─────────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────────── */

const MOCK_TRACKS: AudioTrack[] = [
  { id: 't1', type: 'dialogue', label: 'Diálogos',  sceneCoverage: 'EP01–EP03 completo',     status: 'ok',       notes: 'ADR pendente cenas SC021 e SC038 (ruído HVAC).'           },
  { id: 't2', type: 'music',    label: 'Música',     sceneCoverage: 'EP01 tema + 4 cenas',    status: 'atencao',  notes: 'Compositor confirmou entrega da score EP02 a 20 Março.'    },
  { id: 't3', type: 'sfx',      label: 'SFX',        sceneCoverage: 'EP01 completo',          status: 'ok',       notes: 'Biblioteca Soundminer — 320 ficheiros indexados.'          },
  { id: 't4', type: 'ambience', label: 'Ambience',   sceneCoverage: 'EP01–EP06 parcial',      status: 'atencao',  notes: 'Gravar ambiências exteriores Lisboa — sessão pendente.'    },
  { id: 't5', type: 'foley',    label: 'Foley',      sceneCoverage: 'EP01–EP02 completo',     status: 'ok',       notes: 'Estúdio Lis-Foley. Passos e roupas concluídos EP01-02.'   },
];

const MOCK_SESSIONS: MixSession[] = [
  { id: 's1', date: '2026-03-08', mixer: 'Pedro Alcântara', studio: 'Traxx Studios, Lisboa',  episodeFocus: 'EP01', duration: '8h', status: 'concluída',    notes: 'Pre-mix diálogos e SFX. Referência: -23 LUFS.' },
  { id: 's2', date: '2026-03-12', mixer: 'Pedro Alcântara', studio: 'Traxx Studios, Lisboa',  episodeFocus: 'EP01', duration: '7h', status: 'concluída',    notes: 'Mix final EP01 stereo + 5.1. Entregue a 13/03.' },
  { id: 's3', date: '2026-03-18', mixer: 'Pedro Alcântara', studio: 'Traxx Studios, Lisboa',  episodeFocus: 'EP02', duration: '—',  status: 'agendada',     notes: 'Pre-mix EP02. Aguardar ADR cenas abertas.' },
  { id: 's4', date: '2026-03-20', mixer: 'Sofia Brandão',   studio: 'Sound Factory, Cascais', episodeFocus: 'EP02', duration: '—',  status: 'em_progresso', notes: 'Foley EP03 — sessão rodagem paralela.' },
];

const MOCK_DELIVERABLES: Deliverable[] = [
  { id: 'd1', label: 'Stereo Mix (LTRT)',     done: true,  format: 'WAV 48kHz / 24bit'   },
  { id: 'd2', label: '5.1 Surround Mix',      done: true,  format: 'WAV 48kHz / 24bit'   },
  { id: 'd3', label: 'M&E (Music & Effects)', done: false, format: 'WAV 48kHz / 24bit'   },
  { id: 'd4', label: 'Spotting Sheet (Música)',done: false, format: 'PDF + Excel'          },
  { id: 'd5', label: 'ADR List completa',     done: false, format: 'PDF'                  },
  { id: 'd6', label: 'Dialogue List EP01',    done: true,  format: 'Excel + PDF'          },
  { id: 'd7', label: 'DCP Audio (7.1)',       done: false, format: 'WAV 96kHz / 24bit'   },
];

const STATUS_COLOR: Record<TrackStatus, string> = {
  ok:       '#10b981',
  atencao:  '#f59e0b',
  problema: '#ef4444',
};

const SESSION_STATUS_META: Record<SessionStatus, { color: string; label: string }> = {
  concluída:    { color: '#10b981', label: 'Concluída'    },
  agendada:     { color: 'rgba(255,255,255,0.35)', label: 'Agendada' },
  em_progresso: { color: '#a855f7', label: 'Em progresso' },
};

const TRACK_ICONS: Record<AudioTrack['type'], React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  dialogue: Mic,
  music:    Music,
  sfx:      Volume2,
  ambience: Wind,
  foley:    Disc,
};

const ACCENT = '#a855f7';

/* ─────────────────────────────────────────────────────────────
   AUDIO TRACK ROW
───────────────────────────────────────────────────────────── */

function TrackRow({ track }: { track: AudioTrack }) {
  const color = STATUS_COLOR[track.status];
  const Icon  = TRACK_ICONS[track.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
      style={{ ...nestedCard(), padding: '12px 14px', marginBottom: 8 }}
      whileTap={{ scale: 0.99 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Status dot + icon */}
        <div style={{ position: 'relative' }}>
          <div style={{ ...iconGradient(color, 'sm') }}>
            <Icon size={13} style={{ color }} />
          </div>
          <div style={{
            position: 'absolute', top: -2, right: -2,
            width: 8, height: 8, borderRadius: '50%',
            background: color,
            boxShadow: `0 0 6px ${color}`,
            border: '1px solid rgba(0,0,0,0.5)',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{track.label}</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{track.sceneCoverage}</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0, lineHeight: 1.4 }}>{track.notes}</p>
        </div>

        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
          background: `${color}20`, color, border: `0.5px solid ${color}40`, flexShrink: 0,
        }}>
          {track.status === 'ok' ? 'OK' : track.status === 'atencao' ? 'Atenção' : 'Problema'}
        </span>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SESSION ROW
───────────────────────────────────────────────────────────── */

function SessionRow({ session }: { session: MixSession }) {
  const meta = SESSION_STATUS_META[session.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
      style={{ ...nestedCard(), padding: '12px 14px', marginBottom: 8 }}
      whileTap={{ scale: 0.99 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{session.date}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: `rgba(168,85,247,0.15)`, color: '#c084fc', border: `0.5px solid rgba(168,85,247,0.3)`,
            }}>{session.episodeFocus}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: `${meta.color}20`, color: meta.color, border: `0.5px solid ${meta.color}40`,
            }}>{meta.label}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>
            {session.mixer} · {session.studio} · {session.duration}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0, lineHeight: 1.4 }}>{session.notes}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DELIVERABLE ROW
───────────────────────────────────────────────────────────── */

function DeliverableRow({ item, onToggle }: { item: Deliverable; onToggle: (id: string) => void }) {
  const Icon = item.done ? CheckSquare : Square;
  return (
    <motion.div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', ...nestedCard(), marginBottom: 6 }}
      whileTap={{ scale: 0.98 }}
    >
      <button
        onClick={() => onToggle(item.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
      >
        <Icon size={18} style={{ color: item.done ? '#10b981' : 'rgba(255,255,255,0.25)' }} />
      </button>
      <div style={{ flex: 1 }}>
        <span style={{
          color: item.done ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)',
          fontSize: 13, fontWeight: 500,
          textDecoration: item.done ? 'line-through' : 'none',
        }}>{item.label}</span>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }}>{item.format}</span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────── */

export function PosSomModule() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>(MOCK_DELIVERABLES);

  const totalDel = deliverables.length;
  const doneDel  = deliverables.filter(d => d.done).length;
  const tracksOK = MOCK_TRACKS.filter(t => t.status === 'ok').length;

  function toggleDeliverable(id: string) {
    setDeliverables(prev => prev.map(d => d.id === id ? { ...d, done: !d.done } : d));
  }

  return (
    <LiquidPage
      title="Som"
      description="Mix de som e deliverables — DESDOBRADO"
      section="pos"
    >
      <PosNavPills activeTab="pos-som" onTabChange={() => {}} />
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <LiquidStatCard label="Sessões"         value={MOCK_SESSIONS.length} accent={ACCENT} />
        <LiquidStatCard label="Tracks OK"       value={tracksOK}             accent="#10b981" />
        <LiquidStatCard label="Deliverables"    value={`${doneDel}/${totalDel}`} accent="#3b82f6" />
        <LiquidStatCard label="ADR pendentes"   value={2}                    accent="#f59e0b" />
      </div>

      {/* Audio Tracks */}
      <LiquidCard style={{ marginBottom: 16 }}>
        <LiquidSection title="Audio Tracks" icon={Volume2}>
          {MOCK_TRACKS.map(t => <TrackRow key={t.id} track={t} />)}
        </LiquidSection>
      </LiquidCard>

      {/* Deliverables */}
      <LiquidCard style={{ marginBottom: 16 }}>
        <LiquidSection title="Deliverables" icon={CheckSquare}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{doneDel} de {totalDel} concluídos</span>
              <span style={{ color: ACCENT, fontSize: 12, fontWeight: 600 }}>{Math.round((doneDel / totalDel) * 100)}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${(doneDel / totalDel) * 100}%` }}
                transition={springConfigs.smooth}
                style={{ height: '100%', background: `linear-gradient(90deg, ${ACCENT}, #c084fc)`, borderRadius: 999 }}
              />
            </div>
          </div>
          {deliverables.map(d => <DeliverableRow key={d.id} item={d} onToggle={toggleDeliverable} />)}
        </LiquidSection>
      </LiquidCard>

      {/* Mix Sessions */}
      <LiquidCard>
        <LiquidSection title="Sessões de mix" icon={Music}>
          {MOCK_SESSIONS.map(s => <SessionRow key={s.id} session={s} />)}
        </LiquidSection>
      </LiquidCard>
    </LiquidPage>
  );
}
