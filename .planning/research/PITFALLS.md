# Pitfalls Research

**Domain:** Next.js App Router + TDX OAuth2 API + Transit query UI
**Researched:** 2026-02-19
**Confidence:** HIGH (Next.js pitfalls verified via official docs); MEDIUM (TDX-specific pitfalls from known OAuth2 patterns and API design; direct TDX docs access denied during research)

---

## Critical Pitfalls

### Pitfall 1: TDX client_secret Exposed in Client Bundle

**What goes wrong:**
The `client_secret` (and sometimes `client_id`) ends up in the browser JavaScript bundle. Anyone can open DevTools → Network tab → find the token endpoint call, or simply search the built JS for the secret string. The TDX account gets abused or banned.

**Why it happens:**
Developers copy the Vue 2 pattern (direct `axios` call from the browser to PTX/TDX) into a React component and add `'use client'`. Environment variables without the `NEXT_PUBLIC_` prefix are silently replaced with empty strings in the client bundle — they don't cause an error during build, they just don't work. Developers then add `NEXT_PUBLIC_TDX_CLIENT_SECRET` to make it "work", which ships the secret to every browser.

**How to avoid:**
- Place ALL TDX token acquisition and API calls exclusively in Next.js Route Handlers (`app/api/*/route.ts`) or Server Components.
- Store secrets as `TDX_CLIENT_ID` and `TDX_CLIENT_SECRET` (no `NEXT_PUBLIC_` prefix).
- Add `import 'server-only'` to the TDX client module to get a build-time error if it is ever imported in a Client Component.
- Never call TDX directly from any component marked `'use client'`.

**Warning signs:**
- `NEXT_PUBLIC_TDX_CLIENT_SECRET` appears in `.env` or `.env.local`.
- A `fetch('https://tdx.transportdata.tw/...')` call inside a `'use client'` file.
- Network tab in the browser shows direct calls to `tdx.transportdata.tw`.

**Phase to address:** API Integration phase (token management setup)

---

### Pitfall 2: TDX OAuth2 Token Fetched on Every Request (No Caching)

**What goes wrong:**
Each user query triggers a new `POST https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token` call. TDX issues tokens with a ~24-hour expiry (confirmed by community usage; exact value may vary). Fetching a new token per request wastes time (~200–400ms round-trip to TDX auth server), wastes the token quota, and risks hitting rate limits on the auth endpoint itself.

**Why it happens:**
The straightforward implementation fetches a token, uses it, and discards it. Module-level variable caching seems to work in development but is silently broken in serverless environments (Vercel) because each function invocation may get a fresh module scope — the cached value is lost between requests.

**How to avoid:**
- Use an in-memory singleton with expiry check for the token: store `{ token, expiresAt }` at module scope and re-fetch only when `Date.now() >= expiresAt - 60_000` (60-second buffer).
- On Vercel, accept that module-scope cache has warm-function reuse but is not guaranteed. This is acceptable for a personal/low-traffic tool — the worst case is an extra token fetch per cold start.
- Do NOT store the token in `localStorage`, cookies, or pass it to the client in any form.
- Use `next.revalidate` or `unstable_cache` for TDX data fetches (timetable, stations) that don't change frequently, rather than caching the token itself at the HTTP level.

**Warning signs:**
- Every API request in server logs shows a preceding token fetch.
- Response times are 400ms+ even for cached-data endpoints.
- TDX auth endpoint appears in server logs more than once per minute under normal usage.

**Phase to address:** API Integration phase (token caching module)

---

### Pitfall 3: Next.js Data Cache Serving Stale Timetable Data

**What goes wrong:**
As of Next.js 15, `fetch` in Route Handlers is **not** cached by default (changed from Next.js 13/14 where it was cached by default). However, timetable data fetched in Server Components during static rendering IS cached indefinitely until redeployment or explicit revalidation. Users query for today's trains and get yesterday's (or a week-old) cached response.

**Why it happens:**
Developers see "App Router caches fetch responses" in documentation and either:
(a) Assume Route Handlers also cache — they don't by default in Next.js 15.
(b) Accidentally make a Server Component that fetches timetable data at build time, caching it as static.

For the seat availability endpoint (`/AvailableSeatStatusList`), data changes every few minutes. For timetables, data is date-specific — today's timetable for 2026-03-01 is only valid on that date.

