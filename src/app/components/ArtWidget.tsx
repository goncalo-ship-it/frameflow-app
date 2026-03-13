/**
 * ART WIDGET - Departamento de Arte
 * 
 * Design: Apple Liquid Glass + Orange Gradient
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, User, Phone, Palette } from 'lucide-react';

interface ArtWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArtWidget({ isOpen, onClose }: ArtWidgetProps) {
  const artData = {
    chief: {
      name: 'Helena Rodrigues',
      role: 'Diretora de Arte',
      phone: '+351 915 432 198',
    },
    crew: [
      { name: 'Rui Teixeira', role: 'Set Decorator', status: 'on-set' },
      { name: 'Inês Marques', role: 'Props Master', status: 'on-set' },
      { name: 'Fernando Dias', role: 'Art Assistant', status: 'prep' },
      { name: 'Carla Mendes', role: 'Buyer', status: 'off-set' },
    ],
    todaySetups: [
      { location: 'Salão A', description: 'Decoração de festa', status: 'complete' },
      { location: 'Quarto Principal', description: 'Reset para cena noturna', status: 'in-progress' },
      { location: 'Jardim', description: 'Preparação flores', status: 'pending' },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return '#10b981';
      case 'in-progress': return '#f59e0b';
      case 'pending': return '#64748b';
      case 'on-set': return '#10b981';
      case 'prep': return '#f59e0b';
      case 'off-set': return '#64748b';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete': return 'Completo';
      case 'in-progress': return 'Em Curso';
      case 'pending': return 'Pendente';
      case 'on-set': return 'No Set';
      case 'prep': return 'Preparação';
      case 'off-set': return 'Fora';
      default: return status;
    }
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
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(42, 42, 62, 0.15) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '0.5px solid rgba(245, 158, 11, 0.3)',
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
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      boxShadow: '0 8px 24px rgba(245, 158, 11, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Zap size={32} style={{ color: '#ffffff' }} />
                  </div>

                  <div className="flex-1">
                    <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Departamento
                    </div>
                    <div className="text-3xl font-black mb-1" style={{ color: '#ffffff' }}>
                      Arte
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {artData.crew.length + 1} membros • {artData.todaySetups.length} setups
                    </div>
                  </div>
                </div>
              </div>

              {/* Chief */}
              <div className="px-6 pb-4">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '0.5px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    Responsável
                  </div>
                  <div className="text-lg font-black mb-0.5" style={{ color: '#ffffff' }}>
                    {artData.chief.name}
                  </div>
                  <div className="text-sm font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {artData.chief.role}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} style={{ color: '#ffffff' }} />
                    <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {artData.chief.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Today Setups */}
              <div className="px-6 pb-4">
                <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Setups Hoje
                </div>
                <div className="space-y-2">
                  {artData.todaySetups.map((setup, index) => (
                    <div
                      key={index}
                      className="rounded-[14px] p-3"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '0.5px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="text-sm font-black" style={{ color: '#ffffff' }}>
                          {setup.location}
                        </div>
                        <div
                          className="rounded-full px-2 py-0.5"
                          style={{
                            background: `${getStatusColor(setup.status)}33`,
                            border: `0.5px solid ${getStatusColor(setup.status)}`,
                          }}
                        >
                          <div className="text-[9px] font-black" style={{ color: getStatusColor(setup.status) }}>
                            {getStatusLabel(setup.status).toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {setup.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crew */}
              <div className="px-6 pb-6">
                <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Equipa
                </div>
                <div className="space-y-2">
                  {artData.crew.map((member, index) => (
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
                            background: 'rgba(245, 158, 11, 0.2)',
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
                          background: getStatusColor(member.status),
                          boxShadow: `0 0 8px ${getStatusColor(member.status)}`,
                        }}
                      />
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
