# THSR Query — Next.js 重構

## What This Is

台灣高鐵查詢工具，讓使用者可以快速查詢高鐵時刻表、座位剩餘狀況、單一車次資訊，並直接連結至官方訂票頁面。支援依時間查詢（含去回程）、依車次號查詢、依車站查詢，以及可分享查詢連結與儲存常用路線。原版為 Vue 2 SPA，本次從頭以 Next.js 重寫，並將資料來源從已停用的 PTX API 遷移至 TDX API。

## Core Value

使用者能在幾秒內查到自己要搭的那班車有沒有位置。

## Requirements

### Validated

- ✓ 查詢所有高鐵車站列表 — v2.0
- ✓ 依起訖站與日期查詢每日時刻表 (QURY-01) — v2.0
- ✓ 依車次號查詢時刻 (QURY-03) — v2.0
- ✓ 查詢特定車站的可用座位狀態 — v2.0
- ✓ 使用 Next.js 重寫整個 app（取代 Vue 2）(INFR-01) — v2.0
- ✓ 將資料來源從 PTX API 遷移至 TDX API（含 OAuth2 token 認證）(INTG-01, INTG-02, INTG-03) — v2.0
- ✓ Mobile UI：仿照 t-ex app 風格 (UIUX-02) — v2.0
- ✓ Desktop UI：仿照高鐵官網但簡潔化 — v2.0
- ✓ 查詢結果頁顯示「去訂票」連結 (QURY-04) — v2.0
- ✓ 依車次號查詢停站時刻 (QURY-03) — v2.0
- ✓ 依車站查詢北上/南下座位剩餘 — v2.0
- ✓ Mobile 視覺化線路圖車站選擇器 (UIUX-01) — v2.0
- ✓ 每班次顯示標準席與商務席座位狀態 (QURY-02) — v2.0
- ✓ 起訖站交換按鈕 (UIUX-04) — v2.0
- ✓ 台灣時區日期處理 (UIUX-03) — v2.0
- ✓ 可部署至 Vercel (INFR-02) — v2.0
- ✓ 可分享查詢條件：URL query string 含起訖站 + 日期，開啟即查詢 (SHAR-01) — v2.0
- ✓ 儲存常用路線：localStorage 起訖站組合，快速帶入 (PERS-01, PERS-03) — v2.0
- ✓ 來回票查詢：去程 + 回程各自選日期，並排顯示兩段班次 (QURY-05) — v2.0

### Active (v2.1+)

- [ ] 記憶上次查詢的起訖站，作為預設值 (PERS-02)
- [ ] 來回票查詢的可分享連結 (SHAR-02) — needs QURY-05 + SHAR-01 stable first

### Out of Scope

- 直接整合高鐵訂票功能 — 官方無公開訂票 API
- 會員系統 / 登入 — 不在本次範圍
- 多語言（英日文） — 先做中文版
- 即時到站資訊 — 不同的 API 端點，複雜度高，v3 考慮
- 離線功能 / PWA — 過度工程
- 跨裝置路線同步 — 需要後端與帳號系統，不在範圍

## Context

- Shipped v2.0 with 3,474 LOC TypeScript (Next.js 16 App Router)
- Tech stack: Next.js 16, React, TypeScript, Tailwind v4, shadcn/ui, TanStack Query v5, TDX API
- Vue 2 source archived in `_archive/` with git history preserved
- TDX API requires government account (free) for OAuth2 credentials; mock mode available in dev + production without credentials
- No test coverage, no CI/CD (not in scope)
- Known tech debt: RoundTripResult queryKey includes full params object (low severity, see MILESTONES.md)

## Constraints

- **Tech Stack**: Next.js（React）— 使用者指定
- **API**: TDX API v2，`/Rail/THSR/` 系列端點
- **Auth**: TDX OAuth2，token 需在 server-side 管理（避免 client_secret 暴露）
- **Deployment**: Vercel（Next.js 最佳相容）

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 從頭重寫而非漸進遷移 | Vue 2 → React 無法漸進，且舊架構本身簡單 | ✓ Good — clean separation, preserved history via git mv |
| Server-side TDX token 管理 | client_secret 不能暴露在前端 | ✓ Good — server-only guard on tdx-token.ts + tdx-api.ts, zero leakage confirmed |
| Next.js App Router vs Pages Router | App Router 為 Next.js 13+ 推薦 | ✓ Good — route.ts handlers clean, Suspense boundary pattern works well |
| Tailwind v4 (not v3) | create-next-app@latest auto-selects v4 | ✓ Good — no issues encountered |
| Mock mode via env var presence | No USE_MOCK_TDX flag, auto-detect by credential absence | ✓ Good — reduces config surface, works in Vercel preview |
| page.tsx as `use client` | Simplest correct approach for form-UI page needing useState | ✓ Good — RSC benefits inapplicable at this scale |
| CSS breakpoints for mobile/desktop picker swap | Avoids hydration mismatch vs useMediaQuery | ✓ Good — zero hydration errors |
| useSearchParams in isolated child + Suspense | next build fails silently in dev without Suspense | ✓ Good — pattern generalizable to any searchParams usage |
| localStorage via two-useEffect pattern | Prevents SSR hydration mismatch | ✓ Good — firstLoadDone flag correct approach |
| Round-trip as fourth tab (not toggle) | Cleaner component separation, clearer user mental model | ✓ Good — zero shared-file conflicts in Phase 7 |
| Saved routes capped at 10 | localStorage trivially small; 5 too restrictive for commuters | ✓ Good — no issues |
| Discriminated queryKey literals ('outbound'/'return') | Prevents React Query deduplication of structurally-identical params | ✓ Good — mandatory for correctness |

---
*Last updated: 2026-02-19 after v2.0 milestone*
