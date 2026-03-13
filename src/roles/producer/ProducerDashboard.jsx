/**
 * ProducerDashboard — Liquid Glass Edition
 * Visual design from DashboardProducerLiquid (Ffv04copy)
 * Data from Zustand store — NO mock imports
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../core/store.js';
import { useShallow } from 'zustand/react/shallow';
import { getScenesForDay } from '../../utils/dashboardHelpers.js';
import {
  Calendar, Clock, MapPin, Users, Film,
  CheckCircle, CheckCircle2, ChevronDown, ChevronRight,
  Sun, Camera, Clapperboard, ArrowUpRight, Shirt, Zap,
  Palette, Mic, Car, Sparkles, Package, Utensils,
  Sunrise, Sunset, ExternalLink, Video,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { WeatherWidget } from '../../app/components/WeatherWidget';
import { CharacterDetailWidget } from '../../app/components/CharacterDetailWidget';
import { WardrobeWidget } from '../../app/components/WardrobeWidget';
import { CrewWidget } from '../../app/components/CrewWidget';
import { LocationWidget } from '../../app/components/LocationWidget';
import { NextCallWidget } from '../../app/components/NextCallWidget';
import { CameraWidget } from '../../app/components/CameraWidget';
import { DirectionWidget } from '../../app/components/DirectionWidget';
import { ArtWidget } from '../../app/components/ArtWidget';
import { SceneDetailWidget } from '../../app/components/SceneDetailWidget';
import { RecceWidget } from '../../app/components/RecceWidget';
import { ServiceSheetWidget } from '../../app/components/ServiceSheetWidget';
import { SceneCardWithHover } from '../../app/components/SceneCardWithHover';
import { NextScenesWidget } from '../../app/components/NextScenesWidget';
import { DashboardLoadingState } from '../../app/components/DashboardLoadingState';

/* ─────────────────────────────────────────────────────────────
   DEPT HELPERS
───────────────────────────────────────────────────────────── */

const DEPT_COLORS = {
  camera: '#10b981', lighting: '#f59e0b', art: '#f59e0b', wardrobe: '#f97316',
  props: '#8b5cf6', sfx: '#f97316', sound: '#8b5cf6', makeup: '#ec4899',
  hair: '#f472b6', vehicles: '#6b7280', stunts: '#ef4444', vfx: '#6366f1',
};

const DEPT_ICONS = {
  camera: Camera, lighting: Zap, art: Palette, wardrobe: Shirt,
  props: Package, sfx: Zap, sound: Mic, makeup: Palette,
  hair: Palette, vehicles: Car, stunts: Zap, vfx: Film,
};

/* ─────────────────────────────────────────────────────────────
   LIQUID WIDGET — Authentic Apple Liquid Glass
───────────────────────────────────────────────────────────── */

function LiquidWidget({ children, className = '', interactive = false }) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      onTouchStart={() => interactive && setIsPressed(true)}
      onTouchEnd={() => interactive && setIsPressed(false)}
      onMouseDown={() => interactive && setIsPressed(true)}
      onMouseUp={() => interactive && setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`relative overflow-hidden ${className}`}
      style={{
        borderRadius: '28px',
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
      }}
    >
      {/* Base glass */}
      <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px) saturate(120%)', WebkitBackdropFilter: 'blur(20px) saturate(120%)' }} />
      {/* Lensing */}
      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: '28px', background: 'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(255,255,255,0.12) 0%, transparent 50%)', mixBlendMode: 'overlay' }} />
      {/* Inner highlight */}
      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: '28px', boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,255,0.3)' }} />
      {/* Border */}
      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: '28px', border: '0.5px solid rgba(255,255,255,0.18)' }} />
      {/* Shadow */}
      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: '28px', boxShadow: isPressed ? '0 4px 16px rgba(0,0,0,0.12)' : '0 2px 20px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(255,255,255,0.1)' }} />
      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DEPARTMENT PILL
───────────────────────────────────────────────────────────── */

