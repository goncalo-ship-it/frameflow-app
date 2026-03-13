// Store / Pricing — planos FrameFlow
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassTray, PillButton, IconContainer } from '../../components/LiquidGlass.jsx'
import { BackgroundOrbs } from '../../components/shared/BackgroundOrbs.jsx'
import { Check, Crown, Zap, Building2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import styles from './Store.module.css'

// ── Tiers ──────────────────────────────────────────────────────
const TIERS = [
  {
    id: 'free',
    label: 'Gratuito',
    price: '€0',
    unit: '/mês',
    projects: '1 projecto',
    accent: '#10b981',
    icon: <Sparkles size={20} />,
    recommended: false,
    cta: 'Começar grátis',
    features: [
      'Módulos base',
      '1 utilizador',
      'Export PDF',
    ],
  },
  {
    id: 'pro',
    label: 'Profissional',
    price: '€29',
    unit: '/mês',
    projects: '5 simultâneos',
    accent: '#3b82f6',
    icon: <Zap size={20} />,
    recommended: true,
    cta: 'Subscrever Pro',
    features: [
      'Tudo do Gratuito',
      'AI Mirror',
      'Departamentos ilimitados',
      '10 utilizadores',
      'Export FCPXML',
    ],
  },
  {
    id: 'team',
    label: 'Equipa',
    price: '€79',
    unit: '/mês',
    projects: '10 simultâneos',
    accent: '#8b5cf6',
    icon: <Crown size={20} />,
    recommended: false,
    cta: 'Subscrever Equipa',
    features: [
      'Tudo do Profissional',
      'Live Board',
      'Colaboração real-time',
      '50 utilizadores',
      'Folha de Serviço',
      'Integrações',
    ],
  },
  {
    id: 'enterprise',
    label: 'Estúdio',
    price: 'Contactar',
    unit: '/mês',
    projects: 'Ilimitado',
    accent: '#f59e0b',
    icon: <Building2 size={20} />,
    recommended: false,
    cta: 'Falar com vendas',
    features: [
      'Tudo do Equipa',
      'API dedicada',
      'SSO / SAML',
      'Suporte prioritário',
      'Custom branding',
      'SLA 99.9%',
    ],
  },
]

// ── Comparison rows ────────────────────────────────────────────
const COMPARE_ROWS = [
  { feature: 'Projectos',            free: '1',      pro: '5',        team: '10',       enterprise: 'Ilimitado' },
  { feature: 'Utilizadores',         free: '1',      pro: '10',       team: '50',       enterprise: 'Ilimitado' },
  { feature: 'Módulos base',         free: true,     pro: true,       team: true,       enterprise: true },
  { feature: 'Export PDF',           free: true,     pro: true,       team: true,       enterprise: true },
  { feature: 'AI Mirror',            free: false,    pro: true,       team: true,       enterprise: true },
  { feature: 'Departamentos ilimitados', free: false, pro: true,      team: true,       enterprise: true },
  { feature: 'Export FCPXML',        free: false,    pro: true,       team: true,       enterprise: true },
  { feature: 'Live Board',           free: false,    pro: false,      team: true,       enterprise: true },
  { feature: 'Colaboração real-time',free: false,    pro: false,      team: true,       enterprise: true },
  { feature: 'Folha de Serviço',     free: false,    pro: false,      team: true,       enterprise: true },
  { feature: 'Integrações',          free: false,    pro: false,      team: true,       enterprise: true },
  { feature: 'API dedicada',         free: false,    pro: false,      team: false,      enterprise: true },
  { feature: 'SSO / SAML',           free: false,    pro: false,      team: false,      enterprise: true },
  { feature: 'Suporte prioritário',  free: false,    pro: false,      team: false,      enterprise: true },
  { feature: 'Custom branding',      free: false,    pro: false,      team: false,      enterprise: true },
  { feature: 'SLA 99.9%',            free: false,    pro: false,      team: false,      enterprise: true },
]

const TIER_COLORS = { free: '#10b981', pro: '#3b82f6', team: '#8b5cf6', enterprise: '#f59e0b' }

// ── Component ──────────────────────────────────────────────────
export function StoreModule() {
  const [showCompare, setShowCompare] = useState(false)

  return (
    <div className={styles.wrapper}>
      <BackgroundOrbs />

      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>Planos FrameFlow</h1>
          <p className={styles.subtitle}>Escolhe o plano ideal para a tua produção</p>
        </header>

        {/* Grid */}
        <div className={styles.grid}>
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', damping: 24, stiffness: 260 }}
              className={tier.recommended ? styles.cardRecommended : styles.card}
            >
              <GlassTray
                accentColor={tier.accent}
                borderRadius={24}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  border: tier.recommended
                    ? `1px solid ${tier.accent}60`
                    : undefined,
                }}
              >
                {/* Recommended badge */}
                {tier.recommended && (
                  <div className={styles.recBadge}>
                    <Zap size={10} /> Recomendado
                  </div>
                )}

                {/* Tier label */}
                <div className={styles.tierLabel} style={{ color: tier.accent }}>
                  {tier.label}
                </div>

                {/* Price */}
                <div className={styles.priceRow}>
                  <span className={styles.price}>{tier.price}</span>
                  {tier.unit && <span className={styles.priceUnit}>{tier.unit}</span>}
                </div>

                {/* Projects badge */}
                <div
                  className={styles.projectsBadge}
                  style={{
                    background: `${tier.accent}15`,
                    color: tier.accent,
                    border: `0.5px solid ${tier.accent}30`,
                  }}
                >
                  {tier.projects}
                </div>

                <div className={styles.divider} />

                {/* Features */}
                <ul className={styles.featureList}>
                  {tier.features.map(f => (
                    <li key={f} className={styles.featureItem}>
                      <Check size={14} className={styles.checkIcon} style={{ color: tier.accent }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className={styles.ctaWrap}>
                  <PillButton
                    variant={tier.recommended ? 'accent' : 'glass'}
                    accentColor={tier.recommended ? tier.accent : undefined}
                    size="md"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {tier.cta}
                  </PillButton>
                </div>
              </GlassTray>
            </motion.div>
          ))}
        </div>

        {/* Compare toggle */}
        <div className={styles.compareToggle}>
          <button
            className={styles.toggleBtn}
            onClick={() => setShowCompare(v => !v)}
          >
            Ver todas as funcionalidades
            {showCompare ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Comparison table */}
        <AnimatePresence>
          {showCompare && (
            <motion.div
              className={styles.compareSection}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <GlassTray accentColor="#6366f1" borderRadius={20} style={{ marginTop: 8, padding: 0, overflow: 'hidden' }}>
                <table className={styles.compareTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Funcionalidade</th>
                      <th style={{ textAlign: 'center', color: TIER_COLORS.free }}>Gratuito</th>
                      <th style={{ textAlign: 'center', color: TIER_COLORS.pro }}>Pro</th>
                      <th style={{ textAlign: 'center', color: TIER_COLORS.team }}>Equipa</th>
                      <th style={{ textAlign: 'center', color: TIER_COLORS.enterprise }}>Estúdio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_ROWS.map(row => (
                      <tr key={row.feature}>
                        <td>{row.feature}</td>
                        {['free', 'pro', 'team', 'enterprise'].map(tid => {
                          const val = row[tid]
                          if (typeof val === 'boolean') {
                            return (
                              <td key={tid} className={styles.checkCell}>
                                {val
                                  ? <Check size={14} style={{ color: TIER_COLORS[tid] }} />
                                  : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                                }
                              </td>
                            )
                          }
                          return <td key={tid} style={{ textAlign: 'center', fontWeight: 700, color: TIER_COLORS[tid] }}>{val}</td>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassTray>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default StoreModule
