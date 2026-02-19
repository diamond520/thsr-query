# Phase 5: Shareable URL - Research

**Researched:** 2026-02-19
**Domain:** Next.js App Router URL state management (useSearchParams, router.replace, Web Share API)
**Confidence:** HIGH

---

## Summary

Phase 5 adds shareable URL support: after a user submits a query, the browser URL updates to `?from=<StationID>&to=<StationID>&date=<YYYY-MM-DD>`. When another user opens that URL, the form pre-fills and the query executes automatically. A share/copy button completes the flow.

The core technical challenge is **Next.js's mandatory Suspense boundary for `useSearchParams()`** in production builds (`next build`). In development it is invisible — the build breaks silently only in production. The pre-decided architecture (SearchParamsInit child component inside `<Suspense>`) is exactly correct and well-supported by official documentation. No new packages are required; everything needed is in the existing stack (Next.js 16 `useRouter`, `useSearchParams`, `usePathname`, native Clipboard/Web Share APIs).

The key-prop remount pattern for pre-filling `QueryForm` state from URL params is a proven React idiom. The URL update itself uses `router.replace()` with `{ scroll: false }` — no history entry, no scroll jank.

**Primary recommendation:** Implement the SearchParamsInit child component pattern with Suspense in `page.tsx`; use `router.replace()` for URL sync; use `navigator.share()` with `navigator.clipboard.writeText()` fallback for the share button.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHAR-01 | 使用者可複製含起訖站與日期的查詢連結；他人開啟連結後頁面自動帶入條件並執行查詢 | SearchParamsInit pattern reads URL on load and triggers pre-fill; router.replace() writes URL on submit; navigator.share()/clipboard provides copy mechanism |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/navigation` useSearchParams | built-in (Next.js 16.1.6) | Read URL query params on client | Only client-safe hook for reading searchParams in App Router |
| `next/navigation` useRouter | built-in | router.replace() to update URL without history entry | Official App Router navigation API |
| `next/navigation` usePathname | built-in | Get current pathname for constructing new URL | Required alongside useRouter for URL construction |
| `react` Suspense | built-in (React 19) | Wrap SearchParamsInit to satisfy next build requirement | Mandatory — production build fails without it |
| `navigator.share()` / `navigator.clipboard.writeText()` | Browser built-in | Share/copy URL to clipboard | No package needed; ~92% global support with clipboard fallback |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | ^0.574.0 (already installed) | Share/Copy icons for the share button | Use `Share2`, `Copy`, `Check` icons |
| shadcn/ui Button | already installed | Share button UI | Consistent with existing form buttons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual useSearchParams + router.replace | `nuqs` library | nuqs adds 3rd party dependency; not needed per prior decision "No new packages needed for v2.0" |
| router.replace() | window.history.replaceState() | window.history bypasses Next.js router; useSearchParams() still reads correctly but less idiomatic |
| navigator.share() fallback to clipboard | Clipboard-only button | navigator.share() provides native share sheet on mobile (iOS Safari, Android Chrome) which is better UX |

**Installation:** No new packages needed. All APIs are built-in.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── page.tsx          # 'use client' — add Suspense + SearchParamsInit, router.replace on submit
├── components/
│   ├── query-form.tsx    # Add initialOrigin?, initialDestination?, initialDate? props + key remount
│   ├── search-params-init.tsx  # NEW: 'use client', calls useSearchParams(), passes values up via callback
│   └── share-button.tsx  # NEW: navigator.share() + clipboard fallback
```

### Pattern 1: SearchParamsInit Child Component + Suspense
**What:** A dedicated `'use client'` component that calls `useSearchParams()` and fires a callback on mount. Wrapped in `<Suspense>` from the parent `page.tsx`.

**When to use:** Required when a `'use client'` page.tsx (or any statically rendered page) needs URL search params at load time without production build failures.

**Why it works:** During `next build`, Next.js static prerendering will hit the `<Suspense>` boundary before reaching `SearchParamsInit`. The `useSearchParams()` call is isolated inside the boundary — the rest of the page is unaffected.

**Source:** https://nextjs.org/docs/app/api-reference/functions/use-search-params — "Static Rendering" section; https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout

```typescript
// Source: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
// src/components/search-params-init.tsx
'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface SearchParamsInitProps {
  onInit: (from: string | null, to: string | null, date: string | null) => void
}

export function SearchParamsInit({ onInit }: SearchParamsInitProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const date = searchParams.get('date')
    // Only call if any params exist (avoids spurious init on clean load)
    if (from || to || date) {
      onInit(from, to, date)
    }
  }, []) // run once on mount only

  return null  // renders nothing
}
```

