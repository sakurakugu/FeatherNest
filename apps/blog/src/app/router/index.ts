import { createRouter, createWebHistory } from 'vue-router'
import { 使用设置存储 } from '../../shared/stores/settings'
import { blogRoutes } from './blog.routes'
import { dashboardRoutes } from '../../../../console/src/app/router/dashboard.routes'
import { consoleModules } from '../../../../console/src/app/modules'
import { 注册路由守卫 } from '../../../../console/src/app/router/guards'
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { ...blogRoutes[0]!, path: '/', name: 'BlogRoot' },
    ...blogRoutes,
    {
      path: '/admin/login',
      name: 'Login',
      component: () => import('../../../../console/src/app/pages/登录页面.vue'),
      meta: { guestOnly: true },
    },
    ...consoleModules.flatMap((module) => module.standaloneRoutes ?? []),
    ...dashboardRoutes,
    { path: '/:pathMatch(.*)*', component: () => import('../pages/未找到页面.vue') },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 80 }
    if (to.path !== from.path) return { top: 0 }
  },
})
注册路由守卫(router)
router.beforeEach(async (to) => {
  if (to.name === 'BlogGuestbook') {
    const settings = 使用设置存储()
    await settings.ensurePublicSettingsLoaded()
    if (settings.commentsHidden) return { name: 'BlogAbout' }
  }
})
export default router
