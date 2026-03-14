/**
 * LIQUID GLASS STYLES — DNA (Source of Truth)
 * Todos os valores extraídos de CLAUDE.md / DashboardProducerLiquid.
 * NUNCA hardcodar valores glass fora deste ficheiro.
 */

import type { CSSProperties } from 'react';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

export type GlassIntensity = 'subtle' | 'medium' | 'elevated' | 'heavy';
export type GlassVariant   = 'default' | 'emerald' | 'blue' | 'purple' | 'amber' | 'orange' | 'error' | 'primary' | 'warning' | 'danger' | 'pink';
export type CornerRadius   = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */

export const BLUR_VALUES = {
  light:  'blur(12px) saturate(120%)',
  medium: 'blur(20px) saturate(120%)',
  heavy:  'blur(32px) saturate(180%)',
} as const;

export const CORNER_VALUES: Record<CornerRadius, number> = {
  sm:   16,
  md:   20,
  lg:   24,
  xl:   28,
  full: 9999,
};

export const ACCENT_COLORS: Record<GlassVariant, string> = {
  default: '#ffffff',
  emerald: '#10b981',
  blue:    '#3b82f6',
  purple:  '#a855f7',
  amber:   '#f59e0b',
  orange:  '#f97316',
  error:   '#ef4444',
  danger:  '#ef4444',
  primary: '#10b981',
  warning: '#f59e0b',
  pink:    '#ec4899',
};

export const GLASS_PRESETS = {
  subtle:  { bg: 'rgba(255, 255, 255, 0.06)', blur: 'blur(12px) saturate(120%)' },
  medium:  { bg: 'rgba(255, 255, 255, 0.06)', blur: BLUR_VALUES.medium },
  elevated:{ bg: 'rgba(255, 255, 255, 0.08)', blur: 'blur(24px) saturate(120%)' },
  heavy:   { bg: 'rgba(255, 255, 255, 0.06)', blur: 'blur(32px) saturate(150%)' },
} as const;

export const SHADOW_PRESETS = {
  sm:     '0 2px 20px rgba(0, 0, 0, 0.12)',
  md:     '0 4px 16px rgba(0, 0, 0, 0.10)',
  lg:     '0 8px 32px rgba(0, 0, 0, 0.15)',
  inner:  'inset 0 0.5px 0.5px rgba(255, 255, 255, 0.25)',
  border: '0 0 0 0.5px rgba(255, 255, 255, 0.1)',
} as const;

export const DEPARTMENT_COLORS_MAP: Record<string, string> = {
  camera:    '#10b981',
  direcao:   '#3b82f6',
  producao:  '#ec4899',
  figurinos: '#f97316',
  arte:      '#f59e0b',
  som:       '#f59e0b',
  makeup:    '#8b5cf6',
  stunts:    '#ef4444',
  transporte:'#10b981',
  casting:   '#a855f7',
};

/* ─────────────────────────────────────────────────────────────
   SPRING CONFIGS
───────────────────────────────────────────────────────────── */

export const springConfigs = {
  /** Card entrances */
  gentle:         { type: 'spring' as const, stiffness: 150, damping: 20 },
  /** Toggles, dismissals */
  snappy:         { type: 'spring' as const, stiffness: 200, damping: 12 },
  /** Standard interactions */
  snappyStandard: { type: 'spring' as const, stiffness: 380, damping: 28 },
  /** Legacy aliases */
  bouncy:         { type: 'spring' as const, stiffness: 400, damping: 20 },
  smooth:         { type: 'spring' as const, stiffness:  80, damping: 25 },
};

/* ─────────────────────────────────────────────────────────────
   DNA FUNCTIONS
───────────────────────────────────────────────────────────── */

/** Widget container principal — 4 layers */
export function glassCard(options?: {
  intensity?:   GlassIntensity;
  variant?:     GlassVariant;
  radius?:      CornerRadius;
  interactive?: boolean;
}): CSSProperties {
  const { intensity = 'medium', radius = 'xl' } = options ?? {};
  const preset = GLASS_PRESETS[intensity as keyof typeof GLASS_PRESETS] ?? GLASS_PRESETS.medium;
  const r      = CORNER_VALUES[radius];
  return {
    position:          'relative',
    overflow:          'hidden',
    background:        preset.bg,
    backdropFilter:    preset.blur,
    WebkitBackdropFilter: preset.blur,
    borderRadius:      r,
    border:            '0.5px solid rgba(255, 255, 255, 0.18)',
    boxShadow:         `${SHADOW_PRESETS.sm}, ${SHADOW_PRESETS.border}, ${SHADOW_PRESETS.inner}`,
  };
}

/** Lensing layer — div absolute pointer-events-none */
export function lensingOverlay(options?: {
  radius?:  CornerRadius;
  color?:   string;
}): CSSProperties {
  const { color = 'rgba(255, 255, 255, 0.12)' } = options ?? {};
  return {
    position:      'absolute',
    inset:         0,
    pointerEvents: 'none',
    background:    `radial-gradient(ellipse 120% 60% at 50% -10%, ${color} 0%, transparent 50%)`,
    mixBlendMode:  'overlay',
    zIndex:        10,
  } as CSSProperties;
}

