---
phase: 03-secondary-queries
plan: 01
subsystem: api
tags: [tdx, react-query, shadcn, nextjs, timetable, typescript]

# Dependency graph
requires:
  - phase: 02-core-query
    provides: TdxSeatStatus types, isMockMode/fetchSeatStatus patterns, shadcn Button/Skeleton/Badge components, React Query setup

provides:
  - TdxGeneralTimetableStop, TdxGeneralTimetableResponse, TdxTrainStop, TdxStationSeatStatus types in src/types/tdx.ts
  - MOCK_TIMETABLE_BY_TRAIN (3 trains) and MOCK_SEAT_STATUS_BY_STATION fixtures
  - fetchGeneralTimetable(trainNo) in tdx-api.ts
  - GET /api/tdx/timetable-by-train Route Handler with mock short-circuit and TDX normalization
  - ByTrainForm component with /^\d{1,4}$/ validation
  - ByTrainResult component with idle/loading/error/empty/result states
affects: [03-02-by-station, page.tsx integration in Plan 02]

# Tech tracking
tech-stack:
  added: [shadcn/ui tabs, shadcn/ui input, shadcn/ui label]
  patterns: [mock-keyed-by-param (MOCK_TIMETABLE_BY_TRAIN Record<string, T[]>), form-result-separation (form emits value, result fetches independently)]

key-files:
  created:
    - src/app/api/tdx/timetable-by-train/route.ts
    - src/components/by-train-form.tsx
    - src/components/by-train-result.tsx
    - src/components/ui/tabs.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
  modified:
    - src/types/tdx.ts
    - src/fixtures/tdx-mock.ts
    - src/lib/tdx-api.ts

key-decisions:
  - "TdxTrainStop normalized server-side in route.ts (not in tdx-api.ts) — consistent with Phase 2 pattern where tdx-api.ts stays raw TDX shapes"
  - "MOCK_TIMETABLE_BY_TRAIN keyed by trainNo string, unknown keys return [] — mirrors real API behavior where missing trainNo yields empty array not error"
  - "ByTrainResult receives trainNo string | null (null = idle, no query submitted) — clean state machine without separate boolean flag"

patterns-established:
  - "Route Handler mock short-circuit: isMockMode() ? return MOCK_MAP[param] ?? [] : call real API"
  - "form-result split: form owns input state, emits committed value via onSubmit prop; result component owns fetch lifecycle"

requirements-completed: [QURY-03]

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 3 Plan 01: By-Train Query Summary

**TDX GeneralTimetable/TrainNo Route Handler + ByTrainForm/ByTrainResult components for full stop-timeline query by train number**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T06:49:05Z
- **Completed:** 2026-02-19T06:53:08Z
- **Tasks:** 2
- **Files modified:** 9 (3 modified + 6 created)

## Accomplishments
- Phase 3 type layer complete: TdxGeneralTimetableStop, TdxGeneralTimetableResponse, TdxTrainStop, TdxStationSeatStatus
- Mock data added for 3 trains (0101 southbound 12-stop, 0102 northbound 12-stop, 0115 express 6-stop)
- GET /api/tdx/timetable-by-train with mock short-circuit and proper empty-array handling for unknown trains
- ByTrainForm validates /^\d{1,4}$/ and disables submit button for invalid input
- ByTrainResult covers all 5 UI states: idle/loading/error/empty/result with stop timeline table

## Task Commits

Each task was committed atomically:

1. **Task 1: Types, mock data, and tdx-api extension** - `1a10323` (feat)
2. **Task 2: Route Handler and display components for by-train query** - `ddcc9f6` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/types/tdx.ts` - Added TdxGeneralTimetableStop, TdxGeneralTimetableResponse, TdxTrainStop, TdxStationSeatStatus
- `src/fixtures/tdx-mock.ts` - Added MOCK_TIMETABLE_BY_TRAIN (3 trains, keyed by trainNo) and MOCK_SEAT_STATUS_BY_STATION
- `src/lib/tdx-api.ts` - Added fetchGeneralTimetable(trainNo) with empty-array guard for missing train
- `src/app/api/tdx/timetable-by-train/route.ts` - GET handler with force-dynamic, mock/real branching, normalization
- `src/components/by-train-form.tsx` - Train number input form with digit validation
- `src/components/by-train-result.tsx` - Stop timeline display with all 5 states
- `src/components/ui/tabs.tsx` - shadcn Tabs component (installed)
- `src/components/ui/input.tsx` - shadcn Input component (installed)
- `src/components/ui/label.tsx` - shadcn Label component (installed, auto-fix)

## Decisions Made
- TdxTrainStop normalization done in route.ts (not tdx-api.ts) — consistent with Phase 2 pattern where tdx-api.ts stays raw TDX shapes only
- MOCK_TIMETABLE_BY_TRAIN keyed by trainNo string, unknown keys return [] — mirrors real API behavior
- ByTrainResult receives `trainNo: string | null` (null = idle) — clean state machine without extra boolean

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing shadcn/ui label component**
- **Found during:** Task 2 (ByTrainForm component creation)
- **Issue:** `by-train-form.tsx` imports `@/components/ui/label` which was not installed; TypeScript error TS2307 blocked compilation
- **Fix:** Ran `npx shadcn@latest add label` to install `src/components/ui/label.tsx`
- **Files modified:** src/components/ui/label.tsx (created)
- **Verification:** `npx tsc --noEmit` passes with 0 errors after install
- **Committed in:** ddcc9f6 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — missing shadcn component)
**Impact on plan:** Required install of shadcn label component not listed in plan. No scope creep.

## Issues Encountered
None beyond the auto-fixed missing label component.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ByTrainForm and ByTrainResult are ready to embed in page.tsx (Plan 03-02)
- MOCK_SEAT_STATUS_BY_STATION ready for Phase 3 Plan 02 (by-station query)
- All Phase 3 types defined; 03-02 can extend without modifying these types

---
*Phase: 03-secondary-queries*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: src/app/api/tdx/timetable-by-train/route.ts
- FOUND: src/components/by-train-form.tsx
- FOUND: src/components/by-train-result.tsx
- FOUND: src/components/ui/tabs.tsx
- FOUND: src/components/ui/input.tsx
- FOUND: .planning/phases/03-secondary-queries/03-01-SUMMARY.md
- FOUND commit: 1a10323 (Task 1)
- FOUND commit: ddcc9f6 (Task 2)
