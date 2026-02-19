// src/components/round-trip-form.tsx
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
import type { RoundTripParams } from '@/types/round-trip'

interface RoundTripFormProps {
  onSubmit: (params: RoundTripParams) => void
}

async function fetchStations(): Promise<TdxStation[]> {
  const res = await fetch('/api/tdx/stations')
  if (!res.ok) throw new Error('Failed to load stations')
  return res.json()
}

export function RoundTripForm({ onSubmit }: RoundTripFormProps) {
  const [origin, setOrigin] = useState<string>('')
  const [destination, setDestination] = useState<string>('')
  // getTaiwanToday() called inside useState() initializer — hydration-safe pattern
  const [outboundDate, setOutboundDate] = useState<Date>(() => getTaiwanToday())
  const [returnDate, setReturnDate] = useState<Date>(() => getTaiwanToday())
  const [outboundCalendarOpen, setOutboundCalendarOpen] = useState(false)
  const [returnCalendarOpen, setReturnCalendarOpen] = useState(false)

  const { data: stations = [], isLoading: stationsLoading } = useQuery({
    queryKey: ['stations'],
    queryFn: fetchStations,
    staleTime: 24 * 60 * 60 * 1000,  // 24h — stations rarely change
  })

  function handleSwap() {
    setOrigin(destination)
    setDestination(origin)
  }

  function handleOutboundDateSelect(d: Date) {
    setOutboundDate(d)
    setOutboundCalendarOpen(false)
    // Clamp: if return date is before new outbound date, advance return to match
    if (returnDate < d) {
      setReturnDate(d)
    }
  }

  function handleReturnDateSelect(d: Date) {
    setReturnDate(d)
    setReturnCalendarOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    onSubmit({
      origin,
      destination,
      outboundDate: format(outboundDate, 'yyyy-MM-dd'),
      returnDate: format(returnDate, 'yyyy-MM-dd'),
    })
  }

  const isValid = !!origin && !!destination && origin !== destination && !!outboundDate && !!returnDate

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row 1: Station selector */}

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

      {/* Desktop: Select row (hidden on mobile) */}
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

        {/* Swap button */}
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

      {/* Row 2: Outbound date picker */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">去程日期</p>
        <Popover open={outboundCalendarOpen} onOpenChange={setOutboundCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !outboundDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              去程：{format(outboundDate, 'yyyy-MM-dd')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={outboundDate}
              onSelect={(d) => {
                if (d) handleOutboundDateSelect(d)
              }}
              defaultMonth={outboundDate}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Row 3: Return date picker */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">回程日期</p>
        <Popover open={returnCalendarOpen} onOpenChange={setReturnCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !returnDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              回程：{format(returnDate, 'yyyy-MM-dd')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={returnDate}
              onSelect={(d) => {
                if (d) handleReturnDateSelect(d)
              }}
              defaultMonth={returnDate}
              disabled={{ before: outboundDate }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Row 4: Submit button */}
      <Button type="submit" className="w-full" disabled={!isValid}>
        <Search className="mr-2 h-4 w-4" />
        查詢
      </Button>
    </form>
  )
}
