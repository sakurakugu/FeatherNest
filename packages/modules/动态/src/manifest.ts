import type { AppModule } from '@feathernest/app-core'
import { ChatDotRound } from '@element-plus/icons-vue'

export default {
  id: '动态',
  routes: [
    {
      path: 'moments',
      name: 'DashboardMoments',
      component: () => import('@feathernest/module-moments').then((module) => module.MomentsPage),
      meta: { title: '动态管理' },
    },
  ],
  navigation: [{ routeName: 'DashboardMoments', label: '动态管理', icon: ChatDotRound, order: 8 }],
} satisfies AppModule
