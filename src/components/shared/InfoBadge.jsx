const BADGE_VARIANTS = {
  default:  { bg: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', border: 'rgba(255,255,255,0.08)' },
  success:  { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
  warning:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  info:     { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
  danger:   { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
}

const BADGE_SIZES = {
  sm: { h: 24, px: 8, fontSize: 11, iconSize: 12, gap: 4 },
  md: { h: 28, px: 10, fontSize: 12, iconSize: 14, gap: 5 },
  lg: { h: 32, px: 12, fontSize: 13, iconSize: 16, gap: 6 },
}

export function InfoBadge({ label, value, icon: Icon, variant = 'default', size = 'sm' }) {
  const v = BADGE_VARIANTS[variant] || BADGE_VARIANTS.default
  const s = BADGE_SIZES[size] || BADGE_SIZES.sm

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: s.gap,
      height: s.h, padding: `0 ${s.px}px`, borderRadius: 999,
      background: v.bg, border: `0.5px solid ${v.border}`,
      fontSize: s.fontSize, fontWeight: 600, color: v.color,
      whiteSpace: 'nowrap',
    }}>
      {Icon && <Icon size={s.iconSize} />}
      {label && <span style={{ opacity: 0.7 }}>{label}</span>}
      {value !== undefined && <span>{value}</span>}
    </div>
  )
}
