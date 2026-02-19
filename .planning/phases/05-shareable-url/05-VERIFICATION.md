---
phase: 05-shareable-url
verified: 2026-02-19T09:00:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
human_verification:
  - test: "Submit a query and verify URL updates in address bar"
    expected: "After clicking the submit button, browser address bar changes to ?from=<StationID>&to=<StationID>&date=<YYYY-MM-DD> without a full page reload"
    why_human: "Cannot verify browser address bar behavior programmatically; requires live browser interaction"
  - test: "Open a pre-filled URL and verify form auto-populates and query executes"
    expected: "Navigate to http://localhost:3000/?from=1&to=12&date=2026-02-20 — form shows 南港 as origin, 左營 as destination, 2026-02-20 as date, and query results appear automatically without pressing the submit button"
    why_human: "SearchParamsInit + handleParamInit + formKey remount sequence requires a real browser to exercise useEffect on mount"
  - test: "Click the share button and verify clipboard copy or native share sheet"
    expected: "Share button appears after first query submission. On desktop: clicking it copies the URL to clipboard and button briefly shows a checkmark icon. On mobile: native share sheet may open instead."
    why_human: "Web Share API and Clipboard API behavior require live browser interaction; navigator.share and navigator.clipboard are not testable programmatically"
  - test: "Verify next build completes without errors"
    expected: "Running npm run build from project root exits with code 0 and no useSearchParams Suspense boundary errors"
    why_human: "Build step was confirmed in SUMMARY but should be re-verified if any files changed after the documented build run"
---

# Phase 5: Shareable URL Verification Report

**Phase Goal:** 使用者提交查詢後，URL 自動更新含起訖站與日期；他人開啟該連結，頁面自動帶入條件並執行查詢
**Verified:** 2026-02-19T09:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

All automated checks pass. Goal-critical wiring is present and substantive. Four items require live browser testing to confirm end-to-end behaviour.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | SearchParamsInit component exists as a 'use client' effect-only component that renders null and calls useSearchParams() inside useEffect | VERIFIED | `src/components/search-params-init.tsx` line 24: `return null`; line 14: `useEffect(() => {`; line 5: `useSearchParams` import |
| 2 | QueryForm accepts optional initialOrigin, initialDestination, initialDate props and uses them as useState initializers | VERIFIED | `src/components/query-form.tsx` lines 35-37: three optional props in interface; lines 47-53: all three useState calls consume props with `??` and ternary fallbacks |
| 3 | Submitting the by-OD query form updates the browser URL to ?from=&to=&date= without a page reload | VERIFIED (wiring only) | `src/app/page.tsx` line 58: `router.replace(\`\${pathname}?\${urlParams.toString()}\`, { scroll: false })` called from `handleQuerySubmit`; requires human to confirm browser behaviour |
| 4 | Opening a URL with valid ?from, ?to, ?date params pre-fills the query form and immediately executes the query | VERIFIED (wiring only) | `src/app/page.tsx` lines 36-45: `handleParamInit` sets `initialOrigin/Destination/Date` state, increments `formKey`, and calls `setQueryParams` when all three params present; requires human to confirm |
| 5 | A share button appears after a query is submitted and allows copying or sharing the current URL | VERIFIED (wiring only) | `src/components/share-button.tsx` lines 13-17: renders null when `params` is null; lines 19-45: `handleShare` implements Web Share API + clipboard fallback; `src/app/page.tsx` lines 105-109: `{queryParams && <ShareButton params={queryParams} />}` |
| 6 | next build completes without errors (Suspense boundary correctly wraps SearchParamsInit) | VERIFIED (code-level) | `src/app/page.tsx` lines 69-71: `<Suspense fallback={null}><SearchParamsInit onInit={handleParamInit} /></Suspense>` — SUMMARY reports build passed; recommend re-run to confirm |

