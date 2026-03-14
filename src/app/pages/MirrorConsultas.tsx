/**
 * MIRROR — CONSULTAS
 * Perguntas predefinidas por categoria com respostas mock de IA
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, MapPin, ClipboardCheck, TrendingUp, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import {
  LiquidPage, LiquidCard, LiquidSection, LiquidBadge,
} from '../components/liquid-system';
import { nestedCard, iconGradient, springConfigs } from '../utils/liquidGlassStyles';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

interface QuestionCard {
  id: string;
  question: string;
  mockAnswer: string;
}

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  questions: QuestionCard[];
}

/* ─────────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────────── */

const CATEGORIES: Category[] = [
  {
    id: 'personagens', label: 'Personagens', icon: Users, color: '#a855f7',
    questions: [
      {
        id: 'q1', question: 'Quais personagens aparecem em mais de 3 episódios?',
        mockAnswer: 'Com base nos guiões carregados, as personagens com presença em mais de 3 episódios são: **Marta Ferreira** (EP01–EP05), **Inspector Azevedo** (EP01–EP04) e **Ana Rita** (EP02–EP06). Marta é a personagem com maior arco — presente em 47 das 62 cenas totais.',
      },
      {
        id: 'q2', question: 'Há conflitos de continuidade entre personagens?',
        mockAnswer: 'Detectei uma potencial inconsistência: na SC021 (EP02) Ana Rita usa o casaco preto que, segundo as notas de continuidade da SC015 (EP01), foi destruído durante o incêndio. Recomendo verificar com a equipa de guarda-roupa.',
      },
    ],
  },
  {
    id: 'locais', label: 'Locais', icon: MapPin, color: '#3b82f6',
    questions: [
      {
        id: 'q3', question: 'Que locais têm mais cenas atribuídas?',
        mockAnswer: 'Os locais com maior número de cenas são: **Quinta de Oeiras** (14 cenas), **Apartamento Marta — Lisboa** (11 cenas) e **Esquadra Polícia Cascais** (8 cenas). A Quinta de Oeiras representa 22% do total de rodagem.',
      },
      {
        id: 'q4', question: 'Há locais por confirmar com cenas já atribuídas?',
        mockAnswer: 'Sim — o local "Armazém Portuário" (SC044 EP04 e SC051 EP05) ainda aparece como "Pendente" na base de dados. São 2 dias de rodagem em risco. Recomendo confirmar até final de Março.',
      },
    ],
  },
  {
    id: 'continuidade', label: 'Continuidade', icon: ClipboardCheck, color: '#10b981',
    questions: [
      {
        id: 'q5', question: 'Quais as cenas com notas de continuidade em aberto?',
        mockAnswer: 'Existem 7 cenas com notas de continuidade marcadas como "incompletas": SC003, SC012, SC021, SC031, SC038, SC044, SC055. Destas, SC003 e SC021 têm rodagem prevista na próxima semana — devem ser priorizadas.',
      },
    ],
  },
  {
    id: 'orcamento', label: 'Orçamento', icon: TrendingUp, color: '#f59e0b',
    questions: [
      {
        id: 'q6', question: 'Qual é o desvio actual do orçamento?',
        mockAnswer: 'O orçamento total aprovado é €340.000. Até à data, o gasto acumulado é €127.450 (37,5%). O desvio actual é de **+€8.200** face ao previsto para esta fase, principalmente devido ao aluguer de equipamento de câmara adicional (Sony Venice 2 — +€4.500) e custo extra de catering EP02 (+€1.800).',
      },
      {
        id: 'q7', question: 'Que categoria do orçamento está mais em risco?',
        mockAnswer: 'A categoria **Pós-Produção** apresenta maior risco. O orçamento inicial de €45.000 pode ser insuficiente face aos shots VFX adicionados (actualmente 9 shots, contra 5 previstos). Estimativa VFX actual: €52.000–€58.000. Recomendo abrir uma linha de contingência.',
      },
    ],
  },
  {
    id: 'schedule', label: 'Schedule', icon: Calendar, color: '#f97316',
    questions: [
      {
        id: 'q8', question: 'Quantos dias de rodagem faltam?',
        mockAnswer: 'Dos 28 dias de rodagem planeados, **19 foram completados** e **9 faltam**. A rodagem está 2 dias atrasada face ao plano original (EP03 perdeu um dia por chuva em Oeiras). O plano de recuperação prevê 2 dias de rodagem estendida em Junho.',
      },
      {
        id: 'q9', question: 'Qual o próximo dia de rodagem e o que cobre?',
        mockAnswer: 'O próximo dia de rodagem é **17 de Março (terça-feira)** — dia 20 de 28. Local: Quinta de Oeiras (exterior). Cobre: SC031, SC032, SC033 do EP03. Call time: 06:30. Previsto golden hour 18:42 para SC033 (plano final do episódio). Equipa de 34 pessoas.',
      },
    ],
  },
];

