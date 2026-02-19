# Architecture Research

**Domain:** Next.js 16 App Router — v2.0 UX Enhancement (Round-trip, Saved Routes, Shareable URL)
**Researched:** 2026-02-19
**Confidence:** HIGH

---

## Context: Milestone Scope

This document supersedes the initial ARCHITECTURE.md for the v2.0 UX Enhancement milestone. It focuses exclusively on how three new features integrate with the **existing** architecture. The existing system architecture diagram remains accurate — only the integration deltas are described here.

**Existing system summary:**
- `src/app/page.tsx` — `'use client'` page, manages tab state and per-tab query params with `useState`
- `src/components/query-form.tsx` — self-contained form with internal `useState` (origin, destination, date); calls `onSubmit(QueryParams)`
- `src/components/train-list.tsx` — receives `QueryParams | null`; fires one React Query call when params are non-null
- Three tabs: `by-od`, `by-train`, `by-station` — each tab has independent local state in `page.tsx`

---

## Feature 1: Round-Trip Query (來回查詢)

### Decision: New Tab vs Toggle

**Recommendation: New fourth tab** (`by-roundtrip`), not a toggle inside the existing `by-od` tab.

Rationale:
- A toggle inside `by-od` forces `QueryForm` to conditionally render a second date picker and return-date state — doubling the form's internal state surface
- A new tab gives the round-trip form its own clean component with no conditional branching
- The existing `by-od` tab is shared with the URL state feature (Feature 3); keeping it stable avoids compound complexity
- UX: a distinct tab makes it obvious the user is in a different mode, which is correct — round-trip is a different query shape

### Where Does Round-Trip UI Live?

New file: `src/components/round-trip-form.tsx`

```
page.tsx (by-roundtrip tab)
  └── <RoundTripForm onSubmit={setRoundTripParams} />
  └── <RoundTripResults params={roundTripParams} />
```

`RoundTripForm` is a new component. It does NOT reuse `QueryForm` directly — it needs two date fields. However, it shares the same station fetching pattern (same `queryKey: ['stations']`, so React Query deduplicates the fetch).

`RoundTripResults` is a new component that renders two `TrainList` instances side by side (or stacked).

### How Are Two React Query Calls Managed?

`TrainList` already accepts `QueryParams | null` and fires a single query. For round-trip, render two `TrainList` components in the same tab:

```tsx
// src/components/round-trip-results.tsx
export function RoundTripResults({ params }: { params: RoundTripParams | null }) {
  if (!params) return <idle state>

  const outboundParams: QueryParams = {
    origin: params.origin,
    destination: params.destination,
    date: params.outboundDate,
  }
  const returnParams: QueryParams = {
    origin: params.destination,   // swapped
    destination: params.origin,
    date: params.returnDate,
  }

  return (
    <div className="space-y-6">
      <section>
        <h2>去程</h2>
        <TrainList params={outboundParams} />
      </section>
      <section>
        <h2>回程</h2>
        <TrainList params={returnParams} />
      </section>
    </div>
  )
}
```

`TrainList` is already keyed by `queryKey: ['trains', params]` — two independent queries with different params fire independently and cache independently. No changes to `TrainList` are needed.

### New Type

```typescript
// Add to src/types/tdx.ts or define in round-trip-form.tsx:
export interface RoundTripParams {
  origin: string        // StationID
  destination: string   // StationID
  outboundDate: string  // YYYY-MM-DD
  returnDate: string    // YYYY-MM-DD
}
```

### State in page.tsx

```tsx
// New state entry in page.tsx:
const [roundTripParams, setRoundTripParams] = useState<RoundTripParams | null>(null)
```

### Files Impacted by Feature 1

| File | Change Type | What Changes |
|------|-------------|-------------|
| `src/app/page.tsx` | MODIFY | Add fourth tab `by-roundtrip`; add `roundTripParams` state; render `RoundTripForm` + `RoundTripResults` |
| `src/components/round-trip-form.tsx` | CREATE | New form component with origin, destination, two date pickers |
| `src/components/round-trip-results.tsx` | CREATE | Renders two `<TrainList>` instances with swapped params |
| `src/components/train-list.tsx` | NO CHANGE | Already handles independent queries |
| `src/types/tdx.ts` | MODIFY (optional) | Add `RoundTripParams` interface |

