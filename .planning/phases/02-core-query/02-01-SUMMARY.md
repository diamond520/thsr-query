---
phase: 02-core-query
plan: "01"
subsystem: api
tags: [nextjs, typescript, tdx-api, route-handler, mock-data]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: tdx-api.ts with isMockMode/fetchStations, server-only guards, TDX token management, TdxStation types

provides:
  - TdxSeatCode, TdxSeatStop, TdxSeatStatus, TdxDailyTrain, TdxEnrichedTrain types in src/types/tdx.ts
  - MOCK_TRAINS fixture (8 entries, all seat codes including null) in src/fixtures/tdx-mock.ts
  - fetchDailyTrains() and fetchSeatStatus() functions in src/lib/tdx-api.ts
  - GET /api/tdx/trains route handler with parallel fetch, server-side join, force-dynamic caching

affects: [02-02-train-list-ui, 02-03-seat-status-display, 02-04-date-picker]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Left-join pattern: timetable as authoritative dataset, seat status as enrichment via TrainNo map"
    - "Parallel TDX fetch: Promise.all([fetchDailyTrains, fetchSeatStatus]) — never sequential"
    - "force-dynamic on real-time endpoints — seat status changes every 10 minutes, never cache"
    - "Mock mode short-circuit: isMockMode() check at route entry, returns MOCK_TRAINS without any fetch"

key-files:
  created:
    - src/app/api/tdx/trains/route.ts
  modified:
    - src/types/tdx.ts
    - src/fixtures/tdx-mock.ts
    - src/lib/tdx-api.ts

key-decisions:
  - "Route Handler imports MOCK_TRAINS directly from fixtures — tdx-api.ts does not re-export it (keeps concerns separated)"
  - "fetchDailyTrains/fetchSeatStatus have no mock-mode handling — mock short-circuit lives only in route.ts (single responsibility)"
  - "seatMap keyed on TrainNo with timetable as left dataset — AvailableSeatStatusList returns ALL station trains, not filtered by OD"
  - "null businessSeat/standardSeat (not undefined) when train absent from seat list — enables '—' display fallback in UI"

patterns-established:
  - "Parallel fetch pattern: Promise.all() for independent TDX calls — apply to all future multi-endpoint routes"
  - "Server-side join pattern: Map<TrainNo, SeatStatus> for O(1) lookup — apply to any enrichment join"
  - "force-dynamic on real-time data endpoints — no revalidate on seat status or timetable route handlers"

requirements-completed: [QURY-01, QURY-02]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 2 Plan 01: TDX Trains Data Layer Summary

**TDX trains data layer: parallel-fetching /api/tdx/trains Route Handler with server-side timetable+seat join, TdxEnrichedTrain types, and 8-entry mock fixture covering all seat status codes**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T05:43:19Z
- **Completed:** 2026-02-19T05:46:26Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Extended `src/types/tdx.ts` with 5 new Phase 2 types: TdxSeatCode, TdxSeatStop, TdxSeatStatus, TdxDailyTrain, TdxEnrichedTrain
- Added `MOCK_TRAINS` fixture with 8 realistic trains covering all seat codes (O/L/X) plus null businessSeat case
- Added `fetchDailyTrains()` and `fetchSeatStatus()` to `src/lib/tdx-api.ts` for real TDX API mode
- Created `GET /api/tdx/trains` Route Handler with `force-dynamic`, parallel fetch, and server-side Map-based join

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend TDX types and add mock train fixtures** - `f253092` (feat)
2. **Task 2: Extend tdx-api.ts and create /api/tdx/trains Route Handler** - `43cdd70` (feat)

**Plan metadata:** *(docs commit — see below)*

## Files Created/Modified

- `src/types/tdx.ts` - Added TdxSeatCode type + TdxSeatStop, TdxSeatStatus, TdxDailyTrain, TdxEnrichedTrain interfaces
- `src/fixtures/tdx-mock.ts` - Added MOCK_TRAINS array (8 TdxEnrichedTrain entries)
- `src/lib/tdx-api.ts` - Added fetchDailyTrains() and fetchSeatStatus() functions
- `src/app/api/tdx/trains/route.ts` - New: GET route handler with force-dynamic, parallel fetch, server-side join

## Decisions Made

- Route Handler imports MOCK_TRAINS directly from `@/fixtures/tdx-mock` — tdx-api.ts does not re-export it (single responsibility)
- fetchDailyTrains/fetchSeatStatus have no mock-mode handling — mock short-circuit lives only in route.ts
- seatMap keyed on TrainNo with timetable as left dataset — AvailableSeatStatusList returns ALL station trains
- null (not undefined) for absent seat status — enables clean '—' display fallback in UI components

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Endpoint operates in mock mode when TDX credentials are absent.

## Next Phase Readiness

- `TdxEnrichedTrain` type is ready for use in 02-02 (train list UI) and 02-03 (seat status display)
- `GET /api/tdx/trains` endpoint is live and returns mock data — unblocks parallel UI work
- No blockers for Phase 2 UI plans

---
*Phase: 02-core-query*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: src/types/tdx.ts
- FOUND: src/fixtures/tdx-mock.ts
- FOUND: src/lib/tdx-api.ts
- FOUND: src/app/api/tdx/trains/route.ts
- FOUND: 02-01-SUMMARY.md
- FOUND: commit f253092 (feat(02-01): extend TDX types and add mock train fixtures)
- FOUND: commit 43cdd70 (feat(02-01): extend tdx-api.ts and add /api/tdx/trains route handler)
