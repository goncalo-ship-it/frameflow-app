/**
 * SceneCard — Canonical scene entity card.
 *
 * ONE component, six variants:
 *   dashboard  — standard 360px, full context
 *   callsheet  — 360px, call time prominent
 *   schedule   — 360px, strip board style, location accent
 *   dailies    — 360px, take grid focus
 *   live       — 72px, real-time cockpit row
 *   detail     — 520px, full context with all sections
 *
 * Props-only — no store imports.
 */

import { Film, MapPin, Clock, Users, CheckCircle2, Circle,
         ChevronRight, Camera, ExternalLink } from 'lucide-react'
import { CardShell }    from '../primitives/CardShell'
import { CardHeader }   from '../primitives/CardHeader'
import { CardBody }     from '../primitives/CardBody'
import { CardFooter }   from '../primitives/CardFooter'
import { StatusBadge }  from '../primitives/StatusBadge'
import { EntityPill }   from '../primitives/EntityPill'
import { MetaRow }      from '../primitives/MetaRow'
import { SectionHeader }from '../primitives/SectionHeader'
import { Divider }      from '../primitives/Divider'
import { IconBadge }    from '../primitives/IconBadge'
import {
  C, T, SP, R, GLASS, ENTITY_COLOR, DEPT_COLOR,
  hexAlpha, accentBg, accentBorder,
} from '../tokens'
import type { SceneData, SceneCardVariant, TakeData, DeptItem } from '../types'
import type { SceneStatus } from '../tokens'
import type { MouseEvent, CSSProperties } from 'react'

// ── Helpers ───────────────────────────────────────────────────────

function sceneStatus(takes?: TakeData[]): SceneStatus {
  if (!takes || takes.length === 0) return 'todo'
  if (takes.some(t => t.status === 'REC'))  return 'live'
  if (takes.some(t => t.status === 'BOM'))  return 'done'
  return 'progress'
}

function bomCount(takes: TakeData[] = []) { return takes.filter(t => t.status === 'BOM').length }
function ngCount(takes:  TakeData[] = []) { return takes.filter(t => t.status === 'NG').length }

function durationLabel(eighths?: number): string {
  if (!eighths) return ''
  const mins = Math.round((eighths / 8) * 1.5)
  return mins > 0 ? `${mins}m` : `${eighths}/8`
}

// ── Sub-components ────────────────────────────────────────────────

function TakeBar({ takes = [] }: { takes: TakeData[] }) {
  if (takes.length === 0) {
    return (
      <div style={{
        height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)',
        marginTop: 4,
      }} />
    )
  }
  return (
    <div style={{ display: 'flex', gap: 2, height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      {takes.map(t => {
        const col = t.status === 'BOM' ? C.emerald
          : t.status === 'REC' ? C.pink
          : t.status === 'NG'  ? C.error
          : C.info
        return <div key={t.id} style={{ flex: 1, background: col, borderRadius: 1 }} />
      })}
    </div>
  )
}

function CharPills({ characters = [], max = 3, accent = C.emerald }: {
  characters: string[]; max?: number; accent?: string
}) {
  const shown  = characters.slice(0, max)
  const rest   = characters.length - max
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
      {shown.map(c => (
        <EntityPill key={c} label={c} type="person" color={accent} size="xs" />
      ))}
      {rest > 0 && (
        <span style={{ fontSize: T.micro, color: C.textTertiary }}>+{rest}</span>
      )}
    </div>
  )
}

