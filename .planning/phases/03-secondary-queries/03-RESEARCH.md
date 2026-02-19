# Phase 3: Secondary Queries - Research

**Researched:** 2026-02-19
**Domain:** TDX THSR API (GeneralTimetable + AvailableSeatStatusList), Next.js App Router navigation, shadcn Tabs
**Confidence:** MEDIUM-HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QURY-03 | 使用者可輸入車次號查詢單一列車的停站與時刻表 | TDX `/GeneralTimetable/TrainNo/{TrainNo}` endpoint confirmed via archive + rocptx library; response shape (`GeneralTimetable.StopTimes[]` with `StationName`, `ArrivalTime`, `DepartureTime`) documented from archive byTrainNo.vue |
</phase_requirements>

---

## Summary

Phase 3 adds two secondary query modes on top of Phase 2's foundation: (1) by-train timetable (user inputs a train number, sees all stops with arrival/departure times) and (2) by-station seat status (user picks a station, sees all current trains grouped by direction with seat availability). Both queries reuse infrastructure already in place from Phases 1 and 2 — the TDX token manager, `tdx-api.ts` abstraction, mock mode pattern, React Query v5, and shadcn/ui components.

For by-train, the TDX endpoint is `GET /GeneralTimetable/TrainNo/{TrainNo}` which returns a static general timetable (not date-specific). The archive code (`byTrainNo.vue`) confirms the response shape: an array where `[0].GeneralTimetable.GeneralTrainInfo.TrainNo` is the train number and `[0].GeneralTimetable.StopTimes` is the stops array with `StationName.Zh_tw`, `ArrivalTime`, and `DepartureTime`. For the by-station view, Phase 2 already fetches `GET /AvailableSeatStatusList/{StationID}` — the same endpoint is reused, but now displayed differently: trains split by `Direction` field (`0` = southbound/南下, `1` = northbound/北上) using shadcn Tabs.

The biggest architecture question for Phase 3 is navigation: the current app is a single `page.tsx`. Phase 3 introduces two new query modes. The archive app used top-level tabs for all three modes. The recommended approach for this project is to add a mode-switcher on the **same page** using URL `?mode=` search params (bookmark-friendly, no extra pages required, aligns with App Router patterns). Alternatively, shadcn Tabs with client-side state is simpler and adequate since Phase 4 will likely reorganize anyway.

**Primary recommendation:** Implement both new query modes within `page.tsx` using shadcn Tabs for mode switching (client state). Add new Route Handlers `GET /api/tdx/timetable-by-train` and reuse existing `/api/tdx/trains` pattern for `GET /api/tdx/seat-status`. Extend `tdx-api.ts` with a new `fetchGeneralTimetable(trainNo)` function. Follow the exact same Route Handler + React Query pattern established in Phase 2.

---

## Standard Stack

### Core (Already Installed — No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-query` | ^5.90.21 | By-train and by-station query hooks | Already installed; same pattern as Phase 2 |
| `next` | 16.1.6 | Route Handlers for two new endpoints | Project foundation |
| `tailwindcss` | ^4 | Responsive layout | Project foundation |
| `lucide-react` | ^0.574.0 | Icons (search, train icon) | Already installed |

### Components to Add via `shadcn add`
| Component | Install Command | Purpose |
|-----------|----------------|---------|
| `tabs` | `npx shadcn@latest add tabs` | Direction tabs (北上/南下) in by-station view; mode-switcher if using Tabs for navigation |
| `input` | `npx shadcn@latest add input` | Train number text input for by-train query |

Note: `badge`, `skeleton`, `card`, `select` are already installed from Phase 2.

