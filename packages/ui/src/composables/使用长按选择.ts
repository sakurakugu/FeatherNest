import { useTimeoutFn } from '@vueuse/core'
import { onScopeDispose } from 'vue'

interface LongPressSelectionOptions<T> {
  delay?: number
  getId: (item: T) => string
  onLongPress: (item: T) => void
}

export function 使用长按选择<T>(options: LongPressSelectionOptions<T>) {
  const delay = options.delay ?? 520
  const timers = new Map<string, ReturnType<typeof useTimeoutFn>>()
  const triggered = new Set<string>()

  function 清除定时器(id: string) {
    timers.get(id)?.stop()
    timers.delete(id)
  }

  function 开始长按(item: T, event?: Event) {
    if (event instanceof MouseEvent && event.button !== 0) {
      return
    }

    const id = options.getId(item)
    清除定时器(id)
    triggered.delete(id)
    timers.set(id, useTimeoutFn(() => {
      triggered.add(id)
      timers.delete(id)
      options.onLongPress(item)
    }, delay))
  }

  function 取消长按(item: T) {
    清除定时器(options.getId(item))
  }

  function 消费长按(item: T): boolean {
    const id = options.getId(item)
    const wasTriggered = triggered.delete(id)
    return wasTriggered
  }

  onScopeDispose(() => {
    timers.forEach((timer) => timer.stop())
    timers.clear()
    triggered.clear()
  })

  return {
    开始长按,
    取消长按,
    消费长按,
    startLongPress: 开始长按,
    cancelLongPress: 取消长按,
    consumeLongPress: 消费长按,
  }
}
