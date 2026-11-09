import type { AppModule } from '@feathernest/app-core'
import { Folder } from '@element-plus/icons-vue'

export default {
  id: '文件',
  routes: [
    {
      path: 'files',
      name: 'DashboardFiles',
      component: () => import('@feathernest/module-files').then((module) => module.FilesPage),
      meta: { title: '文件管理', searchPlaceholder: '搜索文件', searchTarget: 'current' },
    },
  ],
  navigation: [{ routeName: 'DashboardFiles', label: '文件管理', icon: Folder, order: 12 }],
} satisfies AppModule
