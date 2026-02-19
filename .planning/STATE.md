# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** 使用者能在幾秒內查到自己要搭的那班車有沒有位置。
**Current focus:** Phase 4 — UI Polish

## Current Position

Phase: 4 of 4 (UI Polish) — COMPLETE
Plan: 1 of 1 in current phase — COMPLETE
Status: Phase 4 complete — mobile visual station line picker built and integrated into QueryForm with CSS breakpoint swap
Last activity: 2026-02-19 — Completed 04-01 (mobile StationLinePicker + QueryForm integration)

Progress: [██████████] 100%

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

**Recent Trend:**
- Last 5 plans: 2 min, 3 min, 2 min, 5 min, 4 min
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

### Pending Todos

None.

### Blockers/Concerns

- [Phase 1 resolved]: 使用者尚未申請 TDX 帳號 — non-blocking, mock mode works in dev and production
- [Phase 2]: TDX `AvailableSeatStatusList` 端點是否支援批次查詢一條路線所有班次尚未確認 — 影響 join 策略，於 Phase 3 實作時驗證
- [Phase 4]: 視覺化車站選擇器為客製元件，無現成函式庫 — 建議 Phase 4 規劃前做設計 spike

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 04-01-PLAN.md (mobile StationLinePicker + QueryForm integration — all Phase 4 complete)
Resume file: None