```typescript
// src/app/page.tsx — updated to wrap SearchParamsInit in Suspense
'use client'

import { Suspense } from 'react'
import { SearchParamsInit } from '@/components/search-params-init'

export default function Home() {
  const [initialOrigin, setInitialOrigin] = useState<string | undefined>()
  const [initialDestination, setInitialDestination] = useState<string | undefined>()
  const [initialDate, setInitialDate] = useState<string | undefined>()
  const [formKey, setFormKey] = useState(0)

  function handleParamInit(from: string | null, to: string | null, date: string | null) {
    if (from) setInitialOrigin(from)
    if (to) setInitialDestination(to)
    if (date) setInitialDate(date)
    setFormKey(k => k + 1)  // remount QueryForm to pick up initial values
    // Also trigger query automatically:
    if (from && to && date) setQueryParams({ origin: from, destination: to, date })
  }

  return (
    <main>
      {/* Suspense boundary is REQUIRED for next build — null fallback is fine */}
      <Suspense fallback={null}>
        <SearchParamsInit onInit={handleParamInit} />
      </Suspense>
      {/* ... rest of page, QueryForm with key={formKey} ... */}
    </main>
  )
}
```

### Pattern 2: URL Update on Submit with router.replace()
**What:** On form submit, call `router.replace()` with `{ scroll: false }` to update the URL without adding a history entry or triggering a page reload.

**When to use:** After every successful form submit in the by-OD tab.

**Source:** https://nextjs.org/docs/app/api-reference/functions/use-router — router.replace() docs

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-router
// In page.tsx (already 'use client') or passed to QueryForm
'use client'
import { useRouter, usePathname } from 'next/navigation'

const router = useRouter()
const pathname = usePathname()

function handleQuerySubmit(params: QueryParams) {
  setQueryParams(params)

  // Update URL without page reload or history entry
  const urlParams = new URLSearchParams({
    from: params.origin,
    to: params.destination,
    date: params.date,
  })
  router.replace(`${pathname}?${urlParams.toString()}`, { scroll: false })
}
```

### Pattern 3: Key-Prop Remount for Form Pre-fill
**What:** Pass a `key` prop to `QueryForm` that increments when URL params arrive. This forces React to unmount and remount the component, resetting its `useState` initializers to pick up the new `initial*` props.

**When to use:** When a form uses `useState` for its fields (not controlled from outside), and you need to reset state to new values.

**Source:** Standard React pattern — key prop causes full component remount

```typescript
// In page.tsx
<QueryForm
  key={formKey}                          // forces remount when URL params load
  initialOrigin={initialOrigin}
  initialDestination={initialDestination}
  initialDate={initialDate}
  onSubmit={handleQuerySubmit}
/>

// In QueryForm — update useState initializers to accept optional initial values
const [origin, setOrigin] = useState<string>(initialOrigin ?? '')
const [destination, setDestination] = useState<string>(initialDestination ?? '')
const [date, setDate] = useState<Date>(() =>
  initialDate ? new Date(initialDate + 'T00:00:00') : getTaiwanToday()
)
```

### Pattern 4: Share Button with Web Share API + Clipboard Fallback
**What:** A button that attempts `navigator.share()` (native share sheet on mobile); falls back to `navigator.clipboard.writeText()` (desktop).

**Source:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API, https://caniuse.com/web-share

```typescript
// src/components/share-button.tsx
'use client'
import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShareButtonProps {
  params: QueryParams | null
}

