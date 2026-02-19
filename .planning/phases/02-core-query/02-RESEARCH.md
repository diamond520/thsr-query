# Phase 2: Core Query - Research

**Researched:** 2026-02-19
**Domain:** TDX THSR API integration, shadcn/ui components, React Query v5, Taiwan timezone handling
**Confidence:** MEDIUM-HIGH (TDX API shapes confirmed via archive + docs; booking URL confirmed via official THSR site)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 座位狀態視覺
- 使用顏色 Badge：充足（綠）、有限（黃）、售完（紅）
- 標準席與商務席分兩行上下展示，不合併
- Badge 文字使用完整中文：「充足」「有限」「售完」
- 商務席標籤（席型文字）使用特別顏色標示，與標準席視覺有所區隔

#### 頁面狀態設計
- **初始狀態**：只顯示查詢表單，下方加提示文字（如「選擇起訖站與日期，即可查詢時刻表」）
- **查詢中**：Skeleton 卡片（灰色模擬展示內容），讓用戶知道將有內容出現
- **查無結果**：簡短文字說明（「無符合的班次」），不需圖示
- **API 錯誤**：錯誤文字 + 「重試」按鈕，讓用戶可重新觸發查詢

#### 查詢表單佈局
- 起訖站選擇器使用下拉選單（Phase 4 升級為視覺化線路圖）
- 手機版佈局：起站 [交換鈕] 訖站（並排） / 日期 / 查詢按鈕（縱向排列）
- 日期預設值：台灣時區（UTC+8）今天
- 交換鈕視覺：圈圈箭頭圖示（⇄ 或 ↻ 類型），位於起站與訖站之間

### Claude's Discretion
- 查詢按鈕的確切樣式（大小、顏色）
- Skeleton 卡片數量
- 提示文字的確切措辭
- 桌面版（desktop）的表單佈局細節

### Deferred Ideas (OUT OF SCOPE)
- 來回車票查詢 — 需要選擇回程日期與班次，功能複雜度高，建議獨立為 Phase 加入 backlog
- 記憶上次查詢的起訖站（PERS-02）— v2 Requirements，非 Phase 2 範圍
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QURY-01 | 使用者可選擇起站、訖站與日期查詢當日所有高鐵班次時刻 | TDX `/DailyTimetable/OD/{origin}/to/{dest}/{date}` endpoint confirmed — returns all trains for the OD pair on a date |
| QURY-02 | 時刻表每一列班次直接顯示標準席和商務席的座位剩餘狀態（充足/有限/售完） | TDX `/AvailableSeatStatusList/{StationID}` returns per-train seat status; join strategy on TrainNo documented |
| QURY-04 | 時刻表每一列班次顯示「去訂票」連結，點擊後跳至高鐵官方訂票頁面 | THSR timetable/booking system URL confirmed: `https://www.thsrc.com.tw/TimeTable/Search` with POST params — deep-link not possible, link to root booking page with origin/destination pre-fill pattern documented |
| UIUX-02 | Mobile-first 響應式設計 — 手機版仿 t-ex app 風格（大點擊區域、卡片式），桌面版仿高鐵官網（清爽、表格式） | Tailwind v4 `md:` breakpoint for mobile card / desktop table pattern; shadcn Card + Skeleton confirmed |
| UIUX-03 | 日期選擇使用台灣時區（UTC+8），避免跨夜時顯示錯誤日期 | `Intl.DateTimeFormat` with `Asia/Taipei` timezone for server-safe default date; Calendar component `defaultMonth` pattern documented |
| UIUX-04 | 使用者可快速切換起訖站（交換按鈕） | Simple state swap pattern; Lucide `ArrowLeftRight` or `RefreshCw` icon confirmed available |
</phase_requirements>

---

## Summary

