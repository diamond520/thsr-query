// src/components/train-list.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { TrainCard } from '@/components/train-card'
import { TrainTable } from '@/components/train-table'
import type { TdxEnrichedTrain } from '@/types/tdx'
import type { QueryParams } from '@/components/query-form'

interface TrainListProps {
  params: QueryParams | null
}

async function fetchTrains(params: QueryParams): Promise<TdxEnrichedTrain[]> {
  const url = `/api/tdx/trains?origin=${params.origin}&destination=${params.destination}&date=${params.date}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `查詢失敗（HTTP ${res.status}）`)
  }
  return res.json()
}

function TrainSkeletons() {
  // 5 skeleton cards — per user decision on skeleton count (Claude discretion: 5)
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  )
}

export function TrainList({ params }: TrainListProps) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['trains', params],
    queryFn: () => {
      if (!params) throw new Error('No params')
      return fetchTrains(params)
    },
    enabled: !!params,           // Only fires when form has been submitted
    staleTime: 5 * 60 * 1000,   // 5 min client cache — TDX updates seat status every 10 min
    retry: 1,                    // One retry on failure before showing error state
  })

  // --- State: Idle (no query submitted yet) ---
  if (!params) {
    return (
      <p className="text-center text-muted-foreground py-12">
        選擇起訖站與日期，即可查詢時刻表
      </p>
    )
  }

  // --- State: Loading ---
  if (isLoading) {
    return <TrainSkeletons />
  }

  // --- State: Error ---
  if (isError) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-destructive text-sm">
          {error instanceof Error ? error.message : '查詢時發生錯誤，請稍後再試'}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          重試
        </Button>
      </div>
    )
  }

  // --- State: Empty ---
  if (!data?.length) {
    return (
      <p className="text-center text-muted-foreground py-12">
        無符合的班次
      </p>
    )
  }

  // --- State: Results ---
  // Mobile: card list (hidden on md and above)
  // Desktop: table (hidden below md)
  return (
    <div>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map(train => (
          <TrainCard
            key={train.trainNo}
            train={train}
            origin={params.origin}
            destination={params.destination}
            date={params.date}
          />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <TrainTable
          trains={data}
          origin={params.origin}
          destination={params.destination}
          date={params.date}
        />
      </div>
    </div>
  )
}