---

## Feature 2: Saved Favorite Routes (localStorage)

### State Management Location

**Recommendation: Custom hook `useFavoriteRoutes`** in `src/hooks/use-favorite-routes.ts`.

Rationale:
- Encapsulates the `localStorage` SSR guard (`typeof window !== 'undefined'`) in one place
- Re-usable: could be used in both the `by-od` tab and `by-roundtrip` tab
- Separates persistence concern from UI concern

### Hook Design

```typescript
// src/hooks/use-favorite-routes.ts
'use client'

export interface FavoriteRoute {
  id: string          // crypto.randomUUID() or timestamp
  origin: string      // StationID
  destination: string // StationID
  label: string       // e.g. "南港→左營" — computed at save time
}

const STORAGE_KEY = 'thsr-favorite-routes'

export function useFavoriteRoutes() {
  const [favorites, setFavorites] = useState<FavoriteRoute[]>(() => {
    // SSR guard — localStorage is only available in browser
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  function save(route: Omit<FavoriteRoute, 'id'>) {
    const next = [...favorites, { ...route, id: Date.now().toString() }]
    setFavorites(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function remove(id: string) {
    const next = favorites.filter(f => f.id !== id)
    setFavorites(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return { favorites, save, remove }
}
```

**SSR guard is in the `useState` initializer** — same pattern as `getTaiwanToday()` in `query-form.tsx`. The initializer only runs in the browser; the server renders with an empty array, avoiding hydration mismatch.

### UI Integration

`FavoriteRoutes` is a new component rendered above `QueryForm` inside the `by-od` tab:

```tsx
// src/app/page.tsx (by-od tab):
<TabsContent value="by-od">
  <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
    <FavoriteRoutes
      favorites={favorites}
      onSelect={(route) => { /* pre-fill QueryForm */ }}
      onRemove={remove}
    />
    <QueryForm
      initialOrigin={selectedOrigin}   // new prop — see note below
      initialDestination={selectedDest}
      onSubmit={handleByOdSubmit}
    />
  </div>
  <TrainList params={queryParams} />
</TabsContent>
```

### QueryForm Pre-Fill Challenge

`QueryForm` currently manages its own `origin`/`destination` state internally. To allow pre-fill from a saved route, there are two options:

**Option A (recommended): Lift origin/destination state to page.tsx for the by-od tab.**

```tsx
// page.tsx gains:
const [byOdOrigin, setByOdOrigin] = useState('')
const [byOdDestination, setByOdDestination] = useState('')

// QueryForm gains two new optional props:
interface QueryFormProps {
  onSubmit: (params: QueryParams) => void
  initialOrigin?: string      // pre-fills on first render only
  initialDestination?: string
}
```

`QueryForm` uses these as `useState` initializers: `useState(initialOrigin ?? '')`. When a favorite is selected in the parent, `page.tsx` updates `byOdOrigin`/`byOdDestination` — but this approach has a subtlety: `useState` ignores prop changes after first render. A `key` prop on `QueryForm` forces remount: `<QueryForm key={selectedFavoriteId} initialOrigin={...} />`. This is the simplest approach.

**Option B: Convert QueryForm internal state to controlled props.**

Full refactor of `QueryForm` to accept `value`/`onChange` props for origin and destination. Cleaner but heavier — deferred unless needed.

**Recommendation: Option A with `key` prop remount.** Simpler, no QueryForm refactor, behavior is predictable.

### Files Impacted by Feature 2

| File | Change Type | What Changes |
|------|-------------|-------------|
| `src/hooks/use-favorite-routes.ts` | CREATE | Custom hook with localStorage read/write and SSR guard |
| `src/components/favorite-routes.tsx` | CREATE | Pill chip UI showing saved routes, "save" button, remove (×) button |
| `src/app/page.tsx` | MODIFY | Add `useFavoriteRoutes` hook; wire selected favorite to pre-fill form |
| `src/components/query-form.tsx` | MODIFY | Add `initialOrigin?` and `initialDestination?` props |

