/**
 * DEPARTAMENTO STUNTS & SFX
 * C1 — Liquid Glass Design System
 * Sequências de acção, coordenação de stunts e efeitos especiais
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, CheckCircle, Shield, AlertTriangle,
  Plus, X, Image, AlertCircle,
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

const COLOR = '#ef4444';

interface DeptItem {
  id: string;
  department: string;
  characterId?: string;
  scenes: string[];
  photos: string[];
  notes?: string;
  approved: boolean;
  createdAt: string;
  name?: string;
  safetyApproved?: boolean;
}

function ItemRow({ item, index }: { item: DeptItem; index: number }) {
  const approved = item.approved;
  const safetyOk = item.safetyApproved ?? false;
  const deptLabel = item.department === 'sfx' ? 'SFX' : 'Stunt';
  const deptColor = item.department === 'sfx' ? '#f97316' : COLOR;
  const name = item.name || item.notes?.substring(0, 40) || `Sequência ${item.id.substring(0, 6)}`;

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
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={iconGradient(deptColor, 'md')}>
          <Zap size={16} style={{ color: deptColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: 14 }}>{name}</span>
            <span style={{
              padding: '1px 7px', borderRadius: 9999, fontSize: 10, fontWeight: 700,
              background: `rgba(${deptColor === '#ef4444' ? '239,68,68' : '249,115,22'}, 0.15)`,
              border: `0.5px solid ${deptColor}55`,
              color: deptColor,
            }}>{deptLabel}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
              {item.scenes.length} {item.scenes.length === 1 ? 'cena' : 'cenas'}
            </span>
            {item.photos.length > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Image size={11} />
                {item.photos.length}
              </span>
            )}
            {/* Safety warning if not approved */}
            {!approved && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 3,
                color: '#f59e0b', fontSize: 11, fontWeight: 600,
              }}>
                <AlertCircle size={11} /> Aguarda aprovação de segurança
              </span>
            )}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <span style={{
            padding: '3px 10px',
            borderRadius: 9999,
            fontSize: 11,
            fontWeight: 700,
            background: approved ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
            border: `0.5px solid ${approved ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
            color: approved ? '#10b981' : '#f59e0b',
          }}>
            {approved ? 'Aprovado' : 'Pendente'}
          </span>
          <span style={{
            padding: '3px 10px',
            borderRadius: 9999,
            fontSize: 11,
            fontWeight: 700,
            background: safetyOk ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.12)',
            border: `0.5px solid ${safetyOk ? 'rgba(59,130,246,0.4)' : 'rgba(239,68,68,0.3)'}`,
            color: safetyOk ? '#3b82f6' : '#ef4444',
          }}>
            {safetyOk ? '✓ Safety' : '⚠ Safety'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function DepartamentoStuntsModule() {
  const { departmentItems } = useStore(useShallow((s: any) => ({
    departmentItems: s.departmentItems ?? [],
  })));

  const [addOpen, setAddOpen] = useState(false);

  const items: DeptItem[] = useMemo(
    () => (departmentItems as DeptItem[]).filter(
      (i) => i.department === 'stunts' || i.department === 'sfx'
    ),
    [departmentItems]
  );

  const stats = useMemo(() => {
    const total      = items.length;
    const approved   = items.filter((i) => i.approved).length;
    const safetyOk   = items.filter((i) => (i as any).safetyApproved).length;
    const pending    = items.filter((i) => !i.approved).length;
    return { total, approved, safetyOk, pending };
  }, [items]);

  // Pending safety check warning
  const needsSafety = items.filter((i) => !i.approved).length > 0;

  return (
    <LiquidPage
      title="Stunts & SFX"
      description="Sequências de acção, coordenação de stunts e efeitos especiais"
      headerAction={
        <LiquidButton variant="error" size="md" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
          Nova Sequência
        </LiquidButton>
      }
    >
      {/* Safety warning banner */}
      {needsSafety && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'rgba(239,68,68,0.10)',
            border: '0.5px solid rgba(239,68,68,0.35)',
            borderRadius: 16,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.80)', fontSize: 13, fontWeight: 600 }}>
            {stats.pending} {stats.pending === 1 ? 'sequência pendente' : 'sequências pendentes'} de aprovação de segurança.
            Não iniciar rodagem sem safety check completo.
          </span>
        </motion.div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <LiquidStatCard label="Sequências"     value={stats.total}    variant="error"   icon={<Zap size={16} />}           animationDelay={0}   />
        <LiquidStatCard label="Aprovadas"      value={stats.approved} variant="emerald" icon={<CheckCircle size={16} />}   animationDelay={100} />
        <LiquidStatCard label="Safety Checks"  value={stats.safetyOk} variant="blue"    icon={<Shield size={16} />}        animationDelay={200} />
        <LiquidStatCard label="Pendentes"      value={stats.pending}  variant="amber"   icon={<AlertTriangle size={16} />} animationDelay={300} pulse={stats.pending > 0} />
      </div>

      {/* List */}
      <LiquidSection animated animationDelay={300}>
        {items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '56px 0' }}>
            <Zap size={44} style={{ color: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Sem sequências ainda</span>
            <LiquidButton variant="error" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
              Adicionar primeira sequência
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

      {/* Safety disclaimer */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <Shield size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 1 }} />
        <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12, lineHeight: 1.5 }}>
          Todas as sequências de stunts e SFX requerem aprovação do Coordenador de Stunts e do Supervisor de Segurança
          antes de entrar em rodagem. Certifique-se que o safety check está completo para cada cena.
        </span>
      </div>

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
                  <h2 style={{ color: 'rgba(255,255,255,0.95)', fontSize: 17, fontWeight: 800 }}>Nova Sequência Stunts/SFX</h2>
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
                <div style={{
                  background: 'rgba(239,68,68,0.10)',
                  border: '0.5px solid rgba(239,68,68,0.3)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  gap: 8,
                }}>
                  <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: 'rgba(255,255,255,0.70)', fontSize: 12 }}>
                    Requer validação do Coordenador de Stunts antes de rodar.
                  </span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                  Use o módulo de Departamentos completo para adicionar e gerir sequências de stunts e efeitos especiais.
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

DepartamentoStuntsModule.displayName = 'DepartamentoStuntsModule';
