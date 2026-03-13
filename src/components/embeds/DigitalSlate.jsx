// ── DigitalSlate ─────────────────────────────────────────────────
// Claquete digital — widget autónomo sem dependência de store
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Clapperboard } from 'lucide-react'
import s from './DigitalSlate.module.css'

export function DigitalSlate({
  sceneNumber = 'SC001',
  takeNumber = 1,
  roll = 'A001',
  date,
  director = '',
  dop = '',
  sound = '',
  production = 'FrameFlow',
  episode = '',
  onMark,
}) {
  const [take, setTake] = useState(takeNumber)
  const [flashing, setFlashing] = useState(false)
  const [clapDown, setClapDown] = useState(false)

  // Data formatada em pt-PT
  const displayDate = date
    ? new Date(date).toLocaleDateString('pt-PT')
    : new Date().toLocaleDateString('pt-PT')

  const handleMark = useCallback(() => {
    setClapDown(true)
    setFlashing(true)

    setTimeout(() => setFlashing(false), 300)
    setTimeout(() => setClapDown(false), 400)

    onMark?.({ sceneNumber, take, roll, date: displayDate })
    setTake(prev => prev + 1)
  }, [sceneNumber, take, roll, displayDate, onMark])

  return (
    <div className={s.slate}>
      {/* Flash de sincronização */}
      <AnimatePresence>
        {flashing && (
          <motion.div
            className={s.flash}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Barra superior da claquete (riscas preto/branco) */}
      <motion.div
        className={s.clapperBar}
        animate={{ rotateX: clapDown ? 25 : 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 400 }}
      >
        <div className={s.clapperContent}>
          <Clapperboard size={16} />
          <span className={s.clapperProd}>{production}</span>
          {episode && <span className={s.clapperEp}>{episode}</span>}
        </div>
      </motion.div>

      {/* Header com data */}
      <div className={s.header}>
        <span className={s.project}>{production}</span>
        <span className={s.date}>{displayDate}</span>
      </div>

      {/* Display principal — Cena / Take */}
      <div className={s.mainDisplay}>
        <div className={s.bigNumber}>
          <div className={s.bigLabel}>Cena</div>
          <div className={s.bigValue}>{sceneNumber}</div>
        </div>
        <div className={s.divider} />
        <div className={s.bigNumber}>
          <div className={s.bigLabel}>Take</div>
          <div className={s.bigValue}>{String(take).padStart(2, '0')}</div>
        </div>
      </div>

      {/* Grelha de metadados */}
      <div className={s.metaGrid}>
        <div className={s.metaCell}>
          <div className={s.metaLabel}>Roll</div>
          <div className={s.metaValue}>{roll}</div>
        </div>
        <div className={s.metaCell}>
          <div className={s.metaLabel}>Data</div>
          <div className={s.metaValue}>{displayDate}</div>
        </div>
        {episode && (
          <div className={s.metaCell}>
            <div className={s.metaLabel}>Episódio</div>
            <div className={s.metaValue}>{episode}</div>
          </div>
        )}
      </div>

      {/* Linha de equipa — director, DoP, som */}
      {(director || dop || sound) && (
        <div className={s.crewRow}>
          {director && (
            <div className={s.crewItem}>
              <span className={s.crewRole}>Dir</span>
              <span className={s.crewName}>{director}</span>
            </div>
          )}
          {dop && (
            <div className={s.crewItem}>
              <span className={s.crewRole}>DoP</span>
              <span className={s.crewName}>{dop}</span>
            </div>
          )}
          {sound && (
            <div className={s.crewItem}>
              <span className={s.crewRole}>Som</span>
              <span className={s.crewName}>{sound}</span>
            </div>
          )}
        </div>
      )}

      {/* Botão MARK — com animação */}
      <motion.button
        className={s.markBtn}
        onClick={handleMark}
        whileTap={{ scale: 0.95 }}
      >
        <Zap size={18} />
        MARK
      </motion.button>
    </div>
  )
}
