// Matrix de riscos — impacto × probabilidade
import { AlertTriangle, Shield } from 'lucide-react'
import { Badge } from '../../components/ui/Badge.jsx'
import styles from './RiskBoard.module.css'

const PROB_ORDER  = { alta: 3, media: 2, baixa: 1 }
const IMPACT_ORDER = { crítico: 4, alto: 3, medio: 2, baixo: 1 }
const IMPACT_BADGE = { crítico: 'danger', alto: 'warn', medio: 'info', baixo: 'default' }
const PROB_BADGE   = { alta: 'danger', media: 'warn', baixa: 'default' }

export function RiskBoard({ risks }) {
  const sorted = [...risks].sort((a, b) =>
    (PROB_ORDER[b.probability] * IMPACT_ORDER[b.impact]) -
    (PROB_ORDER[a.probability] * IMPACT_ORDER[a.impact])
  )

  const critical = sorted.filter(r => r.probability === 'alta' || r.impact === 'crítico')
  const medium   = sorted.filter(r => r.probability === 'media' && r.impact !== 'crítico')
  const low      = sorted.filter(r => r.probability === 'baixa' && r.impact !== 'crítico')

  return (
    <div className={styles.wrapper}>
      <div className={styles.groups}>
        {[
          { label: 'Críticos / Alta Probabilidade', risks: critical, variant: 'danger' },
          { label: 'Médios',                        risks: medium,   variant: 'warn' },
          { label: 'Baixa Probabilidade',           risks: low,      variant: 'default' },
        ].filter(g => g.risks.length > 0).map(group => (
          <div key={group.label} className={styles.group}>
            <div className={styles.groupHeader}>
              <AlertTriangle size={13} color={group.variant === 'danger' ? '#F87171' : group.variant === 'warn' ? '#FBBF24' : 'var(--text-muted)'} />
              <span className={styles.groupLabel}>{group.label}</span>
              <span className={styles.groupCount}>{group.risks.length}</span>
            </div>
            {group.risks.map(risk => (
              <div key={risk.id} className={styles.risk}>
                <div className={styles.riskTop}>
                  <span className={styles.riskTitle}>{risk.title}</span>
                  <div className={styles.riskBadges}>
                    <Badge variant={IMPACT_BADGE[risk.impact] || 'default'} size="sm">
                      {risk.impact}
                    </Badge>
                    <Badge variant={PROB_BADGE[risk.probability] || 'default'} size="sm">
                      {risk.probability}
                    </Badge>
                  </div>
                </div>
                <div className={styles.mitigation}>
                  <Shield size={11} color="var(--text-muted)" />
                  <span>{risk.mitigation}</span>
                </div>
                {risk.relatedScenes?.length > 0 && (
                  <div className={styles.relatedScenes}>
                    {risk.relatedScenes.map(s => (
                      <span key={s} className={styles.sceneTag}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
