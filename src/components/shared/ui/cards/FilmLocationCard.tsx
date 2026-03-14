import { MapPin, Clock, AlertTriangle, User } from 'lucide-react'
import { CardShell } from '../primitives/CardShell'
import { CardHeader } from '../primitives/CardHeader'
import { CardBody } from '../primitives/CardBody'
import { CardFooter } from '../primitives/CardFooter'
import { MetaRow } from '../primitives/MetaRow'
import { EntityPill } from '../primitives/EntityPill'
import { ActionRow } from '../primitives/ActionRow'
import { Divider } from '../primitives/Divider'
import { C, T, SP, R, hexAlpha } from '../tokens'
import type { LocationData } from '../types'

export function FilmLocationCard({ location, onPress, onMaps }: {
  location: LocationData; onPress?: () => void; onMaps?: () => void
}) {
  const accent = location.accentColor ?? C.purple

  return (
    <CardShell variant="standard" accentColor={accent} onClick={onPress}>
      <CardHeader
        compact
        icon={<MapPin size={14} />}
        title={location.displayName ?? location.name}
        badge={location.city ? <EntityPill label={location.city} type="location" color={accent} size="xs" /> : undefined}
      />
      <CardBody>
        {location.address && <MetaRow label="Morada" value={location.address} icon={<MapPin size={11} />} accentColor={accent} />}
        {location.travelTime && <MetaRow label="Viagem" value={location.travelTime} icon={<Clock size={11} />} accentColor={C.cyan} />}

        {/* Photos strip */}
        {location.photos && location.photos.length > 0 && (
          <>
            <Divider />
            <div style={{ display: 'flex', gap: SP.xs, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {location.photos.slice(0, 5).map((src, i) => (
                <img key={i} src={src} alt="" style={{
                  width: 64, height: 64, borderRadius: R.sm, objectFit: 'cover',
                  flexShrink: 0, border: `0.5px solid rgba(255,255,255,0.10)`,
                }} />
              ))}
            </div>
          </>
        )}

        {/* Restrictions */}
        {location.restrictions && location.restrictions.length > 0 && (
          <>
            <Divider />
            <div style={{ display: 'flex', gap: SP.xs, flexWrap: 'wrap', alignItems: 'center' }}>
              <AlertTriangle size={11} color={C.warning} />
              {location.restrictions.map((r, i) => (
                <EntityPill key={i} label={r} type="custom" color={C.warning} size="xs" />
              ))}
            </div>
          </>
        )}

        {/* Contacts */}
        {location.contacts && location.contacts.length > 0 && (
          <>
            <Divider />
            <div style={{ display: 'flex', alignItems: 'center', gap: SP.xs }}>
              <User size={11} color={C.textTertiary} />
              <span style={{ fontSize: T.sm, color: C.textSecondary }}>{location.contacts[0].name}</span>
              <span style={{ fontSize: T.sm, color: C.textTertiary }}>{location.contacts[0].phone}</span>
            </div>
          </>
        )}
      </CardBody>

      {onMaps && (
        <CardFooter>
          <ActionRow
            justify="end"
            actions={[{ label: 'Abrir no Maps', icon: <MapPin size={12} />, onClick: onMaps, variant: 'primary', accentColor: accent }]}
          />
        </CardFooter>
      )}
    </CardShell>
  )
}
