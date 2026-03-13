/**
 * WARDROBE WIDGET - Overlay Modal Centrado
 * 
 * Widget de guarda-roupa que abre em overlay centrado.
 * Comportamento similar ao WeatherWidget com backdrop blur.
 * 
 * Design: Apple Liquid Glass + Orange Gradient + Nested Corners
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Shirt, User, Package, CheckCircle2, AlertCircle } from 'lucide-react';

interface WardrobeItem {
  character: string;
  outfit: string;
  status: 'ready' | 'pending' | 'missing';
  notes?: string;
}

interface WardrobeWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WardrobeWidget({ isOpen, onClose }: WardrobeWidgetProps) {
  // Mock data - substituir com props reais
  const wardrobeData: WardrobeItem[] = [
    { character: 'Ana Silva', outfit: 'Vestido azul + casaco', status: 'ready' },
    { character: 'João Costa', outfit: 'Fato preto + gravata', status: 'ready' },
    { character: 'Maria Santos', outfit: 'Vestido vermelho', status: 'pending', notes: 'Em alteração' },
    { character: 'Pedro Lima', outfit: 'Calças jeans + t-shirt', status: 'ready' },
    { character: 'Carla Mendes', outfit: 'Saia + blusa', status: 'missing', notes: 'Falta entregar' },
  ];

  const readyCount = wardrobeData.filter(item => item.status === 'ready').length;
  const totalCount = wardrobeData.length;

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

          {/* WARDROBE CARD - Centrado */}
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
            {/* Liquid Glass Container - Orange Gradient */}
            <div
              style={{
                borderRadius: '28px',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(42, 42, 62, 0.15) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '0.5px solid rgba(249, 115, 22, 0.3)',
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

                {/* Wardrobe Header */}
                <div className="flex items-start gap-4">
                  <div
                    className="rounded-[16px] flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '64px',
                      height: '64px',
                      background: 'linear-gradient(135deg, #f97316, #ea580c)',
                      boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Shirt size={32} style={{ color: '#ffffff' }} />
                  </div>

                  <div className="flex-1">
                    <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Guarda-Roupa Hoje
                    </div>
                    <div className="text-5xl font-black mb-1" style={{ color: '#ffffff' }}>
                      {readyCount}/{totalCount}
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Figurinos prontos
                    </div>
                  </div>
                </div>
              </div>

              {/* Wardrobe List */}
              <div className="px-6 pb-6">
                <div className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Estado por Personagem
                </div>
                <div className="space-y-2">
                  {wardrobeData.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-[16px] p-4"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '0.5px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {/* Character Name + Status */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User size={14} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                          <div className="text-sm font-black" style={{ color: '#ffffff' }}>
                            {item.character}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {item.status === 'ready' && (
                            <>
                              <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                              <span className="text-xs font-bold" style={{ color: '#10b981' }}>Pronto</span>
                            </>
                          )}
                          {item.status === 'pending' && (
                            <>
                              <AlertCircle size={14} style={{ color: '#f59e0b' }} />
                              <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>Pendente</span>
                            </>
                          )}
                          {item.status === 'missing' && (
                            <>
                              <AlertCircle size={14} style={{ color: '#ef4444' }} />
                              <span className="text-xs font-bold" style={{ color: '#ef4444' }}>Falta</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Outfit Description */}
                      <div className="flex items-start gap-2 mb-1">
                        <Shirt size={12} style={{ color: '#f97316', marginTop: '2px' }} />
                        <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {item.outfit}
                        </div>
                      </div>

                      {/* Notes if any */}
                      {item.notes && (
                        <div 
                          className="mt-2 text-xs font-bold italic"
                          style={{ 
                            color: item.status === 'missing' ? '#ef4444' : '#f59e0b',
                            paddingLeft: '20px'
                          }}
                        >
                          {item.notes}
                        </div>
                      )}
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
