# Feature Research

**Domain:** Transit Query App UX — Taiwan High Speed Rail (THSR) v2.0 UX Enhancement
**Researched:** 2026-02-19
**Confidence:** MEDIUM-HIGH

---

## Scope

This file covers the **three new v2.0 features only**. v1 table-stakes features (station picker, timetable results, seat status, etc.) are complete and not re-analysed here.

---

## Summary

v2.0 adds three features that transit apps commonly bolt on after core query works: round-trip planning, quick-repeat via saved routes, and shareability. All three are independently deliverable — no hard ordering dependency between them. The largest complexity delta is **round-trip query** (layout change, two API calls, date coordination). Saved routes and share link are both low-complexity enhancements.

THSR-specific context that simplifies all three:

- Only 12 stations, one linear line — no complex routing
- No auth, no backend — all state is ephemeral or localStorage
- Existing `QueryForm` + `TrainList` components are the exact building blocks needed for round-trip
- Current page state is `useState`-only; URL params do not yet exist (clean slate for share link)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that make each v2 feature feel complete. Missing these = feature feels half-done.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Round-trip: two separate date pickers | Users think of outbound and return as two independent dates, not a range. THSR trips can be days/weeks apart. | LOW | Two `<Calendar>` popovers (same component, different state). NOT a date range picker — range pickers are for stay durations, not separate train journeys. |
| Round-trip: shared origin/destination | Outbound and return are on the same route. Asking user to re-enter stations for the return leg is a friction trap. | LOW | One station pair, two date fields. Return direction auto-reverses (return origin = outbound destination). |
| Round-trip: two result panels | User needs to see both legs simultaneously to coordinate times and evaluate seat availability for the full trip. | MEDIUM | Two `<TrainList>` instances. Each queries its own direction and date independently. |
| Round-trip: independent leg querying | Outbound query should not block on return, and vice versa. One can succeed while the other loads. | MEDIUM | Two separate React Query instances with independent `enabled` flags and `queryKey` arrays. |
| Saved routes: quick-load fills form | User taps a saved route → form fields pre-fill with that origin/destination. No extra steps. | LOW | Tap a saved route chip → `setOrigin` + `setDestination`. Same handlers already exist in `QueryForm`. |
| Saved routes: persist across sessions | The entire point is to survive page refresh. Must survive tab close. | LOW | `localStorage` only. No server-side persistence needed. Serialize as `JSON.stringify([{from, to, label}])`. |
| Saved routes: save current query | User has just found their route, taps "儲存". One action to add it. | LOW | Button visible after stations are selected (not after query runs). Saves `{from: stationId, to: stationId}`. Display label = station name pair from existing station list. |
| Share link: URL encodes query state | URL must be shareable — copy-paste or native share to another person who sees the same results. | LOW | `?from=1&to=12&date=2026-03-01` in the query string. StationIDs are stable THSR identifiers ("1"–"12"). |
| Share link: auto-runs query on open | Recipient opens URL and sees results immediately, not just a pre-filled form they must submit. | MEDIUM | `useSearchParams` on page load → if all three params present and valid → `setQueryParams` immediately. |
| Share link: copy-to-clipboard button | User must be able to copy the URL without hunting in the browser address bar — especially on mobile Safari where the address bar is hidden. | LOW | Single `<Button>` in the results area. Clipboard API: `navigator.clipboard.writeText(window.location.href)`. Shows "已複製" feedback for 2s then reverts. |

### Differentiators (Competitive Advantage)

