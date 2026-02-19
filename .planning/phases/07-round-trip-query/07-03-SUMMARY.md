---
phase: 07-round-trip-query
plan: 03
subsystem: ui
tags: [react, typescript, tailwind, nextjs]

# Dependency graph
requires:
  - phase: 07-01
    provides: RoundTripForm component and RoundTripParams type
  - phase: 07-02
    provides: RoundTripResult component with dual parallel queries
  - phase: 03-secondary-queries
    provides: Three-tab page.tsx layout (grid-cols-3)
provides:
  - Four-tab page.tsx with round-trip query fully wired end-to-end
  - Human-verified complete round-trip user flow (stations, dates, side-by-side results, booking links)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Additive tab extension pattern — change grid-cols-3 to grid-cols-4, append new TabsContent without touching existing tabs
    - Two-character Chinese tab labels to prevent overflow at 320px viewport width

key-files:
  created: []
  modified:
    - src/app/page.tsx

key-decisions:
  - "Two-character Chinese labels (時間/車次/車站/來回) prevent overflow on 320px viewports — matches pattern from design spike"
  - "roundTripParams state lives in page.tsx — consistent with queryParams/byTrainParam/byStationParam pattern already in place"

patterns-established:
  - "Tab extension pattern: grid-cols-N increment + append TabsContent — zero risk to existing tabs"

requirements-completed: [QURY-05]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 7 Plan 03: Wire Round-Trip Tab Summary

**Four-tab page.tsx with 來回 tab wiring RoundTripForm + RoundTripResult, human-verified end-to-end with date constraint, side-by-side results, and booking links**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-19T10:38:00Z
- **Completed:** 2026-02-19T10:40:00Z
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 1

## Accomplishments
- Extended page.tsx from three-tab to four-tab layout (grid-cols-3 → grid-cols-4) with short 2-character Chinese labels
- Wired RoundTripForm + RoundTripResult into the new 來回 tab using roundTripParams state
- Human verified all 12 verification steps: four tabs render, date constraint enforced, side-by-side results on desktop, stacked on mobile, booking links present, existing tabs unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire fourth round-trip tab into page.tsx** - `dc7bef4` (feat)
2. **Task 2: Human verification of round-trip query end-to-end** - checkpoint approved by user

**Plan metadata:** (committed with docs)

## Files Created/Modified
- `src/app/page.tsx` - Added RoundTripForm/RoundTripResult imports, roundTripParams state, grid-cols-4 TabsList, and fourth 來回 TabsContent

## Decisions Made
- Two-character Chinese labels (時間/車次/車站/來回) selected to prevent overflow on narrow 320px viewports
- roundTripParams state added directly in page.tsx — consistent with existing queryParams/byTrainParam/byStationParam pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 7 (Round-Trip Query) is complete — all three plans (07-01, 07-02, 07-03) shipped
- Milestone v2.0 UX Enhancement is complete — all 7 phases done
- App is production-ready: four-tab query interface with URL sharing, saved favorite routes, and round-trip queries

---
*Phase: 07-round-trip-query*
*Completed: 2026-02-19*
