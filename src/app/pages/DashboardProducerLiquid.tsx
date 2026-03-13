/**
 * DASHBOARD PRODUCER LIQUID — Golden Standard
 *
 * Este ficheiro É a referência visual para toda a app.
 * CADA padrão aqui existe por uma razão. COPIA, não "inspiras".
 *
 * Padrões demonstrados:
 *  1. Widget container (glassCard + lensing)
 *  2. Nested colored cards (INT azul / EXT verde / misto roxo)
 *  3. Nested list items (elenco, locais)
 *  4. Status badges com dot pulsante
 *  5. Micro-badges inline
 *  6. Department pills com count badge
 *  7. Icon containers (w-10 h-10 radius-[12px])
 *  8. Progress bars (emerald glow)
 *  9. Gradient text (hero clock)
 * 10. Glow action button (Section 12)
 * 11. Stagger animations (+0.1s)
 * 12. Toolbar bar (pills bar, radius 24px)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film, Users, MapPin, DollarSign, Calendar, Clock,
  TrendingUp, CheckCircle2, AlertTriangle, Clapperboard,
  CloudRain, Sun, Wind, Thermometer, ArrowRight, Plus,
  Radio, FileText, Zap,
} from 'lucide-react';
import {
  LiquidCard, LiquidBadge, LiquidButton, LiquidStatCard,
  LiquidSection, LiquidPage,
} from '../components/liquid-system';
import {
  glassCard, lensingOverlay, nestedCard, springConfigs,
  DEPARTMENT_COLORS_MAP,
} from '../utils/liquidGlassStyles';

/* ─────────────────────────────────────────────────────────────
   MOCK DATA (substituir por store real)
───────────────────────────────────────────────────────────── */

const MOCK_TODAY = {
  day:       3,
  total:     12,
  date:      '2026-03-13',
  location:  'Armazém dos Ossos, Alfama',
  scenes:    ['42', '43', '44', '47'],
  call:      '06:30',
  wrap:      '19:00',
};

const MOCK_SCENES_TODAY = [
  { id: '42', type: 'EXT', time: 'DIA',   heading: 'EXT PRAIA — DIA',      pages: 2.5, cast: ['João', 'Sofia'], status: 'done'     },
  { id: '43', type: 'INT', time: 'NOITE', heading: 'INT ARMAZÉM — NOITE',   pages: 3.0, cast: ['João', 'Miguel'], status: 'rolling'  },
  { id: '44', type: 'INT', time: 'DIA',   heading: 'INT ESCRITÓRIO — DIA',  pages: 1.5, cast: ['Sofia'],          status: 'waiting'  },
  { id: '47', type: 'EXT', time: 'DIA',   heading: 'EXT RUA — DIA',        pages: 2.0, cast: ['João'],           status: 'waiting'  },
];

const MOCK_WEATHER = {
  temp: 16, feels: 13, condition: 'Parcialmente nublado',
  wind: 18, rain: 20, uv: 3,
  sunrise: '07:12', sunset: '19:38',
  alert: null as string | null,
};

const MOCK_TEAM = [
  { group: 'Realização',  count: 4,  color: '#3b82f6' },
  { group: 'Câmara',      count: 6,  color: '#10b981' },
  { group: 'Som',         count: 3,  color: '#f59e0b' },
  { group: 'Arte',        count: 5,  color: '#a855f7' },
  { group: 'Produção',    count: 8,  color: '#ec4899' },
];

const MOCK_WARNINGS = [
  { id: 'w1', severity: 'critical', text: 'Chuva forte prevista às 15h — Cena 47 (EXT) em risco',     time: '08:42' },
  { id: 'w2', severity: 'warning',  text: 'Adereço #A-042 \'Mala vintage\' não confirmado — Arte',     time: '07:15' },
  { id: 'w3', severity: 'warning',  text: 'Actor João Silva indisponível 14h–15h30 — Cena 43',         time: '06:58' },
];

/* ─────────────────────────────────────────────────────────────
   SCENE STATUS COLORS
───────────────────────────────────────────────────────────── */

const SCENE_STATUS: Record<string, { color: string; label: string; variant: 'emerald' | 'blue' | 'amber' | 'default' }> = {
  done:    { color: '#10b981', label: 'Filmado',  variant: 'emerald' },
  rolling: { color: '#3b82f6', label: 'A Filmar', variant: 'blue'    },
  setup:   { color: '#f59e0b', label: 'Setup',    variant: 'amber'   },
  waiting: { color: 'rgba(255,255,255,0.4)', label: 'Aguarda', variant: 'default' },
};

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */

