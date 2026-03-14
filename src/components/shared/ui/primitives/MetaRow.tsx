/**
 * MetaRow — A single label/value metadata pair.
 * Used inside CardBody for structured scene/entity details.
 */

import type { CSSProperties, ReactNode } from 'react'
import { T, C, SP } from '../tokens'

export interface MetaRowProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  accentColor?: string
  /** Stack label above value (instead of inline) */
  vertical?: boolean
  style?: CSSProperties
}

export function MetaRow({ label, value, icon, accentColor, vertical = false, style }: MetaRowProps) {
  if (vertical) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, ...style }}>
        <span style={{
          fontSize: T.label,
          fontWeight: T.bold,
          color: accentColor ?? C.textTertiary,
          letterSpacing: T.wider,
          textTransform: 'uppercase',
        }}>
          {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
          {label}
        </span>
        <span style={{
          fontSize: T.base,
          fontWeight: T.medium,
          color: C.textPrimary,
          lineHeight: T.leadingTight,
        }}>
          {value}
        </span>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: SP.tight,
      ...style,
    }}>
      {icon && (
        <span style={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          color: accentColor ?? C.textTertiary,
        }}>
          {icon}
        </span>
      )}
      <span style={{
        fontSize: T.sm,
        fontWeight: T.semibold,
        color: accentColor ?? C.textTertiary,
        letterSpacing: T.wide,
        textTransform: 'uppercase',
        flexShrink: 0,
        minWidth: 70,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: T.sm,
        fontWeight: T.medium,
        color: C.textPrimary,
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </span>
    </div>
  )
}
