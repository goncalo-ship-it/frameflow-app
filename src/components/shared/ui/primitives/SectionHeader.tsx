/**
 * SectionHeader — Labelled section divider inside a card body.
 */

import type { CSSProperties, ReactNode } from 'react'
import { T, C, SP, GLASS } from '../tokens'

export interface SectionHeaderProps {
  title: string
  icon?: ReactNode
  count?: number
  action?: ReactNode
  accentColor?: string
  /** Show a top border separator */
  separator?: boolean
  style?: CSSProperties
}

export function SectionHeader({
  title, icon, count, action, accentColor, separator = false, style,
}: SectionHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: SP.tight,
      paddingTop: separator ? SP.section : 0,
      marginTop: separator ? SP.section : 0,
      borderTop: separator ? GLASS.divider : 'none',
      ...style,
    }}>
      {icon && (
        <span style={{
          display: 'flex',
          alignItems: 'center',
          color: accentColor ?? C.textTertiary,
          flexShrink: 0,
        }}>
          {icon}
        </span>
      )}
      <span style={{
        fontSize: T.label,
        fontWeight: T.bold,
        color: accentColor ?? C.textTertiary,
        letterSpacing: T.wider,
        textTransform: 'uppercase',
        flex: 1,
      }}>
        {title}
        {count !== undefined && (
          <span style={{
            marginLeft: 6,
            fontSize: T.micro,
            fontWeight: T.bold,
            color: accentColor ? `${accentColor}99` : 'rgba(255,255,255,0.25)',
          }}>
            {count}
          </span>
        )}
      </span>
      {action && (
        <div style={{ flexShrink: 0 }}>{action}</div>
      )}
    </div>
  )
}
