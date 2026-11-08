<script setup lang="ts">
import { SwitchButton } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { 使用下拉面板 } from '@feathernest/ui'
import { ElButton, ElIcon } from 'element-plus'
import type { Component } from 'vue'
import { computed, ref, useSlots } from 'vue'

type UserMenuItem = {
  label: string
  key: string
  type?: 'divider'
  icon?: Component | string
}

const props = withDefaults(defineProps<{
  isAuthed: boolean
  menuItems: UserMenuItem[]
  extraMenuItems?: UserMenuItem[]
  mobile?: boolean
}>(), {
  extraMenuItems: () => [],
  mobile: false,
})

const emit = defineEmits<{
  'menu-select': [key: string]
  'guest-select': [key: 'login']
}>()

const isOpen = ref(false)
const dropdownRef = ref<globalThis.HTMLElement>()
const slots = useSlots()

const buttonAriaLabel = computed(() => (props.isAuthed ? '打开用户菜单' : '打开登录菜单'))
const hasExtraPanel = computed(() => {
  const content = slots.extraPanel?.()
  return Boolean(content && content.length > 0)
})
const hasExtraSection = computed(() => props.extraMenuItems.length > 0 || hasExtraPanel.value)
const shouldShowMainSectionDivider = computed(() => hasExtraSection.value && (props.isAuthed ? props.menuItems.length > 0 : true))

function openMenu() {
  isOpen.value = true
}

function closeMenu() {
  isOpen.value = false
}

function toggleMenu() {
  if (!props.mobile) return
  isOpen.value = !isOpen.value
}

function handleMenuSelect(key: string) {
  emit('menu-select', key)
  closeMenu()
}

function handleGuestSelect(key: 'login') {
  emit('guest-select', key)
  closeMenu()
}

使用下拉面板([{ isOpen, wrapperRef: dropdownRef }])
</script>

<template>
  <div
    ref="dropdownRef"
    class="dropdown-wrapper user-dropdown"
    @mouseenter="openMenu"
    @mouseleave="closeMenu"
  >
    <ElButton
      class="header-btn user-menu-btn"
      :aria-label="buttonAriaLabel"
      @click.stop="toggleMenu"
    >
      <svg class="user-menu-icon" viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
        <path d="M338.763294 502.000941H77.462588c-35.779765 0-65.054118-29.274353-65.054117-65.054117V175.646118c0-35.779765 29.274353-65.054118 65.054117-65.054118h261.842824c35.779765 0 65.054118 29.274353 65.054117 65.054118v261.842823a65.234824 65.234824 0 0 1-65.596235 64.512zM77.462588 175.646118v261.842823h261.842824V175.646118H77.462588z m645.662118 380.566588c-17.347765 0-33.611294-6.505412-46.08-18.974118L492.182588 352.376471a64.331294 64.331294 0 0 1-18.974117-46.08c0-17.347765 6.505412-33.611294 18.974117-46.08l184.862118-184.862118c12.468706-12.468706 28.732235-18.974118 46.08-18.974118 17.347765 0 33.611294 6.505412 46.08 18.974118l184.862118 184.862118c12.468706 12.468706 18.974118 28.732235 18.974117 46.08 0 17.347765-6.505412 33.611294-18.974117 46.08L769.204706 537.238588a64.331294 64.331294 0 0 1-46.08 18.974118z m0-435.320471L538.262588 305.754353l184.862118 184.862118 184.862118-184.862118-184.862118-184.862118zM338.763294 1017.012706H77.462588c-35.779765 0-65.054118-29.274353-65.054117-65.054118v-261.842823c0-35.779765 29.274353-65.054118 65.054117-65.054118h261.842824c35.779765 0 65.054118 29.274353 65.054117 65.054118v261.842823a65.355294 65.355294 0 0 1-65.596235 65.054118z m-261.300706-326.354824v261.842824h261.842824v-261.842824H77.462588z m776.312471 326.354824H591.932235c-35.779765 0-65.054118-29.274353-65.054117-65.054118v-261.842823c0-35.779765 29.274353-65.054118 65.054117-65.054118h261.842824c35.779765 0 65.054118 29.274353 65.054117 65.054118v261.842823c0 36.321882-28.732235 65.054118-65.054117 65.054118z m-261.300706-326.354824v261.842824h261.842823v-261.842824H592.474353z" />
      </svg>
    </ElButton>
    <Transition name="dropdown">
      <div v-show="isOpen" class="custom-dropdown-panel" :class="{ 'custom-dropdown-panel--wide': hasExtraSection }">
        <template v-if="hasExtraSection">
          <template v-for="item in extraMenuItems" :key="item.key">
            <div v-if="item.type === 'divider'" class="custom-divider" role="separator" />
            <div v-else class="dropdown-item" @click="handleMenuSelect(item.key)">
              <Icon v-if="typeof item.icon === 'string'" :icon="item.icon" class="dropdown-item-icon" />
              <ElIcon v-else-if="item.icon" :size="16"><component :is="item.icon" /></ElIcon>
              <span>{{ item.label }}</span>
            </div>
          </template>
          <div v-if="hasExtraPanel && extraMenuItems.length" class="custom-divider" role="separator" />
          <div v-if="hasExtraPanel" class="extra-panel-wrapper">
            <slot name="extraPanel" />
          </div>
        </template>
        <div v-if="shouldShowMainSectionDivider" class="custom-divider" role="separator" />
        <template v-if="isAuthed">
          <template v-for="item in menuItems" :key="item.key">
            <div v-if="item.type === 'divider'" class="custom-divider" role="separator" />
            <div v-else class="dropdown-item" @click="handleMenuSelect(item.key)">
              <Icon v-if="typeof item.icon === 'string'" :icon="item.icon" class="dropdown-item-icon" />
              <ElIcon v-else-if="item.icon" :size="16"><component :is="item.icon" /></ElIcon>
              <span>{{ item.label }}</span>
            </div>
          </template>
        </template>
        <template v-else>
          <div class="dropdown-item" @click="handleGuestSelect('login')">
            <ElIcon :size="16"><SwitchButton /></ElIcon>
            <span>登录</span>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import '@feathernest/ui/styles/dropdown.css';

