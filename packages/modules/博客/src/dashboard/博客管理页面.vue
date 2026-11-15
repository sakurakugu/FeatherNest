<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInfiniteScroll, useStorage, watchDebounced } from '@vueuse/core'
import { DocumentAdd, Download, Filter, Search, Upload, View } from '@element-plus/icons-vue'
import {
  ElButton,
  ElIcon,
  ElMessage,
  ElPopconfirm,
  ElPopover,
  ElSkeleton,
  ElTooltip,
} from 'element-plus'
import {
  BaseDialog,
  格式化完整时间,
  格式化相对时间,
  PencilEditIcon,
  SegmentedSwitch,
  SortDirectionIcon,
  SortOrderControl,
} from '@feathernest/ui'
import '@feathernest/ui/styles/manager.css'
import { 获取API错误消息 } from '@feathernest/api'
import { 根据ID获取我的文章, type ArticleRecord } from '@feathernest/module-articles'
import MarkdownRenderer from '@feathernest/module-articles/components/Markdown渲染器.vue'
import {
  获取博客管理列表,
  获取博客管理统计,
  获取博客可见性统计,
  获取博客发布快照,
  发布博客文章,
  设置博客可见性,
  撤下博客发布,
  type BlogManageItem,
  type BlogManageSortField,
  type BlogManageState,
  type BlogVisibility,
} from '../publication'

const route = useRoute()
const router = useRouter()
const emit = defineEmits<{ 'published-blog-count-change': [count: number] }>()

const 前缀 = computed(() => (route.path.startsWith('/admin') ? '/admin' : ''))
const 每页条数 = 20

/** 页签：发布状态 */
const 状态页签: Array<{ value: BlogManageState; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'published', label: '已发布' },
  { value: 'unpublished', label: '未发布／已撤下' },
  { value: 'changed', label: '有未发布修改' },
]

// 列表状态
const 列表 = ref<BlogManageItem[]>([])
const 总数 = ref(0)
const 页数 = ref(1)
const 当前页 = ref(1)
const 导航模式 = useStorage<'status' | 'visibility'>(
  'feathernest.blog-manager.navigation',
  'status',
)
const 导航选项: Array<{ value: 'status' | 'visibility'; label: string }> = [
  { value: 'status', label: '状态' },
  { value: 'visibility', label: '可见性' },
]
const 当前状态 = ref<BlogManageState>('all')
const 当前可见性 = ref<BlogVisibility | 'none' | ''>('')
const 状态统计 = ref<Record<BlogManageState, number>>({
  all: 0,
  published: 0,
  unpublished: 0,
  changed: 0,
})
const 可见性统计 = ref<Record<BlogVisibility | 'all' | 'none', number>>({
  all: 0,
  public: 0,
  login_required: 0,
  none: 0,
})
const 搜索词 = ref('')
const 已应用搜索 = ref('')
const 初次加载 = ref(true)
const 刷新中 = ref(false)
const 加载更多中 = ref(false)
const 加载失败 = ref(false)
const 失败请求为追加 = ref(false)
const 列表容器 = ref<HTMLElement | null>(null)
const 处理中ID = ref('')

