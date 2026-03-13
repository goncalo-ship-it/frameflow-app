/**
 * SCENE DETAIL WIDGET - Detalhes completos da cena
 * 
 * Widget com todos os detalhes de uma cena específica.
 * NOVO: Sistema de TAKES com Good/Bad marking + estatísticas
 * 
 * Design: Apple Liquid Glass com cor dinâmica baseada na cena
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Clock, MapPin, Users, Camera, Shirt, MessageSquare, AlertCircle, Check, XIcon, Play, BarChart3 } from 'lucide-react';

interface Take {
  number: number;
  timestamp: string;
  status: 'good' | 'bad' | 'pending';
  note?: string;
}

interface SceneDetailWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  scene?: {
    id: string;
    title: string;
    description: string;
    time: string;
    duration: string;
    location: string;
    color: string;
    characters: string[];
    departments: { name: string; count: number }[];
    equipment: string[];
    wardrobe: string[];
    notes: string[];
    priority: 'high' | 'medium' | 'low';
  };
}

export function SceneDetailWidget({ isOpen, onClose, scene }: SceneDetailWidgetProps) {
  // TAKES STATE
  const [takes, setTakes] = useState<Take[]>([
    { number: 1, timestamp: '14:32', status: 'bad', note: 'Problema de som' },
    { number: 2, timestamp: '14:38', status: 'bad', note: 'Timing errado' },
    { number: 3, timestamp: '14:45', status: 'good' },
    { number: 4, timestamp: '14:52', status: 'good' },
  ]);
  const [currentTake, setCurrentTake] = useState(5);
  const [isRecording, setIsRecording] = useState(false);

  // Use scene data from props (com fallback silencioso para desenvolvimento)
  const sceneData = scene || {
    id: '02A',
    title: 'Confronto no salão',
    description: 'Ana confronta João sobre o segredo revelado',
    time: '14:30',
    duration: '45 min',
    location: 'Salão A - Palácio',
    color: '#3b82f6',
    characters: ['Ana Silva', 'João Costa'],
    departments: [
      { name: 'Câmara', count: 3 },
      { name: 'Som', count: 2 },
      { name: 'Luz', count: 4 },
    ],
    equipment: ['Steadicam', 'Wireless Mics (2x)', 'Kino Flo (4x)'],
    wardrobe: ['Ana: Vestido azul + casaco', 'João: Fato cinzento'],
    notes: [
      'Cena complexa com steadicam para movimento fluido',
      'Anel de casamento da Ana deve estar sempre visível',
      'Atenção ao timing - diálogos sobrepostos na última fala',
    ],
    priority: 'high',
  };

  console.log('🎬 SceneDetailWidget render:', { isOpen, sceneData });

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { color: '#ef4444', label: 'Alta Prioridade', icon: '🔴' };
      case 'medium':
        return { color: '#f59e0b', label: 'Média Prioridade', icon: '🟡' };
      case 'low':
        return { color: '#10b981', label: 'Baixa Prioridade', icon: '🟢' };
      default:
        return { color: '#64748b', label: 'Normal', icon: '⚪' };
    }
  };

  const priorityConfig = getPriorityConfig(sceneData.priority);

  // TAKES FUNCTIONS
  const startRecording = () => {
    setIsRecording(true);
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    setTakes([...takes, { number: currentTake, timestamp, status: 'pending' }]);
  };

  const markTake = (takeNumber: number, status: 'good' | 'bad', note?: string) => {
    setTakes(takes.map(take => 
      take.number === takeNumber ? { ...take, status, note } : take
    ));
    if (status === 'good' || status === 'bad') {
      setIsRecording(false);
      setCurrentTake(currentTake + 1);
    }
  };

  const cancelTake = (takeNumber: number) => {
    setTakes(takes.filter(take => take.number !== takeNumber));
    setIsRecording(false);
  };

  // STATS
  const goodTakes = takes.filter(t => t.status === 'good').length;
  const badTakes = takes.filter(t => t.status === 'bad').length;
  const totalTakes = takes.length;
  const successRate = totalTakes > 0 ? Math.round((goodTakes / totalTakes) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110]"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* SCENE CARD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className="fixed left-1/2 top-1/2 z-[111] w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                borderRadius: '28px',
                background: `linear-gradient(135deg, ${sceneData.color}40 0%, rgba(42, 42, 62, 0.15) 100%)`,
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: `0.5px solid ${sceneData.color}4D`,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                maxHeight: '85vh',
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '0.5px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                </button>

                <div className="flex items-start gap-4">
                  <div
                    className="rounded-[16px] flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '64px',
                      height: '64px',
                      background: `linear-gradient(135deg, ${sceneData.color}, ${sceneData.color}DD)`,
                      boxShadow: `0 8px 24px ${sceneData.color}66, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
                    }}
                  >
                    <Film size={32} style={{ color: '#ffffff' }} />
                  </div>

                  <div className="flex-1">
                    <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Cena {sceneData.id}
                    </div>
                    <div className="text-2xl font-black mb-1" style={{ color: '#ffffff' }}>
                      {sceneData.title}
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {sceneData.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* TAKES STATS - NOVO! */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-4 gap-2">
                  {/* Total Takes */}
                  <div
                    className="rounded-[14px] p-3 text-center"
                    style={{
                      background: `${sceneData.color}26`,
                      border: `0.5px solid ${sceneData.color}4D`,
                    }}
                  >
                    <div className="text-2xl font-black" style={{ color: '#ffffff' }}>
                      {totalTakes}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Total
                    </div>
                  </div>

                  {/* Good Takes */}
                  <div
                    className="rounded-[14px] p-3 text-center"
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '0.5px solid rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <div className="text-2xl font-black" style={{ color: '#10b981' }}>
                      {goodTakes}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'rgba(16, 185, 129, 0.8)' }}>
                      Bons
                    </div>
                  </div>

                  {/* Bad Takes */}
                  <div
                    className="rounded-[14px] p-3 text-center"
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '0.5px solid rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    <div className="text-2xl font-black" style={{ color: '#ef4444' }}>
                      {badTakes}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'rgba(239, 68, 68, 0.8)' }}>
                      Maus
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div
                    className="rounded-[14px] p-3 text-center"
                    style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '0.5px solid rgba(59, 130, 246, 0.4)',
                    }}
                  >
                    <div className="text-2xl font-black" style={{ color: '#3b82f6' }}>
                      {successRate}%
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'rgba(59, 130, 246, 0.8)' }}>
                      Taxa
                    </div>
                  </div>
                </div>
              </div>

              {/* RECORD/MARK TAKES - NOVO! */}
              <div className="px-6 pb-4">
                {!isRecording ? (
                  /* START RECORDING BUTTON */
                  <button
                    onClick={startRecording}
                    className="w-full rounded-[16px] p-4 transition-transform active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      border: '0.5px solid rgba(239, 68, 68, 0.5)',
                      boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full animate-pulse"
                        style={{
                          background: '#ffffff',
                          boxShadow: '0 0 20px #ffffff',
                        }}
                      />
                      <span className="text-lg font-black" style={{ color: '#ffffff' }}>
                        GRAVAR TAKE #{currentTake}
                      </span>
                    </div>
                  </button>
                ) : (
                  /* MARK GOOD/BAD BUTTONS */
                  <div className="space-y-3">
                    {/* Recording Indicator */}
                    <div
                      className="rounded-[16px] p-3 flex items-center justify-center gap-2"
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '0.5px solid rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{
                          background: '#ef4444',
                          boxShadow: '0 0 12px #ef4444',
                        }}
                      />
                      <span className="text-sm font-black" style={{ color: '#ef4444' }}>
                        🎬 A GRAVAR TAKE #{currentTake}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* GOOD TAKE */}
                      <button
                        onClick={() => markTake(currentTake, 'good')}
                        className="rounded-[16px] p-4 transition-transform active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          border: '0.5px solid rgba(16, 185, 129, 0.5)',
                          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Check size={28} style={{ color: '#ffffff', strokeWidth: 3 }} />
                          <span className="text-sm font-black" style={{ color: '#ffffff' }}>
                            BOM TAKE
                          </span>
                        </div>
                      </button>

                      {/* BAD TAKE */}
                      <button
                        onClick={() => markTake(currentTake, 'bad')}
                        className="rounded-[16px] p-4 transition-transform active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          border: '0.5px solid rgba(239, 68, 68, 0.5)',
                          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <XIcon size={28} style={{ color: '#ffffff', strokeWidth: 3 }} />
                          <span className="text-sm font-black" style={{ color: '#ffffff' }}>
                            MAU TAKE
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Cancel */}
                    <button
                      onClick={() => cancelTake(currentTake)}
                      className="w-full rounded-[14px] p-2 transition-transform active:scale-95"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '0.5px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <span className="text-xs font-black" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        CANCELAR
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* TAKES HISTORY - NOVO! */}
              <div className="px-6 pb-4">
                <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Histórico de Takes
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {takes.slice().reverse().map((take) => (
                    <motion.div
                      key={take.number}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-[14px] p-3 flex items-center justify-between"
                      style={{
                        background: take.status === 'good' 
                          ? 'rgba(16, 185, 129, 0.15)' 
                          : take.status === 'bad'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: take.status === 'good'
                          ? '0.5px solid rgba(16, 185, 129, 0.3)'
                          : take.status === 'bad'
                          ? '0.5px solid rgba(239, 68, 68, 0.3)'
                          : '0.5px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            background: take.status === 'good'
                              ? '#10b981'
                              : take.status === 'bad'
                              ? '#ef4444'
                              : '#64748b',
                          }}
                        >
                          {take.status === 'good' ? (
                            <Check size={16} style={{ color: '#ffffff', strokeWidth: 3 }} />
                          ) : take.status === 'bad' ? (
                            <XIcon size={16} style={{ color: '#ffffff', strokeWidth: 3 }} />
                          ) : (
                            <Play size={14} style={{ color: '#ffffff' }} />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-black" style={{ color: '#ffffff' }}>
                            Take #{take.number}
                          </div>
                          <div className="text-[10px] font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            {take.timestamp} {take.note && `• ${take.note}`}
                          </div>
                        </div>
                      </div>
                      <div
                        className="text-[9px] font-black uppercase px-2 py-1 rounded-full"
                        style={{
                          background: take.status === 'good'
                            ? 'rgba(16, 185, 129, 0.3)'
                            : take.status === 'bad'
                            ? 'rgba(239, 68, 68, 0.3)'
                            : 'rgba(100, 116, 139, 0.3)',
                          color: take.status === 'good'
                            ? '#10b981'
                            : take.status === 'bad'
                            ? '#ef4444'
                            : '#64748b',
                        }}
                      >
                        {take.status === 'good' ? '✓ BOM' : take.status === 'bad' ? '✗ MAU' : '⏺ REC'}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Priority Badge */}
              {sceneData.priority === 'high' && (
                <div className="px-6 pb-4">
                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '0.5px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} style={{ color: '#ef4444' }} />
                      <div className="text-sm font-black" style={{ color: '#ef4444' }}>
                        {priorityConfig.icon} {priorityConfig.label}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Time + Location */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: `${sceneData.color}26`,
                      border: `0.5px solid ${sceneData.color}4D`,
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Clock size={11} style={{ color: '#ffffff' }} />
                      <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Hora
                      </div>
                    </div>
                    <div className="text-xl font-black mb-0.5" style={{ color: '#ffffff' }}>
                      {sceneData.time}
                    </div>
                    <div className="text-[10px] font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      {sceneData.duration}
                    </div>
                  </div>

                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: `${sceneData.color}26`,
                      border: `0.5px solid ${sceneData.color}4D`,
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin size={11} style={{ color: '#ffffff' }} />
                      <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Local
                      </div>
                    </div>
                    <div className="text-sm font-black leading-tight" style={{ color: '#ffffff' }}>
                      {sceneData.location}
                    </div>
                  </div>
                </div>
              </div>

              {/* Characters */}
              <div className="px-6 pb-4">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '0.5px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={14} style={{ color: '#ffffff' }} />
                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Personagens
                    </div>
                  </div>
                  <div className="space-y-2">
                    {sceneData.characters.map((char, index) => (
                      <div key={index} className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        • {char}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Equipment */}
              <div className="px-6 pb-4">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '0.5px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Camera size={14} style={{ color: '#ffffff' }} />
                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Equipamento
                    </div>
                  </div>
                  <div className="space-y-2">
                    {sceneData.equipment.map((item, index) => (
                      <div key={index} className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        • {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Wardrobe */}
              <div className="px-6 pb-4">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '0.5px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Shirt size={14} style={{ color: '#ffffff' }} />
                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Guarda-Roupa
                    </div>
                  </div>
                  <div className="space-y-2">
                    {sceneData.wardrobe.map((item, index) => (
                      <div key={index} className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        • {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="px-6 pb-4">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '0.5px solid rgba(251, 191, 36, 0.3)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} style={{ color: '#ffffff' }} />
                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: 'rgba(251, 191, 36, 0.9)' }}>
                      ⚠️ Notas Importantes
                    </div>
                  </div>
                  <div className="space-y-2">
                    {sceneData.notes.map((note, index) => (
                      <div key={index} className="text-sm font-bold leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        • {note}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Departments Pills */}
              <div className="px-6 pb-6">
                <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Equipas Necessárias
                </div>
                <div className="flex gap-2 flex-wrap">
                  {sceneData.departments.map((dept, index) => (
                    <div
                      key={index}
                      className="rounded-full px-3 py-1.5 flex items-center gap-2"
                      style={{
                        background: `${sceneData.color}33`,
                        border: `0.5px solid ${sceneData.color}66`,
                      }}
                    >
                      <span className="text-xs font-black" style={{ color: '#ffffff' }}>
                        {dept.name}
                      </span>
                      <div
                        className="rounded-full w-5 h-5 flex items-center justify-center"
                        style={{
                          background: `${sceneData.color}66`,
                        }}
                      >
                        <span className="text-[10px] font-black" style={{ color: '#ffffff' }}>
                          {dept.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}