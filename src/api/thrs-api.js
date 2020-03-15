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
