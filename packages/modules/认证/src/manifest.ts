import type { AppModule } from '@feathernest/app-core'
import { User } from '@element-plus/icons-vue'

export default {
  id: '认证',
  routes: [
    {
      path: 'account',
      name: 'DashboardAccount',
      component: () =>
        import('@feathernest/module-auth').then((module) => module.AccountSecurityPage),
      meta: { title: '账号与安全' },
      props: {
        sessionEndRedirect: { name: 'Login' },
      },
    },
  ],
  navigation: [{ routeName: 'DashboardAccount', label: '账号与安全', icon: User, order: 14 }],
} satisfies AppModule
