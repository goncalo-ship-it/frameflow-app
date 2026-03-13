// Módulo de Finanças — orçamento único + repositório de documentos
// Sub-navegação vertical à esquerda com botões grandes
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, Settings, MessageSquare, History,
  Building, Upload, Users, Landmark, Receipt, FolderOpen, Plus, Trash2,
  Wand2, Loader, Wallet,
} from 'lucide-react'
import { useBudget } from './hooks/useBudget.js'
import { useBudgetCalculator } from './hooks/useBudgetCalculator.js'
import { fmt, fmtShort } from './utils/moneyUtils.js'
import { STATUS_LABELS } from './utils/marketData.js'
import { smartPopulate } from './utils/smartPopulate.js'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'

import { BudgetHeader }     from './components/BudgetHeader.jsx'
import { BudgetLines }      from './components/BudgetLines.jsx'
// BudgetSummary removido — integrado na Visão Geral
import { BudgetChat }       from './components/BudgetChat.jsx'
import { BudgetVersions }   from './components/BudgetVersions.jsx'
import { BudgetExport }     from './components/BudgetExport.jsx'
import { BudgetFinancing }  from './components/BudgetFinancing.jsx'
import { FolhaCaixa }       from './components/FolhaCaixa.jsx'
import { FinancialHealth }  from './components/FinancialHealth.jsx'
import { SupplierDrawer }   from './components/SupplierDrawer.jsx'
import { BudgetImporter }   from './BudgetImporter.jsx'
import { TeamSync }         from './components/TeamSync.jsx'
import { BudgetDocuments }  from './components/BudgetDocuments.jsx'
import FinanceModule from '../finance/index.jsx'

import styles from './Budget.module.css'

const SECTIONS = [
  { id: 'visao-geral',   label: 'Visão Geral',   icon: LayoutDashboard, desc: 'Saúde financeira' },
  { id: 'orcamento',     label: 'Orçamento',      icon: FileText,        desc: 'Linhas detalhadas' },
  { id: 'financiamento', label: 'Financiamento',  icon: Landmark,        desc: 'Fontes & GAP' },
  { id: 'despesas',      label: 'Despesas',       icon: Receipt,         desc: 'Folha de caixa' },
  { id: 'visao-financeira', label: 'Visão Financeira', icon: Wallet, desc: 'Panorama financeiro' },
  { id: 'documentos',    label: 'Documentos',     icon: FolderOpen,      desc: 'Repositório' },
  { id: 'chat',          label: 'Chat AI',        icon: MessageSquare,   desc: 'Assistente' },
  { id: 'cabecalho',     label: 'Dados',          icon: Settings,        desc: 'Cliente & projecto' },
  { id: 'versoes',       label: 'Versões',        icon: History,         desc: 'Snapshots' },
]

