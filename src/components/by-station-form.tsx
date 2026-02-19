// src/components/by-station-form.tsx
// Station select for by-station seat status query.
// Fetches station list from /api/tdx/stations (same as QueryForm — shared cache via queryKey).
// Emits stationId string to parent via onSubmit.
'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TdxStation } from '@/types/tdx'

interface ByStationFormProps {
  onSubmit: (stationId: string) => void
}

async function fetchStations(): Promise<TdxStation[]> {
  const res = await fetch('/api/tdx/stations')
  if (!res.ok) throw new Error('Failed to load stations')
  return res.json()
}

export function ByStationForm({ onSubmit }: ByStationFormProps) {
  const [stationId, setStationId] = useState('')

  const { data: stations = [], isLoading: stationsLoading } = useQuery({
    queryKey: ['stations'],   // Same key as QueryForm — reuses cached data
    queryFn: fetchStations,
    staleTime: 24 * 60 * 60 * 1000,  // 24h
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stationId) return
    onSubmit(stationId)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Select value={stationId} onValueChange={setStationId} disabled={stationsLoading}>
          <SelectTrigger className="w-full max-w-[240px]">
            <SelectValue placeholder="選擇車站" />
          </SelectTrigger>
          <SelectContent>
            {stations.map(station => (
              <SelectItem key={station.StationID} value={station.StationID}>
                {station.StationName.Zh_tw}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={!stationId || stationsLoading}>
        <Search className="mr-2 h-4 w-4" />
        查詢
      </Button>
    </form>
  )
}
