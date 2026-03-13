// NotificationCenter — dropdown de notificações com bell icon + badge
// Integra no TopBar, substitui o botão bell simples

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Info, CheckCircle, AlertTriangle, AlertCircle, Check } from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import styles from './NotificationCenter.module.css'

const TYPE_ICONS = {
  info:    Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error:   AlertCircle,
}

function formatTime(ts) {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function getDateLabel(ts) {
  const now = new Date()
  const d = new Date(ts)

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.floor((today - target) / 86400000)

  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'

  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useStore(useShallow(s => ({
    notifications: s.ui.notifications,
    markNotificationRead: s.markNotificationRead,
    markAllNotificationsRead: s.markAllNotificationsRead,
    clearNotifications: s.clearNotifications,
  })))

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  )

  // Group by date
  const grouped = useMemo(() => {
    const groups = []
    let currentLabel = null

    for (const notif of notifications) {
      const label = getDateLabel(notif.timestamp)
      if (label !== currentLabel) {
        currentLabel = label
        groups.push({ label, items: [] })
      }
      groups[groups.length - 1].items.push(notif)
    }

    return groups
  }, [notifications])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const handleItemClick = useCallback((id) => {
    markNotificationRead(id)
  }, [markNotificationRead])

  const handleMarkAllRead = useCallback(() => {
    markAllNotificationsRead()
  }, [markAllNotificationsRead])

  const handleClear = useCallback(() => {
    clearNotifications()
    setOpen(false)
  }, [clearNotifications])

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {/* Bell button */}
      <button
        className={styles.bellBtn}
        data-open={open}
        onClick={() => setOpen(v => !v)}
        title="Notificações"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={styles.badge} key={unreadCount}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop — click outside to close */}
            <div className={styles.backdrop} onClick={() => setOpen(false)} />

            {/* Dropdown */}
            <motion.div
              className={styles.dropdown}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Header */}
              <div className={styles.header}>
                <span className={styles.headerTitle}>Notificações</span>
                <div className={styles.headerActions}>
                  {unreadCount > 0 && (
                    <button className={styles.headerBtn} onClick={handleMarkAllRead}>
                      <Check size={12} />
                      Marcar tudo como lido
                    </button>
                  )}
                  <button className={styles.closeBtn} onClick={() => setOpen(false)}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* List */}
              {notifications.length === 0 ? (
                <div className={styles.empty}>
                  <Bell size={40} className={styles.emptyIcon} />
                  <span className={styles.emptyText}>Sem notificações</span>
                </div>
              ) : (
                <>
                  <div className={styles.list}>
                    {grouped.map((group) => (
                      <div key={group.label}>
                        <div className={styles.dateGroup}>{group.label}</div>
                        {group.items.map((notif) => {
                          const Icon = TYPE_ICONS[notif.type] || Info
                          return (
                            <div
                              key={notif.id}
                              className={styles.item}
                              data-unread={!notif.read}
                              onClick={() => handleItemClick(notif.id)}
                            >
                              <div className={styles.typeIcon} data-type={notif.type || 'info'}>
                                <Icon size={16} />
                              </div>
                              <div className={styles.content}>
                                <div className={styles.title}>{notif.title}</div>
                                {notif.message && (
                                  <div className={styles.message}>{notif.message}</div>
                                )}
                                <div className={styles.time}>{formatTime(notif.timestamp)}</div>
                              </div>
                              {!notif.read && <div className={styles.unreadDot} />}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className={styles.footer}>
                    <button className={styles.clearBtn} onClick={handleClear}>
                      Limpar todas
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