export function BudgetModule() {
  const {
    budgets, activeBudget, activeVersions,
    activeBudgetId, setActiveBudgetId,
    createBudget, updateHeader, updateBudgetField,
    addLine, addLines, updateLine, removeLine,
    fixLine, resetLine,
    saveVersion,
    removeBudget,
    addFinancing, updateFinancing, removeFinancing,
    addExpense, updateExpense, removeExpense,
  } = useBudget()

  // Auto-create single budget if none exists
  useEffect(() => {
    if (budgets.length === 0) {
      createBudget()
    } else if (!activeBudgetId) {
      setActiveBudgetId(budgets[0].id)
    }
  }, [budgets.length])

  const calc = useBudgetCalculator(activeBudget)

  const {  apiKey, addMember, addLocation, addDepartmentItem, team, locations  } = useStore(useShallow(s => ({ apiKey: s.apiKey, addMember: s.addMember, addLocation: s.addLocation, addDepartmentItem: s.addDepartmentItem, team: s.team, locations: s.locations })))

  const [activeSection, setActiveSection] = useState('visao-geral')
  const [showSuppliers, setShowSuppliers] = useState(false)
  const [showImporter, setShowImporter]   = useState(false)
  const [showTeamSync, setShowTeamSync]   = useState(false)
  const [deletingId, setDeletingId]       = useState(null)
  const [populating, setPopulating]       = useState(false)
  const [populateResult, setPopulateResult] = useState(null)

  const handleRestoreVersion = (snap) => {
    if (!activeBudgetId || !snap?.data) return
    updateBudgetField({
      lines:           snap.data.lines || [],
      header:          snap.data.header || {},
      ceiling:         snap.data.ceiling,
      taxaIva:         snap.data.taxaIva,
      taxaHonorarios:  snap.data.taxaHonorarios,
      notes:           snap.data.notes || '',
      constraints:     snap.data.constraints || [],
    })
  }

  const handleSmartPopulate = async () => {
    if (!activeBudget?.lines?.length || !apiKey || populating) return
    setPopulating(true)
    setPopulateResult(null)
    const result = await smartPopulate({
      lines: activeBudget.lines, apiKey, team, locations,
      addMember, addLocation, addDepartmentItem,
      budgetLines: activeBudget.lines, updateLine,
    })
    setPopulateResult(result)
    setPopulating(false)
    // Auto-hide result after 5s
    setTimeout(() => setPopulateResult(null), 5000)
  }

  const statusInfo = activeBudget ? (STATUS_LABELS[activeBudget.status] || STATUS_LABELS.draft) : null

  // Health status dot color for sub-nav
  const gap = calc?.gap ?? 0
  const disponivel = (calc?.totalComIva || 0) - (calc?.totalExpenses || 0) - (calc?.totalExecutado || 0)
  const healthColor = !calc ? 'var(--text-muted)'
    : (gap <= 0 && disponivel >= 0) ? 'var(--health-green)'
    : (gap > 0 || disponivel < 0) ? 'var(--health-red)'
    : 'var(--health-yellow)'

  if (!activeBudget) return null

  return (
    <div className={styles.root}>
      <SupplierDrawer open={showSuppliers} onClose={() => setShowSuppliers(false)} />

      {/* Modal inline — position:fixed escapa do container */}
      <AnimatePresence>
        {showImporter && (
          <BudgetImporter
            key="budget-importer"
            onClose={() => setShowImporter(false)}
            onAddLine={addLine}
            onAddLines={addLines}
            onCreateBudget={createBudget}
            onUpdateLine={updateLine}
          />
        )}
      </AnimatePresence>

      <TeamSync open={showTeamSync} onClose={() => setShowTeamSync(false)} budget={activeBudget} onAddLine={addLine} onUpdateLine={updateLine} />

      <div className={styles.mainLayout}>
        {/* ── Lista de orçamentos (sidebar esquerda) ── */}
        <div className={styles.budgetSidebar} style={{ width: 220 }}>
          <div className={styles.budgetList}>
            <div className={styles.budgetListHeader}>
              <span className={styles.budgetListTitle}>Orçamentos</span>
              <button className={styles.btnCreateBudget} onClick={createBudget} title="Novo orçamento">
                <Plus size={12} /> Novo
              </button>
            </div>
            <div className={styles.budgetListItems}>
              {budgets.length === 0 && (
                <div className={styles.budgetListEmpty}>
                  <p>Nenhum orçamento</p>
                  <button className={styles.btnCreateBudget} onClick={createBudget}>
                    <Plus size={12} /> Criar
                  </button>
                </div>
              )}
              {budgets.map(b => {
                const isActive = b.id === activeBudgetId
                const statusInfo = STATUS_LABELS[b.status] || STATUS_LABELS.draft
                const name = b.header?.campanha || b.header?.cliente || '—'
                const isDeleting = deletingId === b.id
                return (
                  <div
                    key={b.id}
                    className={`${styles.budgetCard} ${isActive ? styles.budgetCardActive : ''}`}
                    onClick={() => { setActiveBudgetId(b.id); setDeletingId(null) }}
                  >
                    <div className={styles.budgetCardTop}>
                      <span className={styles.budgetCardNum}>{b.numero}</span>
                      <span className={styles.budgetCardStatus} style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                      <button
                        className={styles.budgetCardDelete}
                        onClick={e => { e.stopPropagation(); setDeletingId(isDeleting ? null : b.id) }}
                        title="Apagar"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div className={styles.budgetCardCampanha}>{name}</div>
                    {isDeleting && (
                      <div className={styles.budgetCardDeleteConfirm}>
                        <span>Apagar?</span>
                        <button className={styles.btnDangerSm} onClick={e => { e.stopPropagation(); removeBudget(b.id); setDeletingId(null) }}>Sim</button>
                        <button className={styles.btnMutedSm} onClick={e => { e.stopPropagation(); setDeletingId(null) }}>Não</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Conteúdo principal: sub-nav + área ── */}
        <div className={styles.budgetContent}>
          <div className={styles.finLayout}>

            {/* ── Sub-navegação vertical ── */}
            <div className={styles.finSubNav} data-glass>
              {/* Budget info mini */}
              <div className={styles.finSubNavHeader}>
                <span className={styles.finSubNavNum}>{activeBudget.numero}</span>
                <span className={styles.finSubNavName}>
                  {activeBudget.header?.campanha || activeBudget.header?.cliente || '—'}
                </span>
                {statusInfo && (
                  <span className={styles.finSubNavStatus} style={{ color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                )}
                {calc && (
                  <span className={styles.finSubNavTotal}>
                    {fmtShort(calc.totalVenda)} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>s/IVA</span>
                    {' · '}
                    {fmtShort(calc.totalComIva)} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>c/IVA</span>
                  </span>
                )}
              </div>

              {/* Section buttons */}
              <nav className={styles.finSubNavItems}>
                {SECTIONS.map(sec => {
                  const Icon = sec.icon
                  const isActive = activeSection === sec.id
                  return (
                    <button
                      key={sec.id}
                      className={`${styles.finSubNavBtn} ${isActive ? styles.finSubNavBtnActive : ''}`}
                      onClick={() => setActiveSection(sec.id)}
                    >
                      <span className={styles.finSubNavBtnIcon}>
                        <Icon size={20} />
                        {sec.id === 'visao-geral' && (
                          <span className={styles.finSubNavDot} style={{ background: healthColor, boxShadow: `0 0 6px ${healthColor}` }} />
                        )}
                      </span>
                      <span className={styles.finSubNavBtnText}>
                        <span className={styles.finSubNavBtnLabel}>{sec.label}</span>
                        <span className={styles.finSubNavBtnDesc}>{sec.desc}</span>
                      </span>
                    </button>
                  )
                })}
              </nav>

              {/* Actions at bottom */}
              <div className={styles.finSubNavActions}>
                <button
                  className={styles.finSubNavActionBtn}
                  onClick={handleSmartPopulate}
                  disabled={populating || !activeBudget?.lines?.length || !apiKey}
                  style={populating ? { opacity: 0.7 } : undefined}
                  title="Re-analisa linhas do orçamento e povoa Equipa, Locais e Departamentos"
                >
                  {populating
                    ? <><Loader size={14} className={styles.spinIcon} /> A povoar…</>
                    : <><Wand2 size={14} /> Povoar Módulos</>
                  }
                </button>
                {populateResult && (
                  <div className={styles.populateResultBadges}>
                    {populateResult.team > 0 && <span className={styles.populateBadge} style={{ color: 'var(--accent)' }}>+{populateResult.team} equipa</span>}
                    {populateResult.locations > 0 && <span className={styles.populateBadge} style={{ color: '#2EA080' }}>+{populateResult.locations} locais</span>}
                    {populateResult.departments > 0 && <span className={styles.populateBadge} style={{ color: '#7B4FBF' }}>+{populateResult.departments} dept</span>}
                    {populateResult.team === 0 && populateResult.locations === 0 && populateResult.departments === 0 && (
                      <span className={styles.populateBadge} style={{ color: 'var(--text-muted)' }}>Tudo já povoado</span>
                    )}
                  </div>
                )}
                <button className={styles.finSubNavActionBtn} onClick={() => setShowSuppliers(true)}>
                  <Building size={14} /> Fornecedores
                </button>
                <button className={styles.finSubNavActionBtn} onClick={() => setShowTeamSync(true)}>
                  <Users size={14} /> Sync Equipa
                </button>
                <button className={styles.finSubNavActionBtn} onClick={() => setShowImporter(true)}>
                  <Upload size={14} /> Importar
                </button>
                <BudgetExport budget={activeBudget} calc={calc} />
              </div>
            </div>

            {/* ── Área de conteúdo ── */}
            <div className={styles.finArea}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  style={{ height: '100%', overflow: 'auto' }}
                >
                  {activeSection === 'visao-geral' && (
                    <FinancialHealth budget={activeBudget} calc={calc} />
                  )}
                  {activeSection === 'orcamento' && (
                    <BudgetLines
                      budget={activeBudget} calc={calc}
                      onAddLine={addLine} onUpdateLine={updateLine} onRemoveLine={removeLine}
                      onFixLine={fixLine} onResetLine={resetLine}
                      onUpdateBudgetField={updateBudgetField}
                    />
                  )}
                  {activeSection === 'financiamento' && (
                    <BudgetFinancing
                      budget={activeBudget} calc={calc}
                      onAdd={addFinancing} onUpdate={updateFinancing} onRemove={removeFinancing}
                    />
                  )}
                  {activeSection === 'despesas' && (
                    <FolhaCaixa
                      budget={activeBudget} calc={calc}
                      onAdd={addExpense} onUpdate={updateExpense} onRemove={removeExpense}
                    />
                  )}
                  {activeSection === 'visao-financeira' && (
                    <FinanceModule />
                  )}
                  {activeSection === 'documentos' && (
                    <BudgetDocuments />
                  )}
                  {activeSection === 'cabecalho' && (
                    <BudgetHeader budget={activeBudget} onUpdateHeader={updateHeader} onUpdateField={updateBudgetField} />
                  )}
                  {activeSection === 'chat' && (
                    <BudgetChat budget={activeBudget} onAddLine={addLine} />
                  )}
                  {activeSection === 'versoes' && (
                    <BudgetVersions versions={activeVersions} budget={activeBudget} onSave={saveVersion} onRestore={handleRestoreVersion} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
