import { 收集模块路由 } from '@feathernest/app-core'
import type { RouteRecordRaw } from 'vue-router'
import { consoleModules } from '../modules'

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: 'Dashboard',
    component: () => import('../layouts/控制台布局.vue'),
    meta: { requiresAuth: true, consoleView: true },
    redirect: '/admin/stats/blog',
    children: 收集模块路由(consoleModules),
  },
]
