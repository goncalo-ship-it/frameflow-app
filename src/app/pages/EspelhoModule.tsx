/**
 * ESPELHO DO REALIZADOR MODULE
 * Assistente de IA para decisões criativas e análise de produção
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lightbulb, Database, Cpu, Key, Film, Users, Calendar,
  Package, TrendingUp, AlertTriangle, ChevronRight,
  Sparkles, Send, CheckCircle, X, ArrowRight,
} from 'lucide-react';
import {
  LiquidPage, LiquidCard, LiquidButton, LiquidSection,
  LiquidStatCard, LiquidBadge,
} from '../components/liquid-system';
import { useStore } from '../../core/store';
import { glassCard, lensingOverlay, nestedCard, glassDivider, glassInput, springConfigs } from '../utils/liquidGlassStyles';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

interface Suggestion {
  id: string;
  title: string;
  description?: string;
  source?: string;
  target?: string;
  status: 'pending' | 'approved' | 'dismissed';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/* ─────────────────────────────────────────────────────────────
   QUICK ACTIONS
───────────────────────────────────────────────────────────── */

const QUICK_ACTIONS = [
  { id: 'schedule',  label: 'Analisar schedule',    icon: Calendar,       prompt: 'Analisa o schedule de produção actual e identifica potenciais problemas.' },
  { id: 'budget',    label: 'Estado do orçamento',  icon: TrendingUp,     prompt: 'Qual é o estado actual do orçamento? Há desvios preocupantes?' },
  { id: 'risks',     label: 'Riscos de produção',   icon: AlertTriangle,  prompt: 'Quais são os principais riscos de produção que devo conhecer agora?' },
  { id: 'next-day',  label: 'Próximo dia',           icon: ChevronRight,   prompt: 'Resume o que preciso de saber para o próximo dia de rodagem.' },
];

/* ─────────────────────────────────────────────────────────────
   CONTEXT CHIP
───────────────────────────────────────────────────────────── */

