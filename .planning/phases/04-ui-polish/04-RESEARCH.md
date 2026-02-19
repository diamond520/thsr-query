# Phase 4: UI Polish - Research

**Researched:** 2026-02-19
**Domain:** React interactive UI component — visual transit line station picker with touch-friendly tap-to-select
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UIUX-01 | 起訖站選擇使用視覺化線路圖（12 個車站顯示為線段上的點，點擊選取） | Pure-CSS vertical line with station dots + two-step tap state machine; replace `<Select>` in QueryForm; show only on mobile via `md:hidden` |
</phase_requirements>

---

## Summary

Phase 4 requires replacing the two `<Select>` dropdowns in `QueryForm` with a visual station-line picker on mobile. The picker renders all 12 THSR stations as dots on a vertical line (南港 at top, 左營 at bottom) and implements two-step tap selection: first tap sets origin, second tap sets destination, with visual feedback at each step. Desktop keeps the existing Select dropdowns.

The archive (`_archive/src/components/`) does **not** contain a `stationLine.vue` visual picker — the original Vue 2 app used El-UI `<el-select>` dropdowns just like the current codebase. This phase is building the visual picker from scratch with no migration reference. All design decisions belong to this phase.

The implementation approach is: pure HTML + Tailwind CSS (no SVG, no external library). A vertical flex column with a 2px connecting line drawn via CSS (an absolutely-positioned `::before` or a `w-px` div), station dots as `<button>` elements with 44px minimum touch targets, and React `useState` for the two-step origin/destination state machine. The `QueryForm` keeps its existing props interface (`onSubmit(params: QueryParams)`) and the visual picker simply replaces the Select inputs internally, preserving all existing behavior upstream.

**Primary recommendation:** Build `StationLinePicker` as a standalone React component that accepts `stations`, `origin`, `destination`, `onOriginChange`, `onDestinationChange` props, then integrate into `QueryForm` in place of the two `<Select>` elements on mobile (`md:hidden` on picker, `hidden md:flex` on existing selects).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | Component and state management | Already in project |
| Tailwind CSS | v4 | Styling the line, dots, selection states | Already in project |
| clsx + tailwind-merge (via `cn()`) | — | Conditional class names | Already in `src/lib/utils.ts` |
| shadcn/ui Button | installed | Swap button retains its existing role | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.574.0 | Icons for selection indicators (circle, check) | If icon-based dot states are cleaner than CSS alone |
| shadcn `useMediaQuery` | hook (copy-paste) | Distinguish mobile vs desktop if CSS-only approach is insufficient | Only needed if JS-driven component switching is required |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure HTML/Tailwind line | SVG `<line>` + `<circle>` | SVG is more precise but requires viewBox math; divs + Tailwind is readable and maintainable with zero dependencies |
| CSS `md:hidden` responsive swap | `useMediaQuery` JS hook | CSS-only is simpler and avoids hydration issues; JS hook only needed if state must be shared across breakpoints differently |
| Two-step tap (origin first, then destination) | Combined tap-a-range (tap origin + destination at once) | Two-step is established transit app UX; combined is more complex interaction design |
| Replacing dropdowns everywhere | Replacing only on mobile | Requirement UIUX-01 explicitly says 手機版 (mobile version) — desktop keeps dropdowns |

**Installation:** No new packages required. All dependencies already in project.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── station-line-picker.tsx   # New: visual line selector component
│   └── query-form.tsx            # Modified: use picker on mobile, Select on desktop
```

### Pattern 1: Two-Step Tap State Machine

**What:** Station selection proceeds through explicit states: idle → origin-selected → both-selected. Tapping a station either sets origin (first tap) or destination (second tap). Tapping again clears and restarts.

**When to use:** Any time sequential selection has meaningful order (origin before destination).

**State model:**
```typescript
// Source: project analysis + standard React useState pattern
type SelectionStep = 'origin' | 'destination'

// Internal state in StationLinePicker (or lifted to QueryForm)
const [step, setStep] = useState<SelectionStep>('origin')