**Installation:**
```bash
npx shadcn@latest add tabs input
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Tabs for mode nav | URL `?mode=` searchParams | URL approach is bookmark-friendly but adds complexity; Tabs client state is simpler and sufficient for this app size |
| GeneralTimetable (static) | DailyTimetable/Today for by-train | DailyTimetable/Today returns all trains today — overkill; GeneralTimetable/TrainNo is purpose-built for single-train stop schedule |
| Same page with Tabs | New pages `/by-train`, `/by-station` | Separate pages add header/layout overhead; single-page Tabs is cleaner for a utility app |

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── page.tsx                          # Extend with mode Tabs (by-OD, by-train, by-station)
│   └── api/tdx/
│       ├── stations/route.ts             # Existing (Phase 1)
│       ├── trains/route.ts               # Existing (Phase 2)
│       ├── timetable-by-train/route.ts   # NEW: GET /api/tdx/timetable-by-train?trainNo=
│       └── seat-status/route.ts          # NEW: GET /api/tdx/seat-status?stationId=
├── components/
│   ├── by-train-form.tsx                 # NEW: Train number input + submit
│   ├── by-train-result.tsx               # NEW: Stop timeline display
│   ├── by-station-form.tsx               # NEW: Station select + submit (reuses StationPicker pattern)
│   ├── by-station-result.tsx             # NEW: Tabs (北上/南下) + train list with SeatBadge
│   ├── query-form.tsx                    # Existing (Phase 2)
│   ├── train-list.tsx                    # Existing (Phase 2)
│   └── ui/                              # shadcn components
├── lib/
│   └── tdx-api.ts                       # Extend: add fetchGeneralTimetable(trainNo)
├── types/
│   └── tdx.ts                           # Extend: add TdxGeneralTimetableStop, TdxStationSeatStatus
└── fixtures/
    └── tdx-mock.ts                      # Extend: add MOCK_TIMETABLE_BY_TRAIN, MOCK_SEAT_STATUS_BY_STATION
```

### Pattern 1: By-Train Route Handler
**What:** `GET /api/tdx/timetable-by-train?trainNo=0117` — fetches general timetable for a single train and returns simplified stop array.
**When to use:** User submits a train number.
**Key decision:** Use `GeneralTimetable/TrainNo/{TrainNo}` (static timetable), not DailyTimetable. Response is array — take `[0]` (top=1 in archive, or top=1 via OData filter).

```typescript
// src/app/api/tdx/timetable-by-train/route.ts
import { isMockMode, fetchGeneralTimetable } from '@/lib/tdx-api'
import { MOCK_TIMETABLE_BY_TRAIN } from '@/fixtures/tdx-mock'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trainNo = searchParams.get('trainNo')

  if (!trainNo) {
    return NextResponse.json({ error: 'Missing required parameter: trainNo' }, { status: 400 })
  }

  if (isMockMode()) {
    // Return empty array for unknown train numbers; MOCK has one known train
    const result = MOCK_TIMETABLE_BY_TRAIN[trainNo] ?? []
    return NextResponse.json(result)
  }

  try {
    const stops = await fetchGeneralTimetable(trainNo)
    return NextResponse.json(stops)
  } catch (error) {
    console.error('[/api/tdx/timetable-by-train] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch timetable from TDX' }, { status: 502 })
  }
}
```

### Pattern 2: By-Station Route Handler
**What:** `GET /api/tdx/seat-status?stationId=1` — fetches seat availability at a station and returns trains split by direction.
**When to use:** User selects a station to check current availability.
**Key decision:** Call `fetchSeatStatus(stationId)` (same function as Phase 2). Route Handler applies Direction split server-side and returns `{ northbound: [...], southbound: [...] }`.

```typescript
// src/app/api/tdx/seat-status/route.ts
import { isMockMode, fetchSeatStatus } from '@/lib/tdx-api'
import { MOCK_SEAT_STATUS_BY_STATION } from '@/fixtures/tdx-mock'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'  // Seat status changes every ~10 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stationId = searchParams.get('stationId')

  if (!stationId) {
    return NextResponse.json({ error: 'Missing required parameter: stationId' }, { status: 400 })
  }

  if (isMockMode()) {
    return NextResponse.json(MOCK_SEAT_STATUS_BY_STATION)
  }

  try {
    const trains = await fetchSeatStatus(stationId)
    // Split by Direction: 0 = southbound (南下), 1 = northbound (北上)
    const northbound = trains.filter(t => t.Direction === 1)
    const southbound = trains.filter(t => t.Direction === 0)
    return NextResponse.json({ northbound, southbound })
  } catch (error) {
    console.error('[/api/tdx/seat-status] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch seat status from TDX' }, { status: 502 })
  }
}
```

