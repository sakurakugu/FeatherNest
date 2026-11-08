import { autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/vue'
import { onClickOutside } from '@vueuse/core'
import { computed, shallowRef, watch, watchEffect } from 'vue'
import type { Ref } from 'vue'

type DropdownPanelItem = {
  isOpen: Ref<boolean>
  wrapperRef: Ref<HTMLElement | undefined>
}

type UseDropdownPanelsOptions = {
  gap?: number
  panelOffset?: number
}

export function 使用下拉面板(panels: DropdownPanelItem[], options: UseDropdownPanelsOptions = {}) {
  const gap = options.gap ?? 8
  const panelOffset = options.panelOffset ?? 20

  for (const { isOpen, wrapperRef } of panels) {
    const floatingRef = shallowRef<HTMLElement>()
    watch(
      [isOpen, wrapperRef],
      ([open, wrapper]) => {
        floatingRef.value = open
          ? (wrapper?.querySelector<HTMLElement>('.custom-dropdown-panel') ?? undefined)
          : undefined
      },
      { flush: 'post', immediate: true },
    )

    const { x, y, placement, isPositioned } = useFloating(wrapperRef, floatingRef, {
      open: isOpen,
      placement: computed(() =>
        wrapperRef.value?.classList.contains('dropdown-wrapper--align-end')
          ? 'bottom-end'
          : 'bottom',
      ),
      whileElementsMounted: autoUpdate,
      middleware: [
        offset(panelOffset),
        flip({ padding: gap }),
        shift({ padding: gap }),
        size({
          padding: gap,
          apply({ availableHeight, availableWidth, rects }) {
            const wrapper = wrapperRef.value
            if (!wrapper) return
            wrapper.style.setProperty('--panel-max-height', `${Math.max(0, availableHeight)}px`)
            wrapper.style.setProperty('--panel-max-width', `${Math.max(0, availableWidth)}px`)
            wrapper.style.setProperty('--panel-bridge-width', `${rects.floating.width}px`)
          },
        }),
      ],
    })

    watchEffect(() => {
      const wrapper = wrapperRef.value
      if (!wrapper || !isPositioned.value) return
      const isAbove = placement.value.startsWith('top')
      wrapper.style.setProperty('--panel-left', `${x.value}px`)
      wrapper.style.setProperty('--panel-top', `${y.value}px`)
      wrapper.style.setProperty('--panel-right', 'auto')
      wrapper.style.setProperty('--panel-transform', 'none')
      wrapper.style.setProperty('--dropdown-panel-offset', `${panelOffset}px`)
      // 翻转到上方时，悬停桥也要跟随，避免鼠标移入面板途中被关闭。
      wrapper.style.setProperty('--panel-bridge-top', isAbove ? 'auto' : '100%')
      wrapper.style.setProperty('--panel-bridge-bottom', isAbove ? '100%' : 'auto')
    })

    onClickOutside(wrapperRef, () => {
      isOpen.value = false
    })
  }
}
