// src/types/favorites.ts

export interface FavoriteRoute {
  origin: string       // TDX StationID e.g. "1"
  destination: string  // TDX StationID e.g. "12"
}

export const FAVORITES_STORAGE_KEY = 'thsr-favorite-routes'
export const FAVORITES_MAX = 10
