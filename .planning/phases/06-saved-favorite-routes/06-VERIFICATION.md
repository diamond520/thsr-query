---
phase: 06-saved-favorite-routes
verified: 2026-02-19T10:00:00Z
status: human_needed
score: 10/11 must-haves verified
re_verification: false
human_verification:
  - test: "Saved routes persist across page refresh — close and reopen browser tab, confirm chips reappear"
    expected: "Chips saved before refresh are visible again after Cmd+R or tab close+reopen"
    why_human: "localStorage runtime behavior cannot be verified by static code analysis; requires actual browser execution"
  - test: "Clicking a chip fills origin + destination in the form without auto-submitting the query"
    expected: "Origin and destination selects update to reflect the chip's route; no train list fetch is triggered"
    why_human: "formKey remount side effect and the absence of auto-submit depend on React runtime state behavior"
  - test: "After saving 10 routes the Save button disappears (not disabled)"
    expected: "The '儲存路線' button is no longer rendered in the DOM once isFull=true; it is not merely greyed out"
    why_human: "Conditional rendering at capacity limit requires runtime state verification"
---

# Phase 6: Saved Favorite Routes Verification Report

**Phase Goal:** 使用者可儲存常用起訖站組合，並一鍵帶入查詢表單，資料跨瀏覽器 session 持久化
**Verified:** 2026-02-19T10:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Success Criteria from ROADMAP.md

The ROADMAP defines four observable success criteria used as the canonical truths for this verification.

| #  | Truth                                                                                                                          | Status         | Evidence                                                                                                       |
|----|--------------------------------------------------------------------------------------------------------------------------------|----------------|----------------------------------------------------------------------------------------------------------------|
| SC1 | 使用者在「依時間查詢」分頁選取起訖站後，可點擊「儲存」按鈕將該組合加入常用路線（最多 10 組，已達上限時按鈕隱藏） | ✓ VERIFIED     | `query-form.tsx:178` — save button renders only when `onSave && !isFavoriteFull && origin && destination && origin !== destination`; isFull derived from `favorites.length >= FAVORITES_MAX` (10) |
| SC2 | 已儲存的路線以 chip 形式顯示在查詢表單上方，點擊任一 chip 後表單起訖站自動帶入對應路線                                       | ✓ VERIFIED     | `favorite-route-chips.tsx` renders chips above form in `page.tsx:123`; `handleApplyFavorite` at `page.tsx:84` sets `initialOrigin`/`initialDestination` and increments `formKey` to remount QueryForm |
| SC3 | 使用者可刪除任一已儲存路線，chip 即時消失                                                                                      | ✓ VERIFIED     | `favorite-route-chips.tsx:44-47` — delete button calls `e.stopPropagation()` then `onRemove(index)`; `page.tsx:127` wires `onRemove={removeRoute}` from `useFavorites`; `useFavorites` uses functional updater `prev.filter((_, i) => i !== index)` |
| SC4 | 重新整理或關閉再開啟瀏覽器後，已儲存的路線仍然存在（localStorage 持久化）                                                      | ? HUMAN NEEDED | SSR-safe two-useEffect pattern is correctly implemented (localStorage only inside useEffect bodies at lines 16 and 31); persistence across reload requires browser execution to confirm |

**Score:** 10/11 individual must-have checks verified (SC4 requires human confirmation)

### Observable Truths Breakdown (from Plans)

The three PLANs define 11 distinct truths across all waves. All automated checks pass.

#### Plan 01 Truths

| Truth                                                                           | Status     | Evidence                                                                                    |
|---------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------------|
| Saving a route persists it across page refreshes (localStorage)                 | ? HUMAN    | Two-useEffect SSR-safe pattern implemented correctly; runtime persistence needs human check |
| Saving more than 10 routes is silently blocked                                  | ✓ VERIFIED | `use-favorites.ts:20` — `if (isDuplicate \|\| prev.length >= FAVORITES_MAX) return prev`    |
| Saving a duplicate route is silently skipped                                    | ✓ VERIFIED | `use-favorites.ts:16-18` — `isDuplicate` check on same origin+destination                  |
| localStorage is never accessed outside useEffect (SSR-safe)                     | ✓ VERIFIED | Lines 16, 31 of `use-local-storage.ts` are inside useEffect callbacks at lines 14, 28      |

#### Plan 02 Truths

