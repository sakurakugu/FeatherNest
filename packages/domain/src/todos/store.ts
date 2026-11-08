import { defineStore } from 'pinia'
import { onScopeDispose, ref, watch } from 'vue'
import { isCancelledError } from '@tanstack/query-core'
import { 解析当前API基地址 } from '@feathernest/api'
import { 使用认证存储 } from '../auth/store'
import { 待办查询缓存 } from './query-cache'
import {
  完成待办 as 请求完成待办,
  创建待办,
  删除待办 as 请求删除待办,
  获取已删除待办 as 请求获取已删除待办,
  获取待办列表 as 请求获取待办列表,
  恢复待办 as 请求恢复待办,
  切换待办置顶,
  取消完成待办 as 请求取消完成待办,
  更新待办 as 请求更新待办,
} from './api'
import type { TodoListQuery } from './types'

export type {
  CompletionHistoryDay,
  CompletionHistoryItem,
  CompletionHistoryResponse,
  RecurrenceType,
  Todo,
  TodoCreateParams,
  TodoStatus,
  TodoTransferItem,
  TodoTransferPayload,
  TodoUpdateParams,
} from './types'
import type {
  Todo,
  TodoCreateParams,
  TodoUpdateParams,
} from './types'

export const 使用待办存储 = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const deletedTodos = ref<Todo[]>([])
  const loading = ref(false)
  const deletedLoaded = ref(false)

  const auth = 使用认证存储()
  const cache = new 待办查询缓存()
  const unsubscribe = cache.client.getQueryCache().subscribe(() => {
    loading.value = cache.client.isFetching() > 0
  })
  let scopeVersion = 0
  let listRequest = 0
  watch(() => [解析当前API基地址(), auth.user?.id] as const, () => {
    scopeVersion += 1
    cache.清空()
    todos.value = []
    deletedTodos.value = []
    deletedLoaded.value = false
    console.info('[待办缓存] 用户或 API 环境变化，已清空缓存')
  }, { flush: 'sync' })
  onScopeDispose(() => { unsubscribe(); cache.清空() })

  async function fetchTodos(params?: TodoListQuery) {
    const version = cache.获取版本()
    const request = ++listRequest
    try {
      const data = await cache.查询(['todos', params ?? {}], (signal) => 请求获取待办列表(params, signal))
      if (cache.是否当前版本(version) && request === listRequest) todos.value = data
    } catch (error) {
      if (!isCancelledError(error)) throw error
    }
  }

  async function fetchDeletedTodos() {
    const version = cache.获取版本()
    try {
      const data = await cache.查询(['deleted-todos'], (signal) => 请求获取已删除待办(signal))
      if (cache.是否当前版本(version)) {
        deletedTodos.value = data
        deletedLoaded.value = true
      }
    } catch (error) {
      if (!isCancelledError(error)) throw error
    }
  }

  async function 变更待办<T>(request: () => Promise<T>, apply: (data: T) => void): Promise<T> {
    const scope = scopeVersion
    const data = await request()
    if (scope === scopeVersion) {
      // 写入成功后取消较早的读取，避免旧列表覆盖刚完成的变更。
      cache.失效()
      apply(data)
    }
    return data
  }

  function 替换待办(data: Todo) {
    todos.value = todos.value.map((todo) => todo.id === data.id ? data : todo)
    deletedTodos.value = deletedTodos.value.map((todo) => todo.id === data.id ? data : todo)
  }

  function addTodo(body: TodoCreateParams) {
    return 变更待办(() => 创建待办(body), (data) => { todos.value = [data, ...todos.value] })
  }

  function updateTodo(id: string, body: TodoUpdateParams) {
    return 变更待办(() => 请求更新待办(id, body), 替换待办)
  }

  function deleteTodo(id: string) {
    return 变更待办(() => 请求删除待办(id, false), () => {
      const target = todos.value.find((todo) => todo.id === id)
      todos.value = todos.value.filter((todo) => todo.id !== id)
      if (target) {
        const deletedAt = new Date().toISOString()
        deletedTodos.value = [{ ...target, is_deleted: true, deleted_at: deletedAt, updated_at: deletedAt }, ...deletedTodos.value.filter((todo) => todo.id !== id)]
      }
    })
  }

  function permanentlyDeleteTodo(id: string) {
    return 变更待办(() => 请求删除待办(id, true), () => {
      deletedTodos.value = deletedTodos.value.filter((todo) => todo.id !== id)
    })
  }

  function restoreTodo(id: string) {
    return 变更待办(() => 请求恢复待办(id), (data) => {
      deletedTodos.value = deletedTodos.value.filter((todo) => todo.id !== id)
      todos.value = [data, ...todos.value.filter((todo) => todo.id !== id)]
    })
  }

  function togglePin(id: string) {
    return 变更待办(() => 切换待办置顶(id), (data) => {
      替换待办(data)
      todos.value = [...todos.value].sort((left, right) => {
        if (left.is_pinned !== right.is_pinned) return left.is_pinned ? -1 : 1
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      })
    })
  }

  async function toggleComplete(id: string) {
    const todo = todos.value.find((item) => item.id === id)
    if (!todo) return
    if (todo.status === 'done') {
      return uncompleteTodo(id)
    }
    return completeTodo(id)
  }

  function completeTodo(id: string, occurredOn?: string) {
    return 变更待办(() => 请求完成待办(id, occurredOn), 替换待办)
  }

  function uncompleteTodo(id: string, occurredOn?: string) {
    return 变更待办(() => 请求取消完成待办(id, occurredOn), 替换待办)
  }

  return {
    todos,
    deletedTodos,
    loading,
    deletedLoaded,
    fetchTodos,
    fetchDeletedTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    permanentlyDeleteTodo,
    restoreTodo,
    togglePin,
    toggleComplete,
    completeTodo,
    uncompleteTodo,
  }
})
