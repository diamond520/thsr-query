# Phase 6: Saved Favorite Routes - Research

**Researched:** 2026-02-19
**Domain:** localStorage persistence, React custom hooks (SSR-safe), chip UI components
**Confidence:** HIGH

---

## Summary

Phase 6 adds localStorage-backed favorite route saving to the by-OD (time-based) query tab. Users select origin/destination stations and can save them as a named route (up to 10 max). Saved routes appear as clickable chips above the query form; clicking a chip fills the origin/destination selects. Users can delete routes, which instantly removes the chip. Data persists across browser restarts via `localStorage`.

The core technical challenge is **SSR-safe localStorage access in Next.js App Router**. Even `'use client'` components execute on the server during static prerendering — accessing `localStorage` in `useState` initializers or component body causes `ReferenceError: localStorage is not defined` at build time. The correct pattern is to defer all `localStorage` reads into `useEffect`, initializing state with the empty default on first render, then syncing from storage after hydration.

No new npm packages are needed. The entire feature is achievable with: a custom `useLocalStorage` hook (hand-rolled, ~40 lines), the existing `Badge` component from shadcn/ui (used as interactive chips), and the `X` icon from `lucide-react` already installed. The data model is a simple typed array of `{ origin: string, destination: string }` stored as JSON.

**Primary recommendation:** Hand-roll a minimal SSR-safe `useLocalStorage<T>` hook using `useState` + two `useEffect`s (read on mount, write on change). Use the existing shadcn/ui `Badge` component styled as interactive chips with an `X` delete button. Wire save/apply from `page.tsx` as prop callbacks into `QueryForm` and a new `FavoriteRoutes` component.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERS-01 | 使用者可儲存常用起訖站組合（最多 10 組，localStorage 持久化，不需登入） | Custom `useLocalStorage<FavoriteRoute[]>` hook persists array; max-10 enforced at save time by checking `favorites.length < 10`; no auth required (browser-only storage) |
| PERS-03 | 使用者可點擊已儲存路線一鍵帶入查詢表單起訖站，並可刪除已儲存路線 | `FavoriteRouteChips` component renders clickable chips (shadcn/ui `Badge`) with `onClick` to fill form fields and `X` button to delete; immediate re-render via React state |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `localStorage` (browser built-in) | Web Storage API | Persist favorite routes array as JSON | No expiry, persists across sessions, no package needed, universal browser support |
| Custom `useLocalStorage<T>` hook | hand-rolled (~40 lines) | SSR-safe wrapper: reads on mount, writes on state change | No external package; avoids `window is not defined` at build time; keeps logic centralized |
| shadcn/ui `Badge` | already installed | Route chip display (clickable to apply, X to delete) | Already in project; `outline` variant styled as interactive element |
| `lucide-react` `X` icon | ^0.574.0 (already installed) | Delete button inside route chip | `X` is the canonical "close/remove" icon in lucide |
| `lucide-react` `Star` / `BookmarkPlus` icon | ^0.574.0 (already installed) | Save button trigger in query form area | Visually communicates "save this route" action |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` `Star` or `Heart` | already installed | Save favorite button icon | Either works; `Star` is the conventional "favorite" metaphor |
| React `useState` + `useEffect` | React 19 built-in | Core hook mechanism for SSR-safe localStorage | Always — no alternative for this pattern in App Router |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled hook | `usehooks-ts` `useLocalStorage` | usehooks-ts adds a package dependency; not worth it for a ~40-line hook |
| Hand-rolled hook | `use-local-storage-state` npm package | Better concurrent safety via `useSyncExternalStore`, but overkill for single-tab app; adds package |
| Hand-rolled hook | shadcn/ui registry `useLocalStorage` | shadcn.io hosts a community registry hook but it is NOT part of core shadcn/ui; would require `npx shadcn@latest add` from external registry — avoid for simplicity |
| shadcn/ui `Badge` as chip | Custom `<div>` chip | Badge already in project with correct Tailwind classes; no need to reinvent |

**Installation:** No new packages needed. All APIs are available (browser built-in, existing shadcn/ui, existing lucide-react).

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   └── use-local-storage.ts     # NEW: SSR-safe generic useLocalStorage<T> hook
├── components/
│   ├── favorite-route-chips.tsx # NEW: chip list + delete button; reads from hook
│   ├── query-form.tsx           # MODIFIED: add save button (shown when origin+dest selected)
│   └── (others unchanged)
├── types/
│   └── favorites.ts             # NEW: FavoriteRoute type { origin, destination }
├── app/
│   └── page.tsx                 # MODIFIED: wire useFavorites state; pass callbacks to children
```

