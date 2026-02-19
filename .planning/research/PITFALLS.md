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

## v2.0 UX Enhancement Pitfalls

The following pitfalls are specific to the v2.0 milestone: round-trip query, saved favorite routes (localStorage), and shareable query links (URL state). They apply to the existing Next.js 16 / React 19 / React Query v5 codebase.

---

### Pitfall 13: useSearchParams() Crashes Production Build Without Suspense Boundary

**What goes wrong:**
The production build (`next build`) fails with:
```
Error: useSearchParams() should be wrapped in a suspense boundary at page "/"
```
The app works perfectly in `next dev` because development mode renders routes on-demand and does not enforce the Suspense requirement. The first time the team runs `next build` or deploys to Vercel, the build breaks.

**Why it happens:**
`useSearchParams()` makes the Client Component tree "dynamic" — its value is unknown at build time. When used in a statically-rendered page without a `<Suspense>` boundary, Next.js cannot prerender the page shell. In development, routes render on-demand so this constraint is never checked. In production builds, static prerendering is attempted and the missing boundary is a hard error.

The existing `page.tsx` is `'use client'` — if `useSearchParams()` is added directly to this component (or any component it renders), the entire page falls into this trap.

**How to avoid:**
Isolate `useSearchParams()` in a dedicated child component wrapped in `<Suspense>`:

```tsx
// app/page.tsx — stays 'use client', adds Suspense wrapper
import { Suspense } from 'react'
import { QueryFormWithUrl } from '@/components/query-form-with-url'

export default function Home() {
  return (
    <main>
      <Suspense fallback={<QueryFormSkeleton />}>
        <QueryFormWithUrl />
      </Suspense>
    </main>
  )
}

// query-form-with-url.tsx — reads URL, MUST be in Suspense
'use client'
import { useSearchParams } from 'next/navigation'

export function QueryFormWithUrl() {
  const searchParams = useSearchParams()
  // initialize form state from URL here
}
```

The `fallback` prop prevents blank flash on initial load — use a static form skeleton, not `null`.

**Warning signs:**
- `useSearchParams()` imported directly in `page.tsx` without a Suspense wrapper.
- `next build` succeeds locally only if the developer never ran a production build.
- `next dev` shows no errors but Vercel deployment fails.

**Phase to address:** Phase 3 — Shareable Query Links (URL state feature)

---

### Pitfall 14: localStorage Read During SSR Causes Hydration Mismatch

**What goes wrong:**
The browser throws:
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```
Saved favorites render on the server as an empty list (localStorage unavailable), then on the client they immediately render with the stored data. React's hydration check detects the mismatch and throws.

**Why it happens:**
Even though `page.tsx` is `'use client'`, Next.js still prerendering the component HTML on the server during the initial request. The server has no `window` or `localStorage`. Code like:

```tsx
// WRONG — crashes on server
const [favorites, setFavorites] = useState<Route[]>(
  JSON.parse(localStorage.getItem('favorites') ?? '[]')
)
```

...fails because `localStorage` is not defined in the server environment.

The existing app already solves this for dates using `useState<Date>(() => getTaiwanToday())` — the same lazy initializer pattern is required for localStorage, but with an additional mounted-state guard.

**How to avoid:**
Use a two-phase initialization pattern. Initialize with empty/null, populate after mount:

```tsx
'use client'
import { useState, useEffect } from 'react'

interface SavedRoute { origin: string; destination: string }

