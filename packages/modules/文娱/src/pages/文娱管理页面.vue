<script setup lang="ts">
import {
  Delete,
  Filter,
  Hide,
  Link,
  Plus,
  RefreshLeft,
  Search,
  Star,
  Upload,
  View,
} from '@element-plus/icons-vue'
import { useInfiniteScroll, useStorage, watchDebounced } from '@vueuse/core'
import {
  ElAutocomplete,
  ElButton,
  ElIcon,
  ElImageViewer,
  ElInput,
  ElMessage,
  ElPopconfirm,
  ElPopover,
  ElRate,
  ElSkeleton,
  ElTooltip,
} from 'element-plus'
import {
  BaseDialog,
  格式化短日期,
  格式化完整时间,
  格式化相对时间,
  PencilEditIcon,
  SortDirectionIcon,
  SortOrderControl,
  TagInlineInput,
} from '@feathernest/ui'
import '@feathernest/ui/styles/manager.css'
import { 获取API错误消息 } from '@feathernest/api'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  上传文娱封面,
  从外部URL导入封面,
  从外部导入文娱,
  创建文娱,
  删除文娱,
  恢复文娱,
  搜索外部文娱,
  更新文娱,
  获取文娱个人标签统计,
  获取文娱列表,
  获取文娱创作者建议,
  获取文娱子分类统计,
  获取文娱详情,
  获取文娱标签统计,
  获取文娱类型统计,
  获取公开文娱列表,
} from '../api'
import { 获取文娱状态标签, 获取文娱状态选项 } from '../display'
import { 获取评分展示 } from '../rating'
import MediaRating from '../components/评分展示.vue'
import type {
  ExternalMediaCandidate,
  MediaCreatorSuggestion,
  MediaFilterStat,
  MediaListQuery,
  MediaPayload,
  MediaRecord,
  MediaSortField,
  MediaStatus,
  MediaType,
} from '../types'

interface MediaFormState {
  title: string
  original_title: string
  media_type: MediaType
  status: MediaStatus
  rating: number | null
  creator: string
  genres_text: string
  tags_text: string
  personal_tags_text: string
  summary: string
  description: string
  cover_file_name: string
  external_cover_url: string
  external_cover_provider: string
  external_cover_id: string
  is_visible: boolean
}

const emit = defineEmits<{ 'media-count-change': [count: number] }>()
const route = useRoute()
const router = useRouter()

const 每页条数 = 24

/** 主分类选项，顺序即页签顺序 */
const 主分类选项: Array<{ label: string; value: MediaType }> = [
  { label: '游戏', value: 'game' },
  { label: '小说', value: 'novel' },
  { label: '书籍', value: 'book' },
  { label: '动画', value: 'anime' },
  { label: '漫画', value: 'comic' },
  { label: '电影', value: 'movie' },
  { label: '剧集', value: 'tv' },
  { label: '音乐', value: 'music' },
  { label: '其他', value: 'other' },
]

const 外部数据源选项 = [
  { label: '全部来源', value: '' },
  { label: 'Bangumi', value: 'bangumi' },
  { label: 'AniList', value: 'anilist' },
  { label: 'Google Books', value: 'google_books' },
  { label: 'Open Library', value: 'open_library' },
  { label: '起点', value: 'qidian' },
  { label: 'VNDB', value: 'vndb' },
  { label: 'TMDB', value: 'tmdb' },
  { label: 'RAWG', value: 'rawg' },
  { label: 'IGDB', value: 'igdb' },
]

// 列表状态
const 列表 = ref<MediaRecord[]>([])
const 总数 = ref(0)
const 页数 = ref(1)
const 当前页 = ref(1)
const 初次加载 = ref(true)
const 刷新中 = ref(false)
const 加载更多中 = ref(false)
const 加载失败 = ref(false)
const 失败请求为追加 = ref(false)
const 列表容器 = ref<HTMLElement | null>(null)
const 视图 = useStorage<'table' | 'cards'>('feathernest.media-manager.view', 'table')
const 回收站模式 = ref(false)
const 回收站总数 = ref(0)
const 公开总数 = ref(0)
const 主分类统计 = ref<MediaFilterStat[]>([])

// 筛选条件
const 搜索词 = ref('')
const 已应用搜索 = ref('')
const 当前主分类 = ref<MediaType | ''>('')
const 当前状态 = ref<MediaStatus | ''>('')
const 当前外部分类 = ref('')
const 当前外部标签 = ref('')
const 当前个人标签 = ref('')
const 外部分类选项 = ref<string[]>([])
const 外部标签选项 = ref<string[]>([])
const 个人标签选项 = ref<string[]>([])

// 排序
const 排序字段 = ref<MediaSortField | ''>('')
const 排序方向 = ref<'asc' | 'desc'>('desc')
const 排序选项 = computed<Array<{ value: MediaSortField; label: string }>>(() => [
  { value: 'updated_at', label: '最近编辑' },
  {
    value: 回收站模式.value ? 'deleted_at' : 'created_at',
    label: 回收站模式.value ? '删除时间' : '创建时间',
  },
  { value: 'title', label: '名称' },
  { value: 'media_type', label: '主分类' },
  { value: 'status', label: '状态' },
  { value: 'rating', label: '评分' },
  { value: 'creator', label: '创作者' },
  { value: 'genres', label: '外部分类' },
  { value: 'tags', label: '外部标签' },
  { value: 'personal_tags', label: '个人标签' },
  { value: 'is_visible', label: '公开' },
  { value: 'release_date', label: '发行日期' },
])

// 列配置
const 作品列 = computed(
  () =>
    [
      { value: 'title', label: '作品', width: 'minmax(220px, 1.7fr)', minWidth: 220 },
      { value: 'media_type', label: '主分类', width: '88px', minWidth: 88 },
      { value: 'status', label: '状态', width: '92px', minWidth: 92 },
      { value: 'rating', label: '评分', width: '132px', minWidth: 132 },
      { value: 'creator', label: '创作者', width: '140px', minWidth: 140 },
      { value: 'genres', label: '外部分类', width: 'minmax(130px, 1fr)', minWidth: 130 },
      { value: 'tags', label: '外部标签', width: 'minmax(130px, 1fr)', minWidth: 130 },
      { value: 'personal_tags', label: '个人标签', width: 'minmax(130px, 1fr)', minWidth: 130 },
      { value: 'visible', label: '公开', width: '80px', minWidth: 80 },
      {
        value: 'date',
        label: '创建时间',
        width: '140px',
        minWidth: 140,
      },
      { value: 'updated_at', label: '最近编辑', width: '140px', minWidth: 140 },
    ] as const,
)
type 作品列值 = (typeof 作品列.value)[number]['value']
const 可见列 = useStorage<作品列值[]>('feathernest.media-manager.columns', [
  'title',
  'media_type',
  'status',
  'rating',
  'creator',
  'date',
])
const 展示列 = computed(() => 作品列.value.filter((列) => 可见列.value.includes(列.value)))
const 网格列 = computed(() => [...展示列.value.map((列) => 列.width), '104px'].join(' '))
const 表格最小宽度 = computed(
  () => `${展示列.value.reduce((总宽, 列) => 总宽 + 列.minWidth + 16, 104)}px`,
)

function 切换列(列: 作品列值) {
  if (列 === 'title') return
  可见列.value = 可见列.value.includes(列)
    ? 可见列.value.filter((item) => item !== 列)
    : [...可见列.value, 列]
}

// 编辑弹窗
const 弹窗打开 = ref(false)
const 保存中 = ref(false)
const 当前ID = ref('')
const 当前封面名称 = ref('')
const 当前封面预览地址 = ref('')
const 当前外部封面地址 = ref('')
const 当前外部封面来源 = ref('')
const 当前外部封面ID = ref('')

function 创建空表单(): MediaFormState {
  return {
    title: '',
    original_title: '',
    media_type: 'anime',
    status: 'done',
    rating: null,
    creator: '',
    genres_text: '',
    tags_text: '',
    personal_tags_text: '',
    summary: '',
    description: '',
    cover_file_name: '',
    external_cover_url: '',
    external_cover_provider: '',
    external_cover_id: '',
    is_visible: true,
  }
}

const 表单 = ref<MediaFormState>(创建空表单())
const 表单评分星数 = computed({
  get() {
    if (表单.value.rating == null || 表单.value.rating <= 3) {
      return 0
    }
    return 获取评分展示(表单.value.rating).starValue
  },
  set(值: number) {
    const 标准化星数 = Math.max(0, Math.min(6, Math.round(值 * 2) / 2))
    表单.value.rating = 标准化星数 <= 0 ? null : Math.round(标准化星数 * 2 + 3)
  },
})

// 表单内的建议项
const 表单外部分类建议 = ref<string[]>([])
const 表单外部标签建议 = ref<string[]>([])
const 表单个人标签建议 = ref<string[]>([])
const 全部分类 = ref<string[]>([])
const 全部标签 = ref<string[]>([])
const 全部个人标签 = ref<string[]>([])

const 对话框标题 = computed(() => (当前ID.value ? '编辑作品' : '新增作品'))
const 对话框副标题 = computed(() =>
  当前ID.value ? '修改后立即同步到博客作品推荐' : '补全作品信息，保存后可在博客展示',
)

