// GET /api/tdx/timetable-by-train?trainNo=<string>
// Returns TdxTrainStop[] — normalized stop array for the given train number.
// Empty array [] means train not found (not an error).
// Uses force-dynamic: GeneralTimetable is static but mock mode needs per-request behavior.

import { isMockMode, fetchGeneralTimetable } from '@/lib/tdx-api'
import { MOCK_TIMETABLE_BY_TRAIN } from '@/fixtures/tdx-mock'
import { NextResponse } from 'next/server'
import type { TdxGeneralTimetableStop, TdxTrainStop } from '@/types/tdx'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trainNo = searchParams.get('trainNo')

  if (!trainNo) {
    return NextResponse.json(
      { error: 'Missing required parameter: trainNo' },
      { status: 400 }
    )
  }

  if (isMockMode()) {
    // Return empty array for unknown train numbers (not an error)
    const result = MOCK_TIMETABLE_BY_TRAIN[trainNo] ?? []
    return NextResponse.json(result)
  }

  try {
    const rawStops: TdxGeneralTimetableStop[] = await fetchGeneralTimetable(trainNo)
    // Normalize from TDX raw shape to server-simplified TdxTrainStop
    const stops: TdxTrainStop[] = rawStops.map(stop => ({
      sequence: stop.StopSequence,
      stationId: stop.StationID,
      stationName: stop.StationName.Zh_tw,
      arrivalTime: stop.ArrivalTime,       // "" for first stop — pass through as-is
      departureTime: stop.DepartureTime,   // "" for last stop — pass through as-is
    }))
    return NextResponse.json(stops)
  } catch (error) {
    console.error('[/api/tdx/timetable-by-train] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timetable from TDX' },
      { status: 502 }
    )
  }
}