Features that make the v2 experience noticeably better than the baseline.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Round-trip: auto-reverse return stations | Return leg automatically sets origin/destination as the reverse of outbound — zero re-entry. | LOW | When return panel renders, `returnOrigin = outboundDestination`, `returnDestination = outboundOrigin`. Derived state, not stored separately. |
| Round-trip: mobile stacked layout with sticky leg headers | On mobile, two full result lists need clear visual separation so user doesn't confuse outbound and return trains. Sticky "去程" / "回程" headers prevent confusion when scrolling. | LOW | Two cards: `去程（南港→左營）2026-03-01` and `回程（左營→南港）2026-03-07`. Each header sticks at top of its panel while scrolling. |
| Round-trip: desktop side-by-side layout | On desktop, seeing both legs simultaneously is much faster for trip coordination. | MEDIUM | CSS grid `grid-cols-2` at `md:` breakpoint. Each column: form header + `<TrainList>`. Stacks to single column on mobile. |
| Saved routes: route label shows station names not IDs | "南港 → 左營" is human-readable. Storing and displaying raw IDs ("1 → 12") is a developer anti-pattern visible to users. | LOW | Resolve labels at save time from the existing station list (already loaded in memory). Store `{from, to, fromName, toName}`. |
| Saved routes: one-tap swap saved route | User saved "南港→左營" but needs "左營→南港" now. A swap icon on a saved route chip avoids needing a separate saved entry for each direction. | LOW | Swap icon on the saved route chip calls `setOrigin(to)` + `setDestination(from)` directly. |
| Share link: works for round-trip too | Round-trip view should also be shareable: `?from=1&to=12&outDate=2026-03-01&returnDate=2026-03-07&mode=roundtrip`. | MEDIUM | Extend URL schema when round-trip is built. `mode` param switches UI to round-trip tab on load. |
| Share link: native share sheet on mobile | On iOS/Android, the Web Share API (`navigator.share()`) invokes the OS share sheet — more natural than clipboard on mobile. Falls back to clipboard on desktop. | LOW | `if (navigator.share) { navigator.share({ url }) } else { clipboard fallback }`. Standard progressive enhancement. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Date range picker for round-trip | "Google Flights uses one picker" | Date range pickers are for continuous stays (hotel check-in/out). THSR round trips are often days/weeks apart with no implied continuity. Range UX forces users to think in terms of a range when they have two independent dates in mind. | Two separate date popover buttons. More taps, zero cognitive friction. |
| Unlimited saved routes | "I travel many routes" | localStorage is not memory-managed. Unbounded lists degrade the UI — the quick-access pattern breaks when there are 20 items. | Cap at 5 items. When limit reached, either reject new saves with "已達上限（5筆），請先刪除一筆" or silently drop the oldest. |
| Saved route sync across devices | "I want my routes on my phone too" | Requires user accounts, a backend, auth — scope explosion. No login system exists or is planned. | Explicitly out of scope. localStorage-only is the right boundary. |
| Saved routes in a separate settings page | "Manage your saved routes" | A separate page adds navigation complexity and makes saved routes feel like a background admin task. Users want quick access, not route management. | Show saved routes as chips directly above or near the query form, visible at a glance. |
| Share link that encodes selected train | "Share a specific train (e.g., train 682)" | A selected-train share link requires deep-linking into a specific train card's state. Complex state to serialize, and the recipient's interest is usually the route + date, not one specific train. | Share the query (route + date). The recipient can find their preferred train from the results. |
| URL hash (`#from=1&to=12`) for share state | "Hashes don't reload the page" | Hash params are not sent to the server — fine for client-side apps, but they make Next.js `useSearchParams` and server-side pre-rendering harder. More importantly, hash-based URLs look fragile to non-technical users. | Use query strings (`?from=1&to=12&date=2026-03-01`). Next.js `useSearchParams` reads them natively. |
| Auto-save last query to localStorage | "Pre-fill the form with my last query" | Combined with URL-based share links, auto-save creates ambiguity: does the form show the URL params or my last query? Two sources of truth creates bugs. | Share link handles the "pre-fill from URL" case. Saved routes handles the "my common routes" case. No need for a third auto-save mechanism. |

---

## Feature Dependencies

```
[Round-Trip Query]
    └──requires──> [QueryForm] (already built — reuse with date-only prop)
    └──requires──> [TrainList] (already built — instantiate twice)
    └──requires──> [Station list loaded] (already available)
    └──introduces──> [ReturnQueryParams] (new type: reverse of outbound origin/dest)

[Saved Routes]
    └──requires──> [Station list] (to resolve IDs → names for display labels)
    └──enhances──> [QueryForm] (adds quick-load interaction)
    └──independent of──> [Round-Trip Query]
    └──independent of──> [Share Link]

[Share Link]
    └──requires──> [QueryForm has URL-sync] (new: write params to URL on submit)
    └──requires──> [Page reads useSearchParams on load] (new: auto-trigger query)
    └──enhances──> [Round-Trip Query] (extend URL schema for returnDate + mode)
    └──independent of──> [Saved Routes]

[Round-Trip Share Link]
    └──requires──> [Round-Trip Query] (must exist first)
    └──requires──> [Share Link] (URL schema extension)
```