---

## Feature 3: Shareable URL

### Reading searchParams in a 'use client' Page

`page.tsx` is marked `'use client'`. For a client component, `useSearchParams()` from `next/navigation` is the correct approach. It returns a read-only `URLSearchParams` object.

**Suspense boundary requirement (HIGH confidence — verified from official docs):**

In production builds, any component calling `useSearchParams()` must be wrapped in a `<Suspense>` boundary, or the build fails. In development this error is hidden — it only surfaces at `next build`.

`page.tsx` is currently a single large `'use client'` component. The cleanest solution: extract the search-param reading logic into a child component wrapped in Suspense.

```tsx
// src/components/search-params-init.tsx
'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

interface SearchParamsInitProps {
  onInit: (from: string | null, to: string | null, date: string | null) => void
}

export function SearchParamsInit({ onInit }: SearchParamsInitProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    onInit(
      searchParams.get('from'),
      searchParams.get('to'),
      searchParams.get('date'),
    )
  }, [])   // Run once on mount

  return null  // Renders nothing
}
```

In `page.tsx`:
```tsx
import { Suspense } from 'react'
import { SearchParamsInit } from '@/components/search-params-init'

export default function Home() {
  const [initialFrom, setInitialFrom] = useState<string | null>(null)
  const [initialTo, setInitialTo] = useState<string | null>(null)
  const [initialDate, setInitialDate] = useState<string | null>(null)

  function handleSearchParamsInit(from, to, date) {
    setInitialFrom(from)
    setInitialTo(to)
    setInitialDate(date)
  }

  return (
    <main>
      <Suspense fallback={null}>
        <SearchParamsInit onInit={handleSearchParamsInit} />
      </Suspense>
      {/* ... rest of page ... */}
    </main>
  )
}
```

These initial values feed into `QueryForm` via the same `initialOrigin`/`initialDestination`/`initialDate` props established in Feature 2. The `key` remount technique applies here too.

**Alternative: page.tsx remains 'use client' and the entire page is already dynamically rendered.** Since the page is `'use client'`, Next.js already does CSR for the full page. In this case, `useSearchParams()` called directly in `page.tsx` should work without build failure because the entire page is client-rendered. However, the Suspense wrapper is still the correct defensive pattern per official docs, and it keeps the build reliable regardless of rendering mode changes.

**Recommendation: Use the `SearchParamsInit` child component with `<Suspense fallback={null}>`.** This is explicit, follows official docs, safe in all rendering modes, and works cleanly with the `useEffect` on-mount pattern.

### Writing URL When Query is Submitted

Use `router.replace()` (not `router.push()`).

- `router.replace` updates the URL without adding a browser history entry — each new query replaces the previous URL rather than stacking history entries
- `router.push` would mean pressing Back cycles through every query submission, which is confusing
- Exception: if the product intent is "browser back returns to previous query", use `router.push`. For a query tool, `replace` is almost always correct.

Implementation in the `handleSubmit` callback inside `page.tsx` (or a wrapper around `QueryForm.onSubmit`):

```typescript
// src/hooks/use-query-url.ts
'use client'
import { useRouter, usePathname } from 'next/navigation'

export function useQueryUrl() {
  const router = useRouter()
  const pathname = usePathname()

  function updateUrl(params: QueryParams) {
    const qs = new URLSearchParams({
      from: params.origin,
      to: params.destination,
      date: params.date,
    })
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false })
  }

  return { updateUrl }
}
```

`{ scroll: false }` prevents the page from scrolling to the top on each query submission — important since the form is at the top and results are below.

### Shared Infrastructure: useQueryUrl Benefits Round-Trip Too

The `useQueryUrl` hook can be extended to support round-trip params with additional query params (`?from=&to=&date=&returnDate=&tab=roundtrip`). The `tab` param can also drive which tab is active on deep link.

### Files Impacted by Feature 3

