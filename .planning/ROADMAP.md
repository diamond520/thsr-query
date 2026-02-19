# Roadmap: THSR Query — Next.js 重構

## Overview

Four phases build from a secure API foundation outward to a fully polished query app. Phase 1 locks in the TDX credential boundary (the one mistake that can't be undone). Phase 2 delivers the primary user flow end-to-end: pick stations, pick date, see trains with seat status, book. Phase 3 adds the two secondary query modes (by train number, by station). Phase 4 polishes the experience with a visual station selector and enhancements that only make sense once the query logic is proven.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - 建立 Next.js 專案、TDX OAuth2 token 管理、安全 API proxy 架構
- [x] **Phase 2: Core Query** - 完整的「依時間查詢」主流程（時刻表 + 座位狀態 + 訂票連結）
- [x] **Phase 3: Secondary Queries** - 依車次號查詢、依車站查詢座位剩餘 (completed 2026-02-19)
- [ ] **Phase 4: UI Polish** - 視覺化車站選擇器與漸進式 UX 強化

## Phase Details

### Phase 1: Foundation
**Goal**: 安全的 Next.js 16 專案架構已就位，TDX credentials 永遠不會暴露至前端，所有後續 phase 依賴的 API proxy 層已可用
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, INFR-02, INTG-01, INTG-02, INTG-03
**Success Criteria** (what must be TRUE):
  1. Next.js 16 App Router 專案可在本機執行並部署至 Vercel，環境變數透過 Vercel dashboard 管理
  2. TDX OAuth2 token 以 server-side module-level 快取管理，`lib/tdx-token.ts` 加有 `server-only` 守衛，client bundle 中找不到任何 credential 相關字串
  3. `/api/tdx/stations` Route Handler 返回真實的 12 個高鐵車站資料（從 TDX API 取得），可透過 curl 驗證
  4. `TDX_CLIENT_ID` 與 `TDX_CLIENT_SECRET` 儲存在 `.env.local`（不 commit），Vercel 上亦設定對應環境變數
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Next.js 16 scaffold: archive Vue 2, create-next-app, shadcn/ui, QueryClientProvider layout
- [x] 01-02-PLAN.md — TDX security layer: types, mock fixtures, server-only token manager, tdx-api helper, /api/tdx/stations Route Handler
- [x] 01-03-PLAN.md — Vercel deployment: CLI deploy, credential setup docs, end-to-end human verification

### Phase 2: Core Query
**Goal**: 使用者可以選擇起訖站與日期，看到當日所有班次的時刻與座位狀態，並直接點擊前往官方訂票頁
**Depends on**: Phase 1
**Requirements**: QURY-01, QURY-02, QURY-04, UIUX-02, UIUX-03, UIUX-04
**Success Criteria** (what must be TRUE):
  1. 使用者選擇起站、訖站、日期後提交查詢，頁面顯示當日所有班次列表（車次號、出發時刻、抵達時刻、行車時間）
  2. 每一列班次直接顯示標準席與商務席的座位狀態（充足 / 有限 / 售完），不需再點擊即可看到
  3. 每一列班次有「去訂票」連結，點擊後跳至高鐵官方訂票頁面
  4. 起訖站可透過交換按鈕一鍵對調，日期選擇使用台灣時區（UTC+8）避免跨夜顯示錯誤
  5. 頁面在手機與桌面瀏覽器均可正常操作，查詢中顯示 loading 狀態，查無資料與錯誤分別有對應提示
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — Backend data layer: extend types, add MOCK_TRAINS fixture, extend tdx-api.ts, create /api/tdx/trains Route Handler (parallel fetch + server-side join)
- [x] 02-02-PLAN.md — Form UI: install shadcn components, taiwan-date utility, SeatBadge, QueryForm with station selects + date picker + swap button
- [x] 02-03-PLAN.md — Result UI: TrainCard (mobile), TrainTable (desktop), TrainList with idle/loading/error/empty states
- [x] 02-04-PLAN.md — Integration + human verification: wire page.tsx with QueryForm + TrainList, end-to-end UI verification

### Phase 3: Secondary Queries
**Goal**: 使用者可透過車次號查詢單一列車停站時刻，亦可查詢特定車站的座位剩餘狀況
**Depends on**: Phase 2
**Requirements**: QURY-03
**Success Criteria** (what must be TRUE):
  1. 使用者輸入車次號後，頁面顯示該列車的完整停站順序與各站到發時刻
  2. 使用者選擇車站後，頁面顯示該站目前可搭乘班次的座位剩餘狀況（北上 / 南下分頁）
  3. 兩種查詢均有 loading、查無資料、API 錯誤的對應畫面
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md — Types/mock/tdx-api extensions + /api/tdx/timetable-by-train Route Handler + ByTrainForm + ByTrainResult
- [ ] 03-02-PLAN.md — /api/tdx/seat-status Route Handler + ByStationForm + ByStationResult + page.tsx three-tab integration

### Phase 4: UI Polish
**Goal**: 視覺化車站選擇器取代下拉選單，整體體驗達到 t-ex app 風格的流暢度與可用性
**Depends on**: Phase 3
**Requirements**: UIUX-01
**Success Criteria** (what must be TRUE):
  1. 手機版起訖站選擇顯示為線路圖（12 個車站標示於線段上），點擊車站即可選取，不需下拉選單
  2. 視覺化選擇器正確呈現南港→左營的地理順序，選取後查詢行為與 Phase 2 完全一致
**Plans**: TBD

Plans:
- [ ] 04-01: 視覺化線路圖車站選擇元件（mobile）

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-02-19 |
| 2. Core Query | 4/4 | Complete | 2026-02-19 |
| 3. Secondary Queries | 1/2 | Complete    | 2026-02-19 |
| 4. UI Polish | 0/1 | Not started | - |