const 可选分类建议 = computed(() => 获取可用建议项(表单.value.genres_text, 表单外部分类建议.value))
const 可选标签建议 = computed(() => 获取可用建议项(表单.value.tags_text, 表单外部标签建议.value))
const 可选个人标签建议 = computed(() =>
  获取可用建议项(表单.value.personal_tags_text, 表单个人标签建议.value),
)
const 不属于当前主分类的分类 = computed(() =>
  获取跨分类提示项(表单.value.genres_text, 全部分类.value, 表单外部分类建议.value),
)
const 不属于当前主分类的标签 = computed(() =>
  获取跨分类提示项(表单.value.tags_text, 全部标签.value, 表单外部标签建议.value),
)
const 不属于当前主分类的个人标签 = computed(() =>
  获取跨分类提示项(表单.value.personal_tags_text, 全部个人标签.value, 表单个人标签建议.value),
)

// 封面
const 封面搜索关键词 = ref('')
const 封面搜索来源 = ref('')
const 封面搜索中 = ref(false)
const 封面搜索结果 = ref<ExternalMediaCandidate[]>([])
const 本地封面输入 = ref<HTMLInputElement | null>(null)
const 本地封面文件 = ref<File | null>(null)
const 本地封面预览 = ref('')
const 当前封面预览 = computed(
  () => 本地封面预览.value || 表单.value.external_cover_url || 当前封面预览地址.value,
)
const 当前封面文本 = computed(
  () =>
    本地封面文件.value?.name ||
    表单.value.cover_file_name ||
    表单.value.external_cover_url ||
    (当前封面预览地址.value ? '已保存封面' : ''),
)
const 存在待上传封面 = computed(() => {
  if (本地封面文件.value) {
    return true
  }
  if (!表单.value.external_cover_url) {
    return false
  }
  if (!当前ID.value) {
    return true
  }
  return (
    表单.value.external_cover_url !== 当前外部封面地址.value ||
    表单.value.external_cover_provider !== 当前外部封面来源.value ||
    表单.value.external_cover_id !== 当前外部封面ID.value
  )
})

// 创作者建议
const 创作者建议 = ref<MediaCreatorSuggestion[]>([])
const 创作者建议加载中 = ref(false)
let 创作者建议序号 = 0

const 状态选项: Array<{ value: MediaStatus; label: string }> = [
  { value: 'planned', label: '想做' },
  { value: 'doing', label: '在做' },
  { value: 'done', label: '做过' },
  { value: 'paused', label: '搁置' },
  { value: 'dropped', label: '弃坑' },
]
const 筛选条件数 = computed(
  () =>
    Number(Boolean(当前状态.value)) +
    Number(Boolean(当前外部分类.value)) +
    Number(Boolean(当前外部标签.value)) +
    Number(Boolean(当前个人标签.value)),
)
const 页头统计 = computed(() => {
  if (回收站模式.value) {
    return `共 ${回收站总数.value} 条回收站作品 · 删除后保留 30 天`
  }
  return `共 ${全部作品数.value} 部作品 · ${公开总数.value} 部公开展示`
})
const 主分类页签 = computed(() =>
  主分类选项
    .map((项) => ({
      ...项,
      数量: 主分类统计.value.find((统计) => 统计.name === 项.value)?.count ?? 0,
    }))
    .filter((项) => 项.数量 > 0),
)
const 全部作品数 = computed(() => 主分类统计.value.reduce((合计, 项) => 合计 + 项.count, 0))
const 还有更多 = computed(() => 当前页.value < 页数.value)
const 空状态文案 = computed(() => {
  if (加载失败.value) return '作品加载失败，请稍后重试'
  if (回收站模式.value) return '回收站暂无作品'
  if (已应用搜索.value || 筛选条件数.value) return '暂无符合条件的作品'
  return '还没有作品，点右上角「新增作品」开始记录'
})

let 请求序号 = 0

/* ==========================================================================
   数据请求
   ========================================================================== */
async function 拉取列表(追加 = false) {
  if (追加 && (加载更多中.value || 刷新中.value || 初次加载.value || !还有更多.value)) return
  const 序号 = 追加 ? 请求序号 : ++请求序号
  const 请求页 = 追加 ? 当前页.value + 1 : 1
  if (追加) {
    加载更多中.value = true
  } else {
    刷新中.value = !初次加载.value
    加载更多中.value = false
  }
  加载失败.value = false
  try {
    const 查询: MediaListQuery = {
      page: 请求页,
      page_size: 每页条数,
      keyword: 已应用搜索.value,
      media_type: 当前主分类.value,
      status: 当前状态.value,
      genre: 当前外部分类.value || undefined,
      tag: 当前外部标签.value || undefined,
      personal_tag: 当前个人标签.value || undefined,
      is_deleted: 回收站模式.value,
      sort_by: 排序字段.value || undefined,
      sort_order: 排序字段.value ? 排序方向.value : undefined,
    }
    const 数据 = await 获取文娱列表(查询)
    if (序号 !== 请求序号) return
    列表.value = 追加 ? [...列表.value, ...数据.items] : 数据.items
    当前页.value = 请求页
    总数.value = 数据.total
    页数.value = Math.max(1, 数据.pages)
    if (!追加 && 列表容器.value) 列表容器.value.scrollTop = 0
    if (!追加) void 刷新角标()
  } catch (错误) {
    if (序号 !== 请求序号) return
    加载失败.value = true
    失败请求为追加.value = 追加
    console.error('[文娱管理] 列表加载失败', { 请求页, 追加, 错误 })
    ElMessage.error(获取API错误消息(错误, '加载作品列表失败'))
  } finally {
    if (序号 === 请求序号) {
      刷新中.value = false
      加载更多中.value = false
      初次加载.value = false
    }
  }
}

/** 主分类角标、公开 / 回收站数量与侧栏作品数 */
async function 刷新角标() {
  try {
    const [类型统计, 回收站数据, 公开数据] = await Promise.all([
      获取文娱类型统计(),
      获取文娱列表({ page: 1, page_size: 1, is_deleted: true }),
      获取公开文娱列表({ page: 1, page_size: 1 }),
    ])
    主分类统计.value = 类型统计
    回收站总数.value = 回收站数据.total
    公开总数.value = 公开数据.total
    emit(
      'media-count-change',
      类型统计.reduce((合计, 项) => 合计 + 项.count, 0),
    )
  } catch (错误) {
    console.error('[文娱管理] 角标统计加载失败', 错误)
  }
}

/** 按当前主分类加载筛选用的分类 / 标签候选 */
async function 加载筛选选项() {
  const 主分类 = 当前主分类.value || undefined
  try {
    const [分类, 标签, 个人标签] = await Promise.all([
      获取文娱子分类统计(主分类),
      获取文娱标签统计(主分类),
      获取文娱个人标签统计(主分类),
    ])
    外部分类选项.value = 分类.map((项) => 项.name)
    外部标签选项.value = 标签.map((项) => 项.name)
    个人标签选项.value = 个人标签.map((项) => 项.name)
    if (当前外部分类.value && !外部分类选项.value.includes(当前外部分类.value)) {
      当前外部分类.value = ''
    }
    if (当前外部标签.value && !外部标签选项.value.includes(当前外部标签.value)) {
      当前外部标签.value = ''
    }
    if (当前个人标签.value && !个人标签选项.value.includes(当前个人标签.value)) {
      当前个人标签.value = ''
    }
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '加载筛选选项失败'))
  }
}

/** 表单里的跨分类提示需要全量候选 */
async function 加载全部标签候选() {
  try {
    const [分类, 标签, 个人标签] = await Promise.all([
      获取文娱子分类统计(),
      获取文娱标签统计(),
      获取文娱个人标签统计(),
    ])
    全部分类.value = 分类.map((项) => 项.name)
    全部标签.value = 标签.map((项) => 项.name)
    全部个人标签.value = 个人标签.map((项) => 项.name)
  } catch (错误) {
    console.error('[文娱管理] 标签候选加载失败', 错误)
  }
}

async function 加载表单建议(主分类: MediaType) {
  try {
    const [分类, 标签, 个人标签] = await Promise.all([
      获取文娱子分类统计(主分类),
      获取文娱标签统计(主分类),
      获取文娱个人标签统计(主分类),
    ])
    表单外部分类建议.value = 分类.map((项) => 项.name)
    表单外部标签建议.value = 标签.map((项) => 项.name)
    表单个人标签建议.value = 个人标签.map((项) => 项.name)
  } catch (错误) {
    console.error('[文娱管理] 表单建议加载失败', 错误)
  }
}

useInfiniteScroll(列表容器, () => 拉取列表(true), {
  distance: 160,
  canLoadMore: () =>
    还有更多.value && !初次加载.value && !刷新中.value && !加载更多中.value && !加载失败.value,
})

watchDebounced(
  搜索词,
  (值) => {
    已应用搜索.value = 值.trim()
  },
  { debounce: 300 },
)

watch(已应用搜索, () => {
  void 拉取列表()
})

watch(当前主分类, () => {
  当前外部分类.value = ''
  当前外部标签.value = ''
  当前个人标签.value = ''
  void 加载筛选选项()
  void 拉取列表()
})

watch([当前状态, 当前外部分类, 当前外部标签, 当前个人标签, 排序字段, 排序方向], () => {
  void 拉取列表()
})

/* ==========================================================================
   筛选 / 排序 / 回收站
   ========================================================================== */
function 切换主分类(主分类: MediaType | '') {
  if (当前主分类.value === 主分类) return
  当前主分类.value = 主分类
}

function 切换状态(状态: MediaStatus | '') {
  当前状态.value = 当前状态.value === 状态 ? '' : 状态
}

function 切换筛选项(当前值: string, 值: string) {
  return 当前值 === 值 ? '' : 值
}

function 切换外部分类(值: string) {
  当前外部分类.value = 切换筛选项(当前外部分类.value, 值)
}

