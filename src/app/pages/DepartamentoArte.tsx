/**
 * DEPARTAMENTO ARTE & CENOGRAFIA
 * C1 — Liquid Glass Design System
 * Decoração, adereços, cenários e arte gráfica
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Palette, Package, CheckCircle, Clock, Film,
  Plus, X, Image,
} from 'lucide-react';
import { useStore } from '../../core/store.js';
import { useShallow } from 'zustand/react/shallow';
import {
  LiquidPage, LiquidCard, LiquidButton,
  LiquidSection, LiquidStatCard,
} from '../components/liquid-system';
import {
  glassCard, lensingOverlay, nestedCard, iconGradient, springConfigs,
} from '../utils/liquidGlassStyles';

const COLOR = '#8b5cf6';

interface DeptItem {
  id: string;
  department: string;
  characterId?: string;
  locationId?: string;
  scenes: string[];
  photos: string[];
  notes?: string;
  approved: boolean;
  createdAt: string;
  name?: string;
}

function ItemRow({ item, index }: { item: DeptItem; index: number }) {
  const approved = item.approved;
  const badgeColor = approved ? '#10b981' : '#f59e0b';
  const badgeLabel = approved ? 'Aprovado' : 'Pendente';
  const name = item.name || item.notes?.substring(0, 40) || `Item ${item.id.substring(0, 6)}`;

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
          <Palette size={16} style={{ color: COLOR }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: 14 }}>
            {name}
          </span>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
              {item.scenes.length} {item.scenes.length === 1 ? 'cena' : 'cenas'}
            </span>
            {item.photos.length > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Image size={11} />
                {item.photos.length}
              </span>
            )}
          </div>
        </div>
        <span style={{
          padding: '3px 10px',
          borderRadius: 9999,
          fontSize: 11,
          fontWeight: 700,
          background: `rgba(${approved ? '16,185,129' : '245,158,11'}, 0.15)`,
          border: `0.5px solid rgba(${approved ? '16,185,129' : '245,158,11'}, 0.4)`,
          color: badgeColor,
          flexShrink: 0,
        }}>
          {badgeLabel}
        </span>
      </div>
    </motion.div>
  );
}

export function DepartamentoArteModule() {
  const { departmentItems } = useStore(useShallow((s: any) => ({
    departmentItems: s.departmentItems ?? [],
  })));

  const [addOpen, setAddOpen] = useState(false);

  const items: DeptItem[] = useMemo(
    () => (departmentItems as DeptItem[]).filter(
      (i) => i.department === 'art' || i.department === 'props'
    ),
    [departmentItems]
  );

  const stats = useMemo(() => {
    const approved = items.filter((i) => i.approved).length;
    const pending = items.filter((i) => !i.approved).length;
    const allScenes = items.flatMap((i) => i.scenes);
    const uniqueScenes = new Set(allScenes).size;
    return { total: items.length, approved, pending, uniqueScenes };
  }, [items]);

  return (
    <LiquidPage
      title="Arte & Cenografia"
      description="Decoração, adereços, cenários e arte gráfica"
      headerAction={
        <LiquidButton variant="primary" size="md" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
          Novo Item
        </LiquidButton>
      }
    >
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <LiquidStatCard label="Total Items"     value={stats.total}       variant="purple"  icon={<Palette size={16} />}      animationDelay={0}   />
        <LiquidStatCard label="Aprovados"       value={stats.approved}    variant="emerald" icon={<CheckCircle size={16} />}  animationDelay={100} />
        <LiquidStatCard label="Pendentes"       value={stats.pending}     variant="amber"   icon={<Clock size={16} />}        animationDelay={200} />
        <LiquidStatCard label="Cenas cobertas"  value={stats.uniqueScenes} variant="blue"   icon={<Film size={16} />}         animationDelay={300} />
      </div>

      {/* List */}
      <LiquidSection animated animationDelay={300}>
        {items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '56px 0' }}>
            <Palette size={44} style={{ color: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Sem items ainda</span>
            <LiquidButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
              Adicionar primeiro item de arte
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

      {/* Add overlay placeholder */}
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
                  <h2 style={{ color: 'rgba(255,255,255,0.95)', fontSize: 17, fontWeight: 800 }}>Novo Item de Arte</h2>
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
                  Use o módulo de Departamentos completo para adicionar e gerir items de Arte & Adereços.
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

DepartamentoArteModule.displayName = 'DepartamentoArteModule';