export function useFavoriteRoutes() {
  // Phase 1: server and initial client render both get []
  const [favorites, setFavorites] = useState<SavedRoute[]>([])
  // Phase 2: after mount, populate from localStorage
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('thsr-favorites')
      if (stored) setFavorites(JSON.parse(stored))
    } catch {
      // Corrupted data — silently reset
      localStorage.removeItem('thsr-favorites')
    }
    setHydrated(true)
  }, [])

  return { favorites, hydrated, setFavorites }
}
```

The `hydrated` flag prevents rendering the favorites list before localStorage data is loaded (avoids list appearing, disappearing, then reappearing).

Do NOT use `suppressHydrationWarning` as a fix — it masks the symptom without resolving the cause and leads to flash of incorrect content.

**Warning signs:**
- `localStorage` accessed in a `useState` initializer directly (not lazy).
- `typeof window !== 'undefined'` check inline during render (still fires during SSR HTML generation).
- Favorites list visibly flashes from populated to empty on first load.

**Phase to address:** Phase 2 — Saved Favorite Routes (localStorage feature)

---

### Pitfall 15: localStorage JSON.parse Silently Fails on Corrupted Data

**What goes wrong:**
A user's `thsr-favorites` key in localStorage contains data written by an older version of the app (schema changed) or was manually edited. `JSON.parse` throws a `SyntaxError`. The uncaught exception crashes the entire React component tree, resulting in a blank page.

**Why it happens:**
localStorage data is user-controlled — it persists across app versions and can be corrupted by browser extensions, manual edits, or schema migrations between releases. A future v2.1 that changes the saved route schema (e.g., adds `label` field) will parse v2.0 data that is structurally valid JSON but wrong shape.

**How to avoid:**
Always wrap localStorage operations in try-catch and validate the parsed shape:

```tsx
function loadFavorites(): SavedRoute[] {
  try {
    const raw = localStorage.getItem('thsr-favorites')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // Validate shape — not just parse
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r): r is SavedRoute =>
        typeof r.origin === 'string' && typeof r.destination === 'string'
    )
  } catch {
    localStorage.removeItem('thsr-favorites')  // Clear corrupted data
    return []
  }
}
```

Also version the storage key: `thsr-favorites-v2` so that a v3 schema change does not conflict with v2 data.

**Warning signs:**
- `JSON.parse(localStorage.getItem('thsr-favorites') ?? '[]')` without try-catch.
- No shape validation after parsing (just trusting the array structure).
- Storage key has no version suffix (`thsr-favorites` vs `thsr-favorites-v2`).

**Phase to address:** Phase 2 — Saved Favorite Routes (localStorage feature)

---

### Pitfall 16: Return Date Validation Enforced in the Wrong Layer

**What goes wrong:**
The return date picker appears to accept any date (including dates before the outbound date). Users submit a round-trip query where return date < outbound date. The TDX API either returns confusing results (it is a different day's query) or returns an empty result, with no indication of what went wrong.

**Why it happens:**
Date validation for "return >= outbound" is often applied as an API-level check only, or is applied in the submit handler but the date picker UI still allows selection of invalid dates — the user sees the error only after clicking "查詢".

**Why single-layer validation is insufficient:**
- API-only: Poor UX — error appears after network round-trip.
- Submit-handler-only: User can set an invalid return date without immediate feedback.
- Calendar UI-only: Easy to bypass programmatically.

**How to avoid:**
Apply validation at two layers:

1. **Calendar `disabled` prop** (UI layer — prevents selection):
```tsx
<Calendar
  mode="single"
  selected={returnDate}
  onSelect={setReturnDate}
  disabled={(date) => date < outboundDate}  // Blocks past dates relative to outbound
