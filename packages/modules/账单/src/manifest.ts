import type { AppModule } from '@feathernest/app-core'
import { CreditCard } from '@element-plus/icons-vue'

export default {
  id: '账单',
  routes: [
    {
      path: 'bills',
      name: 'DashboardBills',
      component: () => import('@feathernest/module-bills').then((module) => module.BillsPage),
      meta: { title: '账单管理', searchPlaceholder: '搜索账单', searchTarget: 'current' },
    },
  ],
  navigation: [{ routeName: 'DashboardBills', label: '账单管理', icon: CreditCard, order: 13 }],
} satisfies AppModule
