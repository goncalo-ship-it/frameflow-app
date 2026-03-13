/**
 * DEPARTAMENTO CÂMARA
 * C1 — Liquid Glass Design System
 * Equipamento de câmara, ópticas, suportes e grip
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera, Aperture, Activity, CheckCircle,
  Plus, X, Box,
} from 'lucide-react';
import { useStore } from '../../core/store.js';
import { useShallow } from 'zustand/react/shallow';
import {
  LiquidPage, LiquidButton,
  LiquidSection, LiquidStatCard,
} from '../components/liquid-system';
import {
  glassCard, lensingOverlay, nestedCard, iconGradient, springConfigs,
} from '../utils/liquidGlassStyles';

const COLOR = '#3b82f6';

const STATUS_COLORS: Record<string, string> = {
  available:     '#10b981',
  'checked-out': '#f59e0b',
  maintenance:   '#f97316',
  missing:       '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  available:     'Disponível',
  'checked-out': 'Em uso',
  maintenance:   'Manutenção',
  missing:       'Em falta',
};

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  status: string;
  condition: string;
  quantity: number;
  serialNumber?: string;
  photo?: string;
  notes?: string;
  checkOuts: any[];
  createdAt: string;
}

function ItemRow({ item, index }: { item: EquipmentItem; index: number }) {
  const statusColor = STATUS_COLORS[item.status] || '#ffffff';
  const isLens = /lente|lens/i.test(item.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springConfigs.gentle, delay: index * 0.05 }}
    >
      <div
        style={{
          ...nestedCard(COLOR, 'subtle'),
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={iconGradient(COLOR, 'md')}>
          {isLens ? <Aperture size={16} style={{ color: COLOR }} /> : <Camera size={16} style={{ color: COLOR }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: 14 }}>{item.name}</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
            {item.serialNumber && (
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>S/N {item.serialNumber}</span>
            )}
            {item.quantity > 1 && (
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>× {item.quantity}</span>
            )}
          </div>
        </div>
        <span style={{
          padding: '3px 10px',
          borderRadius: 9999,
          fontSize: 11,
          fontWeight: 700,
          background: `rgba(${statusColor === '#10b981' ? '16,185,129' : statusColor === '#f59e0b' ? '245,158,11' : '239,68,68'}, 0.15)`,
          border: `0.5px solid ${statusColor}66`,
          color: statusColor,
          flexShrink: 0,
        }}>
          {STATUS_LABELS[item.status] || item.status}
        </span>
      </div>
    </motion.div>
  );
}

export function DepartamentoCameraModule() {
  const { equipment } = useStore(useShallow((s: any) => ({
    equipment: s.equipment ?? [],
  })));

  const [addOpen, setAddOpen] = useState(false);

  const items: EquipmentItem[] = useMemo(
    () => (equipment as EquipmentItem[]).filter(
      (i) => i.category === 'camera' || i.category === 'grip' || i.category === 'lighting'
    ),
    [equipment]
  );

  const stats = useMemo(() => {
    const cameras   = items.filter((i) => i.category === 'camera').length;
    const lenses    = items.filter((i) => /lente|lens/i.test(i.name)).length;
    const inUse     = items.filter((i) => i.status === 'checked-out').length;
    const available = items.filter((i) => i.status === 'available').length;
    return { cameras, lenses, inUse, available };
  }, [items]);

  return (
    <LiquidPage
      title="Câmara"
      description="Equipamento de câmara, ópticas, suportes e grip"
      headerAction={
        <LiquidButton variant="blue" size="md" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
          Novo Equipamento
        </LiquidButton>
      }
    >
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <LiquidStatCard label="Câmaras"     value={stats.cameras}   variant="blue"    icon={<Camera size={16} />}       animationDelay={0}   />
        <LiquidStatCard label="Lentes"      value={stats.lenses}    variant="emerald" icon={<Aperture size={16} />}    animationDelay={100} />
        <LiquidStatCard label="Em Uso"      value={stats.inUse}     variant="amber"   icon={<Activity size={16} />}    animationDelay={200} />
        <LiquidStatCard label="Disponível"  value={stats.available} variant="purple"  icon={<CheckCircle size={16} />} animationDelay={300} />
      </div>

      {/* List */}
      <LiquidSection animated animationDelay={300}>
        {items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '56px 0' }}>
            <Camera size={44} style={{ color: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Sem items ainda</span>
            <LiquidButton variant="blue" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
              Adicionar primeiro equipamento
            </LiquidButton>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
              <ItemRow key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </LiquidSection>

      {/* Add overlay */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}
            onClick={(e) => e.target === e.currentTarget && setAddOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={springConfigs.snappy}
              style={{
                ...glassCard({ intensity: 'heavy', radius: 'xl' }),
                padding: 28, width: '100%', maxWidth: 440,
              }}
            >
              <div style={lensingOverlay()} />
              <div className="relative z-10">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ color: 'rgba(255,255,255,0.95)', fontSize: 17, fontWeight: 800 }}>Novo Equipamento de Câmara</h2>
                  <button
                    onClick={() => setAddOpen(false)}
                    style={{
                      width: 32, height: 32, borderRadius: 9999,
                      background: 'rgba(255,255,255,0.08)',
                      border: '0.5px solid rgba(255,255,255,0.15)',
                      color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  ><X size={15} /></button>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                  Use o módulo de Equipamento completo para adicionar câmaras, lentes e acessórios de grip.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <LiquidButton variant="default" size="md" onClick={() => setAddOpen(false)}>Fechar</LiquidButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LiquidPage>
  );
}

DepartamentoCameraModule.displayName = 'DepartamentoCameraModule';
