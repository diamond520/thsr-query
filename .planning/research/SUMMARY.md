# Project Research Summary

**Project:** THSR Query App — v2.0 UX Enhancement (Round-Trip, Saved Routes, Shareable URL)
**Domain:** Next.js 16 App Router + TDX OAuth2 — Transit Query Web App
**Researched:** 2026-02-19
**Confidence:** HIGH

## Executive Summary

This milestone adds three UX enhancements to an existing, working THSR (Taiwan High Speed Rail) query app: round-trip query with coordinated two-leg results, saved favorite routes persisted in localStorage, and shareable query links via URL state. The existing app is a Next.js 16 App Router SPA using React Query v5, Tailwind CSS v4, and shadcn/ui. All three v2.0 features are buildable with the existing stack — no new runtime dependencies are required. The architecture is purely additive: new components and hooks drop in alongside existing ones without restructuring the server-side TDX OAuth2 proxy or any of the existing query modes.

The recommended build order is: (1) shareable URL first, then (2) saved routes, then (3) round-trip query. URL state infrastructure (Suspense wrapping, `router.replace` hook, `initialDate?` prop on `QueryForm`) must land first because both saved routes and the round-trip form share the same `initialOrigin?`/`initialDestination?` prop pattern and key-remount technique that URL state introduces. Building in this order touches each shared file exactly once. Round-trip goes last because it is entirely additive — new files only — and can be developed in parallel on a separate branch if timeline requires it.

The two highest-severity risks are well-understood and preventable: (1) `useSearchParams()` crashing the production build without a Suspense boundary — works silently in `next dev` but fails at `next build` — prevented by isolating the hook in a dedicated `SearchParamsInit` child component; and (2) localStorage reads during SSR causing hydration mismatch — prevented by hydrating favorites via `useEffect` after mount, not in the render path. A third risk, `router.push()` on every field change creating a Back-button loop, is prevented by using `router.replace()` for all URL updates and only `router.push()` (if needed at all) on explicit form submission.

## Key Findings

### Recommended Stack

The existing stack is fully sufficient for all three v2.0 features. No new runtime packages are required. See `.planning/research/STACK.md` for full version table.

**Core technologies in use:**
- **Next.js 16.1.6 App Router:** `useSearchParams` + `router.replace` (built-in) handle shareable URL state. Route Handlers continue to proxy TDX calls server-side.
- **React Query v5 (TanStack Query 5.90.21):** Two independent `useQuery` calls with distinct `queryKey` arrays handle parallel API calls for round-trip. `enabled: !!params` pattern is already established in `train-list.tsx`.
- **shadcn/ui + Tailwind v4:** All components needed for v2.0 are already installed: `Tabs`, `Calendar`, `Button`, `Badge`. Optional addition: `npx shadcn@latest add separator` for visual dividers in the round-trip layout.

**Optional packages (add only if needed):**
- `nuqs@2.8.8` — only if URL state grows beyond 3-4 simple string params; not required for v2.0
- `usehooks-ts@3.1.1` — only if localStorage complexity expands beyond a single key; not required for v2.0

**Critical version notes:** Next.js 16 requires Node.js >=20.9.0. React Query v5 drops `onSuccess` callback (use `useEffect` instead). Zod v4 (in use) has breaking changes from v3.

### Expected Features

See `.planning/research/FEATURES.md` for the full prioritization matrix and UX wireframes.

**Must have (table stakes) — v2.0 launch blockers:**
- Round-trip: shared origin/destination pair, two independent date pickers, auto-reversed return direction, two `TrainList` panels (stacked on mobile / side-by-side on desktop)
- Saved routes: up to 10 routes in localStorage, chip UI above the query form, one-tap load pre-fills form, "儲存" button when stations are selected, persist across browser sessions
- Share link (single-leg): `?from=1&to=12&date=2026-03-01` URL schema, auto-run query on page open when all three params present and valid, copy-to-clipboard button in results header

**Should have (competitive differentiators) — v2.0 launch:**
- Round-trip: desktop side-by-side layout via `md:grid-cols-2`, sticky "去程"/"回程" section headers on mobile to prevent scroll confusion
- Saved routes: display human-readable station name labels (not raw IDs), horizontal scroll on mobile chip row
- Share link: native Web Share API (`navigator.share()`) with clipboard fallback on mobile

