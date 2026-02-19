# Phase 1: Foundation - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

建立 Next.js 16 App Router 專案骨架、TDX OAuth2 server-side token 管理機制、安全的 `/api/tdx/*` Route Handler proxy 層。所有後續 phase 的 API 呼叫都建立在這個基礎上。

不包含：任何查詢 UI 元件、實際的時刻表/座位查詢端點（那是 Phase 2/3 的範疇）。

</domain>

<decisions>
## Implementation Decisions

### Repo 結構
- Next.js 直接取代目前 repo 根目錄（不建子目錄，不建新 repo）
- 舊 Vue 2 的 `src/` 移入 `_archive/`（保留作為參考，不在主要目錄）
- `docs/`（舊版 GitHub Pages 靜態檔）直接刪除 — Vercel 取代 GitHub Pages

### TDX 沒有 Token 時的開發策略
- 做 mock 模式，mock 資料要完整模擬真實 TDX API 回應格式（fixture data）
- 切換機制：**自動側測** — 若未設定 `TDX_CLIENT_ID` / `TDX_CLIENT_SECRET` 環境變數，自動 fallback 到 mock 資料；設定後自動呼叫真實 TDX API
- 不需要 `USE_MOCK_TDX` 旗標，靠環境變數是否存在來決定

### Vercel 部署策略
- Phase 1 **優先本地跑通**，Vercel 設定納入 Phase 1 但不作為完成的阻塞條件
- Vercel 部署是 Phase 1 的一部份，但「成功部署到 Vercel」不是開始 Phase 2 的前提（本地通過即可先繼續）

### Station 資料存取
- 車站資料在 **build time 從 TDX 取回**（SSG/ISR），結果進入 bundle
- 若無 TDX token（mock 模式），build time 使用 mock fixture 中的車站資料
- 不需要自動更新機制 — 高鐵站點幾乎不變，若有異動手動更新即可

### Claude's Discretion
- Next.js 目錄結構細節（`app/`、`lib/`、`components/` 等的具體命名）
- TypeScript 設定嚴格程度
- Fixture mock 資料的具體格式與存放位置
- Tailwind v4 + shadcn/ui 初始化方式

</decisions>

<specifics>
## Specific Ideas

- Mock 資料要「完整模擬」：TDX API 回傳的 JSON 格式要對，後續 Phase 2/3 的 UI 才能用同一份 type 定義測試
- 自動 fallback 機制讓開發體驗更流暢 — 不需要記得設旗標

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-19*
