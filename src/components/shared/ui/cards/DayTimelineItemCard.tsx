import { Calendar, Clock, Film, MapPin } from 'lucide-react'
import { CardShell } from '../primitives/CardShell'
import { CardHeader } from '../primitives/CardHeader'
import { CardBody } from '../primitives/CardBody'
import { CardFooter } from '../primitives/CardFooter'
import { EntityPill } from '../primitives/EntityPill'
import { StatusBadge } from '../primitives/StatusBadge'
import { Divider } from '../primitives/Divider'
import { DayTimeline } from '../timeline/DayTimelineItem'
import { C, T, SP, hexAlpha } from '../tokens'
import type { DayData, DayTimelineItemData } from '../types'
import type { SceneStatus } from '../tokens'

function dayStatus(s?: string): SceneStatus {
  if (s === 'filming') return 'live'
  if (s === 'done')    return 'done'
  if (s === 'hold')    return 'hold'
  return 'todo'
}

export function DayTimelineItemCard({ day, items, onPress }: {
  day: DayData; items?: DayTimelineItemData[]; onPress?: () => void
}) {
  const accent = C.cyan
  const activeIdx = items?.findIndex(it => it.status === 'active') ?? -1

  return (
    <CardShell variant="standard" accentColor={accent} onClick={onPress}>
      <CardHeader
        icon={<Calendar size={14} />}
        title={`DIA ${day.dayNumber}`}
        subtitle={day.date ? new Date(day.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }) : undefined}
        badge={<StatusBadge status={dayStatus(day.status)} size="xs" showLabel={false} />}
        action={
          <div style={{ display: 'flex', gap: 4 }}>
            {day.sceneCount && (
              <EntityPill label={`${day.sceneCount} cenas`} type="scene" color={C.info} size="xs" icon={<Film size={9} />} />
            )}
          </div>
        }
      />

      <CardBody noPad>
        {items && items.length > 0 ? (
          <DayTimeline
            items={items}
            activeIndex={activeIdx >= 0 ? activeIdx : undefined}
            compact
          />
        ) : (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.textTertiary, fontSize: T.sm, padding: SP.section,
          }}>
            Sem eventos programados
          </div>
        )}
      </CardBody>

      <CardFooter>
        {day.callTime && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            <Clock size={11} color={C.textTertiary} />
            <span style={{ fontSize: T.sm, color: C.textSecondary }}>Chamada {day.callTime}</span>
          </div>
        )}
        {day.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} color={C.textTertiary} />
            <span style={{ fontSize: T.sm, color: C.textTertiary, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {day.location}
            </span>
          </div>
        )}
      </CardFooter>
    </CardShell>
  )
}
