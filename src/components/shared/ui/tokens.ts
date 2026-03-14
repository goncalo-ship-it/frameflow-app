/**
 * FrameFlow UI System — Design Tokens
 * Single source of truth. Do NOT import from core/design.js or liquidGlassStyles.ts here.
 */

// ── Card height variants ──────────────────────────────────────────
export const CARD_HEIGHT = {
  compact:  120,   // timeline chips, cockpit rows
  standard: 360,   // dashboard cards (weather card reference)
  expanded: 520,   // detail drawers, full context
  live:      72,   // real-time cockpit strip
} as const

export type CardVariant = keyof typeof CARD_HEIGHT | 'auto'

// ── Radius scale ─────────────────────────────────────────────────
export const R = {
  xl:   28,   // main card shell
  lg:   20,   // nested card (parent − 8)
  md:   16,   // inner section block
  sm:   12,   // badge, chip
  xs:    8,   // icon badge, tag
  pill: 9999,
} as const

// ── Spacing scale (px) ───────────────────────────────────────────
export const SP = {
  card:    20,   // card internal padding
  section: 16,   // section padding
  item:    12,   // list item vertical padding
  gap:     10,   // default flex gap
  tight:    8,
  xs:       4,
} as const

// ── Glass material layers ─────────────────────────────────────────
export const GLASS = {
  // base tints
  bg:         'rgba(78, 80, 88, 0.18)',
  bgLight:    'rgba(255, 255, 255, 0.06)',
  bgPanel:    'rgba(78, 80, 88, 0.24)',
  bgElevated: 'rgba(78, 80, 88, 0.30)',
  bgOverlay:  'rgba(0, 0, 0, 0.62)',
  // blur
  blur:       'blur(20px) saturate(120%)',
  blurPanel:  'blur(24px) saturate(130%)',
  blurHeavy:  'blur(32px) saturate(150%)',
  blurSubtle: 'blur(12px) saturate(110%)',
  blurOverlay:'blur(8px)',
  // borders
  border:     '1px solid rgba(255, 255, 255, 0.12)',
  borderHair: '0.5px solid rgba(255, 255, 255, 0.10)',
  borderFaint:'0.5px solid rgba(255, 255, 255, 0.07)',
  // inner lighting
  highlight:  'inset 0 1px 0 rgba(255, 255, 255, 0.12)',
  highlightSm:'inset 0 0.5px 0 rgba(255, 255, 255, 0.10)',
  // lensing
  lensing:    'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(255,255,255,0.12) 0%, transparent 50%)',
  lensingFaint:'radial-gradient(ellipse 100% 50% at 50% -10%, rgba(255,255,255,0.08) 0%, transparent 55%)',
  // dividers
  divider:    '0.5px solid rgba(255, 255, 255, 0.08)',
  dividerFaint:'0.5px solid rgba(255, 255, 255, 0.05)',
} as const

// ── Surface presets ───────────────────────────────────────────────
export const SURFACE = {
  base: {
    background: GLASS.bg,
    backdropFilter: GLASS.blur,
    WebkitBackdropFilter: GLASS.blur,
  },
  panel: {
    background: GLASS.bgPanel,
    backdropFilter: GLASS.blurPanel,
    WebkitBackdropFilter: GLASS.blurPanel,
  },
  card: {
    background: GLASS.bg,
    backdropFilter: GLASS.blur,
    WebkitBackdropFilter: GLASS.blur,
    boxShadow: `0 4px 24px rgba(0,0,0,0.30), ${GLASS.highlight}`,
  },
  cardElevated: {
    background: GLASS.bgElevated,
    backdropFilter: GLASS.blurHeavy,
    WebkitBackdropFilter: GLASS.blurHeavy,
    boxShadow: `0 8px 40px rgba(0,0,0,0.40), ${GLASS.highlight}`,
  },
  overlay: {
    background: GLASS.bgOverlay,
    backdropFilter: GLASS.blurOverlay,
    WebkitBackdropFilter: GLASS.blurOverlay,
  },
  inner: {
    background: GLASS.bgLight,
    border: GLASS.borderFaint,
  },
} as const