Phase 2 integrates two TDX THSR endpoints — `DailyTimetable/OD` and `AvailableSeatStatusList` — and presents results in a mobile-card / desktop-table responsive layout. The critical architectural decision is **how to join** the two data sets: DailyTimetable gives timetables per OD pair (and already includes `DailyTrainInfo.TrainNo`), while AvailableSeatStatusList is queried by a single StationID and returns all trains passing through that station with seat status broken down per leg (`StopStations` array). The join key is `TrainNo` — look up seat status for the origin station, then find the `StopStations` entry where `StationID === OriginStationID` and use that leg's `StandardSeatStatus` / `BusinessSeatStatus`.

The seat status values from TDX are single-character codes: `"O"` (充足), `"L"` (有限), `"X"` (售完). These map directly to the user's desired badge colors (green/yellow/red). Notably, the API values are **not** the string "Available"/"Limited"/"Full" — the archive's filter was mapping them in a different (older) format; the current v2 API uses `"O"/"L"/"X"`.

The THSR booking page (`irs.thsrc.com.tw`) uses a Wicket-based session-stateful system — deep-linking to a specific train is not possible via URL parameters. The correct "去訂票" link pattern is to construct a POST to `https://www.thsrc.com.tw/TimeTable/Search` with origin/destination/date/time pre-filled, or more practically, link directly to the THSR timetable search page and let users proceed. The cleanest approach is an anchor link with the station name codes and date pre-filled via the timetable search system.

**Primary recommendation:** Use a single Next.js Route Handler (`/api/tdx/trains`) that calls both TDX endpoints in parallel with `Promise.all`, joins them server-side on `TrainNo`, and returns enriched train data to the client. React Query v5 is already installed; use `enabled: !!queryParams` pattern so the query only fires when the user submits the form.

---

## Standard Stack

### Core (Already in package.json)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-query` | ^5.90.21 | Client-side data fetching, loading/error states | Already installed in Phase 1; v5 is current standard |
| `next` | 16.1.6 | App Router, Route Handlers | Project foundation |
| `tailwindcss` | ^4 | Responsive styling | Project foundation |
| `shadcn` CLI | 3.8.5 | Component generation | Project foundation |
| `lucide-react` | ^0.574.0 | Icons (swap button, calendar icon) | Already installed |
| `zod` | ^4.3.6 | Form validation | Already installed |

### Components to Add via `shadcn add`
| Component | Install Command | Purpose |
|-----------|----------------|---------|
| `select` | `npx shadcn@latest add select` | Origin/destination dropdowns |
| `badge` | `npx shadcn@latest add badge` | Seat status indicators |
| `skeleton` | `npx shadcn@latest add skeleton` | Loading state placeholders |
| `card` | `npx shadcn@latest add card` | Mobile train result cards |
| `calendar` | `npx shadcn@latest add calendar` | Date picker calendar |
| `popover` | `npx shadcn@latest add popover` | Date picker wrapper |

### Additional npm Dependencies
| Library | Version | Purpose | Install |
|---------|---------|---------|---------|
| `date-fns` | latest | Calendar formatting (`format()`) | `npm install date-fns` |
| `react-day-picker` | v9 (installed by shadcn calendar) | Calendar internals | Auto-installed |

**Note on react-day-picker:** shadcn v3 (current) now uses react-day-picker v9 which has date-fns as a direct dependency (not peer). No version conflicts expected with React 19.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Calendar + Popover | `<input type="date">` | HTML date input avoids react-day-picker dependency but loses consistent styling and locale control |
| React Query `enabled` pattern | Server Component fetch | Server Components can't be triggered on form submit; client-side fetch is correct here |
| Server-side join in Route Handler | Client-side join | Client-side join requires two separate API calls and more data to the client; server join is cleaner |

