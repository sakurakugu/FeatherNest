<script setup lang="ts">
import { ConsoleSidebarLayout } from '@feathernest/ui'
import type { 控制台菜单项 } from './ConsoleLayout'

defineProps<{
  title: string
  storageKey: string
  menuItems: 控制台菜单项[]
}>()
</script>

<template>
  <ConsoleSidebarLayout
    :title="title"
    :storage-key="storageKey"
    :menu-items="menuItems"
    layout-class="console-layout"
    sider-class="console-sider"
    main-base-class="console-main"
  >
    <template #title-icon>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="8" height="7" rx="1" />
        <rect x="13" y="4" width="8" height="7" rx="1" />
        <rect x="3" y="13" width="8" height="7" rx="1" />
        <rect x="13" y="13" width="8" height="7" rx="1" />
      </svg>
    </template>
    <slot />
  </ConsoleSidebarLayout>
</template>

<style scoped>
.console-layout {
  height: calc(var(--app-viewport-height) - var(--app-header-height));
  font-family:
    'PingFang SC',
    'HarmonyOS Sans SC',
    'Microsoft YaHei',
    'Noto Sans SC',
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.console-main {
  --dashboard-panel-radius: 12px;
}

.console-main :deep(> *) {
  border-radius: var(--dashboard-panel-radius);
  overflow: hidden;
}

.dark .console-sider {
  background-color: var(--sidebar-bg) !important;
  border-right-color: var(--border-color) !important;
}

.dark .console-sider :deep(.ps-console-sider__title) {
  color: var(--text-primary);
}

.dark .console-sider :deep(.ps-sidebar-handle__trigger:hover) {
  background-color: var(--bg-hover) !important;
}

.dark .console-sider.is-hidden :deep(.ps-sidebar-handle__trigger) {
  background-color: color-mix(in srgb, var(--sidebar-bg) 88%, #ffffff 12%);
  border-color: var(--border-color);
  box-shadow: 0 10px 28px rgba(2, 6, 23, 0.32);
}

.dark .console-sider :deep(.ps-console-sider__resizer::before) {
  background: var(--border-color);
}

.dark .console-main {
  background-color: var(--bg-primary);
}
.console-sider {
  background: var(--el-fill-color-lighter);
}
.console-sider :deep(.ps-console-sider__title) {
  padding: 10px 18px 16px;
  font-size: 13px;
  gap: 9px;
}
.console-sider :deep(.el-menu) {
  padding: 0 8px;
  background: transparent;
}
.console-sider :deep(.el-menu-item) {
  height: 34px;
  margin: 2px 0;
  border-radius: 5px;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
}
.console-sider :deep(.el-menu-item.is-active) {
  background: var(--el-fill-color-darker);
  color: var(--el-text-color-primary);
}
.console-sider :deep(.ps-console-sider__menu-icon) {
  font-size: 16px;
  top: 0;
  margin-right: 9px;
}
</style>
