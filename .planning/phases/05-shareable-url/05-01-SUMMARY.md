---
phase: 05-shareable-url
plan: 01
subsystem: ui
tags: [react, nextjs, useSearchParams, useState, suspense]

# Dependency graph
requires:
  - phase: 04-ui-polish
    provides: QueryForm component with StationLinePicker integration
provides:
  - SearchParamsInit effect component that reads ?from, ?to, ?date URL params on mount
  - QueryForm with optional initialOrigin?, initialDestination?, initialDate? props
affects: [05-02, phase 5 wiring in page.tsx]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Effect-only component pattern: 'use client' component that returns null and uses useEffect for side effects
    - Mount-once useEffect: empty dep array to read URL params on first render only
    - Optional props with ?? defaults: backward-compatible prop extension on existing components

key-files:
  created:
    - src/components/search-params-init.tsx
  modified:
    - src/components/query-form.tsx

key-decisions:
  - "SearchParamsInit uses empty dep array in useEffect — fires once on mount, not on every render; onInit intentionally excluded from deps to avoid infinite loop risk"
  - "if (from || to || date) guard in SearchParamsInit — prevents spurious onInit call on clean page loads with no URL params"
  - "initialDate + 'T00:00:00' forces local-time Date parsing — bare YYYY-MM-DD is treated as UTC midnight which displays as previous day in UTC+8"

patterns-established:
  - "Effect-only component: 'use client' + returns null + useEffect for side-effect-only logic that cannot live in RSC"
  - "Optional prop backward-compat: ?? '' and ternary defaults keep existing callsites working unchanged"

requirements-completed: [SHAR-01]

# Metrics
duration: 1min
completed: 2026-02-19
---

# Phase 5 Plan 01: Shareable URL Building Blocks Summary

**SearchParamsInit effect component and QueryForm initial* prop extensions — the two building blocks for URL-to-form pre-fill**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-19T08:32:11Z
- **Completed:** 2026-02-19T08:33:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `src/components/search-params-init.tsx` — a 'use client' effect-only component that reads `?from`, `?to`, `?date` URL params on mount and fires `onInit` callback only when at least one param is present
- Extended `QueryFormProps` with `initialOrigin?`, `initialDestination?`, `initialDate?` optional props; all three `useState` initializers now consume them with correct fallback defaults
- Both changes are backward-compatible — existing usages of QueryForm and all other components are unaffected

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SearchParamsInit component** - `25e7d53` (feat)
2. **Task 2: Extend QueryForm with optional initial* props** - `d4995e9` (feat)

## Files Created/Modified
- `src/components/search-params-init.tsx` - Effect-only 'use client' component; exports SearchParamsInit; reads URL params on mount, fires onInit if any param present
- `src/components/query-form.tsx` - QueryFormProps extended with initialOrigin?, initialDestination?, initialDate?; useState initializers use ?? and ternary fallbacks

## Decisions Made
- SearchParamsInit uses empty dep array in useEffect — fires once on mount only; `onInit` is intentionally excluded from deps to avoid infinite loop risk when parent re-renders
- `if (from || to || date)` guard prevents spurious `onInit` call on clean page loads, which would trigger needless QueryForm remount via formKey increment in page.tsx (Plan 02)
- `initialDate + 'T00:00:00'` forces local-time Date parsing — bare `YYYY-MM-DD` is treated as UTC midnight, which displays as the previous day in UTC+8 timezones

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both building blocks exist and compile cleanly (TypeScript: zero errors)
- Plan 02 can now import SearchParamsInit and pass initial* props to QueryForm
- SearchParamsInit is designed to be wrapped in `<Suspense fallback={null}>` in page.tsx — that wiring happens in Plan 02
- Blocker from STATE.md still applies: quick `next build` smoke test required after Plan 02 adds Suspense wiring (silent failure in next dev, surfaces at build time)

---
*Phase: 05-shareable-url*
*Completed: 2026-02-19*
