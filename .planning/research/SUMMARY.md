# Project Research Summary

**Project:** THSR Query — Next.js rewrite of Vue 2 transit query app
**Domain:** Transit query web app with server-side OAuth2 API proxy
**Researched:** 2026-02-19
**Confidence:** HIGH (stack, architecture, pitfalls); MEDIUM-HIGH (features)

## Executive Summary

This project is a rewrite of a Vue 2 Taiwan High Speed Rail (THSR) timetable and seat availability query app into a modern Next.js 16 App Router application deployed on Vercel. The core architectural constraint — that TDX API credentials (`client_secret`) must never reach the browser — dictates the entire system structure: all TDX communication happens server-side through Route Handler proxies, and the OAuth2 token lives in a module-level cache that is never exposed to client code. This is a solved problem in Next.js App Router, and the stack has a clear, well-documented pattern: Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui + React Query v5 + Zod.

The recommended approach is to build a strict server/client split. A module-level token manager (`lib/tdx-token.ts`, guarded with `import 'server-only'`) caches the Bearer token per Vercel function instance. Four Route Handlers proxy requests to TDX endpoints with appropriate cache revalidation intervals: 24h for static data (stations, general timetable), 5 minutes for daily timetables, and 60 seconds for seat availability. Client Components use React Query to fetch from these proxy endpoints — never from TDX directly. The station list is the only data pre-fetched server-side and passed as props.

The primary risks are security (client_secret exposed if the boundary is violated), correctness (stale timetable data due to misconfigured caching), and UX degradation (missing loading/empty states, geographic station order scrambled by sorting). All three are well-understood and preventable through disciplined use of `server-only` guards, explicit `revalidate` configuration per endpoint, and preservation of API station order. The build order recommended by architecture research — token manager first, then stations endpoint, then timetable, then UI — provides working vertical slices at each step and surfaces credential or API issues early.

## Key Findings

### Recommended Stack

The 2026 standard for this type of app is Next.js 16 App Router with TypeScript. Tailwind CSS v4 (PostCSS plugin model, no `tailwind.config.js`) and shadcn/ui (code-generator, not a package) provide the UI layer. React Query v5 manages client-side async state. All library versions were verified against npm registry on 2026-02-19.

See `.planning/research/STACK.md` for full version table and installation commands.

**Core technologies:**
- **Next.js 16.1.6:** App Router, Route Handlers, Data Cache — Vercel-native; Pages Router is legacy
- **TypeScript 5.9.3:** Required for safe TDX response typing; catches params-not-awaited bugs at compile time
- **Tailwind CSS v4.2.0:** v4 PostCSS model; required by shadcn/ui; mobile-first by default
- **shadcn/ui 3.8.5 CLI:** Installs Radix UI components as local code; full control over component styles
- **React Query v5.90.21:** Handles loading/error/stale states for user-triggered queries; `enabled: false` until form submit
- **react-hook-form 7.71.1 + Zod 4.3.6:** Form validation with shared schemas for client and server
- **date-fns 4.1.0:** Taiwan date formatting; avoids UTC-vs-UTC+8 bugs with `Intl.DateTimeFormat`
- **server-only 0.0.1:** Build-time guard preventing accidental client import of TDX credential modules

**Critical version notes:** Node.js >=20.9.0 required by Next.js 16. React Query v5 drops `onSuccess` callback (use `useEffect` instead). Zod v4 has breaking changes from v3.

### Expected Features

The app serves a single use case: "I want to get on a specific THSR train — does it have seats?" Every feature either serves or supports that core job.

See `.planning/research/FEATURES.md` for full prioritization matrix and mobile UX patterns.

**Must have (table stakes) — launch blockers:**
- Origin/destination station picker with auto-default and swap button
- Date + time input (default: today, current time) with departure/arrival toggle
- Timetable results list showing train number, departure, arrival, duration
- Seat availability (標準席/商務席) inline in each result row — no second tap required
- "去訂票" link per train row to THSR official booking
- Station seat availability view (by station, direction tabs)
- Train number lookup flow
- Loading, empty, and error states for all three query types

**Should have (differentiators):**
- Color-coded seat status badges (green/yellow/red) for at-a-glance scanning
- Date quick-select chips (今天/明天/後天)
- Visual linear station selector on mobile (12-station single corridor maps perfectly to a tap-target line)
- Data freshness timestamp on seat status display
- URL-based query state for shareable links