### Dependency Notes

- **Round-trip does not depend on share link or saved routes.** All three can be built independently and in any order.
- **Share link for round-trip is an enhancement, not a blocker.** Build single-leg share link first; extend the URL schema for round-trip later.
- **Saved routes depend on station list being available** when constructing display labels. The station list is already loaded by `QueryForm` via React Query — pass it as a prop or use the same React Query hook in the saved routes component.
- **URL sync (for share link) and saved routes are both form-layer concerns** but they do not conflict. URL params are read on initial load and then cleared from concern. Saved routes operate on user click. No state collision.

---

## MVP Definition

### v2.0 Launch With

Minimum set for the milestone to deliver its stated goal.

- [ ] **Round-trip query** — Outbound + return date pickers, shared station pair, two `<TrainList>` panels (stacked on mobile, side-by-side on desktop). Auto-reverse return direction. — Core v2 value: coordinate full trip in one view.
- [ ] **Saved routes** — Up to 5 saved `{from, to}` pairs in localStorage. Display as route chips above query form. One-tap load fills form. "儲存" button when stations are selected. — Reduces friction for repeat users.
- [ ] **Share link (single-leg)** — `?from=1&to=12&date=2026-03-01` in URL. Auto-runs query on page load when all three params present. Copy-to-clipboard button in results header. — Enables trip coordination with travel companions.

### Defer to v2.1 or Later

- [ ] **Share link for round-trip** — Extend URL schema (`?outDate=...&returnDate=...&mode=roundtrip`). Defer until both round-trip and single-leg share link are stable. Complexity is additive, not blocking.
- [ ] **Saved route swap button** — Nice-to-have. Add if UX testing shows users want to reverse a saved route.
- [ ] **Native Web Share API** — Mobile enhancement. Add after clipboard version works. Low effort but separable.
- [ ] **"已達上限" toast notification for saved routes** — UX polish. V2 launch can silently replace oldest if at capacity.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Round-trip: shared station + two date pickers | HIGH | LOW | P1 |
| Round-trip: two `<TrainList>` panels (stacked mobile) | HIGH | MEDIUM | P1 |
| Round-trip: desktop side-by-side layout | MEDIUM | LOW | P1 |
| Round-trip: auto-reverse return direction | HIGH | LOW | P1 |
| Saved routes: localStorage persistence | HIGH | LOW | P1 |
| Saved routes: chips above form, one-tap load | HIGH | LOW | P1 |
| Saved routes: "儲存" button when stations set | MEDIUM | LOW | P1 |
| Share link: URL query params on submit | HIGH | LOW | P1 |
| Share link: auto-run query on load | HIGH | MEDIUM | P1 |
| Share link: copy-to-clipboard button | HIGH | LOW | P1 |
| Share link: round-trip URL schema extension | MEDIUM | MEDIUM | P2 |
| Saved routes: swap button on chip | MEDIUM | LOW | P2 |
| Share link: native Web Share API | LOW | LOW | P2 |
| Saved routes: edit/reorder management UI | LOW | HIGH | P3 |

---

## UX Patterns Per Feature

### Feature 1: Round-Trip Query (來回票查詢)

**Pattern: One station pair, two date fields, two result panels**

```
┌─────────────────────────────────────────┐
│  起站：南港     訖站：左營    [⇄]         │
│  去程日期：2026-03-01  [📅]              │
│  回程日期：2026-03-07  [📅]              │
│              [查詢]                      │
└─────────────────────────────────────────┘

Mobile (stacked):
┌─────────────────────────────────────────┐
│  去程  南港 → 左營  2026-03-01          │  ← sticky header
│  [TrainList for outbound]               │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  回程  左營 → 南港  2026-03-07          │  ← sticky header
│  [TrainList for return]                 │
└─────────────────────────────────────────┘

Desktop (side-by-side):
┌────────────────────┬────────────────────┐
│  去程              │  回程              │
│  南港→左營         │  左營→南港         │
│  2026-03-01        │  2026-03-07        │
│  [TrainList]       │  [TrainList]       │
└────────────────────┴────────────────────┘
```