**How to avoid:**
- For seat availability: use `{ cache: 'no-store' }` in all fetch calls from Route Handlers, or add `export const dynamic = 'force-dynamic'` to the route segment.
- For daily timetable: add `{ next: { revalidate: 3600 } }` (1-hour revalidation) — timetables don't change intra-day.
- For station list: `{ next: { revalidate: 86400 } }` (24-hour) — stations never change.
- Never fetch the timetable in a component that can be statically rendered at build time.
- Always include the `TrainDate` as a query param in the cache key so 2026-03-01 and 2026-03-02 are separate cache entries.

**Warning signs:**
- Seat availability shows "Available" for trains that are clearly sold out.
- Query results for today show yesterday's train times.
- Build logs show static route generation for the timetable page.

**Phase to address:** API Integration phase (cache configuration per endpoint)

---

### Pitfall 4: "use client" Boundary Creep — Everything Becomes a Client Component

**What goes wrong:**
The entire app ends up with `'use client'` at the top of almost every file. All data fetching moves to `useEffect` + `useState` (like the old Vue 2/PTX pattern). Server Components lose their purpose: no server-side data fetching, no secrets protection, no reduced JS bundle.

**Why it happens:**
Any hook (`useState`, `useEffect`) or any event handler (`onClick`, `onChange`) requires `'use client'`. Form controls for origin/destination station, date picker, and submit button all need interactivity. Developers put `'use client'` on the parent page that also does data fetching, which makes the data fetching client-side.

**How to avoid:**
- Separate concerns: one Server Component fetches and passes data as props; one Client Component handles user interaction and state.
- Station list (static data) should be fetched in a Server Component or at the Route Handler level and passed to the `<StationSelect>` Client Component as an initial prop.
- The query form (`StationForm`) is a Client Component. The results table can be a Server Component if rendered after a navigation/URL change.
- Pattern for this app: use URL search params (`?from=NANgang&to=Zuoying&date=2026-03-01`) as the state source of truth. The page Server Component reads search params and fetches data. The form Client Component updates the URL.

**Warning signs:**
- `'use client'` in `app/page.tsx` or `app/layout.tsx`.
- `useEffect(() => { fetch('/api/stations') }, [])` in a component that could be a Server Component.
- TDX API calls happening in the browser (visible in DevTools Network tab).

**Phase to address:** UI/Architecture phase (component boundary design)

---

### Pitfall 5: Route Handler Conflicts with Page Files (route.ts + page.tsx in Same Segment)

**What goes wrong:**
Build error: `Conflicting route segments`. A `route.ts` file and a `page.tsx` file cannot exist in the same directory segment. Developers put `app/api/timetable/route.ts` and then try to add `app/api/timetable/page.tsx`, or accidentally mix them.

**Why it happens:**
Misunderstanding of App Router conventions. Route Handlers live in `app/api/` by convention, but technically any segment can have a `route.ts` OR a `page.tsx`, not both.

**How to avoid:**
- Keep all Route Handlers under `app/api/` prefix.
- Pages go directly under `app/` (e.g., `app/timetable/page.tsx`).
- Never create `route.ts` and `page.tsx` in the same folder.

**Warning signs:**
- Build error: "A route and a page can not be created at the same level".
- `app/timetable/route.ts` exists alongside `app/timetable/page.tsx`.

**Phase to address:** Project setup phase (folder structure decision)

---

### Pitfall 6: params Must Be Awaited in Next.js 15 (Breaking Change)

**What goes wrong:**
Runtime error: `params.stationId` returns a Promise, not a string. Code that accesses route params synchronously (e.g., `const { stationId } = params`) breaks in Next.js 15 where `params` is now a Promise.

**Why it happens:**
Next.js 15 changed `params` and `searchParams` to be Promises. Code written for Next.js 13/14 or tutorials targeting those versions accesses params synchronously. This is a breaking change with a codemod available but easily missed.

**How to avoid:**
- Always `await params`: `const { stationId } = await params`
- In Route Handlers: `const { stationId } = await context.params`
- Use TypeScript — it will surface the type mismatch at compile time.

**Warning signs:**
- `params.stationId` returns `[object Promise]` in the UI.
- Tutorials being followed show `{ params }: { params: { id: string } }` without `await`.
- Using Next.js 15 but following Next.js 13/14 tutorials (very common).

