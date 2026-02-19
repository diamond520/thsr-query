---
phase: 01-foundation
plan: "03"
subsystem: infra
tags: [vercel, nextjs, deployment, env-vars, security]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js 16 App Router scaffold deployable to Vercel
  - phase: 01-02
    provides: /api/tdx/stations Route Handler with mock mode (no credentials required)
provides:
  - Live Vercel deployment at https://thsr-query.vercel.app
  - .env.local with TDX credential placeholder and setup instructions
  - Verified production endpoint /api/tdx/stations returning 12 stations in mock mode
  - Confirmed security boundary: no TDX credentials in client bundle at build or runtime
affects: [02-api-integration, 03-search-ui, 04-station-ui]

# Tech tracking
tech-stack:
  added: [vercel-cli]
  patterns:
    - "Vercel CLI auto-detects Next.js framework from package.json — no vercel.json needed"
    - "Mock mode carries through to production: env var absence triggers mock path in serverless function"
    - ".env.local not committed; .vercel/ project link committed (gitignored by default)"

key-files:
  created: []
  modified:
    - .env.local

key-decisions:
  - "Vercel deployment is part of Phase 1 but NOT a prerequisite for Phase 2 — can proceed if deployment blocked"
  - "TDX credentials set in Vercel Dashboard (Production + Preview), not in .env.local (dev only)"
  - "Mock mode confirmed functional in production without any env vars set in Vercel dashboard"

patterns-established:
  - "Security verification: grep .next/static/ for credential strings before shipping any sensitive config"
  - "End-to-end checkpoint: human verifies DevTools Network tab to confirm server-side proxy boundary"

requirements-completed: [INFR-02, INTG-03]

# Metrics
duration: ~5min
completed: 2026-02-19
---

# Phase 1 Plan 03: Vercel Deployment Summary

**Next.js 16 app deployed to https://thsr-query.vercel.app via Vercel CLI; /api/tdx/stations returns 12 THSR stations in mock mode, security boundary confirmed — no TDX credentials in client bundle or browser network traffic**

## Performance

- **Duration:** ~5 min (including human verification checkpoint)
- **Started:** 2026-02-19T04:57:00Z (estimated)
- **Completed:** 2026-02-19T05:01:21Z
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 1 (.env.local)

## Accomplishments
- Deployed to Vercel via `npx vercel --yes` — linked thsr-query repo to Vercel project (projectId: prj_MxeFEBLym6fbCIcBKxftOmedMkV0)
- Production home page (https://thsr-query.vercel.app) returns HTTP 200 with 高鐵查詢 content
- Production API endpoint (https://thsr-query.vercel.app/api/tdx/stations) returns 12 THSR stations in mock mode (no TDX credentials on Vercel yet)
- Human verified: no requests to tdx.transportdata.tw in browser DevTools Network tab — server-side proxy boundary confirmed end-to-end

## Task Commits

Each task was committed atomically:

1. **Task 1: Deploy to Vercel via CLI and document credential setup** - `1be76c1` (chore)
2. **Task 2: Checkpoint: Verify Phase 1 foundation end-to-end** - approved by human (no code commit required)

**Plan metadata:** *(assigned after SUMMARY.md commit)*

## Files Created/Modified
- `.env.local` - TDX credential placeholders with inline comments documenting Vercel Dashboard setup path

## Decisions Made
- Vercel deployment flagged as non-blocking for Phase 2 — if auth/DNS issues arise, Phase 2 proceeds from local dev
- TDX credentials belong in Vercel Dashboard (Production + Preview environments), not committed to source control
- Mock mode in production validated the fallback path works correctly in a real serverless environment

## Deviations from Plan

None - plan executed exactly as written.

The deployment succeeded on first attempt. No authentication issues, no DNS issues. Mock mode carried through to the production Vercel deployment without any additional configuration.

## Issues Encountered
None. `npx vercel --yes` completed successfully, production endpoints verified, human checkpoint approved with confirmation of DevTools Network tab showing zero requests to tdx.transportdata.tw.

## User Setup Required

When TDX API credentials are obtained (from https://tdx.transportdata.tw — Project Settings → App Info):

1. Go to: https://vercel.com/dashboard → thsr-query → Settings → Environment Variables
2. Add `TDX_CLIENT_ID` (value from TDX portal) — set for Production + Preview environments
3. Add `TDX_CLIENT_SECRET` (value from TDX portal) — set for Production + Preview environments
4. Redeploy: `npx vercel --prod`

For local development:
- Set `TDX_CLIENT_ID=...` and `TDX_CLIENT_SECRET=...` in `.env.local`
- Restart dev server — real TDX API will be called automatically

## Next Phase Readiness
- Live Vercel URL confirmed: https://thsr-query.vercel.app — Phase 2 UI work can target this for preview deployments
- Mock mode works in both local and production environments — Phase 2 development proceeds without TDX credentials
- Security boundary verified end-to-end: server-side proxy confirmed, no credentials leaking to client bundle or browser network traffic
- Phase 1 fully complete: all 5 requirements covered (INFR-01, INFR-02, INTG-01, INTG-02, INTG-03)

---
*Phase: 01-foundation*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: .env.local
- FOUND: .planning/phases/01-foundation/01-03-SUMMARY.md
- FOUND commit: 1be76c1 (Task 1)