### Pattern 3: Extending tdx-api.ts with fetchGeneralTimetable
**What:** New function in `tdx-api.ts` that calls `GET /GeneralTimetable/TrainNo/{TrainNo}` and returns normalized stop array.
**Important:** Never import `tdx-token.ts` directly in route handlers — always go through `tdx-api.ts`.

```typescript
// Addition to src/lib/tdx-api.ts

/** One stop in GeneralTimetable StopTimes array */
// (These types go into src/types/tdx.ts, not inline here)

export async function fetchGeneralTimetable(trainNo: string): Promise<TdxGeneralTimetableStop[]> {
  const token = await getTdxToken()
  const res = await fetch(
    `${TDX_BASE}/GeneralTimetable/TrainNo/${trainNo}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) {
    throw new Error(`TDX GeneralTimetable failed: ${res.status} ${res.statusText}`)
  }
  const data: TdxGeneralTimetableResponse[] = await res.json()
  if (!data.length) return []
  // Response is array; take first element (one schedule per train number)
  return data[0].GeneralTimetable.StopTimes
}
```

### Pattern 4: New Types for Phase 3

```typescript
// Additions to src/types/tdx.ts

/** One stop in GeneralTimetable/TrainNo response */
export interface TdxGeneralTimetableStop {
  StopSequence: number
  StationID: string               // e.g. "1"
  StationName: TdxStationName     // Zh_tw, En
  ArrivalTime: string             // "HH:MM" (empty string for first stop)
  DepartureTime: string           // "HH:MM" (empty string for last stop)
}

/** TDX GeneralTimetable/TrainNo/{TrainNo} response item (array) */
export interface TdxGeneralTimetableResponse {
  GeneralTimetable: {
    GeneralTrainInfo: {
      TrainNo: string
      Direction: 0 | 1
      StartingStationID: string
      EndingStationID: string
    }
    StopTimes: TdxGeneralTimetableStop[]
  }
}

/** Server-simplified stop for /api/tdx/timetable-by-train response */
export interface TdxTrainStop {
  sequence: number
  stationId: string
  stationName: string           // Zh_tw
  arrivalTime: string           // "HH:MM" or "" for first stop
  departureTime: string         // "HH:MM" or "" for last stop
}

/** Server response from /api/tdx/seat-status */
export interface TdxStationSeatStatus {
  northbound: TdxSeatStatus[]   // Direction === 1
  southbound: TdxSeatStatus[]   // Direction === 0
}
```

### Pattern 5: By-Station Direction Tabs with shadcn Tabs

```tsx
// src/components/by-station-result.tsx
'use client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SeatBadge } from '@/components/seat-badge'
import type { TdxSeatStatus } from '@/types/tdx'

interface ByStationResultProps {
  northbound: TdxSeatStatus[]
  southbound: TdxSeatStatus[]
}

export function ByStationResult({ northbound, southbound }: ByStationResultProps) {
  return (
    <Tabs defaultValue="northbound">
      <TabsList className="w-full">
        <TabsTrigger value="northbound" className="flex-1">
          北上（{northbound.length}）
        </TabsTrigger>
        <TabsTrigger value="southbound" className="flex-1">
          南下（{southbound.length}）
        </TabsTrigger>
      </TabsList>
      <TabsContent value="northbound">
        {northbound.map(train => (
          <TrainSeatRow key={train.TrainNo} train={train} stationId={...} />
        ))}
      </TabsContent>
      <TabsContent value="southbound">
        {southbound.map(train => (
          <TrainSeatRow key={train.TrainNo} train={train} stationId={...} />
        ))}
      </TabsContent>
    </Tabs>
  )
}
```

### Pattern 6: Page-Level Mode Switching with shadcn Tabs

The current `page.tsx` shows only the OD query form. Phase 3 extends it with a top-level Tabs component for mode selection:

```tsx
// page.tsx extension (three tabs: 時間查詢 | 車次查詢 | 車站查詢)
<Tabs defaultValue="by-od">
  <TabsList className="w-full mb-4">
    <TabsTrigger value="by-od" className="flex-1">時間查詢</TabsTrigger>
    <TabsTrigger value="by-train" className="flex-1">車次查詢</TabsTrigger>
    <TabsTrigger value="by-station" className="flex-1">車站查詢</TabsTrigger>
  </TabsList>
  <TabsContent value="by-od">
    {/* Existing QueryForm + TrainList */}
  </TabsContent>
  <TabsContent value="by-train">
    {/* New ByTrainForm + ByTrainResult */}
  </TabsContent>
  <TabsContent value="by-station">
    {/* New ByStationForm + ByStationResult */}
  </TabsContent>
