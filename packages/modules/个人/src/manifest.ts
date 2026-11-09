import type { AppModule } from '@feathernest/app-core'
import { User } from '@element-plus/icons-vue'

export default {
  id: '个人',
  routes: [
    {
      path: 'profile',
      name: 'DashboardProfile',
      component: () => import('@feathernest/module-profile').then((module) => module.ProfilePage),
      meta: { title: '个人资料' },
      props: {
        sessionEndRedirect: { name: 'Login' },
      },
    },
  ],
  navigation: [{ routeName: 'DashboardProfile', label: '个人资料', icon: User, order: 15 }],
} satisfies AppModule