**Installation (new dependencies only):**
```bash
npx shadcn@latest add select badge skeleton card calendar popover
npm install date-fns
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Replace placeholder — render QueryForm + TrainList
│   └── api/tdx/
│       ├── stations/route.ts       # Existing (Phase 1)
│       └── trains/route.ts         # NEW: GET handler for timetable + seats joined
├── components/
│   ├── query-form.tsx              # "use client" — origin/dest/date form + state
│   ├── train-list.tsx              # "use client" — renders results, loading, error states
│   ├── train-card.tsx              # Mobile card for a single train
│   ├── train-table.tsx             # Desktop table row/rows for trains
│   ├── seat-badge.tsx              # Badge with status color + Chinese label
│   └── ui/                         # shadcn generated components
├── lib/
│   ├── tdx-token.ts                # Existing (Phase 1)
│   ├── tdx-api.ts                  # Extend: add fetchTrains() + fetchSeatStatus()
│   └── utils.ts                    # Existing
├── types/
│   └── tdx.ts                      # Extend: add TdxDailyTrain, TdxSeatStatus, TdxTrain interfaces
└── fixtures/
    └── tdx-mock.ts                 # Extend: add MOCK_TRAINS fixture
```

### Pattern 1: Route Handler — Parallel Fetch + Server-Side Join

**What:** The Route Handler calls both TDX endpoints concurrently, joins on `TrainNo`, and returns enriched results.
**When to use:** Any time two API calls have no dependency and the join key is shared.

```typescript
// src/app/api/tdx/trains/route.ts
import 'server-only' // NOT needed directly — comes via tdx-api.ts import
import { fetchDailyTrains, fetchSeatStatus } from '@/lib/tdx-api'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = searchParams.get('origin')       // StationID e.g. "1"
  const destination = searchParams.get('destination')
  const date = searchParams.get('date')           // YYYY-MM-DD

  if (!origin || !destination || !date) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    // Parallel fetch — both calls fired simultaneously
    const [trains, seatStatuses] = await Promise.all([
      fetchDailyTrains(origin, destination, date),
      fetchSeatStatus(origin),                    // Origin StationID
    ])

    // Join on TrainNo: find the seat status leg for origin → next stop
    const seatMap = new Map(seatStatuses.map(s => [s.TrainNo, s]))

    const enriched = trains.map(train => {
      const seat = seatMap.get(train.DailyTrainInfo.TrainNo)
      // Find the StopStation entry where this train departs from origin
      const leg = seat?.StopStations.find(
        stop => stop.StationID === origin
      )
      return {
        trainNo: train.DailyTrainInfo.TrainNo,
        departureTime: train.OriginStopTime.DepartureTime,
        arrivalTime: train.DestinationStopTime.ArrivalTime,
        standardSeat: leg?.StandardSeatStatus ?? null,  // "O" | "L" | "X" | null
        businessSeat: leg?.BusinessSeatStatus ?? null,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('[/api/tdx/trains] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch train data' }, { status: 502 })
  }
}
```

### Pattern 2: React Query — Form-Submit-Triggered Query

**What:** Query only fires when user submits form; `enabled` controls activation.
**When to use:** Any user-triggered (not automatic) data fetch.