// 筛选与排序
const 封面筛选 = ref<'' | 'has' | 'none'>('')
const 排序字段 = ref<BlogManageSortField | ''>('')
const 排序方向 = ref<'asc' | 'desc'>('desc')
const 封面选项: Array<{ value: '' | 'has' | 'none'; label: string }> = [
  { value: '', label: '全部' },
  { value: 'has', label: '有封面' },
  { value: 'none', label: '无封面' },
]
const 排序选项: Array<{ value: BlogManageSortField; label: string }> = [
  { value: 'updated_at', label: '最近编辑' },
  { value: 'published_at', label: '发布更新' },
  { value: 'title', label: '标题' },
  { value: 'status', label: '发布状态' },
  { value: 'visibility', label: '可见性' },
  { value: 'word_count', label: '字数' },
  { value: 'version', label: '版本' },
  { value: 'view_count', label: '阅读量' },
  { value: 'like_count', label: '点赞数' },
]
const 可见性选项: Array<{ value: BlogVisibility | 'none' | ''; label: string }> = [
  { value: '', label: '全部' },
  { value: 'public', label: '公开' },
  { value: 'login_required', label: '登录可见' },
  { value: 'none', label: '未发布' },
]
const 筛选条件数 = computed(
  () =>
    Number(当前状态.value !== 'all') +
    Number(Boolean(当前可见性.value)) +
    Number(封面筛选.value !== ''),
)
const 排序提示 = computed(() => {
  if (!排序字段.value) return '未排序时按最近编辑时间倒序'
  const 标签 = 排序选项.find((选项) => 选项.value === 排序字段.value)?.label || ''
  return `当前按${标签}${排序方向.value === 'asc' ? '升序' : '降序'}`
})

// 列配置
const 博客列 = [
  { value: 'title', label: '文章', width: 'minmax(200px, 1.7fr)', minWidth: 200 },
  { value: 'status', label: '发布状态', width: '128px', minWidth: 128 },
  { value: 'visibility', label: '可见性', width: '112px', minWidth: 112 },
  { value: 'words', label: '字数', width: '124px', minWidth: 124 },
  { value: 'version', label: '版本', width: '84px', minWidth: 84 },
  { value: 'updated_at', label: '更新发布', width: '146px', minWidth: 146 },
  { value: 'stats', label: '阅读 / 点赞', width: '104px', minWidth: 104 },
] as const
type 博客列值 = (typeof 博客列)[number]['value']
const 可见列 = useStorage<博客列值[]>('feathernest.blog-manager.columns', [
  'title',
  'status',
  'visibility',
  'words',
  'updated_at',
])
const 展示列 = computed(() => 博客列.filter((column) => 可见列.value.includes(column.value)))
const 网格列 = computed(() => [...展示列.value.map((column) => column.width), '104px'].join(' '))
const 表格最小宽度 = computed(
  () => `${展示列.value.reduce((总宽, column) => 总宽 + column.minWidth + 16, 104)}px`,
)

/** 列表表头哪些列支持排序 */
function 列排序字段(列值: 博客列值): BlogManageSortField | null {
  switch (列值) {
    case 'status':
    case 'visibility':
    case 'version':
      return 列值
    case 'title':
      return 'title'
    case 'words':
      return 'word_count'
    case 'updated_at':
      return 'published_at'
    case 'stats':
      return 'view_count'
    default:
      return null
  }
}

function 切换列(列: 博客列值) {
  if (列 === 'title') return
  可见列.value = 可见列.value.includes(列)
    ? 可见列.value.filter((item) => item !== 列)
    : [...可见列.value, 列]
}

