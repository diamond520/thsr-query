---
phase: 07-round-trip-query
plan: 02
subsystem: ui
tags: [react, tanstack-query, tailwind, typescript]

# Dependency graph
requires:
  - phase: 07-01
    provides: RoundTripParams type and RoundTripForm component
  - phase: 02-core-query
    provides: TrainCard, TrainTable, TdxEnrichedTrain type, /api/tdx/trains route
provides:
  - RoundTripResult component with dual parallel React Query fetches and responsive two-column layout
affects:
  - 07-03 (page integration — will import RoundTripResult)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Discriminated React Query keys ('outbound'/'return' literal) to prevent cache deduplication of parallel queries
    - Internal LegDisplay sub-component for per-leg state machine (loading/error/empty/results)
    - Responsive grid with grid-cols-1 / md:grid-cols-2 for side-by-side layout on desktop

key-files:
  created:
    - src/components/round-trip-result.tsx
  modified: []

key-decisions:
  - "LegDisplay is internal (not exported) — only RoundTripResult is the public API surface"
  - "Discriminated queryKey literals ('outbound'/'return') are mandatory — without them React Query deduplicates parallel queries with identical params"
  - "Return leg swaps origin/destination AND uses returnDate — both are easily missed and both are correct"

patterns-established:
  - "Parallel query pattern: two useQuery calls with different literal discriminators in queryKey prevent cache sharing"
  - "Internal sub-component pattern: LegDisplay handles per-leg rendering, reducing duplication while keeping RoundTripResult readable"

requirements-completed: [QURY-05]

# Metrics
duration: 1min
completed: 2026-02-19
---

# Phase 7 Plan 02: RoundTripResult Summary

**RoundTripResult component with two parallel React Query fetches (discriminated keys) rendering outbound/return legs side-by-side in responsive two-column grid**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-19T10:35:36Z
- **Completed:** 2026-02-19T10:36:35Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created RoundTripResult component with two parallel useQuery calls using discriminated keys ['trains','outbound',params] and ['trains','return',params]
- Return leg correctly swaps origin/destination and uses returnDate (not outboundDate)
- Responsive two-column grid: single column on mobile (grid-cols-1), side-by-side on desktop (md:grid-cols-2)
- Internal LegDisplay sub-component with full independent loading/error/empty/results state machine per leg
- Each leg renders TrainCard (mobile md:hidden) and TrainTable (desktop hidden md:block) — identical to TrainList pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RoundTripResult component** - `a9bd28d` (feat)

**Plan metadata:** (to be committed with docs)

## Files Created/Modified
- `src/components/round-trip-result.tsx` - RoundTripResult component with dual parallel queries and responsive two-column layout

## Decisions Made
- LegDisplay is internal (not exported) — only RoundTripResult is the public API surface; per plan spec
- Discriminated queryKey literals ('outbound'/'return') are mandatory — without them React Query deduplicates structurally-identical params and both legs return outbound data
- Return leg swaps origin/destination AND uses returnDate — both critical correctness requirements

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- RoundTripResult component ready for integration into the round-trip tab in page.tsx (Phase 07-03)
- Component exports RoundTripResult accepting `params: RoundTripParams | null`
- TypeScript compilation clean with no errors

---
*Phase: 07-round-trip-query*
*Completed: 2026-02-19*
