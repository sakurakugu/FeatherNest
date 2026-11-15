<script setup lang="ts">
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElImageViewer,
  ElMessage,
  ElPopconfirm,
  ElPopover,
  ElSkeleton,
  ElTooltip,
} from 'element-plus'
import {
  Check,
  Close,
  Delete,
  Filter,
  MoreFilled,
  Plus,
  RefreshLeft,
  Search,
} from '@element-plus/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useInfiniteScroll, useStorage, watchDebounced } from '@vueuse/core'
import {
  批准友链 as 请求批准友链,
  创建友链,
  删除友链 as 请求删除友链,
  获取友链分类,
  获取友链列表 as 请求获取友链列表,
  恢复友链 as 请求恢复友链,
  拒绝友链 as 请求拒绝友链,
  更新友链,
} from '../../api'
import type {
  FriendLinkAdminPayload,
  FriendLinkCounts,
  FriendLinkRecord,
  FriendLinkSortField,
  FriendLinkStatus,
} from '../../types'
import { 获取API错误消息 } from '../../../../shared/api'
import { BaseDialog, PencilEditIcon, SortDirectionIcon, SortOrderControl } from '@feathernest/ui'
import { FriendLinkIcon } from '@feathernest/module-blog/widgets'
import { 创建字符图标, 读取字符图标, 获取名称缩写 } from '@feathernest/module-blog/friend-links/icon'

const emit = defineEmits<{ 'friend-link-count-change': [count: number] }>()

const initialLoading = ref(true)
const refreshing = ref(false)
const loadingMore = ref(false)
const loadFailed = ref(false)
const failedAppend = ref(false)
const listBody = ref<HTMLElement | null>(null)
const friendLinks = ref<FriendLinkRecord[]>([])
const pagination = ref({ page: 0, pageSize: 30, total: 0, pageCount: 0 })
const counts = ref<FriendLinkCounts>({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  active_total: 0,
  recycle_bin: 0,
  categories: [],
})
const statusFilter = ref<FriendLinkStatus | ''>('')
const categoryFilter = ref<string | null>('')
const navigationMode = useStorage<'status' | 'category'>(
  'feathernest.friend-link-manager.navigation',
  'status',
)
const navigationOptions = [
  { value: 'status', label: '状态' },
  { value: 'category', label: '分类' },
] as const
const previewIconUrl = ref('')

function selectNavigationMode(mode: 'status' | 'category') {
  navigationMode.value = mode
  if (mode === 'status') categoryFilter.value = ''
  else statusFilter.value = ''
}

function selectStatus(value: FriendLinkStatus | '') {
  selectNavigationMode('status')
  statusFilter.value = value
}

function selectCategory(value: string | null) {
  selectNavigationMode('category')
  categoryFilter.value = value
}
const categoryOptions = computed(() => [
  { value: '' as string | null, label: '全部', count: counts.value.total },
  {
    value: null,
    label: '未分类',
    count: counts.value.categories.find((item) => !item.category)?.count || 0,
  },
  ...counts.value.categories
    .filter((item) => item.category)
    .map((item) => ({ value: item.category, label: item.category, count: item.count })),
])
const exchangeFilter = ref<'' | 'manual' | 'auto'>('')
const searchText = ref('')
const appliedSearch = ref('')
const sortBy = ref<FriendLinkSortField | ''>('')
const sortOrder = ref<'asc' | 'desc'>('desc')
const categories = ref<string[]>([])
const showRecycleBin = ref(false)
const statusOptions: { label: string; value: FriendLinkStatus | '' }[] = [
  { label: '全部', value: '' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
]
// 编辑弹窗里的状态选项：直接点击切换，不含“全部”
const dialogStatusOptions: { label: string; value: FriendLinkStatus }[] = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
]
const exchangeOptions = [
  { label: '全部', value: '' },
  { label: '手动添加', value: 'manual' },
  { label: '自动交换', value: 'auto' },
] as const
const linkColumns = computed(
  () =>
    [
      { value: 'name', label: '网站', sort: 'name', width: 'minmax(160px, 1fr)', minWidth: 160 },
      { value: 'url', label: '链接', sort: 'url', width: 'minmax(180px, 1fr)', minWidth: 180 },
      {
        value: 'description',
        label: '描述',
        sort: 'description',
        width: 'minmax(180px, 1fr)',
        minWidth: 180,
      },
      { value: 'status', label: '状态', sort: 'status', width: '96px', minWidth: 96 },
      { value: 'category', label: '分类', sort: 'category', width: '110px', minWidth: 110 },
      {
        value: 'is_auto_exchange',
        label: '来源',
        sort: 'is_auto_exchange',
        width: '96px',
        minWidth: 96,
      },
      {
        value: 'contact_name',
        label: '联系人',
        sort: 'contact_name',
        width: '160px',
        minWidth: 160,
      },
      {
        value: 'date',
        label: showRecycleBin.value ? '删除时间' : '创建时间',
        sort: showRecycleBin.value ? 'deleted_at' : 'created_at',
        width: '150px',
        minWidth: 150,
      },
      { value: 'updated_at', label: '最近编辑', sort: 'updated_at', width: '150px', minWidth: 150 },
    ] as const,
)
type LinkColumn = (typeof linkColumns.value)[number]['value']
const visibleColumns = useStorage<LinkColumn[]>('feathernest.friend-link-manager.columns', [
  'name',
  'url',
  'description',
  'status',
  'category',
  'date',
])
const displayedColumns = computed(() =>
  linkColumns.value.filter((column) => visibleColumns.value.includes(column.value)),
)
const gridColumns = computed(() =>
  [...displayedColumns.value.map((column) => column.width), '104px'].join(' '),
)
const tableMinWidth = computed(
  () => `${displayedColumns.value.reduce((total, column) => total + column.minWidth + 16, 104)}px`,
)
const filterCount = computed(
  () =>
    Number(Boolean(statusFilter.value)) +
    Number(categoryFilter.value !== '') +
    Number(Boolean(exchangeFilter.value)),
)
const hasMore = computed(() => pagination.value.page < pagination.value.pageCount)

