---
phase: 02-core-query
plan: "03"
subsystem: ui
tags: [nextjs, react, typescript, react-query, tailwind, shadcn-ui, responsive]

# Dependency graph
requires:
  - phase: 02-core-query
    plan: "01"
    provides: TdxEnrichedTrain type, GET /api/tdx/trains endpoint
  - phase: 02-core-query
    plan: "02"
    provides: QueryParams type from query-form.tsx, SeatBadge component, Card/Button/Skeleton UI primitives

provides:
  - TrainCard component (src/components/train-card.tsx) — mobile card with booking form POST
  - TrainTable component (src/components/train-table.tsx) — desktop table with booking form POST per row
  - TrainList component (src/components/train-list.tsx) — orchestrates all 4 result states via React Query

affects: [02-04-page-integration, page.tsx wiring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "enabled: !!params React Query pattern — fires only after form submit, not on mount"
    - "Form POST booking link — THSR Wicket session-stateful system requires POST not deep-link"
    - "md:hidden / hidden md:block — mobile card vs desktop table responsive toggle"
    - "StationID → THSR booking code via BOOKING_CODE map — both components carry their own map"

key-files:
  created:
    - src/components/train-card.tsx
    - src/components/train-table.tsx
    - src/components/train-list.tsx
  modified: []

key-decisions:
  - "enabled: !!params (not skipToken) — skipToken prevents refetch() from working in React Query v5, enabled: !!params preserves it"
  - "Form POST to THSR timetable search — deep-link by trainNo impossible (Wicket session-stateful), form pre-fills origin/destination/date/time"
  - "BOOKING_CODE duplicated in both TrainCard and TrainTable — co-location avoids shared import coupling for a 12-entry constant"
  - "calcDuration duplicated in both files — pure function with no side effects, inline duplication preferred over shared utility for readability"

patterns-established:
  - "State machine ordering: idle → loading → error → empty → results — consistent check order for all future list components"
  - "TrainSkeletons as internal sub-component — keeps loading skeleton co-located with its parent, not a separate file"

requirements-completed: [QURY-02, QURY-04, UIUX-02]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 2 Plan 03: Result Display UI Summary

**Responsive train result display: TrainCard (mobile), TrainTable (desktop), and TrainList orchestrator with 4-state machine (idle/loading/error/results) and form-POST booking links to THSR timetable**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T05:54:19Z
- **Completed:** 2026-02-19T05:56:24Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `TrainCard`: mobile-only card displaying trainNo, departure/arrival times, duration, StandardSeat+BusinessSeat badges, and form POST booking link
- Created `TrainTable`: desktop table with 7 columns (車次/出發/抵達/行車時間/標準席/商務席/訂票) with SeatBadge cells and per-row form POST booking
- Created `TrainList`: React Query orchestrator with `enabled: !!params` pattern, 5-skeleton loading state, error+retry UI, empty state, and mobile/desktop responsive toggle

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TrainCard and TrainTable components** - `7b20a58` (feat)
2. **Task 2: Create TrainList component with all state handling** - `1acdd0a` (feat)

**Plan metadata:** *(docs commit — see below)*

## Files Created/Modified

- `src/components/train-card.tsx` - Mobile card: trainNo, times, duration, two SeatBadge rows, form POST to THSR booking
- `src/components/train-table.tsx` - Desktop table: 7 columns with SeatBadge cells and form POST per row
- `src/components/train-list.tsx` - State orchestrator: idle hint / 5 skeletons / error+retry / empty msg / mobile+desktop results

## Decisions Made

- `enabled: !!params` over `skipToken` — skipToken prevents `refetch()` from working in React Query v5; `enabled: !!params` preserves the retry capability needed for the 重試 button
- Form POST to `https://www.thsrc.com.tw/TimeTable/Search` — THSR uses Wicket session-stateful UI, deep-link by trainNo is impossible; form pre-fills origin/destination/date/time so user lands on the right search
- `BOOKING_CODE` map duplicated in both TrainCard and TrainTable — co-location avoids shared import coupling for a 12-entry constant that will never change
- `calcDuration` duplicated in both files — pure utility with no side effects; inline duplication preferred over shared utility for readability and self-contained modules

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `TrainCard`, `TrainTable`, `TrainList` are all exported and TypeScript-clean
- `TrainList` accepts `QueryParams | null` — direct prop from `QueryForm.onSubmit` callback
- Page wiring (02-04) simply needs to: hold `params` state, pass `onSubmit` to `QueryForm`, pass `params` to `TrainList`
- No blockers for Phase 2 plan 04

---
*Phase: 02-core-query*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: src/components/train-card.tsx
- FOUND: src/components/train-table.tsx
- FOUND: src/components/train-list.tsx
- FOUND: .planning/phases/02-core-query/02-03-SUMMARY.md
- FOUND: commit 7b20a58 (feat(02-03): create TrainCard and TrainTable components)
- FOUND: commit 1acdd0a (feat(02-03): create TrainList component with all state handling)
