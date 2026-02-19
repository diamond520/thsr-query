---
phase: 04-ui-polish
plan: 01
subsystem: ui
tags: [react, tailwind, shadcn, mobile, accessibility, wcag]

# Dependency graph
requires:
  - phase: 02-core-query
    provides: QueryForm with origin/destination state, TdxStation type, stations API
  - phase: 01-foundation
    provides: cn utility, Tailwind v4 setup, shadcn/ui components
provides:
  - StationLinePicker component with tap-to-select vertical line UI
  - QueryForm with CSS breakpoint swap (md:hidden mobile picker + hidden md:flex desktop selects)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS-only responsive breakpoints (md:hidden / hidden md:flex) — no useMediaQuery JS hook, avoids hydration issues
    - Two-step selection state machine (origin → destination) with useEffect reset guard
    - 44px touch targets (w-11 h-11) with child visual dot span, per WCAG 2.5.5

key-files:
  created:
    - src/components/station-line-picker.tsx
  modified:
    - src/components/query-form.tsx

key-decisions:
  - "CSS-only breakpoints (no useMediaQuery) for mobile/desktop swap — avoids hydration mismatch on server-rendered form"
  - "Mobile picker has no swap button — tapping any station when both are selected clears and restarts selection"
  - "getStationState is a pure function outside the component — no closure over state, cleaner logic"
  - "useEffect watches [origin, destination] to reset step to origin when origin is cleared externally (swap-then-continue edge case)"

patterns-established:
  - "CSS breakpoint swap: wrap mobile UI in md:hidden, desktop UI in hidden md:flex — same pattern as train-list.tsx"
  - "WCAG 2.5.5 touch targets: use button w-11 h-11 as hit area, child span for visual presentation"

requirements-completed: [UIUX-01]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 4 Plan 01: UI Polish — Mobile Station Picker Summary

**Tap-to-select vertical THSR line station picker for mobile using a two-step state machine, replacing Select dropdowns with 44px-target dot-and-line UI, with CSS breakpoint swap preserving desktop Select layout unchanged.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T07:31:44Z
- **Completed:** 2026-02-19T07:33:16Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Built `StationLinePicker` component displaying 12 THSR stations in north-to-south order (南港→左營) with vertical connecting line, origin/destination/in-range/default dot states, 起/訖 badges, and 44px WCAG-compliant touch targets
- Two-step tap UX: first tap sets origin (primary color dot), second tap sets destination (destructive color dot), in-range stations get dimmed highlight; tapping when both selected clears and restarts
- Integrated into `QueryForm` with CSS-only `md:hidden` / `hidden md:flex` breakpoint swap — mobile sees line picker, desktop sees original Select row with swap button; shared state flows to both; `handleSubmit`, `isValid`, and date picker unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Create StationLinePicker component** - `3d6806b` (feat)
2. **Task 2: Integrate picker into QueryForm + build verification** - `13b3614` (feat)

## Files Created/Modified

- `src/components/station-line-picker.tsx` - Visual THSR line station picker: pure `getStationState`, two-step tap UX, `useEffect` step reset, sorted stations, 44px touch targets, WCAG aria attributes
- `src/components/query-form.tsx` - Added `StationLinePicker` import, split station selection into `md:hidden` mobile picker and `hidden md:flex` desktop Select row sharing the same `origin`/`destination` state

## Decisions Made

- CSS-only breakpoints (`md:hidden` / `hidden md:flex`) rather than `useMediaQuery` JS hook — avoids server/client hydration mismatch on the form component
- Mobile picker deliberately excludes a swap button — when both stations are selected, tapping any station clears and restarts selection from origin; swap is a desktop-only affordance
- `getStationState` defined outside the component as a pure function — no closure over component state, makes behavior easier to reason about and test
- `useEffect` watching `[origin, destination]` resets the `step` state to `'origin'` whenever origin is cleared externally — handles the swap-then-continue edge case where desktop swap sets origin to `''`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 Plan 01 complete — UIUX-01 requirement fulfilled
- Mobile users can now select origin/destination by tapping stations on the visual line map
- Desktop experience unchanged: existing Select dropdowns with swap button remain
- No blockers for further UI polish or deployment

## Self-Check: PASSED

- src/components/station-line-picker.tsx: FOUND
- src/components/query-form.tsx: FOUND
- .planning/phases/04-ui-polish/04-01-SUMMARY.md: FOUND
- Commit 3d6806b (Task 1): FOUND
- Commit 13b3614 (Task 2): FOUND

---
*Phase: 04-ui-polish*
*Completed: 2026-02-19*
