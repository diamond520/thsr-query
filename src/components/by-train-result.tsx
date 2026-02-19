// src/components/by-train-result.tsx
// Displays stop timeline for a queried train number.
// States: idle (no trainNo), loading, empty (train not found), error, result.
'use client'

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import type { TdxTrainStop } from '@/types/tdx'

interface ByTrainResultProps {
  trainNo: string | null   // null = idle (no query submitted yet)
}

async function fetchTrainStops(trainNo: string): Promise<TdxTrainStop[]> {
  const res = await fetch(`/api/tdx/timetable-by-train?trainNo=${encodeURIComponent(trainNo)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export function ByTrainResult({ trainNo }: ByTrainResultProps) {
  const { data: stops, isLoading, isError, error } = useQuery({
    queryKey: ['timetable-by-train', trainNo],
    queryFn: () => fetchTrainStops(trainNo!),
    enabled: !!trainNo,
    staleTime: 60 * 60 * 1000,   // 1h — GeneralTimetable is static schedule data
    retry: 1,
  })

  // Idle: no query submitted
  if (!trainNo) {
    return null
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    )
  }

  // API error
  if (isError) {
    return (
      <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        無法取得時刻表：{error instanceof Error ? error.message : '未知錯誤'}
      </div>
    )
  }

  // Empty — train number not found
  if (!stops || stops.length === 0) {
    return (
      <div className="mt-4 rounded-md border bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
        查無車次「{trainNo}」的資料，請確認車次號是否正確
      </div>
    )
  }

  // Result: stop timeline table
  return (
    <div className="mt-4 rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <p className="text-sm font-medium">車次 {trainNo} 停靠站</p>
        <p className="text-xs text-muted-foreground mt-0.5">{stops.length} 站</p>
      </div>
      <div className="divide-y">
        {stops.map((stop) => (
          <div key={stop.sequence} className="flex items-center gap-4 px-4 py-3">
            {/* Sequence number */}
            <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">
              {stop.sequence}
            </span>
            {/* Station name */}
            <span className="flex-1 text-sm font-medium">{stop.stationName}</span>
            {/* Times: arrival | departure */}
            <div className="flex gap-3 text-sm tabular-nums text-right">
              <span className="text-muted-foreground w-12">
                {/* First stop has no arrival time */}
                {stop.arrivalTime || '—'}
              </span>
              <span className="w-12">
                {/* Last stop has no departure time */}
                {stop.departureTime || '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* Column headers (sticky top inside scroll if needed) */}
      <div className="flex items-center gap-4 px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
        <span className="w-4 shrink-0" />
        <span className="flex-1">車站</span>
        <div className="flex gap-3 text-right">
          <span className="w-12">到站</span>
          <span className="w-12">離站</span>
        </div>
      </div>
    </div>
  )
}
