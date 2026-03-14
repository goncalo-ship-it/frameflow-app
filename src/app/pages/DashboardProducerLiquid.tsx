import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Film, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sun,
  Moon,
  Camera,
  Video,
  Clapperboard,
  User,
  Car,
  Sparkles,
  Package,
  Palette,
  Mic,
  Zap,
  ArrowUpRight,
  Utensils,
  ExternalLink,
  Shirt,
  Sunrise,
  Sunset
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  mockDailyLoad, 
  mockScenes, 
  mockProject, 
  mockDashboardStats, 
  mockCharacters, 
  mockLocations 
} from '../data/mockData';
import { FloatingMediaButton } from '../components/FloatingMediaButton';
import { DashboardLoadingState } from '../components/DashboardLoadingState';
import { SceneDetailModal } from '../components/SceneDetailModal';
import { WeatherWidget } from '../components/WeatherWidget';
import { CharacterDetailWidget } from '../components/CharacterDetailWidget';
import { WardrobeWidget } from '../components/WardrobeWidget';
import { CrewWidget } from '../components/CrewWidget';
import { LocationWidget } from '../components/LocationWidget';
import { NextCallWidget } from '../components/NextCallWidget';
import { CameraWidget } from '../components/CameraWidget';
import { DirectionWidget } from '../components/DirectionWidget';
import { ArtWidget } from '../components/ArtWidget';
import { SceneDetailWidget } from '../components/SceneDetailWidget';
import { RecceWidget } from '../components/RecceWidget';
import { ServiceSheetWidget } from '../components/ServiceSheetWidget';
import { SceneCardWithHover } from '../components/SceneCardWithHover';
import { NextScenesWidget } from '../components/NextScenesWidget';

/**
 * AUTHENTIC LIQUID GLASS DASHBOARD - Apple WWDC25 Style
 * Based on official Apple design language:
 * - Physical glass refraction (lensing effect)
 * - Ultra-subtle blur (20px)
 * - Minimal shadows (almost invisible)
 * - Thin borders (0.5px)
 * - Light concentration at edges
 * - Vibrancy adapts background colors
 * - Pill-shaped components
 */

// Apple Authentic Liquid Glass Widget
interface LiquidWidgetProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