**Phase to address:** Project setup phase (TypeScript types, initial page structure)

---

### Pitfall 7: TDX API Returns 401 Mid-Session (Token Expiry Not Handled)

**What goes wrong:**
A user leaves the app open. The token expires. Their next query fails with a raw 401 error shown to the user — either a white screen, an unhandled promise rejection, or the JSON error body rendered as UI.

**Why it happens:**
The token module caches a valid token and returns it. If the server process has been running long enough (token TTL ~24h on TDX), the cached token expires. The fetch to TDX returns 401. The proxy route handler doesn't detect the 401 and propagate a user-friendly error.

**How to avoid:**
- In the Route Handler, check the TDX response status. If 401, clear the token cache and retry the token fetch once before failing.
- Return structured error responses from Route Handlers: `{ error: 'TDX_UNAUTHORIZED', message: '...' }` with HTTP 502.
- The client should show a user-friendly "查詢失敗，請再試一次" message, not a raw error.
- Add a 60-second safety buffer when checking token expiry: treat the token as expired 60 seconds before its actual `expires_in`.

**Warning signs:**
- Intermittent 401 errors that resolve on page refresh.
- Server logs show TDX returning 401 while the token cache is non-empty.
- No retry logic in the token acquisition function.

**Phase to address:** API Integration phase (error handling and retry)

---

### Pitfall 8: Vercel Serverless — No Persistent In-Memory State Between Invocations

**What goes wrong:**
The token cache module uses a module-level variable. In development (`next dev`), this works perfectly — the server process is persistent. On Vercel, cold starts reset module scope. The token gets re-fetched more often than expected, but more critically: any other in-memory state (request counters, debounce state) is also reset.

**Why it happens:**
Developers test locally where the Node.js process persists. Vercel's serverless functions can scale to zero and restart between requests. Module-level variables ARE reused between invocations of the same warm function instance, but not across cold starts or different instances.

**How to avoid:**
- Accept this for token caching — it only adds one extra TDX auth request per cold start, which is acceptable.
- Do NOT rely on in-memory state for anything that must be consistent across invocations (counters, rate limit tracking, user sessions).
- If persistent state is ever needed, use Vercel KV or a Redis-compatible store, not module globals.
- This project's scale (personal tool) means cold starts are rare and the extra token fetch is harmless.

**Warning signs:**
- "It works locally but not on Vercel" for anything involving cached state.
- Server logs on Vercel show token being re-fetched unexpectedly.

**Phase to address:** Deployment phase (Vercel environment configuration)

---

### Pitfall 9: THSR Station Order and Direction Logic

**What goes wrong:**
The seat availability data uses `Direction: 0` (southbound, 南下) and `Direction: 1` (northbound, 北上). The station IDs run from `1` (Nangang/南港) to `12` (Zuoying/左營). Code that assumes "higher ID = further south" is correct for THSR, but code that assumes alphabetical ordering of `StationName.Zh_tw` gets random order. The original Vue 2 code filters by `Direction` correctly, but sorts stations in the dropdown by the order they come from the API, which happens to be geographic north-to-south.

**Why it happens:**
The TDX `/Station` endpoint returns stations in a specific order (by StationID, north to south). If a sort is applied to the station dropdown that re-orders by name (alphabetical) or ID (numeric), users see a confusing non-geographic order.

**How to avoid:**
- Do NOT sort the station list when displaying in the origin/destination dropdowns. The API order (StationID ascending = Nangang → Zuoying) is the natural geographic order.
- For seat availability display, always separate by `Direction` (0 = southbound, 1 = northbound) before rendering.
- Station IDs: `1=南港, 2=台北, 3=板橋, 4=桃園, 5=新竹, 6=苗栗, 7=台中, 8=彰化, 9=雲林, 10=嘉義, 11=台南, 12=左營` — hardcode these as a fallback or validation reference.

**Warning signs:**
- Station dropdown shows alphabetical order (e.g., 台中 before 台北).
- Northbound and southbound data shown without separation.
- Origin and destination can be set to the same station without validation.

**Phase to address:** UI/query form phase

---

### Pitfall 10: Date Handling — TrainDate Format and Taiwan Timezone

