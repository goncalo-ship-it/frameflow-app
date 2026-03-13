/**
 * CONTINUITY MODULE — Shell Page
 * Notas de script, consistência visual e cobertura por cena
 */

import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardCheck, Film, FileText, BarChart2,
  Plus, Eye,
} from 'lucide-react';
import {
  LiquidPage, LiquidSection, LiquidStatCard, LiquidButton,
} from '../components/liquid-system';
import { useStore } from '../../core/store';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

interface ParsedScene {
  id?: string;
  sceneNumber?: string;
  location?: string;
  intExt?: string;
  setting?: string;
  characters?: string[];
  heading?: string;
}

interface ContinuityEntry {
  wardrobe?: string;
  props?: string;
  makeup?: string;
  notes?: string;
  [key: string]: unknown;
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

function DotLabel({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          marginTop: 4,
        }}
      />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
        <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{label}: </span>
        {value}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   COVERED SCENE CARD
───────────────────────────────────────────────────────────── */

function CoveredSceneCard({
  sceneKey,
  entry,
  index,
}: {
  sceneKey: string;
  entry: ContinuityEntry;
  index: number;
}) {
  const previewText = entry.notes || entry.wardrobe || entry.props || entry.makeup || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      whileTap={{ scale: 0.97 }}
    >
      <GlassNestedCard>
        {/* Scene key */}
        <p style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.92)', marginBottom: 8, fontFamily: 'monospace' }}>
          {sceneKey}
        </p>

        {/* Sub-labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
          <DotLabel color="#10b981" label="Guarda-Roupa" value={entry.wardrobe} />
          <DotLabel color="#3b82f6" label="Adereços"     value={entry.props}    />
          <DotLabel color="#a855f7" label="Makeup"       value={entry.makeup}   />
        </div>

        {/* Preview */}
        {previewText && (
          <p
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.50)',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              marginBottom: 10,
            }}
          >
            {previewText}
          </p>
        )}

        {/* Button */}
        <LiquidButton variant="default" size="sm" icon={<Eye size={12} />}>
          Ver detalhes
        </LiquidButton>
      </GlassNestedCard>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   UNCOVERED SCENE CARD
───────────────────────────────────────────────────────────── */

function UncoveredSceneCard({
  scene,
  index,
}: {
  scene: ParsedScene;
  index: number;
}) {
  const sceneId   = scene.sceneNumber || scene.id || '?';
  const intExt    = scene.intExt || scene.heading?.match(/^(INT|EXT)/)?.[1] || 'INT';
  const intExtColor = intExt === 'EXT' ? '#10b981' : '#3b82f6';
  const location  = scene.location || scene.setting || '—';
  const characters = scene.characters || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 + 0.1, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      whileTap={{ scale: 0.97 }}
    >
      <GlassNestedCard style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {/* Scene id + INT/EXT badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.80)', fontFamily: 'monospace' }}>
            SC{sceneId}
          </span>
          <Badge label={intExt} color={intExtColor} />
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
                  color: 'rgba(255,255,255,0.45)',
                  background: 'rgba(255,255,255,0.07)',
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
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.35)',
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

        {/* Add note button */}
        <LiquidButton variant="emerald" size="sm" icon={<Plus size={12} />}>
          Adicionar nota
        </LiquidButton>
      </GlassNestedCard>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '80px 0',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'rgba(16,185,129,0.10)',
          border: '0.5px solid rgba(16,185,129,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ClipboardCheck size={32} style={{ color: '#10b981' }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.80)', marginBottom: 6 }}>
          Sem notas de continuidade
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)' }}>
          Começa a registar continuidade pelas cenas do guião
        </p>
      </div>

      <LiquidButton variant="emerald" icon={<Plus size={14} />} pill glow>
        Começar a registar continuidade
      </LiquidButton>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */

export function ContinuityModule() {
  const { continuityData, parsedScripts, sceneAssignments, shootingDays } = useStore() as {
    continuityData?: Record<string, ContinuityEntry>;
    parsedScripts?:  Record<string, { scenes?: ParsedScene[] }>;
    sceneAssignments?: Record<string, string>;
    shootingDays?: unknown[];
  };

  const allScenes    = Object.values(parsedScripts || {}).flatMap(ep => ep.scenes || []) as ParsedScene[];
  const coveredKeys  = Object.keys(continuityData  || {});
  const totalScenes  = allScenes.length;
  const coverage     = Math.round(coveredKeys.length / Math.max(totalScenes, 1) * 100);

  const uncoveredScenes = allScenes.filter(scene => {
    // Match using the same sceneKey pattern: epId-sceneId
    // Since we don't have epId here, we match by sceneNumber or id
    const sceneId = scene.sceneNumber || scene.id || '';
    return !coveredKeys.some(k => k.endsWith(`-${sceneId}`) || k === sceneId);
  });

  /* Stat cards config */
  const STAT_CARDS = [
    {
      label: 'Notas',
      value: coveredKeys.length,
      icon: <ClipboardCheck size={18} />,
      variant: 'emerald' as const,
      animationDelay: 0,
    },
    {
      label: 'Cenas Cobertas',
      value: coveredKeys.length,
      icon: <Film size={18} />,
      variant: 'blue' as const,
      animationDelay: 80,
    },
    {
      label: 'Total Cenas',
      value: totalScenes,
      icon: <FileText size={18} />,
      variant: 'purple' as const,
      animationDelay: 160,
    },
    {
      label: 'Cobertura',
      value: `${coverage}%`,
      icon: <BarChart2 size={18} />,
      variant: 'amber' as const,
      animationDelay: 240,
    },
  ];

  const isEmpty = coveredKeys.length === 0;

  return (
    <LiquidPage
      title="Continuidade"
      description="Notas de script, consistência visual e cobertura por cena"
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

      {/* Main content */}
      <AnimatePresence mode="wait">
        {isEmpty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
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
              <div style={{ position: 'relative', zIndex: 2 }}>
                <EmptyState />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
          >
            {/* Left: Cenas com notas */}
            <LiquidSection title="Cenas com notas" accentColor="#10b981">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {coveredKeys.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', padding: '16px 0' }}>
                    Nenhuma cena com notas ainda.
                  </p>
                ) : (
                  coveredKeys.map((sceneKey, i) => (
                    <CoveredSceneCard
                      key={sceneKey}
                      sceneKey={sceneKey}
                      entry={(continuityData || {})[sceneKey]}
                      index={i}
                    />
                  ))
                )}
              </div>
            </LiquidSection>

            {/* Right: Cenas sem cobertura */}
            <LiquidSection title="Cenas sem cobertura" accentColor="#f59e0b">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {uncoveredScenes.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: '24px 0',
                    }}
                  >
                    <ClipboardCheck size={28} style={{ color: '#10b981' }} />
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', textAlign: 'center' }}>
                      Todas as cenas têm cobertura!
                    </p>
                  </div>
                ) : (
                  uncoveredScenes.slice(0, 20).map((scene, i) => (
                    <UncoveredSceneCard
                      key={scene.id || scene.sceneNumber || i}
                      scene={scene}
                      index={i}
                    />
                  ))
                )}
                {uncoveredScenes.length > 20 && (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', paddingTop: 8 }}>
                    +{uncoveredScenes.length - 20} cenas sem cobertura
                  </p>
                )}
              </div>
            </LiquidSection>
          </motion.div>
        )}
      </AnimatePresence>
    </LiquidPage>
  );
}
