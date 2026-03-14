/**
 * ══════════════════════════════════════════════════════════════════════════════
 * LIQUIDPAGE — Componente Base de Página  ·  Golden Standard
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Camadas:
 *   Layer 0  Background gradient/image     ← App.jsx (nunca tocas)
 *   Layer 1  Sidebar + Topbar              ← Layout (nunca tocas)
 *   Layer 2  LiquidPage (este ficheiro)    ← padding, header, tabs, acento
 *   Layer 3  LiquidCard(s) filhos          ← o teu miolo
 *
 * Props:
 *   title          Título principal da página (h1)
 *   description    Subtítulo / contagem / meta info
 *   section        Qual das 7 secções: 'hoje' | 'planeamento' | 'filme' |
 *                  'equipa' | 'departamentos' | 'pos' | 'mirror'
 *                  → define o accent color do header
 *   tabs           Array de LiquidTab para sub-navegação
 *   activeTab      Tab activo (controlled)
 *   onTabChange    Callback tab change
 *   headerAction   Botão(ões) de acção no canto direito do header
 *   backAction     Label + onClick para botão "← Voltar"
 *   noPadding      Remove padding exterior (fullbleed)
 *   children       Conteúdo da página (LiquidCards)
 *
 * Animações:
 *   - Header: fade + slide-up 8px, 500ms cubic-bezier(0.25, 0.1, 0.25, 1)
 *   - Acento: scale-in + fade, delay 80ms
 *   - Tabs: fade + slide-up, delay 120ms
 *   - Children: stagger 50ms por filho
 *
 * Regras absolutas:
 *   - ZERO hover effects
 *   - Borders: 0.5px only
 *   - Blur: 8 | 12 | 20 | 32px only
 *   - Border-radius: 12 | 16 | 20 | 28 | 9999px only
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { ReactNode, Children } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LiquidTabs } from './LiquidTabs';
import { LiquidSkeleton } from './LiquidSkeleton';
import type { LiquidTab } from './LiquidTabs';

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION ACCENT SYSTEM
   Cada secção tem cor e label próprios (spec §3.3)
───────────────────────────────────────────────────────────────────────────── */

export type PageSection =
  | 'hoje'
  | 'planeamento'
  | 'filme'
  | 'equipa'
  | 'departamentos'
  | 'pos'
  | 'mirror'
  | 'financas'
  | 'definicoes';

const SECTION_ACCENT: Record<PageSection, { color: string; label: string }> = {
  hoje:          { color: '#8b5cf6', label: 'Hoje' },
  planeamento:   { color: '#3b82f6', label: 'Planeamento' },
  filme:         { color: '#f59e0b', label: 'Filme' },
  equipa:        { color: '#06b6d4', label: 'Equipa' },
  departamentos: { color: '#10b981', label: 'Departamentos' },
  pos:           { color: '#a855f7', label: 'Pós-Produção' },
  mirror:        { color: '#ec4899', label: 'Mirror' },
  financas:      { color: '#f97316', label: 'Finanças' },
  definicoes:    { color: '#6b7280', label: 'Definições' },
};

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

export interface LiquidPageBackAction {
  label: string;
  onClick: () => void;
}

export interface LiquidPageBreadcrumb {
  label: string;
  onClick?: () => void;
}

