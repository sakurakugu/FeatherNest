import type { AppModule } from '@feathernest/app-core'

export default {
  id: '工具',
  standaloneRoutes: [
    {
      path: '/admin/tools',
      component: () => import('../../app/layouts/工具布局.vue'),
      meta: { consoleView: true },
      children: [
        {
          path: '',
          name: 'ToolsPage',
          component: () => import('./src').then((module) => module.ToolsPage),
        },
        {
          path: 'image',
          name: 'ImageToolsPage',
          component: () => import('./src').then((module) => module.ImageToolsPage),
        },
        {
          path: 'transfer',
          name: 'FileTransferPage',
          meta: { requiresAuth: true },
          component: () => import('./src').then((module) => module.FileTransferPage),
        },
      ],
    },
    {
      path: '/admin/tools/image-editor',
      redirect: '/admin/tools/image',
    },
  ],
} satisfies AppModule