```typescript
// components/train-list.tsx
'use client'

import { useQuery } from '@tanstack/react-query'

interface QueryParams {
  origin: string
  destination: string
  date: string  // YYYY-MM-DD
}

export function TrainList({ params }: { params: QueryParams | null }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['trains', params],
    queryFn: async () => {
      if (!params) throw new Error('No params')
      const url = `/api/tdx/trains?origin=${params.origin}&destination=${params.destination}&date=${params.date}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    enabled: !!params,  // Only run when form has been submitted
    staleTime: 5 * 60 * 1000,  // 5 min — seat status updates every 10 min on day-of
  })

  if (!params) return <p className="text-muted-foreground text-center py-8">選擇起訖站與日期，即可查詢時刻表</p>
  if (isLoading) return <TrainSkeletons count={5} />
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />
  if (!data?.length) return <p className="text-center py-8 text-muted-foreground">無符合的班次</p>

  return <TrainResults trains={data} />
}
```

### Pattern 3: Taiwan Timezone Default Date

**What:** Get today's date in Asia/Taipei timezone for Calendar default value.
**When to use:** Any date initialization that must respect Taiwan time (UTC+8), safe for both server and client.

```typescript
// lib/taiwan-date.ts  (or inline in component)
export function getTaiwanToday(): string {
  // Intl.DateTimeFormat is available in both Node.js and browsers
  // Taiwan never observes DST — Asia/Taipei is always UTC+8
  const formatter = new Intl.DateTimeFormat('en-CA', {  // en-CA produces YYYY-MM-DD
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date())  // e.g. "2026-02-19"
}
```

**Hydration safety:** Call `getTaiwanToday()` inside a `useState` initializer or `useEffect` on the client to avoid server/client mismatch:
```typescript
const [date, setDate] = useState<Date>(() => new Date(getTaiwanToday()))
```

### Pattern 4: Seat Status Badge

**What:** Maps TDX status codes to Chinese labels + color classes.
**Status codes:** `"O"` = 充足 (green), `"L"` = 有限 (yellow/amber), `"X"` = 售完 (red), `null` = 不適用 (gray)

```typescript
// components/seat-badge.tsx
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type SeatStatus = 'O' | 'L' | 'X' | null

const STATUS_CONFIG: Record<NonNullable<SeatStatus>, { label: string; className: string }> = {
  O: { label: '充足', className: 'bg-green-100 text-green-800 border-green-200' },
  L: { label: '有限', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  X: { label: '售完', className: 'bg-red-100 text-red-800 border-red-200' },
}

interface SeatBadgeProps {
  status: SeatStatus
  type: '標準席' | '商務席'
}

export function SeatBadge({ status, type }: SeatBadgeProps) {
  const config = status ? STATUS_CONFIG[status] : null
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('text-xs font-medium', type === '商務席' && 'text-amber-700')}>
        {type}
      </span>
      {config ? (
        <Badge variant="outline" className={cn('text-xs px-1.5 py-0', config.className)}>
          {config.label}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">—</Badge>
      )}
    </div>
  )
}
```

### Pattern 5: Mobile Card / Desktop Table Responsive Toggle

**What:** Show card layout on mobile, table layout on `md:` and above.

```tsx
// In train-list.tsx or train-results.tsx
{/* Mobile: card list (hidden on md+) */}
<div className="md:hidden space-y-3">
  {trains.map(t => <TrainCard key={t.trainNo} train={t} />)}
</div>

{/* Desktop: table (hidden below md) */}
<div className="hidden md:block">
  <table className="w-full">
    {/* thead, tbody with TrainRow components */}
  </table>
