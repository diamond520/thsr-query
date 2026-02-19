// src/lib/tdx-api.ts
import 'server-only'  // Build error if imported in any 'use client' file

import { getTdxToken } from './tdx-token'
import { MOCK_STATIONS } from '@/fixtures/tdx-mock'
import type { TdxStation, TdxDailyTrain, TdxSeatStatus } from '@/types/tdx'

const TDX_BASE = 'https://tdx.transportdata.tw/api/basic/v2/Rail/THSR'

/**
 * Returns true if TDX credentials are not set — use mock data.
 * Returns false if credentials exist — call real TDX API.
 * Per user decision: no USE_MOCK_TDX flag; env var presence determines behavior.
 */
export function isMockMode(): boolean {
  return !process.env.TDX_CLIENT_ID || !process.env.TDX_CLIENT_SECRET
}

/**
 * Fetch all THSR stations.
 * Mock mode: returns MOCK_STATIONS fixture data (12 stations).
 * Real mode: calls TDX API GET /Station with Bearer token.
 */
export async function fetchStations(): Promise<TdxStation[]> {
  if (isMockMode()) {
    return MOCK_STATIONS
  }

  const token = await getTdxToken()
  const res = await fetch(`${TDX_BASE}/Station`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 86400 },  // Cache station list for 24h (stations rarely change)
  })

  if (!res.ok) {
    throw new Error(`TDX /Station failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  // Handle both bare array and wrapped { Stations: [...] } response shapes
  // Verify actual shape when TDX credentials are obtained
  return Array.isArray(data) ? data : (data.Stations ?? data)
}

/**
 * Fetch THSR daily timetable for a specific OD pair and date.
 * Mock mode: Not called directly — Route Handler returns MOCK_TRAINS.
 * Real mode: GET /DailyTimetable/OD/{originId}/to/{destId}/{date}
 * Date format: YYYY-MM-DD. Returns trains in departure order.
 */
export async function fetchDailyTrains(
  originId: string,      // TDX StationID, e.g. "1" (not station name)
  destId: string,        // TDX StationID, e.g. "12"
  date: string           // e.g. "2026-02-19"
): Promise<TdxDailyTrain[]> {
  const token = await getTdxToken()
  const res = await fetch(
    `${TDX_BASE}/DailyTimetable/OD/${originId}/to/${destId}/${date}`,
    { headers: { Authorization: `Bearer ${token}` } }
    // No revalidate — route.ts sets force-dynamic
  )
  if (!res.ok) {
    throw new Error(`TDX DailyTimetable failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

/**
 * Fetch seat availability for all trains at a given station.
 * Mock mode: Not called directly — Route Handler returns MOCK_TRAINS.
 * Real mode: GET /AvailableSeatStatusList/{stationId}
 * WARNING: Returns ALL trains at station (both directions, all OD pairs).
 * The Route Handler must use timetable result as the left join dataset.
 */
export async function fetchSeatStatus(stationId: string): Promise<TdxSeatStatus[]> {
  const token = await getTdxToken()
  const res = await fetch(
    `${TDX_BASE}/AvailableSeatStatusList/${stationId}`,
    { headers: { Authorization: `Bearer ${token}` } }
    // No revalidate — route.ts sets force-dynamic
  )
  if (!res.ok) {
    throw new Error(`TDX AvailableSeatStatusList failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}
