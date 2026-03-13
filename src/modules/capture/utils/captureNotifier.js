// captureNotifier.js — Notificações agrupadas por destinatário com batching

// Módulo → responsável a notificar
const MODULE_RECIPIENT = {
  'guarda-roupa':    'Guarda-Roupa',
  'local':           'Assistente de Produção',
  'nota-realizador': 'Realizador',
  'prop':            'Director de Arte',
  'recibo':          'Produtor',
  'casting':         'Director de Casting',
  'referencia':      'Realizador',
}

// Módulo → cor de destaque na notificação
const MODULE_COLOR = {
  'guarda-roupa':    '#A07B2E',
  'local':           '#4F7F3F',
  'nota-realizador': '#6F2EA0',
  'prop':            '#A02E6F',
  'recibo':          '#1E7A6E',
  'casting':         '#2E5FA0',
  'referencia':      '#6F2EA0',
}

/**
 * Cria notificações no store para os destinos de um capture (legacy — chamada directa).
 */
export function notifyCapture(destinations, capturedBy, store, captureInfo = {}) {
  if (!store?.addNotification) return

  const byRecipient = {}
  for (const dest of destinations) {
    if (!dest.success) continue
    const recipient = MODULE_RECIPIENT[dest.module] || dest.module
    if (!byRecipient[recipient]) {
      byRecipient[recipient] = { recipient, modules: [], labels: [], color: null }
    }
    byRecipient[recipient].modules.push(dest.module)
    byRecipient[recipient].labels.push(dest.label)
    byRecipient[recipient].color = MODULE_COLOR[dest.module] || '#2E6FA0'
  }

  for (const { recipient, labels, color } of Object.values(byRecipient)) {
    const tipo = captureInfo.tipo || 'capture'
    const descricao = captureInfo.descricao
      ? captureInfo.descricao.slice(0, 80)
      : 'Novo item capturado'

    store.addNotification({
      type: 'capture',
      title: `Novo capture → ${recipient}`,
      message: `${capturedBy ? `De: ${capturedBy}. ` : ''}${descricao}`,
      destination: labels.join(', '),
      color,
      recipient,
      timestamp: Date.now(),
    })
  }
}

/**
 * Retorna quem vai ser notificado dado um tipo de capture.
 */
export function getRecipientForType(tipo) {
  return MODULE_RECIPIENT[tipo] || 'Equipa'
}

// ── Batched Notifications ─────────────────────────────────────────
// Agrupa notificações em lotes via localStorage para persistência cross-tab.
// Flush automático a cada 30s ou quando 5+ items acumulam.

const BATCH_INTERVAL = 30000 // 30 seconds
const BATCH_MAX = 5
const BUFFER_KEY = 'fb_capture_notif_buffer'

let _batchTimerId = null
let _storeRef = null

/**
 * Regista a referência ao store (chamar uma vez no init).
 */
export function registerStore(storeHook) {
  _storeRef = storeHook
}

/**
 * Adiciona uma notificação ao buffer localStorage para envio agrupado.
 */
export function queueNotification(notification) {
  let buffer
  try { buffer = JSON.parse(localStorage.getItem(BUFFER_KEY) || '[]') } catch { buffer = [] }
  buffer.push({ ...notification, timestamp: Date.now() })
  localStorage.setItem(BUFFER_KEY, JSON.stringify(buffer))

  // Flush if max reached
  if (buffer.length >= BATCH_MAX) {
    flushNotifications()
  }
}

/**
 * Faz flush do buffer — agrupa por destinatário e emite notificações sumarizadas.
 */
export function flushNotifications() {
  let buffer
  try { buffer = JSON.parse(localStorage.getItem(BUFFER_KEY) || '[]') } catch { buffer = [] }
  if (buffer.length === 0) return

  const store = _storeRef?.getState?.()
  if (!store?.addSuggestion && !store?.addNotification) {
    // Clear buffer anyway to prevent infinite growth
    localStorage.setItem(BUFFER_KEY, '[]')
    return
  }

  // Group by recipient
  const groups = {}
  buffer.forEach(n => {
    const key = MODULE_RECIPIENT[n.recipient] || n.recipient || 'geral'
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })

  // Create one summary notification per recipient
  Object.entries(groups).forEach(([recipient, items]) => {
    const types = items.map(i => i.tipo).filter(Boolean)
    const typeCounts = {}
    types.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1 })
    const summary = Object.entries(typeCounts).map(([t, c]) => `${c} ${t}`).join(', ')

    const color = MODULE_COLOR[items[0]?.recipient] || '#2E6FA0'

    // Use addSuggestion for cross-module visibility (preferred)
    if (store.addSuggestion) {
      store.addSuggestion({
        id: `capture_batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'capture',
        from: 'capture',
        to: recipient,
        title: `${items.length} captura${items.length > 1 ? 's' : ''} nova${items.length > 1 ? 's' : ''}`,
        message: summary,
        timestamp: Date.now(),
      })
    }

    // Also add as notification for real-time display
    if (store.addNotification) {
      const count = items.length
      const descricao = count === 1
        ? items[0].descricao || 'Novo item capturado'
        : `${count} novos items: ${summary}`

      store.addNotification({
        type: 'capture',
        title: `Capture → ${recipient}`,
        message: `${items[0].capturedBy ? `De: ${items[0].capturedBy}. ` : ''}${descricao}`,
        destination: items.map(i => i.label).join(', '),
        color,
        recipient,
        timestamp: Date.now(),
      })
    }
  })

  // Clear buffer
  localStorage.setItem(BUFFER_KEY, '[]')
}

/**
 * Inicia o timer de batch — chama flush periodicamente.
 */
export function startBatchTimer() {
  if (_batchTimerId) return
  _batchTimerId = setInterval(flushNotifications, BATCH_INTERVAL)
}

/**
 * Para o timer de batch e faz flush final.
 */
export function stopBatchTimer() {
  if (_batchTimerId) {
    clearInterval(_batchTimerId)
    _batchTimerId = null
  }
  flushNotifications()
}
