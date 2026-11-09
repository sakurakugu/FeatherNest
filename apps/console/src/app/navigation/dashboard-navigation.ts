import type { 控制台菜单项 } from '../components/layout/ConsoleLayout'
import { consoleModules } from '../modules'
import router from '../router'

export function 过滤仪表盘菜单项(): 控制台菜单项[] {
  return consoleModules
    .flatMap((module) => module.navigation ?? [])
    .sort((left, right) => left.order - right.order)
    .map(({ routeName, label, icon, dividerBefore }) => ({
      label,
      icon,
      dividerBefore,
      key: router.resolve({ name: routeName }).path,
    }))
}