// 预览
const 预览打开 = ref(false)
const 预览加载中 = ref(false)
const 预览项 = ref<BlogManageItem | null>(null)
const 草稿内容 = ref<ArticleRecord | null>(null)
const 发布快照 = ref<ArticleRecord | null>(null)
const 预览版本 = ref<'draft' | 'snapshot'>('draft')
const 可见性选择 = ref<Record<string, BlogVisibility>>({})
const 预览选项 = [
  { label: '文章', value: 'draft' },
  { label: '发布版本', value: 'snapshot' },
]
const 预览内容 = computed(() => (预览版本.value === 'draft' ? 草稿内容.value : 发布快照.value))
const 还有更多 = computed(() => 当前页.value < 页数.value)
const 页头统计 = computed(() => {
  if (导航模式.value === 'visibility') {
    return `共 ${可见性统计.value.all} 篇文章 · ${可见性统计.value.public} 篇公开`
  }
  return `共 ${状态统计.value.all} 篇文章 · ${状态统计.value.published} 篇已发布`
})
const 空状态文案 = computed(() => {
  if (加载失败.value) return '文章加载失败，请稍后重试'
  if (已应用搜索.value || 筛选条件数.value) return '没有符合条件的文章'
  if (导航模式.value === 'status' && 当前状态.value !== 'all') return '这个状态下还没有文章'
  if (导航模式.value === 'visibility' && 当前可见性.value) return '这个可见性下还没有文章'
  return '还没有文章，先写一篇吧'
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
    const 数据 = await 获取博客管理列表({
      page: 请求页,
      pageSize: 每页条数,
      state: 当前状态.value,
      search: 已应用搜索.value,
      visibility: 当前可见性.value,
      hasCover: 封面筛选.value === '' ? null : 封面筛选.value === 'has',
      sortBy: 排序字段.value,
      sortOrder: 排序方向.value,
    })
    if (序号 !== 请求序号) return
    列表.value = 追加 ? [...列表.value, ...数据.items] : 数据.items
    当前页.value = 请求页
    总数.value = 数据.total
    页数.value = Math.max(1, 数据.pages)
    if (!追加 && 列表容器.value) 列表容器.value.scrollTop = 0
    if (!追加) void 刷新统计()
  } catch (错误) {
    if (序号 !== 请求序号) return
    加载失败.value = true
    失败请求为追加.value = 追加
    console.error('[博客管理] 列表加载失败', { 请求页, 追加, 错误 })
    ElMessage.error(获取API错误消息(错误, '加载博客管理失败'))
  } finally {
    if (序号 === 请求序号) {
      刷新中.value = false
      加载更多中.value = false
      初次加载.value = false
    }
  }
}

async function 刷新统计() {
  try {
    if (导航模式.value === 'visibility') {
      可见性统计.value = await 获取博客可见性统计()
      return
    }
    const 统计 = await 获取博客管理统计()
    状态统计.value = 统计
    // 侧栏展示全局已发布数量
    emit('published-blog-count-change', 统计.published)
  } catch (错误) {
    console.error('[博客管理] 统计加载失败', 错误)
  }
}

function 切换导航模式(模式: 'status' | 'visibility') {
  导航模式.value = 模式
}

function 切换状态(状态: BlogManageState) {
  if (当前状态.value === 状态) return
  当前状态.value = 状态
}

function 切换可见性页签(可见性: BlogVisibility | 'none' | '') {
  if (当前可见性.value === 可见性) return
  当前可见性.value = 可见性
}

