import { UtensilsCrossed, MapPin, Users, CheckCircle2, Clock } from 'lucide-react'
import { CardShell } from '../primitives/CardShell'
import { CardHeader } from '../primitives/CardHeader'
import { CardBody } from '../primitives/CardBody'
import { CardFooter } from '../primitives/CardFooter'
import { MetaRow } from '../primitives/MetaRow'
import { EntityPill } from '../primitives/EntityPill'
import { Divider } from '../primitives/Divider'
import { C, T, SP, R, hexAlpha } from '../tokens'
import type { MealData } from '../types'

const MEAL_LABEL: Record<string, string> = {
  catering: 'Catering', lunch: 'Almoço', dinner: 'Jantar',
  breakfast: 'Pequeno-almoço', snack: 'Merenda',
}

export function MealCard({ meal, onPress }: { meal: MealData; onPress?: () => void }) {
  return (
    <CardShell variant="standard" accentColor={C.orange} onClick={onPress}>
      <CardHeader
        compact
        icon={<UtensilsCrossed size={14} />}
        title={MEAL_LABEL[meal.type] ?? meal.type}
        subtitle={meal.supplier}
        badge={<EntityPill label={meal.time} type="custom" color={C.orange} size="xs" icon={<Clock size={9} />} />}
      />
      <CardBody>
        {meal.location && <MetaRow label="Local" value={meal.location} icon={<MapPin size={11} />} accentColor={C.purple} />}
        {meal.headcount && <MetaRow label="Pax" value={`${meal.headcount} pessoas`} icon={<Users size={11} />} accentColor={C.emerald} />}

        {meal.menu && meal.menu.length > 0 && (
          <>
            <Divider />
            <div style={{ display: 'flex', flexDirection: 'column', gap: SP.xs }}>
              {meal.menu.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: SP.xs }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: hexAlpha(C.orange, 0.60), flexShrink: 0 }} />
                  <span style={{ fontSize: T.sm, color: C.textSecondary }}>{item}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {meal.notes && (
          <>
            <Divider />
            <div style={{
              padding: SP.xs, borderRadius: R.xs,
              background: hexAlpha(C.warning, 0.08), border: `0.5px solid ${hexAlpha(C.warning, 0.18)}`,
              fontSize: T.sm, color: C.textSecondary,
            }}>{meal.notes}</div>
          </>
        )}
      </CardBody>

      <CardFooter>
        <EntityPill
          label={meal.confirmed ? 'Confirmado' : 'Por confirmar'}
          type="custom"
          color={meal.confirmed ? C.emerald : C.warning}
          size="xs"
          icon={meal.confirmed ? <CheckCircle2 size={9} /> : undefined}
        />
      </CardFooter>
    </CardShell>
  )
}
