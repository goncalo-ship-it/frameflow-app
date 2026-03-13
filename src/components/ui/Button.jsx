import { clsx } from 'clsx'
import styles from './Button.module.css'

// Variantes: primary | ghost | danger | subtle
// Tamanhos: sm | md | lg
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconOnly = false,
  disabled = false,
  loading = false,
  onClick,
  className,
  ...props
}) {
  return (
    <button
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        iconOnly && styles.iconOnly,
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden />
      ) : (
        <>
          {icon && <span className={styles.icon}>{icon}</span>}
          {!iconOnly && children && <span>{children}</span>}
        </>
      )}
    </button>
  )
}
