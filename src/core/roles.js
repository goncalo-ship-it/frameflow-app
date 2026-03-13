// ── Departamentos, Roles, Hierarquia e Permissões ──────────────────
// Fonte: BRIEF_DEPARTAMENTOS_HIERARQUIA.md
// Todos os roles de produção audiovisual PT — acima e abaixo da linha

// ── Departamentos ──────────────────────────────────────────────────
export const DEPARTMENTS = {
  ACIMA_LINHA:   { id: 'acima_linha',   label: 'Acima da Linha',      color: '#A02E6F', order: 0 },
  REALIZACAO:    { id: 'realizacao',     label: 'Realização',          color: '#5B8DEF', order: 1 },
  PRODUCAO:      { id: 'producao',       label: 'Produção',            color: '#8B6FBF', order: 2 },
  CAMARA:        { id: 'camara',         label: 'Câmara',              color: '#2EA080', order: 3 },
  LUZ:           { id: 'luz_electrico',  label: 'Luz / Eléctrico',     color: '#F5A623', order: 4 },
  GRIP:          { id: 'grip',           label: 'Grip / Maquinaria',   color: '#D4A017', order: 5 },
  SOM:           { id: 'som',            label: 'Som',                 color: '#3498DB', order: 6 },
  ARTE:          { id: 'arte',           label: 'Arte / Cenografia',   color: '#E74C3C', order: 7 },
  GUARDAROUPA:   { id: 'guardaroupa',    label: 'Guarda-Roupa',        color: '#9B59B6', order: 8 },
  MAQUILHAGEM:   { id: 'maquilhagem',    label: 'Maquilhagem & Cabelos', color: '#E91E90', order: 9 },
  ELENCO:        { id: 'elenco',         label: 'Elenco',              color: '#FF6B6B', order: 10 },
  POS_PRODUCAO:  { id: 'pos_producao',   label: 'Pós-Produção',        color: '#7F8C8D', order: 11 },
  LOGISTICA:     { id: 'logistica',      label: 'Logística & Catering', color: '#95A5A6', order: 12 },
}

