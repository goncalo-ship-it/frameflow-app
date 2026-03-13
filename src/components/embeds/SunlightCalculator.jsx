// ── SunlightCalculator ───────────────────────────────────────────
// Calculadora solar por matemática (sem API) — widget autónomo
// Baseado em algoritmos NOAA para posição solar
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sunrise, Sunset, Sun, Moon, Info } from 'lucide-react'
import s from './SunlightCalculator.module.css'

/* ── Cálculos solares (NOAA Simplified) ─────────────────────── */

function toRad(deg) { return deg * Math.PI / 180 }
function toDeg(rad) { return rad * 180 / Math.PI }

/**
 * Calcula nascer/pôr-do-sol e horas dourada/azul
 * usando fórmulas simplificadas NOAA
 */
function calcSunTimes(lat, lng, dateObj) {
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()

  // Dia juliano
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045

  // Dias desde J2000.0
  const n = jdn - 2451545.0 + 0.0008

  // Longitude solar média
  const jStar = n - lng / 360
  const M = (357.5291 + 0.98560028 * jStar) % 360
  const C = 1.9148 * Math.sin(toRad(M)) +
    0.02 * Math.sin(toRad(2 * M)) +
    0.0003 * Math.sin(toRad(3 * M))

  // Longitude eclíptica
  const lambda = (M + C + 180 + 102.9372) % 360

  // Declinação solar
  const delta = toDeg(Math.asin(Math.sin(toRad(lambda)) * Math.sin(toRad(23.4393))))

  // Trânsito solar (meio-dia solar)
  const jTransit = 2451545.0 + jStar +
    0.0053 * Math.sin(toRad(M)) -
    0.0069 * Math.sin(toRad(2 * lambda))

  // Ângulo horário para um dado ângulo de depressão
  function hourAngle(angle) {
    const cosH = (Math.sin(toRad(angle)) - Math.sin(toRad(lat)) * Math.sin(toRad(delta))) /
      (Math.cos(toRad(lat)) * Math.cos(toRad(delta)))
    if (cosH > 1 || cosH < -1) return null // sol nunca nasce/põe
    return toDeg(Math.acos(cosH))
  }

  const hSunrise = hourAngle(-0.833) // nascer/pôr-do-sol (com refracção)
  const hCivil = hourAngle(-6)       // crepúsculo civil (blue hour)

  if (hSunrise === null) return null

  // Converter ângulo horário para horas UTC
  const jRise = jTransit - hSunrise / 360
  const jSet = jTransit + hSunrise / 360

  function jdToDate(jd) {
    const ms = (jd - 2440587.5) * 86400000
    return new Date(ms)
  }

  const sunrise = jdToDate(jRise)
  const sunset = jdToDate(jSet)
  const solarNoon = jdToDate(jTransit)

  // Golden hour: ~1h após nascer, ~1h antes do pôr-do-sol
  const goldenAMStart = sunrise
  const goldenAMEnd = new Date(sunrise.getTime() + 60 * 60 * 1000)
  const goldenPMStart = new Date(sunset.getTime() - 60 * 60 * 1000)
  const goldenPMEnd = sunset

  // Blue hour: crepúsculo civil
  let blueAMStart = sunrise
  let blueAMEnd = sunrise
  let bluePMStart = sunset
  let bluePMEnd = sunset

  if (hCivil !== null) {
    const jCivilRise = jTransit - hCivil / 360
    const jCivilSet = jTransit + hCivil / 360
    blueAMStart = jdToDate(jCivilRise)
    blueAMEnd = sunrise
    bluePMStart = sunset
    bluePMEnd = jdToDate(jCivilSet)
  }

  // Duração do dia em minutos
  const dayLength = Math.round((sunset - sunrise) / 60000)

  return {
    sunrise,
    sunset,
    solarNoon,
    dayLength,
    goldenAM: { start: goldenAMStart, end: goldenAMEnd },
    goldenPM: { start: goldenPMStart, end: goldenPMEnd },
    blueAM: { start: blueAMStart, end: blueAMEnd },
    bluePM: { start: bluePMStart, end: bluePMEnd },
  }
}

/* ── Formatação ─────────────────────────────────────────────── */

