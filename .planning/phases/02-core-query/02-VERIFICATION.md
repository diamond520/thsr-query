---
phase: 02-core-query
verified: 2026-02-19T07:00:00Z
status: passed
score: 5/5 success criteria verified
re_verification: false
---

# Phase 2: Core Query Verification Report

**Phase Goal:** 使用者可以選擇起訖站與日期，看到當日所有班次的時刻與座位狀態，並直接點擊前往官方訂票頁
**Verified:** 2026-02-19
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 使用者選擇起站、訖站、日期後提交查詢，頁面顯示當日所有班次列表（車次號、出發時刻、抵達時刻、行車時間） | VERIFIED | `src/app/page.tsx` wires `QueryForm` → `queryParams` state → `TrainList`; `train-list.tsx` calls `/api/tdx/trains`; `train-card.tsx` and `train-table.tsx` render trainNo, departureTime, arrivalTime, calcDuration() |
| 2 | 每一列班次直接顯示標準席與商務席的座位狀態（充足 / 有限 / 售完），不需再點擊即可看到 | VERIFIED | `seat-badge.tsx` maps O→充足(green), L→有限(amber), X→售完(red), null→"—"(gray); both `TrainCard` and `TrainTable` render `<SeatBadge status={train.standardSeat} type="標準席" />` and `<SeatBadge status={train.businessSeat} type="商務席" />` unconditionally |
| 3 | 每一列班次有「去訂票」連結，點擊後跳至高鐵官方訂票頁面 | VERIFIED | Both `train-card.tsx` and `train-table.tsx` contain `<form method="POST" action="https://www.thsrc.com.tw/TimeTable/Search" target="_blank">` with hidden inputs (StartStation, EndStation, OutWardSearchDate, OutWardSearchTime); human-verified (Test 6 passed) |
| 4 | 起訖站可透過交換按鈕一鍵對調，日期選擇使用台灣時區（UTC+8）避免跨夜顯示錯誤 | VERIFIED | `query-form.tsx` implements `handleSwap()` swapping origin/destination state; date initialized via `useState<Date>(() => getTaiwanToday())`; `taiwan-date.ts` uses `Intl.DateTimeFormat` with `timeZone: 'Asia/Taipei'`; human-verified (Tests 3, 4 passed) |
| 5 | 頁面在手機與桌面瀏覽器均可正常操作，查詢中顯示 loading 狀態，查無資料與錯誤分別有對應提示 | VERIFIED | `train-list.tsx` implements all 4 states: idle hint text / 5 skeleton cards / error+重試 button / results; `md:hidden` card list + `hidden md:block` table for responsive layout; human-verified (Tests 5, 7, 8 passed) |