export function ShareButton({ params }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  if (!params) return null

  async function handleShare() {
    const url = window.location.href  // URL already updated by router.replace()

    // Try Web Share API first (mobile native sheet)
    if (navigator.share && navigator.canShare({ url })) {
      try {
        await navigator.share({ title: '高鐵查詢', url })
        return
      } catch (e) {
        // User cancelled or share failed — fall through to clipboard
        if ((e as DOMException).name === 'AbortError') return
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable (non-HTTPS or denied)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied ? <Check className="h-4 w-4 mr-1" /> : <Share2 className="h-4 w-4 mr-1" />}
      {copied ? '已複製' : '分享'}
    </Button>
  )
}
```

### Anti-Patterns to Avoid
- **Calling `useSearchParams()` directly in `page.tsx` body (outside Suspense child):** Even though `page.tsx` is `'use client'`, the build will still fail in production because Next.js enforces the Suspense requirement during static prerendering.
- **Using `router.push()` for URL updates:** Creates new browser history entries — back button would re-visit every search. Use `router.replace()` instead.
- **Reading params in `useEffect` without Suspense isolation:** The `useSearchParams()` call itself is what triggers the build failure — it must be in the Suspense-wrapped child, not the effect.
- **Calling `getTaiwanToday()` outside `useState` initializer for the `initialDate` parse:** Safe to construct `new Date(initialDate + 'T00:00:00')` inside the `useState` initializer — consistent with existing hydration-safe pattern.
- **Using `window.location.search` instead of `useSearchParams()`:** Works but bypasses React's rendering lifecycle; useSearchParams is the correct App Router approach.
- **Missing `{ scroll: false }` in `router.replace()`:** Without it, Next.js scrolls to top on URL update — jarring UX when user just submitted the form.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL state sync with React | Custom history listener + state | `useSearchParams()` + `router.replace()` | Official App Router primitives; handles SSR/hydration edge cases |
| Copy to clipboard | `document.execCommand('copy')` | `navigator.clipboard.writeText()` | execCommand is deprecated; Clipboard API is the modern standard |
| Native share dialog | Custom share modal | `navigator.share()` | OS-level share sheet; no custom UI needed |
| URL parameter serialization | Custom string building | `new URLSearchParams({ ... }).toString()` | Built-in browser API; handles encoding correctly |

**Key insight:** The browser platform already has all the required APIs for this phase. The main work is wiring them together correctly within Next.js's Suspense/rendering model.

---

## Common Pitfalls

### Pitfall 1: Suspense Boundary Invisibility in Dev
**What goes wrong:** `useSearchParams()` without Suspense works perfectly in `next dev`. The build error only appears during `next build`.
**Why it happens:** In development, routes are rendered on-demand (not statically prerendered), so the Suspense requirement is never enforced.
**How to avoid:** Add `<Suspense>` wrapping `SearchParamsInit` immediately — do not wait to "test in prod." Run `next build` locally to verify.
**Warning signs:** "works in dev" is the warning sign — always verify with `next build`.

**Source:** https://nextjs.org/docs/app/api-reference/functions/use-search-params — "Good to know: In development, routes are rendered on-demand, so useSearchParams doesn't suspend"

### Pitfall 2: Suspense Fallback Causes Layout Shift
**What goes wrong:** If `fallback` renders visible UI that differs from the loaded state, users see a flash/shift when `SearchParamsInit` mounts.
**Why it happens:** Suspense fallback renders during the window between initial render and hydration.
**How to avoid:** Use `fallback={null}` since `SearchParamsInit` renders nothing (it's an effect-only component). No visible fallback = no layout shift.

### Pitfall 3: Double Query on URL Load
**What goes wrong:** `SearchParamsInit` fires `onInit`, which sets `queryParams` and triggers the query. If the user also submitted the form, two queries fire.
**Why it happens:** `onInit` unconditionally calls `setQueryParams`.
**How to avoid:** In `handleParamInit`, only call `setQueryParams` if all three params are present and valid. The `useEffect` in `SearchParamsInit` should only fire once (empty dep array).

### Pitfall 4: Form Pre-fill Without Remount Doesn't Work
**What goes wrong:** Passing new `initialOrigin` etc. props to `QueryForm` after it mounted doesn't change the visible form values because `useState` ignores prop changes after mount.
**Why it happens:** `useState` only uses its initializer on first render.
**How to avoid:** Use the key-prop remount pattern — increment `formKey` when URL params arrive. This forces `QueryForm` to unmount and remount, re-running all `useState` initializers.

### Pitfall 5: Web Share API Requires User Gesture
**What goes wrong:** Calling `navigator.share()` outside a click handler throws `NotAllowedError`.
**Why it happens:** Web Share API requires "transient activation" (a recent user gesture like a click/tap).
**How to avoid:** Always call `navigator.share()` directly from a `onClick` event handler — do not call it from a `useEffect` or `setTimeout`.

### Pitfall 6: Clipboard API Not Available Without HTTPS
**What goes wrong:** `navigator.clipboard.writeText()` throws or is undefined on non-HTTPS pages.
**Why it happens:** Clipboard API is restricted to secure contexts (HTTPS or localhost).
**How to avoid:** Wrap clipboard call in try/catch. In production Next.js deployments this is never an issue (Vercel, etc. are always HTTPS).

### Pitfall 7: `router.replace()` Triggers React Query Re-fetch
**What goes wrong:** After calling `router.replace()`, if `queryKey` depends on URL params (not local state), the query may re-run.
**Why it happens:** In this app, `queryKey=['trains', params]` uses the local `queryParams` state, NOT the URL. So router.replace() does NOT trigger a re-fetch. This is the correct architecture.
**How to avoid:** Keep query driven by local state (`queryParams`), not by reading URL. SearchParamsInit only sets state on initial load. URL is a side-effect of submission, not the source of truth for runtime state.

---

## Code Examples

Verified patterns from official sources:

### Reading URL Params (production-safe)
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-search-params
'use client'
import { useSearchParams } from 'next/navigation'

function SearchParamsInit({ onInit }: { onInit: (from: string | null, to: string | null, date: string | null) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    onInit(searchParams.get('from'), searchParams.get('to'), searchParams.get('date'))
  }, [])
  return null
}

// In page.tsx — wrap in Suspense
<Suspense fallback={null}>
  <SearchParamsInit onInit={handleParamInit} />
</Suspense>
```

### Updating URL on Submit (no history entry)
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-router
import { useRouter, usePathname } from 'next/navigation'

const router = useRouter()
const pathname = usePathname()

function handleSubmit(params: QueryParams) {
  const sp = new URLSearchParams({ from: params.origin, to: params.destination, date: params.date })
  router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
}
```

### Share Button (Web Share + Clipboard fallback)
```typescript
// Source: MDN Web Share API + Clipboard API
async function handleShare() {
  const url = window.location.href
  if (navigator.share && navigator.canShare({ url })) {
    await navigator.share({ title: '高鐵查詢', url })
  } else {
    await navigator.clipboard.writeText(url)
    // show "copied" feedback
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `export const dynamic = 'force-dynamic'` to avoid Suspense | `connection()` function in Server Component OR Suspense boundary in child | Next.js 15+ | `dynamic = 'force-dynamic'` in Client Component `page.tsx` has no effect — must use Suspense |
| `missingSuspenseWithCSRBailout: false` experimental flag | Removed | Next.js 15 | No opt-out available; Suspense boundary is mandatory |
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | ~2019+ | execCommand is deprecated across all major browsers |
| `window.history.pushState` for shallow routing | `router.replace()` | Next.js 13+ | router.replace() integrates with Next.js router; useSearchParams sees updates |

**Deprecated/outdated:**
- `missingSuspenseWithCSRBailout` flag: removed in Next.js 15, no longer available
- `document.execCommand('copy')`: deprecated; use Clipboard API
- Pages Router `useRouter().query`: replaced by `useSearchParams()` in App Router

---

## Open Questions

1. **Does the by-OD tab's Suspense/URL state scope to only that tab, or does it affect the whole page?**
   - What we know: Only the by-OD tab has shareable URL per the requirements. The by-train and by-station tabs are not mentioned in SHAR-01.
   - What's unclear: Should opening `?from=1&to=12&date=2026-01-01` automatically switch to the by-od tab?
   - Recommendation: Yes — if URL params are present, the Tabs component `defaultValue` should be `"by-od"` (which it already is by default). No extra logic needed.

2. **Should invalid URL params (unknown StationID, past date) be validated?**
   - What we know: The API will return an empty result or error for invalid params.
   - What's unclear: Whether to add client-side validation in SearchParamsInit.
   - Recommendation: Pass params through as-is; let the existing API error handling in TrainList display any error. Minimal additional code.

3. **Does `navigator.share()` in Next.js require any special handling?**
   - What we know: Web Share API requires user gesture + HTTPS. Both are satisfied (button click, Next.js on HTTPS in prod).
   - What's unclear: Whether Next.js SSR causes `navigator` to be undefined at render time.
   - Recommendation: Guard with `typeof navigator !== 'undefined' && navigator.share` inside the onClick handler (already browser-only since it's triggered by user click, but safe to be explicit).

---

## Sources

### Primary (HIGH confidence)
- https://nextjs.org/docs/app/api-reference/functions/use-search-params (fetched 2026-02-19, doc-version 16.1.6)
- https://nextjs.org/docs/app/api-reference/functions/use-router (fetched 2026-02-19, doc-version 16.1.6)
- https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout (fetched 2026-02-19)
- https://nextjs.org/docs/app/api-reference/functions/use-pathname (fetched 2026-02-19, doc-version 16.1.6)
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share (Web Share API)
- https://caniuse.com/web-share (browser support data: 92.48% global, Firefox desktop missing)

### Secondary (MEDIUM confidence)
- https://github.com/vercel/next.js/issues/74494 — Confirmed Suspense requirement persists even when page.tsx is 'use client'; no opt-out in Next.js 15+
- https://github.com/vercel/next.js/discussions/60080 — window.history.pushState vs router.replace tradeoffs

### Tertiary (LOW confidence)
- https://nuqs.dev — alternative library for URL state; noted but not recommended (violates "no new packages" prior decision)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all APIs are official Next.js 16.1.6 and browser built-ins, verified against current official docs
- Architecture (SearchParamsInit + Suspense pattern): HIGH — documented by official Next.js missing-suspense-with-csr-bailout page with exact code pattern
- Architecture (router.replace URL update): HIGH — directly from official useRouter docs
- Architecture (key-prop remount): HIGH — standard React idiom, no library-specific behavior
- Web Share API pattern: HIGH — MDN + caniuse verified, iOS Safari supported since 12.2
- Pitfalls: HIGH — most derived from official docs "Good to know" callouts

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (Next.js releases frequently; re-verify if upgrading beyond 16.1.6)