function fmt(d) {
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

/* ── Componente ─────────────────────────────────────────────── */

export function SunlightCalculator({
  latitude = 38.72,
  longitude = -9.14,
  date,
  location = '',
}) {
  const dateObj = useMemo(() => {
    if (!date) return new Date()
    return date instanceof Date ? date : new Date(date)
  }, [date])

  const dateStr = useMemo(() => dateObj.toISOString().split('T')[0], [dateObj])

  const data = useMemo(
    () => calcSunTimes(latitude, longitude, dateObj),
    [latitude, longitude, dateObj]
  )

  if (!data) {
    return (
      <div className={s.container}>
        <div className={s.loading}>Sem dados de luz solar para esta localização</div>
      </div>
    )
  }

  // Posição do sol (0-1 ao longo do dia)
  const now = new Date()
  const progress = Math.max(0, Math.min(1,
    (now - data.sunrise) / (data.sunset - data.sunrise)
  ))
  const dayHours = Math.floor(data.dayLength / 60)
  const dayMins = data.dayLength % 60

  // Recomendação contextual para a equipa
  let recText = ''
  if (now < data.goldenAM.end) {
    recText = 'Golden hour matinal activa. Luz suave e quente ideal para exteriores.'
  } else if (now >= data.goldenPM.start && now <= data.sunset) {
    recText = 'Golden hour vespertina activa. Aproveitar para cenas EXT com luz dourada.'
  } else if (now > data.sunset) {
    recText = 'Sol já se pôs. Planear iluminação artificial para cenas restantes.'
  } else {
    recText = `Próxima golden hour às ${fmt(data.goldenPM.start)}. Luz actual é dura — considerar difusores para EXT.`
  }

  return (
    <motion.div
      className={s.container}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cabeçalho */}
      <div className={s.header}>
        <div>
          <div className={s.title}>Luz Solar</div>
          {location && <div className={s.location}>{location}</div>}
        </div>
        <div className={s.dateLabel}>{dateStr}</div>
      </div>

      {/* Arco solar SVG */}
      <div className={s.arcWrap}>
        <svg className={s.arcSvg} viewBox="0 0 300 100" preserveAspectRatio="xMidYMax meet">
          {/* Linha do horizonte */}
          <line x1="10" y1="90" x2="290" y2="90" className={s.horizonLine} />

          {/* Arco completo (tracejado) */}
          <path d="M 20,90 Q 150,-20 280,90" className={s.arcPath} />

          {/* Arco de progresso */}
          <path
            d="M 20,90 Q 150,-20 280,90"
            className={s.arcFill}
            strokeDasharray={`${progress * 400} 400`}
          />

          {/* Ponto do sol */}
          {progress > 0 && progress < 1 && (
            <circle
              cx={20 + progress * 260}
              cy={90 - Math.sin(progress * Math.PI) * 100}
              r="6"
              className={s.sunDot}
            />
          )}

          {/* Etiquetas de hora */}
          <text x="20" y="86" className={s.timeLabel} textAnchor="middle">
            {fmt(data.sunrise)}
          </text>
          <text x="280" y="86" className={s.timeLabel} textAnchor="middle">
            {fmt(data.sunset)}
          </text>
        </svg>
      </div>

      {/* Duração do dia */}
      <div className={s.dayLength}>
        Duração do dia:{' '}
        <span className={s.dayLengthValue}>{dayHours}h {dayMins}m</span>
      </div>

      {/* 4 cartões de horas especiais */}
      <div className={s.cards}>
        <div className={s.card}>
          <div className={s.cardIcon}>
            <Sunrise size={14} color="#fb923c" />
            <span className={s.cardLabel}>Golden Hour AM</span>
          </div>
          <div className={s.cardTime}>
            {fmt(data.goldenAM.start)} – {fmt(data.goldenAM.end)}
          </div>
          <div className={s.cardSuffix}>Luz suave dourada</div>
        </div>

        <div className={s.card}>
          <div className={s.cardIcon}>
            <Sunset size={14} color="#fb923c" />
            <span className={s.cardLabel}>Golden Hour PM</span>
          </div>
          <div className={s.cardTime}>
            {fmt(data.goldenPM.start)} – {fmt(data.goldenPM.end)}
          </div>
          <div className={s.cardSuffix}>Luz quente lateral</div>
        </div>

        <div className={s.card}>
          <div className={s.cardIcon}>
            <Moon size={14} color="#60a5fa" />
            <span className={`${s.cardLabel} ${s.cardLabelBlue}`}>Blue Hour AM</span>
          </div>
          <div className={s.cardTime}>
            {fmt(data.blueAM.start)} – {fmt(data.blueAM.end)}
          </div>
          <div className={s.cardSuffix}>Tom frio azulado</div>
        </div>

        <div className={s.card}>
          <div className={s.cardIcon}>
            <Moon size={14} color="#60a5fa" />
            <span className={`${s.cardLabel} ${s.cardLabelBlue}`}>Blue Hour PM</span>
          </div>
          <div className={s.cardTime}>
            {fmt(data.bluePM.start)} – {fmt(data.bluePM.end)}
          </div>
          <div className={s.cardSuffix}>Crepúsculo cinematográfico</div>
        </div>
      </div>

      {/* Recomendação para a equipa */}
      <div className={s.recommendation}>
        <Info size={14} />
        <div className={s.recText}>{recText}</div>
      </div>
    </motion.div>
  )
}