/** Nested card — parentRadius - 8px (min 8px) */
export function nestedCard(color?: string, parentRadius = 20): CSSProperties {
  const r = Math.max(8, parentRadius - 8);
  if (!color) {
    return {
      background:    'rgba(255, 255, 255, 0.05)',
      backdropFilter:'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius:  r,
      border:        '0.5px solid rgba(255, 255, 255, 0.12)',
      boxShadow:     'inset 0 0.5px 0 rgba(255, 255, 255, 0.15)',
    };
  }
  return {
    background:    `rgba(${hexToRgb(color)}, 0.08)`,
    backdropFilter:'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius:  r,
    border:        `0.5px solid rgba(${hexToRgb(color)}, 0.25)`,
    boxShadow:     `inset 0 0.5px 0 rgba(255,255,255,0.15)`,
  };
}

/** Status badge (Section 8 CLAUDE.md) */
export function glassBadge(color: string): CSSProperties {
  return {
    display:       'inline-flex',
    alignItems:    'center',
    backdropFilter:'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius:  9999,
    border:        `0.5px solid ${color}60`,
    background:    `rgba(${hexToRgb(color)}, 0.15)`,
    boxShadow:     `0 2px 8px ${color}30, inset 0 0.5px 0.5px rgba(255,255,255,0.2)`,
  };
}

/** Pill button — glass variant (Section 11) */
export function glassButton(): CSSProperties {
  return {
    borderRadius:  16,
    background:    'rgba(255, 255, 255, 0.08)',
    backdropFilter:'blur(16px) saturate(120%)',
    WebkitBackdropFilter: 'blur(16px) saturate(120%)',
    border:        '0.5px solid rgba(255, 255, 255, 0.18)',
    boxShadow:     '0 2px 12px rgba(0,0,0,0.08), inset 0 0.5px 0.5px rgba(255,255,255,0.25)',
    color:         'rgba(255, 255, 255, 0.9)',
    cursor:        'pointer',
  };
}

/** Glow action button — accent solid (Section 12) */
export function glassButtonAccent(color: string): CSSProperties {
  return {
    borderRadius:  18,
    padding:       '12px 20px',
    background:    `linear-gradient(135deg, ${color}, ${color}dd)`,
    boxShadow:     `0 8px 24px ${color}70, 0 2px 8px ${color}40, inset 0 -3px 12px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.5)`,
    border:        'none',
    color:         '#ffffff',
    cursor:        'pointer',
  };
}

/** Input field — dark bg for contrast (spec: rgba(0,0,0,0.20)) */
export function glassInput(radius: CornerRadius = 'md'): CSSProperties {
  return {
    background:    'rgba(0, 0, 0, 0.20)',
    backdropFilter:'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius:  CORNER_VALUES[radius],
    border:        '0.5px solid rgba(255, 255, 255, 0.12)',
    boxShadow:     'inset 0 0.5px 0.5px rgba(255, 255, 255, 0.10)',
    color:         '#ffffff',
    outline:       'none',
  };
}

/** Divider */
export function glassDivider(): CSSProperties {
  return {
    border:   'none',
    height:   '0.5px',
    background: 'rgba(255, 255, 255, 0.08)',
    margin:   '12px 0',
  };
}

/** Icon container (Section 7) */
export function iconGradient(color: string, size: 'sm' | 'md' = 'md'): CSSProperties {
  const s = size === 'sm' ? 32 : 40;
  return {
    width:         s,
    height:        s,
    flexShrink:    0,
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    borderRadius:  size === 'sm' ? 9999 : 12,
    background:    `rgba(${hexToRgb(color)}, 0.15)`,
    backdropFilter:'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border:        `0.5px solid rgba(${hexToRgb(color)}, 0.30)`,
    boxShadow:     'inset 0 0.5px 0 rgba(255, 255, 255, 0.2)',
  };
}

/** Department overlay background */
export function departmentOverlay(color: string): CSSProperties {
  return {
    background:    `rgba(${hexToRgb(color)}, 0.04)`,
    backdropFilter:'blur(20px) saturate(120%)',
    WebkitBackdropFilter: 'blur(20px) saturate(120%)',
    border:        `0.5px solid rgba(${hexToRgb(color)}, 0.15)`,
    borderRadius:  24,
    boxShadow:     `0 4px 24px rgba(0,0,0,0.1), inset 0 0.5px 0.5px rgba(255,255,255,0.2)`,
  };
}

/* ─────────────────────────────────────────────────────────────
   UTIL
───────────────────────────────────────────────────────────── */

/** Convert hex color to "r, g, b" for use in rgba() */
export function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const full  = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '255, 255, 255';
  return `${r}, ${g}, ${b}`;
}
