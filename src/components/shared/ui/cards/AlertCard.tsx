import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react'
import { CardShell } from '../primitives/CardShell'
import { CardBody } from '../primitives/CardBody'
import { C, T, SP, R, hexAlpha } from '../tokens'
import type { AlertData } from '../types'
import type { ReactNode } from 'react'

const ALERT_CFG: Record<string, { color: string; icon: ReactNode }> = {
  error:   { color: C.error,   icon: <AlertCircle size={16} /> },
  warning: { color: C.warning, icon: <AlertTriangle size={16} /> },
  info:    { color: C.info,    icon: <Info size={16} /> },
  success: { color: C.emerald, icon: <CheckCircle2 size={16} /> },
}

export function AlertCard({ alert, onDismiss, onAction }: {
  alert: AlertData; onDismiss?: () => void; onAction?: () => void
}) {
  const cfg    = ALERT_CFG[alert.type] ?? ALERT_CFG.info
  const accent = cfg.color

  return (
    <CardShell variant="compact" accentColor={accent}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: SP.gap,
        height: '100%', padding: `0 ${SP.section}px`,
      }}>
        {/* Icon */}
        <div style={{
          width: 32, height: 32, borderRadius: R.xs, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: hexAlpha(accent, 0.15),
          border: `0.5px solid ${hexAlpha(accent, 0.30)}`,
          color: accent,
        }}>{cfg.icon}</div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: T.sm, fontWeight: T.bold, color: accent, lineHeight: T.leadingTight }}>
            {alert.title}
          </div>
          {alert.message && (
            <div style={{
              fontSize: T.sm, color: C.textSecondary, marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{alert.message}</div>
          )}
        </div>

        {/* Action */}
        {alert.action && onAction && (
          <button onClick={onAction} style={{
            padding: '4px 10px', borderRadius: R.sm, flexShrink: 0,
            background: hexAlpha(accent, 0.15), border: `0.5px solid ${hexAlpha(accent, 0.35)}`,
            color: accent, fontSize: T.sm, fontWeight: T.bold, cursor: 'pointer',
          }}>
            {alert.action.label}
          </button>
        )}

        {/* Dismiss */}
        {onDismiss && (
          <button onClick={onDismiss} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0,
            color: C.textTertiary, display: 'flex', alignItems: 'center',
          }}>
            <X size={14} />
          </button>
        )}
      </div>
    </CardShell>
  )
}
