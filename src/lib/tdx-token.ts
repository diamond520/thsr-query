// src/lib/tdx-token.ts
import 'server-only'  // Build error if imported in any 'use client' file

const TDX_AUTH_URL =
  'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'

interface CachedToken {
  value: string
  expiresAt: number  // Date.now() in milliseconds
}

// Module-level cache — persists across requests within the same Vercel function instance
// On cold start: null (fetches fresh). On warm requests: returns cached token.
let cachedToken: CachedToken | null = null

export async function getTdxToken(): Promise<string> {
  const now = Date.now()
  // Return cached token if still valid with 5-minute safety buffer
  if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
    return cachedToken.value
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.TDX_CLIENT_ID!,
    client_secret: process.env.TDX_CLIENT_SECRET!,
  })

  const res = await fetch(TDX_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    cache: 'no-store',  // Never cache the auth request itself
  })

  if (!res.ok) {
    throw new Error(`TDX auth failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  // TDX token TTL: 86400s (24h), verified via official TDX SampleCode repo
  cachedToken = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  }

  return cachedToken.value
}
