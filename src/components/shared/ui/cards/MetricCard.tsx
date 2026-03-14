import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { CardShell } from '../primitives/CardShell'
import { CardHeader } from '../primitives/CardHeader'
import { CardBody } from '../primitives/CardBody'
import { IconBadge } from '../primitives/IconBadge'
import { C, T, SP, R, hexAlpha } from '../tokens'
import type { MetricData } from '../types'

export function MetricCard({ metric, variant = 'standard' }: {
  metric: MetricData; variant?: 'standard' | 'compact'
}) {
  const accent = metric.accentColor ?? C.emerald
  const deltaColor = !metric.delta ? C.textTertiary
    : metric.delta.direction === 'up'   ? C.emerald
    : metric.delta.direction === 'down' ? C.error
    : C.textTertiary
  const DeltaIcon = !metric.delta ? null
    : metric.delta.direction === 'up'   ? TrendingUp
    : metric.delta.direction === 'down' ? TrendingDown
    : Minus

  if (variant === 'compact') {
    return (
      <CardShell variant="compact" accentColor={accent}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: SP.gap,
          height: '100%', padding: `0 ${SP.section}px`,
        }}>
          {metric.icon && <IconBadge icon={metric.icon} color={accent} size="sm" />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: T.micro, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {metric.label}
            </div>
            <div style={{ fontSize: T.h2, fontWeight: T.black, color: C.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {metric.value}{metric.unit && <span style={{ fontSize: T.base, color: C.textSecondary }}> {metric.unit}</span>}
            </div>
          </div>
          {metric.delta && DeltaIcon && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: deltaColor }}>
              <DeltaIcon size={14} />
              <span style={{ fontSize: T.sm, fontWeight: T.bold }}>{Math.abs(metric.delta.value)}</span>
            </div>
          )}
        </div>
      </CardShell>
    )
  }

  return (
    <CardShell variant="standard" accentColor={accent}>
      <CardHeader
        compact
        icon={metric.icon ? <IconBadge icon={metric.icon} color={accent} size="sm" /> : undefined}
        title={metric.label}
      />
      <CardBody>
        {/* Big value */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: SP.tight }}>
          <div>
            <span style={{
              fontSize: T.display, fontWeight: T.black, letterSpacing: '-0.03em',
              background: `linear-gradient(135deg, ${C.textPrimary}, ${hexAlpha(accent, 0.80)})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {metric.value}
            </span>
            {metric.unit && (
              <span style={{ fontSize: T.h2, color: C.textSecondary, marginLeft: 6 }}>{metric.unit}</span>
            )}
          </div>

          {/* Delta */}
          {metric.delta && DeltaIcon && (
            <div style={{ display: 'flex', alignItems: 'center', gap: SP.xs, color: deltaColor }}>
              <DeltaIcon size={16} />
              <span style={{ fontSize: T.base, fontWeight: T.bold }}>
                {metric.delta.direction === 'up' ? '+' : metric.delta.direction === 'down' ? '-' : ''}
                {Math.abs(metric.delta.value)}
              </span>
              {metric.delta.label && (
                <span style={{ fontSize: T.sm, color: C.textTertiary }}>{metric.delta.label}</span>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </CardShell>
  )
}
