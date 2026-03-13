// ScheduleSetup — ecrã inicial quando não há dias de rodagem
// Cria N dias consecutivos, detecta feriados portugueses, animação Framer Motion

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Zap, AlertTriangle, Check, Film, Hash } from 'lucide-react'
import { useStore } from '../../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import styles from '../Schedule.module.css'

// Feriados fixos portugueses (MM-DD)
const FERIADOS_FIXOS = [
  '01-01', // Ano Novo
  '04-25', // Dia da Liberdade
  '05-01', // Dia do Trabalhador
  '06-10', // Dia de Portugal
  '08-15', // Assunção de Maria
  '10-05', // Implantação da República
  '11-01', // Dia de Todos os Santos
  '12-01', // Restauração da Independência
  '12-08', // Imaculada Conceição
  '12-25', // Natal
]

// Páscoa (algoritmo anônimo gregoriano)
function easterDate(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function isFeriado(date) {
  const d = new Date(date + 'T00:00:00')
  const mmdd = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  if (FERIADOS_FIXOS.includes(mmdd)) return true

  // Páscoa e Sexta-Feira Santa
  const easter = easterDate(d.getFullYear())
  const goodFriday = new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000)
  const corpusChristi = new Date(easter.getTime() + 60 * 24 * 60 * 60 * 1000)

  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  if (isSameDay(d, easter) || isSameDay(d, goodFriday) || isSameDay(d, corpusChristi)) return true

  return false
}

const WEEKDAY_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function generateDays(startDate, count, includeWeekends, episodeMode = false, daysPerEp = 5, numEps = 1) {
  const days = []
  let current = new Date(startDate + 'T00:00:00')
  let dayNum = 1

  while (days.length < count) {
    const dayOfWeek = current.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const dateStr = current.toISOString().slice(0, 10)

    if (includeWeekends || !isWeekend) {
      const feriado = isFeriado(dateStr)
      let epNum = null
      let dayInEp = null
      if (episodeMode) {
        epNum = Math.floor((dayNum - 1) / daysPerEp) + 1
        dayInEp = ((dayNum - 1) % daysPerEp) + 1
      }
      days.push({
        date: dateStr,
        dayNum,
        weekday: WEEKDAY_PT[dayOfWeek],
        isWeekend,
        isFeriado: feriado,
        epNum,
        dayInEp,
      })
      dayNum++
    }

    current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
  }

  return days
}

