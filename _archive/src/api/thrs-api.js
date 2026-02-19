import request from '@/utils/request'

export function getStations() {
  return request({
    url: '/Station',
    method: 'get'
  })
}

export function getDailyTimetable({OriginStationID, DestinationStationID, TrainDate}) {
  return request({
    url: `/DailyTimetable/OD/${OriginStationID}/to/${DestinationStationID}/${TrainDate}`,
    method: 'get'
  })
}

export function getGeneralTimetable() {
  return request({
    url: `/GeneralTimetable?top=300`,
    method: 'get'
  })
}

export function getGeneralTimetablebyTrainNo(TrainNo) {
  return request({
    url: `/GeneralTimetable/TrainNo/${TrainNo}?top=1`,
    method: 'get'
  })
}

export function getAvailableSeatStatusList(StationID) {
  return request({
    url: `/AvailableSeatStatusList/${StationID}`,
    method: 'get'
  })
}
