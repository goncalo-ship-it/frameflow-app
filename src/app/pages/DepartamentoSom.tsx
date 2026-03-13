/**
 * DEPARTAMENTO SOM
 * C1 — Liquid Glass Design System
 * Equipamento de som, microfones, gravadores e pós-áudio
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic, Radio, Headphones, Activity,
  Plus, X,
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

const COLOR = '#f59e0b';

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

function getIcon(name: string) {
  if (/wireless|sem.fio|lapela|lavalier|lavali/i.test(name)) return Radio;
  if (/gravador|recorder|zoom|sound.device/i.test(name)) return Headphones;
  return Mic;
}

function ItemRow({ item, index }: { item: EquipmentItem; index: number }) {
  const statusColor = STATUS_COLORS[item.status] || '#ffffff';
  const Icon = getIcon(item.name);

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
          <Icon size={16} style={{ color: COLOR }} />
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

export function DepartamentoSomModule() {
  const { equipment } = useStore(useShallow((s: any) => ({
    equipment: s.equipment ?? [],
  })));

  const [addOpen, setAddOpen] = useState(false);

  const items: EquipmentItem[] = useMemo(
    () => (equipment as EquipmentItem[]).filter((i) => i.category === 'sound'),
    [equipment]
  );

  const stats = useMemo(() => {
    const mics      = items.filter((i) => /mic|microfone|boom|shotgun/i.test(i.name)).length;
    const wireless  = items.filter((i) => /wireless|sem.fio|lapela|lavalier/i.test(i.name)).length;
    const recorders = items.filter((i) => /gravador|recorder|zoom|sound.device/i.test(i.name)).length;
    const inUse     = items.filter((i) => i.status === 'checked-out').length;
    return { mics, wireless, recorders, inUse };
  }, [items]);

  return (
    <LiquidPage
      title="Som"
      description="Equipamento de som, microfones, gravadores e pós-áudio"
      headerAction={
        <LiquidButton variant="amber" size="md" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
          Novo Equipamento
        </LiquidButton>
      }
    >
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <LiquidStatCard label="Microfones" value={stats.mics}      variant="amber"   icon={<Mic size={16} />}        animationDelay={0}   />
        <LiquidStatCard label="Wireless"   value={stats.wireless}  variant="emerald" icon={<Radio size={16} />}      animationDelay={100} />
        <LiquidStatCard label="Gravadores" value={stats.recorders} variant="blue"    icon={<Headphones size={16} />} animationDelay={200} />
        <LiquidStatCard label="Em Uso"     value={stats.inUse}     variant="error"   icon={<Activity size={16} />}   animationDelay={300} />
      </div>

      {/* List */}
      <LiquidSection animated animationDelay={300}>
        {items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '56px 0' }}>
            <Mic size={44} style={{ color: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Sem items ainda</span>
            <LiquidButton variant="amber" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
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
                  <h2 style={{ color: 'rgba(255,255,255,0.95)', fontSize: 17, fontWeight: 800 }}>Novo Equipamento de Som</h2>
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
                  Use o módulo de Equipamento completo para adicionar microfones, gravadores e equipamento wireless.
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

DepartamentoSomModule.displayName = 'DepartamentoSomModule';