**Defer to v2+:**
- OS-driven dark mode via CSS custom properties
- PWA / installable app
- Persist last query in localStorage

**Anti-features to reject:** Push notifications (TDX data is not real-time), in-app booking (no public API), calendar availability heat-map (too many API calls), manual dark mode toggle, pagination of results (THSR has at most ~50 trains/day — render all).

### Architecture Approach

The system has two clear tiers: a thin browser layer (Client Components that collect user input and display results) and a Next.js server layer (Route Handlers that authenticate with TDX and proxy responses). The station list is the only data that crosses from server to client via props — all other data flows through fetch calls from Client Components to Route Handler endpoints.

See `.planning/research/ARCHITECTURE.md` for full system diagram, directory structure, and data flow examples.

**Major components:**
1. `lib/tdx-token.ts` — Module-level token cache; `import 'server-only'`; never touches client
2. `app/api/tdx/*/route.ts` — Four Route Handlers (stations, timetable, timetable-by-train, seat-status); each calls `getTdxToken()` and proxies to TDX with appropriate `revalidate`
3. `app/page.tsx` (Server Component) — Pre-fetches station list, passes as props to Client Component forms
4. `components/QueryTabs.tsx`, `ByTimeForm.tsx`, `ByTrainNoForm.tsx`, `ByStationForm.tsx` — Client Components; use React Query to call Route Handlers; own their own form and result state
5. `types/tdx.ts` — Typed TDX response shapes derived from existing Vue 2 component field usage

**Recommended directory structure:**
```
app/
  layout.tsx, page.tsx, loading.tsx, error.tsx
  api/tdx/
    stations/route.ts
    timetable/route.ts
    timetable-by-train/route.ts
    seat-status/route.ts
components/         # all 'use client'
lib/
  tdx-token.ts      # server-only
  tdx-api.ts        # server-only
  utils.ts
types/tdx.ts
```

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for full detail, phase mapping, and recovery strategies.

1. **TDX client_secret exposed in client bundle** — Use `TDX_CLIENT_SECRET` (no `NEXT_PUBLIC_`); add `import 'server-only'` to token module; all TDX calls go through Route Handlers only. This is the highest severity risk — a build-time safeguard and code review checklist item.

2. **Stale timetable/seat data due to misconfigured caching** — Next.js 15+ Route Handlers are NOT cached by default. Add explicit `{ next: { revalidate: N } }` per endpoint: 86400s for stations, 300s for timetable, 60s for seat status. Seat availability must use `{ cache: 'no-store' }` or `export const dynamic = 'force-dynamic'`.

3. **Token fetched on every request** — Cache token in module-level variable with `expiresAt` check; refresh 60 seconds before actual expiry. On cold starts, one re-fetch is unavoidable and acceptable (~200ms).

4. **"use client" boundary creep** — Query forms need `'use client'` but must not import from `lib/tdx-token.ts` or `lib/tdx-api.ts`. The `server-only` package enforces this at build time. Never put `'use client'` in `app/page.tsx` or `app/layout.tsx`.

5. **Date timezone mismatch (UTC vs UTC+8)** — `new Date().toISOString()` returns UTC date. Between midnight and 08:00 Taiwan time, this is yesterday. Always use `new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date())` or accept the date from the user's browser form input.

6. **params must be awaited in Next.js 15+** — `const { stationId } = await params` not `params.stationId`. TypeScript surfaces this at compile time if types are correct; enable strict mode.

7. **Station list geographic order scrambled by sorting** — TDX `/Station` endpoint returns stations in StationID order (north to south: 南港→左營). Do not sort alphabetically or by any other key. Preserve API order in all dropdowns and selectors.

## Implications for Roadmap

Research strongly suggests a four-phase structure that establishes working vertical slices in dependency order, placing security-critical foundations first.

### Phase 1: Project Scaffolding and Secure API Foundation

**Rationale:** The TDX credential management must be correct from day one — this is not a refactor-later concern. A credential leak is unrecoverable without rotating keys. Building the token manager and a single working Route Handler first proves the entire server-side security model before any UI is built. This also unblocks all subsequent phases because every query form depends on working Route Handlers.

**Delivers:** A working Next.js 16 project with App Router configured, environment variables set up, token manager (`lib/tdx-token.ts`) implemented and tested, a debug endpoint to verify TDX auth, and the stations Route Handler returning real data. No visible UI yet.

**Addresses from FEATURES.md:** Table stakes foundation — all features depend on working TDX auth.

