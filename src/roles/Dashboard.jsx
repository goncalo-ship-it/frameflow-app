import { useStore } from '../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { resolveRole, ROLES, getAccessLevel, getDepartment } from '../core/roles.js'
import { ProducerDashboard }  from './producer/ProducerDashboard.jsx'
import { DirectorDashboard }  from './director/DirectorDashboard.jsx'
import { DopDashboard }       from './dop/DopDashboard.jsx'
import { ActorDashboard }     from './actor/ActorDashboard.jsx'
import { ApDashboard }        from './ap/ApDashboard.jsx'
import { MyDay }              from './myday/MyDay.jsx'

// Mapeamento de roles → dashboards existentes
// Roles que partilham o mesmo tipo de dashboard
const ADMIN_ROLES = ['director_producao', 'produtor_executivo']
const DIRECTOR_ROLES = ['realizador']
const DOP_ROLES = ['dir_fotografia']
const CAST_ROLES = ['elenco_principal', 'elenco_sec_adulto', 'elenco_sec_juvenil', 'figuracao']
const AP_ROLES = ['assistente_producao', 'chefe_producao', 'secretaria_producao', 'primeiro_ad', 'segundo_ad']

export function Dashboard() {
  const {  auth  } = useStore(useShallow(s => ({ auth: s.auth })))
  const role = resolveRole(auth.role)
  const level = getAccessLevel(role)

  // Admin → ProducerDashboard
  if (ADMIN_ROLES.includes(role) || level === 1) return <ProducerDashboard />

  // Realizador → DirectorDashboard
  if (DIRECTOR_ROLES.includes(role)) return <DirectorDashboard />

  // DP → DopDashboard
  if (DOP_ROLES.includes(role)) return <DopDashboard />

  // Elenco → ActorDashboard
  if (CAST_ROLES.includes(role)) return <ActorDashboard />

  // Produção/AD → ApDashboard (logística)
  if (AP_ROLES.includes(role)) return <ApDashboard />

  // Anotadora → DirectorDashboard (vê cenas + continuidade)
  if (role === 'anotadora') return <DirectorDashboard />

  // HODs técnicos (nível 3) → DopDashboard (técnico com equipa)
  if (level === 3) return <DopDashboard />

  // Todos os outros roles → O Meu Dia (dashboard universal)
  // Técnicos (nível 4), Especial (nível 6), HODs sem dashboard dedicado
  return <MyDay />
}
