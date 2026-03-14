/**
 * DayTimelineItem — Reusable timeline row for daily production flow.
 * Types: scene | meal | move | break | call | wrap | technical
 */

import { Film, UtensilsCrossed, Car, Coffee, Bell, CheckCircle2, Wrench } from 'lucide-react'
import { C, T, SP, R, ENTITY_COLOR, hexAlpha } from '../tokens'
import type { DayTimelineItemData, DayTimelineItemType } from '../types'
import type { CSSProperties, ReactNode } from 'react'

const TYPE_CONFIG: Record<DayTimelineItemType, { icon: ReactNode; color: string }> = {
  scene:     { icon: <Film size={14} />,            color: ENTITY_COLOR.scene },
  meal:      { icon: <UtensilsCrossed size={14} />, color: ENTITY_COLOR.meal },
  move:      { icon: <Car size={14} />,             color: ENTITY_COLOR.move },
  break:     { icon: <Coffee size={14} />,          color: ENTITY_COLOR.break },
  call:      { icon: <Bell size={14} />,            color: ENTITY_COLOR.call },
  wrap:      { icon: <CheckCircle2 size={14} />,    color: ENTITY_COLOR.wrap },
  technical: { icon: <Wrench size={14} />,          color: ENTITY_COLOR.technical },
}

export interface DayTimelineItemProps {
  item: DayTimelineItemData
  isActive?: boolean
  isDone?: boolean
  isLast?: boolean
  compact?: boolean
  onClick?: () => void
}

export function DayTimelineItem({ item, isActive=false, isDone=false, isLast=false, compact=false, onClick }: DayTimelineItemProps) {
  const cfg    = TYPE_CONFIG[item.type]
  const accent = item.accentColor ?? cfg.color
  const h      = compact ? 56 : 72

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: SP.gap,
        padding: `0 ${SP.section}px`, height: h, position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        background: isActive ? hexAlpha(accent, 0.06) : 'transparent',
        borderRadius: R.md, transition: 'background 0.15s',
      }}
    >
      {/* Timeline column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28, height: '100%' }}>
        <div style={{ width: 2, flex: 1, background: isDone ? hexAlpha(accent, 0.50) : 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: isActive || isDone ? hexAlpha(accent, 0.18) : 'rgba(255,255,255,0.05)',
          border: `1.5px solid ${isActive || isDone ? hexAlpha(accent, 0.45) : 'rgba(255,255,255,0.10)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isActive || isDone ? accent : 'rgba(255,255,255,0.28)',
          boxShadow: isActive ? `0 0 12px ${hexAlpha(accent, 0.30)}` : 'none',
          transition: 'all 0.15s', flexShrink: 0, zIndex: 1,
        }}>{cfg.icon}</div>
        {!isLast && <div style={{ width: 2, flex: 1, background: isDone ? hexAlpha(accent, 0.50) : 'rgba(255,255,255,0.06)', borderRadius: 1 }} />}
      </div>

      {/* Time */}
      <div style={{ flexShrink: 0, width: 38, textAlign: 'right' }}>
        <div style={{ fontSize: T.sm, fontWeight: T.bold, color: isActive ? accent : C.textSecondary, fontVariantNumeric: 'tabular-nums' as any }}>
          {item.time}
        </div>
        {item.duration && (
          <div style={{ fontSize: T.micro, color: C.textTertiary, marginTop: 2 }}>{item.duration}m</div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: compact ? T.sm : T.base, fontWeight: T.semibold,
          color: isActive ? C.textPrimary : C.textSecondary,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{item.label}</div>
        {item.sublabel && (
          <div style={{ fontSize: T.sm, color: C.textTertiary, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.sublabel}
          </div>
        )}
      </div>

      {/* Status dot */}
      <div style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: isDone ? C.emerald : isActive ? accent : 'rgba(255,255,255,0.12)',
        boxShadow: isActive ? `0 0 8px ${hexAlpha(accent, 0.6)}` : 'none',
      }} />
    </div>
  )
}

export interface DayTimelineProps {
  items: DayTimelineItemData[]
  activeIndex?: number
  compact?: boolean
  onItemClick?: (item: DayTimelineItemData, index: number) => void
  style?: CSSProperties
}

export function DayTimeline({ items, activeIndex, compact=false, onItemClick, style }: DayTimelineProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {items.map((item, i) => (
        <DayTimelineItem
          key={item.id ?? i}
          item={item}
          isActive={i === activeIndex}
          isDone={activeIndex !== undefined && i < activeIndex}
          isLast={i === items.length - 1}
          compact={compact}
          onClick={onItemClick ? () => onItemClick(item, i) : undefined}
        />
      ))}
    </div>
  )
}
