import type { AppModule } from '@feathernest/app-core'
import { Document } from '@element-plus/icons-vue'

export default {
  id: '博客',
  routes: [
    {
      path: 'blog',
      name: 'DashboardBlogManage',
      component: () => import('@feathernest/module-blog').then((module) => module.BlogManagePage),
      meta: { title: '博客管理' },
    },
  ],
  navigation: [{ routeName: 'DashboardBlogManage', label: '博客管理', icon: Document, order: 0 }],
} satisfies AppModule
