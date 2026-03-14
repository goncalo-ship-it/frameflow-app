/**
 * PÓS-PRODUÇÃO — CORRECÇÃO DE COR
 * Sessões de grade, previews de LUTs e notas de look development
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Palette, CheckCircle, Clock, ThumbsUp, FileText } from 'lucide-react';
import {
  LiquidPage, LiquidCard, LiquidSection, LiquidBadge, LiquidStatCard,
} from '../components/liquid-system';
import { PosNavPills } from '../components/PosNavPills';
import { nestedCard, iconGradient, springConfigs } from '../utils/liquidGlassStyles';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type GradeStatus = 'aprovado' | 'pendente' | 'em_revisão';

interface GradeSession {
  id: string;
  date: string;
  colorist: string;
  scenesGraded: number;
  duration: string;
  lut: string;
  notes: string;
  status: GradeStatus;
}

interface LUTCard {
  id: string;
  name: string;
  gradientFrom: string;
  gradientTo: string;
  description: string;
  episodes: string[];
}

/* ─────────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────────── */

const MOCK_LUTS: LUTCard[] = [
  {
    id: 'l1', name: 'DESDOBRADO_Main_v3',
    gradientFrom: '#1a0a2e', gradientTo: '#4a1d6b',
    description: 'Look principal — tons frios azul-violeta, contraste alto, pele quente',
    episodes: ['EP01', 'EP02', 'EP03'],
  },
  {
    id: 'l2', name: 'DESDOBRADO_Flashback_v2',
    gradientFrom: '#3d2b00', gradientTo: '#8b6914',
    description: 'Flashbacks — dominante âmbar/sépia, grain analógico, leve vinheta',
    episodes: ['EP01', 'EP04'],
  },
  {
    id: 'l3', name: 'DESDOBRADO_Exterior_v1',
    gradientFrom: '#0a2218', gradientTo: '#1d6b45',
    description: 'Exteriores dia — verde natureza, cyans nos altos, pretos densos',
    episodes: ['EP02', 'EP03', 'EP05'],
  },
  {
    id: 'l4', name: 'DESDOBRADO_Night_v2',
    gradientFrom: '#060a1f', gradientTo: '#0d1f4a',
    description: 'Noturno — preto azul-marinho profundo, luzes quentes selectivas',
    episodes: ['EP03', 'EP04', 'EP06'],
  },
];

const MOCK_SESSIONS: GradeSession[] = [
  { id: 'g1', date: '2026-03-10', colorist: 'Ricardo Figueiredo',  scenesGraded: 8,  duration: '6h', lut: 'DESDOBRADO_Main_v3',      notes: 'Cenas 1-8 EP01. Ajuste skin tone Margarida — light wrap necessário.', status: 'aprovado' },
  { id: 'g2', date: '2026-03-11', colorist: 'Ricardo Figueiredo',  scenesGraded: 5,  duration: '4h', lut: 'DESDOBRADO_Flashback_v2',  notes: 'Flashbacks EP01 e EP04. Grain a 40% — verificar entrega online.', status: 'aprovado' },
  { id: 'g3', date: '2026-03-12', colorist: 'Ana Madureira',       scenesGraded: 6,  duration: '5h', lut: 'DESDOBRADO_Exterior_v1',   notes: 'Quinta de Oeiras — céu pós-VFX ainda não recebido. Grade provisória.', status: 'em_revisão' },
  { id: 'g4', date: '2026-03-14', colorist: 'Ricardo Figueiredo',  scenesGraded: 0,  duration: '—',  lut: 'DESDOBRADO_Night_v2',      notes: 'Sessão agendada — noturno EP03 cemitério.', status: 'pendente' },
  { id: 'g5', date: '2026-03-15', colorist: 'Ana Madureira',       scenesGraded: 0,  duration: '—',  lut: 'DESDOBRADO_Main_v3',       notes: 'EP02 cenas interiores. Aguardar corte final de montagem.', status: 'pendente' },
];

const STATUS_META: Record<GradeStatus, { color: string; label: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }> = {
  aprovado:   { color: '#10b981', label: 'Aprovado',    icon: ThumbsUp   },
  pendente:   { color: 'rgba(255,255,255,0.3)', label: 'Pendente', icon: Clock },
  em_revisão: { color: '#f59e0b', label: 'Em revisão',  icon: CheckCircle },
};

const ACCENT = '#a855f7';

