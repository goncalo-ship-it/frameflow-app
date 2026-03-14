import { CheckCircle2, AlertCircle } from 'lucide-react'
import { CardShell } from '../primitives/CardShell'
import { CardHeader } from '../primitives/CardHeader'
import { CardBody } from '../primitives/CardBody'
import { CardFooter } from '../primitives/CardFooter'
import { EntityPill } from '../primitives/EntityPill'
import { SectionHeader } from '../primitives/SectionHeader'
import { Divider } from '../primitives/Divider'
import { C, T, SP, R, hexAlpha } from '../tokens'
import type { DepartmentStatusData } from '../types'

function RadialProgress({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? value / max : 0
  const r = 28, cx = 34, cy = 34, stroke = 4
  const circumference = 2 * Math.PI * r
  const dash = circumference * pct

  return (
    <svg width={68} height={68} viewBox="0 0 68 68">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 14, fontWeight: 700, fill: color }}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

export function DepartmentStatusCard({ dept, onPress }: { dept: DepartmentStatusData; onPress?: () => void }) {
  const accent = dept.color
  const allReady = dept.readyCount === dept.totalCount

  return (
    <CardShell variant="standard" accentColor={accent} onClick={onPress}>
      <CardHeader
        compact
        icon={
          <div style={{
            width: 28, height: 28, borderRadius: R.xs,
            background: hexAlpha(accent, 0.18), border: `0.5px solid ${hexAlpha(accent, 0.35)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: T.sm, fontWeight: T.black, color: accent,
          }}>
            {dept.label[0]?.toUpperCase()}
          </div>
        }
        title={dept.label}
        badge={
          <EntityPill
            label={allReady ? 'Pronto' : 'Pendente'}
            type="custom"
            color={allReady ? C.emerald : C.warning}
            size="xs"
            icon={allReady ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
          />
        }
      />

      <CardBody>
        {/* Progress ring + counts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SP.section }}>
          <RadialProgress value={dept.readyCount} max={dept.totalCount} color={accent} />
          <div>
            <div style={{ fontSize: T.h2, fontWeight: T.black, color: C.textPrimary, lineHeight: 1 }}>
              {dept.readyCount}
              <span style={{ fontSize: T.base, color: C.textTertiary, fontWeight: T.medium }}>/{dept.totalCount}</span>
            </div>
            <div style={{ fontSize: T.sm, color: C.textTertiary, marginTop: 3 }}>itens prontos</div>
            {dept.hod && (
              <div style={{ fontSize: T.sm, color: C.textSecondary, marginTop: 6 }}>
                HoD: <span style={{ color: C.textPrimary, fontWeight: T.semibold }}>{dept.hod.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pending items */}
        {dept.pendingItems && dept.pendingItems.length > 0 && (
          <>
            <Divider />
            <SectionHeader title="Pendente" icon={<AlertCircle size={11} />} accentColor={C.warning} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: SP.xs }}>
              {dept.pendingItems.slice(0, 3).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: SP.xs }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: hexAlpha(C.warning, 0.60), flexShrink: 0 }} />
                  <span style={{ fontSize: T.sm, color: C.textSecondary }}>{item}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardBody>

      <CardFooter>
        <span style={{ flex: 1, fontSize: T.sm, color: C.textTertiary }}>
          {dept.totalCount - dept.readyCount} item{dept.totalCount - dept.readyCount !== 1 ? 's' : ''} em falta
        </span>
      </CardFooter>
    </CardShell>
  )
}
