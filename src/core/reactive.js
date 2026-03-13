// ReactiveCore Phase 1 — Motor de propagação determinística entre módulos
// Observa mudanças no Zustand store e dispara regras de forma debounced

import { useStore } from './store.js'
import { RULES } from './reactive-rules.js'

let prevState = null
let debounceTimer = null
let paused = false
let initialized = false

export function initReactiveCore() {
  if (initialized) return
  initialized = true

  prevState = useStore.getState()

  useStore.subscribe((next) => {
    if (paused) return
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const prev = prevState
      prevState = next
      processRules(prev, next)
    }, 300)
  })

  console.log('[ReactiveCore] Inicializado com', RULES.length, 'regras')
}

async function processRules(prev, next) {
  const store = useStore.getState()

  for (const rule of RULES) {
    try {
      const payload = rule.detect(prev, next)
      if (!payload) continue

      if (rule.confidence === 'high') {
        // Suporta execute sync e async (ex: geocoding, fetch POIs)
        await Promise.resolve(rule.execute(payload, store))
        // Log no audit
        useStore.getState().addAuditEntry({
          ruleId: rule.id,
          source: rule.source,
          target: rule.target,
          description: rule.description,
          auto: true,
          data: payload,
        })
      } else {
        // Medium confidence → sugestão
        const suggestion = rule.buildSuggestion
          ? rule.buildSuggestion(payload)
          : {
              type: 'reactive',
              source: rule.source,
              target: rule.target,
              title: rule.description,
              ruleId: rule.id,
              data: payload,
            }
        useStore.getState().addSuggestion(suggestion)
      }
    } catch (e) {
      console.warn(`[ReactiveCore] Regra ${rule.id} falhou:`, e)
    }
  }
}

export function pauseReactive() { paused = true }
export function resumeReactive() { paused = false }