function DeptReadiness({ items = [] }: { items: DeptItem[] }) {
  const depts = [...new Set(items.map(i => i.department))].slice(0, 5)
  if (depts.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {depts.map(dept => {
        const deptItems = items.filter(i => i.department === dept)
        const allOk = deptItems.every(i => i.approved)
        const color = DEPT_COLOR[dept] ?? C.textTertiary
        return (
          <div
            key={dept}
            title={`${dept} — ${allOk ? 'pronto' : 'pendente'}`}
            style={{
              width: 20, height: 20, borderRadius: '50%',
              background: allOk ? hexAlpha(color, 0.20) : 'rgba(255,255,255,0.05)',
              border: `1px solid ${allOk ? hexAlpha(color, 0.50) : 'rgba(255,255,255,0.10)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {allOk
              ? <CheckCircle2 size={10} color={color} />
              : <Circle size={10} color="rgba(255,255,255,0.20)" />
            }
          </div>
        )
      })}
    </div>
  )
}

// ── Take item row (for dailies / detail variants) ─────────────────
function TakeRow({ take }: { take: TakeData }) {
  const col = take.status === 'BOM' ? C.emerald
    : take.status === 'REC' ? C.pink
    : take.status === 'NG'  ? C.error
    : C.info

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: SP.tight,
      padding: `${SP.xs}px ${SP.tight}px`,
      borderRadius: R.sm,
      background: hexAlpha(col, 0.08),
      border: `0.5px solid ${hexAlpha(col, 0.20)}`,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: col, flexShrink: 0,
        boxShadow: `0 0 6px ${hexAlpha(col, 0.6)}`,
      }} />
      <span style={{ fontSize: T.sm, fontWeight: T.bold, color: col, minWidth: 28 }}>
        T{take.number}
      </span>
      <span style={{ fontSize: T.sm, fontWeight: T.bold, color: col, flexShrink: 0 }}>
        {take.status}
      </span>
      {take.notes && (
        <span style={{
          fontSize: T.sm, color: C.textSecondary,
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {take.notes}
        </span>
      )}
      {take.timestamp && (
        <span style={{ fontSize: T.micro, color: C.textTertiary, flexShrink: 0 }}>
          {take.timestamp}
        </span>
      )}
    </div>
  )
}

// ── Variant: DASHBOARD ────────────────────────────────────────────
function DashboardVariant({ scene, onPress, highlighted }: { scene: SceneData; onPress?: () => void; highlighted?: boolean }) {
  const status  = sceneStatus(scene.takes)
  const accent  = scene.locationColor ?? ENTITY_COLOR.scene
  const bom     = bomCount(scene.takes)
  const total   = scene.takes?.length ?? 0

  return (
    <CardShell variant="standard" accentColor={accent} onClick={onPress ? () => onPress() : undefined}>
      <CardHeader
        compact
        icon={
          scene.thumbnailUrl
            ? <img src={scene.thumbnailUrl} alt="" style={{ width: 28, height: 28, borderRadius: R.xs, objectFit: 'cover', flexShrink: 0 }} />
            : <Film size={14} />
        }
        title={`SC ${scene.sceneNumber}`}
        subtitle={scene.epId}
        badge={<StatusBadge status={status} size="xs" showLabel={false} />}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {highlighted && (
              <EntityPill label="PRÓXIMA" type="custom" color={C.emerald} size="xs" />
            )}
            {total > 0 && (
              <span style={{ fontSize: T.micro, color: bom > 0 ? C.emerald : C.textTertiary }}>
                {bom}/{total}
              </span>
            )}
            <EntityPill
              label={scene.intExt ?? 'INT'}
              type="scene"
              color={accent}
              size="xs"
            />
          </div>
        }
      />

      <CardBody>
        {/* Location + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {scene.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} color={C.textTertiary} />
              <span style={{ fontSize: T.sm, color: C.textPrimary, fontWeight: T.semibold }}>
                {scene.location}
              </span>
            </div>
          )}
          {scene.timeOfDay && (
            <EntityPill label={scene.timeOfDay} type="custom" color={C.warning} size="xs" />
          )}
          {scene.duration && (
            <span style={{ fontSize: T.micro, color: C.textTertiary }}>
              {durationLabel(scene.duration)}
            </span>
          )}
        </div>

        {/* Description */}
        {scene.description && (
          <p style={{
            fontSize: T.sm,
            color: C.textSecondary,
            lineHeight: T.leading,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
          }}>
            {scene.description}
          </p>
        )}

        {/* Characters */}
        {(scene.characters?.length ?? 0) > 0 && (
          <>
            <Divider />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={11} color={C.textTertiary} />
              <CharPills characters={scene.characters!} max={4} accent={C.emerald} />
            </div>
          </>
        )}

        {/* Takes bar */}
        {(scene.takes?.length ?? 0) > 0 && (
          <>
            <Divider />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: T.micro, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: T.wider }}>
                  TAKES
                </span>
                <span style={{ fontSize: T.micro, color: bom > 0 ? C.emerald : C.textTertiary }}>
                  {bom} BOM · {ngCount(scene.takes)} NG
                </span>
              </div>
              <TakeBar takes={scene.takes} />
            </div>
          </>
        )}

        {/* Dept readiness */}
        {(scene.departmentItems?.length ?? 0) > 0 && (
          <>
            <Divider />
            <DeptReadiness items={scene.departmentItems!} />
          </>
        )}
      </CardBody>

      <CardFooter>
        {scene.callTime && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            <Clock size={11} color={C.textTertiary} />
            <span style={{ fontSize: T.sm, color: C.textSecondary }}>{scene.callTime}</span>
          </div>
        )}
        {onPress && (
          <button
            onClick={onPress}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: T.sm, color: accent, fontWeight: T.semibold,
            }}
          >
            Detalhes <ChevronRight size={12} />
          </button>
        )}
      </CardFooter>
    </CardShell>
  )
}

// ── Variant: SCHEDULE ─────────────────────────────────────────────
function ScheduleVariant({ scene, onPress }: { scene: SceneData; onPress?: () => void }) {
  const accent  = scene.locationColor ?? ENTITY_COLOR.scene
  const status  = sceneStatus(scene.takes)
  const bom     = bomCount(scene.takes)
  const total   = scene.takes?.length ?? 0

  return (
    <CardShell
      variant="standard"
      accentColor={accent}
      accentGradient={`linear-gradient(160deg, ${hexAlpha(accent, 0.12)} 0%, transparent 60%)`}
      onClick={onPress ? () => onPress() : undefined}
    >
      <CardHeader
        compact
        title={`SC ${scene.sceneNumber}`}
        subtitle={scene.epId}
        badge={<StatusBadge status={status} size="xs" showLabel={false} />}
        icon={<Film size={14} />}
      />

      <CardBody>
        {/* Location — large */}
        {scene.location && (
          <div>
            <div style={{
              fontSize: T.h2,
              fontWeight: T.black,
              color: C.textPrimary,
              letterSpacing: T.tight,
              lineHeight: T.leadingTight,
            }}>
              {scene.location}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <EntityPill label={scene.intExt ?? 'INT'} type="custom" color={accent} size="xs" />
              {scene.timeOfDay && (
                <EntityPill label={scene.timeOfDay} type="custom" color={C.warning} size="xs" />
              )}
              {scene.duration && (
                <EntityPill label={durationLabel(scene.duration)} type="custom" color={C.textTertiary} size="xs" />
              )}
            </div>
          </div>
        )}

        {/* Characters */}
        {(scene.characters?.length ?? 0) > 0 && (
          <>
            <Divider />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={11} color={C.textTertiary} />
              <CharPills characters={scene.characters!} max={3} accent={C.emerald} />
            </div>
          </>
        )}

        {/* Takes summary */}
        {(scene.takes?.length ?? 0) > 0 && (
          <>
            <Divider />
            <div>
              <TakeBar takes={scene.takes} />
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginTop: 4,
                fontSize: T.micro, color: C.textTertiary,
              }}>
                <span>{total} takes</span>
                <span style={{ color: bom > 0 ? C.emerald : C.textTertiary }}>
                  {bom} BOM
                </span>
              </div>
            </div>
          </>
        )}

        {/* Dept readiness */}
        {(scene.departmentItems?.length ?? 0) > 0 && (
          <>
            <Divider />
            <DeptReadiness items={scene.departmentItems!} />
          </>
        )}
      </CardBody>

      {scene.callTime && (
        <CardFooter>
          <Clock size={11} color={C.textTertiary} />
          <span style={{ fontSize: T.sm, color: C.textSecondary, flex: 1 }}>
            {scene.callTime}
          </span>
        </CardFooter>
      )}
    </CardShell>
  )
}

// ── Variant: CALLSHEET ────────────────────────────────────────────
function CallsheetVariant({ scene, onPress }: { scene: SceneData; onPress?: () => void }) {
  const accent = ENTITY_COLOR.scene

  return (
    <CardShell variant="standard" accentColor={accent} onClick={onPress ? () => onPress() : undefined}>
      {/* Call time — very prominent */}
      {scene.callTime && (
        <div style={{
          padding: `${SP.section}px ${SP.card}px 0`,
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: T.display,
            fontWeight: T.black,
            color: C.textPrimary,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            background: `linear-gradient(135deg, ${C.textPrimary}, ${hexAlpha(C.textPrimary, 0.7)})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {scene.callTime}
          </div>
          <div style={{
            fontSize: T.sm, color: C.textTertiary, marginTop: 2,
            letterSpacing: T.wider, textTransform: 'uppercase', fontWeight: T.bold,
          }}>
            CHAMADA
          </div>
        </div>
      )}

      <CardHeader
        compact
        noBorder
        title={`Cena ${scene.sceneNumber}`}
        subtitle={`${scene.intExt ?? ''} · ${scene.location ?? ''} · ${scene.timeOfDay ?? ''}`}
        icon={<Film size={14} />}
      />

      <CardBody>
        {scene.description && (
          <p style={{
            fontSize: T.base, color: C.textSecondary,
            lineHeight: T.leading, margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
          }}>
            {scene.description}
          </p>
        )}

        {(scene.characters?.length ?? 0) > 0 && (
          <>
            <Divider />
            <SectionHeader title="Personagens" icon={<Users size={11} />} accentColor={C.emerald} />
            <CharPills characters={scene.characters!} max={8} accent={C.emerald} />
          </>
        )}

        {scene.notes && (
          <>
            <Divider />
            <div style={{
              padding: SP.tight,
              background: hexAlpha(C.warning, 0.08),
              border: `0.5px solid ${hexAlpha(C.warning, 0.20)}`,
              borderRadius: R.sm,
              fontSize: T.sm,
              color: C.textSecondary,
              lineHeight: T.leading,
            }}>
              {scene.notes}
            </div>
          </>
        )}
      </CardBody>

      {scene.location && (
        <CardFooter>
          <MapPin size={11} color={C.textTertiary} />
          <span style={{ fontSize: T.sm, color: C.textSecondary, flex: 1 }}>
            {scene.location}
          </span>
        </CardFooter>
      )}
    </CardShell>
  )
}

// ── Variant: DAILIES ──────────────────────────────────────────────
function DailiesVariant({ scene, onPress }: { scene: SceneData; onPress?: () => void }) {
  const takes = scene.takes ?? []
  const bom   = bomCount(takes)

  return (
    <CardShell variant="standard" accentColor={C.purple}>
      <CardHeader
        compact
        icon={<Camera size={14} />}
        title={`SC ${scene.sceneNumber}`}
        subtitle={scene.location}
        badge={
          <div style={{ display: 'flex', gap: 4 }}>
            <EntityPill label={`${bom} BOM`} type="custom" color={C.emerald} size="xs" />
            <EntityPill label={`${takes.length - bom} NG`} type="custom" color={C.error} size="xs" />
          </div>
        }
      />

      <CardBody>
        {takes.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.textTertiary, fontSize: T.sm,
          }}>
            Sem takes registados
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SP.xs }}>
            {takes.map(t => <TakeRow key={t.id} take={t} />)}
          </div>
        )}
      </CardBody>

      <CardFooter>
        <span style={{ flex: 1, fontSize: T.sm, color: C.textTertiary }}>
          {takes.length} takes · {durationLabel(scene.duration)}
        </span>
        {onPress && (
          <button
            onClick={onPress}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: T.sm, color: C.purple, fontWeight: T.semibold,
            }}
          >
            Ver <ExternalLink size={11} />
          </button>
        )}
      </CardFooter>
    </CardShell>
  )
}

