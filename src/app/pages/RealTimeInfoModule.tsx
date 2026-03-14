/**
 * INFO EM TEMPO REAL MODULE
 * Call times, alertas, clima e informação do dia de rodagem
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock, MapPin, Users, Sun, Cloud, AlertTriangle, Radio,
} from 'lucide-react';
import {
  LiquidPage, LiquidSection, LiquidStatCard,
} from '../components/liquid-system';
import { useStore } from '../../core/store';
import { glassCard, lensingOverlay, nestedCard, glassDivider, springConfigs } from '../utils/liquidGlassStyles';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */

const WALKIE_CHANNELS = [
  { ch: '1', label: 'Produção',   color: '#ec4899' },
  { ch: '2', label: 'Câmara',     color: '#3b82f6' },
  { ch: '3', label: 'Arte',       color: '#f59e0b' },
  { ch: '4', label: 'Som',        color: '#22c55e' },
  { ch: '5', label: 'Realização', color: '#a855f7' },
];

/* Group color map (mirrors team/index.jsx) */
const GROUP_COLOR: Record<string, string> = {
  Produção:   '#8B6FBF',
  Realização: '#5B8DEF',
  Câmara:     '#3b82f6',
  Som:        '#22c55e',
  Arte:       '#f59e0b',
  Elenco:     '#ec4899',
};

function groupColor(group?: string): string {
  return group ? (GROUP_COLOR[group] ?? 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.4)';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  } catch {
    return iso;
  }
}

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

interface ShootingDay {
  id: string;
  date: string;
  label?: string;
  notes?: string;
  callTime?: string;
  status?: string;
  catering?: {
    time?: string;
    location?: string;
    menu?: string[];
    provider?: string;
  };
}

interface TeamMember {
  id: string;
  name: string;
  role?: string;
  group?: string;
  photo?: string;
  confirmedDays?: string[];
}

interface Location {
  id: string;
  name: string;
  displayName?: string;
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */

export function RealTimeInfoModule() {
  const { shootingDays, team, locations, sceneAssignments } = useStore() as {
    shootingDays?: ShootingDay[];
    team?: TeamMember[];
    locations?: Location[];
    sceneAssignments?: Record<string, string>;
  };

  const today   = new Date().toISOString().slice(0, 10);
  const todayDay = (shootingDays || []).find(d => d.date === today);
  const nextDay  = (shootingDays || []).find(d => d.date > today);

  /* Today's crew: members with today's day confirmed, or all if no filter */
  const todaysCrew = (team || [])
    .filter(m => {
      if (!m.confirmedDays?.length) return true;
      return todayDay ? m.confirmedDays.includes(todayDay.id) : false;
    })
    .slice(0, 8);

  return (
    <LiquidPage
      title="Info em Tempo Real"
      subtitle="Call times, alertas, clima e informação do dia de rodagem"
    >
      {/* ── STAT CARDS ───────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <LiquidStatCard
          label="Próximo Call"
          value={todayDay?.callTime || nextDay?.callTime || '--:--'}
          icon={<Clock size={16} />}
          variant="blue"
          pulse={Boolean(todayDay)}
          animationDelay={0}
        />
        <LiquidStatCard
          label="Local"
          value={todayDay ? 'Set activo' : 'Sem rodagem hoje'}
          icon={<MapPin size={16} />}
          variant="emerald"
          animationDelay={80}
        />
        <LiquidStatCard
          label="Crew"
          value={team?.length ?? 0}
          icon={<Users size={16} />}
          variant="purple"
          animationDelay={160}
        />
      </div>

      {/* ── 2-COLUMN LAYOUT ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* ── LEFT COLUMN ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* "HOJE" CARD */}
          <div style={{ ...glassCard(), padding: 20 }}>
            <div style={lensingOverlay()} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 12,
                }}
              >
                Hoje
              </p>