**Score:** 5/5 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types/tdx.ts` | TdxSeatCode, TdxSeatStop, TdxSeatStatus, TdxDailyTrain, TdxEnrichedTrain | VERIFIED | All 5 types exported; TdxSeatCode = 'O' \| 'L' \| 'X'; TdxEnrichedTrain has trainNo, departureTime, arrivalTime, standardSeat, businessSeat |
| `src/fixtures/tdx-mock.ts` | MOCK_TRAINS with 8 entries covering O/L/X/null | VERIFIED | 8 entries exported; status codes O, L, X all present; train 0113 has businessSeat: null (tests "—" fallback) |
| `src/lib/tdx-api.ts` | fetchDailyTrains, fetchSeatStatus exports | VERIFIED | Both functions exported; DailyTimetable/OD and AvailableSeatStatusList URLs present; `isMockMode()` exported |
| `src/app/api/tdx/trains/route.ts` | GET handler, force-dynamic, param validation, mock+real mode | VERIFIED | `export const dynamic = 'force-dynamic'`; 400 on missing params; `isMockMode()` branch returns MOCK_TRAINS; real mode uses `Promise.all` + `seatMap.get()` join |
| `src/lib/taiwan-date.ts` | getTaiwanToday() using Asia/Taipei | VERIFIED | Uses `Intl.DateTimeFormat` with `timeZone: 'Asia/Taipei'`; appends `T00:00:00` for midnight-local parse |
| `src/components/seat-badge.tsx` | SeatBadge with O/L/X/null color mapping, amber 商務席 label | VERIFIED | STATUS_CONFIG maps O→green-100, L→amber-100, X→red-100; 商務席 label uses `text-amber-700`; null renders "—" badge |
| `src/components/query-form.tsx` | QueryForm + QueryParams export; swap; Taiwan date default | VERIFIED | Exports `QueryForm` and `QueryParams`; `handleSwap` swaps origin/destination; `useState(() => getTaiwanToday())`; `onSubmit(params: QueryParams)` prop pattern |
| `src/components/train-card.tsx` | TrainCard with seat badges + booking form POST | VERIFIED | Exports `TrainCard`; renders SeatBadge for both seats; form POST to thsrc.com.tw/TimeTable/Search with 5 hidden inputs; `target="_blank"` |
| `src/components/train-table.tsx` | TrainTable with 7-column header + seat badges + booking form per row | VERIFIED | Exports `TrainTable`; 7 columns (車次, 出發, 抵達, 行車時間, 標準席, 商務席, 訂票); SeatBadge in each row; form POST per row |
| `src/components/train-list.tsx` | TrainList with idle/loading/error/empty/results states; enabled: !!params | VERIFIED | Exports `TrainList`; all 5 states implemented; `enabled: !!params` (not skipToken); `md:hidden` + `hidden md:block` responsive toggle; `refetch()` on 重試 |
| `src/app/page.tsx` | QueryForm + TrainList wired with shared queryParams state | VERIFIED | `'use client'`; `useState<QueryParams \| null>(null)`; `<QueryForm onSubmit={setQueryParams} />`; `<TrainList params={queryParams} />` |
| shadcn UI components | select, badge, skeleton, card, calendar, popover, button | VERIFIED | All 7 files exist in `src/components/ui/` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/tdx/trains/route.ts` | `src/lib/tdx-api.ts` | `import { isMockMode, fetchDailyTrains, fetchSeatStatus }` | WIRED | Line 6: import confirmed; all three functions called in handler body |
| `src/lib/tdx-api.ts` | TDX DailyTimetable/OD endpoint | fetch with Bearer token (or MOCK_TRAINS in mock mode) | WIRED | `${TDX_BASE}/DailyTimetable/OD/${originId}/to/${destId}/${date}` at line 58; mock path returns MOCK_TRAINS via route.ts |
| `route.ts` join logic | `seatMap.get(train.DailyTrainInfo.TrainNo)` | Map keyed on TrainNo — timetable as left dataset | WIRED | Line 44: `const seat = seatMap.get(trainNo)` confirmed |
| `src/components/query-form.tsx` | `src/lib/taiwan-date.ts` | `useState(() => getTaiwanToday())` | WIRED | Line 23: import; line 46: `useState<Date>(() => getTaiwanToday())` |
| `src/components/query-form.tsx` | parent via `onSubmit(params: QueryParams)` | callback prop | WIRED | `onSubmit` prop defined and called in `handleSubmit`; `page.tsx` passes `setQueryParams` |
| `src/components/seat-badge.tsx` | `src/types/tdx.ts` | `import type TdxSeatCode` | WIRED | Line 10: import confirmed; `status: TdxSeatCode \| null` prop type |
| `src/components/train-list.tsx` | `/api/tdx/trains` | `useQuery` with `enabled: !!params` | WIRED | Line 17: URL construction; line 55: `enabled: !!params` |
| `src/components/train-card.tsx` | `src/components/seat-badge.tsx` | `import SeatBadge` | WIRED | Line 6: import; lines 56-57: both SeatBadge instances rendered |
| `train-card.tsx` + `train-table.tsx` booking link | `https://www.thsrc.com.tw/TimeTable/Search` | form POST with hidden inputs, target=_blank | WIRED | `train-card.tsx` line 64; `train-table.tsx` line 66; StartStation, EndStation, OutWardSearchDate, OutWardSearchTime all present |
| `src/app/page.tsx` | `src/components/query-form.tsx` | `<QueryForm onSubmit={setQueryParams} />` | WIRED | Line 21 confirmed |
| `src/app/page.tsx` | `src/components/train-list.tsx` | `<TrainList params={queryParams} />` | WIRED | Line 25 confirmed |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| QURY-01 | 02-01, 02-02, 02-04 | 使用者可選擇起站、訖站與日期查詢當日所有高鐵班次時刻 | SATISFIED | QueryForm collects origin/destination/date; TrainList calls /api/tdx/trains; results render all trains with times |
| QURY-02 | 02-01, 02-03 | 時刻表每一列班次直接顯示標準席和商務席的座位剩餘狀態 | SATISFIED | SeatBadge renders status inline in TrainCard and TrainTable without additional clicks |
| QURY-04 | 02-03 | 時刻表每一列班次顯示「去訂票」連結，點擊後跳至高鐵官方訂票頁面 | SATISFIED | Form POST to thsrc.com.tw/TimeTable/Search with target=_blank in both TrainCard and TrainTable |
| UIUX-02 | 02-03 | Mobile-first 響應式設計 — 手機版卡片式，桌面版表格式 | SATISFIED | md:hidden card list + hidden md:block table; human-verified Tests 7 and 8 |
| UIUX-03 | 02-02 | 日期選擇使用台灣時區（UTC+8） | SATISFIED | taiwan-date.ts uses Asia/Taipei; useState initializer pattern prevents hydration mismatch; human-verified Test 4 (no console errors) |
| UIUX-04 | 02-02 | 使用者可快速切換起訖站（交換按鈕） | SATISFIED | handleSwap() swaps origin/destination state; ArrowLeftRight icon button; human-verified Test 3 |

