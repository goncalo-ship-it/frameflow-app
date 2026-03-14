/**
 * PRODUCTION MODULE
 * Strip board, schedule, análise de cenas e script RT
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film, CheckCircle, Calendar, AlertCircle,
  LayoutList, BarChart2, Activity, Plus, Move,
} from 'lucide-react';
import {
  LiquidPage, LiquidSection, LiquidStatCard, LiquidTabs, LiquidButton,
} from '../components/liquid-system';
import { useStore } from '../../core/store';
import { glassCard, lensingOverlay, nestedCard, glassDivider, springConfigs } from '../utils/liquidGlassStyles';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

interface Scene {
  id: string;
  sceneNumber?: string;
  heading?: string;
  intExt?: string;
  location?: string;
  characters?: string[];
}

interface ShootingDay {
  id: string;
  date: string;
  label?: string;
  callTime?: string;
  status?: string;
}

type TabId = 'stripboard' | 'schedule' | 'analise' | 'script-rt';

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'stripboard', label: 'Strip Board', icon: <LayoutList size={14} /> },
  { id: 'schedule',   label: 'Schedule',    icon: <Calendar   size={14} /> },
  { id: 'analise',    label: 'Análise',     icon: <BarChart2  size={14} /> },
  { id: 'script-rt',  label: 'Script RT',   icon: <Activity   size={14} /> },
];

const TAKE_CHIPS = [
  { id: 'bom',     label: 'BOM',     color: '#10b981' },
  { id: 'parcial', label: 'PARCIAL', color: '#f59e0b' },
  { id: 'repetir', label: 'REPETIR', color: '#ef4444' },
];

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  } catch { return iso; }
}

function getWeekDates(): string[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function hexToRgb(hex: string): string {
  if (!hex || typeof hex !== 'string') return '255, 255, 255';
  const clean = hex.replace('#', '');
  const full  = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '255, 255, 255';
  return `${r}, ${g}, ${b}`;
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

function IntExtBadge({ value }: { value?: string }) {
  const isInt = (value ?? '').toUpperCase().includes('INT');
  const isExt = (value ?? '').toUpperCase().includes('EXT');
  const color = isInt ? '#3b82f6' : isExt ? '#10b981' : '#a855f7';
  const label = isInt ? 'INT' : isExt ? 'EXT' : value ?? '?';
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        background: `rgba(${hexToRgb(color)}, 0.15)`,
        color,
        border: `0.5px solid rgba(${hexToRgb(color)}, 0.3)`,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const cfg = status === 'filming'
    ? { color: '#10b981', label: 'A filmar', pulse: true }
    : status === 'done'
      ? { color: 'rgba(255,255,255,0.35)', label: 'Concluído', pulse: false }
      : { color: 'rgba(255,255,255,0.45)', label: 'Planeado', pulse: false };

  return (
    <span
      style={{
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        background: `rgba(${hexToRgb(cfg.color.startsWith('#') ? cfg.color : '#ffffff')}, 0.12)`,
        color: cfg.color,
        border: `0.5px solid rgba(${hexToRgb(cfg.color.startsWith('#') ? cfg.color : '#ffffff')}, 0.25)`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {cfg.pulse && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: cfg.color,
            display: 'inline-block',
            animation: 'pulse 2s infinite',
          }}
        />
      )}
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB CONTENT: STRIP BOARD
───────────────────────────────────────────────────────────── */

