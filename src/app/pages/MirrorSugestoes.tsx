/**
 * MIRROR — SUGESTÕES
 * Sugestões cruzadas entre módulos geradas pela IA
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, CheckCircle, X, Inbox, ArrowRight } from 'lucide-react';
import {
  LiquidPage, LiquidCard, LiquidSection, LiquidBadge, LiquidStatCard,
} from '../components/liquid-system';
import { nestedCard, iconGradient, springConfigs } from '../utils/liquidGlassStyles';
// @ts-expect-error JSX module
import { useStore } from '../../core/store';
// @ts-expect-error JSX module
import { useShallow } from 'zustand/react/shallow';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type SuggestionStatus = 'pending' | 'approved' | 'dismissed';
type FilterTab        = 'todas' | 'pendentes' | 'aprovadas' | 'descartadas';

interface StoreSuggestion {
  id: string;
  title: string;
  description?: string;
  source?: string;
  target?: string;
  status: SuggestionStatus;
}

/* ─────────────────────────────────────────────────────────────
   MOCK FALLBACK
───────────────────────────────────────────────────────────── */

const MOCK_SUGGESTIONS: StoreSuggestion[] = [
  {
    id: 'sg1', status: 'pending',
    title: 'Conflito de actor no Dia 22',
    description: 'O actor João Monteiro (Inspector Azevedo) está atribuído a 3 cenas no mesmo dia de rodagem — SC031, SC032 e SC038. Recomenda-se redistribuir SC038 para o Dia 23.',
    source: 'Equipa', target: 'Produção',
  },
  {
    id: 'sg2', status: 'pending',
    title: 'Orçamento VFX sub-estimado',
    description: '9 shots VFX confirmados vs. 5 orçamentados inicialmente. A categoria VFX pode ultrapassar o planeado em €12.000–€18.000. Considerar abrir linha de contingência.',
    source: 'Orçamento', target: 'VFX',
  },
  {
    id: 'sg3', status: 'approved',
    title: 'Consolidar locais Oeiras',
    description: 'Cenas SC007, SC031 e SC033 são todas exteriores em Oeiras. Agrupar num único dia de rodagem pode poupar 1 dia de deslocação de equipa.',
    source: 'Locais', target: 'Produção',
  },
  {
    id: 'sg4', status: 'pending',
    title: 'ADR urgente — 2 cenas com ruído HVAC',
    description: 'As cenas SC021 e SC038 têm ruído de HVAC detectado na mistura. ADR recomendado para os actores envolvidos antes da entrega de pós-produção.',
    source: 'Som', target: 'Produção',
  },
  {
    id: 'sg5', status: 'dismissed',
    title: 'Adicionar personagem ao guião EP05',
    description: 'O arco de "Sra. Beatriz" ficou incompleto — sugestão de adicionar 1 cena de encerramento no EP05 para fechar o arco narrativo.',
    source: 'Universo', target: 'Guião',
  },
  {
    id: 'sg6', status: 'pending',
    title: 'Revisão de cachê — EP03 dia extra',
    description: 'O Dia 22 passou de 10h para 14h devido à perda climática. Os membros com cachê diário fixo podem ter direito a suplemento contratual. Verificar contratos.',
    source: 'Equipa', target: 'Orçamento',
  },
];

const STATUS_META: Record<SuggestionStatus, { color: string; label: string }> = {
  pending:   { color: '#f59e0b', label: 'Pendente'  },
  approved:  { color: '#10b981', label: 'Aprovado'  },
  dismissed: { color: 'rgba(255,255,255,0.3)', label: 'Descartado' },
};

const MODULE_COLORS: Record<string, string> = {
  Equipa:     '#8B6FBF',
  Orçamento:  '#f59e0b',
  Locais:     '#10b981',
  Produção:   '#5B8DEF',
  Som:        '#f97316',
  Universo:   '#ec4899',
  Guião:      '#3b82f6',
  VFX:        '#a855f7',
};

const ACCENT = '#ec4899';

/* ─────────────────────────────────────────────────────────────
   MODULE BADGE
───────────────────────────────────────────────────────────── */

function ModuleBadge({ label }: { label: string }) {
  const color = MODULE_COLORS[label] ?? '#ffffff';
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
      background: `${color}20`, color, border: `0.5px solid ${color}40`,
    }}>{label}</span>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUGGESTION CARD
───────────────────────────────────────────────────────────── */