No orphaned requirements — all 6 requirements declared in plans are accounted for, and REQUIREMENTS.md traceability table maps exactly these 6 IDs to Phase 2.

---

## Anti-Patterns Found

No anti-patterns detected.

- Zero TODO/FIXME/HACK/PLACEHOLDER comments in any Phase 2 source files
- No stub returns (return null, return {}, return []) in component files
- `query-form.tsx` lines 82 and 109 contain `placeholder="起站"` and `placeholder="訖站"` — these are legitimate HTML input placeholder attributes (UI hint text), not code stubs
- TypeScript: `npx tsc --noEmit` completes with 0 errors

---

## Human Verification

Human verification was completed and approved during Plan 02-04 (blocking checkpoint task). All 9 test scenarios passed:

1. Initial state — idle hint text visible, form rendered correctly
2. Station selects — 12 THSR stations (南港 through 左營) in dropdowns
3. Swap button — exchanges origin and destination values
4. Date picker — opens to Taiwan timezone date, no calendar rendering errors
5. Query and results — 5 skeletons during load, then 8 mock trains with trainNo, times, duration, two seat badge rows per train; correct colors (green/amber/red/gray)
6. Booking link — "去訂票" opens new tab to THSR website
7. Mobile layout (375px) — card layout active, form row [起站][swap][訖站]
8. Desktop layout (1280px) — table layout with 7 column headers
9. No console errors — no hydration mismatch, no React warnings

Human-verified items (visual appearance, responsive layout transitions, booking POST behavior, Taiwan date accuracy, console error absence) are all confirmed passing. No further human testing required.

---

## Summary

Phase 2 goal fully achieved. The complete user flow is implemented and verified end-to-end:

- **Data layer (02-01):** `/api/tdx/trains` Route Handler with parallel fetch, server-side join, mock mode, and 400 validation — all wired correctly to `tdx-api.ts`
- **Form UI (02-02):** `QueryForm` with station selects, Taiwan-timezone date picker, and swap button — all wired to `taiwan-date.ts` and parent via `onSubmit` callback
- **Results UI (02-03):** `TrainList` with all 4 states, `TrainCard` (mobile) and `TrainTable` (desktop) with seat badges and booking forms — all wired to `/api/tdx/trains` and `seat-badge.tsx`
- **Integration (02-04):** `page.tsx` wires form and list via `queryParams` state — human-verified with 9 passing tests

All 6 requirements (QURY-01, QURY-02, QURY-04, UIUX-02, UIUX-03, UIUX-04) satisfied. TypeScript 0 errors. No stubs. No orphaned requirements.

---

_Verified: 2026-02-19T07:00:00Z_
_Verifier: Claude (gsd-verifier)_