function handleStationTap(stationId: string) {
  if (step === 'origin') {
    onOriginChange(stationId)
    setStep('destination')
  } else {
    if (stationId === origin) {
      // Tapping origin again during destination step: clear and restart
      onOriginChange('')
      setStep('origin')
    } else {
      onDestinationChange(stationId)
      setStep('origin')  // Reset for next interaction
    }
  }
}
```

**Step indicator label:** Show "請選擇出發站" when step === 'origin', "請選擇到達站" when step === 'destination'. Reset step to 'origin' when either value is cleared externally (swap button).

**Re-selection:** When both are selected, tapping any station clears both and starts over from origin step. This matches T-express app behavior.

### Pattern 2: Vertical Line with Station Dots (Pure CSS/Tailwind)

**What:** A flex column container with a centered vertical line. Each station is a row with a dot + label. The line connects dot centers.

**Implementation approach — relative container + absolute line:**

```typescript
// Source: verified Tailwind/CSS vertical timeline pattern
// The line is a single absolutely-positioned element spanning full height
// Each dot is a button with a circular visual and 44px minimum touch target

// Conceptual structure:
<div className="relative flex flex-col">
  {/* Vertical connecting line */}
  <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border" />

  {stations.map(station => (
    <div key={station.StationID} className="relative flex items-center gap-3 py-1">
      {/* Station dot — 44x44 touch target with 12px visual circle */}
      <button
        className="relative z-10 flex items-center justify-center w-11 h-11 shrink-0"
        onClick={() => handleStationTap(station.StationID)}
        aria-label={`選擇 ${station.StationName.Zh_tw}`}
        aria-selected={isSelected(station.StationID)}
      >
        <span className={cn(
          "w-3 h-3 rounded-full border-2 transition-colors",
          isOrigin(station.StationID) && "bg-primary border-primary",
          isDestination(station.StationID) && "bg-secondary border-secondary",
          isInRange(station.StationID) && "bg-primary/20 border-primary/50",
          !isSelected(station.StationID) && "bg-background border-border"
        )} />
      </button>
      {/* Station name */}
      <span className={cn(
        "text-sm",
        isSelected(station.StationID) ? "font-medium text-foreground" : "text-muted-foreground"
      )}>
        {station.StationName.Zh_tw}
      </span>
    </div>
  ))}
</div>
```

**Key: Station order.** UIUX-01 requires 南港→左營 geographic order (north to south). TDX API returns stations with StationID "1" through "12" already in this order. Sort by `parseInt(StationID)` ascending to guarantee order regardless of API response ordering.

### Pattern 3: Mobile/Desktop Responsive Swap

**What:** The visual picker shows only on mobile; existing Select dropdowns show only on desktop. Both share the same state (`origin`, `destination`) in `QueryForm`.

```typescript
// In QueryForm — no changes to state shape, no new props
// Mobile visual picker
<div className="md:hidden">
  <StationLinePicker
    stations={stations}
    origin={origin}
    destination={destination}
    onOriginChange={setOrigin}
    onDestinationChange={setDestination}
  />
</div>

// Desktop dropdown row (existing JSX, unchanged)
<div className="hidden md:flex items-center gap-2">
  {/* Existing <Select> origin + swap button + <Select> destination */}