export function ScheduleSetup() {
  const {  addShootingDay, projectParams, parsedScripts  } = useStore(useShallow(s => ({ addShootingDay: s.addShootingDay, projectParams: s.projectParams, parsedScripts: s.parsedScripts })))

  const detectedEps = Object.keys(parsedScripts || {}).length

  // Modo: 'total' ou 'episodio'
  const [modo, setModo]               = useState('episodio')
  const [numDays, setNumDays]         = useState(15)
  const [numEps, setNumEps]           = useState(() => detectedEps || Number(projectParams?.episodes) || 6)
  const [daysPerEp, setDaysPerEp]     = useState(5)
  const [startDate, setStartDate]     = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  })
  const [callTime, setCallTime]       = useState('08:00')
  const [includeWeekends, setIncludeWeekends] = useState(false)
  const [preview, setPreview]         = useState(null)
  const [submitted, setSubmitted]     = useState(false)

  const totalDays = modo === 'episodio' ? numEps * daysPerEp : numDays

  const handlePreview = useCallback(() => {
    if (!startDate || totalDays < 1) return
    const days = generateDays(startDate, totalDays, includeWeekends, modo === 'episodio', daysPerEp, numEps)
    setPreview(days)
  }, [startDate, totalDays, includeWeekends, modo, daysPerEp, numEps])

  const handleSubmit = useCallback(() => {
    if (!preview) return

    preview.forEach((d, idx) => {
      const label = d.epNum != null
        ? `Ep${String(d.epNum).padStart(2, '0')} · Dia ${d.dayInEp}`
        : `Dia ${d.dayNum}`
      addShootingDay({
        id: `day_${Date.now()}_${idx}`,
        date: d.date,
        label,
        callTime,
        notes: d.isFeriado ? `⚠ Feriado nacional` : '',
        dayNumber: d.dayNum,
        episodeNumber: d.epNum || null,
        dayInEpisode: d.dayInEp || null,
        windowType: 'completo',
      })
    })

    setSubmitted(true)
  }, [preview, callTime, addShootingDay])

  const feriadosNoPlano = preview?.filter(d => d.isFeriado) || []

  return (
    <div className={styles.setupRoot}>
      <motion.div
        className={styles.setupCard}
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      >
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div key="form" exit={{ opacity: 0, y: -16 }}>
              <div className={styles.setupHeader}>
                <div className={styles.setupIcon}>
                  <Calendar size={28} color="var(--mod-production)" />
                </div>
                <h2 className={styles.setupTitle}>Configurar Plano de Rodagem</h2>
                <p className={styles.setupSubtitle}>
                  Define os dias de rodagem e o FRAME distribui as cenas automaticamente
                </p>
              </div>

              {/* Modo: total vs por episódio */}
              <div className={styles.setupModoToggle}>
                <button
                  className={`${styles.modoBtn} ${modo === 'episodio' ? styles.modoBtnActive : ''}`}
                  onClick={() => { setModo('episodio'); setPreview(null) }}
                >
                  <Film size={13} />
                  Por episódio
                </button>
                <button
                  className={`${styles.modoBtn} ${modo === 'total' ? styles.modoBtnActive : ''}`}
                  onClick={() => { setModo('total'); setPreview(null) }}
                >
                  <Hash size={13} />
                  Total de dias
                </button>
              </div>

              <div className={styles.setupFields}>

                {/* MODO EPISÓDIO */}
                {modo === 'episodio' && (
                  <>
                    <div className={styles.setupFieldRow}>
                      <div className={styles.setupField}>
                        <label className={styles.setupLabel}>
                          <Film size={13} color="var(--mod-production)" />
                          Nº de episódios
                        </label>
                        <div className={styles.setupNumInput}>
                          <button className={styles.numBtn} onClick={() => { setNumEps(v => Math.max(1, v - 1)); setPreview(null) }}>−</button>
                          <input
                            type="number"
                            className={styles.setupInput}
                            value={numEps}
                            min={1}
                            onChange={e => { setNumEps(Math.max(1, Number(e.target.value))); setPreview(null) }}
                            style={{ textAlign: 'center', width: 72 }}
                          />
                          <button className={styles.numBtn} onClick={() => { setNumEps(v => v + 1); setPreview(null) }}>+</button>
                        </div>
                      </div>
                      <div className={styles.setupFieldSep}>×</div>
                      <div className={styles.setupField}>
                        <label className={styles.setupLabel}>
                          <Zap size={13} color="var(--mod-production)" />
                          Dias por episódio
                        </label>
                        <div className={styles.setupNumInput}>
                          <button className={styles.numBtn} onClick={() => { setDaysPerEp(v => Math.max(1, v - 1)); setPreview(null) }}>−</button>
                          <input
                            type="number"
                            className={styles.setupInput}
                            value={daysPerEp}
                            min={1} max={30}
                            onChange={e => { setDaysPerEp(Math.max(1, Number(e.target.value))); setPreview(null) }}
                            style={{ textAlign: 'center', width: 72 }}
                          />
                          <button className={styles.numBtn} onClick={() => { setDaysPerEp(v => Math.min(30, v + 1)); setPreview(null) }}>+</button>
                        </div>
                      </div>
                      <div className={styles.setupFieldTotal}>
                        = <strong>{totalDays}</strong> dias
                      </div>
                    </div>
                    <p className={styles.setupFieldHint} style={{ marginTop: -8 }}>
                      {detectedEps > 0
                        ? `${detectedEps} episódio${detectedEps > 1 ? 's' : ''} detectado${detectedEps > 1 ? 's' : ''} nos guiões carregados`
                        : 'Os dias serão etiquetados Ep01 · Dia 1, Ep01 · Dia 2, etc.'}
                    </p>
                  </>
                )}

                {/* MODO TOTAL */}
                {modo === 'total' && (
                  <div className={styles.setupField}>
                    <label className={styles.setupLabel}>
                      <Zap size={13} color="var(--mod-production)" />
                      Total de dias de rodagem
                    </label>
                    <div className={styles.setupNumInput}>
                      <button className={styles.numBtn} onClick={() => { setNumDays(v => Math.max(1, v - 1)); setPreview(null) }}>−</button>
                      <input
                        type="number"
                        className={styles.setupInput}
                        value={numDays}
                        min={1} max={120}
                        onChange={e => { setNumDays(Math.max(1, Number(e.target.value))); setPreview(null) }}
                        style={{ textAlign: 'center', width: 80 }}
                      />
                      <button className={styles.numBtn} onClick={() => { setNumDays(v => Math.min(120, v + 1)); setPreview(null) }}>+</button>
                      <span className={styles.setupFieldHint}>dias</span>
                    </div>
                  </div>
                )}

                {/* Data de início */}
                <div className={styles.setupField}>
                  <label className={styles.setupLabel}>
                    <Calendar size={13} color="var(--mod-production)" />
                    Quando começa a rodagem?
                  </label>
                  <input
                    type="date"
                    className={styles.setupInput}
                    value={startDate}
                    onChange={e => { setStartDate(e.target.value); setPreview(null) }}
                  />
                </div>

                {/* Call time */}
                <div className={styles.setupField}>
                  <label className={styles.setupLabel}>
                    <Clock size={13} color="var(--mod-production)" />
                    Hora de chamada padrão
                  </label>
                  <input
                    type="time"
                    className={styles.setupInput}
                    value={callTime}
                    onChange={e => setCallTime(e.target.value)}
                    style={{ width: 120 }}
                  />
                </div>

                {/* Fins de semana */}
                <label className={styles.setupCheckbox}>
                  <input
                    type="checkbox"
                    checked={includeWeekends}
                    onChange={e => { setIncludeWeekends(e.target.checked); setPreview(null) }}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxLabel}>Incluir fins de semana (sáb + dom)</span>
                </label>
              </div>

              {/* Avisos de feriados */}
              <AnimatePresence>
                {feriadosNoPlano.length > 0 && (
                  <motion.div
                    className={styles.setupWarning}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <AlertTriangle size={14} color="var(--health-yellow)" />
                    <div>
                      <strong>Atenção: feriados no plano</strong>
                      <div className={styles.setupFeriados}>
                        {feriadosNoPlano.map(d => (
                          <span key={d.date} className={styles.feriadoChip}>{d.date}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview da grelha de dias */}
              <AnimatePresence>
                {preview && (
                  <motion.div
                    className={styles.setupPreview}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className={styles.previewTitle}>
                      Pré-visualização — {preview.length} dias
                    </div>
                    <div className={styles.previewGrid}>
                      {preview.slice(0, 30).map(d => (
                        <div
                          key={d.date}
                          className={`${styles.previewDay} ${d.isFeriado ? styles.previewDayFeriado : ''} ${d.isWeekend ? styles.previewDayWeekend : ''}`}
                          title={d.isFeriado ? 'Feriado nacional' : ''}
                        >
                          <span className={styles.previewDayNum}>D{d.dayNum}</span>
                          <span className={styles.previewDayDate}>{d.weekday} {d.date.slice(5)}</span>
                          {d.isFeriado && <AlertTriangle size={10} color="var(--health-yellow)" />}
                        </div>
                      ))}
                      {preview.length > 30 && (
                        <div className={styles.previewMore}>+{preview.length - 30} dias</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={styles.setupActions}>
                <button
                  className={styles.setupBtnSecondary}
                  onClick={handlePreview}
                  disabled={!startDate}
                >
                  Pré-visualizar
                </button>
                <button
                  className={styles.setupBtnPrimary}
                  onClick={() => { handlePreview(); setTimeout(handleSubmit, 100) }}
                  disabled={!startDate || totalDays < 1}
                >
                  <Calendar size={15} />
                  Criar {totalDays} dias de rodagem
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              className={styles.setupDone}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className={styles.setupDoneIcon}>
                <Check size={32} color="var(--health-green)" />
              </div>
              <h3>Plano criado!</h3>
              <p>
                {totalDays} dias de rodagem adicionados ao plano
                {modo === 'episodio' ? ` (${numEps} episódios × ${daysPerEp} dias)` : ''}.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
