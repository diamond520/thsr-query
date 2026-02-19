---
phase: 07-round-trip-query
verified: 2026-02-19T11:00:00Z
status: human_needed
score: 8/8 must-haves verified
re_verification: false
human_verification:
  - test: "Date constraint — return picker rejects dates before outbound"
    expected: "Calendar days before the outbound date are greyed out and not selectable"
    why_human: "disabled={{ before: outboundDate }} is present in source (line 198) but whether the react-day-picker v9 matcher actually prevents click selection requires browser verification"
  - test: "Outbound date clamping — return auto-advances when outbound advances past it"
    expected: "When user picks an outbound date later than the current return date, the return date field silently advances to match"
    why_human: "Logic is correct in source (lines 62-64 of round-trip-form.tsx) but the UX effect (no error flash, silent update) requires browser observation"
  - test: "Side-by-side layout on desktop vs. stacked on mobile"
    expected: "On viewport >= 768px both legs appear in two columns; on < 768px outbound is above return"
    why_human: "grid-cols-1 md:grid-cols-2 is present in source but actual layout depends on runtime CSS"
  - test: "Each leg shows complete train data — times, duration, seat badges, booking link"
    expected: "Each train row shows departure time, arrival time, duration, 標準席 badge, 商務席 badge, and 去訂票 link — matching single-query quality"
    why_human: "TrainCard and TrainTable are reused from the existing single-query path; correctness of seat badge rendering and booking link generation is inherited but must be confirmed visually in the round-trip context"
---

# Phase 7: Round-Trip Query Verification Report

**Phase Goal:** 使用者可在「來回查詢」分頁選擇起訖站、去程日期與回程日期，同時看到兩段班次並排結果
**Verified:** 2026-02-19T11:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 「來回查詢」is an independent fourth tab with shared station selector and two independent date pickers | VERIFIED | `page.tsx` line 120 `grid-cols-4`; `TabsTrigger value="round-trip"` at line 124; `RoundTripForm` has mobile `StationLinePicker` + desktop `Select` for stations and two Popover/Calendar pickers (lines 88-202 of `round-trip-form.tsx`) |
| 2 | Return date picker auto-disables dates before the outbound date | VERIFIED (code) / HUMAN for UX | `disabled={{ before: outboundDate }}` present at `round-trip-form.tsx:198` using react-day-picker v9 DateBefore matcher syntax |
| 3 | After submit, outbound and return results appear simultaneously; stacked mobile, side-by-side desktop | VERIFIED (code) / HUMAN for layout | Two parallel `useQuery` calls with `enabled: !!params` at `round-trip-result.tsx:116-136`; `grid-cols-1 md:grid-cols-2` at line 148; `RoundTripForm onSubmit={setRoundTripParams}` and `RoundTripResult params={roundTripParams}` wired in `page.tsx` lines 180-182 |
| 4 | Each leg shows complete schedule with seat status and booking links matching single-query quality | VERIFIED (code) / HUMAN for correctness | `LegDisplay` renders `TrainCard` (mobile) and `TrainTable` (desktop) — same components used by the single-query `TrainList` path (`round-trip-result.tsx:7-8, 80, 92`) |