function toggleColumn(column: LinkColumn) {
  if (column === 'name') return
  visibleColumns.value = visibleColumns.value.includes(column)
    ? visibleColumns.value.filter((item) => item !== column)
    : [...visibleColumns.value, column]
}

function changeSort(field: FriendLinkSortField) {
  if (sortBy.value !== field) {
    sortBy.value = field
    sortOrder.value = 'asc'
  } else if (sortOrder.value === 'asc') {
    sortOrder.value = 'desc'
  } else {
    sortBy.value = ''
    sortOrder.value = 'desc'
  }
}

function 设置排序方向(方向: 'asc' | 'desc') {
  sortBy.value ||= showRecycleBin.value ? 'deleted_at' : 'created_at'
  sortOrder.value = 方向
  console.info('[友链管理] 排序已更新', { 字段: sortBy.value, 方向 })
}

function clearFilters() {
  statusFilter.value = ''
  categoryFilter.value = ''
  exchangeFilter.value = ''
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatRelativeDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  const timestamp = date.getTime()
  if (Number.isNaN(timestamp)) return '—'
  const difference = Date.now() - timestamp
  const minutes = Math.floor(difference / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const today = new Date().setHours(0, 0, 0, 0)
  const targetDay = new Date(timestamp).setHours(0, 0, 0, 0)
  const days = Math.round((today - targetDay) / 86400000)
  if (days <= 0) return `${Math.floor(difference / 3600000)} 小时前`
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  const shortDate = formatDate(value).slice(0, 10)
  return date.getFullYear() === new Date().getFullYear() ? shortDate.slice(5) : shortDate
}

const showDialog = ref(false)
const isEdit = ref(false)
const currentId = ref('')
const dialogLoading = ref(false)
const iconMode = ref<'auto' | 'image' | 'character'>('auto')
const iconImageUrl = ref('')
const iconOptions = [
  { value: 'auto', label: '自动获取' },
  { value: 'image', label: '图片 URL' },
  { value: 'character', label: '字符图标' },
] as const
const dialogIconUrl = computed(() =>
  iconMode.value === 'character'
    ? 创建字符图标(获取名称缩写(form.value.name))
    : iconMode.value === 'image'
      ? iconImageUrl.value.trim()
      : '',
)
const iconIncomplete = computed(() => iconMode.value === 'image' && !iconImageUrl.value.trim())
const iconHint = computed(() =>
  iconMode.value === 'character'
    ? '用名称首字生成图标'
    : '自动读取网站图标，失败用名称首字',
)

const form = ref<FriendLinkAdminPayload>({
  name: '',
  url: '',
  description: '',
  logo_url: '',
  category: '',
  status: 'approved',
})
// 编辑弹窗的分类选项：未分类 + 现有分类，兼容记录里的自定义分类
const dialogCategoryOptions = computed(() => {
  const names = [...new Set(categories.value.filter(Boolean))]
  const current = form.value.category.trim()
  if (current && !names.includes(current)) names.push(current)
  return [{ value: '', label: '未分类' }, ...names.map((name) => ({ value: name, label: name }))]
})
const showSkeleton = computed(() => initialLoading.value && friendLinks.value.length === 0)

let requestVersion = 0
async function fetchFriendLinks(append = false) {
  if (append && (loadingMore.value || refreshing.value || initialLoading.value || !hasMore.value))
    return
  const version = append ? requestVersion : ++requestVersion
  const page = append ? pagination.value.page + 1 : 1
  if (append) loadingMore.value = true
  else {
    refreshing.value = !initialLoading.value
    loadingMore.value = false
  }
  loadFailed.value = false
  try {
    const data = await 请求获取友链列表(page, pagination.value.pageSize, {
      status: statusFilter.value,
      is_deleted: showRecycleBin.value,
      search: appliedSearch.value,
      category: categoryFilter.value || undefined,
      uncategorized: categoryFilter.value === null,
      is_auto_exchange: exchangeFilter.value ? exchangeFilter.value === 'auto' : undefined,
      sort_by: sortBy.value || undefined,
      sort_order: sortOrder.value,
    })
    if (version !== requestVersion) return
    friendLinks.value = append ? [...friendLinks.value, ...data.items] : data.items
    pagination.value = {
      page: data.page,
      pageSize: data.page_size,
      total: data.total,
      pageCount: data.pages,
    }
    counts.value = data.counts
    emit('friend-link-count-change', data.counts.active_total)
    if (!append && listBody.value) listBody.value.scrollTop = 0
  } catch (error) {
    if (version !== requestVersion) return
    loadFailed.value = true
    failedAppend.value = append
    console.error('友链列表加载失败', { page, isDeleted: showRecycleBin.value, error })
    ElMessage.error(获取API错误消息(error, '加载友链失败'))
  } finally {
    if (version === requestVersion) {
      refreshing.value = false
      initialLoading.value = false
      loadingMore.value = false
    }
  }
}

function openCreate() {
  iconMode.value = 'auto'
  iconImageUrl.value = ''
  isEdit.value = false
  currentId.value = ''
  form.value = {
    name: '',
    url: '',
    description: '',
    logo_url: '',
    category: '',
    status: 'approved',
  }
  showDialog.value = true
}

function openEdit(friendLink: FriendLinkRecord) {
  iconMode.value = 读取字符图标(friendLink.logo_url || '')
    ? 'character'
    : friendLink.logo_url
      ? 'image'
      : 'auto'
  iconImageUrl.value = iconMode.value === 'image' ? friendLink.logo_url || '' : ''
  isEdit.value = true
  currentId.value = friendLink.id
  form.value = {
    name: friendLink.name,
    url: friendLink.url,
    description: friendLink.description || '',
    logo_url: friendLink.logo_url || '',
    category: friendLink.category || '',
    status: friendLink.status,
  }
  showDialog.value = true
}

async function save() {
  if (dialogLoading.value) return
  if (!form.value.name.trim() || !form.value.url.trim() || iconIncomplete.value) {
    ElMessage.warning('请填写完整信息')
    return
  }

  dialogLoading.value = true
  const payload = { ...form.value, logo_url: dialogIconUrl.value }
  try {
    if (isEdit.value) {
      await 更新友链(currentId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await 创建友链(payload)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    void fetchFriendLinks()
    void loadCategories()
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '保存失败'))
  } finally {
    dialogLoading.value = false
  }
}

async function deleteFriendLink(id: string) {
  try {
    await 请求删除友链(id, showRecycleBin.value)
    ElMessage.success(showRecycleBin.value ? '已永久删除' : '已移至回收站')
    void fetchFriendLinks()
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '删除失败'))
  }
}

