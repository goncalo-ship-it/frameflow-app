// EmptyState.jsx — Enhanced empty state component (Figma spec 41)

import { motion } from 'framer-motion'
import { SPRING } from '../../core/design.js'
import { PillButton } from '../LiquidGlass.jsx'
import {
  Clapperboard, Users, MapPin, DollarSign, Calendar,
  Palette, Bell, SearchX, Camera, FolderOpen,
} from 'lucide-react'

// ── Size presets ──────────────────────────────────────────────
const SIZES = {
  sm: { py: 24, iconBox: 48, iconSize: 20, titleSize: '15px', descSize: '13px', gap: 12 },
  md: { py: 32, iconBox: 64, iconSize: 26, titleSize: '16px', descSize: '14px', gap: 14 },
  lg: { py: 48, iconBox: 80, iconSize: 32, titleSize: '18px', descSize: '14px', gap: 16 },
}

// ── Registry of common empty states ──────────────────────────
export const EMPTY_STATES = {
  scenes:        { icon: Clapperboard, title: 'Sem cenas',           description: 'Importa um guião FDX para começar',                       action: 'Importar Guião' },
  team:          { icon: Users,        title: 'Equipa vazia',        description: 'Adiciona membros da equipa e elenco',                      action: 'Adicionar Membro' },
  locations:     { icon: MapPin,       title: 'Sem locais',          description: 'Adiciona locais de filmagem',                              action: 'Adicionar Local' },
  budget:        { icon: DollarSign,   title: 'Sem orçamentos',      description: 'Cria o primeiro orçamento do projecto',                    action: 'Criar Orçamento' },
  shootingDays:  { icon: Calendar,     title: 'Sem dias de rodagem', description: 'Configura o calendário de produção',                       action: 'Criar Dia' },
  departments:   { icon: Palette,      title: 'Sem items',           description: 'Adiciona items de departamento (figurinos, adereços, etc.)', action: 'Adicionar Item' },
  notifications: { icon: Bell,         title: 'Sem notificações',    description: 'Estás a par de tudo!',                                     action: null },
  search:        { icon: SearchX,      title: 'Sem resultados',      description: 'Tenta usar termos diferentes',                             action: null },
  captures:      { icon: Camera,       title: 'Sem capturas',        description: 'Usa o botão de captura para fotografar, gravar ou anotar',  action: null },
  files:         { icon: FolderOpen,   title: 'Sem ficheiros',       description: 'Arrasta ficheiros para começar',                           action: 'Carregar Ficheiro' },
}

/**
 * EmptyState — centered placeholder with icon, title, description and optional actions.
 *
 * @param {LucideIcon}  icon             — Lucide icon component
 * @param {string}      title            — bold heading
 * @param {string}      description      — muted supporting text
 * @param {object}      action           — { label: string, onClick: fn }
 * @param {object}      secondaryAction  — { label: string, onClick: fn }
 * @param {'sm'|'md'|'lg'} size          — visual density
 * @param {string}      className        — extra CSS class
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'lg',
  className = '',
}) {
  const s = SIZES[size] || SIZES.lg

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.default}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${s.py}px 24px`,
        textAlign: 'center',
        minHeight: size === 'lg' ? 200 : size === 'md' ? 160 : 120,
      }}
    >
      {/* Icon container */}
      {Icon && (
        <div style={{
          width: s.iconBox,
          height: s.iconBox,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))',
          border: '0.5px solid rgba(16,185,129,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={s.iconSize} style={{ color: '#10b981', opacity: 0.85 }} />
        </div>
      )}

      {/* Title */}
      <h3 style={{
        fontSize: s.titleSize,
        fontWeight: 700,
        color: '#ffffff',
        marginTop: s.gap,
        marginBottom: 0,
        lineHeight: 1.3,
      }}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p style={{
          fontSize: s.descSize,
          color: 'rgba(255,255,255,0.5)',
          maxWidth: 320,
          marginTop: 8,
          marginBottom: 0,
          lineHeight: 1.5,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          {description}
        </p>
      )}

      {/* Primary action */}
      {action && (
        <div style={{ marginTop: 24 }}>
          <PillButton variant="accent" size="md" onClick={action.onClick}>
            {action.label}
          </PillButton>
        </div>
      )}

      {/* Secondary action */}
      {secondaryAction && (
        <div style={{ marginTop: 8 }}>
          <PillButton variant="ghost" size="sm" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </PillButton>
        </div>
      )}
    </motion.div>
  )
}
