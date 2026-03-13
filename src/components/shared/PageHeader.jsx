export function PageHeader({ title, subtitle, icon: Icon, iconColor, badge, actions }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {Icon && (
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: iconColor ? `${iconColor}20` : 'rgba(16,185,129,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={20} style={{ color: iconColor || 'var(--accent)' }} />
          </div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{
              fontSize: 'var(--text-xl)', fontWeight: 700,
              color: 'var(--text-primary)', lineHeight: 1.2,
            }}>
              {title}
            </h2>
            {badge && (
              <span style={{
                padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                background: badge.variant === 'success' ? 'rgba(16,185,129,0.15)'
                  : badge.variant === 'warning' ? 'rgba(245,158,11,0.15)'
                  : badge.variant === 'info' ? 'rgba(59,130,246,0.15)'
                  : 'rgba(255,255,255,0.08)',
                color: badge.variant === 'success' ? '#10b981'
                  : badge.variant === 'warning' ? '#f59e0b'
                  : badge.variant === 'info' ? '#3b82f6'
                  : 'var(--text-secondary)',
              }}>
                {badge.label}
              </span>
            )}
          </div>
          {subtitle && (
            <p style={{
              fontSize: 'var(--text-sm)', color: 'var(--text-muted)',
              marginTop: 2,
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
    </div>
  )
}
