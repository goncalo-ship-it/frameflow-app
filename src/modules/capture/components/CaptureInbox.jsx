// CaptureInbox.jsx — Lista de captures não classificados

import { motion, AnimatePresence } from 'framer-motion'
import { Inbox, FileText, Mic, Image } from 'lucide-react'
import { useI18n } from '../../../core/i18n/index.js'
import { useCaptureInbox } from '../hooks/useCaptureInbox.js'
import styles from './Capture.module.css'

function TypeIcon({ type }) {
  if (type === 'image') return <Image size={20} />
  if (type === 'audio') return <Mic size={20} />
  return <FileText size={20} />
}

/**
 * CaptureInbox
 * Mostra a lista de captures no inbox.
 *
 * @param {object} props
 * @param {function} props.onClassify — (captureObj) => void — retoma o fluxo
 * @param {function} props.onBack — () => void — volta ao drawer principal
 */
export function CaptureInbox({ onClassify, onBack }) {
  const { t, lang } = useI18n()
  const { inbox, classifyItem, dismissItem } = useCaptureInbox()

  const formatDate = (ts) => {
    if (!ts) return ''
    const locale = lang === 'pt' ? 'pt-PT' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-GB'
    return new Date(ts).toLocaleDateString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={styles.inboxContainer}>

      {inbox.length === 0 ? (
        <div className={styles.inboxEmpty}>
          <Inbox size={36} style={{ opacity: 0.4 }} />
          <span>{t('capture.emptyInbox')}</span>
          <span style={{ opacity: 0.6 }}>{t('capture.noCaptures')}</span>
          {onBack && (
            <button className={styles.btnSecondary} onClick={onBack} style={{ marginTop: 'var(--space-2)' }}>
              {t('common.back')}
            </button>
          )}
        </div>
      ) : (
        <>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            margin: 0,
          }}>
            {t('capture.itemsPending', { count: inbox.length })}
          </p>

          <AnimatePresence mode="popLayout">
            {inbox.map((item) => {
              const interpretation = item.interpretation
              const tipo = interpretation?.tipo
              const descricao = interpretation?.descricao || item.textContent || '—'

              return (
                <motion.div
                  key={item.id}
                  className={styles.inboxItem}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, padding: 0 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  {/* Thumbnail ou ícone */}
                  <div className={styles.inboxThumbPlaceholder}>
                    <TypeIcon type={item.type} />
                  </div>

                  <div className={styles.inboxItemBody}>
                    <span className={styles.inboxItemTitle}>
                      {tipo ? (t(`capture.types.${tipo}`) || tipo) : t('capture.classify')}
                    </span>
                    <span className={styles.inboxItemDesc}>
                      {descricao}
                    </span>
                    <span className={styles.inboxItemDate}>
                      {formatDate(item.capturedAt)}
                    </span>

                    <div className={styles.inboxItemActions}>
                      <button
                        className={`${styles.inboxActionBtn} ${styles.inboxActionClassify}`}
                        onClick={() => {
                          classifyItem(item.id)
                          onClassify?.(item)
                        }}
                      >
                        {t('capture.classify')}
                      </button>
                      <button
                        className={`${styles.inboxActionBtn} ${styles.inboxActionDismiss}`}
                        onClick={() => dismissItem(item.id)}
                      >
                        {t('capture.dismiss')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {onBack && (
            <button className={styles.btnSecondary} onClick={onBack} style={{ marginTop: 'var(--space-2)' }}>
              {t('common.close')} {t('capture.inbox').toLowerCase()}
            </button>
          )}
        </>
      )}
    </div>
  )
}