function StripBoardTab({
  shootingDays,
  sceneAssignments,
  parsedScripts,
  unassignedScenes,
  allScenes,
}: {
  shootingDays: ShootingDay[];
  sceneAssignments: Record<string, string>;
  parsedScripts: Record<string, { scenes?: Scene[] }>;
  unassignedScenes: Scene[];
  allScenes: Scene[];
}) {
  const epKeys = Object.keys(parsedScripts || {});
  const firstEp = epKeys[0] ?? '';

  function scenesForDay(dayId: string): Array<{ key: string; scene?: Scene }> {
    return Object.entries(sceneAssignments || {})
      .filter(([, dId]) => dId === dayId)
      .map(([key]) => {
        const sceneId = key.split('-').slice(1).join('-');
        const scene   = allScenes.find(s => s.id === sceneId || s.sceneNumber === sceneId);
        return { key, scene };
      });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* LEFT — Dias de Rodagem */}
      <LiquidSection title="Dias de Rodagem">
        {shootingDays.length === 0 ? (
          <div style={{ ...nestedCard(), padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Sem dias de rodagem configurados
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {shootingDays.map((day, i) => {
              const dayScenes = scenesForDay(day.id);
              return (
                <motion.div
                  key={day.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springConfigs.gentle, delay: i * 0.05 }}
                  style={{ ...nestedCard(), padding: '12px 14px' }}
                >
                  {/* Day header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: dayScenes.length > 0 ? 10 : 0 }}>
                    <span
                      style={{
                        padding: '3px 9px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 800,
                        background: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.8)',
                        border: '0.5px solid rgba(255,255,255,0.18)',
                      }}
                    >
                      {day.label || `D${i + 1}`}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                      {formatDateShort(day.date)}
                    </span>
                    {day.callTime && (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        {day.callTime}
                      </span>
                    )}
                    <div style={{ marginLeft: 'auto' }}>
                      <StatusBadge status={day.status} />
                    </div>
                  </div>

                  {/* Assigned scenes */}
                  {dayScenes.length > 0 && (
                    <>
                      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {dayScenes.map(({ key, scene }) => (
                          <div
                            key={key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 7,
                              padding: '5px 8px',
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.03)',
                            }}
                          >
                            <IntExtBadge value={scene?.intExt || scene?.heading} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {key}
                            </span>
                            {scene?.location && (
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                                {scene.location}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.45)',
                            border: '0.5px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          {dayScenes.length} cena{dayScenes.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </LiquidSection>

      {/* RIGHT — Cenas Não Atribuídas */}
      <LiquidSection title="Cenas Não Atribuídas">
        {unassignedScenes.length === 0 ? (
          <div style={{ ...nestedCard('#10b981'), padding: 20, textAlign: 'center' }}>
            <CheckCircle size={28} style={{ color: '#10b981', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>
              Todas as cenas atribuídas
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unassignedScenes.map((scene, i) => (
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springConfigs.gentle, delay: i * 0.04 }}
                style={{
                  ...nestedCard(),
                  padding: '10px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <IntExtBadge value={scene.intExt || scene.heading} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', flex: 1 }}>
                    {scene.id}
                  </span>
                </div>
                {scene.location && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
                    {scene.location}
                  </p>
                )}
                {scene.characters && scene.characters.length > 0 && (
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                    {scene.characters.slice(0, 3).join(', ')}{scene.characters.length > 3 ? ' +' + (scene.characters.length - 3) : ''}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <Move size={10} style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                    Arrasta para um dia
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </LiquidSection>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB CONTENT: SCHEDULE
───────────────────────────────────────────────────────────── */

function ScheduleTab({ shootingDays }: { shootingDays: ShootingDay[] }) {
  const weekDates = getWeekDates();
  const today     = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ ...glassCard(), padding: 20 }}>
      <div style={lensingOverlay()} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {weekDates.map((date, i) => {
            const isToday      = date === today;
            const dayName      = DAY_NAMES[(i + 1) % 7]; /* Mon=Seg */
            const shootingDay  = shootingDays.find(d => d.date === date);
            const dayNum       = new Date(date).getDate();

            return (
              <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Header */}
                <div
                  style={{
                    textAlign: 'center',
                    padding: '6px 4px',
                    borderRadius: 8,
                    background: isToday ? 'rgba(16,185,129,0.15)' : 'transparent',
                    border: isToday ? '0.5px solid rgba(16,185,129,0.3)' : '0.5px solid transparent',
                  }}
                >
                  <p style={{ fontSize: 10, fontWeight: 700, color: isToday ? '#10b981' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {dayName}
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: isToday ? '#10b981' : 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
                    {dayNum}
                  </p>
                </div>

                {/* Shooting day pill */}
                {shootingDay && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      padding: '6px 4px',
                      borderRadius: 8,
                      background: 'rgba(59,130,246,0.12)',
                      border: '0.5px solid rgba(59,130,246,0.25)',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6' }}>
                      {shootingDay.label || 'Rodagem'}
                    </p>
                    {shootingDay.callTime && (
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        {shootingDay.callTime}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(16,185,129,0.5)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Hoje</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(59,130,246,0.5)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Dia de rodagem</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB CONTENT: ANÁLISE
───────────────────────────────────────────────────────────── */

function AnaliseTab({ allScenes, parsedScripts }: {
  allScenes: Scene[];
  parsedScripts: Record<string, { scenes?: Scene[] }>;
}) {
  const intScenes = allScenes.filter(s => (s.intExt ?? s.heading ?? '').toUpperCase().includes('INT'));
  const extScenes = allScenes.filter(s => (s.intExt ?? s.heading ?? '').toUpperCase().includes('EXT'));

  /* Location frequency */
  const locationFreq: Record<string, number> = {};
  allScenes.forEach(s => {
    if (s.location) {
      locationFreq[s.location] = (locationFreq[s.location] ?? 0) + 1;
    }
  });
  const locationsSorted = Object.entries(locationFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxCount = locationsSorted[0]?.[1] ?? 1;

  /* Characters per episode */
  const epChars = Object.entries(parsedScripts || {}).map(([epId, ep]) => {
    const chars = new Set<string>();
    (ep.scenes || []).forEach(s => (s.characters || []).forEach(c => chars.add(c)));
    return { epId, count: chars.size };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* INT vs EXT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ ...glassCard({ intensity: 'subtle' }), padding: 20, textAlign: 'center' }}>
          <div style={lensingOverlay()} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Interiores
            </p>
            <p style={{ fontSize: 40, fontWeight: 900, color: '#3b82f6' }}>
              {intScenes.length}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              {allScenes.length > 0 ? Math.round((intScenes.length / allScenes.length) * 100) : 0}% do total
            </p>
          </div>
        </div>
        <div style={{ ...glassCard({ intensity: 'subtle' }), padding: 20, textAlign: 'center' }}>
          <div style={lensingOverlay()} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Exteriores
            </p>
            <p style={{ fontSize: 40, fontWeight: 900, color: '#10b981' }}>
              {extScenes.length}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              {allScenes.length > 0 ? Math.round((extScenes.length / allScenes.length) * 100) : 0}% do total
            </p>
          </div>
        </div>
      </div>

      {/* Cenas por localização */}
      <LiquidSection title="Cenas por Localização">
        {locationsSorted.length === 0 ? (
          <div style={{ ...nestedCard(), padding: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Sem dados de localização</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {locationsSorted.map(([loc, count], i) => (
              <motion.div
                key={loc}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springConfigs.gentle, delay: i * 0.04 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', width: 140, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {loc}
                </span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCount) * 100}%` }}
                    transition={{ ...springConfigs.gentle, delay: i * 0.06 + 0.2 }}
                    style={{
                      height: '100%',
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', width: 24, textAlign: 'right', flexShrink: 0 }}>
                  {count}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </LiquidSection>

      {/* Personagens por episódio */}
      {epChars.length > 0 && (
        <LiquidSection title="Personagens por Episódio">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {epChars.map((ep, i) => (
              <motion.div
                key={ep.epId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfigs.gentle, delay: i * 0.05 }}
                style={{
                  ...nestedCard(),
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                  {ep.epId}
                </span>
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(168,85,247,0.15)',
                    color: '#a855f7',
                    border: '0.5px solid rgba(168,85,247,0.3)',
                  }}
                >
                  {ep.count} personagem{ep.count !== 1 ? 's' : ''}
                </span>
              </motion.div>
            ))}
          </div>
        </LiquidSection>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB CONTENT: SCRIPT RT
───────────────────────────────────────────────────────────── */

function ScriptRTTab({
  shootingDays,
  sceneAssignments,
  sceneTakes,
  allScenes,
}: {
  shootingDays: ShootingDay[];
  sceneAssignments: Record<string, string>;
  sceneTakes: Record<string, Array<{ id: string; status: string; notes?: string }>>;
  allScenes: Scene[];
}) {
  const today    = new Date().toISOString().slice(0, 10);
  const todayDay = shootingDays.find(d => d.date === today)
    ?? shootingDays[0]; /* fallback to first day if no today */

  const todaySceneKeys = todayDay
    ? Object.entries(sceneAssignments || {})
        .filter(([, dId]) => dId === todayDay.id)
        .map(([k]) => k)
    : [];

  const [localTakes, setLocalTakes] = useState<Record<string, Array<{ id: string; status: string }>>>({});

  function addTake(sceneKey: string, status: string) {
    setLocalTakes(prev => ({
      ...prev,
      [sceneKey]: [
        ...(prev[sceneKey] ?? []),
        { id: `T${Date.now()}`, status },
      ],
    }));
  }

  if (todaySceneKeys.length === 0) {
    return (
      <div style={{ ...glassCard(), padding: 40, textAlign: 'center' }}>
        <div style={lensingOverlay()} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Activity size={40} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
            Sem cenas atribuídas para hoje
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
            {todayDay
              ? `Dia: ${todayDay.label || formatDateShort(todayDay.date)}`
              : 'Nenhum dia de rodagem configurado'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {todayDay && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
            {todayDay.label || formatDateShort(todayDay.date)}
          </span>
          {todayDay.callTime && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              Call {todayDay.callTime}
            </span>
          )}
        </div>
      )}

      {todaySceneKeys.map((sceneKey, i) => {
        const sceneId    = sceneKey.split('-').slice(1).join('-');
        const scene      = allScenes.find(s => s.id === sceneId || s.sceneNumber === sceneId);
        const storeTakes = sceneTakes?.[sceneKey] ?? [];
        const localT     = localTakes[sceneKey] ?? [];
        const allT       = [...storeTakes, ...localT];

        return (
          <motion.div
            key={sceneKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfigs.gentle, delay: i * 0.06 }}
            style={{ ...glassCard({ intensity: 'subtle', radius: 'lg' }), padding: '16px 18px' }}
          >
            <div style={lensingOverlay()} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Scene header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <IntExtBadge value={scene?.intExt || scene?.heading} />
                <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>
                  {sceneKey}
                </span>
                {scene?.location && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginLeft: 2 }}>
                    {scene.location}
                  </span>
                )}
              </div>

              {/* Characters */}
              {scene?.characters && scene.characters.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {scene.characters.map(c => (
                    <span
                      key={c}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 600,
                        background: 'rgba(168,85,247,0.12)',
                        color: '#a855f7',
                        border: '0.5px solid rgba(168,85,247,0.25)',
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.07)', marginBottom: 10 }} />

              {/* Takes log */}
              {allT.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {allT.map((t, ti) => {
                    const chip = TAKE_CHIPS.find(c => c.id === t.status) ?? TAKE_CHIPS[0];
                    return (
                      <span
                        key={t.id}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: `rgba(${hexToRgb(chip.color)}, 0.15)`,
                          color: chip.color,
                          border: `0.5px solid rgba(${hexToRgb(chip.color)}, 0.3)`,
                        }}
                      >
                        T{ti + 1} {chip.label}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Add take chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                  Adicionar Take:
                </span>
                {TAKE_CHIPS.map(chip => (
                  <motion.button
                    key={chip.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addTake(sceneKey, chip.id)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      background: `rgba(${hexToRgb(chip.color)}, 0.12)`,
                      color: chip.color,
                      border: `0.5px solid rgba(${hexToRgb(chip.color)}, 0.3)`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Plus size={10} />
                    {chip.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */

export function ProductionModule() {
  const { shootingDays, sceneAssignments, parsedScripts, sceneTakes, sceneOrder } = useStore() as {
    shootingDays?: ShootingDay[];
    sceneAssignments?: Record<string, string>;
    parsedScripts?: Record<string, { scenes?: Scene[] }>;
    sceneTakes?: Record<string, Array<{ id: string; status: string; notes?: string }>>;
    sceneOrder?: Record<string, string[]>;
  };

  const [activeTab, setActiveTab] = useState<TabId>('stripboard');

  const allScenes    = Object.values(parsedScripts || {}).flatMap(ep => ep.scenes || []) as Scene[];
  const assignedCount = Object.keys(sceneAssignments || {}).length;

  const epKeys = Object.keys(parsedScripts || {});

  const unassignedScenes = allScenes.filter(s => {
    /* Try matching against every episode key */
    return !epKeys.some(epId => {
      const key = `${epId}-${s.id}`;
      return Boolean((sceneAssignments || {})[key]);
    });
  });

  /* ── RENDER ─────────────────────────────────────────────── */
  return (
    <LiquidPage
      title="Produção"
      subtitle="Strip board, schedule, análise de cenas e script RT"
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
          label="Total Cenas"
          value={allScenes.length}
          icon={<Film size={16} />}
          variant="blue"
          animationDelay={0}
        />
        <LiquidStatCard
          label="Atribuídas"
          value={assignedCount}
          icon={<CheckCircle size={16} />}
          variant="emerald"
          animationDelay={80}
        />
        <LiquidStatCard
          label="Dias de Rodagem"
          value={shootingDays?.length ?? 0}
          icon={<Calendar size={16} />}
          variant="amber"
          animationDelay={160}
        />
        <LiquidStatCard
          label="Não Atribuídas"
          value={Math.max(0, allScenes.length - assignedCount)}
          icon={<AlertCircle size={16} />}
          variant="error"
          animationDelay={240}
        />
      </div>

      {/* ── TABS ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <LiquidTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={id => setActiveTab(id as TabId)}
        />
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={springConfigs.gentle}
        >
          {activeTab === 'stripboard' && (
            <StripBoardTab
              shootingDays={shootingDays ?? []}
              sceneAssignments={sceneAssignments ?? {}}
              parsedScripts={parsedScripts ?? {}}
              unassignedScenes={unassignedScenes}
              allScenes={allScenes}
            />
          )}
          {activeTab === 'schedule' && (
            <ScheduleTab shootingDays={shootingDays ?? []} />
          )}
          {activeTab === 'analise' && (
            <AnaliseTab allScenes={allScenes} parsedScripts={parsedScripts ?? {}} />
          )}
          {activeTab === 'script-rt' && (
            <ScriptRTTab
              shootingDays={shootingDays ?? []}
              sceneAssignments={sceneAssignments ?? {}}
              sceneTakes={sceneTakes ?? {}}
              allScenes={allScenes}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </LiquidPage>
  );
}
