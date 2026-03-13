/**
 * DEPARTAMENTO TRANSPORTE
 * C1 — Liquid Glass Design System
 * Veículos, motoristas, rotas e logística de produção
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck, CheckCircle, Users, Navigation,
  Plus, X, MapPin, Calendar,
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

const COLOR = '#6366f1';

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

interface TeamMember {
  id: string;
  name: string;
  role?: string;
  group?: string;
  phone?: string;
}

interface ShootingDay {
  id: string;
  date: string;
  label?: string;
  callTime?: string;
}

interface Location {
  id: string;
  name: string;
  displayName?: string;
  address?: string;
}

const STATUS_COLORS: Record<string, string> = {
  available:     '#10b981',
  'checked-out': '#f59e0b',
  maintenance:   '#f97316',
  missing:       '#ef4444',
};
const STATUS_LABELS: Record<string, string> = {
  available:     'Disponível',
  'checked-out': 'Em rota',
  maintenance:   'Manutenção',
  missing:       'Em falta',
};

function VehicleRow({ item, index }: { item: EquipmentItem; index: number }) {
  const statusColor = STATUS_COLORS[item.status] || '#ffffff';

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
          <Truck size={16} style={{ color: COLOR }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: 14 }}>{item.name}</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
            {item.notes && (
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>{item.notes.substring(0, 40)}</span>
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

export function DepartamentoTransporteModule() {
  const { equipment, team, shootingDays, locations } = useStore(useShallow((s: any) => ({
    equipment:    s.equipment ?? [],
    team:         s.team ?? [],
    shootingDays: s.shootingDays ?? [],
    locations:    s.locations ?? [],
  })));

  const [addOpen, setAddOpen] = useState(false);

  const vehicles: EquipmentItem[] = useMemo(
    () => (equipment as EquipmentItem[]).filter((i) => i.category === 'transport'),
    [equipment]
  );

  const drivers: TeamMember[] = useMemo(
    () => (team as TeamMember[]).filter(
      (m) => /motorista|driver|transport/i.test(m.role || '')
    ),
    [team]
  );

  // Today's shooting day
  const today = new Date().toISOString().split('T')[0];
  const todayDay = useMemo(
    () => (shootingDays as ShootingDay[]).find(
      (d) => d.date && d.date.startsWith(today)
    ),
    [shootingDays, today]
  );

  const stats = useMemo(() => {
    const total     = vehicles.length;
    const available = vehicles.filter((i) => i.status === 'available').length;
    const inRoute   = vehicles.filter((i) => i.status === 'checked-out').length;
    return { total, available, drivers: drivers.length, inRoute };
  }, [vehicles, drivers]);

  return (
    <LiquidPage
      title="Transporte"
      description="Veículos, motoristas, rotas e logística de produção"
      headerAction={
        <LiquidButton variant="blue" size="md" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
          Novo Veículo
        </LiquidButton>
      }
    >
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <LiquidStatCard label="Veículos"     value={stats.total}     variant="blue"    icon={<Truck size={16} />}       animationDelay={0}   />
        <LiquidStatCard label="Disponíveis"  value={stats.available} variant="emerald" icon={<CheckCircle size={16} />} animationDelay={100} />
        <LiquidStatCard label="Motoristas"   value={stats.drivers}   variant="amber"   icon={<Users size={16} />}       animationDelay={200} />
        <LiquidStatCard label="Em Rota"      value={stats.inRoute}   variant="blue"    icon={<Navigation size={16} />}  animationDelay={300} />
      </div>

      {/* Today's route */}
      {todayDay && (
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          borderRadius: 20,
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Calendar size={14} style={{ color: COLOR }} />
            <span style={{ color: 'rgba(255,255,255,0.80)', fontWeight: 700, fontSize: 13 }}>
              Rota de hoje — {todayDay.label || todayDay.date}
            </span>
            {todayDay.callTime && (
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12 }}>Call: {todayDay.callTime}</span>
            )}
          </div>
          {locations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(locations as Location[]).slice(0, 3).map((loc, idx) => (
                <div key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={12} style={{ color: COLOR, flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.80)', fontSize: 13 }}>
                    {loc.displayName || loc.name}
                  </span>
                  {loc.address && (
                    <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>{loc.address}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12 }}>Sem locais definidos para hoje.</span>
          )}
        </div>
      )}

      {/* Vehicles list */}
      <LiquidSection animated animationDelay={300}>
        {vehicles.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '56px 0' }}>
            <Truck size={44} style={{ color: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Sem veículos ainda</span>
            <LiquidButton variant="blue" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
              Adicionar primeiro veículo
            </LiquidButton>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vehicles.map((item, i) => (
              <VehicleRow key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </LiquidSection>

      {/* Drivers section */}
      {drivers.length > 0 && (
        <LiquidSection animated animationDelay={400}>
          <div style={{
            borderTop: '0.5px solid rgba(255,255,255,0.08)',
            paddingTop: 16,
          }}>
            <span style={{
              color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              display: 'block', marginBottom: 10,
            }}>
              Motoristas
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {drivers.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springConfigs.gentle, delay: i * 0.05 }}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.80)', fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                  {m.phone && (
                    <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12 }}>{m.phone}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </LiquidSection>
      )}

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
                  <h2 style={{ color: 'rgba(255,255,255,0.95)', fontSize: 17, fontWeight: 800 }}>Novo Veículo</h2>
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
                  Use o módulo de Equipamento completo — categoria "Transporte" — para adicionar e gerir veículos de produção.
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

DepartamentoTransporteModule.displayName = 'DepartamentoTransporteModule';
