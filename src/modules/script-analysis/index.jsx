// Módulo Análise de Guião — 4 tabs (consolidado)
// Guião · Análise · Métricas · Comparar

import { useState, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { FileText, CheckCircle, Activity, GitCompare } from 'lucide-react'
import { ContextualCorrector } from './ContextualCorrector.jsx'
import { TensionMap } from './TensionMap.jsx'
import { DialogueAnalysis } from './DialogueAnalysis.jsx'
import { ScriptUploader } from './ScriptUploader.jsx'
import { EpisodeComparator } from './EpisodeComparator.jsx'
import { ScriptReader } from './ScriptReader.jsx'
import { ScriptDiagnostics } from './ScriptDiagnostics.jsx'
import styles from './ScriptAnalysis.module.css'

// Lazy-loaded 1st AD components
const BreakdownSheet = lazy(() => import('./BreakdownSheet.jsx').then(m => ({ default: m.BreakdownSheet })))
const OneLiner = lazy(() => import('./OneLiner.jsx').then(m => ({ default: m.OneLiner })))
const DayOutOfDays = lazy(() => import('./DayOutOfDays.jsx').then(m => ({ default: m.DayOutOfDays })))
const ScheduleWarnings = lazy(() => import('./ScheduleWarnings.jsx').then(m => ({ default: m.ScheduleWarnings })))

const LazyFallback = () => <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>A carregar...</div>

const TABS = [
  { id: 'guiao',    label: 'Guião',    icon: FileText },
  { id: 'analise',  label: 'Análise',  icon: CheckCircle },
  { id: 'metricas', label: 'Métricas', icon: Activity },
  { id: 'compare',  label: 'Comparar', icon: GitCompare },
]

const SUB_TOGGLE_STYLE = {
  bar: { display: 'flex', gap: 6, padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)' },
  btn: (active) => ({
    padding: '4px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: '1px solid ' + (active ? 'var(--mod-script)' + '66' : 'var(--border-subtle)'),
    background: active ? 'var(--mod-script)' + '15' : 'transparent',
    color: active ? 'var(--mod-script)' : 'var(--text-muted)',
  }),
}

export function ScriptAnalysisModule() {
  const [activeTab, setActiveTab] = useState('guiao')
  const [parsedScript, setParsedScript] = useState(null)
  const [guiaoSub, setGuiaoSub] = useState('upload')       // upload | reader
  const [analiseSub, setAnaliseSub] = useState('diagnostics') // diagnostics | corrector | breakdown | oneliner
  const [metricasSub, setMetricasSub] = useState('tension')   // tension | dialogue | dood | avisos

  // Collect all scenes from parsedScript (local) or store for 1st AD views
  const allScenes = parsedScript?.scenes || []

  return (
    <div className={styles.module}>
      <div className={styles.topBar}>
        <div className={styles.titleRow}>
          <div className={styles.titleIcon}>
            <FileText size={14} color="var(--mod-script)" />
          </div>
          <h2 className={styles.title}>
            Análise de <span className={styles.titleAccent}>Guião</span>
          </h2>
        </div>

        <nav className={styles.segmented}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.seg} ${activeTab === tab.id ? styles.segActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <motion.div
        key={activeTab}
        className={styles.content}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.14 }}
      >
        {/* TAB: Guião (upload + leitura) */}
        {activeTab === 'guiao' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={SUB_TOGGLE_STYLE.bar}>
              <button style={SUB_TOGGLE_STYLE.btn(guiaoSub === 'upload')} onClick={() => setGuiaoSub('upload')}>Importar</button>
              <button style={SUB_TOGGLE_STYLE.btn(guiaoSub === 'reader')} onClick={() => setGuiaoSub('reader')}>Leitura</button>
            </div>
            {guiaoSub === 'upload' && <ScriptUploader onParsed={setParsedScript} parsed={parsedScript} />}
            {guiaoSub === 'reader' && <ScriptReader />}
          </div>
        )}

        {/* TAB: Análise (diagnóstico + corretor + breakdown + one-liner) */}
        {activeTab === 'analise' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={SUB_TOGGLE_STYLE.bar}>
              <button style={SUB_TOGGLE_STYLE.btn(analiseSub === 'diagnostics')} onClick={() => setAnaliseSub('diagnostics')}>Diagnóstico</button>
              <button style={SUB_TOGGLE_STYLE.btn(analiseSub === 'corrector')} onClick={() => setAnaliseSub('corrector')}>Corretor</button>
              <button style={SUB_TOGGLE_STYLE.btn(analiseSub === 'breakdown')} onClick={() => setAnaliseSub('breakdown')}>Breakdown</button>
              <button style={SUB_TOGGLE_STYLE.btn(analiseSub === 'oneliner')} onClick={() => setAnaliseSub('oneliner')}>One-Liner</button>
            </div>
            {analiseSub === 'diagnostics' && <ScriptDiagnostics />}
            {analiseSub === 'corrector'   && <ContextualCorrector script={parsedScript} />}
            {analiseSub === 'breakdown'   && <Suspense fallback={<LazyFallback />}><BreakdownSheet scenes={allScenes} episodeId={parsedScript?.episode || 'EP01'} /></Suspense>}
            {analiseSub === 'oneliner'    && <Suspense fallback={<LazyFallback />}><OneLiner scenes={allScenes} /></Suspense>}
          </div>
        )}

        {/* TAB: Métricas (tensão + diálogo + DOOD + avisos) */}
        {activeTab === 'metricas' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={SUB_TOGGLE_STYLE.bar}>
              <button style={SUB_TOGGLE_STYLE.btn(metricasSub === 'tension')} onClick={() => setMetricasSub('tension')}>Tensão</button>
              <button style={SUB_TOGGLE_STYLE.btn(metricasSub === 'dialogue')} onClick={() => setMetricasSub('dialogue')}>Diálogo</button>
              <button style={SUB_TOGGLE_STYLE.btn(metricasSub === 'dood')} onClick={() => setMetricasSub('dood')}>DOOD</button>
              <button style={SUB_TOGGLE_STYLE.btn(metricasSub === 'avisos')} onClick={() => setMetricasSub('avisos')}>Avisos</button>
            </div>
            {metricasSub === 'tension'  && <TensionMap script={parsedScript} />}
            {metricasSub === 'dialogue' && <DialogueAnalysis script={parsedScript} />}
            {metricasSub === 'dood'     && <Suspense fallback={<LazyFallback />}><DayOutOfDays /></Suspense>}
            {metricasSub === 'avisos'   && <Suspense fallback={<LazyFallback />}><ScheduleWarnings /></Suspense>}
          </div>
        )}

        {/* TAB: Comparar */}
        {activeTab === 'compare' && <EpisodeComparator />}
      </motion.div>
    </div>
  )
}
