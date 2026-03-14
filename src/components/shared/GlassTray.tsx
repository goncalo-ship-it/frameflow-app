/**
 * GlassTray — FrameFlow Liquid Glass Card
 *
 * Spec: WEATHER-CARD-STANDALONE.html (single source of truth)
 *
 * Architecture (5 layers):
 *   L1: gt-glass     → blur(20px) saturate(120%) + rgba(78,80,88,0.18)
 *   ──: accent-fill  → optional colored gradient tint (per card type)
 *   L2: gt-lensing   → radial-gradient refraction, mix-blend-mode:overlay
 *   L3: gt-hl        → inset 0 1px 0 rgba(255,255,255,0.12)
 *   L4: gt-border    → 1px solid (accent or default white)
 *   L5: gt-shadow    → 0 4px 24px rgba(0,0,0,0.3) + optional accent glow
 *   L0: gt-content   → z-index:10, padding:24px, overflow-y:auto if scrollable
 *
 * Nested elements use r-lg (20px) = parent 28px - 8px.
 *
 * SIZE RULE: All dashboard cards use this component.
 * Cards share the same grid row height (CSS grid stretch).
 * If content exceeds available height → scrollable=true, no card expansion.
 */

import type { CSSProperties, ReactNode, MouseEvent } from 'react';

export interface GlassTrayProps {
  children: ReactNode;
  /** Accent colour for border + shadow glow, e.g. '#3b82f6' */
  accentColor?: string;
  /** Optional gradient tint layer, e.g. 'linear-gradient(135deg,rgba(59,130,246,.18),rgba(37,99,235,.08))' */
  accentGradient?: string;
  /** Inner padding. Default: 24px */
  padding?: number | string;
  /** Allow gt-content to scroll vertically instead of expanding */
  scrollable?: boolean;
  /** Fill parent height (use inside CSS grid / flex containers) */
  fillHeight?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

const R = '28px'; // --r-xl

export function GlassTray({
  children,
  accentColor,
  accentGradient,
  padding = 24,
  scrollable = false,
  fillHeight = false,
  className,
  style,
  onClick,
}: GlassTrayProps) {
  const interactive = !!onClick;

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: R,
        transition: 'transform .2s cubic-bezier(.25,.1,.25,1)',
        cursor: interactive ? 'pointer' : undefined,
        height: fillHeight ? '100%' : undefined,
        // hover/active handled via CSS-in-JS or leave to parent
        ...style,
      }}
    >
      {/* L1 — Glass blur + base bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(78,80,88,0.18)',
        backdropFilter: 'blur(20px) saturate(120%)',
        WebkitBackdropFilter: 'blur(20px) saturate(120%)',
      }} />

      {/* Accent fill (optional) */}
      {accentGradient && (
        <div style={{
          position: 'absolute', inset: 0,
          pointerEvents: 'none',
          borderRadius: R,
          background: accentGradient,
        }} />
      )}

      {/* L2 — Lensing refraction */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none',
        borderRadius: R,
        background: 'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(255,255,255,0.12) 0%, transparent 50%)',
        mixBlendMode: 'overlay',
      }} />

      {/* L3 — Inner highlight */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none',
        borderRadius: R,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
      }} />

      {/* L4 — Border */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none',
        borderRadius: R,
        border: accentColor
          ? `1px solid ${accentColor}40`
          : '1px solid rgba(255,255,255,0.12)',
      }} />

      {/* L5 — Shadow */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none',
        borderRadius: R,
        boxShadow: accentColor
          ? `0 0 32px ${accentColor}18, 0 4px 24px rgba(0,0,0,0.3)`
          : '0 4px 24px rgba(0,0,0,0.3)',
      }} />

      {/* L0 — Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: typeof padding === 'number' ? `${padding}px` : padding,
        height: fillHeight ? '100%' : undefined,
        overflowY: scrollable ? 'auto' : undefined,
        boxSizing: 'border-box',
      }}>
        {children}
      </div>
    </div>
  );
}

/**
 * GlassTrayDetail — nested sub-card inside a GlassTray
 * Uses r-lg (20px) per nested corners rule (parent 28 - 8 = 20)
 */
export function GlassTrayDetail({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{
      borderRadius: '20px',
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.07)',
      ...style,
    }}>
      {children}
    </div>
  );
}