**Key decisions:**
- Station picker: **shared** between both legs. Swapping outbound stations auto-swaps both legs.
- Date pickers: **two separate** calendar popovers (not a range picker). Same `<Calendar>` component, two instances.
- Return direction: automatically reversed. `returnParams = { origin: outboundDestination, destination: outboundOrigin, date: returnDate }`. User never enters return stations manually.
- Validation: return date can be same day or later than outbound. No cross-date constraint enforced (user may be doing same-day return).
- Mobile: panels stack vertically. Each panel has a sticky colored header ("去程" / "回程") so user doesn't lose context while scrolling deep into a result list.
- Query trigger: **single "查詢" button** submits both legs simultaneously. Both `<TrainList>` components get their params and fire independently.

**Existing component reuse:**
- `<QueryForm>` → extract `<StationPairSelector>` sub-component (or lift stations state up)
- `<TrainList>` → instantiate twice with different `QueryParams`
- `<Calendar>` (shadcn) → already in use, add second instance
- `getTaiwanToday()` → reuse for both date defaults

**Mobile layout note:** Max-width for the page is currently `max-w-2xl` (672px). On desktop this is wide enough for two columns if reduced to `max-w-4xl` (896px) or `max-w-5xl` (1024px). Consider widening the desktop container only when round-trip results are shown.

---

### Feature 2: Saved Routes (儲存常用路線)

**Pattern: Chips row above form, max 5, one-tap load**

```
Mobile + Desktop:
┌─────────────────────────────────────────┐
│  常用路線:                               │
│  [南港→左營 ×]  [台中→台北 ×]           │  ← chips, scrollable if many
│                                         │
│  ┌── QueryForm ─────────────────────┐   │
│  │  起站 / 訖站 / 日期 / [查詢]     │   │
│  │  [儲存此路線] ← shown when valid  │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Key decisions:**
- **Placement:** Chips appear directly above the query form (not in a sidebar, not in a settings page). Visible immediately on load.
- **Capacity:** Maximum 5 routes. When at capacity, "儲存此路線" button is disabled with tooltip "已達上限（5筆）". User must delete one first.
- **Delete:** Each chip has a small "×" delete button. Tap × removes that route from localStorage and re-renders the chips.
- **Quick-load trigger:** Tapping the route name portion of a chip calls `setOrigin(route.from)` + `setDestination(route.to)`. Does NOT auto-submit — user still taps 查詢 to run the query. This prevents unexpected API calls on accidental taps.
- **Save trigger:** "儲存此路線" button appears in/near the form when `origin` and `destination` are both set and the pair is not already saved. Disappears if the pair is already in saved routes (prevents duplicates).
- **localStorage key:** `"thsr-saved-routes"`. Value: JSON array of `{ from: string, to: string, fromName: string, toName: string }[]`.
- **Hydration:** Use `useEffect` + `useState` with `null` initial state to avoid SSR/client mismatch. Render chips only after mount. (Standard Next.js localStorage pattern.)
- **Station names:** Resolve from the station list that is already loaded by the form. Pass station list as prop to the saved routes component, or use the same React Query cache (same `queryKey: ['stations']`).

**Mobile note:** Chips must be horizontally scrollable if they overflow (CSS `overflow-x-auto` with `flex-nowrap` on the chip row). Finger-swipe to reveal additional chips. On desktop they can wrap.

---

### Feature 3: Share Link (可分享查詢條件)

**Pattern: URL query params → auto-run on load + copy button in results**

```
URL structure (single-leg):
/  ?from=1&to=12&date=2026-03-01

