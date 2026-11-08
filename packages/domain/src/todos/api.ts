import api from '@feathernest/api'
import type {
  CompletionHistoryResponse,
  Todo,
  TodoCreateParams,
  TodoListQuery,
  TodoUpdateParams,
} from './types'

export async function 获取待办列表(query: TodoListQuery = {}, signal?: AbortSignal): Promise<Todo[]> {
  const { data } = await api.get<Todo[]>('/todos', {
    params: { ...query, is_deleted: query.is_deleted ?? false },
    signal,
  })
  return data
}

export async function 获取已删除待办(signal?: AbortSignal): Promise<Todo[]> {
  return 获取待办列表({ is_deleted: true }, signal)
}

export async function 创建待办(payload: TodoCreateParams): Promise<Todo> {
  const { data } = await api.post<Todo>('/todos', payload)
  return data
}

export async function 更新待办(id: string, payload: TodoUpdateParams): Promise<Todo> {
  const { data } = await api.patch<Todo>(`/todos/${id}`, payload)
  return data
}

export async function 删除待办(id: string, permanent = false): Promise<void> {
  await api.delete(`/todos/${id}`, {
    params: {
      permanent,
    },
  })
}

export async function 恢复待办(id: string): Promise<Todo> {
  const { data } = await api.post<Todo>(`/todos/${id}/restore`)
  return data
}

export async function 切换待办置顶(id: string): Promise<Todo> {
  const { data } = await api.post<Todo>(`/todos/${id}/toggle-pin`)
  return data
}

export async function 完成待办(id: string, occurredOn?: string): Promise<Todo> {
  const query = occurredOn ? `?occurred_on=${encodeURIComponent(occurredOn)}` : ''
  const { data } = await api.post<Todo>(`/todos/${id}/complete${query}`)
  return data
}

export async function 取消完成待办(id: string, occurredOn?: string): Promise<Todo> {
  const query = occurredOn ? `?occurred_on=${encodeURIComponent(occurredOn)}` : ''
  const { data } = await api.post<Todo>(`/todos/${id}/uncomplete${query}`)
  return data
}

export async function 获取待办完成历史(
  startDate: string,
  endDate: string,
): Promise<CompletionHistoryResponse> {
  const { data } = await api.get<CompletionHistoryResponse>('/stats/todos/completion-history', {
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  })
  return data
}