**Avoids from PITFALLS.md:** Pitfall 1 (client_secret exposure), Pitfall 2 (token per request), Pitfall 5 (route/page conflicts), Pitfall 6 (params not awaited), Pitfall 12 (error.tsx must be 'use client').

**Research flag:** Standard patterns — well-documented Next.js Route Handler + OAuth2 proxy. No additional research phase needed.

---

### Phase 2: Core Timetable Query (By Time)

**Rationale:** The by-time timetable query (origin, destination, date, time) is the primary user flow and the highest-value feature. Implementing it first as a complete vertical slice — Route Handler + Client Component form + results display — validates the full architecture before building secondary flows. Seat availability inline requires this to exist first.

**Delivers:** A working timetable query form (station pickers, date/time input, departure/arrival toggle, swap button) that returns results with seat status badges and "去訂票" links. Full loading, empty, and error states. Mobile-responsive card layout.

**Implements from ARCHITECTURE.md:** `app/api/tdx/timetable/route.ts`, `components/ByTimeForm.tsx`, `components/TimetableResults.tsx`, station list pre-fetched server-side and passed as props.

**Addresses from FEATURES.md:** All P1 features for the by-time query flow — station picker, date/time input, timetable results, seat status inline, booking link, loading/error/empty states, swap button.

**Avoids from PITFALLS.md:** Pitfall 3 (stale timetable data — configure `revalidate: 300` and `revalidate: 60`), Pitfall 4 ('use client' boundary creep), Pitfall 9 (station order), Pitfall 10 (date timezone).

**Research flag:** May benefit from a quick research pass on TDX DailyTimetable and AvailableSeatStatusList endpoint response shapes — specifically whether seat status can be batch-fetched for all trains at once or requires per-train calls. Verify when TDX credentials are available.

---

### Phase 3: Secondary Query Flows (By Train Number, By Station)

**Rationale:** Both flows are independent of the by-time timetable and share the same architectural pattern (Route Handler + Client Component). Building them second means the pattern is already established; implementation is straightforward and low-risk. The GeneralTimetable endpoint caching pitfall (Pitfall 11) must be addressed here.

**Delivers:** Train number lookup with full stop timeline display. Station seat availability view with north/southbound direction tabs. Both include loading, empty, and error states.

**Implements from ARCHITECTURE.md:** `app/api/tdx/timetable-by-train/route.ts`, `app/api/tdx/seat-status/route.ts`, `components/ByTrainNoForm.tsx`, `components/ByStationForm.tsx`, `components/SeatStatusResults.tsx`.

**Addresses from FEATURES.md:** Train number lookup (P1), station seat availability view (P1).

**Avoids from PITFALLS.md:** Pitfall 11 (GeneralTimetable fetching 300 records — cache with `revalidate: 86400`), Pitfall 9 (station order in byStation view), Pitfall 7 (token 401 mid-session — retry logic).

**Research flag:** Standard patterns. TDX GeneralTimetable and AvailableSeatStatusList endpoint shapes need verification against actual credentials, but the caching and proxy approach is identical to Phase 2.

---

### Phase 4: UI Polish and Progressive Enhancements

**Rationale:** Polish after core function is validated. UX improvements that require more effort (visual station selector, date chips, URL state) are lower risk when the query logic is already working and tested. Deploying to Vercel and addressing production environment differences (cold start behavior) belongs here.

**Delivers:** Date quick-select chips (今天/明天/後天), visual linear station selector on mobile (v1.x feature), data freshness timestamps on seat status, URL-based query state for shareable links, Vercel deployment with environment variables configured, production smoke tests.

**Implements from ARCHITECTURE.md:** Mobile-responsive enhancements, `next/headers`-based query state management.

**Addresses from FEATURES.md:** All P2 features (date chips, visual station selector, freshness timestamp, URL state).

**Avoids from PITFALLS.md:** Pitfall 8 (Vercel stateless concern — cold start behavior validated in real deployment environment).

**Research flag:** Visual linear station selector is a custom component with no off-the-shelf solution — may warrant a focused research/design spike before implementation. All other enhancements are straightforward.

---

### Phase Ordering Rationale

- **Security before UX:** Token manager and API proxy are Phase 1 because a credential leak requires key rotation and damages trust permanently. Getting this right first means the rest of the build is low-risk.
- **Primary flow before secondary:** By-time timetable query is the core use case. Validating the complete by-time vertical slice (form → Route Handler → TDX → results with seat status) proves the architecture before building the two secondary flows.
- **Secondary flows together:** By-train-number and by-station share identical architecture and can be built in parallel or sequentially in Phase 3. They share the `SeatStatusResults` component.
- **Polish last:** URL state, date chips, and the visual station selector are enhancements that add complexity; they belong after core functionality is proven.

