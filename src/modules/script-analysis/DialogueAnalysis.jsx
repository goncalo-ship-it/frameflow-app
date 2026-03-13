// Análise de diálogo por personagem
// Palavras, comprimento médio, proporção perguntas/afirmações, interrupções

import { useMemo } from 'react'
import { analyzeDialogue } from '../../utils/script-parser.js'
import styles from './DialogueAnalysis.module.css'

const BAR_COLORS = [
  '#7B4FBF', '#2E6FA0', '#2EA080', '#A02E6F',
  '#BF6A2E', '#4F7F3F', '#2E5FA0', '#A07B2E',
]

export function DialogueAnalysis({ script }) {
  const stats = useMemo(() => {
    if (!script?.scenes?.length) return []
    return analyzeDialogue(script.scenes)
  }, [script])

  if (!script?.scenes?.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
        Carrega um guião para ver a análise de diálogo
      </div>
    )
  }

  const maxWords = Math.max(...stats.map(s => s.totalWords), 1)

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>Análise de Diálogo</h3>
        <p className={styles.subtitle}>Distribuição de voz por personagem</p>
      </div>

      {/* Gráfico de barras horizontal */}
      <div className={styles.chartSection}>
        <p className={styles.sectionLabel}>Palavras por personagem</p>
        {stats.map((s, i) => (
          <div key={s.name} className={styles.barRow}>
            <span className={styles.charName}>{s.name}</span>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{
                  width: `${(s.totalWords / maxWords) * 100}%`,
                  background: BAR_COLORS[i % BAR_COLORS.length],
                }}
              />
            </div>
            <span className={styles.barValue}>{s.totalWords.toLocaleString('pt-PT')}</span>
          </div>
        ))}
      </div>

      {/* Tabela detalhada */}
      <div className={styles.tableSection}>
        <p className={styles.sectionLabel}>Detalhes por personagem</p>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Personagem</span>
            <span>Cenas</span>
            <span>Linhas</span>
            <span>Média/linha</span>
            <span>Perguntas</span>
            <span>Interrupções</span>
          </div>
          {stats.map((s, i) => (
            <div key={s.name} className={styles.tableRow}>
              <span style={{ fontWeight: 600, color: BAR_COLORS[i % BAR_COLORS.length] }}>{s.name}</span>
              <span>{s.scenes?.length || 0}</span>
              <span>{s.totalLines}</span>
              <span>{s.avgLineLength} palavras</span>
              <span>{s.questions} ({s.totalLines > 0 ? Math.round((s.questions / s.totalLines) * 100) : 0}%)</span>
              <span>{s.interruptions}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas automáticos */}
      <div className={styles.alerts}>
        {generateDialogueAlerts(stats).map((alert, i) => (
          <div key={i} className={styles.alertItem}>
            <span>{alert.icon}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{alert.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function generateDialogueAlerts(stats) {
  const alerts = []
  if (!stats.length) return alerts

  const total = stats.reduce((s, c) => s + c.totalWords, 0)
  if (!total) return alerts

  // Desequilíbrio de voz
  stats.forEach(s => {
    const pct = (s.totalWords / total) * 100
    if (pct > 60) {
      alerts.push({ icon: '⚠️', message: `${s.name} tem ${pct.toFixed(0)}% das palavras — possível desequilíbrio de voz` })
    }
  })

  // Personagem com poucas perguntas
  stats.forEach(s => {
    if (s.totalLines > 10) {
      const qPct = (s.questions / s.totalLines) * 100
      if (qPct < 5) {
        alerts.push({ icon: '💡', message: `${s.name} faz poucas perguntas (${qPct.toFixed(0)}%) — considera diversificar o tom` })
      }
    }
  })

  // Personagem com muitas interrupções
  stats.forEach(s => {
    if (s.interruptions > 5) {
      alerts.push({ icon: '✂️', message: `${s.name} tem ${s.interruptions} interrupções — padrão intencional?` })
    }
  })

  return alerts
}
