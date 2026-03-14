# FrameFlow UI Card System

> Architecture reference for all entity card components.
> Last updated: March 2026
> Do not add new entity cards without updating this document first.

---

## Overview

The card system represents film production entities as visual components. Each card owns exactly one entity type, has a fixed semantic boundary, and follows strict layout rules enforced by the shared primitive layer.

Cards are built exclusively from primitives in `src/components/shared/ui/primitives/` and receive all data via typed props. No card reads from the store.

Cards are divided into three tiers:

| Tier | Cards | Status |
|---|---|---|
| Canonical | `SceneCard`, `FilmLocationCard`, `DepartmentStatusCard` | Implemented, stable API |
| Specialized | `ScenePrepCard` | Implemented, single consumer |
| Planned | `LocationWorkflowCard`, `LookbookItemCard` | Agreed boundary, not yet implemented |

---

## Invariant Rules

These rules apply to every card without exception. A component that violates any of them is not a card — it is a widget and must live outside `src/components/shared/ui/cards/`.

### Cards never grow beyond `CardShell.variant`

`CardShell.variant` maps to a fixed pixel height via `CARD_HEIGHT` in `tokens.ts`. Content that exceeds the height budget is clipped by `CardBody`. The card's outer dimensions never change based on content.

Canonical variant heights:

| Variant | Height | Purpose |
|---|---|---|
| `compact` | 72px | Dense list rows |
| `standard` | 220px | Default entity card |
| `expanded` | 360px | Detail panels |
| `live` | 72px | Real-time cockpit rows |

### Canonical entity cards must never use `auto`

`auto` is an internal escape hatch used only within `CardShell.tsx` itself. The public type `CanonicalCardVariant` excludes it. Any entity card that passes `variant="auto"` is violating the height contract.

### `CardBody` scrolls internally — screens never manage card overflow

`CardBody` has `overflow-y: auto` and `min-height: 0`. When content overflows, `CardBody` scrolls. The card's outer box stays fixed. Screens must not wrap cards in scroll containers to compensate for card height.

### `SceneCard` is the only canonical stateless scene card

`SceneCard` is the single authoritative visual representation of a `SceneData` entity. All scene display across the app — dashboard, callsheet, strip board, cockpit, detail panel — must use `SceneCard` with an appropriate `context`. A new component should not be created to display scene data unless it is demonstrably incompatible with the fixed-height stateless model (see `ScenePrepCard`).

### `ScenePrepCard` is a specialized stateful prep widget, not a replacement for `SceneCard`

`ScenePrepCard` owns internal `useState` for expand/collapse and has dynamic height. It exists for exactly one production context: the producer's prep view where department readiness must be visible inline without navigation. It must not be used in lists, strip boards, callsheets, or cockpit views, and it must not spread to new screens without explicit architectural review.

### Entity cards are props-only — no store access

No file in `src/components/shared/ui/cards/` imports from `src/core/store.js` or any Zustand store. Adapter functions that map store shapes to card prop types live in the screen or module file.

### Glass surface is applied only by `CardShell`

The Liquid Glass material (blur, lensing overlay, border, shadow) is applied exclusively inside `CardShell`. Entity cards do not set their own `backdropFilter`, `background`, or `boxShadow`. Cards that need a distinct material pass `accentColor` or use a named `SURFACE` preset — they never inline glass styles directly.

### `tokens.ts` is the single source of truth

All spacing, typography, color, radius, shadow, and height values used by cards come from `src/components/shared/ui/tokens.ts`. No card hardcodes a pixel value, hex color, or font size that is not derived from a token export (`C`, `T`, `SP`, `R`, `GLASS`, `SURFACE`, `CARD_HEIGHT`, `ENTITY_COLOR`, `DEPT_COLOR`).

---

## Canonical Cards

### `SceneCard`

**File:** `src/components/shared/ui/cards/SceneCard.tsx`
**Entity:** `SceneData`
**Tier:** Canonical — stable

Single authoritative display of a script scene. Stateless, props-only, fixed-height. Selects its information layout via `context` — not via layout overrides or conditional sizing.

