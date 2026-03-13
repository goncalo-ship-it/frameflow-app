// whatsapp.js — Mensagens WhatsApp inteligentes
// Gera mensagens contextuais e abre wa.me

/**
 * Limpa número de telefone para formato WhatsApp (só dígitos, com código país).
 */
export function cleanPhone(phone) {
  if (!phone) return null
  let n = phone.replace(/[\s\-\(\)\.]/g, '')
  // Se começa com 00, trocar para +
  if (n.startsWith('00')) n = '+' + n.slice(2)
  // Se não tem +, assumir Portugal
  if (!n.startsWith('+')) n = '+351' + n.replace(/^351/, '')
  return n.replace('+', '')
}

/**
 * Abre WhatsApp com mensagem pré-preenchida.
 * @param {string|null} phone — número (null = escolher contacto)
 * @param {string} message
 */
export function openWhatsApp(phone, message) {
  const clean = phone ? cleanPhone(phone) : null
  const encoded = encodeURIComponent(message)
  const url = clean
    ? `https://wa.me/${clean}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`
  window.open(url, '_blank')
}

/**
 * Mensagem de boas-vindas com link de convite.
 */
export function buildWelcomeMessage({ projectName, roleLabel, inviteLink, memberName }) {
  const firstName = memberName ? memberName.split(' ')[0] : ''
  let msg = firstName ? `Olá ${firstName}!` : 'Olá!'
  msg += `\nBem-vindo/a ao projecto *${projectName}*`
  if (roleLabel) msg += ` como *${roleLabel}*`
  msg += '.'
  if (inviteLink) {
    msg += `\n\nEntra aqui para aceder ao projecto:\n${inviteLink}`
  }
  msg += '\n\nQualquer questão estamos aqui! 🎬'
  return msg
}

/**
 * Mensagem de convocatória do dia seguinte.
 * Inteligente: só inclui o que é relevante.
 */
export function buildCallMessage({ projectName, dayNumber, date, callTime, locations, scenes, weather, wrapEstimate, notes }) {
  let msg = `📋 *${projectName}* — Dia ${dayNumber}`
  if (date) msg += ` (${formatDatePT(date)})`
  msg += '\n'

  // Call time
  if (callTime) msg += `\n⏰ Call: *${callTime}*`
  if (wrapEstimate) msg += ` → Wrap ~${wrapEstimate}`
  msg += '\n'

  // Location(s)
  if (locations?.length > 0) {
    if (locations.length === 1) {
      const loc = locations[0]
      msg += `\n📍 ${loc.name}`
      if (loc.address) msg += `\n   ${loc.address}`
      if (loc.parking) msg += `\n   🅿️ ${loc.parking}`
    } else {
      msg += '\n📍 Locais:'
      for (const loc of locations) {
        msg += `\n   • ${loc.name}`
        if (loc.address) msg += ` — ${loc.address}`
      }
    }
    msg += '\n'
  }

  // Scenes (compact)
  if (scenes?.length > 0) {
    msg += `\n🎬 ${scenes.length} cena${scenes.length > 1 ? 's' : ''}:`
    for (const sc of scenes.slice(0, 8)) {
      let line = `\n   Sc.${sc.number}`
      if (sc.intExt) line += ` ${sc.intExt}`
      if (sc.dayNight) line += `/${sc.dayNight}`
      if (sc.location && locations?.length > 1) line += ` — ${sc.location}`
      msg += line
    }
    if (scenes.length > 8) msg += `\n   +${scenes.length - 8} mais`
    msg += '\n'
  }

  // Weather (só se relevante — EXT ou mau tempo)
  if (weather) {
    const hasExt = scenes?.some(s => s.intExt?.toUpperCase()?.includes('EXT'))
    if (hasExt || weather.alert) {
      msg += `\n🌤 ${weather.description}`
      if (weather.temp) msg += `, ${weather.temp}°C`
      if (weather.alert) msg += `\n⚠️ ${weather.alert}`
      msg += '\n'
    }
  }

  // Notes
  if (notes) msg += `\n📝 ${notes}\n`

  msg += '\nBom dia de rodagem! 🎥'
  return msg
}

/**
 * Mensagem personalizada para actor — só as cenas dele.
 */
export function buildActorCallMessage({ projectName, dayNumber, date, callTime, actorName, characterName, scenes, location }) {
  let msg = `📋 *${projectName}* — Dia ${dayNumber}`
  if (date) msg += ` (${formatDatePT(date)})`
  msg += '\n'

  if (callTime) msg += `\n⏰ Call: *${callTime}*`

  if (location) {
    msg += `\n📍 ${location.name}`
    if (location.address) msg += `\n   ${location.address}`
  }

  if (scenes?.length > 0) {
    msg += `\n\n🎬 As tuas cenas (${characterName || actorName}):`
    for (const sc of scenes) {
      msg += `\n   Sc.${sc.number}`
      if (sc.intExt) msg += ` ${sc.intExt}`
      if (sc.description) msg += ` — ${sc.description.slice(0, 40)}`
    }
  }

  msg += '\n\nBom trabalho! 🎬'
  return msg
}

// ── Helpers ──────────────────────────────────────────────────────

function formatDatePT(dateStr) {
  try {
    const d = new Date(dateStr)
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`
  } catch {
    return dateStr
  }
}