export interface LiquidPageProps {
  /** Título principal h1 */
  title?: string;
  /** Subtítulo / meta / contagem */
  description?: string;
  /** Secção da navegação → accent color */
  section?: PageSection;
  /** Tabs de sub-navegação (opcional) */
  tabs?: LiquidTab[];
  /** Tab activo (controlled) */
  activeTab?: string;
  /** Callback quando tab muda */
  onTabChange?: (id: string) => void;
  /** Acção(ões) header direita */
  headerAction?: ReactNode;
  /** Botão voltar */
  backAction?: LiquidPageBackAction;
  /** Breadcrumbs de navegação */
  breadcrumbs?: LiquidPageBreadcrumb[];
  /** Mostra shimmer skeleton enquanto carrega */
  loading?: boolean;
  /** Remove padding exterior */
  noPadding?: boolean;
  children: ReactNode;
  className?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────────────────────────────────────────── */

const headerVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

const accentVariants = {
  hidden:  { opacity: 0, scaleX: 0 },
  visible: { opacity: 1, scaleX: 1,
    transition: { duration: 0.4, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

const tabsVariants = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0,
    transition: { duration: 0.4, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

const childVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: {
      duration: 0.5,
      delay: 0.16 + i * 0.05,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
};

/* ─────────────────────────────────────────────────────────────────────────────
   BACK BUTTON
───────────────────────────────────────────────────────────────────────────── */

function BackButton({ label, onClick }: LiquidPageBackAction) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClick}
      style={{
        display:         'inline-flex',
        alignItems:      'center',
        gap:             6,
        padding:         '6px 12px 6px 8px',
        borderRadius:    12,
        border:          '0.5px solid rgba(255,255,255,0.12)',
        background:      'rgba(255,255,255,0.06)',
        backdropFilter:  'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color:           'rgba(255,255,255,0.6)',
        fontSize:        12,
        fontWeight:      600,
        cursor:          'pointer',
        marginBottom:    8,
      }}
    >
      <ChevronLeft size={14} />
      {label}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

function LoadingSkeleton({ accent }: { accent: { color: string } | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
      {accent && <LiquidSkeleton height={10} width="25%" radius={5} />}
      <LiquidSkeleton height={28} width="55%" radius={8} />
      <LiquidSkeleton height={1} radius={0} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <LiquidSkeleton height={80} radius={16} />
        <LiquidSkeleton height={80} radius={16} />
        <LiquidSkeleton height={80} radius={16} />
      </div>
      <LiquidSkeleton height={160} radius={16} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <LiquidSkeleton height={14} width="90%" radius={6} />
        <LiquidSkeleton height={14} width="75%" radius={6} />
        <LiquidSkeleton height={14} width="60%" radius={6} />
      </div>
    </div>
  );
}

export function LiquidPage({
  title,
  description,
  section,
  tabs,
  activeTab,
  onTabChange,
  headerAction,
  backAction,
  breadcrumbs,
  loading = false,
  noPadding = false,
  children,
  className = '',
}: LiquidPageProps) {
  const accent = section ? SECTION_ACCENT[section] : null;
  const childArray = Children.toArray(children);

  return (
    <div
      className={`${noPadding ? '' : 'p-4 md:p-6'} space-y-4 ${className}`}
      style={{
        maxWidth:  1400,
        width:     '100%',
        margin:    '0 auto',
        minHeight: '100%',
        boxSizing: 'border-box',
      }}
    >

      {/* ── BACK BUTTON ── */}
      {backAction && (
        <BackButton label={backAction.label} onClick={backAction.onClick} />
      )}

      {/* ── BREADCRUMBS ── */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: -8 }}
        >
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {idx > 0 && <ChevronRight size={11} style={{ color: 'rgba(255,255,255,0.2)' }} />}
              <span
                onClick={crumb.onClick}
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.01em',
                  color: idx === breadcrumbs.length - 1
                    ? 'rgba(255,255,255,0.45)'
                    : 'rgba(255,255,255,0.25)',
                  cursor: crumb.onClick ? 'pointer' : 'default',
                }}
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </motion.div>
      )}

      {/* ── PAGE HEADER ── */}
      {(title || headerAction) && (
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Breadcrumb accent (só quando section definido) */}
          {accent && (
            <motion.div
              variants={accentVariants}
              initial="hidden"
              animate="visible"
              style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          6,
                marginBottom: 8,
                originX:      0,
              }}
            >
              {/* Dot de acento */}
              <span style={{
                display:     'block',
                width:       6,
                height:      6,
                borderRadius: 9999,
                background:  accent.color,
                boxShadow:   `0 0 8px ${accent.color}`,
              }} />
              {/* Label secção */}
              <span style={{
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color:         accent.color,
                opacity:       0.85,
              }}>
                {accent.label}
              </span>
            </motion.div>
          )}

          {/* Linha título + acção */}
          <div style={{
            display:        'flex',
            alignItems:     'flex-start',
            justifyContent: 'space-between',
            gap:            16,
          }}>
            {/* Título + descrição */}
            {title && (
              <div>
                <h1 style={{
                  fontSize:      28,
                  fontWeight:    700,
                  letterSpacing: '-0.02em',
                  color:         'rgba(255,255,255,0.95)',
                  margin:        0,
                  lineHeight:    1.2,
                }}>
                  {title}
                </h1>
                {description && (
                  <p style={{
                    fontSize:  14,
                    fontWeight: 400,
                    color:     'var(--fb-text-secondary)',
                    margin:    '4px 0 0',
                    lineHeight: 1.5,
                  }}>
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Header action */}
            {headerAction && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {headerAction}
              </div>
            )}
          </div>

          {/* Accent line sob o título */}
          {accent && title && (
            <motion.div
              variants={accentVariants}
              initial="hidden"
              animate="visible"
              style={{
                height:       1,
                marginTop:    12,
                background:   `linear-gradient(90deg, ${accent.color}60 0%, ${accent.color}20 50%, transparent 100%)`,
                borderRadius: 1,
                originX:      0,
              }}
            />
          )}
        </motion.div>
      )}

      {/* ── TABS BAR ── */}
      {tabs && tabs.length > 0 && (
        <motion.div
          variants={tabsVariants}
          initial="hidden"
          animate="visible"
        >
          <LiquidTabs
            tabs={tabs}
            active={activeTab ?? tabs[0]?.id ?? ''}
            onChange={onTabChange ?? (() => {})}
          />
        </motion.div>
      )}

      {/* ── CONTENT AREA — shimmer loading ou filhos com stagger ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LoadingSkeleton accent={accent} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
            style={{ flex: 1 }}
          >
            {childArray.map((child, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={childVariants}
                initial="hidden"
                animate="visible"
              >
                {child}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

LiquidPage.displayName = 'LiquidPage';
