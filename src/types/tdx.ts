// src/types/tdx.ts
// TDX API v2 response shapes for THSR endpoints
// Source: TDX official SampleCode + existing Vue 2 field usage in _archive/src/

export interface TdxStationName {
  Zh_tw: string  // Chinese name, e.g. "南港"
  En: string     // English name, e.g. "Nangang"
}

export interface TdxStationPosition {
  PositionLat: number
  PositionLon: number
}

export interface TdxStation {
  StationUID: string          // e.g. "THSR-1"
  StationID: string           // e.g. "1" (string, not number)
  StationName: TdxStationName
  StationPosition: TdxStationPosition
  StationAddress: string
  BikeAllowOnHoliday: boolean
  SrcUpdateTime: string       // ISO 8601 with TZ offset
  UpdateTime: string          // ISO 8601 with TZ offset
  VersionID: number
}
