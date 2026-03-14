import type { CSSProperties } from 'react'
import { GLASS } from '../tokens'

export function Divider({ style }: { style?: CSSProperties }) {
  return (
    <div style={{
      height: 0,
      borderTop: GLASS.divider,
      flexShrink: 0,
      ...style,
    }} />
  )
}
