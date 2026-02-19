// src/components/favorite-route-chips.tsx
'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { FavoriteRoute } from '@/types/favorites'
import type { TdxStation } from '@/types/tdx'

interface FavoriteRouteChipsProps {
  favorites: FavoriteRoute[]
  stations: TdxStation[]
  onApply: (route: FavoriteRoute) => void
  onRemove: (index: number) => void
}

export function FavoriteRouteChips({
  favorites,
  stations,
  onApply,
  onRemove,
}: FavoriteRouteChipsProps) {
  if (favorites.length === 0) return null

  function getStationName(id: string): string {
    return stations.find(s => s.StationID === id)?.StationName.Zh_tw ?? id
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {favorites.map((route, index) => (
        <Badge
          key={`${route.origin}-${route.destination}-${index}`}
          variant="secondary"
          className="cursor-pointer hover:bg-secondary/80 pr-1 gap-1"
          onClick={() => onApply(route)}
        >
          <span>
            {getStationName(route.origin)} → {getStationName(route.destination)}
          </span>
          <button
            type="button"
            aria-label={`刪除 ${getStationName(route.origin)} 到 ${getStationName(route.destination)}`}
            className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
            onClick={(e) => {
              e.stopPropagation()  // prevent onApply from firing when deleting
              onRemove(index)
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}