async function restoreFriendLink(friendLink: FriendLinkRecord) {
  try {
    await 请求恢复友链(friendLink.id)
    ElMessage.success('已恢复')
    void fetchFriendLinks()
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '恢复失败'))
  }
}

async function approveFriendLink(friendLink: FriendLinkRecord) {
  try {
    await 请求批准友链(friendLink.id)
    ElMessage.success('已通过')
    void fetchFriendLinks()
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '操作失败'))
  }
}

async function rejectFriendLink(friendLink: FriendLinkRecord) {
  try {
    await 请求拒绝友链(friendLink.id)
    ElMessage.success('已拒绝')
    void fetchFriendLinks()
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '操作失败'))
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'approved':
      return '已通过'
    case 'pending':
      return '待审核'
    case 'rejected':
      return '已拒绝'
    default:
      return status
  }
}

async function loadCategories() {
  try {
    categories.value = await 获取友链分类()
  } catch (error) {
    console.error('友链分类加载失败', error)
    ElMessage.error(获取API错误消息(error, '加载友链分类失败'))
  }
}

function toggleRecycleBin() {
  showRecycleBin.value = !showRecycleBin.value
  if (sortBy.value === 'created_at' || sortBy.value === 'deleted_at') sortBy.value = ''
}

watchDebounced(
  searchText,
  (value) => {
    appliedSearch.value = value.trim()
  },
  { debounce: 300 },
)
watch(
  [statusFilter, categoryFilter, exchangeFilter, appliedSearch, sortBy, sortOrder, showRecycleBin],
  () => {
    void fetchFriendLinks()
  },
)
useInfiniteScroll(listBody, () => fetchFriendLinks(true), {
  distance: 160,
  canLoadMore: () =>
    hasMore.value &&
    !initialLoading.value &&
    !refreshing.value &&
    !loadingMore.value &&
    !loadFailed.value,
})

onMounted(() => {
  void fetchFriendLinks()
  void loadCategories()
})
</script>