function SuggestionCard({
  suggestion,
  onApprove,
  onDismiss,
}: {
  suggestion: StoreSuggestion;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const meta = STATUS_META[suggestion.status];
  const isPending = suggestion.status === 'pending';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={springConfigs.gentle}
      style={{ ...nestedCard(), padding: '14px 16px', marginBottom: 10 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ ...iconGradient(meta.color, 'sm'), marginTop: 2, flexShrink: 0 }}>
          <Lightbulb size={13} style={{ color: meta.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{suggestion.title}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: `${meta.color}20`, color: meta.color, border: `0.5px solid ${meta.color}40`,
            }}>{meta.label}</span>
          </div>

          {/* Source → Target */}
          {(suggestion.source || suggestion.target) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              {suggestion.source && <ModuleBadge label={suggestion.source} />}
              {suggestion.source && suggestion.target && <ArrowRight size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />}
              {suggestion.target && <ModuleBadge label={suggestion.target} />}
            </div>
          )}

          {suggestion.description && (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              {suggestion.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <motion.button
            onClick={() => onDismiss(suggestion.id)}
            whileTap={{ scale: 0.96 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 12,
            }}
          >
            <X size={12} /> Descartar
          </motion.button>
          <motion.button
            onClick={() => onApprove(suggestion.id)}
            whileTap={{ scale: 0.96 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: 12, fontWeight: 600,
              outline: '0.5px solid rgba(16,185,129,0.4)',
            }}
          >
            <CheckCircle size={12} /> Aprovar
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────── */

export function MirrorSugestoesModule() {
  const storeSuggestions = useStore(useShallow((s: { suggestions?: StoreSuggestion[] }) => s.suggestions ?? [])) as StoreSuggestion[];

  // Merge store suggestions with mock (use store if available, else mock)
  const [localSuggestions, setLocalSuggestions] = useState<StoreSuggestion[]>(
    storeSuggestions.length > 0 ? storeSuggestions : MOCK_SUGGESTIONS
  );

  const [filter, setFilter] = useState<FilterTab>('todas');

  const storeApprove  = useStore((s: { approveSuggestion?: (id: string) => void }) => s.approveSuggestion);
  const storeDismiss  = useStore((s: { dismissSuggestion?: (id: string) => void }) => s.dismissSuggestion);

  function handleApprove(id: string) {
    storeApprove?.(id);
    setLocalSuggestions(prev =>
      prev.map(s => s.id === id ? { ...s, status: 'approved' as SuggestionStatus } : s)
    );
  }

  function handleDismiss(id: string) {
    storeDismiss?.(id);
    setLocalSuggestions(prev =>
      prev.map(s => s.id === id ? { ...s, status: 'dismissed' as SuggestionStatus } : s)
    );
  }

  const filtered = localSuggestions.filter(s => {
    if (filter === 'todas')      return true;
    if (filter === 'pendentes')  return s.status === 'pending';
    if (filter === 'aprovadas')  return s.status === 'approved';
    if (filter === 'descartadas')return s.status === 'dismissed';
    return true;
  });

  const pending   = localSuggestions.filter(s => s.status === 'pending').length;
  const approved  = localSuggestions.filter(s => s.status === 'approved').length;
  const dismissed = localSuggestions.filter(s => s.status === 'dismissed').length;

  const FILTERS: { key: FilterTab; label: string }[] = [
    { key: 'todas',       label: 'Todas'       },
    { key: 'pendentes',   label: 'Pendentes'   },
    { key: 'aprovadas',   label: 'Aprovadas'   },
    { key: 'descartadas', label: 'Descartadas' },
  ];

  return (
    <LiquidPage
      title="Sugestões"
      description="Recomendações cruzadas da IA"
      section="mirror"
    >
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <LiquidStatCard label="Total"       value={localSuggestions.length} accent={ACCENT}    />
        <LiquidStatCard label="Pendentes"   value={pending}                 accent="#f59e0b"   />
        <LiquidStatCard label="Aprovadas"   value={approved}                accent="#10b981"   />
        <LiquidStatCard label="Descartadas" value={dismissed}               accent="rgba(255,255,255,0.3)" />
      </div>

      <LiquidCard>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <motion.button
                key={f.key}
                onClick={() => setFilter(f.key)}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12,
                  background: active ? `${ACCENT}20` : 'rgba(255,255,255,0.05)',
                  color: active ? '#f9a8d4' : 'rgba(255,255,255,0.5)',
                  fontWeight: active ? 600 : 400,
                  outline: active ? `0.5px solid ${ACCENT}50` : '0.5px solid transparent',
                }}
              >{f.label}</motion.button>
            );
          })}
        </div>

        {/* Suggestion list */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.3)' }}
            >
              <Inbox size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14 }}>Sem sugestões nesta categoria</p>
            </motion.div>
          ) : (
            filtered.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onApprove={handleApprove}
                onDismiss={handleDismiss}
              />
            ))
          )}
        </AnimatePresence>
      </LiquidCard>
    </LiquidPage>
  );
}