function DepartmentPill({ icon: Icon, label, color, count, onClick }) {
  const [isPressed, setIsPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className="relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all cursor-pointer flex-shrink-0"
      style={{
        background: `${color}15`,
        backdropFilter: 'blur(16px) saturate(120%)',
        WebkitBackdropFilter: 'blur(16px) saturate(120%)',
        border: `0.5px solid ${color}40`,
        boxShadow: isPressed ? `0 2px 8px ${color}40, inset 0 0.5px 0.5px rgba(255,255,255,0.2)` : `0 4px 12px ${color}30, inset 0 0.5px 0.5px rgba(255,255,255,0.15)`,
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
      }}
    >
      <Icon size={14} style={{ color }} />
      <span className="text-xs font-black" style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</span>
      {count !== undefined && (
        <div className="px-1.5 py-0.5 rounded-full text-[9px] font-black min-w-[18px] text-center" style={{ background: color, color: '#fff', boxShadow: `0 0 8px ${color}60` }}>
          {count}
        </div>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────────────────────── */

function StatusBadge({ status = 'shooting', label }) {
  const configs = {
    shooting: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Filmando' },
    setup:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Setup' },
    delay:    { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Atraso' },
    done:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'Completo' },
  };
  const cfg = configs[status] || configs.shooting;
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ background: cfg.bg, backdropFilter: 'blur(12px)', border: `0.5px solid ${cfg.color}60`, color: cfg.color, boxShadow: `0 2px 8px ${cfg.color}30, inset 0 0.5px 0.5px rgba(255,255,255,0.2)` }}>
      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
      {label || cfg.label}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LIQUID CHART CONTAINER
───────────────────────────────────────────────────────────── */

function LiquidChartContainer({ children, title }) {
  return (
    <LiquidWidget>
      <h3 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: '#ffffff' }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
        {title}
      </h3>
      <div className="rounded-[18px] p-4" style={{ background: 'rgba(0,0,0,0.15)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
        {children}
      </div>
    </LiquidWidget>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */

export function ProducerDashboard() {
  const {
    projectName, auth, team, locations, shootingDays, budgets,
    parsedScripts, parsedCharacters, navigate,
    sceneAssignments, sceneTakes, departmentItems, departmentConfig, owmApiKey,
  } = useStore(useShallow(s => ({
    projectName: s.projectName,
    auth: s.auth,
    team: s.team,
    locations: s.locations,
    shootingDays: s.shootingDays,
    budgets: s.budgets,
    parsedScripts: s.parsedScripts,
    parsedCharacters: s.parsedCharacters,
    navigate: s.navigate,
    sceneAssignments: s.sceneAssignments,
    sceneTakes: s.sceneTakes,
    departmentItems: s.departmentItems,
    departmentConfig: s.departmentConfig,
    owmApiKey: s.owmApiKey,
  })));

  /* ── Widget open states ── */
  const [weatherWidgetOpen, setWeatherWidgetOpen]         = useState(false);
  const [characterWidgetOpen, setCharacterWidgetOpen]     = useState(false);
  const [wardrobeWidgetOpen, setWardrobeWidgetOpen]       = useState(false);
  const [crewWidgetOpen, setCrewWidgetOpen]               = useState(false);
  const [locationWidgetOpen, setLocationWidgetOpen]       = useState(false);
  const [nextCallWidgetOpen, setNextCallWidgetOpen]       = useState(false);
  const [cameraWidgetOpen, setCameraWidgetOpen]           = useState(false);
  const [directionWidgetOpen, setDirectionWidgetOpen]     = useState(false);
  const [artWidgetOpen, setArtWidgetOpen]                 = useState(false);
  const [sceneDetailWidgetOpen, setSceneDetailWidgetOpen] = useState(false);
  const [recceWidgetOpen, setRecceWidgetOpen]             = useState(false);
  const [serviceSheetOpen, setServiceSheetOpen]           = useState(false);

  const [selectedCharacter, setSelectedCharacter]         = useState(null);
  const [selectedScene, setSelectedScene]                 = useState(null);
  const [selectedLocation, setSelectedLocation]           = useState(null);
  const [expandedScenes, setExpandedScenes]               = useState([0]);

  /* ── Clock ── */
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  );
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })), 60000);
    return () => clearInterval(t);
  }, []);

  /* ── Today ── */
  const today = new Date().toISOString().slice(0, 10);
  const todayFormatted = new Date().toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayCap = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);
  const userName = auth?.user?.name || auth?.user || auth?.name || 'Produtor';

  /* ── Today shooting day ── */
  const todayDay = useMemo(() => (shootingDays || []).find(d => d.date === today), [shootingDays, today]);
  const todayIdx = useMemo(() => (shootingDays || []).findIndex(d => d.date === today), [shootingDays, today]);
  const callTime = todayDay?.callTime || '08:00';

  /* ── Today scenes ── */
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
  const nextScene = useMemo(() => {
    return todayScenes.find(sc => {
      const takes = sceneTakes?.[sc.sceneKey] || [];
      return !takes.some(t => t.status === 'BOM' || t.status === 'bom');
    }) || todayScenes[0] || null;
  }, [todayScenes, sceneTakes]);

  /* ── Weather (uses owmApiKey if available) ── */
  const demoWeather = { temp: 18, desc: 'Parcialmente nublado', wind: 12, humidity: 65, city: 'Lisboa', feelsLike: 16, visibility: 10 };
  const [weather, setWeather] = useState(demoWeather);
  useEffect(() => {
    if (!owmApiKey) return;
    const city = todayLocation?.city || todayLocation?.name || 'Lisboa';
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},PT&appid=${owmApiKey}&units=metric&lang=pt`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setWeather({ temp: Math.round(d.main?.temp), desc: d.weather?.[0]?.description || '', wind: Math.round((d.wind?.speed || 0) * 3.6), humidity: d.main?.humidity, city: d.name || city, feelsLike: Math.round(d.main?.feels_like), visibility: Math.round((d.visibility || 0) / 1000) });
      }).catch(() => {});
  }, [owmApiKey, todayLocation]);

  /* ── Department pills from departmentItems ── */
  const deptConfigMap = useMemo(() => {
    const m = {};
    for (const d of (departmentConfig || [])) m[d.id] = d;
    return m;
  }, [departmentConfig]);

  const deptPills = useMemo(() => {
    const map = {};
    for (const item of (departmentItems || [])) {
      const d = item.department || 'other';
      map[d] = (map[d] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [departmentItems]);

  /* ── Scenes filmed progress ── */
  const allScenes = useMemo(() => Object.values(parsedScripts || {}).flatMap(s => s.scenes || []), [parsedScripts]);
  const scenesFilmed = useMemo(() =>
    new Set(Object.entries(sceneTakes || {}).filter(([, t]) => t.some(x => x.status === 'BOM' || x.status === 'bom')).map(([k]) => k)).size,
  [sceneTakes]);
  const filmedPct = allScenes.length > 0 ? Math.round((scenesFilmed / allScenes.length) * 100) : 0;

  /* ── Daily load chart ── */
  const chartId = useMemo(() => `ffdailyload-${Math.random().toString(36).slice(2)}`, []);
  const dailyLoadData = useMemo(() => {
    return (shootingDays || []).slice(0, 14).map((d, i) => {
      const scenes = getScenesForDay(d.id, sceneAssignments, parsedScripts);
      const hours = Math.round(scenes.reduce((s, sc) => s + (sc.pageCount || 1) * 0.5, 0) * 10) / 10;
      return { day: `D${d.dayNumber || i + 1}`, hours, isToday: d.date === today };
    });
  }, [shootingDays, sceneAssignments, parsedScripts, today]);

  /* ── Upcoming scenes for SceneCardWithHover (next 3) ── */
  const upcomingScenes = useMemo(() => {
    const futureDays = (shootingDays || []).filter(d => d.date >= today).slice(0, 3);
    return futureDays.flatMap(d => {
      const scenes = getScenesForDay(d.id, sceneAssignments, parsedScripts).slice(0, 2);
      return scenes.map((sc, i) => ({
        id: sc.sceneKey || `${d.id}-${i}`,
        number: sc.sceneNumber || sc.id || `${i + 1}`,
        title: sc.location || sc.heading?.location || 'Cena',
        description: sc.description || sc.heading?.full || '',
        location: sc.location || '',
        timeOfDay: sc.int_ext || sc.intExt || 'INT',
        period: sc.time || sc.timeOfDay || 'DIA',
        color: ['#10b981', '#f59e0b', '#ef4444'][i % 3],
        thumbnail: (() => {
          const items = (departmentItems || []).filter(item => (item.scenes || []).includes(sc.sceneKey) && item.photos?.length);
          if (items.length > 0) return items[0].photos[0];
          const loc = (locations || []).find(l => l.name === sc.location);
          return loc?.photo || null;
        })(),
        items: (departmentItems || []).filter(item => (item.scenes || []).includes(sc.sceneKey)).slice(0, 3).map(item => ({
          title: item.name,
          type: deptConfigMap[item.department]?.label || item.department || 'Item',
          status: item.approved ? 'confirmed' : 'pending',
        })),
        script: [],
        continuityNotes: [],
        characters: sc.characters || [],
        wardrobe: [],
      }));
    }).slice(0, 3);
  }, [shootingDays, today, sceneAssignments, parsedScripts, departmentItems, locations, deptConfigMap]);

  /* ── Next location ── */
  const nextLocation = useMemo(() => {
    const nextDay = (shootingDays || []).find(d => d.date > today);
    if (!nextDay) return null;
    const scenes = getScenesForDay(nextDay.id, sceneAssignments, parsedScripts);
    const loc = scenes[0]?.location;
    if (!loc) return null;
    return (locations || []).find(l => l.name === loc || l.name?.toLowerCase().includes(loc.toLowerCase())) || { name: loc };
  }, [shootingDays, today, sceneAssignments, parsedScripts, locations]);

  /* ── Characters from parsedCharacters ── */
  const characters = useMemo(() => {
    return (parsedCharacters || []).slice(0, 4).map(c => ({
      id: c.id || c.name,
      name: c.name,
      actor: c.actor || '',
      scenes: c.sceneCount || 0,
    }));
  }, [parsedCharacters]);

  /* ── Toggle scene expand ── */
  const toggleScene = useCallback((idx) => {
    setExpandedScenes(prev => prev.includes(idx) ? [] : [idx]);
  }, []);

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */

  return (
    <>
      <div className="max-w-[1600px] mx-auto relative space-y-3 p-4">

        {/* ── O MEU DIA ── */}
        <LiquidWidget>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                  O TEU DIA
                </h1>
                <p className="text-xs font-bold flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <span>{todayCap}</span>
                  <span>•</span>
                  <span>{projectName || 'FrameFlow'}</span>
                </p>
              </div>
              <div
                className="text-5xl font-black tabular-nums cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.3))' }}
                onClick={() => todayDay && navigate('callsheet')}
              >
                {currentTime}
              </div>
            </div>

            {/* Service Sheet button */}
            <button
              onClick={() => setServiceSheetOpen(true)}
              className="w-full rounded-[16px] p-4 transition-transform active:scale-95"
              style={{ background: 'rgba(59,130,246,0.13)', backdropFilter: 'blur(20px) saturate(120%)', WebkitBackdropFilter: 'blur(20px) saturate(120%)', border: '0.5px solid rgba(59,130,246,0.40)', boxShadow: '0 0 24px rgba(59,130,246,0.2), inset 0 0.5px 0.5px rgba(255,255,255,0.2)' }}
            >
              <div className="flex items-center justify-center gap-3">
                <Calendar size={20} style={{ color: '#ffffff' }} />
                <span className="text-base font-black" style={{ color: '#ffffff' }}>📋 FOLHA DE SERVIÇO DO DIA</span>
              </div>
            </button>

            {/* 3 info cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              {/* Meteorologia */}
              <div onClick={() => setWeatherWidgetOpen(true)} className="rounded-[16px] p-4 relative overflow-hidden cursor-pointer transition-transform active:scale-95" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.1))', border: '1px solid rgba(59,130,246,0.3)' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)', backdropFilter: 'blur(12px)', border: '0.5px solid rgba(59,130,246,0.30)', boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.2)' }}>
                    <Sun className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Meteorologia</div>
                    <div className="text-2xl font-black mb-0.5" style={{ color: '#ffffff' }}>{weather.temp}°C</div>
                    <div className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>{weather.desc}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sunrise size={14} style={{ color: '#fbbf24' }} />
                    <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>{todayDay?.sunrise || '07:24'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sunset size={14} style={{ color: '#f97316' }} />
                    <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>{todayDay?.sunset || '18:42'}</span>
                  </div>
                </div>
              </div>

              {/* Próxima Chamada */}
              <div onClick={() => setNextCallWidgetOpen(true)} className="rounded-[16px] p-4 relative overflow-hidden cursor-pointer transition-transform active:scale-95" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.15)', backdropFilter: 'blur(12px)', border: '0.5px solid rgba(16,185,129,0.30)', boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.2)' }}>
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Próxima Chamada</div>
                    <div className="text-2xl font-black mb-0.5" style={{ color: '#ffffff' }}>{callTime}</div>
                    <div className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {nextScene ? `Cena ${nextScene.sceneNumber || ''} • ${nextScene.location || '—'}` : 'Sem cenas hoje'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Próxima Localização */}
              <div
                onClick={() => {
                  if (todayLocation) { setSelectedLocation({ name: todayLocation.name, address: todayLocation.address, city: todayLocation.city, color: '#8b5cf6' }); setRecceWidgetOpen(true); }
                }}
                className="rounded-[16px] p-4 relative overflow-hidden cursor-pointer transition-transform active:scale-95"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(124,58,237,0.1))', border: '1px solid rgba(139,92,246,0.3)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.15)', backdropFilter: 'blur(12px)', border: '0.5px solid rgba(139,92,246,0.30)', boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.2)' }}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Próxima Localização</div>
                    <div className="text-lg font-black mb-0.5" style={{ color: '#ffffff' }}>{todayLocation?.displayName || todayLocation?.name || '—'}</div>
                    <div className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>{todayLocation?.city || todayLocation?.address || ''}</div>
                    {todayLocation?.googleMapsUrl && (
                      <div className="text-[10px] font-bold mt-1" style={{ color: 'rgba(139,92,246,0.9)' }}>📍 Abrir no Maps</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </LiquidWidget>

        {/* ── DEPARTMENT PILLS BAR ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative overflow-hidden rounded-[24px]"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px) saturate(120%)', WebkitBackdropFilter: 'blur(20px) saturate(120%)', border: '0.5px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 24px rgba(0,0,0,0.1), inset 0 0.5px 0.5px rgba(255,255,255,0.2)' }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <DepartmentPill icon={Camera}  label="Câmara"    color="#10b981" count={deptPills.find(([d]) => d === 'camera')?.[1]}    onClick={() => setCameraWidgetOpen(true)} />
                <DepartmentPill icon={Film}    label="Direção"   color="#3b82f6" count={team?.filter(m => m.group === 'Realização').length} onClick={() => setDirectionWidgetOpen(true)} />
                <DepartmentPill icon={Users}   label="Produção"  color="#ec4899" count={team?.filter(m => m.group === 'Produção').length}   onClick={() => setCrewWidgetOpen(true)} />
                <DepartmentPill icon={Shirt}   label="Figurinos" color="#f97316" count={deptPills.find(([d]) => d === 'wardrobe')?.[1]}   onClick={() => setWardrobeWidgetOpen(true)} />
                <DepartmentPill icon={Palette} label="Arte"      color="#f59e0b" count={deptPills.find(([d]) => d === 'art')?.[1]}        onClick={() => setArtWidgetOpen(true)} />
              </div>
              <StatusBadge status={todayScenes.length > 0 ? 'shooting' : 'setup'} />
            </div>
            {/* Progress bar */}
            <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${filmedPct}%` }}
                transition={{ delay: 0.5, duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute inset-y-0 left-0"
                style={{ background: 'linear-gradient(90deg, #10b981, #34d399)', boxShadow: '0 0 12px rgba(16,185,129,0.6)' }}
              />
            </div>
          </div>
        </motion.div>

        {/* ── SCENE CARDS ── */}
        <div className="space-y-3">
          {upcomingScenes.map((scene, sceneIdx) => (
            <SceneCardWithHover
              key={scene.id}
              id={scene.id}
              number={scene.number}
              title={scene.title}
              description={scene.description}
              location={scene.location}
              timeOfDay={scene.timeOfDay}
              period={scene.period}
              thumbnail={scene.thumbnail}
              color={scene.color}
              items={scene.items}
              script={scene.script}
              continuityNotes={scene.continuityNotes}
              characters={scene.characters}
              wardrobe={scene.wardrobe}
              isNext={sceneIdx === 0}
            />
          ))}
          {upcomingScenes.length === 0 && (
            <LiquidWidget>
              <div className="flex flex-col items-center py-6 gap-3">
                <Film size={32} style={{ color: 'rgba(255,255,255,0.3)' }} />
                <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>Sem cenas agendadas</p>
                <button
                  onClick={() => navigate('production')}
                  className="px-4 py-2 rounded-full text-xs font-black"
                  style={{ background: '#10b981', color: '#fff', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}
                >
                  Planear rodagem
                </button>
              </div>
            </LiquidWidget>
          )}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-3">

            {/* Chart */}
            {dailyLoadData.length > 0 && (
              <LiquidChartContainer title="Carga por Dia (Horas)">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyLoadData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`${chartId}-green`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id={`${chartId}-yellow`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id={`${chartId}-red`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(20,25,35,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}
                      formatter={(value) => [`${value}h`, 'Horas']}
                    />
                    <Bar dataKey="hours" radius={[10, 10, 0, 0]} shape={(props) => {
                      const { x, y, width, height, payload } = props;
                      const hours = payload?.hours ?? 0;
                      let gradientId = `${chartId}-green`;
                      if (hours > 10) gradientId = `${chartId}-red`;
                      else if (hours >= 8) gradientId = `${chartId}-yellow`;
                      return <rect x={x} y={y} width={width} height={height} rx={10} ry={10} fill={`url(#${gradientId})`} />;
                    }} />
                  </BarChart>
                </ResponsiveContainer>
              </LiquidChartContainer>
            )}

            {/* Elenco Principal */}
            {characters.length > 0 && (
              <LiquidWidget>
                <div className="mb-4">
                  <h3 className="text-base font-black flex items-center gap-2" style={{ color: '#ffffff' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6' }} />
                    Elenco Principal
                  </h3>
                  <p className="text-xs font-bold mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{characters.length} personagens</p>
                </div>
                <div className="space-y-2">
                  {characters.map((char, idx) => (
                    <div
                      key={char.id}
                      onClick={() => { setSelectedCharacter({ name: char.name, actor: char.actor, role: 'Personagem', scenes: char.scenes, costume: '', notes: '' }); setCharacterWidgetOpen(true); }}
                      className="rounded-[16px] p-3 flex items-center justify-between transition-all cursor-pointer active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black" style={{ background: 'rgba(139,92,246,0.18)', color: '#a78bfa', border: '0.5px solid rgba(139,92,246,0.35)', boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.2)' }}>
                          {char.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-black mb-0.5" style={{ color: '#ffffff' }}>{char.name}</div>
                          <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>{char.actor || 'Ator não definido'}</p>
                        </div>
                      </div>
                      <div className="text-sm font-black" style={{ color: '#a78bfa' }}>{char.scenes} cenas</div>
                    </div>
                  ))}
                </div>
              </LiquidWidget>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-3">

            {/* Próximas Cenas sidebar */}
            <NextScenesWidget />

            {/* Próxima Location */}
            <LiquidWidget>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <h3 className="text-sm font-black" style={{ color: '#ffffff' }}>Próxima Location</h3>
              </div>
              <div className="rounded-[18px] p-4 mb-3" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' }}>
                    <MapPin size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-black mb-1" style={{ color: '#ffffff' }}>{nextLocation?.displayName || nextLocation?.name || '—'}</div>
                    <p className="text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{nextLocation?.type || 'Exterior'}</p>
                    {nextLocation?.googleMapsUrl && (
                      <a href={nextLocation.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold" style={{ color: '#10b981' }}>📍 Abrir no Maps</a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <Sun size={14} style={{ color: '#f59e0b' }} />
                  <span>{weather.temp}°C · {weather.desc}</span>
                </div>
                {nextLocation?.status === 'confirmado' && (
                  <div className="flex items-center gap-1" style={{ color: '#10b981' }}>
                    <CheckCircle2 size={12} />
                    <span>Confirmado</span>
                  </div>
                )}
              </div>
            </LiquidWidget>

            {/* Locais hoje */}
            {(locations || []).length > 0 && (
              <LiquidWidget>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <h3 className="text-sm font-black" style={{ color: '#ffffff' }}>Locais do Projecto</h3>
                </div>
                <div className="space-y-2">
                  {(locations || []).slice(0, 5).map((loc) => (
                    <div
                      key={loc.id}
                      className="rounded-[14px] p-3 flex items-center justify-between transition-all"
                      style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="text-sm font-black mb-0.5" style={{ color: '#ffffff' }}>{loc.name}</div>
                        <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>{loc.type || 'Local'}</p>
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: loc.status === 'confirmado' ? '#10b981' : loc.status === 'pendente' ? '#f59e0b' : '#6b7280', boxShadow: `0 0 12px ${loc.status === 'confirmado' ? '#10b981' : '#6b7280'}` }} />
                    </div>
                  ))}
                </div>
              </LiquidWidget>
            )}

            {/* Acções Rápidas */}
            <LiquidWidget>
              <h3 className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: '#ffffff' }}>
                <Zap size={14} style={{ color: '#3b82f6' }} />
                Acções Rápidas
              </h3>
              <div className="space-y-2">
                {[
                  { icon: Camera, label: 'Call Sheet',    color: '#10b981', onClick: () => navigate('callsheet') },
                  { icon: Film,   label: 'Produção',      color: '#3b82f6', onClick: () => navigate('production') },
                  { icon: Users,  label: 'Equipa',        color: '#f59e0b', onClick: () => navigate('team') },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className="w-full rounded-[14px] p-3 flex items-center gap-3 transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: `1px solid ${action.color}30`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${action.color}25`, boxShadow: `0 0 8px ${action.color}30` }}>
                      <action.icon size={14} style={{ color: action.color }} />
                    </div>
                    <span className="text-xs font-bold flex-1 text-left" style={{ color: '#ffffff' }}>{action.label}</span>
                    <ArrowUpRight size={14} style={{ color: action.color }} />
                  </button>
                ))}
              </div>
            </LiquidWidget>
          </div>
        </div>
      </div>

      {/* ── WIDGETS (overlays) ── */}
      <WeatherWidget isOpen={weatherWidgetOpen} onClose={() => setWeatherWidgetOpen(false)} />
      <CharacterDetailWidget isOpen={characterWidgetOpen} onClose={() => { setCharacterWidgetOpen(false); setSelectedCharacter(null); }} character={selectedCharacter} />
      <WardrobeWidget isOpen={wardrobeWidgetOpen} onClose={() => setWardrobeWidgetOpen(false)} />
      <CrewWidget isOpen={crewWidgetOpen} onClose={() => setCrewWidgetOpen(false)} />
      <LocationWidget isOpen={locationWidgetOpen} onClose={() => setLocationWidgetOpen(false)} />
      <NextCallWidget isOpen={nextCallWidgetOpen} onClose={() => setNextCallWidgetOpen(false)} />
      <CameraWidget isOpen={cameraWidgetOpen} onClose={() => setCameraWidgetOpen(false)} />
      <DirectionWidget isOpen={directionWidgetOpen} onClose={() => setDirectionWidgetOpen(false)} />
      <ArtWidget isOpen={artWidgetOpen} onClose={() => setArtWidgetOpen(false)} />
      <SceneDetailWidget isOpen={sceneDetailWidgetOpen} onClose={() => { setSceneDetailWidgetOpen(false); setSelectedScene(null); }} scene={selectedScene} />
      <RecceWidget isOpen={recceWidgetOpen} onClose={() => setRecceWidgetOpen(false)} location={selectedLocation} />
      <ServiceSheetWidget isOpen={serviceSheetOpen} onClose={() => setServiceSheetOpen(false)} />
    </>
  );
}
