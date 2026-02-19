# Phase 1: Foundation - Research

**Researched:** 2026-02-19
**Domain:** Next.js 16 App Router + TDX OAuth2 server-side proxy, repo migration from Vue 2
**Confidence:** HIGH (Next.js patterns from official docs); MEDIUM (TDX specifics from official GitHub sample code + community verification)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Repo structure:**
- Next.js directly replaces the current repo root (no subdirectory, no new repo)
- Old Vue 2 `src/` moved into `_archive/` (kept as reference, not in main directory)
- `docs/` (old GitHub Pages static files) deleted directly — Vercel replaces GitHub Pages

**TDX development strategy (no token):**
- Build mock mode; mock data must fully simulate real TDX API response format (fixture data)
- Switching mechanism: auto-detect — if `TDX_CLIENT_ID` / `TDX_CLIENT_SECRET` env vars are NOT set, automatically fall back to mock data; when set, automatically call real TDX API
- No `USE_MOCK_TDX` flag needed; env var presence determines behavior

**Vercel deployment strategy:**
- Phase 1 prioritizes getting it running locally; Vercel config is part of Phase 1 but NOT a blocking condition for completion
- "Successfully deployed to Vercel" is NOT a prerequisite for starting Phase 2 (local passing is sufficient)

**Station data access:**
- Station data fetched from TDX at build time (SSG/ISR); results go into bundle
- In mock mode (no TDX token), build time uses mock fixture station data
- No automatic update mechanism needed — THSR stations almost never change; manual update if needed

### Claude's Discretion
- Next.js directory structure details (specific naming of `app/`, `lib/`, `components/`, etc.)
- TypeScript strictness level
- Specific format and storage location of fixture mock data
- Tailwind v4 + shadcn/ui initialization approach

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-01 | Next.js 16 (App Router) + TypeScript project architecture | Next.js 16 official docs, create-next-app command with --app --typescript flags confirmed |
| INFR-02 | Deployable to Vercel, env vars configured in Vercel dashboard | Vercel deploys Next.js natively; env vars set via dashboard, not committed to git |
| INTG-01 | All TDX API calls proxied through Next.js Route Handlers; TDX credentials never exposed to frontend | Route Handler proxy pattern documented; `server-only` package enforces boundary at build time |
| INTG-02 | TDX OAuth2 token managed with server-side in-memory cache; avoid re-fetching on every request | Module-level variable pattern confirmed; TDX token TTL verified as 86400s from official sample code |
| INTG-03 | TDX client_id and client_secret managed as env vars (`.env.local`, not committed) | Standard Next.js env var pattern; no `NEXT_PUBLIC_` prefix keeps vars server-only |
</phase_requirements>

---

## Summary

Phase 1 establishes the secure foundation that all subsequent phases depend on: a working Next.js 16 App Router project replacing the existing Vue 2 codebase in-place, with a server-side TDX OAuth2 token manager and a `/api/tdx/stations` Route Handler proxy that proves the credential boundary is correctly enforced.

The existing repo contains a Vue 2 SPA that called the now-defunct PTX API (`ptx.transportdata.tw/MOTC/v2/Rail/THSR`) directly from the browser using axios, with no authentication. The new architecture inverts this: all TDX calls happen server-side through Route Handlers that cache a Bearer token at the module level. The `server-only` package enforces this boundary at build time.

TDX OAuth2 token endpoint is `https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token` — verified via the official TDX sample code repository. Token TTL is 86400s (24h). The mock/real switching strategy (auto-detect via env var presence) is clean and requires no flag management.

Key Next.js 16 changes to be aware of: `params` and `searchParams` must be `await`ed (async), `cookies()`/`headers()`/`draftMode()` are also async, `middleware.ts` is deprecated in favor of `proxy.ts`, and Turbopack is now the default bundler. The `next lint` command is removed — use ESLint directly.

