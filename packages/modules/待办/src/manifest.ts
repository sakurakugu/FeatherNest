import type { AppModule } from '@feathernest/app-core'
import { Checked } from '@element-plus/icons-vue'

export default {
  id: '待办',
  routes: [
    {
      path: 'todos',
      name: 'DashboardTodos',
      component: () => import('@feathernest/module-todos').then((module) => module.TodosPage),
      meta: { title: '待办事项', searchPlaceholder: '搜索待办', searchTarget: 'current' },
    },
  ],
  navigation: [{ routeName: 'DashboardTodos', label: '待办事项', icon: Checked, order: 9 }],
} satisfies AppModule
