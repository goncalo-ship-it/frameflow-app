/**
 * FRAMEFLOW DESIGN SYSTEM — Tokens centralizados
 *
 * Baseado no Figma FF07 / Liquid Glass (WWDC25)
 * Fonte única de verdade para cores, glass, radii, sombras, animações.
 *
 * USO:
 *   import { LIQUID_GLASS, COLORS, SPRING } from '@/core/design'
 *   style={{ ...LIQUID_GLASS.default }}
 */

// ============================================
// BACKGROUNDS (FF07 tokens)
// ============================================
export const BACKGROUNDS = {
  // Dark: slate atmosférico → deep blue-teal (Figma ref)
  dark: 'linear-gradient(155deg, #50565F 0%, #3A4048 35%, #2C3340 65%, #1E2830 100%)',
  darkSubtle: 'linear-gradient(155deg, #50565F 0%, #3A4048 35%, #2C3340 65%, #1E2830 100%)',
  darkAuth: 'linear-gradient(155deg, #50565F 0%, #3A4048 35%, #2C3340 65%, #1E2830 100%)',
  // Light: lavanda atmosférico (Figma ref)
  light: 'linear-gradient(155deg, #B0B4BE 0%, #A4A8B2 35%, #989CA8 65%, #8C909C 100%)',
};

// ============================================
// LIQUID GLASS EFFECTS
// ============================================
export const LIQUID_GLASS = {
  // Padrão — GlassTray base
  default: {
    background: 'rgba(30, 34, 42, 0.50)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '0.5px solid rgba(255, 255, 255, 0.15)',
    boxShadow:
      '0 4px 12px rgba(0, 0, 0, 0.22), inset 0 0.5px 0.5px rgba(255, 255, 255, 0.2)',
  },
  // Subtle — NestedTray
  subtle: {
    background: 'rgba(30, 34, 42, 0.30)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '0.5px solid rgba(255, 255, 255, 0.10)',
    boxShadow: 'none',
  },
  // Elevated — cards destacados
  elevated: {
    background: 'rgba(30, 34, 42, 0.60)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '0.5px solid rgba(255, 255, 255, 0.18)',
    boxShadow:
      '0 8px 24px rgba(0, 0, 0, 0.28), inset 0 0.5px 0.5px rgba(255, 255, 255, 0.2)',
  },
  // Strong — modals, overlays
  strong: {
    background: 'rgba(30, 34, 42, 0.75)',
    backdropFilter: 'blur(30px) saturate(180%)',
    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
    border: '0.5px solid rgba(255, 255, 255, 0.22)',
    boxShadow:
      '0 12px 48px rgba(0, 0, 0, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
  },
};

// ============================================
// COLORS
// ============================================
export const COLORS = {
  // Texto (FF07 tokens — Figma exact)
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.6)',
  textLabel: 'rgba(255, 255, 255, 0.5)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  textDisabled: 'rgba(255, 255, 255, 0.3)',

  // FF07 Accent Palette
  emerald: '#10b981',
  emeraldDark: '#059669',
  emeraldGlow: 'rgba(16, 185, 129, 0.4)',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316',

  // Estados (aliases)
  error: '#ef4444',
  errorDark: '#DC2626',
  warning: '#f59e0b',
  warningDark: '#D97706',
  info: '#3b82f6',
  infoDark: '#2563EB',
  success: '#10b981',
  successDark: '#059669',

  // Neutros
  white: '#ffffff',
  black: '#000000',
  bg: '#3C424C',

  // Glass backgrounds
  glassBase: 'rgba(30, 34, 42, 0.50)',
  glassNested: 'rgba(30, 34, 42, 0.30)',
  chartBg: 'rgba(0, 0, 0, 0.20)',

  // Borders
  borderGlass: 'rgba(255, 255, 255, 0.18)',
  borderNested: 'rgba(255, 255, 255, 0.08)',

  // Departamentos
  camera: '#10b981',
  direcao: '#3b82f6',
  producao: '#ec4899',
  arte: '#f59e0b',
  som: '#8b5cf6',
  makeup: '#06B6D4',
  guardaroupa: '#f97316',
  casting: '#A855F7',
  transporte: '#14b8a6',
  stunts: '#ef4444',
};

// ============================================
// BORDER RADIUS (Nested Corners — Figma)
// ============================================
export const RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  xxl: '20px',
  pill: '9999px',
  // FF07 Nested Corners
  glassTray: '28px',     // Container principal
  nestedTray: '14px',    // Sub-containers (metade do parent)
  chartTray: '18px',     // Gráficos
  modal: '32px',         // Modais
  pillButton: '20px',    // Botões pill
  iconContainer: '24px', // Ícones decorativos
  image: '14px',         // Fotos dentro de trays
  // Legacy aliases
  container: '28px',
  containerLarge: '28px',
  containerXL: '32px',
  nested: '14px',
  nestedSmall: '12px',
  button: '14px',
  buttonLarge: '20px',
};

// ============================================
// PADDING (Nested Corners — FF05)
// ============================================
export const PADDING = {
  nested: '12px',
  nestedSmall: '8px',
  nestedLarge: '16px',
};

// ============================================
// ANIMATIONS (Framer Motion springs)
// ============================================
export const SPRING = {
  subtle: { type: 'spring', stiffness: 300, damping: 30 },
  default: { type: 'spring', stiffness: 200, damping: 25 },
  bouncy: { type: 'spring', stiffness: 150, damping: 20 },
  smooth: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
};

// ============================================
// SHADOWS
// ============================================
export const SHADOWS = {
  soft: '0 2px 8px rgba(0, 0, 0, 0.05)',
  medium: '0 4px 16px rgba(0, 0, 0, 0.1)',
  strong: '0 8px 32px rgba(0, 0, 0, 0.15)',
  glowEmerald: '0 0 24px rgba(16, 185, 129, 0.4)',
  glowBlue: '0 0 24px rgba(59, 130, 246, 0.4)',
  glowPurple: '0 0 24px rgba(168, 85, 247, 0.4)',
  glowRed: '0 0 24px rgba(239, 68, 68, 0.4)',
  buttonEmerald: '0 4px 16px rgba(16, 185, 129, 0.4)',
};

// ============================================
// Z-INDEX
// ============================================
export const Z_INDEX = {
  background: -1,
  base: 0,
  raised: 10,
  sidebar: 100,
  header: 200,
  dropdown: 300,
  overlay: 400,
  modal: 500,
  toast: 1000,
};
