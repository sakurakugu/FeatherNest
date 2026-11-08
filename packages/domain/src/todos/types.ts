import type { components, paths } from '@feathernest/api/generated/todos'

export type RecurrenceType = components['schemas']['RecurrenceType']
export type TodoStatus = components['schemas']['TodoStatus']
export type Todo = components['schemas']['TodoRead']
export type TodoCreateParams = components['schemas']['TodoCreate']
export type TodoUpdateParams = components['schemas']['TodoUpdate']
export type TodoListQuery = NonNullable<paths['/todos']['get']['parameters']['query']>
export type CompletionHistoryResponse =
  paths['/stats/todos/completion-history']['get']['responses'][200]['content']['application/json']
export type CompletionHistoryDay = CompletionHistoryResponse['days'][number]
export type CompletionHistoryItem = CompletionHistoryDay['items'][number]

export interface TodoTransferItem {
  title: string
  description?: string
  status: TodoStatus
  importance: number
  urgency: number
  start_date?: string
  end_date?: string
  is_pinned: boolean
  tags: string[]
  recurrence_type: RecurrenceType
  recurrence_interval: number
  recurrence_count: number
  times_per_interval: number
  interval_progress: number
  is_deleted: boolean
}

export interface TodoTransferPayload {
  version: number
  exported_at: string
  total: number
  todos: TodoTransferItem[]
}
