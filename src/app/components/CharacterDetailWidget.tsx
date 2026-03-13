/**
 * CHARACTER DETAIL WIDGET - Overlay Modal Centrado
 * 
 * Widget de detalhes de personagem que abre em overlay centrado.
 * Comportamento similar ao WeatherWidget com backdrop blur.
 * 
 * Design: Apple Liquid Glass + Purple Gradient + Nested Corners
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, MapPin, Film, Shirt, MessageSquare } from 'lucide-react';

interface CharacterDetailWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  character?: {
    name: string;
    actor: string;
    role: string;
    scenes: number;
    costume: string;
    notes: string;
  };
}

export function CharacterDetailWidget({ isOpen, onClose, character }: CharacterDetailWidgetProps) {
  // Mock data - substituir com props reais
  const charData = character || {
    name: 'Ana Silva',
    actor: 'Maria Santos',
    role: 'Protagonista',
    scenes: 12,
    costume: 'Vestido azul + casaco',
    notes: 'Maquilhagem pesada. Cabelo apanhado. Anel de casamento visível.',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP - Fecha ao clicar fora */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* CHARACTER CARD - Centrado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className="fixed left-1/2 top-1/2 z-[101] w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Liquid Glass Container - Purple Gradient */}
            <div
              style={{
                borderRadius: '28px',
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.25) 0%, rgba(42, 42, 62, 0.15) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '0.5px solid rgba(147, 51, 234, 0.3)',
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

                {/* Character Header */}
                <div className="flex items-start gap-4">
                  <div
                    className="rounded-[16px] flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '64px',
                      height: '64px',
                      background: 'linear-gradient(135deg, #9333ea, #7e22ce)',
                      boxShadow: '0 8px 24px rgba(147, 51, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <User size={32} style={{ color: '#ffffff' }} />
                  </div>

                  <div className="flex-1">
                    <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Personagem
                    </div>
                    <div className="text-3xl font-black mb-1" style={{ color: '#ffffff' }}>
                      {charData.name}
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {charData.actor}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Papel */}
                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '0.5px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Papel
                    </div>
                    <div className="text-lg font-black" style={{ color: '#ffffff' }}>
                      {charData.role}
                    </div>
                  </div>

                  {/* Cenas */}
                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '0.5px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Film size={10} style={{ color: '#ffffff' }} />
                      <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        Cenas Hoje
                      </div>
                    </div>
                    <div className="text-xl font-black" style={{ color: '#ffffff' }}>
                      {charData.scenes}
                    </div>
                  </div>
                </div>
              </div>

              {/* Costume */}
              <div className="px-6 pb-4">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '0.5px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shirt size={14} style={{ color: '#ffffff' }} />
                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Guarda-Roupa
                    </div>
                  </div>
                  <div className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {charData.costume}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="px-6 pb-6">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '0.5px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={14} style={{ color: '#ffffff' }} />
                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Notas de Produção
                    </div>
                  </div>
                  <div className="text-sm font-bold leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {charData.notes}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}