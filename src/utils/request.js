import axios from 'axios'
import { Message } from 'element-ui'
const baseURL = 'https://ptx.transportdata.tw/MOTC/v2/Rail/THSR'

const service = axios.create({
  baseURL: baseURL,
  timeout: 5000 // request timeout
})

service.interceptors.request.use(
  config => {
    return config
  },
  error => {
    console.warn(error) // for debug
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    const res = response.data
    if (response.status !== 200) {
      Message({
        message: res.message || 'Error',
        type: 'error',
        duration: 5000
      })
      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      return response.data
    }
  },
  error => {
    console.warn('err' + error) // for debug
    Message({
      message: error.message,
      type: 'error',
      duration: 5000
    })
    return Promise.reject(error)
  }
)

export default service
