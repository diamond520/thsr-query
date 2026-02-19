---
phase: 01-foundation
plan: "02"
subsystem: api
tags: [nextjs, typescript, tdx, oauth2, server-only, mock-data, route-handler]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js 16 App Router scaffold with server-only package installed
provides:
  - src/types/tdx.ts — TdxStation, TdxStationName, TdxStationPosition TypeScript interfaces
  - src/fixtures/tdx-mock.ts — MOCK_STATIONS with all 12 THSR stations (南港 to 左營)
  - src/lib/tdx-token.ts — OAuth2 token manager with module-level cache and server-only guard
  - src/lib/tdx-api.ts — fetchStations() with isMockMode() auto-detect, server-only guard
  - src/app/api/tdx/stations/route.ts — GET /api/tdx/stations Route Handler proxy
affects: [02-api-integration, 03-search-ui, 04-station-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "server-only guard: import 'server-only' as first line prevents client bundle inclusion"
    - "mock/real auto-detect: isMockMode() checks env var presence — no USE_MOCK_TDX flag needed"
    - "module-level token cache: cachedToken persists across warm requests within same serverless instance"
    - "Route Handler proxy pattern: /api/tdx/stations imports only tdx-api.ts, never tdx-token.ts directly"

key-files:
  created:
    - src/types/tdx.ts
    - src/fixtures/tdx-mock.ts
    - src/lib/tdx-token.ts
    - src/lib/tdx-api.ts
    - src/app/api/tdx/stations/route.ts
  modified: []

key-decisions:
  - "Mock mode auto-detect via env var presence (no USE_MOCK_TDX flag) — reduces config surface"
  - "server-only guard on both tdx-token.ts and tdx-api.ts — defense in depth"
  - "Route Handler never imports tdx-token.ts directly — only via tdx-api.ts abstraction"
  - "Module-level token cache with 5-minute buffer — balances performance and freshness"

patterns-established:
  - "Credential isolation: server-only files never reachable from 'use client' component tree"
  - "API proxy pattern: Route Handler exposes data to client, hides all credential logic"
  - "Fixture fallback: MOCK_STATIONS allows full dev/build without TDX account"

requirements-completed: [INTG-01, INTG-02, INTG-03]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 1 Plan 02: TDX Integration Summary

**TDX OAuth2 credential security layer with server-only guard: 5 files implementing mock/real auto-detect, 24h token cache, and `/api/tdx/stations` returning 12 THSR stations without exposing credentials to client bundle**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T04:49:14Z
- **Completed:** 2026-02-19T04:52:32Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created TdxStation TypeScript types derived from TDX v2 API response shape, plus MOCK_STATIONS fixture with all 12 THSR stations in StationID order
- Implemented server-only token manager (getTdxToken) with module-level OAuth2 cache and 5-minute safety buffer; confirmed `import 'server-only'` causes build error when imported from 'use client'
- Implemented tdx-api.ts (isMockMode() + fetchStations()) and Route Handler proxy GET /api/tdx/stations — returns 12 stations in mock mode, zero TDX credential strings in .next/static/

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TDX types, fixture mock data, and server-only token manager** - `2f98039` (feat)
2. **Task 2: Implement TDX API helper and stations Route Handler proxy** - `5fb18c2` (feat)

**Plan metadata:** *(assigned after SUMMARY.md commit)*

## Files Created/Modified
- `src/types/tdx.ts` - TdxStation, TdxStationName, TdxStationPosition interfaces matching TDX v2 API shape
- `src/fixtures/tdx-mock.ts` - MOCK_STATIONS array (TdxStation[]) with all 12 THSR stations, StationID 1-12
- `src/lib/tdx-token.ts` - OAuth2 token manager with module-level cache, 5-min buffer, server-only guard (first line)
- `src/lib/tdx-api.ts` - fetchStations() and isMockMode(); imports server-only guard (first line)
- `src/app/api/tdx/stations/route.ts` - GET Route Handler with 24h revalidation; no direct tdx-token import

## Decisions Made
- Used env var presence for mock/real detection — no extra USE_MOCK_TDX flag reduces config surface and cannot be accidentally left enabled in production
- Applied server-only to both tdx-token.ts and tdx-api.ts for defense in depth (tdx-api re-exports getTdxToken indirectly)
- Route Handler only imports from tdx-api.ts, never from tdx-token.ts directly — single abstraction layer

## Deviations from Plan

None - plan executed exactly as written.

The `server-only` boundary violation test (temporarily importing tdx-token from a 'use client' component) confirmed the guard works as expected. The test component was created and deleted without being committed.

## Issues Encountered
None. Build succeeded first time with correct types. Dev server returned all 12 stations immediately. No credential strings found in .next/static/.

## User Setup Required
None — mock mode activates automatically when TDX_CLIENT_ID / TDX_CLIENT_SECRET are absent from .env.local. Build and dev server both work without any TDX credentials.

When TDX credentials are obtained:
1. Add `TDX_CLIENT_ID=...` and `TDX_CLIENT_SECRET=...` to `.env.local`
2. Restart dev server — real TDX API will be called automatically

## Next Phase Readiness
- `/api/tdx/stations` operational — Phase 2 client components can fetch station list via `useQuery`
- TdxStation types exported — Phase 2 timetable/seat types can extend or compose with these
- Mock mode means Phase 2 development proceeds without TDX credentials
- Credential security boundary confirmed at build time via server-only guard

---
*Phase: 01-foundation*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: src/types/tdx.ts
- FOUND: src/fixtures/tdx-mock.ts
- FOUND: src/lib/tdx-token.ts
- FOUND: src/lib/tdx-api.ts
- FOUND: src/app/api/tdx/stations/route.ts
- FOUND commit: 2f98039 (Task 1)
- FOUND commit: 5fb18c2 (Task 2)
