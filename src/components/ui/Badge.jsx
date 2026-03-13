import { clsx } from 'clsx'
import styles from './Badge.module.css'

// variant: ok | warn | danger | info | default
export function Badge({ children, variant = 'default', size = 'md', className }) {
  return (
    <span className={clsx(styles.badge, styles[variant], styles[size], className)}>
      {children}
    </span>
  )
}
