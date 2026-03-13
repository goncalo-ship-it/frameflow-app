// Equipa & Elenco + Departamentos — módulo completo v2
// Grid de cards por grupo com cores · Drawer lateral
// WhatsApp de boas-vindas · Conclusão automática de tarefa · Elenco ligado aos guiões

import { lazy, Suspense, useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Phone, Mail, ExternalLink, Link2, Trash2,
  Users, Film, Camera, MessageCircle, CheckCircle, AlertCircle, Upload,
  Calendar, Euro, RefreshCw, Palette,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { TeamImporter } from './TeamImporter.jsx'
import { SmartInput } from '../../components/shared/SmartInput.jsx'
import styles from './Team.module.css'

const DepartmentsModule = lazy(() => import('../departments/index.jsx').then(m => ({ default: m.DepartmentsModule })))

const TEAM_SECTIONS = [
  { id: 'equipa',        label: 'Equipa & Elenco', icon: Users,   color: 'var(--mod-team, #5B8DEF)' },
  { id: 'departamentos', label: 'Departamentos',   icon: Palette, color: 'var(--mod-departments, #E74C3C)' },
]

const fmtEur = (v) => v ? '€\u00A0' + Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 0 }) : ''

// ── Grupos e cores ────────────────────────────────────────────────
export const GROUPS = [
  { id: 'Produção',      color: '#8B6FBF', bg: '#8B6FBF15' },
  { id: 'Realização',    color: '#5B8DEF', bg: '#5B8DEF15' },
  { id: 'Imagem',        color: '#2EA080', bg: '#2EA08015' },
  { id: 'Electricidade', color: '#F5A623', bg: '#F5A62315' },
  { id: 'Som',           color: '#9B59B6', bg: '#9B59B615' },
  { id: 'Arte',          color: '#E74C3C', bg: '#E74C3C15' },
  { id: 'Elenco',        color: '#2E6FA0', bg: '#2E6FA015' },
  { id: 'Pós-Produção',  color: '#7F8C8D', bg: '#7F8C8D15' },
]
const GROUP_MAP = Object.fromEntries(GROUPS.map(g => [g.id, g]))

// Verifica se um membro tem o cartão preenchido (tem os dados essenciais)
function isMemberComplete(m) {
  return !!(m.name && m.role && (m.phone || m.email) && m.photo && m.nif && m.iban)
}

// Devolve lista de campos em falta para o checklist do drawer
function getMissingFields(m) {
  const missing = []
  if (!m.name) missing.push('Nome')
  if (!m.role) missing.push('Função')
  if (!m.phone && !m.email) missing.push('Contacto')
  if (!m.photo) missing.push('Foto')
  if (!m.nif) missing.push('NIF')
  if (!m.iban) missing.push('IBAN')
  return missing
}

// Formata número para WhatsApp (remove tudo menos dígitos, adiciona 351 se PT)
function whatsappNumber(phone = '') {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('9') && digits.length === 9) return '351' + digits
  if (digits.startsWith('00')) return digits.slice(2)
  return digits
}

function whatsappUrl(phone, name, projectName) {
  const num = whatsappNumber(phone)
  if (!num) return null
  const msg = encodeURIComponent(
    `Olá ${name.split(' ')[0]}! 👋\nBem-vindo/a à produção de ${projectName}. Estamos muito contentes por ter-te connosco. Em breve terás acesso a toda a informação do projecto. Qualquer questão estamos aqui! 🎬`
  )
  return `https://wa.me/${num}?text=${msg}`
}

// ── Avatar ────────────────────────────────────────────────────────
function avatarColor(name = '') {
  const palette = ['#7B4FBF','#2E6FA0','#2EA080','#A02E6F','#BF6A2E','#4F7F3F','#8B3A3A','#5B8DEF']
  let h = 0; for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

function Avatar({ name, photo, size = 48, group }) {
  const color = group ? (GROUP_MAP[group]?.color || avatarColor(name)) : avatarColor(name)
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={styles.avatar} style={{ width: size, height: size, background: photo ? 'transparent' : color + '33', border: `2px solid ${color}55`, flexShrink: 0 }}>
      {photo
        ? <img src={photo} alt={name} className={styles.avatarImg} onError={e => { e.target.style.display='none' }} />
        : <span className={styles.avatarInitials} style={{ fontSize: size * 0.36, color }}>{initials}</span>
      }
    </div>
  )
}

