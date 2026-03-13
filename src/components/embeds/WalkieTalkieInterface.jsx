// ── WalkieTalkieInterface ────────────────────────────────────────
// Interface de rádio com PTT (visual) — widget autónomo
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Mic, Volume2, Users } from 'lucide-react'
import s from './WalkieTalkieInterface.module.css'

const DEFAULT_CHANNELS = [
  { number: 1, label: 'Camera', color: '#60a5fa' },
  { number: 2, label: 'Som', color: '#34d399' },
  { number: 3, label: 'Produção', color: '#fbbf24' },
  { number: 4, label: 'All-Call', color: '#f87171' },
]

export function WalkieTalkieInterface({
  channels = DEFAULT_CHANNELS,
  currentChannel,
  onChannelChange,
  onTransmit,
}) {
  const [internalChannel, setInternalChannel] = useState(channels[0]?.number ?? 1)
  const [pressing, setPressing] = useState(false)
  const [messages, setMessages] = useState([])
  const pressStart = useRef(null)
  const feedRef = useRef(null)

  // Canal activo: controlado externamente ou internamente
  const activeNumber = currentChannel ?? internalChannel
  const active = channels.find(c => c.number === activeNumber)

  const selectChannel = useCallback((num) => {
    if (onChannelChange) {
      onChannelChange(num)
    } else {
      setInternalChannel(num)
    }
  }, [onChannelChange])

  const handlePTTDown = useCallback(() => {
    setPressing(true)
    pressStart.current = Date.now()
  }, [])

  const handlePTTUp = useCallback(() => {
    setPressing(false)
    const duration = Date.now() - (pressStart.current || Date.now())
    pressStart.current = null

    if (duration > 200 && active) {
      const msg = {
        id: Date.now(),
        channel: active.number,
        channelColor: active.color,
        sender: 'Eu',
        text: `[Transmissão ${Math.round(duration / 1000)}s]`,
        time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }
      setMessages(prev => [...prev.slice(-20), msg])
      onTransmit?.({ channel: active.number, duration })

      // Auto-scroll do feed
      setTimeout(() => {
        feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
      }, 50)
    }
  }, [active, onTransmit])

  return (
    <div className={s.container}>
      {/* Cabeçalho */}
      <div className={s.header}>
        <Radio size={16} />
        <span className={s.title}>Walkie-Talkie</span>
        {active && (
          <div className={s.activeChannel}>
            Canal: <span className={s.activeChannelName}>CH{active.number} {active.label}</span>
          </div>
        )}
      </div>

      {/* Grelha de canais */}
      <div className={s.channelGrid}>
        {channels.map(ch => (
          <motion.button
            key={ch.number}
            className={`${s.channelBtn} ${activeNumber === ch.number ? s.channelActive : ''}`}
            style={{ '--channel-color': ch.color }}
            onClick={() => selectChannel(ch.number)}
            whileTap={{ scale: 0.97 }}
          >
            <div className={s.channelDot} style={{ background: ch.color }} />
            <div className={s.channelInfo}>
              <div className={s.channelName}>CH{ch.number}</div>
              <div className={s.channelLabel}>{ch.label}</div>
            </div>
            {activeNumber === ch.number && (
              <motion.div
                className={s.activeBadge}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Volume2 size={10} />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Feed de mensagens */}
      <div className={s.feed} ref={feedRef}>
        {messages.length === 0 ? (
          <div className={s.feedEmpty}>Sem transmissões recentes</div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                className={s.message}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className={s.msgDot} style={{ background: msg.channelColor }} />
                <div className={s.msgContent}>
                  <span className={s.msgSender}>{msg.sender}</span>
                  <div className={s.msgText}>{msg.text}</div>
                </div>
                <span className={s.msgTime}>{msg.time}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Botão PTT (Push-To-Talk) */}
      <div className={s.pttWrap}>
        <motion.button
          className={`${s.pttBtn} ${pressing ? s.pttActive : ''}`}
          onMouseDown={handlePTTDown}
          onMouseUp={handlePTTUp}
          onMouseLeave={() => pressing && handlePTTUp()}
          onTouchStart={handlePTTDown}
          onTouchEnd={handlePTTUp}
          whileTap={{ scale: 0.97 }}
        >
          {pressing ? <Volume2 size={20} /> : <Mic size={20} />}
          {pressing ? 'A TRANSMITIR...' : 'PREMIR PARA FALAR'}
        </motion.button>
        <div className={s.pttHint}>
          Manter premido para transmitir{active ? ` no canal ${active.label}` : ''}
        </div>
      </div>
    </div>
  )
}
