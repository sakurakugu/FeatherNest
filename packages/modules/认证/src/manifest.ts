import type { AppModule } from '@feathernest/app-core'
import { Monitor } from '@element-plus/icons-vue'

export default {
  id: '认证',
  routes: [
    {
      path: 'device-sessions',
      name: 'DashboardDeviceSessions',
      component: () =>
        import('@feathernest/module-auth').then((module) => module.DeviceSessionsPage),
      meta: { title: '登录设备' },
    },
  ],
  navigation: [
    { routeName: 'DashboardDeviceSessions', label: '登录设备', icon: Monitor, order: 14 },
  ],
} satisfies AppModule