// ── Roles completos ────────────────────────────────────────────────
// Cada role tem: id, label (PT), department, isHOD (head of dept), accessLevel (1-6)
export const ROLES = {
  // ACIMA DA LINHA
  produtor_executivo:    { id: 'produtor_executivo',    label: 'Produtor Executivo',          dept: 'acima_linha',   isHOD: false, level: 1 },
  director_producao:     { id: 'director_producao',     label: 'Diretor de Produção',         dept: 'acima_linha',   isHOD: false, level: 1 },
  realizador:            { id: 'realizador',            label: 'Realizador',                  dept: 'realizacao',    isHOD: true,  level: 2 },
  guionista:             { id: 'guionista',             label: 'Guionista',                   dept: 'acima_linha',   isHOD: false, level: 6 },

  // REALIZAÇÃO
  primeiro_ad:           { id: 'primeiro_ad',           label: '1º Assistente Realização',    dept: 'realizacao',    isHOD: false, level: 2 },
  segundo_ad:            { id: 'segundo_ad',            label: '2º Assistente Realização',    dept: 'realizacao',    isHOD: false, level: 4 },
  terceiro_ad:           { id: 'terceiro_ad',           label: '3º Assistente Realização',    dept: 'realizacao',    isHOD: false, level: 4 },
  anotadora:             { id: 'anotadora',             label: 'Anotadora / Script Supervisor', dept: 'realizacao', isHOD: false, level: 4 },
  pa_set:                { id: 'pa_set',                label: 'PA de Set / Runner',          dept: 'realizacao',    isHOD: false, level: 6 },

  // PRODUÇÃO
  chefe_producao:        { id: 'chefe_producao',        label: 'Chefe de Produção',           dept: 'producao',      isHOD: false, level: 2 },
  secretaria_producao:   { id: 'secretaria_producao',   label: 'Secretária de Produção',      dept: 'producao',      isHOD: false, level: 4 },
  assistente_producao:   { id: 'assistente_producao',   label: 'Assistente de Produção',      dept: 'producao',      isHOD: false, level: 4 },
  location_manager:      { id: 'location_manager',      label: 'Location Manager',            dept: 'producao',      isHOD: false, level: 3 },
  coordenador_casting:   { id: 'coordenador_casting',   label: 'Coordenador de Casting',      dept: 'producao',      isHOD: false, level: 6 },
  driver:                { id: 'driver',                label: 'Motorista',                   dept: 'producao',      isHOD: false, level: 4 },

  // CÂMARA
  dir_fotografia:        { id: 'dir_fotografia',        label: 'Diretor de Fotografia (DP)',  dept: 'camara',        isHOD: true,  level: 3 },
  operador_camara:       { id: 'operador_camara',       label: 'Operador de Câmara',          dept: 'camara',        isHOD: false, level: 4 },
  primeiro_ac:           { id: 'primeiro_ac',           label: '1º AC / Focus Puller',        dept: 'camara',        isHOD: false, level: 4 },
  segundo_ac:            { id: 'segundo_ac',            label: '2º AC / Clapper',             dept: 'camara',        isHOD: false, level: 4 },
  dit:                   { id: 'dit',                   label: 'DIT',                         dept: 'camara',        isHOD: false, level: 4 },
  video_assist:          { id: 'video_assist',          label: 'Video Assist',                dept: 'camara',        isHOD: false, level: 4 },

  // LUZ / ELÉCTRICO
  gaffer:                { id: 'gaffer',                label: 'Gaffer (Chefe Iluminador)',   dept: 'luz_electrico', isHOD: true,  level: 3 },
  best_boy_electric:     { id: 'best_boy_electric',     label: 'Best Boy Electric',           dept: 'luz_electrico', isHOD: false, level: 4 },
  electricista:          { id: 'electricista',          label: 'Electricista',                dept: 'luz_electrico', isHOD: false, level: 4 },

  // GRIP / MAQUINARIA
  key_grip:              { id: 'key_grip',              label: 'Key Grip',                    dept: 'grip',          isHOD: true,  level: 3 },
  best_boy_grip:         { id: 'best_boy_grip',         label: 'Best Boy Grip',               dept: 'grip',          isHOD: false, level: 4 },
  dolly_grip:            { id: 'dolly_grip',            label: 'Dolly Grip',                  dept: 'grip',          isHOD: false, level: 4 },
  grip:                  { id: 'grip',                  label: 'Grip',                        dept: 'grip',          isHOD: false, level: 4 },

  // SOM
  operador_som:          { id: 'operador_som',          label: 'Operador de Som',             dept: 'som',           isHOD: true,  level: 3 },
  boom_operator:         { id: 'boom_operator',         label: 'Boom Operator (Perchista)',   dept: 'som',           isHOD: false, level: 4 },

  // ARTE / CENOGRAFIA
  director_arte:         { id: 'director_arte',         label: 'Diretor de Arte',             dept: 'arte',          isHOD: true,  level: 3 },
  set_decorator:         { id: 'set_decorator',         label: 'Decorador de Set',            dept: 'arte',          isHOD: false, level: 4 },
  prop_master:           { id: 'prop_master',           label: 'Chefe de Adereços',           dept: 'arte',          isHOD: false, level: 4 },
  set_dresser:           { id: 'set_dresser',           label: 'Adereçador de Set',           dept: 'arte',          isHOD: false, level: 4 },

  // GUARDA-ROUPA
  figurinista:           { id: 'figurinista',           label: 'Figurinista',                 dept: 'guardaroupa',   isHOD: true,  level: 3 },
  wardrobe_supervisor:   { id: 'wardrobe_supervisor',   label: 'Wardrobe Supervisor',         dept: 'guardaroupa',   isHOD: false, level: 4 },
  set_costumer:          { id: 'set_costumer',          label: 'Set Costumer',                dept: 'guardaroupa',   isHOD: false, level: 4 },

  // MAQUILHAGEM & CABELOS
  chefe_maquilhagem:     { id: 'chefe_maquilhagem',     label: 'Chefe de Maquilhagem',        dept: 'maquilhagem',   isHOD: true,  level: 3 },
  chefe_cabelos:         { id: 'chefe_cabelos',         label: 'Chefe de Cabelos',            dept: 'maquilhagem',   isHOD: false, level: 4 },
  assistente_mua:        { id: 'assistente_mua',        label: 'Assistente MUA',              dept: 'maquilhagem',   isHOD: false, level: 4 },

  // ELENCO
  elenco_principal:      { id: 'elenco_principal',      label: 'Elenco Principal',            dept: 'elenco',        isHOD: false, level: 5 },
  elenco_sec_adulto:     { id: 'elenco_sec_adulto',     label: 'Elenco Secundário (Adulto)',  dept: 'elenco',        isHOD: false, level: 5 },
  elenco_sec_juvenil:    { id: 'elenco_sec_juvenil',    label: 'Elenco Secundário (Juvenil)', dept: 'elenco',        isHOD: false, level: 5 },
  figuracao:             { id: 'figuracao',             label: 'Figuração',                   dept: 'elenco',        isHOD: false, level: 5 },

  // PÓS-PRODUÇÃO
  supervisor_pos:        { id: 'supervisor_pos',        label: 'Supervisor Pós-Produção',     dept: 'pos_producao',  isHOD: true,  level: 3 },
  editor:                { id: 'editor',                label: 'Editor / Montador',           dept: 'pos_producao',  isHOD: false, level: 4 },
  assistente_edicao:     { id: 'assistente_edicao',     label: 'Assistente de Edição',        dept: 'pos_producao',  isHOD: false, level: 4 },
  colorista:             { id: 'colorista',             label: 'Colorista',                   dept: 'pos_producao',  isHOD: false, level: 4 },
  vfx:                   { id: 'vfx',                   label: 'VFX / Motion Graphics',       dept: 'pos_producao',  isHOD: false, level: 4 },
  sound_designer:        { id: 'sound_designer',        label: 'Sound Designer',              dept: 'pos_producao',  isHOD: false, level: 4 },

  // OUTROS / LOGÍSTICA
  fotografo_set:         { id: 'fotografo_set',         label: 'Fotógrafo de Set',            dept: 'logistica',     isHOD: false, level: 4 },
  catering:              { id: 'catering',              label: 'Catering / Craft Services',   dept: 'logistica',     isHOD: false, level: 4 },
}

