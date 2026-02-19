# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** 使用者能在幾秒內查到自己要搭的那班車有沒有位置。
**Current focus:** Milestone v2.0 — UX Enhancement (Phase 5 of 7)

## Current Position

Phase: 5 — Shareable URL
Plan: 2 of 2 complete
Status: Complete
Last activity: 2026-02-19 — 05-02 complete (ShareButton + page.tsx URL wiring, next build passes)

Progress: [==        ] 20% (v2.0 milestone — 2/2 plans in Phase 5 done)

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 3.9 min
- Total execution time: 35 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/3 | 16 min | 5.3 min |
| 02-core-query | 4/4 | 13 min | 3.3 min |
| 03-secondary-queries | 2/2 | 6 min | 3 min |
| 04-ui-polish | 1/1 | 2 min | 2 min |

| 05-shareable-url | 2/2 | 2 min | 1 min |

**Recent Trend:**
- Last 5 plans: 3 min, 2 min, 5 min, 4 min, 1 min
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1]: Server-side TDX token 管理（避免 client_secret 暴露）— 架構核心，不可妥協
- [Phase 1]: Next.js 16 App Router（非 Pages Router）— 研究確認此為正確選擇
- [01-01]: create-next-app scaffolded into temp dir then rsync'd — tool refuses non-empty directories
- [01-01]: git mv used for Vue 2 archival — preserves rename history in git log
- [01-01]: Tailwind v4 (not v3) — create-next-app@latest auto-selects v4 with @tailwindcss/postcss
- [01-01]: shadcn/ui New York style, neutral base, CSS variables
- [01-02]: Mock mode auto-detect via env var presence (no USE_MOCK_TDX flag) — reduces config surface
- [01-02]: server-only guard on both tdx-token.ts and tdx-api.ts — defense in depth
- [01-02]: Route Handler never imports tdx-token.ts directly — only via tdx-api.ts abstraction
- [01-02]: Module-level token cache with 5-minute buffer — balances performance and freshness
- [01-03]: Vercel deployment non-blocking for Phase 2 — proceed even if deployment blocked
- [01-03]: TDX credentials set in Vercel Dashboard (Production + Preview), not in .env.local (dev only)
- [01-03]: Mock mode confirmed functional in production without env vars set on Vercel
- [02-01]: Route Handler imports MOCK_TRAINS directly from fixtures — tdx-api.ts does not re-export it (single responsibility)
- [02-01]: fetchDailyTrains/fetchSeatStatus have no mock-mode handling — mock short-circuit lives only in route.ts
- [02-01]: seatMap keyed on TrainNo with timetable as left dataset — AvailableSeatStatusList returns ALL station trains
- [02-01]: null (not undefined) for absent seat status — enables clean '—' display fallback in UI components
- [02-02]: initialFocus prop omitted from Calendar — deprecated/removed in react-day-picker v9 API
- [02-02]: getTaiwanToday() called inside useState() initializer — hydration-safe pattern for all timezone-sensitive defaults
- [02-02]: SeatBadge null status renders '—' gray badge — train absent from AvailableSeatStatusList is expected, not an error
- [02-03]: enabled: !!params (not skipToken) — skipToken prevents refetch() from working in React Query v5
- [02-03]: Form POST to THSR timetable search — THSR Wicket session-stateful, deep-link by trainNo impossible
- [02-03]: BOOKING_CODE map duplicated in TrainCard+TrainTable — co-location preferred for 12-entry constant over shared import
- [02-04]: page.tsx marked 'use client' — simplest correct approach for form-UI page that needs useState; RSC benefits not applicable
- [02-04]: queryParams state lives in page.tsx directly — no additional wrapper component needed at this scale
- [03-01]: TdxTrainStop normalization done in route.ts (not tdx-api.ts) — consistent with Phase 2 pattern where tdx-api.ts stays raw TDX shapes only
- [03-01]: MOCK_TIMETABLE_BY_TRAIN keyed by trainNo string, unknown keys return [] — mirrors real API behavior where missing trainNo yields empty array not error
- [03-01]: ByTrainResult receives trainNo: string | null (null = idle) — clean state machine without extra boolean flag
- [03-02]: page.tsx top-level Tabs defaultValue="by-od" — Phase 2 behavior unchanged on load; each tab has independent local state
- [03-02]: ByStationForm reuses queryKey=['stations'] — shares React Query cache with QueryForm (no duplicate station fetches)
- [03-02]: TrainSeatRow matches queried stationId against StopStations — correctly shows seat status for the queried station leg
- [04-01]: CSS-only breakpoints (md:hidden / hidden md:flex) for mobile/desktop swap — avoids hydration mismatch, no useMediaQuery JS hook
- [04-01]: Mobile picker has no swap button — tapping any station when both are selected clears and restarts; swap is desktop-only
- [04-01]: getStationState is a pure function outside the component — no closure over state, cleaner logic
- [04-01]: useEffect watches [origin, destination] to reset step to 'origin' when origin is cleared externally (swap-then-continue edge case)
- [v2.0 roadmap]: Build order Phase 5 → 6 → 7 — URL state infrastructure first, saved routes extend its props, round-trip is additive new files only
- [v2.0 roadmap]: useSearchParams() isolated in SearchParamsInit child component — always wrapped in Suspense to prevent next build failure
- [v2.0 roadmap]: localStorage hydrated in useEffect with hydrated flag — prevents SSR hydration mismatch, no suppressHydrationWarning
- [v2.0 roadmap]: router.replace() for all URL updates (not router.push()) — prevents Back-button history loop
- [v2.0 roadmap]: Round-trip React Query keys include 'outbound'/'return' discriminator — prevents cache deduplication of two parallel queries
- [v2.0 roadmap]: Saved routes capped at 10 (not 5) — localStorage trivially small; 5 is too restrictive for commuters with multiple routes
- [v2.0 roadmap]: Round-trip as new fourth tab (not toggle inside existing tab) — cleaner component separation, clearer user mental model
- [Phase 05-01]: SearchParamsInit uses empty dep array in useEffect — fires once on mount; onInit excluded from deps to avoid infinite loop
- [Phase 05-01]: if (from || to || date) guard in SearchParamsInit prevents spurious onInit on clean page loads
- [Phase 05-01]: initialDate + 'T00:00:00' forces local-time Date parsing to avoid UTC midnight displaying as previous day in UTC+8
- [Phase 05-02]: Suspense placed outside max-w-2xl container with fallback={null} — zero layout shift; wraps only SearchParamsInit effect component
- [Phase 05-02]: router.replace with { scroll: false } — preserves scroll position after form submit
- [Phase 05-02]: formKey increment pattern — only correct way to reset useState from new props; fires once on URL-param mount
- [Phase 05-02]: navigator.canShare({ url }) guard before navigator.share() — prevents runtime TypeError on browsers that expose share but not URL sharing
- [Phase 05-02]: auto-execute query when all three URL params present — open link → immediate results without manual submit

### Pending Todos

None.

### Blockers/Concerns

- [Phase 1 resolved]: 使用者尚未申請 TDX 帳號 — non-blocking, mock mode works in dev and production
- [Phase 2]: TDX `AvailableSeatStatusList` 端點是否支援批次查詢一條路線所有班次尚未確認 — 影響 join 策略，於 Phase 3 實作時驗證
- [Phase 4]: 視覺化車站選擇器為客製元件，無現成函式庫 — 建議 Phase 4 規劃前做設計 spike
- [Phase 5]: Quick `next build` smoke test required after adding useSearchParams Suspense wiring — failure mode is silent in next dev, only surfaces at build time

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 05-02-PLAN.md — ShareButton + page.tsx URL wiring complete; Phase 5 done; next build passes
Resume file: None
