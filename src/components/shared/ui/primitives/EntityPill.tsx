/**
 * EntityPill — Compact reference chip for a named entity.
 * Used inline in card bodies to link to scene / person / location / department.
 */

import type { CSSProperties, ReactNode, MouseEvent } from 'react'
import { T, R, hexAlpha, ENTITY_COLOR } from '../tokens'

export type EntityType = 'scene' | 'person' | 'location' | 'department' | 'day' | 'take' | 'custom'

export interface EntityPillProps {
  label: string
  type?: EntityType
  /** Override the accent colour entirely */
  color?: string
  icon?: ReactNode
  /** Make it a button */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  /** Dim state — entity exists but is not relevant */
  muted?: boolean
  size?: 'xs' | 'sm' | 'md'
  style?: CSSProperties
}

const FONT: Record<string, number> = { xs: T.micro, sm: T.label, md: T.sm }
const PAD: Record<string, string>  = { xs: '2px 6px', sm: '3px 8px', md: '4px 10px' }

export function EntityPill({
  label, type = 'custom', color, icon, onClick, muted = false, size = 'sm', style,
}: EntityPillProps) {
  const accent = color ?? ENTITY_COLOR[type] ?? 'rgba(255,255,255,0.4)'
  const bg     = muted ? 'rgba(255,255,255,0.04)' : hexAlpha(accent, 0.12)
  const border = muted ? '0.5px solid rgba(255,255,255,0.08)' : `0.5px solid ${hexAlpha(accent, 0.30)}`
  const textCol= muted ? 'rgba(255,255,255,0.35)' : accent

  const inner = (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: PAD[size],
      background: bg,
      border,
      borderRadius: R.pill,
      fontSize: FONT[size],
      fontWeight: T.semibold,
      color: textCol,
      letterSpacing: T.wide,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.12s',
      ...style,
    }}>
      {icon && <span style={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>{icon}</span>}
      {label}
    </span>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        {inner}
      </button>
    )
  }
  return inner
}