**Primary recommendation:** Initialize with `npx create-next-app@latest` (App Router + TypeScript + Tailwind + ESLint), then `npx shadcn@latest init`, then implement `lib/tdx-token.ts` with `import 'server-only'` as the first code written before any Route Handler or UI.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | Full-stack React framework | Latest stable (published 2026-01-27). App Router, Route Handlers, Data Cache, Vercel-native. Turbopack is now default bundler. |
| react | 19.2.4 | UI rendering | Required by Next.js 16. Server Components enforce the server/client split needed for credential security. |
| typescript | 5.9.3 | Type safety | Required (TypeScript 5.1+ minimum). Catches `params` not-awaited and TDX response shape errors at compile time. |
| tailwindcss | 4.2.0 | Utility-first styling | v4 CSS-first model (`@import tailwindcss` in CSS, no `tailwind.config.js`). Required by shadcn/ui. Mobile-first by default. |
| shadcn/ui CLI | 3.8.5 | UI component code generator | Not a package — generates Radix UI + Tailwind components directly into the codebase. Components use OKLCH colors (v4 standard). |
| server-only | 0.0.1 | Build-time server boundary guard | `import 'server-only'` in `lib/tdx-token.ts` causes a build error if that module is ever imported in a Client Component. Prevents credential leakage. |

### Supporting (Phase 1 only installs what is needed for foundation)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.90.21 | Client-side async state | Install now for Phase 2 forms. Not used in Phase 1 directly, but setting it up in the QueryClientProvider in `app/layout.tsx` avoids a structural change later. |
| zod | 4.3.6 | Schema validation | Validate Route Handler query params server-side. Phase 1 uses it for the stations Route Handler input validation. |
| lucide-react | 0.574.0 | Icon library | shadcn/ui dependency. Installed automatically by shadcn init. |
| clsx | 2.1.1 | Conditional class names | shadcn/ui dependency. Installed automatically. |
| tailwind-merge | 3.5.0 | Tailwind class merging | shadcn/ui dependency. Installed automatically. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Module-level token cache | Upstash Redis | Redis adds operational cost and complexity. TDX tokens are stateless Bearers — multiple instances each having a copy is fine. Start simple. |
| `server-only` package | Manual code review | Manual review misses accidental imports. Build-time error is better than runtime surprise. |
| Native `fetch` | `axios` | Axios was used in the old Vue 2 code. Native `fetch` is built into Node 18+ and all browsers. Zero dependency overhead. |
| Turbopack (default) | webpack | Turbopack is now default in Next.js 16. Use `next build --webpack` only if a custom webpack plugin is required. None needed here. |

**Installation:**
```bash
# Step 1: Scaffold (run from the project root after archiving old files)
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# Step 2: Initialize shadcn/ui (interactive — choose "New York" style, neutral base color)
npx shadcn@latest init

# Step 3: Add shadcn/ui components needed for Phase 1 (minimal — just for a health check page)
npx shadcn@latest add button

# Step 4: Server boundary guard
npm install server-only

# Step 5: Client-side state (install now, configure QueryClientProvider in layout)
npm install @tanstack/react-query

# Step 6: Validation
npm install zod
```

---

## Architecture Patterns

### Recommended Project Structure

```
thsr-query/                         # Next.js project root (replaces Vue 2 root)
├── _archive/                       # Moved Vue 2 src/ here — reference only
│   └── src/                        # Original Vue 2 codebase
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout: html, body, QueryClientProvider
│   │   ├── page.tsx                # Home page (Server Component — passes stations as props)
│   │   ├── loading.tsx             # Root loading skeleton
│   │   ├── error.tsx               # Root error boundary ('use client' REQUIRED)
│   │   └── api/
│   │       └── tdx/
│   │           └── stations/
│   │               └── route.ts   # GET /api/tdx/stations — Phase 1 deliverable
│   ├── lib/
│   │   ├── tdx-token.ts            # OAuth2 token manager (import 'server-only')
│   │   ├── tdx-api.ts              # Server-side TDX fetch helpers (import 'server-only')
│   │   └── utils.ts                # Shared utilities (cn() helper from shadcn init)
│   ├── types/
│   │   └── tdx.ts                  # TypeScript types for TDX API responses
│   └── fixtures/
│       └── tdx-mock.ts             # Mock TDX API responses (fixture data matching real format)
├── public/
├── .env.local                      # TDX_CLIENT_ID, TDX_CLIENT_SECRET (never committed)
├── .gitignore                      # Must include .env.local
├── next.config.ts
├── tsconfig.json
└── package.json
```

