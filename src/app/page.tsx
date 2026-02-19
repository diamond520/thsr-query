'use client'

import { useState } from 'react'
import { QueryForm, QueryParams } from '@/components/query-form'
import { TrainList } from '@/components/train-list'

export default function Home() {
  const [queryParams, setQueryParams] = useState<QueryParams | null>(null)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">高鐵查詢</h1>
          <p className="text-muted-foreground text-sm mt-1">查詢班次時刻與座位狀態</p>
        </div>

        {/* Query form — sets queryParams on submit */}
        <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
          <QueryForm onSubmit={setQueryParams} />
        </div>

        {/* Train list — fires query only when queryParams is non-null */}
        <TrainList params={queryParams} />
      </div>
    </main>
  )
}
