// Banner de preview mode — visível quando admin está a simular outro role/painel
import { Eye, X } from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { ROLES, resolveRole } from '../../core/roles.js'

export function PreviewBanner() {
  // Banner desactivado — o user sabe que está em preview
  return null

  const {  auth, exitPreview  } = useStore(useShallow(s => ({ auth: s.auth, exitPreview: s.exitPreview })))

  if (!auth.previewPanel && !auth.previewRole) return null

  const previewLabel = auth.previewRole
    ? ROLES[resolveRole(auth.previewRole)]?.label || auth.previewRole
    : auth.previewPanel === 'management' ? 'Gestão do Projecto' : 'Vista da Equipa'

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(90deg, #F5A623 0%, #E8A838 100%)',
      color: '#1A1A2E', padding: '6px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)',
      boxShadow: '0 2px 8px rgba(245, 166, 35, 0.3)',
    }}>
      <Eye size={14} />
      MODO PREVIEW — A ver como: {previewLabel}
      <button
        onClick={exitPreview}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          marginLeft: 12, padding: '3px 10px',
          background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: 6,
          color: '#1A1A2E', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}
      >
        <X size={12} /> Sair do Preview
      </button>
    </div>
  )
}