**Defer to v2.1+:**
- Share link for round-trip (URL schema extension: `?outDate=...&returnDate=...&mode=roundtrip`) — requires both round-trip and single-leg share link stable first
- Saved route swap button (reverse a saved route direction with one tap) — separable UX polish
- "已達上限" toast notification for saved routes at capacity — v2.0 can silently disable the save button
- Saved route sync across devices — requires auth and backend, explicitly out of scope

**Anti-features rejected from research:** Date range picker for round-trip (wrong UX model — THSR legs are independent dates, not a continuous stay), auto-save last query to localStorage (conflicts with URL state as source of truth), unlimited saved routes (UI degrades beyond ~10 items), saved routes in a separate settings page (users want quick access, not route management), share link that encodes a selected train (query is the shareable unit, not a specific train).

### Architecture Approach

All three features integrate cleanly into the existing component tree. `page.tsx` is the central integration point touched by all three features, but changes are additive: a new fourth tab for round-trip, Suspense wiring for URL state, and `useFavoriteRoutes` hook invocation for saved routes. `QueryForm` gains three new optional props (`initialOrigin?`, `initialDestination?`, `initialDate?`) used by both URL state initialization and favorite route loading. The key-prop remount pattern (`<QueryForm key={formKey} />`) handles pre-filling without converting the form to a fully controlled component.

See `.planning/research/ARCHITECTURE.md` for full data flow diagrams and file-level change tables.

**Major components and responsibilities:**

1. `src/components/search-params-init.tsx` (NEW) — reads `useSearchParams()` once on mount, calls `onInit(from, to, date)` callback; always wrapped in `<Suspense fallback={null}>` in `page.tsx`; renders nothing
2. `src/hooks/use-query-url.ts` (NEW) — writes URL via `router.replace(pathname + '?' + params, { scroll: false })` on form submit; never on individual field changes
3. `src/hooks/use-favorite-routes.ts` (NEW) — localStorage CRUD with SSR guard (`typeof window === 'undefined'` in `useState` initializer), `try-catch` with shape validation, versioned storage key (`thsr-favorites-v2`), cap at 10 routes
4. `src/components/favorite-routes.tsx` (NEW) — pill chip UI rendered above `QueryForm` in the `by-od` tab; tapping a chip triggers key-prop remount of `QueryForm` to pre-fill stations
5. `src/components/round-trip-form.tsx` (NEW) — origin, destination (shared between legs), two independent date pickers
6. `src/components/round-trip-results.tsx` (NEW) — renders two `TrainList` instances with distinct query keys (`['trains', 'outbound', ...]` and `['trains', 'return', ...]`)

**Unchanged:** All API Route Handlers, `train-list.tsx`, `train-card.tsx`, `train-table.tsx`, `station-line-picker.tsx`, all other existing components, `lib/*`, `providers.tsx`, `layout.tsx`.

**Modified existing files:**

| File | What Changes |
|------|-------------|
| `src/app/page.tsx` | Add `<Suspense>` + `SearchParamsInit`; wire `useFavoriteRoutes`; add fourth `by-roundtrip` tab; add `roundTripParams` state |
| `src/components/query-form.tsx` | Add `initialOrigin?`, `initialDestination?`, `initialDate?` props used as `useState` initializers |
| `src/types/tdx.ts` | Add `RoundTripParams` interface |

### Critical Pitfalls

The v2.0 milestone introduces 10 new pitfalls specific to URL state, localStorage, and round-trip query patterns. See `.planning/research/PITFALLS.md` for the complete 22-pitfall catalog with verification checklists.

**Top pitfalls for v2.0:**

1. **`useSearchParams()` without Suspense crashes production build (Pitfall 13)** — Works silently in `next dev`; fails at `next build` with "Missing Suspense boundary" error. Prevention: always isolate `useSearchParams()` in a child component (`SearchParamsInit`) wrapped in `<Suspense fallback={null}>`. Verify by running `next build` before each PR merge — not just `next dev`.

2. **localStorage read during SSR causes hydration mismatch (Pitfall 14)** — `localStorage` does not exist on the server; reading it in render or a `useState` initializer crashes. Prevention: use `useEffect` + empty initial state with a `hydrated` flag; render the favorites chip list only after mount. Do not use `suppressHydrationWarning` as a band-aid.

3. **`router.push()` on field change creates Back-button loop (Pitfall 19)** — Every field edit adds a browser history entry; pressing Back cycles through field states instead of leaving the page. Prevention: use `router.replace()` for all URL updates triggered by form submit; `router.push()` is not needed for this app.

