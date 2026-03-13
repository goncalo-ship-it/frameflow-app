/**
 * DEPARTAMENTO CASTING
 * C1 — Liquid Glass Design System
 * Elenco, audições, confirmações e gestão de actores
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, CheckCircle, Clock, Briefcase,
  Plus, X, Phone, User,
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

const COLOR = '#ec4899';

interface TeamMember {
  id: string;
  name: string;
  role?: string;
  group?: string;
  company?: string;
  phone?: string;
  email?: string;
  photo?: string;
  notes?: string;
  availability?: string;
  characterName?: string;
  agent?: string;
  cacheDiario?: number;
}

function getAvailabilityColor(availability?: string) {
  if (availability === 'available') return '#10b981';
  if (availability === 'unavailable') return '#ef4444';
  return '#f59e0b';
}

function getAvailabilityLabel(availability?: string) {
  if (availability === 'available') return 'Confirmado';
  if (availability === 'unavailable') return 'Indisponível';
  return 'Pendente';
}

function CastRow({ member, index }: { member: TeamMember; index: number }) {
  const availColor = getAvailabilityColor(member.availability);
  const availLabel = getAvailabilityLabel(member.availability);

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
        {/* Avatar */}
        {member.photo ? (
          <img
            src={member.photo}
            alt={member.name}
            style={{
              width: 40, height: 40, borderRadius: 12,
              objectFit: 'cover',
              border: '0.5px solid rgba(236,72,153,0.3)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div style={iconGradient(COLOR, 'md')}>
            <User size={16} style={{ color: COLOR }} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: 14 }}>{member.name}</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {member.characterName && (
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                {member.characterName}
              </span>
            )}
            {member.agent && (
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Briefcase size={10} /> {member.agent}
              </span>
            )}
            {member.phone && (
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Phone size={10} /> {member.phone}
              </span>
            )}
          </div>
        </div>

        <span style={{
          padding: '3px 10px',
          borderRadius: 9999,
          fontSize: 11,
          fontWeight: 700,
          background: `rgba(${availColor === '#10b981' ? '16,185,129' : availColor === '#ef4444' ? '239,68,68' : '245,158,11'}, 0.15)`,
          border: `0.5px solid ${availColor}66`,
          color: availColor,
          flexShrink: 0,
        }}>
          {availLabel}
        </span>
      </div>
    </motion.div>
  );
}

export function DepartamentoCastingModule() {
  const { team } = useStore(useShallow((s: any) => ({
    team: s.team ?? [],
  })));

  const [addOpen, setAddOpen] = useState(false);

  const castMembers: TeamMember[] = useMemo(
    () => (team as TeamMember[]).filter((m) => m.group === 'Elenco'),
    [team]
  );

  const stats = useMemo(() => {
    const total      = castMembers.length;
    const confirmed  = castMembers.filter((m) => m.availability === 'available').length;
    const pending    = castMembers.filter((m) => !m.availability || m.availability === 'pending').length;
    const withAgent  = castMembers.filter((m) => m.agent && m.agent.trim() !== '').length;
    return { total, confirmed, pending, withAgent };
  }, [castMembers]);

  return (
    <LiquidPage
      title="Casting"
      description="Elenco, audições, confirmações e gestão de actores"
      headerAction={
        <LiquidButton variant="pink" size="md" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
          Nova Audição
        </LiquidButton>
      }
    >
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <LiquidStatCard label="Elenco total"  value={stats.total}     variant="pink"    icon={<Users size={16} />}       animationDelay={0}   />
        <LiquidStatCard label="Confirmados"   value={stats.confirmed} variant="emerald" icon={<CheckCircle size={16} />} animationDelay={100} />
        <LiquidStatCard label="Pendentes"     value={stats.pending}   variant="amber"   icon={<Clock size={16} />}       animationDelay={200} />
        <LiquidStatCard label="Com agente"    value={stats.withAgent} variant="blue"    icon={<Briefcase size={16} />}   animationDelay={300} />
      </div>

      {/* List */}
      <LiquidSection animated animationDelay={300}>
        {castMembers.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '56px 0' }}>
            <Users size={44} style={{ color: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Sem actores ainda</span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center', maxWidth: 280 }}>
              Adicione membros do grupo "Elenco" no módulo de Equipa para aparecerem aqui.
            </span>
            <LiquidButton variant="pink" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
              Nova Audição
            </LiquidButton>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {castMembers.map((member, i) => (
              <CastRow key={member.id} member={member} index={i} />
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
                  <h2 style={{ color: 'rgba(255,255,255,0.95)', fontSize: 17, fontWeight: 800 }}>Nova Audição</h2>
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
                  Adicione actores ao grupo "Elenco" no módulo de Equipa & Elenco para gerir o casting completo.
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

DepartamentoCastingModule.displayName = 'DepartamentoCastingModule';
