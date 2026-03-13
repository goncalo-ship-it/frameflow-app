/**
 * CREW WIDGET - Overlay Modal Centrado
 * 
 * Widget de equipa que abre em overlay centrado.
 * Comportamento similar ao WeatherWidget com backdrop blur.
 * 
 * Design: Apple Liquid Glass + Emerald Gradient + Nested Corners
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Phone, Mail, MapPin, CheckCircle2, Clock } from 'lucide-react';

interface CrewMember {
  name: string;
  role: string;
  department: string;
  phone: string;
  status: 'on-set' | 'arriving' | 'off';
  eta?: string;
}

interface CrewWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CrewWidget({ isOpen, onClose }: CrewWidgetProps) {
  // Mock data - substituir com props reais
  const crewData: CrewMember[] = [
    { name: 'João Silva', role: 'Director', department: 'Direcção', phone: '+351 912 345 678', status: 'on-set' },
    { name: 'Maria Costa', role: 'DOP', department: 'Imagem', phone: '+351 913 456 789', status: 'on-set' },
    { name: 'Pedro Santos', role: '1º AD', department: 'Assistência', phone: '+351 914 567 890', status: 'on-set' },
    { name: 'Ana Ferreira', role: 'Produtora', department: 'Produção', phone: '+351 915 678 901', status: 'arriving', eta: '10 min' },
    { name: 'Carlos Lopes', role: 'Script', department: 'Continuidade', phone: '+351 916 789 012', status: 'on-set' },
    { name: 'Sofia Almeida', role: 'Figurinista', department: 'Guarda-Roupa', phone: '+351 917 890 123', status: 'on-set' },
  ];

  const onSetCount = crewData.filter(member => member.status === 'on-set').length;
  const totalCount = crewData.length;

  // Agrupar por departamento
  const departments = [...new Set(crewData.map(member => member.department))];

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

          {/* CREW CARD - Centrado */}
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
            {/* Liquid Glass Container - Emerald Gradient */}
            <div
              style={{
                borderRadius: '28px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(42, 42, 62, 0.15) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '0.5px solid rgba(16, 185, 129, 0.3)',
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

                {/* Crew Header */}
                <div className="flex items-start gap-4">
                  <div
                    className="rounded-[16px] flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '64px',
                      height: '64px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Users size={32} style={{ color: '#ffffff' }} />
                  </div>

                  <div className="flex-1">
                    <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Equipa no Set
                    </div>
                    <div className="text-5xl font-black mb-1" style={{ color: '#ffffff' }}>
                      {onSetCount}/{totalCount}
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Membros presentes
                    </div>
                  </div>
                </div>
              </div>

              {/* Crew List */}
              <div className="px-6 pb-6">
                <div className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Equipa Técnica
                </div>
                <div className="space-y-2">
                  {crewData.map((member, index) => (
                    <div
                      key={index}
                      className="rounded-[16px] p-4"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '0.5px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {/* Name + Status */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-black" style={{ color: '#ffffff' }}>
                            {member.name}
                          </div>
                          <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            {member.role} • {member.department}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {member.status === 'on-set' && (
                            <div 
                              className="rounded-full px-2 py-1 flex items-center gap-1"
                              style={{ 
                                background: 'rgba(16, 185, 129, 0.2)',
                                border: '0.5px solid rgba(16, 185, 129, 0.5)'
                              }}
                            >
                              <CheckCircle2 size={10} style={{ color: '#10b981' }} />
                              <span className="text-[10px] font-black" style={{ color: '#10b981' }}>SET</span>
                            </div>
                          )}
                          {member.status === 'arriving' && (
                            <div 
                              className="rounded-full px-2 py-1 flex items-center gap-1"
                              style={{ 
                                background: 'rgba(245, 158, 11, 0.2)',
                                border: '0.5px solid rgba(245, 158, 11, 0.5)'
                              }}
                            >
                              <Clock size={10} style={{ color: '#f59e0b' }} />
                              <span className="text-[10px] font-black" style={{ color: '#f59e0b' }}>{member.eta}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="flex items-center gap-2 mt-2">
                        <Phone size={12} style={{ color: '#10b981' }} />
                        <a 
                          href={`tel:${member.phone}`}
                          className="text-xs font-bold"
                          style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          {member.phone}
                        </a>
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
