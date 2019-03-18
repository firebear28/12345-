import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/views/layout/Layout'

/* Router Modules */
import componentsRouter from './modules/components'
import chartsRouter from './modules/charts'
import tableRouter from './modules/table'
import treeTableRouter from './modules/tree-table'
import nestedRouter from './modules/nested'

/** note: sub-menu only appear when children.length>=1
 *  detail see  https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 **/

/**
* hidden: true                   if `hidden:true` will not show in the sidebar(default is false)
* alwaysShow: true               if set true, will always show the root menu, whatever its child routes length
*                                if not set alwaysShow, only more than one route under the children
*                                it will becomes nested mode, otherwise not show the root menu
* redirect: noredirect           if `redirect:noredirect` will no redirect in the breadcrumb
* name:'router-name'             the name is used by <keep-alive> (must set!!!)
* meta : {
    roles: ['admin','editor']    will control the page roles (you can set multiple roles)
    title: 'title'               the name show in sub-menu and breadcrumb (recommend set)
    icon: 'svg-name'             the icon show in the sidebar
    noCache: true                if true, the page will no be cached(default is false)
    breadcrumb: false            if false, the item will hidden in breadcrumb(default is true)
    affix: true                  if true, the tag will affix in the tags-view
  }
**/
export const constantRouterMap = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path*',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/authredirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/errorPage/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/errorPage/401'),
    hidden: true
  },
  // 首页
  {
    path: '',
    component: Layout,
    redirect: 'dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index'),
        name: 'Dashboard',
        meta: { title: 'dashboard', icon: 'dashboard', noCache: true, affix: true }
      }
    ]
  },
  // 文档
  // {
  //   path: '/documentation',
  //   component: Layout,
  //   redirect: '/documentation/index',
  //   children: [
  //     {
  //       path: 'index',
  //       component: () => import('@/views/documentation/index'),
  //       name: 'Documentation',
  //       meta: { title: 'documentation', icon: 'documentation', affix: true }
  //     }
  //   ]
  // },
  // 城市管理
  {
    path: '/city',
    component: Layout,
    redirect: '/city/index',
    children: [
      {
        path: 'index',
        component: () => import('@/pages/city/index'),
        name: 'city',
        meta: { title: '城市管理', icon: 'guide', noCache: true }
      }
    ]
  },
  // 行政效能
  {
    path: '/admn',
    component: Layout,
    redirect: '/admn/index',
    children: [
      {
        path: 'index',
        component: () => import('@/pages/admn/index'),
        name: 'admn',
        meta: { title: '行政效能', icon: 'guide', noCache: true }
      }
    ]
  },
  // 环境保护
  {
    path: '/guide',
    component: Layout,
    redirect: '/envr/index',
    children: [
      {
        path: 'index',
        component: () => import('@/pages/envr/index'),
        name: 'envr',
        meta: { title: '环境保护', icon: 'guide', noCache: true }
      }
    ]
  },
  // 部门管理
  {
    path: '/depa',
    component: Layout,
    redirect: '/depa/index',
    children: [
      {
        path: 'index',
        component: () => import('@/pages/depa/index'),
        name: 'depa',
        meta: { title: '部门管理', icon: 'guide', noCache: true }
      }
    ]
  },
  // 账号管理
  {
    path: '/account',
    component: Layout,
    redirect: '/account/index',
    children: [
      {
        path: 'index',
        component: () => import('@/pages/account/index'),
        name: 'account',
        meta: { title: '账号管理', icon: 'guide', noCache: true }
      }
    ]
  },
  // 镇街管理
  {
    path: '/street',
    component: Layout,
    redirect: '/street/index',
    children: [
      {
        path: 'index',
        component: () => import('@/pages/street/index'),
        name: 'street',
        meta: { title: '镇街管理', icon: 'guide', noCache: true }
      }
    ]
  },
  // 服务提供管控日志
  {
    path: '/service',
    component: Layout,
    redirect: '/service/index',
    children: [
      {
        path: 'index',
        component: () => import('@/pages/service/index'),
        name: 'service',
        meta: { title: '服务提供管控日志', icon: 'guide', noCache: true }
      }
    ]
  },
  // 事项管理
  {
    path: '/matter',
    component: Layout,
    redirect: '/matter/index',
    children: [
      {
        path: 'index',
        component: () => import('@/pages/matter/index'),
        name: 'matter',
        meta: { title: '事项管理', icon: 'guide', noCache: true }
      }
    ]
  },
  // 舆情分析配置
  {
    path: '/public',
    component: Layout,
    redirect: '/public/index',
    children: [
      {
        path: 'index',
        component: () => import('@/pages/public/index'),
        name: 'public',
        meta: { title: '舆情分析配置', icon: 'guide', noCache: true }
      }
    ]
  }
]

export default new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRouterMap
})

export const asyncRouterMap = [
  /** When your routing table is too long, you can split it into small modules**/
]

