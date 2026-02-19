// GET /api/tdx/seat-status?stationId=<StationID>
// Returns TdxStationSeatStatus = { northbound: TdxSeatStatus[], southbound: TdxSeatStatus[] }
// Direction split is done server-side: 0=southbound (南下), 1=northbound (北上).
// Uses force-dynamic: seat status changes every ~10 minutes.

import { isMockMode, fetchSeatStatus } from '@/lib/tdx-api'
import { MOCK_SEAT_STATUS_BY_STATION } from '@/fixtures/tdx-mock'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'  // Seat status is real-time data

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stationId = searchParams.get('stationId')

  if (!stationId) {
    return NextResponse.json(
      { error: 'Missing required parameter: stationId' },
      { status: 400 }
    )
  }

  if (isMockMode()) {
    return NextResponse.json(MOCK_SEAT_STATUS_BY_STATION)
  }

  try {
    const trains = await fetchSeatStatus(stationId)
    // Split by Direction server-side — do NOT return raw array to client
    // Direction: 0 = southbound (南下), 1 = northbound (北上) — per TdxSeatStatus type comment
    const northbound = trains.filter(t => t.Direction === 1)
    const southbound = trains.filter(t => t.Direction === 0)
    return NextResponse.json({ northbound, southbound })
  } catch (error) {
    console.error('[/api/tdx/seat-status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seat status from TDX' },
      { status: 502 }
    )
  }
}