**What goes wrong:**
The TDX API expects `TrainDate` in `YYYY-MM-DD` (Gregorian calendar, not ROC calendar). If `new Date()` is used naively in a server-side context, the server's timezone (UTC) vs. Taiwan time (UTC+8) can cause the date to be off by one day late at night. A user querying at 23:30 Taiwan time gets the next day's timetable instead of today's because the server is in UTC (23:30 UTC+8 = 15:30 UTC, so this specific example is safe, but 00:00–07:59 UTC+8 = 16:00–23:59 previous day UTC).

**Why it happens:**
`new Date().toISOString().split('T')[0]` returns UTC date. Taiwan is UTC+8. Between midnight and 08:00 Taiwan time, `toISOString()` returns yesterday's date.

**How to avoid:**
- Always format dates in Taiwan local time (Asia/Taipei, UTC+8).
- Use: `new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date())` — returns `YYYY-MM-DD` in Taiwan time.
- Or use a date library (date-fns, dayjs) with timezone support.
- Accept the date from the user's form input (the user's browser knows their local time) and validate the format on the server.

**Warning signs:**
- Queries submitted after midnight Taiwan time return wrong-day timetables.
- `toISOString()` used anywhere in date formatting for API calls.
- Server logs show UTC date in TrainDate when the user is in a UTC+8 timezone.

**Phase to address:** API Integration phase (date utilities)

---

### Pitfall 11: GeneralTimetable Endpoint Fetching 300 Records on Every Train Number Lookup

**What goes wrong:**
The original Vue 2 code calls `getGeneralTimetable()` (top=300) on component mount to populate the train number autocomplete options. This fetches the entire timetable at page load — a large payload — just to populate a dropdown. In Next.js, if this call is made in a Route Handler per request, it adds significant latency.

**Why it happens:**
The original design used `/GeneralTimetable?top=300` to pre-fetch all train numbers for the autocomplete feature. This made sense as a one-time Vuex store load in the SPA. In Next.js App Router, if naively ported as a server-side fetch per request, it runs on every page render.

**How to avoid:**
- Cache the general timetable (300 records) aggressively: `{ next: { revalidate: 86400 } }` — this data changes rarely (only when THSR updates the schedule).
- Alternative: fetch train numbers once and store in Next.js Data Cache, serving from cache for all subsequent requests.
- For the train number search, consider fetching the full list once in the Server Component that renders the search page, pass as a prop to the Client Component for local filtering — no per-keystroke server calls.

**Warning signs:**
- Slow initial page load for the train number search page.
- Server logs show `/GeneralTimetable?top=300` being called on every user query.
- No `revalidate` or `cache` option on the GeneralTimetable fetch.

**Phase to address:** API Integration phase (caching strategy for static datasets)

---

### Pitfall 12: error.tsx Must Be a Client Component

**What goes wrong:**
Adding `async` to `error.tsx` or trying to do server-side data fetching inside it causes a build error or silent failure. Error boundaries in Next.js App Router must be Client Components (`'use client'`).

**Why it happens:**
Developers see that pages and layouts can be async Server Components and apply the same pattern to `error.tsx`. The error boundary uses `useEffect` and `reset()` callbacks that require client-side execution.

**How to avoid:**
- Always add `'use client'` as the first line of `error.tsx` and `global-error.tsx`.
- `global-error.tsx` must also define its own `<html>` and `<body>` tags.
- Keep error UI simple — no data fetching, just display the error and offer a "Try again" button.

**Warning signs:**
- Build error mentioning that error boundaries cannot be async.
- `error.tsx` missing `'use client'` directive.

