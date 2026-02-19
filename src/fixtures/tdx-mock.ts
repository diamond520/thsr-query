// src/fixtures/tdx-mock.ts
// Mock data matching real TDX API response format for /Station endpoint
// Used when TDX_CLIENT_ID / TDX_CLIENT_SECRET env vars are not set
import type { TdxStation, TdxEnrichedTrain, TdxTrainStop, TdxSeatStatus, TdxStationSeatStatus } from '@/types/tdx'

export const MOCK_STATIONS: TdxStation[] = [
  {
    StationUID: 'THSR-1',
    StationID: '1',
    StationName: { Zh_tw: '南港', En: 'Nangang' },
    StationPosition: { PositionLat: 25.0531, PositionLon: 121.6076 },
    StationAddress: '台北市南港區忠孝東路七段338號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
  {
    StationUID: 'THSR-2',
    StationID: '2',
    StationName: { Zh_tw: '台北', En: 'Taipei' },
    StationPosition: { PositionLat: 25.0150, PositionLon: 121.5172 },
    StationAddress: '台北市中正區北平西路3號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
  {
    StationUID: 'THSR-3',
    StationID: '3',
    StationName: { Zh_tw: '板橋', En: 'Banqiao' },
    StationPosition: { PositionLat: 24.9991, PositionLon: 121.4594 },
    StationAddress: '新北市板橋區縣民大道二段7號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
  {
    StationUID: 'THSR-4',
    StationID: '4',
    StationName: { Zh_tw: '桃園', En: 'Taoyuan' },
    StationPosition: { PositionLat: 24.9706, PositionLon: 121.2271 },
    StationAddress: '桃園市中壢區高鐵北路一段6號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
  {
    StationUID: 'THSR-5',
    StationID: '5',
    StationName: { Zh_tw: '新竹', En: 'Hsinchu' },
    StationPosition: { PositionLat: 24.8060, PositionLon: 120.9769 },
    StationAddress: '新竹縣竹北市高鐵七路一段8號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
  {
    StationUID: 'THSR-6',
    StationID: '6',
    StationName: { Zh_tw: '苗栗', En: 'Miaoli' },
    StationPosition: { PositionLat: 24.5673, PositionLon: 120.8230 },
    StationAddress: '苗栗縣後龍鎮高鐵路6號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
  {
    StationUID: 'THSR-7',
    StationID: '7',
    StationName: { Zh_tw: '台中', En: 'Taichung' },
    StationPosition: { PositionLat: 24.2677, PositionLon: 120.6936 },
    StationAddress: '台中市烏日區站區一路99號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
  {
    StationUID: 'THSR-8',
    StationID: '8',
    StationName: { Zh_tw: '彰化', En: 'Changhua' },
    StationPosition: { PositionLat: 23.9979, PositionLon: 120.5956 },
    StationAddress: '彰化縣田中鎮中南路一段188號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
  {
    StationUID: 'THSR-9',
    StationID: '9',
    StationName: { Zh_tw: '雲林', En: 'Yunlin' },
    StationPosition: { PositionLat: 23.7130, PositionLon: 120.4438 },
    StationAddress: '雲林縣虎尾鎮高鐵站前路8號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
  {
    StationUID: 'THSR-10',
    StationID: '10',
    StationName: { Zh_tw: '嘉義', En: 'Chiayi' },
    StationPosition: { PositionLat: 23.4960, PositionLon: 120.2987 },
    StationAddress: '嘉義縣太保市高鐵一路東段5號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
  {
    StationUID: 'THSR-11',
    StationID: '11',
    StationName: { Zh_tw: '台南', En: 'Tainan' },
    StationPosition: { PositionLat: 22.9989, PositionLon: 120.2319 },
    StationAddress: '台南市歸仁區高鐵路一段5號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
  {
    StationUID: 'THSR-12',
    StationID: '12',
    StationName: { Zh_tw: '左營', En: 'Zuoying' },
    StationPosition: { PositionLat: 22.6978, PositionLon: 120.2931 },
    StationAddress: '高雄市左營區左營大路一段188號',
    BikeAllowOnHoliday: true,
    SrcUpdateTime: '2024-01-01T00:00:00+08:00',
    UpdateTime: '2024-01-01T00:00:00+08:00',
    VersionID: 1,
  },
]

/** Mock enriched train data for /api/tdx/trains in mock mode.
 *  Covers all three seat status codes across 8 realistic trains (Nangang→Zuoying).
 *  Train numbers match real THSR format (4-digit, zero-padded).
 */
export const MOCK_TRAINS: TdxEnrichedTrain[] = [
  { trainNo: '0101', departureTime: '06:00', arrivalTime: '07:57', standardSeat: 'O', businessSeat: 'O' },
  { trainNo: '0103', departureTime: '06:30', arrivalTime: '08:10', standardSeat: 'O', businessSeat: 'O' },
  { trainNo: '0105', departureTime: '07:00', arrivalTime: '08:52', standardSeat: 'L', businessSeat: 'O' },
  { trainNo: '0107', departureTime: '08:00', arrivalTime: '09:52', standardSeat: 'L', businessSeat: 'L' },
  { trainNo: '0109', departureTime: '09:00', arrivalTime: '10:52', standardSeat: 'X', businessSeat: 'L' },
  { trainNo: '0111', departureTime: '10:00', arrivalTime: '11:52', standardSeat: 'X', businessSeat: 'X' },
  { trainNo: '0113', departureTime: '12:00', arrivalTime: '13:52', standardSeat: 'O', businessSeat: null },
  { trainNo: '0115', departureTime: '14:00', arrivalTime: '15:52', standardSeat: 'O', businessSeat: 'O' },
]

/** Mock for /api/tdx/timetable-by-train — keyed by trainNo string.
 *  Train 0101 is southbound (南港→左營), full 12-stop sequence.
 *  Train 0102 is northbound (左營→南港), full 12-stop sequence.
 *  Unknown train numbers return [] (empty array, not an error).
 */
export const MOCK_TIMETABLE_BY_TRAIN: Record<string, TdxTrainStop[]> = {
  '0101': [
    { sequence: 1,  stationId: '1',  stationName: '南港', arrivalTime: '',      departureTime: '06:00' },
    { sequence: 2,  stationId: '2',  stationName: '台北', arrivalTime: '06:06', departureTime: '06:07' },
    { sequence: 3,  stationId: '3',  stationName: '板橋', arrivalTime: '06:13', departureTime: '06:14' },
    { sequence: 4,  stationId: '4',  stationName: '桃園', arrivalTime: '06:27', departureTime: '06:28' },
    { sequence: 5,  stationId: '5',  stationName: '新竹', arrivalTime: '06:43', departureTime: '06:44' },
    { sequence: 6,  stationId: '6',  stationName: '苗栗', arrivalTime: '06:58', departureTime: '06:59' },
    { sequence: 7,  stationId: '7',  stationName: '台中', arrivalTime: '07:09', departureTime: '07:10' },
    { sequence: 8,  stationId: '8',  stationName: '彰化', arrivalTime: '07:20', departureTime: '07:21' },
    { sequence: 9,  stationId: '9',  stationName: '雲林', arrivalTime: '07:32', departureTime: '07:33' },
    { sequence: 10, stationId: '10', stationName: '嘉義', arrivalTime: '07:43', departureTime: '07:44' },
    { sequence: 11, stationId: '11', stationName: '台南', arrivalTime: '07:53', departureTime: '07:54' },
    { sequence: 12, stationId: '12', stationName: '左營', arrivalTime: '07:57', departureTime: '' },
  ],
  '0102': [
    { sequence: 1,  stationId: '12', stationName: '左營', arrivalTime: '',      departureTime: '06:30' },
    { sequence: 2,  stationId: '11', stationName: '台南', arrivalTime: '06:34', departureTime: '06:35' },
    { sequence: 3,  stationId: '10', stationName: '嘉義', arrivalTime: '06:44', departureTime: '06:45' },
    { sequence: 4,  stationId: '9',  stationName: '雲林', arrivalTime: '06:55', departureTime: '06:56' },
    { sequence: 5,  stationId: '8',  stationName: '彰化', arrivalTime: '07:07', departureTime: '07:08' },
    { sequence: 6,  stationId: '7',  stationName: '台中', arrivalTime: '07:18', departureTime: '07:19' },
    { sequence: 7,  stationId: '6',  stationName: '苗栗', arrivalTime: '07:29', departureTime: '07:30' },
    { sequence: 8,  stationId: '5',  stationName: '新竹', arrivalTime: '07:44', departureTime: '07:45' },
    { sequence: 9,  stationId: '4',  stationName: '桃園', arrivalTime: '08:00', departureTime: '08:01' },
    { sequence: 10, stationId: '3',  stationName: '板橋', arrivalTime: '08:14', departureTime: '08:15' },
    { sequence: 11, stationId: '2',  stationName: '台北', arrivalTime: '08:21', departureTime: '08:22' },
    { sequence: 12, stationId: '1',  stationName: '南港', arrivalTime: '08:28', departureTime: '' },
  ],
  '0115': [
    { sequence: 1,  stationId: '1',  stationName: '南港', arrivalTime: '',      departureTime: '14:00' },
    { sequence: 2,  stationId: '2',  stationName: '台北', arrivalTime: '14:06', departureTime: '14:07' },
    { sequence: 3,  stationId: '3',  stationName: '板橋', arrivalTime: '14:13', departureTime: '14:14' },
    { sequence: 4,  stationId: '7',  stationName: '台中', arrivalTime: '14:49', departureTime: '14:50' },
    { sequence: 5,  stationId: '11', stationName: '台南', arrivalTime: '15:19', departureTime: '15:20' },
    { sequence: 6,  stationId: '12', stationName: '左營', arrivalTime: '15:46', departureTime: '' },
  ],
}

/** Mock for /api/tdx/seat-status — pre-split into northbound/southbound.
 *  Used when stationId is any value in mock mode.
 */
export const MOCK_SEAT_STATUS_BY_STATION: TdxStationSeatStatus = {
  northbound: [
    {
      TrainNo: '0102', Direction: 1, StartingStationID: '12', EndingStationID: '1',
      StopStations: [
        { StopSequence: 1, StationID: '2', StationName: { Zh_tw: '台北', En: 'Taipei' }, NextStationID: '1', StandardSeatStatus: 'O', BusinessSeatStatus: 'O' },
      ],
    },
    {
      TrainNo: '0104', Direction: 1, StartingStationID: '12', EndingStationID: '1',
      StopStations: [
        { StopSequence: 1, StationID: '2', StationName: { Zh_tw: '台北', En: 'Taipei' }, NextStationID: '1', StandardSeatStatus: 'L', BusinessSeatStatus: 'O' },
      ],
    },
  ],
  southbound: [
    {
      TrainNo: '0101', Direction: 0, StartingStationID: '1', EndingStationID: '12',
      StopStations: [
        { StopSequence: 1, StationID: '2', StationName: { Zh_tw: '台北', En: 'Taipei' }, NextStationID: '3', StandardSeatStatus: 'L', BusinessSeatStatus: 'O' },
      ],
    },
    {
      TrainNo: '0103', Direction: 0, StartingStationID: '1', EndingStationID: '12',
      StopStations: [
        { StopSequence: 1, StationID: '2', StationName: { Zh_tw: '台北', En: 'Taipei' }, NextStationID: '3', StandardSeatStatus: 'X', BusinessSeatStatus: 'L' },
      ],
    },
  ],
}
