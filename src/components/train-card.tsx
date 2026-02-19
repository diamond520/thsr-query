// src/components/train-card.tsx
// Mobile-only card (hidden md:block). Per UIUX-02: large touch areas, card style.
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { SeatBadge } from '@/components/seat-badge'
import type { TdxEnrichedTrain } from '@/types/tdx'

// Booking station code map — StationID (numeric string) → THSR POST form code
const BOOKING_CODE: Record<string, string> = {
  '1': 'NanGang', '2': 'Taipei', '3': 'Banqiao', '4': 'Taoyuan',
  '5': 'Hsinchu', '6': 'Miaoli', '7': 'Taichung', '8': 'Changhua',
  '9': 'Yunlin', '10': 'Chiayi', '11': 'Tainan', '12': 'ZuoYing',
}

function calcDuration(dep: string, arr: string): string {
  const [dh, dm] = dep.split(':').map(Number)
  const [ah, am] = arr.split(':').map(Number)
  const totalMin = (ah * 60 + am) - (dh * 60 + dm)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}時${m}分` : `${m}分`
}

interface TrainCardProps {
  train: TdxEnrichedTrain
  origin: string       // StationID e.g. "1"
  destination: string  // StationID e.g. "12"
  date: string         // YYYY-MM-DD
}

export function TrainCard({ train, origin, destination, date }: TrainCardProps) {
  const duration = calcDuration(train.departureTime, train.arrivalTime)
  const startCode = BOOKING_CODE[origin] ?? origin
  const endCode = BOOKING_CODE[destination] ?? destination

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: train number + time info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-lg font-semibold tabular-nums">{train.trainNo}</span>
              <span className="text-sm text-muted-foreground">{duration}</span>
            </div>
            <div className="flex items-center gap-2 text-base">
              <span className="font-medium tabular-nums">{train.departureTime}</span>
              <span className="text-muted-foreground text-xs">→</span>
              <span className="font-medium tabular-nums">{train.arrivalTime}</span>
            </div>
          </div>

          {/* Right: seat badges (per user decision: Standard + Business on two separate lines) */}
          <div className="flex flex-col gap-1 shrink-0">
            <SeatBadge status={train.standardSeat} type="標準席" />
            <SeatBadge status={train.businessSeat} type="商務席" />
          </div>
        </div>

        {/* Booking link — form POST to THSR timetable search */}
        <form
          method="POST"
          action="https://www.thsrc.com.tw/TimeTable/Search"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3"
        >
          <input type="hidden" name="SearchType" value="S" />
          <input type="hidden" name="StartStation" value={startCode} />
          <input type="hidden" name="EndStation" value={endCode} />
          <input type="hidden" name="OutWardSearchDate" value={date} />
          <input type="hidden" name="OutWardSearchTime" value={train.departureTime} />
          <button
            type="submit"
            className="w-full text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors text-left"
          >
            去訂票 →
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
