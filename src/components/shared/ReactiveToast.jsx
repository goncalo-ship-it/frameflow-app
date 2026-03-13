// ReactiveToast — mostra notificações breves quando o ReactiveCore executa regras automáticas

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../core/store.js'
import styles from './ReactiveToast.module.css'

export function ReactiveToast() {
  const reactiveAudit = useStore(s => s.reactiveAudit)
  const [visible, setVisible] = useState(null) // audit entry to show
  const lastSeenRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (reactiveAudit.length === 0) return
    const latest = reactiveAudit[0]
    if (latest.id === lastSeenRef.current) return

    lastSeenRef.current = latest.id
    setVisible(latest)

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setVisible(null)
    }, 4000)

    return () => clearTimeout(timerRef.current)
  }, [reactiveAudit])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.toast}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={() => setVisible(null)}
        >
          <span className={styles.check}>&#10003;</span>
          <span className={styles.text}>{visible.description}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
