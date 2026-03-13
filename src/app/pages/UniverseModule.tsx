/**
 * UNIVERSE MODULE — Shell Page
 * Personagens, relações, arcos narrativos e bíblia do projecto
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Share2, Film, BookOpen, TrendingUp, MessageSquare,
  Plus, ArrowRight,
} from 'lucide-react';
import {
  LiquidPage, LiquidSection, LiquidStatCard, LiquidTabs, LiquidButton,
} from '../components/liquid-system';
import { useStore } from '../../core/store';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

interface Character {
  id: string;
  name: string;
  arcType?: string;
  group?: string;
  description?: string;
  age?: number | string;
  occupation?: string;
}

interface Relation {
  id: string;
  from: string;
  to: string;
  type?: string;
  label?: string;
}

interface EpisodeArc {
  id: string;
  epNum?: number | string;
  title?: string;
  phase?: string;
  phaseColor?: string;
  desire?: string;
  description?: string;
}

interface Decision {
  id: string;
  title: string;
  urgency?: string;
  status?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  options?: string[];
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'personagens', label: 'Personagens', icon: <Users size={14} /> },
  { id: 'relacoes',    label: 'Rede',         icon: <Share2 size={14} /> },
  { id: 'biblia',      label: 'Bíblia',        icon: <BookOpen size={14} /> },
  { id: 'arcos',       label: 'Arcos',         icon: <TrendingUp size={14} /> },
  { id: 'writers',     label: 'Writers Room',  icon: <MessageSquare size={14} /> },
];

const ARC_TYPE_COLORS: Record<string, string> = {
  protagonist:    '#10b981',
  antagonist:     '#ef4444',
  'co-protagonist': '#3b82f6',
  mentor:         '#f59e0b',
};
const DEFAULT_CHAR_COLOR = '#a855f7';

const RELATION_TYPE_COLORS: Record<string, string> = {
  romantic:     '#ec4899',
  family:       '#10b981',
  conflict:     '#ef4444',
  friendship:   '#3b82f6',
  professional: '#f59e0b',
};
const DEFAULT_RELATION_COLOR = '#a855f7';

const PHASE_COLORS: Record<string, string> = {
  setup:          '#3b82f6',
  confrontation:  '#f59e0b',
  resolution:     '#10b981',
};

const URGENCY_COLORS: Record<string, string> = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#a855f7',
};

const STATUS_COLORS: Record<string, string> = {
  open:    '#f59e0b',
  decided: '#10b981',
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

function Badge({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: `${color}26`,
        color,
        border: `0.5px solid ${color}4d`,
      }}
    >
      {label}
    </span>
  );
}

function GlassNestedCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 16,
        border: '0.5px solid rgba(255,255,255,0.12)',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB: PERSONAGENS
───────────────────────────────────────────────────────────── */

