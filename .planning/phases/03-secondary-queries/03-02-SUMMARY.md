---
phase: 03-secondary-queries
plan: 02
subsystem: ui
tags: [tdx, react-query, shadcn, nextjs, seat-status, typescript, tabs]

# Dependency graph
requires:
  - phase: 03-secondary-queries-01
    provides: ByTrainForm, ByTrainResult, shadcn Tabs component, TdxStationSeatStatus type, MOCK_SEAT_STATUS_BY_STATION fixture
  - phase: 02-core-query
    provides: QueryForm, TrainList, SeatBadge, Skeleton, TdxSeatStatus types, isMockMode/fetchSeatStatus in tdx-api.ts

provides:
  - GET /api/tdx/seat-status Route Handler with force-dynamic, mock short-circuit, Direction split (0=南下, 1=北上)
  - ByStationForm component: station select reusing ['stations'] React Query cache; emits stationId on submit
  - ByStationResult component: northbound/southbound Tabs with SeatBadge per train; idle/loading/error/empty states
  - page.tsx with top-level three-tab mode switcher (時間查詢 | 車次查詢 | 車站查詢)

affects: [04-polish, any future page.tsx modifications]

# Tech tracking
tech-stack:
  added: []
  patterns: [top-level-mode-tabs (page.tsx wraps all modes in shadcn Tabs; each mode owns independent state), shared-query-cache (ByStationForm reuses queryKey=stations from QueryForm)]

key-files:
  created:
    - src/app/api/tdx/seat-status/route.ts
    - src/components/by-station-form.tsx
    - src/components/by-station-result.tsx
  modified:
    - src/app/page.tsx

key-decisions:
  - "page.tsx top-level Tabs with defaultValue='by-od' — Phase 2 behavior unchanged on load; each tab has independent local state"
  - "ByStationForm reuses queryKey=['stations'] — shares React Query cache with QueryForm (no duplicate fetches)"
  - "TrainSeatRow matches queried stationId against StopStations to display seat status for correct leg"

patterns-established:
  - "Top-level mode tabs: page.tsx owns all mode states; each TabsContent wraps form + result pair"
  - "Shared React Query cache across form components via identical queryKey"

requirements-completed: [QURY-03]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 3 Plan 02: By-Station Query + Mode Integration Summary

**By-station seat status feature with northbound/southbound Tabs, and three-tab mode switcher (時間查詢 | 車次查詢 | 車站查詢) integrated into page.tsx**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T06:55:56Z
- **Completed:** 2026-02-19T06:58:01Z
- **Tasks:** 2
- **Files modified:** 4 (3 created + 1 modified)

## Accomplishments
- GET /api/tdx/seat-status Route Handler with force-dynamic, mock short-circuit, server-side Direction split
- ByStationForm: station select sharing ['stations'] React Query cache with QueryForm; submit emits stationId
- ByStationResult: northbound/southbound shadcn Tabs defaulting to 北上; TrainSeatRow finds correct leg by StationID; all UI states covered (idle, loading, error, empty, result)
- page.tsx updated with top-level three-tab mode switcher; Phase 2 QueryForm + TrainList preserved unchanged inside by-od tab

## Task Commits

Each task was committed atomically:

1. **Task 1: By-station Route Handler and display components** - `9a85b2f` (feat)
2. **Task 2: Integrate all three modes into page.tsx with top-level Tabs** - `d63ddba` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/app/api/tdx/seat-status/route.ts` - GET handler; force-dynamic; mock short-circuit; Direction 0=南下/1=北上 split
- `src/components/by-station-form.tsx` - Station select with queryKey=['stations'] shared cache; emits stationId on submit
- `src/components/by-station-result.tsx` - Northbound/southbound Tabs with SeatBadge per train; all 5 UI states
- `src/app/page.tsx` - Top-level Tabs wrapping all three query modes; each mode has independent local state

## Decisions Made
- `page.tsx` top-level Tabs with `defaultValue="by-od"` — Phase 2 behavior identical on load; each tab owns independent state via `useState` in page component
- `ByStationForm` reuses `queryKey: ['stations']` — shares React Query cache with `QueryForm`; no duplicate station API calls when switching tabs
- `TrainSeatRow` finds stop via `train.StopStations.find(s => s.StationID === stationId)` — correctly shows seat status for the queried station leg

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 fully complete: all three query modes (by-OD, by-train, by-station) working end-to-end in mock mode
- QURY-03 requirement satisfied: by-station seat status queryable with northbound/southbound split
- Ready for Phase 4 (polish/UX improvements); page.tsx three-tab structure is the integration foundation

---
*Phase: 03-secondary-queries*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: src/app/api/tdx/seat-status/route.ts
- FOUND: src/components/by-station-form.tsx
- FOUND: src/components/by-station-result.tsx
- FOUND: src/app/page.tsx
- FOUND: .planning/phases/03-secondary-queries/03-02-SUMMARY.md
- FOUND commit: 9a85b2f (Task 1)
- FOUND commit: d63ddba (Task 2)
