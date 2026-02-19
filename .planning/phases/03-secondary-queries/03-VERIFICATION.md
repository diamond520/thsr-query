---
phase: 03-secondary-queries
verified: 2026-02-19T07:30:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
human_verification:
  - test: "By-train query end-to-end: type '0101' and submit"
    expected: "12-stop timeline table renders with station names, arrival time '—' for 南港 (first stop), departure time '—' for 左營 (last stop)"
    why_human: "Cannot programmatically render React components; must visually confirm stop timeline layout and '—' substitution for empty times"
  - test: "By-train query: type '9999' and submit"
    expected: "Message '查無車次「9999」的資料，請確認車次號是否正確' appears"
    why_human: "Empty-array response handling requires live React Query to confirm correct branch is taken"
  - test: "By-train form validation: type 'abc' in train number field"
    expected: "Submit button remains disabled; form cannot be submitted"
    why_human: "Button disabled state requires browser interaction to confirm"
  - test: "By-station query: select a station (e.g. 台北) and submit"
    expected: "Northbound/southbound tabs appear with train rows showing TrainNo and SeatBadge components; default tab is 北上"
    why_human: "Tab rendering and SeatBadge display require live browser to verify correct seat status colour/text mapping"
  - test: "Three-tab layout: page loads at http://localhost:3000"
    expected: "Three tabs visible at top (時間查詢 | 車次查詢 | 車站查詢); 時間查詢 active by default showing Phase 2 QueryForm intact"
    why_human: "Visual tab layout and default active state require browser to confirm"
---

# Phase 3: Secondary Queries Verification Report

**Phase Goal:** 使用者可透過車次號查詢單一列車停站時刻，亦可查詢特定車站的座位剩餘狀況
**Verified:** 2026-02-19T07:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

Phase 3 has three observable success criteria drawn directly from ROADMAP.md. All are substantiated by real, non-stub implementations verified against the actual codebase.

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 使用者輸入車次號後，頁面顯示該列車的完整停站順序與各站到發時刻 | VERIFIED | `by-train-result.tsx` renders stop map from `TdxTrainStop[]` via `useQuery`; route handler returns normalized `TdxTrainStop[]` from `MOCK_TIMETABLE_BY_TRAIN`; first/last stop times render as '—' |
| 2 | 使用者選擇車站後，頁面顯示該站目前可搭乘班次的座位剩餘狀況（北上 / 南下分頁） | VERIFIED | `by-station-result.tsx` renders northbound/southbound `Tabs` from `TdxStationSeatStatus`; route handler splits by `Direction`; `SeatBadge` used per `TrainSeatRow` |
| 3 | 兩種查詢均有 loading、查無資料、API 錯誤的對應畫面 | VERIFIED | Both result components implement all 4 states: idle (`return null`), loading (Skeleton), error (red border div), empty (muted text message) |

