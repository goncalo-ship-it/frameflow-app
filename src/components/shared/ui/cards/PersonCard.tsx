import { User, Phone, Mail, Clock } from 'lucide-react'
import { CardShell } from '../primitives/CardShell'
import { CardHeader } from '../primitives/CardHeader'
import { CardBody } from '../primitives/CardBody'
import { CardFooter } from '../primitives/CardFooter'
import { MetaRow } from '../primitives/MetaRow'
import { StatusBadge } from '../primitives/StatusBadge'
import { ActionRow } from '../primitives/ActionRow'
import { Divider } from '../primitives/Divider'
import { C, T, SP, R, hexAlpha } from '../tokens'
import type { PersonData } from '../types'
import type { SceneStatus } from '../tokens'

function statusFromPerson(s?: string): SceneStatus {
  if (s === 'confirmed') return 'done'
  if (s === 'absent')    return 'blocked'
  return 'todo'
}

function initials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

export function PersonCard({ person, onPress, onCall }: {
  person: PersonData; onPress?: () => void; onCall?: () => void
}) {
  const status = statusFromPerson(person.status)

  const avatar = person.photo
    ? <img src={person.photo} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${hexAlpha(C.emerald, 0.30)}` }} />
    : (
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${C.emerald}, #059669)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: T.sm, fontWeight: T.bold, color: '#fff',
        boxShadow: `0 2px 8px ${hexAlpha(C.emerald, 0.35)}`,
      }}>
        {initials(person.name)}
      </div>
    )

  return (
    <CardShell variant="standard" accentColor={C.emerald} onClick={onPress}>
      <CardHeader
        compact
        icon={avatar}
        title={person.name}
        subtitle={person.role ?? person.group}
        badge={person.status ? <StatusBadge status={status} size="xs" showLabel={false} /> : undefined}
      />
      <CardBody>
        {person.character && <MetaRow label="Personagem" value={person.character} icon={<User size={11} />} accentColor={C.emerald} />}
        {person.department && <MetaRow label="Dept" value={person.department} accentColor={C.orange} />}
        {person.callTime && <MetaRow label="Chamada" value={person.callTime} icon={<Clock size={11} />} accentColor={C.cyan} />}
        {person.phone && <MetaRow label="Telefone" value={person.phone} icon={<Phone size={11} />} />}
        {person.email && <MetaRow label="Email" value={person.email} icon={<Mail size={11} />} />}
        {person.cacheDiario && (
          <MetaRow label="Cachê" value={`€ ${person.cacheDiario.toFixed(2)}`} accentColor={C.warning} />
        )}
      </CardBody>
      {(onCall || onPress) && (
        <CardFooter>
          <ActionRow
            justify="end"
            actions={[
              ...(onCall ? [{ label: 'Ligar', icon: <Phone size={12} />, onClick: onCall, variant: 'primary' as const, accentColor: C.emerald }] : []),
              ...(onPress ? [{ label: 'Perfil', onClick: onPress, variant: 'ghost' as const }] : []),
            ]}
          />
        </CardFooter>
      )}
    </CardShell>
  )
}
