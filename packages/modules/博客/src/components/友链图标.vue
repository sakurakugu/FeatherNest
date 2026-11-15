<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { 创建字符图标, 获取名称缩写, 获取网站图标, 读取字符图标 } from '../friend-links/icon';

const props = defineProps<{
  name: string
  url: string
  logoUrl?: string | null
  previewable?: boolean
}>()
const emit = defineEmits<{ preview: [url: string] }>()
const failed = ref(false)
const source = computed(() => {
  const character = 读取字符图标(props.logoUrl || '')
  return character
    ? 创建字符图标(获取名称缩写(props.name))
    : props.logoUrl || 获取网站图标(props.url)
})
const displayedSource = computed(() =>
  source.value && !failed.value
    ? source.value
    : 创建字符图标(获取名称缩写(props.name)),
)
watch(source, () => {
  failed.value = false
})

function handleError() {
  failed.value = true
  console.warn('友链图标加载失败，已使用名称字符图标', { name: props.name, url: props.url })
}
</script>

<template>
  <component
    :is="previewable ? 'button' : 'span'"
    class="friend-link-icon"
    :type="previewable ? 'button' : undefined"
    :aria-hidden="previewable ? undefined : true"
    @click="previewable && emit('preview', displayedSource)"
  >
    <img :src="displayedSource" alt="" loading="lazy" @error="handleError" />
  </component>
</template>

<style scoped>
.friend-link-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: var(--el-fill-color-light, #f0f2f5);
  color: var(--el-text-color-secondary, #777);
  font-size: 15px;
}
.friend-link-icon[type='button'] {
  cursor: zoom-in;
}
.friend-link-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
