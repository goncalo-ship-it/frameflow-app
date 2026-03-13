/**
 * LIQUID BADGE — Micro-badges e Status badges
 * sm: px-8 py-4 font-10px | md: px-12 py-6 font-11px | lg: px-16 py-8 font-12px
 * SEMPRE pill (9999px), backdrop blur(12px), uppercase, fontWeight 700, letterSpacing 0.02em
 */

import { ReactNode } from 'react';
import { ACCENT_COLORS, hexToRgb, type GlassVariant } from '../../utils/liquidGlassStyles';

export interface LiquidBadgeProps {
  children: ReactNode;
  variant?:  GlassVariant;
  size?:     'sm' | 'md' | 'lg';
  /** Ícone à esquerda */
  icon?:     ReactNode;
  /** Dot pulsante (só size md/lg) */
  pulse?:    boolean;
  /** Glow ring */
  glow?:     boolean;
}

const SIZE_MAP = {
  sm: { padding: '4px 8px',   fontSize: 10 },
  md: { padding: '6px 12px',  fontSize: 11 },
  lg: { padding: '8px 16px',  fontSize: 12 },
};

export function LiquidBadge({
  children,
  variant = 'default',
  size    = 'sm',
  icon,
  pulse   = false,
  glow    = false,
}: LiquidBadgeProps) {
  const color = variant === 'default' ? undefined : ACCENT_COLORS[variant];
  const rgb   = color ? hexToRgb(color) : null;
  const { padding, fontSize } = SIZE_MAP[size];

  const showDot = (pulse || !icon) && !!color && size !== 'sm';

  return (
    <span
      className="inline-flex items-center gap-1.5 font-bold uppercase"
      style={{
        fontSize,
        padding,
        borderRadius:         9999,
        backdropFilter:       'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        letterSpacing:        '0.02em',
        background: rgb
          ? `rgba(${rgb}, 0.15)`
          : 'rgba(255, 255, 255, 0.08)',
        border: rgb
          ? `0.5px solid rgba(${rgb}, 0.40)`
          : '0.5px solid rgba(255, 255, 255, 0.18)',
        boxShadow: [
          rgb && glow ? `0 0 12px rgba(${rgb}, 0.40)` : null,
          rgb ? `0 2px 8px rgba(${rgb}, 0.18)` : null,
          'inset 0 0.5px 0.5px rgba(255,255,255,0.20)',
        ].filter(Boolean).join(', ') || 'inset 0 0.5px 0.5px rgba(255,255,255,0.20)',
        color: color || 'rgba(255, 255, 255, 0.7)',
      }}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pulse ? 'animate-pulse' : ''}`}
          style={{
            background: color!,
            boxShadow:  `0 0 6px ${color}, 0 0 12px ${color}80`,
          }}
        />
      )}
      {icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </span>
  );
}

LiquidBadge.displayName = 'LiquidBadge';
