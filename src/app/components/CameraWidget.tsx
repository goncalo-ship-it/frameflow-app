/**
 * CAMERA WIDGET - Departamento de Câmera
 * 
 * Widget com detalhes do departamento de câmera.
 * 
 * Design: Apple Liquid Glass + Green Gradient
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, User, Phone, Film, Package } from 'lucide-react';

interface CameraWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CameraWidget({ isOpen, onClose }: CameraWidgetProps) {
  // Mock data - substituir com API real
  const cameraData = {
    chief: {
      name: 'Pedro Almeida',
      role: 'Director de Fotografia',
      phone: '+351 912 345 678',
      status: 'on-set',
    },
    crew: [
      { name: 'Carlos Silva', role: '1st AC', status: 'on-set' },
      { name: 'Ana Costa', role: '2nd AC', status: 'on-set' },
      { name: 'João Martins', role: 'Steadicam Op', status: 'on-set' },
      { name: 'Rita Santos', role: 'DIT', status: 'on-set' },
      { name: 'Miguel Rocha', role: 'Gaffer', status: 'prep' },
      { name: 'Sofia Lima', role: 'Key Grip', status: 'on-set' },
      { name: 'Tiago Pereira', role: 'Best Boy', status: 'on-set' },
    ],
    equipment: [
      { name: 'ARRI Alexa Mini LF', status: 'in-use' },
      { name: 'Cooke S7/i Lenses', status: 'in-use' },
      { name: 'Steadicam', status: 'standby' },
      { name: 'DJI Ronin 2', status: 'standby' },
    ],
    todayScenes: 8,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-set': return '#10b981';
      case 'prep': return '#f59e0b';
      case 'in-use': return '#3b82f6';
      case 'standby': return '#64748b';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on-set': return 'No Set';
      case 'prep': return 'Preparação';
      case 'in-use': return 'Em Uso';
      case 'standby': return 'Standby';
      default: return status;
    }
  };

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
            className="fixed inset-0 z-[100]"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* CAMERA CARD */}
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
                    <Camera size={32} style={{ color: '#ffffff' }} />
                  </div>

                  <div className="flex-1">
                    <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Departamento
                    </div>
                    <div className="text-3xl font-black mb-1" style={{ color: '#ffffff' }}>
                      Câmera
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {cameraData.crew.length + 1} membros • {cameraData.todayScenes} cenas hoje
                    </div>
                  </div>
                </div>
              </div>

              {/* Chief */}
              <div className="px-6 pb-4">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '0.5px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        Responsável
                      </div>
                      <div className="text-lg font-black mb-0.5" style={{ color: '#ffffff' }}>
                        {cameraData.chief.name}
                      </div>
                      <div className="text-sm font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {cameraData.chief.role}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} style={{ color: '#ffffff' }} />
                        <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          {cameraData.chief.phone}
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

              {/* Crew List */}
              <div className="px-6 pb-4">
                <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Equipa
                </div>
                <div className="space-y-2">
                  {cameraData.crew.map((member, index) => (
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
                            background: 'rgba(16, 185, 129, 0.2)',
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

              {/* Equipment */}
              <div className="px-6 pb-6">
                <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Equipamento
                </div>
                <div className="space-y-2">
                  {cameraData.equipment.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-[14px] p-3 flex items-center justify-between"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '0.5px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Package size={14} style={{ color: '#ffffff' }} />
                        <div className="text-sm font-bold" style={{ color: '#ffffff' }}>
                          {item.name}
                        </div>
                      </div>
                      <div
                        className="rounded-full px-2.5 py-1"
                        style={{
                          background: `${getStatusColor(item.status)}33`,
                          border: `0.5px solid ${getStatusColor(item.status)}`,
                        }}
                      >
                        <div className="text-[9px] font-black" style={{ color: getStatusColor(item.status) }}>
                          {getStatusLabel(item.status).toUpperCase()}
                        </div>
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