**Score:** 6/6 truths verified at code level (4 require human confirmation for runtime behaviour)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `src/components/search-params-init.tsx` | Effect-only 'use client' component; exports SearchParamsInit; reads ?from, ?to, ?date on mount; fires onInit if any param present | VERIFIED | File exists, 26 lines, substantive implementation; `if (from \|\| to \|\| date)` guard present; `return null`; empty dep array `[]` |
| `src/components/query-form.tsx` | QueryForm with optional initialOrigin?, initialDestination?, initialDate? props consumed by useState initializers | VERIFIED | Lines 35-38: three optional props in `QueryFormProps`; lines 47-53: all three `useState` calls use `??` and ternary fallbacks; backward-compatible |
| `src/components/share-button.tsx` | Share/copy button using Web Share API with clipboard fallback; renders null when params is null | VERIFIED | File exists, 57 lines, full implementation; `navigator.canShare` guard present; `setCopied` feedback; `return null` when `!params` |
| `src/app/page.tsx` | Full wiring: Suspense+SearchParamsInit, router.replace on submit, formKey remount pattern, ShareButton render | VERIFIED | 133 lines; imports all four new dependencies; all wiring patterns present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/components/search-params-init.tsx` | `onInit` callback | `useEffect` on mount with empty dep array | WIRED | Line 14: `useEffect(() => {`; line 22: `}, [])` — fires once on mount; calls `onInit(from, to, date)` at line 20 |
| `src/components/query-form.tsx` | useState initializers | `initialOrigin ?? ''`, ternary for initialDate | WIRED | Line 47: `useState<string>(initialOrigin ?? '')`; line 48: `useState<string>(initialDestination ?? '')`; lines 51-53: `initialDate ? new Date(initialDate + 'T00:00:00') : getTaiwanToday()` |
| `src/app/page.tsx` | `src/components/search-params-init.tsx` | Suspense wrapping SearchParamsInit | WIRED | Lines 69-71: `<Suspense fallback={null}><SearchParamsInit onInit={handleParamInit} /></Suspense>` |
| `src/app/page.tsx` | `router.replace` | `handleQuerySubmit` calls router.replace after setting queryParams | WIRED | Line 58: `router.replace(\`\${pathname}?\${urlParams.toString()}\`, { scroll: false })` inside `handleQuerySubmit` |
| `src/app/page.tsx` | `src/components/query-form.tsx` | `key={formKey}` prop forces remount | WIRED | Line 97 (JSX): `key={formKey}` on `<QueryForm>`; lines 98-100: `initialOrigin`, `initialDestination`, `initialDate` props passed |
| `src/components/share-button.tsx` | `navigator.share` / `navigator.clipboard` | `handleShare` onClick | WIRED | Lines 26, 30: `navigator.share`; line 40: `navigator.clipboard.writeText`; `navigator.canShare` guard at line 27 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| SHAR-01 | 05-01-PLAN.md, 05-02-PLAN.md | 使用者可複製含起訖站與日期的查詢連結；他人開啟連結後頁面自動帶入條件並執行查詢 | SATISFIED | All four success criteria have code-level implementation: (1) `router.replace` on submit, (2) `SearchParamsInit` + `handleParamInit` auto-execute, (3) `ShareButton` with Web Share API + clipboard, (4) `<Suspense>` boundary for next build |

No orphaned requirements found. REQUIREMENTS.md traceability table maps only SHAR-01 to Phase 5, and both plans claim SHAR-01. Coverage is 1/1.

### Anti-Patterns Found

No anti-patterns detected.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/share-button.tsx` | 17 | `return null` | INFO | Expected design — component intentionally renders nothing when `params` is null; not a stub |
| `src/components/search-params-init.tsx` | 24 | `return null` | INFO | Expected design — effect-only component intentionally renders nothing; not a stub |

TypeScript: `npx tsc --noEmit` exits with zero errors. No stub implementations, no TODO/FIXME comments, no placeholder returns in any modified file.

### Human Verification Required

#### 1. URL Updates on Form Submit

**Test:** Start `npm run dev`. Navigate to `http://localhost:3000`. Select any origin station, destination station, and date in the "時間查詢" tab. Click the "查詢" button.
**Expected:** Browser address bar updates immediately to `?from=<StationID>&to=<StationID>&date=<YYYY-MM-DD>` without a page reload (no full white flash, no scroll jump to top).
**Why human:** `router.replace` call is present in code but browser address bar behavior and absence of page reload cannot be verified programmatically.

#### 2. Pre-filled URL Auto-Executes Query

**Test:** Navigate directly to `http://localhost:3000/?from=1&to=12&date=2026-02-20`.
**Expected:** The "時間查詢" tab form pre-fills with 南港 as origin and 左營 as destination, date shows 2026-02-20, and the train list appears automatically without pressing "查詢".
**Why human:** `useEffect` mount behavior + `formKey` remount + `setQueryParams` auto-execute sequence requires a live browser; the `if (from || to || date)` guard, `setFormKey`, and the subsequent React render cycle cannot be exercised via static analysis.

#### 3. Share Button Clipboard and Web Share Behavior

**Test:** Submit any query to make the "分享" button appear. On desktop: click "分享" and check clipboard contents (paste into a text field). On iOS/Android with a supporting browser: click "分享" and observe whether the native share sheet opens.
**Expected:** Desktop — button briefly shows a checkmark and the current URL is in clipboard. Mobile with Web Share API support — native share sheet opens with the URL.
**Why human:** `navigator.share`, `navigator.canShare`, and `navigator.clipboard.writeText` are browser APIs that cannot be tested without a real browser environment.

#### 4. Production Build Passes

**Test:** Run `npm run build` from the project root (`/Users/diamond.hung/ailabs/code/thsr-query`).
**Expected:** Build exits with code 0. No errors mentioning `useSearchParams`, missing Suspense boundary, or prerendering failures.
**Why human:** Build was confirmed in SUMMARY.md (commit `fec1607`) but should be re-confirmed, especially since the ROADMAP.md still marks Phase 5 plans as `[ ]` (not checked off), which may indicate the ROADMAP was not fully updated after execution.

### Gaps Summary

No blocking gaps. All artifacts exist, are substantive (not stubs), and are correctly wired. The four human verification items are required to confirm runtime behaviour that static analysis cannot exercise. The code is structured correctly to support the goal.

One minor inconsistency noted for documentation purposes only: ROADMAP.md Phase 5 plan list shows both `05-01-PLAN.md` and `05-02-PLAN.md` as `[ ]` (unchecked) despite the progress table showing Phase 5 as Complete. This does not affect code correctness but may cause confusion.

---

_Verified: 2026-02-19T09:00:00Z_
_Verifier: Claude (gsd-verifier)_
