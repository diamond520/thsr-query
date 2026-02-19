// src/lib/tdx-api.ts
import 'server-only'  // Build error if imported in any 'use client' file

import { getTdxToken } from './tdx-token'
import { MOCK_STATIONS } from '@/fixtures/tdx-mock'
import type { TdxStation } from '@/types/tdx'

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