export function DashboardProducerLiquid() {
  const [clock, setClock] = useState('');
  const [activeView, setActiveView] = useState<'producao' | 'myday'>('producao');

  /* Live clock */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const donePct = Math.round(
    (MOCK_SCENES_TODAY.filter(s => s.status === 'done').length / MOCK_SCENES_TODAY.length) * 100
  );

  return (
    <div
      className="min-h-screen p-6"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-start justify-between gap-4 mb-8"
      >
        <div>
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
          >
            DESDOBRADO
          </h1>
          <p className="text-xs font-bold mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            DIA {MOCK_TODAY.day} / {MOCK_TODAY.total} · {MOCK_TODAY.date} · {MOCK_TODAY.location}
          </p>
        </div>

        {/* Hero clock (Section 15 — gradient text) */}
        <div className="text-right">
          <div
            className="text-5xl font-black tabular-nums"
            style={{
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.3))',
            }}
          >
            {clock}
          </div>
          <p className="text-xs font-bold mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            CALL {MOCK_TODAY.call} · WRAP EST. {MOCK_TODAY.wrap}
          </p>
        </div>
      </motion.div>

      {/* ── VIEW TOGGLE (toolbar pills, Section 2) ──────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.05 }}
        className="flex gap-2 mb-6"
        style={{
          background:    'rgba(255, 255, 255, 0.04)',
          backdropFilter:'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          border:        '0.5px solid rgba(255, 255, 255, 0.15)',
          boxShadow:     '0 4px 24px rgba(0,0,0,0.1), inset 0 0.5px 0.5px rgba(255,255,255,0.2)',
          borderRadius:  24,
          padding:       '6px 8px',
          alignSelf:     'flex-start',
        }}
      >
        {[
          { id: 'producao', label: 'Produção' },
          { id: 'myday',    label: 'O Meu Dia' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as typeof activeView)}
            style={{
              padding:    '8px 20px',
              borderRadius: 9999,
              fontSize:   13,
              fontWeight: activeView === tab.id ? 700 : 500,
              color:      activeView === tab.id ? '#10b981' : 'rgba(255,255,255,0.5)',
              background: activeView === tab.id ? 'rgba(16,185,129,0.15)' : 'transparent',
              backdropFilter: activeView === tab.id ? 'blur(16px) saturate(120%)' : 'none',
              border:     activeView === tab.id
                ? '0.5px solid rgba(16,185,129,0.4)'
                : '0.5px solid transparent',
              boxShadow:  activeView === tab.id
                ? '0 4px 12px rgba(16,185,129,0.3), inset 0 0.5px 0.5px rgba(255,255,255,0.15)'
                : undefined,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ── STAT CARDS ROW ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Cenas Hoje',  value: MOCK_SCENES_TODAY.length, variant: 'emerald' as const, pulse: true  },
          { label: 'Filmadas',    value: MOCK_SCENES_TODAY.filter(s => s.status === 'done').length, variant: 'blue'    as const },
          { label: 'Em Setup',    value: MOCK_SCENES_TODAY.filter(s => s.status === 'setup').length, variant: 'amber'   as const },
          { label: 'Equipa',      value: MOCK_TEAM.reduce((s, t) => s + t.count, 0), variant: 'default' as const },
        ].map((stat, i) => (
          <LiquidStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            variant={stat.variant}
            pulse={stat.pulse}
            animationDelay={i * 100}
          />
        ))}
      </div>

      {/* ── MAIN GRID ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Col 1+2: Cenas do dia ────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* WIDGET: Cenas hoje */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
            className="relative overflow-hidden"
            style={glassCard()}
          >
            <div className="absolute inset-0 pointer-events-none" style={lensingOverlay()} />
            <div className="relative z-10 p-6">

              {/* Section header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }}
                  />
                  <span className="text-sm font-black" style={{ color: '#ffffff' }}>
                    CENAS DO DIA
                  </span>
                </div>
                <LiquidBadge variant="emerald" size="md" pulse>
                  {donePct}% completo
                </LiquidBadge>
              </div>

              {/* Progress bar (Section 13) */}
              <div
                className="h-1.5 rounded-full mb-5"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${donePct}%` }}
                  transition={{ delay: 0.5, duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{
                    background: 'linear-gradient(90deg, #10b981, #34d399)',
                    boxShadow:  '0 0 12px rgba(16,185,129,0.6)',
                  }}
                />
              </div>

              {/* Scene list — nested list items (Section 4) */}
              <div className="flex flex-col gap-2">
                {MOCK_SCENES_TODAY.map((scene, i) => {
                  const st     = SCENE_STATUS[scene.status];
                  const isInt  = scene.type === 'INT';
                  const nested = nestedCard(isInt ? '#3b82f6' : '#10b981', 'subtle');

                  return (
                    <motion.div
                      key={scene.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }}
                      className="flex items-center gap-3 p-3 hover:scale-[1.008] transition-transform cursor-pointer"
                      style={{
                        ...nested,
                        borderRadius: 16,
                      }}
                    >
                      {/* INT/EXT icon container (Section 7) */}
                      <div
                        className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                        style={{
                          borderRadius: 12,
                          background:   isInt ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
                          border:       `0.5px solid ${isInt ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}`,
                          backdropFilter: 'blur(12px)',
                          boxShadow:    'inset 0 0.5px 0 rgba(255,255,255,0.2)',
                        }}
                      >
                        <Clapperboard
                          size={16}
                          color={isInt ? '#3b82f6' : '#10b981'}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-black" style={{ color: '#ffffff' }}>
                            Cena {scene.id}
                          </span>
                          <LiquidBadge variant={isInt ? 'blue' : 'emerald'} size="sm">
                            {scene.type}
                          </LiquidBadge>
                          <LiquidBadge variant="default" size="sm">
                            {scene.time}
                          </LiquidBadge>
                        </div>
                        <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          {scene.heading}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {scene.pages}p
                        </span>
                        <LiquidBadge variant={st.variant} size="md" pulse={scene.status === 'rolling'}>
                          {st.label}
                        </LiquidBadge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

            </div>
          </motion.div>

          {/* WIDGET: Meteorologia */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
            className="relative overflow-hidden"
            style={glassCard()}
          >
            <div className="absolute inset-0 pointer-events-none" style={lensingOverlay()} />
            <div className="relative z-10 p-6">

              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
                <span className="text-sm font-black" style={{ color: '#ffffff' }}>METEOROLOGIA</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Main weather card (Section 3 — AZUL) */}
                <div
                  className="p-4 col-span-2 md:col-span-1"
                  style={nestedCard('#3b82f6')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-2xl font-black" style={{ color: '#ffffff' }}>
                        {MOCK_WEATHER.temp}°C
                      </div>
                      <div className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Sensação {MOCK_WEATHER.feels}°C
                      </div>
                    </div>
                    <div
                      className="w-10 h-10 flex items-center justify-center"
                      style={{
                        borderRadius: 12,
                        background: 'rgba(59,130,246,0.15)',
                        border: '0.5px solid rgba(59,130,246,0.3)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.2)',
                      }}
                    >
                      <CloudRain size={18} color="#3b82f6" />
                    </div>
                  </div>
                  <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {MOCK_WEATHER.condition}
                  </p>
                  <div className="flex gap-3 mt-3">
                    <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      VENTO {MOCK_WEATHER.wind}km/h
                    </span>
                    <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      CHUVA {MOCK_WEATHER.rain}%
                    </span>
                    <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      UV {MOCK_WEATHER.uv}
                    </span>
                  </div>
                </div>

                {/* Sunrise/sunset (Section 3 — VERDE) */}
                <div className="p-4" style={nestedCard('#10b981', 'subtle')}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sun size={14} color="#fbbf24" />
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      LUZ NATURAL
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Nascer</span>
                      <span className="text-xs font-black" style={{ color: 'rgba(255,255,255,0.8)' }}>{MOCK_WEATHER.sunrise}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Pôr</span>
                      <span className="text-xs font-black" style={{ color: 'rgba(255,255,255,0.8)' }}>{MOCK_WEATHER.sunset}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

        </div>

        {/* ── Col 3: Sidebar widgets ───────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* WIDGET: Avisos */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.25 }}
            className="relative overflow-hidden"
            style={glassCard()}
          >
            <div className="absolute inset-0 pointer-events-none" style={lensingOverlay()} />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: '#ef4444', boxShadow: '0 0 8px #ef4444' }}
                  />
                  <span className="text-sm font-black" style={{ color: '#ffffff' }}>AVISOS</span>
                </div>
                <LiquidBadge variant="error" size="sm">{MOCK_WARNINGS.length}</LiquidBadge>
              </div>

              <div className="flex flex-col gap-2">
                {MOCK_WARNINGS.map((w, i) => {
                  const isCrit = w.severity === 'critical';
                  return (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.07 }}
                      className="p-3 cursor-pointer hover:scale-[1.02] transition-transform"
                      style={{
                        background: isCrit ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        borderRadius: 14,
                        border: `1px solid ${isCrit ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          size={13}
                          className="flex-shrink-0 mt-0.5"
                          color={isCrit ? '#ef4444' : '#f59e0b'}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            {w.text}
                          </p>
                          <span className="text-[10px] font-bold mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {w.time}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* WIDGET: Departamentos (department pills, Section 10) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.35 }}
            className="relative overflow-hidden"
            style={glassCard()}
          >
            <div className="absolute inset-0 pointer-events-none" style={lensingOverlay()} />
            <div className="relative z-10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#a855f7', boxShadow: '0 0 8px #a855f7' }} />
                <span className="text-sm font-black" style={{ color: '#ffffff' }}>EQUIPA DE HOJE</span>
              </div>

              <div className="flex flex-col gap-2">
                {MOCK_TEAM.map((dept, i) => (
                  <motion.div
                    key={dept.group}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    className="flex items-center justify-between p-2.5 cursor-pointer hover:scale-[1.02] transition-transform"
                    style={{
                      background:    `${dept.color}15`,
                      backdropFilter:'blur(16px) saturate(120%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(120%)',
                      border:        `0.5px solid ${dept.color}40`,
                      borderRadius:  9999,
                      boxShadow:     `0 4px 12px ${dept.color}30, inset 0 0.5px 0.5px rgba(255,255,255,0.15)`,
                    }}
                  >
                    <span className="text-xs font-bold px-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {dept.group}
                    </span>
                    <span
                      style={{
                        background: dept.color,
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        minWidth: 24,
                        textAlign: 'center',
                        boxShadow: `0 0 8px ${dept.color}60`,
                      }}
                    >
                      {dept.count}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* WIDGET: Acção Rápida — Folha de Serviço (Section 6) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.45 }}
            className="relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
            style={{
              ...glassCard({ intensity: 'medium', radius: 'md' }),
              background: 'rgba(59,130,246,0.13)',
              border:     '0.5px solid rgba(59,130,246,0.40)',
              boxShadow:  '0 0 24px rgba(59,130,246,0.2), inset 0 0.5px 0.5px rgba(255,255,255,0.2)',
              borderRadius: 16,
              padding: 0,
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={lensingOverlay()} />
            <div className="relative z-10 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderRadius: 12,
                    background: 'rgba(59,130,246,0.15)',
                    border: '0.5px solid rgba(59,130,246,0.3)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  <FileText size={18} color="#3b82f6" />
                </div>
                <div>
                  <div className="text-sm font-black" style={{ color: '#ffffff' }}>Folha de Serviço</div>
                  <div className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Dia 3 · {MOCK_TODAY.date}</div>
                </div>
              </div>
              <ArrowRight size={16} color="rgba(255,255,255,0.5)" />
            </div>
          </motion.div>

          {/* WIDGET: Live Board CTA (Section 12 — glow button) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
            style={{ position: 'relative' }}
          >
            {/* Outer glow */}
            <div
              style={{
                position: 'absolute', inset: -4,
                borderRadius: 22,
                background: '#10b981',
                filter: 'blur(16px)',
                opacity: 0.4,
                pointerEvents: 'none',
              }}
            />
            <button
              className="w-full active:scale-95 transition-transform"
              style={{
                position: 'relative',
                borderRadius: 18,
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #10b981, #10b981dd)',
                boxShadow: '0 8px 24px rgba(16,185,129,0.7), 0 2px 8px rgba(16,185,129,0.4), inset 0 -3px 12px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.5)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {/* Inner glow overlay */}
              <span
                style={{
                  position: 'absolute', inset: 0,
                  borderRadius: 'inherit',
                  background: 'radial-gradient(ellipse 100% 80% at 50% 20%, rgba(255,255,255,0.5) 0%, transparent 60%)',
                  mixBlendMode: 'overlay',
                  pointerEvents: 'none',
                }}
              />
              <Radio size={18} />
              <span style={{ position: 'relative' }}>Abrir Live Board</span>
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