**When to use:** Any surface displaying a scene entity — dashboards, callsheets, strip boards, cockpit rows, detail panels.

**When NOT to use:**
- Expand/collapse prep grouping required → `ScenePrepCard`
- Scene number appears as a secondary label on another entity's card → `EntityPill` or plain text
- A scene is referenced inside a location or department card → inline chip, not a full card

**Variant rules:** `CardShell.variant` is selected per context and must not be overridden by the caller:

| Context | `CardShell.variant` |
|---|---|
| `dashboard`, `callsheet`, `schedule`, `dailies` | `standard` |
| `live` | `live` |
| `detail` | `expanded` |

**Height rules:** Fixed by variant. Never passes `height` prop to `CardShell`. Never passes `variant="auto"`.

---

### `FilmLocationCard`

**File:** `src/components/shared/ui/cards/FilmLocationCard.tsx`
**Entity:** `LocationData` at the day-of operational phase
**Tier:** Canonical — stable

Visual representation of a filming location as a shooting destination. Answers day-of logistics questions.

**When to use:** Callsheet location block, day briefing widgets, any day-of operational context.

**When NOT to use:**
- Pre-production authorization workflow → `LocationWorkflowCard`
- Location is a secondary reference on another card → `MetaRow` or `EntityPill`

**Variant rules:** Always `standard`.
**Height rules:** Fixed at 220px. No exceptions.

---

### `DepartmentStatusCard`

**File:** `src/components/shared/ui/cards/DepartmentStatusCard.tsx`
**Entity:** `DepartmentStatusData` — department-level readiness aggregation
**Tier:** Canonical — stable

A rollup card that answers "Is department X ready?" Operates at department level, not item level. Shows HoD, radial readiness progress, and pending items by name.

**When to use:** Dashboard readiness widgets, pre-production go/no-go views, day overview status panels.

**When NOT to use:**
- Displaying individual items → `LookbookItemCard` (planned)
- Viewing specific wardrobe or prop items with photos — this card aggregates, it cannot represent a specific costume or prop

**Variant rules:** Always `standard`.
**Height rules:** Fixed at 220px.

---

## Specialized Cards

### `ScenePrepCard`

**File:** `src/app/components/ScenePrepCard.tsx`
**Entity:** `SceneData` + extended prep metadata (dept items by category, script lines, continuity, wardrobe)
**Tier:** Specialized — single consumer

Stateful accordion widget that presents a scene from the producer's prep perspective. Contains `useState` for expand/collapse, which makes it incompatible with the canonical fixed-height model.

**Why it is not canonical:**
- Owns internal state (`isExpanded`)
- Height is dynamic — grows on expand
- Cannot be used in virtual lists or as a drag target
- Props shape extends beyond `SceneData` to include prep-specific fields

**When to use:** Producer Dashboard upcoming-scenes section. Any surface that needs inline department readiness visible within a scene card without navigation, and where dynamic height is acceptable.

**When NOT to use:**
- Anywhere `SceneCard` is sufficient
- Strip boards, callsheets, cockpit views, any list requiring consistent row height
- Do not use as a global replacement for `SceneCard`
- Do not add a second consumer without explicit architectural review

**Variant rules:** Does not use `CardShell`. Uses custom Liquid Glass inline styles from `src/app/utils/liquidGlassStyles.ts`. Height is dynamic.

**Active consumers:** `ProducerDashboard.jsx`
**Prototype consumers (not routed):** `DashboardProducerLiquid.tsx`

---

## Planned Cards

Do not implement until a second consumer exists beyond the module that already handles the entity locally.

### `LocationWorkflowCard`

**Planned file:** `src/components/shared/ui/cards/LocationWorkflowCard.tsx`
**Planned type:** `LocationWorkflowData` (to be added to `types.ts`)
**Pattern exists in:** `src/modules/locations/index.jsx` — local `LocationCard`
**Tier:** Planned

Pre-production location card. Tracks a location through the scouting-to-authorization lifecycle.

**Semantic boundary:** Same underlying location entity as `FilmLocationCard`, different production phase.

