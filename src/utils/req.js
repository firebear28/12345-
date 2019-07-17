import axios from 'axios'
// import store from '../store'
import { getToken, getUserAgent } from '@/utils/auth' // getToken from cookie

// 请求队列
let pending = []

// 获取纯Url，不包含?后面的参数
const getPureUrl = (url, start = 0) => {
  const index = url.indexOf('?')
  const pureUrl = url.substr(0, ~index ? index : url.length)
  return pureUrl.substr(start)
}

// 函数节流，3秒之内只会执行一次。不会重复执行。
// leading 为 true时，第一次执行立即触发，这比setTimeout好多了
// trailing 为 fasle时，不会触发最后一次。这样比较符合直觉。
// const _tokenError = throttle(tokenError, 3000, { leading: true, trailing: false })

// 添加请求拦截器，动态设置参数
axios.interceptors.request.use(config => {
  // 合并请求头 authority-token
  // config.headers = Object.assign({}, config.headers, { 'tokenid': getToken() })
  // config.headers = Object.assign({}, config.headers, { 'userAgent': getUserAgent() })

  // 中文转为decode编码
  config.url = encodeURI(config.url)

  // 设置公共URL http://12345v2.alltosea.com:6080/api
  config.baseURL = process.env.NODE_ENV === 'development' ? 'http://12345v2.alltosea.com:6080/api' : '/api'

  // 设置公共GET参数(由于本项目的后端接口只有GET请求,所以只需要处理GET请求即可，如果需要POST则设置data参数)
  // config.params = { tokenid: getToken(), userAgent: getUserAgent() }

  // 获取纯Url（不包含?后面的参数）(也不包含baseURL的前缀)
  const pureUrl = getPureUrl(config.url)

  // 如果需要去重复（默认noRepeat为 'on'，即开启去重复），则中止队列中所有相同请求地址的xhr
  config.noRepeat === 'on' && pending.forEach(_ => _.url === pureUrl && _.cancel('repeat abort' + pureUrl))

  // 配置 CancelToken
  config.cancelToken = new axios.CancelToken(cancel => {
    // 移除所有中止的请求，并且将新的请求推入缓存
    pending = [...pending.filter(_ => _.url != pureUrl), { url: pureUrl, cancel }]
  })

  // 返回最终配置
  return config
})

// 响应拦截器
axios.interceptors.response.use(res => {
  // 成功响应之后清空队列中所有相同Url的请求
  pending = pending.filter(_ => _.url != getPureUrl(res.config.url, res.config.baseURL.length))
  // 返回 response
  return res
}, error => {
  return Promise.reject(error)
})

// 检查状态码
const checkStatus = (response) => {
  // 判断请求状态
  if (response.status >= 200 && response.status < 300) {
    // 返回Promise
    return response.data
  } else {
    // 服务器响应异常
    throw new Error(response.statusText)
  }
}

// 公共请求
export const request = (url, options = {}) => {
  // 正式开始请求
  return axios(url, options).then(checkStatus)
}
// post请求
export const post = (url, options = {}) => {
  // 正式开始post请求
  return axios.post(url, options).then(checkStatus)
}
// put请求
export const put = (url, options = {}) => {
  // 正式开始post请求
  return axios.put(url, options).then(checkStatus)
}
// delete请求
export const reqDelete = (url, options = {}) => {
  // 正式开始delete请求
  return axios.delete(url, options).then(checkStatus)
}
