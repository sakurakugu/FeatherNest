import { useWindowSize } from '@vueuse/core'
import { computed } from 'vue'

const 移动端视口断点 = 768

export function 使用视口() {
  const { width, height } = useWindowSize({ initialWidth: 0, initialHeight: 0 })

  const isMobileViewport = computed(() => width.value <= 移动端视口断点)
  const isDesktopViewport = computed(() => width.value > 移动端视口断点)

  return {
    width,
    height,
    isMobileViewport,
    isDesktopViewport,
  }
}