</div>
```

### Anti-Patterns to Avoid
- **Using `refetch()` with `skipToken`:** React Query v5 `skipToken` prevents `refetch()` from working — use `enabled: !!params` pattern instead.
- **Date-only `new Date()` for Taiwan default:** `new Date()` uses the server's timezone (likely UTC), which is wrong at 16:00-24:00 UTC when Taiwan is already the next day. Always use `Intl.DateTimeFormat` with `Asia/Taipei`.
- **Importing `tdx-api.ts` in client components:** It has `import 'server-only'` — importing from a `'use client'` file will throw a build error. Route Handler is the correct boundary.
- **Querying `AvailableSeatStatusList` by route (OD):** The endpoint only accepts a single `StationID`, not an OD pair. Query by origin station only.
- **Treating missing seat status as an error:** Some trains may not appear in `AvailableSeatStatusList` (e.g., limited-stop express with no stop at origin). Handle `null` gracefully with a "—" display.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible dropdown select | Custom `<div>` dropdown | shadcn Select (Radix UI) | Keyboard nav, screen readers, mobile tap targets, focus trapping all handled |
| Calendar date picker | `<input type="date">` or custom calendar | shadcn Calendar + Popover | Locale, min/max dates, consistent styling with design system |
| Loading skeleton | Custom CSS animations | shadcn Skeleton | Consistent animation, Tailwind-compatible |
| Status badge styling | `if/else className strings` inline | shadcn Badge with custom className | Consistent border-radius, padding, font size |
| Token caching + OAuth2 flow | Custom fetch wrapper | Existing `tdx-token.ts` + `tdx-api.ts` | Already built in Phase 1 |
| Promise.all parallel fetch | Sequential awaits | `Promise.all([...])` | Two independent TDX calls should never run sequentially |

**Key insight:** shadcn components are "copy-into-project" components — they're in `src/components/ui/` and fully owned. Use them as base building blocks, extending with custom `className` for domain-specific styling (badge colors).

---

## Common Pitfalls

### Pitfall 1: AvailableSeatStatusList Status Values Are Single Characters, Not Strings
**What goes wrong:** Code compares `status === 'Available'` or `status === 'Full'` and always shows `null`.
**Why it happens:** The archive Vue 2 code had a `seatAvailable` filter mapping from what looked like English strings — but the current TDX v2 API returns `"O"`, `"L"`, `"X"`.
**How to avoid:** Map TDX seat codes as: `"O"` → 充足, `"L"` → 有限, `"X"` → 售完.
**Warning signs:** All badges show the gray "—" state even for trains with seats.

### Pitfall 2: DailyTimetable vs AvailableSeatStatusList Join — Scope Mismatch
**What goes wrong:** AvailableSeatStatusList returns ALL trains stopping at a station; DailyTimetable returns only trains between the OD pair. Some trains in seat status list won't be in timetable (e.g., northbound when querying southbound route).
**Why it happens:** `AvailableSeatStatusList` has no OD filtering — it's a full station view.
**How to avoid:** Join on `TrainNo` using the timetable as the "left" dataset. Only look up seat status for trains already in the timetable results.
**Warning signs:** Join produces more trains than the timetable query, or northbound trains appear in a southbound search.

### Pitfall 3: Taiwan Date Hydration Mismatch
**What goes wrong:** Next.js server renders "2026-02-19" but client hydrates with "2026-02-20" (or vice versa) causing React hydration error.
**Why it happens:** Server likely runs in UTC; when it's 22:00 UTC, Taiwan is already 06:00 next day.
**How to avoid:** Initialize the date state in a client `useState` callback, not as a prop from server render. Use `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' })` on the client side only for the default date.
**Warning signs:** "Hydration failed" console error, flickering date value on load.

### Pitfall 4: Route Handler Caching Too Aggressively
**What goes wrong:** Seat availability from 2 hours ago is shown as current.
**Why it happens:** `export const revalidate = 86400` (copied from stations endpoint) caches for 24h.
**How to avoid:** Set `export const dynamic = 'force-dynamic'` on the trains route (no caching — seat status changes every 10 minutes). Or: set `revalidate = 600` (10 min) to match TDX update frequency.
**Warning signs:** Users see "售完" for trains that have seats, or "充足" for trains that are full.

### Pitfall 5: StationID vs StationCode Confusion
**What goes wrong:** Using `StationCode` (ticketing system, e.g. "NanGang") where TDX API expects `StationID` (scheduling system, e.g. "1").
**Why it happens:** The THSR booking website uses station name codes ("NanGang", "Taipei") while TDX uses numeric IDs ("1", "2").
**How to avoid:** TDX DailyTimetable and AvailableSeatStatusList both use `StationID` (the numeric string). The existing `TdxStation.StationID` field (e.g., `"1"`) is correct. The booking URL uses a different code system.
**Warning signs:** TDX API returns 404 or empty array; station not found errors.

