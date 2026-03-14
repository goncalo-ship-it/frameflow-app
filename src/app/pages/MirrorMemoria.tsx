/**
 * MIRROR — MEMÓRIA
 * O que a IA sabe sobre o projecto — contexto, contagens e interacções recentes
 */

import { motion } from 'motion/react';
import { Brain, Users, Film, MapPin, UserCheck, Clock, BookOpen, Layers } from 'lucide-react';
import {
  LiquidPage, LiquidCard, LiquidSection, LiquidStatCard,
} from '../components/liquid-system';
import { nestedCard, iconGradient, springConfigs } from '../utils/liquidGlassStyles';
// @ts-expect-error JSX module
import { useStore } from '../../core/store';
// @ts-expect-error JSX module
import { useShallow } from 'zustand/react/shallow';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

interface RecentInteraction {
  id: string;
  question: string;
  timestamp: string;
  module: string;
  moduleColor: string;
}

/* ─────────────────────────────────────────────────────────────
   MOCK RECENT INTERACTIONS
───────────────────────────────────────────────────────────── */

const RECENT_INTERACTIONS: RecentInteraction[] = [
  { id: 'i1', question: 'Analisa o schedule de produção actual e identifica problemas', timestamp: '2026-03-14 · 09:42', module: 'Produção', moduleColor: '#5B8DEF' },
  { id: 'i2', question: 'Qual é o estado actual do orçamento? Há desvios?', timestamp: '2026-03-13 · 17:15', module: 'Orçamento', moduleColor: '#f59e0b' },
  { id: 'i3', question: 'Quais personagens aparecem em mais de 3 episódios?', timestamp: '2026-03-13 · 14:02', module: 'Universo', moduleColor: '#ec4899' },
  { id: 'i4', question: 'Resume o que preciso de saber para o próximo dia de rodagem', timestamp: '2026-03-12 · 20:30', module: 'Produção', moduleColor: '#5B8DEF' },
  { id: 'i5', question: 'Há conflitos de continuidade entre personagens?', timestamp: '2026-03-11 · 11:18', module: 'Continuidade', moduleColor: '#10b981' },
];

const ACCENT = '#ec4899';

/* ─────────────────────────────────────────────────────────────
   CONTEXT CATEGORY CARD
───────────────────────────────────────────────────────────── */

function ContextCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: number | string;
  color: string;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
      style={{
        ...nestedCard(color),
        padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}
      whileTap={{ scale: 0.97 }}
    >
      <div style={{ ...iconGradient(color) }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 2 }}>{label}</div>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 3 }}>{sub}</div>}
      </div>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   INTERACTION ROW
───────────────────────────────────────────────────────────── */

function InteractionRow({ interaction }: { interaction: RecentInteraction }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={springConfigs.gentle}
      style={{ ...nestedCard(), padding: '11px 14px', marginBottom: 6 }}
      whileTap={{ scale: 0.99 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0,
          background: interaction.moduleColor,
          boxShadow: `0 0 6px ${interaction.moduleColor}`,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '0 0 4px 0', lineHeight: 1.5 }}>
            {interaction.question}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{interaction.timestamp}</span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999,
              background: `${interaction.moduleColor}20`, color: interaction.moduleColor,
              border: `0.5px solid ${interaction.moduleColor}40`,
            }}>{interaction.module}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PROJECT CONTEXT BLOCK
───────────────────────────────────────────────────────────── */

interface ProjectBible {
  logline?: string;
  genre?: string;
  tone?: string;
  sections?: unknown[];
}

interface Universe {
  chars?: unknown[];
  bible?: ProjectBible;
  episodeArcs?: unknown[];
}

