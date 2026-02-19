# Roadmap: THSR Query — Next.js 重構

## Overview

Four phases build from a secure API foundation outward to a fully polished query app. Phase 1 locks in the TDX credential boundary (the one mistake that can't be undone). Phase 2 delivers the primary user flow end-to-end: pick stations, pick date, see trains with seat status, book. Phase 3 adds the two secondary query modes (by train number, by station). Phase 4 polishes the experience with a visual station selector and enhancements that only make sense once the query logic is proven.

Phases 5–7 deliver the v2.0 UX Enhancement milestone: shareable query links, saved favorite routes, and round-trip query. The build order is intentional — URL state infrastructure (Phase 5) is established first because Phase 6 reuses its QueryForm prop extensions, and Phase 7 is entirely additive new files that avoid shared-file conflicts.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - 建立 Next.js 專案、TDX OAuth2 token 管理、安全 API proxy 架構
- [x] **Phase 2: Core Query** - 完整的「依時間查詢」主流程（時刻表 + 座位狀態 + 訂票連結）
- [x] **Phase 3: Secondary Queries** - 依車次號查詢、依車站查詢座位剩餘 (completed 2026-02-19)
- [x] **Phase 4: UI Polish** - 視覺化車站選擇器與漸進式 UX 強化 (completed 2026-02-19)
- [x] **Phase 5: Shareable URL** - 查詢條件寫入 URL query string，開啟連結即自動帶入並執行查詢 (completed 2026-02-19)
- [ ] **Phase 6: Saved Favorite Routes** - localStorage 儲存常用起訖站組合，一鍵帶入查詢
- [ ] **Phase 7: Round-Trip Query** - 新增「來回查詢」分頁，去回程各自選日期，並排顯示兩段班次

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
- [x] 03-01-PLAN.md — Types/mock/tdx-api extensions + /api/tdx/timetable-by-train Route Handler + ByTrainForm + ByTrainResult
- [x] 03-02-PLAN.md — /api/tdx/seat-status Route Handler + ByStationForm + ByStationResult + page.tsx three-tab integration

### Phase 4: UI Polish
**Goal**: 視覺化車站選擇器取代下拉選單，整體體驗達到 t-ex app 風格的流暢度與可用性
**Depends on**: Phase 3
**Requirements**: UIUX-01
**Success Criteria** (what must be TRUE):
  1. 手機版起訖站選擇顯示為線路圖（12 個車站標示於線段上），點擊車站即可選取，不需下拉選單
  2. 視覺化選擇器正確呈現南港→左營的地理順序，選取後查詢行為與 Phase 2 完全一致
**Plans**: 1 plan

Plans:
- [x] 04-01-PLAN.md — 視覺化線路圖車站選擇元件（mobile）+ QueryForm 響應式整合

### Phase 5: Shareable URL
**Goal**: 使用者提交查詢後，URL 自動更新含起訖站與日期；他人開啟該連結，頁面自動帶入條件並執行查詢
**Depends on**: Phase 4
**Requirements**: SHAR-01
**Success Criteria** (what must be TRUE):
  1. 使用者提交查詢後，瀏覽器網址列自動更新為 `?from=<StationID>&to=<StationID>&date=<YYYY-MM-DD>` 格式，不觸發頁面重新載入
  2. 他人開啟含有效 `?from`、`?to`、`?date` 的連結後，查詢表單自動帶入起訖站與日期，並立即執行查詢顯示結果
  3. 使用者可點擊「複製連結」按鈕（或透過 Web Share API）將查詢連結分享給他人
  4. 在 `next build` 生產建置下，頁面可正常載入並執行查詢（Suspense boundary 正確包裝 `useSearchParams`）
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md — SearchParamsInit component + QueryForm optional initial* props
- [ ] 05-02-PLAN.md — ShareButton component + page.tsx full URL wiring + next build verification

### Phase 6: Saved Favorite Routes
**Goal**: 使用者可儲存常用起訖站組合，並一鍵帶入查詢表單，資料跨瀏覽器 session 持久化
**Depends on**: Phase 5
**Requirements**: PERS-01, PERS-03
**Success Criteria** (what must be TRUE):
  1. 使用者在「依時間查詢」分頁選取起訖站後，可點擊「儲存」按鈕將該組合加入常用路線（最多 10 組，已達上限時按鈕隱藏）
  2. 已儲存的路線以 chip 形式顯示在查詢表單上方，點擊任一 chip 後表單起訖站自動帶入對應路線
  3. 使用者可刪除任一已儲存路線，chip 即時消失
  4. 重新整理或關閉再開啟瀏覽器後，已儲存的路線仍然存在（localStorage 持久化）
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md — Types + SSR-safe useLocalStorage hook + useFavorites domain hook
- [ ] 06-02-PLAN.md — FavoriteRouteChips component + QueryForm save button
- [ ] 06-03-PLAN.md — page.tsx full wiring + next build verification + human verification

### Phase 7: Round-Trip Query
**Goal**: 使用者可在「來回查詢」分頁選擇起訖站、去程日期與回程日期，同時看到兩段班次並排結果
**Depends on**: Phase 6
**Requirements**: QURY-05
**Success Criteria** (what must be TRUE):
  1. 「來回查詢」為獨立的第四分頁，有共用起訖站選擇器及兩個各自獨立的日期選擇器（去程 / 回程）
  2. 回程日期選擇器自動禁用早於去程日期的日期，避免使用者選到無效組合
  3. 提交查詢後，去程與回程班次列表同時顯示；手機版上下堆疊、桌面版左右並排（`md:grid-cols-2`）
  4. 每段班次均顯示完整時刻、行車時間、座位狀態（標準席 / 商務席）及「去訂票」連結，功能與單程查詢一致
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-02-19 |
| 2. Core Query | 4/4 | Complete | 2026-02-19 |
| 3. Secondary Queries | 2/2 | Complete | 2026-02-19 |
| 4. UI Polish | 1/1 | Complete | 2026-02-19 |
| 5. Shareable URL | 2/2 | Complete    | 2026-02-19 |
| 6. Saved Favorite Routes | 2/3 | In Progress|  |
| 7. Round-Trip Query | 0/TBD | Not started | - |
