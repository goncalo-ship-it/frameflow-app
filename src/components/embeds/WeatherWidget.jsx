// ── WeatherWidget ────────────────────────────────────────────────
// Meteorologia compacta — usa fetchWeather centralizado de callsheet/weather.js
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wind, Droplets, Eye, AlertTriangle } from 'lucide-react'
import { fetchWeather, weatherIcon } from '../../modules/callsheet/weather.js'
import s from './WeatherWidget.module.css'

export function WeatherWidget({ apiKey, latitude = 38.72, longitude = -9.14 }) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!apiKey) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        const data = await fetchWeather(latitude, longitude, apiKey)
        if (cancelled) return

        // Rainy hours alert
        const rainyHours = (data.hourly || []).filter(h => h.pop > 50 || h.rain > 0.5)

        setWeather({
          temp: data.current?.temp,
          description: data.current?.description || '',
          icon: data.current?.icon || '01d',
          wind: data.current?.wind?.speed || 0,
          humidity: data.current?.humidity,
          visibility: null, // not available from shared fetch
          location: '',
          hourly: (data.hourly || []).slice(0, 6).map(h => ({
            time: h.time,
            temp: h.temp,
            icon: h.icon,
            pop: h.pop,
            rain: h.rain,
          })),
          rainAlert: rainyHours.length > 0
            ? `Chuva prevista (${rainyHours[0].time}) — verificar cenas EXT`
            : null,
          updatedAt: data.updatedAt
            ? new Date(data.updatedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
            : null,
        })
      } catch (e) {
        console.warn('WeatherWidget fetch error:', e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [latitude, longitude, apiKey])

  if (loading) {
    return (
      <div className={s.widget}>
        <div className={s.loading}>A carregar meteorologia...</div>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className={s.widget}>
        <div className={s.loading}>
          {apiKey ? 'Sem dados disponíveis' : 'API key necessária (OpenWeatherMap)'}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={s.widget}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Temperatura actual */}
      <div className={s.current}>
        <div className={s.tempBlock}>
          <div className={s.temp}>
            {weather.temp}<span className={s.tempUnit}>°C</span>
          </div>
          <div className={s.condition}>{weather.description}</div>
          {weather.location && (
            <div className={s.locationLabel}>{weather.location}</div>
          )}
        </div>
        <div className={s.weatherEmoji}>{weatherIcon(weather.icon)}</div>
      </div>

      {/* Alerta de chuva */}
      {weather.rainAlert && (
        <motion.div
          className={s.alert}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AlertTriangle size={14} />
          <span className={s.alertText}>{weather.rainAlert}</span>
        </motion.div>
      )}

      {/* Previsão horária (6 horas) */}
      {weather.hourly.length > 0 && (
        <div className={s.hourlySection}>
          <div className={s.hourlyScroll}>
            {weather.hourly.map((h, i) => (
              <motion.div
                key={i}
                className={s.hourlyItem}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <span className={s.hourlyTime}>{h.time}</span>
                <span className={s.hourlyEmoji}>{weatherIcon(h.icon)}</span>
                <span className={s.hourlyTemp}>{h.temp}°</span>
                {h.pop > 0 && (
                  <span className={s.hourlyPop}>{h.pop}%</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Detalhes: vento, humidade, visibilidade */}
      <div className={s.details}>
        <div className={s.detailCell}>
          <div className={s.detailIcon}><Wind size={14} /></div>
          <div className={s.detailValue}>{weather.wind} km/h</div>
          <div className={s.detailLabel}>Vento</div>
        </div>
        <div className={s.detailCell}>
          <div className={s.detailIcon}><Droplets size={14} /></div>
          <div className={s.detailValue}>{weather.humidity}%</div>
          <div className={s.detailLabel}>Humidade</div>
        </div>
        <div className={s.detailCell}>
          <div className={s.detailIcon}><Eye size={14} /></div>
          <div className={s.detailValue}>{weather.visibility != null ? `${weather.visibility} km` : '--'}</div>
          <div className={s.detailLabel}>Visibilidade</div>
        </div>
      </div>

      {/* Hora da última actualização */}
      {weather.updatedAt && (
        <div className={s.updated}>Actualizado {weather.updatedAt}</div>
      )}
    </motion.div>
  )
}
