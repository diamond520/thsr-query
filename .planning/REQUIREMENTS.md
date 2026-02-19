# Requirements: THSR Query — Next.js 重構

**Defined:** 2026-02-19
**Core Value:** 使用者能在幾秒內查到自己要搭的那班車有沒有位置。

## v1 Requirements (Complete)

### 查詢功能

- [x] **QURY-01**: 使用者可選擇起站、訖站與日期查詢當日所有高鐵班次時刻
- [x] **QURY-02**: 時刻表每一列班次直接顯示標準席和商務席的座位剩餘狀態（充足/有限/售完）
- [x] **QURY-03**: 使用者可輸入車次號查詢單一列車的停站與時刻表
- [x] **QURY-04**: 時刻表每一列班次顯示「去訂票」連結，點擊後跳至高鐵官方訂票頁面

### UI / UX

- [x] **UIUX-01**: 起訖站選擇使用視覺化線路圖（12 個車站顯示為線段上的點，點擊選取）
- [x] **UIUX-02**: Mobile-first 響應式設計 — 手機版仿 t-ex app 風格（大點擊區域、卡片式），桌面版仿高鐵官網（清爽、表格式）
- [x] **UIUX-03**: 日期選擇使用台灣時區（UTC+8），避免跨夜時顯示錯誤日期
- [x] **UIUX-04**: 使用者可快速切換起訖站（交換按鈕）

### TDX API 整合

- [x] **INTG-01**: 所有對 TDX API 的呼叫透過 Next.js Route Handler proxy，TDX credentials 不暴露於前端
- [x] **INTG-02**: TDX OAuth2 token 以 server-side 記憶體快取管理，避免每次 request 重新取得
- [x] **INTG-03**: TDX client_id 與 client_secret 以環境變數管理（`.env.local`，不 commit）

### 基礎架構

- [x] **INFR-01**: Next.js 16（App Router）+ TypeScript 專案架構
- [x] **INFR-02**: 可部署至 Vercel，環境變數設定於 Vercel dashboard

## v2 Requirements (Milestone v2.0 — In Progress)

### 查詢功能

- [x] **QURY-05**: 使用者可選擇起訖站、去程日期與回程日期，一次查詢兩段班次（去程與回程各自顯示完整時刻與座位狀態）

### 個人化

- [x] **PERS-01**: 使用者可儲存常用起訖站組合（最多 10 組，localStorage 持久化，不需登入）
- [x] **PERS-03**: 使用者可點擊已儲存路線一鍵帶入查詢表單起訖站，並可刪除已儲存路線

### 分享

- [x] **SHAR-01**: 使用者可複製含起訖站與日期的查詢連結；他人開啟連結後頁面自動帶入條件並執行查詢

## Future Requirements (v2.1+)

- **PERS-02**: 記憶上次查詢的起訖站，作為預設值
- **SHAR-02**: 來回票查詢的可分享連結（需 QURY-05 與 SHAR-01 穩定後再做）

## Out of Scope

| Feature | Reason |
|---------|--------|
| 直接整合高鐵訂票 | 官方無公開訂票 API |
| 會員系統 / 登入 | 不在本次範圍，無必要 |
| 多語言（英日文） | 先做中文版 |
| 即時到站資訊 | 不同的 API 端點，複雜度高，v3 考慮 |
| 離線功能 / PWA | 過度工程 |
| 跨裝置路線同步 | 需要後端與帳號系統，不在範圍 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-01 | Phase 1 | Complete (01-01) |
| INFR-02 | Phase 1 | Complete |
| INTG-01 | Phase 1 | Complete |
| INTG-02 | Phase 1 | Complete |
| INTG-03 | Phase 1 | Complete |
| QURY-01 | Phase 2 | Complete |
| QURY-02 | Phase 2 | Complete |
| QURY-04 | Phase 2 | Complete |
| UIUX-02 | Phase 2 | Complete |
| UIUX-03 | Phase 2 | Complete (02-02) |
| UIUX-04 | Phase 2 | Complete (02-02) |
| QURY-03 | Phase 3 | Complete |
| UIUX-01 | Phase 4 | Complete (04-01) |
| SHAR-01 | Phase 5 (v2.0) | Complete |
| PERS-01 | Phase 6 (v2.0) | Complete |
| PERS-03 | Phase 6 (v2.0) | Complete |
| QURY-05 | Phase 7 (v2.0) | Complete |

**Coverage:**
- v1 requirements: 13 total — all complete ✓
- v2.0 requirements: 4 total — all mapped (Phases 5–7) ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 — v2.0 roadmap created; traceability updated (SHAR-01→Phase 5, PERS-01/PERS-03→Phase 6, QURY-05→Phase 7)*
