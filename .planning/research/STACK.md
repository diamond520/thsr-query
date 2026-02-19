# Stack Research

**Domain:** Next.js 16 App Router — Transit Query Web App (THSR / TDX OAuth2)
**Researched:** 2026-02-19
**Confidence:** HIGH

---

## Summary

This is a rewrite of a Vue 2 THSR (Taiwan High Speed Rail) query SPA into a Next.js application deployed on Vercel. The app calls the TDX API (Taiwan transport data) using OAuth2 client_credentials flow. The central stack constraint is that `client_secret` must never reach the browser — all TDX authentication happens server-side via Next.js Route Handlers.

The 2025/2026 standard for this type of project is: **Next.js 16 + App Router + TypeScript + Tailwind CSS v4 + shadcn/ui + React Query v5**. This combination is stable, has excellent Vercel integration, and keeps the server/client boundary crisp — which is exactly what OAuth2 server-side token management requires.

App Router (not Pages Router) is the right choice here. Pages Router is legacy as of Next.js 13+, and App Router's Route Handlers are the modern, idiomatic way to build a server-side API proxy that shields secrets from the client.

**Primary recommendation:** Use Next.js 16 App Router with TypeScript, Tailwind v4, shadcn/ui for UI components, and native `fetch` with `next: { revalidate }` for data fetching. No external state management needed — React Query handles server state, `useState` handles form state.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.1.6 | Full-stack React framework | Latest stable (released 2026-01-27). App Router, Route Handlers, Data Cache, Vercel-native. Pages Router is legacy. |
| React | 19.2.4 | UI rendering | Required by Next.js 16. Server Components + hooks model maps directly to this app's server/client split. |
| TypeScript | 5.9.3 | Type safety | De facto standard. shadcn/ui, TDX response types, and API boundary types all benefit from TypeScript. `next.config.ts` requires it. |
| Tailwind CSS | 4.2.0 | Utility-first styling | v4 ships as a PostCSS plugin + CSS `@import` — no `tailwind.config.js` needed. Mobile-first by default. Required by shadcn/ui. |
| shadcn/ui | 3.8.5 (CLI) | UI component library | Not a package — a code generator. Installs Radix UI primitives + Tailwind classes directly into your codebase. Gives full control over components. Standard for Next.js / Tailwind projects in 2025-2026. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | 5.90.21 | Server state management | Use for the client-side fetch calls to `/api/tdx/*`. Handles loading/error/stale states, deduplication, and caching automatically. Better than manual `useState` + `useEffect` for async data. |
| `lucide-react` | 0.574.0 | Icons | shadcn/ui uses Lucide as its icon system. Consistent iconography. Icons for swap button, loading spinner, seat status indicators. |
| `react-hook-form` | 7.71.1 | Form state management | Query forms have validation (origin != destination, date not in past). react-hook-form integrates natively with Zod and shadcn/ui form components. |
| `zod` | 4.3.6 | Schema validation | Validate Route Handler query params server-side. Validate form inputs client-side via react-hook-form's `zodResolver`. Shared schemas ensure consistency. |
| `date-fns` | 4.1.0 | Date manipulation | Format dates for TDX API calls (`YYYY-MM-DD`), display Chinese date labels (`M月D日（週X）`), calculate journey duration. |
| `server-only` | 0.0.1 | Build-time guard | Add `import 'server-only'` to `lib/tdx-token.ts` and `lib/tdx-api.ts`. Causes build error if these modules are accidentally imported in Client Components. Prevents `client_secret` exposure. |
| `class-variance-authority` | 0.7.1 | Component variant system | shadcn/ui dependency for building components with variants (e.g., seat status badge: green/yellow/red). |
| `tailwind-merge` | 3.5.0 | Tailwind class merging | shadcn/ui dependency. Prevents conflicting Tailwind classes when composing components. |
| `clsx` | 2.1.1 | Conditional class names | shadcn/ui dependency for conditional className application. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `eslint-config-next` | 16.1.6 | Next.js ESLint rules | Bundled with Next.js. Catches App Router mistakes (e.g., async Server Components without Suspense). |
| `@types/react` | 19.2.14 | React TypeScript types | Must match React version. |
| `@types/node` | 25.3.0 | Node.js TypeScript types | Needed for `process.env` types in Route Handlers. |
| `postcss` | 8.5.6 | CSS processing | Required by Tailwind v4 PostCSS plugin. Bundled with Next.js, no manual install needed. |

