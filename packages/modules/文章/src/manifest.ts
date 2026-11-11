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
      redirect: (to) => ({
        path: to.path.slice(0, to.path.indexOf('/articles')) + '/articles',
        query: { ...to.query, edit: String(to.params.id || 'new') },
      }),
    },
  ],
  navigation: [{ routeName: 'DashboardArticles', label: '文章管理', icon: Document, order: 10 }],
} satisfies AppModule
