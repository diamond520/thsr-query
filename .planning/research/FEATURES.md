# Feature Research

**Domain:** Transit Query App UX — Taiwan High Speed Rail (THSR)
**Researched:** 2026-02-19
**Confidence:** MEDIUM-HIGH (based on training knowledge of transit app patterns; web research unavailable in this session)

---

## Summary

This research covers UX patterns for transit timetable query apps, with specific focus on the THSR use case: a single linear rail line with 12 stations, Chinese-language interface, mobile-first design inspired by t-ex app, desktop inspired by THSR official site.

THSR is not a network (like metro) — it is a single north-south corridor. This constraint is a design advantage: station selection does not need a map or complex origin/destination matrix. It maps cleanly to a linear list or a "pick from top / pick from bottom" station selector.

The core user job is: "I want to get on a specific train — does it have seats?" Everything else is supporting that goal.

**Primary recommendation:** Make the query form fill the viewport on mobile (no scrolling to start), return results as scannable cards not a table, and put seat availability status inline with each train row — not behind a second tap.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Origin / Destination station picker | Core query input — app is useless without it | LOW | THSR has exactly 12 stations; use large tap-target list or visual rail-line selector, not a dropdown |
| Date picker | Timetable varies by day; holidays, weekends differ | LOW | Default to today. Show day-of-week label next to date (e.g., "2月19日 週四"). Restrict past dates. |
| Departure time filter | Users don't want to scroll 20+ trains; they want trains after a specific time | MEDIUM | Default to current time. Support "抵達時間" toggle (already exists in v1). |
| Timetable results list | The main output — every query app shows this | MEDIUM | Show: train no, departure time, arrival time, duration. This is the minimum. |
| Seat availability inline | User's primary question is "can I get on this train?" | MEDIUM | Show 標準席 / 商務席 status (尚有/有限/已無) directly in result row without extra tap |
| Loading state | Users need feedback that query is running | LOW | Skeleton cards or spinner. Never show blank screen. |
| Empty state with guidance | No results must explain why, not show nothing | LOW | "本日此區間無班次" with suggestion to try different date |
| Error state | API can fail; user needs actionable message | LOW | "無法取得資料，請稍後再試" with retry button |
| Swap origin/destination button | Users frequently reverse their journey | LOW | Single icon button between origin and destination fields; very common in transit apps |
| "Go book" link per train | Direct path to THSR official booking | LOW | Link to THSR official site booking page, ideally pre-filling train number and date where possible |

### Differentiators (Competitive Advantage)

Features that set this app apart from the raw THSR official site experience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Seat status inline with timetable | THSR official site requires separate clicks to see availability | MEDIUM | Combine DailyTimetable query with AvailableSeatStatus — show seat status badge on each row |
| Visual seat availability indicator | Color-coded badges (green/yellow/red) scan faster than text labels | LOW | 尚有=green, 有限=yellow, 已無=red/grey. Scannable at a glance. |
| Duration display per train | THSR official site doesn't show journey duration prominently | LOW | "1h 36m" style, calculated from departure - arrival. Useful for planning. |
| Linear station selector (visual rail line) | More intuitive than dropdown for a 12-station single line | MEDIUM | Show stations as dots on a vertical/horizontal line; tap origin, tap destination. No typing needed. |
| Smart time default | Pre-fill current time so user immediately sees "next trains" | LOW | On mobile, user is often checking what's coming up now. |
| Date quick-select strip | "今天 / 明天 / 後天" chips above date picker | LOW | Speeds up the most common use cases; most users query today or tomorrow. |
| Train number lookup flow | Some users know their train number exactly | LOW | Separate flow: input train no → see full stop schedule as timeline |
| Station seat view (per-station direction tabs) | Useful at station: which upcoming trains have seats? | MEDIUM | Already exists in v1 but UX can be greatly improved |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time push notifications for seat availability | "Alert me when seats open up" | Seat data from TDX is not real-time; polling creates false precision; complex to implement reliably | Show a clear "data updated as-of" timestamp so users know data freshness |
| Seat selection / booking within app | Users want end-to-end journey | THSR has no public booking API; any attempt would break ToS and be fragile | Deep link to THSR official booking URL with train/date parameters pre-filled |
| Multi-leg journey planning | "Transfer at Taichung" | THSR is single corridor — no transfers needed. Adding complexity for edge case | Out of scope; THSR is always direct |
| Calendar heat-map showing availability by day | "Show me which days have seats" | Requires N API calls (one per date); slow, rate-limit risk, and most users have a fixed date | Let users query specific dates; don't speculate |
| Favorites / saved searches | Power users want quick-repeat queries | Adds auth complexity (or relies on localStorage which is fragile); not core MVP | Consider persisting last query in URL params as a simpler alternative |
| Dark mode toggle in-app | Users request dark mode | Dark mode should be driven by OS preference (prefers-color-scheme media query) automatically, not a manual toggle | Implement CSS variables + OS-level dark mode support; no toggle needed |
| Sort / filter results table | Advanced filtering by duration, first class only, etc. | Most users just want the next available train with seats; heavy filtering creates choice paralysis | Provide time filter (departure after X) and seat-type tab; don't add full sort/filter UI |

