// Shell principal — renderiza o módulo activo com base no estado do router
import { lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { ErrorBoundary } from './components/shared/ErrorBoundary.jsx'

// Importações lazy por módulo (code splitting)
const Dashboard = lazy(() => import('./roles/Dashboard.jsx').then(m => ({ default: m.Dashboard })))
const MyDay = lazy(() => import('./roles/myday/MyDay.jsx').then(m => ({ default: m.MyDay })))
const ProductionModule = lazy(() => import('./modules/production/index.jsx').then(m => ({ default: m.ProductionModule })))
const PreProductionModule = lazy(() => import('./modules/pre-production/index.jsx').then(m => ({ default: m.PreProductionModule })))
// ScriptAnalysisModule now loaded inside UniverseModule (consolidated sidebar)
const TeamModule = lazy(() => import('./modules/team/index.jsx').then(m => ({ default: m.TeamModule })))
const LocationsModule = lazy(() => import('./modules/locations/index.jsx').then(m => ({ default: m.LocationsModule })))
const UniverseModule = lazy(() => import('./modules/universe/index.jsx').then(m => ({ default: m.UniverseModule })))
const ContinuityModule = lazy(() => import('./modules/continuity/index.jsx').then(m => ({ default: m.ContinuityModule })))
// MirrorModule now loaded inside UniverseModule (consolidated sidebar)
const OptimizationModule = lazy(() => import('./modules/optimization/index.jsx').then(m => ({ default: m.OptimizationModule })))
const BudgetModule = lazy(() => import('./modules/budget/index.jsx').then(m => ({ default: m.BudgetModule })))
const SettingsModule = lazy(() => import('./modules/settings/index.jsx').then(m => ({ default: m.SettingsModule })))
const LiveBoard = lazy(() => import('./modules/live-board/index.jsx'))
// CallSheetModule now loaded inside ProductionModule (initialTab="callsheet")
// DepartmentsModule now loaded inside TeamModule (consolidated sidebar)
// ScriptModule now loaded inside UniverseModule (consolidated sidebar)
const MealsModule = lazy(() => import('./modules/meals/index.jsx').then(m => ({ default: m.MealsModule })))
const GpsNavModule = lazy(() => import('./modules/gps-nav/index.jsx').then(m => ({ default: m.GpsNavModule })))
// ProgressModule now rendered as tab inside OptimizationModule
// FinanceModule now rendered as tab inside BudgetModule
const IntegrationsModule = lazy(() => import('./modules/integrations/index.jsx').then(m => ({ default: m.IntegrationsModule })))
const InvitesModule = lazy(() => import('./modules/invites/index.jsx').then(m => ({ default: m.InvitesModule })))
const StoreModule = lazy(() => import('./modules/store/index.jsx').then(m => ({ default: m.StoreModule })))

export function AppShell() {
  const {  ui, wallpaper  } = useStore(useShallow(s => ({ ui: s.ui, wallpaper: s.wallpaper })))
  const { activeModule } = ui

  const renderModule = () => {
    switch (activeModule) {
      case 'myday':            return <MyDay />
      case 'dashboard':        return <Dashboard />
      case 'universe':         return <UniverseModule />
      case 'script-analysis':  return <UniverseModule initialSection="guioes" />
      case 'mirror':           return <UniverseModule initialSection="espelho" />
      case 'pre-production':   return <PreProductionModule />
      case 'schedule':         return <ProductionModule initialTab="schedule" />
      case 'production':       return <ProductionModule />
      case 'optimization':     return <OptimizationModule />
      case 'locations':        return <LocationsModule />
      case 'team':             return <TeamModule />
      case 'departments':      return <TeamModule initialSection="departamentos" />
      case 'cast':             return <TeamModule initialSection="equipa" initialFilter="elenco" />
      case 'dept-arte':
      case 'dept-guardaroupa':
      case 'dept-makeup':
      case 'dept-camara':
      case 'dept-som':
      case 'dept-casting':
      case 'dept-transporte':
      case 'dept-stunts':      return <TeamModule initialSection="departamentos" />
      case 'continuity':       return <ContinuityModule />
      case 'budget':           return <BudgetModule />
      case 'finance':          return <BudgetModule initialTab="finance" />
      case 'post-production':  return <ProductionModule initialTab="post-production" />
      case 'settings':         return <SettingsModule />
      case 'live-board':       return <LiveBoard />
      case 'callsheet':        return <ProductionModule initialTab="callsheet" />
      case 'script':           return <UniverseModule initialSection="guiao" />
      case 'bible':            return <UniverseModule initialSection="universo" initialTab="bible" />
      case 'writers-room':     return <UniverseModule initialSection="universo" initialTab="room" />
      case 'files':            return <UniverseModule initialSection="universo" initialTab="ficheiros" />
      case 'canon':            return <OptimizationModule initialTab="canon" />
      case 'health-safety':    return <OptimizationModule initialTab="health-safety" />
      case 'meals':            return <MealsModule />
      case 'gps-nav':          return <GpsNavModule />
      case 'progress':         return <OptimizationModule initialTab="progress" />
      case 'integrations':     return <IntegrationsModule />
      case 'invites':          return <InvitesModule />
      case 'store':            return <StoreModule />
      default:                 return <Dashboard />
    }
  }

  return (
    <>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <main style={{
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: 'transparent',
    }}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeModule}
          className="scroll-edge"
          style={{ flex: 1, overflow: 'auto', height: '100%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <ErrorBoundary>
            <Suspense fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 32, height: 32, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                  A carregar módulo…
                </div>
              </div>
            }>
              {renderModule()}
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </main>
    </>
  )
}
