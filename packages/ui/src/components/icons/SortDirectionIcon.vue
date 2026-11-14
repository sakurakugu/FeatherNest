<script setup lang="ts">
// 升 / 降序图标：空方向显示双向箭头，文章管理与公告管理共用。
defineProps<{ direction?: 'asc' | 'desc' | '' }>()

const 竖线 =
  'M255.895296 0a51.2 51.2 0 0 0-51.2 51.2v921.6a51.2 51.2 0 0 0 102.4 0V51.2a51.2 51.2 0 0 0-51.2-51.2z'
const 升序箭头 =
  'M804.247296 270.848l-256-256a58.88 58.88 0 0 0-16.896-10.752 51.2 51.2 0 0 0-38.912 0 51.2 51.2 0 0 0-27.648 27.648A51.2 51.2 0 0 0 460.695296 51.2v921.6a51.2 51.2 0 0 0 102.4 0V174.592l168.448 168.96a51.2 51.2 0 0 0 72.704-72.704z'
const 降序箭头 =
  'M804.247296 753.152l-256 256a58.88 58.88 0 0 1-16.896 10.752 51.2 51.2 0 0 1-38.912 0 51.2 51.2 0 0 1-27.648-27.648A51.2 51.2 0 0 1 460.695296 972.8V51.2a51.2 51.2 0 0 1 102.4 0v798.208l168.448-168.96a51.2 51.2 0 0 1 72.704 72.704z'
</script>

<template>
  <svg viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
    <template v-if="direction === 'asc'">
      <path :d="升序箭头" transform="translate(914 0) scale(-1 1)" />
      <path :d="竖线" transform="translate(404 0)" />
    </template>
    <template v-else-if="direction === 'desc'">
      <path :d="竖线" transform="translate(90 0)" />
      <path :d="降序箭头" transform="translate(90 0)" />
    </template>
    <template v-else>
      <path :d="升序箭头" transform="translate(914 0) scale(-1 1)" />
      <path :d="降序箭头" transform="translate(90 0)" />
    </template>
  </svg>
</template>
