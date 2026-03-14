/**
 * StatusBadge — Semantic production status indicator.
 * Supports: done | progress | todo | live | hold | blocked
 */

import type { CSSProperties } from 'react'
import { STATUS, T, R, hexAlpha } from '../tokens'
import type { SceneStatus } from '../tokens'

export interface StatusBadgeProps {
  status: SceneStatus
  /** Show text label alongside the dot */
  showLabel?: boolean
  size?: 'xs' | 'sm' | 'md'
  style?: CSSProperties
}

const SIZE = {
  xs: { dot: 6,  font: T.micro, pad: '2px 6px' },
  sm: { dot: 7,  font: T.label, pad: '3px 8px' },
  md: { dot: 8,  font: T.sm,   pad: '4px 10px' },
}

export function StatusBadge({ status, showLabel = true, size = 'sm', style }: StatusBadgeProps) {
  const s = STATUS[status]
  const sz = SIZE[size]
  const pulse = s.pulse

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: showLabel ? sz.pad : undefined,
      background: showLabel ? hexAlpha(s.color, 0.14) : undefined,
      border: showLabel ? `0.5px solid ${hexAlpha(s.color, 0.30)}` : undefined,
      borderRadius: R.pill,
      ...style,
    }}>
      {/* Dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: sz.dot,
          height: sz.dot,
          borderRadius: '50%',
          background: s.color,
          boxShadow: `0 0 6px ${hexAlpha(s.color, 0.6)}`,
        }} />
        {pulse && (
          <div style={{
            position: 'absolute',
            inset: -2,
            borderRadius: '50%',
            border: `1.5px solid ${hexAlpha(s.color, 0.5)}`,
            animation: 'ff-pulse 1.8s ease-in-out infinite',
          }} />
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span style={{
          fontSize: sz.font,
          fontWeight: T.bold,
          color: s.color,
          letterSpacing: T.wide,
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          {s.label}
        </span>
      )}
    </div>
  )
}

// Pulse animation (injected once)
if (typeof document !== 'undefined' && !document.getElementById('ff-status-badge-anim')) {
  const el = document.createElement('style')
  el.id = 'ff-status-badge-anim'
  el.textContent = `
    @keyframes ff-pulse {
      0%, 100% { transform: scale(1); opacity: 0.7; }
      50%       { transform: scale(1.5); opacity: 0; }
    }
  `
  document.head.appendChild(el)
}
