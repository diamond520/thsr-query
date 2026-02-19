'use client'

import { Suspense, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { QueryForm, QueryParams } from '@/components/query-form'
import { TrainList } from '@/components/train-list'
import { ByTrainForm } from '@/components/by-train-form'
import { ByTrainResult } from '@/components/by-train-result'
import { ByStationForm } from '@/components/by-station-form'
import { ByStationResult } from '@/components/by-station-result'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SearchParamsInit } from '@/components/search-params-init'
import { ShareButton } from '@/components/share-button'

export default function Home() {
  const router = useRouter()
  const pathname = usePathname()

  // by-od state
  const [queryParams, setQueryParams] = useState<QueryParams | null>(null)

  // URL → form pre-fill state (set by SearchParamsInit on mount)
  const [initialOrigin, setInitialOrigin] = useState<string | undefined>()
  const [initialDestination, setInitialDestination] = useState<string | undefined>()
  const [initialDate, setInitialDate] = useState<string | undefined>()
  // formKey: increment to force QueryForm remount — picks up new initial* prop values
  const [formKey, setFormKey] = useState(0)

  // by-train state
  const [trainNo, setTrainNo] = useState<string | null>(null)

  // by-station state
  const [stationId, setStationId] = useState<string | null>(null)

  // Called once on mount by SearchParamsInit when URL has ?from, ?to, ?date params
  function handleParamInit(from: string | null, to: string | null, date: string | null) {
    if (from) setInitialOrigin(from)
    if (to) setInitialDestination(to)
    if (date) setInitialDate(date)
    // Remount QueryForm so useState initializers pick up the new initial* props
    setFormKey(k => k + 1)
    // Auto-execute the query when all three params are present
    if (from && to && date) {
      setQueryParams({ origin: from, destination: to, date })
    }
  }

  // Called by QueryForm onSubmit — sets query state AND updates URL
  function handleQuerySubmit(params: QueryParams) {
    setQueryParams(params)

    // Update URL without page reload or new history entry (no Back-button loop)
    const urlParams = new URLSearchParams({
      from: params.origin,
      to: params.destination,
      date: params.date,
    })
    router.replace(`${pathname}?${urlParams.toString()}`, { scroll: false })
  }

  return (
    <main className="min-h-screen bg-background">
      {/*
        SearchParamsInit reads URL params on mount and calls handleParamInit.
        Suspense boundary is REQUIRED for next build production prerendering —
        useSearchParams() without Suspense causes a silent build failure.
        fallback={null} avoids any layout shift (SearchParamsInit renders nothing).
      */}
      <Suspense fallback={null}>
        <SearchParamsInit onInit={handleParamInit} />
      </Suspense>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">高鐵查詢</h1>
          <p className="text-muted-foreground text-sm mt-1">查詢班次時刻與座位狀態</p>
        </div>

        {/* Top-level mode switcher */}
        <Tabs defaultValue="by-od" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="by-od">時間查詢</TabsTrigger>
            <TabsTrigger value="by-train">車次查詢</TabsTrigger>
            <TabsTrigger value="by-station">車站查詢</TabsTrigger>
          </TabsList>

          {/* Tab 1: By OD — Phase 5 adds URL wiring + ShareButton */}
          <TabsContent value="by-od">
            <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
              {/*
                key={formKey}: when formKey increments (triggered by URL params on load),
                React unmounts and remounts QueryForm so useState initializers run again
                with the new initial* props from the URL.
              */}
              <QueryForm
                key={formKey}
                initialOrigin={initialOrigin}
                initialDestination={initialDestination}
                initialDate={initialDate}
                onSubmit={handleQuerySubmit}
              />
            </div>
            {/* ShareButton renders only when a query has been submitted (queryParams !== null) */}
            {queryParams && (
              <div className="mb-4 flex justify-end">
                <ShareButton params={queryParams} />
              </div>
            )}
            <TrainList params={queryParams} />
          </TabsContent>

          {/* Tab 2: By Train Number (Phase 3 — unchanged) */}
          <TabsContent value="by-train">
            <div className="mb-2 rounded-lg border bg-card p-4 shadow-sm">
              <ByTrainForm onSubmit={setTrainNo} />
            </div>
            <ByTrainResult trainNo={trainNo} />
          </TabsContent>

          {/* Tab 3: By Station (Phase 3 — unchanged) */}
          <TabsContent value="by-station">
            <div className="mb-2 rounded-lg border bg-card p-4 shadow-sm">
              <ByStationForm onSubmit={setStationId} />
            </div>
            <ByStationResult stationId={stationId} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
