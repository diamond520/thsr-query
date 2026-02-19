# THSR Query — Next.js 重構

## What This Is

台灣高鐵查詢工具，讓使用者可以快速查詢高鐵時刻表、座位剩餘狀況、單一車次資訊，並直接連結至官方訂票頁面。原版為 Vue 2 SPA，本次從頭以 Next.js 重寫，並將資料來源從已停用的 PTX API 遷移至 TDX API。

## Core Value

使用者能在幾秒內查到自己要搭的那班車有沒有位置。

## Current Milestone: v2.0 UX Enhancement

**Goal:** 讓使用者可以一次查詢來回行程、儲存常用路線快速重查，並分享查詢結果給同行者。

**Target features:**
- 來回票查詢：去程 + 回程各自選日期，並排顯示兩段班次列表
- 儲存常用路線：以 localStorage 儲存起訖站組合，快速帶入查詢
- 可分享查詢條件連結：URL 包含起訖站 + 日期，開啟即顯示查詢結果

## Requirements

### Validated

<!-- 從現有 Vue 2 codebase 推斷的已驗證功能 -->

- ✓ 查詢所有高鐵車站列表 — 現有
- ✓ 依起訖站與日期查詢每日時刻表 — 現有
- ✓ 依車次號查詢時刻 — 現有
- ✓ 查詢特定車站的可用座位狀態 — 現有

### Active (v1.0 — Complete)

<!-- v1.0 重構目標 — 全部完成 -->

- [x] 使用 Next.js 重寫整個 app（取代 Vue 2）
- [x] 將資料來源從 PTX API 遷移至 TDX API（含 OAuth2 token 認證）
- [x] Mobile UI：仿照 t-ex app 風格（現代、卡片式）
- [x] Desktop UI：仿照高鐵官網但簡潔化
- [x] 查詢結果頁顯示「去訂票」連結（跳至高鐵官網訂票頁）
- [x] 依車次號查詢停站時刻
- [x] 依車站查詢北上/南下座位剩餘
- [x] Mobile 視覺化線路圖車站選擇器

### Active (v2.0 — In Progress)

<!-- v2.0 UX Enhancement -->

- [ ] 來回票查詢：去程 + 回程各自選日期，並排顯示兩段班次
- [ ] 儲存常用路線：localStorage 起訖站組合，快速帶入
- [ ] 可分享查詢條件：URL query string 含起訖站 + 日期，開啟即查詢

### Out of Scope

- 直接整合高鐵訂票功能 — 官方無公開訂票 API
- 會員系統 / 登入 — 不在本次範圍
- 多語言（英日文） — 先做中文版

## Context

- 原 PTX API（`ptx.transportdata.tw`）已於 2022 年 7 月停用，需改用 TDX（`tdx.transportdata.tw`）
- TDX 需要向政府申請帳號（免費），取得 `client_id` 與 `client_secret` 後以 OAuth2 取得 Bearer token
- 使用者目前尚未有 TDX 帳號，需先完成申請才能呼叫 API
- 現有 codebase 三個查詢功能：byTime（時刻表）、byTrainNo（單列車次）、byStation（座位剩餘）
- 無測試覆蓋、無 CI/CD

## Constraints

- **Tech Stack**: Next.js（React）— 使用者指定
- **API**: TDX API v2，`/Rail/THSR/` 系列端點
- **Auth**: TDX OAuth2，token 需在 server-side 管理（避免 client_secret 暴露）
- **Deployment**: 暫定 Vercel（Next.js 最佳相容）

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 從頭重寫而非漸進遷移 | Vue 2 → React 無法漸進，且舊架構本身簡單 | — Pending |
| Server-side TDX token 管理 | client_secret 不能暴露在前端 | — Pending |
| Next.js App Router vs Pages Router | App Router 為 Next.js 13+ 推薦，但新手曲線較陡 | — Pending |

---
*Last updated: 2026-02-19 — Milestone v2.0 started (來回票 + 常用路線 + 分享連結)*
