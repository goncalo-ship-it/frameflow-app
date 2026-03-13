// ── Weather Service ───────────────────────────────────────────────
// OpenWeatherMap free API (1000 calls/dia)
// Sunrise/Sunset via sunrise-sunset.org (grátis, sem key)
// Tudo client-side — sem Cloud Functions

const OWM_API = 'https://api.openweathermap.org/data/2.5'

// Cache para evitar calls repetidos
let weatherCache = { key: null, data: null, ts: 0 }
const CACHE_TTL = 30 * 60 * 1000 // 30 min

/**
 * Buscar weather actual + forecast horário
 * @param {number} lat
 * @param {number} lng
 * @param {string} apiKey — OpenWeatherMap API key (grátis)
 */
export async function fetchWeather(lat, lng, apiKey) {
  const key = `${lat},${lng}`
  if (weatherCache.key === key && Date.now() - weatherCache.ts < CACHE_TTL) {
    return weatherCache.data
  }

  if (!apiKey) {
    return getFallbackWeather()
  }

  try {
    // Current weather
    const currentRes = await fetch(
      `${OWM_API}/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=pt`
    )
    const current = await currentRes.json()

    // 5-day / 3-hour forecast (free tier)
    const forecastRes = await fetch(
      `${OWM_API}/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=pt&cnt=8`
    )
    const forecast = await forecastRes.json()

    const data = {
      current: {
        temp: Math.round(current.main?.temp),
        feelsLike: Math.round(current.main?.feels_like),
        humidity: current.main?.humidity,
        description: current.weather?.[0]?.description || '',
        icon: current.weather?.[0]?.icon || '01d',
        wind: { speed: Math.round((current.wind?.speed || 0) * 3.6), deg: current.wind?.deg },
        clouds: current.clouds?.all,
      },
      hourly: (forecast.list || []).map(h => ({
        time: new Date(h.dt * 1000).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        temp: Math.round(h.main?.temp),
        description: h.weather?.[0]?.description || '',
        icon: h.weather?.[0]?.icon || '01d',
        rain: h.rain?.['3h'] || 0,
        pop: Math.round((h.pop || 0) * 100), // probabilidade de precipitação %
        wind: Math.round((h.wind?.speed || 0) * 3.6),
      })),
      updatedAt: new Date().toISOString(),
    }

    weatherCache = { key, data, ts: Date.now() }
    return data
  } catch (e) {
    console.warn('Weather fetch failed:', e.message)
    return getFallbackWeather()
  }
}

/**
 * Buscar sunrise/sunset + golden hour
 */
export async function fetchSunTimes(lat, lng, date) {
  try {
    const dateStr = date instanceof Date
      ? date.toISOString().split('T')[0]
      : date || new Date().toISOString().split('T')[0]

    const res = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${dateStr}&formatted=0`
    )
    const data = await res.json()

    if (data.status !== 'OK') throw new Error('API error')

    const sunrise = new Date(data.results.sunrise)
    const sunset = new Date(data.results.sunset)
    const goldenHour = new Date(data.results.golden_hour || sunset.getTime() - 60 * 60 * 1000)

    return {
      sunrise: sunrise.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      sunset: sunset.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      goldenHour: goldenHour.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      sunriseRaw: sunrise,
      sunsetRaw: sunset,
      goldenHourRaw: goldenHour,
      dayLength: Math.round((sunset - sunrise) / (60 * 1000)), // minutos
    }
  } catch (e) {
    console.warn('Sun times fetch failed:', e.message)
    return {
      sunrise: '06:15', sunset: '21:00', goldenHour: '20:00',
      dayLength: 885,
    }
  }
}

/**
 * Detectar alertas automáticos (chuva + cenas EXT)
 */
export function detectWeatherAlerts(weather, scenes) {
  const alerts = []

  if (!weather?.hourly) return alerts

  // Encontrar horas com chuva provável
  const rainyHours = weather.hourly.filter(h => h.pop > 50 || h.rain > 0.5)

  if (rainyHours.length > 0) {
    const extScenes = scenes.filter(s =>
      s.intExt?.toUpperCase().includes('EXT')
    )

    if (extScenes.length > 0) {
      alerts.push({
        type: 'rain_ext',
        severity: 'warning',
        message: `Chuva prevista (${rainyHours[0].time}–${rainyHours[rainyHours.length - 1].time}) — ${extScenes.length} cena${extScenes.length > 1 ? 's' : ''} EXT planeada${extScenes.length > 1 ? 's' : ''}`,
        scenes: extScenes.map(s => s.sceneNumber),
        hours: rainyHours,
      })
    }
  }

  // Vento forte
  const windyHours = weather.hourly.filter(h => h.wind > 30)
  if (windyHours.length > 0) {
    alerts.push({
      type: 'wind',
      severity: 'info',
      message: `Vento forte (${windyHours[0].wind}km/h) previsto — confirmar rigs e difusores`,
    })
  }

  return alerts
}

function getFallbackWeather() {
  return {
    current: {
      temp: '--', feelsLike: '--', humidity: '--',
      description: 'Sem dados meteorológicos', icon: '01d',
      wind: { speed: 0, deg: 0 }, clouds: 0,
    },
    hourly: [],
    updatedAt: null,
  }
}

// OWM icon → emoji
export function weatherIcon(iconCode) {
  const map = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '⛅',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '🌨️', '13n': '🌨️',
    '50d': '🌫️', '50n': '🌫️',
  }
  return map[iconCode] || '🌤️'
}
