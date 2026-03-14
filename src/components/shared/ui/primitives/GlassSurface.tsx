/**
 * GlassSurface — Five-layer Liquid Glass rendering primitive.
 *
 * Renders the glass stack as absolute layers inside a position:relative container.
 * Used by CardShell (and any other wrapper that needs glass treatment).
 *
 * Layer order (bottom → top):
 *   L1 base   — background tint + backdrop-filter
 *   L-accent  — optional accent colour fill
 *   L2 lens   — radial-gradient refraction (mix-blend-mode: overlay)
 *   L3 hl     — inset top highlight
 *   L4 border — 1px stroke
 *   L5 shadow — drop shadow + optional glow
 *   L0 content — z-index:10, receives {children}
 */

import type { CSSProperties, ReactNode } from 'react'
import { GLASS, R, hexAlpha } from '../tokens'

export interface GlassSurfaceProps {
  children: ReactNode
  radius?: number | string
  accentColor?: string
  /** Optional gradient tint over L1 (e.g. scene location colour) */
  accentGradient?: string
  /** Override the shadow entirely */
  shadow?: string
  /** Skip the lensing layer (L2) — for very small surfaces */
  noLens?: boolean
  style?: CSSProperties
  className?: string
}

export function GlassSurface({
  children,
  radius = R.xl,
  accentColor,
  accentGradient,
  shadow,
  noLens = false,
  style,
  className,
}: GlassSurfaceProps) {
  const br = typeof radius === 'number' ? `${radius}px` : radius

  const computedShadow = shadow
    ?? (accentColor
      ? `${hexAlpha(accentColor, 0.20)} 0 0 32px, 0 4px 24px rgba(0,0,0,0.32), ${GLASS.highlight}`
      : `0 4px 24px rgba(0,0,0,0.30), ${GLASS.highlight}`)

  const absLayer: CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: br,
    pointerEvents: 'none',
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: br,
        isolation: 'isolate',
        ...style,
      }}
    >
      {/* L1 — glass base */}
      <div style={{
        ...absLayer,
        background: GLASS.bg,
        backdropFilter: GLASS.blur,
        WebkitBackdropFilter: GLASS.blur,
      }} />

      {/* L-accent — optional colour tint */}
      {accentGradient && (
        <div style={{ ...absLayer, background: accentGradient }} />
      )}
      {accentColor && !accentGradient && (
        <div style={{
          ...absLayer,
          background: `linear-gradient(135deg, ${hexAlpha(accentColor, 0.10)} 0%, ${hexAlpha(accentColor, 0.04)} 100%)`,
        }} />
      )}

      {/* L2 — lensing refraction */}
      {!noLens && (
        <div style={{
          ...absLayer,
          background: GLASS.lensing,
          mixBlendMode: 'overlay',
        }} />
      )}

      {/* L3 — inner top highlight */}
      <div style={{
        ...absLayer,
        boxShadow: GLASS.highlight,
      }} />

      {/* L4 — border stroke */}
      <div style={{
        ...absLayer,
        border: accentColor
          ? `1px solid ${hexAlpha(accentColor, 0.30)}`
          : GLASS.border,
      }} />

      {/* L5 — shadow + glow */}
      <div style={{
        ...absLayer,
        boxShadow: computedShadow,
      }} />

      {/* L0 — content */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>
        {children}
      </div>
    </div>
  )
}