<template>
  <div class="friend-link-manager">
    <header class="manager-head">
      <div>
        <h1>{{ showRecycleBin ? '回收站' : '友链管理' }}</h1>
        <p>共 {{ showRecycleBin ? counts.recycle_bin : counts.active_total }} 个友链</p>
      </div>
      <ElButton v-if="!showRecycleBin" class="manager-create" type="primary" @click="openCreate">
        <ElIcon><Plus /></ElIcon><span>添加友链</span>
      </ElButton>
    </header>

    <div class="manager-toolbar">
      <div class="manager-mode-nav" aria-label="友链导航切换">
        <button
          v-for="option in navigationOptions"
          :key="option.value"
          type="button"
          class="manager-mode-nav__item"
          :class="{ 'is-active': navigationMode === option.value }"
          :aria-pressed="navigationMode === option.value"
          @click="selectNavigationMode(option.value)"
        >
          <ElIcon>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                v-if="option.value === 'status'"
                d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"
              />
              <template v-else>
                <rect x="3" y="4" width="8" height="7" rx="1" />
                <rect x="13" y="4" width="8" height="7" rx="1" />
                <rect x="3" y="13" width="8" height="7" rx="1" />
                <rect x="13" y="13" width="8" height="7" rx="1" />
              </template>
            </svg>
          </ElIcon>
          <span>{{ option.label }}</span>
        </button>
      </div>
      <div class="manager-filters">
        <ElPopover placement="bottom-end" :width="330" trigger="click">
          <template #reference>
            <button
              type="button"
              class="manager-filter-button"
              :class="{ 'is-active': filterCount > 0 }"
              aria-label="筛选友链"
            >
              <ElIcon><Filter /></ElIcon><span>筛选</span
              ><small v-if="filterCount">{{ filterCount }}</small>
            </button>
          </template>
          <div class="link-filter-panel">
            <div class="link-filter-group">
              <label>状态</label>
              <div class="link-filter-chips">
                <button
                  v-for="option in statusOptions"
                  :key="option.value"
                  type="button"
                  class="link-filter-chip"
                  :class="{ 'is-active': statusFilter === option.value }"
                  :aria-pressed="statusFilter === option.value"
                  @click="selectStatus(option.value)"
                >
                  {{ option.value ? option.label : '全部' }}
                </button>
              </div>
            </div>
            <div class="link-filter-group">
              <label>分类</label>
              <div class="link-filter-chips link-filter-chips--categories">
                <button
                  v-for="option in categoryOptions"
                  :key="option.value === null ? 'uncategorized' : `category-${option.value}`"
                  type="button"
                  class="link-filter-chip"
                  :class="{ 'is-active': categoryFilter === option.value }"
                  :aria-pressed="categoryFilter === option.value"
                  @click="selectCategory(categoryFilter === option.value ? '' : option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
            <div class="link-filter-group">
              <label>来源</label>
              <div class="link-filter-chips">
                <button
                  v-for="option in exchangeOptions"
                  :key="option.value"
                  type="button"
                  class="link-filter-chip"
                  :class="{ 'is-active': exchangeFilter === option.value }"
                  @click="exchangeFilter = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
            <div class="link-filter-group">
              <label>排序</label>
              <div class="link-sort-options">
                <button
                  v-for="column in linkColumns"
                  :key="column.value"
                  type="button"
                  class="link-filter-chip link-sort-option"
                  :class="{ 'is-active': sortBy === column.sort }"
                  :aria-pressed="sortBy === column.sort"
                  @click="changeSort(column.sort)"
                >
                  <span>{{ column.label }}</span
                  ><ElIcon
                    ><SortDirectionIcon :direction="sortBy === column.sort ? sortOrder : ''"
                  /></ElIcon>
                </button>
              </div>
              <SortOrderControl
                :model-value="sortBy ? sortOrder : ''"
                @update:model-value="设置排序方向"
              />
            </div>
            <div class="link-filter-footer">
              <span>{{ filterCount ? `已选 ${filterCount} 个条件` : '未设置筛选条件' }}</span>
              <ElButton text @click="clearFilters">清除筛选</ElButton>
            </div>
          </div>
        </ElPopover>
        <label class="manager-search">
          <ElIcon><Search /></ElIcon>
          <input
            v-model="searchText"
            placeholder="搜索网站、链接、描述或联系人"
            aria-label="搜索友链"
            type="search"
            maxlength="200"
          />
        </label>
      </div>
    </div>

    <div class="manager-tabs-row">
      <nav v-if="navigationMode === 'status'" class="manager-tabs" aria-label="友链状态">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          type="button"
          class="manager-tab"
          :class="{ 'is-active': statusFilter === option.value }"
          :aria-pressed="statusFilter === option.value"
          @click="selectStatus(option.value)"
        >
          {{ option.label }} <small>{{ counts[option.value || 'total'] }}</small>
        </button>
      </nav>
      <nav v-else class="manager-tabs" aria-label="友链分类">
        <button
          v-for="option in categoryOptions"
          :key="option.value === null ? 'uncategorized' : `category-${option.value}`"
          type="button"
          class="manager-tab"
          :class="{ 'is-active': categoryFilter === option.value }"
          :aria-pressed="categoryFilter === option.value"
          @click="selectCategory(option.value)"
        >
          {{ option.label }} <small>{{ option.count }}</small>
        </button>
      </nav>
      <button
        type="button"
        class="manager-tab"
        :class="{ 'is-active': showRecycleBin }"
        :aria-pressed="showRecycleBin"
        @click="toggleRecycleBin"
      >
        {{ showRecycleBin ? '返回列表' : '回收站' }}
        <small>{{ showRecycleBin ? counts.active_total : counts.recycle_bin }}</small>
      </button>
    </div>

    <ElSkeleton :loading="showSkeleton" animated>
      <div
        ref="listBody"
        v-loading="refreshing"
        class="manager-list-body"
        :aria-busy="refreshing || loadingMore"
      >
        <div
          class="manager-table"
          role="table"
          aria-label="友链列表"
          :aria-colcount="displayedColumns.length + 1"
          :style="{ minWidth: tableMinWidth, '--manager-grid-columns': gridColumns }"
        >
          <div class="manager-row manager-row-head" role="row">
            <div
              v-for="column in displayedColumns"
              :key="column.value"
              role="columnheader"
              :aria-sort="
                sortBy === column.sort ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'
              "
            >
              <button
                type="button"
                class="manager-sort-heading"
                :class="{ 'is-active': sortBy === column.sort }"
                @click="changeSort(column.sort)"
              >
                {{ column.label
                }}<ElIcon
                  ><SortDirectionIcon :direction="sortBy === column.sort ? sortOrder : ''"
                /></ElIcon>
              </button>
            </div>
            <div class="manager-column-actions manager-fixed-actions" role="columnheader">
              <span>操作</span>
              <ElPopover placement="bottom-end" :width="190" trigger="click">
                <template #reference
                  ><button type="button" title="设置显示列" aria-label="设置显示列">
                    <ElIcon class="manager-column-more"><MoreFilled /></ElIcon></button
                ></template>
                <div class="link-column-settings">
                  <label v-for="column in linkColumns" :key="column.value"
                    ><input
                      type="checkbox"
                      :checked="visibleColumns.includes(column.value)"
                      :disabled="column.value === 'name'"
                      @change="toggleColumn(column.value)"
                    />{{ column.label }}</label
                  >
                </div>
              </ElPopover>
            </div>
          </div>
          <div
            v-for="friendLink in friendLinks"
            :key="friendLink.id"
            class="manager-row"
            role="row"
          >
            <div
              v-for="column in displayedColumns"
              :key="column.value"
              role="cell"
              class="manager-cell"
            >
              <div v-if="column.value === 'name'" class="manager-site">
                <FriendLinkIcon
                  class="manager-icon-preview"
                  previewable
                  :name="friendLink.name"
                  :url="friendLink.url"
                  :logo-url="friendLink.logo_url"
                  :aria-label="`放大${friendLink.name}的网站图标`"
                  title="放大网站图标"
                  @preview="previewIconUrl = $event"
                />
                <button
                  type="button"
                  class="manager-site-name"
                  :title="friendLink.name"
                  :disabled="showRecycleBin"
                  @click="openEdit(friendLink)"
                >
                  <span class="manager-truncate">{{ friendLink.name }}</span>
                </button>
              </div>
              <a
                v-else-if="column.value === 'url'"
                :href="friendLink.url"
                target="_blank"
                rel="noopener noreferrer"
                class="manager-url"
                :title="friendLink.url"
                >{{ friendLink.url }}</a
              >
              <span
                v-else-if="column.value === 'description'"
                class="manager-truncate manager-muted"
                :title="friendLink.description || undefined"
                >{{ friendLink.description || '—' }}</span
              >
              <span v-else-if="column.value === 'status'" class="manager-status">
                <i :class="`manager-dot--${friendLink.status}`" />
                {{ getStatusLabel(friendLink.status) }}
              </span>
              <span
                v-else-if="column.value === 'category'"
                class="manager-truncate manager-muted"
                :title="friendLink.category || undefined"
                >{{ friendLink.category || '未分类' }}</span
              >
              <span v-else-if="column.value === 'is_auto_exchange'" class="manager-muted">{{
                friendLink.is_auto_exchange ? '自动交换' : '手动添加'
              }}</span>
              <div v-else-if="column.value === 'contact_name'" class="manager-contact">
                <span>{{ friendLink.contact_name || '未填写' }}</span>
                <span v-if="friendLink.contact_email" :title="friendLink.contact_email">{{
                  friendLink.contact_email
                }}</span>
              </div>
              <ElTooltip
                v-else
                :content="
                  formatDate(
                    column.value === 'date'
                      ? showRecycleBin
                        ? friendLink.deleted_at
                        : friendLink.created_at
                      : friendLink.updated_at,
                  )
                "
                placement="top"
                popper-class="friend-link-date-tooltip"
              >
                <span class="manager-date">{{
                  formatRelativeDate(
                    column.value === 'date'
                      ? showRecycleBin
                        ? friendLink.deleted_at
                        : friendLink.created_at
                      : friendLink.updated_at,
                  )
                }}</span>
              </ElTooltip>
            </div>
            <div role="cell" class="manager-fixed-actions">
              <div class="manager-ops">
                <template v-if="!showRecycleBin && friendLink.status === 'pending'">
                  <button
                    type="button"
                    title="通过"
                    aria-label="通过"
                    @click="approveFriendLink(friendLink)"
                  >
                    <ElIcon><Check /></ElIcon>
                  </button>
                  <button
                    type="button"
                    title="拒绝"
                    aria-label="拒绝"
                    @click="rejectFriendLink(friendLink)"
                  >
                    <ElIcon><Close /></ElIcon>
                  </button>
                </template>
                <button
                  v-if="showRecycleBin"
                  type="button"
                  title="恢复"
                  aria-label="恢复"
                  @click="restoreFriendLink(friendLink)"
                >
                  <ElIcon><RefreshLeft /></ElIcon>
                </button>
                <button
                  v-else
                  type="button"
                  title="编辑友链"
                  aria-label="编辑友链"
                  @click="openEdit(friendLink)"
                >
                  <ElIcon><PencilEditIcon /></ElIcon>
                </button>
                <ElPopconfirm
                  :title="showRecycleBin ? '确定永久删除这个友链？' : '确定删除这个友链？'"
                  @confirm="deleteFriendLink(friendLink.id)"
                >
                  <template #reference>
                    <button
                      type="button"
                      class="manager-delete"
                      :title="showRecycleBin ? '永久删除' : '删除'"
                      :aria-label="showRecycleBin ? '永久删除' : '删除'"
                    >
                      <ElIcon><Delete /></ElIcon>
                    </button>
                  </template>
                </ElPopconfirm>
              </div>
            </div>
          </div>
        </div>
        <div v-if="friendLinks.length === 0 && !loadFailed" class="manager-empty">
          {{
            filterCount || appliedSearch
              ? '暂无符合条件的友链'
              : showRecycleBin
                ? '回收站暂无友链'
                : '暂无友链'
          }}
        </div>
        <div
          v-if="loadFailed || loadingMore || hasMore || friendLinks.length"
          class="manager-list-status"
          :class="{ 'manager-list-status--end': !loadFailed && !loadingMore && !hasMore }"
          role="status"
        >
          <template v-if="loadFailed"
            ><span>加载失败</span
            ><button type="button" @click="fetchFriendLinks(failedAppend)">重试</button></template
          >
          <span v-else-if="loadingMore">正在加载更多友链…</span>
          <button v-else-if="hasMore" type="button" @click="fetchFriendLinks(true)">
            加载更多
          </button>
          <span v-else-if="friendLinks.length">已显示全部友链</span>
        </div>
      </div>
    </ElSkeleton>

    <ElImageViewer
      v-if="previewIconUrl"
      :url-list="[previewIconUrl]"
      teleported
      @close="previewIconUrl = ''"
    />

    <BaseDialog
      v-model="showDialog"
      class="friend-link-dialog"
      modal-class="friend-link-dialog-overlay"
      width="600px"
      style="max-width: 94vw"
      :close-on-click-modal="!dialogLoading"
      :close-on-press-escape="!dialogLoading"
      :show-close="!dialogLoading"
    >
      <template #header>
        <div class="link-dialog-header">
          <i /><strong>{{ isEdit ? '编辑友链' : '添加友链' }}</strong>
          <span>{{ isEdit ? '更新网站信息与展示状态' : '添加一个新的友情链接' }}</span>
        </div>
      </template>
      <ElForm
        class="link-dialog-form"
        label-position="top"
        require-asterisk-position="right"
        :disabled="dialogLoading"
        @submit.prevent="save"
      >
        <ElFormItem label="网站名称" required>
          <ElInput v-model="form.name" placeholder="为这个网站起个名字" maxlength="100" />
        </ElFormItem>
        <ElFormItem label="网站链接" required>
          <ElInput v-model="form.url" placeholder="https://example.com" maxlength="500" />
        </ElFormItem>
        <ElFormItem class="link-dialog-desc">
          <template #label>
            <span class="link-dialog-label">
              <span>描述</span>
              <span class="link-dialog-counter">{{ form.description.length }} / 200</span>
            </span>
          </template>
          <ElInput
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="简单介绍这个网站，让访客了解它"
            maxlength="200"
            resize="vertical"
          />
        </ElFormItem>
        <ElFormItem label="网站图标">
          <div class="link-icon-editor">
            <FriendLinkIcon
              class="link-icon-editor__preview"
              :name="form.name"
              :url="form.url"
              :logo-url="dialogIconUrl"
              previewable
              aria-label="放大网站图标"
              @preview="previewIconUrl = $event"
            />
            <nav class="link-icon-tabs" aria-label="网站图标获取方式">
              <button
                v-for="option in iconOptions"
                :key="option.value"
                type="button"
                class="link-icon-tab"
                :class="{ 'is-active': iconMode === option.value }"
                :disabled="dialogLoading"
                :aria-pressed="iconMode === option.value"
                @click="iconMode = option.value"
              >
                {{ option.label }}
              </button>
            </nav>
            <ElInput
              v-if="iconMode === 'image'"
              v-model="iconImageUrl"
              class="link-icon-editor__url"
              placeholder="https://example.com/logo.png"
              maxlength="500"
              aria-label="图标图片 URL"
            />
            <span v-else class="link-icon-editor__hint">{{ iconHint }}</span>
          </div>
        </ElFormItem>
        <div class="link-dialog-meta">
          <ElFormItem label="分类">
            <div
              class="link-filter-chips link-dialog-chips link-dialog-chips--scroll"
              role="group"
              aria-label="选择分类"
            >
              <button
                v-for="option in dialogCategoryOptions"
                :key="option.value || 'uncategorized'"
                type="button"
                class="link-filter-chip"
                :class="{ 'is-active': form.category === option.value }"
                :disabled="dialogLoading"
                :aria-pressed="form.category === option.value"
                @click="form.category = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </ElFormItem>
          <ElFormItem label="状态">
            <div class="link-filter-chips link-dialog-chips" role="group" aria-label="选择状态">
              <button
                v-for="option in dialogStatusOptions"
                :key="option.value"
                type="button"
                class="link-filter-chip"
                :class="{ 'is-active': form.status === option.value }"
                :disabled="dialogLoading"
                :aria-pressed="form.status === option.value"
                @click="form.status = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </ElFormItem>
        </div>
      </ElForm>
      <template #footer>
        <div class="link-dialog-footer">
          <span>名称和链接为必填项</span>
          <ElButton text :disabled="dialogLoading" @click="showDialog = false">取消</ElButton>
          <ElButton
            type="primary"
            :loading="dialogLoading"
            :disabled="!form.name.trim() || !form.url.trim() || iconIncomplete"
            @click="save"
          >
            {{ isEdit ? '保存修改' : '添加友链' }}
          </ElButton>
        </div>
      </template>
    </BaseDialog>
  </div>
