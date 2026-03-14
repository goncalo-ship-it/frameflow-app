/**
 * ScrollArea — Standalone scrollable container with thin styled scrollbar.
 * Use inside CardBody when a sub-section itself needs to scroll independently.
 */

import type { CSSProperties, ReactNode } from 'react'

export interface ScrollAreaProps {
  children: ReactNode
  maxHeight?: number | string
  horizontal?: boolean
  style?: CSSProperties
}

export function ScrollArea({ children, maxHeight, horizontal = false, style }: ScrollAreaProps) {
  return (
    <div style={{
      overflowY: horizontal ? 'hidden' : 'auto',
      overflowX: horizontal ? 'auto' : 'hidden',
      maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255,255,255,0.10) transparent',
      ...style,
    }}>
      {children}
    </div>
  )
}