// ── Variant: LIVE ─────────────────────────────────────────────────
function LiveVariant({ scene, onBOM, onNG }: {
  scene: SceneData
  onBOM?: () => void
  onNG?: () => void
}) {
  const status  = sceneStatus(scene.takes)
  const accent  = scene.locationColor ?? ENTITY_COLOR.scene
  const bom     = bomCount(scene.takes)
  const total   = scene.takes?.length ?? 0

  return (
    <CardShell variant="live" accentColor={accent}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: SP.gap,
        height: '100%',
        padding: `0 ${SP.section}px`,
      }}>
        {/* Status dot */}
        <StatusBadge status={status} showLabel={false} size="xs" />

        {/* Scene number */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: T.sm, fontWeight: T.black, color: C.textPrimary }}>
            SC {scene.sceneNumber}
          </div>
          {scene.epId && (
            <div style={{ fontSize: T.micro, color: C.textTertiary }}>{scene.epId}</div>
          )}
        </div>

        {/* Location */}
        {scene.location && (
          <div style={{
            flex: 1, overflow: 'hidden',
            fontSize: T.sm, color: C.textSecondary,
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {scene.location}
          </div>
        )}

        {/* Takes tally */}
        <div style={{
          flexShrink: 0,
          fontSize: T.micro,
          color: bom > 0 ? C.emerald : C.textTertiary,
          fontWeight: T.bold,
        }}>
          {bom}/{total}
        </div>

        {/* BOM / NG actions */}
        {onBOM && (
          <button
            onClick={onBOM}
            style={{
              padding: '4px 10px', borderRadius: R.sm,
              background: hexAlpha(C.emerald, 0.15),
              border: `0.5px solid ${hexAlpha(C.emerald, 0.35)}`,
              color: C.emerald, fontSize: T.sm, fontWeight: T.bold,
              cursor: 'pointer',
            }}
          >
            BOM
          </button>
        )}
        {onNG && (
          <button
            onClick={onNG}
            style={{
              padding: '4px 10px', borderRadius: R.sm,
              background: hexAlpha(C.error, 0.12),
              border: `0.5px solid ${hexAlpha(C.error, 0.30)}`,
              color: C.error, fontSize: T.sm, fontWeight: T.bold,
              cursor: 'pointer',
            }}
          >
            NG
          </button>
        )}
      </div>
    </CardShell>
  )
}