**Structure rationale for key decisions:**
- `src/` directory: `create-next-app --src-dir` flag places all code under `src/`. Keeps root clean.
- `_archive/`: Sits at repo root (not under `src/`) so it is clearly outside the Next.js build.
- `src/fixtures/`: Fixture mock data goes in `src/fixtures/` (server-side only, not in `public/`). Imported only by `lib/tdx-api.ts` which is already `server-only`.
- `src/types/tdx.ts`: Shared type definitions derived from TDX API response shapes. Used by both Route Handlers and fixture data to ensure structural identity.

### Pattern 1: TDX OAuth2 Token Manager (Module-Level Cache)

**What:** A module-level variable in `lib/tdx-token.ts` stores `{ value: string; expiresAt: number }`. `getTdxToken()` checks expiry before fetching. Protected by `import 'server-only'`.

**When to use:** Every time a Route Handler needs to call TDX API. Called once per Vercel function instance cold start, cached for ~24h (token TTL minus 5-minute safety buffer).

```typescript
// Source: Official TDX SampleCode repo (github.com/tdxmotc/SampleCode) + Next.js docs
// src/lib/tdx-token.ts
import 'server-only'

const TDX_AUTH_URL =
  'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'

interface CachedToken {
  value: string
  expiresAt: number  // Date.now() milliseconds
}

let cachedToken: CachedToken | null = null

export async function getTdxToken(): Promise<string> {
  const now = Date.now()
  // Refresh 5 minutes before actual expiry as safety buffer
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
    throw new Error(`TDX auth failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  // TDX returns expires_in in seconds (86400 = 24h, verified via official SampleCode)
  cachedToken = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  }

  return cachedToken.value
}
```

### Pattern 2: Mock/Real Auto-Detect in lib/tdx-api.ts

**What:** `lib/tdx-api.ts` checks whether `TDX_CLIENT_ID` and `TDX_CLIENT_SECRET` are set. If both are present, call real TDX API. If either is missing, return fixture data. Client code (Route Handlers) calls the same function regardless.

**When to use:** Every Route Handler imports from `lib/tdx-api.ts`. The mock/real decision is encapsulated here, not in the Route Handlers.

```typescript
// src/lib/tdx-api.ts
import 'server-only'
import { getTdxToken } from './tdx-token'
import { MOCK_STATIONS } from '@/fixtures/tdx-mock'
import type { TdxStation } from '@/types/tdx'

const TDX_BASE = 'https://tdx.transportdata.tw/api/basic/v2/Rail/THSR'

function isMockMode(): boolean {
  return !process.env.TDX_CLIENT_ID || !process.env.TDX_CLIENT_SECRET
}

