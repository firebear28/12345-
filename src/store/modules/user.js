import { logout, getUserInfo } from '@/api/login'
import { getToken, setToken, removeToken, getUserAgent, setUserAgent, removeUserAgent } from '@/utils/auth'
import qs from 'qs'
import { request } from '@/utils/req.js'
import { Message } from 'element-ui'

const user = {
  state: {
    user: '',
    status: '',
    code: '',
    token: getToken(),
    userAgent: getUserAgent(),
    name: '',
    avatar: '',
    introduction: '',
    roles: [],
    setting: {
      articlePlatform: []
    }
  },

  mutations: {
    SET_CODE: (state, code) => {
      state.code = code
    },
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_USERAGENT: (state, userAgent) => {
      state.userAgent = userAgent
    },
    SET_INTRODUCTION: (state, introduction) => {
      state.introduction = introduction
    },
    SET_SETTING: (state, setting) => {
      state.setting = setting
    },
    SET_STATUS: (state, status) => {
      state.status = status
    },
    SET_NAME: (state, name) => {
      state.name = name
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles
    }
  },

  actions: {
    // 用户名登录
    LoginByUsername({ state, commit, dispatch }, userInfo) {
      const username = userInfo.username.trim()
      return request('/admin/user/sysUser/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        data: qs.stringify({ userAccount: username, userPwd: userInfo.password, type: 'account' })
      }).then(data => {
        if (data.code === 200) {
          state.token = data.user.tokenId
          commit('SET_TOKEN', data.user.tokenId)
          commit('SET_USERAGENT', data.user.userAgent)
          dispatch('GetUserInfo')
          setToken(data.user.tokenId)
          setUserAgent(data.user.userAgent)
        } else {
          Message.error('登陆失败：' + data.message)
        }
      }).catch(error => {
        Message.error('登陆失败')
        console.log('error submit!!')
      })
    },

    // 获取用户信息
    GetUserInfo({ commit, state }) {
      commit('SET_ROLES', ['admin'])
      commit('SET_NAME', 'Super Admin')
      commit('SET_AVATAR', 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif')
      commit('SET_INTRODUCTION', '我是超级管理员')
    },

    // 第三方验证登录
    // LoginByThirdparty({ commit, state }, code) {
    //   return new Promise((resolve, reject) => {
    //     commit('SET_CODE', code)
    //     loginByThirdparty(state.status, state.email, state.code).then(response => {
    //       commit('SET_TOKEN', response.data.token)
    //       setToken(response.data.token)
    //       resolve()
    //     }).catch(error => {
    //       reject(error)
    //     })
    //   })
    // },

    // 登出
    LogOut({ commit, state }) {
      return new Promise((resolve, reject) => {
        logout(state.token).then(() => {
          commit('SET_TOKEN', '')
          commit('SET_ROLES', [])
          removeToken()
          removeUserAgent()
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 前端 登出
    FedLogOut({ commit }) {
      return new Promise(resolve => {
        commit('SET_TOKEN', '')
        removeToken()
        resolve()
      })
    },

    // 动态修改权限
    ChangeRoles({ commit, dispatch }, role) {
      return new Promise(resolve => {
        commit('SET_TOKEN', role)
        setToken(role)
        getUserInfo(role).then(response => {
          const data = response.data
          commit('SET_ROLES', data.roles)
          commit('SET_NAME', data.name)
          commit('SET_AVATAR', data.avatar)
          commit('SET_INTRODUCTION', data.introduction)
          dispatch('GenerateRoutes', data) // 动态修改权限后 重绘侧边菜单
          resolve()
        })
      })
    }
  }
}

export default user