function ProjectContextBlock({ universe }: { universe?: Universe }) {
  const bible = universe?.bible as ProjectBible | undefined;

  const fields: { label: string; value: string }[] = [
    { label: 'Projecto',      value: 'DESDOBRADO'               },
    { label: 'Plataforma',    value: 'RTP2'                     },
    { label: 'Formato',       value: 'Série — 6 episódios'      },
    { label: 'Género',        value: bible?.genre  ?? 'Drama / Thriller' },
    { label: 'Tom',           value: bible?.tone   ?? 'Sombrio, tenso, introspectivo' },
    { label: 'Logline',       value: bible?.logline ?? 'Uma detective portuguesa investiga o desaparecimento de um adolescente que a leva a confrontar os seus próprios segredos.' },
    { label: 'Rodagem',       value: 'Julho 2025 — Lisboa e Oeiras' },
  ];

  return (
    <div style={{ ...nestedCard(), padding: '16px 18px' }}>
      {fields.map((f, i) => (
        <div key={f.label} style={{
          display: 'flex', gap: 12,
          paddingBottom: i < fields.length - 1 ? 10 : 0,
          marginBottom: i < fields.length - 1 ? 10 : 0,
          borderBottom: i < fields.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, minWidth: 80, flexShrink: 0 }}>{f.label}</span>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.5 }}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────── */

interface StoreState {
  team?: unknown[];
  locations?: unknown[];
  parsedCharacters?: unknown[];
  shootingDays?: unknown[];
  universe?: Universe;
  suggestions?: unknown[];
  departmentItems?: unknown[];
}

export function MirrorMemoriaModule() {
  const {
    team,
    locations,
    parsedCharacters,
    shootingDays,
    universe,
    suggestions,
    departmentItems,
  } = useStore(useShallow((s: StoreState) => ({
    team:             s.team             ?? [],
    locations:        s.locations        ?? [],
    parsedCharacters: s.parsedCharacters ?? [],
    shootingDays:     s.shootingDays     ?? [],
    universe:         s.universe         ?? {},
    suggestions:      s.suggestions      ?? [],
    departmentItems:  s.departmentItems  ?? [],
  })));

  const chars  = (universe as Universe)?.chars ?? parsedCharacters;
  const scenes = (universe as Universe)?.episodeArcs ?? [];

  // Context categories
  const contextItems = [
    { icon: Users,     label: 'Membros de equipa',  value: (team as unknown[]).length || 24,          color: '#8B6FBF', sub: 'Produção, Realização, Técnicos…' },
    { icon: Film,      label: 'Personagens',        value: (chars as unknown[]).length || 12,          color: '#ec4899', sub: 'Guião FDX importado'            },
    { icon: MapPin,    label: 'Locais',             value: (locations as unknown[]).length || 9,       color: '#10b981', sub: 'Lisboa, Oeiras, Cascais'        },
    { icon: Layers,    label: 'Dias de rodagem',    value: (shootingDays as unknown[]).length || 28,   color: '#3b82f6', sub: '19 concluídos, 9 restantes'     },
    { icon: Brain,     label: 'Sugestões IA',       value: (suggestions as unknown[]).length || 6,     color: '#f59e0b', sub: 'Cruzamentos entre módulos'      },
    { icon: BookOpen,  label: 'Itens departamento', value: (departmentItems as unknown[]).length || 47, color: '#f97316', sub: '12 departamentos activos'       },
  ];

  return (
    <LiquidPage
      title="Memória"
      description="Contexto do projecto acessível à IA"
      section="mirror"
    >
      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <LiquidStatCard label="Módulos indexados"  value={14}  accent={ACCENT}    />
        <LiquidStatCard label="Interacções totais" value={47}  accent="#a855f7"   />
        <LiquidStatCard label="Contexto activo"    value="100%" accent="#10b981"  />
      </div>

      {/* Context categories */}
      <LiquidCard style={{ marginBottom: 16 }}>
        <LiquidSection title="O que a IA conhece" icon={Brain}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {contextItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfigs.gentle, delay: i * 0.05 }}
              >
                <ContextCard {...item} />
              </motion.div>
            ))}
          </div>
        </LiquidSection>
      </LiquidCard>

      {/* Project context */}
      <LiquidCard style={{ marginBottom: 16 }}>
        <LiquidSection title="Contexto do projecto" icon={BookOpen}>
          <ProjectContextBlock universe={universe as Universe} />
        </LiquidSection>
      </LiquidCard>

      {/* Recent interactions */}
      <LiquidCard>
        <LiquidSection title="Interacções recentes" icon={Clock}>
          {RECENT_INTERACTIONS.map(interaction => (
            <InteractionRow key={interaction.id} interaction={interaction} />
          ))}
        </LiquidSection>
      </LiquidCard>
    </LiquidPage>
  );
}
