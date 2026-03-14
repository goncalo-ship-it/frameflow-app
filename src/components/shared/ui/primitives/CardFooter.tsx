/**
 * CardFooter — Fixed bottom action bar inside a card.
 * Never scrolls. Sits below CardBody.
 */

import type { CSSProperties, ReactNode } from 'react'
import { GLASS, SP } from '../tokens'

export interface CardFooterProps {
  children: ReactNode
  noBorder?: boolean
  style?: CSSProperties
}

export function CardFooter({ children, noBorder = false, style }: CardFooterProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SP.tight,
        padding: `${SP.tight}px ${SP.card}px`,
        height: 44,
        flexShrink: 0,
        borderTop: noBorder ? 'none' : GLASS.divider,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
