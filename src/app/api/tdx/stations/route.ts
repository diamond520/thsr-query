// src/app/api/tdx/stations/route.ts
import { fetchStations } from '@/lib/tdx-api'
import { NextResponse } from 'next/server'

// Station list is static — revalidate every 24h or on-demand
export const revalidate = 86400

export async function GET() {
  try {
    const stations = await fetchStations()
    return NextResponse.json(stations)
  } catch (error) {
    console.error('[/api/tdx/stations] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch station data' },
      { status: 502 }
    )
  }
}
