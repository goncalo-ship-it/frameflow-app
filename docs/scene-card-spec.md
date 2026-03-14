# SceneCard — Canonical Spec

> Complete specification for `src/components/shared/ui/cards/SceneCard.tsx`.
> This document is the source of truth for what SceneCard does, what it does not do,
> and how to extend it correctly.
> Last updated: March 2026

---

## Purpose

`SceneCard` is the single canonical visual representation of a `SceneData` entity across the entire FrameFlow application. It is the only component that should be used to display a scene entity in any fixed-height card context.

It adapts its information density and layout to six production contexts via the `context` prop. It never manages internal state. It never reads from the store. It never grows beyond its `CardShell.variant` height.

---

## Public API

```ts
export interface SceneCardProps {
  scene:       SceneData
  context?:    SceneCardVariant    // defaults to 'dashboard'
  onPress?:    () => void
  onBOM?:      () => void          // live context only
  onNG?:       () => void          // live context only
  highlighted?: boolean            // renders "PRÓXIMA" badge in dashboard + detail
  style?:       CSSProperties      // applied to wrapper div only
  className?:   string             // applied to wrapper div only
}
```

### `SceneCardVariant`

```ts
type SceneCardVariant =
  | 'dashboard'   // day briefing, status at a glance, take bar
  | 'callsheet'   // call time hero, all characters, director notes
  | 'schedule'    // strip board style, location accent, drag handle
  | 'dailies'     // take grid focus, BOM/NG review
  | 'live'        // 72px cockpit row, BOM/NG action buttons
  | 'detail'      // full context, all sections, scrollable body
```

The `context` prop selects the **information mode** — which fields are shown and how they are prioritised. It does not change the card's size directly; size is determined by the internally selected `CardShell.variant`.

---

## Context Reference

### `dashboard`

**`CardShell.variant`:** `standard` (220px)
**Primary question:** Is this scene ready? What is its current status?

Sections rendered (in order):
- `CardHeader`: thumbnail or Film icon, scene number, episode, status badge, take count + intExt pill
- `CardBody`:
  - Location + time of day + duration row
  - Description (3-line clamp)
  - Characters (up to 4 pills)
  - Takes bar
  - Dept readiness dots
- `CardFooter`: call time · "Detalhes" link

`highlighted=true` renders a "PRÓXIMA" emerald `EntityPill` in the header action area.
`scene.thumbnailUrl` replaces the Film icon in the header icon slot (28×28px, objectFit cover).

---

### `callsheet`

**`CardShell.variant`:** `standard` (220px)
**Primary question:** When is this scene called and who is in it?

Sections rendered (in order):
- Call time as large display text above the header (when present)
- `CardHeader`: scene number + full subtitle (intExt · location · time of day)
- `CardBody`:
  - Characters (up to 6 pills)
  - Director notes (when present)
  - Dept readiness dots

No `highlighted` support. No `thumbnailUrl` support.

---

### `schedule`

**`CardShell.variant`:** `standard` (220px)
**Primary question:** Where is this scene, when, and how long?

Sections rendered (in order):
- `CardHeader`: scene number, episode, status badge
- `CardBody`:
  - Location as large heading
  - intExt + time of day + duration pills
  - Characters (up to 3 pills)
  - Takes bar + count
  - Dept readiness dots
- `CardFooter`: location label

No `highlighted` support. No `thumbnailUrl` support.

---

### `dailies`

**`CardShell.variant`:** `standard` (220px)
**Primary question:** How many takes, which are BOM?

Sections rendered (in order):
- `CardHeader`: scene number, location as subtitle, BOM + NG counts
- `CardBody`:
  - Full `TakeRow` list for every take (status dot, number, BOM/NG/HOLD, notes, timestamp)
  - Empty state when no takes
- `CardFooter`: total takes · duration · "Ver" link

No `highlighted` support. No `thumbnailUrl` support.

---

### `live`

**`CardShell.variant`:** `live` (72px)
**Primary question:** Is this scene shooting right now?

Single horizontal row:
- Status dot (todo/progress/live/done)
- Scene number + episode
- Location (flex-shrink, truncated)
- BOM/total tally
- BOM action button (`onBOM`)
- NG action button (`onNG`)

No `highlighted` support. No `thumbnailUrl` support.
`onBOM` and `onNG` are only meaningful in this context.

---

### `detail`

**`CardShell.variant`:** `expanded` (360px)
**Primary question:** Full scene context — everything known about this scene.

