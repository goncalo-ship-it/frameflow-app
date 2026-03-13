// Círculo de saúde da produção — permanente no topo da sidebar
// verde | amarelo | vermelho

import styles from './HealthIndicator.module.css'

const STATUS = {
  green:  { label: 'Produção saudável', color: 'var(--health-green)' },
  yellow: { label: 'Atenção necessária', color: 'var(--health-yellow)' },
  red:    { label: 'Acção urgente',      color: 'var(--health-red)' },
}

export function HealthIndicator({ status = 'green', compact = false, projectName }) {
  const s = STATUS[status]
  const displayLabel = projectName || s.label

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.circle}
        style={{ '--health-color': s.color }}
        title={displayLabel}
        aria-label={`Saúde da produção: ${displayLabel}`}
      >
        <span className={styles.pulse} />
        {!compact && <span className={styles.ring} />}
      </div>
      {!compact && (
        <span className={styles.label}>{displayLabel}</span>
      )}
    </div>
  )
}
