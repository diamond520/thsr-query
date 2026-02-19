---
phase: 04-ui-polish
verified: 2026-02-19T08:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
human_verification:
  - test: "Mobile line picker renders 12 stations in north-to-south order"
    expected: "南港 at top, 左營 at bottom; vertical line connecting dots; station names visible"
    why_human: "Visual layout — CSS absolute positioning of vertical line (left-[19px]) and dot alignment cannot be verified without rendering"
  - test: "Two-tap selection flow works end-to-end on mobile"
    expected: "First tap highlights a station with 起 badge (primary color); second tap highlights different station with 訖 badge (destructive color); in-range stations show dimmed highlight"
    why_human: "Interactive tap sequence with state transitions requires a browser; color rendering depends on CSS custom properties"
  - test: "Tapping same station as origin during destination step clears and restarts"
    expected: "Dot clears, prompt returns to '請點選出發站'"
    why_human: "Edge-case interaction flow requires manual testing in browser"
  - test: "Tapping any station when both origin and destination are set clears and restarts from new origin"
    expected: "Previous destination clears, tapped station becomes new origin, prompt shows '請點選到達站'"
    why_human: "Complex state reset requires browser interaction to verify"
  - test: "Desktop breakpoint shows Select dropdowns with swap button, no line picker visible"
    expected: "On viewport >= 768px, hidden md:flex is visible and md:hidden is hidden; swap button works"
    why_human: "CSS breakpoint rendering requires browser viewport resizing"
  - test: "Form submission after mobile picker selection produces same QueryParams shape as desktop"
    expected: "onSubmit called with { origin, destination, date } matching TDX StationID values"
    why_human: "Shared state flow between mobile picker and submit handler requires end-to-end interaction test"
---

# Phase 4: UI Polish Verification Report

**Phase Goal:** 視覺化車站選擇器取代下拉選單，整體體驗達到 t-ex app 風格的流暢度與可用性
**Verified:** 2026-02-19T08:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                 | Status     | Evidence                                                                                                |
| --- | ------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| 1   | 手機版起訖站選擇顯示為垂直線路圖，12 個車站排列於線段上                               | ✓ VERIFIED | `station-line-picker.tsx` L103-162: `role="listbox"` div with `absolute` vertical line + `sortedStations.map()`; vertical `w-px` line via `absolute left-[19px] top-5 bottom-5` |
| 2   | 點擊車站第一下設定出發站，第二下設定到達站，不需下拉選單                               | ✓ VERIFIED | `handleStationTap` state machine L58-83: `step === 'origin'` calls `onOriginChange`; else calls `onDestinationChange` |
| 3   | 南港顯示於最上方，左營顯示於最下方（北→南地理順序）                                   | ✓ VERIFIED | `sortedStations` L54-56: `sort((a,b) => parseInt(a.StationID) - parseInt(b.StationID))` ascending — StationID 1=南港, 12=左營 |
| 4   | 出發站與到達站以不同顏色標示，中間車站顯示淡色高亮                                   | ✓ VERIFIED | `getStationState` L18-34: returns 'origin'/'destination'/'in-range'/'default'; CSS classes L130-133: `bg-primary` (origin), `bg-destructive` (destination), `bg-primary/30` (in-range) |
| 5   | 選取後提交查詢，行為與原有 Select 下拉選單完全一致                                   | ✓ VERIFIED | `query-form.tsx` L44-45: shared `origin`/`destination` state; L84-85: picker uses `setOrigin`/`setDestination`; L74: `isValid` unchanged; L61-72: `handleSubmit` unchanged |
| 6   | 桌面版（md 以上）繼續使用原有 Select 下拉選單，無變化                                 | ✓ VERIFIED | `query-form.tsx` L91: `<div className="hidden md:flex items-center gap-2">` wraps both Selects + swap button; no regression to desktop logic |
| 7   | 交換按鈕點擊後，線路圖選取狀態正確更新                                               | ✓ VERIFIED | `handleSwap` L56-59 swaps `origin`/`destination` state; `useEffect` L48-51 in picker resets `step` to 'origin' when origin is cleared externally; swap button inside `hidden md:flex` (desktop-only) |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact                                      | Expected                                         | Status     | Details                                                                                                   |
| --------------------------------------------- | ------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------- |
| `src/components/station-line-picker.tsx`      | 視覺化線路圖車站選擇元件, min 80 lines, exports StationLinePicker | ✓ VERIFIED | 165 lines; exports `StationLinePicker` (named export L36); full implementation with state machine, sorting, color states, WCAG aria attributes |
| `src/components/query-form.tsx`               | QueryForm 整合 mobile picker + desktop selects, contains "md:hidden" | ✓ VERIFIED | `md:hidden` at L79; `hidden md:flex` at L91; `StationLinePicker` imported L25 and rendered L80-88 |