/>
```

2. **Submit handler guard** (logic layer — prevents API call):
```tsx
if (returnDate < outboundDate) {
  // This should never happen if UI validation works, but defend anyway
  return
}
```

Auto-correct the return date when the outbound date changes:
```tsx
// When outbound date changes, if return date is now before it, advance it
useEffect(() => {
  if (returnDate < outboundDate) {
    setReturnDate(outboundDate)  // or outboundDate + 1 day
  }
}, [outboundDate])
```

**Warning signs:**
- `Calendar` component has no `disabled` prop for the return date picker.
- Return date can be set to any date regardless of outbound date selection.
- No `useEffect` to auto-correct return date when outbound date changes.

**Phase to address:** Phase 1 — Round-Trip Query (form validation)

---

### Pitfall 17: Two React Query Calls With Overlapping queryKeys Cause Unexpected Cache Sharing

**What goes wrong:**
The outbound query and return query use the same query key shape because the code copies the existing single-trip pattern:

```tsx
// WRONG — both queries share cache if params happen to match
const outbound = useQuery({
  queryKey: ['trains', { origin, destination, date: outboundDate }],
  ...
})
const returnTrip = useQuery({
  queryKey: ['trains', { origin: destination, destination: origin, date: returnDate }],
  ...
})
```

This is actually correct structure (reversed origin/destination), but if origin and destination happen to be the same (defensive case) or if the query key serialization changes, the two queries share a cache entry. More practically: if the user submits a round-trip for the same date in both directions, React Query will correctly deduplicate the network call but both queries share the same result data — which may be unexpected.

**Why it happens:**
React Query deduplicates queries with identical `queryKey` values within the same stale window. For round-trip queries, the keys should always differ (reversed stations, or different date), but developers may not verify this assumption.

**How to avoid:**
Add a `direction` discriminator to the query key to guarantee uniqueness:

```tsx
const outbound = useQuery({
  queryKey: ['trains', 'outbound', { origin, destination, date: outboundDate }],
  queryFn: () => fetchTrains({ origin, destination, date: outboundDate }),
  enabled: !!outboundParams,
})
const returnTrip = useQuery({
  queryKey: ['trains', 'return', { origin: destination, destination: origin, date: returnDate }],
  queryFn: () => fetchTrains({ origin: destination, destination: origin, date: returnDate }),
  enabled: !!returnParams,
})
```

The existing code already uses `enabled: !!params` correctly. Maintain this pattern for both queries — neither should fire until both outbound AND return params are submitted.

Two parallel `useQuery` calls do NOT cause race conditions — React Query handles concurrency correctly. The concern is only about unintended cache sharing, not execution order.

**Warning signs:**
- Round-trip query keys are identical when `outboundDate === returnDate` AND origin/destination happen to be swapped symmetrically.
- `queryKey: ['trains', params]` used for both queries without a direction discriminator.
- React Query DevTools shows only one cache entry when two should exist.

**Phase to address:** Phase 1 — Round-Trip Query (React Query integration)

---

### Pitfall 18: Mobile Two-Panel Layout Causes Scroll Confusion

**What goes wrong:**
The round-trip results page on mobile shows two result panels stacked vertically. Each panel has its own list of trains. Without clear visual separation and headings, users scroll to the bottom of the outbound results and don't realize there is a second return-trip panel below. Alternatively, both panels are given `overflow-y: scroll` which creates scroll traps on iOS (body scroll and inner scroll conflict).

**Why it happens:**
The existing app uses a simple single-column layout (`max-w-2xl`). Adding a second results panel by doubling the component below the form makes the page very long on mobile — but there is no visual affordance telling the user where the outbound results end and return results begin.

**How to avoid:**
On mobile, use stacked panels with sticky section headers, not independent scroll areas:

```tsx
{/* Mobile: full-width stacked, no inner scroll (body scrolls) */}
<div className="md:hidden space-y-6">
  <section>
    <h2 className="sticky top-0 bg-background py-2 font-semibold border-b">
      去程 · {format(outboundDate, 'MM/dd')}
    </h2>
    <TrainList params={outboundParams} />
  </section>
  <section>
    <h2 className="sticky top-0 bg-background py-2 font-semibold border-b">
      回程 · {format(returnDate, 'MM/dd')}
    </h2>
    <TrainList params={returnParams} />
  </section>
</div>

{/* Desktop: side-by-side columns */}
<div className="hidden md:grid md:grid-cols-2 md:gap-4">
  <div>
    <h2>去程</h2>
    <TrainList params={outboundParams} />
  </div>
  <div>
    <h2>回程</h2>
    <TrainList params={returnParams} />
  </div>
