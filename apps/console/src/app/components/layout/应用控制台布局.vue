<script setup lang="ts">
import { ConsoleSidebarLayout } from '@feathernest/ui';
import type { 控制台菜单项 } from './ConsoleLayout';

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

.dark .console-layout :deep(.console-sider) {
  background-color: var(--sidebar-bg) !important;
  border-right-color: var(--border-color) !important;
}

.dark .console-layout :deep(.console-sider .ps-console-sider__title) {
  color: var(--text-primary);
}

.dark .console-layout :deep(.console-sider .ps-sidebar-handle__trigger:hover) {
  background-color: var(--bg-hover) !important;
}

.dark .console-layout :deep(.console-sider.is-hidden .ps-sidebar-handle__trigger) {
  background-color: color-mix(in srgb, var(--sidebar-bg) 88%, #ffffff 12%);
  border-color: var(--border-color);
  box-shadow: 0 10px 28px rgba(2, 6, 23, 0.32);
}

.dark .console-layout :deep(.console-sider .ps-console-sider__resizer::before) {
  background: var(--border-color);
}

.dark .console-main {
  background-color: var(--bg-primary);
}
.console-layout :deep(.console-sider) {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #525252;
  --el-menu-hover-bg-color: #f1f1f1;
  --el-menu-active-color: #171717;
  --el-menu-item-height: 40px;
  --el-menu-base-level-padding: 20px;
  background: #fafafa;
  border-right-color: #ececec;
  font-family:
    'PingFang SC',
    'HarmonyOS Sans SC',
    'Microsoft YaHei',
    'Noto Sans SC',
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
}
.console-layout :deep(.console-sider .ps-console-sider__inner) {
  /* 8 + 菜单项(40)内居中的 12.5 = 20.5，让首项图标顶部与左侧 20px 内边距对齐 */
  padding: 8px 0 0;
}
.console-layout :deep(.console-sider .ps-console-sider__title) {
  display: none;
}
.console-layout :deep(.console-sider .el-menu) {
  /* 顶部不留白，第一项到顶部的距离就等于菜单项自身 20px 的左内边距 */
  padding: 0 0 6px;
  background: transparent;
  scrollbar-width: thin;
}
.console-layout :deep(.console-sider .el-menu::-webkit-scrollbar) {
  display: block;
  width: 9px;
}
.console-layout :deep(.console-sider .el-menu-item) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  height: 40px;
  line-height: normal;
  min-height: 40px;
  padding: 0 20px 0 22px !important;
  margin: 0;
  border-radius: 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 400;
  color: #525252;
  text-align: left;
}
.console-layout :deep(.console-sider .el-menu-item.menu-item--divider-before) {
  margin-top: 16px;
}

/* 紧凑态只留图标，左右内边距和图标右外边距都要去掉才能真居中 */
.console-layout :deep(.console-sider.is-compact .el-menu-item) {
  justify-content: center;
  padding: 0 !important;
}

.console-layout :deep(.console-sider.is-compact .ps-console-sider__menu-icon) {
  margin-right: 0;
}

/* 折叠时 Element Plus 会套一层 tooltip 触发层，它不居中图标也不会居中 */
.console-layout :deep(.console-sider.is-compact .el-menu-tooltip__trigger) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.console-layout :deep(.console-sider .el-menu-item.menu-item--divider-before::before) {
  background-color: var(--border-color);
}
.console-layout :deep(.console-sider .el-menu-item:hover) {
  background: #f1f1f1;
  color: #171717;
}
.console-layout :deep(.console-sider .el-menu-item.is-active) {
  background: #f2f2f2;
  color: #171717;
  font-weight: 500;
}
.console-layout :deep(.console-sider .ps-console-sider__menu-icon) {
  display: block;
  flex: none;
  width: 15px;
  height: 15px;
  font-size: 15px;
  line-height: 1;
  top: 0;
  margin-right: 10px;
}
.console-layout :deep(.console-sider .ps-console-sider__menu-icon),
.console-layout :deep(.console-sider .ps-sidebar-handle__trigger-icon) {
  color: #8a8a8a;
}
.console-layout :deep(.console-sider .ps-console-sider__label) {
  overflow: hidden;
  min-width: 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: inherit;
  line-height: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.console-layout :deep(.console-sider .ps-console-sider__count) {
  color: #a3a3a3;
  font-size: 11px;
  font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;
}
.console-layout :deep(.console-sider .el-menu-item.is-active .ps-console-sider__menu-icon) {
  color: #e3769b;
}
.console-layout :deep(.console-sider:not(.is-hidden) .ps-sidebar-handle__footer) {
  padding: 6px 0;
  border-top: 1px solid var(--border-color);
}
.console-layout :deep(.console-sider .ps-sidebar-handle__trigger) {
  color: var(--el-menu-text-color);
}
.console-layout :deep(.console-sider:not(.is-hidden) .ps-sidebar-handle__trigger) {
  height: 40px;
  /* 左侧内边距跟菜单项保持一致，底部图标的左边缘才对得上 */
  padding: 0 20px 0 22px;
  border-radius: 0;
  font: inherit;
  font-size: 13px;
}
.console-layout :deep(.console-sider:not(.is-hidden) .ps-sidebar-handle__trigger:hover) {
  background: var(--el-menu-hover-bg-color);
  color: var(--el-menu-active-color);
}
.console-layout :deep(.console-sider.is-hidden .ps-console-sider__inner) {
  padding: 0;
}
.dark .console-layout :deep(.console-sider) {
  --el-menu-text-color: var(--text-secondary);
  --el-menu-hover-bg-color: var(--bg-hover);
  --el-menu-active-color: var(--text-primary);
  background: var(--sidebar-bg);
}
.dark .console-layout :deep(.console-sider .el-menu-item) {
  color: var(--text-secondary) !important;
}
.dark .console-layout :deep(.console-sider .el-menu-item:hover) {
  background: var(--bg-hover) !important;
  color: var(--text-primary) !important;
}
.dark .console-layout :deep(.console-sider .el-menu-item.is-active) {
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent) !important;
  color: var(--text-primary) !important;
}
.dark .console-layout :deep(.console-sider .ps-console-sider__menu-icon),
.dark .console-layout :deep(.console-sider .ps-sidebar-handle__trigger-icon) {
  color: var(--text-tertiary);
}
.dark .console-layout :deep(.console-sider .el-menu-item.is-active .ps-console-sider__menu-icon) {
  color: var(--el-color-primary-light-5);
}
</style>
