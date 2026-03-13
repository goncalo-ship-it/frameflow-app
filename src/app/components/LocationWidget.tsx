/**
 * LOCATION WIDGET - Overlay Modal Centrado
 * 
 * Widget de próxima localização que abre em overlay centrado.
 * Comportamento similar aos outros widgets com backdrop blur.
 * 
 * Design: Apple Liquid Glass + Purple Gradient + Maps Integration
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Navigation, Clock, Phone, User } from 'lucide-react';

interface LocationWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationWidget({ isOpen, onClose }: LocationWidgetProps) {
  // Mock data - substituir com props reais
  const locationData = {
    name: 'Palácio Nacional de Sintra',
    address: 'Largo Rainha Dona Amélia, 2710-616 Sintra',
    distance: '28.5 km',
    duration: '35 min',
    parking: 'Estacionamento público disponível',
    contact: {
      person: 'João Silva',
      role: 'Responsável de Produção',
      phone: '+351 912 345 678',
    },
    notes: 'Autorização confirmada. Chegar 30 min antes para setup. Proibido filmar nas salas 3 e 4.',
    scenes: ['Cena 12', 'Cena 15', 'Cena 18'],
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

          {/* LOCATION CARD - Centrado */}
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
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(42, 42, 62, 0.15) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '0.5px solid rgba(139, 92, 246, 0.3)',
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

                {/* Location Header */}
                <div className="flex items-start gap-4">
                  <div
                    className="rounded-[16px] flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '64px',
                      height: '64px',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      boxShadow: '0 8px 24px rgba(139, 92, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <MapPin size={32} style={{ color: '#ffffff' }} />
                  </div>

                  <div className="flex-1">
                    <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Próxima Localização
                    </div>
                    <div className="text-2xl font-black mb-1 leading-tight" style={{ color: '#ffffff' }}>
                      {locationData.name}
                    </div>
                    <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {locationData.address}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Distância */}
                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: 'rgba(139, 92, 246, 0.15)',
                      border: '0.5px solid rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Navigation size={11} style={{ color: '#8b5cf6' }} />
                      <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Distância
                      </div>
                    </div>
                    <div className="text-2xl font-black" style={{ color: '#ffffff' }}>
                      {locationData.distance}
                    </div>
                  </div>

                  {/* Tempo */}
                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: 'rgba(139, 92, 246, 0.15)',
                      border: '0.5px solid rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Clock size={11} style={{ color: '#8b5cf6' }} />
                      <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Tempo
                      </div>
                    </div>
                    <div className="text-2xl font-black" style={{ color: '#ffffff' }}>
                      {locationData.duration}
                    </div>
                  </div>
                </div>
              </div>

              {/* Maps Button */}
              <div className="px-6 pb-4">
                <button
                  onClick={() => {
                    // Abrir Google Maps (substituir com link real)
                    window.open(`https://maps.google.com/?q=${encodeURIComponent(locationData.address)}`, '_blank');
                  }}
                  className="w-full rounded-[16px] p-4 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    border: '0.5px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Navigation size={18} style={{ color: '#ffffff' }} />
                  <span className="text-sm font-black" style={{ color: '#ffffff' }}>
                    Abrir no Maps
                  </span>
                </button>
              </div>

              {/* Contact */}
              <div className="px-6 pb-4">
                <div
                  className="rounded-[16px] p-4"
                  style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '0.5px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User size={14} style={{ color: '#8b5cf6' }} />
                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Contacto no Local
                    </div>
                  </div>
                  <div className="text-sm font-black mb-1" style={{ color: '#ffffff' }}>
                    {locationData.contact.person}
                  </div>
                  <div className="text-xs font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {locationData.contact.role}
                  </div>
                  <a
                    href={`tel:${locationData.contact.phone}`}
                    className="flex items-center gap-2"
                  >
                    <Phone size={12} style={{ color: '#8b5cf6' }} />
                    <span className="text-xs font-bold" style={{ color: '#8b5cf6' }}>
                      {locationData.contact.phone}
                    </span>
                  </a>
                </div>
              </div>

              {/* Scenes */}
              <div className="px-6 pb-4">
                <div className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Cenas Nesta Localização
                </div>
                <div className="flex gap-2">
                  {locationData.scenes.map((scene, index) => (
                    <div
                      key={index}
                      className="rounded-full px-3 py-1.5"
                      style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        border: '0.5px solid rgba(139, 92, 246, 0.4)',
                      }}
                    >
                      <span className="text-xs font-black" style={{ color: '#ffffff' }}>
                        {scene}
                      </span>
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
                    ⚠️ Notas Importantes
                  </div>
                  <div className="text-sm font-bold leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {locationData.notes}
                  </div>
                </div>
              </div>

              {/* Parking Info */}
              <div className="px-6 pb-6">
                <div
                  className="rounded-[14px] p-3"
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '0.5px solid rgba(139, 92, 246, 0.2)',
                  }}
                >
                  <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    🅿️ {locationData.parking}
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
