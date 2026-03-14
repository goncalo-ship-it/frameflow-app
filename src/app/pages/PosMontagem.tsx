/**
 * PÓS-PRODUÇÃO — MONTAGEM
 * Timeline de assembly cut, progresso e estado de cada cena
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Scissors, Clock, CheckCircle, AlertCircle, RotateCcw, Film } from 'lucide-react';
import {
  LiquidPage, LiquidCard, LiquidSection, LiquidButton, LiquidBadge, LiquidStatCard,
} from '../components/liquid-system';
import { glassCard, nestedCard, iconGradient, springConfigs } from '../utils/liquidGlassStyles';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type SceneStatus = 'montado' | 'pendente' | 'revisão';

interface MontageScene {
  id: string;
  scene: string;
  episode: string;
  duration: string;   // estimated cut duration
  rawDuration: string;
  status: SceneStatus;
  notes: string;
  colorBlock: string; // timeline block color
}

/* ─────────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────────── */

const MOCK_SCENES: MontageScene[] = [
  { id: 's1',  scene: 'SC001', episode: 'EP01', duration: '2:14', rawDuration: '8:30',  status: 'montado',  notes: 'Assembly cut aprovado. Ritmo bom no diálogo.', colorBlock: '#a855f7' },
  { id: 's2',  scene: 'SC003', episode: 'EP01', duration: '1:48', rawDuration: '6:15',  status: 'montado',  notes: 'Corte no take 4. Director circle confirmado.', colorBlock: '#8b5cf6' },
  { id: 's3',  scene: 'SC007', episode: 'EP01', duration: '0:52', rawDuration: '3:40',  status: 'revisão',  notes: 'Precisamos de rever o timing da música nesta cena.', colorBlock: '#f59e0b' },
  { id: 's4',  scene: 'SC012', episode: 'EP01', duration: '1:22', rawDuration: '4:55',  status: 'pendente', notes: '', colorBlock: 'rgba(255,255,255,0.15)' },
  { id: 's5',  scene: 'SC015', episode: 'EP01', duration: '3:05', rawDuration: '11:20', status: 'montado',  notes: 'Sequência de perseguição. Cortes rápidos — OK.', colorBlock: '#7c3aed' },
  { id: 's6',  scene: 'SC021', episode: 'EP02', duration: '1:10', rawDuration: '5:00',  status: 'pendente', notes: '', colorBlock: 'rgba(255,255,255,0.15)' },
  { id: 's7',  scene: 'SC028', episode: 'EP02', duration: '2:33', rawDuration: '9:10',  status: 'revisão',  notes: 'Monólogo final — editar respirações excessivas.', colorBlock: '#f97316' },
  { id: 's8',  scene: 'SC031', episode: 'EP02', duration: '0:44', rawDuration: '2:30',  status: 'montado',  notes: 'Insert golden hour — utilizar take 2 completo.', colorBlock: '#a855f7' },
];

const STATUS_META: Record<SceneStatus, { color: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string }> = {
  montado:  { color: '#10b981', icon: CheckCircle, label: 'Montado'  },
  pendente: { color: 'rgba(255,255,255,0.3)', icon: Clock,        label: 'Pendente' },
  revisão:  { color: '#f59e0b', icon: AlertCircle, label: 'Revisão'  },
};

const ACCENT = '#a855f7';

/* ─────────────────────────────────────────────────────────────
   TIMELINE BAR
───────────────────────────────────────────────────────────── */