</div>
```

Do NOT use `overflow-y: scroll` with fixed height on mobile panels — this creates iOS scroll traps. Let the page body scroll naturally.

**Warning signs:**
- Two `<div className="overflow-y-scroll h-[400px]">` containers on mobile.
- No sticky or visible section heading separating outbound and return results.
- User testing shows confusion about which results panel is which direction.

**Phase to address:** Phase 1 — Round-Trip Query (mobile layout)

---

### Pitfall 19: URL State Updated With router.push() Adds Unwanted History Entries

**What goes wrong:**
Every time the user changes a form field (origin, destination, date), `router.push()` is called to keep the URL in sync. On mobile, pressing the browser Back button repeatedly cycles through every intermediate form state instead of navigating away from the page. The user gets stuck in a Back-button loop.

**Why it happens:**
`router.push()` adds a new entry to the browser history stack. If the URL is updated on every input change (not just on form submit), a 3-field form generates 3 history entries per query. Pressing Back does not leave the page — it restores the previous field value.

**How to avoid:**
Use `router.replace()` for intermediate form state updates (replaces current history entry, no Back-button loop) and `router.push()` only on explicit form submission (so the user CAN go Back to the pre-query URL):

```tsx
// On field change — use replace (no history entry)
const handleOriginChange = (value: string) => {
  setOrigin(value)
  const params = new URLSearchParams(searchParams.toString())
  params.set('from', value)
  router.replace(`?${params.toString()}`)
}

// On form submit — use push (creates one history entry)
const handleSubmit = () => {
  router.push(`?from=${origin}&to=${destination}&date=${date}`)
}
```

Alternatively, use `window.history.replaceState` directly for field changes — Next.js App Router monkey-patches `pushState`/`replaceState`, so `useSearchParams()` re-renders correctly when `replaceState` is called.

**Warning signs:**
- `router.push()` called in an `onChange` handler (not in form `onSubmit`).
- Pressing Back twice in a row navigates backwards through the same page rather than leaving it.
- History stack grows by 3+ entries per single query submission.

**Phase to address:** Phase 3 — Shareable Query Links (URL state management)

---

### Pitfall 20: URL Encoding of Station IDs Breaks Query Parsing

**What goes wrong:**
Station IDs in this app are numeric strings (`"1"` through `"12"`), so encoding is not an issue for station IDs specifically. However, if the date format or future label fields contain characters like `/`, `+`, `=`, or spaces (e.g., a saved route label "台北→台中"), `URLSearchParams.toString()` will percent-encode them but `searchParams.get()` may not decode them consistently — especially if the URL is copy-pasted into messaging apps that alter percent-encoding.

More concretely: using `encodeURIComponent` manually on values that are then passed to `URLSearchParams.set()` causes double-encoding (`%2526` instead of `%26`).

**Why it happens:**
Mixing manual `encodeURIComponent()` with `URLSearchParams` API — `URLSearchParams` already handles encoding internally. Double-encoding produces URLs that look valid but parse incorrectly when decoded.

**How to avoid:**
Use `URLSearchParams` exclusively for building and reading URL parameters — never mix with manual `encodeURIComponent`:

```tsx
// CORRECT: URLSearchParams handles encoding
const params = new URLSearchParams()
params.set('from', origin)      // "1" — no encoding needed
params.set('to', destination)   // "12"
params.set('date', '2026-03-01')  // '-' is safe, no encoding needed
const url = `?${params.toString()}`

