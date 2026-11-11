<script setup lang="ts">
import { ElButton, ElIcon } from 'element-plus';
import { computed } from 'vue';

const props = defineProps<{
  hidden: boolean
  compact: boolean
  dragging: boolean
  bottom: number
  text: string
}>()

const emit = defineEmits<{
  toggle: []
  'drag-start': [event: MouseEvent | TouchEvent]
}>()

const hiddenFooterStyle = computed(() => (
  props.hidden
    ? { bottom: `calc(${props.bottom}px + var(--app-safe-area-bottom, 0px))` }
    : undefined
))

function handleMouseDown(event: MouseEvent) {
  emit('drag-start', event)
}

function handleTouchStart(event: TouchEvent) {
  emit('drag-start', event)
}
</script>

<template>
  <div
    class="ps-sidebar-handle"
    :class="{
      'is-compact': compact,
      'is-hidden': hidden,
    }"
  >
    <div class="ps-sidebar-handle__footer" :style="hiddenFooterStyle">
      <ElButton
        text
        class="ps-sidebar-handle__trigger"
        :class="{ 'is-dragging': dragging }"
        :aria-label="text"
        :aria-expanded="!hidden"
        @click="emit('toggle')"
        @mousedown="handleMouseDown"
        @touchstart="handleTouchStart"
      >
        <ElIcon class="ps-sidebar-handle__trigger-icon">
          <!--
            三态图标：填充块表示面板占用的宽度，竖线是面板边界，箭头指向下一步动作。
            展开 填充 7 + 实线边界 10 + 左箭头；紧凑 填充 3.85 + 实线边界 6.8 + 双左箭头；
            隐藏 填充 5（面板空出来的位置）+ 虚线边界 8 + 右箭头。箭头各自相对右侧面板居中。
          -->
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <rect
              class="ps-toggle-bar"
              x="3"
              y="4"
              width="7"
              height="16"
              rx="2.5"
              fill="currentColor"
              fill-opacity="0.42"
              stroke="none"
            />
            <path class="ps-toggle-sep" d="M10 4v16" />
            <path class="ps-toggle-dash" d="M8 4.6v14.8" stroke-dasharray="2.4 2.4" />
            <path class="ps-toggle-chev" d="M16.6 9.2 14.2 12l2.4 2.8" />
            <path class="ps-toggle-chev-more" d="M18.1 9.6 16.1 12l2 2.4" />
            <path class="ps-toggle-chev-back" d="M13.3 9.2 15.7 12l-2.4 2.8" />
          </svg>
        </ElIcon>
        <span class="ps-sidebar-handle__trigger-text">{{ text }}</span>
      </ElButton>
    </div>
  </div>
</template>

<style scoped>
.ps-sidebar-handle {
  margin-top: auto;
  overflow: hidden;
}

.ps-sidebar-handle__footer {
  padding: 12px 8px calc(6px + var(--app-safe-area-bottom));
  overflow: hidden;
}

.ps-sidebar-handle__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  white-space: nowrap;
}

.ps-sidebar-handle__trigger :deep(.el-button__text) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  gap: 6px;
  overflow: visible;
  white-space: nowrap;
  padding-left: 20px;
  box-sizing: border-box;
}

.ps-sidebar-handle__trigger-text {
  opacity: 1;
  transform: translateX(0);
  transition:
    opacity 0.16s ease,
    transform 0.2s ease;
}

.ps-sidebar-handle__trigger-icon {
  font-size: 16px;
}

