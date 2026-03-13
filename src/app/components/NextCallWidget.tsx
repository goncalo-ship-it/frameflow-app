/**
 * NEXT CALL WIDGET - Overlay Modal Centrado
 * 
 * Widget de próxima chamada com detalhes de cena e equipa.
 * 
 * Design: Apple Liquid Glass + Green Gradient
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, Users, Camera, Film } from 'lucide-react';

interface NextCallWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NextCallWidget({ isOpen, onClose }: NextCallWidgetProps) {
  // Mock data - substituir com API real
  const callData = {
    scene: 'Cena 12',
    description: 'Confronto no salão principal',
    time: '14:30',
    duration: '45 min',
    location: 'Salão A - Palácio',
    characters: ['Ana Silva', 'João Costa', 'Maria Santos'],
    departments: [
      { name: 'Câmara', count: 3 },
      { name: 'Som', count: 2 },
      { name: 'Luz', count: 4 },
    ],
    notes: 'Cena complexa com steadicam. Certificar que o anel está visível.',
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

          {/* CALL CARD - Centrado */}
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
            {/* Liquid Glass Container - Green Gradient */}
            <div
              style={{
                borderRadius: '28px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(42, 42, 62, 0.15) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '0.5px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
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

                {/* Call Header */}
                <div className="flex items-start gap-4">
                  <div
                    className="rounded-[16px] flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '64px',
                      height: '64px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Film size={32} style={{ color: '#ffffff' }} />
                  </div>

                  <div className="flex-1">
                    <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Próxima Chamada
                    </div>
                    <div className="text-3xl font-black mb-1" style={{ color: '#ffffff' }}>
                      {callData.scene}
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {callData.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time + Location - 2 COL */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '0.5px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Clock size={11} style={{ color: '#ffffff' }} />
                      <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Hora
                      </div>
                    </div>
                    <div className="text-2xl font-black mb-0.5" style={{ color: '#ffffff' }}>
                      {callData.time}
                    </div>
                    <div className="text-[10px] font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      {callData.duration}
                    </div>
                  </div>

                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '0.5px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin size={11} style={{ color: '#ffffff' }} />
                      <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Local
                      </div>
                    </div>
                    <div className="text-sm font-black leading-tight" style={{ color: '#ffffff' }}>
                      {callData.location}
                    </div>
                  </div>
                </div>
              </div>

              {/* Characters */}
              <div className="px-6 pb-4">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '0.5px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={14} style={{ color: '#ffffff' }} />
                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Personagens
                    </div>
                  </div>
                  <div className="space-y-2">
                    {callData.characters.map((char, index) => (
                      <div
                        key={index}
                        className="text-sm font-bold"
                        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                      >
                        • {char}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Departments */}
              <div className="px-6 pb-4">
                <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Equipas Necessárias
                </div>
                <div className="flex gap-2">
                  {callData.departments.map((dept, index) => (
                    <div
                      key={index}
                      className="rounded-full px-3 py-1.5 flex items-center gap-2"
                      style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '0.5px solid rgba(16, 185, 129, 0.4)',
                      }}
                    >
                      <span className="text-xs font-black" style={{ color: '#ffffff' }}>
                        {dept.name}
                      </span>
                      <div
                        className="rounded-full w-5 h-5 flex items-center justify-center"
                        style={{
                          background: 'rgba(16, 185, 129, 0.4)',
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

              {/* Notes */}
              <div className="px-6 pb-6">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '0.5px solid rgba(251, 191, 36, 0.3)',
                  }}
                >
                  <div className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(251, 191, 36, 0.9)' }}>
                    ⚠️ Notas
                  </div>
                  <div className="text-sm font-bold leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {callData.notes}
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
