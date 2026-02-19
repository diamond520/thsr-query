# Phase 7: Round-Trip Query - Research

**Researched:** 2026-02-19
**Domain:** React Query parallel queries, react-day-picker disabled dates, responsive grid layout, new tab integration in Next.js App Router
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QURY-05 | 使用者可選擇起訖站、去程日期與回程日期，一次查詢兩段班次（去程與回程各自顯示完整時刻與座位狀態） | Two independent `useQuery` calls with discriminated keys `['trains', 'outbound', params]` and `['trains', 'return', params]`; shared station picker + two Calendar instances; `{ before: outboundDate }` matcher on return Calendar's `disabled` prop; `md:grid-cols-2` Tailwind layout for side-by-side results |
</phase_requirements>

---

## Summary

Phase 7 adds a fourth "來回查詢" (Round-Trip) tab to the existing three-tab page. The feature is entirely additive: it introduces one new component file (`RoundTripForm`), reuses existing components (`TrainList`, `QueryForm`'s station-picker sub-logic, `StationLinePicker`, `TrainCard`, `TrainTable`, `SeatBadge`) without modifying them, and adds one new tab entry to `page.tsx`.

The core technical challenge is **two parallel React Query fetches that must not deduplicate each other**: the outbound and return legs call the same `/api/tdx/trains` endpoint with the same origin/destination but different dates. Without a distinguishing discriminator in the `queryKey`, React Query's cache would treat both as the same query and return identical data for both legs. The fix is simple: include `'outbound'` or `'return'` as a string literal in each `queryKey`.

The secondary challenge is **date picker constraint**: the return date must be on or after the outbound date. The `react-day-picker` v9 `disabled` prop accepts a `{ before: Date }` matcher which disables all days before a given date — exactly what is needed. When the user changes the outbound date to a later value, the return date state must be clamped to remain valid (i.e., if current return date is before the new outbound date, reset return date to equal outbound date).

No new npm packages are needed. All libraries are already installed.

**Primary recommendation:** Build a self-contained `RoundTripForm` component that manages all form state internally (origin, destination, outbound date, return date), fires a single `onSubmit` callback with `{ origin, destination, outboundDate, returnDate }`, and renders the two `TrainList` components as a `grid grid-cols-1 md:grid-cols-2` layout. Add a fourth tab in `page.tsx` with `grid-cols-4`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-query` | ^5.90.21 (installed) | Two parallel train fetches with discriminated cache keys | Already project standard; v5 supports multiple `useQuery` in same component trivially |
| `react-day-picker` | ^9.13.2 (installed) | Calendar with `disabled={{ before: outboundDate }}` for return date constraint | Already used in `QueryForm`; v9 `disabled` prop supports `DateBefore` matcher natively |
| `date-fns` | ^4.1.0 (installed) | `format(date, 'yyyy-MM-dd')` for API call, `isBefore` for date comparison | Already project standard; used in `QueryForm` |
| Tailwind CSS | ^4 (installed) | `grid grid-cols-1 md:grid-cols-2 gap-4` for results layout | Already project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | ^0.574.0 (installed) | `CalendarIcon`, `Search`, `ArrowLeftRight` icons | Same icons already used in `QueryForm` |
| shadcn/ui `Popover`, `Calendar`, `Button`, `Select` | installed | Form controls for round-trip form | All installed; same components used in `QueryForm` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Two separate `useQuery` hooks | `useQueries` hook | `useQueries` is for dynamic/variable query count; two static queries are clearer with two `useQuery` calls |
| Two separate `useQuery` hooks | Single `useQuery` + fetch both in `queryFn` | Breaks independent loading/error states; can't show one leg while other is loading |
| `{ before: outboundDate }` matcher | Custom `disabled` function | Function works but is less readable; the `DateBefore` object matcher is the idiomatic react-day-picker v9 approach |
| `md:grid-cols-2` for results | Two separate pages or routes | Requirements specify "並排" (side-by-side) on desktop; single page with grid is the correct interpretation |

**Installation:** No new packages needed. Everything is already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── round-trip-form.tsx     # NEW: form with shared OD pickers + two date pickers
├── app/
│   └── page.tsx                # MODIFIED: add 4th tab "來回查詢", grid-cols-3 → grid-cols-4
└── (all other files unchanged)
```

**Phase 7 is entirely additive.** Only `page.tsx` is modified (tab count change). All other existing files remain untouched.

### Pattern 1: Discriminated React Query Keys for Parallel Legs

**What:** Two `useQuery` calls in the same render with distinct keys so React Query does not deduplicate them.

**When to use:** Whenever the same API endpoint is called twice with different parameters that share most of their identity (origin, destination) but differ on one dimension (date, leg type).

**Example:**
```typescript
// Source: TanStack Query parallel queries docs (tanstack.com/query/latest/docs/framework/react/guides/parallel-queries)
// In the page.tsx or a wrapper component:

const { data: outboundData, isLoading: outboundLoading } = useQuery({
  queryKey: ['trains', 'outbound', roundTripParams],
  queryFn: () => fetchTrains({
    origin: roundTripParams.origin,
    destination: roundTripParams.destination,
    date: roundTripParams.outboundDate,
  }),
  enabled: !!roundTripParams,
  staleTime: 5 * 60 * 1000,
  retry: 1,
})

const { data: returnData, isLoading: returnLoading } = useQuery({
  queryKey: ['trains', 'return', roundTripParams],
  queryFn: () => fetchTrains({
    origin: roundTripParams.destination,   // SWAPPED: return goes from destination back to origin
    destination: roundTripParams.origin,
    date: roundTripParams.returnDate,
  }),
  enabled: !!roundTripParams,
  staleTime: 5 * 60 * 1000,
  retry: 1,
})
```

**CRITICAL:** The `'outbound'` / `'return'` string discriminator is the third element in the key array. Without it, both queries would produce identical cache keys `['trains', { origin, destination, date }]` (when dates are the same) or could incorrectly share cached data if one query resolves while the other is in-flight.

**Also note:** For the return leg, `origin` and `destination` are **swapped** compared to outbound (return leg travels from original destination back to original origin).

### Pattern 2: Return Date Constraint with react-day-picker v9

**What:** The `disabled` prop on the return date Calendar accepts `{ before: outboundDate }` to disable all days before the outbound date.

**When to use:** Any time a second date must be >= a first date.

**Example:**
```typescript
// Source: https://daypicker.dev/selections/disabling-dates
// Return date calendar — disables days before outbound date
<Calendar
  mode="single"
  selected={returnDate}
  onSelect={(d) => {
    if (d) {
      setReturnDate(d)
      setReturnCalendarOpen(false)
    }
  }}
  disabled={{ before: outboundDate }}  // DateBefore matcher
  defaultMonth={returnDate}
/>
```

**Return date clamping when outbound date changes:**
```typescript
function handleOutboundDateChange(d: Date) {
  setOutboundDate(d)
  // Clamp return date: if return is now before new outbound, reset to outbound date
  if (isBefore(returnDate, d)) {
    setReturnDate(d)
  }
}
```

### Pattern 3: RoundTripForm Component Interface

**What:** A standalone form component that owns all state (origin, destination, outbound date, return date) and fires a single `onSubmit` callback.

**When to use:** Isolates round-trip form complexity from `page.tsx`.

```typescript
// src/components/round-trip-form.tsx
export interface RoundTripParams {
  origin: string        // TDX StationID
  destination: string   // TDX StationID
  outboundDate: string  // YYYY-MM-DD
  returnDate: string    // YYYY-MM-DD
}

interface RoundTripFormProps {
  onSubmit: (params: RoundTripParams) => void
}

export function RoundTripForm({ onSubmit }: RoundTripFormProps) {
  // Internal state: origin, destination, outboundDate, returnDate
  // Renders: StationLinePicker (mobile) + Select row (desktop), two date pickers, submit button
}
```

### Pattern 4: Two-Column Results Layout

**What:** Mobile stacks legs vertically; desktop shows them side-by-side.

**When to use:** After round-trip query is submitted.

```tsx
// In page.tsx RoundTrip tab content — after roundTripParams is set
{roundTripParams && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        去程 · {roundTripParams.outboundDate}
      </h3>
      <TrainList params={{
        origin: roundTripParams.origin,
        destination: roundTripParams.destination,
        date: roundTripParams.outboundDate,
      }} queryLeg="outbound" />
    </div>
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        回程 · {roundTripParams.returnDate}
      </h3>
      <TrainList params={{
        origin: roundTripParams.destination,
        destination: roundTripParams.origin,
        date: roundTripParams.returnDate,
      }} queryLeg="return" />
    </div>
  </div>
)}
```

**Note on `TrainList` reuse:** `TrainList` currently builds its `queryKey` as `['trains', params]`. To support the leg discriminator, `TrainList` needs a `queryLeg?: 'outbound' | 'return'` optional prop that is included in the `queryKey`. Alternatively, build a `RoundTripTrainList` wrapper that calls `useQuery` directly with the discriminated key and delegates rendering to `TrainCard`/`TrainTable`. The latter approach avoids touching the existing `TrainList` component.

### Pattern 5: Tab Addition in page.tsx

**What:** Add a fourth `TabsTrigger` and `TabsContent` for "來回查詢". Change `grid-cols-3` to `grid-cols-4`.

```tsx
// page.tsx — TabsList change
<TabsList className="w-full grid grid-cols-4 mb-4">
  <TabsTrigger value="by-od">時間查詢</TabsTrigger>
  <TabsTrigger value="by-train">車次查詢</TabsTrigger>
  <TabsTrigger value="by-station">車站查詢</TabsTrigger>
  <TabsTrigger value="round-trip">來回查詢</TabsTrigger>
</TabsList>

// New TabsContent
<TabsContent value="round-trip">
  <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
    <RoundTripForm onSubmit={handleRoundTripSubmit} />
  </div>
  {/* Results grid rendered here */}
</TabsContent>
```

### Anti-Patterns to Avoid

- **No discriminator in queryKey:** `queryKey: ['trains', params]` where `params` only differs by date — if outbound and return dates are the same day (edge case), React Query will serve cached outbound data for the return leg. Always include `'outbound'` / `'return'` in the key.
- **Shared `TrainList` without queryLeg prop:** Without telling `TrainList` which leg it is, the existing `queryKey: ['trains', params]` in `TrainList` will collide between legs. Either add `queryLeg` prop to `TrainList` or build separate `RoundTripTrainList` components.
- **Not swapping OD for return leg:** The return leg travels `destination → origin` (reversed). The `fetchTrains` call for the return leg must pass `origin=roundTripParams.destination` and `destination=roundTripParams.origin`.
- **Returning same-date return leg without clamping:** If user sets outbound to Monday, return to Wednesday, then changes outbound to Friday — the return date (Wednesday) is now before outbound (Friday). The return date must be clamped to Friday when this happens.
- **Duplicating StationLinePicker logic:** The round-trip form needs the same station picker (mobile visual line + desktop selects). Do not duplicate the code — import and reuse `StationLinePicker` and the `Select` components with the same station data pattern as `QueryForm`.
- **Four tabs squeezing text on mobile:** `grid-cols-4` with four Chinese labels may be too cramped on small screens. Consider shorter labels: "時間" / "車次" / "車站" / "來回" if full labels are too wide. Verify on actual mobile screen width.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date-before disabling | Custom date comparison + CSS disabled styling | `react-day-picker` `disabled={{ before: date }}` | Library handles all edge cases: keyboard navigation, ARIA disabled state, visual styling |
| Parallel fetch coordination | Custom Promise.all + shared state | Two independent `useQuery` hooks | React Query handles loading, error, caching independently; each leg gets its own state |
| Return date validation | Form-level error message for invalid date | `disabled` prop prevents invalid selection entirely | Better UX: user cannot select an invalid date, so validation is unnecessary |
| Station data fetching | Second `fetch('/api/tdx/stations')` call | `queryKey: ['stations']` deduplication | React Query deduplicates the stations fetch — `RoundTripForm` can call `useQuery({ queryKey: ['stations'] })` independently and will hit the cache |

**Key insight:** The entire complexity of round-trip query is in the `queryKey` discriminator and the date constraint. Everything else (API, station picker, result rendering) reuses existing code without modification.

---

## Common Pitfalls

### Pitfall 1: Cache Collision Without Leg Discriminator
**What goes wrong:** Return leg shows outbound results (or vice versa), especially when outbound date = return date.
**Why it happens:** `queryKey: ['trains', { origin: '1', destination: '12', date: '2026-03-01' }]` is identical for both legs when dates match. React Query serves the same cached response.
**How to avoid:** Always include `'outbound'` or `'return'` as a key segment: `['trains', 'outbound', params]` and `['trains', 'return', params]`.
**Warning signs:** Both result columns show identical trains even when dates differ slightly.

### Pitfall 2: Return Date Not Clamped on Outbound Date Change
**What goes wrong:** User sets outbound = March 10, return = March 15. Then changes outbound to March 20. The return date picker shows March 15 (before outbound), but the `disabled` prop visually disables those dates — the state is now invalid (returnDate < outboundDate).
**Why it happens:** Controlled state doesn't automatically update when `disabled` prop changes.
**How to avoid:** In `handleOutboundDateChange`, after setting outbound date, check `if (isBefore(returnDate, newOutboundDate)) setReturnDate(newOutboundDate)`.
**Warning signs:** Submit button becomes active even when return date appears greyed out.

### Pitfall 3: Four Tabs Too Narrow on Mobile
**What goes wrong:** `grid-cols-4` with full-length Chinese labels ("時間查詢", "車次查詢", "車站查詢", "來回查詢") overflows or wraps on small screens (320px–375px).
**Why it happens:** Each tab cell is 25% of viewport width. Four labels of 4 Chinese chars each is borderline.
**How to avoid:** Use shorter labels for the four tabs: "時間" / "車次" / "車站" / "來回". Or test on 375px viewport. The existing three-tab labels ("時間查詢" at 33.3% width) are already tight.
**Warning signs:** Text wraps to two lines inside tab trigger, causing height inconsistency.

### Pitfall 4: Stations Fetch Duplication
**What goes wrong:** `RoundTripForm` fetches stations independently, causing an extra API call visible in network devtools.
**Why it happens:** React Query deduplication only applies within the same `QueryClient` instance. If `queryKey` matches, the fetch is deduplicated. If the key differs (typo, different config), it fires separately.
**How to avoid:** Use exactly `queryKey: ['stations']` with `staleTime: 24 * 60 * 60 * 1000` — same key as `QueryForm` and `page.tsx`. React Query will serve from cache after first load.
**Warning signs:** Two `/api/tdx/stations` requests visible in network tab on first load.

### Pitfall 5: TrainList queryKey Collision with Existing Tabs
**What goes wrong:** The existing "時間查詢" tab's `TrainList` uses `queryKey: ['trains', params]`. If round-trip results happen to have the same `params` as a prior single-leg query, data is served from cache — potentially correct, but the cache entry is now shared between tabs unexpectedly.
**Why it happens:** Cache is global per `QueryClient`. Same key = same cache entry.
**How to avoid:** The discriminated key (`['trains', 'outbound', ...]` and `['trains', 'return', ...]`) does not collide with the existing `['trains', params]` key because the array lengths differ. React Query compares keys with deep equality — `['trains', params]` vs `['trains', 'outbound', params]` are distinct. No collision.
**Warning signs:** None if discriminator is included. Worth verifying: the existing `TrainList` uses `['trains', params]` (two elements) which is structurally different from `['trains', 'outbound', params]` (three elements).

### Pitfall 6: Forgetting OD Swap for Return Leg
**What goes wrong:** Return leg shows trains from 南港 to 左營 instead of 左營 to 南港 (the actual return journey).
**Why it happens:** Developer passes `origin` and `destination` unchanged for both legs.
**How to avoid:** For the return leg fetch, explicitly swap: `origin: roundTripParams.destination, destination: roundTripParams.origin`.
**Warning signs:** Both result columns show trains going the same direction.

---

## Code Examples

Verified patterns from official sources:

### Discriminated Parallel Queries (React Query v5)
```typescript
// Source: tanstack.com/query/latest/docs/framework/react/guides/parallel-queries
// Both queries fire simultaneously; different keys prevent cache collision

const outbound = useQuery({
  queryKey: ['trains', 'outbound', roundTripParams],
  queryFn: () => fetchTrains({
    origin: roundTripParams!.origin,
    destination: roundTripParams!.destination,
    date: roundTripParams!.outboundDate,
  }),
  enabled: !!roundTripParams,
  staleTime: 5 * 60 * 1000,
  retry: 1,
})

const returnLeg = useQuery({
  queryKey: ['trains', 'return', roundTripParams],
  queryFn: () => fetchTrains({
    origin: roundTripParams!.destination,   // swapped
    destination: roundTripParams!.origin,   // swapped
    date: roundTripParams!.returnDate,
  }),
  enabled: !!roundTripParams,
  staleTime: 5 * 60 * 1000,
  retry: 1,
})
```

### Return Date Calendar with `disabled` Prop
```typescript
// Source: https://daypicker.dev/selections/disabling-dates
// DateBefore matcher — disables all days strictly before outboundDate

<Calendar
  mode="single"
  selected={returnDate}
  onSelect={(d) => {
    if (d) {
      setReturnDate(d)
      setReturnCalendarOpen(false)
    }
  }}
  disabled={{ before: outboundDate }}
  defaultMonth={returnDate}
/>
```

### Outbound Date Change with Return Date Clamping
```typescript
// Source: Project pattern — date-fns isBefore (date-fns.org/docs/isBefore)
import { isBefore } from 'date-fns'

function handleOutboundDateChange(d: Date | undefined) {
  if (!d) return
  setOutboundDate(d)
  setOutboundCalendarOpen(false)
  // Clamp: if current returnDate is before new outbound, reset it
  if (isBefore(returnDate, d)) {
    setReturnDate(d)
  }
}
```

### Two-Column Results Grid
```tsx
// Source: Tailwind CSS responsive grid (tailwindcss.com/docs/grid-template-columns)
// Mobile: 1 column (stacked); Desktop (md:): 2 columns (side-by-side)

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <h3 className="text-sm font-medium text-muted-foreground mb-2">去程</h3>
    {/* outbound TrainList */}
  </div>
  <div>
    <h3 className="text-sm font-medium text-muted-foreground mb-2">回程</h3>
    {/* return TrainList */}
  </div>
</div>
```

### Four-Tab Layout Update
```tsx
// Modify page.tsx TabsList from grid-cols-3 to grid-cols-4
// Use shorter labels to fit on mobile
<TabsList className="w-full grid grid-cols-4 mb-4">
  <TabsTrigger value="by-od">時間查詢</TabsTrigger>
  <TabsTrigger value="by-train">車次查詢</TabsTrigger>
  <TabsTrigger value="by-station">車站查詢</TabsTrigger>
  <TabsTrigger value="round-trip">來回查詢</TabsTrigger>
</TabsList>
```

### RoundTripForm Complete Skeleton
```typescript
// src/components/round-trip-form.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, isBefore } from 'date-fns'
import { CalendarIcon, Search, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StationLinePicker } from '@/components/station-line-picker'
import { cn } from '@/lib/utils'
import { getTaiwanToday } from '@/lib/taiwan-date'
import type { TdxStation } from '@/types/tdx'

export interface RoundTripParams {
  origin: string
  destination: string
  outboundDate: string  // YYYY-MM-DD
  returnDate: string    // YYYY-MM-DD
}

interface RoundTripFormProps {
  onSubmit: (params: RoundTripParams) => void
}

async function fetchStations(): Promise<TdxStation[]> {
  const res = await fetch('/api/tdx/stations')
  if (!res.ok) throw new Error('Failed to load stations')
  return res.json()
}

export function RoundTripForm({ onSubmit }: RoundTripFormProps) {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [outboundDate, setOutboundDate] = useState<Date>(() => getTaiwanToday())
  const [returnDate, setReturnDate] = useState<Date>(() => getTaiwanToday())
  const [outboundCalendarOpen, setOutboundCalendarOpen] = useState(false)
  const [returnCalendarOpen, setReturnCalendarOpen] = useState(false)

  const { data: stations = [], isLoading: stationsLoading } = useQuery({
    queryKey: ['stations'],  // same key as QueryForm — deduplicates cache
    queryFn: fetchStations,
    staleTime: 24 * 60 * 60 * 1000,
  })

  function handleOutboundDateChange(d: Date | undefined) {
    if (!d) return
    setOutboundDate(d)
    setOutboundCalendarOpen(false)
    if (isBefore(returnDate, d)) setReturnDate(d)
  }

  function handleSwap() {
    setOrigin(destination)
    setDestination(origin)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!origin || !destination || origin === destination) return
    onSubmit({
      origin,
      destination,
      outboundDate: format(outboundDate, 'yyyy-MM-dd'),
      returnDate: format(returnDate, 'yyyy-MM-dd'),
    })
  }

  const isValid = !!origin && !!destination && origin !== destination

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Shared station picker — mobile visual line (same as QueryForm) */}
      <div className="md:hidden">
        <StationLinePicker
          stations={stations}
          origin={origin}
          destination={destination}
          onOriginChange={setOrigin}
          onDestinationChange={setDestination}
          disabled={stationsLoading}
        />
      </div>

      {/* Desktop: Select row */}
      <div className="hidden md:flex items-center gap-2">
        <Select value={origin} onValueChange={setOrigin} disabled={stationsLoading}>
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue placeholder="起站" />
          </SelectTrigger>
          <SelectContent>
            {stations.map(s => (
              <SelectItem key={s.StationID} value={s.StationID}>
                {s.StationName.Zh_tw}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="icon" onClick={handleSwap}
          disabled={!origin && !destination} aria-label="交換起訖站" className="shrink-0">
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
        <Select value={destination} onValueChange={setDestination} disabled={stationsLoading}>
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue placeholder="訖站" />
          </SelectTrigger>
          <SelectContent>
            {stations.map(s => (
              <SelectItem key={s.StationID} value={s.StationID}>
                {s.StationName.Zh_tw}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Outbound date picker */}
      <Popover open={outboundCalendarOpen} onOpenChange={setOutboundCalendarOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            去程：{format(outboundDate, 'yyyy-MM-dd')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={outboundDate}
            onSelect={handleOutboundDateChange} defaultMonth={outboundDate} />
        </PopoverContent>
      </Popover>

      {/* Return date picker — disabled before outbound date */}
      <Popover open={returnCalendarOpen} onOpenChange={setReturnCalendarOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            回程：{format(returnDate, 'yyyy-MM-dd')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={returnDate}
            onSelect={(d) => { if (d) { setReturnDate(d); setReturnCalendarOpen(false) } }}
            disabled={{ before: outboundDate }}
            defaultMonth={returnDate} />
        </PopoverContent>
      </Popover>

      <Button type="submit" className="w-full" disabled={!isValid}>
        <Search className="mr-2 h-4 w-4" />
        查詢去回程
      </Button>
    </form>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `fromDate`/`toDate` props on DayPicker | `disabled={{ before: date }}` matcher | react-day-picker v9 | `fromDate`/`toDate` removed in v9; use `disabled` with `DateBefore` matcher |
| Single `useQuery` fetching both legs | Two independent `useQuery` with discriminated keys | Always (React Query design) | Independent loading/error states; cache isolation between legs |
| `queryKey: ['trains', params]` | `queryKey: ['trains', 'outbound'|'return', params]` | Phase 7 addition | Prevents deduplication; existing `TrainList` key is untouched |

**Deprecated/outdated:**
- `fromDate`/`toDate` on DayPicker: removed in react-day-picker v9; use `disabled={{ before: date }}` instead.

---

## Open Questions

1. **Should `TrainList` be modified to accept a `queryLeg` prop, or should a new `RoundTripTrainList` component be built?**
   - What we know: `TrainList` uses `queryKey: ['trains', params]`. Adding `queryLeg` prop keeps code DRY. A new component avoids touching a working component.
   - What's unclear: Phase 7 is designed to be "entirely additive new files that avoid shared-file conflicts" — modifying `TrainList` breaks that constraint.
   - Recommendation: Build a separate `RoundTripTrainList` component that copies `TrainList`'s internal `useQuery` call with the discriminated key and delegates rendering to the same `TrainCard`/`TrainTable` components. This keeps Phase 7 additive. The code duplication is minimal (~15 lines).

2. **Should round-trip results show section headers ("去程" / "回程") with dates?**
   - What we know: The requirement says "去程與回程班次列表同時顯示" — both lists must be visible; no specifics on headers.
   - What's unclear: Whether date labels should appear above each result column.
   - Recommendation: Add a simple `<h3>` heading above each column showing "去程 · YYYY-MM-DD" and "回程 · YYYY-MM-DD". This helps users distinguish the two result sets, especially on mobile where they stack vertically.

3. **Should the four tabs use shorter labels on mobile to prevent overflow?**
   - What we know: Current three tabs use "時間查詢", "車次查詢", "車站查詢" at `grid-cols-3` (33.3% each). Adding a fourth tab at `grid-cols-4` (25% each) is tighter.
   - What's unclear: Whether 4-char Chinese labels fit at 25% width on 320px screens.
   - Recommendation: Test with existing label lengths first. If overflow occurs, shorten all four to 2-char labels: "時間" / "車次" / "車站" / "來回". The shorter labels are still unambiguous in context.

4. **Should the round-trip tab support URL state (shareable links)?**
   - What we know: Phase 5 implemented URL sharing for the single-leg query. Phase 7 requirements (QURY-05) make no mention of URL sharing for round-trip.
   - What's unclear: Nothing — out of scope per current requirements.
   - Recommendation: Do not implement URL sharing for the round-trip tab in Phase 7. Keep it stateful-only (no URL params). Future phases could add it if needed.

---

## Sources

### Primary (HIGH confidence)
- `react-day-picker` v9 `disabled` prop API: https://daypicker.dev/selections/disabling-dates — DateBefore matcher `{ before: date }` confirmed
- TanStack Query v5 parallel queries: https://tanstack.com/query/latest/docs/framework/react/guides/parallel-queries — two `useQuery` hooks in same component fire in parallel with independent state
- Project codebase read directly: `src/components/query-form.tsx`, `src/components/train-list.tsx`, `src/components/train-card.tsx`, `src/components/train-table.tsx`, `src/components/station-line-picker.tsx`, `src/app/page.tsx`
- `package.json` — exact package versions confirmed

### Secondary (MEDIUM confidence)
- Tailwind CSS responsive grid: https://tailwindcss.com/docs/grid-template-columns — `grid-cols-1 md:grid-cols-2` pattern; well-established
- date-fns `isBefore`: https://date-fns.org/docs/isBefore — used for return date clamping logic

### Tertiary (LOW confidence)
- None — all critical claims verified against official sources or project code.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed; versions confirmed from `package.json`
- Architecture (discriminated queryKey): HIGH — verified against TanStack Query v5 official docs; parallel queries pattern is well-established
- Architecture (date constraint): HIGH — verified against react-day-picker v9 official docs; `disabled` prop DateBefore matcher is documented
- Architecture (component structure): HIGH — derived from reading existing project files; pattern directly mirrors `QueryForm` / `TrainList`
- Pitfalls: HIGH — derived from React Query cache semantics (documented) and react-day-picker controlled state behavior (documented)

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (stable libraries; all APIs documented; 30-day window)
