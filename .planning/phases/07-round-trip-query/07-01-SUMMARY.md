---
phase: 07-round-trip-query
plan: "01"
subsystem: ui
tags: [react, typescript, shadcn-ui, react-day-picker, tanstack-query, date-fns]

# Dependency graph
requires:
  - phase: 04-ui-polish
    provides: StationLinePicker component for mobile station selection
  - phase: 02-core-query
    provides: QueryForm patterns (fetchStations, station selects, date picker, swap button)
provides:
  - RoundTripParams interface (src/types/round-trip.ts)
  - RoundTripForm component with shared station pair + two independent date pickers
affects: [07-02-round-trip-query, 07-03-round-trip-query]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Local fetchStations function duplicated (not shared) — avoids coupling between query forms"
    - "getTaiwanToday() inside useState() initializer — hydration-safe for both outboundDate and returnDate"
    - "react-day-picker v9 disabled={{ before: outboundDate }} syntax for date range constraints"
    - "handleOutboundDateSelect clamps returnDate to avoid invalid state (returnDate < outboundDate)"

key-files:
  created:
    - src/types/round-trip.ts
    - src/components/round-trip-form.tsx
  modified: []

key-decisions:
  - "fetchStations duplicated in round-trip-form.tsx (not shared with query-form.tsx) — avoids coupling, consistent with plan spec"
  - "react-day-picker v9 disabled={{ before: outboundDate }} syntax — NOT fromDate/toDate (removed in v9)"
  - "Return date clamp on outbound change: if (returnDate < d) setReturnDate(d) — prevents invalid state silently"

patterns-established:
  - "Pattern: Two-date form with return constrained to outbound via disabled={{ before }} matcher"
  - "Pattern: State clamp on date change handler — auto-advance return date when outbound advances past it"

requirements-completed: [QURY-05]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 7 Plan 01: Round-Trip Query Summary

**RoundTripParams type + RoundTripForm with shared station picker, two independent date pickers, and return-date clamping via react-day-picker v9 disabled matcher**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-19T10:32:03Z
- **Completed:** 2026-02-19T10:33:40Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `RoundTripParams` interface with four string fields (origin, destination, outboundDate, returnDate)
- Created `RoundTripForm` component mirroring QueryForm patterns with mobile StationLinePicker + desktop Select dropdowns
- Implemented two independent date pickers with return date constrained via `disabled={{ before: outboundDate }}` (react-day-picker v9 syntax)
- Implemented `handleOutboundDateSelect` clamping returnDate forward when outbound date advances past it
- TypeScript compiles cleanly with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RoundTripParams type** - `027c3ef` (feat)
2. **Task 2: Create RoundTripForm component** - `3b76fac` (feat)

## Files Created/Modified
- `src/types/round-trip.ts` - RoundTripParams interface with origin, destination, outboundDate, returnDate fields
- `src/components/round-trip-form.tsx` - RoundTripForm component: mobile StationLinePicker, desktop Select+swap, two Popover/Calendar date pickers, submit button

## Decisions Made
- `fetchStations` duplicated (not shared) between `query-form.tsx` and `round-trip-form.tsx` — avoids coupling; consistent with plan spec which explicitly calls this out
- `disabled={{ before: outboundDate }}` used for return date Calendar — react-day-picker v9 DateBefore matcher syntax; `fromDate`/`toDate` props were removed in v9
- Return date clamp in `handleOutboundDateSelect`: `if (returnDate < d) setReturnDate(d)` — silently advances return date rather than showing error

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `RoundTripParams` type ready for use in phase 07-02 (round-trip query results)
- `RoundTripForm` component ready to be wired into the main page as a new tab
- TypeScript compiles cleanly; no blockers for next plan

---
*Phase: 07-round-trip-query*
*Completed: 2026-02-19*