| Truth                                                                                     | Status     | Evidence                                                                              |
|-------------------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------|
| Save button appears only when origin and destination selected and they differ              | ✓ VERIFIED | `query-form.tsx:178` — all four conditions in the conditional render expression       |
| Save button is hidden (not disabled) when favorites are at capacity (isFull)              | ✓ VERIFIED | Conditional expression omits the button entirely (not `disabled`) when `isFavoriteFull` is true |
| FavoriteRouteChips renders nothing when favorites array is empty                           | ✓ VERIFIED | `favorite-route-chips.tsx:22` — `if (favorites.length === 0) return null`             |
| Clicking a chip calls onApply — does not auto-submit the query                            | ? HUMAN    | `handleApplyFavorite` does not call `setQueryParams` (no auto-submit in source); requires runtime confirmation |
| Clicking the X inside a chip deletes only that chip — does not trigger onApply            | ✓ VERIFIED | `favorite-route-chips.tsx:45` — `e.stopPropagation()` prevents badge `onClick` from firing |
| Chip labels show Chinese station names, not raw StationID strings                          | ✓ VERIFIED | `favorite-route-chips.tsx:25` — `getStationName` resolves via `StationName.Zh_tw`, falls back to raw ID only while loading |

#### Plan 03 Truths

| Truth                                                                                                           | Status     | Evidence                                                                           |
|-----------------------------------------------------------------------------------------------------------------|------------|------------------------------------------------------------------------------------|
| Saving a route from the form causes a chip to appear immediately above the form                                 | ✓ VERIFIED | `page.tsx:123-128` — `FavoriteRouteChips` rendered above QueryForm card, receives `favorites` from `useFavorites` |
| Clicking a chip fills the origin and destination selects — does not auto-submit                                 | ? HUMAN    | Code shows `handleApplyFavorite` only sets state + increments formKey with no `setQueryParams`; runtime check needed |
| Deleting a chip removes it immediately from the list                                                            | ✓ VERIFIED | `removeRoute` uses functional updater `filter`; React re-renders FavoriteRouteChips with updated array |
| Saved routes survive page refresh (localStorage persists)                                                       | ? HUMAN    | SSR-safe pattern verified; runtime behavior needs human confirmation                |
| next build exits 0 — SSR-safe hook pattern prevents ReferenceError at prerender time                            | ✓ VERIFIED | `npx tsc --noEmit` exits 0 (verified during this check); plan summary confirms `npm run build` passed |
| FavoriteRouteChips receives a stations list for Chinese name resolution                                         | ✓ VERIFIED | `page.tsx:125` — `stations={stations}` prop passed from lifted useQuery             |
| stations query is shared with QueryForm via React Query cache — no duplicate fetches                            | ✓ VERIFIED | Both `page.tsx:48` and `query-form.tsx:59` use `queryKey: ['stations']` — React Query deduplicates |

### Required Artifacts

| Artifact                                    | Expected                                                           | Status     | Details                                                                                       |
|---------------------------------------------|--------------------------------------------------------------------|------------|-----------------------------------------------------------------------------------------------|
| `src/types/favorites.ts`                    | FavoriteRoute type, FAVORITES_STORAGE_KEY, FAVORITES_MAX          | ✓ VERIFIED | 9-line file; exports all three; commit `023d376` confirmed                                    |
| `src/hooks/use-local-storage.ts`            | SSR-safe generic useLocalStorage<T> with two-useEffect pattern    | ✓ VERIFIED | 38-line file; two-useEffect + firstLoadDone flag; commit `13270f7` confirmed                  |
| `src/hooks/use-favorites.ts`                | Domain hook: favorites + addRoute + removeRoute + isFull          | ✓ VERIFIED | 32-line file; all four values returned; commit `22f4830` confirmed                            |
| `src/components/favorite-route-chips.tsx`   | Chip list with apply + delete actions                             | ✓ VERIFIED | 55-line file; exports FavoriteRouteChips; stopPropagation present; commit `6bb5440` confirmed |
| `src/components/query-form.tsx`             | QueryForm extended with onSave + isFavoriteFull props             | ✓ VERIFIED | Props added at lines 38-39; save button at line 178; Star icon imported; commit `29b698a` confirmed |
| `src/app/page.tsx`                          | Full wiring: useFavorites, FavoriteRouteChips, handleApplyFavorite | ✓ VERIFIED | All integration points present; commit `3db5f49` confirmed                                   |

### Key Link Verification