**Phase to address:** Project setup phase (initial app structure)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Fetch TDX directly from client (skip proxy) | Faster to build | client_secret exposed; CORS error; security breach | Never |
| No token caching (fetch token per request) | Simpler code | ~300ms added to every query; TDX auth rate-limit risk | Development only |
| `cache: 'no-store'` on all fetches | Always fresh data | No performance benefit of caching; higher TDX API call count | Seat availability only (real-time data) |
| Copy byTime.vue pattern: `new Date('1970/01/01 ' + time)` for time diff | Works correctly for HH:MM strings | Fragile; breaks if time format changes | Acceptable for transit times if format is guaranteed |
| Use `any` TypeScript type for TDX API responses | Fast to write | No autocomplete; runtime errors from wrong field names | Never in new code |
| No Suspense boundaries (await all data before render) | Simpler component tree | Slow initial render; no partial loading states on mobile | Personal tool MVP only |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| TDX OAuth2 | Call `tdx.transportdata.tw/auth/.../token` from browser | Only call from server-side Route Handler; use `server-only` guard |
| TDX OAuth2 | Use `NEXT_PUBLIC_TDX_CLIENT_SECRET` env var | Use `TDX_CLIENT_SECRET` (no NEXT_PUBLIC prefix) |
| TDX OAuth2 | Re-fetch token on every request | Cache token with expiry check; re-fetch only when expired |
| TDX THSR API | Use old PTX base URL (`ptx.transportdata.tw`) | Use new TDX URL: `tdx.transportdata.tw/api/basic/v3/Rail/THSR` |
| TDX THSR API | Ignore `$format=JSON` query param | TDX may default to OData format; always specify `$format=JSON` |
| TDX THSR API | No error handling for 429 (rate limit) | Implement retry with exponential backoff; cache aggressively |
| Next.js Route Handler | Expect GET handlers to be cached (like Next.js 13/14) | In Next.js 15, GET Route Handlers are dynamic (not cached) by default |
| Next.js params | Access `params.id` synchronously | In Next.js 15, `const { id } = await params` |
| Next.js env vars | Use `process.env.SECRET` in Client Component | Silently becomes empty string; use `server-only` to guard |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| GeneralTimetable (300 records) fetched per request | 1–2s load time on train number search | Cache with 24h revalidation; fetch once per deployment | Every user visit without caching |
| No Suspense — all fetches sequential | Page blank until slowest TDX call completes | Use `Promise.all` for parallel fetches; Suspense for streaming | Every query on slow connections |
| Station list fetched per query | Extra 100ms per query | Cache station list with 24h revalidation or fetch at layout level | Every query without caching |
| Client-side filtering of 300 train numbers per keystroke | Input lag on low-end mobile | Filter client-side from in-memory array (not per-keystroke API call) | Low-end Android devices |
| Token refetch on every Vercel cold start | First request ~400ms slower than warm | Accept as unavoidable; add token warm-up if needed | Every cold start |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `NEXT_PUBLIC_TDX_CLIENT_SECRET` in env | TDX account hijack, banned account | Never use NEXT_PUBLIC prefix for secrets |
| TDX token returned in API response to client | Token can be extracted and used directly | Route Handler returns only the data, never the token |
| No input validation on `TrainDate` parameter | Arbitrary dates sent to TDX; potential SSRF if URL is constructed naively | Validate date format with regex `^\d{4}-\d{2}-\d{2}$` before passing to TDX |
| No validation on `StationID` parameter | Invalid station IDs sent to TDX; unnecessary API calls | Validate against known station ID list (1–12 for THSR) |
| Secrets in git history | TDX credentials leaked permanently | Use `.env.local` (gitignored); never commit `.env` with real values |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state while querying TDX | User taps "查詢" twice; double requests; confused if app is working | Show loading spinner immediately on submit; disable submit button during fetch |
| No empty state when no trains found | Blank area below form; user thinks query failed | Show "查無班次" message when timetable array is empty |
| Same origin and destination allowed | User submits form, gets confusing API error or empty result | Validate and show "起訖站不可相同" before submit (already in original Vue 2) |
| Date picker allows past dates | User queries yesterday's timetable; gets results or empty | Default to today; allow past dates but show a subtle warning |
| Seat availability shows raw API status strings | "Available", "Limited", "Full" shown in English | Map to Chinese: 尚有座位, 座位有限, 已無座位 (already done in Vue 2 filters) |
| No "book now" link visible on mobile | User finds a train but can't easily book | Show a prominent "前往訂票" button/link per train result on mobile |
| Station list order scrambled by sorting | Users can't find stations by geographic position | Preserve API order (north to south); do not alphabetically sort |

---

## "Looks Done But Isn't" Checklist

