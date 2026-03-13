import { clsx } from 'clsx'
import styles from './Card.module.css'

// Card com efeito 3D leve e cor de identidade por módulo
export function Card({
  children,
  moduleColor,    // cor CSS (ex: 'var(--mod-universe)')
  elevated = false,
  interactive = false,
  className,
  onClick,
  ...props
}) {
  return (
    <div
      className={clsx(
        styles.card,
        elevated   && styles.elevated,
        interactive && styles.interactive,
        className
      )}
      style={moduleColor ? { '--card-accent': moduleColor } : undefined}
      onClick={onClick}
      {...props}
    >
      {moduleColor && <div className={styles.accentLine} />}
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return <div className={clsx(styles.header, className)}>{children}</div>
}

export function CardBody({ children, className }) {
  return <div className={clsx(styles.body, className)}>{children}</div>
}

export function CardFooter({ children, className }) {
  return <div className={clsx(styles.footer, className)}>{children}</div>
}