const ACCENT = '#ec4899';

/* ─────────────────────────────────────────────────────────────
   TYPING INDICATOR
───────────────────────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 0' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANSWER CARD
───────────────────────────────────────────────────────────── */

function AnswerCard({ text }: { text: string }) {
  const [typing, setTyping] = useState(true);

  // Simulate typing for 1.2s
  useState(() => {
    const t = setTimeout(() => setTyping(false), 1200);
    return () => clearTimeout(t);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={springConfigs.gentle}
      style={{
        ...nestedCard('#ec4899'),
        padding: 16, marginTop: 10,
        borderLeft: `2px solid ${ACCENT}60`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div style={{ ...iconGradient(ACCENT, 'sm') }}>
          <Sparkles size={12} style={{ color: ACCENT }} />
        </div>
        <span style={{ color: ACCENT, fontSize: 12, fontWeight: 600 }}>Espelho do Realizador</span>
      </div>
      {typing ? (
        <TypingIndicator />
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.7, margin: 0 }}
          dangerouslySetInnerHTML={{
            __html: text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff">$1</strong>'),
          }}
        />
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   QUESTION CARD
───────────────────────────────────────────────────────────── */

function QuestionItem({ q, categoryColor }: { q: QuestionCard; categoryColor: string }) {
  const [open, setOpen] = useState(false);
  const [key, setKey]   = useState(0);

  function handleClick() {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
      setKey(k => k + 1);
    }
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <motion.button
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          cursor: 'pointer', padding: 0,
        }}
      >
        <div style={{
          ...nestedCard(),
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          outline: open ? `0.5px solid ${categoryColor}50` : '0.5px solid transparent',
        }}>
          <ChevronRight
            size={14}
            style={{
              color: categoryColor, flexShrink: 0,
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.5 }}>{q.question}</span>
        </div>
      </motion.button>
      <AnimatePresence mode="wait">
        {open && <AnswerCard key={key} text={q.mockAnswer} />}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────── */

export function MirrorConsultasModule() {
  const [activeCategory, setActiveCategory] = useState<string>('personagens');

  const current = CATEGORIES.find(c => c.id === activeCategory) ?? CATEGORIES[0];

  return (
    <LiquidPage
      title="Consultas"
      description="Perguntas frequentes ao Espelho do Realizador"
      section="mirror"
    >
      {/* Category tabs */}
      <LiquidCard style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => {
            const Icon   = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                whileTap={{ scale: 0.96 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: active ? `${cat.color}20` : 'rgba(255,255,255,0.05)',
                  color: active ? cat.color : 'rgba(255,255,255,0.5)',
                  fontWeight: active ? 600 : 400, fontSize: 13,
                  outline: active ? `0.5px solid ${cat.color}50` : '0.5px solid transparent',
                }}
              >
                <Icon size={14} />
                {cat.label}
              </motion.button>
            );
          })}
        </div>
      </LiquidCard>

      {/* Questions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={springConfigs.gentle}
        >
          <LiquidCard>
            <LiquidSection title={current.label} icon={current.icon}>
              {current.questions.map(q => (
                <QuestionItem key={q.id} q={q} categoryColor={current.color} />
              ))}
            </LiquidSection>
          </LiquidCard>
        </motion.div>
      </AnimatePresence>
    </LiquidPage>
  );
}
