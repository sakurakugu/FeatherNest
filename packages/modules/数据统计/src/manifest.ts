import type { AppModule } from '@feathernest/app-core'
import { DataAnalysis } from '@element-plus/icons-vue'

export default {
  id: '数据统计',
  routes: [
    {
      path: 'stats/other',
      name: 'DashboardDataStats',
      component: () => import('@feathernest/module-stats').then((module) => module.DataStatsPage),
      meta: { title: '数据统计' },
    },
  ],
  navigation: [
    {
      routeName: 'DashboardDataStats',
      label: '数据统计',
      icon: DataAnalysis,
      order: 7,
      dividerBefore: true,
    },
  ],
} satisfies AppModule