### Key Link Verification

| From                            | To                                             | Via                                              | Status  | Details                                                                                             |
| ------------------------------- | ---------------------------------------------- | ------------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------- |
| `src/components/query-form.tsx` | `src/components/station-line-picker.tsx`       | import StationLinePicker + render inside md:hidden div | ✓ WIRED | L25: `import { StationLinePicker } from '@/components/station-line-picker'`; L80-87: rendered with all props wired |
| `src/components/station-line-picker.tsx` | `onOriginChange` / `onDestinationChange` props | `handleStationTap` state machine                 | ✓ WIRED | Props called at L63, L64, L70, L76, L79 — all branches of the state machine invoke the appropriate prop callbacks |

### Requirements Coverage

| Requirement | Source Plan | Description                                               | Status       | Evidence                                                                                     |
| ----------- | ----------- | --------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| UIUX-01     | 04-01-PLAN  | 起訖站選擇使用視覺化線路圖（12 個車站顯示為線段上的點，點擊選取） | ✓ SATISFIED  | `station-line-picker.tsx` implements full visual line map; integrated in `query-form.tsx` with CSS breakpoint swap; build passes; commits 3d6806b + 13b3614 verified in git |

No orphaned requirements: REQUIREMENTS.md traceability table maps only UIUX-01 to Phase 4, and 04-01-PLAN.md claims exactly UIUX-01.

### Anti-Patterns Found

| File                     | Line | Pattern     | Severity  | Impact |
| ------------------------ | ---- | ----------- | --------- | ------ |
| `query-form.tsx` L95,122 | 95, 122 | `placeholder="起站"` / `placeholder="訖站"` | ℹ️ Info | These are UI input placeholder strings for the desktop Select dropdowns — not code stubs. No impact. |

No blockers, no warnings. The two `placeholder` occurrences are legitimate shadcn/ui `SelectValue` placeholder props, not placeholder implementations.

### Build Verification

- `npx tsc --noEmit`: Passed — zero TypeScript errors
- `npm run build`: Passed — Next.js 16 compiled successfully in 1470ms, all 5 static pages generated, all routes registered

### Human Verification Required

#### 1. Mobile Line Picker Visual Layout

**Test:** Open the app on a mobile viewport (< 768px) or in Chrome DevTools mobile emulation
**Expected:** 南港 appears at the top, 左營 at the bottom; a thin vertical line connects all 12 station dots; station names render to the right of each dot
**Why human:** CSS absolute positioning of the vertical line (`left-[19px] top-5 bottom-5 w-px`) and dot alignment depends on actual render dimensions

#### 2. Two-Tap Selection Flow

**Test:** Tap 南港, then tap 左營
**Expected:** After first tap, 南港 dot turns primary color with "起" badge; prompt shows "請點選到達站"; after second tap, 左營 dot turns destructive color with "訖" badge; all intermediate dots show dimmed primary highlight
**Why human:** Color rendering depends on CSS custom properties (Tailwind theme tokens); interactive state transitions require a browser

#### 3. Same-Station Deselect Edge Case

**Test:** Tap 台中 (origin selected, now in destination step), then tap 台中 again
**Expected:** 台中 dot clears, step returns to origin, prompt shows "請點選出發站"
**Why human:** Edge-case interaction flow requires manual testing

#### 4. Both-Selected Reset Edge Case

**Test:** Tap 南港 then 左營 (both selected), then tap 台中
**Expected:** 台中 becomes new origin (primary dot + 起 badge), 左營 clears; prompt shows "請點選到達站"
**Why human:** Complex state reset sequence requires browser interaction

#### 5. Desktop Breakpoint Isolation

**Test:** Resize browser to >= 768px width
**Expected:** `md:hidden` picker is not visible; `hidden md:flex` Select row appears with both dropdowns and swap button; swap button correctly exchanges origin/destination
**Why human:** CSS breakpoint rendering and responsive layout requires browser viewport testing

#### 6. End-to-End Form Submission from Mobile Picker

**Test:** On mobile, tap 南港 (origin), tap 左營 (destination), select a date, press 查詢
**Expected:** `onSubmit` receives `{ origin: "1", destination: "12", date: "YYYY-MM-DD" }` and results load correctly
**Why human:** Full form submission flow and API integration requires browser interaction

### Gaps Summary

No gaps. All 7 observable truths are verified at all three levels (exists, substantive, wired). The production build passes with zero errors. The only outstanding items are 6 human verification tests covering visual rendering, interactive behavior, and end-to-end submission — these are inherently untestable by static analysis.

---

_Verified: 2026-02-19T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