// ── Níveis de acesso ───────────────────────────────────────────────
// Level 1: Admin total (Director Produção, Produtor Executivo)
// Level 2: Chefias operacionais (Realizador, 1º AD, Chefe Produção)
// Level 3: HODs (DP, Gaffer, Dir. Arte, etc.)
// Level 4: Técnicos (operadores, assistentes, etc.)
// Level 5: Elenco (só call sheet pessoal)
// Level 6: Especiais (guionista, casting, PA set — acesso custom)

export const ACCESS_LEVELS = {
  1: { label: 'Admin',     description: 'Acesso total. Cria/remove utilizadores. Orçamento.' },
  2: { label: 'Chefia',    description: 'Informação operacional completa. Call sheets. Sem orçamento.' },
  3: { label: 'HOD',       description: 'Call sheet completa. Notas do departamento.' },
  4: { label: 'Técnico',   description: 'Call sheet do dia. Info do departamento. Read-only.' },
  5: { label: 'Elenco',    description: 'Call sheet pessoal filtrada. Só as suas cenas.' },
  6: { label: 'Especial',  description: 'Acesso custom por role.' },
}

// ── Módulos por nível de acesso ────────────────────────────────────
const MODULES_BY_LEVEL = {
  1: [
    'myday', 'dashboard', 'universe', 'pre-production', 'schedule', 'production', 'script', 'script-analysis',
    'optimization', 'locations', 'team', 'cast', 'departments', 'mirror',
    'continuity', 'budget', 'finance', 'progress', 'settings', 'live-board', 'callsheet',
    'post-production', 'meals', 'gps-nav', 'integrations', 'invites', 'store',
    'bible', 'writers-room', 'files', 'canon', 'health-safety',
    'dept-arte', 'dept-guardaroupa', 'dept-makeup', 'dept-camara', 'dept-som', 'dept-casting', 'dept-transporte', 'dept-stunts',
  ],
  2: [
    'myday', 'dashboard', 'universe', 'production', 'script', 'script-analysis',
    'optimization', 'locations', 'team', 'cast', 'departments', 'mirror',
    'continuity', 'progress', 'live-board', 'callsheet',
    'meals', 'gps-nav',
    'bible', 'writers-room', 'files', 'canon', 'health-safety',
    'dept-arte', 'dept-guardaroupa', 'dept-makeup', 'dept-camara', 'dept-som', 'dept-casting', 'dept-transporte', 'dept-stunts',
  ],
  3: [
    'myday', 'dashboard', 'production', 'script', 'locations', 'team', 'cast', 'departments',
    'continuity', 'live-board', 'callsheet',
    'meals', 'gps-nav',
    'dept-arte', 'dept-guardaroupa', 'dept-makeup', 'dept-camara', 'dept-som', 'dept-casting', 'dept-transporte', 'dept-stunts',
  ],
  4: [
    'myday', 'dashboard', 'production', 'locations', 'team', 'cast', 'departments', 'live-board', 'callsheet',
    'meals', 'gps-nav',
    'dept-arte', 'dept-guardaroupa', 'dept-makeup', 'dept-camara', 'dept-som', 'dept-casting', 'dept-transporte', 'dept-stunts',
  ],
  5: [
    'myday', 'dashboard', 'live-board', 'callsheet',
  ],
  6: [
    'myday', 'dashboard', 'live-board', 'callsheet',
  ],
}

// Excepções por role (adicionam módulos ao nível base)
const ROLE_MODULE_EXTRAS = {
  anotadora:          ['continuity', 'universe', 'team'],
  guionista:          ['universe'],
  coordenador_casting: ['team'],
  pa_set:             ['production', 'locations', 'team'],
  location_manager:   ['locations'],
  primeiro_ad:        ['pre-production'],
  chefe_producao:     ['pre-production'],
}

