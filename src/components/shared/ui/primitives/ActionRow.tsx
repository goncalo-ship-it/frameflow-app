/**
 * ActionRow — Horizontal row of action buttons inside CardFooter or CardBody.
 */

import type { CSSProperties, ReactNode, MouseEvent } from 'react'
import { T, R, C, hexAlpha, SP } from '../tokens'

export interface Action {
  label: string
  icon?: ReactNode
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  /** 'primary' gets accent fill, 'ghost' is transparent, 'danger' is red */
  variant?: 'primary' | 'ghost' | 'danger'
  accentColor?: string
  disabled?: boolean
}

export interface ActionRowProps {
  actions: Action[]
  justify?: 'start' | 'end' | 'between' | 'center'
  style?: CSSProperties
}

function ActionBtn({ action }: { action: Action }) {
  const { label, icon, onClick, variant = 'ghost', accentColor, disabled } = action
  const accent = accentColor ?? C.emerald
  const isDanger = variant === 'danger'
  const isPrimary = variant === 'primary'

  const bg = isPrimary
    ? hexAlpha(accent, 0.18)
    : isDanger ? hexAlpha(C.error, 0.12) : 'transparent'

  const border = isPrimary
    ? `0.5px solid ${hexAlpha(accent, 0.35)}`
    : isDanger ? `0.5px solid ${hexAlpha(C.error, 0.30)}` : 'none'

  const color = isDanger ? C.error : isPrimary ? accent : C.textSecondary

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: `5px ${SP.tight}px`,
        background: bg,
        border,
        borderRadius: R.sm,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontSize: T.sm,
        fontWeight: T.semibold,
        color,
        transition: 'background 0.12s, opacity 0.12s',
        letterSpacing: T.wide,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background =
          isPrimary ? hexAlpha(accent, 0.26) : isDanger ? hexAlpha(C.error, 0.18) : 'rgba(255,255,255,0.05)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = bg
      }}
    >
      {icon}
      {label}
    </button>
  )
}

const JUSTIFY_MAP = {
  start: 'flex-start', end: 'flex-end', between: 'space-between', center: 'center',
}

export function ActionRow({ actions, justify = 'end', style }: ActionRowProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: SP.tight,
      justifyContent: JUSTIFY_MAP[justify],
      flex: 1,
      ...style,
    }}>
      {actions.map((a, i) => <ActionBtn key={i} action={a} />)}
    </div>
  )
}