function PersonagensTab({ chars }: { chars: Character[] }) {
  if (chars.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '64px 0',
        }}
      >
        <Users size={40} style={{ color: 'rgba(255,255,255,0.2)' }} />
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>
          Sem personagens ainda
        </p>
        <LiquidButton variant="purple" icon={<Plus size={14} />} pill>
          Adicionar Personagem
        </LiquidButton>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {chars.map((char, i) => {
        const accentColor = ARC_TYPE_COLORS[char.arcType || ''] || DEFAULT_CHAR_COLOR;
        const firstLetter = (char.name || '?')[0].toUpperCase();

        return (
          <motion.div
            key={char.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            whileTap={{ scale: 0.97 }}
          >
            <GlassNestedCard>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                {/* Avatar */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${accentColor}26`,
                    border: `0.5px solid ${accentColor}4d`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 16,
                    fontWeight: 900,
                    color: accentColor,
                  }}
                >
                  {firstLetter}
                </div>

                {/* Name + badges */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.95)',
                      marginBottom: 4,
                    }}
                  >
                    {char.name}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {char.arcType && (
                      <Badge label={char.arcType} color={accentColor} />
                    )}
                    {char.group && (
                      <Badge label={char.group} color="rgba(255,255,255,0.5)" />
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {char.description && (
                <p
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.5,
                    marginBottom: 10,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {char.description}
                </p>
              )}

              {/* Footer: age + occupation */}
              {(char.age || char.occupation) && (
                <div style={{ display: 'flex', gap: 12 }}>
                  {char.age && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                      {char.age} anos
                    </span>
                  )}
                  {char.occupation && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                      {char.occupation}
                    </span>
                  )}
                </div>
              )}
            </GlassNestedCard>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB: RELAÇÕES
───────────────────────────────────────────────────────────── */

function RelacoesTab({ relations }: { relations: Relation[] }) {
  if (relations.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '64px 0',
        }}
      >
        <Share2 size={40} style={{ color: 'rgba(255,255,255,0.2)' }} />
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>
          Mapa de relações vazio
        </p>
        <LiquidButton variant="blue" icon={<Plus size={14} />} pill>
          Criar Primeira Relação
        </LiquidButton>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {relations.map((rel, i) => {
        const accentColor = RELATION_TYPE_COLORS[rel.type || ''] || DEFAULT_RELATION_COLOR;

        return (
          <motion.div
            key={rel.id || i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            whileTap={{ scale: 0.97 }}
          >
            <GlassNestedCard style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* From → To */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.90)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {rel.from}
                  </span>
                  <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.90)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {rel.to}
                  </span>

                  {rel.label && (
                    <span
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.55)',
                        marginLeft: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      — {rel.label}
                    </span>
                  )}
                </div>

                {/* Type badge */}
                {rel.type && (
                  <Badge label={rel.type} color={accentColor} />
                )}
              </div>
            </GlassNestedCard>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB: BÍBLIA
───────────────────────────────────────────────────────────── */

function BibliaTab({ bible }: { bible: Record<string, unknown> }) {
  const logline = bible?.logline as string | undefined;
  const genre   = bible?.genre   as string | undefined;
  const tone    = bible?.tone    as string | undefined;
  const themes  = (bible?.themes as string[]) || [];
  const text    = bible?.text    as string | undefined;
  const sections = (bible?.sections as Array<{ title: string; content: string }>) || [];

  if (!logline && !genre && !tone && themes.length === 0 && !text && sections.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '64px 0',
        }}
      >
        <BookOpen size={40} style={{ color: 'rgba(255,255,255,0.2)' }} />
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>
          Bible em construção
        </p>
        <LiquidButton variant="amber" icon={<Plus size={14} />} pill>
          Começar Bible
        </LiquidButton>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Logline */}
      {logline && (
        <GlassNestedCard>
          <p
            style={{
              fontSize: 16,
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.90)',
              lineHeight: 1.6,
              borderLeft: '2px solid rgba(245,158,11,0.6)',
              paddingLeft: 16,
            }}
          >
            "{logline}"
          </p>
        </GlassNestedCard>
      )}

      {/* Genre + Tone */}
      {(genre || tone) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {genre && <Badge label={genre} color="#f59e0b" />}
          {tone  && <Badge label={tone}  color="#a855f7" />}
        </div>
      )}

      {/* Themes */}
      {themes.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Temas
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {themes.map((theme, i) => (
              <Badge key={i} label={theme} color="#3b82f6" />
            ))}
          </div>
        </div>
      )}

      {/* Text preview */}
      {text && (
        <GlassNestedCard>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.70)',
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 6,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {text}
          </p>
        </GlassNestedCard>
      )}

      {/* Sections */}
      {sections.map((section, i) => (
        <GlassNestedCard key={i}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {section.title}
          </p>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.70)',
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {section.content}
          </p>
        </GlassNestedCard>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB: ARCOS
───────────────────────────────────────────────────────────── */

function ArcosTab({ arcs }: { arcs: EpisodeArc[] }) {
  if (arcs.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '64px 0',
        }}
      >
        <TrendingUp size={40} style={{ color: 'rgba(255,255,255,0.2)' }} />
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>
          Sem arcos definidos
        </p>
        <LiquidButton variant="blue" icon={<Plus size={14} />} pill>
          Adicionar Arco
        </LiquidButton>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {arcs.map((arc, i) => {
        const phaseColor = PHASE_COLORS[arc.phase || ''] || '#3b82f6';

        return (
          <motion.div
            key={arc.id || i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            whileTap={{ scale: 0.97 }}
          >
            <GlassNestedCard>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Episode number bubble */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${phaseColor}26`,
                    border: `0.5px solid ${phaseColor}4d`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 12,
                    fontWeight: 900,
                    color: phaseColor,
                  }}
                >
                  E{arc.epNum || '?'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>
                      {arc.title || `Episódio ${arc.epNum}`}
                    </span>
                    {arc.phase && (
                      <Badge label={arc.phase} color={phaseColor} />
                    )}
                  </div>

                  {arc.desire && (
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)', marginBottom: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>Desejo: </span>
                      {arc.desire}
                    </p>
                  )}

                  {arc.description && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.55)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {arc.description}
                    </p>
                  )}
                </div>
              </div>
            </GlassNestedCard>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB: WRITERS ROOM
───────────────────────────────────────────────────────────── */

function WritersTab({ decisions }: { decisions: Decision[] }) {
  if (decisions.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '64px 0',
        }}
      >
        <MessageSquare size={40} style={{ color: 'rgba(255,255,255,0.2)' }} />
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>
          Sala de escritores vazia
        </p>
        <LiquidButton variant="purple" icon={<Plus size={14} />} pill>
          Criar Decisão
        </LiquidButton>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {decisions.map((dec, i) => {
        const urgencyColor = URGENCY_COLORS[dec.urgency || ''] || '#a855f7';
        const statusColor  = STATUS_COLORS[dec.status  || ''] || '#f59e0b';

        // Build options list
        const optionsList: string[] = dec.options?.length
          ? dec.options
          : [dec.optionA, dec.optionB, dec.optionC].filter(Boolean) as string[];
        const OPTION_LABELS = ['A', 'B', 'C'];

        return (
          <motion.div
            key={dec.id || i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            whileTap={{ scale: 0.97 }}
          >
            <GlassNestedCard>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.92)', flex: 1 }}>
                  {dec.title}
                </span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {dec.urgency && <Badge label={dec.urgency} color={urgencyColor} />}
                  {dec.status  && <Badge label={dec.status}  color={statusColor}  />}
                </div>
              </div>

              {/* Options */}
              {optionsList.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {optionsList.map((opt, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 900,
                          color: 'rgba(255,255,255,0.40)',
                          width: 16,
                          flexShrink: 0,
                          paddingTop: 1,
                        }}
                      >
                        {OPTION_LABELS[j] ?? j + 1}
                      </span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                        {opt}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassNestedCard>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */

export function UniverseModule() {
  const [activeTab, setActiveTab] = useState('personagens');

  const { universe, parsedScripts, parsedCharacters } = useStore() as {
    universe?: {
      chars?: Character[];
      relations?: Relation[];
      bible?: Record<string, unknown>;
      episodeArcs?: EpisodeArc[];
      decisions?: Decision[];
    };
    parsedScripts?: Record<string, { scenes?: unknown[] }>;
    parsedCharacters?: unknown[];
  };

  const chars        = universe?.chars        || [];
  const relations    = universe?.relations    || [];
  const bible        = universe?.bible        || {};
  const episodeArcs  = universe?.episodeArcs  || [];
  const decisions    = universe?.decisions    || [];

  const episodeCount = Object.keys(parsedScripts || {}).length;
  const bibleStatus  = (bible as { logline?: string }).logline ? 'Completa' : 'Em curso';

  /* Stat cards */
  const STAT_CARDS = [
    {
      label: 'Personagens',
      value: chars.length,
      icon: <Users size={18} />,
      variant: 'purple' as const,
      animationDelay: 0,
    },
    {
      label: 'Relações',
      value: relations.length,
      icon: <Share2 size={18} />,
      variant: 'blue' as const,
      animationDelay: 80,
    },
    {
      label: 'Episódios',
      value: episodeCount,
      icon: <Film size={18} />,
      variant: 'emerald' as const,
      animationDelay: 160,
    },
    {
      label: 'Bíblia',
      value: bibleStatus,
      icon: <BookOpen size={18} />,
      variant: 'amber' as const,
      animationDelay: 240,
    },
  ];

  return (
    <LiquidPage
      title="Universo"
      description="Personagens, relações, arcos narrativos e bíblia do projecto"
    >
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {STAT_CARDS.map((card) => (
          <LiquidStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            variant={card.variant}
            animationDelay={card.animationDelay}
          />
        ))}
      </div>

      {/* Tabs */}
      <LiquidTabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {activeTab === 'personagens' && (
            <LiquidSection title="Personagens" accentColor="#a855f7">
              <PersonagensTab chars={chars} />
            </LiquidSection>
          )}

          {activeTab === 'relacoes' && (
            <LiquidSection title="Rede de Relações" accentColor="#3b82f6">
              <RelacoesTab relations={relations} />
            </LiquidSection>
          )}

          {activeTab === 'biblia' && (
            <LiquidSection title="Bíblia" accentColor="#f59e0b">
              <BibliaTab bible={bible as Record<string, unknown>} />
            </LiquidSection>
          )}

          {activeTab === 'arcos' && (
            <LiquidSection title="Arcos Narrativos" accentColor="#3b82f6">
              <ArcosTab arcs={episodeArcs} />
            </LiquidSection>
          )}

          {activeTab === 'writers' && (
            <LiquidSection title="Writers Room" accentColor="#a855f7">
              <WritersTab decisions={decisions} />
            </LiquidSection>
          )}
        </motion.div>
      </AnimatePresence>
    </LiquidPage>
  );
}
