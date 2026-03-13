// Gestão da base de dados de fornecedores
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Edit2, Check, Phone, Mail, Building } from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { nanoid } from '../utils/moneyUtils.js'
import styles from '../Budget.module.css'

const EMPTY_FORM = {
  nome: '', tipo: '', contacto: '', email: '', nif: '', iban: '', notas: '',
}

function SupplierRow({ supplier, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...supplier })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = () => { onUpdate(form); setEditing(false) }

  if (editing) {
    return (
      <div className={styles.supplierRowEditing}>
        <div className={styles.supplierEditGrid}>
          <input className={styles.lineInput} value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="Nome *" autoFocus />
          <input className={styles.lineInput} value={form.tipo} onChange={e => f('tipo', e.target.value)} placeholder="Tipo (DOP, Som, Arte…)" />
          <input className={styles.lineInput} value={form.contacto} onChange={e => f('contacto', e.target.value)} placeholder="Telefone" />
          <input className={styles.lineInput} value={form.email} onChange={e => f('email', e.target.value)} placeholder="Email" />
          <input className={styles.lineInput} value={form.nif || ''} onChange={e => f('nif', e.target.value)} placeholder="NIF" />
          <input className={styles.lineInput} value={form.iban || ''} onChange={e => f('iban', e.target.value)} placeholder="IBAN" />
          <textarea className={styles.lineTextarea} value={form.notas || ''} onChange={e => f('notas', e.target.value)} placeholder="Notas…" rows={2} style={{ gridColumn: '1/-1' }} />
        </div>
        <div className={styles.lineEditBtns}>
          <button className={styles.btnCancel} onClick={() => setEditing(false)}>Cancelar</button>
          <button className={styles.btnConfirm} onClick={save} disabled={!form.nome.trim()}><Check size={12} /> Guardar</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.supplierRow}>
      <div className={styles.supplierInfo}>
        <span className={styles.supplierName}>{supplier.nome}</span>
        {supplier.tipo && <span className={styles.supplierTipo}>{supplier.tipo}</span>}
        {supplier.contacto && (
          <span className={styles.supplierContact}><Phone size={10} /> {supplier.contacto}</span>
        )}
        {supplier.email && (
          <span className={styles.supplierContact}><Mail size={10} /> {supplier.email}</span>
        )}
        {supplier.nif && <span className={styles.supplierNif}>NIF: {supplier.nif}</span>}
      </div>
      <div className={styles.lineActions}>
        <button className={styles.lineActionBtn} onClick={() => { setForm({ ...supplier }); setEditing(true) }} title="Editar">
          <Edit2 size={11} />
        </button>
        <button className={styles.lineActionBtn} onClick={onDelete} title="Eliminar" style={{ color: '#F87171' }}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

export function SupplierDrawer({ open, onClose }) {
  const {  suppliers, addSupplier, updateSupplier, removeSupplier  } = useStore(useShallow(s => ({ suppliers: s.suppliers, addSupplier: s.addSupplier, updateSupplier: s.updateSupplier, removeSupplier: s.removeSupplier })))
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAdd = () => {
    if (!form.nome.trim()) return
    addSupplier({ id: nanoid(), ...form })
    setForm({ ...EMPTY_FORM })
    setAdding(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.drawerBackdrop}
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
            <div className={styles.drawerHeader}>
              <div className={styles.drawerHeaderLeft}>
                <Building size={16} color="var(--mod-budget, #E8A838)" />
                <span className={styles.drawerTitle}>Fornecedores</span>
                <span className={styles.drawerCount}>{suppliers.length}</span>
              </div>
              <button className={styles.drawerClose} onClick={onClose}><X size={16} /></button>
            </div>

            <div className={styles.drawerActions}>
              <button className={styles.btnAdd} onClick={() => setAdding(v => !v)}>
                <Plus size={13} /> Adicionar fornecedor
              </button>
            </div>

            <AnimatePresence>
              {adding && (
                <motion.div
                  className={styles.supplierAddForm}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div className={styles.supplierEditGrid}>
                    <input className={styles.lineInput} value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="Nome *" autoFocus />
                    <input className={styles.lineInput} value={form.tipo} onChange={e => f('tipo', e.target.value)} placeholder="Tipo (DOP, Gaffer…)" />
                    <input className={styles.lineInput} value={form.contacto} onChange={e => f('contacto', e.target.value)} placeholder="Telefone" />
                    <input className={styles.lineInput} value={form.email} onChange={e => f('email', e.target.value)} placeholder="Email" />
                    <input className={styles.lineInput} value={form.nif} onChange={e => f('nif', e.target.value)} placeholder="NIF" />
                    <input className={styles.lineInput} value={form.iban} onChange={e => f('iban', e.target.value)} placeholder="IBAN" />
                  </div>
                  <div className={styles.lineEditBtns}>
                    <button className={styles.btnCancel} onClick={() => setAdding(false)}>Cancelar</button>
                    <button className={styles.btnConfirm} onClick={handleAdd} disabled={!form.nome.trim()}>
                      <Plus size={12} /> Guardar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.drawerBody}>
              {suppliers.length === 0 && !adding && (
                <div className={styles.drawerEmpty}>
                  <Building size={28} color="var(--text-muted)" />
                  <p>Sem fornecedores registados</p>
                </div>
              )}
              {suppliers.map(s => (
                <SupplierRow
                  key={s.id}
                  supplier={s}
                  onUpdate={(patch) => updateSupplier(s.id, patch)}
                  onDelete={() => removeSupplier(s.id)}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