| File | Change Type | What Changes |
|------|-------------|-------------|
| `src/components/search-params-init.tsx` | CREATE | Reads `useSearchParams()`; passes values to parent via callback |
| `src/hooks/use-query-url.ts` | CREATE | Writes URL via `router.replace()` on query submit |
| `src/app/page.tsx` | MODIFY | Wrap `SearchParamsInit` in `<Suspense>`; wire URL init to form pre-fill; call `updateUrl` on submit |
| `src/components/query-form.tsx` | MODIFY | Add `initialDate?` prop (beyond Feature 2 additions) |

---

## Recommended Project Structure (Post-v2.0)

```
src/
├── app/
│   ├── page.tsx                        # MODIFIED: 4 tabs, URL state, favorites wiring
│   ├── layout.tsx                      # unchanged
│   ├── providers.tsx                   # unchanged
│   └── api/tdx/…                       # unchanged
├── components/
│   ├── query-form.tsx                  # MODIFIED: initialOrigin, initialDestination, initialDate props
│   ├── train-list.tsx                  # unchanged
│   ├── round-trip-form.tsx             # NEW: origin, destination, two date pickers
│   ├── round-trip-results.tsx          # NEW: two <TrainList> with outbound/return params
│   ├── favorite-routes.tsx             # NEW: pill chip UI for saved routes
│   ├── search-params-init.tsx          # NEW: reads useSearchParams, calls onInit
│   ├── by-train-form.tsx               # unchanged
│   ├── by-train-result.tsx             # unchanged
│   ├── by-station-form.tsx             # unchanged
│   ├── by-station-result.tsx           # unchanged
│   ├── station-line-picker.tsx         # unchanged
│   ├── train-card.tsx                  # unchanged
│   ├── train-table.tsx                 # unchanged
│   └── ui/…                            # unchanged
├── hooks/                              # NEW directory
│   ├── use-favorite-routes.ts          # NEW: localStorage read/write with SSR guard
│   └── use-query-url.ts                # NEW: router.replace URL writer
├── lib/
│   ├── tdx-api.ts                      # unchanged
│   ├── tdx-token.ts                    # unchanged
│   ├── taiwan-date.ts                  # unchanged
│   └── utils.ts                        # unchanged
└── types/
    └── tdx.ts                          # MODIFY: add RoundTripParams interface
```

---

## Data Flow Changes

### Feature 1: Round-Trip Query

```
User fills RoundTripForm (origin, dest, outboundDate, returnDate)
    ↓  onSubmit({ origin, dest, outboundDate, returnDate })
page.tsx setRoundTripParams(params)
    ↓
RoundTripResults receives RoundTripParams
    ├── <TrainList params={outboundParams} />   → queryKey: ['trains', outboundParams]
    └── <TrainList params={returnParams} />     → queryKey: ['trains', returnParams]
        Both fire GET /api/tdx/trains independently, cached separately
```

### Feature 2: Saved Favorites

```
useFavoriteRoutes (localStorage)
    ↓ favorites[] read on mount (SSR guard: typeof window !== 'undefined')
FavoriteRoutes component renders pill chips
    ↓ user clicks chip
page.tsx receives (origin, destination)
    ↓ sets key prop on QueryForm → QueryForm remounts with new initialOrigin/initialDestination
QueryForm renders with pre-filled stations
    ↓ user adjusts date and submits
page.tsx setQueryParams → TrainList fires
    ↓ user clicks "save" button (near QueryForm)
useFavoriteRoutes.save({ origin, destination, label })
    ↓ writes to localStorage
favorites[] state updates → FavoriteRoutes re-renders with new chip
```

### Feature 3: Shareable URL

```
Initial page load with ?from=1&to=12&date=2026-03-01
    ↓ Suspense → SearchParamsInit mounts
useSearchParams() reads params
    ↓ useEffect once
onInit('1', '12', '2026-03-01') callback
    ↓ page.tsx setState (initialFrom, initialTo, initialDate)
    ↓ QueryForm remounts with key={initialFrom+initialTo+initialDate}
QueryForm pre-filled with station + date from URL
    ↓ user clicks 查詢 (or auto-submit if all params valid)
page.tsx setQueryParams → TrainList fires

Query submission:
User submits QueryForm
    ↓ onSubmit(params)
page.tsx setQueryParams(params)
    ↓ useQueryUrl.updateUrl(params)
router.replace('/?from=1&to=12&date=2026-03-01', { scroll: false })
URL updates in browser bar — shareable, browser refresh reruns the query
```

