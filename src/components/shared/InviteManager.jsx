// InviteManager.jsx — Drawer para criar e gerir convites
// Acessível a admins (level 1-2) via Sidebar

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, UserPlus, Copy, Check, Trash2, Link2, Clock,
  ChevronDown, ChevronRight, Users, MessageCircle
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { SPRING } from '../../core/design.js'
import { getRolesByDepartment, ROLES, DEPARTMENTS } from '../../core/roles.js'
import { buildWelcomeMessage, openWhatsApp } from '../../utils/whatsapp.js'
import styles from './InviteManager.module.css'

export function InviteManager({ open, onClose }) {
  const invites = useStore(s => s.invites)
  const createInvite = useStore(s => s.createInvite)
  const revokeInvite = useStore(s => s.revokeInvite)

  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  // Stats
  const stats = useMemo(() => {
    const active = invites.filter(i => i.uses < i.maxUses && new Date(i.expiresAt) > new Date())
    const used = invites.filter(i => i.uses >= i.maxUses)
    const expired = invites.filter(i => new Date(i.expiresAt) <= new Date() && i.uses < i.maxUses)
    const totalJoined = invites.reduce((sum, i) => sum + i.uses, 0)
    return { active: active.length, used: used.length, expired: expired.length, totalJoined }
  }, [invites])

  const projectName = useStore(s => s.projectName)

  const buildLink = (token) => `${window.location.origin}${window.location.pathname}?join=${token}`

  const copyLink = (token) => {
    navigator.clipboard.writeText(buildLink(token)).then(() => {
      setCopiedId(token)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const shareWhatsApp = (invite) => {
    const msg = buildWelcomeMessage({
      projectName,
      roleLabel: ROLES[invite.role]?.label || invite.role,
      inviteLink: buildLink(invite.token),
      memberName: invite.label || null,
    })
    openWhatsApp(null, msg)
  }

  const getStatus = (invite) => {
    if (invite.uses >= invite.maxUses) return 'used'
    if (new Date(invite.expiresAt) <= new Date()) return 'expired'
    return 'active'
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.drawer}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <UserPlus size={18} />
                <h2 className={styles.title}>Convites</h2>
              </div>
              <button className={styles.closeBtn} onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            {/* Stats */}
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statNum}>{stats.active}</span>
                <span className={styles.statLabel}>Activos</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{stats.totalJoined}</span>
                <span className={styles.statLabel}>Entradas</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{stats.used + stats.expired}</span>
                <span className={styles.statLabel}>Expirados</span>
              </div>
            </div>

            {/* Create button */}
            <button
              className={styles.createBtn}
              onClick={() => setCreating(!creating)}
            >
              <UserPlus size={16} />
              Criar convite
            </button>

            {/* Create form */}
            <AnimatePresence>
              {creating && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <CreateInviteForm
                    onCreate={(data) => {
                      const invite = createInvite(data)
                      copyLink(invite.token)
                      setCreating(false)
                    }}
                    onCancel={() => setCreating(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Invite list */}
            <div className={styles.list}>
              {invites.length === 0 ? (
                <p className={styles.emptyHint}>
                  Ainda não criaste convites. Cria um para partilhar com a equipa.
                </p>
              ) : (
                [...invites].reverse().map(invite => {
                  const status = getStatus(invite)
                  const roleInfo = ROLES[invite.role]

                  return (
                    <div key={invite.id} className={`${styles.inviteCard} ${styles[`status_${status}`]}`}>
                      <div className={styles.inviteTop}>
                        <div className={styles.inviteRole}>
                          <span className={styles.inviteRoleName}>{roleInfo?.label || invite.role}</span>
                          {invite.label && <span className={styles.inviteLabelText}>— {invite.label}</span>}
                        </div>
                        <span className={`${styles.statusBadge} ${styles[`badge_${status}`]}`}>
                          {status === 'active' ? 'Activo' : status === 'used' ? 'Usado' : 'Expirado'}
                        </span>
                      </div>

                      <div className={styles.inviteMeta}>
                        <span><Clock size={10} /> {formatDate(invite.createdAt)}</span>
                        <span><Users size={10} /> {invite.uses}/{invite.maxUses} utilizado{invite.uses !== 1 ? 's' : ''}</span>
                        {invite.usedBy?.length > 0 && (
                          <span>{invite.usedBy.map(u => u.name || u.email).join(', ')}</span>
                        )}
                      </div>

                      <div className={styles.inviteActions}>
                        {status === 'active' && (
                          <>
                            <button
                              className={styles.copyBtn}
                              onClick={() => copyLink(invite.token)}
                            >
                              {copiedId === invite.token ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar link</>}
                            </button>
                            <button
                              className={styles.whatsappBtn}
                              onClick={() => shareWhatsApp(invite)}
                              title="Enviar por WhatsApp"
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </button>
                          </>
                        )}
                        <button
                          className={styles.revokeBtn}
                          onClick={() => revokeInvite(invite.id)}
                          title="Revogar convite"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Create form ──────────────────────────────────────────────────

function CreateInviteForm({ onCreate, onCancel }) {
  const departments = getRolesByDepartment()
  const [role, setRole] = useState('')
  const [label, setLabel] = useState('')
  const [maxUses, setMaxUses] = useState(1)
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [expandedDept, setExpandedDept] = useState(null)

  const selectedRole = ROLES[role]

  const handleSubmit = () => {
    if (!role) return
    onCreate({
      role,
      department: selectedRole?.dept || null,
      label,
      maxUses,
      expiresInDays,
    })
  }

  return (
    <div className={styles.createForm}>
      {/* Role picker */}
      <div className={styles.formField}>
        <label className={styles.formLabel}>Papel *</label>
        {role ? (
          <div className={styles.selectedRole}>
            <span>{selectedRole?.label || role}</span>
            <button className={styles.changeBtn} onClick={() => setRole('')}>Mudar</button>
          </div>
        ) : (
          <div className={styles.rolePicker}>
            {departments.map(dept => (
              <div key={dept.id}>
                <button
                  className={styles.deptHeader}
                  onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}
                >
                  <span className={styles.deptDot} style={{ background: dept.color }} />
                  <span className={styles.deptName}>{dept.label}</span>
                  {expandedDept === dept.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <AnimatePresence>
                  {expandedDept === dept.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className={styles.roleList}>
                        {dept.roles.map(r => (
                          <button key={r.id} className={styles.roleOption} onClick={() => setRole(r.id)}>
                            {r.label}
                            {r.isHOD && <span className={styles.hodBadge}>HOD</span>}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Label */}
      <div className={styles.formField}>
        <label className={styles.formLabel}>Nota (opcional)</label>
        <input
          className={styles.formInput}
          placeholder="Ex: Para o João — Gaffer"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      </div>

      {/* Options row */}
      <div className={styles.optionsRow}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Utilizações</label>
          <select className={styles.formSelect} value={maxUses} onChange={e => setMaxUses(Number(e.target.value))}>
            <option value={1}>1 vez</option>
            <option value={5}>5 vezes</option>
            <option value={10}>10 vezes</option>
            <option value={50}>50 vezes</option>
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Expira em</label>
          <select className={styles.formSelect} value={expiresInDays} onChange={e => setExpiresInDays(Number(e.target.value))}>
            <option value={1}>1 dia</option>
            <option value={3}>3 dias</option>
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.formActions}>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
        <button className={styles.submitBtn} onClick={handleSubmit} disabled={!role}>
          <Link2 size={14} /> Criar & Copiar link
        </button>
      </div>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}
