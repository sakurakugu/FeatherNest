import { z } from 'zod'
import type { Todo, TodoTransferItem, TodoTransferPayload } from '../types'

const 可选文本 = z.string().trim().transform((value) => value || undefined).optional().catch(undefined)
const 可选日期 = z.string().transform((value) => {
  const date = value.trim() ? new Date(value) : new Date(Number.NaN)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}).optional().catch(undefined)

function 数值字段(fallback: number, min: number, max: number) {
  return z.number().finite().transform((value) => Math.min(max, Math.max(min, Math.round(value)))).catch(fallback).default(fallback)
}

const 待办传输项结构 = z.object({
  title: z.string().trim().min(1),
  description: 可选文本,
  status: z.enum(['todo', 'done']).catch('todo').default('todo'),
  importance: 数值字段(33, 0, 100),
  urgency: 数值字段(33, 0, 100),
  start_date: 可选日期,
  end_date: 可选日期,
  is_pinned: z.coerce.boolean().catch(false).default(false),
  tags: z.array(z.unknown()).catch([]).default([]).transform((tags) =>
    tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)),
  recurrence_type: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'workday', 'weekend', 'holiday', 'custom']).catch('none').default('none'),
  recurrence_interval: 数值字段(1, 1, 365),
  recurrence_count: 数值字段(0, -1, 999),
  times_per_interval: 数值字段(1, 1, 999),
  interval_progress: 数值字段(0, 0, 999),
  is_deleted: z.coerce.boolean().catch(false).default(false),
}).transform((item): TodoTransferItem => ({
  ...item,
  recurrence_count: item.recurrence_type === 'none' ? 0 : item.recurrence_count,
  times_per_interval: item.recurrence_type === 'none' ? 1 : item.times_per_interval,
  interval_progress: item.recurrence_type === 'none' ? 0 : Math.min(item.interval_progress, item.times_per_interval),
}))

const 待办传输负载结构 = z.union([
  z.array(z.unknown()),
  z.object({ todos: z.array(z.unknown()) }).transform((value) => value.todos),
])

export function 标准化待办传输项(item: unknown): TodoTransferItem | null {
  const result = 待办传输项结构.safeParse(item)
  return result.success ? result.data : null
}

export function 解析待办传输负载(rawText: string): TodoTransferItem[] {
  const result = 待办传输负载结构.safeParse(JSON.parse(rawText))
  if (!result.success) throw new Error('导入文件格式不正确')
  const normalized = result.data.map(标准化待办传输项).filter((item): item is TodoTransferItem => item !== null)
  if (!normalized.length) throw new Error('导入文件中没有可用的待办事项')
  return normalized
}

export function 转为待办传输项(todo: Todo): TodoTransferItem {
  return {
    title: todo.title,
    description: todo.description ?? undefined,
    status: todo.status,
    importance: todo.importance,
    urgency: todo.urgency,
    start_date: todo.start_date ?? undefined,
    end_date: todo.end_date ?? undefined,
    is_pinned: todo.is_pinned,
    tags: todo.tags ?? [],
    recurrence_type: todo.recurrence_type,
    recurrence_interval: todo.recurrence_interval,
    recurrence_count: todo.recurrence_count,
    times_per_interval: todo.times_per_interval,
    interval_progress: todo.interval_progress,
    is_deleted: todo.is_deleted,
  }
}

function normalizeFingerprintDate(value: string | undefined): string {
  return 可选日期.parse(value) || ''
}

export function 获取待办传输指纹(todo: TodoTransferItem): string {
  return JSON.stringify({
    title: todo.title.trim(),
    description: todo.description?.trim() || '',
    status: todo.status,
    importance: todo.importance,
    urgency: todo.urgency,
    start_date: normalizeFingerprintDate(todo.start_date),
    end_date: normalizeFingerprintDate(todo.end_date),
    is_pinned: todo.is_pinned,
    tags: Array.from(new Set(todo.tags.map((tag) => tag.trim()).filter(Boolean))).sort(),
    recurrence_type: todo.recurrence_type,
    recurrence_interval: todo.recurrence_interval,
    recurrence_count: todo.recurrence_count,
    times_per_interval: todo.times_per_interval,
    interval_progress: todo.interval_progress,
    is_deleted: todo.is_deleted,
  })
}

export function 获取待办指纹(todo: Todo): string {
  return 获取待办传输指纹(转为待办传输项(todo))
}

export function 构建待办传输负载(version: number, todos: Todo[]): TodoTransferPayload {
  return {
    version,
    exported_at: new Date().toISOString(),
    total: todos.length,
    todos: todos.map((todo) => 转为待办传输项(todo)),
  }
}