/* ---------- 三态图标的过渡 ---------- */
.ps-toggle-bar {
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.ps-toggle-sep {
  transition:
    transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.18s ease;
}

.ps-toggle-dash {
  opacity: 0;
  transition: opacity 0.18s ease;
}

.ps-toggle-chev {
  transition:
    transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.18s ease;
}

.ps-toggle-chev-more {
  opacity: 0;
  transition:
    opacity 0.18s ease,
    transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.ps-toggle-chev-back {
  opacity: 0;
  transition: opacity 0.18s ease;
}

/* 紧凑态：面板收到 3.85，边界左移，两个箭头一起左移并相对右面板居中 */
.ps-sidebar-handle.is-compact .ps-toggle-bar {
  width: 3.85px;
}

.ps-sidebar-handle.is-compact .ps-toggle-sep {
  transform: translateX(-3.2px);
}

.ps-sidebar-handle.is-compact .ps-toggle-chev {
  transform: translateX(-3.25px);
}

.ps-sidebar-handle.is-compact .ps-toggle-chev-more {
  opacity: 1;
  transform: translateX(-1.25px);
}

/* 隐藏态：填充块停在面板空出来的位置，边界变虚线，箭头翻向右侧 */
.ps-sidebar-handle.is-hidden .ps-toggle-bar {
  width: 5px;
}

.ps-sidebar-handle.is-hidden .ps-toggle-sep {
  transform: translateX(-3.2px);
  opacity: 0;
}

.ps-sidebar-handle.is-hidden .ps-toggle-dash {
  opacity: 1;
}

.ps-sidebar-handle.is-hidden .ps-toggle-chev {
  opacity: 0;
}

.ps-sidebar-handle.is-hidden .ps-toggle-chev-back {
  opacity: 1;
}

.ps-sidebar-handle.is-compact .ps-sidebar-handle__trigger-text {
  display: none;
}

.ps-sidebar-handle.is-compact .ps-sidebar-handle__trigger {
  justify-content: center;
}

.ps-sidebar-handle.is-compact :deep(.el-button.ps-sidebar-handle__trigger) {
  padding: 0;
}

.ps-sidebar-handle.is-compact :deep(.el-button.ps-sidebar-handle__trigger .el-button__text) {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.ps-sidebar-handle.is-compact .ps-sidebar-handle__trigger :deep(.el-button__text) {
  gap: 0;
  justify-content: center;
  padding-left: 0;
}

.ps-sidebar-handle.is-hidden {
  overflow: visible;
}

.ps-sidebar-handle.is-hidden .ps-sidebar-handle__footer {
  position: fixed;
  left: 0;
  right: auto;
  bottom: auto;
  padding: 0;
  overflow: visible;
  display: flex;
  justify-content: flex-start;
  z-index: 1000;
  transition: none;
}

.ps-sidebar-handle.is-hidden .ps-sidebar-handle__trigger {
  width: 60px;
  min-width: 60px;
  max-width: 60px;
  flex: 0 0 60px;
  height: 36px;
  border-radius: 0 16px 16px 0;
  background-color: var(--el-bg-color-overlay);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
  border: 1px solid var(--el-border-color-light);
  border-left: none;
  position: relative;
  z-index: 10000;
  cursor: grab;
}

.ps-sidebar-handle.is-hidden .ps-sidebar-handle__trigger.is-dragging {
  cursor: grabbing;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
}

.ps-sidebar-handle.is-hidden .ps-sidebar-handle__trigger::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  width: 4px;
  height: 16px;
  border-radius: 999px;
  background-color: color-mix(in srgb, var(--el-text-color-secondary) 22%, transparent);
  transform: translateY(-50%);
}

.ps-sidebar-handle.is-hidden :deep(.el-button.ps-sidebar-handle__trigger) {
  width: 43px;
  min-width: 43px;
  max-width: 43px;
  flex: 0 0 43px;
}

.ps-sidebar-handle.is-hidden :deep(.el-button.ps-sidebar-handle__trigger .el-button__text) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.ps-sidebar-handle.is-hidden .ps-sidebar-handle__trigger :deep(.el-button__text) {
  width: 100%;
  height: 100%;
  padding: 0 0 0 0px;
  gap: 0;
  justify-content: center;
}

.ps-sidebar-handle.is-hidden .ps-sidebar-handle__trigger-text {
  display: none;
}

.ps-sidebar-handle.is-hidden .ps-sidebar-handle__trigger-icon {
  font-size: 18px;
}
</style>