// ── Alerta de conclusão de tarefa ─────────────────────────────────
function TaskCompleteAlert({ memberName, tasks, onConfirm, onDismiss }) {
  const matchedTasks = tasks.filter(t => !t.done && (
    t.text.toLowerCase().includes(memberName.split(' ')[0].toLowerCase()) ||
    t.text.toLowerCase().includes('equipa') ||
    t.text.toLowerCase().includes('confirmação')
  ))

  if (matchedTasks.length === 0) return null

  return (
    <motion.div className={styles.taskAlert}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}>
      <CheckCircle size={18} color="var(--health-green)" />
      <div style={{ flex: 1 }}>
        <p className={styles.taskAlertTitle}>Cartão completo!</p>
        <p className={styles.taskAlertSub}>Marcar como concluída:</p>
        {matchedTasks.slice(0, 2).map(t => (
          <p key={t.id} className={styles.taskAlertItem}>· {t.text}</p>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button className={styles.btnConfirm} style={{ fontSize: 11, padding: '4px 10px' }}
          onClick={() => { matchedTasks.forEach(t => onConfirm(t.id)); onDismiss() }}>
          Confirmar
        </button>
        <button className={styles.btnCancel} style={{ fontSize: 11, padding: '3px 10px' }}
          onClick={onDismiss}>
          Ignorar
        </button>
      </div>
    </motion.div>
  )
}

// ── Formulário de novo membro ─────────────────────────────────────
function AddMemberForm({ onAdd, onCancel, parsedCharacters }) {
  const [form, setForm] = useState({
    name: '', role: '', group: 'Produção', company: '',
    phone: '', email: '', photo: '', notes: '',
    characterName: '', agent: '', availability: '',
    driveLinks: [],
  })
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = () => {
    if (!form.name.trim()) return
    onAdd({ ...form, id: `m_${Date.now()}`, name: form.name.trim() })
  }

  const gc = GROUP_MAP[form.group]?.color || 'var(--accent)'

  return (
    <div className={styles.addForm} style={{ borderColor: gc + '44' }}>
      <div className={styles.addFormHeader}>
        <h3 className={styles.addFormTitle}>Nova pessoa</h3>
        <button className={styles.iconBtn} onClick={onCancel}><X size={16}/></button>
      </div>
      <div className={styles.addFormGrid}>
        <div className={styles.addFormField} style={{ gridColumn: '1/-1' }}>
          <label>Nome *</label>
          <input className={styles.input} value={form.name} onChange={e => f('name', e.target.value)}
            placeholder="Nome completo" autoFocus onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div className={styles.addFormField}>
          <label>Função</label>
          <input className={styles.input} value={form.role} onChange={e => f('role', e.target.value)}
            placeholder="Ex: Director de Fotografia…" />
        </div>
        <div className={styles.addFormField}>
          <label>Grupo</label>
          <select className={styles.select} value={form.group} onChange={e => f('group', e.target.value)}>
            {GROUPS.map(g => <option key={g.id} value={g.id}>{g.id}</option>)}
          </select>
        </div>
        <div className={styles.addFormField}>
          <label>Telemóvel</label>
          <input className={styles.input} value={form.phone} onChange={e => f('phone', e.target.value)}
            placeholder="+351 9xx xxx xxx" />
        </div>
        <div className={styles.addFormField}>
          <label>Email</label>
          <input className={styles.input} type="email" value={form.email} onChange={e => f('email', e.target.value)}
            placeholder="email@exemplo.com" />
        </div>
        <div className={styles.addFormField}>
          <label>Empresa</label>
          <input className={styles.input} value={form.company} onChange={e => f('company', e.target.value)}
            placeholder="Nome da empresa" />
        </div>
        {form.group === 'Elenco' && (
          <div className={styles.addFormField}>
            <label>Personagem</label>
            <select className={styles.select} value={form.characterName} onChange={e => f('characterName', e.target.value)}>
              <option value="">— sem ligação —</option>
              {parsedCharacters.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className={styles.formBtns}>
        <button className={styles.btnCancel} onClick={onCancel}>Cancelar</button>
        <button className={styles.btnConfirm} onClick={handleSubmit} disabled={!form.name.trim()}
          style={{ background: gc }}>
          <Plus size={14}/> Adicionar
        </button>
      </div>
    </div>
  )
}

// ── Drawer lateral — detalhe completo ────────────────────────────
function MemberDrawer({ member, onClose, onUpdate, onDelete, parsedCharacters, projectName, tasks, onTaskComplete, team, shootingDays }) {
  const [confirmDelete, setConfirmDelete]   = useState(false)
  const [newLink, setNewLink]               = useState({ label: '', url: '' })
  const [addingLink, setAddingLink]         = useState(false)
  const [showTaskAlert, setShowTaskAlert]   = useState(false)
  const [wasComplete, setWasComplete]       = useState(isMemberComplete(member))

  const up = (k, v) => {
    onUpdate(member.id, { [k]: v })
  }

  // Detectar quando o cartão fica completo pela primeira vez
  const handleUpdate = (k, v) => {
    const updated = { ...member, [k]: v }
    const nowComplete = isMemberComplete(updated)
    if (!wasComplete && nowComplete) {
      setShowTaskAlert(true)
      setWasComplete(true)
    }
    onUpdate(member.id, { [k]: v })
  }

  const gc = GROUP_MAP[member.group]?.color || 'var(--accent)'
  const character = parsedCharacters.find(c => c.name === member.characterName)
  const waUrl = whatsappUrl(member.phone, member.name, projectName)

  const addLink = () => {
    if (!newLink.url.trim()) return
    up('driveLinks', [...(member.driveLinks || []), { ...newLink, id: Date.now() }])
    setNewLink({ label: '', url: '' }); setAddingLink(false)
  }
  const removeLink = (id) => up('driveLinks', (member.driveLinks || []).filter(l => l.id !== id))

  return (
    <motion.div className={styles.drawerOverlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}>
      <motion.div className={styles.drawer} data-glass
        initial={{ y: 28, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 16, scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onClick={e => e.stopPropagation()}>

        {/* Cabeçalho */}
        <div className={styles.drawerHeader} style={{ borderBottom: `3px solid ${gc}` }}>
          <div className={styles.drawerHeaderTop}>
            <button className={styles.iconBtn} onClick={onClose}><X size={18}/></button>
            <div style={{ display: 'flex', gap: 8 }}>
              {!confirmDelete
                ? <button className={styles.deleteBtnDrawer} onClick={() => setConfirmDelete(true)}><Trash2 size={14}/></button>
                : <>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', alignSelf: 'center' }}>Confirmar?</span>
                    <button className={styles.btnCancel} onClick={() => setConfirmDelete(false)}>Não</button>
                    <button className={styles.btnDanger} onClick={() => { onDelete(member.id); onClose() }}>Eliminar</button>
                  </>
              }
            </div>
          </div>

          {/* Avatar + identidade */}
          <div className={styles.drawerIdentity}>
            <div className={styles.drawerAvatarWrap}>
              <Avatar name={member.name} photo={member.photo} size={80} group={member.group} />
              {isMemberComplete(member) && (
                <span className={styles.completeBadge} title="Cartão completo">
                  <CheckCircle size={14} color="var(--health-green)" />
                </span>
              )}
            </div>
            {(() => {
              const missing = getMissingFields(member)
              return missing.length > 0 ? (
                <div className={styles.missingList}>
                  {missing.map(f => (
                    <span key={f} className={styles.missingItem}>
                      <AlertCircle size={8} /> {f}
                    </span>
                  ))}
                </div>
              ) : null
            })()}
            <div className={styles.drawerNames}>
              <input className={styles.drawerNameInput} value={member.name}
                onChange={e => {
                  const value = e.target.value
                  if (member.isPlaceholder && value.trim()) {
                    onUpdate(member.id, { name: value, isPlaceholder: false })
                  } else {
                    handleUpdate('name', value)
                  }
                }} placeholder="Nome" />
              <input className={styles.drawerRoleInput} value={member.role || ''}
                onChange={e => handleUpdate('role', e.target.value)} placeholder="Função" />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={styles.groupBadge} style={{ background: gc + '22', color: gc, borderColor: gc + '44' }}>
                  {member.group}
                </span>
                {member.company && <span className={styles.companyTag}>{member.company}</span>}
              </div>
              {/* WhatsApp de boas-vindas */}
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className={styles.whatsappBtn}>
                  <MessageCircle size={13} /> Enviar boas-vindas (WhatsApp)
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Alerta de conclusão de tarefa */}
        <AnimatePresence>
          {showTaskAlert && (
            <div style={{ padding: '0 var(--space-4)', paddingTop: 'var(--space-3)' }}>
              <TaskCompleteAlert
                memberName={member.name}
                tasks={tasks}
                onConfirm={onTaskComplete}
                onDismiss={() => setShowTaskAlert(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Corpo */}
        <div className={styles.drawerBody}>

          <Section title="Identificação">
            <Field label="Foto (URL ou Google Drive)">
              <input className={styles.input} value={member.photo || ''}
                onChange={e => handleUpdate('photo', e.target.value)}
                placeholder="https://drive.google.com/… ou URL directo da foto" />
              {member.photo && (
                <div className={styles.photoPreview}>
                  <img src={member.photo} alt="" onError={e => { e.target.parentElement.style.display='none' }} />
                </div>
              )}
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="Grupo">
                <select className={styles.select} value={member.group} onChange={e => handleUpdate('group', e.target.value)}>
                  {GROUPS.map(g => <option key={g.id} value={g.id}>{g.id}</option>)}
                </select>
              </Field>
              <Field label="Empresa">
                <input className={styles.input} value={member.company || ''}
                  onChange={e => handleUpdate('company', e.target.value)} placeholder="Empresa / Freelancer" />
              </Field>
            </div>
          </Section>

          <Section title="Contactos">
            <Field label="Telemóvel">
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input className={styles.input} style={{ flex:1 }} value={member.phone || ''}
                  onChange={e => handleUpdate('phone', e.target.value)} placeholder="+351 9xx xxx xxx" />
                {member.phone && (
                  <>
                    <a href={`tel:${member.phone}`} className={styles.contactLink} title="Ligar"><Phone size={14}/></a>
                    {waUrl && (
                      <a href={waUrl} target="_blank" rel="noopener noreferrer"
                        className={styles.contactLink} style={{ background: '#25D36611', borderColor: '#25D36633', color: '#25D366' }}
                        title="WhatsApp">
                        <MessageCircle size={14}/>
                      </a>
                    )}
                  </>
                )}
              </div>
            </Field>
            <Field label="Email">
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input className={styles.input} style={{ flex:1 }} value={member.email || ''}
                  onChange={e => handleUpdate('email', e.target.value)} placeholder="email@exemplo.com" />
                {member.email && <a href={`mailto:${member.email}`} className={styles.contactLink}><Mail size={14}/></a>}
              </div>
            </Field>
          </Section>

          {member.group === 'Elenco' && (
            <Section title="Elenco">
              <Field label="Personagem">
                <select className={styles.select} value={member.characterName || ''}
                  onChange={e => handleUpdate('characterName', e.target.value)}>
                  <option value="">— sem ligação —</option>
                  {parsedCharacters.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
              {character && (
                <div className={styles.characterCard}>
                  <Film size={13} color="var(--mod-script)"/>
                  <div>
                    <span className={styles.characterName}>{character.name}</span>
                    <span className={styles.characterMeta}>{character.scenes?.length ?? 0} cenas · {character.lineCount ?? 0} falas</span>
                  </div>
                </div>
              )}
              <Field label="Agente / Representante">
                <input className={styles.input} value={member.agent || ''}
                  onChange={e => handleUpdate('agent', e.target.value)} placeholder="Nome + contacto do agente" />
              </Field>
            </Section>
          )}

          <Section title="Links & Drive"
            action={<button className={styles.addLinkBtn} onClick={() => setAddingLink(v => !v)}><Plus size={12}/> Link</button>}>
            <AnimatePresence>
              {addingLink && (
                <motion.div className={styles.addLinkForm}
                  initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}>
                  <input className={styles.input} placeholder="Etiqueta (ex: Audição EP01)" value={newLink.label}
                    onChange={e => setNewLink(v => ({ ...v, label: e.target.value }))} />
                  <input className={styles.input} placeholder="URL (Google Drive, Vimeo…)" value={newLink.url}
                    onChange={e => setNewLink(v => ({ ...v, url: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addLink()} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button className={styles.btnCancel} onClick={() => setAddingLink(false)}>Cancelar</button>
                    <button className={styles.btnConfirm} onClick={addLink}>Guardar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {(member.driveLinks || []).length === 0 && !addingLink && (
              <p className={styles.emptyLinks}>Nenhum link adicionado</p>
            )}
            <div className={styles.linksList}>
              {(member.driveLinks || []).map(link => (
                <div key={link.id} className={styles.linkRow}>
                  <Link2 size={13} color="var(--text-muted)"/>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.linkLabel}>
                    {link.label || link.url}
                  </a>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.contactLink}><ExternalLink size={12}/></a>
                  <button className={styles.removeLinkBtn} onClick={() => removeLink(link.id)}><X size={11}/></button>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Cachê & Contrato">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="Cachê diário (€)">
                <input className={styles.input} type="number" min="0" step="50"
                  value={member.cacheDiario || ''}
                  onChange={e => handleUpdate('cacheDiario', e.target.value)}
                  placeholder="ex: 450" />
              </Field>
              <Field label="Cachê total projecto (€)">
                <input className={styles.input} type="number" min="0" step="100"
                  value={member.cacheTotal || ''}
                  onChange={e => handleUpdate('cacheTotal', e.target.value)}
                  placeholder="ex: 4500" />
              </Field>
              <Field label="NIF">
                <input className={styles.input} value={member.nif || ''}
                  onChange={e => handleUpdate('nif', e.target.value)}
                  placeholder="123 456 789" />
              </Field>
              <Field label="IBAN">
                <input className={styles.input} value={member.iban || ''}
                  onChange={e => handleUpdate('iban', e.target.value)}
                  placeholder="PT50 …" />
              </Field>
            </div>
            {member.cacheDiario && member.cacheTotal && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                {Math.round(member.cacheTotal / member.cacheDiario)} dias × {fmtEur(member.cacheDiario)}/dia = {fmtEur(member.cacheTotal)}
              </p>
            )}
          </Section>

          <DaysConfirmedSection member={member} onUpdate={handleUpdate} />

          {member.group === 'Elenco' && (
            <SubstitutoSection member={member} onUpdate={handleUpdate} team={team} />
          )}

          <Section title="Logística">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="Dieta / Restrições alimentares">
                <input className={styles.input} value={member.dietary || ''}
                  onChange={e => handleUpdate('dietary', e.target.value)}
                  placeholder="Ex: vegetariano, sem glúten…" />
              </Field>
              <Field label="Lugar de estacionamento">
                <input className={styles.input} value={member.parkingSpot || ''}
                  onChange={e => handleUpdate('parkingSpot', e.target.value)}
                  placeholder="Ex: A-47, Piso -1" />
              </Field>
            </div>
          </Section>

          <Section title="Disponibilidade">
            <SmartInput value={member.availability || ''}
              onChange={e => handleUpdate('availability', e.target.value)}
              placeholder="Datas de indisponibilidade, restrições…" rows={3}
              context={`Disponibilidade de ${member.name} (${member.role || member.group})`} />
          </Section>

          <Section title="Notas">
            <SmartInput value={member.notes || ''}
              onChange={e => handleUpdate('notes', e.target.value)}
              placeholder="Observações, contexto, histórico de colaboração…" rows={4}
              context={`Notas sobre ${member.name} — equipa técnica, decisões, observações`} />
          </Section>

          <DeptItemsSection memberName={member.name} characterName={member.characterName} />
        </div>
      </motion.div>
    </motion.div>
  )
}

function Section({ title, children, action }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{title}</span>
        {action}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  )
}

// ── Dias confirmados ──────────────────────────────────────────────
function DaysConfirmedSection({ member, onUpdate }) {
  const {  shootingDays, sceneAssignments, parsedScripts, navigate  } = useStore(useShallow(s => ({ shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments, parsedScripts: s.parsedScripts, navigate: s.navigate })))
  const confirmed = member.confirmedDays || []
  const toggle = (dayId) => {
    const next = confirmed.includes(dayId)
      ? confirmed.filter(d => d !== dayId)
      : [...confirmed, dayId]
    onUpdate('confirmedDays', next)
  }
  if (!shootingDays.length) return null
  const confirmedCount = confirmed.length

  // Build day context (location, episode, scenes count)
  const allScenes = Object.values(parsedScripts).flatMap(ep => ep.scenes || [])
  const dayContext = (dayId) => {
    const scenes = []
    Object.entries(sceneAssignments).forEach(([sk, did]) => {
      if (did !== dayId) return
      const sc = allScenes.find(s => {
        const epId = Object.keys(parsedScripts).find(k => (parsedScripts[k].scenes || []).includes(s))
        return `${epId}-${s.id}` === sk || `${epId}-${s.sceneNumber}` === sk
      })
      if (sc) scenes.push(sc)
    })
    const locs = [...new Set(scenes.map(s => s.location).filter(Boolean))]
    const eps = [...new Set(scenes.map(s => s.episode).filter(Boolean))]
    return { sceneCount: scenes.length, locs, eps }
  }

  return (
    <Section title={`Dias Confirmados ${confirmedCount > 0 ? `(${confirmedCount}/${shootingDays.length})` : ''}`}>
      <div className={styles.daysGrid}>
        {shootingDays.map(day => {
          const isOn = confirmed.includes(day.id)
          const ctx = isOn ? dayContext(day.id) : null
          return (
            <button
              key={day.id}
              className={`${styles.dayChip} ${isOn ? styles.dayChipOn : ''}`}
              onClick={() => toggle(day.id)}
              title={ctx ? `${ctx.sceneCount} cenas${ctx.locs[0] ? ` · ${ctx.locs[0]}` : ''}${ctx.eps[0] ? ` · ${ctx.eps[0]}` : ''}` : (day.notes || day.label)}
            >
              <Calendar size={10} />
              <span>{day.label || day.date}</span>
              {isOn && <CheckCircle size={10} />}
              {ctx && ctx.sceneCount > 0 && (
                <span style={{ fontSize: 9, opacity: 0.7 }}>{ctx.sceneCount}c</span>
              )}
            </button>
          )
        })}
      </div>
      {confirmedCount > 0 && member.cacheDiario && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
          {confirmedCount} dias × {fmtEur(member.cacheDiario)}/dia = {fmtEur(confirmedCount * Number(member.cacheDiario))}
          <button onClick={() => navigate('callsheet')} style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--mod-callsheet, #E8A838)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Ver call sheet →</button>
        </p>
      )}
    </Section>
  )
}

// ── Actor substituto (só Elenco) ──────────────────────────────────
function SubstitutoSection({ member, onUpdate, team }) {
  const elenco = team.filter(m => m.group === 'Elenco' && m.id !== member.id)
  const sub = elenco.find(m => m.id === member.substitutoId)
  return (
    <Section title="Actor Substituto">
      <Field label="Alternativo para este papel">
        <select
          className={styles.select}
          value={member.substitutoId || ''}
          onChange={e => onUpdate('substitutoId', e.target.value || null)}
        >
          <option value="">— sem substituto —</option>
          {elenco.map(m => (
            <option key={m.id} value={m.id}>{m.name}{m.characterName ? ` (${m.characterName})` : ''}</option>
          ))}
        </select>
      </Field>
      {sub && (
        <div className={styles.substitutoCard}>
          <RefreshCw size={12} color="var(--text-muted)" />
          <div>
            <span className={styles.substitutoName}>{sub.name}</span>
            {sub.characterName && <span className={styles.substitutoRole}> · {sub.characterName}</span>}
            {sub.phone && (
              <a href={`tel:${sub.phone}`} className={styles.substitutoPhone}>
                <Phone size={11} /> {sub.phone}
              </a>
            )}
          </div>
        </div>
      )}
    </Section>
  )
}

// ── Items de departamento do membro ──────────────────────────────
function DeptItemsSection({ memberName, characterName }) {
  const {  departmentItems, departmentConfig, navigate  } = useStore(useShallow(s => ({ departmentItems: s.departmentItems, departmentConfig: s.departmentConfig, navigate: s.navigate })))
  const items = departmentItems.filter(i =>
    i.characterName === characterName || i.characterName === memberName
  )
  if (items.length === 0) return null

  const byDept = {}
  items.forEach(i => {
    if (!byDept[i.department]) byDept[i.department] = []
    byDept[i.department].push(i)
  })

  return (
    <Section title={`Departamentos (${items.length})`}>
      {Object.entries(byDept).map(([deptId, dItems]) => {
        const cfg = departmentConfig.find(d => d.id === deptId)
        return (
          <div key={deptId} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg?.color || 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: cfg?.color || 'var(--text-primary)' }}>{cfg?.label || deptId}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({dItems.length})</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {dItems.slice(0, 6).map(item => (
                <div key={item.id} style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  cursor: 'pointer', position: 'relative',
                }} title={item.name} onClick={() => navigate('departments')}>
                  {item.photos?.[0]
                    ? <img src={item.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', padding: 2 }}>{item.name?.slice(0, 15)}</span>
                  }
                  {item.approved && <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: 'var(--health-green)' }} />}
                </div>
              ))}
              {dItems.length > 6 && <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center' }}>+{dItems.length - 6}</span>}
            </div>
          </div>
        )
      })}
    </Section>
  )
}

// ── Card de membro ────────────────────────────────────────────────
const MemberCard = memo(function MemberCard({ member, onClick, isOnCallsheet, budgetSynced, castingStatus }) {
  const g = GROUP_MAP[member.group] || { color: 'var(--accent)', bg: 'transparent' }
  const complete = isMemberComplete(member)
  const waUrl = member.phone ? whatsappUrl(member.phone, member.name, '') : null
  const hasCacheDiario = !!member.cacheDiario && Number(member.cacheDiario) > 0
  const totalCost = hasCacheDiario && member.confirmedDays?.length
    ? Number(member.cacheDiario) * (member.confirmedDays?.length || 0) : 0

  return (
    <motion.div className={`${styles.memberCard} ${member.isPlaceholder ? styles.placeholderCard : ''}`}
      style={{ background: g.bg, borderColor: g.color + '33' }}
      onClick={onClick}
      whileHover={{ y: -2, borderColor: g.color + '77', boxShadow: `0 6px 24px ${g.color}22` }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
      <div className={styles.memberCardTop} style={{ borderBottom: `2px solid ${g.color}33` }}>
        <Avatar name={member.name || member.characterName || '?'} photo={member.photo} size={52} group={member.group} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className={styles.groupDot} style={{ background: g.color }} />
          {member.isPlaceholder && <span className={styles.placeholderBadge}>Slot</span>}
          {complete
            ? <CheckCircle size={12} color="var(--health-green)" />
            : <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#F5A62318', color: '#F5A623', fontWeight: 700 }}>{getMissingFields(member).length} em falta</span>
          }
        </div>
      </div>
      <div className={styles.memberCardBody}>
        <span className={styles.memberName}>{member.name || (member.isPlaceholder ? 'Por definir' : 'Sem nome')}</span>
        <span className={styles.memberRole} style={{ color: g.color + 'CC' }}>{member.role || member.group}</span>
        {member.characterName && (
          <span className={styles.memberCharacter}>→ {member.characterName}</span>
        )}
        <div className={styles.memberContacts}>
          {member.phone && <Phone size={11} color={g.color + '99'}/>}
          {member.email && <Mail size={11} color={g.color + '99'}/>}
          {waUrl && <MessageCircle size={11} color="#25D366AA"/>}
          {(member.driveLinks || []).length > 0 && <Link2 size={11} color={g.color + '99'}/>}
        </div>
        {/* Badges */}
        <div className={styles.cardBadges}>
          {isOnCallsheet && (
            <span className={styles.miniBadge} style={{ background: '#5B8DEF15', color: '#5B8DEF', borderColor: '#5B8DEF33' }}>
              <Calendar size={9} /> Na call sheet
            </span>
          )}
          {hasCacheDiario && (
            <span className={styles.miniBadge} style={{
              background: budgetSynced ? '#2EA08015' : '#F5A62315',
              color: budgetSynced ? '#2EA080' : '#F5A623',
              borderColor: budgetSynced ? '#2EA08033' : '#F5A62333',
            }}>
              <Euro size={9} /> {budgetSynced ? 'Sincronizado' : 'Não sincronizado'}
            </span>
          )}
          {castingStatus && (
            <span className={styles.miniBadge} style={{ background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>
              <span className={styles.castingDot} style={{
                background: castingStatus === 'confirmado' || castingStatus === 'contratado' ? 'var(--health-green, #2EA080)'
                  : castingStatus === 'em audição' ? '#F5A623'
                  : '#999',
              }} />
              {castingStatus}
            </span>
          )}
        </div>
        {totalCost > 0 && (
          <span className={styles.cardCost}>{fmtEur(totalCost)} ({member.confirmedDays?.length || 0}d)</span>
        )}
      </div>
    </motion.div>
  )
})

// ── Módulo principal ──────────────────────────────────────────────
export function TeamModule({ initialSection = 'equipa' }) {
  const [teamSection, setTeamSection] = useState(initialSection)
  const {  team, addMember, updateMember, removeMember, parsedCharacters, projectName, preProduction, updateTask, shootingDays, sceneAssignments, parsedScripts, budgets  } = useStore(useShallow(s => ({ team: s.team, addMember: s.addMember, updateMember: s.updateMember, removeMember: s.removeMember, parsedCharacters: s.parsedCharacters, projectName: s.projectName, preProduction: s.preProduction, updateTask: s.updateTask, shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments, parsedScripts: s.parsedScripts, budgets: s.budgets })))

  const [activeGroup, setActiveGroup]  = useState('all')
  const [search, setSearch]            = useState('')
  const [addingMember, setAddingMember]= useState(false)
  const [importing, setImporting]      = useState(false)
  const [selectedId, setSelectedId]    = useState(null)

  const selectedMember = team.find(m => m.id === selectedId)
  const tasks = preProduction?.tasks || []
  const castingStatusMap = preProduction?.castingStatus || {}

  // Compute today's callsheet: find shooting day with today's date, get assigned scenes, extract characters
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayDay = shootingDays.find(d => d.date === todayStr)
  const todayCharacters = new Set()
  if (todayDay) {
    const allScenes = Object.values(parsedScripts).flatMap(ep => ep.scenes || [])
    Object.entries(sceneAssignments).forEach(([sceneKey, dayId]) => {
      if (dayId !== todayDay.id) return
      const scene = allScenes.find(sc => {
        const epId = Object.keys(parsedScripts).find(k => (parsedScripts[k].scenes || []).includes(sc))
        return `${epId}-${sc.id}` === sceneKey || `${epId}-${sc.sceneNumber}` === sceneKey
      })
      if (scene) (scene.characters || []).forEach(c => todayCharacters.add(c))
    })
  }

  // Compute budget sync: check if any budget has a line with matching teamMemberId
  const allBudgetLines = budgets.flatMap(b => (b.categories || []).flatMap(c => c.lines || []))
  const syncedMemberIds = new Set(allBudgetLines.filter(l => l.teamMemberId).map(l => l.teamMemberId))

  // Clean up duplicate placeholders (one-time fix for previously created duplicates)
  useEffect(() => {
    const currentTeam = useStore.getState().team
    const seen = new Set()
    const dupeIds = []
    currentTeam.forEach(m => {
      if (m.isPlaceholder && m.group === 'Elenco' && m.characterName) {
        const key = m.characterName?.toLowerCase()
        if (seen.has(key)) {
          dupeIds.push(m.id)
        } else {
          seen.add(key)
        }
      }
    })
    dupeIds.forEach(id => removeMember(id))
  }, [])

  // Auto-create Elenco placeholders from parsed characters
  useEffect(() => {
    if (!parsedCharacters || parsedCharacters.length === 0) return

    // Read the latest team from the store to avoid stale closure issues
    // (React StrictMode double-fires effects, and hot reload remounts)
    const currentTeam = useStore.getState().team

    const existingCharNames = currentTeam
      .filter(m => m.group === 'Elenco' && m.characterName)
      .map(m => m.characterName?.toLowerCase())

    const toCreate = parsedCharacters.filter(
      c => c.name && !existingCharNames.includes(c.name.toLowerCase())
    )

    if (toCreate.length === 0) return

    toCreate.forEach(c => {
      addMember({
        id: `m_ph_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: '',
        role: 'Ator/Atriz',
        group: 'Elenco',
        characterName: c.name,
        phone: '',
        email: '',
        photo: '',
        notes: `Personagem do guião · ${c.scenes?.length || 0} cenas, ${c.lineCount || 0} falas`,
        company: '',
        agent: '',
        availability: '',
        driveLinks: [],
        cacheDiario: 0,
        cacheTotal: 0,
        nif: '',
        iban: '',
        confirmedDays: [],
        substitutoId: '',
        isPlaceholder: true,
      })
    })
  }, [parsedCharacters?.length])

  const visible = team
    .filter(m => activeGroup === 'all' || m.group === activeGroup)
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.role||'').toLowerCase().includes(search.toLowerCase()))

  const countByGroup = (g) => team.filter(m => m.group === g).length
  const completedCount = team.filter(isMemberComplete).length

  if (teamSection === 'departamentos') {
    return (
      <div className={styles.root}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '0 20px', flexShrink: 0 }}>
          {TEAM_SECTIONS.map(s => {
            const Icon = s.icon
            const active = teamSection === s.id
            return (
              <button key={s.id} onClick={() => setTeamSection(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '12px 18px', fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? s.color : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: active ? `2px solid ${s.color}` : '2px solid transparent', transition: 'all 0.15s',
              }}>
                <Icon size={15} />
                {s.label}
              </button>
            )
          })}
        </div>
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>A carregar…</div>}>
          <DepartmentsModule />
        </Suspense>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {/* Section selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '0 20px', flexShrink: 0 }}>
        {TEAM_SECTIONS.map(s => {
          const Icon = s.icon
          const active = teamSection === s.id
          return (
            <button key={s.id} onClick={() => setTeamSection(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '12px 18px', fontSize: 13, fontWeight: active ? 700 : 500,
              color: active ? s.color : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: active ? `2px solid ${s.color}` : '2px solid transparent', transition: 'all 0.15s',
            }}>
              <Icon size={15} />
              {s.label}
            </button>
          )
        })}
      </div>

      {/* ── Cabeçalho ── */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Equipa & Elenco</h2>
          <p className={styles.sub}>{projectName} · {team.length} pessoas · {completedCount} cartões completos</p>
        </div>
        <div style={{ display:'flex', gap:'var(--space-3)', alignItems:'center' }}>
          <input className={styles.searchInput} placeholder="Pesquisar…" value={search} onChange={e => setSearch(e.target.value)} />
          <button className={styles.btnImport} onClick={() => setImporting(true)}>
            <Upload size={14}/> Importar
          </button>
          <button className={styles.btnAdd} onClick={() => setAddingMember(true)}>
            <Plus size={14}/> Adicionar
          </button>
        </div>
      </div>

      {/* ── Main layout: sidebar + content ── */}
      <div className={styles.mainLayout}>
        {/* ── Category sidebar ── */}
        <nav className={styles.categorySidebar}>
          <button className={activeGroup === 'all' ? styles.catItemActive : styles.catItem} onClick={() => setActiveGroup('all')}>
            <span className={styles.catDot} style={{ background: 'var(--text-muted)' }} />
            <span className={styles.catLabel}>Todos</span>
            <span className={styles.catCount}>{team.length}</span>
          </button>
          {GROUPS.map(g => {
            const count = team.filter(m => m.group === g.id).length
            return (
              <button key={g.id} className={activeGroup === g.id ? styles.catItemActive : styles.catItem} onClick={() => setActiveGroup(activeGroup === g.id ? 'all' : g.id)}>
                <span className={styles.catDot} style={{ background: g.color }} />
                <span className={styles.catLabel}>{g.id}</span>
                <span className={styles.catCount}>{count}</span>
              </button>
            )
          })}
        </nav>

        {/* ── Grid + formulário ── */}
        <div className={styles.body}>
        <AnimatePresence>
          {addingMember && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
              <AddMemberForm
                parsedCharacters={parsedCharacters}
                onAdd={(m) => { addMember(m); setAddingMember(false); setSelectedId(m.id) }}
                onCancel={() => setAddingMember(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {team.length === 0 && !addingMember && (
          <div className={styles.empty}>
            <Users size={36} color="var(--text-muted)"/>
            <p>Adiciona a primeira pessoa à equipa</p>
            <button className={styles.btnAdd} onClick={() => setAddingMember(true)}>
              <Plus size={14}/> Começar
            </button>
          </div>
        )}

        {visible.length === 0 && team.length > 0 && (
          <div className={styles.empty}>
            <p>Nenhum resultado para "{search || activeGroup}"</p>
          </div>
        )}

        {/* Cards por grupo */}
        {activeGroup === 'all'
          ? GROUPS.map(g => {
              const members = visible.filter(m => m.group === g.id)
              if (members.length === 0) return null
              return (
                <div key={g.id} className={styles.groupSection}>
                  <div className={styles.groupSectionHeader} style={{ color: g.color }}>
                    <span className={styles.groupSectionDot} style={{ background: g.color }}/>
                    {g.id}
                    <span className={styles.groupSectionCount}>{members.length}</span>
                  </div>
                  <div className={styles.cardGrid}>
                    {members.map(m => (
                      <MemberCard key={m.id} member={m} onClick={() => setSelectedId(m.id)}
                        isOnCallsheet={m.characterName ? todayCharacters.has(m.characterName) : false}
                        budgetSynced={syncedMemberIds.has(m.id)}
                        castingStatus={m.group === 'Elenco' && m.characterName ? castingStatusMap[m.characterName] : null}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          : (
            <div className={styles.cardGrid}>
              {visible.map(m => (
                <MemberCard key={m.id} member={m} onClick={() => setSelectedId(m.id)}
                  isOnCallsheet={m.characterName ? todayCharacters.has(m.characterName) : false}
                  budgetSynced={syncedMemberIds.has(m.id)}
                  castingStatus={m.group === 'Elenco' && m.characterName ? castingStatusMap[m.characterName] : null}
                />
              ))}
            </div>
          )
        }
      </div>
      </div>{/* end mainLayout */}

      {/* ── Importador ── */}
      <AnimatePresence>
        {importing && <TeamImporter onClose={() => setImporting(false)} />}
      </AnimatePresence>

      {/* ── Drawer lateral ── */}
      <AnimatePresence>
        {selectedMember && (
          <MemberDrawer
            member={selectedMember}
            parsedCharacters={parsedCharacters}
            projectName={projectName}
            tasks={tasks}
            team={team}
            shootingDays={shootingDays}
            onClose={() => setSelectedId(null)}
            onUpdate={updateMember}
            onDelete={removeMember}
            onTaskComplete={(taskId) => updateTask(taskId, { done: true })}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
