# Card System — Decision Rules

> Use this document to decide which card component to use for a given situation.
> If a situation is not covered, extend this document before writing code.
> Last updated: March 2026

---

## The Decision Tree

### Step 1 — Identify the entity type

```
What is the primary entity being displayed?
│
├── A script scene (SceneData)
│   └── → Go to: Scene Decision
│
├── A filming location
│   └── → Go to: Location Decision
│
├── A production department
│   └── → Go to: Department Decision
│
├── A shooting day
│   └── → DayTimeline (not a card — a timeline component)
│
├── A weather reading
│   └── → WeatherCard
│
├── A meal / catering slot
│   └── → MealCard
│
└── Something else
    └── → Check if a planned card covers it.
        If not, document the new entity before building anything.
```

---

### Scene Decision

```
The entity is a SceneData scene.
│
├── Does the display require expand/collapse in-place?
│   Does it show department items grouped by category within the card?
│   Does it need dynamic height?
│   └── YES → ScenePrepCard
│            (only if all three are true — do not use ScenePrepCard
│             just for richer data; use SceneCard context="detail" instead)
│
└── NO → SceneCard
         │
         ├── What is the production context?
         │
         ├── Day briefing, general status overview
         │   └── context="dashboard"
         │
         ├── Day-of callsheet, call times, characters
         │   └── context="callsheet"
         │
         ├── Strip board, scheduling, location accent
         │   └── context="schedule"
         │
         ├── Post-shoot review, take BOM/NG breakdown
         │   └── context="dailies"
         │
         ├── Real-time cockpit row, active shooting
         │   └── context="live"
         │
         └── Full scene detail, all sections
             └── context="detail"
```

**The scene appears as a secondary reference on another card** (e.g., "3 scenes at this location"):
→ Do not use `SceneCard`. Use a plain text label, a count chip, or an `EntityPill`.

---

### Location Decision

```
The entity is a location.
│
├── What is the production phase?
│
├── Day-of shooting
│   The crew needs to get there today.
│   Key data: address, travel time, contacts, maps link
│   └── FilmLocationCard
│
└── Pre-production
    The location is being scouted, negotiated, or authorized.
    Key data: authorization status, scene count, shooting day count, cost
    └── LocationWorkflowCard  ← PLANNED
        (until implemented, use the local LocationCard in
         src/modules/locations/index.jsx — do not stretch FilmLocationCard)
```

**Incorrect use of `FilmLocationCard` for pre-production:**
`FilmLocationCard` has no status lifecycle, no scene count, no cost field, and no authorization model. Forcing pre-production data into it produces a semantically wrong card. Keep the two cards separate.

---

### Department Decision

```
The entity involves a department.
│
├── Is the question about a whole department's readiness?
│   "Is wardrobe ready?" "How many props are still pending?"
│   Entity level: department aggregate
│   └── DepartmentStatusCard
│
└── Is the question about a specific physical item?
    "What is this costume?" "Which scenes does this prop appear in?"
    Entity level: individual item
    └── LookbookItemCard  ← PLANNED
        (until implemented, use the local ItemsGrid card in
         src/modules/departments/index.jsx — do not stretch DepartmentStatusCard)
```

**Incorrect use of `DepartmentStatusCard` for item display:**
`DepartmentStatusCard` aggregates across all items in a department. It shows a count and a list of pending item names — not photos, not character associations, not scene keys. It cannot represent a single Look Book item.

---

## Anti-Pattern Reference

These are the most common incorrect decisions. Check this list before building.

### ❌ Using `ScenePrepCard` as a general SceneCard replacement

`ScenePrepCard` has dynamic height and internal state. It cannot be used in virtual lists, strip boards, or anywhere consistent row height is required. It is not a richer version of `SceneCard` — it is a fundamentally different component for a specific production context (producer prep). Use `SceneCard context="detail"` when rich scene information is needed without expand/collapse.

### ❌ Using `FilmLocationCard` in the pre-production Locations module