### Pattern 1: SSR-Safe useLocalStorage Hook (useState + two useEffects)
**What:** Initialize state with the fallback value (`[]` for routes). On mount (first `useEffect`), read from `localStorage` and update state. On value change (second `useEffect`), write back to `localStorage`. A `firstLoadDone` flag prevents the write effect from overwriting storage with the initial value before the read effect runs.

**When to use:** Any time `localStorage` is needed in a Next.js App Router `'use client'` component. This avoids the `ReferenceError` at build time.

**Why not `useState` lazy initializer directly:** `useState(() => localStorage.getItem(key))` throws on the server because `localStorage` doesn't exist in Node. The hook must defer that read to `useEffect`.

**Source:** Pattern from lean1190 gist (verified matches Next.js SSR requirements), cross-verified with official Next.js docs on client-only APIs.

```typescript
// Source: Adapted from https://gist.github.com/lean1190/d3248bcf758edcac1829bbcc252b3390
// src/hooks/use-local-storage.ts
'use client'

import { Dispatch, SetStateAction, useEffect, useState } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  // Read from localStorage on mount (client-only — never runs on server)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item) as T)
      }
    } catch (error) {
      console.error('[useLocalStorage] read error', error)
    }
    setFirstLoadDone(true)
  }, [key])

  // Write to localStorage whenever storedValue changes, but only after first load
  useEffect(() => {
    if (!firstLoadDone) return
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error('[useLocalStorage] write error', error)
    }
  }, [storedValue, firstLoadDone, key])

  return [storedValue, setStoredValue]
}
```

### Pattern 2: FavoriteRoute Data Model
**What:** A typed array stored under a single localStorage key. Each route is an `{ origin: string, destination: string }` object where `origin` and `destination` are TDX StationIDs (e.g., `"1"`, `"12"`).

**When to use:** Whenever adding, removing, or listing saved routes.

```typescript
// src/types/favorites.ts
export interface FavoriteRoute {
  origin: string       // TDX StationID e.g. "1"
  destination: string  // TDX StationID e.g. "12"
}

export const FAVORITES_STORAGE_KEY = 'thsr-favorite-routes'
export const FAVORITES_MAX = 10
```

### Pattern 3: useFavorites Domain Hook
**What:** A thin wrapper over `useLocalStorage` that exposes `addRoute`, `removeRoute`, and `isFull` — domain-specific operations on the array.

**When to use:** Use in `page.tsx` (or wherever the state is hosted) to pass down as props.

```typescript
// src/hooks/use-favorites.ts
import { useCallback } from 'react'
import { useLocalStorage } from './use-local-storage'
import type { FavoriteRoute } from '@/types/favorites'
import { FAVORITES_STORAGE_KEY, FAVORITES_MAX } from '@/types/favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<FavoriteRoute[]>(
    FAVORITES_STORAGE_KEY,
    []
  )

  const addRoute = useCallback((route: FavoriteRoute) => {
    setFavorites(prev => {
      // Prevent duplicates: check if exact (origin, destination) pair already exists
      const isDuplicate = prev.some(
        r => r.origin === route.origin && r.destination === route.destination
      )
      if (isDuplicate || prev.length >= FAVORITES_MAX) return prev
      return [...prev, route]
    })
  }, [setFavorites])

  const removeRoute = useCallback((index: number) => {
    setFavorites(prev => prev.filter((_, i) => i !== index))
  }, [setFavorites])

  const isFull = favorites.length >= FAVORITES_MAX

  return { favorites, addRoute, removeRoute, isFull }
}
```

