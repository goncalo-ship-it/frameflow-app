/**
 * CardHeader — Top section of a card. Fixed height, never scrolls.
 *
 * Layout: [icon?] [title + subtitle] [badge?] [action?]
 */

import type { CSSProperties, ReactNode } from 'react'
import { GLASS, SP, T, C } from '../tokens'

export interface CardHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  badge?: ReactNode
  action?: ReactNode
  /** Removes the bottom divider (for seamless continuation) */
  noBorder?: boolean
  style?: CSSProperties
  /** Compact mode: 40px instead of 52px */
  compact?: boolean
}

export function CardHeader({
  title,
  subtitle,
  icon,
  badge,
  action,
  noBorder = false,
  compact = false,
  style,
}: CardHeaderProps) {
  const height = compact ? 40 : 52

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SP.gap,
        padding: compact ? `0 ${SP.section}px` : `0 ${SP.card}px`,
        height,
        flexShrink: 0,
        borderBottom: noBorder ? 'none' : GLASS.divider,
        ...style,
      }}
    >
      {/* Icon slot */}
      {icon && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: C.textSecondary }}>
          {icon}
        </div>
      )}

      {/* Title + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: compact ? T.sm : T.cardTitle,
          fontWeight: T.bold,
          color: C.textPrimary,
          lineHeight: T.leadingTight,
          letterSpacing: T.tight,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{
            fontSize: T.sm,
            color: C.textSecondary,
            lineHeight: T.leadingNone,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Badge slot */}
      {badge && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {badge}
        </div>
      )}

      {/* Action slot */}
      {action && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {action}
        </div>
      )}
    </div>
  )
}
