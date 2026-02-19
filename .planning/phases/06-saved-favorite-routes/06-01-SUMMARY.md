---
phase: 06-saved-favorite-routes
plan: 01
subsystem: ui
tags: [react, typescript, localstorage, hooks, ssr, nextjs]

# Dependency graph
requires:
  - phase: 05-shareable-url
    provides: Established 'use client' patterns and page.tsx state management approach
provides:
  - FavoriteRoute type with origin/destination StationID strings
  - FAVORITES_STORAGE_KEY and FAVORITES_MAX constants
  - SSR-safe useLocalStorage<T> generic hook with two-useEffect pattern
  - useFavorites domain hook with addRoute, removeRoute, isFull API
affects: [06-02-PLAN.md, 06-03-PLAN.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Two-useEffect SSR-safe localStorage pattern (read on mount, write after firstLoadDone)
    - Domain hook wrapping generic storage hook for type-safe favorites operations

key-files:
  created:
    - src/types/favorites.ts
    - src/hooks/use-local-storage.ts
    - src/hooks/use-favorites.ts
  modified: []

key-decisions:
  - "Store only StationID strings in localStorage (not full TdxStation objects) — prevents bloat and stale data"
  - "firstLoadDone flag prevents write effect from overwriting localStorage before read effect fires on mount"
  - "addRoute uses functional updater form (prev =>) — reads latest state correctly even with batched React updates"
  - "Silently skip duplicates and silently block at FAVORITES_MAX — no error or toast needed per spec"

patterns-established:
  - "Two-useEffect SSR-safe hook: useState(initialValue) + useEffect for read on mount + useEffect for write after firstLoadDone"
  - "Domain hook thin wrapper: useLocalStorage<T> + useCallback for addRoute/removeRoute + derived isFull"

requirements-completed: [PERS-01]

# Metrics
duration: 1min
completed: 2026-02-19
---

# Phase 6 Plan 01: Saved Favorite Routes Data Layer Summary

**SSR-safe localStorage favorites data layer: FavoriteRoute type, generic useLocalStorage<T> hook with two-useEffect pattern, and useFavorites domain hook with duplicate/capacity guards**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-19T09:18:54Z
- **Completed:** 2026-02-19T09:20:17Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created FavoriteRoute interface and constants (FAVORITES_STORAGE_KEY, FAVORITES_MAX=10) as the canonical data model
- Implemented SSR-safe useLocalStorage<T> generic hook using two-useEffect pattern — prevents ReferenceError during Next.js static prerendering
- Built useFavorites domain hook with addRoute (silent duplicate/capacity guards), removeRoute (functional updater), and isFull derived state

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FavoriteRoute type and constants** - `023d376` (feat)
2. **Task 2: Create SSR-safe useLocalStorage hook** - `13270f7` (feat)
3. **Task 3: Create useFavorites domain hook** - `22f4830` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/types/favorites.ts` - FavoriteRoute interface, FAVORITES_STORAGE_KEY constant, FAVORITES_MAX=10 constant
- `src/hooks/use-local-storage.ts` - Generic SSR-safe useLocalStorage<T> hook with two-useEffect + firstLoadDone flag
- `src/hooks/use-favorites.ts` - Domain hook exposing favorites array, addRoute, removeRoute, isFull

## Decisions Made
- Store only StationID strings (not full TdxStation objects) to prevent localStorage bloat and stale data
- The `firstLoadDone` flag is critical: prevents the write effect from firing with `[]` (initialValue) before the read effect loads stored data from localStorage
- Used `prev => ...` functional updater form in addRoute/removeRoute to correctly read latest state with batched React updates
- Duplicate detection uses exact (origin, destination) string match — silently no-ops per spec

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Data layer complete; 06-02 can immediately consume useFavorites() and FavoriteRoute type
- No blockers; all three files verified TypeScript-clean (tsc --noEmit exits 0)
- No new npm packages needed; all existing dependencies sufficient

---
*Phase: 06-saved-favorite-routes*
*Completed: 2026-02-19*