export async function fetchStations(): Promise<TdxStation[]> {
  if (isMockMode()) {
    return MOCK_STATIONS
  }

  const token = await getTdxToken()
  const res = await fetch(`${TDX_BASE}/Station`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 86400 },  // Cache station list 24h
  })

  if (!res.ok) {
    throw new Error(`TDX stations failed: ${res.status}`)
  }

  const data = await res.json()
  // TDX wraps response — extract the array
  return Array.isArray(data) ? data : data.Stations ?? data
}
```

### Pattern 3: Route Handler Proxy

**What:** Route Handler in `app/api/tdx/stations/route.ts` calls `fetchStations()` from `lib/tdx-api.ts`. Returns JSON to client. Never imports `tdx-token.ts` directly.

**When to use:** The `/api/tdx/stations` endpoint that Phase 1 must deliver. Template for all future Route Handlers.

```typescript
// Source: Next.js official docs — Route Handlers
// src/app/api/tdx/stations/route.ts
import { fetchStations } from '@/lib/tdx-api'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const stations = await fetchStations()
    return NextResponse.json(stations)
  } catch (error) {
    console.error('[/api/tdx/stations]', error)
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 502 }
    )
  }
}
```

### Pattern 4: Fixture Data Structure

**What:** Mock data in `src/fixtures/tdx-mock.ts` must exactly match the real TDX API response format. Types in `src/types/tdx.ts` are derived from TDX API docs and the old Vue 2 component field usage.

**Why exact format matters:** Phase 2/3 UI components will use the same TypeScript types whether in mock or real mode. If the fixture doesn't match the real shape, the type checking false-positives in development disappear as failures in production.

```typescript
// src/types/tdx.ts
export interface TdxStation {
  StationUID: string      // e.g. "THSR-1"
  StationID: string       // e.g. "1"
  StationName: {
    Zh_tw: string         // e.g. "南港"
    En: string            // e.g. "Nangang"
  }
  StationPosition: {
    PositionLat: number
    PositionLon: number
  }
  StationAddress: string
  BikeAllowOnHoliday: boolean
  SrcUpdateTime: string
  UpdateTime: string
  VersionID: number
}

// src/fixtures/tdx-mock.ts
import type { TdxStation } from '@/types/tdx'

