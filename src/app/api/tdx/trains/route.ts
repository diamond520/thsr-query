// src/app/api/tdx/trains/route.ts
// GET /api/tdx/trains?origin=<StationID>&destination=<StationID>&date=<YYYY-MM-DD>
// Returns TdxEnrichedTrain[] — timetable joined with seat status.
// Uses force-dynamic: seat status changes every 10 minutes. Do NOT use revalidate.

import { isMockMode, fetchDailyTrains, fetchSeatStatus } from '@/lib/tdx-api'
import { MOCK_TRAINS } from '@/fixtures/tdx-mock'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'  // CRITICAL: never cache — seat status is real-time

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = searchParams.get('origin')           // TDX StationID, e.g. "1"
  const destination = searchParams.get('destination') // TDX StationID, e.g. "12"
  const date = searchParams.get('date')               // YYYY-MM-DD format

  if (!origin || !destination || !date) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, date' },
      { status: 400 }
    )
  }

  // Mock mode: return fixture data without calling TDX API
  if (isMockMode()) {
    return NextResponse.json(MOCK_TRAINS)
  }

  try {
    // Parallel fetch — both TDX calls fired simultaneously (never sequential)
    const [trains, seatStatuses] = await Promise.all([
      fetchDailyTrains(origin, destination, date),
      fetchSeatStatus(origin),  // Seat status by ORIGIN StationID only
    ])

    // Build lookup map keyed on TrainNo for O(1) join
    // IMPORTANT: AvailableSeatStatusList returns ALL trains at station;
    // use timetable (trains array) as the left dataset — never the reverse.
    const seatMap = new Map(seatStatuses.map(s => [s.TrainNo, s]))

    const enriched = trains.map(train => {
      const trainNo = train.DailyTrainInfo.TrainNo
      const seat = seatMap.get(trainNo)
      // Find the StopStation leg where this train departs from origin station
      // StandardSeatStatus/BusinessSeatStatus represent the leg FROM this stop onward
      const leg = seat?.StopStations.find(stop => stop.StationID === origin)

      return {
        trainNo,
        departureTime: train.OriginStopTime.DepartureTime,  // "HH:MM"
        arrivalTime: train.DestinationStopTime.ArrivalTime, // "HH:MM"
        standardSeat: leg?.StandardSeatStatus ?? null,  // null = not in seat list
        businessSeat: leg?.BusinessSeatStatus ?? null,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('[/api/tdx/trains] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch train data from TDX' },
      { status: 502 }
    )
  }
}