</template>

<style scoped>
:global(.friend-link-date-tooltip.el-popper) {
  width: max-content;
  min-width: 0;
  max-width: calc(100vw - 24px);
  white-space: nowrap;
}

.friend-link-manager {
  --manager-bg: var(--el-bg-color, #fff);
  --manager-ink: var(--el-text-color-primary, #171717);
  --manager-muted: var(--el-text-color-secondary, #8a8a8a);
  --manager-line: var(--el-border-color-lighter, #e8e8e8);
  --manager-hover: var(--el-fill-color-light, #fafafa);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 26px 24px 0;
  box-sizing: border-box;
  background: var(--manager-bg);
  color: var(--manager-ink);
  font:
    13px/1.5 'PingFang SC',
    'HarmonyOS Sans SC',
    'Microsoft YaHei',
    'Noto Sans SC',
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.friend-link-manager *,
.friend-link-manager *::before,
.friend-link-manager *::after {
  box-sizing: border-box;
}

.manager-head {
  display: flex;
  flex: none;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.manager-head h1 {
  margin: 0;
  font-size: 21px;
  font-weight: 600;
  line-height: 1.3;
}

.manager-head p {
  margin: 6px 0 0;
  color: var(--manager-muted);
  font-size: 12px;
}

.manager-create {
  border-radius: 5px;
  font-size: 12px;
}

.manager-create :deep(> span) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.manager-date {
  display: inline-block;
  max-width: 100%;
  color: var(--manager-muted);
  font-size: 12.5px;
  line-height: 1.5;
  white-space: nowrap;
}

.manager-tabs-row {
  display: flex;
  flex: none;
  align-items: stretch;
  gap: 16px;
  margin-top: 8px;
  border-bottom: 1px solid var(--manager-line);
}

.manager-tabs {
  display: flex;
  flex: 1;
  gap: 22px;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.manager-tab {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  flex: none;
  height: 34px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--manager-muted);
  font: inherit;
  font-size: 12.5px;
  line-height: 34px;
  white-space: nowrap;
  cursor: pointer;
}

.manager-tab.is-active {
  color: var(--manager-ink);
  font-weight: 500;
}

.manager-tab.is-active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--el-color-primary);
  content: '';
}

.manager-tab small {
  margin: 0;
  color: var(--el-text-color-placeholder, #a3a3a3);
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: 10.5px;
  font-weight: 400;
  line-height: inherit;
  vertical-align: baseline;
}

.friend-link-manager :deep(.el-skeleton) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.manager-list-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.manager-table {
  width: 100%;
  text-align: left;
}

.manager-row {
  --manager-row-bg: var(--manager-bg);
  display: grid;
  grid-template-columns: var(--manager-grid-columns);
  align-items: center;
  gap: 16px;
  min-height: 50px;
  border-bottom: 1px solid var(--manager-line);
}

.manager-row-head {
  position: sticky;
  top: 0;
  z-index: 2;
  min-height: 34px;
  background: var(--manager-bg);
  color: var(--manager-muted);
  font-size: 11px;
  font-weight: 400;
}

.manager-row:not(.manager-row-head):hover {
  --manager-row-bg: var(--manager-hover);
  background: var(--manager-hover);
}

.manager-fixed-actions {
  position: sticky;
  right: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  align-self: stretch;
  justify-content: flex-end;
  background: var(--manager-row-bg);
  box-shadow: -12px 0 0 var(--manager-row-bg);
}

.manager-cell {
  min-width: 0;
  padding: 8px 0;
}

.manager-site {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.manager-icon-preview {
  display: flex;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: zoom-in;
}

.manager-site-name {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--manager-ink);
  font: inherit;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.manager-site-name > .manager-truncate {
  min-width: 0;
  color: inherit;
}

.manager-site-name:not(:disabled):hover,
.manager-url:hover {
  color: var(--el-color-primary);
  text-decoration: underline;
}

.manager-site-name:disabled {
  cursor: default;
}

.manager-url,
.manager-truncate,
.manager-contact span {
  display: block;
  overflow: hidden;
  color: var(--manager-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manager-url {
  font-size: 11.5px;
  text-decoration: none;
}

.manager-muted,
.manager-contact {
  color: var(--manager-muted);
  font-size: 11.5px;
}

.manager-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  white-space: nowrap;
}

.manager-status i {
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--manager-muted);
}

.manager-status .manager-dot--approved {
  background: #3f9c6d;
}

.manager-status .manager-dot--pending {
  background: #c08a3e;
}

.manager-status .manager-dot--rejected {
  background: var(--el-color-danger);
}

.manager-column-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}

.manager-ops {
  display: flex;
  justify-content: flex-end;
  gap: 1px;
}

.manager-ops button,
.manager-column-actions button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--manager-muted);
  font-size: 14px;
  cursor: pointer;
}

.manager-ops button:hover,
.manager-column-actions button:hover {
  background: var(--manager-hover);
  color: var(--el-color-primary);
}

.manager-ops .manager-delete {
  color: var(--el-color-danger);
}

.manager-ops .manager-delete:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

/* 列设置按钮：把水平排列的三个点旋转成竖排 */
.manager-column-more {
  transform: rotate(90deg);
}

.manager-empty {
  padding: 56px 16px;
  color: var(--manager-muted);
  text-align: center;
}

.manager-list-status {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 4px 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  text-align: center;
}

.manager-list-status--end {
  color: var(--el-text-color-placeholder);
}

.manager-list-status button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-color-primary);
  font: inherit;
  cursor: pointer;
}

.manager-toolbar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}

.manager-mode-nav {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--manager-line);
  border-radius: 6px;
  background: var(--manager-bg);
}