function 切换外部标签(值: string) {
  当前外部标签.value = 切换筛选项(当前外部标签.value, 值)
}

function 切换个人标签(值: string) {
  当前个人标签.value = 切换筛选项(当前个人标签.value, 值)
}

/** 同字段点击循环：升序 → 降序 → 取消排序 */
function 切换排序(字段: MediaSortField) {
  if (排序字段.value !== 字段) {
    排序字段.value = 字段
    排序方向.value = 'asc'
  } else if (排序方向.value === 'asc') {
    排序方向.value = 'desc'
  } else {
    排序字段.value = ''
    排序方向.value = 'desc'
  }
}

function 排序图标方向(字段: MediaSortField | '' | null): 'asc' | 'desc' | '' {
  if (!字段 || 排序字段.value !== 字段) return ''
  return 排序方向.value
}

function 设置排序方向(方向: 'asc' | 'desc') {
  排序字段.value ||= 回收站模式.value ? 'deleted_at' : 'updated_at'
  排序方向.value = 方向
  console.info('[作品推荐] 排序已更新', { 字段: 排序字段.value, 方向 })
}

/** 列表表头哪些列支持排序 */
function 列排序字段(列值: 作品列值): MediaSortField | null {
  switch (列值) {
    case 'media_type':
    case 'status':
    case 'creator':
    case 'genres':
    case 'tags':
    case 'personal_tags':
      return 列值
    case 'visible':
      return 'is_visible'
    case 'title':
      return 'title'
    case 'rating':
      return 'rating'
    case 'date':
      return 回收站模式.value ? 'deleted_at' : 'created_at'
    case 'updated_at':
      return 'updated_at'
    default:
      return null
  }
}

function 列标题(列: (typeof 作品列.value)[number]) {
  if (列.value === 'date') {
    return 回收站模式.value ? '删除时间' : '创建时间'
  }
  return 列.label
}

function 清除筛选() {
  当前状态.value = ''
  当前外部分类.value = ''
  当前外部标签.value = ''
  当前个人标签.value = ''
  排序字段.value = ''
  排序方向.value = 'desc'
}

function 切换回收站() {
  回收站模式.value = !回收站模式.value
  当前主分类.value = ''
  当前状态.value = ''
  当前外部分类.value = ''
  当前外部标签.value = ''
  当前个人标签.value = ''
  搜索词.value = ''
  已应用搜索.value = ''
  排序字段.value = ''
  排序方向.value = 'desc'
  void 拉取列表()
}

function 重试加载() {
  void 拉取列表(失败请求为追加.value)
}

/* ==========================================================================
   展示辅助
   ========================================================================== */
const 状态徽标颜色: Record<MediaStatus, string> = {
  planned: '#3b82f6',
  doing: '#22c55e',
  done: '#f59e0b',
  paused: '#64748b',
  dropped: '#ef4444',
}

function 主分类标签(类型: MediaType) {
  return 主分类选项.find((项) => 项.value === 类型)?.label || 类型
}

function 获取封面(作品: MediaRecord) {
  return 作品.primary_cover_asset?.thumbnail_url || 作品.primary_cover_asset?.url || ''
}

// 点击列表封面缩略图放大查看
const 预览封面地址 = ref('')

function 打开封面预览(作品: MediaRecord) {
  const 地址 =
    作品.primary_cover_asset?.preview_url ||
    作品.primary_cover_asset?.url ||
    作品.primary_cover_asset?.thumbnail_url ||
    ''
  if (地址) {
    预览封面地址.value = 地址
  }
}

function 获取评分摘要(评分: number) {
  return 获取评分展示(评分).label
}

function 获取表单评分说明() {
  if (表单.value.rating == null) {
    return '未评分'
  }
  return 获取评分展示(表单.value.rating).label
}

function 选择表单评分(评分: number | null) {
  表单.value.rating = 评分
}

function 标签文本(标签列表: string[], 上限 = 3) {
  return 标签列表.slice(0, 上限).join('、')
}

function 标签完整文本(标签列表: string[]) {
  return 标签列表.join('、')
}

/* ==========================================================================
   编辑 / 提交
   ========================================================================== */
function 解析标签文本(文本: string): string[] {
  return 文本
    .replaceAll('，', ',')
    .split(',')
    .map((项) => 项.trim())
    .filter(Boolean)
}

function 获取可用建议项(当前文本: string, 候选: string[]): string[] {
  const 已有 = new Set(解析标签文本(当前文本))
  return 候选.filter((项) => !已有.has(项))
}

function 获取跨分类提示项(当前文本: string, 全部: string[], 当前范围: string[]): string[] {
  const 全部集合 = new Set(全部)
  const 范围集合 = new Set(当前范围)
  return 解析标签文本(当前文本).filter((项) => 全部集合.has(项) && !范围集合.has(项))
}

function 追加建议项(当前文本: string, 项: string): string {
  const 列表项 = 解析标签文本(当前文本)
  if (!列表项.includes(项)) {
    列表项.push(项)
  }
  return 列表项.join(', ')
}

function 构建请求体(): MediaPayload {
  return {
    title: 表单.value.title.trim(),
    original_title: 表单.value.original_title.trim() || null,
    media_type: 表单.value.media_type,
    status: 表单.value.status,
    rating: 表单.value.rating,
    creator: 表单.value.creator.trim() || null,
    genres: 解析标签文本(表单.value.genres_text),
    tags: 解析标签文本(表单.value.tags_text),
    personal_tags: 解析标签文本(表单.value.personal_tags_text),
    summary: 表单.value.summary.trim() || null,
    description: 表单.value.description.trim() || null,
    is_visible: 表单.value.is_visible,
  }
}

function 释放本地封面预览() {
  if (!本地封面预览.value) {
    return
  }
  URL.revokeObjectURL(本地封面预览.value)
  本地封面预览.value = ''
}

function 清理本地封面选择() {
  释放本地封面预览()
  本地封面文件.value = null
  if (本地封面输入.value) {
    本地封面输入.value.value = ''
  }
}

function 恢复当前封面信息() {
  表单.value.cover_file_name = 当前封面名称.value
  表单.value.external_cover_url = 当前外部封面地址.value
  表单.value.external_cover_provider = 当前外部封面来源.value
  表单.value.external_cover_id = 当前外部封面ID.value
}

function 重置表单() {
  清理本地封面选择()
  表单.value = 创建空表单()
  当前ID.value = ''
  当前封面名称.value = ''
  当前封面预览地址.value = ''
  当前外部封面地址.value = ''
  当前外部封面来源.value = ''
  当前外部封面ID.value = ''
  封面搜索关键词.value = ''
  封面搜索结果.value = []
}

function 从记录填充表单(记录: MediaRecord) {
  const 已有封面名称 =
    记录.primary_cover_asset?.original_name ?? 记录.primary_cover_asset?.external_url ?? ''
  const 已有外部封面地址 = 记录.primary_cover_asset?.external_url ?? ''
  表单.value = {
    title: 记录.title,
    original_title: 记录.original_title ?? '',
    media_type: 记录.media_type,
    status: 记录.status,
    rating: 记录.rating,
    creator: 记录.creator ?? '',
    genres_text: 记录.genres.join(', '),
    tags_text: 记录.tags.join(', '),
    personal_tags_text: (记录.personal_tags || []).join(', '),
    summary: 记录.summary ?? '',
    description: 记录.description ?? '',
    cover_file_name: 已有封面名称,
    external_cover_url: 已有外部封面地址,
    external_cover_provider: 记录.primary_cover_asset?.source_provider ?? '',
    external_cover_id: 记录.primary_cover_asset?.source_asset_id ?? '',
    is_visible: 记录.is_visible,
  }
  清理本地封面选择()
  当前ID.value = 记录.id
  当前封面名称.value = 已有封面名称
  当前封面预览地址.value =
    记录.primary_cover_asset?.thumbnail_url ?? 记录.primary_cover_asset?.url ?? ''
  当前外部封面地址.value = 已有外部封面地址
  当前外部封面来源.value = 记录.primary_cover_asset?.source_provider ?? ''
  当前外部封面ID.value = 记录.primary_cover_asset?.source_asset_id ?? ''
}

function 打开新增() {
  重置表单()
  弹窗打开.value = true
  void 加载全部标签候选()
  void 加载表单建议(表单.value.media_type)
  void 加载创作者建议()
}

function 打开编辑(记录: MediaRecord) {
  从记录填充表单(记录)
  弹窗打开.value = true
  void 加载全部标签候选()
  void 加载表单建议(表单.value.media_type)
  void 加载创作者建议(记录.creator ?? '')
}

