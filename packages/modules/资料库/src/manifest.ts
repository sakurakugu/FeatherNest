import type { AppModule } from '@feathernest/app-core'
import { Collection } from '@element-plus/icons-vue'

export default {
  id: '资料库',
  routes: [
    {
      path: 'materials',
      name: 'DashboardCollections',
      component: () =>
        import('@feathernest/module-materials').then((module) => module.MaterialsPage),
      meta: { title: '资料库', searchPlaceholder: '搜索资料', searchTarget: 'current' },
    },
  ],
  navigation: [{ routeName: 'DashboardCollections', label: '资料库', icon: Collection, order: 11 }],
} satisfies AppModule
