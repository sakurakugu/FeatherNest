import { 注册标准认证守卫 } from '@feathernest/app-core'
import { 使用认证存储 } from '@feathernest/domain/auth'
import { 使用设置存储 } from '../../shared/stores/settings'
import type { Router } from 'vue-router'

export function 注册路由守卫(router: Router): void {
  router.beforeEach(async (to) => {
    if (to.path === '/admin/tools' || to.path.startsWith('/admin/tools/')) {
      const settings = 使用设置存储()
      await settings.ensurePublicSettingsLoaded()
      if (!settings.toolsEnabled) {
        return { path: '/blog' }
      }
    }
  })
  注册标准认证守卫(router, () => 使用认证存储(), {
    loginRouteName: 'Login',
    authenticatedRouteName: 'DashboardBlogStats',
    loginQueryFactory: (to) => ({ redirect: to.fullPath }),
  })
}