async function 提交表单() {
  if (!表单.value.title.trim()) {
    ElMessage.warning('名称不能为空')
    return
  }
  if (保存中.value) return
  保存中.value = true
  try {
    const 请求体 = 构建请求体()
    const 本地封面 = 本地封面文件.value
    if (!当前ID.value) {
      if (表单.value.external_cover_provider && 表单.value.external_cover_id) {
        const 导入结果 = await 从外部导入文娱({
          provider: 表单.value.external_cover_provider,
          external_id: 表单.value.external_cover_id,
          status: 表单.value.status,
          rating: 表单.value.rating,
          is_visible: 表单.value.is_visible,
          localize_cover: Boolean(表单.value.external_cover_url),
        })
        const 个人标签 = 解析标签文本(表单.value.personal_tags_text)
        if (个人标签.length > 0) {
          await 更新文娱(导入结果.id, { personal_tags: 个人标签 })
        }
      } else {
        const 记录 = await 创建文娱(请求体)
        if (本地封面) {
          await 上传已选择本地封面(记录.id, 本地封面)
        } else if (表单.value.external_cover_url) {
          await 从外部URL导入封面(记录.id, {
            external_url: 表单.value.external_cover_url,
            source_provider: 表单.value.external_cover_provider || null,
            source_asset_id: 表单.value.external_cover_id || null,
            original_name: `${表单.value.title.trim() || 'cover'}.jpg`,
            set_primary: true,
          })
        }
      }
      ElMessage.success('作品已创建')
    } else {
      await 更新文娱(当前ID.value, 请求体)
      if (本地封面) {
        await 上传已选择本地封面(当前ID.value, 本地封面)
      } else if (
        表单.value.external_cover_url &&
        表单.value.external_cover_url !== 当前外部封面地址.value
      ) {
        await 从外部URL导入封面(当前ID.value, {
          external_url: 表单.value.external_cover_url,
          source_provider: 表单.value.external_cover_provider || null,
          source_asset_id: 表单.value.external_cover_id || null,
          original_name: `${表单.value.title.trim() || 'cover'}.jpg`,
          set_primary: true,
        })
      }
      ElMessage.success('作品已更新')
    }
    弹窗打开.value = false
    await Promise.all([拉取列表(), 加载筛选选项(), 刷新角标()])
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '保存作品失败'))
  } finally {
    保存中.value = false
  }
}

/* ==========================================================================
   封面
   ========================================================================== */
async function 搜索外部作品() {
  const 关键词 = 封面搜索关键词.value.trim()
  if (!关键词) {
    封面搜索结果.value = []
    return
  }
  封面搜索中.value = true
  try {
    const 数据 = await 搜索外部文娱(关键词, 表单.value.media_type, 封面搜索来源.value || undefined)
    封面搜索结果.value = 数据.items
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '搜索外部作品失败'))
  } finally {
    封面搜索中.value = false
  }
}

function 填充外部候选(候选: ExternalMediaCandidate) {
  清理本地封面选择()
  表单.value.title = 候选.title
  表单.value.original_title = 候选.original_title ?? ''
  表单.value.media_type = 候选.media_type
  表单.value.creator = 候选.creators.join('、')
  表单.value.genres_text = 候选.genres.join(', ')
  表单.value.tags_text = 候选.tags.join(', ')
  表单.value.summary = 候选.summary ?? ''
  表单.value.description = 候选.description ?? ''
  表单.value.external_cover_url = 候选.cover_url ?? 候选.thumbnail_url ?? ''
  表单.value.external_cover_provider = 候选.provider
  表单.value.external_cover_id = 候选.external_id
  表单.value.cover_file_name = 候选.cover_url ? `${候选.provider}:${候选.external_id}` : ''
}

function 仅更新外部候选封面(候选: ExternalMediaCandidate) {
  清理本地封面选择()
  表单.value.external_cover_url = 候选.cover_url ?? 候选.thumbnail_url ?? ''
  表单.value.external_cover_provider = 候选.provider
  表单.value.external_cover_id = 候选.external_id
  表单.value.cover_file_name = 表单.value.external_cover_url
    ? `${候选.provider}:${候选.external_id}`
    : ''
  console.info('[文娱管理] 已从搜索结果选择待上传封面', {
    provider: 候选.provider,
    externalId: 候选.external_id,
    title: 候选.title,
  })
}

function 打开本地封面选择() {
  本地封面输入.value?.click()
}

function 处理本地封面变更(事件: Event) {
  const 输入 = 事件.target as HTMLInputElement
  const 文件 = 输入.files?.[0]
  if (!文件) {
    return
  }
  const 是图片 =
    文件.type.startsWith('image/') ||
    /\.(avif|bmp|gif|heic|heif|ico|jpe?g|png|svg|tiff?|webp)$/i.test(文件.name)
  if (!是图片) {
    ElMessage.warning('封面只允许上传图片文件')
    输入.value = ''
    return
  }
  清理本地封面选择()
  本地封面文件.value = 文件
  本地封面预览.value = URL.createObjectURL(文件)
  表单.value.cover_file_name = 文件.name
  表单.value.external_cover_url = ''
  表单.value.external_cover_provider = ''
  表单.value.external_cover_id = ''
  console.info('[文娱管理] 已选择本地封面', {
    name: 文件.name,
    size: 文件.size,
    type: 文件.type || 'unknown',
  })
}

function 清除封面文件() {
  清理本地封面选择()
  if (当前ID.value) {
    恢复当前封面信息()
    return
  }
  表单.value.cover_file_name = ''
  表单.value.external_cover_url = ''
  表单.value.external_cover_provider = ''
  表单.value.external_cover_id = ''
}

async function 上传已选择本地封面(作品ID: string, 文件: File) {
  console.info('[文娱管理] 开始上传本地封面', {
    作品ID,
    name: 文件.name,
    size: 文件.size,
  })
  await 上传文娱封面(作品ID, 文件)
}

/* ==========================================================================
   创作者建议
   ========================================================================== */
async function 加载创作者建议(关键词 = '') {
  const 序号 = ++创作者建议序号
  创作者建议加载中.value = true
  try {
    const 建议 = await 获取文娱创作者建议(关键词, 10)
    if (序号 !== 创作者建议序号) {
      return []
    }
    创作者建议.value = 建议
    return 建议
  } catch (错误) {
    if (序号 === 创作者建议序号) {
      ElMessage.error(获取API错误消息(错误, '加载创作者建议失败'))
    }
    return []
  } finally {
    if (序号 === 创作者建议序号) {
      创作者建议加载中.value = false
    }
  }
}

async function 查询创作者建议(
  关键词: string,
  回调: (项: Array<{ value: string; count: number }>) => void,
) {
  const 建议 =
    关键词.trim() || 创作者建议.value.length === 0 ? await 加载创作者建议(关键词) : 创作者建议.value
  回调(
    建议.map((项) => ({
      value: 项.name,
      count: 项.count,
    })),
  )
}

function 选择创作者建议(项: Record<string, unknown>) {
  if (typeof 项.value === 'string') {
    表单.value.creator = 项.value
  }
}

/* ==========================================================================
   删除 / 恢复 / 公开状态
   ========================================================================== */
async function 执行删除(作品: MediaRecord) {
  const 永久删除 = 回收站模式.value
  try {
    await 删除文娱(作品.id, 永久删除)
    ElMessage.success(永久删除 ? '作品已永久删除' : '作品已移入回收站')
    await 拉取列表()
    void 刷新角标()
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '删除作品失败'))
  }
}

async function 执行恢复(作品: MediaRecord) {
  try {
    await 恢复文娱(作品.id)
    ElMessage.success('作品已恢复')
    await 拉取列表()
    void 刷新角标()
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '恢复作品失败'))
  }
}

async function 切换公开(作品: MediaRecord) {
  try {
    const 目标状态 = !作品.is_visible
    await 更新文娱(作品.id, { is_visible: 目标状态 })
    作品.is_visible = 目标状态
    ElMessage.success(目标状态 ? '作品已设为公开' : '作品已设为不公开')
    void 刷新角标()
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '修改公开状态失败'))
  }
}

function 打开编辑器(作品: MediaRecord) {
  if (回收站模式.value) return
  打开编辑(作品)
}

/* ==========================================================================
   路由参数
   ========================================================================== */
async function 尝试打开路由指定条目() {
  const 作品ID = typeof route.query.media_id === 'string' ? route.query.media_id : ''
  if (!作品ID) {
    return
  }
  try {
    const 目标 = 列表.value.find((作品) => 作品.id === 作品ID) ?? (await 获取文娱详情(作品ID))
    打开编辑(目标)
    await router.replace({ query: { ...route.query, media_id: undefined } })
  } catch (错误) {
    console.error('[文娱管理] 打开指定作品失败', 错误)
    ElMessage.warning('没有找到指定作品')
  }
}

onMounted(async () => {
  void 加载筛选选项()
  await 拉取列表()
  await 尝试打开路由指定条目()
})

onBeforeUnmount(() => {
  释放本地封面预览()
})
</script>

