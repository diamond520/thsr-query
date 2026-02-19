// src/components/train-table.tsx
// Desktop table (hidden md:hidden). Per UIUX-02: clean table style.
'use client'

import { SeatBadge } from '@/components/seat-badge'
import type { TdxEnrichedTrain } from '@/types/tdx'

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

interface TrainTableProps {
  trains: TdxEnrichedTrain[]
  origin: string
  destination: string
  date: string
}

export function TrainTable({ trains, origin, destination, date }: TrainTableProps) {
  const startCode = BOOKING_CODE[origin] ?? origin
  const endCode = BOOKING_CODE[destination] ?? destination

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-muted-foreground">
            <th className="px-4 py-3 text-left font-medium">車次</th>
            <th className="px-4 py-3 text-left font-medium">出發</th>
            <th className="px-4 py-3 text-left font-medium">抵達</th>
            <th className="px-4 py-3 text-left font-medium">行車時間</th>
            <th className="px-4 py-3 text-left font-medium">標準席</th>
            <th className="px-4 py-3 text-left font-medium">商務席</th>
            <th className="px-4 py-3 text-left font-medium">訂票</th>
          </tr>
        </thead>
        <tbody>
          {trains.map(train => (
            <tr key={train.trainNo} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-semibold tabular-nums">{train.trainNo}</td>
              <td className="px-4 py-3 tabular-nums">{train.departureTime}</td>
              <td className="px-4 py-3 tabular-nums">{train.arrivalTime}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {calcDuration(train.departureTime, train.arrivalTime)}
              </td>
              <td className="px-4 py-3">
                <SeatBadge status={train.standardSeat} type="標準席" />
              </td>
              <td className="px-4 py-3">
                <SeatBadge status={train.businessSeat} type="商務席" />
              </td>
              <td className="px-4 py-3">
                <form
                  method="POST"
                  action="https://www.thsrc.com.tw/TimeTable/Search"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <input type="hidden" name="SearchType" value="S" />
                  <input type="hidden" name="StartStation" value={startCode} />
                  <input type="hidden" name="EndStation" value={endCode} />
                  <input type="hidden" name="OutWardSearchDate" value={date} />
                  <input type="hidden" name="OutWardSearchTime" value={train.departureTime} />
                  <button
                    type="submit"
                    className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors whitespace-nowrap text-sm"
                  >
                    去訂票
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
