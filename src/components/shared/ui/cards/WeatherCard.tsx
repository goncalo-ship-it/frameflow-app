import { Cloud, Wind, Droplets, Sun, Sunrise, Sunset } from 'lucide-react'
import { CardShell } from '../primitives/CardShell'
import { CardHeader } from '../primitives/CardHeader'
import { CardBody } from '../primitives/CardBody'
import { CardFooter } from '../primitives/CardFooter'
import { MetaRow } from '../primitives/MetaRow'
import { EntityPill } from '../primitives/EntityPill'
import { Divider } from '../primitives/Divider'
import { C, T, SP, R, hexAlpha } from '../tokens'
import type { WeatherData } from '../types'

export function WeatherCard({ weather, onPress }: { weather: WeatherData; onPress?: () => void }) {
  return (
    <CardShell variant="standard" accentColor={C.info} onClick={onPress}>
      <CardHeader
        compact
        icon={<Cloud size={14} />}
        title="METEOROLOGIA"
        subtitle={weather.city}
        badge={weather.description ? <EntityPill label={weather.description} type="custom" color={C.info} size="xs" /> : undefined}
      />
      <CardBody>
        {/* Big temperature */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{
            fontSize: T.display, fontWeight: T.black, letterSpacing: '-0.03em', lineHeight: 1,
            background: `linear-gradient(135deg, ${C.textPrimary}, ${hexAlpha(C.textPrimary, 0.70)})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {weather.temp}°
          </div>
          {weather.feelsLike !== undefined && (
            <div style={{ paddingBottom: 8 }}>
              <div style={{ fontSize: T.micro, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>SENTE-SE</div>
              <div style={{ fontSize: T.md, fontWeight: T.bold, color: C.textSecondary }}>{weather.feelsLike}°</div>
            </div>
          )}
        </div>

        {/* Wind + Humidity */}
        <div style={{ display: 'flex', gap: SP.tight }}>
          {weather.wind !== undefined && (
            <MetaRow label="Vento" value={`${weather.wind} km/h`} icon={<Wind size={11} />} accentColor={C.cyan} style={{ flex: 1 }} />
          )}
          {weather.humidity !== undefined && (
            <MetaRow label="Humidade" value={`${weather.humidity}%`} icon={<Droplets size={11} />} accentColor={C.info} style={{ flex: 1 }} />
          )}
        </div>

        {/* Hourly pills */}
        {weather.hourly && weather.hourly.length > 0 && (
          <>
            <Divider />
            <div style={{ display: 'flex', gap: SP.xs, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
              {weather.hourly.map((h, i) => (
                <div key={i} style={{
                  flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: `${SP.xs}px ${SP.tight}px`,
                  background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: R.sm, minWidth: 48,
                }}>
                  <span style={{ fontSize: T.micro, color: C.textTertiary }}>{h.hour}</span>
                  <span style={{ fontSize: T.sm, fontWeight: T.bold, color: C.textPrimary }}>{h.temp}°</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Sunrise / sunset */}
        {(weather.sunrise || weather.sunset) && (
          <>
            <Divider />
            <div style={{ display: 'flex', gap: SP.section }}>
              {weather.sunrise && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Sunrise size={13} color={C.warning} />
                  <span style={{ fontSize: T.sm, color: C.textSecondary }}>{weather.sunrise}</span>
                </div>
              )}
              {weather.sunset && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Sunset size={13} color={C.orange} />
                  <span style={{ fontSize: T.sm, color: C.textSecondary }}>{weather.sunset}</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardBody>

      <CardFooter>
        {weather.uvIndex !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
            <Sun size={11} color={C.warning} />
            <span style={{ fontSize: T.sm, color: C.textSecondary }}>UV {weather.uvIndex}</span>
          </div>
        )}
        {weather.visibility !== undefined && (
          <span style={{ fontSize: T.sm, color: C.textTertiary }}>Visib. {weather.visibility} km</span>
        )}
      </CardFooter>
    </CardShell>
  )
}