export const MOCK_STATIONS: TdxStation[] = [
  {
    StationUID: 'THSR-1',
    StationID: '1',
    StationName: { Zh_tw: '南港', En: 'Nangang' },
    StationPosition: { PositionLat: 25.0531, PositionLon: 121.6076 },
    StationAddress: '台北市南港區忠孝東路七段338號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
  // ... all 12 stations in StationID order (1=南港 through 12=左營)
]
```

### Pattern 5: Repo Migration Sequence

**What:** The correct order of file operations to replace Vue 2 with Next.js in the same repo root without losing git history or breaking anything.

**When to use:** Start of Phase 1, Plan 01-01.

```bash
# Step 1: Move Vue 2 source to archive (preserve git history)
git mv src _archive/src
git mv docs _archive/docs   # or just rm -rf docs if truly not needed
git mv babel.config.js _archive/babel.config.js
git mv yarn.lock _archive/yarn.lock
git mv public _archive/public   # if Vue 2 had a public/ folder

# Step 2: Remove Vue 2 package.json (Next.js will create a new one via create-next-app)
# Note: create-next-app will detect existing package.json and ask to overwrite
# Answer YES — the new one replaces it entirely

# Step 3: Run create-next-app in current directory
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# Step 4: Update .gitignore to include .env.local (create-next-app does this automatically)
# Verify: cat .gitignore | grep env.local

# Step 5: Create .env.local (not committed)
# TDX_CLIENT_ID=your_client_id_here
# TDX_CLIENT_SECRET=your_client_secret_here
```

### Anti-Patterns to Avoid

- **`NEXT_PUBLIC_TDX_CLIENT_SECRET` in env vars:** The `NEXT_PUBLIC_` prefix ships the variable to every browser. TDX account gets compromised. Never use this prefix for secrets.
- **TDX fetch in a `'use client'` component:** Exposes credentials. All TDX calls go through `app/api/tdx/*/route.ts`.
- **Calling `getTdxToken()` directly from a Route Handler:** Route Handlers should call `lib/tdx-api.ts` helpers, not the token manager directly. Keeps the abstraction layer intact.
- **`middleware.ts` usage in Next.js 16:** `middleware.ts` is deprecated in Next.js 16. Use `proxy.ts` if middleware is needed (it's not needed for Phase 1).
- **Sync access to `params`, `cookies()`, `headers()`:** In Next.js 16 these are all async. Always `await params`, `await cookies()`, etc. TypeScript will surface this at compile time.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Server boundary enforcement | Custom lint rule or runtime check | `server-only` package | Build-time error is better than runtime surprise. One-liner. |
| OAuth2 `client_credentials` flow | Custom PKCE/auth library | Native `fetch` with `URLSearchParams` + module-level cache | TDX uses simple client_credentials — no PKCE, no refresh tokens, just POST with client_id/secret. Two dozen lines. |
| Environment variable management | Custom config loader, dotenv | Next.js built-in `.env.local` support | Next.js loads `.env.local` automatically in all environments. No package needed. |
| TypeScript for API responses | Manual JSON assertions | Typed interfaces in `types/tdx.ts` | Catch field name mismatches at compile time, not at 3am in production. |
| HTTP response handling in Route Handlers | Custom response class | `NextResponse.json()` | Built-in. Correct Content-Type headers. Error status codes work as expected. |

**Key insight:** The token manager is the one place where custom code is unavoidable (no off-the-shelf TDX token library exists). Keep it minimal — the implementation is under 40 lines. Everything else has a battle-tested solution.

---

## Common Pitfalls

### Pitfall 1: TDX `client_secret` in Client Bundle
**What goes wrong:** `NEXT_PUBLIC_TDX_CLIENT_SECRET` appears in `.env.local`, shipping the secret to every browser. Or TDX fetch is done inside a `'use client'` component directly.
**Why it happens:** Copying the old Vue 2 pattern (direct API call from browser) into React. Environment variables silently become empty strings in client bundle unless prefixed `NEXT_PUBLIC_`, leading developer to prefix them.
**How to avoid:** Store as `TDX_CLIENT_SECRET` (no prefix). Add `import 'server-only'` to `lib/tdx-token.ts`. All TDX calls go through `app/api/tdx/*/route.ts`.
**Warning signs:** `NEXT_PUBLIC_TDX_CLIENT_SECRET` in any env file. Direct `fetch('https://tdx.transportdata.tw')` in any `'use client'` file.

### Pitfall 2: Async `params` and `cookies()` Not Awaited (Next.js 16 Breaking Change)
**What goes wrong:** Runtime error or TypeScript error — `params.stationId` returns a Promise, not a string. Same for `cookies()`, `headers()`, `draftMode()`.
**Why it happens:** Next.js 15 started this change; Next.js 16 made it fully required (removed sync access). Tutorials and copy-paste code often show the old synchronous pattern.
**How to avoid:** Always `const { id } = await params`. Always `const cookieStore = await cookies()`. TypeScript strict mode surfaces these at compile time.
**Warning signs:** `params.stationId` returning `[object Promise]`. TypeScript errors on `params` access without `await`.

### Pitfall 3: Token Fetched on Every Request
**What goes wrong:** Every Route Handler invocation makes a new `POST` to TDX auth endpoint. Adds 200-400ms latency per user request. Risks hitting TDX auth rate limit (20 calls/minute per IP).
**Why it happens:** Straightforward implementation fetches token, uses it, discards it. Module-level cache not implemented.
**How to avoid:** Implement the `expiresAt` check in `getTdxToken()`. The 5-minute safety buffer before actual expiry handles edge cases.
**Warning signs:** TDX auth endpoint appearing in every server log line. Response times consistently 400ms+.

### Pitfall 4: `error.tsx` Missing `'use client'`
**What goes wrong:** Build error if `error.tsx` is async or tries to do server-side fetching. Error boundaries in Next.js App Router must be Client Components.
**Why it happens:** Developers apply the same async Server Component pattern used for pages and layouts to `error.tsx`.
**How to avoid:** Always `'use client'` as first line of `error.tsx` and `global-error.tsx`. Keep error UI simple — no data fetching.
**Warning signs:** Build error mentioning error boundaries cannot be async.

### Pitfall 5: `middleware.ts` Deprecation in Next.js 16
**What goes wrong:** Using `middleware.ts` works but generates deprecation warnings. If any Phase 1 task involves request interception, using the old file name creates tech debt.
**Why it happens:** Most tutorials still reference `middleware.ts`. Next.js 16 introduced `proxy.ts` as the replacement.
**How to avoid:** Phase 1 does not need request interception — skip this entirely. If needed later, use `proxy.ts`.
**Warning signs:** Creating `middleware.ts` during Phase 1.

### Pitfall 6: `next lint` Command Removed in Next.js 16
**What goes wrong:** `next lint` command no longer exists in Next.js 16. Build scripts or CI pipelines that run `next lint` will fail.
**Why it happens:** Next.js 16 removed the command — use ESLint directly instead.
**How to avoid:** In `package.json` scripts, use `eslint .` not `next lint`. `next build` no longer runs linting either.
**Warning signs:** `Error: Unknown command 'lint'` when running `next lint`.

### Pitfall 7: Mock Fixture Type Divergence
**What goes wrong:** Mock fixture data in `fixtures/tdx-mock.ts` has different field names or structure than real TDX API responses. Phase 2/3 UI works in mock mode but breaks with real credentials.
**Why it happens:** Mock data built from assumptions rather than verified TDX API response shapes. The old Vue 2 code gives hints about field names but may not reflect the full TDX v2 response structure.
**How to avoid:** Define TypeScript interfaces in `types/tdx.ts` FIRST, based on TDX API documentation. Both mock fixtures and real API responses implement the same types. Any divergence becomes a compile-time error.
**Warning signs:** TypeScript `as any` casts in fixture data. Mock tests passing but real API calls failing with "Cannot read property X of undefined".

### Pitfall 8: Station Data Not Available at Build Time in Mock Mode
**What goes wrong:** Build fails when `TDX_CLIENT_ID` is not set, because the `fetchStations()` call during static generation has no fallback.
**Why it happens:** The "auto-detect" mock strategy must be implemented in `lib/tdx-api.ts` BEFORE writing the build-time fetch in `app/page.tsx`. If the fallback isn't wired, the build-time station fetch throws.
**How to avoid:** Implement the `isMockMode()` check in `lib/tdx-api.ts` as the very first thing. Verify with `npm run build` without env vars set — must succeed and use mock stations.
**Warning signs:** Build error like "fetch failed" or "TDX auth failed" when running `npm run build` without credentials.

---

## Code Examples

### TDX OAuth2 Token Request (Verified Format)
```typescript
// Source: github.com/tdxmotc/SampleCode — official TDX sample repository
// Token endpoint: https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token
// Method: POST, Content-Type: application/x-www-form-urlencoded
// Rate limit on auth endpoint: 20 calls/minute per IP

const params = new URLSearchParams({
  grant_type: 'client_credentials',
  client_id: process.env.TDX_CLIENT_ID!,
  client_secret: process.env.TDX_CLIENT_SECRET!,
})

const res = await fetch(TDX_AUTH_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: params.toString(),
  cache: 'no-store',
})

