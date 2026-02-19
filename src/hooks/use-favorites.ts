// src/hooks/use-favorites.ts
import { useCallback } from 'react'
import { useLocalStorage } from './use-local-storage'
import type { FavoriteRoute } from '@/types/favorites'
import { FAVORITES_STORAGE_KEY, FAVORITES_MAX } from '@/types/favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<FavoriteRoute[]>(
    FAVORITES_STORAGE_KEY,
    []
  )

  const addRoute = useCallback((route: FavoriteRoute) => {
    setFavorites(prev => {
      // Silently skip duplicates (same origin AND destination)
      const isDuplicate = prev.some(
        r => r.origin === route.origin && r.destination === route.destination
      )
      // Silently block when at capacity
      if (isDuplicate || prev.length >= FAVORITES_MAX) return prev
      return [...prev, route]
    })
  }, [setFavorites])

  const removeRoute = useCallback((index: number) => {
    setFavorites(prev => prev.filter((_, i) => i !== index))
  }, [setFavorites])

  const isFull = favorites.length >= FAVORITES_MAX

  return { favorites, addRoute, removeRoute, isFull }
}