const LOOK_DEV_NOTES = `DESDOBRADO — Look Development Notes (v4, Mar 2026)

Paleta geral: pretos azulados profundos com altos quentes selectivos. Inspiração: "Le Bureau des Légendes" + "True Detective S1".

Pele: skin tone neutro-quente em ambientes interiores. No exterior, aceitar derive verde natural (Lisboa Março).

Separação de planos: baixo contraste nos meios-tons para preservar textura. Alto contraste nos planos de tensão.

Grain: estrutura analógica 16mm simulada. 35% em cenas normais, 60% nos flashbacks.

Entrega: DCI-P3 D65 para cinema, sRGB para streaming RTP Play. HDR10 a confirmar.`;

/* ─────────────────────────────────────────────────────────────
   LUT PREVIEW CARD
───────────────────────────────────────────────────────────── */

function LUTPreview({ lut }: { lut: LUTCard }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springConfigs.gentle}
      style={{ ...nestedCard(), padding: 0, overflow: 'hidden' }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Gradient preview */}
      <div style={{
        height: 60,
        background: `linear-gradient(135deg, ${lut.gradientFrom} 0%, ${lut.gradientTo} 100%)`,
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      }} />
      <div style={{ padding: '10px 12px' }}>
        <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, marginBottom: 4, fontFamily: 'monospace' }}>{lut.name}</div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: '0 0 8px 0', lineHeight: 1.4 }}>{lut.description}</p>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {lut.episodes.map(ep => (
            <span key={ep} style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
              background: 'rgba(168,85,247,0.15)', color: '#c084fc',
              border: '0.5px solid rgba(168,85,247,0.3)',
            }}>{ep}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SESSION ROW
───────────────────────────────────────────────────────────── */

function SessionRow({ session }: { session: GradeSession }) {
  const meta = STATUS_META[session.status];
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
      style={{ ...nestedCard(), padding: '12px 14px', marginBottom: 8 }}
      whileTap={{ scale: 0.99 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ ...iconGradient(meta.color, 'sm'), marginTop: 2 }}>
          <Icon size={13} style={{ color: meta.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{session.date}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{session.colorist}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: `${meta.color}20`, color: meta.color, border: `0.5px solid ${meta.color}40`,
            }}>{meta.label}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>{session.lut}</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0, lineHeight: 1.4 }}>{session.notes}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: ACCENT, fontSize: 14, fontWeight: 700 }}>{session.scenesGraded}</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>cenas</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>{session.duration}</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────── */

export function PosCorModule() {
  const [showNotes, setShowNotes] = useState(false);

  const sessions  = MOCK_SESSIONS;
  const graded    = sessions.reduce((acc, s) => acc + s.scenesGraded, 0);
  const aprovadas = sessions.filter(s => s.status === 'aprovado').length;
  const pendentes = sessions.filter(s => s.status === 'pendente').length;

  return (
    <LiquidPage
      title="Correcção de Cor"
      description="Grade & Look Development — DESDOBRADO"
      section="pos"
    >
      <PosNavPills activeTab="pos-cor" onTabChange={() => {}} />
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <LiquidStatCard label="Sessões"        value={sessions.length} accent={ACCENT} />
        <LiquidStatCard label="Cenas gradadas" value={graded}          accent="#10b981" />
        <LiquidStatCard label="Aprovadas"      value={aprovadas}       accent="#10b981" />
        <LiquidStatCard label="Pendentes"      value={pendentes}       accent="#f59e0b" />
      </div>

      {/* LUT previews */}
      <LiquidCard style={{ marginBottom: 16 }}>
        <LiquidSection title="LUTs do projecto" icon={Palette}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {MOCK_LUTS.map(lut => <LUTPreview key={lut.id} lut={lut} />)}
          </div>
        </LiquidSection>
      </LiquidCard>

      {/* Look Dev Notes */}
      <LiquidCard style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showNotes ? 12 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={14} style={{ color: ACCENT }} />
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600 }}>Look Development Notes</span>
          </div>
          <motion.button
            onClick={() => setShowNotes(v => !v)}
            whileTap={{ scale: 0.96 }}
            style={{
              padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', fontSize: 12,
            }}
          >{showNotes ? 'Fechar' : 'Ver notas'}</motion.button>
        </div>
        {showNotes && (
          <motion.pre
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={springConfigs.gentle}
            style={{
              background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 16,
              border: '0.5px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6,
              whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0,
            }}
          >{LOOK_DEV_NOTES}</motion.pre>
        )}
      </LiquidCard>

      {/* Sessions list */}
      <LiquidCard>
        <LiquidSection title="Sessões de grade" icon={CheckCircle}>
          {sessions.map(s => <SessionRow key={s.id} session={s} />)}
        </LiquidSection>
      </LiquidCard>
    </LiquidPage>
  );
}