// Response: { access_token: "...", expires_in: 86400, token_type: "Bearer" }
const { access_token, expires_in } = await res.json()
```

### Environment Variable Pattern (Server-Only)
```typescript
// .env.local (never committed)
TDX_CLIENT_ID=your_client_id_here
TDX_CLIENT_SECRET=your_client_secret_here

// In Route Handler or lib/tdx-token.ts:
process.env.TDX_CLIENT_ID    // Available server-side only
process.env.TDX_CLIENT_SECRET // Available server-side only

// WRONG (exposes to browser):
// NEXT_PUBLIC_TDX_CLIENT_ID=...
// NEXT_PUBLIC_TDX_CLIENT_SECRET=...
```

### Next.js 16 Async Params Pattern (Breaking Change from v14)
```typescript
// Source: Next.js 16 official blog (nextjs.org/blog/next-16)
// app/api/tdx/[endpoint]/route.ts

// CORRECT for Next.js 16:
export async function GET(
  _req: Request,
  context: { params: Promise<{ endpoint: string }> }
) {
  const { endpoint } = await context.params  // Must await params
  // ...
}

// WRONG (Next.js 13/14 pattern — broken in Next.js 16):
// export async function GET(_req: Request, { params }: { params: { endpoint: string } }) {
//   const { endpoint } = params  // Sync access removed in Next.js 16
// }
```

### `server-only` Guard Pattern
```typescript
// Source: Next.js official docs — Server and Client Components
// src/lib/tdx-token.ts
import 'server-only'  // First line — causes build error if imported in 'use client' file