function 切换排序(字段: BlogManageSortField) {
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

function 排序图标方向(字段: BlogManageSortField | '' | null): 'asc' | 'desc' | '' {
  if (!字段 || 排序字段.value !== 字段) return ''
  return 排序方向.value
}

function 设置排序方向(方向: 'asc' | 'desc') {
  排序字段.value ||= 'updated_at'
  排序方向.value = 方向
  console.info('[博客管理] 排序已更新', { 字段: 排序字段.value, 方向 })
}

function 可见性文案(item: BlogManageItem) {
  return 获取可见性(item) === 'public' ? '公开' : '登录可见'
}

function 可见性圆点(item: BlogManageItem) {
  return 获取可见性(item) === 'public' ? 'manager-dot--success' : 'manager-dot--warning'
}

function 可见性提示(item: BlogManageItem) {
  if (!item.publication) {
    return `未发布，发布后为${可见性文案(item)}，点击切换`
  }
  return `${可见性文案(item)}，点击切换为${获取可见性(item) === 'public' ? '登录可见' : '公开'}`
}

function 切换可见性(item: BlogManageItem) {
  void 修改可见性(item, 获取可见性(item) === 'public' ? 'login_required' : 'public')
}

function 清除筛选() {
  当前状态.value = 'all'
  当前可见性.value = ''
  封面筛选.value = ''
  排序字段.value = ''
  排序方向.value = 'desc'
}

function 重试加载() {
  void 拉取列表(失败请求为追加.value)
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

watch([导航模式, 已应用搜索, 当前状态, 当前可见性, 封面筛选, 排序字段, 排序方向], () => {
  void 拉取列表()
})

/* ==========================================================================
   状态与展示
   ========================================================================== */
function 状态文案(item: BlogManageItem) {
  if (!item.publication) return '未发布'
  if (!item.publication.is_published) return '已撤下'
  return item.has_unpublished_changes ? '有未发布修改' : '已发布'
}

function 状态圆点(item: BlogManageItem) {
  if (!item.publication || !item.publication.is_published) return 'manager-dot--muted'
  return item.has_unpublished_changes ? 'manager-dot--warning' : 'manager-dot--success'
}

function 获取可见性(item: BlogManageItem): BlogVisibility {
  return 可见性选择.value[item.id] ?? item.publication?.visibility ?? 'public'
}

function 发布按钮文案(item: BlogManageItem) {
  if (item.publication?.is_published) return '更新发布'
  return item.publication ? '重新发布' : '发布'
}

function 可以发布(item: BlogManageItem) {
  return !item.publication?.is_published || item.has_unpublished_changes
}

function 格式化字数(值: number) {
  return `${Math.max(0, 值).toLocaleString()} 字`
}

/* ==========================================================================
   发布 / 可见性 / 撤下
   ========================================================================== */
async function 发布(item: BlogManageItem) {
  if (处理中ID.value) return
  处理中ID.value = item.id
  try {
    await 发布博客文章(item.id, item.revision, 获取可见性(item))
    delete 可见性选择.value[item.id]
    console.info('[博客管理] 发布完成', { articleId: item.id, revision: item.revision })
    ElMessage.success(item.publication?.is_published ? '博客发布版本已更新' : '博客已发布')
    await 拉取列表()
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '发布失败'))
    console.error('[博客管理] 发布失败', 错误)
    await 拉取列表()
  } finally {
    处理中ID.value = ''
  }
}

async function 修改可见性(item: BlogManageItem, 值: BlogVisibility) {
  if (处理中ID.value) return
  if (!item.publication) {
    可见性选择.value[item.id] = 值
    return
  }
  if (值 === item.publication.visibility) return
  处理中ID.value = item.id
  try {
    await 设置博客可见性(item.id, 值)
    item.publication.visibility = 值
    console.info('[博客管理] 可见性已更新', { articleId: item.id, visibility: 值 })
    ElMessage.success('博客可见性已更新')
    // 可见性页签下切换后可能不再符合当前筛选，重新拉取
    if (导航模式.value === 'visibility') {
      await 拉取列表()
    }
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '修改可见性失败'))
    console.error('[博客管理] 修改可见性失败', 错误)
  } finally {
    处理中ID.value = ''
  }
}

async function 撤下(item: BlogManageItem) {
  if (处理中ID.value) return
  处理中ID.value = item.id
  try {
    await 撤下博客发布(item.id)
    console.info('[博客管理] 已撤下', { articleId: item.id })
    ElMessage.success('博客已撤下')
    await 拉取列表()
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '撤下失败'))
    console.error('[博客管理] 撤下失败', 错误)
  } finally {
    处理中ID.value = ''
  }
}

/* ==========================================================================
   预览
   ========================================================================== */
let 预览序号 = 0
async function 打开预览(item: BlogManageItem, 版本: 'draft' | 'snapshot') {
  const 序号 = ++预览序号
  预览项.value = item
  预览版本.value = 版本
  草稿内容.value = null
  发布快照.value = null
  预览打开.value = true
  预览加载中.value = true
  try {
    const [草稿, 快照] = await Promise.all([
      根据ID获取我的文章(item.id),
      item.publication ? 获取博客发布快照(item.id) : Promise.resolve(null),
    ])
    if (序号 !== 预览序号) return
    草稿内容.value = 草稿
    发布快照.value = 快照
  } catch (错误) {
    if (序号 !== 预览序号) return
    ElMessage.error(获取API错误消息(错误, '加载预览失败'))
    预览打开.value = false
  } finally {
    if (序号 === 预览序号) 预览加载中.value = false
  }
}