4. **Round-trip React Query keys collide without direction discriminator (Pitfall 17)** — If outbound and return queries share the same key structure, React Query may deduplicate them and serve one result for both panels. Prevention: include `'outbound'` or `'return'` as the second element in every round-trip `queryKey` array.

5. **localStorage corrupted data crashes React tree (Pitfall 15)** — `JSON.parse()` on malformed or schema-migrated data throws uncaught `SyntaxError`. Prevention: always wrap in `try-catch`, validate the parsed shape (check `Array.isArray()` and field types), clear the key on failure, use a versioned key (`thsr-favorites-v2`).

6. **Return date before outbound date not blocked in the calendar UI (Pitfall 16)** — TDX silently returns wrong results; user has no feedback. Prevention: pass `disabled={(date) => date < outboundDate}` to the return `Calendar` component, and add a `useEffect` to auto-advance the return date when the outbound date changes to a later value.

## Implications for Roadmap

Research identifies three independently deliverable features that share a small amount of infrastructure. The recommended three-phase build order minimizes re-touching shared files and surfaces production risks early.

### Phase 1: Shareable URL (Feature 3 — URL State)

**Rationale:** Establishes Suspense wiring and `QueryForm` prop extensions (`initialDate?`) that Phases 2 and 3 both rely on. Building this first means each shared file (`page.tsx`, `query-form.tsx`) is modified in a single coherent pass rather than incrementally across three PRs. Also the quickest Phase 1 win — visible, shippable feature (copy a link, open it, see results) with no UI redesign.

**Delivers:** Shareable single-leg query links (`?from=1&to=12&date=2026-03-01`), form pre-fills and auto-runs on page open, URL updates on form submit without page reload, copy-to-clipboard button in results header.

**Addresses features:** Share link table-stakes (auto-run, copy button, URL query params), mobile Web Share API.

**Avoids pitfalls:** Suspense boundary build failure (13), router.push Back-button loop (19), URL double-encoding (20), form/URL state divergence (22).

**New files:** `src/components/search-params-init.tsx`, `src/hooks/use-query-url.ts`

**Modified files:** `src/app/page.tsx` (Suspense + URL init wiring), `src/components/query-form.tsx` (add `initialDate?` prop)

**Research flag:** Standard patterns. `useSearchParams` behavior is verified in Next.js 16.1.6 official docs. Run a quick smoke test of `router.replace` + `useSearchParams()` re-render in Next.js 16.1.6 before committing to the approach — behavior is confirmed in docs but worth a 10-minute local verification.

---

### Phase 2: Saved Favorite Routes (Feature 2 — localStorage)

**Rationale:** Builds on the `initialOrigin?`/`initialDestination?` prop pattern and key-remount technique that Phase 1 established. The `useFavoriteRoutes` hook is fully self-contained (no round-trip dependency). Completing this before round-trip means `query-form.tsx` receives all its new props in a single final pass.

**Delivers:** Chip row above the `by-od` form showing up to 10 saved routes, one-tap load pre-fills form origin and destination, "儲存" button that appears when stations are selected (hidden when pair already saved or limit reached), data persists across browser sessions.

**Uses stack:** Inline `useSavedRoutes` custom hook pattern (no `usehooks-ts` dependency needed), existing `Button` + `Badge` shadcn components.

**Addresses features:** Saved routes table-stakes (chips, quick-load, persist), human-readable labels, one-tap save, mobile horizontal scroll.

**Avoids pitfalls:** localStorage hydration mismatch (14), corrupted data crash (15), localStorage max-items quota error (21).

**New files:** `src/hooks/use-favorite-routes.ts`, `src/components/favorite-routes.tsx`

**Modified files:** `src/app/page.tsx` (wire `useFavoriteRoutes`, pre-fill via key prop), `src/components/query-form.tsx` (add `initialOrigin?` + `initialDestination?` props)

**Research flag:** Standard patterns. localStorage SSR pattern and hook design are fully specified in ARCHITECTURE.md. No additional research needed.

---

### Phase 3: Round-Trip Query (Feature 1 — New Tab)

**Rationale:** Entirely additive — creates new files and a new fourth tab in `page.tsx`. No shared files require additional modification beyond what Phases 1 and 2 already touched (except the `page.tsx` fourth-tab addition). Can be developed in parallel on a separate branch during Phases 1-2 without merge conflicts.

**Delivers:** "來回查詢" fourth tab with shared station picker, two independent date pickers (not a range picker), auto-reversed return direction, side-by-side desktop layout (`md:grid-cols-2`), stacked mobile layout with sticky "去程"/"回程" section headers.

