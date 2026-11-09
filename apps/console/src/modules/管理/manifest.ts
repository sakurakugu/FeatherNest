import type { AppModule } from '@feathernest/app-core'
import { Bell, ChatDotRound, DataAnalysis, Link, Monitor, Setting } from '@element-plus/icons-vue'

export default {
  id: '管理',
  routes: [
    {
      path: 'stats/blog',
      name: 'DashboardBlogStats',
      component: () => import('../系统/dashboard/pages/博客统计页面.vue'),
      meta: { title: '博客统计' },
    },
    {
      path: 'system',
      name: 'SystemStatus',
      component: () => import('../管理/dashboard/pages/系统页面.vue'),
      meta: { title: '系统状态' },
    },
    {
      path: 'settings',
      name: 'DashboardSettings',
      component: () => import('../管理/dashboard/pages/设置页面.vue'),
      meta: { title: '系统设置' },
    },
    {
      path: 'announcements',
      name: 'AnnouncementsManage',
      component: () => import('../管理/dashboard/pages/公告管理页面.vue'),
      meta: { title: '公告管理' },
    },
    {
      path: 'friend-links',
      name: 'FriendLinksManage',
      component: () => import('../友链/dashboard/pages/友链管理页面.vue'),
      meta: { title: '友链管理' },
    },
    {
      path: 'ai',
      name: 'AIManage',
      component: () => import('../管理/dashboard/pages/AI管理页面.vue'),
      meta: { title: 'AI 管理' },
    },
    {
      path: 'twikoo',
      name: 'TwikooManage',
      component: () => import('../管理/dashboard/pages/评论管理页面.vue'),
      meta: { title: '评论管理' },
    },
  ],
  navigation: [
    { routeName: 'DashboardBlogStats', label: '博客统计', icon: DataAnalysis, order: 1 },
    { routeName: 'SystemStatus', label: '系统状态', icon: Monitor, order: 17 },
    { routeName: 'DashboardSettings', label: '系统设置', icon: Setting, order: 6 },
    { routeName: 'AnnouncementsManage', label: '公告管理', icon: Bell, order: 5 },
    { routeName: 'FriendLinksManage', label: '友链管理', icon: Link, order: 3 },
    { routeName: 'AIManage', label: 'AI 管理', icon: ChatDotRound, order: 16 },
    { routeName: 'TwikooManage', label: '评论管理', icon: ChatDotRound, order: 4 },
  ],
} satisfies AppModule