// This file can now safely use process.env.TDX_CLIENT_SECRET
// Any accidental import from a Client Component = build failure (not runtime surprise)
```

### Stations Route Handler with Error Handling
```typescript
// src/app/api/tdx/stations/route.ts
import { fetchStations } from '@/lib/tdx-api'
import { NextResponse } from 'next/server'

export const dynamic = 'force-static'  // Station list is static data
export const revalidate = 86400         // Revalidate every 24h

export async function GET() {
  try {
    const stations = await fetchStations()
    return NextResponse.json(stations)
  } catch (error) {
    console.error('[/api/tdx/stations] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch station data' },
      { status: 502 }
    )
  }
}
```

### Vercel Configuration (vercel.json)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```
For Vercel, no `vercel.json` is needed — Vercel auto-detects Next.js. The only required configuration is setting `TDX_CLIENT_ID` and `TDX_CLIENT_SECRET` in the Vercel dashboard under Project Settings → Environment Variables.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PTX API (`ptx.transportdata.tw`) called directly from browser | TDX API via Next.js Route Handler proxy | PTX deprecated July 2022 | All calls now server-side; credentials never in browser |
| No authentication (PTX was open) | TDX OAuth2 `client_credentials` + module-level token cache | TDX launch | Token management is now a first-class concern |
| `getServerSideProps` / `getStaticProps` (Pages Router) | Server Components + Route Handlers (App Router) | Next.js 13+, stable 14+ | Cleaner server/client boundary; no `getServerSideProps` pattern |
| `fetch` GET handlers cached by default (Next.js 13/14) | Dynamic by default; opt-in caching with `next: { revalidate }` | Next.js 15 | Must explicitly set `revalidate` or `dynamic` in Route Handlers |
| `middleware.ts` | `proxy.ts` (Next.js 16) | Next.js 16 (Oct 2025) | Rename required; `middleware.ts` deprecated but still works |
| Sync `params` access | `await params` (async) | Next.js 15/16 | TypeScript strict mode catches this; codemod available |
| Vercel KV for shared token cache | In-memory module-level variable (Vercel KV discontinued) | Dec 2024 | Vercel KV sunset; use in-memory cache or Upstash Redis |
| `tailwind.config.js` | No config file; CSS-first with `@import tailwindcss` | Tailwind v4 (2025) | Simpler setup; shadcn init handles this automatically |

**Deprecated/outdated in this project:**
- `axios`: Used in old Vue 2 code. Replaced by native `fetch`.
- `element-ui`: Vue 2 component library. Replaced by shadcn/ui + Radix UI.
- `vuex`: Vue 2 state management. No equivalent needed — React Query handles server state, `useState` handles form state.
- PTX API base URL `ptx.transportdata.tw/MOTC/v2/Rail/THSR`: Dead since July 2022.

---

## Open Questions

1. **TDX API response wrapper shape for `/Station` endpoint**
   - What we know: TDX returns JSON. The old Vue 2 code (`src/api/thrs-api.js`) calls `/Station` and uses the response directly via the axios response interceptor which returns `response.data`.
   - What's unclear: Whether TDX v2 wraps the station array in an object (`{ Stations: [...] }`) or returns a bare array. The `fetchStations()` implementation handles both with `Array.isArray(data) ? data : data.Stations ?? data`.
   - Recommendation: Verify actual response shape when TDX credentials are obtained. Low recovery cost — update one line in `lib/tdx-api.ts`.

2. **TDX API version: v2 vs v3**
   - What we know: The PITFALLS research mentioned some community sources cite `/v3`. The old PTX URL used `/v2`. The TDX migration documentation typically references `/v2`.
   - What's unclear: Whether THSR endpoints are available under `/v2`, `/v3`, or both.
   - Recommendation: Use `https://tdx.transportdata.tw/api/basic/v2/Rail/THSR` as the base. Verify via TDX Swagger UI (`tdx.transportdata.tw/api-service/swagger`) when credentials are obtained. Easy to update — one constant in `lib/tdx-api.ts`.

