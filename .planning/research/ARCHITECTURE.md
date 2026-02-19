# Architecture Research

**Domain:** Next.js 15 App Router — Transit Query Tool with Server-Side OAuth2
**Researched:** 2026-02-19
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────────┐  │
│  │  QueryForm   │  │  ResultsTable   │  │  TrainNoLookup     │  │
│  │ ('use client')│  │ ('use client') │  │  ('use client')    │  │
│  └──────┬───────┘  └────────┬────────┘  └─────────┬──────────┘  │
│         │                  │                      │             │
└─────────┼──────────────────┼──────────────────────┼─────────────┘
          │  fetch /api/tdx/…│                      │
┌─────────┼──────────────────┼──────────────────────┼─────────────┐
│                     Next.js Server (Vercel)                      │
│  ┌──────┴──────────────────┴──────────────────────┴──────────┐  │
│  │              Route Handlers  app/api/tdx/*/route.ts        │  │
│  │  - Reads TDX_CLIENT_ID / TDX_CLIENT_SECRET from env        │  │
│  │  - Calls getTdxToken() — module-level cached token         │  │
│  │  - Proxies request to TDX API with Bearer token            │  │
│  │  - Returns JSON to client                                  │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────┴─────────────────────────────────────┐  │
│  │          lib/tdx-token.ts — Token Manager                  │  │
│  │  let cachedToken = { value, expiresAt }  (module-level)    │  │
│  │  async getTdxToken(): checks expiry, fetches if needed     │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
│                         │ HTTPS POST                             │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                    External Services                             │
│  ┌──────────────────────┴────────────┐                          │
│  │  TDX OAuth2 Token Endpoint        │                          │
│  │  tdx.transportdata.tw/auth/…      │                          │
│  └────────────────────────────────── ┘                          │
│  ┌──────────────────────────────────┐                           │
│  │  TDX Rail API                    │                           │
│  │  tdx.transportdata.tw/api/…      │                           │
│  │  /Rail/THSR/Station              │                           │
│  │  /Rail/THSR/DailyTimetable/OD/…  │                           │
│  │  /Rail/THSR/GeneralTimetable/…   │                           │
│  │  /Rail/THSR/AvailableSeatStatus… │                           │
│  └──────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `app/page.tsx` | Home page — renders query tab UI | Server Component, no data fetching |
| `app/api/tdx/*/route.ts` | TDX proxy — authenticate + forward | Route Handler (server only) |
| `lib/tdx-token.ts` | OAuth2 token lifecycle management | Module-level singleton cache |
| `lib/tdx-api.ts` | Typed wrappers for each TDX endpoint | Server-only fetch helpers |
| `components/QueryForm.tsx` | User inputs (stations, date, time) | Client Component with useState |
| `components/TimetableResults.tsx` | Display timetable rows | Client Component |
| `components/SeatStatusResults.tsx` | Display seat availability | Client Component |

## Recommended Project Structure

```
thsr-query/                         # Next.js project root (new)
├── app/
│   ├── layout.tsx                  # Root layout (html, body, nav)
│   ├── page.tsx                    # Home — query form tabs
│   ├── loading.tsx                 # Root loading skeleton
│   ├── error.tsx                   # Root error boundary
│   └── api/
│       └── tdx/
│           ├── stations/
│           │   └── route.ts        # GET /api/tdx/stations
│           ├── timetable/
│           │   └── route.ts        # GET /api/tdx/timetable?from=&to=&date=
│           ├── timetable-by-train/
│           │   └── route.ts        # GET /api/tdx/timetable-by-train?no=
│           └── seat-status/
│               └── route.ts        # GET /api/tdx/seat-status?station=
├── components/
│   ├── QueryTabs.tsx               # Tab switcher (byTime / byTrainNo / byStation)
│   ├── ByTimeForm.tsx              # Origin/destination/date/time form
│   ├── ByTrainNoForm.tsx           # Train number input form
│   ├── ByStationForm.tsx           # Station picker form
│   ├── TimetableResults.tsx        # Results table for timetable queries
│   ├── SeatStatusResults.tsx       # Seat availability display
│   └── StationSelect.tsx           # Reusable station dropdown
├── lib/
│   ├── tdx-token.ts                # Token manager (module-level cache)
│   ├── tdx-api.ts                  # Server-side TDX fetch helpers
│   └── utils.ts                    # diffTime, formatDate helpers
├── types/
│   └── tdx.ts                      # TypeScript types for TDX API responses
├── public/
├── .env.local                      # TDX_CLIENT_ID, TDX_CLIENT_SECRET (never committed)
├── next.config.ts
├── tsconfig.json
└── package.json
```

### Structure Rationale

- **`app/api/tdx/`:** One route file per TDX endpoint. Each file calls `getTdxToken()` and proxies to TDX. Keeps secrets server-side — `process.env.TDX_CLIENT_SECRET` is only accessible here.
- **`lib/tdx-token.ts`:** Token manager lives outside `app/` so it's importable by route handlers without being a routable path. Module-level variable persists within a single serverless function instance.
- **`lib/tdx-api.ts`:** Server-only typed wrappers. Mark with `import 'server-only'` to prevent accidental client import.
- **`components/`:** All Client Components (`'use client'`). Query forms need `useState`/`useEffect`. Results components receive data via props from client-side fetch.
- **`types/tdx.ts`:** Single source of truth for TDX response shapes derived from existing Vue 2 component field usage.

## Architectural Patterns

### Pattern 1: Module-Level Token Cache (Primary Recommendation)

**What:** A module-level variable in `lib/tdx-token.ts` stores `{ value: string, expiresAt: number }`. `getTdxToken()` checks expiry before returning. No external dependency.

**When to use:** Vercel Hobby/Pro plan, no Redis budget, token TTL ~24h. This works because a single serverless function instance handles many requests before recycling.

**Trade-offs:**
- Pro: Zero cost, zero dependencies, dead simple
- Con: Cold starts re-fetch the token (adds ~200ms once per instance spin-up). Multiple instances each hold their own token copy — fine since TDX tokens are stateless Bearer tokens.
- Con: Token lost on redeploy — negligible, re-fetched on first request

**Example:**
```typescript
// lib/tdx-token.ts
import 'server-only'