| | `FilmLocationCard` | `LocationWorkflowCard` |
|---|---|---|
| Phase | Day-of operational | Pre-production workflow |
| Primary question | How do we get there? | Have we secured this? |
| Key data | Address, travel, contacts | Status, type, scene count, cost |
| Status model | N/A | por identificar → recce feito → autorização pendente → confirmado → recusado |

**When to use (planned):** Locations module grid, pre-production overview dashboards.
**When NOT to use (planned):** Day-of context → `FilmLocationCard`.

**Planned variant rules:** `CardShell variant="standard"`. Status pill as header badge.
**Planned height rules:** Fixed at 220px.

---

### `LookbookItemCard`

**Planned file:** `src/components/shared/ui/cards/LookbookItemCard.tsx`
**Planned type:** `LookbookItemData` (to be added to `types.ts`)
**Pattern exists in:** `src/modules/departments/index.jsx` — local `ItemsGrid` card
**Tier:** Planned

Photo-driven card for an individual production item — a costume, prop, set dressing element, or vehicle. Photo is the dominant visual element. Connects the item to characters, scenes, and approval status.

**Semantic boundary:** Item-level identity. Distinct from `DepartmentStatusCard` which aggregates a whole department. Do not conflate.

**When to use (planned):** Departments module Look Book grid, character breakdown panels, scene detail dept sections.
**When NOT to use (planned):** Department readiness overview → `DepartmentStatusCard`.

**Planned variant rules:** `CardShell variant="standard"`. Photo thumbnail dominant in `CardBody`.
**Planned height rules:** Fixed at 220px.

---

## Decision Tree

See `docs/card-decision-rules.md` for the full decision tree with examples.

```
Is it a scene entity?
├── needs expand/collapse + prep grouping in-place? → ScenePrepCard
└── stateless fixed card?                           → SceneCard (pick context)

Is it a location entity?
├── day-of operational, logistics focus?            → FilmLocationCard
└── pre-production, authorization workflow?         → LocationWorkflowCard (planned)

Is it a department entity?
├── department-level readiness aggregation?         → DepartmentStatusCard
└── individual item with photo, approval, scenes?  → LookbookItemCard (planned)
```

---

## Primitive Layer

All entity cards are composed from these primitives in `src/components/shared/ui/primitives/`:

| Primitive | Role |
|---|---|
| `CardShell` | Glass container, height constraint, accent color, click handler |
| `CardHeader` | Identity row: icon, title, subtitle, badge, action slot |
| `CardBody` | Scrollable content area — `min-height: 0`, `overflow-y: auto` |
| `CardFooter` | Fixed bottom strip for metadata and actions |
| `MetaRow` | Labeled data row with icon |
| `EntityPill` | Semantic badge: person, scene, location, department, custom |
| `StatusBadge` | Production status dot + label (todo, progress, live, done, hold) |
| `SectionHeader` | Labeled section divider within `CardBody` |
| `Divider` | Thin separator line |
| `ActionRow` | Horizontal button group for `CardFooter` |
| `IconBadge` | Framed icon element for `CardHeader.icon` slot |

---

## File Map

```
src/components/shared/ui/
├── tokens.ts                        ← single source of truth for all design constants
├── types.ts                         ← all entity data interfaces
├── index.ts                         ← public barrel export
├── cards/
│   ├── SceneCard.tsx                ← canonical
│   ├── FilmLocationCard.tsx         ← canonical
│   ├── DepartmentStatusCard.tsx     ← canonical
│   ├── WeatherCard.tsx              ← operational (day-of weather)
│   └── MealCard.tsx                 ← operational (catering)
└── primitives/
    ├── CardShell.tsx
    ├── CardHeader.tsx
    ├── CardBody.tsx
    ├── CardFooter.tsx
    ├── MetaRow.tsx
    ├── EntityPill.tsx
    ├── StatusBadge.tsx
    ├── SectionHeader.tsx
    ├── Divider.tsx
    ├── ActionRow.tsx
    └── IconBadge.tsx

src/app/components/
└── ScenePrepCard.tsx                ← specialized (single consumer, stateful)
```
