# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** 使用者能在幾秒內查到自己要搭的那班車有沒有位置。
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 2 of 3 in current phase
Status: Executing
Last activity: 2026-02-19 — Completed 01-02 (TDX credential security layer, mock stations endpoint)

Progress: [██░░░░░░░░] 17%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 5.5 min
- Total execution time: 11 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/3 | 11 min | 5.5 min |

**Recent Trend:**
- Last 5 plans: 8 min, 3 min
- Trend: faster

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

### Pending Todos

None.

### Blockers/Concerns

- [Phase 1]: 使用者尚未申請 TDX 帳號（需取得 client_id / client_secret 才能呼叫真實 API）
- [Phase 2]: TDX `AvailableSeatStatusList` 端點是否支援批次查詢一條路線所有班次尚未確認 — 影響 join 策略，於 Phase 2 實作時驗證
- [Phase 4]: 視覺化車站選擇器為客製元件，無現成函式庫 — 建議 Phase 4 規劃前做設計 spike

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 01-02-PLAN.md (TDX credential security layer, /api/tdx/stations returning 12 stations)
Resume file: None
