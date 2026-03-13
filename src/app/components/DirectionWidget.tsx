/**
 * DIRECTION WIDGET - Departamento de Direção
 * 
 * Design: Apple Liquid Glass + Blue Gradient
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, User, Phone, MessageSquare } from 'lucide-react';

interface DirectionWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DirectionWidget({ isOpen, onClose }: DirectionWidgetProps) {
  const directionData = {
    director: {
      name: 'Sofia Mendes',
      role: 'Realizadora',
      phone: '+351 918 765 432',
      status: 'on-set',
    },
    crew: [
      { name: 'André Silva', role: '1st AD', status: 'on-set' },
      { name: 'Beatriz Costa', role: 'Script Supervisor', status: 'on-set' },
    ],
    todayNotes: [
      'Cena 12: Insistir no plano detalhe do anel',
      'Priorizar steadicam para movimento',
      'Atenção ao timing com diálogos',
    ],
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
            <div
              style={{
                borderRadius: '28px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(42, 42, 62, 0.15) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '0.5px solid rgba(59, 130, 246, 0.3)',
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
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Film size={32} style={{ color: '#ffffff' }} />
                  </div>

                  <div className="flex-1">
                    <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Departamento
                    </div>
                    <div className="text-3xl font-black mb-1" style={{ color: '#ffffff' }}>
                      Direção
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {directionData.crew.length + 1} membros
                    </div>
                  </div>
                </div>
              </div>

              {/* Director */}
              <div className="px-6 pb-4">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '0.5px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        Realizadora
                      </div>
                      <div className="text-lg font-black mb-0.5" style={{ color: '#ffffff' }}>
                        {directionData.director.name}
                      </div>
                      <div className="text-sm font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {directionData.director.role}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} style={{ color: '#ffffff' }} />
                        <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          {directionData.director.phone}
                        </div>
                      </div>
                    </div>
                    <div
                      className="rounded-full px-3 py-1"
                      style={{
                        background: 'rgba(16, 185, 129, 0.3)',
                        border: '0.5px solid rgba(16, 185, 129, 0.5)',
                      }}
                    >
                      <div className="text-[10px] font-black" style={{ color: '#ffffff' }}>
                        NO SET
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crew */}
              <div className="px-6 pb-4">
                <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Equipa
                </div>
                <div className="space-y-2">
                  {directionData.crew.map((member, index) => (
                    <div
                      key={index}
                      className="rounded-[14px] p-3 flex items-center justify-between"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '0.5px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                          }}
                        >
                          <User size={14} style={{ color: '#ffffff' }} />
                        </div>
                        <div>
                          <div className="text-sm font-black" style={{ color: '#ffffff' }}>
                            {member.name}
                          </div>
                          <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            {member.role}
                          </div>
                        </div>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: '#10b981',
                          boxShadow: '0 0 8px #10b981',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="px-6 pb-6">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '0.5px solid rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} style={{ color: '#ffffff' }} />
                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Notas de Direção Hoje
                    </div>
                  </div>
                  <div className="space-y-2">
                    {directionData.todayNotes.map((note, index) => (
                      <div key={index} className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        • {note}
                      </div>
                    ))}
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
