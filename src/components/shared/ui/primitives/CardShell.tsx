/**
 * CardShell — Canonical card container.
 *
 * Enforces the size discipline (compact / standard / expanded / live / auto).
 * Cards NEVER grow past their variant max-height.
 * Overflow content is handled internally via CardBody scrolling.
 *
 * All entity cards are built on CardShell.
 */

import type { CSSProperties, ReactNode, MouseEvent } from 'react'
import { GlassSurface } from './GlassSurface'
import { CARD_HEIGHT, R } from '../tokens'
import type { CardVariant } from '../tokens'

export interface CardShellProps {
  children: ReactNode
  variant?: CardVariant
  accentColor?: string
  accentGradient?: string
  /** Override card height (only when variant='auto') */
  height?: number | string
  /** Fill the height of the parent grid cell */
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
  height,
  fillHeight = false,
  className,
  style,
  onClick,
  selected = false,
}: CardShellProps) {
  const fixedHeight = variant !== 'auto'
    ? CARD_HEIGHT[variant as keyof typeof CARD_HEIGHT] ?? undefined
    : (height ?? undefined)

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
