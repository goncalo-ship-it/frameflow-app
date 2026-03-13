// Routing por role + módulo
// Delega para roles.js — mantém API backward-compatible

import { canAccess as checkAccess, getModulesForRole, resolveRole } from './roles.js'

export { getModulesForRole, resolveRole }

export const canAccess = (role, module) => checkAccess(resolveRole(role), module)
