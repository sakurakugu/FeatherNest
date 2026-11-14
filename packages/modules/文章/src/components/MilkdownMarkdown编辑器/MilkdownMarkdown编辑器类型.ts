import type { EditorView } from '@milkdown/prose/view'

export interface MilkdownMarkdownImagePayload {
  url: string
  alt?: string
  title?: string
}

export type MilkdownMarkdownImageUploader = (
  files: File[],
) => Promise<MilkdownMarkdownImagePayload[]>

export interface MilkdownMarkdown编辑器实例 {
  getMarkdown: () => string
  setMarkdown: (markdown: string) => void
  formatMarkdown: () => string | null
  获取选区: () => { text: string; replace: (markdown: string) => boolean } | null
  美化选区: () => boolean | null
  insertMarkdown: (markdown: string) => void
  getEditorView: () => EditorView | null
  getScrollElement: () => HTMLElement | null
  getScrollRatio: () => number
  setScrollRatio: (ratio: number) => void
  scrollToHeading: (headingIndex: number, sourceLine: number) => boolean
  redo: () => boolean
  focus: () => void
}
