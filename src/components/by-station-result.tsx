// src/components/by-station-result.tsx
// Displays seat availability at a station, split into northbound (北上) / southbound (南下) tabs.
// Reuses SeatBadge from Phase 2. Tabs installed in Plan 01.
'use client'

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SeatBadge } from '@/components/seat-badge'
import type { TdxSeatStatus, TdxStationSeatStatus } from '@/types/tdx'

interface ByStationResultProps {
  stationId: string | null   // null = idle
}

async function fetchStationSeatStatus(stationId: string): Promise<TdxStationSeatStatus> {
  const res = await fetch(`/api/tdx/seat-status?stationId=${encodeURIComponent(stationId)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

function TrainSeatRow({ train, stationId }: { train: TdxSeatStatus; stationId: string }) {
  // Find the stop that matches the queried station to get seat status at this leg
  const stop = train.StopStations.find(s => s.StationID === stationId)

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <span className="text-sm font-medium w-12 shrink-0 tabular-nums">{train.TrainNo}</span>
      <div className="flex gap-3">
        <SeatBadge status={stop?.StandardSeatStatus ?? null} type="標準席" />
        <SeatBadge status={stop?.BusinessSeatStatus ?? null} type="商務席" />
      </div>
    </div>
  )
}

function TrainList({ trains, stationId, direction }: { trains: TdxSeatStatus[]; stationId: string; direction: string }) {
  if (trains.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        目前無{direction}班次資料
      </div>
    )
  }
  return (
    <div className="divide-y">
      {trains.map(train => (
        <TrainSeatRow key={train.TrainNo} train={train} stationId={stationId} />
      ))}
    </div>
  )
}

export function ByStationResult({ stationId }: ByStationResultProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['seat-status-by-station', stationId],
    queryFn: () => fetchStationSeatStatus(stationId!),
    enabled: !!stationId,
    staleTime: 10 * 60 * 1000,   // 10 min — seat status changes every ~10 min
    retry: 1,
  })

  // Idle
  if (!stationId) return null

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    )
  }

  // Error
  if (isError) {
    return (
      <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        無法取得座位狀態：{error instanceof Error ? error.message : '未知錯誤'}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="mt-4 rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <p className="text-sm font-medium">座位剩餘狀態</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          北上 {data.northbound.length} 班 · 南下 {data.southbound.length} 班
        </p>
      </div>
      <Tabs defaultValue="northbound" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b h-10">
          <TabsTrigger value="northbound" className="rounded-none">
            北上（{data.northbound.length}）
          </TabsTrigger>
          <TabsTrigger value="southbound" className="rounded-none">
            南下（{data.southbound.length}）
          </TabsTrigger>
        </TabsList>
        <TabsContent value="northbound" className="mt-0">
          <TrainList trains={data.northbound} stationId={stationId} direction="北上" />
        </TabsContent>
        <TabsContent value="southbound" className="mt-0">
          <TrainList trains={data.southbound} stationId={stationId} direction="南下" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
