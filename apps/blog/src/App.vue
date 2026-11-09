<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 使用认证存储 } from '@feathernest/domain/auth'
import type { 聊天请求配置 } from '@feathernest/ui'
import { 使用设置存储 } from './shared/stores/settings'
import { 判断是否控制台路由 } from './app/router/route-meta'
import AppHeader from './app/components/header/应用顶栏.vue'
import FloatingControls from './app/components/浮动控制.vue'
import SakuraEffect from './app/components/樱花特效.vue'
import { 使用点击效果 } from './app/composables/使用点击效果'
使用点击效果()
const route = useRoute()
const router = useRouter()
const LoginModal = defineAsyncComponent(() => import('@feathernest/module-auth/components/登录弹窗.vue'))
const showLogin = ref(false)
const auth = 使用认证存储()
const settings = 使用设置存储()
const isConsolePage = computed(() => 判断是否控制台路由(route))
const shouldShowAIChat = computed(() => auth.isAuthenticated && settings.aiChatEnabled)
const AIChatWidget = defineAsyncComponent(() =>
  import('@feathernest/ui').then((module) => module.AIChatWidget),
)

function 注入AI聊天请求头(config: 聊天请求配置): 聊天请求配置 {
  const token = document.cookie.split(';').map((item) => item.trim())
    .find((item) => item.startsWith('csrf_token='))
  const headers = new globalThis.Headers(config.init.headers)
  if (token) headers.set('X-CSRF-Token', decodeURIComponent(token.slice('csrf_token='.length)))
  return { ...config, init: { ...config.init, headers } }
}

watch(isConsolePage, (isConsole, previous) => {
  if (previous !== undefined && isConsole !== previous) {
    console.info('切换站点页面区域', { 区域: isConsole ? '后台' : '博客', 路径: route.fullPath })
  }
})
function 登录() {
  showLogin.value = true
}
watch(
  () => route.query.login,
  (value) => {
    if (value) {
      登录()
      const query = { ...route.query }
      delete query.login
      void router.replace({ query })
    }
  },
  { immediate: true },
)
</script>
<template>
  <div class="app-container">
    <AppHeader @show-login="登录" />
    <LoginModal v-if="showLogin" v-model:show="showLogin" />
    <main class="main-content"><RouterView /></main>
    <FloatingControls v-if="!isConsolePage" />
    <SakuraEffect v-if="!isConsolePage" />
    <AIChatWidget
      v-if="shouldShowAIChat"
      url="/api/v1/ai/chat"
      :before-request="注入AI聊天请求头"
    />
  </div>
</template>
