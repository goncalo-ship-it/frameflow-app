/**
 * IconBadge — A coloured icon container.
 * Standard size: 36px. Compact: 28px. Used in card headers and list items.
 */

import type { CSSProperties, ReactNode } from 'react'
import { R, hexAlpha } from '../tokens'

export interface IconBadgeProps {
  icon: ReactNode
  color: string
  size?: 'xs' | 'sm' | 'md'
  style?: CSSProperties
}

const DIMS = { xs: 24, sm: 30, md: 36 }
const BRAD = { xs: R.xs, sm: R.sm, md: R.md }

export function IconBadge({ icon, color, size = 'md', style }: IconBadgeProps) {
  const d = DIMS[size]
  const br = BRAD[size]
  return (
    <div style={{
      width: d, height: d, borderRadius: br,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      background: hexAlpha(color, 0.15),
      border: `0.5px solid ${hexAlpha(color, 0.30)}`,
      color,
      ...style,
    }}>
      {icon}
    </div>
  )
}