---

## Architectural Patterns

### Pattern 1: useState Initializer for SSR-Unsafe APIs

**What:** Call browser-only APIs (`localStorage`, `Date` in timezone context) inside `useState(() => ...)` initializer functions, never directly in render.

**When to use:** Every time you need localStorage, sessionStorage, or timezone-sensitive Date values in a Client Component.

**Trade-offs:**
- Avoids React hydration mismatch (server renders empty/default, client hydrates with real value)
- Initializer only runs once — subsequent renders use React state, not the storage value
- Writing to storage must be done explicitly in event handlers or effects (not in initializer)

**Example (from existing codebase):**
```typescript
// query-form.tsx — established pattern
const [date, setDate] = useState<Date>(() => getTaiwanToday())

// New hook — same pattern:
const [favorites, setFavorites] = useState<FavoriteRoute[]>(() => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
})
```

### Pattern 2: Suspense-Wrapped Client Component for useSearchParams

**What:** Extract any component calling `useSearchParams()` into its own component, wrap it in `<Suspense fallback={null}>` at the call site.

**When to use:** Any time `useSearchParams()` is needed. Required for production builds — without Suspense, `next build` fails for statically rendered pages.

**Trade-offs:**
- Slight indirection (separate component file)
- Production-safe: works regardless of rendering mode
- `fallback={null}` is appropriate when the component renders nothing (initialization-only)

**Example:**
```tsx
// page.tsx
import { Suspense } from 'react'
import { SearchParamsInit } from '@/components/search-params-init'

<Suspense fallback={null}>
  <SearchParamsInit onInit={handleSearchParamsInit} />
</Suspense>
```

### Pattern 3: key-Prop Remount for Form Pre-Fill

**What:** Control a component's internal state reset by changing its React `key` prop. When `key` changes, React unmounts and remounts the component, re-running all `useState` initializers.

**When to use:** When a parent wants to reset a child's internal state (e.g., pre-fill a form with new values) without converting the child to fully controlled.

**Trade-offs:**
- Simple — no refactor of the child component's state model
- Loses in-progress user edits when key changes (acceptable for "apply saved route" action)
- If remount is too expensive (many queries), use controlled props instead

**Example:**
```tsx
// page.tsx
const [formKey, setFormKey] = useState('default')

function applyFavorite(route: FavoriteRoute) {
  setByOdOrigin(route.origin)
  setByOdDestination(route.destination)
  setFormKey(route.id)  // key change → QueryForm remounts → reads new initialOrigin/initialDestination
}

<QueryForm
  key={formKey}
  initialOrigin={byOdOrigin}
  initialDestination={byOdDestination}
  onSubmit={handleByOdSubmit}
/>
```

### Pattern 4: router.replace for Non-History URL Updates

**What:** Use `router.replace(url, { scroll: false })` when updating URL to reflect current state without creating a new browser history entry.

**When to use:** Query parameter updates where "back" should go to previous page, not previous query. Form state serialized to URL for shareability.

**Trade-offs:**
- `replace`: Back navigates away from the page entirely (correct for query tools)
- `push`: Back returns to previous query (correct for step-by-step workflows)
- `{ scroll: false }`: Prevents scroll-to-top on each URL update

---

## Anti-Patterns

### Anti-Pattern 1: Reading localStorage in Render (Not in useState Initializer)

**What people do:**
```tsx
// WRONG — runs on server during SSR
const favorites = JSON.parse(localStorage.getItem('thsr-favorites') ?? '[]')
```

**Why it's wrong:** `localStorage` does not exist on the server. This throws `ReferenceError: localStorage is not defined` during SSR and causes hydration mismatch even with `typeof window` guard in render.