- [ ] **TDX Token Security:** Token is never returned to the client, only TDX data. Verify: search client bundle for `tdx.transportdata.tw/auth`; should not appear.
- [ ] **CORS Proxy:** Browser never calls `tdx.transportdata.tw` directly. Verify: DevTools → Network tab, filter for `tdx.transportdata.tw` — should show zero requests.
- [ ] **Token Caching:** Token module has expiry check and re-fetch logic. Verify: check token module for `expiresAt` check before fetching.
- [ ] **Date Timezone:** Taiwan local date used, not UTC. Verify: test query submitted at 00:30 Taiwan time shows correct date.
- [ ] **Station Order:** Station dropdown lists north-to-south (南港 first, 左營 last). Verify: open station selector, confirm geographic order.
- [ ] **Seat Status Mapping:** `Available/Limited/Full` mapped to Chinese. Verify: byStation page shows Chinese text, not English API values.
- [ ] **Error States:** All three query types show user-friendly error when TDX fails, not raw JSON or blank screen.
- [ ] **Empty States:** Each query type shows a "no results" message when TDX returns an empty array.
- [ ] **Mobile Touch Targets:** Station dropdowns and date picker usable on 375px-wide screen without horizontal scroll.
- [ ] **params Awaited:** All Route Handlers and pages using dynamic params use `await params`. Verify: TypeScript compilation passes without `any` casts on params.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| client_secret in git history | HIGH | Rotate TDX credentials immediately; `git filter-repo` or contact TDX support; audit all deployments |
| Wrong caching on timetable | LOW | Add `{ cache: 'no-store' }` or `{ next: { revalidate: N } }` to fetch call; redeploy |
| params not awaited (Next.js 15) | LOW | Add `await` before `params`; TypeScript will show all occurrences |
| Everything is Client Component | MEDIUM | Identify data-fetching components; move fetches to Server Components or Route Handlers; requires component restructure |
| Date timezone bug in production | MEDIUM | Add `Intl.DateTimeFormat` with Asia/Taipei timezone; deploy fix; stale cache clears on redeploy |
| GeneralTimetable performance | LOW | Add `revalidate: 86400` to the fetch; no structural change needed |
| PTX base URL (old) used | LOW | Update `baseURL` in TDX client module to new TDX host |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| client_secret exposed | API Integration (token module) | Build: search bundle for secret; DevTools: no direct TDX calls from browser |
| Token fetched per request | API Integration (token caching) | Server logs: token fetches < 1 per minute under normal load |
| Stale timetable data | API Integration (cache config) | Test: seat data refreshes after a few minutes; timetable correct for queried date |
| use client boundary creep | Architecture / UI phase | Code review: no TDX fetch calls inside 'use client' files |
| Route Handler + page conflict | Project Setup | Build: no conflicting segment errors |
| params not awaited | Project Setup (TypeScript config) | TypeScript compile: zero errors; no `any` casts on params |
| Token 401 mid-session | API Integration (error handling) | Test: simulate expired token; verify graceful retry and user-friendly error |
| Vercel stateless concern | Deployment phase | Load test: verify first cold-start request succeeds (token re-fetched) |
| Station order wrong | UI / Query Form phase | Visual test: station dropdown shows 南港→左營 order |
| Date timezone bug | API Integration (date utilities) | Test at simulated UTC midnight: verify Taiwan date is used |
| GeneralTimetable performance | API Integration (caching) | Performance test: train search page loads in < 500ms on second request |
| error.tsx missing 'use client' | Project Setup | Build: no error boundary compilation errors |

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs (`nextjs.org/docs`) — caching mechanics, Server vs Client Components, Route Handlers, error handling, params as Promise (Next.js 15 change) — fetched 2026-02-19
- Next.js 15 release notes — `params` is now a Promise; GET Route Handlers default to dynamic

### Secondary (MEDIUM confidence)
- TDX API knowledge: OAuth2 `client_credentials` flow with `tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token` endpoint — based on standard OAuth2 patterns and community knowledge of TDX migration from PTX. Direct TDX documentation access was denied during this research session.
- THSR station IDs and geographic order (1–12, Nangang to Zuoying) — inferred from existing Vue 2 codebase analysis and known THSR geography.
- TDX token TTL (~24 hours) — community knowledge from Taiwanese developer communities; needs verification when TDX account is obtained.

### Tertiary (LOW confidence — validate when TDX account is available)
- TDX exact rate limits per plan tier (free vs. paid) — unverified; test with actual account
- TDX `$format=JSON` requirement — verify against actual API responses
- Exact token endpoint URL path — verify by examining TDX API documentation after account creation

---

*Pitfalls research for: Next.js App Router + TDX OAuth2 THSR query rewrite*
*Researched: 2026-02-19*
