/**
 * WEATHER WIDGET - Overlay Modal Centrado
 * 
 * SIMPLIFICADO - SEM SCROLL
 * Temperatura + Sensação/Visibilidade inline + Vento/Humidade + Sunrise/Sunset + Marés compactas
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Wind, Droplets, Sunrise, Sunset, Waves } from 'lucide-react';

interface WeatherWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeatherWidget({ isOpen, onClose }: WeatherWidgetProps) {
  // Mock data - substituir com API real
  const weatherData = {
    current: {
      temp: 18,
      condition: 'Parcialmente nublado',
      icon: Sun,
      location: 'Lisboa, Portugal',
      feelsLike: 16,
      humidity: 65,
      windSpeed: 12,
      visibility: 10,
      sunrise: '07:24',
      sunset: '18:42',
    },
    tides: [
      { type: 'high', time: '08:15', height: '3.2m' },
      { type: 'low', time: '14:30', height: '0.8m' },
      { type: 'high', time: '20:45', height: '3.1m' },
    ],
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

          {/* WEATHER CARD - Centrado */}
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
            {/* Liquid Glass Container - Blue Gradient */}
            <div
              style={{
                borderRadius: '28px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(42, 42, 62, 0.15) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '0.5px solid rgba(59, 130, 246, 0.3)',
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

                {/* Current Weather */}
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
                    <Sun size={32} style={{ color: '#ffffff' }} />
                  </div>

                  <div className="flex-1">
                    <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      {weatherData.current.location}
                    </div>
                    <div className="text-5xl font-black mb-1" style={{ color: '#ffffff' }}>
                      {weatherData.current.temp}°
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {weatherData.current.condition}
                    </div>
                    {/* SENSAÇÃO + VISIBILIDADE - INLINE */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Sensação {weatherData.current.feelsLike}°
                      </div>
                      <div className="w-px h-3" style={{ background: 'rgba(255, 255, 255, 0.3)' }} />
                      <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Vis. {weatherData.current.visibility}km
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vento + Humidade - 2 COL */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '0.5px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Wind size={11} style={{ color: '#ffffff' }} />
                      <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Vento
                      </div>
                    </div>
                    <div className="text-2xl font-black" style={{ color: '#ffffff' }}>
                      {weatherData.current.windSpeed} <span className="text-sm font-bold">km/h</span>
                    </div>
                  </div>

                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '0.5px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Droplets size={11} style={{ color: '#ffffff' }} />
                      <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Humidade
                      </div>
                    </div>
                    <div className="text-2xl font-black" style={{ color: '#ffffff' }}>
                      {weatherData.current.humidity}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Sunrise/Sunset - 2 COL */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: 'rgba(251, 191, 36, 0.15)',
                      border: '0.5px solid rgba(251, 191, 36, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Sunrise size={11} style={{ color: '#ffffff' }} />
                      <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Nascer
                      </div>
                    </div>
                    <div className="text-2xl font-black" style={{ color: '#ffffff' }}>
                      {weatherData.current.sunrise}
                    </div>
                  </div>

                  <div
                    className="rounded-[14px] p-3"
                    style={{
                      background: 'rgba(249, 115, 22, 0.15)',
                      border: '0.5px solid rgba(249, 115, 22, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Sunset size={11} style={{ color: '#ffffff' }} />
                      <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Pôr do Sol
                      </div>
                    </div>
                    <div className="text-2xl font-black" style={{ color: '#ffffff' }}>
                      {weatherData.current.sunset}
                    </div>
                  </div>
                </div>
              </div>

              {/* Marés - COMPACTAS NO FIM */}
              <div className="px-6 pb-6">
                <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Marés em Lisboa
                </div>
                <div className="flex gap-2">
                  {weatherData.tides.map((tide, index) => (
                    <div
                      key={index}
                      className="rounded-[12px] px-3 py-2 flex-1"
                      style={{
                        background: tide.type === 'high' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        border: tide.type === 'high' ? '0.5px solid rgba(59, 130, 246, 0.3)' : '0.5px solid rgba(100, 116, 139, 0.3)',
                      }}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Waves size={10} style={{ color: '#ffffff' }} />
                        <div className="text-[9px] font-black uppercase" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          {tide.type === 'high' ? 'Alta' : 'Baixa'}
                        </div>
                      </div>
                      <div className="text-sm font-black" style={{ color: '#ffffff' }}>
                        {tide.time}
                      </div>
                      <div className="text-[10px] font-bold" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {tide.height}
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
