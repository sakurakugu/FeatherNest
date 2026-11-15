export type FriendLinkStatus = 'pending' | 'approved' | 'rejected'
export type FriendLinkSortField =
  | 'name'
  | 'url'
  | 'description'
  | 'status'
  | 'category'
  | 'contact_name'
  | 'is_auto_exchange'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at'

export interface FriendLinkListQuery {
  status?: FriendLinkStatus | ''
  is_deleted?: boolean
  search?: string
  category?: string
  uncategorized?: boolean
  is_auto_exchange?: boolean
  sort_by?: FriendLinkSortField
  sort_order?: 'asc' | 'desc'
}

export interface FriendLinkCounts {
  total: number
  pending: number
  approved: number
  rejected: number
  active_total: number
  recycle_bin: number
  categories: { category: string; count: number }[]
}

export interface FriendLinkRecord {
  id: string
  name: string
  url: string
  description: string | null
  logo_url: string | null
  category: string | null
  status: FriendLinkStatus
  is_auto_exchange: boolean
  is_deleted: boolean
  deleted_at: string | null
  contact_name?: string | null
  contact_email?: string | null
  created_at?: string
  updated_at?: string
}

export interface FriendLinkListResponse {
  items: FriendLinkRecord[]
  total: number
  page: number
  page_size: number
  pages: number
  counts: FriendLinkCounts
}

export interface FriendLinkAdminPayload {
  name: string
  url: string
  description: string
  logo_url: string
  category: string
  status: FriendLinkStatus
  contact_name?: string | null
  contact_email?: string | null
}

/** 站点访客主动申请/交换友链的请求体 */
export interface FriendLinkExchangePayload {
  name: string
  url: string
  description?: string | null
  logo_url?: string | null
  category?: string | null
  contact_email?: string | null
  contact_name?: string | null
  /** 申请人的友链页面，后端会去这个页面检查有没有挂本站链接 */
  my_site_url: string
}

export interface FriendLinkExchangeResult {
  message: string
  /** 检测到回链时为 true，申请直接通过；否则进待审核 */
  auto_approved: boolean
  link: FriendLinkRecord
}