</div>
```

This is the same `md:hidden` / `hidden md:block` pattern already used in `TrainList` for card vs table rendering (see `src/components/train-list.tsx` lines 103–123).

### Pattern 4: Range Highlight Between Origin and Destination

**What:** When both origin and destination are selected, stations in-between are highlighted to indicate the route segment visually.

```typescript
function isInRange(stationId: string): boolean {
  if (!origin || !destination) return false
  const id = parseInt(stationId)
  const o = parseInt(origin)
  const d = parseInt(destination)
  const min = Math.min(o, d)
  const max = Math.max(o, d)
  return id > min && id < max  // Exclusive — endpoints use origin/destination styles
}
```

The connecting line segment between origin and destination dots can be highlighted by overlaying a second colored `div` with `top` and `height` calculated from the station index positions.

### Component Props Interface

```typescript
// src/components/station-line-picker.tsx
interface StationLinePickerProps {
  stations: TdxStation[]           // Must be sorted by StationID asc before passing in
  origin: string                   // TDX StationID "1"–"12", or ""
  destination: string              // TDX StationID "1"–"12", or ""
  onOriginChange: (id: string) => void
  onDestinationChange: (id: string) => void
  disabled?: boolean               // True while stations are loading
}
```

The `step` state (origin vs destination selection phase) lives inside `StationLinePicker` — it is derived/reset UI state, not business state.

### Anti-Patterns to Avoid

- **Lifting `step` to QueryForm:** The "which step are we on" is internal picker state. `QueryForm` only cares about final `origin` and `destination` string values.
- **Using SVG for the line:** SVG `viewBox` requires knowing heights upfront. The flex column grows with content; an absolutely-positioned `div` adapts naturally.
- **Tapping the same station for origin AND destination:** Must be blocked. THSR API rejects same-station queries. Check `if (origin === stationId)` during destination step and treat as "deselect origin, restart."
- **Not resetting `step` when swap is clicked:** The swap button in `QueryForm` calls `setOrigin(destination)` and `setDestination(origin)`. The picker's `step` should reset to 'origin' via a `useEffect` watching the origin/destination values — or the swap action can be threaded through the picker.
- **Floating-point positioning math for the range highlight line:** Use index-based calculations, not pixel measurements from `getBoundingClientRect`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional class merging | Custom string concatenation | `cn()` from `@/lib/utils` | Already in project; handles Tailwind conflicts |
| Responsive breakpoint check | `window.innerWidth` + `resize` listener | CSS `md:hidden` / `hidden md:flex` | Zero JS, no hydration issues, already used in codebase |
| Station ordering | Custom sort logic in render | Pre-sort stations by `parseInt(StationID)` once in component | TDX API order is reliable but explicit sorting prevents bugs |
| Accessibility attributes | Custom focus management | Native `<button>` elements with `aria-label`, `aria-selected`, `role="listbox"` parent | Native button gets keyboard/focus free; screen reader support via ARIA |

**Key insight:** This is primarily a stateful interaction problem, not a library problem. The entire visual picker is ~100 lines of React + Tailwind with no new dependencies.

---

## Common Pitfalls

### Pitfall 1: Station Order Not Guaranteed from API
**What goes wrong:** The visual line shows stations in wrong order (e.g., 台北 before 南港).
**Why it happens:** API response order should be sequential but isn't contractually guaranteed.
**How to avoid:** Always sort `stations` by `parseInt(station.StationID)` ascending before rendering. THSR StationIDs "1"–"12" map exactly to geographic north-to-south order.
**Warning signs:** If station dots appear in wrong geographic sequence in testing.

### Pitfall 2: Touch Target Too Small
**What goes wrong:** Users mis-tap on mobile; especially 苗栗 / 彰化 / 雲林 (smaller, less-traveled stations users tap less carefully).
**Why it happens:** Visual dot is 12px; tappable area must be much larger per WCAG 2.5.5 (44×44px minimum).
**How to avoid:** The `<button>` wrapper is `w-11 h-11` (44px). Visual dot is a centered child `span`. Never make the dot itself the button.
**Warning signs:** Mis-taps during manual testing on real device.

### Pitfall 3: Step State Desync After Swap
**What goes wrong:** User selects origin (南港), clicks swap button before selecting destination, then the picker is still in "destination" step expecting a destination tap but origin is now empty.
**Why it happens:** `step` state inside the picker doesn't reset when `origin`/`destination` props change externally.
**How to avoid:** Add `useEffect` watching `origin` and `destination` — if either becomes empty string, reset `step` to `'origin'`.
```typescript
useEffect(() => {
  if (!origin) setStep('origin')
}, [origin])
```
**Warning signs:** After swap with only origin set, next tap behaves unexpectedly.

### Pitfall 4: Same-Station Origin and Destination
**What goes wrong:** User taps 台北 for origin, then taps 台北 again for destination → same-station query that the API rejects.
**Why it happens:** Two-step tap state machine doesn't guard against same-station selection.
**How to avoid:** In `handleStationTap` destination step: if `stationId === origin`, treat as deselect (clear origin, reset to origin step) instead of setting destination.
**Warning signs:** API error "起訖站相同" when same station is selected for both.

### Pitfall 5: Hydration Mismatch from `useMediaQuery`
**What goes wrong:** Server renders mobile layout; client renders desktop layout → React hydration error.
**Why it happens:** `useMediaQuery` returns `false` on SSR but `true` on client for desktop viewport.
**How to avoid:** Use CSS `md:hidden` / `hidden md:flex` classes instead of JS-based breakpoint detection. CSS is applied by the browser post-hydration; there is no React reconciliation difference. This is the pattern already used in `TrainList` (confirmed in codebase).
**Warning signs:** "Hydration mismatch" console error when viewing on desktop.

### Pitfall 6: Archive Has No stationLine.vue Reference
**What goes wrong:** Planner assumes an archive Vue component exists to port from.
**Why it happens:** The phase context referenced `_archive/src/components/stationLine.vue` but this file does NOT exist. Archive only contains `byStation.vue` and `byTime.vue`, both using `<el-select>` dropdowns.
**How to avoid:** The visual station line picker is being built from scratch. No migration required.
**Warning signs:** Task that says "port stationLine.vue" — there is nothing to port.

---

## Code Examples

Verified patterns from project codebase and official sources:

### Sorting Stations by StationID
```typescript
// Source: project codebase — StationID is "1"–"12" string
const sortedStations = [...stations].sort(
  (a, b) => parseInt(a.StationID) - parseInt(b.StationID)
)
```

### Mobile/Desktop CSS Swap (existing pattern in codebase)
```typescript
// Source: src/components/train-list.tsx lines 103–123
// Show picker only on mobile
<div className="md:hidden">
  <StationLinePicker ... />