<template>
  <div class="manager-page media-page">
    <header class="manager-head">
      <div>
        <h1>{{ 回收站模式 ? '回收站' : '作品推荐' }}</h1>
        <p>{{ 页头统计 }}</p>
      </div>
      <div class="manager-head-actions">
        <ElButton v-if="!回收站模式" type="primary" class="manager-create" @click="打开新增">
          <ElIcon><Plus /></ElIcon>
          <span>新增作品</span>
        </ElButton>
      </div>
    </header>

    <div class="manager-toolbar">
      <div class="manager-mode-nav" role="group" aria-label="作品视图切换">
        <button
          type="button"
          class="manager-mode-nav__item"
          :class="{ 'is-active': 视图 === 'table' }"
          title="列表"
          @click="视图 = 'table'"
        >
          <ElIcon>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
            </svg>
          </ElIcon>
          <span>列表</span>
        </button>
        <button
          type="button"
          class="manager-mode-nav__item"
          :class="{ 'is-active': 视图 === 'cards' }"
          title="卡片"
          @click="视图 = 'cards'"
        >
          <ElIcon>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="8" height="7" rx="1" />
              <rect x="13" y="4" width="8" height="7" rx="1" />
              <rect x="3" y="13" width="8" height="7" rx="1" />
              <rect x="13" y="13" width="8" height="7" rx="1" />
            </svg>
          </ElIcon>
          <span>卡片</span>
        </button>
      </div>

      <div class="manager-filters">
        <ElPopover
          placement="bottom-end"
          :width="330"
          trigger="click"
          popper-class="manager-popover"
        >
          <template #reference>
            <button
              type="button"
              class="manager-filter-button"
              :class="{ 'is-active': 筛选条件数 > 0 }"
              aria-label="筛选作品"
            >
              <ElIcon><Filter /></ElIcon>
              <span>筛选</span>
              <small v-if="筛选条件数">{{ 筛选条件数 }}</small>
            </button>
          </template>
          <div class="manager-filter-panel">
            <div class="manager-filter-group">
              <label>状态</label>
              <div class="manager-filter-chips">
                <button
                  type="button"
                  class="manager-filter-chip"
                  :class="{ 'is-active': !当前状态 }"
                  :aria-pressed="!当前状态"
                  @click="切换状态('')"
                >
                  全部
                </button>
                <button
                  v-for="选项 in 状态选项"
                  :key="选项.value"
                  type="button"
                  class="manager-filter-chip"
                  :class="{ 'is-active': 当前状态 === 选项.value }"
                  :aria-pressed="当前状态 === 选项.value"
                  @click="切换状态(选项.value)"
                >
                  {{ 选项.label }}
                </button>
              </div>
            </div>
            <div v-if="外部分类选项.length" class="manager-filter-group">
              <label>外部分类</label>
              <div class="manager-filter-chips manager-filter-chips--tall">
                <button
                  v-for="分类 in 外部分类选项"
                  :key="分类"
                  type="button"
                  class="manager-filter-chip"
                  :class="{ 'is-active': 当前外部分类 === 分类 }"
                  :aria-pressed="当前外部分类 === 分类"
                  @click="切换外部分类(分类)"
                >
                  {{ 分类 }}
                </button>
              </div>
            </div>
            <div v-if="外部标签选项.length" class="manager-filter-group">
              <label>外部标签</label>
              <div class="manager-filter-chips manager-filter-chips--tall">
                <button
                  v-for="标签 in 外部标签选项"
                  :key="标签"
                  type="button"
                  class="manager-filter-chip"
                  :class="{ 'is-active': 当前外部标签 === 标签 }"
                  :aria-pressed="当前外部标签 === 标签"
                  @click="切换外部标签(标签)"
                >
                  {{ 标签 }}
                </button>
              </div>
            </div>
            <div v-if="个人标签选项.length" class="manager-filter-group">
              <label>个人标签</label>
              <div class="manager-filter-chips manager-filter-chips--tall">
                <button
                  v-for="标签 in 个人标签选项"
                  :key="标签"
                  type="button"
                  class="manager-filter-chip"
                  :class="{ 'is-active': 当前个人标签 === 标签 }"
                  :aria-pressed="当前个人标签 === 标签"
                  @click="切换个人标签(标签)"
                >
                  {{ 标签 }}
                </button>
              </div>
            </div>
            <div class="manager-filter-group">
              <label>排序</label>
              <div class="media-sort-options">
                <button
                  v-for="选项 in 排序选项"
                  :key="选项.value"
                  type="button"
                  class="manager-filter-chip manager-sort-option media-sort-option"
                  :class="{ 'is-active': 排序字段 === 选项.value }"
                  :aria-label="`${选项.label}，${
                    排序字段 === 选项.value ? (排序方向 === 'asc' ? '升序' : '降序') : '未排序'
                  }`"
                  :aria-pressed="排序字段 === 选项.value"
                  @click="切换排序(选项.value)"
                >
                  <span>{{ 选项.label }}</span>
                  <ElIcon><SortDirectionIcon :direction="排序图标方向(选项.value)" /></ElIcon>
                </button>
              </div>
              <SortOrderControl
                :model-value="排序字段 ? 排序方向 : ''"
                @update:model-value="设置排序方向"
              />
            </div>
            <div class="manager-filter-footer">
              <span>{{ 筛选条件数 ? `已选 ${筛选条件数} 个条件` : '未设置筛选条件' }}</span>
              <ElButton text size="small" @click="清除筛选">清除筛选</ElButton>
            </div>
          </div>
        </ElPopover>
        <label class="manager-search">
          <ElIcon><Search /></ElIcon>
          <input
            v-model="搜索词"
            type="search"
            placeholder="搜索名称、原名、作者或简介"
            aria-label="搜索作品"
            maxlength="200"
          />
        </label>
      </div>
    </div>

    <div class="manager-tabs-row">
      <nav class="manager-tabs" aria-label="作品主分类">
        <button
          type="button"
          class="manager-tab"
          :class="{ 'is-active': !当前主分类 }"
          :aria-pressed="!当前主分类"
          @click="切换主分类('')"
        >
          全部
          <small>{{ 全部作品数 }}</small>
        </button>
        <button
          v-for="页签 in 主分类页签"
          :key="页签.value"
          type="button"
          class="manager-tab"
          :class="{ 'is-active': 当前主分类 === 页签.value }"
          :aria-pressed="当前主分类 === 页签.value"
          @click="切换主分类(页签.value)"
        >
          {{ 页签.label }}
          <small>{{ 页签.数量 }}</small>
        </button>
      </nav>
      <button
        type="button"
        class="manager-tab"
        :class="{ 'is-active': 回收站模式 }"
        :aria-pressed="回收站模式"
        @click="切换回收站"
      >
        回收站 <small>{{ 回收站总数 }}</small>
      </button>
    </div>

    <ElSkeleton :loading="初次加载 && !列表.length" animated class="media-skeleton">
      <div
        ref="列表容器"
        v-loading="刷新中"
        class="manager-list-body"
        :aria-busy="刷新中 || 加载更多中"
      >
        <!-- 列表视图 -->
        <div
          v-if="视图 === 'table' && 列表.length"
          class="manager-table"
          role="table"
          aria-label="作品列表"
          :style="{ minWidth: 表格最小宽度, '--manager-grid-columns': 网格列 }"
        >
          <div class="manager-row manager-row-head" role="row">
            <div v-for="列 in 展示列" :key="列.value" role="columnheader">
              <button
                v-if="列排序字段(列.value)"
                type="button"
                class="manager-sort-heading"
                :class="{ 'is-active': 排序字段 === 列排序字段(列.value) }"
                :aria-sort="
                  排序字段 === 列排序字段(列.value)
                    ? 排序方向 === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                "
                @click="切换排序(列排序字段(列.value) as MediaSortField)"
              >
                <span>{{ 列标题(列) }}</span>
                <ElIcon
                  ><SortDirectionIcon :direction="排序图标方向(列排序字段(列.value))"
                /></ElIcon>
              </button>
              <span v-else>{{ 列标题(列) }}</span>
            </div>
            <div class="manager-column-actions manager-fixed-actions" role="columnheader">
              <span>操作</span>
              <ElPopover
                placement="bottom-end"
                :width="190"
                trigger="click"
                popper-class="manager-popover"
              >
                <template #reference>
                  <button type="button" title="设置显示列" aria-label="设置显示列">
                    <ElIcon class="manager-column-more">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </ElIcon>
                  </button>
                </template>
                <div class="manager-column-settings">
                  <label v-for="列 in 作品列" :key="列.value">
                    <input
                      type="checkbox"
                      :checked="可见列.includes(列.value)"
                      :disabled="列.value === 'title'"
                      @change="切换列(列.value)"
                    />
                    {{ 列.label }}
                  </label>
                </div>
              </ElPopover>
            </div>
          </div>

          <div v-for="作品 in 列表" :key="作品.id" class="manager-row" role="row">
            <div v-for="列 in 展示列" :key="列.value" role="cell" class="manager-cell">
              <div v-if="列.value === 'title'" class="media-title-cell">
                <button
                  v-if="获取封面(作品)"
                  type="button"
                  class="media-cover-button"
                  :title="`放大${作品.title}的封面`"
                  :aria-label="`放大${作品.title}的封面`"
                  @click="打开封面预览(作品)"
                >
                  <img :src="获取封面(作品)" :alt="作品.title" class="media-cover" loading="lazy" />
                </button>
                <span v-else class="media-cover media-cover--empty">📖</span>
                <div class="media-title-meta">
                  <button
                    type="button"
                    class="media-title"
                    :title="作品.title"
                    :disabled="回收站模式"
                    @click="打开编辑器(作品)"
                  >
                    {{ 作品.title }}
                  </button>
                  <span
                    v-if="作品.original_title"
                    class="media-original-title"
                    :title="作品.original_title"
                  >
                    {{ 作品.original_title }}
                  </span>
                </div>
              </div>

              <span v-else-if="列.value === 'media_type'" class="manager-muted">
                {{ 主分类标签(作品.media_type) }}
              </span>

              <span v-else-if="列.value === 'status'" class="manager-status">
                <i :class="`manager-dot--${作品.status}`" />
                {{ 获取文娱状态标签(作品.media_type, 作品.status) }}
              </span>

              <span v-else-if="列.value === 'rating'" class="media-rating-cell">
                <MediaRating v-if="作品.rating" :rating="作品.rating" compact />
                <span v-if="作品.rating" class="media-rating-cell__text">
                  {{ 获取评分摘要(作品.rating) }}
                </span>
                <span v-else class="manager-muted">—</span>
              </span>

              <span
                v-else-if="列.value === 'creator'"
                class="manager-muted manager-truncate"
                :title="作品.creator || undefined"
              >
                {{ 作品.creator || '—' }}
              </span>

              <span
                v-else-if="列.value === 'genres'"
                class="manager-muted manager-truncate"
                :title="标签完整文本(作品.genres)"
              >
                {{ 标签文本(作品.genres) || '—' }}
              </span>

              <span
                v-else-if="列.value === 'tags'"
                class="manager-muted manager-truncate"
                :title="标签完整文本(作品.tags)"
              >
                {{ 标签文本(作品.tags) || '—' }}
              </span>

              <span
                v-else-if="列.value === 'personal_tags'"
                class="manager-muted manager-truncate"
                :title="标签完整文本(作品.personal_tags || [])"
              >
                {{ 标签文本(作品.personal_tags || []) || '—' }}
              </span>

              <span v-else-if="列.value === 'visible'" class="manager-status">
                <i :class="作品.is_visible ? 'manager-dot--success' : 'manager-dot--muted'" />
                {{ 作品.is_visible ? '公开' : '隐藏' }}
              </span>

              <ElTooltip
                v-else-if="列.value === 'date'"
                :content="格式化完整时间(回收站模式 ? 作品.deleted_at : 作品.created_at)"
                placement="top"
                popper-class="manager-date-tooltip"
              >
                <span class="manager-date">
                  {{ 格式化相对时间(回收站模式 ? 作品.deleted_at : 作品.created_at) }}
                </span>
              </ElTooltip>

              <ElTooltip
                v-else
                :content="格式化完整时间(作品.updated_at)"
                placement="top"
                popper-class="manager-date-tooltip"
              >
                <span class="manager-date">
                  {{ 格式化相对时间(作品.updated_at) }}
                </span>
              </ElTooltip>
            </div>

            <div role="cell" class="manager-fixed-actions">
              <div class="manager-ops">
                <template v-if="回收站模式">
                  <ElTooltip content="恢复作品" placement="top">
                    <button
                      type="button"
                      title="恢复作品"
                      aria-label="恢复作品"
                      @click="执行恢复(作品)"
                    >
                      <ElIcon><RefreshLeft /></ElIcon>
                    </button>
                  </ElTooltip>
                  <ElPopconfirm title="确认永久删除这条作品？" @confirm="执行删除(作品)">
                    <template #reference>
                      <button
                        type="button"
                        class="manager-delete"
                        title="彻底删除"
                        aria-label="彻底删除"
                      >
                        <ElIcon><Delete /></ElIcon>
                      </button>
                    </template>
                  </ElPopconfirm>
                </template>
                <template v-else>
                  <ElTooltip content="编辑作品" placement="top">
                    <button
                      type="button"
                      title="编辑作品"
                      aria-label="编辑作品"
                      @click="打开编辑(作品)"
                    >
                      <ElIcon><PencilEditIcon /></ElIcon>
                    </button>
                  </ElTooltip>
                  <ElTooltip :content="作品.is_visible ? '设为不公开' : '设为公开'" placement="top">
                    <button
                      type="button"
                      :title="作品.is_visible ? '设为不公开' : '设为公开'"
                      :aria-label="作品.is_visible ? '设为不公开' : '设为公开'"
                      @click="切换公开(作品)"
                    >
                      <ElIcon><component :is="作品.is_visible ? View : Hide" /></ElIcon>
                    </button>
                  </ElTooltip>
                  <ElPopconfirm title="确认删除这条作品？" @confirm="执行删除(作品)">
                    <template #reference>
                      <button
                        type="button"
                        class="manager-delete"
                        title="移入回收站"
                        aria-label="移入回收站"
                      >
                        <ElIcon><Delete /></ElIcon>
                      </button>
                    </template>
                  </ElPopconfirm>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 卡片视图：与博客前台作品推荐同款海报卡 -->
        <div v-else-if="视图 === 'cards' && 列表.length" class="media-grid">
          <article
            v-for="作品 in 列表"
            :key="作品.id"
            class="media-card"
            :class="{ 'is-hidden': !作品.is_visible }"
          >
            <button
              type="button"
              class="media-card__cover"
              :title="作品.title"
              :disabled="回收站模式"
              @click="打开编辑器(作品)"
            >
              <img
                v-if="获取封面(作品)"
                :src="获取封面(作品)"
                :alt="作品.title"
                class="media-card__image"
                loading="lazy"
              />
              <span v-else class="media-card__image media-card__image--empty">📖</span>
              <span
                class="media-card__status"
                :style="{ backgroundColor: 状态徽标颜色[作品.status] }"
              >
                {{ 获取文娱状态标签(作品.media_type, 作品.status) }}
              </span>
              <span v-if="作品.rating" class="media-card__score">
                <MediaRating :rating="作品.rating" compact />
              </span>
              <span class="media-card__overlay" />
              <span class="media-card__content">
                <span class="media-card__title">{{ 作品.title }}</span>
                <span class="media-card__footer">
                  <span v-if="作品.creator" class="media-card__meta" :title="作品.creator">
                    {{ 作品.creator }}
                  </span>
                  <span
                    v-if="
                      作品.genres.length || 作品.tags.length || (作品.personal_tags || []).length
                    "
                    class="media-card__tags"
                  >
                    <span
                      v-for="分类 in 作品.genres.slice(0, 2)"
                      :key="`genre-${分类}`"
                      class="media-card__tag media-card__tag--genre"
                      >{{ 分类 }}</span
                    >
                    <span
                      v-for="标签 in 作品.tags.slice(0, 2)"
                      :key="`tag-${标签}`"
                      class="media-card__tag media-card__tag--external"
                      >{{ 标签 }}</span
                    >
                    <span
                      v-for="标签 in (作品.personal_tags || []).slice(0, 2)"
                      :key="`personal-${标签}`"
                      class="media-card__tag media-card__tag--personal"
                      >{{ 标签 }}</span
                    >
                  </span>
                </span>
              </span>
            </button>
            <div class="media-card__caption">
              <span class="media-card__caption-text" :title="作品.title">
                <template v-if="!作品.is_visible">未公开 · </template>
                {{ 主分类标签(作品.media_type) }} · {{ 格式化短日期(作品.updated_at) }}
              </span>
              <div class="manager-ops">
                <template v-if="回收站模式">
                  <ElTooltip content="恢复作品" placement="top">
                    <button
                      type="button"
                      title="恢复作品"
                      aria-label="恢复作品"
                      @click="执行恢复(作品)"
                    >
                      <ElIcon><RefreshLeft /></ElIcon>
                    </button>
                  </ElTooltip>
                  <ElPopconfirm title="确认永久删除这条作品？" @confirm="执行删除(作品)">
                    <template #reference>
                      <button
                        type="button"
                        class="manager-delete"
                        title="彻底删除"
                        aria-label="彻底删除"
                      >
                        <ElIcon><Delete /></ElIcon>
                      </button>
                    </template>
                  </ElPopconfirm>
                </template>
                <template v-else>
                  <ElTooltip content="编辑作品" placement="top">
                    <button
                      type="button"
                      title="编辑作品"
                      aria-label="编辑作品"
                      @click="打开编辑(作品)"
                    >
                      <ElIcon><PencilEditIcon /></ElIcon>
                    </button>
                  </ElTooltip>
                  <ElTooltip :content="作品.is_visible ? '设为不公开' : '设为公开'" placement="top">
                    <button
                      type="button"
                      :title="作品.is_visible ? '设为不公开' : '设为公开'"
                      :aria-label="作品.is_visible ? '设为不公开' : '设为公开'"
                      @click="切换公开(作品)"
                    >
                      <ElIcon><component :is="作品.is_visible ? View : Hide" /></ElIcon>
                    </button>
                  </ElTooltip>
                  <ElPopconfirm title="确认删除这条作品？" @confirm="执行删除(作品)">
                    <template #reference>
                      <button
                        type="button"
                        class="manager-delete"
                        title="移入回收站"
                        aria-label="移入回收站"
                      >
                        <ElIcon><Delete /></ElIcon>
                      </button>
                    </template>
                  </ElPopconfirm>
                </template>
              </div>
            </div>
          </article>
        </div>

        <div v-if="!列表.length && !加载失败" class="manager-empty">{{ 空状态文案 }}</div>

        <div
          v-if="加载失败 || 加载更多中 || 还有更多 || 列表.length"
          class="manager-list-status"
          :class="{ 'manager-list-status--end': !加载失败 && !加载更多中 && !还有更多 }"
          role="status"
        >
          <template v-if="加载失败">
            <span>加载失败</span>
            <button type="button" @click="重试加载">重试</button>
          </template>
          <span v-else-if="加载更多中">正在加载更多作品…</span>
          <button v-else-if="还有更多" type="button" @click="拉取列表(true)">加载更多</button>
          <span v-else>已显示全部作品</span>
        </div>
      </div>
    </ElSkeleton>

    <BaseDialog
      v-model="弹窗打开"
      class="manager-dialog media-dialog"
      modal-class="manager-dialog-overlay"
      width="860px"
      style="max-width: 94vw"
      :close-on-click-modal="!保存中"
      :close-on-press-escape="!保存中"
      :show-close="!保存中"
      @closed="重置表单"
    >
      <template #header>
        <div class="manager-dialog-header">
          <i />
          <strong>{{ 对话框标题 }}</strong>
          <span>{{ 对话框副标题 }}</span>
        </div>
      </template>

      <div class="manager-dialog-form media-form">
        <div class="media-form__grid">
          <div class="manager-form-section media-form__full">基本信息</div>

          <div class="media-form__field media-form__span-2">
            <label class="media-field-label">名称 <em>*</em></label>
            <ElInput v-model="表单.title" maxlength="300" placeholder="作品名称" />
          </div>

          <div class="media-form__field media-form__span-2">
            <label class="media-field-label">原名</label>
            <ElInput
              v-model="表单.original_title"
              maxlength="300"
              placeholder="原名 / 日文名，可留空"
            />
          </div>

          <div class="media-form__field media-form__span-2">
            <label class="media-field-label">主分类</label>
            <div class="manager-filter-chips">
              <button
                v-for="分类 in 主分类选项"
                :key="分类.value"
                type="button"
                class="manager-filter-chip"
                :class="{ 'is-active': 表单.media_type === 分类.value }"
                :aria-pressed="表单.media_type === 分类.value"
                @click="表单.media_type = 分类.value"
              >
                {{ 分类.label }}
              </button>
            </div>
          </div>

          <div class="media-form__field media-form__span-2">
            <label class="media-field-label">状态</label>
            <div class="manager-filter-chips">
              <button
                v-for="选项 in 获取文娱状态选项(表单.media_type)"
                :key="选项.value"
                type="button"
                class="manager-filter-chip"
                :class="{ 'is-active': 表单.status === 选项.value }"
                :aria-pressed="表单.status === 选项.value"
                @click="表单.status = 选项.value"
              >
                {{ 选项.label }}
              </button>
            </div>
          </div>

          <div class="media-form__field media-form__span-2">
            <label class="media-field-label">评分</label>
            <div class="media-rating-editor">
              <div class="media-rating-editor__actions">
                <ElTooltip content="未评分" placement="top">
                  <ElButton
                    size="small"
                    :type="表单.rating == null ? 'primary' : 'default'"
                    plain
                    class="media-rating-editor__icon-button"
                    @click="选择表单评分(null)"
                  >
                    ∅
                  </ElButton>
                </ElTooltip>
                <ElTooltip content="雷区" placement="top">
                  <ElButton
                    size="small"
                    :type="表单.rating === 1 ? 'danger' : 'default'"
                    plain
                    class="media-rating-editor__icon-button"
                    @click="选择表单评分(1)"
                  >
                    💣
                  </ElButton>
                </ElTooltip>
                <ElTooltip content="粪作" placement="top">
                  <ElButton
                    size="small"
                    :type="表单.rating === 2 ? 'warning' : 'default'"
                    plain
                    class="media-rating-editor__icon-button"
                    @click="选择表单评分(2)"
                  >
                    💩
                  </ElButton>
                </ElTooltip>
                <ElTooltip content="0 星" placement="top">
                  <ElButton
                    size="small"
                    :type="表单.rating === 3 ? 'primary' : 'default'"
                    plain
                    class="media-rating-editor__icon-button"
                    @click="选择表单评分(3)"
                  >
                    <ElIcon><Star /></ElIcon>
                  </ElButton>
                </ElTooltip>
              </div>
              <span class="media-rating-editor__divider" aria-hidden="true">|</span>
              <div class="media-rating-editor__stars">
                <ElRate v-model="表单评分星数" allow-half :max="6" />
                <span class="media-rating-editor__text">{{ 获取表单评分说明() }}</span>
              </div>
            </div>
          </div>

          <div class="media-form__field">
            <label class="media-field-label">创作者</label>
            <ElAutocomplete
              v-model="表单.creator"
              maxlength="200"
              placeholder="作者 / 导演 / 工作室 / 开发商"
              :fetch-suggestions="查询创作者建议"
              :trigger-on-focus="true"
              :debounce="200"
              :fit-input-width="true"
              @select="选择创作者建议"
            >
              <template #default="{ item }: { item: { value: string; count: number } }">
                <div class="creator-suggestion">
                  <span>{{ item.value }}</span>
                  <span class="creator-suggestion__count">已使用 {{ item.count }} 次</span>
                </div>
              </template>
            </ElAutocomplete>
          </div>

          <div class="media-form__field media-form__switch-field">
            <label class="media-field-label">公开展示</label>
            <div class="manager-switch-row">
              <div class="manager-switch-copy">
                <strong>{{ 表单.is_visible ? '公开展示' : '仅自己可见' }}</strong>
                <span>关闭后作品不会出现在博客作品推荐里。</span>
              </div>
              <ElButton
                size="small"
                :type="表单.is_visible ? 'primary' : 'default'"
                plain
                @click="表单.is_visible = !表单.is_visible"
              >
                {{ 表单.is_visible ? '公开' : '隐藏' }}
              </ElButton>
            </div>
          </div>

          <div class="manager-form-section media-form__full">分类与标签</div>

          <div class="media-form__field media-form__full">
            <label class="media-field-label">外部分类</label>
            <TagInlineInput
              v-model="表单.genres_text"
              :existing-tags="表单外部分类建议"
              placeholder="多个值用逗号分隔"
            />
            <div v-if="可选分类建议.length" class="existing-tags">
              <button
                v-for="分类 in 可选分类建议"
                :key="分类"
                type="button"
                class="manager-filter-chip existing-tag"
                @click="表单.genres_text = 追加建议项(表单.genres_text, 分类)"
              >
                {{ 分类 }}
              </button>
            </div>
            <div v-if="不属于当前主分类的分类.length" class="field-hint field-hint--warning">
              当前主分类下未见这些已有外部分类：{{ 不属于当前主分类的分类.join('、') }}
            </div>
          </div>

          <div class="media-form__field media-form__full">
            <label class="media-field-label">外部标签</label>
            <TagInlineInput
              v-model="表单.tags_text"
              :existing-tags="表单外部标签建议"
              placeholder="多个值用逗号分隔"
            />
            <div v-if="可选标签建议.length" class="existing-tags">
              <button
                v-for="标签 in 可选标签建议"
                :key="标签"
                type="button"
                class="manager-filter-chip existing-tag"
                @click="表单.tags_text = 追加建议项(表单.tags_text, 标签)"
              >
                {{ 标签 }}
              </button>
            </div>
            <div v-if="不属于当前主分类的标签.length" class="field-hint field-hint--warning">
              当前主分类下未见这些已有外部标签：{{ 不属于当前主分类的标签.join('、') }}
            </div>
          </div>

          <div class="media-form__field media-form__full">
            <label class="media-field-label">个人标签</label>
            <TagInlineInput
              v-model="表单.personal_tags_text"
              :existing-tags="表单个人标签建议"
              placeholder="多个值用逗号分隔"
            />
            <div v-if="可选个人标签建议.length" class="existing-tags">
              <button
                v-for="标签 in 可选个人标签建议"
                :key="标签"
                type="button"
                class="manager-filter-chip existing-tag"
                @click="表单.personal_tags_text = 追加建议项(表单.personal_tags_text, 标签)"
              >
                {{ 标签 }}
              </button>
            </div>
            <div v-if="不属于当前主分类的个人标签.length" class="field-hint field-hint--warning">
              当前主分类下未见这些已有个人标签：{{ 不属于当前主分类的个人标签.join('、') }}
            </div>
          </div>

          <div class="manager-form-section media-form__full">文案</div>

          <div class="media-form__field media-form__span-2">
            <label class="media-field-label">简介</label>
            <ElInput v-model="表单.summary" type="textarea" :rows="3" placeholder="一句话简介" />
          </div>

          <div class="media-form__field media-form__span-2">
            <label class="media-field-label">描述</label>
            <ElInput
              v-model="表单.description"
              type="textarea"
              :rows="5"
              placeholder="详细感受、评价或推荐理由"
            />
          </div>

          <div class="manager-form-section media-form__full">封面</div>

          <div class="media-form__field media-form__full">
            <div class="cover-picker">
              <div class="cover-picker__search">
                <ElInput
                  v-model="封面搜索关键词"
                  class="cover-picker__search-input"
                  placeholder="搜索 Bangumi、起点、Google Books、AniList 等外部作品"
                  clearable
                  @keyup.enter="搜索外部作品"
                />
                <ElButton :icon="Search" :loading="封面搜索中" @click="搜索外部作品">搜索</ElButton>
              </div>
              <div class="cover-picker__actions">
                <div class="cover-picker__sources">
                  <button
                    v-for="来源 in 外部数据源选项"
                    :key="来源.value || 'all'"
                    type="button"
                    class="manager-filter-chip"
                    :class="{ 'is-active': 封面搜索来源 === 来源.value }"
                    @click="封面搜索来源 = 来源.value"
                  >
                    {{ 来源.label }}
                  </button>
                </div>
                <ElButton :icon="Upload" @click="打开本地封面选择">上传封面</ElButton>
                <ElButton v-if="本地封面文件 || 表单.external_cover_url" text @click="清除封面文件">
                  清除封面
                </ElButton>
              </div>
              <input
                ref="本地封面输入"
                type="file"
                accept="image/*,.avif,.bmp,.gif,.heic,.heif,.ico,.jpeg,.jpg,.png,.svg,.tif,.tiff,.webp"
                class="cover-picker__input"
                @change="处理本地封面变更"
              />
              <div v-if="当前封面预览 || 当前封面文本" class="cover-picker__selected">
                <img
                  v-if="当前封面预览"
                  :src="当前封面预览"
                  :alt="表单.title || '封面预览'"
                  class="cover-picker__selected-thumb"
                />
                <div class="cover-picker__selected-meta">
                  <span class="cover-picker__selected-label">
                    {{ 存在待上传封面 ? '待上传封面' : '当前封面' }}
                  </span>
                  <span class="cover-picker__selected-value">{{ 当前封面文本 }}</span>
                </div>
              </div>
              <div v-if="封面搜索结果.length" class="cover-picker__results">
                <div
                  v-for="候选 in 封面搜索结果"
                  :key="`${候选.provider}:${候选.external_id}`"
                  class="cover-picker__item"
                  role="button"
                  tabindex="0"
                  @click="填充外部候选(候选)"
                  @keydown.enter="填充外部候选(候选)"
                  @keydown.space.prevent="填充外部候选(候选)"
                >
                  <ElButton
                    class="cover-picker__cover-only-button"
                    size="small"
                    type="primary"
                    plain
                    @click.stop="仅更新外部候选封面(候选)"
                  >
                    只更新封面
                  </ElButton>
                  <img
                    v-if="候选.thumbnail_url || 候选.cover_url"
                    :src="候选.thumbnail_url || 候选.cover_url || ''"
                    :alt="候选.title"
                    class="cover-picker__thumb"
                  />
                  <span class="cover-picker__title">{{ 候选.title }}</span>
                  <span class="cover-picker__meta">
                    <ElIcon><Link /></ElIcon>
                    {{ 候选.provider }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="manager-dialog-footer">
          <span>{{ 当前ID ? '保存后立即同步到博客作品推荐' : '名称和主分类为必填项' }}</span>
          <ElButton text :disabled="保存中" @click="弹窗打开 = false">取消</ElButton>
          <ElButton type="primary" :loading="保存中" @click="提交表单">
            {{ 保存中 ? '保存中…' : 当前ID ? '保存修改' : '创建作品' }}
          </ElButton>
        </div>
      </template>
    </BaseDialog>

    <ElImageViewer
      v-if="预览封面地址"
      :url-list="[预览封面地址]"
      teleported
      hide-on-click-modal
      @close="预览封面地址 = ''"
    />
  </div>
</template>

<style scoped>
.media-skeleton {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

/* ==========================================================================
   列表
   ========================================================================== */
.media-title-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

/* 行高与友链 / 公告保持一致：封面 40px + 上下 4px 内边距 + 1px 分隔线 = 50px */
.media-page .manager-cell {
  padding: 4px 0;
}

.media-cover {
  flex: none;
  width: 30px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  background: var(--el-fill-color-light);
}

/* 点击缩略图放大查看，与友链图标预览一致 */
.media-cover-button {
  display: flex;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  line-height: 0;
  cursor: zoom-in;
}

.media-cover-button:hover {
  box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
}

.media-cover--empty {
  display: grid;
  place-items: center;
  color: var(--manager-placeholder);
  font-size: 16px;
}

/* 筛选面板里的排序选项：两列排布，右侧显示升 / 降序箭头 */
.media-sort-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.media-sort-option {
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  text-align: left;
}

.media-sort-option > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-title-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.media-title {
  overflow: hidden;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--manager-ink);
  font: inherit;
  font-weight: 500;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.media-title:not(:disabled):hover {
  color: var(--el-color-primary);
  text-decoration: underline;
}

.media-title:disabled {
  cursor: default;
}

.media-original-title {
  overflow: hidden;
  color: var(--manager-muted);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-rating-cell {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  white-space: nowrap;
}

.media-rating-cell__text {
  color: var(--manager-muted);
  font-size: 11.5px;
}

/* 状态圆点沿用作品状态色 */
.media-page .manager-status .manager-dot--planned {
  background: #3b82f6;
}

.media-page .manager-status .manager-dot--doing {
  background: #22c55e;
}

.media-page .manager-status .manager-dot--done {
  background: #f59e0b;
}

.media-page .manager-status .manager-dot--paused {
  background: #64748b;
}

.media-page .manager-status .manager-dot--dropped {
  background: #ef4444;
}

/* ==========================================================================
   卡片视图（对齐博客前台「作品推荐」海报卡）
   ========================================================================== */
.media-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 12px;
  padding: 4px 0 8px;
}

@media (min-width: 640px) {
  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(158px, 1fr));
  }
}

.media-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.media-card__cover {
  position: relative;
  display: block;
  overflow: hidden;
  width: 100%;
  padding: 0;
  aspect-ratio: 2 / 3;
  border: 0;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  text-align: left;
  cursor: pointer;
  transition:
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.media-card__cover:disabled {
  cursor: default;
}

.media-card__cover:hover,
.media-card__cover:focus-visible {
  box-shadow: 0 14px 28px rgb(0 0 0 / 14%);
  transform: translateY(-2px);
}

.media-card__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  transition: transform 0.4s ease;
}

.media-card__cover:hover .media-card__image {
  transform: scale(1.04);
}

.media-card__image--empty {
  display: grid;
  place-items: center;
  color: var(--manager-placeholder);
  font-size: 34px;
  background: var(--el-fill-color);
}

.media-card__status {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

.media-card__score {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgb(0 0 0 / 52%);
  backdrop-filter: blur(4px);
  color: #fff;
}

.media-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgb(0 0 0 / 72%), rgb(0 0 0 / 22%) 45%, transparent 70%);
}

.media-card__content {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
}

.media-card__title {
  display: -webkit-box;
  overflow: hidden;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  text-shadow: 0 2px 10px rgb(0 0 0 / 35%);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.media-card__footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.media-card__meta {
  display: -webkit-box;
  overflow: hidden;
  color: rgb(255 255 255 / 68%);
  font-size: 11.5px;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.media-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.media-card__tag {
  padding: 1px 6px;
  border-radius: 4px;
  color: rgb(255 255 255 / 92%);
  font-size: 10px;
  backdrop-filter: blur(4px);
}

.media-card__tag--genre {
  background: rgb(59 130 246 / 42%);
}

.media-card__tag--external {
  background: rgb(245 158 11 / 46%);
}

.media-card__tag--personal {
  background: rgb(34 197 94 / 46%);
}

.media-card.is-hidden .media-card__image {
  filter: grayscale(0.7);
  opacity: 0.7;
}

.media-card__caption {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 2px;
}

.media-card__caption .manager-ops {
  align-self: flex-end;
}

.media-card__caption-text {
  width: 100%;
  overflow: hidden;
  color: var(--manager-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==========================================================================
   编辑弹窗
   ========================================================================== */
.media-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.media-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  margin-bottom: 16px;
}

.media-form__full {
  grid-column: 1 / -1;
}

.media-form__span-2 {
  grid-column: 1 / -1;
}

.media-form__switch-field {
  justify-content: flex-end;
}

.media-field-label {
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
}

.media-field-label em {
  color: var(--el-color-danger);
  font-style: normal;
}

.media-form :deep(.el-input),
.media-form :deep(.el-textarea),
.media-form :deep(.el-autocomplete) {
  width: 100%;
}

.media-form :deep(.el-input__wrapper),
.media-form :deep(.el-textarea__inner),
.media-form :deep(.el-autocomplete .el-input__wrapper) {
  border-radius: 5px;
  font-size: 12px;
}

.media-rating-editor {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 32px;
}

.media-rating-editor__actions {
  display: flex;
  gap: 0;
}

.media-rating-editor__icon-button {
  width: 22px;
  min-width: 22px;
  height: 22px;
  padding: 0;
  font-size: 14px;
}

.media-rating-editor__icon-button :deep(.el-icon) {
  font-size: 13px;
}

.media-rating-editor__divider {
  color: var(--el-border-color-darker);
  font-size: 14px;
  line-height: 1;
}

.media-rating-editor__stars {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.media-rating-editor__stars :deep(.el-rate) {
  --el-rate-icon-size: 17px;
}

.media-rating-editor__text {
  color: var(--manager-muted);
  font-size: 11.5px;
}

.existing-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.existing-tag {
  max-width: 100%;
}

.field-hint {
  font-size: 11.5px;
  line-height: 1.5;
}

.field-hint--warning {
  color: var(--el-color-warning);
}

.creator-suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.creator-suggestion__count {
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
  white-space: nowrap;
}

/* 封面 */
.cover-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.cover-picker__search {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cover-picker__search-input {
  flex: 1;
  min-width: 0;
}

.cover-picker__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.cover-picker__sources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cover-picker__input {
  display: none;
}

.cover-picker__selected {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--manager-line);
  border-radius: 6px;
}

.cover-picker__selected-thumb {
  flex: none;
  width: 48px;
  height: 64px;
  border-radius: 4px;
  object-fit: cover;
  background: var(--el-fill-color-light);
}

.cover-picker__selected-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.cover-picker__selected-label {
  color: var(--manager-placeholder);
  font-size: 11px;
}

.cover-picker__selected-value {
  color: var(--manager-ink-2);
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.cover-picker__results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  max-height: 240px;
  overflow: auto;
}

.cover-picker__item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  padding: 8px;
  border: 1px solid var(--manager-line);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.cover-picker__item:hover,
.cover-picker__item:focus-visible {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 8px 20px rgb(0 0 0 / 8%);
  transform: translateY(-1px);
}

.cover-picker__item:focus-visible {
  outline: 2px solid var(--el-color-primary-light-5);
  outline-offset: 2px;
}

.cover-picker__thumb {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 6px;
  object-fit: cover;
  background: var(--el-fill-color-light);
}

.cover-picker__title {
  display: -webkit-box;
  overflow: hidden;
  color: var(--manager-ink);
  font-size: 11.5px;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.cover-picker__meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--manager-placeholder);
  font-size: 10.5px;
}

.cover-picker__cover-only-button {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
  border-color: rgb(255 255 255 / 55%);
  background: rgb(255 255 255 / 72%);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
}

.cover-picker__item:hover .cover-picker__cover-only-button,
.cover-picker__item:focus-visible .cover-picker__cover-only-button,
.cover-picker__cover-only-button:focus-visible {
  opacity: 1;
  pointer-events: auto;
}

@media (max-width: 768px) {
  .media-form__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .media-form__field {
    grid-column: 1 / -1;
  }

  .cover-picker__search {
    flex-direction: column;
    align-items: stretch;
  }

  .media-card__tags {
    display: none;
  }
}
</style>
