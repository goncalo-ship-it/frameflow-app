// Chat AI para criação de orçamento via conversa
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, AlertCircle, Loader } from 'lucide-react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { fetchAPI } from '../../../core/api.js'
import { CATEGORIAS, BENCHMARKS } from '../utils/marketData.js'
import { toCents } from '../utils/moneyUtils.js'
import { SmartInput } from '../../../components/shared/SmartInput.jsx'
import styles from '../Budget.module.css'

const INITIAL_MESSAGE = {
  id: 'init',
  role: 'assistant',
  text: 'Olá! Posso ajudar-te a criar o orçamento. Descreve o projecto como falarias com um colega — o cliente, o tipo de produção, os dias de rodagem, os fornecedores confirmados, o local e o que já tens definido.',
}

function buildSystemPrompt(budget, suppliers, team = [], shootingDays = []) {
  const categoriasList = CATEGORIAS.map(c => `  ${c.id}. ${c.label}`).join('\n')
  const suppliersList = suppliers.length > 0
    ? suppliers.map(s => `  - ${s.nome} (${s.tipo || ''}): ${s.contacto || ''}`).join('\n')
    : '  (sem fornecedores registados)'

  const existingLines = (budget?.lines || []).length > 0
    ? budget.lines.map(l => {
        const cat = CATEGORIAS.find(c => c.id === l.categoria)
        return `  - [Cat ${l.categoria} ${cat?.label}] ${l.descricao}: ${l.valorUnitario / 100}€/unit × ${l.quantidade} × ${l.dias} dias`
      }).join('\n')
    : '  (sem linhas ainda)'

  return `És um assistente especializado em orçamentos de produção audiovisual portuguesa.

## As 13 categorias oficiais:
${categoriasList}

## Benchmarks de mercado (preços de venda, por dia, em €):
- AP: 150–250€
- Realizador: 500–1200€
- DOP: 400–800€
- Package câmara FX6: 600–900€ (básico), 1200–1800€ (completo)
- Diretor de Arte: 250–450€
- Gaffer: 200–350€
- Catering almoço: 8–15€/pessoa
- Estúdio pequeno: 500–1200€/dia
- Montagem (offline): 300–600€/dia

## Fornecedores registados:
${suppliersList}

## Equipa confirmada (com cachê diário):
${team.filter(m => m.cacheDiario > 0).map(m =>
    `  - ${m.name} (${m.role || m.group}): ${m.cacheDiario}€/dia${m.confirmedDays?.length ? ` · ${m.confirmedDays.length} dias confirmados` : ''}`
  ).join('\n') || '  (sem membros com cachê definido)'}

## Produção:
  - ${shootingDays.length} dias de rodagem planeados
  - ${team.length} membros na equipa total

## Linhas já no orçamento:
${existingLines}

## Instruções:
Analisa o que o utilizador descreve e extrai linhas de orçamento concretas.
Para cada linha, determina a categoria certa (1-13), uma descrição clara, o valor unitário de venda (em €), quantidade, dias, custo real estimado e markup.
Responde SEMPRE com um bloco de código JSON com esta estrutura exacta:

\`\`\`json
{
  "acoes": [
    {
      "tipo": "adicionar_linha",
      "dados": {
        "categoria": 3,
        "descricao": "DOP",
        "valorUnitario": 60000,
        "quantidade": 1,
        "dias": 2,
        "custoReal": 45000,
        "markup": 1.33,
        "fornecedor": ""
      }
    }
  ],
  "resposta": "Texto explicativo em português sobre o que foi adicionado..."
}
\`\`\`

IMPORTANTE:
- valorUnitario e custoReal são em CÊNTIMOS (multiplicar euros × 100)
- custoReal é o custo TOTAL da linha (valorUnitario × quantidade × dias, à taxa de custo)
- Se não conseguires extrair linhas concretas, retorna "acoes": [] e explica o que precisas saber
- Pergunta clarificações quando necessário antes de assumir valores
- Usa os benchmarks de mercado para estimar valores razoáveis
- Honorários da produtora (cat 13) nunca são adicionados como linhas — são calculados automaticamente a ${Math.round((budget?.taxaHonorarios ?? 0.15) * 100)}%${(budget?.taxaHonorarios ?? 0.15) === 0 ? ' (DESACTIVADOS neste orçamento)' : ''}`
}