function TimelineBar({ scenes }: { scenes: MontageScene[] }) {
  const total = scenes.reduce((acc, s) => {
    const [m, sec] = s.duration.split(':').map(Number);
    return acc + m * 60 + sec;
  }, 0);

  return (
    <div style={{ ...nestedCard(), padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600 }}>Timeline — Assembly Cut</span>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
          {Math.floor(total / 60)}h {total % 60}m estimado
        </span>
      </div>
      <div style={{ display: 'flex', gap: 3, height: 32, borderRadius: 8, overflow: 'hidden' }}>
        {scenes.map(s => {
          const [m, sec] = s.duration.split(':').map(Number);
          const secs = m * 60 + sec;
          const pct = (secs / total) * 100;
          return (
            <motion.div
              key={s.id}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ ...springConfigs.gentle, delay: 0.05 }}
              style={{
                flex: `0 0 ${pct}%`,
                background: s.status === 'montado'
                  ? `linear-gradient(135deg, ${s.colorBlock}, ${s.colorBlock}bb)`
                  : s.status === 'revisão'
                    ? 'rgba(245,158,11,0.35)'
                    : 'rgba(255,255,255,0.08)',
                borderRadius: 4,
                border: `0.5px solid ${s.status === 'montado' ? `${s.colorBlock}60` : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 6,
              }}
              title={`${s.scene} — ${s.duration}`}
            >
              {pct > 5 && (
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 700 }}>{s.scene.slice(-3)}</span>
              )}
            </motion.div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
        {(['montado', 'revisão', 'pendente'] as SceneStatus[]).map(s => {
          const meta = STATUS_META[s];
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: meta.color }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{meta.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SCENE ROW
───────────────────────────────────────────────────────────── */

function SceneRow({ scene, onNotesChange }: {
  scene: MontageScene;
  onNotesChange: (id: string, notes: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(scene.notes);
  const meta = STATUS_META[scene.status];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
      style={{ ...nestedCard(), padding: '14px 16px', marginBottom: 8 }}
      whileTap={{ scale: 0.99 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Color dot */}
        <div style={{ width: 4, height: 40, borderRadius: 2, background: meta.color, flexShrink: 0 }} />

        {/* Scene info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{scene.episode} · {scene.scene}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Icon size={12} style={{ color: meta.color }} />
              <span style={{ color: meta.color, fontSize: 11, fontWeight: 600 }}>{meta.label}</span>
            </span>
          </div>

          {editing ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={() => { onNotesChange(scene.id, draft); setEditing(false); }}
                style={{
                  flex: 1, background: 'rgba(0,0,0,0.3)', border: '0.5px solid rgba(168,85,247,0.4)',
                  borderRadius: 8, padding: '4px 10px', color: '#fff', fontSize: 12, outline: 'none',
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
            >
              <span style={{ color: scene.notes ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                {scene.notes || 'Adicionar notas…'}
              </span>
            </button>
          )}
        </div>

        {/* Timings */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: ACCENT, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{scene.duration}</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>raw {scene.rawDuration}</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────── */

export function PosMontagemModule() {
  const [scenes, setScenes] = useState<MontageScene[]>(MOCK_SCENES);
  const [progress] = useState(62);

  const montados  = scenes.filter(s => s.status === 'montado').length;
  const pendentes = scenes.filter(s => s.status === 'pendente').length;
  const revisao   = scenes.filter(s => s.status === 'revisão').length;

  const totalMin = scenes
    .filter(s => s.status === 'montado')
    .reduce((acc, s) => {
      const [m, sec] = s.duration.split(':').map(Number);
      return acc + m * 60 + sec;
    }, 0);

  const duracaoEst = `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;

  function handleNotesChange(id: string, notes: string) {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, notes } : s));
  }

  return (
    <LiquidPage
      title="Montagem"
      description="Assembly cut — DESDOBRADO"
      section="pos"
    >
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <LiquidStatCard label="Total cenas"   value={scenes.length} accent={ACCENT} />
        <LiquidStatCard label="Montados"      value={montados}      accent="#10b981" />
        <LiquidStatCard label="Revisão"       value={revisao}       accent="#f59e0b" />
        <LiquidStatCard label="Duração est."  value={duracaoEst}    accent="#3b82f6" />
      </div>

      <LiquidCard>
        {/* Assembly cut progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>Assembly Cut Global</span>
            <span style={{ color: ACCENT, fontSize: 13, fontWeight: 700 }}>{progress}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ...springConfigs.smooth, duration: 1 }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${ACCENT}, #c084fc)`,
                borderRadius: 999,
                boxShadow: `0 0 12px ${ACCENT}80`,
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{montados} de {scenes.length} cenas montadas</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{pendentes} pendentes</span>
          </div>
        </div>

        <TimelineBar scenes={scenes} />

        {/* Scene list */}
        <LiquidSection title="Cenas" icon={Scissors}>
          {scenes.map(s => (
            <SceneRow key={s.id} scene={s} onNotesChange={handleNotesChange} />
          ))}
        </LiquidSection>
      </LiquidCard>
    </LiquidPage>
  );
}