**Score:** 3/3 truths verified (automated); visual confirmation needed for 5 human tests.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types/tdx.ts` | Phase 3 types: TdxGeneralTimetableStop, TdxGeneralTimetableResponse, TdxTrainStop, TdxStationSeatStatus | VERIFIED | All 4 types defined at lines 80–114; interfaces are substantive with correct field shapes |
| `src/fixtures/tdx-mock.ts` | MOCK_TIMETABLE_BY_TRAIN keyed by trainNo string | VERIFIED | Exported at line 161; contains 3 trains (0101 12-stop, 0102 12-stop, 0115 6-stop express); MOCK_SEAT_STATUS_BY_STATION also present |
| `src/lib/tdx-api.ts` | fetchGeneralTimetable(trainNo) calling TDX GeneralTimetable/TrainNo endpoint | VERIFIED | Exported at line 96; calls `${TDX_BASE}/GeneralTimetable/TrainNo/${trainNo}`; empty-array guard (`if (!data.length) return []`) present |
| `src/app/api/tdx/timetable-by-train/route.ts` | GET route with force-dynamic, mock short-circuit, TdxTrainStop normalization | VERIFIED | `export const dynamic = 'force-dynamic'` at line 11; mock short-circuit at lines 24–28; full TDX-to-TdxTrainStop normalization at lines 31–39 |
| `src/components/by-train-form.tsx` | Train number input with /^\d{1,4}$/ validation and submit disabled when invalid | VERIFIED | `isValidTrainNo` uses `/^\d{1,4}$/` at line 18; `Button` has `disabled={!isValid}` at line 49 |
| `src/components/by-train-result.tsx` | Stop timeline with loading/empty/error states | VERIFIED | All 5 states implemented: idle (line 33–35), loading (lines 38–46), error (lines 49–55), empty (lines 58–64), result table (lines 67–106) |
| `src/app/api/tdx/seat-status/route.ts` | GET route with force-dynamic, mock short-circuit, Direction split | VERIFIED | `export const dynamic = 'force-dynamic'` at line 10; mock short-circuit at lines 23–25; Direction split (0=southbound, 1=northbound) at lines 31–32 |
| `src/components/by-station-form.tsx` | Station select reusing ['stations'] React Query cache; submit emits stationId | VERIFIED | `queryKey: ['stations']` at line 34 (matches QueryForm key); `onSubmit(stationId)` called at line 42 |
| `src/components/by-station-result.tsx` | Northbound/southbound Tabs with SeatBadge; all UI states | VERIFIED | `Tabs defaultValue="northbound"` at line 99; `TrainSeatRow` uses `SeatBadge` at lines 33–34; all 4 states implemented |
| `src/app/page.tsx` | Top-level Tabs wrapping all three query modes | VERIFIED | Three `TabsContent` blocks at lines 40, 48, 56; `ByTrainForm`/`ByTrainResult` wired via `trainNo` state; `ByStationForm`/`ByStationResult` wired via `stationId` state |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `by-train-form.tsx` | `by-train-result.tsx` | trainNo state in page.tsx | WIRED | `setTrainNo` passed as `onSubmit` to `ByTrainForm`; `trainNo` passed as prop to `ByTrainResult` (page.tsx lines 17, 50, 52) |
| `by-train-result.tsx` | `/api/tdx/timetable-by-train` | useQuery fetch | WIRED | `fetch('/api/tdx/timetable-by-train?trainNo=...')` at line 15; result assigned to `stops` and rendered |
| `timetable-by-train/route.ts` | `tdx-api.ts` | fetchGeneralTimetable(trainNo) | WIRED | Imported at line 6; called at line 31 in real-mode branch |
| `tdx-api.ts` | TDX_BASE/GeneralTimetable/TrainNo | authenticated fetch | WIRED | `${TDX_BASE}/GeneralTimetable/TrainNo/${trainNo}` at line 99; Bearer token header added |
| `by-station-form.tsx` | `by-station-result.tsx` | stationId state in page.tsx | WIRED | `setStationId` passed as `onSubmit` to `ByStationForm`; `stationId` passed as prop to `ByStationResult` (page.tsx lines 20, 58, 60) |
| `by-station-result.tsx` | `/api/tdx/seat-status` | useQuery fetch | WIRED | `fetch('/api/tdx/seat-status?stationId=...')` at line 17; result destructured to `data.northbound`/`data.southbound` and rendered |
| `seat-status/route.ts` | `tdx-api.ts` | fetchSeatStatus(stationId) | WIRED | Imported at line 6; called at line 28 in real-mode branch; result split by Direction |
| `page.tsx` | all four Phase 3 components | shadcn TabsContent | WIRED | All four components imported and rendered within their respective `TabsContent` blocks |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| QURY-03 | 03-01-PLAN.md, 03-02-PLAN.md | 使用者可輸入車次號查詢單一列車的停站與時刻表 | SATISFIED | By-train pipeline fully implemented end-to-end (form → result → route → api); by-station seat status also delivered (covered under same phase, mapped to QURY-03 per ROADMAP.md) |

**Orphaned requirements check:** REQUIREMENTS.md maps only `QURY-03` to Phase 3. No additional requirement IDs are mapped to Phase 3 and unclaimed by plans. No orphaned requirements found.

**Note on requirement scope:** QURY-03 as written in REQUIREMENTS.md covers by-train query only. The Phase 3 goal also includes by-station seat status, which is not represented by a dedicated requirement ID — it is subsumed within QURY-03 per the ROADMAP.md requirements field (`Requirements: QURY-03`). This is consistent across plans and requirements traceability table.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `by-train-form.tsx` | 40 | `placeholder="例：0117"` | Info | HTML input placeholder attribute — not a stub indicator |
| `by-station-form.tsx` | 50 | `placeholder="選擇車站"` | Info | shadcn `SelectValue` placeholder — not a stub indicator |
| `by-train-result.tsx` | 34 | `return null` | Info | Legitimate idle state guard (when `!trainNo`), not a stub |
| `by-station-result.tsx` | 67, 89 | `return null` | Info | Legitimate idle/guard returns — line 67 is idle state, line 89 is post-loading data guard |

No blockers or warnings found. All flagged patterns are intentional and correct.

### Human Verification Required

#### 1. By-train query: stop timeline rendering

**Test:** Navigate to 車次查詢 tab, type `0101`, press 查詢
**Expected:** 12-row stop table renders; 南港 row shows arrival as '—', 左營 row shows departure as '—'; all other rows show both times
**Why human:** React Query fetch lifecycle and conditional rendering of '—' for empty time strings cannot be verified without running the application

#### 2. By-train query: unknown train number

**Test:** Type `9999`, press 查詢
**Expected:** '查無車次「9999」的資料，請確認車次號是否正確' message appears (not an error, not loading)
**Why human:** The empty-array branch (`stops.length === 0`) requires live React Query to confirm the correct UI state is rendered

#### 3. By-train form: invalid input disables submit

**Test:** Type `abc` or leave field empty, observe submit button state
**Expected:** Submit button is disabled and cannot be clicked
**Why human:** `disabled` attribute behaviour and visual feedback require browser interaction

#### 4. By-station query: seat status with northbound/southbound tabs

**Test:** Navigate to 車站查詢 tab, select 台北 from dropdown, press 查詢
**Expected:** Card appears with 北上 tab active by default; train rows list TrainNo + SeatBadge for standard/business seats; switching to 南下 tab shows different trains
**Why human:** Tab default value, SeatBadge colour rendering (O=green, L=orange, X=red), and tab switching require browser to verify

#### 5. Three-tab page layout and Phase 2 preservation

**Test:** Open http://localhost:3000
**Expected:** Page shows three tabs at top (時間查詢 | 車次查詢 | 車站查詢); 時間查詢 is active by default; Phase 2 QueryForm with station selects and date picker is present and functional
**Why human:** Visual tab layout, active state, and Phase 2 regression cannot be confirmed without browser

### Gaps Summary

No gaps. All automated checks passed:
- All 10 artifacts exist, are substantive (non-stub), and are wired into the application flow
- All 8 key links verified via grep
- QURY-03 is the only requirement mapped to Phase 3; it is fully satisfied
- TypeScript compilation passes with 0 errors (`npx tsc --noEmit` exits clean)
- All 4 referenced commits (1a10323, ddcc9f6, 9a85b2f, d63ddba) exist in git history
- No TODO/FIXME/placeholder stubs found
- shadcn UI components (tabs, input, label) installed at `src/components/ui/`

Phase goal achievement is blocked only by 5 human visual/interactive verification items. No implementation gaps exist.

---

_Verified: 2026-02-19T07:30:00Z_
_Verifier: Claude (gsd-verifier)_