function LiquidWidget({ children, className = '', interactive = false }: LiquidWidgetProps) {
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
        borderRadius: '28px', // More pill-like
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
      }}
    >
      {/* Layer 1 — Glass background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(78, 80, 88, 0.18)',
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
        }}
      />

      {/* Layer 2 — Top-edge highlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '28px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        }}
      />

      {/* Layer 3 — Border */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      />

      {/* Layer 4 — Shadow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '28px',
          boxShadow: isPressed
            ? '0 2px 8px rgba(0, 0, 0, 0.4)'
            : '0 4px 24px rgba(0, 0, 0, 0.3)',
          transition: 'box-shadow 0.2s ease',
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </motion.div>
  );
}

// Pill Button (like Apple's toolbar buttons)
function PillButton({ 
  children, 
  onClick, 
  variant = 'glass',
  color,
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  variant?: 'glass' | 'accent' | 'colored';
  color?: string;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const getBackgroundStyle = () => {
    if (variant === 'colored' && color) {
      return {
        background: color,
        boxShadow: `0 4px 16px ${color}60, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
      };
    }
    if (variant === 'accent') {
      return {
        background: '#10b981',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      };
    }
    return {
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px) saturate(120%)',
      WebkitBackdropFilter: 'blur(20px) saturate(120%)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
    };
  };

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className="relative overflow-hidden"
      style={{
        borderRadius: '20px',
        padding: '12px 20px',
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{
          borderRadius: '20px',
          ...getBackgroundStyle(),
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-2 text-sm font-semibold" style={{ 
        color: variant === 'glass' ? 'rgba(255, 255, 255, 0.9)' : '#ffffff',
      }}>
        {children}
      </div>
    </button>
  );
}

// NEW: Status Badge Component (images 69-78)
function StatusBadge({ 
  status, 
  label 
}: { 
  status: 'shooting' | 'setup' | 'delay' | 'done' | 'priority'; 
  label?: string;
}) {
  const configs = {
    shooting: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', label: 'Filmando' },
    setup: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Setup' },
    delay: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Atraso' },
    done: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: 'Completo' },
    priority: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', label: 'Prioridade' },
  };

  const config = configs[status];

  return (
    <div 
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider"
      style={{
        background: config.bg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `0.5px solid ${config.color}60`,
        color: config.color,
        boxShadow: `0 2px 8px ${config.color}30, inset 0 0.5px 0.5px rgba(255, 255, 255, 0.2)`,
      }}
    >
      <div 
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ 
          background: config.color,
          boxShadow: `0 0 6px ${config.color}, 0 0 12px ${config.color}80`,
        }}
      />
      {label || config.label}
    </div>
  );
}

// NEW: Department Pill (images 41-42)
function DepartmentPill({ 
  icon: Icon, 
  label, 
  color,
  count,
  onClick 
}: { 
  icon: any; 
  label: string; 
  color: string;
  count?: number;
  onClick?: () => void;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className="relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all cursor-pointer"
      style={{
        background: `${color}15`,
        backdropFilter: 'blur(16px) saturate(120%)',
        WebkitBackdropFilter: 'blur(16px) saturate(120%)',
        border: `0.5px solid ${color}40`,
        boxShadow: isPressed 
          ? `0 2px 8px ${color}40, inset 0 0.5px 0.5px rgba(255, 255, 255, 0.2)`
          : `0 4px 12px ${color}30, inset 0 0.5px 0.5px rgba(255, 255, 255, 0.15)`,
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
      }}
    >
      <Icon size={14} style={{ color }} />
      <span className="text-xs font-black" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
        {label}
      </span>
      {count !== undefined && (
        <div 
          className="px-1.5 py-0.5 rounded-full text-[9px] font-black min-w-[18px] text-center"
          style={{
            background: color,
            color: '#fff',
            boxShadow: `0 0 8px ${color}60`,
          }}
        >
          {count}
        </div>
      )}
    </button>
  );
}

// NEW: Glowing Action Button (images 47, 49, 50)
function GlowButton({ 
  children,
  onClick,
  color,
  icon: Icon,
}: { 
  children: React.ReactNode;
  onClick?: () => void;
  color: string;
  icon?: any;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className="relative overflow-hidden group"
      style={{
        borderRadius: '18px',
        padding: '16px 24px',
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
      }}
    >
      {/* Outer glow */}
      <div 
        className="absolute inset-0 rounded-[18px] blur-xl opacity-60"
        style={{
          background: color,
          transform: isPressed ? 'scale(0.9)' : 'scale(1)',
          transition: 'transform 0.2s ease',
        }}
      />
      
      {/* Main background with 3D depth */}
      <div 
        className="absolute inset-0 rounded-[18px]"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          boxShadow: isPressed
            ? `0 4px 20px ${color}60, inset 0 -2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.4)`
            : `0 8px 24px ${color}70, 0 2px 8px ${color}40, inset 0 -3px 12px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.5)`,
          transition: 'box-shadow 0.2s ease',
        }}
      />

      {/* Inner glow (key detail!) */}
      <div 
        className="absolute inset-0 rounded-[18px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 50% 20%, rgba(255, 255, 255, 0.5) 0%, transparent 60%)',
          mixBlendMode: 'overlay',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-2 justify-center text-base font-black" style={{ color: '#ffffff' }}>
        {Icon && <Icon size={18} />}
        {children}
      </div>
    </button>
  );
}

// Chart Container with Liquid Glass
function LiquidChartContainer({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <LiquidWidget>
      <h3 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: '#ffffff' }}>
        <div 
          className="w-1.5 h-1.5 rounded-full"
          style={{ 
            background: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }}
        />
        {title}
      </h3>
      <div 
        className="rounded-[18px] p-4"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {children}
      </div>
    </LiquidWidget>
  );
}

