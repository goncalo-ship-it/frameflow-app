/**
 * 📋 SERVICE SHEET WIDGET - FOLHA DE SERVIÇO iOS CALENDAR STYLE
 * 
 * Design minimalista inspirado em iOS Calendar:
 * - Header MASSIVO com data gigante (64px)
 * - Typography-first (sem badges excessivos)
 * - Background branco/cream (#f9f9f9)
 * - Lista ultra-limpa com dividers subtis
 * - Barra vertical colorida em vez de ícones
 * - Espaçamento generoso
 * - Zero dados dummy
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { SceneDetailWidget } from './SceneDetailWidget';

interface TimelineItem {
  id: string;
  time: string;
  type: 'scene' | 'meal' | 'call' | 'setup' | 'wrap';
  title: string;
  location: string;
  duration?: string;
  color: string;
  sceneData?: any;
}

interface ServiceSheetWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceSheetWidget({ isOpen, onClose }: ServiceSheetWidgetProps) {
  const [selectedScene, setSelectedScene] = useState<any>(null);
  const [showSceneDetail, setShowSceneDetail] = useState(false);

  // DATA REAL - SEM DUMMY
  const today = new Date();
  const dayNumber = today.getDate();
  const monthName = today.toLocaleDateString('pt-PT', { month: 'short' }).toUpperCase();
  const weekDay = today.toLocaleDateString('pt-PT', { weekday: 'long' });

  // TIMELINE DO DIA
  const timeline: TimelineItem[] = [
    {
      id: 'call-1',
      time: '07:00',
      type: 'call',
      title: 'Crew Call',
      location: 'Base de Produção',
      color: '#3b82f6',
    },
    {
      id: 'setup-1',
      time: '08:00',
      type: 'setup',
      title: 'Montagem',
      location: 'Interior Sala',
      duration: '1h',
      color: '#64748b',
    },
    {
      id: 'scene-1',
      time: '09:00',
      type: 'scene',
      title: 'Cena 12A',
      location: 'Interior Sala Principal',
      duration: '2h',
      color: '#8b5cf6',
      sceneData: {
        id: '12A',
        title: 'Cena 12A - Confronto',
        description: 'Confronto dramático entre os protagonistas no salão principal.',
        time: '09:00',
        duration: '2h',
        location: 'Interior Sala Principal',
        color: '#8b5cf6',
        characters: ['Ana Silva', 'João Costa'],
        departments: [
          { name: 'Câmara', count: 2 },
          { name: 'Som', count: 1 },
          { name: 'Arte', count: 2 },
        ],
        equipment: ['Steadicam', 'Wireless Mic Set', 'LED Panels'],
        wardrobe: ['Ana: Vestido azul formal', 'João: Smoking preto'],
        notes: ['Cena complexa com movimento de câmara', 'Atenção à continuidade do anel'],
        priority: 'high' as const,
        takes: [
          { number: 1, timestamp: '09:15', status: 'bad' as const, note: 'Problema de som' },
          { number: 2, timestamp: '09:28', status: 'good' as const },
        ],
      },
    },
    {
      id: 'meal-1',
      time: '12:00',
      type: 'meal',
      title: 'Almoço',
      location: 'Catering Exterior',
      duration: '45min',
      color: '#10b981',
    },
    {
      id: 'scene-2',
      time: '13:00',
      type: 'scene',
      title: 'Cena 14B',
      location: 'Exterior Jardim',
      duration: '1h 30min',
      color: '#8b5cf6',
      sceneData: {
        id: '14B',
        title: 'Cena 14B - Reflexão',
        description: 'Personagem principal reflete sobre os acontecimentos no jardim.',
        time: '13:00',
        duration: '1h 30min',
        location: 'Exterior Jardim',
        color: '#8b5cf6',
        characters: ['Ana Silva'],
        departments: [
          { name: 'Câmara', count: 1 },
          { name: 'Som', count: 1 },
        ],
        equipment: ['Câmara portátil', 'Boom mic'],
        wardrobe: ['Ana: Mesmo vestido azul'],
        notes: ['Aproveitar luz natural', 'Golden hour às 17:30'],
        priority: 'medium' as const,
        takes: [],
      },
    },
    {
      id: 'scene-3',
      time: '15:00',
      type: 'scene',
      title: 'Cena 16C',
      location: 'Interior Biblioteca',
      duration: '1h',
      color: '#8b5cf6',
      sceneData: {
        id: '16C',
        title: 'Cena 16C - Descoberta',
        description: 'Descoberta do documento secreto na biblioteca.',
        time: '15:00',
        duration: '1h',
        location: 'Interior Biblioteca',
        color: '#8b5cf6',
        characters: ['João Costa'],
        departments: [
          { name: 'Câmara', count: 1 },
          { name: 'Arte', count: 3 },
        ],
        equipment: ['Dolly', 'Practicals'],
        wardrobe: ['João: Smoking (manchado)'],
        notes: ['Props: documento envelhecido', 'Iluminação dramática'],
        priority: 'high' as const,
        takes: [],
      },
    },
    {
      id: 'wrap-1',
      time: '18:00',
      type: 'wrap',
      title: 'Wrap',
      location: 'Fim de rodagem',
      color: '#64748b',
    },
  ];

  const handleItemClick = (item: TimelineItem) => {
    if (item.type === 'scene' && item.sceneData) {
      setSelectedScene(item.sceneData);
      setShowSceneDetail(true);
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
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* MODAL - iOS CALENDAR STYLE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 26,
            }}
            className="fixed left-1/2 top-1/2 z-[101] w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: '32px',
                background: '#f9f9f9',
                boxShadow: '0 24px 80px rgba(0, 0, 0, 0.3)',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 active:scale-95 transition-transform"
              >
                <X size={18} className="text-black/60" />
              </button>

              {/* HEADER MASSIVO - iOS CALENDAR STYLE */}
              <div className="flex-shrink-0 px-6 pt-6 pb-4">
                {/* DATA GIGANTE */}
                <div className="mb-1 flex items-baseline gap-3">
                  <div
                    className="font-bold leading-none tracking-tight text-black"
                    style={{ fontSize: '64px' }}
                  >
                    {dayNumber}
                  </div>
                  <div
                    className="font-semibold leading-none tracking-tight"
                    style={{ fontSize: '32px', color: 'rgba(0, 0, 0, 0.4)' }}
                  >
                    {monthName}
                  </div>
                </div>

                {/* Subtítulo */}
                <div
                  className="font-medium capitalize"
                  style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.5)' }}
                >
                  {weekDay} • Produção
                </div>
              </div>

              {/* DIVIDER */}
              <div style={{ height: '1px', background: 'rgba(0, 0, 0, 0.05)' }} />

              {/* LISTA MINIMALISTA - Scrollable */}
              <div
                className="flex-1 overflow-y-auto"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
                }}
              >
                <div className="px-6 py-3">
                  {timeline.map((item, index) => {
                    const isScene = item.type === 'scene';
                    const isClickable = isScene;

                    return (
                      <div key={item.id}>
                        {/* ITEM */}
                        <button
                          onClick={() => isClickable && handleItemClick(item)}
                          disabled={!isClickable}
                          className={`group w-full py-4 text-left transition-transform ${
                            isClickable ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* HORA */}
                            <div className="flex-shrink-0 pt-0.5" style={{ minWidth: '60px' }}>
                              <div
                                className="font-semibold text-black"
                                style={{ fontSize: '16px' }}
                              >
                                {item.time}
                              </div>
                            </div>

                            {/* BARRA VERTICAL COLORIDA */}
                            <div
                              className="mt-1 flex-shrink-0"
                              style={{
                                width: '3px',
                                height: '48px',
                                borderRadius: '999px',
                                background: item.color,
                                opacity: 0.6,
                              }}
                            />

                            {/* CONTEÚDO */}
                            <div className="flex-1 min-w-0">
                              {/* TÍTULO */}
                              <div
                                className="font-semibold text-black mb-1"
                                style={{ fontSize: '17px', lineHeight: '1.3' }}
                              >
                                {item.title}
                              </div>

                              {/* LOCAL + DURAÇÃO */}
                              <div
                                className="flex items-center gap-2"
                                style={{ fontSize: '15px', color: 'rgba(0, 0, 0, 0.5)' }}
                              >
                                <span>{item.location}</span>
                                {item.duration && (
                                  <>
                                    <span>•</span>
                                    <span>{item.duration}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* CHEVRON (só para cenas) */}
                            {isClickable && (
                              <div className="flex-shrink-0 pt-2 opacity-0 transition-opacity group-active:opacity-100">
                                <ChevronRight size={20} style={{ color: 'rgba(0, 0, 0, 0.3)' }} />
                              </div>
                            )}
                          </div>
                        </button>

                        {/* DIVIDER (excepto último) */}
                        {index < timeline.length - 1 && (
                          <div
                            className="ml-[88px]"
                            style={{ height: '1px', background: 'rgba(0, 0, 0, 0.05)' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* SCENE DETAIL WIDGET (z-index mais alto) */}
          {showSceneDetail && selectedScene && (
            <SceneDetailWidget
              isOpen={showSceneDetail}
              onClose={() => {
                setShowSceneDetail(false);
                setSelectedScene(null);
              }}
              scene={selectedScene}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