// WRONG: double-encoding
const url = `?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}`
// Then later reading with searchParams.get('from') causes issues if re-encoded
```

For shareable URLs, test the full round-trip: generate URL → copy to new tab → verify all form fields restore correctly.

**Warning signs:**
- `encodeURIComponent()` called on values before passing to `URLSearchParams.set()`.
- Shareable link contains `%25` sequences (double-encoded `%`).
- Form fields do not restore correctly when URL is pasted in a new tab.

**Phase to address:** Phase 3 — Shareable Query Links (URL encoding)

---

### Pitfall 21: localStorage Max Items Not Enforced — Storage Quota Errors

**What goes wrong:**
`localStorage.setItem()` throws a `QuotaExceededError` DOMException when the browser's storage limit is reached (typically 5–10MB, but as little as 2.5MB on some mobile browsers). For a favorites feature that only stores station ID pairs (very small), this is unlikely — but if the schema ever grows to include query results or timestamps, the quota fills quickly. An uncaught `QuotaExceededError` crashes the React component tree.

**Why it happens:**
Developers assume `localStorage.setItem()` always succeeds silently. The exception is `DOMException`, not `Error`, so a catch block typed as `catch (e: Error)` in TypeScript may not catch it correctly in older patterns.

**How to avoid:**
Cap favorites at a sensible limit (10 routes is generous for a transit query tool) and wrap `setItem` in try-catch:

```tsx
const MAX_FAVORITES = 10

