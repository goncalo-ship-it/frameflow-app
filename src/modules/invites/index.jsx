// Invites — Gestão de convites para a equipa (usa store real)
// Criar link · Lista de convites · Copiar · QR placeholder

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Send, Copy, CheckCircle, Clock, XCircle,
  Link2, QrCode, UserPlus, Trash2, Users, Shield,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { ROLES as ROLE_DEFS, DEPARTMENTS, getRolesByDepartment } from '../../core/roles.js'
import s from './Invites.module.css'

// ── Status config ─────────────────────────────────────────────
const STATUS_CONFIG = {
  active:  { label: 'Activo',   color: 'var(--health-green)', bg: 'rgba(46,160,128,0.1)',  icon: CheckCircle },
  used:    { label: 'Usado',    color: '#F5A623',             bg: 'rgba(245,166,35,0.1)',  icon: Users },
  expired: { label: 'Expirado', color: 'var(--health-red)',   bg: 'rgba(248,113,113,0.1)', icon: XCircle },
}

function getStatus(invite) {
  if (invite.uses >= invite.maxUses) return 'used'
  if (new Date(invite.expiresAt) <= new Date()) return 'expired'
  return 'active'
}

function buildLink(token) {
  return `${window.location.origin}${window.location.pathname}?join=${token}`
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function InvitesModule() {
  const { invites, createInvite, revokeInvite, team } = useStore(useShallow(st => ({
    invites: st.invites,
    createInvite: st.createInvite,
    revokeInvite: st.revokeInvite,
    team: st.team,
  })))

  const [copiedId, setCopiedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formRole, setFormRole] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formMaxUses, setFormMaxUses] = useState(1)
  const [formExpires, setFormExpires] = useState(7)
  const [filter, setFilter] = useState('all')
  const [showQr, setShowQr] = useState(null)

  const filtered = useMemo(() => {
    if (filter === 'all') return [...invites].reverse()
    return [...invites].reverse().filter(i => getStatus(i) === filter)
  }, [invites, filter])

  const stats = useMemo(() => ({
    total: invites.length,
    active: invites.filter(i => getStatus(i) === 'active').length,
    used: invites.filter(i => getStatus(i) === 'used').length,
    expired: invites.filter(i => getStatus(i) === 'expired').length,
    totalJoined: invites.reduce((sum, i) => sum + i.uses, 0),
  }), [invites])

  const handleCreate = useCallback(() => {
    if (!formRole) return
    const invite = createInvite({
      role: formRole,
      department: ROLE_DEFS[formRole]?.dept || null,
      label: formLabel,
      maxUses: formMaxUses,
      expiresInDays: formExpires,
    })
    // Copy link to clipboard
    navigator.clipboard?.writeText(buildLink(invite.token)).catch(() => {})
    setCopiedId(invite.token)
    setTimeout(() => setCopiedId(null), 2000)
    // Reset form
    setFormRole('')
    setFormLabel('')
    setFormMaxUses(1)
    setFormExpires(7)
    setShowForm(false)
  }, [formRole, formLabel, formMaxUses, formExpires, createInvite])

  const handleCopy = useCallback((invite) => {
    const link = buildLink(invite.token)
    navigator.clipboard?.writeText(link).catch(() => {})
    setCopiedId(invite.token)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleRemove = useCallback((id) => {
    if (!window.confirm('Revogar este convite?')) return
    revokeInvite(id)
  }, [revokeInvite])

  // Role options grouped by department
  const departments = useMemo(() => getRolesByDepartment(), [])

  return (
    <motion.div className={s.root} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* ── Header ── */}
      <div className={s.header}>
        <div>
          <div className={s.title}><UserPlus size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />Convites</div>
          <div className={s.sub}>{stats.total} convites · {stats.active} activos · {stats.totalJoined} entradas · {team.length} membros na equipa</div>
        </div>
        <button className={s.btnPrimary} onClick={() => setShowForm(!showForm)}>
          <Mail size={14} /> Novo Convite
        </button>
      </div>

      {/* ── Create Form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className={s.formBar}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className={s.formInner}>
              {/* Role selector grouped by department */}
              <select className={s.select} value={formRole} onChange={e => setFormRole(e.target.value)}>
                <option value="">— Escolher papel —</option>
                {departments.map(dept => (
                  <optgroup key={dept.id} label={dept.label}>
                    {dept.roles.map(r => (
                      <option key={r.id} value={r.id}>{r.label}{r.isHOD ? ' (HOD)' : ''}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input
                className={s.input}
                type="text"
                placeholder="Nota (ex: Para o João — Gaffer)"
                value={formLabel}
                onChange={e => setFormLabel(e.target.value)}
              />
              <select className={s.select} value={formMaxUses} onChange={e => setFormMaxUses(Number(e.target.value))} style={{ minWidth: 120 }}>
                <option value={1}>1 vez</option>
                <option value={5}>5 vezes</option>
                <option value={10}>10 vezes</option>
                <option value={50}>50 vezes</option>
              </select>
              <select className={s.select} value={formExpires} onChange={e => setFormExpires(Number(e.target.value))} style={{ minWidth: 120 }}>
                <option value={1}>Expira: 1 dia</option>
                <option value={3}>Expira: 3 dias</option>
                <option value={7}>Expira: 7 dias</option>
                <option value={30}>Expira: 30 dias</option>
                <option value={90}>Expira: 90 dias</option>
              </select>
              <button className={s.btnPrimary} onClick={handleCreate} disabled={!formRole}>
                <Link2 size={14} /> Criar & Copiar link
              </button>
              <button className={s.btnGhost} onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats + Filters ── */}
      <div className={s.filterBar}>
        <div className={s.statChips}>
          <span className={s.statChip}><Users size={12} /> {stats.total} total</span>
          <span className={s.statChip} style={{ color: 'var(--health-green)' }}><CheckCircle size={12} /> {stats.active} activos</span>
          <span className={s.statChip} style={{ color: '#F5A623' }}><Clock size={12} /> {stats.totalJoined} entradas</span>
        </div>
        <div className={s.filters}>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'active', label: 'Activos' },
            { id: 'used', label: 'Usados' },
            { id: 'expired', label: 'Expirados' },
          ].map(f => (
            <button key={f.id} className={filter === f.id ? s.filterActive : s.filter} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className={s.content}>
        {filtered.length === 0 ? (
          <div className={s.empty}>
            <Mail size={48} className={s.emptyIcon} />
            <div className={s.emptyText}>Sem convites</div>
            <div className={s.emptyHint}>Crie um convite para adicionar membros ao projecto.</div>
          </div>
        ) : (
          <div className={s.inviteList}>
            <AnimatePresence>
              {filtered.map((inv, i) => {
                const status = getStatus(inv)
                const stCfg = STATUS_CONFIG[status] || STATUS_CONFIG.active
                const StIcon = stCfg.icon
                const isCopied = copiedId === inv.token
                const roleInfo = ROLE_DEFS[inv.role]

                return (
                  <motion.div
                    key={inv.id}
                    className={s.inviteCard}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className={s.inviteMain}>
                      <div className={s.inviteInfo}>
                        <div className={s.inviteEmail}>
                          {roleInfo?.label || inv.role}
                          {inv.label && <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>— {inv.label}</span>}
                        </div>
                        <div className={s.inviteMeta}>
                          <span className={s.inviteRole}><Shield size={11} /> {inv.department ? (DEPARTMENTS[inv.department]?.label || inv.department) : '—'}</span>
                          <span className={s.inviteDate}>{formatDate(inv.createdAt)}</span>
                          <span className={s.inviteDate}><Users size={10} /> {inv.uses}/{inv.maxUses}</span>
                          {inv.usedBy?.length > 0 && (
                            <span className={s.inviteDate}>{inv.usedBy.map(u => u.name || u.email).join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <span className={s.badge} style={{ background: stCfg.bg, color: stCfg.color }}>
                        <StIcon size={11} /> {stCfg.label}
                      </span>
                    </div>
                    <div className={s.inviteActions}>
                      {status === 'active' && (
                        <button
                          className={`${s.btnSmall} ${isCopied ? s.btnCopied : ''}`}
                          onClick={() => handleCopy(inv)}
                          title="Copiar link"
                        >
                          {isCopied ? <><CheckCircle size={12} /> Copiado</> : <><Copy size={12} /> Copiar link</>}
                        </button>
                      )}
                      <button
                        className={s.btnSmall}
                        onClick={() => setShowQr(showQr === inv.id ? null : inv.id)}
                        title="QR Code"
                      >
                        <QrCode size={12} /> QR
                      </button>
                      <button
                        className={`${s.btnSmall} ${s.btnDanger}`}
                        onClick={() => handleRemove(inv.id)}
                        title="Revogar convite"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {/* QR Placeholder */}
                    <AnimatePresence>
                      {showQr === inv.id && (
                        <motion.div
                          className={s.qrPlaceholder}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <div className={s.qrBox}>
                            <QrCode size={64} strokeWidth={1} />
                            <div className={s.qrHint}>QR Code — em breve</div>
                            <div className={s.qrLink}>{buildLink(inv.token)}</div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export { InvitesModule }