### Pattern 4: FavoriteRouteChips Component
**What:** Renders saved routes as a horizontal scrollable row of chips. Each chip shows station names (resolved from the stations list), is clickable to apply, and has an `X` button to delete.

**When to use:** Render above the `QueryForm` in the `by-od` tab content, but only if `favorites.length > 0`.

```typescript
// src/components/favorite-route-chips.tsx
'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { FavoriteRoute } from '@/types/favorites'
import type { TdxStation } from '@/types/tdx'

interface FavoriteRouteChipsProps {
  favorites: FavoriteRoute[]
  stations: TdxStation[]
  onApply: (route: FavoriteRoute) => void
  onRemove: (index: number) => void
}

export function FavoriteRouteChips({
  favorites,
  stations,
  onApply,
  onRemove,
}: FavoriteRouteChipsProps) {
  if (favorites.length === 0) return null

  function getStationName(id: string): string {
    return stations.find(s => s.StationID === id)?.StationName.Zh_tw ?? id
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {favorites.map((route, index) => (
        <Badge
          key={`${route.origin}-${route.destination}-${index}`}
          variant="secondary"
          className="cursor-pointer hover:bg-secondary/80 pr-1 gap-1"
          onClick={() => onApply(route)}
        >
          <span>
            {getStationName(route.origin)} → {getStationName(route.destination)}
          </span>
          <button
            type="button"
            aria-label={`刪除 ${getStationName(route.origin)} 到 ${getStationName(route.destination)}`}
            className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
            onClick={(e) => {
              e.stopPropagation()  // prevent onApply from firing
              onRemove(index)
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}
```

### Pattern 5: Save Button in QueryForm
**What:** A "儲存" (Save) button that appears when both origin and destination are selected AND the route list is not full. Hidden (not just disabled) when at capacity.

**When to use:** Inside `QueryForm`, adjacent to the search button or in a separate row.

**Integration approach:** `QueryForm` receives two new optional props: `onSave?: (origin: string, destination: string) => void` and `isSaveDisabled?: boolean`. When `isSaveDisabled` is true (at capacity), the button is hidden. This keeps `QueryForm` stateless w.r.t. favorites and avoids prop drilling of the full favorites array.

```typescript
// Inside query-form.tsx — add to props interface
interface QueryFormProps {
  onSubmit: (params: QueryParams) => void
  initialOrigin?: string
  initialDestination?: string
  initialDate?: string
  onSave?: (origin: string, destination: string) => void  // NEW
  isFavoriteFull?: boolean                                 // NEW
}

// Inside the JSX, after the submit button:
{onSave && !isFavoriteFull && origin && destination && origin !== destination && (
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => onSave(origin, destination)}
    className="w-full"
  >
    <Star className="mr-2 h-4 w-4" />
    儲存路線
  </Button>
)}
```

### Pattern 6: Wiring in page.tsx
**What:** `page.tsx` calls `useFavorites()` and passes down callbacks.

```typescript
// src/app/page.tsx additions
const { favorites, addRoute, removeRoute, isFull } = useFavorites()

// Apply handler: fill the form and trigger query
function handleApplyFavorite(route: FavoriteRoute) {
  setInitialOrigin(route.origin)
  setInitialDestination(route.destination)
  setFormKey(k => k + 1)   // remount QueryForm to pick up new values
  // Optionally auto-submit if date is already set:
  if (queryParams?.date) {
    setQueryParams({ origin: route.origin, destination: route.destination, date: queryParams.date })
  }
}

// JSX in by-od TabsContent:
<FavoriteRouteChips
  favorites={favorites}
  stations={stations}   // need stations here too — see note below
  onApply={handleApplyFavorite}
  onRemove={removeRoute}
/>
```

**Note on stations in page.tsx:** `FavoriteRouteChips` needs stations to resolve station names. Two options:
1. Lift the `useQuery({ queryKey: ['stations'] })` call from `QueryForm` up to `page.tsx`, pass stations as props to both `QueryForm` and `FavoriteRouteChips`. This is the cleaner approach for Phase 6.
2. Keep stations inside `QueryForm`, pass station name resolver as a prop. This is more complex.