.manager-mode-nav__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 58px;
  height: 26px;
  padding: 0 9px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--manager-muted);
  font: inherit;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

.manager-mode-nav__item .el-icon {
  flex: none;
  font-size: 15px;
}

.manager-mode-nav__item:hover {
  color: var(--manager-ink);
}

.manager-mode-nav__item.is-active {
  color: var(--manager-ink);
  background: var(--manager-hover);
}

.link-filter-chips--categories {
  max-height: 154px;
  overflow-y: auto;
}

.link-icon-editor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.link-icon-editor__preview {
  flex: none;
}

.link-icon-tabs {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--manager-line);
  border-radius: 6px;
  background: var(--manager-bg);
}

.link-icon-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 26px;
  padding: 0 9px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--manager-muted);
  font: inherit;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

.link-icon-tab:hover {
  color: var(--manager-ink);
}

.link-icon-tab.is-active {
  color: var(--manager-ink);
  background: var(--manager-hover);
}

.link-icon-tab:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.link-icon-editor__url {
  flex: 1 1 180px;
  min-width: 150px;
}

.link-icon-editor__hint {
  flex: 1 1 160px;
  min-width: 0;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  line-height: 1.5;
}

.manager-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.manager-filter-button,
.manager-sort-heading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--manager-muted);
  font: inherit;
  cursor: pointer;
}