---

## Feature Dependencies

```
[Timetable Query]
    └──requires──> [Station List loaded]
    └──requires──> [Date input]
    └──requires──> [Origin != Destination validation]

[Seat Status inline]
    └──requires──> [Timetable Query results]
    └──requires──> [AvailableSeatStatus API call]
         └──note──> may be separate API call per station or combined

[Go Book link]
    └──requires──> [Timetable Query results]
    └──requires──> [Train number from result row]
    └──enhances──> [Seat Status inline] (user confirms seats exist, then books)

[Station Seat View]
    └──requires──> [Station List loaded]
    └──requires──> [AvailableSeatStatusList API call]
    └──independent of──> [Timetable Query]

[Train Number Lookup]
    └──independent of──> [Timetable Query]
    └──requires──> [GeneralTimetable API call]

[Visual Station Selector]
    └──enhances──> [Timetable Query] (replaces dropdowns)
    └──enhances──> [Station Seat View] (replaces dropdown)
    └──requires──> [Station List loaded]

[Date Quick-Select Strip]
    └──enhances──> [Timetable Query date input]
```

### Dependency Notes

- **Seat Status inline requires a second API call:** TDX's `AvailableSeatStatusList/{StationID}` returns real-time seat availability per-station. The timetable query returns a different dataset. These need to be joined on `TrainNo` in the UI layer. This is achievable but means the timetable page may show results first, then progressively enhance with seat status.
- **Go Book link depends on THSR official URL structure:** The THSR booking page URL format needs to be verified to support deep linking. Worst case: link to the THSR booking homepage.
- **Visual Station Selector conflicts with dropdown approach:** Pick one. The visual selector is better on mobile; dropdown is more familiar on desktop. Could be responsive: visual on mobile, dropdown on desktop.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — the Next.js rewrite that replaces the existing Vue 2 app.

- [ ] Station picker (origin + destination) — app is non-functional without this
- [ ] Date + time input with today default — must match existing v1 capability
- [ ] Timetable results list: train no, departure, arrival, duration — minimum data set
- [ ] Departure/arrival time toggle — existing feature, well-understood by users
- [ ] Seat availability per train row (標準席 / 商務席 status badges) — this is the unique value proposition; inline, not behind a tap
- [ ] "去訂票" link per train row pointing to THSR official booking — explicit project requirement
- [ ] Station seat availability view (by station, north/south tabs) — existing feature
- [ ] Train number lookup — existing feature
- [ ] Loading states — not present in v1, needed for production quality
- [ ] Error states with retry — not present in v1, needed for production quality
- [ ] Origin/destination swap button — low effort, high value for mobile

### Add After Validation (v1.x)

Features to add once core is working and user feedback is available.

- [ ] Date quick-select chips (今天/明天/後天) — speeds up mobile use; add when core query works well
- [ ] Visual linear station selector on mobile — better UX than dropdown; add after initial launch
- [ ] "Data freshness" timestamp on seat status — adds trust when users question accuracy
- [ ] URL-based query state (shareable links) — when users want to share a specific query

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] OS-level dark mode support via CSS custom properties — not urgent but nice
- [ ] PWA / installable — meaningful only if users return regularly
- [ ] Persist last query in localStorage — quality-of-life, low priority

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Station picker (origin/destination) | HIGH | LOW | P1 |
| Date + time input | HIGH | LOW | P1 |
| Timetable results list | HIGH | LOW | P1 |
| Seat status inline in results | HIGH | MEDIUM | P1 |
| "去訂票" link per train | HIGH | LOW | P1 |
| Loading / error states | HIGH | LOW | P1 |
| Origin/destination swap button | MEDIUM | LOW | P1 |
| Station seat availability view | MEDIUM | MEDIUM | P1 |
| Train number lookup | MEDIUM | LOW | P1 |
| Departure/arrival toggle | MEDIUM | LOW | P1 |
| Date quick-select chips | MEDIUM | LOW | P2 |
| Visual linear station selector | MEDIUM | MEDIUM | P2 |
| Data freshness timestamp | LOW | LOW | P2 |
| URL-based query state | LOW | MEDIUM | P3 |
| Dark mode (OS-driven) | LOW | MEDIUM | P3 |