**Do this instead:** Read localStorage inside `useState(() => ...)` initializer only, which runs only in the browser environment.

### Anti-Pattern 2: useSearchParams in a Component Without Suspense

**What people do:** Call `useSearchParams()` directly in a component tree without wrapping in `<Suspense>`, trusting that `'use client'` pages won't need it.

**Why it's wrong:** In production builds (`next build`), this fails with:
```
Error: Missing Suspense boundary with useSearchParams
```
The error is invisible in `next dev`, making it easy to ship a broken build.

**Do this instead:** Always wrap the component calling `useSearchParams()` in `<Suspense fallback={...}>`, even when `fallback={null}`.

### Anti-Pattern 3: Full QueryForm Refactor to Controlled Props for Pre-Fill

**What people do:** Convert `QueryForm`'s internal `origin`/`destination` state to fully controlled (value + onChange props) to enable pre-filling from parent.

**Why it's wrong:** Over-engineering for v2.0. The form is self-contained for a reason — controlled conversion requires threading state through the component and is a larger refactor than the feature warrants.

**Do this instead:** Use the `key`-prop remount pattern with `initialOrigin`/`initialDestination` props. Simple, surgical, no structural refactor.

### Anti-Pattern 4: Storing StationName Strings in Saved Favorites

**What people do:** Save `{ origin: 'Nangang', destination: 'Zuoying' }` in localStorage using display names.

**Why it's wrong:** Station display names are locale-dependent and could theoretically change. The TDX API uses StationID (`"1"`, `"12"`) as identifiers.

**Do this instead:** Store StationIDs in `FavoriteRoute` (`origin: "1"`, `destination: "12"`). Compute the display label at save time from station data and store it as a separate `label` string. On render, display the stored label (no dependency on station data for favorites display).

---

## Build Order Recommendation

Features are **partially interdependent**. Build in this order:

### Phase 1: Shareable URL (Feature 3) — Build First

**Why first:** The `SearchParamsInit` component and `useQueryUrl` hook establish URL read/write infrastructure. Feature 3 requires modifications to `query-form.tsx` (adding `initialDate` prop) and `page.tsx` (Suspense wiring). Building this first avoids re-touching these files three times.

**Independence:** Feature 3 has no dependency on Features 1 or 2.

**Deliverable:** User can share a URL like `/?from=1&to=12&date=2026-03-01` and the form pre-fills. Submitting a query updates the URL.

### Phase 2: Saved Routes (Feature 2) — Build Second

**Why second:** Feature 2 shares the `initialOrigin`/`initialDestination` prop pattern and `key`-remount technique that was established in Phase 1. `query-form.tsx` already has `initialDate?` from Phase 1; Phase 2 adds `initialOrigin?` and `initialDestination?` to the same file in one pass.

**Independence:** Feature 2 does not depend on Feature 1 (round-trip). The `useFavoriteRoutes` hook is self-contained.

**Deliverable:** Pill chips above the form for saved routes. "Save this route" button near form. Clicking a chip pre-fills form.

### Phase 3: Round-Trip Query (Feature 1) — Build Last

**Why last:** Feature 1 creates entirely new files (`round-trip-form.tsx`, `round-trip-results.tsx`) and a new tab in `page.tsx`. It does not share files touched in Phases 1 and 2 (except `page.tsx`). Building last means `page.tsx` touches are consolidated: Phase 1 adds Suspense + URL wiring, Phase 2 adds favorites wiring, Phase 3 adds the fourth tab.

If a team works in parallel, Feature 1 can be developed on a separate branch without conflicts since it's additive (new files + new tab).

**Deliverable:** New "來回查詢" tab with two-date form, side-by-side outbound/return train lists.

### Build Order Summary

| Phase | Feature | New Files | Modified Files | Independent? |
|-------|---------|-----------|----------------|-------------|
| 1 | Shareable URL | `search-params-init.tsx`, `use-query-url.ts` | `page.tsx`, `query-form.tsx` | Yes |
| 2 | Saved Routes | `use-favorite-routes.ts`, `favorite-routes.tsx` | `page.tsx`, `query-form.tsx` | Yes (after Phase 1 props added) |
| 3 | Round-Trip | `round-trip-form.tsx`, `round-trip-results.tsx` | `page.tsx`, `types/tdx.ts` | Yes (additive only) |