---

## v2.0 UX Enhancement — Stack Additions

This section covers the three new v2.0 features: round-trip query, saved routes (localStorage), and shareable query links (URL state). Research was conducted 2026-02-19.

### Feature 1: Shareable Query Links (URL State)

**Verdict: No new packages required. Use built-in Next.js App Router primitives.**

The existing stack already has everything needed for URL-driven state.

**How it works in Next.js App Router:**

`useSearchParams` (from `next/navigation`) is a Client Component hook that reads the current URL query string as a read-only `URLSearchParams` object. To update params, create a new `URLSearchParams` instance and call `router.push()` with the serialized string.

```typescript
// Pattern: read params, update params
'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

// Reading
const searchParams = useSearchParams()
const origin = searchParams.get('origin')      // '1' or null
const destination = searchParams.get('dest')   // '12' or null
const date = searchParams.get('date')          // '2026-03-15' or null

// Writing (router.push causes full navigation, router.replace avoids history entry)
const router = useRouter()
const pathname = usePathname()

const updateParams = useCallback((params: Record<string, string>) => {
  const sp = new URLSearchParams(searchParams.toString())
  Object.entries(params).forEach(([k, v]) => sp.set(k, v))
  router.replace(pathname + '?' + sp.toString())
}, [searchParams, pathname, router])
```

**Auto-run query on URL load:** When the page loads with `?origin=1&dest=12&date=2026-03-15`, read params in the component, populate the form fields, and pass a non-null `params` object to the query — React Query fires automatically because `enabled: !!params` becomes `true`.

**Suspense requirement (production build):** Any Client Component using `useSearchParams` **must** be wrapped in a `<Suspense>` boundary or the production build fails with `Missing Suspense boundary with useSearchParams`. Verified against Next.js 16.1.6 docs.

```typescript
// page.tsx wraps the shareable query form in Suspense
import { Suspense } from 'react'
import { QueryFormWithURL } from '@/components/query-form-url'

export default function Page() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <QueryFormWithURL />
    </Suspense>
  )
}
```

**Alternative considered — `nuqs` (v2.8.8):** nuqs is a `useState`-compatible wrapper that syncs state with URL params, with type-safe parsers. It would eliminate the boilerplate of manually constructing `URLSearchParams`. However, it adds a dependency and requires wrapping the app in `NuqsAdapter`. For three simple string params (origin, destination, date), the native approach is straightforward enough. **Use nuqs only if URL state grows to many params or requires type coercion** (e.g., booleans, arrays). For v2.0, native `useSearchParams` + `router.replace` is sufficient.

**React Query integration with URL params:**

React Query v5 works naturally with URL-driven queries. Include the URL params in the `queryKey` — React Query re-fetches automatically when the key changes (i.e., when URL params change):

```typescript
const origin = searchParams.get('origin') ?? ''
const dest = searchParams.get('dest') ?? ''
const date = searchParams.get('date') ?? ''
const hasAllParams = !!origin && !!dest && !!date

const { data, isLoading, isError } = useQuery({
  queryKey: ['trains', origin, dest, date],
  queryFn: () => fetchTrains({ origin, dest, date }),
  enabled: hasAllParams,   // skipToken alternative: queryFn: hasAllParams ? () => fetch(...) : skipToken
  staleTime: 5 * 60 * 1000,
})
```

React Query v5 also supports `skipToken` as a type-safe alternative to `enabled: false` that narrows parameter types inside `queryFn`. Either approach is valid; `enabled` is simpler for this use case.

