import { Home, Car, Plus, Zap, Building, MapPin } from 'lucide-react'
import { CardShell } from '../primitives/CardShell'
import { C, T, SP, R, hexAlpha } from '../tokens'
import type { LogisticsPointData } from '../types'
import type { ReactNode } from 'react'

const TYPE_ICON: Record<string, ReactNode> = {
  basecamp: <Home size={14} />, parking: <Car size={14} />,
  hospital: <Plus size={14} />, fuel: <Zap size={14} />,
  hotel: <Building size={14} />, custom: <MapPin size={14} />,
}
const TYPE_LABEL: Record<string, string> = {
  basecamp: 'Base', parking: 'Parque', hospital: 'Hospital',
  fuel: 'Combustível', hotel: 'Hotel', custom: 'Ponto',
}

export function LogisticsPointCard({ point, onPress }: { point: LogisticsPointData; onPress?: () => void }) {
  return (
    <CardShell variant="compact" accentColor={C.cyan} onClick={onPress}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: SP.gap,
        height: '100%', padding: `0 ${SP.section}px`,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: R.sm, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: hexAlpha(C.cyan, 0.15), border: `0.5px solid ${hexAlpha(C.cyan, 0.30)}`,
          color: C.cyan,
        }}>{TYPE_ICON[point.type] ?? TYPE_ICON.custom}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SP.xs }}>
            <span style={{ fontSize: T.micro, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {TYPE_LABEL[point.type] ?? 'Ponto'}
            </span>
            {point.distance && (
              <span style={{ fontSize: T.micro, color: C.cyan, fontWeight: T.bold }}>{point.distance}</span>
            )}
          </div>
          <div style={{ fontSize: T.sm, fontWeight: T.semibold, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {point.label}
          </div>
          {point.address && (
            <div style={{ fontSize: T.micro, color: C.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {point.address}
            </div>
          )}
        </div>

        {point.phone && (
          <span style={{ fontSize: T.micro, color: C.textTertiary, flexShrink: 0 }}>{point.phone}</span>
        )}
      </div>
    </CardShell>
  )
}
