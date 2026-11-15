<script setup lang="ts">
defineProps<{ modelValue: 'asc' | 'desc' | '' }>()
const emit = defineEmits<{ 'update:modelValue': [value: 'asc' | 'desc'] }>()
const 方向选项 = [
  { value: 'asc', label: '升序' },
  { value: 'desc', label: '降序' },
] as const
</script>

<template>
  <div class="manager-sort-direction" role="group" aria-label="排序方向">
    <button
      v-for="选项 in 方向选项"
      :key="选项.value"
      type="button"
      :class="{ 'is-active': modelValue === 选项.value }"
      :aria-pressed="modelValue === 选项.value"
      @click="emit('update:modelValue', 选项.value)"
    >
      {{ 选项.label }}
    </button>
  </div>
</template>

<style scoped>
.manager-sort-direction {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.manager-sort-direction button {
  min-height: 26px;
  padding: 0 9px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
}

.manager-sort-direction button:hover {
  border-color: var(--el-color-primary);
}

.manager-sort-direction button.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: #fff;
}
</style>
