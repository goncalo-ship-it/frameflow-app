/**
 * CardShell — Canonical card container.
 *
 * Enforces the size discipline. Entity cards use only the four canonical variants:
 *   compact=120px  standard=360px  expanded=520px  live=72px
 *
 * Cards NEVER grow past their variant max-height.
 * Overflow content is handled internally via CardBody scrolling.
 *
 * NOTE: 'auto' is an internal escape hatch for layout containers only.
 *       Canonical entity cards must NEVER pass variant='auto'.
 */

import type { CSSProperties, ReactNode, MouseEvent } from 'react'
import { GlassSurface } from './GlassSurface'
import { CARD_HEIGHT, R } from '../tokens'
import type { CanonicalCardVariant } from '../tokens'

export interface CardShellProps {
  children: ReactNode
  /**
   * Canonical size variant. Entity cards must use only these four values.
   * Do NOT pass 'auto' from entity card components.
   */
  variant?: CanonicalCardVariant
  accentColor?: string
  accentGradient?: string
  /** Fill the height of the parent grid cell instead of using a fixed height */
  fillHeight?: boolean
  className?: string
  style?: CSSProperties
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  /** Highlight ring when selected */
  selected?: boolean
}

export function CardShell({
  children,
  variant = 'standard',
  accentColor,
  accentGradient,
  fillHeight = false,
  className,
  style,
  onClick,
  selected = false,
}: CardShellProps) {
  const fixedHeight = CARD_HEIGHT[variant] ?? undefined

  const outerStyle: CSSProperties = {
    height: fillHeight ? '100%' : fixedHeight ? `${fixedHeight}px` : undefined,
    maxHeight: fixedHeight ? `${fixedHeight}px` : undefined,
    cursor: onClick ? 'pointer' : undefined,
    borderRadius: `${R.xl}px`,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    // selected ring
    outline: selected ? `2px solid ${accentColor ?? 'rgba(255,255,255,0.4)'}` : 'none',
    outlineOffset: 2,
    transition: 'outline 0.15s, transform 0.15s',
    ...style,
  }

  return (
    <GlassSurface
      radius={R.xl}
      accentColor={accentColor}
      accentGradient={accentGradient}
      className={className}
      style={outerStyle}
      // @ts-expect-error onClick on GlassSurface wrapper div
      onClick={onClick}
    >
      {children}
    </GlassSurface>
  )
}
