// 此文件由 npm run generate:api 自动生成，请勿手动修改。
export interface paths {
  '/todos/tags': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['list_todo_tags_todos_tags_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/todos': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['list_todos_todos_get']
    put?: never
    post: operations['create_todo_todos_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/todos/{todo_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['delete_todo_todos__todo_id__delete']
    options?: never
    head?: never
    patch: operations['update_todo_todos__todo_id__patch']
    trace?: never
  }
  '/todos/{todo_id}/toggle-pin': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['toggle_pin_todos__todo_id__toggle_pin_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/todos/{todo_id}/complete': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['complete_todo_todos__todo_id__complete_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/todos/{todo_id}/uncomplete': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u53D6\u6D88\u5B8C\u6210\u5F85\u529E_todos__todo_id__uncomplete_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/todos/{todo_id}/restore': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['restore_todo_todos__todo_id__restore_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/stats/todos/completion-history': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['todo_completion_history_stats_todos_completion_history_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}
export type webhooks = Record<string, never>
export interface components {
  schemas: {
    HTTPValidationError: {
      detail?: components['schemas']['ValidationError'][]
    }
    RecurrenceType:
      | 'none'
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'yearly'
      | 'workday'
      | 'weekend'
      | 'holiday'
      | 'custom'
    TodoCreate: {
      title: string
      description?: string | null
      importance?: number
      urgency?: number
      start_date?: string | null
      end_date?: string | null
      is_pinned?: boolean
      tags?: string[] | null
      recurrence_type?: components['schemas']['RecurrenceType']
      recurrence_interval?: number
      recurrence_count?: number
      times_per_interval?: number
    }
    TodoRead: {
      id: string
      title: string
      description: string | null
      status: components['schemas']['TodoStatus']
      importance: number
      urgency: number
      start_date: string | null
      end_date: string | null
      is_pinned: boolean
      is_deleted: boolean
      deleted_at: string | null
      tags: string[] | null
      recurrence_type: components['schemas']['RecurrenceType']
      recurrence_interval: number
      recurrence_count: number
      times_per_interval: number
      interval_progress: number
      progress_reset_at: string | null
      created_at: string
      updated_at: string
    }
    TodoStatus: 'todo' | 'done'
    TodoTagRead: {
      name: string
      count: number
    }
    TodoUpdate: {
      title?: string | null
      description?: string | null
      status?: components['schemas']['TodoStatus'] | null
      importance?: number | null
      urgency?: number | null
      start_date?: string | null
      end_date?: string | null
      is_pinned?: boolean | null
      is_deleted?: boolean | null
      tags?: string[] | null
      recurrence_type?: components['schemas']['RecurrenceType'] | null
      recurrence_interval?: number | null
      recurrence_count?: number | null
      times_per_interval?: number | null
      interval_progress?: number | null
    }
    ValidationError: {
      loc: (string | number)[]
      msg: string
      type: string
      input?: unknown
      ctx?: Record<string, never>
    }
    ________: {
      start_date: string
      end_date: string
      max_completed_count: number
      total_completed_count: number
      max_score: number
      total_score: number
      days: components['schemas']['app__modules__system__schemas_____________2'][]
    }
    app__modules__system__schemas_____________1: {
      todo_id: string
      title: string
      completed_count: number
      normalized_score: number
    }
    app__modules__system__schemas_____________2: {
      date: string
      completed_count: number
      score: number
      items: components['schemas']['app__modules__system__schemas_____________1'][]
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export interface operations {
  list_todo_tags_todos_tags_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoTagRead'][]
        }
      }
    }
  }
  list_todos_todos_get: {
    parameters: {
      query?: {
        status?: components['schemas']['TodoStatus'] | null
        tag?: string | null
        is_deleted?: boolean
        is_pinned?: boolean | null
        sort_by?: string
        sort_desc?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  create_todo_todos_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['TodoCreate']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  delete_todo_todos__todo_id__delete: {
    parameters: {
      query?: {
        permanent?: boolean
      }
      header?: never
      path: {
        todo_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  update_todo_todos__todo_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        todo_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['TodoUpdate']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  toggle_pin_todos__todo_id__toggle_pin_post: {
    parameters: {
      query?: never
      header?: never
      path: {
        todo_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  complete_todo_todos__todo_id__complete_post: {
    parameters: {
      query?: {
        occurred_on?: string | null
      }
      header?: never
      path: {
        todo_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u53D6\u6D88\u5B8C\u6210\u5F85\u529E_todos__todo_id__uncomplete_post': {
    parameters: {
      query?: {
        occurred_on?: string | null
      }
      header?: never
      path: {
        todo_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  restore_todo_todos__todo_id__restore_post: {
    parameters: {
      query?: never
      header?: never
      path: {
        todo_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  todo_completion_history_stats_todos_completion_history_get: {
    parameters: {
      query: {
        start_date: string
        end_date: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['________']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
}
