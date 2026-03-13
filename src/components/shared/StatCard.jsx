import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { SPRING } from '../../core/design.js'

export function StatCard({ label, value, icon: Icon, iconColor, trend, footer, onClick }) {
  const Wrapper = onClick ? motion.button : motion.div

  return (
    <Wrapper
      onClick={onClick}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={SPRING.subtle}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 10,
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left', width: '100%',
        ...(onClick ? {} : {}),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: iconColor ? `${iconColor}18` : 'rgba(16,185,129,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} style={{ color: iconColor || 'var(--accent)' }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
          {value}
        </span>
        {trend && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 12, fontWeight: 600,
            color: trend.direction === 'up' ? '#10b981'
              : trend.direction === 'down' ? '#ef4444' : 'var(--text-muted)',
          }}>
            {trend.direction === 'up' ? <TrendingUp size={12} />
              : trend.direction === 'down' ? <TrendingDown size={12} />
              : <Minus size={12} />}
            {trend.value}
          </span>
        )}
      </div>
      {footer && <div style={{ marginTop: 2 }}>{footer}</div>}
    </Wrapper>
  )
}