3. **Build-time station fetch with `export const dynamic = 'force-static'`**
   - What we know: Station data is requested to be fetched at build time (SSG). The Route Handler can be made static with `export const dynamic = 'force-static'`.
   - What's unclear: Whether the mock fallback path works cleanly during `npm run build` when env vars aren't set (i.e., in CI without TDX credentials).
   - Recommendation: Test `npm run build` without TDX credentials as part of Plan 01-01 verification. The `isMockMode()` check in `lib/tdx-api.ts` must be reached during build time, not just at request time.

4. **shadcn/ui component initialization order (OKLCH colors in v4)**
   - What we know: shadcn v4 uses OKLCH colors instead of HSL. `npx shadcn@latest init` handles this automatically for new projects.
   - What's unclear: Whether any manual adjustments to `app/globals.css` are needed after init on Next.js 16 specifically.
   - Recommendation: Run `npx shadcn@latest init` and verify the generated `globals.css` contains `@theme inline` CSS variables. If styles don't appear, re-run init and check that Tailwind v4's `@import tailwindcss` is present in `globals.css`.

---

## Sources

### Primary (HIGH confidence)
- [Next.js 16 release blog](https://nextjs.org/blog/next-16) — Breaking changes (async params, removed commands), new features, create-next-app defaults, Turbopack as default (fetched 2026-02-19)
- [Next.js official docs — Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route) — Route Handler API, caching defaults, `dynamic` export
- [Next.js official docs — Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — `server-only` package usage and purpose
- [github.com/tdxmotc/SampleCode](https://github.com/tdxmotc/SampleCode) — Official TDX sample code confirming token endpoint URL, grant type, and `expires_in: 86400` (verified 2026-02-19)
- npm registry (`npm info next dist-tags`) — confirmed `next@16.1.6` is latest stable; Node.js `>=20.9.0` required (verified 2026-02-19 via STACK.md)
- [shadcn/ui official docs — Next.js installation](https://ui.shadcn.com/docs/installation/next) — shadcn init command for Next.js + Tailwind v4 (fetched 2026-02-19)

### Secondary (MEDIUM confidence)
- Existing Vue 2 codebase (`src/api/thrs-api.js`, `src/utils/request.js`) — confirmed TDX endpoint paths (`/Station`, `/DailyTimetable/OD/...`, `/GeneralTimetable`, `/AvailableSeatStatusList/{StationID}`), old PTX base URL (dead), no authentication
- [Tailwind v4 docs — shadcn/ui](https://ui.shadcn.com/docs/tailwind-v4) — OKLCH colors, `@theme inline`, shadcn v4 changes
- WebSearch results for TDX OAuth2 — corroborate token endpoint URL, rate limit of 20 calls/minute per IP on auth endpoint

### Tertiary (LOW confidence — validate when TDX credentials obtained)
- TDX API base URL for v2 THSR endpoints: `https://tdx.transportdata.tw/api/basic/v2/Rail/THSR` — verify via TDX Swagger UI
- TDX response wrapper shape for `/Station`: bare array vs `{ Stations: [...] }` — verify from actual response
- TDX rate limits on data endpoints (beyond auth endpoint) — tier-dependent; verify with actual account

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified from npm registry and Next.js 16 official blog
- Architecture patterns: HIGH — Route Handler proxy + server-only guard is textbook Next.js practice; mock/real auto-detect is a straightforward env var check
- TDX OAuth2 specifics: MEDIUM-HIGH — token endpoint URL and 86400s TTL confirmed via official TDX SampleCode GitHub repo
- Repo migration sequence: HIGH — standard git mv operations; no framework magic
- Pitfalls: HIGH (Next.js) / MEDIUM (TDX) — Next.js pitfalls verified via official docs; TDX-specific items need empirical verification

**Research date:** 2026-02-19
**Valid until:** 2026-05-19 (stable libraries; re-check if Next.js major version changes)
