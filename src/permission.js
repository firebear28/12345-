import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css'// progress bar style
import { getToken } from '@/utils/auth' // getToken from cookie

NProgress.configure({ showSpinner: false })// NProgress Configuration

router.beforeEach((to, from, next) => {
  NProgress.start()
  if (to.path === '/login') {
    next()
    NProgress.done() 
  } else if (getToken()) { // determine if there has token
    store.dispatch('GenerateRoutes', { roles: store.getters.roles }).then(() => { // 根据roles权限生成可访问的路由表
      router.addRoutes(store.getters.addRouters) // 动态添加可访问路由表
      // 设置用户信息（暂时写死的）
      store.dispatch('GetUserInfo').then(_ => {
        next()
      })

    })
  } else {
    Message('请登陆！')
    next(`/login?redirect=${to.path}`) // 否则全部重定向到登录页
    NProgress.done()
  }
})

router.afterEach(() => {
  NProgress.done() // finish progress bar
})