</Tabs>
```

### Anti-Patterns to Avoid
- **Calling `fetchSeatStatus` directly in by-station Route Handler and returning raw array:** The by-station view needs direction-split data. Do the split server-side in the Route Handler, not client-side.
- **Importing `tdx-token.ts` directly in Route Handlers:** Route Handlers MUST only call functions from `tdx-api.ts`. This is an established Phase 1/2 pattern.
- **Mock short-circuit in `tdx-api.ts`:** Per Phase 2 decision, mock logic lives in `route.ts`, not in `tdx-api.ts`. Follow the same pattern for Phase 3 functions.
- **Querying `DailyTimetable/OD` for by-train:** The by-train view needs ALL stops for a train, not just the OD pair. Use `GeneralTimetable/TrainNo/{TrainNo}`.
- **Using `revalidate` instead of `force-dynamic`:** By-station seat status changes every 10 minutes. Use `export const dynamic = 'force-dynamic'` as established.
- **Treating empty StopTimes as API error:** A train number that doesn't exist returns an empty array `[]`, not a non-200 status. Check `data.length === 0` and show "查無車次資料" state.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Direction tabs (北上/南下) | Custom toggle buttons | shadcn `Tabs` | Accessible, consistent with shadcn design system; handles focus/keyboard |
| Train number text input | Raw `<input>` with inline style | shadcn `Input` | Consistent styling, focus ring, accessible label support |
| Station selection for by-station | New custom dropdown | Reuse `Select` from Phase 2 pattern | Same 12 stations, same component |
| TDX token fetch | Re-implement OAuth in route | Existing `tdx-api.ts` functions | Token caching already built |
| Seat status color badges | New badge component | Existing `SeatBadge` | Phase 2's SeatBadge handles all seat codes |
| Loading skeletons | Custom shimmer CSS | Existing `Skeleton` from Phase 2 | Already installed and styled |

**Key insight:** Phase 3 is primarily composition of Phase 2 pieces. The main NEW things are: one TDX endpoint (`GeneralTimetable/TrainNo`), one new tdx-api function, two Route Handlers, and display components.

---

## Common Pitfalls

### Pitfall 1: GeneralTimetable vs DailyTimetable Confusion
**What goes wrong:** Developer uses `DailyTimetable/OD/{O}/to/{D}/{date}` for by-train query, but this requires an OD pair (origin-destination) and returns only the departure/arrival times for that specific route segment — not all stops.
**Why it happens:** DailyTimetable is the one already used in Phase 2; it's the first thing that comes to mind.
**How to avoid:** Use `GET /GeneralTimetable/TrainNo/{TrainNo}` for by-train timetable. This endpoint takes only a train number and returns ALL stops.
**Warning signs:** Only 2 data points (origin/destination) shown instead of 8-12 stops.

### Pitfall 2: GeneralTimetable Response is Wrapped in an Array
**What goes wrong:** `data.StopTimes` is `undefined` because the response is `[{ GeneralTimetable: { ... } }]`, not `{ StopTimes: [...] }` directly.
**Why it happens:** TDX API returns a collection, not a single object, even for a unique train number query.
**How to avoid:** Always access `data[0].GeneralTimetable.StopTimes`. Verify `data.length > 0` before accessing `[0]`.
**Warning signs:** `TypeError: Cannot read properties of undefined (reading 'StopTimes')`.

### Pitfall 3: First/Last Stop Has Missing ArrivalTime or DepartureTime
**What goes wrong:** The first stop (e.g., 南港) has no `ArrivalTime` (train originates there); the last stop (e.g., 左營) has no `DepartureTime`. If these are rendered as `undefined`, TypeScript may warn, and the UI may show "undefined" text.
**Why it happens:** Real THSR stops don't have arrival time at origin or departure time at terminus.
**How to avoid:** Treat empty string `""` as "not applicable" and render `—` or nothing. Type as `string` (empty string, not `null/undefined`) based on archive code pattern.
**Warning signs:** "undefined" displayed in the stop time cell, or TypeScript type errors.

### Pitfall 4: Direction Value Semantics
**What goes wrong:** `Direction === 0` is displayed as "北上" and `Direction === 1` as "南下" (backwards).
**Why it happens:** Counter-intuitive: going north (towards Nangang/Taipei) is `1`, going south (towards Zuoying/Kaohsiung) is `0`. Easy to mix up.
**How to avoid:** Per `TdxSeatStatus` type already in `src/types/tdx.ts` comment: `0=southbound (南下), 1=northbound (北上)`. Double-check against archive `byStation.vue`: `northward: Direction === 1`, `southward: Direction === 0`.
**Warning signs:** Northbound trains show in 南下 tab, southbound in 北上 tab.

### Pitfall 5: Train Number Input Validation
**What goes wrong:** User types `117` (3 digits) but the API expects `"0117"` (zero-padded 4 digits); or user types `"abc"` causing a garbage API call.
**Why it happens:** No input validation; leading zero gets stripped if treated as a number.
**How to avoid:** Keep train number as string at all times. Accept both 3-digit and 4-digit inputs (THSR has both: regular 4-digit like `0117`, and some weekend-only or special trains may be 3-digit or start at `1xxx`). Don't auto-pad — pass exactly what user enters to the API. Validate: only digits, 1-4 characters, non-empty.
**Warning signs:** API returns empty array for valid train number like "117" that should be "0117".

### Pitfall 6: Reusing fetchSeatStatus for by-station vs by-train join
**What goes wrong:** Developer is confused about which call to make — Phase 2 used `fetchSeatStatus(stationId)` for joining seat data to timetable. Phase 3 by-station uses the **same function** but for a different display purpose.
**Why it happens:** Same TDX endpoint, different purpose in Phase 3.
**How to avoid:** For Phase 3 by-station: call `fetchSeatStatus(stationId)`, then split by `Direction`. No join needed — the full `TdxSeatStatus` objects (with `StopStations`) are the display data.

### Pitfall 7: Mock Data Coverage for New Endpoints
**What goes wrong:** `/api/tdx/timetable-by-train?trainNo=0115` returns empty array in mock mode because `MOCK_TIMETABLE_BY_TRAIN` only covers one train number.
**Why it happens:** Mock data is static; only trains added to the fixture will return data.
**How to avoid:** Add at least 2-3 train numbers to `MOCK_TIMETABLE_BY_TRAIN` (keyed by train number). For by-station mock, add a realistic `MOCK_SEAT_STATUS_BY_STATION` with both northbound and southbound trains.

---

## Code Examples

Verified patterns from archive and Phase 2:

### TDX GeneralTimetable by TrainNo Endpoint
```typescript
// Source: Archive _archive/src/api/thrs-api.js (PTX base URL; same path on TDX v2)
// Archive: /GeneralTimetable/TrainNo/${TrainNo}?top=1
// TDX v2 URL: https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/GeneralTimetable/TrainNo/{TrainNo}
//
// Archive byTrainNo.vue confirmed response shape:
// result[0].GeneralTimetable.GeneralTrainInfo.TrainNo
// result[0].GeneralTimetable.StopTimes  (array of stops)
//
// StopTimes item (confirmed from HackMD API exercise + archive rendering):
// {
//   StationName: { Zh_tw: '南港', En: 'Nangang' }
//   ArrivalTime: ''       // empty for first stop
//   DepartureTime: '06:00'
// }
//
// Note: ?top=1 in archive limits to 1 result (one schedule per unique train number)
// TDX v2 equivalent: $top=1 OData parameter, or just take [0] from response