// ── Variant: DETAIL ───────────────────────────────────────────────
function DetailVariant({ scene, onPress, highlighted }: { scene: SceneData; onPress?: () => void; highlighted?: boolean }) {
  const accent  = scene.locationColor ?? ENTITY_COLOR.scene
  const status  = sceneStatus(scene.takes)
  const takes   = scene.takes ?? []

  return (
    <CardShell variant="expanded" accentColor={accent}>
      <CardHeader
        title={`Cena ${scene.sceneNumber}`}
        subtitle={scene.epId}
        icon={<Film size={16} />}
        badge={<StatusBadge status={status} size="sm" />}
        action={
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {highlighted && (
              <EntityPill label="PRÓXIMA" type="custom" color={C.emerald} size="xs" />
            )}
            <EntityPill label={scene.intExt ?? 'INT'} type="custom" color={accent} size="xs" />
            {scene.timeOfDay && (
              <EntityPill label={scene.timeOfDay} type="custom" color={C.warning} size="xs" />
            )}
          </div>
        }
      />

      <CardBody>
        {/* Thumbnail */}
        {scene.thumbnailUrl && (
          <img
            src={scene.thumbnailUrl}
            alt=""
            style={{
              width: '100%', height: 96, objectFit: 'cover',
              borderRadius: R.sm, flexShrink: 0,
              border: `0.5px solid rgba(255,255,255,0.10)`,
            }}
          />
        )}

        {/* Location */}
        {scene.location && (
          <MetaRow
            label="Local"
            value={scene.location}
            icon={<MapPin size={12} />}
            accentColor={accent}
          />
        )}

        {/* Description */}
        {scene.description && (
          <>
            <SectionHeader title="Descrição" separator />
            <p style={{
              fontSize: T.base, color: C.textSecondary,
              lineHeight: T.leading, margin: 0,
            }}>
              {scene.description}
            </p>
          </>
        )}

        {/* Dialogue */}
        {(scene.dialogue?.length ?? 0) > 0 && (
          <>
            <SectionHeader title="Diálogo" separator />
            <div style={{
              display: 'flex', flexDirection: 'column', gap: SP.xs,
              padding: SP.tight,
              background: hexAlpha(C.info, 0.06),
              border: `0.5px solid ${hexAlpha(C.info, 0.15)}`,
              borderRadius: R.sm,
            }}>
              {scene.dialogue!.map((line, i) => (
                <p key={i} style={{
                  fontSize: T.sm, color: C.textSecondary,
                  fontFamily: 'monospace',
                  lineHeight: T.leading, margin: 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  {line}
                </p>
              ))}
            </div>
          </>
        )}

        {/* Characters */}
        {(scene.characters?.length ?? 0) > 0 && (
          <>
            <SectionHeader title="Personagens" icon={<Users size={11} />} separator accentColor={C.emerald} />
            <CharPills characters={scene.characters!} max={20} accent={C.emerald} />
          </>
        )}

        {/* Director notes */}
        {scene.directorNotes && (
          <>
            <SectionHeader title="Notas do Realizador" separator />
            <div style={{
              padding: SP.tight,
              background: hexAlpha(C.purple, 0.08),
              border: `0.5px solid ${hexAlpha(C.purple, 0.20)}`,
              borderRadius: R.sm,
              fontSize: T.base, color: C.textSecondary,
              lineHeight: T.leading,
            }}>
              {scene.directorNotes}
            </div>
          </>
        )}

        {/* Continuity */}
        {(scene.continuityNotes?.length ?? 0) > 0 && (
          <>
            <SectionHeader title="Continuidade" separator accentColor={C.warning} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: SP.xs }}>
              {scene.continuityNotes!.map((n, i) => (
                <div key={i} style={{
                  padding: `${SP.xs}px ${SP.tight}px`,
                  background: hexAlpha(C.warning, 0.08),
                  border: `0.5px solid ${hexAlpha(C.warning, 0.18)}`,
                  borderRadius: R.xs,
                  fontSize: T.sm, color: C.textSecondary,
                }}>
                  {n}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Department items */}
        {(scene.departmentItems?.length ?? 0) > 0 && (
          <>
            <SectionHeader
              title="Departamentos"
              count={scene.departmentItems!.length}
              separator
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: SP.xs }}>
              {scene.departmentItems!.slice(0, 5).map(item => {
                const col = DEPT_COLOR[item.department] ?? C.textTertiary
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: SP.tight,
                    padding: `${SP.xs}px ${SP.tight}px`,
                    background: hexAlpha(col, 0.06),
                    border: `0.5px solid ${hexAlpha(col, 0.15)}`,
                    borderRadius: R.xs,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: col, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: T.sm, color: C.textPrimary, flex: 1 }}>
                      {item.name}
                    </span>
                    <EntityPill
                      label={item.department}
                      type="department"
                      color={col}
                      size="xs"
                    />
                    {item.approved && (
                      <CheckCircle2 size={12} color={C.emerald} />
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Takes */}
        {takes.length > 0 && (
          <>
            <SectionHeader
              title="Takes"
              count={takes.length}
              separator
              accentColor={C.warning}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: SP.xs }}>
              {takes.map(t => <TakeRow key={t.id} take={t} />)}
            </div>
          </>
        )}
      </CardBody>

      <CardFooter>
        <span style={{ flex: 1, fontSize: T.sm, color: C.textTertiary }}>
          {scene.callTime && `Chamada ${scene.callTime}`}
          {scene.dayNumber && ` · Dia ${scene.dayNumber}`}
        </span>
        {onPress && (
          <button
            onClick={onPress}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: T.sm, color: accent, fontWeight: T.semibold,
            }}
          >
            Abrir <ExternalLink size={11} />
          </button>
        )}
      </CardFooter>
    </CardShell>
  )
}

// ── Public API ────────────────────────────────────────────────────

export interface SceneCardProps {
  scene: SceneData
  /**
   * Information context — selects which fields and layout are shown.
   * This is NOT a size selector (that is CardShell.variant).
   *
   * dashboard  → day briefing, status at a glance, take bar
   * callsheet  → call time hero, all characters, director notes
   * schedule   → strip board style, location accent, drag handle
   * dailies    → take grid focus, BOM/NG/HOLD review
   * live       → 72px real-time cockpit row, action buttons
   * detail     → full context, all sections, scrollable body
   */
  context?: SceneCardVariant
  onPress?: () => void
  /** live context only: record BOM take */
  onBOM?: () => void
  /** live context only: record NG take */
  onNG?: () => void
  style?: CSSProperties
  className?: string
  /** When true, renders a "PRÓXIMA" priority badge — use to mark the next scene to shoot. */
  highlighted?: boolean
}

export function SceneCard({
  scene,
  context = 'dashboard',
  onPress,
  onBOM,
  onNG,
  style,
  className,
  highlighted,
}: SceneCardProps) {
  const wrapStyle: CSSProperties = { ...style }

  switch (context) {
    case 'schedule':
      return <div style={wrapStyle} className={className}><ScheduleVariant scene={scene} onPress={onPress} /></div>
    case 'callsheet':
      return <div style={wrapStyle} className={className}><CallsheetVariant scene={scene} onPress={onPress} /></div>
    case 'dailies':
      return <div style={wrapStyle} className={className}><DailiesVariant scene={scene} onPress={onPress} /></div>
    case 'live':
      return <div style={wrapStyle} className={className}><LiveVariant scene={scene} onBOM={onBOM} onNG={onNG} /></div>
    case 'detail':
      return <div style={wrapStyle} className={className}><DetailVariant scene={scene} onPress={onPress} highlighted={highlighted} /></div>
    default:
      return <div style={wrapStyle} className={className}><DashboardVariant scene={scene} onPress={onPress} highlighted={highlighted} /></div>
  }
}
