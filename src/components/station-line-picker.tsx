'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { TdxStation } from '@/types/tdx'

interface StationLinePickerProps {
  stations: TdxStation[]
  origin: string
  destination: string
  onOriginChange: (id: string) => void
  onDestinationChange: (id: string) => void
  disabled?: boolean
}

type SelectionStep = 'origin' | 'destination'

function getStationState(
  stationId: string,
  origin: string,
  destination: string
): 'origin' | 'destination' | 'in-range' | 'default' {
  const id = parseInt(stationId)
  const o = origin ? parseInt(origin) : null
  const d = destination ? parseInt(destination) : null
  if (o !== null && id === o) return 'origin'
  if (d !== null && id === d) return 'destination'
  if (o !== null && d !== null) {
    const min = Math.min(o, d)
    const max = Math.max(o, d)
    if (id > min && id < max) return 'in-range'
  }
  return 'default'
}

export function StationLinePicker({
  stations,
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  disabled = false,
}: StationLinePickerProps) {
  const [step, setStep] = useState<SelectionStep>('origin')

  // Reset step to 'origin' when origin is cleared externally (e.g. swap button
  // when only origin was set, or full clear). Also handles swap-then-continue.
  useEffect(() => {
    if (!origin && !destination) setStep('origin')
    else if (!origin) setStep('origin')
  }, [origin, destination])

  // Sort stations by StationID numerically: 1 (南港) → 12 (左營), north to south.
  const sortedStations = [...stations].sort(
    (a, b) => parseInt(a.StationID) - parseInt(b.StationID)
  )

  function handleStationTap(stationId: string) {
    if (disabled) return

    // If both are already selected, tapping any station clears and restarts.
    if (origin && destination) {
      onOriginChange(stationId)
      onDestinationChange('')
      setStep('destination')
      return
    }

    if (step === 'origin') {
      onOriginChange(stationId)
      setStep('destination')
    } else {
      // destination step
      if (stationId === origin) {
        // Tapping origin again during destination step: deselect origin, restart.
        onOriginChange('')
        setStep('origin')
      } else {
        onDestinationChange(stationId)
        setStep('origin')
      }
    }
  }

  const originName = sortedStations.find(s => s.StationID === origin)?.StationName.Zh_tw
  const destinationName = sortedStations.find(s => s.StationID === destination)?.StationName.Zh_tw

  const stepLabel =
    step === 'origin'
      ? origin
        ? `出發：${originName}`
        : '請點選出發站'
      : destination
        ? `到達：${destinationName}`
        : '請點選到達站'

  return (
    <div className="space-y-3">
      {/* Step prompt */}
      <p className="text-sm text-muted-foreground text-center">{stepLabel}</p>

      {/* Line and station dots */}
      <div className="relative flex flex-col" role="listbox" aria-label="選擇起訖站">
        {/* Vertical connecting line — positioned behind dots */}
        <div className="absolute left-[19px] top-5 bottom-5 w-px bg-border" />

        {sortedStations.map(station => {
          const state = getStationState(station.StationID, origin, destination)
          const isSelected = state === 'origin' || state === 'destination'

          return (
            <div
              key={station.StationID}
              className="relative flex items-center gap-3 py-0.5"
            >
              {/* Station button — 44×44px touch target (WCAG 2.5.5) */}
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={`${station.StationName.Zh_tw}${state === 'origin' ? ' (出發站)' : state === 'destination' ? ' (到達站)' : ''}`}
                disabled={disabled}
                onClick={() => handleStationTap(station.StationID)}
                className="relative z-10 flex items-center justify-center w-11 h-11 shrink-0 disabled:opacity-50"
              >
                {/* Visual dot: 12px circle with state-based color */}
                <span
                  className={cn(
                    'w-3 h-3 rounded-full border-2 transition-colors',
                    state === 'origin' && 'bg-primary border-primary',
                    state === 'destination' && 'bg-destructive border-destructive',
                    state === 'in-range' && 'bg-primary/30 border-primary/50',
                    state === 'default' && 'bg-background border-border'
                  )}
                />
              </button>

              {/* Station name + badge */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={cn(
                    'text-sm',
                    isSelected ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {station.StationName.Zh_tw}
                </span>
                {state === 'origin' && (
                  <span className="text-[10px] font-medium text-primary-foreground bg-primary px-1 rounded">
                    起
                  </span>
                )}
                {state === 'destination' && (
                  <span className="text-[10px] font-medium text-destructive-foreground bg-destructive px-1 rounded">
                    訖
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