`FilmLocationCard` has no authorization status, no scene count, no cost, and no INT/EXT type field. The Locations module needs `LocationWorkflowCard` (planned). Do not add status or scene-count fields to `FilmLocationCard` to make it work — build `LocationWorkflowCard` separately.

### ❌ Using `DepartmentStatusCard` to display Look Book items

`DepartmentStatusCard` shows `readyCount/totalCount` for a department. It shows item names as text in a pending list — not as visual items with photos, characters, or scene associations. Use `LookbookItemCard` (planned) for item-level display.

### ❌ Passing `variant="auto"` to `CardShell` inside an entity card

`auto` is an internal escape hatch. The `CanonicalCardVariant` public type excludes it. Entity cards must never pass `auto` — it breaks the height contract and makes the card's size unpredictable.

### ❌ Reading from the store inside a card component

Cards in `src/components/shared/ui/cards/` are props-only. Store access belongs in the screen or module file. Write an adapter function there that maps store shape to the card's prop type.

### ❌ Hardcoding colors, sizes, or font values inside a card

All constants come from `tokens.ts`. Use `C.*` for colors, `T.*` for typography, `SP.*` for spacing, `R.*` for radius, `CARD_HEIGHT` for heights. If a value is not in tokens, add it to tokens before using it in a card.

### ❌ Creating a new card to display a scene just because the data shape differs

Differences in data shape are solved by adapter functions in the screen file, not by creating a new card component. Map the screen's data to `SceneData` in an adapter, then use `SceneCard` with the appropriate context.

---

## Invariant Checklist

Before merging any new card or change to an existing card, verify:

- [ ] Card imports no store module
- [ ] Card uses only primitives from `src/components/shared/ui/primitives/`
- [ ] Card uses only constants from `tokens.ts`
- [ ] Card does not pass `variant="auto"` to `CardShell`
- [ ] Card height is fixed — no dynamic height unless it is `ScenePrepCard`
- [ ] `CardBody` handles overflow via its own scroll, not via wrapper tricks
- [ ] Card has no `useState` or `useEffect` (unless it is `ScenePrepCard`)
- [ ] All new fields added to entity types are documented in `docs/scene-card-spec.md` or `docs/ui-card-system.md`

---

## Card vs. Not-a-Card

Some UI patterns look like cards but are not entity cards.

| Pattern | Component | Why it is not a card |
|---|---|---|
| Day flow block (meal, move, scene row in timeline) | `DayTimeline` + `DayTimelineItemData` | Row within a timeline — not an entity card |
| Scene reference chip on another entity | `EntityPill` | Label, not a card |
| Location reference on a callsheet | `MetaRow` | Data row, not a card |
| Character pill on a scene card | `EntityPill` inside `CharPills` | Label, not a card |
| Dept item name in a pending list | Text in `DepartmentStatusCard.pendingItems[]` | List item, not a card |
| Dept item with photo in Look Book grid | `LookbookItemCard` (planned) | This one is a card |

---

## When to Create a New Card

Create a new card only when all of these are true:

1. The entity has a distinct production meaning that cannot be expressed as a `context` on an existing card
2. At least two different screens need to display this entity as a primary element
3. The entity has a stable typed interface in `types.ts`
4. The card can be implemented as a stateless, props-only, fixed-height component

If condition 4 is false (the new card needs internal state or dynamic height), it is a widget, not a card. Name it accordingly and place it outside `src/components/shared/ui/cards/`.

If only one screen needs this entity, implement a local component in that screen's module. Canonicalize it only when the second consumer appears.

---

## Planned Card Triggers

These are the conditions that should trigger implementation of the two planned cards:

| Card | Trigger |
|---|---|
| `LocationWorkflowCard` | A second screen (beyond Locations module) needs to display a location with authorization status, scene count, or cost — e.g., a pre-production overview dashboard |
| `LookbookItemCard` | A second screen (beyond Departments module) needs to display a department item with photo — e.g., a callsheet dept tab, a scene breakdown panel, or a character wardrobe view |
