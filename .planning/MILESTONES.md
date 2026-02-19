# Milestones

## v2.0 UX Enhancement (Shipped: 2026-02-19)

**Phases completed:** 7 phases, 18 plans

**Delivered:** Full Next.js 16 rewrite of THSR Query — from Vue 2 + PTX API to Next.js + TDX API — with shareable query links, saved favorite routes, and round-trip query.

**Key accomplishments:**
1. Secure Next.js 16 App Router scaffold with server-only TDX OAuth2 token management — credentials never reach the frontend
2. Core time-based train query with seat status (standard/business) and booking links, mobile-first with desktop table view
3. Secondary query modes — by-train-number timetable and by-station seat availability (northbound/southbound tabs)
4. Visual station line picker for mobile — 12 stations as tappable dots on a line, replacing dropdown selects
5. Shareable query URLs — submit auto-updates address bar; opening link auto-fills and auto-executes query
6. SSR-safe localStorage favorite routes — save up to 10 origin/destination pairs, one-click apply to form
7. Round-trip query as a fourth tab — dual parallel TDX fetches, side-by-side results on desktop, stacked on mobile

**Stats:**
- Lines of code: 3,474 TypeScript
- Files changed: 144 files (28,075 insertions from clean scaffold)
- Requirements: 17/17 satisfied (audit passed)
- Timeline: 2026-02-19 (single session)
- Git range: feat(01-01) → feat(07-03)

**Tech debt:**
- Phase 07: RoundTripResult queryKey includes full params object — outbound refetches when only returnDate changes (low severity, correctness unaffected, staleTime=5min)

---