### Pitfall 6: THSR Booking Deep Link — POST-Only System
**What goes wrong:** Developer tries to create a URL like `https://irs.thsrc.com.tw/IMINT/?trainNo=0115&date=2026-02-19` expecting it to pre-fill the booking form.
**Why it happens:** THSR booking system (Wicket framework) is session-stateful; it does not accept URL parameters for pre-filling a specific train.
**How to avoid:** Link to `https://www.thsrc.com.tw/TimeTable/Search` via a form POST with `StartStation`, `EndStation`, `OutWardSearchDate`, and `OutWardSearchTime` pre-filled — this opens timetable search with origin/destination/date pre-selected. The user then clicks the specific train to proceed to booking.
**Warning signs:** Redirect to THSR homepage instead of a pre-filled form.

---

## Code Examples

Verified patterns from official sources and project archive:

### TDX DailyTimetable OD Endpoint
```typescript
// Source: Archive _archive/src/api/thrs-api.js + TDX v2 base URL from tdx-api.ts
// Endpoint: GET /DailyTimetable/OD/{OriginStationID}/to/{DestinationStationID}/{TrainDate}
// TrainDate format: YYYY-MM-DD

const TDX_BASE = 'https://tdx.transportdata.tw/api/basic/v2/Rail/THSR'

async function fetchDailyTrains(
  originId: string,      // e.g. "1" (Nangang)
  destId: string,        // e.g. "12" (Zuoying)
  date: string           // e.g. "2026-02-19"
): Promise<TdxDailyTrain[]> {
  const token = await getTdxToken()
  const res = await fetch(
    `${TDX_BASE}/DailyTimetable/OD/${originId}/to/${destId}/${date}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`TDX DailyTimetable failed: ${res.status}`)
  return res.json()
}

// Response shape (confirmed from archive byTime.vue usage):
// Array of:
// {
//   DailyTrainInfo: { TrainNo: string, ... }
//   OriginStopTime: { DepartureTime: string }    // "HH:MM"
//   DestinationStopTime: { ArrivalTime: string }  // "HH:MM"
//   StopTimes: [...]
// }
```

### TDX AvailableSeatStatusList Endpoint
```typescript
// Source: Archive _archive/src/api/thrs-api.js + motc-ptx.gitbook.io docs
// Endpoint: GET /AvailableSeatStatusList/{StationID}
// Returns: all trains stopping at this station with per-leg seat status

