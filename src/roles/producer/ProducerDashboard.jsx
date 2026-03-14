/**
 * ProducerDashboard — Liquid Glass Edition
 * Layout: pixel-perfect match to DASHBOARD-STANDALONE-FULL.html reference
 * §1 O TEU DIA  §2 Dept Pills  §3 Scene Cards  §4 Grid 2/3+1/3
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../core/store.js';
import { useShallow } from 'zustand/react/shallow';
import { getScenesForDay } from '../../utils/dashboardHelpers.js';
import {
  Calendar, Clock, MapPin, Users, Film, Sun, Camera, Shirt,
  Zap, Palette, Mic, Car, Sunrise, Sunset, CheckCircle2,
  ArrowUpRight, ExternalLink, Clapperboard, Utensils,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { WeatherWidget }        from '../../app/components/WeatherWidget';
import { CharacterDetailWidget } from '../../app/components/CharacterDetailWidget';
import { WardrobeWidget }       from '../../app/components/WardrobeWidget';
import { CrewWidget }           from '../../app/components/CrewWidget';
import { LocationWidget }       from '../../app/components/LocationWidget';
import { NextCallWidget }       from '../../app/components/NextCallWidget';
import { CameraWidget }         from '../../app/components/CameraWidget';
import { DirectionWidget }      from '../../app/components/DirectionWidget';
import { ArtWidget }            from '../../app/components/ArtWidget';
import { SceneDetailWidget }    from '../../app/components/SceneDetailWidget';
import { RecceWidget }          from '../../app/components/RecceWidget';
import { ServiceSheetWidget }   from '../../app/components/ServiceSheetWidget';
import { ScenePrepCard }        from '../../app/components/ScenePrepCard';

/* ─────────────────────────────────────────────────────────────
   LIQUID WIDGET
───────────────────────────────────────────────────────────── */
function LiquidWidget({ children, delay = 0, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, ...style }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(78,80,88,0.18)', backdropFilter: 'blur(20px) saturate(120%)', WebkitBackdropFilter: 'blur(20px) saturate(120%)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 28, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 28, border: '1px solid rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }} />
      <div style={{ position: 'relative', zIndex: 10, padding: 24 }}>
        {children}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   WIDGET TITLE
───────────────────────────────────────────────────────────── */
function WidgetTitle({ color = '#10b981', children, pulse = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, fontWeight: 900, color: '#fff' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, animation: pulse ? 'pulse 2s ease-in-out infinite' : undefined, flexShrink: 0 }} />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   NESTED CARD
───────────────────────────────────────────────────────────── */
function NestedCard({ children, style = {} }) {
  return (
    <div style={{ borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MINI ROW (char / loc / post / qa)
───────────────────────────────────────────────────────────── */
function MiniRow({ children, onClick, style = {} }) {
  return (
    <div
      onClick={onClick}
      className="active:scale-[0.97]"
      style={{ borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s', ...style }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DEPARTMENT PILL
───────────────────────────────────────────────────────────── */
function DeptPill({ icon: Icon, label, color, count, onClick }) {
  const [p, setP] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)}
      onTouchStart={() => setP(true)} onTouchEnd={() => setP(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9999, border: `0.5px solid ${color}40`, background: `${color}12`, backdropFilter: 'blur(16px) saturate(120%)', WebkitBackdropFilter: 'blur(16px) saturate(120%)', boxShadow: p ? `0 2px 8px ${color}40,inset 0 .5px .5px rgba(255,255,255,.2)` : `0 4px 12px ${color}30,inset 0 .5px .5px rgba(255,255,255,.15)`, transform: p ? 'scale(0.96)' : 'scale(1)', transition: 'all 0.2s cubic-bezier(0.25,0.1,0.25,1)', cursor: 'pointer', flexShrink: 0 }}
    >
      <Icon size={14} style={{ color }} />
      <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap' }}>{label}</span>
      {count != null && (
        <div style={{ padding: '1px 5px', borderRadius: 9999, fontSize: 9, fontWeight: 900, minWidth: 18, textAlign: 'center', background: color, color: '#fff', boxShadow: `0 0 8px ${color}60` }}>{count}</div>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────────────────────── */
function StatusBadge({ status = 'shooting' }) {
  const cfg = {
    shooting: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.37)', label: 'FILMANDO' },
    setup:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.37)',  label: 'SETUP' },
    delay:    { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.37)',   label: 'ATRASO' },
    done:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.37)',  label: 'COMPLETO' },
  }[status] || { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.37)', label: 'FILMANDO' };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9999, background: cfg.bg, border: `0.5px solid ${cfg.border}`, color: cfg.color, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', backdropFilter: 'blur(12px)', boxShadow: `0 2px 8px ${cfg.color}30,inset 0 .5px .5px rgba(255,255,255,.2)`, flexShrink: 0, whiteSpace: 'nowrap' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color},0 0 12px ${cfg.color}80`, animation: 'pulse 2s ease-in-out infinite' }} />
      {cfg.label}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   INFO CARD (meteo / chamada / localização)
───────────────────────────────────────────────────────────── */
function InfoCard({ color, bg, border, icon: Icon, label, value, valueSm, desc, extra, onClick }) {
  return (
    <div onClick={onClick} className="active:scale-95" style={{ borderRadius: 16, padding: 16, background: bg, border: `1px solid ${border}`, cursor: 'pointer', transition: 'transform 0.15s', overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: extra ? 12 : 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${color}25`, backdropFilter: 'blur(12px)', border: `0.5px solid ${color}4D`, boxShadow: 'inset 0 .5px 0 rgba(255,255,255,.2)' }}>
          <Icon size={20} style={{ color: '#fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: valueSm ? 18 : 24, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{value}</div>
          {desc && <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{desc}</div>}
        </div>
      </div>
      {extra}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TINT CARD (next events)
───────────────────────────────────────────────────────────── */
function TintCard({ color, bold, icon: Icon, time, badge, title, loc, extra, link }) {
  const bg = bold ? `linear-gradient(135deg,${color}20,${color}12)` : `linear-gradient(135deg,${color}14,${color}08)`;
  const bdr = bold ? `1px solid ${color}50` : `0.5px solid ${color}30`;
  return (
    <div style={{ borderRadius: 16, padding: 16, background: bg, border: bdr, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${color}20`, border: `0.5px solid ${color}40` }}>
        <Icon size={20} style={{ color: '#fff' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color }}>{time}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: `${color}30`, color }}>{badge}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={12} />
          {loc}
        </div>
        {extra && (
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: `${color}30`, color }}>{extra}</span>
          </div>
        )}
      </div>
      {link && <ExternalLink size={16} style={{ color, flexShrink: 0 }} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export function ProducerDashboard() {
  const {
    projectName, auth, team, locations, shootingDays,
    parsedScripts, parsedCharacters, navigate,
    sceneAssignments, sceneTakes, departmentItems, departmentConfig, owmApiKey,
  } = useStore(useShallow(s => ({
    projectName:      s.projectName,
    auth:             s.auth,
    team:             s.team,
    locations:        s.locations,
    shootingDays:     s.shootingDays,
    parsedScripts:    s.parsedScripts,
    parsedCharacters: s.parsedCharacters,
    navigate:         s.navigate,
    sceneAssignments: s.sceneAssignments,
    sceneTakes:       s.sceneTakes,
    departmentItems:  s.departmentItems,
    departmentConfig: s.departmentConfig,
    owmApiKey:        s.owmApiKey,
  })));

  /* ── Widget open states ── */
  const [weatherOpen,     setWeatherOpen]     = useState(false);
  const [charOpen,        setCharOpen]        = useState(false);
  const [wardrobeOpen,    setWardrobeOpen]    = useState(false);
  const [crewOpen,        setCrewOpen]        = useState(false);
  const [locationOpen,    setLocationOpen]    = useState(false);
  const [nextCallOpen,    setNextCallOpen]    = useState(false);
  const [cameraOpen,      setCameraOpen]      = useState(false);
  const [directionOpen,   setDirectionOpen]   = useState(false);
  const [artOpen,         setArtOpen]         = useState(false);
  const [sceneDetailOpen, setSceneDetailOpen] = useState(false);
  const [recceOpen,       setRecceOpen]       = useState(false);
  const [serviceOpen,     setServiceOpen]     = useState(false);

  const [selectedChar,     setSelectedChar]     = useState(null);
  const [selectedScene,    setSelectedScene]    = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  /* ── Clock ── */
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  );
  useEffect(() => {
    const t = setInterval(() =>
      setCurrentTime(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })),
    30000);
    return () => clearInterval(t);
  }, []);

  /* ── Dates ── */
  const today = new Date().toISOString().slice(0, 10);
  const todayFormatted = new Date().toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayCap = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  /* ── Today shooting day ── */
  const todayDay = useMemo(() => (shootingDays || []).find(d => d.date === today), [shootingDays, today]);
  const todayIdx = useMemo(() => (shootingDays || []).findIndex(d => d.date === today), [shootingDays, today]);
  const callTime = todayDay?.callTime || '08:00';
  const dayNumber = todayDay?.dayNumber ?? (todayIdx >= 0 ? todayIdx + 1 : null);
  const totalDays = (shootingDays || []).length;

  /* ── Today's scenes ── */
  const todayScenes = useMemo(() =>
    todayDay ? getScenesForDay(todayDay.id, sceneAssignments, parsedScripts) : [],
  [todayDay, sceneAssignments, parsedScripts]);

  /* ── Today location ── */
  const todayLocation = useMemo(() => {
    const loc = todayScenes[0]?.location;
    if (!loc) return null;
    return (locations || []).find(l => l.name === loc || l.name?.toLowerCase().includes(loc.toLowerCase())) || { name: loc };
  }, [todayScenes, locations]);

  /* ── Next scene ── */
  const nextScene = useMemo(() =>
    todayScenes.find(sc => {
      const takes = sceneTakes?.[sc.sceneKey] || [];
      return !takes.some(t => t.status === 'BOM' || t.status === 'bom');
    }) || todayScenes[0] || null,
  [todayScenes, sceneTakes]);

  /* ── Next location (tomorrow) ── */
  const nextLocation = useMemo(() => {
    const nextDay = (shootingDays || []).find(d => d.date > today);
    if (!nextDay) return null;
    const scenes = getScenesForDay(nextDay.id, sceneAssignments, parsedScripts);
    const loc = scenes[0]?.location;
    if (!loc) return null;
    return (locations || []).find(l => l.name === loc || l.name?.toLowerCase().includes(loc.toLowerCase())) || { name: loc };
  }, [shootingDays, today, sceneAssignments, parsedScripts, locations]);

  /* ── Weather ── */
  const [weather, setWeather] = useState({ temp: 18, desc: 'Parcialmente nublado', wind: 12 });
  useEffect(() => {
    if (!owmApiKey) return;
    const city = todayLocation?.city || todayLocation?.name || 'Lisboa';
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},PT&appid=${owmApiKey}&units=metric&lang=pt`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setWeather({ temp: Math.round(d.main?.temp), desc: d.weather?.[0]?.description || '', wind: Math.round((d.wind?.speed || 0) * 3.6) }))
      .catch(() => {});
  }, [owmApiKey, todayLocation]);

  /* ── Dept counts ── */
  const deptCounts = useMemo(() => {
    const m = {};
    for (const item of (departmentItems || [])) m[item.department] = (m[item.department] || 0) + 1;
    return m;
  }, [departmentItems]);

  /* ── Filmed % ── */
  const allScenes    = useMemo(() => Object.values(parsedScripts || {}).flatMap(s => s.scenes || []), [parsedScripts]);
  const scenesFilmed = useMemo(() => new Set(Object.entries(sceneTakes || {}).filter(([, t]) => t.some(x => x.status === 'BOM' || x.status === 'bom')).map(([k]) => k)).size, [sceneTakes]);
  const filmedPct    = allScenes.length > 0 ? Math.round((scenesFilmed / allScenes.length) * 100) : 0;

  /* ── Daily load chart ── */
  const chartId      = useMemo(() => `ffdl-${Math.random().toString(36).slice(2)}`, []);
  const dailyLoadData = useMemo(() =>
    (shootingDays || []).slice(0, 17).map((d, i) => {
      const scenes = getScenesForDay(d.id, sceneAssignments, parsedScripts);
      const hours  = Math.round(scenes.reduce((s, sc) => s + (sc.pageCount || 1) * 0.5, 0) * 10) / 10;
      return { day: `D${d.dayNumber || i + 1}`, hours, isToday: d.date === today };
    }),
  [shootingDays, sceneAssignments, parsedScripts, today]);

  /* ── Upcoming scenes (ScenePrepCard) ── */
  const upcomingScenes = useMemo(() => {
    const futureDays = (shootingDays || []).filter(d => d.date >= today).slice(0, 3);
    return futureDays.flatMap(d => {
      return getScenesForDay(d.id, sceneAssignments, parsedScripts).slice(0, 2).map((sc, i) => ({
        id:          sc.sceneKey || `${d.id}-${i}`,
        number:      sc.sceneNumber || sc.id || `${i + 1}`,
        title:       sc.location || sc.heading?.location || 'Cena',
        description: sc.description || sc.heading?.full || '',
        location:    sc.location || '',
        timeOfDay:   sc.int_ext || sc.intExt || 'INT',
        period:      sc.time || sc.timeOfDay || 'DIA',
        color:       ['#10b981', '#f59e0b', '#ef4444'][i % 3],
        thumbnail:   (() => {
          const itms = (departmentItems || []).filter(it => (it.scenes || []).includes(sc.sceneKey) && it.photos?.length);
          if (itms.length) return itms[0].photos[0];
          return (locations || []).find(l => l.name === sc.location)?.photo || null;
        })(),
        items:       (departmentItems || []).filter(it => (it.scenes || []).includes(sc.sceneKey)).slice(0, 5).map(it => ({
          title: it.name, type: it.department || 'Item', status: it.approved ? 'confirmed' : 'pending',
        })),
        script: [], continuityNotes: [], characters: sc.characters || [], wardrobe: [],
      }));
    }).slice(0, 3);
  }, [shootingDays, today, sceneAssignments, parsedScripts, departmentItems, locations]);

  /* ── Characters ── */
  const characters = useMemo(() =>
    (parsedCharacters || []).slice(0, 4).map(c => ({ id: c.id || c.name, name: c.name, actor: c.actor || '', scenes: c.sceneCount || 0 })),
  [parsedCharacters]);

  /* ── Next events (Refeições & A Seguir) ── */
  const nextEvents = useMemo(() => {
    const events = [];
    if (todayDay?.mealLocation || true) {
      events.push({ time: '13:00', badge: 'ALMOÇO', color: '#fb923c', title: todayDay?.mealLocation || 'O Pateo', loc: todayDay?.mealAddress || 'Rua da Esperança, 108', icon: Utensils, bold: true, link: true });
    }
    todayScenes.slice(0, 2).forEach((sc, i) => {
      const badges = ['PRÓXIMA', 'DEPOIS'];
      const colors = ['#10b981', '#3b82f6'];
      events.push({ time: sc.callTime || (i === 0 ? callTime : '—'), badge: badges[i], color: colors[i], title: `Cena ${sc.sceneNumber || sc.id} · ${sc.location || '—'}`, loc: `${sc.int_ext || 'INT'} / ${sc.time || 'DIA'}`, icon: Clock, bold: i === 0, link: i !== 0, extra: i === 0 ? 'Confirmado' : undefined });
    });
    return events;
  }, [todayDay, todayScenes, callTime]);

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ══ §1 O TEU DIA ══ */}
        <LiquidWidget delay={0}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>O TEU DIA</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span>{todayCap}</span>
                  <span>•</span>
                  <span>{projectName || 'FrameFlow'}</span>
                </div>
              </div>
              <div
                onClick={() => todayDay && navigate('callsheet')}
                style={{ fontSize: 48, fontWeight: 900, fontVariantNumeric: 'tabular-nums', lineHeight: 1, cursor: todayDay ? 'pointer' : 'default', background: 'linear-gradient(135deg,#10b981,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.3))' }}
              >
                {currentTime}
              </div>
            </div>

            {/* Service sheet */}
            <button
              onClick={() => setServiceOpen(true)}
              className="active:scale-95"
              style={{ width: '100%', borderRadius: 16, padding: 16, border: '0.5px solid rgba(59,130,246,0.40)', background: 'rgba(59,130,246,0.13)', backdropFilter: 'blur(20px) saturate(120%)', WebkitBackdropFilter: 'blur(20px) saturate(120%)', boxShadow: '0 0 24px rgba(59,130,246,0.2),inset 0 .5px .5px rgba(255,255,255,.2)', cursor: 'pointer', transition: 'transform 0.15s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 16, fontWeight: 900, color: '#fff' }}>
                <Calendar size={20} />
                📋 FOLHA DE SERVIÇO DO DIA
              </div>
            </button>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <InfoCard
                color="#3b82f6" bg="linear-gradient(135deg,rgba(59,130,246,.15),rgba(37,99,235,.1))" border="rgba(59,130,246,.3)"
                icon={Sun} label="Meteorologia" value={`${weather.temp}°C`} desc={weather.desc}
                onClick={() => setWeatherOpen(true)}
                extra={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}><Sunrise size={14} style={{ color: '#fbbf24' }} />{todayDay?.sunrise || '07:24'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}><Sunset size={14} style={{ color: '#f97316' }} />{todayDay?.sunset || '18:42'}</div>
                  </div>
                }
              />
              <InfoCard
                color="#10b981" bg="linear-gradient(135deg,rgba(16,185,129,.15),rgba(5,150,105,.1))" border="rgba(16,185,129,.3)"
                icon={Clock} label="Próxima Chamada" value={callTime}
                desc={nextScene ? `Cena ${nextScene.sceneNumber || ''} · ${nextScene.location || '—'}` : 'Sem cenas hoje'}
                onClick={() => setNextCallOpen(true)}
              />
              <InfoCard
                color="#8b5cf6" bg="linear-gradient(135deg,rgba(139,92,246,.15),rgba(124,58,237,.1))" border="rgba(139,92,246,.3)"
                icon={MapPin} label="Próxima Localização"
                value={todayLocation?.displayName || todayLocation?.name || '—'} valueSm
                desc={todayLocation?.city || todayLocation?.address || ''}
                onClick={() => { if (todayLocation) { setSelectedLocation({ name: todayLocation.name, address: todayLocation.address, city: todayLocation.city, color: '#8b5cf6' }); setRecceOpen(true); } }}
                extra={todayLocation?.googleMapsUrl ? <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(139,92,246,0.9)', marginTop: 8 }}>📍 Abrir no Maps</div> : null}
              />
            </div>
          </div>
        </LiquidWidget>

        {/* ══ §2 DEPT PILLS BAR ══ */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, background: 'rgba(78,80,88,0.18)', backdropFilter: 'blur(20px) saturate(120%)', WebkitBackdropFilter: 'blur(20px) saturate(120%)', border: '0.5px solid rgba(255,255,255,0.10)', boxShadow: '0 4px 24px rgba(0,0,0,0.08),inset 0 .5px 0 rgba(255,255,255,.10)' }}
        >
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
                <DeptPill icon={Camera}  label="Câmara"    color="#10b981" count={deptCounts['camera']}  onClick={() => setCameraOpen(true)} />
                <DeptPill icon={Film}    label="Direção"   color="#3b82f6" count={team?.filter(m => m.group === 'Realização').length || undefined} onClick={() => setDirectionOpen(true)} />
                <DeptPill icon={Users}   label="Produção"  color="#ec4899" count={team?.filter(m => m.group === 'Produção').length || undefined}   onClick={() => setCrewOpen(true)} />
                <DeptPill icon={Shirt}   label="Figurinos" color="#f97316" count={deptCounts['wardrobe']} onClick={() => setWardrobeOpen(true)} />
                <DeptPill icon={Palette} label="Arte"      color="#f59e0b" count={deptCounts['art']}     onClick={() => setArtOpen(true)} />
              </div>
              <StatusBadge status={todayScenes.length > 0 ? 'shooting' : 'setup'} />
            </div>
            <div style={{ position: 'relative', height: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${filmedPct}%` }}
                transition={{ delay: 0.5, duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ position: 'absolute', inset: 0, right: 'auto', background: 'linear-gradient(90deg,#10b981,#34d399)', boxShadow: '0 0 12px rgba(16,185,129,0.6)', borderRadius: 9999 }}
              />
            </div>
          </div>
        </motion.div>

        {/* ══ §3 SCENE CARDS ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {upcomingScenes.map((sc, i) => (
            <ScenePrepCard key={sc.id} {...sc} isNext={i === 0} />
          ))}
          {upcomingScenes.length === 0 && (
            <LiquidWidget>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 12 }}>
                <Film size={32} style={{ color: 'rgba(255,255,255,0.3)' }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Sem cenas agendadas</p>
                <button onClick={() => navigate('production')} className="active:scale-95" style={{ padding: '8px 16px', borderRadius: 9999, fontSize: 12, fontWeight: 900, background: '#10b981', color: '#fff', boxShadow: '0 4px 16px rgba(16,185,129,0.4)', border: 'none', cursor: 'pointer' }}>
                  Planear rodagem
                </button>
              </div>
            </LiquidWidget>
          )}
        </div>

        {/* ══ §4 MAIN GRID 2/3 + 1/3 ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Chart */}
            {dailyLoadData.length > 0 && (
              <LiquidWidget delay={0.28}>
                <WidgetTitle color="#10b981">Carga por Dia (Horas)</WidgetTitle>
                <div style={{ borderRadius: 18, padding: 16, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dailyLoadData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`${chartId}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.9} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.4} /></linearGradient>
                        <linearGradient id={`${chartId}-y`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4} /></linearGradient>
                        <linearGradient id={`${chartId}-r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} /></linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'rgba(78,80,88,0.18)', backdropFilter: 'blur(20px) saturate(120%)', border: '0.5px solid rgba(255,255,255,0.14)', borderRadius: 12, fontSize: 11, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.15),inset 0 .5px 0 rgba(255,255,255,.12)' }} formatter={v => [`${v}h`, 'Horas']} />
                      <Bar dataKey="hours" radius={[8, 8, 0, 0]} shape={props => {
                        const { x, y, width, height, payload } = props;
                        const h = payload?.hours ?? 0;
                        const id = h > 10 ? `${chartId}-r` : h >= 8 ? `${chartId}-y` : `${chartId}-g`;
                        return <rect x={x} y={y} width={width} height={height} rx={8} ry={8} fill={`url(#${id})`} />;
                      }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </LiquidWidget>
            )}

            {/* Elenco Principal */}
            {characters.length > 0 && (
              <LiquidWidget delay={0.34}>
                <WidgetTitle color="#8b5cf6">Elenco Principal</WidgetTitle>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: -12, marginBottom: 12 }}>{characters.length} personagens</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {characters.map(c => (
                    <MiniRow key={c.id} onClick={() => { setSelectedChar({ name: c.name, actor: c.actor, role: 'Personagem', scenes: c.scenes, costume: '', notes: '' }); setCharOpen(true); }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0, background: 'rgba(139,92,246,0.18)', color: '#a78bfa', border: '0.5px solid rgba(139,92,246,0.35)', boxShadow: 'inset 0 .5px 0 rgba(255,255,255,.2)' }}>
                        {c.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{c.name}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{c.actor || 'Ator não definido'}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#a78bfa' }}>{c.scenes}</div>
                    </MiniRow>
                  ))}
                </div>
              </LiquidWidget>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Próxima Location */}
            <LiquidWidget delay={0.3}>
              <WidgetTitle color="#10b981">Próxima Location</WidgetTitle>
              <div style={{ borderRadius: 18, padding: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{nextLocation?.displayName || nextLocation?.name || '—'}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>{nextLocation?.type || 'Exterior'}</div>
                    {nextLocation?.googleMapsUrl && (
                      <a href={nextLocation.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>📍 Abrir no Maps</a>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)' }}>
                  <Sun size={14} style={{ color: '#f59e0b' }} />{weather.temp}°C · {weather.desc}
                </div>
                {nextLocation?.status === 'confirmado' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981' }}>
                    <CheckCircle2 size={12} />Confirmado
                  </div>
                )}
              </div>
            </LiquidWidget>

            {/* Refeições & A Seguir */}
            <LiquidWidget delay={0.36}>
              <WidgetTitle color="#f59e0b" pulse>Refeições & A Seguir</WidgetTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {nextEvents.map((ev, i) => (
                  <TintCard key={i} {...ev} />
                ))}
                {nextEvents.length === 0 && (
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '8px 0' }}>Sem eventos hoje</p>
                )}
              </div>
            </LiquidWidget>

            {/* Locais Hoje */}
            {(locations || []).length > 0 && (
              <LiquidWidget delay={0.42}>
                <WidgetTitle color="#10b981">Locais Hoje</WidgetTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(locations || []).slice(0, 5).map(loc => {
                    const dotColor = loc.status === 'confirmado' || loc.status === 'confirmed' ? '#10b981' : loc.status === 'pendente' || loc.status === 'pending' ? '#f59e0b' : '#ef4444';
                    return (
                      <MiniRow key={loc.id}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{loc.name}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{loc.scenes != null ? `${loc.scenes} cenas` : loc.type || 'Local'}</div>
                        </div>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: dotColor, boxShadow: `0 0 12px ${dotColor}` }} />
                      </MiniRow>
                    );
                  })}
                </div>
              </LiquidWidget>
            )}

            {/* Pós-Produção */}
            <LiquidWidget delay={0.48}>
              <WidgetTitle color="#8b5cf6">Pós-Produção</WidgetTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { ep: 'EP01', pct: 65, status: 'Em Edição', color: '#3b82f6' },
                  { ep: 'EP02', pct: 40, status: 'Som',       color: '#10b981' },
                  { ep: 'EP03', pct: 85, status: 'Cor',       color: '#f59e0b' },
                ].map(({ ep, pct, status, color }) => (
                  <div key={ep} style={{ borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{ep}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.6, duration: 1, ease: [0.25, 0.1, 0.25, 1] }} style={{ height: '100%', background: color, boxShadow: `0 0 8px ${color}60`, borderRadius: 9999 }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </LiquidWidget>

            {/* Acções Rápidas */}
            <LiquidWidget delay={0.54}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Zap size={14} style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>Acções Rápidas</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: Camera,       label: 'Call Sheet', color: '#10b981', action: () => navigate('callsheet') },
                  { icon: Clapperboard, label: 'Dailies',    color: '#3b82f6', action: () => navigate('live-board') },
                  { icon: Film,         label: 'Ver Cena',   color: '#f59e0b', action: () => { if (upcomingScenes[0]) { setSelectedScene(upcomingScenes[0]); setSceneDetailOpen(true); } } },
                ].map((qa, i) => (
                  <button key={i} onClick={qa.action} className="active:scale-[0.97]" style={{ borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', border: `1px solid ${qa.color}30`, cursor: 'pointer', transition: 'transform 0.15s', width: '100%' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${qa.color}25`, boxShadow: `0 0 8px ${qa.color}40` }}>
                      <qa.icon size={14} style={{ color: qa.color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', flex: 1, textAlign: 'left' }}>{qa.label}</span>
                    <ArrowUpRight size={14} style={{ color: qa.color }} />
                  </button>
                ))}
              </div>
            </LiquidWidget>

          </div>
        </div>

      </div>

      {/* ── OVERLAY WIDGETS ── */}
      <WeatherWidget        isOpen={weatherOpen}     onClose={() => setWeatherOpen(false)} />
      <CharacterDetailWidget isOpen={charOpen}       onClose={() => { setCharOpen(false); setSelectedChar(null); }} character={selectedChar} />
      <WardrobeWidget       isOpen={wardrobeOpen}    onClose={() => setWardrobeOpen(false)} />
      <CrewWidget           isOpen={crewOpen}        onClose={() => setCrewOpen(false)} />
      <LocationWidget       isOpen={locationOpen}    onClose={() => setLocationOpen(false)} />
      <NextCallWidget       isOpen={nextCallOpen}    onClose={() => setNextCallOpen(false)} />
      <CameraWidget         isOpen={cameraOpen}      onClose={() => setCameraOpen(false)} />
      <DirectionWidget      isOpen={directionOpen}   onClose={() => setDirectionOpen(false)} />
      <ArtWidget            isOpen={artOpen}         onClose={() => setArtOpen(false)} />
      <SceneDetailWidget    isOpen={sceneDetailOpen} onClose={() => { setSceneDetailOpen(false); setSelectedScene(null); }} scene={selectedScene} />
      <RecceWidget          isOpen={recceOpen}       onClose={() => setRecceOpen(false)} location={selectedLocation} />
      <ServiceSheetWidget   isOpen={serviceOpen}     onClose={() => setServiceOpen(false)} />
    </>
  );
}
