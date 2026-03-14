/**
 * CardBody — Scrollable content area inside a card.
 *
 * Always scrollable. Content never pushes the card taller.
 * Uses flex:1 to fill remaining height between header and footer.
 */

import type { CSSProperties, ReactNode } from 'react'
import { SP } from '../tokens'

export interface CardBodyProps {
  children: ReactNode
  /** Disable internal padding (for full-bleed content like images) */
  noPad?: boolean
  style?: CSSProperties
}

const SCROLLBAR_CSS = `
  .ff-card-body::-webkit-scrollbar { width: 3px; }
  .ff-card-body::-webkit-scrollbar-track { background: transparent; }
  .ff-card-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 999px; }
`

// Inject scrollbar styles once
if (typeof document !== 'undefined' && !document.getElementById('ff-card-body-scroll')) {
  const el = document.createElement('style')
  el.id = 'ff-card-body-scroll'
  el.textContent = SCROLLBAR_CSS
  document.head.appendChild(el)
}

export function CardBody({ children, noPad = false, style }: CardBodyProps) {
  return (
    <div
      className="ff-card-body"
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: noPad ? 0 : `${SP.section}px ${SP.card}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: SP.gap,
        minHeight: 0, // critical: lets flex child shrink below content size
        boxSizing: 'border-box',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.10) transparent',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
