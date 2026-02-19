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

// --- Phase 2: Timetable + Seat Status types ---

/** TDX seat status code: O=充足, L=有限, X=售完 */
export type TdxSeatCode = 'O' | 'L' | 'X'

/** One stop in AvailableSeatStatusList response */
export interface TdxSeatStop {
  StopSequence: number
  StationID: string               // e.g. "1"
  StationName: TdxStationName
  NextStationID: string
  StandardSeatStatus: TdxSeatCode
  BusinessSeatStatus: TdxSeatCode
}

/** One train entry from GET /AvailableSeatStatusList/{StationID} */
export interface TdxSeatStatus {
  TrainNo: string                 // e.g. "0117"
  Direction: 0 | 1               // 0=southbound, 1=northbound
  StartingStationID: string
  EndingStationID: string
  StopStations: TdxSeatStop[]
}

/** One train entry from GET /DailyTimetable/OD/{O}/to/{D}/{Date} */
export interface TdxDailyTrain {
  DailyTrainInfo: {
    TrainNo: string              // e.g. "0115"
    TrainTypeName: TdxStationName
    Direction: 0 | 1
  }
  OriginStopTime: {
    StationID: string
    DepartureTime: string        // "HH:MM" format
  }
  DestinationStopTime: {
    StationID: string
    ArrivalTime: string          // "HH:MM" format
  }
}

/** Server-joined result returned from /api/tdx/trains */
export interface TdxEnrichedTrain {
  trainNo: string               // e.g. "0115"
  departureTime: string         // "HH:MM"
  arrivalTime: string           // "HH:MM"
  standardSeat: TdxSeatCode | null   // null if train not in seat status list
  businessSeat: TdxSeatCode | null
}
