// src/components/round-trip-result.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { TrainCard } from '@/components/train-card'
import { TrainTable } from '@/components/train-table'
import type { RoundTripParams } from '@/types/round-trip'
import type { TdxEnrichedTrain } from '@/types/tdx'

async function fetchTrains(origin: string, destination: string, date: string): Promise<TdxEnrichedTrain[]> {
  const url = `/api/tdx/trains?origin=${origin}&destination=${destination}&date=${date}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `查詢失敗（HTTP ${res.status}）`)
  }
  return res.json()
}

interface LegDisplayProps {
  heading: string
  params: { origin: string; destination: string; date: string } | null
  data: TdxEnrichedTrain[] | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

function LegDisplay({ heading, params, data, isLoading, isError, error, refetch }: LegDisplayProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">{heading}</h3>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
      )}

      {/* Error state */}
      {!isLoading && isError && (
        <div className="text-center py-8 space-y-3">
          <p className="text-destructive text-sm">
            {error instanceof Error ? error.message : '查詢時發生錯誤，請稍後再試'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            重試
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && data !== undefined && data.length === 0 && (
        <p className="text-center text-muted-foreground py-8">無符合的班次</p>
      )}

      {/* Results state */}
      {!isLoading && !isError && data && data.length > 0 && params && (
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
      )}
    </div>
  )
}

interface RoundTripResultProps {
  params: RoundTripParams | null
}

export function RoundTripResult({ params }: RoundTripResultProps) {
  const {
    data: outboundData,
    isLoading: outboundLoading,
    isError: outboundError,
    error: outboundErr,
    refetch: refetchOutbound,
  } = useQuery({
    queryKey: ['trains', 'outbound', params],
    queryFn: () => fetchTrains(params!.origin, params!.destination, params!.outboundDate),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const {
    data: returnData,
    isLoading: returnLoading,
    isError: returnError,
    error: returnErr,
    refetch: refetchReturn,
  } = useQuery({
    queryKey: ['trains', 'return', params],
    queryFn: () => fetchTrains(params!.destination, params!.origin, params!.returnDate),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // --- State: Idle (no query submitted yet) ---
  if (!params) {
    return (
      <p className="text-center text-muted-foreground py-12">
        選擇起訖站與去回程日期，即可查詢時刻表
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <LegDisplay
          heading={`去程 · ${params.outboundDate}`}
          params={{ origin: params.origin, destination: params.destination, date: params.outboundDate }}
          data={outboundData}
          isLoading={outboundLoading}
          isError={outboundError}
          error={outboundErr as Error | null}
          refetch={refetchOutbound}
        />
      </div>
      <div>
        <LegDisplay
          heading={`回程 · ${params.returnDate}`}
          params={{ origin: params.destination, destination: params.origin, date: params.returnDate }}
          data={returnData}
          isLoading={returnLoading}
          isError={returnError}
          error={returnErr as Error | null}
          refetch={refetchReturn}
        />
      </div>
    </div>
  )
}
