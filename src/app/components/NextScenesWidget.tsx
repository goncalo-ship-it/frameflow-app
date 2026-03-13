/**
 * 🎬 PRÓXIMAS CENAS WIDGET
 * 
 * Módulo colapsável que mostra as próximas 3 cenas do dia
 * Bebe dados do mesmo source que ServiceSheetWidget
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, MapPin } from 'lucide-react';
// figma asset removed — use thumbnail from props or null
const imgScene1: string | null = null;

interface SceneCardData {
  id: string;
  number: string;
  title: string;
  description: string;
  time: string;
  intExt: 'INT' | 'EXT';
  timeOfDay: 'DIA' | 'NOITE' | 'AMANHECER' | 'ANOITECER';
  location: string;
  thumbnail?: string;
  badge?: string;
}

interface NextScenesWidgetProps {
  scenes?: SceneCardData[];
  defaultCollapsed?: boolean;
}

export function NextScenesWidget({ 
  scenes = DEFAULT_SCENES, 
  defaultCollapsed = true 
}: NextScenesWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div
      className="rounded-[20px] overflow-hidden relative"
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px) saturate(120%)',
        WebkitBackdropFilter: 'blur(20px) saturate(120%)',
        border: '0.5px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(255, 255, 255, 0.08), inset 0 0.5px 0.5px rgba(255, 255, 255, 0.25)',
      }}
    >
      {/* Lensing effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '20px',
          background: 'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(255, 255, 255, 0.10) 0%, transparent 50%)',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Header - Clicável */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="relative z-10 w-full px-5 py-4 flex items-center justify-between transition-all group"
        style={{
          borderBottom: isCollapsed ? 'none' : '0.5px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              boxShadow: '0 2px 12px rgba(139, 92, 246, 0.4)',
            }}
          >
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <h3 className="text-[15px] font-black text-[var(--fb-text-primary)] tracking-tight">
              Próximas Cenas
            </h3>
            <p className="text-[9px] text-[var(--fb-text-tertiary)] uppercase tracking-wider font-medium">
              {scenes.length} cenas agendadas
            </p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          <ChevronDown 
            className="w-5 h-5" 
            style={{ color: 'var(--fb-text-tertiary)' }} 
          />
        </motion.div>
      </button>

      {/* Content - Animado */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative z-10 overflow-hidden"
          >
            <div className="p-3 space-y-3">
              {scenes.map((scene, index) => (
                <SceneCard key={scene.id} scene={scene} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Scene Card Component ──
function SceneCard({ scene, index }: { scene: SceneCardData; index: number }) {
  return (
    <div
      className="rounded-[16px] overflow-hidden relative group cursor-pointer"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '0.5px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Content */}
      <div className="relative z-10 p-4 flex gap-3">
        {/* Thumbnail com nested corners */}
        <div
          className="flex-shrink-0 w-24 h-24 rounded-[14px] overflow-hidden relative"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          {scene.thumbnail && (
            <img
              src={scene.thumbnail}
              alt={scene.title}
              className="w-full h-full object-cover"
            />
          )}
          {/* Scene Number Badge */}
          <div
            className="absolute top-2 left-2 px-2 py-1 rounded-md text-[11px] font-black"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#ffffff',
            }}
          >
            {scene.number}
          </div>
          {/* Badge opcional (PROX, etc) */}
          {scene.badge && (
            <div
              className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-black"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
              }}
            >
              {scene.badge}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h4 className="text-[14px] font-black text-[var(--fb-text-primary)] tracking-tight mb-1 truncate">
              {scene.title}
            </h4>
            <p className="text-[11px] text-[var(--fb-text-secondary)] line-clamp-2 mb-2">
              {scene.description}
            </p>
          </div>

          {/* Badges inline */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* INT/EXT Badge */}
            <span
              className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide"
              style={{
                background: scene.intExt === 'INT' 
                  ? 'rgba(59, 130, 246, 0.18)' 
                  : 'rgba(16, 185, 129, 0.18)',
                color: scene.intExt === 'INT' ? '#3b82f6' : '#10b981',
              }}
            >
              {scene.intExt}
            </span>

            {/* DIA/NOITE Badge */}
            <span
              className="px-2 py-0.5 rounded-md text-[9px] font-black"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--fb-text-tertiary)',
              }}
            >
              {scene.timeOfDay}
            </span>

            {/* Location */}
            <div className="flex items-center gap-1 text-[10px] text-[var(--fb-text-tertiary)]">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{scene.location}</span>
            </div>
          </div>
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 flex items-center">
          <div
            className="w-8 h-8 rounded-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            <ChevronDown 
              className="w-4 h-4 -rotate-90" 
              style={{ color: 'var(--fb-text-tertiary)' }} 
            />
          </div>
        </div>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          borderRadius: '16px',
          boxShadow: 'inset 0 0 0 0.5px rgba(16, 185, 129, 0.3)',
        }}
      />
    </div>
  );
}

// ── Default Data (mesmos dados do ServiceSheetWidget) ──
const DEFAULT_SCENES: SceneCardData[] = [
  {
    id: 'scene-1',
    number: '02A',
    title: '02A - Sala de Reunião',
    description: 'Equipa de produção discute o orçamento e planeamento da semana.',
    time: '09:00',
    intExt: 'INT',
    timeOfDay: 'DIA',
    location: 'Estúdio Principal - Sala 3',
    thumbnail: imgScene1,
    badge: 'PROX',
  },
  {
    id: 'scene-2',
    number: '03B',
    title: '03B - Exterior Cidade',
    description: 'Protagonista caminha pela rua movimentada ao fim do dia.',
    time: '13:00',
    intExt: 'EXT',
    timeOfDay: 'ANOITECER',
    location: 'Rua da Prata, Lisboa',
  },
  {
    id: 'scene-3',
    number: '04C',
    title: '04C - Café Noturno',
    description: 'Encontro tenso entre dois amigos que não se vêem há anos.',
    time: '15:00',
    intExt: 'INT',
    timeOfDay: 'NOITE',
    location: 'Café Vintage - Bairro Alto',
  },
];