export function BudgetChat({ budget, onAddLine }) {
  const {  apiKey, suppliers, team, shootingDays  } = useStore(useShallow(s => ({ apiKey: s.apiKey, suppliers: s.suppliers, team: s.team, shootingDays: s.shootingDays })))
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const parseResponse = (content) => {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/)
    if (!jsonMatch) return { acoes: [], resposta: content }
    try {
      return JSON.parse(jsonMatch[1])
    } catch {
      return { acoes: [], resposta: content }
    }
  }

  const executeAcoes = (acoes) => {
    if (!acoes || acoes.length === 0) return 0
    let added = 0
    for (const acao of acoes) {
      if (acao.tipo === 'adicionar_linha' && acao.dados) {
        const d = acao.dados
        if (d.categoria && d.descricao) {
          onAddLine({
            categoria:     Number(d.categoria),
            descricao:     d.descricao,
            valorUnitario: Number(d.valorUnitario) || 0,
            quantidade:    Number(d.quantidade) || 1,
            dias:          Number(d.dias) || 1,
            custoReal:     Number(d.custoReal) || 0,
            markup:        Number(d.markup) || 1.35,
            fornecedor:    d.fornecedor || '',
            origem:        'chat',
          })
          added++
        }
      }
    }
    return added
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    if (!apiKey) {
      setError('Sem API Key configurada. Vai a Definições e adiciona a tua chave Anthropic.')
      return
    }

    setInput('')
    setError(null)

    const userMsg = { id: Date.now().toString(), role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const history = messages
      .filter(m => m.id !== 'init')
      .slice(-8)  // últimas 8 mensagens — poupa tokens em conversas longas
      .map(m => ({ role: m.role, content: m.text }))

    try {
      const content = await fetchAPI({
        apiKey,
        system: buildSystemPrompt(budget, suppliers || [], team, shootingDays),
        messages: [
          ...history,
          { role: 'user', content: text },
        ],
        maxTokens: 1500,
        cache: false,
      })
      const parsed = parseResponse(content)
      const addedCount = executeAcoes(parsed.acoes || [])

      const assistantText = parsed.resposta || content
      const suffix = addedCount > 0
        ? `\n\n✓ ${addedCount} linha${addedCount !== 1 ? 's' : ''} adicionada${addedCount !== 1 ? 's' : ''} ao orçamento.`
        : ''

      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_a',
        role: 'assistant',
        text: assistantText + suffix,
        addedCount,
      }])
    } catch (err) {
      setError(`Erro: ${err.message}`)
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_err',
        role: 'assistant',
        text: `Ocorreu um erro ao contactar o Claude: ${err.message}`,
        isError: true,
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={styles.chatRoot}>
      {!apiKey && (
        <div className={styles.chatNoKey}>
          <AlertCircle size={16} color="var(--health-yellow)" />
          <span>API Key não configurada. Vai a <strong>Definições</strong> para adicionar a tua chave Anthropic.</span>
        </div>
      )}

      <div className={styles.chatMessages}>
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              className={`${styles.chatMsg} ${msg.role === 'user' ? styles.chatMsgUser : styles.chatMsgAssistant}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.chatMsgIcon}>
                {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
              </div>
              <div className={`${styles.chatMsgBubble} ${msg.isError ? styles.chatMsgError : ''}`}>
                {msg.text?.split('\n').map((line, i) => (
                  <span key={i}>{line}{i < msg.text?.split('\n').length - 1 ? <br /> : null}</span>
                ))}
                {msg.addedCount > 0 && (
                  <span className={styles.chatAddedBadge}>+{msg.addedCount} linha{msg.addedCount !== 1 ? 's' : ''}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            className={`${styles.chatMsg} ${styles.chatMsgAssistant}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.chatMsgIcon}><Bot size={13} /></div>
            <div className={`${styles.chatMsgBubble} ${styles.chatMsgLoading}`}>
              <Loader size={13} className={styles.spinIcon} />
              <span>A analisar…</span>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className={styles.chatInputRow}>
        <SmartInput
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descreve o projecto ou o que precisas de orçamentar… (Enter para enviar)"
          rows={2}
          disabled={loading}
          context="Descrição de projecto para orçamento — pode incluir emails, briefs, propostas"
        />
        <button
          className={styles.chatSendBtn}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          <Send size={15} />
        </button>
      </div>

      {error && <p className={styles.chatError}>{error}</p>}
    </div>
  )
}