const TDX_AUTH_URL = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'

interface CachedToken {
  value: string
  expiresAt: number  // Date.now() ms
}

let cachedToken: CachedToken | null = null

export async function getTdxToken(): Promise<string> {
  const now = Date.now()
  // Refresh 5 minutes before expiry as safety margin
  if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
    return cachedToken.value
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.TDX_CLIENT_ID!,
    client_secret: process.env.TDX_CLIENT_SECRET!,
  })

  const res = await fetch(TDX_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    cache: 'no-store',   // Never cache the token request itself
  })

  if (!res.ok) {
    throw new Error(`TDX auth failed: ${res.status}`)
  }

  const data = await res.json()
  // TDX returns expires_in in seconds (typically 86400 = 24h)
  cachedToken = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  }

  return cachedToken.value
}
```

### Pattern 2: TDX Proxy Route Handler

**What:** Route Handler in `app/api/tdx/*/route.ts` calls `getTdxToken()` then forwards the request to TDX with `Authorization: Bearer <token>`. Returns TDX's JSON directly to the client.

**When to use:** Every TDX API call from the browser. Client never calls TDX directly.

**Trade-offs:**
- Pro: `client_secret` never leaves the server
- Con: Adds one network hop (browser → Vercel → TDX). Acceptable — TDX is Taiwan-hosted and Vercel has Asian edge.

**Example:**
```typescript
// app/api/tdx/stations/route.ts
import { getTdxToken } from '@/lib/tdx-token'
import { NextRequest } from 'next/server'

const TDX_BASE = 'https://tdx.transportdata.tw/api/basic/v2/Rail/THSR'

export async function GET(_req: NextRequest) {
  const token = await getTdxToken()

  const res = await fetch(`${TDX_BASE}/Station`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 86400 },  // Cache station list for 24h
  })

  if (!res.ok) {
    return Response.json({ error: 'TDX API error' }, { status: res.status })
  }

  const data = await res.json()
  return Response.json(data)
}
```

### Pattern 3: Client-Side Query with SWR

**What:** Query forms are Client Components. On submit, they call the Next.js proxy route via `fetch`. SWR handles loading/error state.

**When to use:** Any interactive query (timetable, seat status). The query depends on user input so it cannot be server-rendered.

**Trade-offs:**
- Pro: Simple mental model — form submits → fetch → show results
- Pro: SWR provides deduplication and client-side caching between queries
- Con: Results are not SEO-indexed (acceptable for a query tool)

**Example:**
```typescript
// components/ByTimeForm.tsx
'use client'
import { useState } from 'react'

export default function ByTimeForm({ stations }: { stations: Station[] }) {
  const [results, setResults] = useState<Timetable[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const res = await fetch(
      `/api/tdx/timetable?from=${form.get('from')}&to=${form.get('to')}&date=${form.get('date')}`
    )
    const data = await res.json()
    setResults(data)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* station selects, date picker */}
      {loading && <p>查詢中...</p>}
      {results && <TimetableResults data={results} />}
    </form>
  )
}
```

### Anti-Patterns to Avoid

- **Calling TDX from Client Components directly:** Exposes `client_secret`. All TDX calls must go through `/api/tdx/*` routes.
- **Storing token in `localStorage` or cookies:** Token is a server implementation detail — client has no need to see it.
- **Making the home page a Server Component that fetches timetable:** Query params come from user input at runtime; can't be known at build time. Only the station list (static reference data) benefits from server-side pre-fetch.

## Data Flow

### Request Flow — Timetable Query

```
User fills ByTimeForm (Client Component)
    ↓  form submit (browser)
fetch('/api/tdx/timetable?from=NAB&to=ESZ&date=2026-02-20')
    ↓  HTTP GET (browser → Vercel edge)
app/api/tdx/timetable/route.ts  (Route Handler)
    ↓  getTdxToken()  →  module cache HIT (or POST to TDX auth endpoint)
    ↓  fetch(TDX_BASE/DailyTimetable/OD/NAB/to/ESZ/2026-02-20, Bearer token)
    ↓  Next.js Data Cache (revalidate: 300 — 5min for timetable data)
TDX API  →  JSON response
    ↓  Response.json(data)
Browser  →  setResults(data)  →  <TimetableResults />
```

### State Management

No global state store needed. State is local to each query form component:

```
ByTimeForm
  useState: { from, to, date, time, arrive }
  useState: { results, loading, error }
    ↓ on submit
  fetch('/api/tdx/timetable?…')
    ↓ on response
  setResults(data) → renders <TimetableResults data={results} />
```

Stations list (loaded once, shared across all forms):

```
app/page.tsx (Server Component)
  fetch('/api/tdx/stations')  with revalidate: 86400
    ↓ pass stations as prop
  <ByTimeForm stations={stations} />
  <ByStationForm stations={stations} />
```

### Key Data Flows

1. **Station list:** Fetched once server-side at page render (or from Next.js Data Cache), passed as props to Client Component forms. Revalidated every 24h — station list is essentially static.
2. **Timetable query:** Triggered by client form submit. Proxied through Route Handler. TDX response cached for 5 minutes (same route+params within window returns cached data).
3. **Seat status query:** Same proxy pattern. Cache for 60 seconds — seat availability changes frequently.
4. **OAuth2 token:** Fetched once per serverless instance cold start, cached in module memory for 24h minus 5-minute safety margin.

## TDX Token Management — Decision Matrix

| Strategy | Cost | Complexity | Cross-instance | Recommended? |
|----------|------|------------|----------------|--------------|
| Module-level variable (in-memory) | Free | Low | No (each instance has own token) | **YES — start here** |
| `unstable_cache` / `use cache` | Free | Medium | No (Next.js Data Cache per instance) | Acceptable alternative |
| Upstash Redis (via Vercel Marketplace) | Free tier: 10k req/day | High | Yes | Only if multiple cold starts are measured to be a problem |

**Recommendation:** Module-level variable is the right starting point. TDX tokens are stateless Bearer tokens — having multiple instances each hold a copy is perfectly fine. Redis adds operational overhead with no functional benefit for this use case.

**Key insight on Vercel serverless:** In-memory state (module-level variables) persists across requests within a single function instance. Instances are recycled after inactivity but can stay warm for hours under real traffic. Cold start token re-fetch is one HTTP POST (~200ms) — invisible to users.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users/day | Module-level token cache is sufficient. No changes needed. |
| 1k-10k users/day | Add `next: { revalidate: N }` on TDX fetch calls to benefit from Next.js Data Cache across instances. |
| 10k+ users/day | Add Upstash Redis for shared token cache. Add rate-limit middleware to `/api/tdx/*` routes to stay within TDX API quotas. |

### Scaling Priorities

1. **First bottleneck:** TDX API rate limits. TDX free tier has rate limits — add response caching (`revalidate`) on route handlers early.
2. **Second bottleneck:** Vercel function invocations. Vercel Hobby plan has 100k invocations/month. At 10k users/day making 3-4 queries each, this is 30-40k invocations/day — upgrade to Pro if needed.

## Anti-Patterns

### Anti-Pattern 1: Calling TDX Directly from the Browser

**What people do:** `fetch('https://tdx.transportdata.tw/…', { headers: { Authorization: 'Bearer ' + clientSecret } })` in a Client Component.

**Why it's wrong:** `client_secret` is exposed in the browser's network tab and bundled JavaScript. Anyone can steal it and impersonate your TDX account.

**Do this instead:** All TDX calls go through `app/api/tdx/*/route.ts` Route Handlers where `process.env.TDX_CLIENT_SECRET` is only readable server-side.

### Anti-Pattern 2: Fetching the Token on Every Request

**What people do:** Call the TDX auth endpoint inside every Route Handler invocation before each API call.

**Why it's wrong:** Adds 200-400ms latency to every user request, and burns TDX auth endpoint rate limits unnecessarily.

**Do this instead:** Cache the token in a module-level variable. Check `expiresAt` before deciding to re-fetch. The token is valid for ~24h.

### Anti-Pattern 3: Using Pages Router Instead of App Router

**What people do:** Default to Pages Router because tutorials are older/more common.

**Why it's wrong:** App Router (introduced Next.js 13, stable 14+) enables Server Components, built-in Data Cache, streaming with Suspense, and simpler route handler co-location. Pages Router is legacy.

**Do this instead:** Use App Router. The `app/` directory with `layout.tsx`, `page.tsx`, and `route.ts` files.

### Anti-Pattern 4: Making Results Pages Separate Routes with Search Params

**What people do:** Navigate to `/results?from=…&to=…&date=…` after form submit, fetch data server-side in the results page.

**Why it's wrong:** For a query tool, the form and results co-exist on the same screen. Separate route navigation loses the form state and requires full page navigation. Also creates shareable URLs that may contain stale timetable data.

**Do this instead:** Keep form and results on `app/page.tsx`. Results appear below the form in the same Client Component. If deep-linking to results is a future requirement, add it then.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| TDX OAuth2 (`tdx.transportdata.tw/auth/…`) | POST `client_credentials` grant from Route Handler | Returns `access_token` + `expires_in` (~86400s) |
| TDX Rail API (`tdx.transportdata.tw/api/basic/v2/Rail/THSR/…`) | GET with `Authorization: Bearer <token>`, proxy in Route Handler | Use `$format=JSON` query param if needed |
| Vercel | Deploy via `vercel deploy` or GitHub integration | Set `TDX_CLIENT_ID` + `TDX_CLIENT_SECRET` as Vercel env vars (not committed to git) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client Component ↔ Route Handler | HTTP fetch to `/api/tdx/*` | Client never imports from `lib/tdx-token.ts` or `lib/tdx-api.ts` |
| Route Handler ↔ Token Manager | Direct import + function call | `getTdxToken()` is synchronous-feeling async — awaited inline |
| Server Component (page.tsx) ↔ Client Components | Props | Station list fetched server-side, passed down as serializable JSON prop |

## Build Order Recommendation

Build in this sequence to establish working vertical slices before adding features:

1. **Project scaffolding** — `npx create-next-app` with TypeScript + App Router + Tailwind. Set up `.env.local` with TDX credentials.
2. **Token manager** — Implement `lib/tdx-token.ts`. Write a manual test route `app/api/tdx/debug/route.ts` that returns the token expiry to verify auth works.
3. **Stations route handler** — `app/api/tdx/stations/route.ts`. Verify station list returns correctly.
4. **Home page with `StationSelect`** — Server Component fetches station list, passes to a simple Client Component. Verify UI renders.
5. **Timetable route handler + `ByTimeForm`** — The core feature. Form → `/api/tdx/timetable` → display results.
6. **TrainNo route handler + `ByTrainNoForm`** — Secondary feature. Simpler than timetable.
7. **Seat status route handler + `ByStationForm`** — Third feature.
8. **UI polish** — Mobile/desktop responsive styles, loading states, error states.
9. **Remove debug route** — Delete `app/api/tdx/debug/route.ts` before production deploy.

## Sources

### Primary (HIGH confidence)

- [Next.js Official Docs — Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) — App Router conventions, routing files, directory organization
- [Next.js Official Docs — Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route) — Route Handler API, HTTP methods, query params, caching options
- [Next.js Official Docs — Caching](https://nextjs.org/docs/app/building-your-application/caching) — Data Cache, `revalidate`, module-level behavior
- [Next.js Official Docs — Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data) — Server vs Client fetch patterns, Suspense streaming
- [Next.js Official Docs — `unstable_cache`](https://nextjs.org/docs/app/api-reference/functions/unstable_cache) — Deprecated in favor of `use cache` directive in Next.js 16

### Secondary (MEDIUM confidence)

- [Vercel Docs — Redis/KV](https://vercel.com/docs/storage/vercel-kv) — Confirmed Vercel KV discontinued December 2024; replaced by Upstash Redis via Marketplace
- Existing Vue 2 codebase (`src/api/thrs-api.js`, `src/components/byTime.vue`, `src/components/byStation.vue`) — TDX endpoint paths, query parameter names, response field names

### Tertiary (LOW confidence — validate before implementing)

- TDX OAuth2 token endpoint URL: `https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token` — Based on known TDX migration from PTX. **Verify with official TDX documentation when credentials are obtained.**
- TDX token TTL: ~86400 seconds (~24h) — Commonly cited in TDX community resources. **Verify `expires_in` from actual token response.**

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from Next.js official docs (v16.1.6, 2026-02-16)
- Architecture patterns: HIGH — Route Handler proxy pattern is standard Next.js practice
- Token caching strategy: HIGH for module-level approach (straightforward JS), LOW for TDX-specific TTL claim (needs empirical verification)
- Directory structure: HIGH — matches Next.js official colocation conventions

**Research date:** 2026-02-19
**Valid until:** 2026-04-19 (stable framework; re-check if Next.js major version changes)

---
*Architecture research for: Next.js 15 App Router + TDX OAuth2 proxy, THSR query tool*
*Researched: 2026-02-19*
