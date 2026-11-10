<script setup lang="ts">
defineProps<{ direction?: 'asc' | 'desc' | '' }>()

const ascendingBar =
  'M255.895296 0a51.2 51.2 0 0 0-51.2 51.2v921.6a51.2 51.2 0 0 0 102.4 0V51.2a51.2 51.2 0 0 0-51.2-51.2z'
const ascendingArrow =
  'M804.247296 270.848l-256-256a58.88 58.88 0 0 0-16.896-10.752 51.2 51.2 0 0 0-38.912 0 51.2 51.2 0 0 0-27.648 27.648A51.2 51.2 0 0 0 460.695296 51.2v921.6a51.2 51.2 0 0 0 102.4 0V174.592l168.448 168.96a51.2 51.2 0 0 0 72.704-72.704z'
const descendingArrow =
  'M804.247296 753.152l-256 256a58.88 58.88 0 0 1-16.896 10.752 51.2 51.2 0 0 1-38.912 0 51.2 51.2 0 0 1-27.648-27.648A51.2 51.2 0 0 1 460.695296 972.8V51.2a51.2 51.2 0 0 1 102.4 0v798.208l168.448-168.96a51.2 51.2 0 0 1 72.704 72.704z'
</script>

<template>
  <svg viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
    <template v-if="direction === 'asc'">
      <!-- 升序：左上箭头 + 右边竖线 -->
      <path :d="ascendingArrow" transform="translate(914 0) scale(-1 1)" />
      <path :d="ascendingBar" transform="translate(404 0)" />
    </template>
    <template v-else-if="direction === 'desc'">
      <!-- 降序：左边竖线 + 右下箭头 -->
      <path :d="ascendingBar" transform="translate(90 0)" />
      <path :d="descendingArrow" transform="translate(90 0)" />
    </template>
    <template v-else>
      <!-- 合并：左上箭头 + 右下箭头 -->
      <path :d="ascendingArrow" transform="translate(914 0) scale(-1 1)" />
      <path :d="descendingArrow" transform="translate(90 0)" />
    </template>
  </svg>
</template>
