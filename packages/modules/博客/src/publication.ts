import api from '@feathernest/api'
import type { ArticleRecord } from '@feathernest/module-articles'

export type BlogVisibility = 'public' | 'login_required'
export type BlogManageState = 'all' | 'published' | 'unpublished' | 'changed'

export interface BlogManageItem {
  id: string
  title: string
  word_count: number
  revision: number
  has_unpublished_changes: boolean
  publication: {
    title: string
    word_count: number
    slug: string
    visibility: BlogVisibility
    is_published: boolean
    version: number
    published_at: string
    updated_at: string
    view_count: number
    like_count: number
  } | null
}

export interface BlogManageResponse {
  items: BlogManageItem[]
  total: number
  pages: number
}

export type BlogManageSortField =
  | 'updated_at'
  | 'published_at'
  | 'title'
  | 'status'
  | 'visibility'
  | 'word_count'
  | 'version'
  | 'view_count'
  | 'like_count'

export interface BlogManageQuery {
  page?: number
  pageSize?: number
  state?: BlogManageState
  search?: string
  /** 可见性筛选，none 表示还没有发布快照，空字符串表示不筛选 */
  visibility?: BlogVisibility | 'none' | ''
  /** 是否有封面，null 表示不筛选 */
  hasCover?: boolean | null
  /** 排序字段，空字符串表示使用默认排序 */
  sortBy?: BlogManageSortField | ''
  sortOrder?: 'asc' | 'desc'
}

function 构建管理参数(查询: BlogManageQuery) {
  const params: Record<string, string | number | boolean> = {
    page: 查询.page ?? 1,
    page_size: 查询.pageSize ?? 20,
    state: 查询.state ?? 'all',
    search: 查询.search ?? '',
    sort_order: 查询.sortOrder ?? 'desc',
  }
  if (查询.visibility) params.visibility = 查询.visibility
  if (查询.hasCover !== undefined && 查询.hasCover !== null) params.has_cover = 查询.hasCover
  if (查询.sortBy) params.sort_by = 查询.sortBy
  return params
}

export async function 获取博客管理列表(查询: BlogManageQuery = {}): Promise<BlogManageResponse> {
  const { data } = await api.get<BlogManageResponse>('/articles/blog/manage', {
    params: 构建管理参数(查询),
  })
  return data
}

/** 各发布状态的文章数量，用于页签角标；会带上当前的搜索与筛选条件。 */
export async function 获取博客管理统计(
  基础查询: Omit<BlogManageQuery, 'page' | 'pageSize' | 'state'> = {},
): Promise<Record<BlogManageState, number>> {
  const states: BlogManageState[] = ['all', 'published', 'unpublished', 'changed']
  const results = await Promise.all(
    states.map((state) => 获取博客管理列表({ ...基础查询, state, pageSize: 1 })),
  )
  return {
    all: results[0].total,
    published: results[1].total,
    unpublished: results[2].total,
    changed: results[3].total,
  }
}

export async function 获取已发布博客总数(): Promise<number> {
  // 已发布状态的总数即可代表已发布文章数量，无需逐页统计
  return (await 获取博客管理列表({ state: 'published', pageSize: 1 })).total
}

/** 各可见性的文章数量，用于可见性页签角标。 */
export async function 获取博客可见性统计(): Promise<
  Record<BlogVisibility | 'all' | 'none', number>
> {
  const [全部, 公开, 登录可见] = await Promise.all([
    获取博客管理列表({ state: 'all', pageSize: 1 }),
    获取博客管理列表({ state: 'all', pageSize: 1, visibility: 'public' }),
    获取博客管理列表({ state: 'all', pageSize: 1, visibility: 'login_required' }),
  ])
  return {
    all: 全部.total,
    public: 公开.total,
    login_required: 登录可见.total,
    // 还没有发布快照的文章
    none: Math.max(0, 全部.total - 公开.total - 登录可见.total),
  }
}

export async function 获取博客发布快照(id: string): Promise<ArticleRecord> {
  const { data } = await api.get<ArticleRecord>(`/articles/blog/${id}/snapshot`)
  return data
}

export async function 发布博客文章(
  id: string,
  revision: number,
  visibility: BlogVisibility,
): Promise<BlogManageItem> {
  const { data } = await api.post<BlogManageItem>(`/articles/blog/${id}/publish`, {
    expected_revision: revision,
    visibility,
  })
  return data
}

export async function 设置博客可见性(id: string, visibility: BlogVisibility): Promise<void> {
  await api.patch(`/articles/blog/${id}/visibility`, { visibility })
}

export async function 撤下博客发布(id: string): Promise<void> {
  await api.post(`/articles/blog/${id}/withdraw`)
}