function ContextChip({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: number | string;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.06)',
        border: '0.5px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Icon size={12} style={{ color: 'rgba(255,255,255,0.5)' }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */

export function EspelhoModule() {
  const {
    apiKey,
    universe,
    parsedScripts,
    shootingDays,
    team,
    budgets,
    departmentItems,
    suggestions,
  } = useStore() as {
    apiKey?: string;
    universe?: Record<string, unknown>;
    parsedScripts?: Record<string, { scenes?: unknown[] }>;
    shootingDays?: Array<{ id: string; date: string; label: string }>;
    team?: Array<{ id: string; name: string; role?: string; group?: string }>;
    budgets?: unknown[];
    departmentItems?: unknown[];
    suggestions?: Suggestion[];
  };

  const [message, setMessage]     = useState('');
  const [chat, setChat]           = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const hasApiKey          = Boolean(apiKey);
  const pendingSuggestions = (suggestions || []).filter(s => s.status === 'pending');

  const epCount   = Object.keys(parsedScripts || {}).length;
  const teamCount = team?.length ?? 0;
  const daysCount = shootingDays?.length ?? 0;
  const deptCount = (departmentItems as unknown[])?.length ?? 0;

  const contextComplete = Boolean(parsedScripts && team?.length);

  /* Scroll to bottom on new message */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  function sendMessage(content: string) {
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };
    setChat(prev => [...prev, userMsg]);
    setMessage('');
    setIsLoading(true);

    /* Shell: placeholder response, no real API call */
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'A processar...',
        timestamp: new Date().toISOString(),
      };
      setChat(prev => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 800);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(message);
    }
  }

  /* ── RENDER ─────────────────────────────────────────────── */
  return (
    <LiquidPage
      title="Espelho do Realizador"
      subtitle="Assistente de IA para decisões criativas e análise de produção"
    >
      {/* ── STAT CARDS ───────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <LiquidStatCard
          label="Sugestões Pendentes"
          value={pendingSuggestions.length}
          icon={<Lightbulb size={16} />}
          variant="amber"
          pulse={pendingSuggestions.length > 0}
          animationDelay={0}
        />
        <LiquidStatCard
          label="Contexto"
          value={contextComplete ? 'Completo' : 'Parcial'}
          icon={<Database size={16} />}
          variant="blue"
          animationDelay={80}
        />
        <LiquidStatCard
          label="AI Model"
          value="Sonnet 4.6"
          icon={<Cpu size={16} />}
          variant="purple"
          animationDelay={160}
        />
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!hasApiKey ? (
          /* NO API KEY */
          <motion.div
            key="no-key"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springConfigs.gentle}
            style={{
              ...glassCard(),
              padding: 48,
              textAlign: 'center',
            }}
          >
            <div style={lensingOverlay()} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1.5px solid rgba(245,158,11,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 0 32px rgba(245,158,11,0.12)',
                }}
              >
                <Key size={36} style={{ color: '#f59e0b' }} />
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.95)',
                  marginBottom: 8,
                }}
              >
                API Key necessária
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.55)',
                  maxWidth: 380,
                  margin: '0 auto 24px',
                  lineHeight: 1.6,
                }}
              >
                Configura a tua Anthropic API Key nas Definições para activar o assistente
              </p>
              <LiquidButton variant="amber">
                Ir para Definições
              </LiquidButton>
            </div>
          </motion.div>
        ) : (
          /* FULL CHAT INTERFACE */
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springConfigs.gentle}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* CONTEXT HEADER */}
            <div style={{ ...glassCard({ intensity: 'subtle', radius: 'lg' }), padding: '14px 18px' }}>
              <div style={lensingOverlay()} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Contexto activo
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <ContextChip icon={Film}    label="episódios"   value={epCount} />
                  <ContextChip icon={Users}   label="membros"     value={teamCount} />
                  <ContextChip icon={Calendar} label="dias"       value={daysCount} />
                  <ContextChip icon={Package} label="items dept"  value={deptCount} />
                </div>
              </div>
            </div>

            {/* PENDING SUGGESTIONS */}
            <AnimatePresence>
              {pendingSuggestions.length > 0 && (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={springConfigs.gentle}
                >
                  <LiquidSection
                    title="Sugestões de impacto cruzado"
                    accent="amber"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {pendingSuggestions.slice(0, 4).map((s, i) => (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...springConfigs.gentle, delay: i * 0.05 }}
                          style={{
                            ...nestedCard('#f59e0b'),
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <Lightbulb size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>
                              {s.title}
                            </p>
                            {s.description && (
                              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.description}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 8,
                                background: 'rgba(16,185,129,0.15)',
                                border: '0.5px solid rgba(16,185,129,0.3)',
                                color: '#10b981',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <CheckCircle size={10} />
                              Aprovar
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.06)',
                                border: '0.5px solid rgba(255,255,255,0.12)',
                                color: 'rgba(255,255,255,0.45)',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <X size={10} />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </LiquidSection>
                </motion.div>
              )}
            </AnimatePresence>

            {/* QUICK ACTIONS */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {QUICK_ACTIONS.map(action => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendMessage(action.prompt)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 20,
                      background: 'rgba(255,255,255,0.06)',
                      border: '0.5px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <Icon size={13} />
                    {action.label}
                  </motion.button>
                );
              })}
            </div>

            {/* CHAT AREA */}
            <div
              style={{
                ...glassCard(),
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 400,
              }}
            >
              <div style={lensingOverlay()} />
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Messages */}
                <div
                  style={{
                    flex: 1,
                    padding: 20,
                    overflowY: 'auto',
                    minHeight: 340,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {chat.length === 0 ? (
                    /* Empty state */
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: 12,
                        opacity: 0.5,
                      }}
                    >
                      <Sparkles size={36} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                        Faz uma pergunta sobre o projecto
                      </p>
                    </div>
                  ) : (
                    chat.map(msg => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={springConfigs.gentle}
                        style={{
                          display: 'flex',
                          justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '80%',
                            padding: '10px 14px',
                            borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                            background: msg.role === 'user'
                              ? 'rgba(16,185,129,0.18)'
                              : 'rgba(255,255,255,0.07)',
                            border: msg.role === 'user'
                              ? '0.5px solid rgba(16,185,129,0.3)'
                              : '0.5px solid rgba(255,255,255,0.12)',
                            fontSize: 14,
                            color: 'rgba(255,255,255,0.9)',
                            lineHeight: 1.55,
                          }}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    ))
                  )}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ display: 'flex', justifyContent: 'flex-start' }}
                    >
                      <div
                        style={{
                          padding: '10px 16px',
                          borderRadius: '4px 16px 16px 16px',
                          background: 'rgba(255,255,255,0.07)',
                          border: '0.5px solid rgba(255,255,255,0.12)',
                          display: 'flex',
                          gap: 4,
                          alignItems: 'center',
                        }}
                      >
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: 'rgba(255,255,255,0.5)',
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Divider */}
                <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.08)' }} />

                {/* Input bar */}
                <div style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunta algo ao realizador virtual…"
                    rows={1}
                    style={{
                      ...glassInput(),
                      flex: 1,
                      padding: '10px 14px',
                      resize: 'none',
                      fontSize: 14,
                      lineHeight: 1.5,
                      fontFamily: 'inherit',
                      minHeight: 40,
                      maxHeight: 120,
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendMessage(message)}
                    disabled={!message.trim() || isLoading}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: message.trim() && !isLoading
                        ? 'linear-gradient(135deg, #10b981, #34d399)'
                        : 'rgba(255,255,255,0.06)',
                      border: '0.5px solid rgba(255,255,255,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: message.trim() && !isLoading ? 'pointer' : 'not-allowed',
                      flexShrink: 0,
                      boxShadow: message.trim() && !isLoading
                        ? '0 4px 16px rgba(16,185,129,0.35)'
                        : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Send size={16} style={{ color: message.trim() && !isLoading ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LiquidPage>
  );
}
