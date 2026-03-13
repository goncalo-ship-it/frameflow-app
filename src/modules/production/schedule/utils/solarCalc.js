// Cálculo de Golden Hour via sunrise-sunset.org
// Cache por string de data para evitar chamadas redundantes

const cache = new Map()

const FALLBACK = {
  goldenHour: '19:30',
  sunset:     '21:00',
}

// Lisboa / Oeiras — coordenadas por defeito
const DEFAULT_LAT = 38.69
const DEFAULT_LON = -9.30

/**
 * Busca o sunset e golden hour para uma data e local.
 * Golden hour = 90 minutos antes do sunset.
 * @param {string} date — formato 'YYYY-MM-DD'
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ goldenHour: string, sunset: string }>}
 */
export async function getSunset(date, lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const key = `${date}_${lat}_${lon}`

  if (cache.has(key)) return cache.get(key)

  try {
    const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${date}&formatted=0`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    if (data.status !== 'OK') throw new Error('API status not OK')

    const sunsetDate = new Date(data.results.sunset)
    const goldenDate = new Date(sunsetDate.getTime() - 90 * 60 * 1000)

    const result = {
      sunset:     sunsetDate.toTimeString().slice(0, 5),
      goldenHour: goldenDate.toTimeString().slice(0, 5),
      raw: {
        sunrise: data.results.sunrise,
        sunset:  data.results.sunset,
      },
    }

    cache.set(key, result)
    return result
  } catch (err) {
    console.warn('[solarCalc] Fallback usado:', err.message)
    const fallback = { ...FALLBACK, fromFallback: true }
    cache.set(key, fallback)
    return fallback
  }
}

/**
 * Versão síncrona — retorna do cache ou o fallback.
 * Para usar em contextos onde não é possível await.
 */
export function getSunsetSync(date, lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const key = `${date}_${lat}_${lon}`
  return cache.get(key) || { ...FALLBACK, fromFallback: true, pending: true }
}

/**
 * Pré-aquece o cache para uma lista de datas.
 */
export async function prewarmSolarCache(dates, lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const unique = [...new Set(dates.filter(Boolean))]
  await Promise.allSettled(unique.map(d => getSunset(d, lat, lon)))
}

export { FALLBACK as SOLAR_FALLBACK }