---

## Integration Points Summary

### Modified Existing Files

| File | Features Touching It | What Changes |
|------|---------------------|-------------|
| `src/app/page.tsx` | 1, 2, 3 | Add `Suspense` + `SearchParamsInit`; add `useFavoriteRoutes`; wire pre-fill via `key` prop; add `by-roundtrip` fourth tab; add `roundTripParams` state |
| `src/components/query-form.tsx` | 2, 3 | Add `initialOrigin?`, `initialDestination?`, `initialDate?` props; use them in `useState` initializers |
| `src/types/tdx.ts` | 1 | Add `RoundTripParams` interface |

### New Files

| File | Feature | Purpose |
|------|---------|---------|
| `src/components/search-params-init.tsx` | 3 | Reads `useSearchParams()`, calls `onInit` once |
| `src/hooks/use-query-url.ts` | 3 | `router.replace()` URL writer |
| `src/hooks/use-favorite-routes.ts` | 2 | localStorage CRUD with SSR guard |
| `src/components/favorite-routes.tsx` | 2 | Pill chip UI for saved routes |
| `src/components/round-trip-form.tsx` | 1 | Origin, destination, two date pickers |
| `src/components/round-trip-results.tsx` | 1 | Two `<TrainList>` instances |

### Unchanged Files

All API route handlers, `train-list.tsx`, `train-card.tsx`, `train-table.tsx`, `station-line-picker.tsx`, `by-train-form.tsx`, `by-train-result.tsx`, `by-station-form.tsx`, `by-station-result.tsx`, `providers.tsx`, `layout.tsx`, `lib/*`, UI components in `components/ui/`.

---

## SSR and Hydration Notes

**Summary of all hydration-sensitive areas in v2.0:**

| Area | Risk | Mitigation |
|------|------|-----------|
| `useSearchParams()` in production build | Build failure if not wrapped in `<Suspense>` | `SearchParamsInit` component always wrapped in `<Suspense fallback={null}>` |
| `localStorage` access during SSR | `ReferenceError` / hydration mismatch | `typeof window === 'undefined'` guard inside `useState()` initializer only |
| `Date` in `initialDate` prop | Server renders UTC date, client renders Taiwan date | `initialDate` passed as already-formatted `YYYY-MM-DD` string, not `Date` object — no timezone issue |
| `crypto.randomUUID()` for favorite IDs | Available in all modern browsers and Node 16+; not an SSR risk when called only in event handlers | Use `Date.now().toString()` as fallback if UUID not needed for uniqueness |

---

## Sources

### Primary (HIGH confidence — verified from official docs)

- [Next.js Docs: useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params) — v16.1.6, updated 2026-02-16. Confirms Suspense requirement, read-only return value, usage in Client Components
- [Next.js Docs: useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router) — v16.1.6, updated 2026-02-16. Confirms `router.replace` vs `router.push` semantics, `{ scroll: false }` option
- [Next.js Docs: Missing Suspense boundary with useSearchParams](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout) — official error documentation, confirmed production build requirement
- [React Docs: key prop for state reset](https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes) — official pattern for resetting child state via key

### From Codebase Analysis (HIGH confidence)

- `src/app/page.tsx` — existing tab structure, state pattern
- `src/components/query-form.tsx` — internal state model, `useState` initializer pattern already established
- `src/components/train-list.tsx` — `queryKey: ['trains', params]` confirms independent queries per param set
- `src/lib/taiwan-date.ts` — existing `typeof window` / `useState` initializer pattern for SSR-safe browser API usage
- `package.json` — Next.js 16.1.6, React 19.2.3, React Query v5 confirmed

---

*Architecture research for: THSR Query Tool v2.0 UX Enhancement — Round-trip, Saved Routes, Shareable URL*
*Researched: 2026-02-19*