**Source:** Next.js 16.1.6 official docs — `useSearchParams`, verified 2026-02-16. [https://nextjs.org/docs/app/api-reference/functions/use-search-params](https://nextjs.org/docs/app/api-reference/functions/use-search-params). Confidence: HIGH.

---

### Feature 2: Round-Trip Query (Side-by-Side Results)

**Verdict: No new packages required. Existing shadcn/ui Tabs component + Tailwind grid handles layout.**

**UI approach — two options:**

**Option A (recommended): Tab-based toggle.** Add a "來回票" tab alongside the existing query modes, or add a toggle within the by-OD mode that switches between single and round-trip. Each direction (outbound / return) has its own date picker. Results appear side-by-side on desktop (CSS grid), stacked on mobile.

```
Desktop: [Outbound results | Return results]   (grid grid-cols-2 gap-4)
Mobile:  [Outbound results]
         [Return results]                       (single column, stacked)
```

The existing `Tabs` component (already installed, `src/components/ui/tabs.tsx`) handles the outbound/return toggle UI. The existing `Calendar` + `Popover` components handle the two date pickers. No new shadcn/ui components are needed beyond what's already installed.

**Option B: Two separate form sections.** Render a second collapsible form below the outbound form. Simpler state model but more screen space.

Option A is recommended because it avoids duplicating the station picker UI, and the existing `Tabs` component supports it directly.

**React state for round-trip:**

```typescript
// Two independent QueryParams, one per direction
const [outboundParams, setOutboundParams] = useState<QueryParams | null>(null)
const [returnParams, setReturnParams] = useState<QueryParams | null>(null)

// When origin/destination are set, auto-swap them for return leg
function handleOutboundSubmit(params: QueryParams) {
  setOutboundParams(params)
  // Pre-populate return with swapped origin/destination (user can override date)
  setReturnParams(prev => prev ?? {
    origin: params.destination,
    destination: params.origin,
    date: params.date,
  })
}
```

Two independent `useQuery` calls (one per direction) in React Query v5 is the correct pattern — they cache independently and fetch in parallel.

**Layout: Tailwind `md:grid-cols-2`**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <h2 className="text-sm font-medium mb-2">去程</h2>
    <TrainList params={outboundParams} />
  </div>
  <div>
    <h2 className="text-sm font-medium mb-2">回程</h2>
    <TrainList params={returnParams} />
  </div>
</div>
```

The existing `TrainList` component is designed to accept `QueryParams | null` and handles idle/loading/error/empty states independently — it requires no changes to support round-trip. Just render two instances.

**shadcn/ui components needed for round-trip:** All already installed. The `Separator` component would improve visual separation between outbound and return sections, but is optional (a Tailwind `border` works too).

To add Separator if desired: `npx shadcn@latest add separator` — it's a thin Radix UI wrapper, zero new dependencies.

---

### Feature 3: Saved Routes (localStorage)

**Verdict: One new package recommended — `usehooks-ts` — or inline a 20-line custom hook. No heavyweight state management needed.**

**Why a hook, not raw `localStorage`:**

Calling `localStorage` directly from a React component during SSR throws `window is undefined` in Next.js. A hook that guards with `typeof window !== 'undefined'` and fires only in `useEffect` is the safe pattern. Writing this correctly the first time (handling SSR, cross-tab sync, JSON serialization) takes ~30 lines of boilerplate.

**Option A (recommended for this project): Inline custom hook**

The saved routes feature is simple: an array of `{ origin: string; destination: string; label?: string }` objects stored under one localStorage key. A typed custom hook is 30 lines and adds zero dependencies:

```typescript
// src/hooks/use-saved-routes.ts
'use client'
import { useState, useEffect } from 'react'

interface SavedRoute {
  origin: string
  destination: string
  label?: string
}

const KEY = 'thsr-saved-routes'

export function useSavedRoutes() {
  const [routes, setRoutes] = useState<SavedRoute[]>([])

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setRoutes(JSON.parse(raw))
    } catch {}
  }, [])

  function save(route: SavedRoute) {
    const next = [route, ...routes.filter(r =>
      r.origin !== route.origin || r.destination !== route.destination
    )].slice(0, 10) // cap at 10 saved routes
    setRoutes(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  function remove(origin: string, destination: string) {
    const next = routes.filter(r => r.origin !== origin || r.destination !== destination)
    setRoutes(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  return { routes, save, remove }
}
```

This approach: no new dependency, full type safety, SSR-safe (hydrates after mount), handles JSON serialization.

**Option B: `usehooks-ts` (v3.1.1)**

`usehooks-ts` is a TypeScript-first, tree-shakable collection of React hooks. Its `useLocalStorage` hook adds: automatic cross-tab sync via `StorageEvent`, configurable serializer/deserializer, and an `initializeWithValue` flag for SSR safety. The package is 47kb unpacked, tree-shakes to ~3-5kb for a single hook.

```typescript
import { useLocalStorage } from 'usehooks-ts'

const [routes, setRoutes] = useLocalStorage<SavedRoute[]>('thsr-saved-routes', [])
// routes is hydrated synchronously (SSR: uses initialValue, then syncs on mount)
```

**Recommendation: Use the inline custom hook.** The saved routes feature needs exactly one localStorage key with a simple array. `usehooks-ts` is well-maintained and the right choice if the project accumulates multiple localStorage concerns, but adding a dependency for a single use case is unjustified here. If more hooks are needed later (e.g., `useDebounce`, `useWindowSize`), add `usehooks-ts` at that point.

**If `usehooks-ts` is chosen:** `npm install usehooks-ts@3.1.1`

**shadcn/ui components for saved routes UI:**

The existing stack has everything needed:
- `Button` — "儲存" and quick-load buttons
- `Badge` — display saved route labels
- `Card` or inline `div` — saved routes list container

No new shadcn/ui components required.

---

## Installation (v2.0 additions only)

```bash
# No new packages required for the core three features.
# The existing stack handles all three features natively.

# OPTIONAL: Add shadcn Separator for visual dividers in round-trip layout
npx shadcn@latest add separator

# OPTIONAL: Add usehooks-ts if localStorage complexity grows beyond a single key
npm install usehooks-ts@3.1.1

# OPTIONAL: Add nuqs if URL state grows beyond 3-4 simple string params
npm install nuqs@2.8.8
```

---

## TDX OAuth2 Integration Approach

### The Core Problem

TDX API requires `client_id` and `client_secret` to obtain a Bearer token. These credentials **must never reach the browser**. The solution is a server-side token manager that:

1. Lives in `lib/tdx-token.ts` (server-only module)
2. Is called only by Route Handlers (`app/api/tdx/*/route.ts`)
3. Uses a module-level variable to cache the token between requests
4. Client Components fetch `/api/tdx/*` endpoints — they never call TDX directly

### Token Endpoint (LOW confidence — verify when credentials available)

```
POST https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={TDX_CLIENT_ID}
&client_secret={TDX_CLIENT_SECRET}
```

Response: `{ "access_token": "...", "expires_in": 86400, "token_type": "Bearer" }`

### Token Caching Strategy

Use **module-level variable** (in-memory cache):

```typescript
// lib/tdx-token.ts
import 'server-only'

let cachedToken: { value: string; expiresAt: number } | null = null

export async function getTdxToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
    return cachedToken.value
  }
  // ... fetch new token from TDX auth endpoint
}
```

**Why module-level, not Redis or cookies:**
- TDX tokens are stateless Bearer tokens — multiple Vercel instances each holding a copy is fine
- Free, zero dependencies, simple to reason about
- Token TTL is ~24h, cold start re-fetch adds ~200ms once per instance spin-up — invisible to users
- Redis adds operational cost and complexity with no functional benefit at this scale

### Route Handler Proxy Pattern

```typescript
// app/api/tdx/stations/route.ts
import { getTdxToken } from '@/lib/tdx-token'

const TDX_BASE = 'https://tdx.transportdata.tw/api/basic/v2/Rail/THSR'

export async function GET() {
  const token = await getTdxToken()
  const res = await fetch(`${TDX_BASE}/Station`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 86400 },  // Cache station list 24h in Next.js Data Cache
  })
  if (!res.ok) {
    return Response.json({ error: 'TDX API error' }, { status: res.status })
  }
  return Response.json(await res.json())
}
```

### Environment Variables

```bash
# .env.local — NEVER commit this file
TDX_CLIENT_ID=your_client_id_here
TDX_CLIENT_SECRET=your_client_secret_here
```

**Critical:** No `NEXT_PUBLIC_` prefix. Variables without this prefix are server-only and are replaced with empty strings in the client bundle.

---

## Data Fetching Patterns

### Server-Side (static/reference data)

Use Next.js `fetch` with `next: { revalidate }` inside Server Components or Route Handlers. Station list is stable — revalidate every 24h.

```typescript
// app/page.tsx (Server Component)
async function getStations() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/tdx/stations`, {
    next: { revalidate: 86400 },
  })
  return res.json()
}
```

### Client-Side (user-triggered queries)

Use React Query for client-side data fetching. Query forms are Client Components that submit to `/api/tdx/*` Route Handlers.

```typescript
// components/ByTimeForm.tsx
'use client'
import { useQuery } from '@tanstack/react-query'

// Enable queries only when form is submitted (enabled: false initially)
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['timetable', from, to, date],
  queryFn: () => fetch(`/api/tdx/timetable?from=${from}&to=${to}&date=${date}`).then(r => r.json()),
  enabled: false,  // Only run when user submits
  staleTime: 5 * 60 * 1000,  // 5 minutes
})
```

### Caching by Data Type

| Data | `revalidate` | Rationale |
|------|-------------|-----------|
| Station list | 86400s (24h) | THSR stations are essentially static — added once every few years |
| Timetable (daily OD) | 300s (5min) | Schedule published in advance; changes rare but possible |
| General timetable (by train no) | 86400s (24h) | Fixed schedule data |
| Seat availability | 60s (1min) | Changes frequently as tickets sell — shortest reasonable interval |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js App Router | Pages Router | Never for new projects. Pages Router is legacy. Only use if maintaining an existing Pages Router codebase. |
| shadcn/ui | Mantine, Ant Design, MUI | Mantine/MUI: if you need a full pre-styled design system (e.g., admin dashboard). For a custom-branded transit app, shadcn/ui's code-ownership model is better. |
| Tailwind CSS v4 | CSS Modules, styled-components | CSS Modules: valid for component-scoped styles alongside Tailwind. Styled-components: adds runtime cost; no benefit over Tailwind. |
| React Query v5 | SWR, native fetch + useState | SWR: perfectly valid alternative. React Query: better DevTools, more control over query lifecycle (enabled flag). SWR is simpler if React Query feels like overkill. |
| `react-hook-form` + Zod | Formik + Yup | react-hook-form: less re-renders, native integration with shadcn form components. Formik+Yup: legacy. |
| `date-fns` v4 | `dayjs`, `luxon` | dayjs: lighter (2kb vs 5kb for used functions). date-fns: tree-shakable, better TypeScript types, immutable. Both are valid. |
| Module-level token cache | Upstash Redis | Upstash Redis: only if multiple Vercel instances sharing token state becomes a measurable problem. Start simple. |
| Native `useSearchParams` + `router.replace` | `nuqs` | nuqs: use if URL state grows to 5+ params, needs type coercion (booleans, numbers, arrays), or needs array/object serialization. For 3 string params, native is sufficient. |
| Inline `useSavedRoutes` hook | `usehooks-ts` | usehooks-ts: use if project needs multiple localStorage hooks or cross-tab sync becomes a requirement. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `next/dynamic` with `ssr: false` for everything | Disabled in App Router Server Components (Next.js 16 throws build error). Unnecessary for this app's architecture. | Client Components with `'use client'` directive where interactivity is needed. |
| `next-auth` / Auth.js | Heavy dependency for a public app with no login. Adds complexity without benefit. | None needed. TDX auth is server-side only via Route Handlers. |
| `axios` | Extra dependency that adds 20kb+ when native `fetch` is built into Node 18+ and all modern browsers. Old Vue 2 codebase used it; don't carry it over. | Native `fetch`. Available in Next.js Route Handlers and Client Components. |
| `redux` / `zustand` | This app has no shared global state. Query forms are independent. Station list is fetched once and passed as props. | `useState` for form state, React Query for server state. |
| Element UI (Vue) | Vue 2 component library. Irrelevant in React. | shadcn/ui with Radix UI primitives. |
| `NEXT_PUBLIC_TDX_CLIENT_SECRET` | Exposes `client_secret` to every browser. TDX account will be compromised. | `TDX_CLIENT_SECRET` (no `NEXT_PUBLIC_` prefix). Server-only. |
| Pages Router (`pages/` directory) | Legacy API. No Server Components, no Route Handlers as co-located files. Next.js team's focus is App Router. | App Router (`app/` directory). |
| React Server Components for query forms | Query forms depend on user input at runtime — cannot be pre-rendered. | Client Components (`'use client'`) for forms, Server Components only for static/cached data like station list. |
| `getServerSideProps` | Pages Router pattern. Not available in App Router. | App Router: Route Handlers for API + Server Components for data fetching. |
| `window.localStorage` directly in component render | Throws `window is undefined` during SSR/build. | Access localStorage in `useEffect` or use the inline `useSavedRoutes` hook. |
| `router.push` for URL param updates (shareable links) | `router.push` adds a browser history entry — pressing Back during autocomplete is disruptive. | `router.replace` for param updates that should not create history entries. |

---

## Stack Patterns by Variant

**For server-side data (station list, general timetable):**
- Fetch inside a Server Component or a Route Handler with `next: { revalidate: N }`
- Pass data as props to Client Components
- Because: Runs at build time or on-demand on server — no client JavaScript shipped

**For user-triggered queries (timetable by OD+date, seat status):**
- Fetch from a Client Component via React Query pointing to a Route Handler
- Because: Query parameters only exist at runtime from user input

**For the OAuth2 token:**
- Module-level variable in `lib/tdx-token.ts` with `import 'server-only'`
- Called only from Route Handlers
- Because: Persists within a Vercel function instance, never reaches client bundle

**For UI components (forms, selects, badges, cards):**
- Install via `npx shadcn@latest add [component]`
- Customize the generated code in `components/ui/`
- Because: Components live in your repo, not in a node_modules black box

**For URL-based shareable links:**
- `useSearchParams()` to read, `router.replace(pathname + '?' + params.toString())` to write
- Wrap consuming component in `<Suspense>` in `page.tsx`
- Include URL params in React Query `queryKey` array so queries re-fire on URL change
- Because: Native App Router pattern, no extra dependency

**For saved routes (localStorage):**
- Inline `useSavedRoutes` custom hook in `src/hooks/`
- Hydrate state in `useEffect` (never in render) to avoid SSR mismatch
- Cap at ~10 saved routes to prevent unbounded localStorage growth
- Because: One key, simple array — no library justified

**For round-trip layout:**
- Render two `TrainList` instances (existing component, no changes needed)
- Wrap in `grid grid-cols-1 md:grid-cols-2 gap-4` Tailwind container
- Use existing `Tabs` component to toggle between single/round-trip modes
- Because: `TrainList` is already self-contained with idle/loading/error states

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `next@16.1.6` | `react@^18 \|\| ^19`, Node.js `>=20.9.0` | Node 20 required — verify hosting environment |
| `tailwindcss@4.2.0` | PostCSS 8.x | v4 uses `@tailwindcss/postcss` instead of direct `tailwind.config.js`. Next.js 16 bundles PostCSS 8.4.31 — compatible. |
| `shadcn@3.8.5` | Next.js 15+ recommended; works with 16 | shadcn generates components in your codebase — not a runtime dependency. Compatible with any Next.js version that supports Tailwind. |
| `@tanstack/react-query@5.90.21` | `react@^18 \|\| ^19` | v5 has breaking changes from v4 (no `useQuery({ onSuccess })` — use `useEffect` instead). |
| `react-hook-form@7.71.1` | `react@^16.8 \|\| ^17 \|\| ^18 \|\| ^19` | Fully compatible with React 19. |
| `zod@4.3.6` | TypeScript 5.x | Zod v4 has breaking changes from v3. Use v4 since this is a new project. |
| `date-fns@4.1.0` | TypeScript 5.x | v4 is fully tree-shakable. Breaking changes from v2/v3 in some format tokens. New project — use v4. |
| `usehooks-ts@3.1.1` (optional) | `react@^16.8 \|\| ^17 \|\| ^18 \|\| ^19` | Only needed if inline localStorage hook proves insufficient. v3.x is the current major. |
| `nuqs@2.8.8` (optional) | Next.js `>=14.2.0` | Only needed if URL state complexity grows. Requires `NuqsAdapter` in root layout. |

---

## Sources

### Primary (HIGH confidence — npm registry + official docs, verified 2026-02-19)

- `npm info next dist-tags` — confirmed `next@16.1.6` is `latest` stable, published 2026-01-27; Node.js `>=20.9.0` required
- `npm info next@16.1.6 peerDependencies` — confirmed React 18/19 compatibility
- `npm info tailwindcss dist-tags` — confirmed `tailwindcss@4.2.0` is latest stable
- `npm info shadcn dist-tags` — confirmed `shadcn@3.8.5` is latest (CLI tool, not `shadcn-ui`)
- `npm info @tanstack/react-query version` — confirmed `5.90.21` latest
- `npm info react version` — confirmed `react@19.2.4` latest
- `npm info typescript version` — confirmed `typescript@5.9.3` latest
- `npm show usehooks-ts version` — confirmed `3.1.1` is current
- `npm show nuqs version` — confirmed `2.8.8` is current
- Next.js 16.1.6 official docs, `useSearchParams` page — verified 2026-02-16. URL: [https://nextjs.org/docs/app/api-reference/functions/use-search-params](https://nextjs.org/docs/app/api-reference/functions/use-search-params). Confirmed: Suspense requirement for static rendering, `router.replace` + `new URLSearchParams` pattern for updates, Client Component only restriction.
- TanStack Query v5 official docs — `enabled` option, `skipToken`, queryKey array serialization. [https://tanstack.com/query/v5/docs/framework/react/guides/disabling-queries](https://tanstack.com/query/v5/docs/framework/react/guides/disabling-queries). Confirmed: `enabled: !!params` pattern, `skipToken` for type-safe disabling.

### Secondary (MEDIUM confidence)

- Next.js 15 blog post (`nextjs.org/blog/next-15`) — App Router caching changes, Route Handler defaults, React 19 integration patterns. Directionally applicable to Next.js 16 (same App Router model).
- Existing codebase inspection (`src/components/train-list.tsx`, `src/app/page.tsx`) — confirmed `enabled: !!params` pattern already in use, confirmed `Tabs` component installed and functioning, confirmed `react-day-picker` calendar already installed.
- WebSearch — nuqs documentation and community usage patterns. Multiple 2025 sources confirm active maintenance and Next.js 15/16 compatibility.
- WebSearch — usehooks-ts SSR behavior. Multiple sources confirm v3 `useLocalStorage` handles SSR via `initializeWithValue` option.

### Tertiary (LOW confidence — validate before implementing)

- TDX OAuth2 token endpoint URL: `https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token` — verify with TDX official docs when credentials are obtained
- TDX token TTL ~86400s — commonly cited but empirically unverified; check `expires_in` from actual token response

---

## Open Questions

1. **Next.js 16 vs 15.3.9 — which is safer for new projects?**
   - What we know: `next@16.1.6` is npm `latest` (released 2026-01-27). `next@15.3.9` is the `next-15-3` tag.
   - What's unclear: Whether Next.js 16 introduced breaking changes that affect shadcn/ui generators or community tutorials.
   - Recommendation: Use Next.js 16 (it's `latest`). If shadcn init or any community tool fails, pin to `next@15.3.9` (still fully supported, backport tag active as of 2026-02-19).

2. **Tailwind v4 and shadcn/ui compatibility**
   - What we know: shadcn CLI `3.8.5` supports Tailwind v4 (the CLI was updated alongside v4 release in early 2025).
   - What's unclear: Whether all shadcn component templates work out-of-the-box with v4's CSS-variable approach vs v3's `tailwind.config.js` approach.
   - Recommendation: Run `npx shadcn@latest init` after `create-next-app` to let the CLI detect and configure for v4 automatically. If issues arise, check shadcn v4 migration docs.

3. **TDX API base URL for v2 endpoints**
   - What we know: Old PTX URL was `ptx.transportdata.tw/MOTC/v2/Rail/THSR`. TDX URL is `tdx.transportdata.tw/api/basic/v2/Rail/THSR` based on community documentation.
   - What's unclear: Whether TDX has changed the path structure since migration.
   - Recommendation: Verify exact base URL with TDX Swagger UI (`tdx.transportdata.tw/api-service/swagger`) when credentials are available.

4. **Round-trip URL state encoding**
   - For shareable round-trip links, the URL needs to encode two sets of params: outbound (origin, dest, date) and return (return_date at minimum, since origin/dest invert).
   - Proposed scheme: `?origin=1&dest=12&date=2026-03-15&return_date=2026-03-18`
   - The `return_date` param presence acts as a signal to activate round-trip mode.
   - This is a design decision, not a technical blocker — no library research needed.

---

*Stack research for: Next.js 16 + TDX OAuth2, THSR Transit Query App*
*Researched: 2026-02-19*
*v2.0 UX Enhancement additions researched: 2026-02-19*
*Valid until: 2026-05-19 (stable libraries; re-check if Next.js major version or Tailwind major version changes)*
