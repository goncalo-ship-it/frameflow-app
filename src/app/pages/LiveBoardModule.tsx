/**
 * LIVE BOARD MODULE — Shell Page
 * Controlo em tempo real do set de rodagem
 */

import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, Film, Camera, Users,
  Clapperboard, Mic, Palette, Shirt, Sparkles, Briefcase,
  Calendar, ArrowRight,
} from 'lucide-react';
import {
  LiquidPage, LiquidSection, LiquidStatCard, LiquidButton,
} from '../components/liquid-system';
import { useStore } from '../../core/store';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

interface ShootingDay {
  id:        string;
  date?:     string;
  dayNumber?: number;
  status?:   string;
  callTime?: string;
  notes?:    string;
}

interface Take {
  id:        string;
  status?:   string;
  notes?:    string;
  timestamp?: string;
}

interface ParsedScene {
  id?:         string;
  sceneNumber?: string;
  intExt?:     string;
  location?:   string;
  setting?:    string;
  characters?: string[];
  heading?:    string;
}

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

function PulsingDot({ color }: { color: string }) {
  return (
    <motion.span
      animate={{ opacity: [1, 0.4, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}, 0 0 16px ${color}60`,
        flexShrink: 0,
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   SCENE STATUS LOGIC
───────────────────────────────────────────────────────────── */

function getSceneStatus(takes: Take[]): {
  label: string;
  color: string;
  pulsing: boolean;
} {
  if (takes.length === 0) {
    return { label: 'A aguardar', color: 'rgba(255,255,255,0.40)', pulsing: false };
  }
  if (takes.some(t => t.status === 'ok')) {
    return { label: 'Concluída', color: '#10b981', pulsing: false };
  }
  return { label: 'Em rodagem', color: '#3b82f6', pulsing: true };
}

/* ─────────────────────────────────────────────────────────────
   SCENE CARD
───────────────────────────────────────────────────────────── */

function SceneCard({
  sceneKey,
  scene,
  takes,
  index,
}: {
  sceneKey: string;
  scene:    ParsedScene | null;
  takes:    Take[];
  index:    number;
}) {
  const intExt      = scene?.intExt || scene?.heading?.match(/^(INT|EXT)/)?.[1] || 'INT';
  const intExtColor = intExt === 'EXT' ? '#10b981' : '#3b82f6';
  const location    = scene?.location || scene?.setting || '—';
  const characters  = scene?.characters || [];
  const status      = getSceneStatus(takes);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      whileTap={{ scale: 0.97 }}
    >
      <GlassNestedCard>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.90)',
                fontFamily: 'monospace',
              }}
            >
              {sceneKey}
            </span>
            <Badge label={intExt} color={intExtColor} />
          </div>

          {/* Takes badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              background: 'rgba(245,158,11,0.15)',
              color: '#f59e0b',
              border: '0.5px solid rgba(245,158,11,0.30)',
              gap: 4,
            }}
          >
            <Camera size={10} />
            {takes.length}
          </span>
        </div>

        {/* Location */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
          {location}
        </p>

        {/* Characters */}
        {characters.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {characters.slice(0, 4).map((char, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#a855f7',
                  background: 'rgba(168,85,247,0.10)',
                  border: '0.5px solid rgba(168,85,247,0.20)',
                  borderRadius: 999,
                  padding: '2px 8px',
                }}
              >
                {char}
              </span>
            ))}
            {characters.length > 4 && (
              <span
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.30)',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 999,
                  padding: '2px 8px',
                }}
              >
                +{characters.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {status.pulsing
            ? <PulsingDot color={status.color} />
            : (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: status.color,
                  flexShrink: 0,
                }}
              />
            )
          }
          <span style={{ fontSize: 12, fontWeight: 600, color: status.color }}>
            {status.label}
          </span>
        </div>
      </GlassNestedCard>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TODAY HERO CARD
───────────────────────────────────────────────────────────── */

function TodayHeroCard({ day }: { day: ShootingDay }) {
  const isFilming = day.status === 'filming';
  const isPlanned = day.status === 'planned' || !day.status;
  const isDone    = day.status === 'done';

  const statusColor = isFilming ? '#10b981' : isDone ? 'rgba(255,255,255,0.40)' : '#f59e0b';
  const statusLabel = isFilming ? 'ROLLING' : isDone ? 'CONCLUÍDO' : 'PLANEADO';

  // Format date
  let displayDate = day.date || '';
  if (displayDate) {
    try {
      displayDate = new Date(displayDate).toLocaleDateString('pt-PT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      // keep raw
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '0.5px solid rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Lensing */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          {/* Left */}
          <div>
            {/* Day label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: 'rgba(255,255,255,0.95)',
                  letterSpacing: '-0.02em',
                }}
              >
                Dia {day.dayNumber || 1}
              </span>

              {/* Status badge with pulse if filming */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isFilming && <PulsingDot color={statusColor} />}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: statusColor,
                    background: `${statusColor}20`,
                    border: `0.5px solid ${statusColor}40`,
                    borderRadius: 999,
                    padding: '3px 10px',
                    letterSpacing: '0.06em',
                  }}
                >
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Date */}
            {displayDate && (
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.60)', marginBottom: 4 }}>
                {displayDate}
              </p>
            )}

            {/* Call time */}
            {day.callTime && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                Call: <span style={{ color: 'rgba(255,255,255,0.80)', fontWeight: 700 }}>{day.callTime}</span>
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        {day.notes && (
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 12,
              lineHeight: 1.5,
              borderTop: '0.5px solid rgba(255,255,255,0.08)',
              paddingTop: 12,
            }}
          >
            {day.notes}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   NO DAY STATE
───────────────────────────────────────────────────────────── */

function NoDayState({ nextDay }: { nextDay?: ShootingDay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '0.5px solid rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Lensing */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.06)',
            border: '0.5px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Clapperboard size={28} style={{ color: 'rgba(255,255,255,0.40)' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.80)', marginBottom: 6 }}>
            Sem rodagem hoje
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)' }}>
            Nenhum dia de rodagem está marcado para hoje
          </p>
        </div>

        {/* Next day info */}
        {nextDay && (
          <GlassNestedCard style={{ width: '100%', maxWidth: 320 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Próxima rodagem
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} style={{ color: 'rgba(255,255,255,0.50)' }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {nextDay.date || 'Data a definir'}
                {nextDay.dayNumber && ` — Dia ${nextDay.dayNumber}`}
              </span>
            </div>
          </GlassNestedCard>
        )}

        <LiquidButton variant="blue" icon={<ArrowRight size={14} />} pill>
          Ver Schedule
        </LiquidButton>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DEPARTMENT PILLS
───────────────────────────────────────────────────────────── */

const DEPARTMENTS = [
  { id: 'camera',      label: 'Câmara',       icon: <Camera  size={14} />, color: '#3b82f6' },
  { id: 'som',         label: 'Som',           icon: <Mic     size={14} />, color: '#f59e0b' },
  { id: 'arte',        label: 'Arte',          icon: <Palette size={14} />, color: '#8b5cf6' },
  { id: 'wardobe',     label: 'Guarda-Roupa',  icon: <Shirt   size={14} />, color: '#ec4899' },
  { id: 'makeup',      label: 'Makeup',        icon: <Sparkles size={14} />, color: '#a855f7' },
  { id: 'producao',    label: 'Produção',      icon: <Briefcase size={14} />, color: '#10b981' },
];

function DeptPills() {
  return (
    <LiquidSection title="Departamentos" accentColor="#3b82f6">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {DEPARTMENTS.map((dept, i) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 14,
                border: '0.5px solid rgba(255,255,255,0.12)',
                padding: '10px 16px',
                cursor: 'pointer',
              }}
            >
              {/* Icon */}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: `${dept.color}20`,
                  border: `0.5px solid ${dept.color}35`,
                  color: dept.color,
                  flexShrink: 0,
                }}
              >
                {dept.icon}
              </span>

              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                  {dept.label}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', fontWeight: 500 }}>
                  Em prep
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </LiquidSection>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */

export function LiveBoardModule() {
  const { shootingDays, sceneAssignments, sceneTakes, team, parsedScripts } = useStore() as {
    shootingDays?:      ShootingDay[];
    sceneAssignments?:  Record<string, string>;
    sceneTakes?:        Record<string, Take[]>;
    team?:              unknown[];
    parsedScripts?:     Record<string, { scenes?: ParsedScene[] }>;
  };

  const today       = new Date().toISOString().slice(0, 10);
  const todayDay    = shootingDays?.find(d => d.date === today);

  const todaySceneKeys = Object.entries(sceneAssignments || {})
    .filter(([, dayId]) => dayId === todayDay?.id)
    .map(([key]) => key);

  // Total takes for today's scenes
  const takesTotal = todaySceneKeys.reduce((sum, key) => {
    return sum + ((sceneTakes || {})[key]?.length || 0);
  }, 0);

  // Status value for stat card
  const dayStatusValue =
    todayDay?.status === 'filming' ? 'ROLLING' :
    todayDay                       ? 'HOJE'    : 'SEM DIA';

  const teamCount = team?.length || 0;

  // Build a scene lookup from parsedScripts
  const allScenes: Record<string, ParsedScene> = {};
  Object.entries(parsedScripts || {}).forEach(([epId, ep]) => {
    (ep.scenes || []).forEach(scene => {
      const sceneId  = (scene as ParsedScene).sceneNumber || (scene as ParsedScene).id || '';
      const sceneKey = `${epId}-${sceneId}`;
      allScenes[sceneKey] = scene as ParsedScene;
      // Also index by just the scene id in case keys don't have ep prefix
      allScenes[sceneId]  = scene as ParsedScene;
    });
  });

  // Next shooting day (after today)
  const nextDay = shootingDays
    ?.filter(d => d.date && d.date > today)
    .sort((a, b) => (a.date || '') < (b.date || '') ? -1 : 1)[0];

  /* Stat cards */
  const STAT_CARDS = [
    {
      label:          'Status do Dia',
      value:          dayStatusValue,
      icon:           <Activity size={18} />,
      variant:        'emerald' as const,
      pulse:          todayDay?.status === 'filming',
      animationDelay: 0,
    },
    {
      label:          'Cenas Hoje',
      value:          todaySceneKeys.length,
      icon:           <Film size={18} />,
      variant:        'blue' as const,
      animationDelay: 80,
    },
    {
      label:          'Takes Total',
      value:          takesTotal,
      icon:           <Camera size={18} />,
      variant:        'amber' as const,
      animationDelay: 160,
    },
    {
      label:          'Equipa',
      value:          teamCount,
      icon:           <Users size={18} />,
      variant:        'purple' as const,
      animationDelay: 240,
    },
  ];

  return (
    <LiquidPage
      title="Live Board"
      description="Controlo em tempo real do set de rodagem"
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
            pulse={card.pulse}
            animationDelay={card.animationDelay}
          />
        ))}
      </div>

      {/* Hero: today card or no-day state */}
      <AnimatePresence mode="wait">
        {todayDay ? (
          <motion.div
            key="today"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TodayHeroCard day={todayDay} />
          </motion.div>
        ) : (
          <motion.div
            key="noday"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <NoDayState nextDay={nextDay} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cenas do dia — only if there's a today */}
      {todayDay && (
        <LiquidSection title="Cenas do Dia" accentColor="#3b82f6">
          {todaySceneKeys.length === 0 ? (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', padding: '8px 0' }}>
              Nenhuma cena atribuída a hoje.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 10,
              }}
            >
              {todaySceneKeys.map((sceneKey, i) => {
                const takes = (sceneTakes || {})[sceneKey] || [];
                const scene = allScenes[sceneKey] || null;

                return (
                  <SceneCard
                    key={sceneKey}
                    sceneKey={sceneKey}
                    scene={scene}
                    takes={takes}
                    index={i}
                  />
                );
              })}
            </div>
          )}
        </LiquidSection>
      )}

      {/* Department pills */}
      <DeptPills />
    </LiquidPage>
  );
}