// ── Shadow scale ──────────────────────────────────────────────────
export const SHADOW = {
  sm:  '0 2px 8px rgba(0,0,0,0.20)',
  md:  '0 4px 24px rgba(0,0,0,0.30)',
  lg:  '0 8px 40px rgba(0,0,0,0.40)',
  xl:  '0 16px 60px rgba(0,0,0,0.50)',
  glow: (hex: string, op = 0.22) => `0 0 28px ${hexAlpha(hex, op)}`,
} as const

// ── Colour palette ────────────────────────────────────────────────
export const C = {
  // brand accents
  emerald:    '#10b981',
  error:      '#ef4444',
  warning:    '#f59e0b',
  info:       '#3b82f6',
  purple:     '#8b5cf6',
  pink:       '#ec4899',
  orange:     '#f97316',
  cyan:       '#06b6d4',
  // text
  textPrimary:   '#f5f5f7',
  textSecondary: 'rgba(255,255,255,0.55)',
  textTertiary:  'rgba(255,255,255,0.35)',
  textDisabled:  'rgba(255,255,255,0.20)',
  // scene status
  statusDone:     '#10b981',
  statusProgress: '#f59e0b',
  statusTodo:     'rgba(255,255,255,0.30)',
  statusLive:     '#ec4899',
  statusHold:     '#3b82f6',
  statusBlocked:  '#ef4444',
} as const

// ── Entity accent colours ─────────────────────────────────────────
export const ENTITY_COLOR = {
  scene:      C.info,
  person:     C.emerald,
  location:   C.purple,
  department: C.orange,
  day:        C.cyan,
  take:       C.warning,
  meal:       C.orange,
  move:       C.cyan,
  break:      C.warning,
  call:       C.emerald,
  wrap:       C.purple,
  technical:  C.error,
  weather:    C.info,
  alert:      C.error,
  metric:     C.emerald,
} as const

// ── Department colours ────────────────────────────────────────────
export const DEPT_COLOR: Record<string, string> = {
  camera:   '#3b82f6',
  lighting: '#f59e0b',
  art:      '#ef4444',
  wardrobe: '#ec4899',
  props:    '#8b5cf6',
  sfx:      '#f97316',
  sound:    '#6366f1',
  makeup:   '#ec4899',
  hair:     '#f472b6',
  vehicles: '#6b7280',
  stunts:   '#ef4444',
  vfx:      '#6366f1',
}

// ── Typography scale ──────────────────────────────────────────────
export const T = {
  // sizes (px)
  display: 48, title: 28, h2: 22, h3: 18,
  cardTitle: 16, body: 14, base: 13,
  meta: 12, sm: 11, label: 10, micro: 9,
  // weights
  regular: 400, medium: 500, semibold: 600,
  bold: 700, black: 900,
  // letter spacing
  tight: '-0.02em', normal: '0', wide: '0.04em', wider: '0.08em',
  // line height
  leading: 1.4, leadingTight: 1.2, leadingNone: 1,
} as const

// ── Motion tokens ─────────────────────────────────────────────────
export const MOTION = {
  hover:  { duration: 0.15, ease: 'easeOut' },
  press:  { scale: 0.97, duration: 0.10 },
  expand: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const },
  reveal: { duration: 0.28, ease: 'easeOut' },
  panel:  { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  spring: { type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.6 },
} as const

// ── Status system ─────────────────────────────────────────────────
export type SceneStatus = 'done' | 'progress' | 'todo' | 'live' | 'hold' | 'blocked'

export const STATUS: Record<SceneStatus, { color: string; label: string; pulse?: boolean }> = {
  done:     { color: C.emerald,  label: 'Concluído' },
  progress: { color: C.warning,  label: 'Em curso' },
  todo:     { color: C.statusTodo, label: 'Por filmar' },
  live:     { color: C.pink,     label: 'AO VIVO', pulse: true },
  hold:     { color: C.info,     label: 'Em espera' },
  blocked:  { color: C.error,    label: 'Bloqueado', pulse: true },
}

// ── Helpers ───────────────────────────────────────────────────────
export function hexAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#')) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function accentBg(hex: string, op = 0.14)   { return hexAlpha(hex, op) }
export function accentBorder(hex: string, op = 0.35) { return `1px solid ${hexAlpha(hex, op)}` }
export function accentGlow(hex: string, op = 0.22)  { return `0 0 28px ${hexAlpha(hex, op)}` }
