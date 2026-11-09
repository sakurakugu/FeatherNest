import type { RouteRecordRaw } from 'vue-router'
import type { Component } from 'vue'

export interface AppModule {
  id: string
  routes?: RouteRecordRaw[]
  standaloneRoutes?: RouteRecordRaw[]
  navigation?: {
    routeName: string
    label: string
    icon: Component
    order: number
    dividerBefore?: boolean
  }[]
}

export function 收集模块路由(modules: readonly AppModule[]): RouteRecordRaw[] {
  return modules.flatMap((module) => module.routes ?? [])
}
