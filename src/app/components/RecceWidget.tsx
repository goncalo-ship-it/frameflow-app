/**
 * RECCE WIDGET - Reconhecimento de Localização
 * 
 * Widget completo com fotos de recce, Google Maps, notas de produção,
 * facilities, restrições e contactos.
 * 
 * Design: Apple Liquid Glass + Purple Gradient
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Map, 
  Navigation, 
  Phone, 
  Clock, 
  AlertTriangle,
  Wifi,
  Zap,
  Car,
  Utensils,
  ShowerHead,
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User,
  Building
} from 'lucide-react';

interface ReccePhoto {
  url: string;
  caption: string;
  type: 'recce' | 'maps' | 'reference';
}

interface RecceWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  location?: {
    name: string;
    address: string;
    city: string;
    coordinates: string;
    color: string;
  };
}

export function RecceWidget({ isOpen, onClose, location }: RecceWidgetProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Mock data - substituir com props reais
  const locationData = location || {
    name: 'Palácio Nacional',
    address: 'Largo Rainha Dona Amélia',
    city: 'Sintra',
    coordinates: '38.7979° N, 9.3906° W',
    color: '#8b5cf6',
  };

  // Fotos do recce (vamos usar Unsplash para realismo)
  const reccePhotos: ReccePhoto[] = [
    {
      url: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80',
      caption: 'Vista frontal do palácio - acesso principal',
      type: 'recce',
    },
    {
      url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80',
      caption: 'Salão principal - área de filmagem',
      type: 'recce',
    },
    {
      url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
      caption: 'Jardins exteriores - plano B',
      type: 'recce',
    },
    {
      url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80',
      caption: 'Google Maps - vista aérea',
      type: 'maps',
    },
    {
      url: 'https://images.unsplash.com/photo-1549213783-8284d0336c4f?w=800&q=80',
      caption: 'Acesso traseiro - carga/descarga',
      type: 'recce',
    },
  ];

  const facilities = [
    { icon: Car, label: 'Parking 20 viaturas', available: true },
    { icon: ShowerHead, label: 'WC públicos (2)', available: true },
    { icon: Utensils, label: 'Zona de catering', available: true },
    { icon: Wifi, label: 'WiFi disponível', available: true },
    { icon: Zap, label: 'Energia 220V (15A)', available: true },
  ];

  const restrictions = [
    { text: 'Horário: 09:00-18:00 apenas', type: 'warning' },
    { text: 'Sem barulho após 17:00', type: 'warning' },
    { text: 'Proibido fumar no interior', type: 'danger' },
    { text: 'Máximo 30 pessoas simultâneas', type: 'info' },
  ];

  const contacts = [
    { name: 'Maria Santos', role: 'Responsável do Local', phone: '+351 219 237 300' },
    { name: 'João Silva', role: 'Segurança', phone: '+351 912 345 678' },
  ];

  const nextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev + 1) % reccePhotos.length);
  };

  const prevPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev - 1 + reccePhotos.length) % reccePhotos.length);
  };

  const getRestrictionColor = (type: string) => {
    switch (type) {
      case 'danger': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#64748b';
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

          {/* RECCE CARD */}
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
                      Reconhecimento
                    </div>
                    <div className="text-2xl font-black mb-1" style={{ color: '#ffffff' }}>
                      {locationData.name}
                    </div>
                    <div className="text-sm font-bold mb-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {locationData.address}
                    </div>
                    <div className="text-xs font-bold" style={{ color: 'rgba(139, 92, 246, 0.9)' }}>
                      📍 {locationData.city}
                    </div>
                  </div>
                </div>
              </div>

              {/* PHOTO GALLERY CAROUSEL */}
              <div className="px-6 pb-4">
                <div className="relative rounded-[20px] overflow-hidden" style={{ aspectRatio: '16/10' }}>
                  {/* Main Photo with INSET PADDING */}
                  <div className="absolute inset-0 p-3">
                    <div 
                      className="relative w-full h-full rounded-[14px] overflow-hidden"
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      <img
                        src={reccePhotos[selectedPhotoIndex].url}
                        alt={reccePhotos[selectedPhotoIndex].caption}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Type Badge */}
                      <div className="absolute top-3 right-3">
                        <div
                          className="rounded-full px-3 py-1 flex items-center gap-1.5"
                          style={{
                            background: reccePhotos[selectedPhotoIndex].type === 'maps' 
                              ? 'rgba(59, 130, 246, 0.9)' 
                              : 'rgba(139, 92, 246, 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: '0.5px solid rgba(255, 255, 255, 0.3)',
                          }}
                        >
                          {reccePhotos[selectedPhotoIndex].type === 'maps' ? (
                            <Map size={12} style={{ color: '#ffffff' }} />
                          ) : (
                            <Camera size={12} style={{ color: '#ffffff' }} />
                          )}
                          <span className="text-[10px] font-black" style={{ color: '#ffffff' }}>
                            {reccePhotos[selectedPhotoIndex].type === 'maps' ? 'MAPS' : 'RECCE'}
                          </span>
                        </div>
                      </div>

                      {/* Caption */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="text-sm font-black" style={{ color: '#ffffff' }}>
                          {reccePhotos[selectedPhotoIndex].caption}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={prevPhoto}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-10"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '0.5px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronLeft size={20} style={{ color: '#ffffff' }} />
                  </button>

                  <button
                    onClick={nextPhoto}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-10"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '0.5px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronRight size={20} style={{ color: '#ffffff' }} />
                  </button>

                  {/* Photo Counter */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                    <div
                      className="rounded-full px-3 py-1"
                      style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        border: '0.5px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <span className="text-xs font-black" style={{ color: '#ffffff' }}>
                        {selectedPhotoIndex + 1} / {reccePhotos.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Strip */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                  {reccePhotos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className="flex-shrink-0 rounded-[12px] overflow-hidden"
                      style={{
                        width: '60px',
                        height: '40px',
                        border: index === selectedPhotoIndex 
                          ? '2px solid #8b5cf6' 
                          : '2px solid transparent',
                        opacity: index === selectedPhotoIndex ? 1 : 0.5,
                      }}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Coordinates + Navigation */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '0.5px solid rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Navigation size={11} style={{ color: '#ffffff' }} />
                      <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        GPS
                      </div>
                    </div>
                    <div className="text-xs font-black leading-tight" style={{ color: '#ffffff' }}>
                      {locationData.coordinates}
                    </div>
                  </div>

                  <button
                    className="rounded-[14px] p-3 transition-transform active:scale-95"
                    style={{
                      background: 'rgba(59, 130, 246, 0.3)',
                      border: '0.5px solid rgba(59, 130, 246, 0.5)',
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Map size={14} style={{ color: '#3b82f6' }} />
                      <span className="text-xs font-black" style={{ color: '#3b82f6' }}>
                        ABRIR MAPS
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Facilities */}
              <div className="px-6 pb-4">
                <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Infraestruturas
                </div>
                <div className="space-y-2">
                  {facilities.map((facility, index) => (
                    <div
                      key={index}
                      className="rounded-[14px] p-3 flex items-center gap-3"
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '0.5px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: 'rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <facility.icon size={14} style={{ color: '#10b981' }} />
                      </div>
                      <div className="text-sm font-bold" style={{ color: '#ffffff' }}>
                        {facility.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Restrictions */}
              <div className="px-6 pb-4">
                <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  ⚠️ Restrições
                </div>
                <div className="space-y-2">
                  {restrictions.map((restriction, index) => (
                    <div
                      key={index}
                      className="rounded-[14px] p-3 flex items-center gap-3"
                      style={{
                        background: `${getRestrictionColor(restriction.type)}26`,
                        border: `0.5px solid ${getRestrictionColor(restriction.type)}4D`,
                      }}
                    >
                      <AlertTriangle size={14} style={{ color: getRestrictionColor(restriction.type) }} />
                      <div className="text-sm font-bold" style={{ color: '#ffffff' }}>
                        {restriction.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contacts */}
              <div className="px-6 pb-6">
                <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Contactos Locais
                </div>
                <div className="space-y-2">
                  {contacts.map((contact, index) => (
                    <div
                      key={index}
                      className="rounded-[14px] p-3"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '0.5px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                            style={{
                              background: 'rgba(139, 92, 246, 0.2)',
                            }}
                          >
                            <User size={14} style={{ color: '#ffffff' }} />
                          </div>
                          <div>
                            <div className="text-sm font-black" style={{ color: '#ffffff' }}>
                              {contact.name}
                            </div>
                            <div className="text-xs font-bold mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              {contact.role}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone size={11} style={{ color: '#8b5cf6' }} />
                              <div className="text-xs font-bold" style={{ color: '#8b5cf6' }}>
                                {contact.phone}
                              </div>
                            </div>
                          </div>
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