export function DashboardProducerLiquid() {
  
  // Stable gradient IDs for recharts SVG defs — unique per component instance
  const chartId = useMemo(() => `ffdailyload-${Math.random().toString(36).slice(2)}`, []);
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(true); // New: theme toggle
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  );
  const [expandedScenes, setExpandedScenes] = useState<number[]>([0]); // First scene expanded by default
  const [sceneModalOpen, setSceneModalOpen] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(true);
  const [weatherWidgetOpen, setWeatherWidgetOpen] = useState(false);
  const [characterWidgetOpen, setCharacterWidgetOpen] = useState(false);
  const [wardrobeWidgetOpen, setWardrobeWidgetOpen] = useState(false);
  const [crewWidgetOpen, setCrewWidgetOpen] = useState(false);
  const [locationWidgetOpen, setLocationWidgetOpen] = useState(false);
  const [nextCallWidgetOpen, setNextCallWidgetOpen] = useState(false);
  const [cameraWidgetOpen, setCameraWidgetOpen] = useState(false);
  const [directionWidgetOpen, setDirectionWidgetOpen] = useState(false);
  const [artWidgetOpen, setArtWidgetOpen] = useState(false);
  const [sceneDetailWidgetOpen, setSceneDetailWidgetOpen] = useState(false);
  const [recceWidgetOpen, setRecceWidgetOpen] = useState(false);
  const [serviceSheetOpen, setServiceSheetOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [selectedScene, setSelectedScene] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const toggleScene = (sceneIdx: number) => {
    setExpandedScenes(prev => {
      if (prev.includes(sceneIdx)) {
        // COLLAPSE EM CASCATA: Se colapsar 1, colapsa TUDO
        return [];
      } else {
        // EXPAND: Só abre este
        return [sceneIdx];
      }
    });
  };

  // Mock scene data for the modal
  const sceneDetailData = {
    number: '05',
    title: 'Guarda-Roupa',
    location: 'Set Principal - Estúdio A',
    time: 'Interior / Dia',
    description: 'A equipa de guarda-roupa prepara os figurinos para a próxima cena. Três personagens principais discutem os detalhes dos trajes enquanto fazem ajustes de última hora.',
    script: [
      '[A porta do guarda-roupa abre-se]',
      'SOFIA: Precisamos de ter tudo pronto em 30 minutos.',
      'MIGUEL: O casaco do protagonista ainda não está ajustado.',
      'SOFIA: Então temos de trabalhar rápido. Ana, traz a máquina de costura.',
      'ANA: Já estou nisso! Onde está o tecido de reserva?',
      '[Som de tecidos e movimento apressado]',
      'MIGUEL: Aqui. Vamos conseguir terminar a tempo.',
    ],
    myRole: {
      department: 'Produtor Executivo',
      responsibilities: [
        'Garantir que todos os figurinos estão aprovados e dentro do orçamento',
        'Coordenar com o departamento de guarda-roupa e diretor de fotografia',
        'Verificar timeline e assegurar que a cena está pronta para filmagem',
        'Comunicar com assistente de direção sobre o estado da preparação',
      ],
      notes: '⚠️ CRÍTICO: Esta cena tem de ser filmada até às 15h00 devido à disponibilidade do estúdio. Confirmar com DOP sobre a iluminação às 13h30.',
    },
    characters: ['Sofia (Coordenadora)', 'Miguel (Assistente)', 'Ana (Costureira)'],
    props: ['Máquina de costura', 'Tecidos variados', 'Manequins', 'Espelhos', 'Caixas de adereços'],
  };

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load background from localStorage
  useEffect(() => {
    const savedBg = localStorage.getItem('dashboard-background');
    console.log('🎨 Dashboard - Loading background:', savedBg ? 'Found' : 'Not found');
    if (savedBg) {
      setBackgroundImage(savedBg);
      console.log('✅ Background set:', savedBg.substring(0, 50) + '...');
    }
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('dashboard-theme');
    setIsDarkTheme(savedTheme !== 'bright');
    
    // Listen for changes from Settings
    const handleStorageChange = () => {
      const savedBg = localStorage.getItem('dashboard-background');
      console.log('🔄 Background updated event received');
      setBackgroundImage(savedBg);
    };
    
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem('dashboard-theme');
      setIsDarkTheme(savedTheme !== 'bright');
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('background-updated', handleStorageChange);
    window.addEventListener('theme-updated', handleThemeChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('background-updated', handleStorageChange);
      window.removeEventListener('theme-updated', handleThemeChange);
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setBackgroundImage(imageUrl);
        localStorage.setItem('dashboard-background', imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearBackground = () => {
    setBackgroundImage(null);
    localStorage.removeItem('dashboard-background');
  };

  if (isLoading) return <DashboardLoadingState />;

  const today = new Date().toLocaleDateString('pt-PT', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Mock upcoming scenes data - ENHANCED com thumbs, guião, notas
  const upcomingScenes = [
    {
      id: '02A',
      number: '02A',
      title: 'Sala de Reunião',
      description: 'Equipa de produção discute o orçamento e planeamento da semana.',
      location: 'Estúdio Principal - Sala 3',
      timeOfDay: 'INT' as const,
      period: 'DIA' as const,
      color: '#10b981',
      thumbnail: 'https://images.unsplash.com/photo-1633431303895-8236f0a04b46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300',
      items: [
        { title: 'Traje Formal', type: 'Guarda-Roupa' as const, status: 'confirmed' as const },
        { title: 'Documentos Prop', type: 'Adereço' as const, status: 'pending' as const },
        { title: 'Mesa de Reunião', type: 'Arte' as const, status: 'ready' as const },
      ],
      script: [
        'MARIA entra na sala com uma pasta cheia de documentos.',
        'MARIA: Bom dia a todos. Temos muito por onde começar.',
        'JOÃO: O orçamento está apertado esta semana.',
        'MARIA: Sei. Vamos ter de ser criativos.',
      ],
      continuityNotes: [
        'Maria usa casaco cinzento (continuidade da cena anterior)',
        'Relógio de parede marca 14:30',
        'Café nas chávenas ainda fumega',
      ],
      characters: ['Maria (Produtora)', 'João (Assistente)', 'Ana (Coordenadora)'],
      wardrobe: ['Traje formal cinzento', 'Camisa branca', 'Sapatos pretos'],
    },
    {
      id: '03B',
      number: '03B',
      title: 'Exterior Cidade',
      description: 'Protagonista caminha pela rua movimentada ao fim do dia.',
      location: 'Rua da Prata, Lisboa',
      timeOfDay: 'EXT' as const,
      period: 'ANOITECER' as const,
      color: '#f59e0b',
      thumbnail: 'https://images.unsplash.com/photo-1701353588669-d1dee04895c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300',
      items: [
        { title: 'Casaco Casual', type: 'Guarda-Roupa' as const, status: 'confirmed' as const },
        { title: 'Mochila Prop', type: 'Adereço' as const, status: 'confirmed' as const },
      ],
      script: [
        '[SOM de trânsito ao fundo]',
        'PEDRO caminha distraído, olhando para o telemóvel.',
        'Uma MULHER esbarra nele.',
        'MULHER: Desculpe!',
        'PEDRO (sem olhar): Não faz mal.',
      ],
      continuityNotes: [
        'Pedro usa auriculares brancos',
        'Mochila preta às costas',
        'Sol poente - golden hour obrigatório',
      ],
      characters: ['Pedro (Protagonista)', 'Transeuntes (Figuração)'],
      wardrobe: ['Casaco azul escuro', 'Calças jeans', 'Ténis brancos', 'Mochila preta'],
    },
    {
      id: '04C',
      number: '04C',
      title: 'Café Noturno',
      description: 'Encontro tenso entre dois amigos que não se vêem há anos.',
      location: 'Café Vintage - Bairro Alto',
      timeOfDay: 'INT' as const,
      period: 'NOITE' as const,
      color: '#ef4444',
      thumbnail: 'https://images.unsplash.com/photo-1731313181496-3e3aeb1addf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300',
      items: [
        { title: 'Roupa Casual Noite', type: 'Guarda-Roupa' as const, status: 'pending' as const },
        { title: 'Xícara e Pires', type: 'Prop' as const, status: 'confirmed' as const },
        { title: 'Decoração Vintage', type: 'Arte' as const, status: 'ready' as const },
      ],
      script: [
        'LUÍS está sentado, mexendo nervosamente na chávena.',
        'SOFIA entra. Pausa. Olhares cruzam-se.',
        'SOFIA: Olá, Luís.',
        'LUÍS (tenso): Quanto tempo...',
        'SOFIA senta-se lentamente.',
        'SOFIA: Três anos. Três anos e meio, para ser exacta.',
      ],
      continuityNotes: [
        'Luís tem cicatriz visível na mão direita',
        'Sofia usa colar de prata (importante para flashback)',
        'Café servido mas não bebido durante a cena',
        'Luz ambiente quente - CRITICAL para mood',
      ],
      characters: ['Luís (Protagonista)', 'Sofia (Ex-namorada)', 'Empregado (Fundo)'],
      wardrobe: ['Camisa preta (Luís)', 'Vestido verde escuro (Sofia)', 'Colar de prata (Sofia)'],
    },
  ];

  return (
    <>
      <div className="max-w-[1600px] mx-auto relative p-4">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        <div className="lg:col-span-2 space-y-3">

        {/* O MEU DIA - Contextual Widget */}
        <LiquidWidget>
          <div className="space-y-3">
            {/* Header com nome, data e hora */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[30px] font-semibold tracking-tight mb-1" style={{
                  color: '#ffffff',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}>
                  O TEU DIA
                </h1>
                <p className="text-sm font-normal flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  <span>{today}</span>
                  <span>•</span>
                  <span>{mockProject.name}</span>
                </p>
              </div>
              
              {/* Time */}
              <div 
                className="text-5xl font-black tabular-nums"
                style={{ 
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
                }}
              >
                {currentTime}
              </div>
            </div>

            {/* SERVICE SHEET BUTTON - NOVO! */}
            <button
              onClick={() => setServiceSheetOpen(true)}
              className="w-full rounded-[16px] p-4 transition-transform active:scale-95"
              style={{
                background: 'rgba(59, 130, 246, 0.13)',
                backdropFilter: 'blur(20px) saturate(120%)',
                WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                border: '0.5px solid rgba(59, 130, 246, 0.40)',
                boxShadow: '0 0 24px rgba(59, 130, 246, 0.2), inset 0 0.5px 0.5px rgba(255, 255, 255, 0.2)',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <Calendar size={20} style={{ color: '#ffffff' }} />
                <span className="text-base font-black" style={{ color: '#ffffff' }}>
                  📋 FOLHA DE SERVIÇO DO DIA
                </span>
              </div>
            </button>

            {/* Info Grid - Meteorologia, Próxima Chamada, Sol */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Meteorologia */}
              <div 
                onClick={() => setWeatherWidgetOpen(true)}
                className="rounded-[16px] p-4 relative overflow-hidden cursor-pointer transition-transform active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '0.5px solid rgba(59, 130, 246, 0.30)',
                      boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Sun className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Meteorologia
                    </div>
                    <div className="text-2xl font-black mb-0.5" style={{ color: '#ffffff' }}>
                      18°C
                    </div>
                    <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Parcialmente nublado
                    </div>
                  </div>
                </div>
                {/* Sunrise/Sunset */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sunrise size={14} style={{ color: '#fbbf24' }} />
                    <span className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>07:24</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sunset size={14} style={{ color: '#f97316' }} />
                    <span className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>18:42</span>
                  </div>
                </div>
              </div>

              {/* Próxima Chamada */}
              <div 
                onClick={() => setNextCallWidgetOpen(true)}
                className="rounded-[16px] p-4 relative overflow-hidden cursor-pointer transition-transform active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '0.5px solid rgba(16, 185, 129, 0.30)',
                      boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Próxima Chamada
                    </div>
                    <div className="text-2xl font-black mb-0.5" style={{ color: '#ffffff' }}>
                      14:30
                    </div>
                    <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Cena 02A • Sala Reunião
                    </div>
                  </div>
                </div>
              </div>

              {/* Nascer/Pôr do Sol */}
              {/* Próxima Localização */}
              <div 
                onClick={() => {
                  setSelectedLocation({
                    name: 'Palácio Nacional',
                    address: 'Largo Rainha Dona Amélia',
                    city: 'Sintra',
                    coordinates: '38.7979° N, 9.3906° W',
                    color: '#8b5cf6',
                  });
                  setRecceWidgetOpen(true);
                }}
                className="rounded-[16px] p-4 relative overflow-hidden cursor-pointer transition-transform active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.1))',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(139, 92, 246, 0.15)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '0.5px solid rgba(139, 92, 246, 0.30)',
                      boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Próxima Localização
                    </div>
                    <div className="text-lg font-black mb-0.5" style={{ color: '#ffffff' }}>
                      Palácio Nacional
                    </div>
                    <div className="text-xs font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Sintra • 35 min
                    </div>
                    <div className="text-[10px] font-bold" style={{ color: 'rgba(139, 92, 246, 0.9)' }}>
                      📍 Abrir no Maps
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </LiquidWidget>

        {/* NEW: DEPARTMENT PILLS BAR + STATUS (images 41-42, 69-78) */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative overflow-hidden rounded-[24px]"
          style={{
            background: 'rgba(78, 80, 88, 0.18)',
            backdropFilter: 'blur(20px) saturate(120%)',
            WebkitBackdropFilter: 'blur(20px) saturate(120%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between gap-3 mb-0">
              <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <DepartmentPill icon={Camera} label="Câmera" color="#10b981" count={8} onClick={() => setCameraWidgetOpen(true)} />
                <DepartmentPill icon={Film} label="Direção" color="#3b82f6" count={3} onClick={() => setDirectionWidgetOpen(true)} />
                <DepartmentPill icon={Users} label="Produção" color="#ec4899" count={12} onClick={() => setCrewWidgetOpen(true)} />
                <DepartmentPill icon={Shirt} label="Figurinos" color="#f97316" count={5} onClick={() => setWardrobeWidgetOpen(true)} />
                <DepartmentPill icon={Zap} label="Arte" color="#f59e0b" count={5} onClick={() => setArtWidgetOpen(true)} />
              </div>
              <StatusBadge status="shooting" />
            </div>
          </div>
        </motion.div>

        {/* PRÓXIMAS CENAS - NEW MAGICAL CARDS WITH HOVER */}
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
        </div>

            {/* CHART - Bar Chart */}
            <LiquidChartContainer title="Carga por Dia (Horas)">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mockDailyLoad} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`${chartId}-green`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id={`${chartId}-yellow`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id={`${chartId}-red`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(20, 25, 35, 0.9)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    }}
                    formatter={(value: number) => [`${value}h`, 'Horas']}
                  />
                  <Bar 
                    dataKey="hours" 
                    radius={[10, 10, 0, 0]}
                    shape={(props: any) => {
                      const { x, y, width, height, payload } = props;
                      const hours = payload?.hours ?? 0;
                      let gradientId = `${chartId}-green`;
                      if (hours > 10) gradientId = `${chartId}-red`;
                      else if (hours >= 8) gradientId = `${chartId}-yellow`;
                      return (
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          rx={10}
                          ry={10}
                          fill={`url(#${gradientId})`}
                        />
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </LiquidChartContainer>

            {/* ELENCO - Liquid list */}
            <LiquidWidget>
              <div className="mb-4">
                <h3 className="text-base font-black flex items-center gap-2" style={{ color: '#ffffff' }}>
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ 
                      background: '#8b5cf6',
                      boxShadow: '0 0 8px #8b5cf6',
                    }}
                  />
                  Elenco Principal
                </h3>
                <p className="text-xs font-bold mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {Object.keys(mockCharacters).length} personagens
                </p>
              </div>
              <div className="space-y-2">
                {Object.values(mockCharacters).slice(0, 4).map((char, idx) => (
                  <div
                    key={char.id}
                    onClick={() => {
                      setSelectedCharacter(char);
                      setCharacterWidgetOpen(true);
                    }}
                    className="rounded-[16px] p-3 flex items-center justify-between transition-all cursor-pointer active:scale-95"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                        style={{ 
                          background: 'rgba(139, 92, 246, 0.18)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          color: '#a78bfa',
                          border: '0.5px solid rgba(139, 92, 246, 0.35)',
                          boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        {char.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-black mb-0.5" style={{ color: '#ffffff' }}>
                          {char.name}
                        </div>
                        <p className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          {char.actor}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-black" style={{ color: '#a78bfa' }}>
                      {char.scenes}
                    </div>
                  </div>
                ))}
              </div>
            </LiquidWidget>
          </div>

          {/* RIGHT COLUMN - Sidebar */}
          <div className="space-y-3">
            
            {/* PRÓXIMAS CENAS */}
            <NextScenesWidget />
            
            {/* PRÓXIMA LOCATION FÍSICA */}
            <LiquidWidget>
              <div className="flex items-center gap-2 mb-4">
                <div 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ 
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981',
                  }}
                />
                <h3 className="text-sm font-black" style={{ color: '#ffffff' }}>
                  Próxima Location
                </h3>
              </div>
              
              {/* Location card */}
              <div
                className="rounded-[18px] p-4 mb-3"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <MapPin size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-black mb-1" style={{ color: '#ffffff' }}>
                      Quinta do Vale
                    </div>
                    <p className="text-xs font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Exterior / Dia
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      <Clock size={12} />
                      <span>14:30 - 18:00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather/Info */}
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  <Sun size={14} style={{ color: '#f59e0b' }} />
                  <span>23°C · Sol</span>
                </div>
                <div className="flex items-center gap-1" style={{ color: '#10b981' }}>
                  <CheckCircle2 size={12} />
                  <span>Confirmado</span>
                </div>
              </div>
            </LiquidWidget>

            {/* REFEIÇÕES & EMENTA - Agregado */}
            <LiquidWidget>
              <div className="flex items-center gap-2 mb-4">
                <div 
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ 
                    background: '#f59e0b',
                    boxShadow: '0 0 8px #f59e0b',
                  }}
                />
                <h3 className="text-sm font-black" style={{ color: '#ffffff' }}>
                  Refeições & A Seguir
                </h3>
              </div>
              
              <div className="space-y-3">
                {/* Almoço Clickable */}
                <button
                  onClick={() => {
                    window.open('https://maps.google.com/?q=Restaurante+O+Páteo,+Lisboa', '_blank');
                  }}
                  className="rounded-[16px] p-4 w-full text-left transition-all active:scale-[0.97] cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(249, 115, 22, 0.1))',
                    border: '1px solid rgba(251, 146, 60, 0.3)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(251, 146, 60, 0.15)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '0.5px solid rgba(251, 146, 60, 0.30)',
                        boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <Utensils className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black" style={{ color: '#fb923c' }}>
                          13:00
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(251, 146, 60, 0.2)', color: '#fb923c' }}>
                          EM 45 MIN
                        </span>
                      </div>
                      <div className="text-sm font-black mb-1" style={{ color: '#ffffff' }}>
                        Almoço • O Páteo
                      </div>
                      <div className="text-xs font-bold flex items-center gap-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        <MapPin className="w-3 h-3" />
                        Rua da Esperança, 108
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: '#fb923c' }} />
                  </div>
                </button>

                {/* Próxima Cena - sem link */}
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.10), rgba(5, 150, 105, 0.07))',
                    border: '0.5px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '0.5px solid rgba(16, 185, 129, 0.30)',
                        boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <Film className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black" style={{ color: '#10b981' }}>
                          14:30
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                          PRÓXIMA
                        </span>
                      </div>
                      <div className="text-sm font-black mb-1" style={{ color: '#ffffff' }}>
                        Cena 02A • Sala de Reunião
                      </div>
                      <div className="text-xs font-bold flex items-center gap-1 mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        <MapPin className="w-3 h-3" />
                        Interior / Dia
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                          Confirmado
                        </div>
                        <div className="text-[10px] font-bold" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Director • Câmara • Som
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Próximo Evento */}
                <button
                  onClick={() => {
                    window.open('https://maps.google.com/?q=Rua+Augusta,+Lisboa', '_blank');
                  }}
                  className="rounded-[16px] p-4 w-full text-left transition-all active:scale-[0.97] cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '0.5px solid rgba(59, 130, 246, 0.30)',
                        boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black" style={{ color: '#3b82f6' }}>
                          17:00
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                          DEPOIS
                        </span>
                      </div>
                      <div className="text-sm font-black mb-1" style={{ color: '#ffffff' }}>
                        Cena 04C • Café
                      </div>
                      <div className="text-xs font-bold flex items-center gap-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        <MapPin className="w-3 h-3" />
                        Exterior / Noite
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} />
                  </div>
                </button>
              </div>
            </LiquidWidget>
            <LiquidWidget>
              <div className="flex items-center gap-2 mb-4">
                <div 
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ 
                    background: '#10b981',
                    boxShadow: '0 0 12px #10b981',
                  }}
                />
                <h3 className="text-sm font-black" style={{ color: '#ffffff' }}>
                  A Seguir
                </h3>
              </div>
              
              <div className="space-y-3">
                {/* Almoço */}
                <button
                  onClick={() => {
                    window.open('https://maps.google.com/?q=Restaurante+O+Páteo,+Lisboa', '_blank');
                  }}
                  className="rounded-[16px] p-4 w-full text-left transition-all active:scale-[0.97] cursor-pointer relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(249, 115, 22, 0.1))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(251, 146, 60, 0.3)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(251, 146, 60, 0.15)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '0.5px solid rgba(251, 146, 60, 0.30)',
                        boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <Utensils className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black" style={{ color: '#fb923c' }}>
                          13:00
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(251, 146, 60, 0.2)', color: '#fb923c' }}>
                          EM 45 MIN
                        </span>
                      </div>
                      <div className="text-sm font-black mb-1" style={{ color: '#ffffff' }}>
                        Almoço • O Páteo
                      </div>
                      <div className="text-xs font-bold flex items-center gap-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        <MapPin className="w-3 h-3" />
                        Rua da Esperança, 108
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: '#fb923c' }} />
                  </div>
                </button>

                {/* Próxima Cena - sem link */}
                <div
                  className="rounded-[16px] p-4"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.10), rgba(5, 150, 105, 0.07))',
                    border: '0.5px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '0.5px solid rgba(16, 185, 129, 0.30)',
                        boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <Film className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black" style={{ color: '#10b981' }}>
                          14:30
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                          PRÓXIMA
                        </span>
                      </div>
                      <div className="text-sm font-black mb-1" style={{ color: '#ffffff' }}>
                        Cena 02A • Sala de Reunião
                      </div>
                      <div className="text-xs font-bold flex items-center gap-1 mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        <MapPin className="w-3 h-3" />
                        Interior / Dia
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                          Confirmado
                        </div>
                        <div className="text-[10px] font-bold" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Director • Câmara • Som
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Próximo Evento */}
                <button
                  onClick={() => {
                    window.open('https://maps.google.com/?q=Rua+Augusta,+Lisboa', '_blank');
                  }}
                  className="rounded-[16px] p-4 w-full text-left transition-all active:scale-[0.97] cursor-pointer relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '0.5px solid rgba(59, 130, 246, 0.30)',
                        boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black" style={{ color: '#3b82f6' }}>
                          17:00
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                          DEPOIS
                        </span>
                      </div>
                      <div className="text-sm font-black mb-1" style={{ color: '#ffffff' }}>
                        Cena 04C • Café
                      </div>
                      <div className="text-xs font-bold flex items-center gap-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        <MapPin className="w-3 h-3" />
                        Exterior / Noite
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} />
                  </div>
                </button>
              </div>
            </LiquidWidget>
            
            {/* LOCAIS */}
            <LiquidWidget>
              <div className="flex items-center gap-2 mb-4">
                <div 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ 
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981',
                  }}
                />
                <h3 className="text-sm font-black" style={{ color: '#ffffff' }}>
                  Locais Hoje
                </h3>
              </div>
              <div className="space-y-2">
                {Object.values(mockLocations).slice(0, 5).map((loc, idx) => (
                  <div
                    key={loc.id}
                    className="rounded-[14px] p-3 flex items-center justify-between transition-all"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="text-sm font-black mb-0.5" style={{ color: '#ffffff' }}>
                        {loc.name}
                      </div>
                      <p className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {loc.scenes} cenas
                      </p>
                    </div>
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ 
                        background: loc.status === 'confirmed' ? '#10b981' : 
                                    loc.status === 'pending' ? '#f59e0b' : '#ef4444',
                        boxShadow: `0 0 12px ${
                          loc.status === 'confirmed' ? '#10b981' : 
                          loc.status === 'pending' ? '#f59e0b' : '#ef4444'
                        }`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </LiquidWidget>

            {/* PÓS-PRODUÇÃO */}
            <LiquidWidget>
              <div className="flex items-center gap-2 mb-4">
                <div 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ 
                    background: '#8b5cf6',
                    boxShadow: '0 0 8px #8b5cf6',
                  }}
                />
                <h3 className="text-sm font-black" style={{ color: '#ffffff' }}>
                  Pós-Produção
                </h3>
              </div>
              <div className="space-y-2">
                {[
                  { title: 'Episódio 01', status: 'Em Edição', progress: 65, color: '#3b82f6' },
                  { title: 'Episódio 02', status: 'Som', progress: 40, color: '#10b981' },
                  { title: 'Episódio 03', status: 'Cor', progress: 85, color: '#f59e0b' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-[14px] p-3"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-black" style={{ color: '#ffffff' }}>
                        {item.title}
                      </div>
                      <div className="text-xs font-bold" style={{ color: item.color }}>
                        {item.progress}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                        <div 
                          className="h-full transition-all"
                          style={{ 
                            width: `${item.progress}%`,
                            background: `linear-gradient(90deg, ${item.color}, ${item.color})`,
                            boxShadow: `0 0 8px ${item.color}60`,
                          }}
                        />
                      </div>
                      <div className="text-[10px] font-bold" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </LiquidWidget>

            {/* QUICK ACTIONS */}
            <LiquidWidget>
              <h3 className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: '#ffffff' }}>
                <Zap size={14} style={{ color: '#3b82f6' }} />
                Acções Rápidas
              </h3>
              <div className="space-y-2">
                {[
                  { icon: Camera, label: 'Call Sheet', color: '#10b981', onClick: undefined },
                  { icon: Video, label: 'Dailies', color: '#3b82f6', onClick: undefined },
                  { icon: Film, label: 'Ver Cena', color: '#f59e0b', onClick: () => setSceneModalOpen(true) },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className="w-full rounded-[14px] p-3 flex items-center gap-3 transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${action.color}30`,
                      boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.15)`,
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ 
                        background: `${action.color}25`,
                        boxShadow: `0 0 8px ${action.color}30`,
                      }}
                    >
                      <action.icon size={14} style={{ color: action.color }} />
                    </div>
                    <span className="text-xs font-bold flex-1 text-left" style={{ color: '#ffffff' }}>
                      {action.label}
                    </span>
                    <ArrowUpRight size={14} style={{ color: action.color }} />
                  </button>
                ))}
              </div>
            </LiquidWidget>
          </div>
        </div>
      </div>

      {/* SCENE DETAIL MODAL */}
      <SceneDetailModal 
        isOpen={sceneModalOpen}
        onClose={() => setSceneModalOpen(false)}
        scene={sceneDetailData}
      />

      {/* WEATHER WIDGET - Overlay Modal */}
      <WeatherWidget 
        isOpen={weatherWidgetOpen}
        onClose={() => setWeatherWidgetOpen(false)}
      />

      {/* CHARACTER DETAIL WIDGET - Overlay Modal */}
      <CharacterDetailWidget 
        isOpen={characterWidgetOpen}
        onClose={() => {
          setCharacterWidgetOpen(false);
          setSelectedCharacter(null);
        }}
        character={selectedCharacter ? {
          name: selectedCharacter.name,
          actor: selectedCharacter.actor,
          role: 'Protagonista',
          scenes: selectedCharacter.scenes,
          costume: 'Vestido azul + casaco',
          notes: 'Maquilhagem pesada. Cabelo apanhado. Anel de casamento visível.',
        } : undefined}
      />

      {/* WARDROBE WIDGET - Overlay Modal */}
      <WardrobeWidget 
        isOpen={wardrobeWidgetOpen}
        onClose={() => setWardrobeWidgetOpen(false)}
      />

      {/* CREW WIDGET - Overlay Modal */}
      <CrewWidget 
        isOpen={crewWidgetOpen}
        onClose={() => setCrewWidgetOpen(false)}
      />

      {/* LOCATION WIDGET - Overlay Modal */}
      <LocationWidget 
        isOpen={locationWidgetOpen}
        onClose={() => setLocationWidgetOpen(false)}
      />

      {/* NEXT CALL WIDGET - Overlay Modal */}
      <NextCallWidget 
        isOpen={nextCallWidgetOpen}
        onClose={() => setNextCallWidgetOpen(false)}
      />

      {/* CAMERA WIDGET - Overlay Modal */}
      <CameraWidget 
        isOpen={cameraWidgetOpen}
        onClose={() => setCameraWidgetOpen(false)}
      />

      {/* DIRECTION WIDGET - Overlay Modal */}
      <DirectionWidget 
        isOpen={directionWidgetOpen}
        onClose={() => setDirectionWidgetOpen(false)}
      />

      {/* ART WIDGET - Overlay Modal */}
      <ArtWidget 
        isOpen={artWidgetOpen}
        onClose={() => setArtWidgetOpen(false)}
      />

      {/* SCENE DETAIL WIDGET - Overlay Modal */}
      <SceneDetailWidget 
        isOpen={sceneDetailWidgetOpen}
        onClose={() => setSceneDetailWidgetOpen(false)}
        scene={selectedScene}
      />

      {/* RECCE WIDGET - Overlay Modal */}
      <RecceWidget 
        isOpen={recceWidgetOpen}
        onClose={() => setRecceWidgetOpen(false)}
        location={selectedLocation}
      />

      {/* SERVICE SHEET WIDGET - Overlay Modal */}
      <ServiceSheetWidget 
        isOpen={serviceSheetOpen}
        onClose={() => setServiceSheetOpen(false)}
      />

      {/* FLOATING MEDIA BUTTON - Bottom right */}
      <FloatingMediaButton />
    </>
  );
}