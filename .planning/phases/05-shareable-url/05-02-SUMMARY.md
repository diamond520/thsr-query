---
phase: 05-shareable-url
plan: 02
subsystem: ui
tags: [react, nextjs, useRouter, useSearchParams, suspense, web-share-api, clipboard]

# Dependency graph
requires:
  - phase: 05-01
    provides: SearchParamsInit effect component and QueryForm initialOrigin/Destination/Date props
  - phase: 04-ui-polish
    provides: QueryForm with StationLinePicker integration
provides:
  - ShareButton component with Web Share API and clipboard fallback
  - page.tsx fully wired for shareable URL: Suspense+SearchParamsInit, router.replace on submit, formKey remount, ShareButton render
  - End-to-end shareable URL feature: submit updates URL, open URL pre-fills form and auto-executes query
affects: [phase 6 saved-routes, phase 7 round-trip]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Suspense boundary around effect-only component: required for next build when useSearchParams is used
    - formKey increment pattern: forces QueryForm remount so useState initializers re-run with new initial* props
    - router.replace with scroll:false: URL update without page reload, history entry, or scroll jump
    - Web Share API with canShare guard: mobile-first sharing with clipboard fallback for desktop/non-HTTPS

key-files:
  created:
    - src/components/share-button.tsx
  modified:
    - src/app/page.tsx

key-decisions:
  - "Suspense placed outside the max-w-2xl container div with fallback={null} — no layout shift since SearchParamsInit renders null"
  - "router.replace with { scroll: false } — preserves scroll position after form submit so results below the fold stay visible"
  - "formKey increment in handleParamInit — only correct way to reset useState values from new props; fires once on URL-param mount, not on every render"
  - "navigator.canShare({ url }) guard before navigator.share() — some browsers expose share but cannot share URLs (files only); prevents runtime errors"
  - "auto-execute query when all three URL params present — satisfies success criterion: open link → immediate results without manual submit"

patterns-established:
  - "Shareable URL pattern: router.replace on submit + SearchParamsInit on mount + auto-execute when all params present"
  - "ShareButton placement: between form card and results list, right-aligned, visible only after first submit"

requirements-completed: [SHAR-01]

# Metrics
duration: 1min
completed: 2026-02-19
---

# Phase 5 Plan 02: Shareable URL Wiring Summary

**Full shareable URL wiring: ShareButton with Web Share API + page.tsx Suspense/router.replace/formKey pattern — submit updates URL, opening link pre-fills form and auto-executes query**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-19T08:35:08Z
- **Completed:** 2026-02-19T08:36:28Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `src/components/share-button.tsx` with Web Share API (canShare guard for mobile) and clipboard fallback with 2-second confirmation — renders null when params is null
- Rewrote `src/app/page.tsx` to wire all Phase 5 features: Suspense wrapping SearchParamsInit, router.replace on submit, formKey remount pattern for URL-to-form pre-fill, and ShareButton rendering
- `npm run build` exits with code 0 — no Suspense boundary errors, no useSearchParams warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ShareButton component** - `3898083` (feat)
2. **Task 2: Wire page.tsx and verify next build** - `fec1607` (feat)

## Files Created/Modified
- `src/components/share-button.tsx` - Share/copy button using Web Share API with clipboard fallback; exports ShareButton; renders null when params is null
- `src/app/page.tsx` - Full wiring: Suspense+SearchParamsInit, handleParamInit, handleQuerySubmit with router.replace, formKey remount pattern, ShareButton render

## Decisions Made
- Suspense placed outside the `max-w-2xl` container div with `fallback={null}` — zero layout shift since SearchParamsInit renders null; boundary wraps only the effect component
- `router.replace` with `{ scroll: false }` — preserves scroll position after form submit so results below the fold stay visible without snapping to top
- `formKey` increment in `handleParamInit` — the only correct way to reset `useState` values from new props; fires once on URL-param mount, not on every subsequent render
- `navigator.canShare({ url })` guard before `navigator.share()` — some browsers expose `share` but cannot share URLs (files only); without guard causes runtime TypeError
- Auto-execute query (`setQueryParams`) when all three URL params present — satisfies "open link → immediate results" success criterion without manual submit

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Shareable URL feature is complete end-to-end: submitting updates URL, sharing link → pre-filled form + auto-execute
- Phase 6 (Saved Routes) can extend this infrastructure — the `initialOrigin/Destination/Date` props and `handleParamInit` pattern are already established
- The Phase 5 blocker in STATE.md (quick `next build` smoke test required after Suspense wiring) is now resolved — build passes

## Self-Check: PASSED

- src/components/share-button.tsx: FOUND
- src/app/page.tsx: FOUND
- 05-02-SUMMARY.md: FOUND
- commit 3898083: FOUND
- commit fec1607: FOUND

---
*Phase: 05-shareable-url*
*Completed: 2026-02-19*
