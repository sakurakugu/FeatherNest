<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { 使用认证存储 } from '@feathernest/domain/auth'
import LoginModal from '@feathernest/module-auth/components/登录弹窗.vue'
const route = useRoute()
const router = useRouter()
function 完成登录() {
  if (!使用认证存储().isAuthenticated) {
    void router.replace('/blog')
    return
  }
  const target = route.query.redirect
  void router.replace(
    typeof target === 'string' && /^\/admin(?:\/|$)/.test(target) ? target : '/admin',
  )
}
</script>
<template><LoginModal :show="true" @update:show="完成登录" /></template>
