import { motion } from 'framer-motion'
import { SPRING } from '../../core/design.js'

export function Tabs({ tabs, activeTab, onChange, variant = 'pills', size = 'md' }) {
  const isPills = variant === 'pills'
  const h = size === 'sm' ? 32 : size === 'lg' ? 44 : 36

  return (
    <div style={{
      display: 'flex', gap: isPills ? 6 : 0,
      overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      ...(isPills ? {
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12, padding: 3,
        border: '0.5px solid rgba(255,255,255,0.06)',
      } : {
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }),
    }}>
      {tabs.map(tab => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              position: 'relative', display: 'flex', alignItems: 'center',
              gap: 6, height: h, whiteSpace: 'nowrap',
              fontSize: size === 'sm' ? 12 : 13, fontWeight: active ? 600 : 500,
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              transition: 'color 0.2s',
              ...(isPills ? {
                padding: `0 ${size === 'sm' ? 10 : 14}px`,
                borderRadius: 10,
              } : {
                padding: `0 ${size === 'sm' ? 12 : 16}px`,
              }),
            }}
          >
            {active && isPills && (
              <motion.div
                layoutId="activeTab"
                transition={SPRING.subtle}
                style={{
                  position: 'absolute', inset: 0, borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                }}
              />
            )}
            {active && !isPills && (
              <motion.div
                layoutId="activeTabLine"
                transition={SPRING.subtle}
                style={{
                  position: 'absolute', bottom: -1, left: 0, right: 0,
                  height: 2, borderRadius: 1,
                  background: 'var(--accent)',
                }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: active ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  padding: '1px 6px', borderRadius: 999, minWidth: 18, textAlign: 'center',
                }}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
