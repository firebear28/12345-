import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'
const UserAgent = 'Admin-UserAgent'

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}

export function getUserAgent() {
  return Cookies.get(UserAgent)
}

export function setUserAgent(userAgent) {
  return Cookies.set(UserAgent, userAgent)
}

export function removeUserAgent() {
  return Cookies.remove(UserAgent)
}