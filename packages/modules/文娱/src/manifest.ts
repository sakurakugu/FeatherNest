import type { AppModule } from '@feathernest/app-core'
import { VideoPlay } from '@element-plus/icons-vue'

export default {
  id: '文娱',
  routes: [
    {
      path: 'media',
      name: 'DashboardMedia',
      component: () => import('@feathernest/module-media').then((module) => module.MediaPage),
      meta: { title: '作品推荐', searchPlaceholder: '搜索文娱作品', searchTarget: 'current' },
    },
  ],
  navigation: [{ routeName: 'DashboardMedia', label: '作品推荐', icon: VideoPlay, order: 2 }],
} satisfies AppModule
