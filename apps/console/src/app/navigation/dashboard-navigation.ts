import type { 控制台菜单项 } from '../components/layout/ConsoleLayout'
import 博客管理图标 from '../components/layout/博客管理图标.vue'
import { consoleModules } from '../modules'
import router from '../router'

const 导航图标路径: Record<string, string> = {
  DashboardArticles:
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h5',
  DashboardTodos: 'M9 5h11M9 12h11M9 19h11M3 5l1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2',
  DashboardFiles: 'M3 7V5h6l2 2h10v13H3ZM3 10h18',
  DashboardCollections: 'M4 3h5v18H4ZM9 3h5v18H9ZM15 4l4-1 4 17-4 1Z',
  DashboardBills: 'M3 5h18v14H3ZM3 9h18M15 15h3',
  DashboardMoments: 'M21 11a9 8 0 0 1-9 8H7l-4 3V7a9 8 0 0 1 18 4ZM8 10h8M8 14h5',
  DashboardMedia: 'M3 4h18v16H3ZM10 8l6 4-6 4Z',
  DashboardAccount: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  DashboardDataStats: 'M4 3v17h17M7 14l4-4 4 2 6-7',
  SystemStatus: 'M3 4h18v13H3ZM8 21h8M12 17v4M6 11h3l2-4 3 7 2-3h2',
  AnnouncementsManage: 'M6 9a6 6 0 0 1 12 0v5l2 3H4l2-3ZM10 21h4M12 1v2',
  FriendLinksManage:
    'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2',
  AIManage: 'M4 6h16v13H4ZM8 10v2M16 10v2M9 16h6M12 3v3M2 10v5M22 10v5',
  PushManage: 'M22 2 9 15M22 2l-7 20-6-7-7-6Z',
  TwikooManage: 'M4 5.5h16v11H9l-5 4z',
}

export function 过滤仪表盘菜单项(): 控制台菜单项[] {
  return consoleModules
    .flatMap((module) => module.navigation ?? [])
    .sort((left, right) => left.order - right.order)
    .map(({ routeName, label, icon, dividerBefore }) => ({
      label,
      icon: routeName === 'DashboardBlogManage' ? 博客管理图标 : icon,
      iconPath: 导航图标路径[routeName],
      dividerBefore,
      key: router.resolve({ name: routeName }).path,
    }))
}
