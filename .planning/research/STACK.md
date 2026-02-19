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

## Installation

```bash
# Bootstrap project with App Router + TypeScript + Tailwind + ESLint
npx create-next-app@latest thsr-query \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# Navigate into project
cd thsr-query

# Initialize shadcn/ui (interactive — choose "New York" style, zinc base color)
npx shadcn@latest init

# Add shadcn/ui components used in this app
npx shadcn@latest add button card select tabs badge skeleton

# Server state management
npm install @tanstack/react-query

# Form validation
npm install react-hook-form zod @hookform/resolvers

# Date utilities
npm install date-fns

# Server boundary enforcement
npm install server-only

# Icons (installed with shadcn but explicit for version pinning)
npm install lucide-react
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

---

## Sources

### Primary (HIGH confidence — npm registry, verified 2026-02-19)

- `npm info next dist-tags` — confirmed `next@16.1.6` is `latest` stable, published 2026-01-27; Node.js `>=20.9.0` required
- `npm info next@16.1.6 peerDependencies` — confirmed React 18/19 compatibility
- `npm info tailwindcss dist-tags` — confirmed `tailwindcss@4.2.0` is latest stable
- `npm info shadcn dist-tags` — confirmed `shadcn@3.8.5` is latest (CLI tool, not `shadcn-ui`)
- `npm info @tanstack/react-query version` — confirmed `5.90.21` latest
- `npm info react version` — confirmed `react@19.2.4` latest
- `npm info typescript version` — confirmed `typescript@5.9.3` latest

### Secondary (MEDIUM confidence)

- Next.js 15 blog post (`nextjs.org/blog/next-15`) — App Router caching changes, Route Handler defaults, React 19 integration patterns. Directionally applicable to Next.js 16 (same App Router model).
- Existing Vue 2 codebase (`src/api/thrs-api.js`, `src/utils/request.js`) — confirmed TDX API base URL pattern, endpoint paths, OAuth2 client_credentials flow requirement
- `ARCHITECTURE.md` (same research session) — confirmed module-level token cache pattern and Route Handler proxy architecture

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

---

*Stack research for: Next.js 16 + TDX OAuth2, THSR Transit Query App*
*Researched: 2026-02-19*
*Valid until: 2026-05-19 (stable libraries; re-check if Next.js major version or Tailwind major version changes)*