async function fetchSeatStatus(stationId: string): Promise<TdxSeatStatus[]> {
  const token = await getTdxToken()
  const res = await fetch(
    `${TDX_BASE}/AvailableSeatStatusList/${stationId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`TDX AvailableSeatStatusList failed: ${res.status}`)
  return res.json()
}

// Response shape (confirmed from archive byStation.vue + motc-ptx docs):
// Array of:
// {
//   TrainNo: string                   // e.g. "0117"
//   Direction: 0 | 1                  // 0=southbound, 1=northbound
//   StartingStationID: string
//   EndingStationID: string
//   StopStations: [
//     {
//       StopSequence: number
//       StationID: string             // e.g. "1"
//       StationName: { Zh_tw: string, En: string }
//       NextStationID: string
//       StandardSeatStatus: 'O' | 'L' | 'X'   // O=充足, L=有限, X=售完
//       BusinessSeatStatus: 'O' | 'L' | 'X'
//     }
//   ]
// }
```

### THSR Booking Link — Pre-filled Form POST
```typescript
// Source: Official THSR website form analysis (en.thsrc.com.tw)
// Best practice: "去訂票" button submits a form POST to THSR timetable search
// Station name codes: NanGang, Taipei, Banqiao, Taoyuan, Hsinchu, Miaoli,
//                    Taichung, Changhua, Yunlin, Chiayi, Tainan, ZuoYing

// Station ID → THSR booking station code mapping
const STATION_BOOKING_CODE: Record<string, string> = {
  '1': 'NanGang', '2': 'Taipei', '3': 'Banqiao', '4': 'Taoyuan',
  '5': 'Hsinchu', '6': 'Miaoli', '7': 'Taichung', '8': 'Changhua',
  '9': 'Yunlin', '10': 'Chiayi', '11': 'Tainan', '12': 'ZuoYing',
}

// "去訂票" link target:
// https://www.thsrc.com.tw/TimeTable/Search (POST)
// with: SearchType=S, StartStation, EndStation, OutWardSearchDate, OutWardSearchTime
//
// Since this is a POST form, the cleanest UX approach is:
// Option A: Render a <form method="POST"> around the "去訂票" button (opens in new tab)
// Option B: Link directly to https://irs.thsrc.com.tw/IMINT/ (generic booking page)
//
// RECOMMENDATION: Use Option A (form POST) to pre-fill origin/destination/date.
// If form POST is cumbersome, fall back to Option B with just the booking homepage.
```

### Taiwan Timezone Utility
```typescript
// lib/taiwan-date.ts
// Source: MDN Intl.DateTimeFormat docs — no external dependency needed

/**
 * Returns today's date in Taiwan (UTC+8) as a Date object.
 * Safe on both server and client. Taiwan never observes DST.
 * Call inside useState() callback on client to avoid hydration mismatch.
 */
export function getTaiwanToday(): Date {
  // en-CA format produces "YYYY-MM-DD" directly
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return new Date(dateStr + 'T00:00:00')  // midnight local time
}
```

### shadcn Select — Controlled Station Picker
```typescript
// Source: ui.shadcn.com/docs/components/select
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'

interface StationPickerProps {
  value: string
  onChange: (value: string) => void
  stations: { StationID: string; StationName: { Zh_tw: string } }[]
  placeholder: string
}

export function StationPicker({ value, onChange, stations, placeholder }: StationPickerProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {stations.map(station => (
          <SelectItem key={station.StationID} value={station.StationID}>
            {station.StationName.Zh_tw}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PTX API base `ptx.transportdata.tw/MOTC/v2` | TDX API base `tdx.transportdata.tw/api/basic/v2` | ~2022 migration | Archive uses old URL; new code uses TDX URL — already correct in `tdx-api.ts` |
| `react-query` package (v3) | `@tanstack/react-query` (v5) | v4 rename + v5 release | `onSuccess`/`onError` removed from `useQuery`; use `isSuccess`/`isError` state instead |
| `date-fns` as react-day-picker peer dep | `date-fns` as react-day-picker v9 direct dep | react-day-picker v9 | No version conflict; install once, works with both |
| Archive seat status strings: `'Available'`/`'Limited'`/`'Full'` | TDX v2 seat status codes: `'O'`/`'L'`/`'X'` | TDX API v2 | Archive filter was misleading — actual API values are single chars |

**Deprecated/outdated:**
- `ptx.transportdata.tw` base URL: All new code should use `tdx.transportdata.tw/api/basic/v2/Rail/THSR`.
- `onSuccess` callback in `useQuery`: Removed in React Query v5 — use `useEffect` with `isSuccess` if side effects needed.

---

## Open Questions

1. **Exact seat status code confirmation for v2 API**
   - What we know: TDX v1/PTX docs and motc-ptx gitbook describe `"O"`, `"L"`, `"X"` as status codes. The archive filter was mapping from different (possibly string) values.
   - What's unclear: Whether TDX v2 (current) still uses `"O"/"L"/"X"` or changed to full strings. The Swagger UI is behind login.
   - Recommendation: Add a logging step in mock data or an early-stage real API test to confirm actual values. Code the `SeatBadge` component to handle both `"O"` and `"Available"` gracefully.
   - **Confidence:** MEDIUM — corroborated by two independent docs sources but not directly verified against a live v2 API call.

2. **THSR booking deep link — best UX for "去訂票"**
   - What we know: THSR booking site uses Wicket framework (session-stateful). Direct URL with `trainNo` param won't work. The timetable search (`/TimeTable/Search`) accepts a form POST that can pre-fill origin/destination/date/time.
   - What's unclear: Whether a form POST to `/TimeTable/Search` with `OutWardSearchTime` equal to departure time reliably selects/highlights that train.
   - Recommendation: Implement as a form POST with all known params pre-filled. If the train isn't auto-selected, the user still lands on the correct date/route. This is a significant UX improvement over just linking to the booking homepage.
   - **Confidence:** MEDIUM — URL structure confirmed; exact POST behavior not tested.

3. **AvailableSeatStatusList update frequency impact on Route Handler caching**
   - What we know: TDX updates seat status every 10 minutes for the current day; D+1 to D+27 update 3x/day.
   - What's unclear: Whether to use `force-dynamic` (always fresh) or `revalidate = 600` (10-min cache).
   - Recommendation: Use `export const dynamic = 'force-dynamic'` for the trains route. Seat availability is the core value proposition — stale data is harmful. Add React Query `staleTime: 5 * 60 * 1000` as a client-side guard against excessive re-fetching.

---

## Sources

### Primary (HIGH confidence)
- Archive `_archive/src/api/thrs-api.js` — Exact TDX endpoint URL patterns (`/DailyTimetable/OD/{O}/to/{D}/{Date}`, `/AvailableSeatStatusList/{StationID}`)
- Archive `_archive/src/components/byTime.vue` — DailyTimetable response fields confirmed (`DailyTrainInfo.TrainNo`, `OriginStopTime.DepartureTime`, `DestinationStopTime.ArrivalTime`)
- Archive `_archive/src/components/byStation.vue` — AvailableSeatStatusList response fields confirmed (`Direction`, `TrainNo`, `StopStations`, `StandardSeatStatus`, `BusinessSeatStatus`)
- `ui.shadcn.com/docs/components/select` — Select component API (SelectTrigger, SelectContent, SelectItem, controlled value)
- `ui.shadcn.com/docs/components/badge` — Badge variants and custom className pattern
- `ui.shadcn.com/docs/components/skeleton` — Skeleton component usage
- `ui.shadcn.com/docs/components/card` — Card component API
- `ui.shadcn.com/docs/components/radix/calendar` — Calendar built on react-day-picker, `selected` + `onSelect` API
- Project `package.json` — Confirmed: `@tanstack/react-query` ^5.90.21 already installed
- Project `src/app/providers.tsx` — QueryClientProvider already configured

### Secondary (MEDIUM confidence)
- `motc-ptx.gitbook.io/tdx-zi-liao-shi-yong-kui-hua-bao-dian/data_notice/public_transportation_data/rail_data` — Seat status values `"O"`/`"L"`/`"X"` documented, update frequency (10min for same-day)
- `motc-ptx-api-documentation.gitbook.io/.../rail` — StationID vs StationCode distinction, StopStations array structure
- `en.thsrc.com.tw/ArticleContent/a3b630bb-...` — THSR timetable search POST form with StartStation/EndStation name codes
- `tanstack.com/query/v5/docs/framework/react/reference/useQuery` — `enabled` option and `refetch()` pattern
- `github.com/BreezeWhite/THSR-Ticket` endpoints.py — DailyTimetable/OD endpoint URL confirmed (older PTX base but same path)

### Tertiary (LOW confidence)
- WebSearch results suggesting react-day-picker v9 + shadcn v3 compatibility — verified pattern exists but not tested in this project
- THSR booking POST form behavior — URL structure confirmed but exact train pre-selection behavior not tested

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package.json confirms all versions; shadcn add commands verified
- TDX API endpoints: HIGH (URL patterns) / MEDIUM (seat status code values) — URL from archive + docs; code values from docs only
- Architecture: HIGH — clear server/client split, follows Phase 1 pattern
- Pitfalls: MEDIUM-HIGH — archive code reveals practical traps; status code issue is a real risk
- Booking URL: MEDIUM — POST structure confirmed from official THSR site; deep-link behavior not live-tested

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (30 days — TDX API is stable; shadcn components are stable)
