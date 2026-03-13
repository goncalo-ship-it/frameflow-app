/**
 * DAILIES MODULE
 * Revisão de footage, selects e relatórios de câmara
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film, Star, X, Calendar, CheckCircle, AlertCircle,
  Clock, ChevronRight,
} from 'lucide-react';
import {
  LiquidPage, LiquidCard, LiquidButton, LiquidSection,
  LiquidStatCard, LiquidBadge,
} from '../components/liquid-system';
import { useStore } from '../../core/store';
import { glassCard, lensingOverlay, nestedCard, glassDivider, springConfigs } from '../utils/liquidGlassStyles';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type TakeStatus = 'ok' | 'nok' | 'maybe' | 'false_start';

interface Take {
  id: string;
  status: TakeStatus;
  notes?: string;
  timestamp?: string;
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

const TAKE_COLOR: Record<TakeStatus, string> = {
  ok:          '#10b981',
  nok:         '#ef4444',
  maybe:       '#f59e0b',
  false_start: 'rgba(255,255,255,0.25)',
};

const TAKE_LABEL: Record<TakeStatus, string> = {
  ok:          'OK',
  nok:         'NOK',
  maybe:       '?',
  false_start: 'FS',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

function TakeCircle({ take }: { take: Take }) {
  const color = TAKE_COLOR[take.status as TakeStatus] ?? 'rgba(255,255,255,0.25)';
  const label = TAKE_LABEL[take.status as TakeStatus] ?? take.status;
  return (
    <div
      title={take.notes || label}
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: `rgba(${colorToRgb(color)}, 0.18)`,
        border: `1.5px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9,
        fontWeight: 800,
        color,
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

function colorToRgb(color: string): string {
  if (color.startsWith('#')) {
    const c = color.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '255, 255, 255';
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */

export function DailiesModule() {
  const { shootingDays, sceneTakes, parsedScripts, sceneAssignments } = useStore() as {
    shootingDays: Array<{ id: string; date: string; label: string; status?: string }>;
    sceneTakes: Record<string, Take[]>;
    parsedScripts: Record<string, { scenes?: Array<{ id: string; heading?: string }> }>;
    sceneAssignments: Record<string, string>;
  };

  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const allTakes = Object.values(sceneTakes || {}).flat() as Take[];
  const okTakes  = allTakes.filter(t => t.status === 'ok');
  const nokTakes = allTakes.filter(t => t.status === 'nok');

  const today = new Date().toISOString().slice(0, 10);
  const filmedDays = (shootingDays || []).filter(
    d => d.status === 'done' || d.status === 'filming'
  ).length;

  const sceneKeys = Object.keys(sceneTakes || {});
  const hasTakes  = allTakes.length > 0;

  /* scenes with their takes, sorted by scene key */
  const scenesWithTakes = sceneKeys
    .filter(k => (sceneTakes[k]?.length ?? 0) > 0)
    .sort();

  return (
    <LiquidPage
      title="Dailies"
      subtitle="Revisão de footage, selects e relatórios de câmara"
    >
      {/* ── STAT CARDS ───────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <LiquidStatCard
          label="Takes Total"
          value={allTakes.length}
          icon={<Film size={16} />}
          variant="blue"
          animationDelay={0}
        />
        <LiquidStatCard
          label="Selects"
          value={okTakes.length}
          icon={<Star size={16} />}
          variant="emerald"
          animationDelay={80}
        />
        <LiquidStatCard
          label="Rejeitados"
          value={nokTakes.length}
          icon={<X size={16} />}
          variant="error"
          animationDelay={160}
        />
        <LiquidStatCard
          label="Dias Filmados"
          value={filmedDays}
          icon={<Calendar size={16} />}
          variant="amber"
          animationDelay={240}
        />
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {hasTakes ? (
          <motion.div
            key="has-takes"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springConfigs.gentle}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}
          >
            {/* LEFT — Takes por Cena */}
            <LiquidSection title="Takes por Cena">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scenesWithTakes.map((sceneKey, i) => {
                  const takes = sceneTakes[sceneKey] as Take[];
                  return (
                    <motion.div
                      key={sceneKey}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springConfigs.gentle, delay: i * 0.04 }}
                      style={{
                        ...nestedCard(),
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>
                          {sceneKey}
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                          {takes.length} take{takes.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {takes.map(t => (
                          <TakeCircle key={t.id} take={t} />
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </LiquidSection>

            {/* RIGHT — Selects */}
            <LiquidSection title="Selects">
              {okTakes.length === 0 ? (
                <div
                  style={{
                    ...nestedCard(),
                    padding: 24,
                    textAlign: 'center',
                  }}
                >
                  <Star size={32} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    Sem selects ainda
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {okTakes.map((take, i) => {
                    /* find the scene key for this take */
                    const sceneKey = Object.entries(sceneTakes || {}).find(
                      ([, takes]) => (takes as Take[]).some(t => t.id === take.id)
                    )?.[0] ?? '—';

                    return (
                      <motion.div
                        key={take.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...springConfigs.gentle, delay: i * 0.04 }}
                        style={{
                          ...nestedCard('#10b981'),
                          padding: '12px 14px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>
                              {take.id}
                            </span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                              {sceneKey}
                            </span>
                          </div>
                          {/* Status badge */}
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              background: 'rgba(16,185,129,0.15)',
                              color: '#10b981',
                              border: '0.5px solid rgba(16,185,129,0.3)',
                            }}
                          >
                            OK
                          </span>
                        </div>
                        {take.notes && (
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                            {take.notes}
                          </p>
                        )}
                        {take.timestamp && (
                          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                            {formatTime(take.timestamp)}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </LiquidSection>
          </motion.div>
        ) : (
          /* EMPTY STATE */
          <motion.div
            key="no-takes"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springConfigs.gentle}
            style={{
              ...glassCard(),
              padding: 48,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            <div style={lensingOverlay()} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: 'rgba(59,130,246,0.1)',
                  border: '2px solid rgba(59,130,246,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 0 32px rgba(59,130,246,0.15)',
                }}
              >
                <Film size={44} style={{ color: '#3b82f6' }} />
              </div>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.95)',
                  marginBottom: 8,
                }}
              >
                Sem footage ainda
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.55)',
                  maxWidth: 380,
                  margin: '0 auto 24px',
                  lineHeight: 1.6,
                }}
              >
                O footage aparece aqui assim que começares a registar takes no Live Board
              </p>
              <LiquidButton variant="blue">
                Ir para Live Board
              </LiquidButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CAMERA REPORTS ───────────────────────────────────── */}
      <LiquidSection title="Camera Reports">
        {(!shootingDays || shootingDays.length === 0) ? (
          <div
            style={{
              ...nestedCard(),
              padding: 20,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              Sem dias de rodagem configurados
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {shootingDays
              .filter(d => d.date <= today)
              .map((day, i) => {
                /* Count scenes assigned to this day */
                const assignedScenes = Object.entries(sceneAssignments || {}).filter(
                  ([, dayId]) => dayId === day.id
                ).length;

                /* Check if this day has takes */
                const daySceneKeys = Object.entries(sceneAssignments || {})
                  .filter(([, dayId]) => dayId === day.id)
                  .map(([k]) => k);
                const dayHasTakes = daySceneKeys.some(k => (sceneTakes?.[k]?.length ?? 0) > 0);

                const statusColor = day.status === 'done'
                  ? '#10b981'
                  : day.status === 'filming'
                    ? '#3b82f6'
                    : 'rgba(255,255,255,0.4)';

                return (
                  <motion.div
                    key={day.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springConfigs.gentle, delay: i * 0.05 }}
                    style={{
                      ...nestedCard(),
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.06)',
                          border: '0.5px solid rgba(255,255,255,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Calendar size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                            {day.label || `Dia ${i + 1}`}
                          </span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 700,
                              background: `rgba(${colorToRgb(statusColor)}, 0.15)`,
                              color: statusColor,
                              border: `0.5px solid rgba(${colorToRgb(statusColor)}, 0.3)`,
                            }}
                          >
                            {day.status === 'done' ? 'Concluído' : day.status === 'filming' ? 'A filmar' : 'Planeado'}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                          {formatDate(day.date)} · {assignedScenes} cena{assignedScenes !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={!dayHasTakes}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 12,
                        background: dayHasTakes ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                        border: dayHasTakes ? '0.5px solid rgba(59,130,246,0.3)' : '0.5px solid rgba(255,255,255,0.08)',
                        color: dayHasTakes ? '#3b82f6' : 'rgba(255,255,255,0.25)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: dayHasTakes ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      Ver relatório
                      <ChevronRight size={12} />
                    </motion.button>
                  </motion.div>
                );
              })}
          </div>
        )}
      </LiquidSection>
    </LiquidPage>
  );
}