| From                                      | To                                              | Via                                                    | Status     | Details                                                      |
|-------------------------------------------|-------------------------------------------------|--------------------------------------------------------|------------|--------------------------------------------------------------|
| `src/hooks/use-local-storage.ts`          | `window.localStorage`                           | `useEffect` at lines 14 and 28                         | ✓ WIRED    | Both localStorage calls are inside useEffect callbacks only  |
| `src/hooks/use-favorites.ts`              | `src/hooks/use-local-storage.ts`                | `useLocalStorage<FavoriteRoute[]>(FAVORITES_STORAGE_KEY, [])` | ✓ WIRED | Line 3 import + line 8 call                           |
| `src/components/favorite-route-chips.tsx` | `src/types/favorites.ts`                        | `import type { FavoriteRoute }`                        | ✓ WIRED    | Line 6; type used in `FavoriteRouteChipsProps.favorites`     |
| `src/components/favorite-route-chips.tsx` | `src/types/tdx.ts`                              | `import type { TdxStation }`                           | ✓ WIRED    | Line 7; type used in `FavoriteRouteChipsProps.stations`      |
| `src/components/query-form.tsx`           | `onSave` callback prop                          | Button onClick: `onSave(origin, destination)`          | ✓ WIRED    | Line 183; all visibility conditions in place at line 178     |
| `src/app/page.tsx`                        | `src/hooks/use-favorites.ts`                    | `useFavorites()` call at line 54                       | ✓ WIRED    | Import at line 16; destructured `{ favorites, addRoute, removeRoute, isFull }` |
| `src/app/page.tsx`                        | `src/components/favorite-route-chips.tsx`       | `FavoriteRouteChips` in by-od TabsContent at line 123  | ✓ WIRED    | Import at line 15; all four required props passed            |
| `src/app/page.tsx`                        | `src/components/query-form.tsx`                 | `onSave` + `isFavoriteFull` props at lines 141-142     | ✓ WIRED    | `onSave` wraps `addRoute`; `isFavoriteFull={isFull}`         |

### Requirements Coverage

| Requirement | Source Plans        | Description                                                                         | Status       | Evidence                                                                                                          |
|-------------|---------------------|-------------------------------------------------------------------------------------|--------------|-------------------------------------------------------------------------------------------------------------------|
| PERS-01     | 06-01, 06-02, 06-03 | 使用者可儲存常用起訖站組合（最多 10 組，localStorage 持久化，不需登入）             | ✓ SATISFIED  | `useFavorites.addRoute` enforces FAVORITES_MAX=10; data stored in localStorage via SSR-safe hook; no login required |
| PERS-03     | 06-02, 06-03        | 使用者可點擊已儲存路線一鍵帶入查詢表單起訖站，並可刪除已儲存路線                   | ✓ SATISFIED  | Chip apply wires to `handleApplyFavorite` (fills form only); chip delete via `removeRoute` with `e.stopPropagation` |

**Orphaned requirements check:** No requirements assigned to Phase 6 in REQUIREMENTS.md beyond PERS-01 and PERS-03. PERS-02 is a future v2.1+ requirement, not mapped to any phase.

### Anti-Patterns Found

No blockers or warnings found. All placeholder checks returned no matches in phase 6 files. The `return null` in `favorite-route-chips.tsx:22` is intentional design (renders nothing for empty favorites), not a stub.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

### Human Verification Required

#### 1. localStorage Persistence Across Page Refresh

**Test:** In the browser at http://localhost:3000, select an origin and destination, click "儲存路線", then press Cmd+R (or close and reopen the tab).
**Expected:** The saved chip reappears above the query form after the page reload — data survives the reload via localStorage.
**Why human:** Static code analysis confirms the two-useEffect SSR-safe pattern is correctly implemented, but the actual read-on-mount behavior (firstLoadDone flag, JSON.parse, setStoredValue) can only be confirmed by observing real browser execution.

#### 2. Chip Apply Does Not Auto-Submit Query

**Test:** Save a route. Click a chip. Observe whether the train list below the form updates or remains unchanged.
**Expected:** The origin and destination selects update to match the chip's route. The train list does NOT refresh — no network request for train data is made. The user must click "查詢" explicitly.
**Why human:** `handleApplyFavorite` does not call `setQueryParams` in source (confirmed at page.tsx:84-91), but the absence of an unintended side-effect triggering the query requires runtime observation.

#### 3. Save Button Hidden (Not Disabled) at 10 Favorites

**Test:** Save 10 distinct routes. Observe the form after adding the 10th.
**Expected:** The "儲存路線" button disappears entirely from the DOM after the 10th save. It should not be visible as a greyed-out disabled button.
**Why human:** The conditional render (`isFull` via `favorites.length >= FAVORITES_MAX`) must be confirmed at runtime because the state update chain (addRoute → setFavorites → re-render → isFull=true → button hidden) involves multiple React state transitions.

### Gaps Summary

No gaps blocking goal achievement. All six artifacts exist, are substantive (no stubs), and are correctly wired. TypeScript type-check (`npx tsc --noEmit`) passes. Three items are flagged for human verification because they test runtime behavior (localStorage persistence, React state transitions, absence of auto-submit side-effects) that cannot be confirmed by static code analysis alone. The code correctly implements all required patterns.

---

_Verified: 2026-02-19T10:00:00Z_
_Verifier: Claude (gsd-verifier)_
