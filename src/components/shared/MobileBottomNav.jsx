// Mobile bottom navigation — visible only on screens < 768px
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { canAccess } from '../../core/router.js'
import {
  LayoutDashboard, Clapperboard, MapPin, Users, MoreHorizontal, X,
  Globe, FileText, Zap, DollarSign, Repeat, Radio, Sun, Utensils, Navigation, Settings,
} from 'lucide-react'
import styles from './MobileBottomNav.module.css'

const MAIN_TABS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'production', icon: Clapperboard, label: 'Produção' },
  { id: 'locations', icon: MapPin, label: 'Locais' },
  { id: 'team', icon: Users, label: 'Equipa' },
]

const MORE_MODULES = [
  { id: 'universe', icon: Globe, label: 'Universo' },
  { id: 'pre-production', icon: FileText, label: 'Pré-Produção' },
  { id: 'optimization', icon: Zap, label: 'Optimização' },
  { id: 'budget', icon: DollarSign, label: 'Orçamento' },
  { id: 'continuity', icon: Repeat, label: 'Continuidade' },
  { id: 'live-board', icon: Radio, label: 'Live Board' },
  { id: 'callsheet', icon: Sun, label: 'Folha Serviço' },
  { id: 'settings', icon: Settings, label: 'Definições' },
  { id: 'meals', icon: Utensils, label: 'Refeições' },
  { id: 'gps-nav', icon: Navigation, label: 'GPS' },
]

export function MobileBottomNav() {
  const { activeModule, navigate, role } = useStore(useShallow(s => ({
    activeModule: s.ui.activeModule,
    navigate: s.navigate,
    role: s.auth.role,
  })))
  const [moreOpen, setMoreOpen] = useState(false)

  const visibleTabs = MAIN_TABS.filter(t => canAccess(role, t.id))
  const visibleMore = MORE_MODULES.filter(m => canAccess(role, m.id))

  const handleNav = (id) => {
    navigate(id)
    setMoreOpen(false)
  }

  return (
    <>
      {/* More modal overlay + panel */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              className={styles.moreOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              className={styles.morePanel}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className={styles.morePanelHeader}>
                <span className={styles.morePanelTitle}>Módulos</span>
                <button className={styles.morePanelClose} onClick={() => setMoreOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.moreGrid}>
                {visibleMore.map(mod => {
                  const Icon = mod.icon
                  return (
                    <button
                      key={mod.id}
                      className={`${styles.moreItem} ${activeModule === mod.id ? styles.moreItemActive : ''}`}
                      onClick={() => handleNav(mod.id)}
                    >
                      <Icon size={20} />
                      <span>{mod.label}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav className={styles.nav}>
        {visibleTabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeModule === tab.id
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => handleNav(tab.id)}
            >
              <Icon size={22} className={styles.tabIcon} />
              <span>{tab.label}</span>
            </button>
          )
        })}
        {visibleMore.length > 0 && (
          <button
            className={`${styles.tab} ${moreOpen ? styles.tabActive : ''}`}
            onClick={() => setMoreOpen(v => !v)}
          >
            <MoreHorizontal size={22} className={styles.tabIcon} />
            <span>Mais</span>
          </button>
        )}
      </nav>
    </>
  )
}