**Score (automated):** 8/8 artifacts and wiring verified
**Truths requiring human confirmation:** 4 behavioral/visual items

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types/round-trip.ts` | RoundTripParams interface | VERIFIED | 7 lines; exports `interface RoundTripParams` with `origin`, `destination`, `outboundDate`, `returnDate` all typed as `string` |
| `src/components/round-trip-form.tsx` | RoundTripForm component | VERIFIED | 212 lines; exports `RoundTripForm`; full implementation with station picker (mobile + desktop), two date pickers, clamping handler, submit guard |
| `src/components/round-trip-result.tsx` | RoundTripResult with dual parallel queries | VERIFIED | 174 lines; exports `RoundTripResult`; two discriminated `useQuery` calls; internal `LegDisplay`; responsive grid |
| `src/app/page.tsx` | Four-tab page with round-trip wired | VERIFIED | 188 lines; `grid-cols-4`; four tabs (時間/車次/車站/來回); `roundTripParams` state; `RoundTripForm` and `RoundTripResult` wired end-to-end |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `round-trip-form.tsx` | `src/types/round-trip.ts` | `import type RoundTripParams` | WIRED | Line 26: `import type { RoundTripParams } from '@/types/round-trip'` |
| `round-trip-form.tsx` | `src/components/station-line-picker.tsx` | `StationLinePicker` reuse | WIRED | Line 25: import; line 91: rendered inside `md:hidden` div |
| `round-trip-result.tsx` | `/api/tdx/trains` | Two parallel `useQuery` with discriminated keys | WIRED | `queryKey: ['trains', 'outbound', params]` at line 117; `queryKey: ['trains', 'return', params]` at line 131; return leg uses `params!.destination, params!.origin` (swapped) and `params!.returnDate` at line 132 |
| `round-trip-result.tsx` | `src/types/round-trip.ts` | `import type RoundTripParams` | WIRED | Line 9: `import type { RoundTripParams } from '@/types/round-trip'` |
| `round-trip-result.tsx` | `src/components/train-card.tsx` | Mobile card rendering | WIRED | Line 7: import; line 80: rendered in `md:hidden` list |
| `round-trip-result.tsx` | `src/components/train-table.tsx` | Desktop table rendering | WIRED | Line 8: import; line 92: rendered in `hidden md:block` div |
| `page.tsx` | `src/components/round-trip-form.tsx` | `import RoundTripForm` | WIRED | Line 16: import; line 180: `<RoundTripForm onSubmit={setRoundTripParams} />` |
| `page.tsx` | `src/components/round-trip-result.tsx` | `import RoundTripResult` | WIRED | Line 17: import; line 182: `<RoundTripResult params={roundTripParams} />` |
| `page.tsx` | `roundTripParams` state | `onSubmit={setRoundTripParams}` | WIRED | Line 50: `useState<RoundTripParams | null>(null)`; line 180: `onSubmit={setRoundTripParams}`; line 182: `params={roundTripParams}` |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| QURY-05 | 07-01, 07-02, 07-03 | 使用者可選擇起訖站、去程日期與回程日期，一次查詢兩段班次（去程與回程各自顯示完整時刻與座位狀態） | SATISFIED | `RoundTripForm` + `RoundTripResult` + four-tab `page.tsx` collectively implement all stated behaviors; TypeScript compiles cleanly; commits 027c3ef, 3b76fac, a9bd28d, dc7bef4 confirmed in git log |

No orphaned requirements: REQUIREMENTS.md maps only QURY-05 to Phase 7 (SHAR-02 is noted as a future requirement explicitly deferred beyond Phase 7).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `round-trip-form.tsx` | 106, 133 | `placeholder="起站"` / `placeholder="訖站"` | Info | Legitimate UI placeholder text in Select components — not a stub; expected UX copy |

No blocker or warning anti-patterns found. No TODO/FIXME comments. No empty implementations. No stub returns. No console.log-only handlers.

### Critical Correctness Checks (Manual)

The following correctness invariants were verified by direct code inspection:

1. **Return leg swaps origin/destination:** `fetchTrains(params!.destination, params!.origin, params!.returnDate)` — confirmed at line 132. This is the critical correctness requirement; the return trip routes destination→origin.

2. **Cache deduplication prevention:** queryKey includes `'outbound'` vs `'return'` literal — confirmed at lines 117 and 131. Without this, React Query would deduplicate two structurally identical params objects and both legs would return outbound data.

3. **Return date uses `returnDate` not `outboundDate`:** confirmed at line 132 — `params!.returnDate` used for the return leg fetch.

4. **Date clamping on outbound advance:** `if (returnDate < d) { setReturnDate(d) }` — confirmed at lines 62-64 of `round-trip-form.tsx`.

5. **Submit guard:** `isValid = !!origin && !!destination && origin !== destination && !!outboundDate && !!returnDate` at line 83; submit button `disabled={!isValid}` at line 205.

6. **TypeScript:** `npx tsc --noEmit` exits cleanly with zero errors across all phase 7 files.

7. **Commits verified:** All four commits documented in SUMMARY.md exist in git history: 027c3ef, 3b76fac, a9bd28d, dc7bef4.

### Human Verification Required

#### 1. Return Date Picker Disables Past Dates

**Test:** Open the 來回 tab. Select an outbound date of, e.g., 2026-03-10. Open the return date calendar.
**Expected:** All calendar days before 2026-03-10 are visually greyed out and clicking them has no effect.
**Why human:** `disabled={{ before: outboundDate }}` is in source but the actual interactive behavior of react-day-picker v9's DateBefore matcher must be confirmed in a real browser.

#### 2. Outbound Date Clamping

**Test:** Set outbound to 2026-03-05 and return to 2026-03-05. Then advance outbound to 2026-03-10.
**Expected:** The return date field silently updates to 2026-03-10 without any error message or user prompt.
**Why human:** The clamping logic exists in source but the UX (silent auto-advance vs. flash/error) requires browser observation.

#### 3. Responsive Side-by-Side Layout

**Test:** Submit a round-trip query. Resize the browser between 375px (mobile) and 1024px (desktop).
**Expected:** Below 768px, outbound results stack above return results. At 768px and above, outbound and return appear in two equal-width columns.
**Why human:** `grid-cols-1 md:grid-cols-2` is present in source but actual layout behavior and visual quality depend on runtime CSS.

#### 4. Complete Train Data in Each Leg

**Test:** Submit a query for a route with known trains (e.g. 南港→台北, today's date for outbound, tomorrow for return). Inspect both columns.
**Expected:** Each train row shows departure time, arrival time, travel duration, 標準席 seat badge, 商務席 seat badge, and a functional 去訂票 link opening the THSR booking page.
**Why human:** TrainCard and TrainTable are shared with the single-query path and their own correctness is established by prior phases, but confirming they render correctly inside the round-trip LegDisplay with the swapped params (especially the return leg's swapped origin/destination affecting booking URL construction) requires browser verification.

### Gaps Summary

No gaps in automated verification. All artifacts exist, are substantive (no stubs or placeholder returns), and are fully wired. QURY-05 is fully covered.

Four items are deferred to human verification because they involve visual rendering, interactive UX behavior, and runtime CSS layout — none of which can be confirmed by static code inspection alone.

---

_Verified: 2026-02-19T11:00:00Z_
_Verifier: Claude (gsd-verifier)_