.manager-sort-heading {
  padding: 0;
  font-size: 11px;
}

.manager-sort-heading.is-active {
  color: var(--manager-ink);
}

.manager-sort-heading.is-active .el-icon {
  color: var(--el-color-primary);
}

.manager-filter-button {
  flex: none;
  height: 30px;
  padding: 0 9px;
  border: 1px solid var(--manager-line);
  border-radius: 5px;
  font-size: 12px;
}

.manager-filter-button:hover,
.manager-filter-button.is-active {
  border-color: var(--el-border-color-dark, #d4d7de);
  color: var(--manager-ink);
}

.manager-filter-button.is-active .el-icon {
  color: var(--el-color-primary);
}

.manager-filter-button small {
  display: inline-grid;
  place-items: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 3px;
  background: var(--el-color-primary);
  color: #fff;
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: 9.5px;
  line-height: 1;
}

.manager-search {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 250px;
  height: 30px;
  box-sizing: border-box;
  padding: 0 9px;
  border: 1px solid var(--manager-line);
  border-radius: 5px;
  color: var(--manager-muted);
}

/* 聚焦只用浅灰加深描边，不引入主题色，保持与管理页其他输入框一致 */
.manager-search:focus-within {
  border-color: var(--el-border-color-dark, #d4d7de);
}

.manager-search input {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--manager-ink);
  font: inherit;
  font-size: 12px;
}

.link-filter-panel {
  padding: 2px;
}

.link-filter-group + .link-filter-group {
  margin-top: 15px;
}

.link-filter-group > label {
  display: block;
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  letter-spacing: 0.06em;
}

.link-filter-group .el-select {
  width: 100%;
}

.link-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.link-filter-chip {
  min-height: 26px;
  padding: 0 9px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
}

.link-filter-chip:hover,
.link-filter-chip.is-active {
  border-color: var(--el-color-primary);
}

.link-filter-chip.is-active {
  background: var(--el-color-primary);
  color: #fff;
}

.link-sort-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.link-sort-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.link-sort-option.is-active {
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
}

.link-sort-option.is-active .el-icon {
  color: var(--el-color-primary);
}

.link-filter-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.link-filter-footer :deep(.el-button) {
  font-size: 11px;
}

.link-column-settings {
  display: flex;
  flex-direction: column;
  gap: 9px;
  color: var(--el-text-color-primary);
  font-size: 12px;
}

.link-column-settings label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

:global(.friend-link-dialog-overlay.el-overlay) {
  background: rgba(23, 23, 23, 0.16);
}

:global(.friend-link-dialog.el-dialog) {
  padding: 0;
  overflow: hidden;
  border-radius: 10px;
}

:global(.friend-link-dialog.el-dialog .el-dialog__header) {
  height: 52px;
  box-sizing: border-box;
  margin: 0;
  padding: 0 40px 0 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(.friend-link-dialog.el-dialog .el-dialog__body) {
  padding: 0;
}

:global(.friend-link-dialog.el-dialog .el-dialog__footer) {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.link-dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 52px;
}

.link-dialog-header i {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

.link-dialog-header strong {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.link-dialog-header span {
  overflow: hidden;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-dialog-form {
  max-height: calc(90dvh - 112px);
  overflow-y: auto;
  box-sizing: border-box;
  padding: 18px 20px;
}

.link-dialog-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.link-dialog-form :deep(.el-form-item__label) {
  margin-bottom: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
}

/* 描述标签行：标题在左、字数统计靠右 */
.link-dialog-desc :deep(.el-form-item__label) {
  width: 100%;
}

.link-dialog-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.link-dialog-counter {
  color: var(--el-text-color-placeholder);
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: 10.5px;
  line-height: 1;
}

.link-dialog-form :deep(.el-input__wrapper),
.link-dialog-form :deep(.el-select__wrapper),
.link-dialog-form :deep(.el-textarea__inner) {
  border-radius: 5px;
  font-size: 12px;
}

.link-dialog-meta {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 4px;
}

.link-dialog-meta :deep(.el-form-item) {
  margin-bottom: 0;
}

/* 分类 / 状态改成可直接点击的标签，尺寸与筛选面板一致 */
.link-dialog-chips {
  width: 100%;
  line-height: 1.4;
}

.link-dialog-chips--scroll {
  max-height: 96px;
  overflow-y: auto;
}

.link-dialog-chips .link-filter-chip:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.link-dialog-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-dialog-footer > span {
  margin-right: auto;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.link-dialog-footer :deep(.el-button) {
  margin-left: 0;
  border-radius: 5px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .friend-link-manager {
    padding: 20px 16px 0;
  }

  .manager-tabs {
    gap: 18px;
  }

  .manager-toolbar {
    flex-wrap: nowrap;
    gap: 8px;
  }

  .manager-filters {
    flex: 1;
    flex-wrap: nowrap;
    min-width: 0;
    margin-left: 0;
  }

  .manager-search {
    flex: 1;
    width: auto;
    min-width: 0;
  }

  .link-dialog-footer > span {
    font-size: 10px;
  }
}
</style>
