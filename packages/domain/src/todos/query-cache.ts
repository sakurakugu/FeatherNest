import { QueryClient, type QueryKey } from '@tanstack/query-core'

export class 待办查询缓存 {
  readonly client: QueryClient
  private version = 0

  constructor(options: { gcTime?: number } = {}) {
    this.client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: options.gcTime ?? 300_000 } } })
  }

  获取版本() { return this.version }
  是否当前版本(version: number) { return version === this.version }

  async 查询<T>(key: QueryKey, request: (signal: AbortSignal) => Promise<T>): Promise<T> {
    return this.client.fetchQuery({ queryKey: key, queryFn: ({ signal }) => request(signal) })
  }

  失效() {
    this.version += 1
    void this.client.cancelQueries()
    void this.client.invalidateQueries({ refetchType: 'none' })
  }

  清空() {
    this.失效()
    this.client.clear()
  }
}