---

## Mobile UX Patterns — Station / Date Selection

### Station Selection

**Problem with dropdowns on mobile:** A `<select>` or dropdown with 12 options requires the browser's native picker (iOS wheels, Android lists) — fine but generic. More critically, origin and destination must be different, and users often want to "reverse" the journey.

**Recommended pattern: Full-screen station picker modal**
- Tap origin field → modal slides up (bottom sheet on mobile)
- 12 station buttons displayed as a large tap-target list (min 44px height)
- Stations ordered south-to-north (consistent with geographic reality)
- Selected station is highlighted; same station is greyed out in destination picker
- Confirm button or auto-confirm on tap

**Alternative pattern: Visual rail-line selector**
- Draw a vertical line (representing the THSR north-south corridor)
- 12 dots representing stations with name labels
- Tap first dot = set origin (dot turns solid)
- Tap second dot = set destination (dot turns solid, segment between them highlights)
- Works exceptionally well because THSR is a single linear route

**Why this matters:** The existing v1 uses Element UI `el-select` dropdown. On mobile this is clunky — small tap targets, no visual relationship between stations. For a 12-station single-line rail, a purpose-built selector is significantly better.

### Date Selection

**Problem:** Native date pickers vary by browser/OS. A full datetime picker is overkill for "just pick a date."

**Recommended pattern:**
- Show date as a text display: "2月19日（週四）" — human-readable, not ISO
- Tap date → calendar sheet (bottom sheet on mobile)
- Calendar shows 14–30 days forward (THSR booking window)
- Past dates disabled / greyed out
- Today's date highlighted as default
- Quick-select row above calendar: 今天 / 明天 / 後天 chips

**Departure/arrival time:**
- Separate from date; show as "從 HH:MM 之後出發" label
- Time input: either number pad (faster) or time slider (easier) — NOT full datetime picker
- Toggle for 出發時間 / 抵達時間 near the time input

### Key Mobile Principles for the Query Form

1. **Form should fill the viewport** — users should not scroll to reach the submit button
2. **Large tap targets** — minimum 44×44pt (Apple HIG) / 48×48dp (Material) for all interactive elements
3. **Inline validation** — don't wait for submit; validate origin != destination as soon as both are set
4. **Sticky "查詢" button** — fixed at bottom of screen; always reachable
5. **Auto-advance** — after picking origin, automatically open destination picker
6. **Keyboard avoidance** — if using text input for train number, ensure viewport scrolls above keyboard

---

## Timetable Results Patterns

### What Works: Card-per-Train Row

Each train should display as a horizontal card (on mobile) with:
```
[車次] [出發時間] → [抵達時間]  [行車時間]
       標準席: [●尚有]  商務席: [●有限]      [訂票 →]
```

Key decisions:
- **Train number** prominent (some users know what train they want)
- **Times** are the largest text — this is what users scan
- **Duration** in small secondary text
- **Seat status** as color-coded badges: green dot + text, yellow dot + text, grey dot + 已無
- **Book link** as a ghost/outline button to avoid looking like an ad

### What Works: Grouped by Time Period (Optional Enhancement)

For long result lists (20+ trains), group into:
- 早班 (00:00–09:59)
- 日班 (10:00–17:59)
- 晚班 (18:00–23:59)

Collapsible sections with train count. Makes scanning faster when looking for afternoon trains.

### What Doesn't Work (Anti-Patterns)

| Anti-Pattern | Problem | What to Do Instead |
|---|---|---|
| Full HTML table for results | Tables scroll horizontally on mobile; column widths fight each other | Use flexbox/grid card layout per row |
| Pagination with prev/next buttons | v1 has this; requires user to click to see more trains | Show all trains in a scrollable list (THSR has at most ~50 trains/day per corridor — not a virtualization problem) |
| Seat status behind expand/collapse | v1's byStation component hides seat data behind expand row | Show seat status directly in the result row; one tap = one booking |
| Lazy seat status load with spinner per row | Each row spinner = visual noise | Load all seat status at once (one API call per relevant station), then populate all rows |
| Show raw API values (Available/Limited/Full) | English status codes in Chinese UI | Always map to Chinese: 尚有座位 / 座位有限 / 已無座位 |
| Timestamp "HH:MM:SS" format | Seconds are noise in transit context | Always display "HH:MM" format only |

