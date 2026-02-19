---
phase: 01-foundation
plan: "01"
subsystem: infra
tags: [nextjs, react, typescript, tailwind, shadcn, tanstack-query, zod]

# Dependency graph
requires: []
provides:
  - Next.js 16.1.6 App Router project scaffolded at repo root
  - src/app/layout.tsx with QueryClientProvider via Providers component
  - src/app/error.tsx error boundary with 'use client' directive
  - src/lib/utils.ts cn() helper from shadcn/ui
  - src/components/ui/button.tsx shadcn/ui Button component
  - _archive/ containing preserved Vue 2 source files
  - .env.local placeholder for TDX credentials (gitignored)
affects: [02-api-integration, 03-search-ui, 04-station-ui]

# Tech tracking
tech-stack:
  added:
    - next@16.1.6
    - react@19.2.3
    - @tanstack/react-query@5.90.21
    - server-only@0.0.1
    - zod@4.3.6
    - tailwindcss@4
    - shadcn/ui (New York style, neutral base)
    - class-variance-authority
    - clsx
    - tailwind-merge
    - lucide-react
    - radix-ui
  patterns:
    - "QueryClientProvider extracted to 'use client' providers.tsx — Server Component layout wraps client provider"
    - "App Router src-dir structure: src/app/, src/components/, src/lib/"
    - "Error boundary requires 'use client' as first line of error.tsx"

key-files:
  created:
    - src/app/providers.tsx
    - src/app/page.tsx
    - src/app/loading.tsx
    - src/app/error.tsx
    - src/lib/utils.ts
    - src/components/ui/button.tsx
    - _archive/ (Vue 2 preserved source)
    - .env.local (not committed)
    - components.json
  modified:
    - src/app/layout.tsx
    - package.json
    - .gitignore
    - tsconfig.json
    - next.config.ts

key-decisions:
  - "Scaffolded Next.js into temp dir then rsync'd to project root — create-next-app refuses non-empty directories"
  - "Archived Vue 2 files via git mv to preserve rename history in git log"
  - "Tailwind v4 with @tailwindcss/postcss (not v3 PostCSS plugin) — auto-selected by create-next-app@latest"
  - "shadcn/ui New York style with neutral base color and CSS variables"

patterns-established:
  - "QueryClientProvider pattern: extract to 'use client' component, wrap in Server Component layout"
  - "Error boundaries in App Router must have 'use client' as first line"
  - "TDX credentials managed via .env.local (gitignored), never committed"

requirements-completed: [INFR-01, INFR-02]

# Metrics
duration: 8min
completed: 2026-02-19
---

# Phase 1 Plan 01: Foundation Summary

**Next.js 16.1.6 App Router scaffolded in-place from Vue 2 repo, with @tanstack/react-query QueryClientProvider, shadcn/ui, and TDX credential placeholders**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-19T04:38:15Z
- **Completed:** 2026-02-19T04:46:16Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Archived all Vue 2 source files (src/, docs/, public/, babel.config.js, yarn.lock, .eslintrc.js, .browserslistrc) to _archive/ via git mv — history preserved
- Scaffolded Next.js 16.1.6 with TypeScript, Tailwind v4, ESLint, App Router, src-dir layout; installed @tanstack/react-query, server-only, zod
- Initialized shadcn/ui (New York style) and added Button component; configured root layout with QueryClientProvider via 'use client' providers.tsx pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Archive Vue 2 files and scaffold Next.js 16** - `84ad036` (feat)
2. **Task 2: Configure root layout with QueryClientProvider and error boundary** - `f1a7338` (feat)

**Plan metadata:** `94e0c19` (docs: complete plan summary and state update)

## Files Created/Modified
- `src/app/providers.tsx` - 'use client' QueryClientProvider wrapper for Server Component layout
- `src/app/layout.tsx` - Root layout with zh-TW lang, 高鐵查詢 metadata, Providers wrapper
- `src/app/page.tsx` - Minimal 高鐵查詢 placeholder Server Component
- `src/app/loading.tsx` - Root loading skeleton
- `src/app/error.tsx` - Error boundary with 'use client' directive (first line)
- `src/lib/utils.ts` - cn() helper from shadcn/ui
- `src/components/ui/button.tsx` - shadcn/ui Button component
- `_archive/src/` - Preserved Vue 2 source files (App.vue, components, views, store, router, api)
- `.env.local` - TDX credential placeholders (not committed, gitignored)
- `package.json` - Next.js 16 dependencies including @tanstack/react-query, server-only, zod
- `components.json` - shadcn/ui configuration (New York style, neutral base)

## Decisions Made
- Used temp dir + rsync approach for create-next-app scaffolding (cannot scaffold into non-empty directory — see Deviations)
- Chose to git mv Vue 2 files rather than plain mv to preserve rename tracking in git history
- Tailwind v4 (not v3) — create-next-app@latest selects v4 automatically with @tailwindcss/postcss

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] create-next-app refuses to scaffold into non-empty directory**
- **Found during:** Task 1 (scaffold Next.js 16)
- **Issue:** `npx create-next-app@latest .` exits with error when any files exist (.planning/, .claude/, _archive/, README.md). Even after archiving Vue 2 files, non-Vue files still blocked scaffolding.
- **Fix:** Scaffolded into `/tmp/nextjs-scaffold/thsr-next/`, then used `rsync -av --exclude='.git' --exclude='node_modules'` to copy generated files to project root. Then ran `npm install` in the project root.
- **Files modified:** All Next.js scaffold files (package.json, tsconfig.json, next.config.ts, eslint.config.mjs, postcss.config.mjs, src/, public/, components.json)
- **Verification:** `npm run build` succeeds, `npm list @tanstack/react-query server-only zod` confirms all three installed
- **Committed in:** 84ad036 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Workaround required due to create-next-app limitation. Outcome identical to plan — same files, same structure. No scope creep.

## Issues Encountered
- Vue 2 config files (.browserslistrc, .eslintrc.js) not listed in the plan's archive step but were also blocking scaffolding — archived them to _archive/ as a natural extension of the task.

## User Setup Required
None — TDX credentials in .env.local are empty placeholders. Build succeeds without them. Real credentials can be added when TDX account is available (see Blockers in STATE.md).

## Next Phase Readiness
- Next.js 16 App Router project is fully operational — `npm run dev` and `npm run build` both work
- QueryClientProvider wired up — Phase 2 client components can use `useQuery` immediately
- shadcn/ui initialized — Phase 3 UI components can use `npx shadcn add [component]`
- .env.local gitignored and ready for TDX credentials when available
- Vue 2 source preserved in _archive/src/ for reference during API migration

---
*Phase: 01-foundation*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: src/app/providers.tsx
- FOUND: src/app/layout.tsx
- FOUND: src/app/error.tsx
- FOUND: src/app/loading.tsx
- FOUND: src/lib/utils.ts
- FOUND: src/components/ui/button.tsx
- FOUND: _archive/src/
- FOUND commit: 84ad036 (Task 1)
- FOUND commit: f1a7338 (Task 2)
