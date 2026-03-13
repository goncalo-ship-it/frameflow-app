// FRAME — Módulo Guião de Produção + Sides
// 5 vistas: Narrativa · Rodagem · Sequências · Produtor · Dia
// Container com toggle + guard (se não há guiões → mensagem)

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Film, Palette, BarChart3, CalendarDays,
  FileText, AlertTriangle, Scissors, FileOutput, GitBranch, ScrollText,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { useScript } from './hooks/useScript.js'
import { NarrativeView } from './components/NarrativeView.jsx'
import { ShootingView } from './components/ShootingView.jsx'
import { SequenceView } from './components/SequenceView.jsx'
import { ProducerView } from './components/ProducerView.jsx'
import { DayView } from './components/DayView.jsx'
import { SidesView } from './components/SidesView.jsx'
import { VersionDiff } from './components/VersionDiff.jsx'
import { FullScriptView } from './components/FullScriptView.jsx'
import styles from './Script.module.css'

const VIEWS = [
  { id: 'leitura',     label: 'Leitura',     icon: ScrollText },
  { id: 'narrativa',   label: 'Narrativa',   icon: BookOpen },
  { id: 'rodagem',     label: 'Rodagem',     icon: Film },
  { id: 'sequencias',  label: 'Sequências',  icon: Scissors },
  { id: 'produtor',    label: 'Produtor',    icon: BarChart3 },
  { id: 'dia',         label: 'Dia',         icon: CalendarDays },
  { id: 'sides',       label: 'Sides',       icon: FileOutput },
  { id: 'versoes',     label: 'Versões',     icon: GitBranch },
]

export function ScriptModule() {
  const [activeView, setActiveView] = useState('leitura')
  const {  parsedScripts, navigate  } = useStore(useShallow(s => ({ parsedScripts: s.parsedScripts, navigate: s.navigate })))
  const scriptData = useScript()

  const hasScripts = Object.keys(parsedScripts || {}).length > 0
  const { progresso, costurasActivas, sequencias } = scriptData

  if (!hasScripts) {
    return (
      <div className={styles.scriptRoot}>
        <div className={styles.emptyState}>
          <FileText size={48} style={{ opacity: 0.3 }} />
          <h2>Guião de Produção</h2>
          <p>Importa um guião no módulo <strong>Análise de Guião</strong> para começar.</p>
          <button
            onClick={() => navigate('universe')}
            style={{
              marginTop: 12, padding: '8px 18px', borderRadius: 'var(--radius-md)',
              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
              color: 'var(--accent-light)', cursor: 'pointer', fontSize: 'var(--text-sm)',
              fontWeight: 600,
            }}
          >
            Ir para Análise de Guião
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Formatos suportados: Final Draft (.fdx), HTML, texto
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.scriptRoot}>
      {/* ── Header ── */}
      <div className={styles.scriptHeader}>
        <div className={styles.scriptHeaderLeft}>
          <span className={styles.scriptTitle}>Guião de Produção</span>
          <span className={styles.scriptVersion}>
            {scriptData.versao}
          </span>

          {/* Vista tabs */}
          <nav className={styles.viewTabs}>
            {VIEWS.map(view => {
              const Icon = view.icon
              const sidesCount = useStore.getState().sidesGerados?.filter(s => s.status === 'activo').length || 0
              const hasBadge =
                (view.id === 'sequencias' && costurasActivas.length > 0) ||
                (view.id === 'produtor' && progresso.picks > 0) ||
                (view.id === 'sides' && sidesCount > 0)
              return (
                <button
                  key={view.id}
                  className={`${styles.viewTab} ${activeView === view.id ? styles.viewTabActive : ''}`}
                  onClick={() => setActiveView(view.id)}
                >
                  <Icon size={13} />
                  {view.label}
                  {hasBadge && (
                    <span className={styles.viewBadge}>
                      {view.id === 'sequencias' ? costurasActivas.length : view.id === 'sides' ? sidesCount : progresso.picks}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Progresso global */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progresso.percentagem}%` }} />
          <span className={styles.progressLabel}>
            {progresso.filmadas}/{progresso.total - progresso.cortadas} cenas · {progresso.percentagem}%
          </span>
        </div>
      </div>

      {/* ── Alertas de costuras (próximos 2 dias) ── */}
      {costurasActivas.length > 0 && activeView !== 'sequencias' && (
        <div className={styles.costuraAlert}>
          <AlertTriangle size={12} />
          <span>
            {costurasActivas.length} costura(s) com checklist pendente
          </span>
          <button
            className={styles.costuraAlertBtn}
            onClick={() => setActiveView('sequencias')}
          >
            Ver
          </button>
        </div>
      )}

      {/* ── Vista activa ── */}
      <div className={styles.scriptContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            className={styles.viewWrap}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeView === 'leitura'    && <FullScriptView />}
            {activeView === 'narrativa'  && <NarrativeView scriptData={scriptData} />}
            {activeView === 'rodagem'    && <ShootingView  scriptData={scriptData} />}
            {activeView === 'sequencias' && <SequenceView  scriptData={scriptData} />}
            {activeView === 'produtor'   && <ProducerView  scriptData={scriptData} />}
            {activeView === 'dia'        && <DayView       scriptData={scriptData} />}
            {activeView === 'sides'      && <SidesView     scriptData={scriptData} />}
            {activeView === 'versoes'    && <VersionDiff   scriptData={scriptData} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
