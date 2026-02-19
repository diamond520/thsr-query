// src/components/search-params-init.tsx
'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface SearchParamsInitProps {
  onInit: (from: string | null, to: string | null, date: string | null) => void
}

export function SearchParamsInit({ onInit }: SearchParamsInitProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const date = searchParams.get('date')
    // Only fire if at least one param is present — avoids spurious init on clean load
    if (from || to || date) {
      onInit(from, to, date)
    }
  }, []) // empty dep array — run once on mount only

  return null
}