**Recommendation: Option 1** — lift `useQuery(['stations'])` from `QueryForm` to `page.tsx` and pass `stations` as a prop. React Query will deduplicate the fetch (same `queryKey`), so there is no performance cost. This avoids passing a resolver function as a prop.

### Anti-Patterns to Avoid
- **Reading `localStorage` in `useState` initializer:** `useState(() => localStorage.getItem(...))` throws `ReferenceError` on the server during static prerendering. Always defer to `useEffect`.
- **Storing full `TdxStation` objects in localStorage:** Only store `StationID` strings. Station data is fetched from the API and cached by React Query. Storing full station objects would bloat localStorage and create stale data issues.
- **Duplicate detection by index only:** The `removeRoute(index)` approach is correct (index is the array position). But don't use array index as React `key` when the list can be reordered or when items may be duplicates — use a compound key like `` `${origin}-${destination}-${index}` ``.
- **Not stopping propagation on the delete button:** Inside the chip's click handler that applies the route, the `X` button must call `e.stopPropagation()` to prevent triggering `onApply` when the user only wants to delete.
- **Blocking save when duplicate exists:** The `addRoute` implementation should silently no-op for duplicates, not throw or show an error. The save button appearing when an identical route already exists is harmless.
- **Showing the save button for same-origin/destination:** The condition `origin !== destination` must be part of the save button visibility check (matches the existing `isValid` logic in `QueryForm`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage JSON serialization | Manual `JSON.stringify`/`JSON.parse` scattered across components | `useLocalStorage<T>` hook | Centralizes error handling, SSR guard, and JSON round-trip in one place |
| Chip delete button | Full custom chip component from scratch | shadcn/ui `Badge` + `X` icon + `button` inside | Badge already has the right Tailwind classes; no need to reinvent |
| Cross-tab sync | `storage` event listener + complex state sync | Not needed for this phase | The requirement is single-tab persistence; cross-tab sync adds complexity with no user benefit per the spec |
| Full-page state manager | Redux/Zustand for favorites | `useFavorites` hook | 10-item array is trivially managed with React state; external store is overkill |

**Key insight:** localStorage is just a synchronous key-value store that accepts strings. The entire complexity is: (1) SSR-safe deferral to `useEffect` and (2) JSON serialization. Once those are handled in the hook, the rest is straightforward React state management.

---

## Common Pitfalls

### Pitfall 1: `localStorage is not defined` at Build Time
**What goes wrong:** Build fails with `ReferenceError: localStorage is not defined` during `next build`.
**Why it happens:** Next.js statically prerenders `'use client'` components on the server. `localStorage` doesn't exist in Node. Any access outside `useEffect` causes this error.
**How to avoid:** Use the two-`useEffect` pattern in the custom hook. Never access `localStorage` in `useState` initializers, component body, or render-time logic.
**Warning signs:** Works in `next dev`, fails in `next build`.

### Pitfall 2: Hydration Mismatch (Flash of Empty State)
**What goes wrong:** Server renders empty `[]` (no favorites); client hydrates with the stored array from localStorage. React detects a mismatch and may show a hydration warning or flicker.
**Why it happens:** Server and client render different HTML for the chips area.
**How to avoid:** This is expected and acceptable when using the `useState` + `useEffect` pattern. The chip area will show empty initially, then populate after the `useEffect` read fires. Since this is below the fold (form controls) and data loads fast (localStorage is synchronous), the flicker is imperceptible. No `suppressHydrationWarning` needed.
**Warning signs:** Hydration error in dev console. Check if you accidentally read localStorage outside `useEffect`.

### Pitfall 3: Save Button Fires Before Stations Loaded
**What goes wrong:** User clicks save before the stations API responds. `origin`/`destination` are valid StationIDs but station names can't be resolved for display.
**Why it happens:** Stations take ~200ms to load from the API.
**How to avoid:** The save button is only shown when `origin && destination && origin !== destination` — those fields can only be set after stations are loaded (station picker is disabled while loading). So the save button naturally can't appear until stations are ready. No extra guard needed.

### Pitfall 4: Exceeding 10 Items Due to Race Condition
**What goes wrong:** In theory, multiple rapid clicks could add the same route multiple times before the state updates.
**Why it happens:** React state updates are asynchronous; functional updater (`prev => ...`) mitigates but `localStorage` writes via `useEffect` are deferred.
**How to avoid:** The `addRoute` functional updater checks `prev.length >= FAVORITES_MAX` and duplicate before adding. Because it uses functional form, it reads the latest state correctly even with batched updates.

### Pitfall 5: Stations Not Available in `FavoriteRouteChips`
**What goes wrong:** Chips render but station names show as raw IDs (e.g., "1 → 12" instead of "南港 → 左營").
**Why it happens:** `FavoriteRouteChips` needs the stations list to resolve names. If stations aren't passed or are still loading, names can't be resolved.
**How to avoid:** Lift `useQuery(['stations'])` to `page.tsx` and pass `stations` prop. While `stations.length === 0` (loading), show IDs as fallback or skip name resolution. React Query caches this query for 24h so after first load it's instant.

### Pitfall 6: Apply Favorite Overwrites Date
**What goes wrong:** User applies a favorite route, which remounts `QueryForm` via `formKey` increment. If `initialDate` is not reset, the previously set date remains (correct behavior). But if `initialDate` was from a URL param that has already been used, applying a favorite might not update the date.
**Why it happens:** `handleApplyFavorite` only sets origin/destination; date is not part of a favorite route.
**How to avoid:** Keep date separate from favorite routes (per spec: PERS-01/PERS-03 only save origin/destination, not date). When applying a favorite, only update origin/destination state. Keep `initialDate` as-is. The user selects the date separately. This is the correct behavior per the requirements.

---

## Code Examples

Verified patterns from official sources:

### SSR-Safe Hook: Two-useEffect Pattern
```typescript
// Source: Adapted from https://gist.github.com/lean1190/d3248bcf758edcac1829bbcc252b3390
// Verified against: https://nextjs.org/docs/app/getting-started/server-and-client-components
// src/hooks/use-local-storage.ts
'use client'

import { Dispatch, SetStateAction, useEffect, useState } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T)
      }
    } catch (error) {
      console.error('[useLocalStorage] read error', error)
    }
    setFirstLoadDone(true)
  }, [key])  // runs once on mount per key

  useEffect(() => {
    if (!firstLoadDone) return
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error('[useLocalStorage] write error', error)
    }
  }, [storedValue, firstLoadDone, key])

  return [storedValue, setStoredValue]
}
```

### Storing and Reading Array from localStorage
```typescript
// Source: MDN Web Storage API — https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
// Store: JSON.stringify converts array → string
localStorage.setItem('thsr-favorite-routes', JSON.stringify([
  { origin: '1', destination: '12' },
  { origin: '5', destination: '1' }
]))

// Read: JSON.parse converts string → array
const raw = localStorage.getItem('thsr-favorite-routes')
const favorites = raw ? JSON.parse(raw) as FavoriteRoute[] : []
```

### Chip with Delete Button (shadcn/ui Badge + lucide X)
```typescript
// Source: shadcn/ui Badge docs (ui.shadcn.com/docs/components/badge)
// + lucide-react X icon (lucide.dev/icons/x)
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

<Badge
  variant="secondary"
  className="cursor-pointer pr-1 gap-1 hover:bg-secondary/80"
  onClick={() => onApply(route)}
>
  南港 → 左營
  <button
    type="button"
    aria-label="刪除"
    className="rounded-full hover:bg-destructive/20 p-0.5"
    onClick={(e) => { e.stopPropagation(); onRemove(index) }}
  >
    <X className="h-3 w-3" />
  </button>
</Badge>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useState(() => localStorage.getItem(key))` lazy initializer | `useState(initial)` + `useEffect` for read | Always (SSR requirement) | Lazy initializer throws on server; must defer to effect |
| `document.execCommand` for storage interaction | `window.localStorage` API | Deprecated ~2015 | localStorage is the standard; no change needed |
| Cross-tab sync via `storage` event | Not required for this phase | N/A | Out of scope per requirements |
| `useSyncExternalStore` for localStorage | `useState` + `useEffect` for single-tab app | N/A | `useSyncExternalStore` is more correct for reactive stores but adds complexity; overkill for this use case |

**Deprecated/outdated:**
- `document.execCommand`: deprecated; irrelevant here (this is for copy operations not storage)
- `sessionStorage` instead of `localStorage`: would not satisfy the persistence requirement (session-only, closes on tab close)

---

## Open Questions

1. **Should clicking a favorite chip auto-submit the query?**
   - What we know: PERS-03 says "一鍵帶入查詢表單起訖站" — bring into form, not auto-submit
   - What's unclear: Whether to also auto-execute the query (like Phase 5 does with URL params)
   - Recommendation: Only fill form fields; do not auto-execute. The user should confirm by clicking 查詢. This matches the literal requirement wording and avoids surprising behavior when the user wants to change the date first.

2. **Should duplicate routes be rejected or silently skipped?**
   - What we know: The spec says "最多 10 組" (max 10 groups) — no mention of deduplication
   - What's unclear: User intent when saving an identical route
   - Recommendation: Silently skip duplicates (same origin AND destination). No toast or error message needed. The save button remains visible for the duplicate route so the user doesn't wonder why it didn't work — the duplicate check is silent.

3. **Should the save button appear on desktop (md:) as well as mobile?**
   - What we know: The by-OD form has separate mobile/desktop layouts (StationLinePicker vs Select dropdowns)
   - What's unclear: Whether the save button should span both layouts or only be in one row
   - Recommendation: Place the save button as a full-width `Button` in a new row below the submit button. This works for both mobile and desktop without needing responsive duplication.

4. **What happens at 10 routes: hide save button or show at-capacity message?**
   - What we know: PERS-01 says "已達上限時按鈕隱藏" (button hidden when at capacity)
   - What's unclear: Nothing — the spec is explicit
   - Recommendation: Hide the button (`!isFavoriteFull` condition), no message needed.

---

## Sources

### Primary (HIGH confidence)
- https://nextjs.org/docs/app/getting-started/server-and-client-components — Server vs Client Component behavior with localStorage
- https://sentry.io/answers/referenceerror-localstorage-is-not-defined-in-next-js/ — ReferenceError: localStorage is not defined; `useEffect` solution
- https://nextjs-faq.com/browser-api-client-component — Why `'use client'` does not mean browser-only execution
- https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage — localStorage API, JSON serialization pattern
- https://ui.shadcn.com/docs/components/badge — shadcn/ui Badge component API and variants
- https://lucide.dev/icons/x — `X` icon name and usage in lucide-react

### Secondary (MEDIUM confidence)
- https://gist.github.com/lean1190/d3248bcf758edcac1829bbcc252b3390 — Two-`useEffect` SSR-safe `useLocalStorage` pattern (matches Next.js SSR requirements; cross-verified with official Next.js client-component docs)
- https://usehooks-ts.com/react-hook/use-local-storage — usehooks-ts approach: `initializeWithValue: false` for SSR (confirms deferral is correct pattern)
- https://www.nico.fyi/blog/ssr-friendly-local-storage-react-custom-hook — `useSyncExternalStore` alternative (shows more advanced approach; not recommended for this phase)

### Tertiary (LOW confidence)
- https://www.shadcn.io/hooks/use-local-storage — Community shadcn registry hook (not core shadcn/ui; installation via external registry; not recommended — hand-roll instead)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all tools already in project; localStorage is a universal browser API
- Architecture (SSR-safe hook pattern): HIGH — verified against official Next.js docs and multiple implementation sources that agree on the two-`useEffect` approach
- Architecture (chip component): HIGH — shadcn/ui Badge is already in the project; lucide X icon is documented
- Architecture (integration into page.tsx): HIGH — follows established Phase 5 patterns (key-prop remount, callback lifting)
- Pitfalls: HIGH — all derived from verified Next.js SSR behavior and React rendering model

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (localStorage API is stable; Next.js App Router behavior well-documented; shadcn/ui components rarely change)