.header-btn {
  --dropdown-panel-min-width: 140px;
  --dropdown-panel-motion-duration: 0.15s;
  --dropdown-panel-surface-transition-duration: 0.24s;
  --dropdown-item-transition-duration: 0.15s;
  position: relative;
  z-index: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  transition: color 0.2s ease-out;
  overflow: hidden;
  outline: none;
}

.header-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(0, 0, 0, 0.06);
  transform: scale(0.85);
  opacity: 0;
  z-index: -1;
  transition: all 0.2s ease-out;
}

.header-btn:hover::before {
  transform: scale(1);
  opacity: 1;
}

.header-btn:active::before {
  background: rgba(0, 0, 0, 0.1);
}

.user-menu-btn:hover {
  color: var(--header-accent);
}

.user-menu-btn:hover::before {
  background: var(--header-accent-overlay-12);
  opacity: 1;
  transform: scale(1);
}

.user-menu-btn:active::before {
  background: var(--header-accent-overlay-18);
}

.user-menu-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 8;
  stroke-linejoin: round;
  flex-shrink: 0;
  pointer-events: none;
}

.custom-dropdown-panel--wide {
  width: min(140px, calc(100vw - 24px));
}

.custom-divider {
  height: 1px;
  background: var(--el-border-color-light);
  margin: 8px 0;
}

.dropdown-item-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.extra-panel-wrapper {
  overflow: hidden;
}

.dark .header-btn {
  color: rgba(255, 255, 255, 0.8);
}

.dark .header-btn::before {
  background: rgba(255, 255, 255, 0.1);
}

.dark .header-btn:active::before {
  background: rgba(255, 255, 255, 0.15);
}

.dark .user-menu-btn:hover {
  color: var(--header-accent-bright);
}

.dark .user-menu-btn:hover::before {
  background: var(--header-accent-overlay-15);
}

.dark .user-menu-btn:active::before {
  background: var(--header-accent-overlay-22);
}

.dark .custom-divider {
  background: rgba(255, 255, 255, 0.08);
}
</style>