**Implements:** `RoundTripForm` (origin, destination, outboundDate, returnDate), `RoundTripResults` (two `TrainList` instances with `outbound`/`return` discriminators in query keys), `RoundTripParams` type in `src/types/tdx.ts`.

**Addresses features:** Round-trip table-stakes and differentiators: shared station pair, two date pickers, auto-reverse, two result panels, desktop side-by-side, mobile sticky headers.

**Avoids pitfalls:** Return date validation (16), React Query key collision (17), mobile scroll confusion with nested scroll traps (18).

**New files:** `src/components/round-trip-form.tsx`, `src/components/round-trip-results.tsx`

**Modified files:** `src/app/page.tsx` (add `by-roundtrip` fourth tab + `roundTripParams` state), `src/types/tdx.ts` (add `RoundTripParams`)

**Research flag:** Standard patterns. `TrainList` is already self-contained and requires no changes. Two-date-picker UX pattern is confirmed as industry standard for transit (vs. range picker for hotel stays). No additional research needed.

---

### Phase 4 (v2.1): Round-Trip Shareable Link

**Rationale:** Requires both Phase 1 (URL infrastructure) and Phase 3 (round-trip mode) to be stable. URL schema extension adds `?outDate=...&returnDate=...&mode=roundtrip` and the `mode` param drives which tab activates on deep link. Low complexity once foundations exist.

**Delivers:** Shareable round-trip links that restore both dates and activate the round-trip tab on open. Explicitly deferred from v2.0 launch per FEATURES.md MVP definition.

---

### Phase Ordering Rationale

- **URL state first** because `SearchParamsInit` and the `initialDate?`/`initialOrigin?`/`initialDestination?` props on `QueryForm` are shared infrastructure for all three features. Establishing them in Phase 1 means `query-form.tsx` is modified once, cleanly, in a single PR.
- **Saved routes second** because it extends Phase 1's prop additions (`initialOrigin?`, `initialDestination?`) without round-trip dependency. Completing before round-trip means `query-form.tsx` is finalized before round-trip begins (which creates a new `RoundTripForm` rather than modifying `QueryForm`).
- **Round-trip last** because it creates entirely new components without touching anything Phases 1 and 2 modified (except the `page.tsx` fourth-tab addition). If schedule requires parallel work, Phase 3 can run alongside Phase 2 on a separate branch.
- **Architecture confirms this order** — ARCHITECTURE.md's explicit build order recommendation is Phase 3 → Phase 2 → Phase 1 labeled as Features 3, 2, 1 respectively — matching this synthesis.

### Research Flags

**Phases with standard patterns — skip additional research:**
- **Phase 1 (Shareable URL):** `useSearchParams` is fully documented in Next.js 16.1.6 official docs. `router.replace` semantics are confirmed. Code patterns are specified and ready to implement. Quick local smoke test recommended, not a full research pass.
- **Phase 2 (Saved Routes):** localStorage SSR pattern is established. Hook design is fully specified in ARCHITECTURE.md. No novel patterns.
- **Phase 3 (Round-Trip):** `TrainList` component is self-contained; rendering two instances is straightforward. `RoundTripParams` type and all component boundaries are fully specified in ARCHITECTURE.md.

**Needs targeted validation before coding:**
- **All phases:** TDX OAuth2 token endpoint URL and token TTL should be empirically verified when credentials are available (LOW confidence per STACK.md). This does not block v2.0 features — no new TDX endpoints are introduced in this milestone — but is relevant for the underlying token caching reliability.
- **Phase 1:** Quick `next build` smoke test after adding `useSearchParams` Suspense wiring before the PR is merged — failure mode is silent in `next dev` and only surfaces at build time.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package versions verified via npm registry 2026-02-19. No new packages required. Next.js 16.1.6 official docs consulted directly for `useSearchParams`, `router.replace`, and Suspense requirement. |
| Features | MEDIUM-HIGH | v2.0 feature scope confirmed via direct codebase analysis of existing components. UX patterns (two date pickers vs. range picker, chip placement, share link behavior) confirmed via Next.js docs and transit app domain research. Design decisions (5 vs. 10 saved routes, new tab vs. toggle) are resolved with clear rationale. |
| Architecture | HIGH | Integration design based on direct codebase analysis of `page.tsx`, `query-form.tsx`, `train-list.tsx`. Official Next.js docs confirm Suspense requirement, `router.replace` vs `router.push` semantics, and `{ scroll: false }` option. React official docs confirm key-prop remount pattern. |
| Pitfalls | HIGH (Next.js patterns), MEDIUM (TDX-specific) | Next.js v2.0 pitfalls (Suspense, localStorage SSR, Back-button loop, query key collision) verified against official docs and confirmed GitHub issues. TDX-specific pitfalls (rate limits, `$format=JSON` requirement, exact token TTL) are based on known OAuth2 patterns and community usage — validate when TDX credentials are available. |