### Research Flags

**Needs research during planning:**
- **Phase 2:** TDX `AvailableSeatStatusList` endpoint shape — determine if seat status for all trains on a route can be fetched in one call or requires per-train lookups. This affects the join strategy in the results layer.
- **Phase 4:** Visual linear station selector — custom component design; no established library. A design spike is recommended before committing to implementation.
- **All phases:** TDX exact base URL, `$format=JSON` requirement, token TTL, and rate limits — verify empirically when TDX credentials are obtained.

**Standard patterns (skip research-phase):**
- **Phase 1:** Next.js Route Handler proxy with OAuth2 client_credentials — textbook pattern, fully documented.
- **Phase 3:** By-train and by-station flows — identical architecture to Phase 2 once patterns are established.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registry 2026-02-19. Compatibility matrices confirmed. |
| Features | MEDIUM-HIGH | Core features derived from existing Vue 2 codebase and clear domain constraints (12 stations, single corridor). UX patterns from training knowledge, not live competitor analysis. t-ex app design details unverified. |
| Architecture | HIGH | Route Handler proxy pattern is standard Next.js practice. Directory structure matches official docs. Token caching strategy is well-reasoned. |
| Pitfalls | HIGH (Next.js) / MEDIUM (TDX-specific) | Next.js pitfalls verified via official docs. TDX rate limits, exact token TTL, and API response shapes need empirical verification with real credentials. |

**Overall confidence:** HIGH for build approach; MEDIUM for TDX API specifics.

### Gaps to Address

- **TDX OAuth2 token endpoint URL:** Presumed to be `https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token`. Verify when credentials are obtained before Phase 1 completes. Low recovery cost if wrong (update one constant).

- **TDX token TTL:** Presumed ~86400s (24h). Verify from actual `expires_in` response. Token caching logic depends on this — must check before Phase 1 sign-off.

- **TDX base URL for v2 THSR endpoints:** Presumed `https://tdx.transportdata.tw/api/basic/v2/Rail/THSR`. Verify via TDX Swagger UI. Note PITFALLS.md mentions some community sources cite `/v3` — check which version applies.

- **AvailableSeatStatusList batch behavior:** Unknown whether one call returns status for all trains on a route or requires per-train requests. This affects Phase 2 implementation design. Verify during Phase 2 API integration.

- **THSR official booking deep link URL format:** Whether `https://www.thsrc.com.tw` booking page accepts URL params for train number/date pre-fill. If not, fall back to booking homepage. Verify during Phase 2.

- **t-ex app design specifics:** User referenced "mobile UI inspired by t-ex app style." Exact design details unverified. User should provide screenshots or specific elements during Phase 4 UI polish.

## Sources

### Primary (HIGH confidence)
- npm registry (`npm info`) — all package versions verified 2026-02-19
- Next.js official docs — Route Handlers, App Router caching, project structure, params-as-Promise (v15 breaking change)
- Existing Vue 2 codebase (`src/api/thrs-api.js`, `src/components/byTime.vue`, `byStation.vue`, `byTrainNo.vue`) — endpoint paths, query param names, response field names, current feature set

### Secondary (MEDIUM confidence)
- Next.js 15 release notes — GET Route Handler caching defaults, params as Promise
- Vercel docs — Vercel KV discontinued Dec 2024, replaced by Upstash Redis via Marketplace
- THSR domain knowledge — 12 stations (StationID 1=南港 to 12=左營), single north-south corridor, seat classes (標準席/商務席)
- Apple HIG / Material Design — mobile tap target minimums (44pt / 48dp)
- Transit app UX conventions — Google Maps, Japan transit app patterns (training knowledge)

### Tertiary (LOW confidence — validate before implementation)
- TDX OAuth2 token endpoint URL — community knowledge, needs empirical verification
- TDX token TTL (~86400s) — community-cited, needs verification from actual `expires_in`
- TDX API base URL for v2/v3 THSR endpoints — needs verification via TDX Swagger UI
- TDX rate limits by plan tier — unverified; test with actual account
- t-ex app design patterns — training knowledge only; user should provide live reference

---
*Research completed: 2026-02-19*
*Ready for roadmap: yes*
