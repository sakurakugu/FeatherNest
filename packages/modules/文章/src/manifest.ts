import type { AppModule } from '@feathernest/app-core'
import { Document } from '@element-plus/icons-vue'

export default {
  id: '文章',
  routes: [
    {
      path: 'articles',
      name: 'DashboardArticles',
      component: () => import('@feathernest/module-articles').then((module) => module.ArticlesPage),
      meta: { title: '文章管理' },
    },
    {
      path: 'articles/edit/:id?',
      name: 'ArticleEditor',
      component: () =>
        import('@feathernest/module-articles').then((module) => module.ArticleEditorPage),
      meta: { title: '文章编辑' },
    },
  ],
  navigation: [{ routeName: 'DashboardArticles', label: '文章管理', icon: Document, order: 10 }],
} satisfies AppModule