**Overall confidence:** HIGH for all implementation decisions; MEDIUM for TDX API specifics that require live credentials to verify (none of which block v2.0 development).

### Gaps to Address

- **Saved routes capacity: 5 vs 10.** FEATURES.md specifies 5; STACK.md specifies 10. Recommendation from synthesis: **10 routes**. localStorage is trivially small for this data volume (10 station ID pairs); 5 is too restrictive for regular commuters with multiple routes. Resolve before Phase 2 coding begins.

- **Round-trip mode entry point: new tab vs. toggle.** ARCHITECTURE.md recommends a new fourth tab ("來回查詢"). FEATURES.md recommends a toggle inside the existing "時間查詢" tab. Recommendation from synthesis: **new fourth tab** — cleaner component separation (no conditional branching in `QueryForm`), clearer user mental model (round-trip is a different query shape, not a mode). Resolve before Phase 3 coding begins.

- **Round-trip desktop container width.** Current `max-w-2xl` (672px) is too narrow for side-by-side train lists. Options: widen globally to `max-w-5xl`, or widen only the round-trip results section conditionally. Recommendation: conditional widening via a wrapper class on the results container only, keeping the form compact. Resolve during Phase 3 implementation.

- **TDX API endpoint verification.** Token endpoint URL, base URL, token TTL, `$format=JSON` requirement, and rate limits are LOW confidence per STACK.md. These do not block v2.0 development (no new TDX endpoints introduced) but should be verified when testing the existing OAuth2 proxy.

- **`router.replace` + `useSearchParams()` re-render behavior in Next.js 16.1.6.** Confirmed in docs; worth a 10-minute local smoke test to verify `useSearchParams()` actually triggers a re-render when `router.replace()` updates the URL in the same page — expected behavior per docs but easy to verify before Phase 1 PR.

## Sources

### Primary (HIGH confidence)
- npm registry (`npm info` commands) — confirmed exact versions: `next@16.1.6`, `react@19.2.4`, `typescript@5.9.3`, `tailwindcss@4.2.0`, `@tanstack/react-query@5.90.21`, `shadcn@3.8.5` — 2026-02-19
- Next.js 16.1.6 official docs — `useSearchParams` Suspense requirement, `router.replace` vs `router.push` semantics, `{ scroll: false }` option — 2026-02-19
- Next.js docs: `nextjs.org/docs/messages/missing-suspense-with-csr-bailout` — production build error for `useSearchParams` without Suspense
- TanStack Query v5 docs — `enabled` option, `skipToken`, parallel queries, `queryKey` deduplication behavior
- React official docs — key-prop pattern for resetting child state (`react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes`)
- Direct codebase analysis: `src/app/page.tsx`, `src/components/query-form.tsx`, `src/components/train-list.tsx`, `src/lib/taiwan-date.ts`, `package.json` — confirmed existing patterns, component interfaces, and installed dependencies

### Secondary (MEDIUM confidence)
- Vercel/Next.js GitHub issues #74494, #61654 — `useSearchParams` Suspense requirement in production builds — 2026-02-19
- Vercel/Next.js GitHub discussion #48110 — shallow routing in App Router vs. Pages Router — 2026-02-19
- Transit app UX research — two-date-picker pattern for independent-leg travel (vs. range picker for stays), localStorage favorites patterns, URL-as-state shareability patterns — 2026-02-19
- nuqs v2.8.8 documentation and usehooks-ts v3.1.1 docs — confirmed as valid alternatives for URL state and localStorage hooks respectively; not required for v2.0 scope

### Tertiary (LOW confidence — validate with live TDX account)
- TDX OAuth2 token endpoint URL: `https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token` — verify with TDX official docs
- TDX token TTL ~86400s — commonly cited but empirically unverified; check `expires_in` from actual token response
- TDX `$format=JSON` query param requirement — verify against actual API responses
- TDX API rate limits per plan tier — verify with TDX account

---
*Research completed: 2026-02-19*
*Ready for roadmap: yes*