              {todayDay ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                      {formatDate(todayDay.date)}
                    </p>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        background: 'rgba(16,185,129,0.15)',
                        color: '#10b981',
                        border: '0.5px solid rgba(16,185,129,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: '#10b981',
                          display: 'inline-block',
                          animation: 'pulse 2s infinite',
                        }}
                      />
                      A filmar
                    </span>
                  </div>

                  {/* Call time — gradient hero */}
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #10b981, #34d399)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '-0.02em',
                      marginBottom: 4,
                      filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.25))',
                    }}
                  >
                    {todayDay.callTime || '--:--'}
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
                    Hora de call
                  </p>

                  {todayDay.notes && (
                    <>
                      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
                        {todayDay.notes}
                      </p>
                    </>
                  )}

                  {/* Catering */}
                  {todayDay.catering && (
                    <>
                      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />
                      <div style={{ ...nestedCard(), padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                            Catering
                          </span>
                          {todayDay.catering.time && (
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                              {todayDay.catering.time}
                            </span>
                          )}
                        </div>
                        {todayDay.catering.location && (
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                            {todayDay.catering.location}
                          </p>
                        )}
                        {todayDay.catering.menu && todayDay.catering.menu.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {todayDay.catering.menu.map((item, i) => (
                              <span
                                key={i}
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: 'rgba(255,255,255,0.08)',
                                  color: 'rgba(255,255,255,0.65)',
                                  border: '0.5px solid rgba(255,255,255,0.12)',
                                }}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                    Sem rodagem hoje
                  </p>
                  {nextDay && (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                      Próxima rodagem:{' '}
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                        {formatDate(nextDay.date)}
                      </span>
                      {nextDay.label && ` — ${nextDay.label}`}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* "CLIMA" CARD */}
          <div style={{ ...glassCard(), padding: 20 }}>
            <div style={lensingOverlay()} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 14,
                }}
              >
                Clima
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(245,158,11,0.1)',
                    border: '0.5px solid rgba(245,158,11,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Cloud size={22} style={{ color: 'rgba(255,255,255,0.5)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>
                    Lisboa — 18°C ☁️
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                    Parcialmente nublado
                  </p>
                </div>
              </div>

              <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Sun size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                  Amanhã: 20°C ☀️
                </p>
              </div>

              {/* EXT warning — static */}
              <div
                style={{
                  ...nestedCard('#f59e0b'),
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <div>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      background: 'rgba(245,158,11,0.15)',
                      color: '#f59e0b',
                      border: '0.5px solid rgba(245,158,11,0.3)',
                      marginRight: 6,
                    }}
                  >
                    Verificar EXT scenes
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    Chuva possível à tarde
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* "EQUIPA DE HOJE" CARD */}
          <div style={{ ...glassCard(), padding: 20 }}>
            <div style={lensingOverlay()} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 14,
                }}
              >
                Equipa de hoje
              </p>

              {todaysCrew.length === 0 ? (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                  Sem membros confirmados
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {todaysCrew.map((member, i) => {
                    const avatarColor = groupColor(member.group);
                    const initials    = member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...springConfigs.gentle, delay: i * 0.04 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 12,
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: `rgba(${hexToRgb(avatarColor)}, 0.18)`,
                            border: `1.5px solid rgba(${hexToRgb(avatarColor)}, 0.4)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                            color: avatarColor,
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {member.name}
                          </p>
                          {member.role && (
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {member.role}
                            </p>
                          )}
                        </div>
                        {todayDay?.callTime && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                            {todayDay.callTime}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* "WALKIE CHANNELS" CARD */}
          <div style={{ ...glassCard(), padding: 20 }}>
            <div style={lensingOverlay()} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Radio size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.45)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Walkie Channels
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {WALKIE_CHANNELS.map((ch, i) => (
                  <motion.div
                    key={ch.ch}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springConfigs.gentle, delay: i * 0.05 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 10px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 9999,
                        background: `rgba(${hexToRgb(ch.color)}, 0.15)`,
                        border: `0.5px solid rgba(${hexToRgb(ch.color)}, 0.35)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        color: ch.color,
                        flexShrink: 0,
                      }}
                    >
                      {ch.ch}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                      {ch.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LiquidPage>
  );
}

/* ─────────────────────────────────────────────────────────────
   UTIL
───────────────────────────────────────────────────────────── */
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