Sections rendered (in order):
- `CardHeader`: scene number, episode, full status badge, intExt + time of day pills
- `CardBody`:
  - Thumbnail strip (96px full width, when `scene.thumbnailUrl` present)
  - Location (`MetaRow`)
  - Description (full, no clamp)
  - Dialogue (monospace block, when `scene.dialogue[]` present)
  - Characters (full list, up to 20 pills)
  - Director notes (tinted block)
  - Continuity notes (amber tinted list)
  - Department items (flat list: name, dept badge, approved indicator)
  - Takes (full `TakeRow` list)
- `CardFooter`: call time · day number · "Abrir" link

`highlighted=true` renders a "PRÓXIMA" emerald `EntityPill` in the header action area.
`scene.thumbnailUrl` renders as a 96px full-width image strip at the top of `CardBody`.

---

## `SceneData` Field Coverage by Context

| Field | dashboard | callsheet | schedule | dailies | live | detail |
|---|---|---|---|---|---|---|
| `sceneNumber` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `epId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `intExt` | ✅ | ✅ | ✅ | — | — | ✅ |
| `location` | ✅ | ✅ | ✅ large | ✅ subtitle | ✅ | ✅ |
| `timeOfDay` | ✅ | ✅ | ✅ | — | — | ✅ |
| `description` | ✅ 3-line | — | — | — | — | ✅ full |
| `characters[]` | ✅ 4 max | ✅ 6 max | ✅ 3 max | — | — | ✅ 20 max |
| `takes[]` | ✅ bar | — | ✅ bar | ✅ full rows | ✅ tally | ✅ full rows |
| `departmentItems[]` | ✅ dots | ✅ dots | ✅ dots | — | — | ✅ list |
| `callTime` | ✅ footer | ✅ hero | — | — | — | ✅ footer |
| `duration` | ✅ | — | ✅ | ✅ footer | — | — |
| `thumbnailUrl` | ✅ 28px icon | — | — | — | — | ✅ 96px strip |
| `dialogue[]` | — | — | — | — | — | ✅ |
| `directorNotes` | — | ✅ | — | — | — | ✅ |
| `continuityNotes[]` | — | — | — | — | — | ✅ |
| `dayNumber` | — | — | — | — | — | ✅ footer |

---

## Architecture Constraints

### Do not add internal state

`SceneCard` and all its context variants are pure render functions. No `useState`, no `useEffect`, no `useRef`. If a new capability requires state, it belongs in a wrapper component or a new specialized card, not inside `SceneCard`.

### Do not add new contexts without updating this spec

Adding a seventh context (`'breakdown'`, `'prep'`, etc.) requires:
1. Adding the value to `SceneCardVariant` in `types.ts`
2. Adding a corresponding variant function inside `SceneCard.tsx`
3. Documenting it in this file under Context Reference and the Field Coverage table
4. Updating `docs/ui-card-system.md`

### Do not pass `variant="auto"` to `CardShell`

Each context variant selects its own `CardShell.variant` internally. The `SceneCard` public API has no `variant` or `height` prop — this is intentional. Callers cannot override the height.

### `context` is not `CardShell.variant`

| Prop | Owner | Controls |
|---|---|---|
| `CardShell.variant` | Internal — each context function | Physical height of the card |
| `SceneCard.context` | Public API | Which fields and layout are shown |

These are separate axes. A caller choosing `context="schedule"` is choosing information density, not card height.

### `highlighted` is a display hint, not a data field

`highlighted` is a prop on `SceneCard`, not a field on `SceneData`. It is a rendering instruction from the caller ("show this scene as the next one to shoot"). It is only meaningful in `dashboard` and `detail` contexts where the badge is visible.

---

## Extending SceneCard Correctly

### Adding a new field to an existing context

1. Add the field to `SceneData` in `types.ts` (optional, so existing adapters do not break)
2. Add rendering logic inside the relevant context variant function
3. Add the field to the Field Coverage table in this document
4. Build and verify — no other files need changing

### Adding a new context

1. Add the context string to `SceneCardVariant` in `types.ts`
2. Write a new `ContextVariant` function inside `SceneCard.tsx` following the existing pattern
3. Add the case to the `switch` in the `SceneCard` export function
4. Document it here and in `docs/ui-card-system.md`
5. Write an adapter in the consuming screen

### Adding a new prop

1. Add it to `SceneCardProps` with a JSDoc comment explaining when it applies
2. Destructure it in the `SceneCard` function
3. Pass it only to the contexts where it has meaning
4. Update this spec

---

## What SceneCard Is Not

| Capability | Correct component |
|---|---|
| Expand/collapse department items in-place | `ScenePrepCard` |
| Scene displayed as a secondary label on another card | `EntityPill` or `MetaRow` |
| Inline scene row inside a day timeline | `DayTimeline` + `DayTimelineItemData` |
| Scene breakdown with per-item photo grid | Future `LookbookItemCard` sections |
| Scene selection widget | Caller-managed list, not a card |
