// useCaptureInbox.js — Acesso ao inbox de captures não classificados

import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'

/**
 * Hook para gerir o inbox de captures.
 * Expõe lista de items com status 'inbox' e acções sobre eles.
 */
export function useCaptureInbox() {
  const {  captures = [], updateCapture, removeCapture  } = useStore(useShallow(s => ({ captures: s.captures || [], updateCapture: s.updateCapture, removeCapture: s.removeCapture })))

  // Apenas os que estão no inbox, ordenados por mais recente
  const inbox = captures
    .filter(c => c.status === 'inbox')
    .sort((a, b) => (b.capturedAt || 0) - (a.capturedAt || 0))

  /**
   * Marca um capture como 'classifying' para retomar o fluxo de perguntas.
   * O estado questioning é tratado pelo useCapture, este apenas sinaliza.
   */
  const classifyItem = (id) => {
    updateCapture(id, { status: 'classifying' })
  }

  /**
   * Dispensa um capture do inbox (remove-o do store).
   */
  const dismissItem = (id) => {
    removeCapture(id)
  }

  return {
    inbox,
    classifyItem,
    dismissItem,
  }
}
