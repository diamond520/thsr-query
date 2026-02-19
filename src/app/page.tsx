'use client'

import { useState } from 'react'
import { QueryForm, QueryParams } from '@/components/query-form'
import { TrainList } from '@/components/train-list'
import { ByTrainForm } from '@/components/by-train-form'
import { ByTrainResult } from '@/components/by-train-result'
import { ByStationForm } from '@/components/by-station-form'
import { ByStationResult } from '@/components/by-station-result'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function Home() {
  // by-od state (Phase 2 — unchanged)
  const [queryParams, setQueryParams] = useState<QueryParams | null>(null)

  // by-train state
  const [trainNo, setTrainNo] = useState<string | null>(null)

  // by-station state
  const [stationId, setStationId] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-background">
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

          {/* Tab 1: By OD (Phase 2 — unchanged behavior) */}
          <TabsContent value="by-od">
            <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
              <QueryForm onSubmit={setQueryParams} />
            </div>
            <TrainList params={queryParams} />
          </TabsContent>

          {/* Tab 2: By Train Number (Plan 01) */}
          <TabsContent value="by-train">
            <div className="mb-2 rounded-lg border bg-card p-4 shadow-sm">
              <ByTrainForm onSubmit={setTrainNo} />
            </div>
            <ByTrainResult trainNo={trainNo} />
          </TabsContent>

          {/* Tab 3: By Station (Plan 02) */}
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