### Desktop Table Pattern

On desktop (768px+), a traditional table works well:
- Columns: 車次 | 出發 | 抵達 | 行車時間 | 標準席 | 商務席 | 訂票
- Sticky header
- Hover highlight on rows
- No pagination — show all results, let the browser scroll

---

## Competitor Feature Analysis

| Feature | THSR Official Site | t-ex Style Apps | This App's Approach |
|---------|-------------------|-----------------|--------------------|
| Station selection | Dropdown select | Bottom-sheet list with large buttons | Bottom-sheet on mobile, dropdown on desktop |
| Date input | Calendar widget (JS) | Date chips + calendar | Quick-select chips (今天/明天/後天) + calendar fallback |
| Results format | Table with separate seat query | Card list with integrated status | Card list with inline seat status badges |
| Seat availability | Separate booking flow | Inline with timetable results | Inline status badges (green/yellow/red), then book link |
| Booking action | Full booking form | External link | "去訂票" link opens THSR official booking URL in new tab |
| Mobile experience | Functional but not optimized | Card-first, thumb-friendly | Mobile-first, card layout, large tap targets |
| Train lookup | Not prominent | N/A | Separate tab/view with timeline display |
| Error handling | Generic error page | Toast notifications | Inline error with retry button |

---

## Sources

### Primary (HIGH confidence — domain knowledge)
- Existing v1 codebase analysis (`src/components/byTime.vue`, `byStation.vue`, `byTrainNo.vue`) — understood current feature set and gaps
- `.planning/PROJECT.md` — requirements, constraints, and design references
- `.planning/codebase/CONCERNS.md` — known bugs and UX gaps in current implementation
- THSR domain knowledge (12 stations, single north-south corridor, seat classes: 標準席/商務席)

### Secondary (MEDIUM confidence — training knowledge, standard industry patterns)
- Apple Human Interface Guidelines: minimum 44pt tap targets for mobile interactive elements
- Material Design: minimum 48dp tap targets, bottom sheets for mobile selection
- Transit app UX conventions: Google Maps, Citymapper, Japan transit apps (training data)
- t-ex app design style: modern card-based, bottom-sheet navigation (training knowledge, not verified live)

### Tertiary (LOW confidence — web research unavailable this session)
- THSR official site current URL structure for deep linking booking pages — NEEDS VERIFICATION
- TDX API response timing / whether AvailableSeatStatus can be batch-queried — NEEDS VERIFICATION
- t-ex app current design patterns — could not fetch live screenshots

---

## Open Questions

1. **THSR official booking deep link URL format**
   - What we know: The "去訂票" link must point to THSR official site
   - What's unclear: Whether THSR booking page supports URL parameters for train number / date pre-fill
   - Recommendation: Verify at https://www.thsrc.com.tw by inspecting booking page URLs. If no deep link, fall back to the booking homepage.

2. **Seat status API timing relative to timetable**
   - What we know: `DailyTimetable` and `AvailableSeatStatusList` are separate TDX endpoints
   - What's unclear: Whether seat status can be fetched once for all trains on a route (one API call) or requires per-train lookups
   - Recommendation: Research TDX API endpoint `/Rail/THSR/AvailableSeatStatusList` to understand response shape. If it returns all trains for a station at once, join on TrainNo in the results layer.

3. **Number of trains per day per corridor**
   - What we know: THSR runs frequently; v1 used offset-based pagination showing 10 at a time
   - What's unclear: Exact count — likely 30-60 trains per direction per day
   - Recommendation: Query API during development; if under 100 results, render all at once (no pagination needed). If over 100, implement virtual scroll.

4. **t-ex app exact design patterns**
   - What we know: User specified "mobile UI inspired by t-ex app style"
   - What's unclear: Specific t-ex design details (colors, card layout specifics, navigation patterns)
   - Recommendation: User should review current t-ex app on device and provide screenshots or specific UI elements to reference.

---

*Feature research for: THSR Query App — Next.js rewrite*
*Researched: 2026-02-19*
*Valid until: 2026-03-20 (stable domain; transit UX patterns don't change quickly)*
