// Histórico de versões do orçamento
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Save, RotateCcw, ChevronDown, X, Check } from 'lucide-react'
import styles from '../Budget.module.css'

function formatDate(ts) {
  return new Date(ts).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function BudgetVersions({ versions, onSave, onRestore, budget }) {
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [label, setLabel] = useState('')
  const [confirmRestore, setConfirmRestore] = useState(null)

  const handleSave = () => {
    const finalLabel = label.trim() || `Versão ${versions.length + 1}`
    onSave(finalLabel)
    setLabel('')
    setShowSaveModal(false)
  }

  const handleRestore = (snap) => {
    onRestore(snap)
    setConfirmRestore(null)
  }

  const suggestedLabel = `Versão ${versions.length + 1}`

  return (
    <div className={styles.versionsRoot}>
      <div className={styles.versionsHeader}>
        <History size={15} color="var(--mod-budget, #E8A838)" />
        <span className={styles.versionsTitle}>Histórico de Versões</span>
        <button
          className={styles.btnSaveVersion}
          onClick={() => { setLabel(suggestedLabel); setShowSaveModal(true) }}
        >
          <Save size={13} /> Guardar versão actual
        </button>
      </div>

      {/* Modal de guardar */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            className={styles.editOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              className={styles.editBox}
              initial={{ y: 20, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.96 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className={styles.editTitle}>Guardar Versão</h3>
              <p className={styles.editSub}>
                Cria um snapshot do orçamento actual que pode ser consultado ou restaurado mais tarde.
              </p>
              <input
                className={styles.editInput}
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder={suggestedLabel}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveModal(false) }}
              />
              <div className={styles.editBtns}>
                <button className={styles.btnCancel} onClick={() => setShowSaveModal(false)}>Cancelar</button>
                <button className={styles.btnConfirm} onClick={handleSave}>
                  <Save size={13} /> Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmação de restauro */}
      <AnimatePresence>
        {confirmRestore && (
          <motion.div
            className={styles.editOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmRestore(null)}
          >
            <motion.div
              className={styles.editBox}
              initial={{ y: 20, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.96 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className={styles.editTitle}>Restaurar Versão</h3>
              <p className={styles.editSub}>
                Vais restaurar <strong>"{confirmRestore.label}"</strong> guardada a {formatDate(confirmRestore.savedAt)}.
                O orçamento actual será substituído. Esta acção não pode ser desfeita.
              </p>
              <div className={styles.editBtns}>
                <button className={styles.btnCancel} onClick={() => setConfirmRestore(null)}>Cancelar</button>
                <button
                  className={styles.btnConfirm}
                  style={{ background: '#F87171' }}
                  onClick={() => handleRestore(confirmRestore)}
                >
                  <RotateCcw size={13} /> Restaurar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de versões */}
      {versions.length === 0 ? (
        <div className={styles.versionsEmpty}>
          <History size={28} color="var(--text-muted)" />
          <p>Ainda sem versões guardadas.</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Guarda versões para registar estados importantes do orçamento.
          </p>
        </div>
      ) : (
        <div className={styles.versionsList}>
          {[...versions].reverse().map(snap => (
            <div key={snap.id} className={styles.versionItem}>
              <div className={styles.versionItemInfo}>
                <span className={styles.versionLabel}>{snap.label}</span>
                <span className={styles.versionDate}>{formatDate(snap.savedAt)}</span>
                <span className={styles.versionLines}>
                  {snap.data?.lines?.length || 0} linhas
                </span>
              </div>
              <button
                className={styles.btnRestoreVersion}
                onClick={() => setConfirmRestore(snap)}
                title="Restaurar esta versão"
              >
                <RotateCcw size={12} /> Restaurar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
