# Requirements: THSR Query — Next.js 重構

**Defined:** 2026-02-19
**Core Value:** 使用者能在幾秒內查到自己要搭的那班車有沒有位置。

## v1 Requirements

### 查詢功能

- [x] **QURY-01**: 使用者可選擇起站、訖站與日期查詢當日所有高鐵班次時刻
- [x] **QURY-02**: 時刻表每一列班次直接顯示標準席和商務席的座位剩餘狀態（充足/有限/售完）
- [ ] **QURY-03**: 使用者可輸入車次號查詢單一列車的停站與時刻表
- [x] **QURY-04**: 時刻表每一列班次顯示「去訂票」連結，點擊後跳至高鐵官方訂票頁面

### UI / UX

- [ ] **UIUX-01**: 起訖站選擇使用視覺化線路圖（12 個車站顯示為線段上的點，點擊選取）
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

## v2 Requirements

### 個人化

- **PERS-01**: 使用者可儲存常用起訖站組合
- **PERS-02**: 記憶上次查詢的起訖站，作為預設值

### 通知

- **NOTF-01**: 可分享特定班次的連結（URL 包含查詢條件）

## Out of Scope

| Feature | Reason |
|---------|--------|
| 直接整合高鐵訂票 | 官方無公開訂票 API |
| 會員系統 / 登入 | 不在本次範圍，無必要 |
| 多語言（英日文） | 先做中文版 |
| 即時到站資訊 | 不同的 API 端點，複雜度高，v2 考慮 |
| 離線功能 / PWA | 過度工程 |

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
| QURY-03 | Phase 3 | Pending |
| UIUX-01 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 — Phase 2 complete; QURY-01/02/04, UIUX-02/03/04 all verified by 02-04 human verification*