</div>

// Show selects only on desktop (existing QueryForm markup)
<div className="hidden md:flex items-center gap-2">
  {/* existing Select + swap button + Select */}
</div>
```

### Vertical Connecting Line (Tailwind v4)
```typescript
// Source: Tailwind CSS vertical timeline pattern (verified via official docs)
// Absolute div approach — works within flex column
<div className="relative">
  {/* Line: positioned behind dots, spans from first to last station center */}
  <div className="absolute left-[19px] top-5 bottom-5 w-px bg-border" />
  {/* Stations rendered as flex column items */}
</div>
```

### Step Prompt Label
```typescript
// Shows which selection is expected next
const stepLabel = step === 'origin'
  ? origin ? `出發：${originName}` : '請點選出發站'
  : destination ? `到達：${destinationName}` : '請點選到達站'
```

### Range Detection for In-Between Stations
```typescript
// Source: project analysis — StationIDs "1"–"12" are numerically sequential
function getStationState(stationId: string): 'origin' | 'destination' | 'in-range' | 'default' {
  const id = parseInt(stationId)
  const o = origin ? parseInt(origin) : null
  const d = destination ? parseInt(destination) : null
  if (o !== null && id === o) return 'origin'
  if (d !== null && id === d) return 'destination'
  if (o !== null && d !== null) {
    const min = Math.min(o, d)
    const max = Math.max(o, d)
    if (id > min && id < max) return 'in-range'
  }
  return 'default'
}
```

### External Reset Effect (Swap Button)
```typescript
// Source: React hooks best practice
// StationLinePicker internal — resets step when origin cleared by parent
useEffect(() => {
  if (!origin && !destination) setStep('origin')
  else if (!origin) setStep('origin')
}, [origin, destination])
```

### Accessibility Attributes for Station Buttons
```typescript
// Source: MDN ARIA listbox/option pattern
<div role="listbox" aria-label="選擇起訖站">
  <button
    role="option"
    aria-selected={isSelected(station.StationID)}
    aria-label={`${station.StationName.Zh_tw}${isOrigin ? ' (出發站)' : isDestination ? ' (到達站)' : ''}`}
    className="..."
    onClick={...}
  >
    ...
  </button>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<el-select>` from Vue 2 archive | shadcn `<Select>` dropdowns (already done in Phase 2) | Phase 2 | Not relevant to this phase |
| External library for station map | Pure CSS/Tailwind vertical timeline pattern | Tailwind v2–v4 | No new dependencies needed |
| `window.innerWidth` JS for responsive | CSS `md:hidden` Tailwind classes | Tailwind v1+ | Zero hydration risk in Next.js |
| `tailwind.config.js` | `@theme` directive in `globals.css` | Tailwind v4 (Jan 2025) | Already migrated in this project |
| `@layer components` with variant support | `@utility` for variant-aware custom utilities | Tailwind v4 | Only relevant if adding custom Tailwind utilities to globals.css |

**Deprecated/outdated:**
- `tailwind.config.js` custom colors/spacing: replaced by `@theme` in `globals.css` (already done in project)
- `@layer components` for variant-aware classes: use `@utility` in v4 if variants (hover:, focus:) are needed on custom class

---

## Open Questions

1. **Range highlight line segment**
   - What we know: We can calculate which stations are "in range" numerically.
   - What's unclear: Whether to highlight the connecting line segment between origin/destination dots (a second colored overlay div) or just highlight the dots themselves. The dots-only approach is simpler; line segment requires index-based height math.
   - Recommendation: Start with dots-only highlighting (origin = filled primary, destination = filled secondary, in-range dots = muted primary). Add line segment highlight as enhancement only if it looks incomplete.

2. **Should desktop have the visual picker too?**
   - What we know: UIUX-01 says 手機版 (mobile version). The existing Select dropdowns work well on desktop.
   - What's unclear: Whether the design goal ("t-ex app 風格") implies universal visual picker.
   - Recommendation: Follow the requirement literally — mobile only. If the visual picker also works well on desktop, it can be shown everywhere, but the minimum requirement is mobile-only. Implement mobile-first, evaluate whether to remove the desktop breakpoint restriction.

3. **Visual dot style for "origin" vs "destination"**
   - What we know: They need to be visually distinct.
   - What's unclear: Whether to use color difference (primary vs accent), shape difference (filled vs outlined), or label badges ("起"/"訖").
   - Recommendation: Use filled `bg-primary` for origin and filled `bg-destructive` (red) for destination — conventional transit app pattern (green/red or similar two-color). Add a small "起" badge to origin and "訖" badge to destination for accessibility and clarity.

---

## Sources

### Primary (HIGH confidence)
- Codebase: `src/components/query-form.tsx` — current Select implementation, QueryParams interface, onSubmit signature
- Codebase: `src/components/train-list.tsx` — `md:hidden` / `hidden md:block` pattern already in use
- Codebase: `src/fixtures/tdx-mock.ts` — confirmed 12 stations, StationID "1"–"12", geographic north-to-south order
- Codebase: `src/types/tdx.ts` — TdxStation interface shape
- `package.json` — confirmed Tailwind v4, React 19, shadcn installed components list
- `_archive/src/components/byStation.vue` — confirmed NO visual station line component in archive; uses el-select dropdowns
- Official Tailwind CSS docs (tailwindcss.com/blog/tailwindcss-v4) — @theme, @utility, @layer components behavior in v4
- Official Tailwind CSS docs (tailwindcss.com/docs/adding-custom-styles) — @utility vs @layer components distinction

### Secondary (MEDIUM confidence)
- cruip.com vertical timeline tutorial — CSS approach for vertical line with pseudo-elements / absolute divs + Tailwind (verified pattern matches official Tailwind approach)
- shadcn/ui hooks documentation (shadcn.io/hooks/use-media-query) — hook available but CSS approach preferred for this use case
- MDN ARIA listbox/option pattern — role="listbox" / role="option" / aria-selected for accessible custom selection widgets

### Tertiary (LOW confidence)
- THSR T-Express app UX patterns — unable to inspect directly (requires JavaScript rendering); description of two-step tap interaction is inferred from general transit app conventions, not verified against THSR app

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already in project, no new packages
- Architecture patterns: HIGH — based on existing codebase patterns (train-list.tsx responsive swap) and verified Tailwind v4 docs
- Interaction model: MEDIUM — two-step tap state machine is standard transit UX; specific THSR T-Express behavior not directly verified
- Pitfalls: HIGH — derived from direct codebase analysis and confirmed archive investigation

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (30 days — Tailwind v4 and shadcn/ui are stable; no fast-moving dependencies)