// ── API pública ────────────────────────────────────────────────────

/** Obtém os módulos permitidos para um role */
export function getModulesForRole(rawRoleId) {
  const roleId = resolveRole(rawRoleId)
  const role = ROLES[roleId]
  if (!role) return ['dashboard']
  const base = [...(MODULES_BY_LEVEL[role.level] || ['dashboard'])]
  const extras = ROLE_MODULE_EXTRAS[roleId] || []
  const all = new Set([...base, ...extras])
  return [...all]
}

/** Verifica se um role tem acesso a um módulo */
export function canAccess(rawRoleId, module) {
  return getModulesForRole(rawRoleId).includes(module)
}

/** Obtém o nível de acesso de um role */
export function getAccessLevel(rawRoleId) {
  const roleId = resolveRole(rawRoleId)
  return ROLES[roleId]?.level || 4
}

/** Obtém o departamento de um role */
export function getDepartment(rawRoleId) {
  const roleId = resolveRole(rawRoleId)
  const deptId = ROLES[roleId]?.dept
  return Object.values(DEPARTMENTS).find(d => d.id === deptId) || null
}

/** Verifica se é admin (nível 1) */
export function isAdmin(rawRoleId) {
  return getAccessLevel(rawRoleId) === 1
}

/** Verifica se pode editar call sheets (nível 1 ou 2) */
export function canEditCallSheet(roleId) {
  return getAccessLevel(roleId) <= 2
}

/** Verifica se pode ver orçamento (só nível 1) */
export function canViewBudget(roleId) {
  return getAccessLevel(roleId) === 1
}

/** Verifica se pode gerir equipa (só nível 1) */
export function canManageTeam(roleId) {
  return getAccessLevel(roleId) === 1
}

/** Verifica se pode ver guião completo (nível 1-2 + anotadora + guionista) */
export function canViewFullScript(roleId) {
  const level = getAccessLevel(roleId)
  return level <= 2 || roleId === 'anotadora' || roleId === 'guionista'
}

/** Obtém roles agrupados por departamento (para UI de selecção) */
export function getRolesByDepartment() {
  const grouped = {}
  for (const [id, role] of Object.entries(ROLES)) {
    const dept = Object.values(DEPARTMENTS).find(d => d.id === role.dept)
    if (!dept) continue
    if (!grouped[dept.id]) {
      grouped[dept.id] = { ...dept, roles: [] }
    }
    grouped[dept.id].roles.push({ ...role, id })
  }
  return Object.values(grouped).sort((a, b) => a.order - b.order)
}

/** Mapeamento legacy role → novo role (para migração) */
export const LEGACY_ROLE_MAP = {
  'producer':      'director_producao',
  'director':      'realizador',
  'dop':           'dir_fotografia',
  'art-director':  'director_arte',
  'actor':         'elenco_principal',
  'ap':            'assistente_producao',
  'sound':         'operador_som',
  'script-sup':    'anotadora',
  'client':        null,  // sem equivalente directo
}

/** Resolve um role (legacy ou novo) para o novo formato */
export function resolveRole(roleId) {
  if (ROLES[roleId]) return roleId
  return LEGACY_ROLE_MAP[roleId] || roleId
}

// ── Visibilidade da call sheet por nível ───────────────────────────
export const CALLSHEET_VISIBILITY = {
  1: 'full',          // Tudo
  2: 'full',          // Tudo operacional (sem orçamento inline)
  3: 'full',          // Call sheet completa
  4: 'full',          // Call sheet do dia
  5: 'personal',      // Só a sua secção + cenas
  6: 'custom',        // Depende do role
}

// Roles de elenco que vêem call sheet filtrada
export const CAST_ROLES = ['elenco_principal', 'elenco_sec_adulto', 'elenco_sec_juvenil', 'figuracao']
export const isCastRole = (roleId) => CAST_ROLES.includes(roleId)

// ── Painéis da app ─────────────────────────────────────────────────
// 'superadmin' — vista de deus, todos os projectos
// 'management' — gestão do projecto (nível 1-2)
// 'roleview'   — vista da equipa (nível 3+)

/** Determina o painel activo com base no auth state */
export function resolvePanel(auth) {
  if (!auth) return 'management'
  if (auth.previewPanel) return auth.previewPanel
  if (auth.isSuperAdmin) return 'superadmin'
  const level = getAccessLevel(auth.role)
  if (level <= 2) return 'management'
  return 'roleview'
}

/** Pode fazer preview de outros painéis? */
export function canPreview(auth) {
  if (!auth) return false
  return auth.isSuperAdmin || getAccessLevel(auth.role) <= 1
}