async function fetchGeneralTimetable(trainNo: string): Promise<TdxGeneralTimetableStop[]> {
  const token = await getTdxToken()
  const res = await fetch(
    `${TDX_BASE}/GeneralTimetable/TrainNo/${trainNo}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`TDX GeneralTimetable failed: ${res.status}`)
  const data = await res.json()
  if (!data.length) return []
  return data[0].GeneralTimetable.StopTimes
}
```

### Direction Split for By-Station
```typescript
// Source: Archive _archive/src/components/byStation.vue
// Confirmed: Direction 0 = southbound (南下), Direction 1 = northbound (北上)
//
// Archive code:
// northward() { return this.availableSeats.filter(item => item.Direction === 1) }
// southward() { return this.availableSeats.filter(item => item.Direction === 0) }
//
// Phase 3 Route Handler applies this split server-side:
const northbound = trains.filter(t => t.Direction === 1)  // 北上
const southbound = trains.filter(t => t.Direction === 0)  // 南下
```

### Mock Data Structure for Phase 3

```typescript
// Additions to src/fixtures/tdx-mock.ts

// Mock for /api/tdx/timetable-by-train — keyed by trainNo
export const MOCK_TIMETABLE_BY_TRAIN: Record<string, TdxTrainStop[]> = {
  '0101': [
    { sequence: 1, stationId: '1', stationName: '南港', arrivalTime: '', departureTime: '06:00' },
    { sequence: 2, stationId: '2', stationName: '台北', arrivalTime: '06:06', departureTime: '06:07' },
    { sequence: 3, stationId: '3', stationName: '板橋', arrivalTime: '06:13', departureTime: '06:14' },
    // ... all 12 stations
    { sequence: 12, stationId: '12', stationName: '左營', arrivalTime: '07:57', departureTime: '' },
  ],
  // Add 1-2 more for test coverage
}

// Mock for /api/tdx/seat-status — pre-split by direction
export const MOCK_SEAT_STATUS_BY_STATION: TdxStationSeatStatus = {
  northbound: [
    // TdxSeatStatus items with Direction === 1
    {
      TrainNo: '0102', Direction: 1, StartingStationID: '12', EndingStationID: '1',
      StopStations: [
        { StopSequence: 1, StationID: '1', StationName: { Zh_tw: '南港', En: 'Nangang' },
          NextStationID: '', StandardSeatStatus: 'O', BusinessSeatStatus: 'O' }
      ]
    },
  ],
  southbound: [
    // TdxSeatStatus items with Direction === 0
    {
      TrainNo: '0101', Direction: 0, StartingStationID: '1', EndingStationID: '12',
      StopStations: [
        { StopSequence: 1, StationID: '1', StationName: { Zh_tw: '南港', En: 'Nangang' },
          NextStationID: '2', StandardSeatStatus: 'L', BusinessSeatStatus: 'O' }
      ]
    },
  ],
}
```

### Input Validation for Train Number
```typescript
// Validate train number: digits only, 1-4 characters
function isValidTrainNo(value: string): boolean {
  return /^\d{1,4}$/.test(value)
}

// Submit only when valid
const isValid = isValidTrainNo(trainNo.trim()) && trainNo.trim().length > 0
```

### shadcn Tabs for 北上/南下
```tsx
// Source: ui.shadcn.com/docs/components/radix/tabs
// Install: npx shadcn@latest add tabs

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="northbound" className="w-full">
  <TabsList className="w-full grid grid-cols-2">
    <TabsTrigger value="northbound">北上（{northbound.length}）</TabsTrigger>
    <TabsTrigger value="southbound">南下（{southbound.length}）</TabsTrigger>
  </TabsList>
  <TabsContent value="northbound">
    {/* northbound train cards */}
  </TabsContent>
  <TabsContent value="southbound">
    {/* southbound train cards */}
  </TabsContent>
</Tabs>
```

---

## TDX API Reference Summary

### Endpoint 1: By-Train Timetable (Phase 3 NEW)
```
GET https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/GeneralTimetable/TrainNo/{TrainNo}
Authorization: Bearer {token}

Response: Array of:
{
  "GeneralTimetable": {
    "GeneralTrainInfo": {
      "TrainNo": "0117",
      "Direction": 0 | 1,
      "StartingStationID": "1",
      "EndingStationID": "12"
    },
    "StopTimes": [
      {
        "StopSequence": 1,
        "StationID": "1",
        "StationName": { "Zh_tw": "南港", "En": "Nangang" },
        "ArrivalTime": "",         // Empty string for first stop
        "DepartureTime": "06:00"
      },
      // ... more stops
      {
        "StopSequence": 12,
        "StationID": "12",
        "StationName": { "Zh_tw": "左營", "En": "Zuoying" },
        "ArrivalTime": "07:57",
        "DepartureTime": ""        // Empty string for last stop
      }
    ]
  }
}
```
**Confidence:** MEDIUM — endpoint URL confirmed via archive + rocptx library; field names confirmed via archive `byTrainNo.vue` template + HackMD API exercise. Not directly tested against live TDX v2 API.

### Endpoint 2: By-Station Seat Status (Phase 2 Reuse)
```
GET https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/AvailableSeatStatusList/{StationID}
Authorization: Bearer {token}

Response: TdxSeatStatus[] (already typed in src/types/tdx.ts)
Direction: 0 = southbound (南下), 1 = northbound (北上)
```
**Confidence:** HIGH — already used in Phase 2, same endpoint, same shape.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PTX base URL `ptx.transportdata.tw/MOTC/v2` | TDX base URL `tdx.transportdata.tw/api/basic/v2` | ~2022 migration | Archive uses old URL; new code uses TDX URL (already correct in `tdx-api.ts`) |
| Vue 2 archive: tabs using Element UI `el-tabs` | shadcn `Tabs` (Radix UI) | Phase 3 | Accessible, Tailwind-compatible, consistent with Phase 2 design system |
| Archive: separate Vue components per mode | Next.js: shadcn Tabs on same page | Phase 3 | Simpler navigation; no routing complexity for a utility app |

**Deprecated/outdated:**
- `?top=1` OData parameter in archive code: use as OData filter `$top=1` in TDX v2, or simply take `[0]` from the array response.

---

## Open Questions

1. **Exact `StopTimes` field names in TDX v2 vs archive (PTX v2)**
   - What we know: Archive (`byTrainNo.vue`) accesses `StopTimes[i].DepartureTime` and `StopTimes[i].StationName.Zh_tw`. HackMD API exercise confirms `ArrivalTime` and `DepartureTime` fields exist. rocptx library confirms the endpoint path.
   - What's unclear: Whether TDX v2 uses exactly the same field names as PTX v2 (from 2019-era archive). The migration from PTX to TDX was ~2022; field names were generally preserved, but this is not verified for GeneralTimetable.
   - Recommendation: Add a `console.log(data[0])` in the Route Handler during initial development. If field names differ, fix in `fetchGeneralTimetable()` before exposing to UI.
   - **Confidence:** MEDIUM — two independent sources confirm field names; no direct TDX v2 live test.

2. **Whether `StopTimes` includes `StationID` field (for linking to station data)**
   - What we know: Archive `byTrainNo.vue` renders only `StationName.Zh_tw` and `DepartureTime` — no StationID access visible. The `StopSequence` field likely exists (standard TDX pattern).
   - What's unclear: Whether `StationID` is included in GeneralTimetable StopTimes (needed if we want to highlight the queried station or link to by-station view).
   - Recommendation: Assume `StationID` exists (standard in all TDX timetable endpoints). Add to type definition. If absent from response, fall back to `StationName.Zh_tw` matching.
   - **Confidence:** LOW — not directly confirmed for GeneralTimetable endpoint.

3. **THSR train number range and zero-padding behavior**
   - What we know: THSR uses 4-digit train numbers (`0101`, `0117`, `1031`). Some special/weekend trains may be 3-digit. Mock data uses `0101`-`0115` (standard format).
   - What's unclear: Whether TDX API requires zero-padded 4-digit `"0117"` or accepts `"117"`. Archive used: `getGeneralTimetablebyTrainNo(this.form.trainNo)` with whatever the user typed.
   - Recommendation: Accept user input as-is (string). Do NOT zero-pad programmatically. The TDX API likely treats the TrainNo as a string match. Add note in UI placeholder: "例：0117".
   - **Confidence:** LOW — behavior with non-zero-padded input not tested.

4. **Page navigation architecture — Tabs vs URL params**
   - What we know: shadcn Tabs with client state is simpler and faster to implement. URL searchParams (`?mode=by-train`) makes the page bookmarkable.
   - What's unclear: Whether the user wants bookmarkable mode tabs (not mentioned in requirements).
   - Recommendation: Use shadcn Tabs with client state (no URL sync). QURY-03 requirement doesn't mention bookmarking. If needed in Phase 4, URL sync can be added with `useSearchParams` + `router.replace`.
   - **Confidence:** HIGH for implementation choice; LOW for whether URL sync is desired.

---

## Sources

### Primary (HIGH confidence)
- Archive `_archive/src/components/byTrainNo.vue` — Confirmed: endpoint path (`/GeneralTimetable/TrainNo/${TrainNo}`), response shape (`result[0].GeneralTimetable.GeneralTrainInfo.TrainNo`, `result[0].GeneralTimetable.StopTimes`), template fields (`stop.DepartureTime`, `stop.StationName.Zh_tw`)
- Archive `_archive/src/components/byStation.vue` — Confirmed: same `AvailableSeatStatusList` endpoint; direction logic (`Direction === 1` = northbound, `Direction === 0` = southbound)
- Archive `_archive/src/api/thrs-api.js` — Confirmed: `getGeneralTimetablebyTrainNo(TrainNo)` calls `/GeneralTimetable/TrainNo/${TrainNo}?top=1`
- `src/types/tdx.ts` — TdxSeatStatus.Direction: `0 | 1` type confirmed, comment `0=southbound, 1=northbound`
- `src/lib/tdx-api.ts` — `fetchSeatStatus(stationId)` function confirmed; `isMockMode()` pattern confirmed
- `ui.shadcn.com/docs/components/radix/tabs` — Tabs API (`defaultValue`, `value`, `onValueChange`, TabsList/TabsTrigger/TabsContent)

### Secondary (MEDIUM confidence)
- `hackmd.io/@chrisHsiao/HkYYZIJaU` — THSR API response structure with `StopTimes`, `ArrivalTime`, `DepartureTime`, `StationName` fields documented
- `github.com/melixyen/rocptx` — JavaScript library confirming TDX path: `thsrV2URL + '/GeneralTimetable/TrainNo/{TrainNo}'`
- `.planning/codebase/INTEGRATIONS.md` — Confirms `GET /GeneralTimetable/TrainNo/{TrainNo}?top=1` in original app's endpoint list

### Tertiary (LOW confidence)
- WebSearch results about TDX v2 GeneralTimetable response shape — not verified against live TDX v2 API
- THSR train number format (3-digit vs 4-digit, zero-padding behavior) — inferred from mock data and archive; not verified against TDX API behavior

---

## Metadata

**Confidence breakdown:**
- By-train endpoint path: HIGH — confirmed from 3 independent sources (archive, INTEGRATIONS.md, rocptx library)
- By-train response shape (field names): MEDIUM — confirmed from archive template + HackMD; not verified against live TDX v2
- By-station direction split: HIGH — confirmed from archive + existing types in codebase
- Standard stack: HIGH — same stack as Phase 2, no new major dependencies
- Architecture patterns: HIGH — clear extension of Phase 2 patterns
- Navigation (Tabs approach): HIGH — shadcn Tabs API confirmed, pattern fits app size
- Train number validation: MEDIUM — format from observation of mock data; zero-padding behavior unverified

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (30 days — TDX API is stable; endpoint paths rarely change)