function 关闭预览() {
  预览打开.value = false
}

function 打开编辑器(文章ID?: string) {
  router.push(文章ID ? `${前缀.value}/articles/edit/${文章ID}` : `${前缀.value}/articles/edit`)
}

onMounted(() => {
  void 拉取列表()
})
</script>

<template>
  <div class="manager-page blog-manage-page">
    <header class="manager-head">
      <div>
        <h1>博客管理</h1>
        <p>{{ 页头统计 }}</p>
      </div>
      <div class="manager-head-actions">
        <ElButton type="primary" class="manager-create" @click="打开编辑器()">
          <ElIcon><DocumentAdd /></ElIcon>
          <span>写文章</span>
        </ElButton>
      </div>
    </header>

    <div class="manager-toolbar">
      <div class="manager-mode-nav" aria-label="博客导航切换">
        <button
          v-for="选项 in 导航选项"
          :key="选项.value"
          type="button"
          class="manager-mode-nav__item"
          :class="{ 'is-active': 导航模式 === 选项.value }"
          :aria-pressed="导航模式 === 选项.value"
          @click="切换导航模式(选项.value)"
        >
          <ElIcon>
            <svg
              v-if="选项.value === 'status'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
              <circle cx="12" cy="12" r="2.6" />
            </svg>
          </ElIcon>
          <span>{{ 选项.label }}</span>
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
              aria-label="筛选博客文章"
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
                  v-for="选项 in 状态页签"
                  :key="选项.value || 'all'"
                  type="button"
                  class="manager-filter-chip"
                  :class="{ 'is-active': 当前状态 === 选项.value }"
                  :aria-pressed="当前状态 === 选项.value"
                  @click="当前状态 = 选项.value"
                >
                  {{ 选项.label }}
                </button>
              </div>
            </div>
            <div class="manager-filter-group">
              <label>可见性</label>
              <div class="manager-filter-chips">
                <button
                  v-for="选项 in 可见性选项"
                  :key="选项.value || 'all'"
                  type="button"
                  class="manager-filter-chip"
                  :class="{ 'is-active': 当前可见性 === 选项.value }"
                  :aria-pressed="当前可见性 === 选项.value"
                  @click="当前可见性 = 选项.value"
                >
                  {{ 选项.label }}
                </button>
              </div>
            </div>
            <div class="manager-filter-group">
              <label>封面</label>
              <div class="manager-filter-chips">
                <button
                  v-for="选项 in 封面选项"
                  :key="选项.value || 'all'"
                  type="button"
                  class="manager-filter-chip"
                  :class="{ 'is-active': 封面筛选 === 选项.value }"
                  :aria-pressed="封面筛选 === 选项.value"
                  @click="封面筛选 = 选项.value"
                >
                  {{ 选项.label }}
                </button>
              </div>
            </div>
            <div class="manager-filter-group">
              <label>排序</label>
              <div class="blog-sort-options">
                <button
                  v-for="选项 in 排序选项"
                  :key="选项.value"
                  type="button"
                  class="manager-filter-chip manager-sort-option blog-sort-option"
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
              <p class="manager-sort-hint">{{ 排序提示 }}</p>
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
            placeholder="搜索文章标题"
            aria-label="搜索文章"
            maxlength="200"
          />
        </label>
      </div>
    </div>

    <div class="manager-tabs-row">
      <nav v-if="导航模式 === 'status'" class="manager-tabs" aria-label="博客发布状态">
        <button
          v-for="页签 in 状态页签"
          :key="页签.value"
          type="button"
          class="manager-tab"
          :class="{ 'is-active': 当前状态 === 页签.value }"
          :aria-pressed="当前状态 === 页签.value"
          @click="切换状态(页签.value)"
        >
          {{ 页签.label }}
          <small>{{ 状态统计[页签.value] }}</small>
        </button>
      </nav>
      <nav v-else class="manager-tabs" aria-label="博客可见性">
        <button
          type="button"
          class="manager-tab"
          :class="{ 'is-active': !当前可见性 }"
          :aria-pressed="!当前可见性"
          @click="切换可见性页签('')"
        >
          全部
          <small>{{ 可见性统计.all }}</small>
        </button>
        <button
          type="button"
          class="manager-tab"
          :class="{ 'is-active': 当前可见性 === 'public' }"
          :aria-pressed="当前可见性 === 'public'"
          @click="切换可见性页签('public')"
        >
          公开
          <small>{{ 可见性统计.public }}</small>
        </button>
        <button
          type="button"
          class="manager-tab"
          :class="{ 'is-active': 当前可见性 === 'login_required' }"
          :aria-pressed="当前可见性 === 'login_required'"
          @click="切换可见性页签('login_required')"
        >
          登录可见
          <small>{{ 可见性统计.login_required }}</small>
        </button>
        <button
          type="button"
          class="manager-tab"
          :class="{ 'is-active': 当前可见性 === 'none' }"
          :aria-pressed="当前可见性 === 'none'"
          @click="切换可见性页签('none')"
        >
          未发布
          <small>{{ 可见性统计.none }}</small>
        </button>
      </nav>
    </div>

    <ElSkeleton :loading="初次加载 && !列表.length" animated class="blog-manage-skeleton">
      <div
        ref="列表容器"
        v-loading="刷新中"
        class="manager-list-body"
        :aria-busy="刷新中 || 加载更多中"
      >
        <div
          class="manager-table"
          role="table"
          aria-label="博客文章列表"
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
                @click="切换排序(列排序字段(列.value) as BlogManageSortField)"
              >
                <span>{{ 列.label }}</span>
                <ElIcon
                  ><SortDirectionIcon :direction="排序图标方向(列排序字段(列.value))"
                /></ElIcon>
              </button>
              <span v-else>{{ 列.label }}</span>
            </div>
            <div class="manager-column-actions manager-fixed-actions" role="columnheader">
              <span>操作</span>
              <ElPopover
                placement="bottom-end"
                :width="180"
                trigger="click"
                popper-class="manager-popover"
              >
                <template #reference>
                  <button type="button" title="设置显示列" aria-label="设置显示列">
                    <ElIcon class="manager-column-more"
                      ><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" /></svg
                    ></ElIcon>
                  </button>
                </template>
                <div class="manager-column-settings">
                  <label v-for="列 in 博客列" :key="列.value">
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

          <div v-for="文章 in 列表" :key="文章.id" class="manager-row" role="row">
            <div v-for="列 in 展示列" :key="列.value" role="cell" class="manager-cell">
              <div v-if="列.value === 'title'" class="blog-title">
                <button
                  type="button"
                  class="blog-title-button"
                  :title="文章.title || '未命名文章'"
                  @click="打开预览(文章 as BlogManageItem, 文章.publication ? 'snapshot' : 'draft')"
                >
                  {{ 文章.title || '未命名文章' }}
                </button>
                <span
                  v-if="文章.publication && 文章.title !== 文章.publication.title"
                  class="blog-title-sub"
                  :title="文章.publication.title"
                >
                  发布标题：{{ 文章.publication.title }}
                </span>
              </div>

              <span v-else-if="列.value === 'status'" class="manager-status">
                <i :class="状态圆点(文章 as BlogManageItem)" />{{
                  状态文案(文章 as BlogManageItem)
                }}
              </span>

              <ElTooltip
                v-else-if="列.value === 'visibility'"
                :content="可见性提示(文章 as BlogManageItem)"
                placement="top"
              >
                <button
                  type="button"
                  class="manager-status blog-visibility"
                  :disabled="!!处理中ID"
                  :aria-label="可见性提示(文章 as BlogManageItem)"
                  @click="切换可见性(文章 as BlogManageItem)"
                >
                  <i :class="可见性圆点(文章 as BlogManageItem)" />
                  {{ 可见性文案(文章 as BlogManageItem) }}
                </button>
              </ElTooltip>

              <div v-else-if="列.value === 'words'" class="blog-words">
                <template v-if="文章.publication">
                  <span>发布 {{ 格式化字数(文章.publication.word_count) }}</span>
                  <span
                    v-if="文章.word_count !== 文章.publication.word_count"
                    :class="文章.word_count > 文章.publication.word_count ? 'blog-words--added' : 'blog-words--removed'"
                  >
                    （{{ 文章.word_count > 文章.publication.word_count ? '+' : '-' }}{{ 格式化字数(Math.abs(文章.word_count - 文章.publication.word_count)) }}）
                  </span>
                </template>
                <span v-else class="manager-muted">未发布</span>
              </div>

              <span v-else-if="列.value === 'version'" class="manager-muted">
                {{ 文章.publication ? `第 ${文章.publication.version} 版` : '—' }}
              </span>

              <ElTooltip
                v-else-if="列.value === 'updated_at'"
                :content="格式化完整时间(文章.publication?.updated_at)"
                placement="top"
                popper-class="manager-date-tooltip"
              >
                <span class="manager-date">
                  {{ 格式化相对时间(文章.publication?.updated_at) }}
                </span>
              </ElTooltip>

              <span v-else class="manager-muted">
                {{ 文章.publication?.view_count ?? 0 }} ／ {{ 文章.publication?.like_count ?? 0 }}
              </span>
            </div>

            <div role="cell" class="manager-fixed-actions">
              <div class="manager-ops">
                <ElTooltip content="预览文章" placement="top">
                  <button
                    type="button"
                    title="预览文章"
                    aria-label="预览文章"
                    :disabled="!!处理中ID"
                    @click="
                      打开预览(文章 as BlogManageItem, 文章.publication ? 'snapshot' : 'draft')
                    "
                  >
                    <ElIcon><View /></ElIcon>
                  </button>
                </ElTooltip>
                <ElTooltip content="编辑文章" placement="top">
                  <button
                    type="button"
                    title="编辑文章"
                    aria-label="编辑文章"
                    :disabled="!!处理中ID"
                    @click="打开编辑器(文章.id)"
                  >
                    <ElIcon><PencilEditIcon /></ElIcon>
                  </button>
                </ElTooltip>
                <ElPopconfirm
                  :title="`确定${发布按钮文案(文章 as BlogManageItem)}《${文章.title || '未命名文章'}》？`"
                  :confirm-button-text="发布按钮文案(文章 as BlogManageItem)"
                  cancel-button-text="取消"
                  :width="260"
                  @confirm="发布(文章 as BlogManageItem)"
                >
                  <template #reference>
                    <button
                      type="button"
                      :title="发布按钮文案(文章 as BlogManageItem)"
                      :aria-label="发布按钮文案(文章 as BlogManageItem)"
                      :disabled="!!处理中ID || !可以发布(文章 as BlogManageItem)"
                    >
                      <ElIcon :class="{ 'is-busy': 处理中ID === 文章.id }"><Upload /></ElIcon>
                    </button>
                  </template>
                </ElPopconfirm>
                <ElPopconfirm
                  :title="`确定撤下《${文章.publication?.title || 文章.title || '未命名文章'}》？`"
                  confirm-button-text="撤下"
                  cancel-button-text="取消"
                  :width="260"
                  @confirm="撤下(文章 as BlogManageItem)"
                >
                  <template #reference>
                    <button
                      type="button"
                      class="blog-withdraw-action"
                      title="撤下博客"
                      aria-label="撤下博客"
                      :disabled="!!处理中ID || !文章.publication?.is_published"
                    >
                      <ElIcon><Download /></ElIcon>
                    </button>
                  </template>
                </ElPopconfirm>
              </div>
            </div>
          </div>
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
          <span v-else-if="加载更多中">正在加载更多文章…</span>
          <button v-else-if="还有更多" type="button" @click="拉取列表(true)">加载更多</button>
          <span v-else>已显示全部文章</span>
        </div>
      </div>
    </ElSkeleton>

    <BaseDialog
      v-model="预览打开"
      class="manager-dialog blog-preview-dialog"
      modal-class="manager-dialog-overlay"
      width="min(900px, calc(100vw - 32px))"
      @closed="预览项 = null"
    >
      <template #header>
        <div class="manager-dialog-header">
          <i />
          <strong>文章预览</strong>
          <span>{{ 预览项?.title || '未命名文章' }}</span>
        </div>
      </template>
      <div class="manager-dialog-form blog-preview-form">
        <div class="blog-preview-controls">
          <SegmentedSwitch
            v-if="预览项?.publication"
            v-model="预览版本"
            :options="预览选项"
            aria-label="预览版本"
          />
          <span v-if="预览内容" class="manager-muted">{{ 格式化字数(预览内容.word_count) }}</span>
        </div>
        <ElSkeleton :loading="预览加载中" animated :rows="8">
          <article v-if="预览内容" class="blog-preview-article">
            <h2>{{ 预览内容.title }}</h2>
            <img v-if="预览内容.cover_url" :src="预览内容.cover_url" :alt="预览内容.title" />
            <p v-if="预览内容.excerpt" class="manager-muted">{{ 预览内容.excerpt }}</p>
            <div class="blog-preview-taxonomy">
              <span v-if="预览内容.category" class="blog-preview-tag">{{
                预览内容.category.name
              }}</span>
              <span v-for="标签 in 预览内容.tags" :key="标签.id" class="blog-preview-tag">
                {{ 标签.name }}
              </span>
            </div>
            <MarkdownRenderer :content="预览内容.content" />
          </article>
        </ElSkeleton>
      </div>
      <template #footer>
        <div class="manager-dialog-footer">
          <span>预览内容仅自己可见</span>
          <ElButton @click="关闭预览">关闭</ElButton>
        </div>
      </template>
    </BaseDialog>
  </div>
