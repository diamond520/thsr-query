// src/components/query-form.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowLeftRight, CalendarIcon, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { getTaiwanToday } from '@/lib/taiwan-date'
import type { TdxStation } from '@/types/tdx'
import { StationLinePicker } from '@/components/station-line-picker'

export interface QueryParams {
  origin: string       // TDX StationID e.g. "1"
  destination: string  // TDX StationID e.g. "12"
  date: string         // YYYY-MM-DD format for API call
}

interface QueryFormProps {
  onSubmit: (params: QueryParams) => void
}

async function fetchStations(): Promise<TdxStation[]> {
  const res = await fetch('/api/tdx/stations')
  if (!res.ok) throw new Error('Failed to load stations')
  return res.json()
}

export function QueryForm({ onSubmit }: QueryFormProps) {
  const [origin, setOrigin] = useState<string>('')
  const [destination, setDestination] = useState<string>('')
  // getTaiwanToday() called inside useState initializer — avoids hydration mismatch
  const [date, setDate] = useState<Date>(() => getTaiwanToday())
  const [calendarOpen, setCalendarOpen] = useState(false)

  const { data: stations = [], isLoading: stationsLoading } = useQuery({
    queryKey: ['stations'],
    queryFn: fetchStations,
    staleTime: 24 * 60 * 60 * 1000,  // 24h — stations rarely change
  })

  function handleSwap() {
    setOrigin(destination)
    setDestination(origin)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!origin || !destination || !date) return
    if (origin === destination) return  // Same station — no-op

    // format() from date-fns produces "YYYY-MM-DD" in local time
    onSubmit({
      origin,
      destination,
      date: format(date, 'yyyy-MM-dd'),
    })
  }

  const isValid = !!origin && !!destination && !!date && origin !== destination

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Mobile: visual line picker (md:hidden) */}
      <div className="md:hidden">
        <StationLinePicker
          stations={stations}
          origin={origin}
          destination={destination}
          onOriginChange={setOrigin}
          onDestinationChange={setDestination}
          disabled={stationsLoading}
        />
      </div>

      {/* Desktop: original Select row (hidden on mobile) */}
      <div className="hidden md:flex items-center gap-2">
        {/* Origin station select */}
        <Select value={origin} onValueChange={setOrigin} disabled={stationsLoading}>
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue placeholder="起站" />
          </SelectTrigger>
          <SelectContent>
            {stations.map(station => (
              <SelectItem key={station.StationID} value={station.StationID}>
                {station.StationName.Zh_tw}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Swap button — per user decision: circle-arrow icon, between the two selects */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleSwap}
          disabled={!origin && !destination}
          aria-label="交換起訖站"
          className="shrink-0"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>

        {/* Destination station select */}
        <Select value={destination} onValueChange={setDestination} disabled={stationsLoading}>
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue placeholder="訖站" />
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

      {/* Row 2: Date picker */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'yyyy-MM-dd') : '選擇日期'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) {
                setDate(d)
                setCalendarOpen(false)
              }
            }}
            defaultMonth={date}
          />
        </PopoverContent>
      </Popover>

      {/* Row 3: Submit button */}
      <Button type="submit" className="w-full" disabled={!isValid}>
        <Search className="mr-2 h-4 w-4" />
        查詢
      </Button>
    </form>
  )
}
