---
phase: 02-core-query
plan: "02"
subsystem: ui
tags: [nextjs, typescript, shadcn, react-day-picker, date-fns, react-query, taiwan-timezone]

# Dependency graph
requires:
  - phase: 02-core-query
    provides: TdxSeatCode type in src/types/tdx.ts (used by SeatBadge), /api/tdx/stations endpoint (loaded by QueryForm)
  - phase: 01-foundation
    provides: shadcn button component, cn utility, TdxStation type

provides:
  - getTaiwanToday() in src/lib/taiwan-date.ts — Asia/Taipei timezone-aware date for hydration-safe defaults
  - SeatBadge component in src/components/seat-badge.tsx — maps TdxSeatCode to Chinese label + color badge
  - QueryForm component in src/components/query-form.tsx — controlled form with station selects, date picker, swap button
  - QueryParams interface in src/components/query-form.tsx — typed onSubmit callback shape
  - 6 shadcn UI components: select, badge, skeleton, card, calendar, popover

affects: [02-03-train-list, 02-04-page-integration]

# Tech tracking
tech-stack:
  added:
    - react-day-picker@9.13.2 (calendar UI, DayPicker v9 API)
    - date-fns@4.1.0 (date formatting with format())
  patterns:
    - "Hydration-safe date: getTaiwanToday() called inside useState() initializer, never at module/render level"
    - "Controlled form pattern: all select/date values in React state, onSubmit callback prop (no internal navigation)"
    - "React Query for station data: queryKey=['stations'], staleTime=24h — infrequently-changing reference data"

key-files:
  created:
    - src/lib/taiwan-date.ts
    - src/components/seat-badge.tsx
    - src/components/query-form.tsx
    - src/components/ui/select.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/skeleton.tsx
    - src/components/ui/card.tsx
    - src/components/ui/calendar.tsx
    - src/components/ui/popover.tsx
  modified: []

key-decisions:
  - "initialFocus prop omitted from Calendar — deprecated/removed in react-day-picker v9; component uses DayPicker v9 API"
  - "SeatBadge null status renders '—' gray badge — train absent from seat status list is valid, not an error"
  - "QueryForm swap button disabled only when both origin and destination are empty — allows swapping with one value set"

patterns-established:
  - "Taiwan timezone pattern: Intl.DateTimeFormat with en-CA locale produces YYYY-MM-DD without parsing — apply to all date formatting needing Asia/Taipei"
  - "Hydration-safe state initializer: useState(() => fn()) for any time/locale-sensitive defaults"
  - "SeatBadge as shared atom: import in both mobile card and desktop table — do not inline status display logic"

requirements-completed: [UIUX-03, UIUX-04, QURY-01]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 2 Plan 02: Query Form UI and Seat Badge Summary

**QueryForm with Taiwan-timezone date default and swap button, SeatBadge with green/amber/red Chinese labels, and 6 shadcn UI components installed**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T05:48:41Z
- **Completed:** 2026-02-19T05:51:57Z
- **Tasks:** 2
- **Files modified:** 9 created + 2 package files updated

## Accomplishments

- Installed 6 shadcn UI components (select, badge, skeleton, card, calendar, popover) + react-day-picker and date-fns dependencies
- Created `src/lib/taiwan-date.ts` with `getTaiwanToday()` using `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' })` for hydration-safe timezone handling
- Created `src/components/seat-badge.tsx` with STATUS_CONFIG mapping O→green, L→amber, X→red; null→gray dash; 商務席 label in amber
- Created `src/components/query-form.tsx` with controlled station selects, Calendar date picker, ArrowLeftRight swap button, and `onSubmit(QueryParams)` callback

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn components, taiwan-date utility, and SeatBadge component** - `412d499` (feat)
2. **Task 2: Create QueryForm component** - `6221afb` (feat)

**Plan metadata:** *(docs commit — see below)*

## Files Created/Modified

- `src/lib/taiwan-date.ts` - getTaiwanToday() using Intl.DateTimeFormat/Asia/Taipei, hydration-safe
- `src/components/seat-badge.tsx` - SeatBadge component: TdxSeatCode → Chinese label + color badge; 商務席 in amber
- `src/components/query-form.tsx` - QueryForm + QueryParams: station selects, date picker (Taiwan default), swap button
- `src/components/ui/select.tsx` - shadcn Select component
- `src/components/ui/badge.tsx` - shadcn Badge component
- `src/components/ui/skeleton.tsx` - shadcn Skeleton component
- `src/components/ui/card.tsx` - shadcn Card component
- `src/components/ui/calendar.tsx` - shadcn Calendar component (react-day-picker v9)
- `src/components/ui/popover.tsx` - shadcn Popover component
- `package.json` / `package-lock.json` - Added react-day-picker@9.13.2, date-fns@4.1.0

## Decisions Made

- `initialFocus` prop removed from `<Calendar>` — deprecated/removed in react-day-picker v9 (DayPicker v9 API); auto-fixed to maintain TypeScript correctness
- SeatBadge null status renders `—` gray badge, not an error state — train absent from AvailableSeatStatusList is expected
- QueryForm swap button disabled only when both origin AND destination are empty — allows one-sided swap (valid use case)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed deprecated `initialFocus` prop from Calendar**
- **Found during:** Task 2 (Create QueryForm component)
- **Issue:** Plan included `initialFocus` prop on `<Calendar>` but react-day-picker v9 removed this prop; would cause TypeScript error
- **Fix:** Omitted `initialFocus` prop — calendar focus behavior works correctly without it in v9
- **Files modified:** `src/components/query-form.tsx`
- **Verification:** `npx tsc --noEmit` passed with 0 errors; `npm run build` succeeded
- **Committed in:** `6221afb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — removed incompatible API prop)
**Impact on plan:** Minimal — removed one prop not supported by installed library version. All behavior preserved.

## Issues Encountered

None — aside from the `initialFocus` deviation, plan executed as specified.

## User Setup Required

None - no external service configuration required. QueryForm loads stations from existing mock-mode /api/tdx/stations endpoint.

## Next Phase Readiness

- `SeatBadge` is ready for use in 02-03 (train list display with seat status columns)
- `QueryForm` + `QueryParams` are ready for 02-04 (page integration connecting form to train list)
- All shadcn UI components needed by 02-03 and 02-04 are installed (card, skeleton, badge, select)
- No blockers for remaining Phase 2 plans

---
*Phase: 02-core-query*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: src/lib/taiwan-date.ts
- FOUND: src/components/seat-badge.tsx
- FOUND: src/components/query-form.tsx
- FOUND: src/components/ui/select.tsx
- FOUND: src/components/ui/badge.tsx
- FOUND: src/components/ui/skeleton.tsx
- FOUND: src/components/ui/card.tsx
- FOUND: src/components/ui/calendar.tsx
- FOUND: src/components/ui/popover.tsx
- FOUND: 02-02-SUMMARY.md
- FOUND: commit 412d499 (feat(02-02): install shadcn components, taiwan-date utility, and SeatBadge)
- FOUND: commit 6221afb (feat(02-02): create QueryForm component with station selects, date picker, and swap)