</template>

<style scoped>
.blog-manage-skeleton {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.blog-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.blog-title-button {
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

.blog-title-button:hover {
  color: var(--el-color-primary);
  text-decoration: underline;
}

.blog-title-sub {
  overflow: hidden;
  color: var(--manager-muted);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.blog-visibility {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.blog-visibility:not(:disabled):hover {
  color: var(--el-color-primary);
}

.blog-visibility:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.blog-words {
  display: flex;
  align-items: center;
  color: var(--manager-ink-2);
  font-size: 11.5px;
  white-space: nowrap;
}

.blog-words--added {
  color: var(--el-color-success);
}

.blog-words--removed {
  color: var(--el-color-danger);
}

.blog-manage-page .manager-ops .is-busy {
  color: var(--el-color-primary);
}

.blog-manage-page .manager-ops .blog-withdraw-action:not(:disabled) {
  color: var(--el-color-danger);
}

.blog-manage-page .manager-ops .blog-withdraw-action:not(:disabled):hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

/* 筛选面板里的排序选项：两列排布，右侧显示升 / 降序箭头 */
.blog-sort-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.blog-sort-option {
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  text-align: left;
}

.blog-sort-option > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.blog-manage-page .manager-sort-hint,
.manager-filter-panel .manager-sort-hint {
  margin: 8px 0 0;
  color: var(--manager-placeholder);
  font-size: 11px;
  line-height: 1.5;
}

.blog-preview-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.blog-preview-article {
  overflow-wrap: anywhere;
}

.blog-preview-article h2 {
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 600;
}

.blog-preview-article > img {
  max-width: 100%;
  max-height: 260px;
  object-fit: contain;
  border-radius: 6px;
}

.blog-preview-taxonomy {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}

.blog-preview-tag {
  padding: 2px 8px;
  border: 1px solid var(--manager-line);
  border-radius: 4px;
  color: var(--manager-ink-2);
  font-size: 11.5px;
}
</style>