URL structure (round-trip, defer to v2.1):
/  ?from=1&to=12&outDate=2026-03-01&returnDate=2026-03-07&mode=roundtrip
```

```
Results area header (after query runs):
┌─────────────────────────────────────────┐
│  南港 → 左營  2026-03-01                │
│                    [分享此查詢] 📋       │  ← copy button
│  [TrainList...]                         │
└─────────────────────────────────────────┘
```

**Key decisions:**
- **What goes in the URL:** `from` (station ID), `to` (station ID), `date` (YYYY-MM-DD). No train number. No time filter. These are the minimal params to reproduce the query.
- **URL write:** Update URL on form submit using `router.replace(url, { scroll: false })` — not `router.push` (no new history entry). Uses `window.history.replaceState` via Next.js router. Does not cause a page reload.
- **Auto-run on open:** `useSearchParams` reads params on mount. If `from`, `to`, and `date` are all present and valid (from is a valid station ID, to is a valid station ID, date is YYYY-MM-DD and not in the past), immediately call `setQueryParams(...)` — same as submitting the form. The results load without user interaction.
- **Invalid params:** If URL params are present but invalid (bad station ID, past date, from === to), silently ignore the URL and show the form in its default empty state. Do not show an error — the form is already visible for the user to fill in correctly.
- **Copy button:** Placed in the results header row. Label: "分享" (with clipboard icon). On click: `navigator.clipboard.writeText(window.location.href)` → button changes to "已複製 ✓" for 2 seconds → reverts. Falls back to `document.execCommand('copy')` for old iOS browsers.
- **Copy button placement note:** Do NOT place in the form area — it only makes sense when results exist. The results header row (showing origin → destination + date) is the natural location.
- **HTTPS requirement:** `navigator.clipboard` requires secure context (HTTPS). Vercel deployments are always HTTPS. Local dev on `localhost` also qualifies. No issue.
- **Next.js Suspense requirement:** `useSearchParams` in App Router must be wrapped in `<Suspense>`. The page component (or a child that reads search params) needs a `<Suspense>` boundary. This is a build-time requirement, not a runtime concern. Failure to add Suspense causes the entire page to opt out of static rendering.

**Implementation sequence:**
1. Wrap the page's query-aware section in `<Suspense fallback={<QueryFormSkeleton />}>`
2. Create `useQueryFromUrl()` hook: reads `useSearchParams`, validates, returns `QueryParams | null`
3. On form submit: call `router.replace` to write current params to URL
4. In `<TrainList>` results header: add copy-to-clipboard button
5. Test: shared URL → new incognito tab → results auto-run

---

## Mobile Considerations Summary

| Feature | Mobile Pattern | Desktop Pattern |
|---------|---------------|-----------------|
| Round-trip form | Single column, two date rows stacked | Same — form is already compact |
| Round-trip results | Two panels stacked vertically, sticky "去程"/"回程" headers | Two-column grid layout (`md:grid-cols-2`) |
| Saved routes chips | Horizontally scrollable chip row (overflow-x-auto) | Wrapping chip row (flex-wrap) |
| Save button | Below form, full-width or inline with form card | Inline with form, right-aligned |
| Copy-to-clipboard | Taps `navigator.clipboard`; shows "已複製" toast | Same |
| Share link mobile | Consider Web Share API (`navigator.share()`) fallback | `navigator.clipboard` only |

---

## Existing Component Reuse Map

| New Feature | Reuses | How |
|-------------|--------|-----|
| Round-trip form | `QueryForm`, `StationLinePicker`, `Calendar` | Extract station-selection into a shared sub-component; keep date pickers as separate instances |
| Round-trip results | `TrainList`, `TrainCard`, `TrainTable` | Instantiate twice with different `QueryParams` |
| Saved routes chips | `Button`, `Badge` (shadcn) | New `SavedRoutes` component. Uses station list from existing React Query cache. |
| Share link URL write | Next.js `useRouter` (`router.replace`) | Called in the form submit handler, after existing `setQueryParams` call |
| Share link URL read | Next.js `useSearchParams` | New hook or inline in page component |
| Copy button | `Button` + Clipboard API | New `CopyLinkButton` component, ~20 LOC |

---

## Competitor Feature Analysis

| Feature | THSR Official Site | t-ex Style Apps | This App's Approach |
|---------|-------------------|-----------------|--------------------|
| Round-trip | Separate query for each leg, no coordination | Not available | Single form, two panels, auto-reversed return direction |
| Saved routes | Login required for favorites | Not available | localStorage, no login, instant |
| Share link | URL does not encode query state | Not available | URL query params, auto-run on open |

---

## Sources

### Primary (HIGH confidence — direct codebase analysis)

- `/Users/diamond.hung/ailabs/code/thsr-query/src/components/query-form.tsx` — confirmed `QueryParams` type, `useState` form state, `Calendar` popover usage, station data from React Query
- `/Users/diamond.hung/ailabs/code/thsr-query/src/components/train-list.tsx` — confirmed `QueryParams`-driven `useQuery`, independent `enabled` flag, existing loading/error states
- `/Users/diamond.hung/ailabs/code/thsr-query/src/app/page.tsx` — confirmed current page uses `useState` for query params (no URL sync), `max-w-2xl` container, Tabs layout
- `.planning/REQUIREMENTS.md` — confirmed v2 requirements: PERS-01, PERS-02, NOTF-01

### Secondary (MEDIUM confidence — web research, transit app domain patterns)

- Web search: "transit app round trip query UX patterns separate date pickers 2025" — confirmed two-calendar pattern for flight booking; range picker appropriate for stays, not separate-leg transit
- Web search: "Google Flights Booking.com round trip date picker UX mobile" — confirmed industry preference for separate departure/return date fields when legs are independent
- Web search: "shareable URL query string web app UX copy link patterns 2025" — confirmed URL-as-state pattern, `useSearchParams`, `router.replace` for shallow routing without page reload
- Web search: "localStorage saved routes favorites transit app UX patterns" — confirmed localStorage viability, favorites pattern best practices
- Next.js official docs on `useSearchParams`: requires Suspense boundary in App Router — [nextjs.org/docs/app/api-reference/functions/use-search-params](https://nextjs.org/docs/app/api-reference/functions/use-search-params)

### Tertiary (LOW confidence — training knowledge, validate during implementation)

- Navigator.share() availability on specific iOS/Android versions — verify during implementation
- Clipboard API behavior on older iOS Safari — test on real device
- `router.replace` shallow routing and whether it triggers React Query re-fetches — verify in Next.js 16

---

## Open Questions

1. **Container width for round-trip desktop layout**
   - Current `max-w-2xl` (672px) is too narrow for side-by-side train lists.
   - Decision needed: widen globally to `max-w-5xl`, or only widen the results area when round-trip mode is active.
   - Recommendation: Add a `data-mode="roundtrip"` class to the results section and use CSS to widen only that section. Keeps the form compact.

2. **Round-trip mode entry point: separate tab or toggle within existing "時間查詢" tab?**
   - Option A: Fourth tab "來回查詢" alongside 時間查詢 / 車次查詢 / 車站查詢.
   - Option B: Toggle within the existing "時間查詢" tab — "單程 / 來回" switch.
   - Recommendation: Option B (toggle). Adding a fourth tab makes the tab bar too crowded on mobile (3 tabs already fills the bar at `grid-cols-3`). A toggle within the existing tab keeps the navigation simple and groups round-trip with the time-based query it extends.

3. **Saved routes: where exactly in the layout?**
   - Option A: Above the Tabs component (always visible regardless of active tab).
   - Option B: Inside the "時間查詢" tab only.
   - Recommendation: Option B. Saved routes only make sense for OD time queries. Showing them in the by-train or by-station tabs is confusing.

4. **URL state for round-trip: `mode=roundtrip` param or separate path segment?**
   - Option A: `/?mode=roundtrip&from=1&to=12&outDate=2026-03-01&returnDate=2026-03-07`
   - Option B: `/roundtrip?from=1&to=12&outDate=2026-03-01&returnDate=2026-03-07`
   - Recommendation: Option A (query params, single page). All state in query params, no routing complexity. Next.js `useSearchParams` handles all params on the same page.

---

*Feature research for: THSR Query App — v2.0 UX Enhancement (來回票 + 常用路線 + 分享連結)*
*Researched: 2026-02-19*
*Valid until: 2026-05-19 (stable patterns; re-check if Next.js major version changes)*
