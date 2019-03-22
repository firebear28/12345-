// import {request} from '@/utils/req'
import request from '@/utils/request'
// import qs from 'qs'

// export function loginByUsername(username, password) {
//   const data = {
//     userAccount: username,
//     userPwd: password,
//     type: 'account'
//   }
//   return request({
//     url: '/admin/user/sysUser/login',
//     method: 'post',
//     data: qs.stringify(data)
//   })
// }

export function loginByUsername(username, password) {
  const data = {
    username,
    password
  }
  return request({
    url: '/login/login',
    method: 'post',
    data
  })
}

export function logout() {
  return request({
    url: '/login/logout',
    method: 'post'
  })
}

export function getUserInfo(token) {
  return request({
    url: '/user/info',
    method: 'get',
    params: { token }
  })
}

