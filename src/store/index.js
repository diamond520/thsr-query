import Vue from 'vue'
import Vuex from 'vuex'
import { getStations } from '@/api/thrs-api'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    stations: []
  },
  mutations: {
    setStations (state, data) {
      state.stations = data
    }
  },
  actions: {
    async getStations ({commit}) {
      const res = await getStations()
      commit('setStations', res)
    }
  },
  getters: {
    stations: state => state.stations.map(station => ({
      text: station.StationName.Zh_tw,
      id: station.StationID
    }))
  },
  modules: {
  }
})
