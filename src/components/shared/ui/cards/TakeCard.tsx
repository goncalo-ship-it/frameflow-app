import { CardShell } from '../primitives/CardShell'
import { C, T, SP, R, hexAlpha } from '../tokens'
import type { TakeData } from '../types'

const TAKE_COLOR: Record<string, string> = {
  BOM:  C.emerald, NG: C.error, REC: C.pink, HOLD: C.info,
}

export function TakeCard({ take, sceneNumber, onStatusChange }: {
  take: TakeData; sceneNumber?: string; onStatusChange?: (status: string) => void
}) {
  const accent = TAKE_COLOR[take.status] ?? C.textTertiary

  return (
    <CardShell variant="compact" accentColor={accent}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: SP.gap,
        height: '100%', padding: `0 ${SP.section}px`,
      }}>
        {/* Take number */}
        <div style={{
          flexShrink: 0, width: 40, textAlign: 'center',
          fontSize: T.h2, fontWeight: T.black, color: accent,
          letterSpacing: '-0.02em', lineHeight: 1,
        }}>
          {take.number}
        </div>

        {/* Status + notes */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SP.xs, marginBottom: 2 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: R.pill,
              background: hexAlpha(accent, 0.15), border: `0.5px solid ${hexAlpha(accent, 0.35)}`,
              fontSize: T.micro, fontWeight: T.black, color: accent,
              letterSpacing: '0.06em',
            }}>
              {take.status}
            </div>
            {sceneNumber && (
              <span style={{ fontSize: T.micro, color: C.textTertiary }}>SC {sceneNumber}</span>
            )}
          </div>
          {take.notes && (
            <div style={{
              fontSize: T.sm, color: C.textSecondary,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{take.notes}</div>
          )}
        </div>

        {/* Timestamp */}
        {take.timestamp && (
          <span style={{ fontSize: T.micro, color: C.textTertiary, flexShrink: 0 }}>
            {take.timestamp}
          </span>
        )}

        {/* Action buttons */}
        {onStatusChange && (
          <div style={{ display: 'flex', gap: SP.xs, flexShrink: 0 }}>
            {(['BOM','NG','HOLD'] as const).map(s => (
              <button key={s} onClick={() => onStatusChange(s)} style={{
                padding: '3px 8px', borderRadius: R.xs,
                background: take.status === s ? hexAlpha(TAKE_COLOR[s], 0.20) : 'transparent',
                border: `0.5px solid ${hexAlpha(TAKE_COLOR[s], take.status === s ? 0.50 : 0.20)}`,
                color: TAKE_COLOR[s], fontSize: T.micro, fontWeight: T.bold, cursor: 'pointer',
                opacity: take.status === s ? 1 : 0.55,
              }}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </CardShell>
  )
}