function saveFavorites(routes: SavedRoute[]): void {
  const capped = routes.slice(0, MAX_FAVORITES)  // Enforce limit before saving
  try {
    localStorage.setItem('thsr-favorites-v2', JSON.stringify(capped))
  } catch {
    // QuotaExceededError — silently fail; in-memory state still works
    console.warn('localStorage quota exceeded; favorites not persisted')
  }
}
```

In the UI, disable the "Add to favorites" button when the limit is reached and show "已達上限 (10)" to explain why.

**Warning signs:**
- No maximum count check before calling `localStorage.setItem`.
- `localStorage.setItem` called without try-catch.
- Favorites array grows without bound.

**Phase to address:** Phase 2 — Saved Favorite Routes (localStorage feature)

---

### Pitfall 22: Form State and URL State Diverge After URL Navigation

**What goes wrong:**
A user shares a URL: `/?from=1&to=12&date=2026-03-15`. A recipient opens it. The URL params are read once on mount and populate the form. The user changes the "from" station to `2` but does NOT submit. They then copy the URL again — the URL still shows `from=1` (not yet updated) because URL was only synced on submit, not on field change. OR, conversely, if URL is synced on every field change, the user hits Back and the form fields do not match the URL.

**Why it happens:**
There are two sources of truth: React state (form fields) and the URL (search params). Keeping them perfectly in sync requires a decision: URL is the source of truth (form reads from URL), or form is the source of truth (URL is updated to match form). Mixing these approaches creates divergence.

**How to avoid:**
Make URL the single source of truth for submitted query state, form state for in-progress editing:

1. On page load: initialize form fields from URL params.
2. On field change: update React state only (do NOT update URL on every keystroke).
3. On form submit: update URL with `router.replace()` — this triggers `useSearchParams()` update which fetches results.
4. On URL change (e.g., Back button): reinitialize form fields from new URL params.

```tsx
// Sync URL → form state on mount and URL changes
useEffect(() => {
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const date = searchParams.get('date')
  if (from) setOrigin(from)
  if (to) setDestination(to)
  if (date) setDate(parseISO(date))
}, [searchParams])
```

This pattern ensures the URL always reflects the last submitted query, not partially edited form state.

**Warning signs:**
- Form fields do not update when Back button restores a previous URL.
- URL is updated on every field change (not just on submit).
- Two separate `useEffect` hooks managing form-to-URL and URL-to-form sync that conflict.

**Phase to address:** Phase 3 — Shareable Query Links (URL state management)

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
| `suppressHydrationWarning` to fix localStorage mismatch | Build passes immediately | Hides real bug; flash of incorrect content persists | Never |
| `router.push()` for all URL updates | Consistent pattern | Back button loops; multiple history entries per query | Submit actions only, never field changes |
| localStorage without version suffix (`thsr-favorites`) | Simpler key name | Schema migrations break existing user data | Never |

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
| Next.js Route Handler | Expect GET handlers to be cached (like Next.js 13/14) | In Next.js 15+, GET Route Handlers are dynamic (not cached) by default |
| Next.js params | Access `params.id` synchronously | In Next.js 15+, `const { id } = await params` |
| Next.js env vars | Use `process.env.SECRET` in Client Component | Silently becomes empty string; use `server-only` to guard |
| useSearchParams | Use directly in page without Suspense | Wraps in `<Suspense>` required for static pages; build fails otherwise |
| localStorage | Read in component body or useState initializer | Use `useEffect` + `useState([])`; populate after mount |
| URLSearchParams | Mix with `encodeURIComponent` manually | Use `URLSearchParams` API exclusively; it handles encoding |
| router.push/replace | Use `push` for every URL change | Use `replace` for field changes; `push` only on form submit |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| GeneralTimetable (300 records) fetched per request | 1–2s load time on train number search | Cache with 24h revalidation; fetch once per deployment | Every user visit without caching |
| No Suspense — all fetches sequential | Page blank until slowest TDX call completes | Use `Promise.all` for parallel fetches; Suspense for streaming | Every query on slow connections |
| Station list fetched per query | Extra 100ms per query | Cache station list with 24h revalidation or fetch at layout level | Every query without caching |
| Client-side filtering of 300 train numbers per keystroke | Input lag on low-end mobile | Filter client-side from in-memory array (not per-keystroke API call) | Low-end Android devices |
| Token refetch on every Vercel cold start | First request ~400ms slower than warm | Accept as unavoidable; add token warm-up if needed | Every cold start |
| Two React Query fetches on round-trip without shared staleTime | Outbound result stale while return result fresh | Use consistent `staleTime: 5 * 60 * 1000` on both queries | Rarely — mostly cosmetic inconsistency |
| Favorites list re-renders on every localStorage write | Jank during fast saves | Debounce localStorage writes; update React state immediately, persist async | Rapidly adding/removing favorites |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `NEXT_PUBLIC_TDX_CLIENT_SECRET` in env | TDX account hijack, banned account | Never use NEXT_PUBLIC prefix for secrets |
| TDX token returned in API response to client | Token can be extracted and used directly | Route Handler returns only the data, never the token |
| No input validation on `TrainDate` parameter | Arbitrary dates sent to TDX; potential SSRF if URL is constructed naively | Validate date format with regex `^\d{4}-\d{2}-\d{2}$` before passing to TDX |
| No validation on `StationID` parameter | Invalid station IDs sent to TDX; unnecessary API calls | Validate against known station ID list (1–12 for THSR) |
| Secrets in git history | TDX credentials leaked permanently | Use `.env.local` (gitignored); never commit `.env` with real values |
| localStorage data used as trusted input for API calls | Manipulated favorites trigger unexpected API queries | Validate station IDs from localStorage against known valid list (1–12) before using |

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
| Return date picker has no minimum date | User sets return before departure — API query silently wrong | Disable dates before outbound date in return Calendar; auto-advance on outbound change |
| Shareable URL copied before form submit | URL lacks current field values; recipient sees different query | Sync URL on submit; add "複製連結" button that generates current-state URL explicitly |
| Favorites list shows after localStorage loads — flash | List jumps from empty to populated on first render | Use `hydrated` flag to show skeleton or nothing until `useEffect` fires |

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
- [ ] **Suspense Boundary:** `useSearchParams()` wrapped in `<Suspense>`. Verify: `next build` completes without "missing-suspense-with-csr-bailout" error.
- [ ] **localStorage Hydration:** Favorites list shows skeleton/empty on first render, populates after mount. Verify: disable JavaScript briefly; page renders without errors.
- [ ] **localStorage Error Handling:** Corrupted favorites data cleared gracefully. Verify: manually set `thsr-favorites-v2` to `"invalid json"` in DevTools; app does not crash.
- [ ] **Return Date Validation:** Calendar blocks dates before outbound date. Verify: set outbound to March 15; return calendar should not allow March 14 or earlier.
- [ ] **Round-Trip Query Keys:** Outbound and return queries have distinct `queryKey` values. Verify: React Query DevTools shows two separate cache entries.
- [ ] **URL Round-Trip:** Shareable URL restores all form fields correctly. Verify: generate URL, open in incognito tab, confirm origin/destination/date all match.
- [ ] **No Double-Encoding:** URL params do not contain `%25`. Verify: inspect generated URL after form submission.
- [ ] **Back Button Behavior:** Pressing Back after a query navigates away from page, not through field change history. Verify: submit query → change one field → press Back → should see previous query result, not leave page only.

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
| Missing Suspense on useSearchParams | LOW | Extract component using `useSearchParams` → new file; wrap import in `<Suspense>` in parent |
| localStorage hydration mismatch | LOW | Add `useEffect` + `hydrated` flag pattern; remove direct localStorage reads from render path |
| localStorage corrupted data crash | LOW | Add try-catch + shape validation to loadFavorites(); clear corrupt key |
| router.push Back-button loop | LOW | Change all field-change URL updates to `router.replace()`; only submit handler uses `push` |
| Return date before outbound | LOW | Add `disabled` prop to return Calendar; add `useEffect` auto-correct |
| Query key collision (round-trip) | LOW | Add `'outbound'`/`'return'` discriminator to `queryKey` array |

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
| useSearchParams without Suspense | Phase 3: Shareable Query Links | `next build` passes; no missing-suspense-with-csr-bailout error |
| localStorage hydration mismatch | Phase 2: Saved Favorite Routes | DevTools hydration panel: zero hydration errors; favorites list no flash |
| localStorage corrupted data crash | Phase 2: Saved Favorite Routes | Manual test: set invalid JSON in storage key; app handles gracefully |
| localStorage max items | Phase 2: Saved Favorite Routes | UI shows disabled state at limit; no QuotaExceededError thrown |
| Return date before outbound | Phase 1: Round-Trip Query | Manual test: try to select return date < outbound; calendar blocks it |
| React Query key collision | Phase 1: Round-Trip Query | React Query DevTools: two distinct cache entries visible per round-trip query |
| Mobile scroll confusion | Phase 1: Round-Trip Query | Mobile viewport test: sticky section headers visible; no scroll traps |
| router.push Back-button loop | Phase 3: Shareable Query Links | Manual test: submit query → Back → exits page or restores prior query |
| URL double-encoding | Phase 3: Shareable Query Links | Inspect generated URL: no `%25` sequences; round-trip parse restores correct values |
| Form/URL state divergence | Phase 3: Shareable Query Links | Manual test: share URL → open in new tab → form fields match URL |

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs (`nextjs.org/docs`) — `useSearchParams` Suspense requirement, static vs. dynamic rendering, router.push vs. router.replace, history API integration — fetched 2026-02-19
- Next.js docs: `nextjs.org/docs/messages/missing-suspense-with-csr-bailout` — production build error for useSearchParams without Suspense — fetched 2026-02-19
- Next.js 15+ release notes — `params` is now a Promise; GET Route Handlers default to dynamic — fetched 2026-02-19
- React docs — Hydration errors and causes — verified via Next.js hydration error documentation 2026-02-19

### Secondary (MEDIUM confidence)
- TanStack Query v5 docs (parallel queries, deduplication) — verified via TanStack official documentation and community discussions 2026-02-19
- nuqs library — type-safe URL state management for Next.js App Router — verified via nuqs.dev and GitHub 2026-02-19 (noted as alternative to manual router.replace pattern)
- Community discussions: Vercel/Next.js GitHub issues #74494, #61654 (useSearchParams Suspense requirement) — 2026-02-19
- Community discussions: Vercel/Next.js GitHub discussion #48110 (shallow routing in App Router vs. Pages Router) — 2026-02-19

### Tertiary (LOW confidence — validate when TDX account is available)
- TDX exact rate limits per plan tier (free vs. paid) — unverified; test with actual account
- TDX `$format=JSON` requirement — verify against actual API responses
- Exact token endpoint URL path — verify by examining TDX API documentation after account creation

---

*Pitfalls research for: Next.js App Router + TDX OAuth2 THSR query rewrite (v1.0 + v2.0 UX Enhancement)*
*Researched: 2026-02-19*
