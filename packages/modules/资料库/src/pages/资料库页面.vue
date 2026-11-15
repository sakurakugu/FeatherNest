<script setup lang="ts">
import {
  Delete,
  Filter,
  Plus,
  RefreshLeft,
  Search,
  Upload,
  WarningFilled,
} from '@element-plus/icons-vue'
import { useIntersectionObserver, useStorage, watchDebounced } from '@vueuse/core'
import {
  ElButton,
  ElCheckbox,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElMessage,
  ElOption,
  ElPopover,
  ElSelect,
  ElTooltip,
} from 'element-plus'
import {
  BaseDialog,
  格式化完整时间,
  格式化相对时间,
  PencilEditIcon,
  SortDirectionIcon,
  TagInlineInput,
  使用长按选择,
  使用路由搜索同步,
} from '@feathernest/ui'
import '@feathernest/ui/styles/manager.css'
import { 获取API错误消息 } from '@feathernest/api'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 创建资料, 删除资料, 获取资料, 获取资料标签, 获取资料列表, 恢复资料, 更新资料 } from '../api'
import FolderPickerDialog from '../components/文件夹选择弹窗.vue'
import { 创建文件夹, 获取文件浏览器数据, 上传文件 } from '../files-api'
import type { FileTreeNode } from '../files-types'
import type {
  MaterialAssetPayload,
  MaterialAssetRecord,
  MaterialListQuery,
  MaterialListResponse,
  MaterialPayload,
  MaterialRecord,
  MaterialSortField,
  MaterialStatus,
  MaterialTagStat,
  MaterialType,
} from '../types'

const props = withDefaults(defineProps<{
  showBack?: boolean
  backTo?: string
}>(), {
  showBack: false,
  backTo: '/',
})
const route = useRoute()
const router = useRouter()
const openedTargetId = ref('')
const emit = defineEmits<{ 'organized-material-count-change': [count: number] }>()

interface CollectionFormState {
  type: MaterialType
  title: string
  content_text: string
  note: string
  status: MaterialStatus
  tags_text: string
  assets: Array<{
    file_id: string
    sort_order: number
    file: MaterialAssetRecord['file']
  }>
}

const pageContainerRef = ref<globalThis.HTMLDivElement | null>(null)
const loadMoreTriggerRef = ref<globalThis.HTMLDivElement | null>(null)
const uploadInputRef = ref<HTMLInputElement | null>(null)
const initialLoading = ref(true)
const refreshing = ref(false)
const loadingMore = ref(false)
const dialogLoading = ref(false)
const uploadLoading = ref(false)
const showDialog = ref(false)
const showFolderPickerDialog = ref(false)
const isEdit = ref(false)
const isMultiSelectMode = ref(false)
const showRecycleBin = ref(false)
const currentId = ref('')
const collections = ref<MaterialRecord[]>([])
const tagOptions = ref<MaterialTagStat[]>([])
const multiSelectedIds = ref<string[]>([])
const COLLECTION_LIST_PAGE_SIZE = 12
const 收藏附件目录名 = '资料附件'
const pagination = ref({ page: 0, pageSize: COLLECTION_LIST_PAGE_SIZE, total: 0, pageCount: 0 })
const filters = ref({
  keyword: '',
  status: '' as MaterialStatus | '',
  type: '' as MaterialType | '',
  tag: '',
})
const 已应用关键词 = ref('')
const 选中的上传目录 = ref<string | null>(null)
const 选中的上传目录路径 = ref('全部文件')
const 视图 = useStorage<'table' | 'cards'>('feathernest.material-manager.view', 'table')
const 统计 = ref({ 全部: 0, 已整理: 0, 已归档: 0, 回收站: 0 })

/* ==========================================================================
   列配置、列显隐与排序
   ========================================================================== */
const 资料列 = [
  { value: 'title', label: '标题', width: 'minmax(150px, 1.6fr)', minWidth: 150 },
  { value: 'content', label: '内容', width: 'minmax(180px, 2fr)', minWidth: 180 },
  { value: 'type', label: '类型', width: '88px', minWidth: 88 },
  { value: 'tags', label: '标签', width: 'minmax(100px, 1.2fr)', minWidth: 100 },
  { value: 'assets', label: '附件', width: '60px', minWidth: 60 },
  { value: 'date', label: '更新时间', width: '128px', minWidth: 128 },
] as const
type 资料列值 = (typeof 资料列)[number]['value']
const 可见列 = useStorage<资料列值[]>('feathernest.material-manager.columns', [
  'title',
  'content',
  'type',
  'tags',
  'assets',
  'date',
])
const 展示列 = computed(() => 资料列.filter(列 => 可见列.value.includes(列.value)))
const 网格列 = computed(() => [
  ...(isMultiSelectMode.value ? ['28px'] : []),
  ...展示列.value.map(列 => 列.width),
  '92px',
].join(' '))
const 排序字段 = ref<MaterialSortField | ''>('')
const 排序方向 = ref<'asc' | 'desc'>('desc')

function 切换列显示(列值: 资料列值) {
  if (列值 === 'title') return
  可见列.value = 可见列.value.includes(列值)
    ? 可见列.value.filter(项 => 项 !== 列值)
    : [...可见列.value, 列值]
}

function 列标题(列: (typeof 资料列)[number]) {
  if (列.value === 'date') return 日期列标题.value
  return 列.label
}

function 列排序字段(列值: 资料列值): MaterialSortField {
  if (列值 === 'title') return 'title'
  if (列值 === 'content') return 'content'
  if (列值 === 'type') return 'type'
  if (列值 === 'tags') return 'tag'
  if (列值 === 'assets') return 'assets'
  return showRecycleBin.value ? 'deleted_at' : 'updated_at'
}

function 排序图标方向(字段: MaterialSortField): 'asc' | 'desc' | '' {
  if (!排序字段.value || 排序字段.value !== 字段) return ''
  return 排序方向.value
}

function 表头排序(列值: 资料列值) {
  const 字段 = 列排序字段(列值)
  if (排序字段.value !== 字段) {
    排序字段.value = 字段
    排序方向.value = 'asc'
  } else if (排序方向.value === 'asc') {
    排序方向.value = 'desc'
  } else {
    排序字段.value = ''
    排序方向.value = 'desc'
  }
  void reloadCollections(COLLECTION_LIST_PAGE_SIZE, { silent: true })
}

/* ==========================================================================
   长按多选：按住 520ms 进入多选，进入后复选框才显示
   ========================================================================== */
const 按下位置 = new Map<string, { x: number, y: number }>()
const { startLongPress, cancelLongPress, consumeLongPress } = 使用长按选择<MaterialRecord>({
  getId: record => record.id,
  onLongPress: (record) => {
    enterMultiSelect(record)
  },
})

function 读取坐标(event: Event): { x: number, y: number } | null {
  if (event instanceof TouchEvent) {
    const touch = event.touches[0]
    return touch ? { x: touch.clientX, y: touch.clientY } : null
  }
  if (event instanceof MouseEvent) {
    return { x: event.clientX, y: event.clientY }
  }
  return null
}

/** 按下时记录起点，未进入多选才启动长按计时 */
function 处理条目按下(record: MaterialRecord, event: Event) {
  const point = 读取坐标(event)
  if (point) {
    按下位置.set(record.id, point)
  }
  if (!isMultiSelectMode.value) {
    startLongPress(record, event)
  }
}

/** 手指或鼠标移动超过阈值说明是在滚动，取消长按 */
function 处理条目移动(record: MaterialRecord, event: Event) {
  const start = 按下位置.get(record.id)
  const point = 读取坐标(event)
  if (!start || !point) {
    return
  }
  if (Math.abs(point.x - start.x) > 8 || Math.abs(point.y - start.y) > 8) {
    cancelLongPress(record)
  }
}

function 处理条目抬起(record: MaterialRecord) {
  cancelLongPress(record)
  按下位置.delete(record.id)
}

/** 长按已触发时消费掉这次点击，避免顺带打开编辑弹窗 */
function handleItemClick(record: MaterialRecord) {
  if (consumeLongPress(record)) {
    return
  }
  if (isMultiSelectMode.value) {
    toggleMultiSelect(record)
    return
  }
  if (showRecycleBin.value) {
    return
  }
  openEditDialog(record)
}

function createEmptyForm(): CollectionFormState {
  return {
    type: 'link',
    title: '',
    content_text: '',
    note: '',
    status: 'active',
    tags_text: '',
    assets: [],
  }
}

const form = ref<CollectionFormState>(createEmptyForm())

const typeOptions: Array<{ label: string, value: MaterialType }> = [
  { label: '网页链接', value: 'link' },
  { label: '文本', value: 'text' },
  { label: '图片', value: 'image' },
  { label: '文件', value: 'file' },
]
const statusOptions: Array<{ label: string, value: MaterialStatus }> = [
  { label: '已整理', value: 'active' },
  { label: '已归档', value: 'archived' },
]
const 路由搜索词 = computed({
  get: () => filters.value.keyword,
  set: (value: string) => {
    filters.value.keyword = value
  },
})
使用路由搜索同步(路由搜索词)

const activeFilterCount = computed(() => [filters.value.type, filters.value.tag.trim()].filter(Boolean).length)
const hasSearchKeyword = computed(() => Boolean(filters.value.keyword.trim()))
const hasAnyFilters = computed(() => hasSearchKeyword.value || Boolean(filters.value.status) || activeFilterCount.value > 0)
const isAssetType = computed(() => form.value.type === 'image' || form.value.type === 'file')
const hasCoreContent = computed(() => Boolean(
  form.value.title.trim()
  || form.value.content_text.trim()
  || form.value.note.trim(),
))
const shouldShowAnyContentRequiredMark = computed(() => !isAssetType.value && !hasCoreContent.value && form.value.assets.length === 0)
const shouldShowAssetRequiredMark = computed(() => isAssetType.value || (!hasCoreContent.value && form.value.assets.length === 0))
const allExistingTags = computed(() => tagOptions.value.map(item => item.name))
const availableTags = computed(() => getAvailableTags(form.value.tags_text))
const hasMoreCollections = computed(() => pagination.value.page < pagination.value.pageCount)
const 当前上传目录标签 = computed(() => 选中的上传目录路径.value || '全部文件')
const selectedCollectionIdSet = computed(() => new Set(multiSelectedIds.value))
const visibleCollectionIdSet = computed(() => new Set(collections.value.map(record => record.id)))
const allVisibleSelected = computed(() => (
  collections.value.length > 0 && collections.value.every(record => selectedCollectionIdSet.value.has(record.id))
))
const 可见已选数量 = computed(() => collections.value.filter(record => selectedCollectionIdSet.value.has(record.id)).length)
const 部分选中 = computed(() => 可见已选数量.value > 0 && !allVisibleSelected.value)
const 页头标题 = computed(() => showRecycleBin.value ? '回收站' : '资料库')
const 页头统计 = computed(() => (
  showRecycleBin.value
    ? `共 ${统计.value.回收站} 条已删除资料`
    : `共 ${统计.value.全部} 条资料 · ${统计.value.已归档} 条已归档`
))
const 状态页签 = computed<Array<{ value: MaterialStatus | '', label: string, count: number }>>(() => [
  { value: '', label: '全部', count: 统计.value.全部 },
  { value: 'active', label: '已整理', count: 统计.value.已整理 },
  { value: 'archived', label: '已归档', count: 统计.value.已归档 },
])
const 日期列标题 = computed(() => showRecycleBin.value ? '删除时间' : '更新时间')
const 空状态描述 = computed(() => {
  if (showRecycleBin.value) {
    return hasSearchKeyword.value ? '回收站里没有匹配的资料' : '回收站暂无资料'
  }
  if (hasAnyFilters.value) return '暂无符合条件的资料'
  return '还没有资料，点右上角「新增资料」开始收集吧'
})

const showDeleteConfirm = ref(false)
const pendingDeleteIds = ref<string[]>([])
const deleteMode = ref<'soft' | 'permanent'>('soft')
const dontAskAgain = ref(false)
const DELETE_CONFIRM_KEY = 'collections_delete_confirm_dont_ask'
let deleteConfirmResolver: ((value: boolean) => void) | null = null

function parseTagsInput(tagsText: string): string[] {
  return tagsText
    .replaceAll('，', ',')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
}

function parseTagsText(tagsText: string): string[] | null {
  const tags = parseTagsInput(tagsText)
  return tags.length > 0 ? Array.from(new Set(tags)) : null
}

function getAvailableTags(currentTagsStr: string): string[] {
  const currentTags = new Set(parseTagsInput(currentTagsStr))
  return allExistingTags.value.filter(tag => !currentTags.has(tag))
}

function addTagToForm(formTags: string, tag: string): string {
  const tags = parseTagsInput(formTags)
  if (!tags.includes(tag)) {
    tags.push(tag)
  }
  return tags.join(',')
}

function shouldSkipDeleteConfirm(): boolean {
  try {
    return globalThis.sessionStorage?.getItem(DELETE_CONFIRM_KEY) === 'true'
  } catch {
    return false
  }
}

function setDontAskAgain(value: boolean) {
  try {
    if (value) {
      globalThis.sessionStorage?.setItem(DELETE_CONFIRM_KEY, 'true')
    } else {
      globalThis.sessionStorage?.removeItem(DELETE_CONFIRM_KEY)
    }
  } catch {
    // ignore
  }
}

async function requestDeleteConfirm(ids: string[], mode: 'soft' | 'permanent'): Promise<boolean> {
  if (ids.length === 0) return false
  if (shouldSkipDeleteConfirm()) return true

  pendingDeleteIds.value = [...ids]
  deleteMode.value = mode
  dontAskAgain.value = false
  showDeleteConfirm.value = true

  return new Promise<boolean>((resolve) => {
    deleteConfirmResolver = resolve
  })
}

function cancelDeleteConfirm() {
  showDeleteConfirm.value = false
  pendingDeleteIds.value = []
  deleteMode.value = 'soft'
  dontAskAgain.value = false
  deleteConfirmResolver?.(false)
  deleteConfirmResolver = null
}

function confirmDeleteConfirm() {
  setDontAskAgain(dontAskAgain.value)
  showDeleteConfirm.value = false
  pendingDeleteIds.value = []
  deleteMode.value = 'soft'
  dontAskAgain.value = false
  deleteConfirmResolver?.(true)
  deleteConfirmResolver = null
}

function buildPayloadFromForm(): MaterialPayload {
  const assets: MaterialAssetPayload[] | null = form.value.assets.length > 0
    ? form.value.assets.map((asset, index) => ({
      file_id: asset.file_id,
      sort_order: index,
    }))
    : null

  return {
    type: form.value.type,
    title: form.value.title || null,
    content_text: form.value.content_text || null,
    note: form.value.note || null,
    status: form.value.status,
    tags: parseTagsText(form.value.tags_text),
    assets,
  }
}

function getTypeLabel(value: MaterialType | ''): string {
  return typeOptions.find(item => item.value === value)?.label ?? value
}

function getDisplayTitle(record: MaterialRecord): string {
  return record.title?.trim() || '未命名资料'
}

function getPreviewText(record: MaterialRecord): string {
  return record.content_text || record.note || '暂无内容'
}

function 类型圆点(record: MaterialRecord): string {
  if (record.type === 'link') return 'manager-dot--primary'
  if (record.type === 'image') return 'manager-dot--warning'
  if (record.type === 'file') return 'manager-dot--success'
  return 'manager-dot--muted'
}

function 记录时间(record: MaterialRecord): string | null {
  return showRecycleBin.value ? record.deleted_at : record.updated_at
}

function 查找根级收藏附件目录(tree: FileTreeNode[]): FileTreeNode | null {
  return tree.find(node => node.parent_id === null && node.name === 收藏附件目录名) ?? null
}

async function 初始化默认上传目录() {
  try {
    let explorer = await 获取文件浏览器数据()
    let 默认目录 = 查找根级收藏附件目录(explorer.tree)

    if (默认目录 === null) {
      try {
        await 创建文件夹(收藏附件目录名)
      } catch {
        // 忽略并重新读取，兼容并发创建
      }
      explorer = await 获取文件浏览器数据()
      默认目录 = 查找根级收藏附件目录(explorer.tree)
    }

    if (默认目录) {
      选中的上传目录.value = 默认目录.id
      选中的上传目录路径.value = '全部文件 / 资料附件'
      return
    }

    选中的上传目录.value = null
    选中的上传目录路径.value = '全部文件'
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '加载默认上传目录失败'))
  }
}

function 打开目录选择弹窗() {
  showFolderPickerDialog.value = true
}

function 应用上传目录选择(payload: { folderId: string | null, path: string }) {
  选中的上传目录.value = payload.folderId
  选中的上传目录路径.value = payload.path || '全部文件'
}

function buildCollectionQuery(page: number, pageSize: number): MaterialListQuery {
  return {
    page,
    page_size: pageSize,
    keyword: filters.value.keyword.trim() || undefined,
    status: filters.value.status,
    type: filters.value.type,
    tag: filters.value.tag.trim() || undefined,
    is_deleted: showRecycleBin.value,
    sort_by: 排序字段.value || undefined,
    sort_order: 排序字段.value ? 排序方向.value : undefined,
  }
}

function applyCollectionPage(data: MaterialListResponse, append: boolean) {
  collections.value = append ? [...collections.value, ...data.items] : data.items
  pagination.value = {
    page: data.page,
    pageSize: data.page_size,
    total: data.total,
    pageCount: data.pages,
  }
}

function isSelected(recordId: string): boolean {
  return selectedCollectionIdSet.value.has(recordId)
}

function enterMultiSelect(record: MaterialRecord) {
  isMultiSelectMode.value = true
  if (!selectedCollectionIdSet.value.has(record.id)) {
    multiSelectedIds.value = [...multiSelectedIds.value, record.id]
  }
}

function toggleMultiSelect(record: MaterialRecord) {
  if (selectedCollectionIdSet.value.has(record.id)) {
    multiSelectedIds.value = multiSelectedIds.value.filter(id => id !== record.id)
    if (multiSelectedIds.value.length === 0) {
      isMultiSelectMode.value = false
    }
    return
  }
  multiSelectedIds.value = [...multiSelectedIds.value, record.id]
}

function exitMultiSelect() {
  isMultiSelectMode.value = false
  multiSelectedIds.value = []
}

function toggleSelectAllVisibleCollections() {
  if (allVisibleSelected.value) {
    multiSelectedIds.value = multiSelectedIds.value.filter(id => !visibleCollectionIdSet.value.has(id))
    return
  }
  multiSelectedIds.value = collections.value.map(record => record.id)
}

async function requestCollectionPage(page: number, append: boolean) {
  const data = await 获取资料列表(buildCollectionQuery(page, pagination.value.pageSize || COLLECTION_LIST_PAGE_SIZE))
  applyCollectionPage(data, append)
}

async function 获取指定可见数量的收藏(targetVisibleCount: number) {
  const pageSize = pagination.value.pageSize || COLLECTION_LIST_PAGE_SIZE
  const firstPage = await 获取资料列表(buildCollectionQuery(1, pageSize))
  const items = [...firstPage.items]
  let currentPage = firstPage.page

  while (items.length < targetVisibleCount && currentPage < firstPage.pages) {
    currentPage += 1
    const data = await 获取资料列表(buildCollectionQuery(currentPage, pageSize))
    items.push(...data.items)
  }

  return {
    items,
    page: currentPage,
    pageSize: firstPage.page_size,
    total: firstPage.total,
    pageCount: firstPage.pages,
  }
}

/** 统计各状态数量，用于页签角标与页头说明。 */
async function 刷新统计() {
  try {
    const [全部, 已整理, 已归档, 回收站] = await Promise.all([
      获取资料列表({ page: 1, page_size: 1, is_deleted: false }),
      获取资料列表({ page: 1, page_size: 1, status: 'active', is_deleted: false }),
      获取资料列表({ page: 1, page_size: 1, status: 'archived', is_deleted: false }),
      获取资料列表({ page: 1, page_size: 1, is_deleted: true }),
    ])
    统计.value = {
      全部: 全部.total,
      已整理: 已整理.total,
      已归档: 已归档.total,
      回收站: 回收站.total,
    }
  } catch (error) {
    console.error('[资料库] 加载统计失败', error)
  }
}

async function reloadCollections(
  targetVisibleCount = pagination.value.pageSize || COLLECTION_LIST_PAGE_SIZE,
  options: { silent?: boolean } = {},
) {
  const silent = options.silent ?? !initialLoading.value
  if (silent) {
    refreshing.value = true
  } else {
    initialLoading.value = true
  }
  loadingMore.value = false
  try {
    const data = await 获取指定可见数量的收藏(targetVisibleCount)
    collections.value = data.items
    if (!showRecycleBin.value && filters.value.status === 'archived') {
      emit('organized-material-count-change', data.total)
    }
    pagination.value = {
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      pageCount: data.pageCount,
    }
    if (pageContainerRef.value) {
      pageContainerRef.value.scrollTop = 0
    }
    void 刷新统计()
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '加载资料失败'))
  } finally {
    if (silent) {
      refreshing.value = false
    } else {
      initialLoading.value = false
    }
  }
}

async function fetchNextPage() {
  if (initialLoading.value || refreshing.value || loadingMore.value || !hasMoreCollections.value) {
    return
  }
  loadingMore.value = true
  try {
    await requestCollectionPage(pagination.value.page + 1, true)
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '加载更多资料失败'))
  } finally {
    loadingMore.value = false
  }
}

async function loadTags() {
  try {
    tagOptions.value = await 获取资料标签(showRecycleBin.value)
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '加载标签失败'))
  }
}

/** 关键词由防抖监听统一触发刷新，避免清空筛选时重复请求。 */
function 应用关键词(keyword: string) {
  if (keyword === 已应用关键词.value) return
  已应用关键词.value = keyword
  void reloadCollections(COLLECTION_LIST_PAGE_SIZE, { silent: true })
}

function 切换状态页签(status: MaterialStatus | '') {
  const 需要刷新 = showRecycleBin.value || filters.value.status !== status
  showRecycleBin.value = false
  filters.value.status = status
  if (!需要刷新) return
  exitMultiSelect()
  void Promise.all([reloadCollections(COLLECTION_LIST_PAGE_SIZE, { silent: true }), loadTags()])
}

function 切换类型(type: MaterialType | '') {
  if (filters.value.type === type) return
  filters.value.type = type
  void reloadCollections(COLLECTION_LIST_PAGE_SIZE, { silent: true })
}

function 切换标签(tag: string) {
  if (filters.value.tag === tag) return
  filters.value.tag = tag
  void reloadCollections(COLLECTION_LIST_PAGE_SIZE, { silent: true })
}

function resetAllFilters() {
  filters.value = {
    keyword: '',
    status: '',
    type: '',
    tag: '',
  }
  已应用关键词.value = ''
  void reloadCollections(COLLECTION_LIST_PAGE_SIZE, { silent: true })
}

function toggleRecycleBin() {
  const 进入回收站 = !showRecycleBin.value
  showRecycleBin.value = 进入回收站
  if (进入回收站) {
    filters.value.status = ''
  }
  // 回收站的时间列含义从“更新时间”变成“删除时间”，排序一并重置
  排序字段.value = ''
  排序方向.value = 'desc'
  exitMultiSelect()
  void Promise.all([reloadCollections(COLLECTION_LIST_PAGE_SIZE, { silent: true }), loadTags()])
}

function openCreateDialog() {
  if (showRecycleBin.value) {
    return
  }
  isEdit.value = false
  currentId.value = ''
  form.value = createEmptyForm()
  选中的上传目录.value = null
  选中的上传目录路径.value = '全部文件'
  exitMultiSelect()
  showDialog.value = true
}

function openEditDialog(record: MaterialRecord) {
  if (showRecycleBin.value) {
    return
  }
  isEdit.value = true
  currentId.value = record.id
  exitMultiSelect()
  form.value = {
    type: record.type,
    title: record.title || '',
    content_text: record.content_text || '',
    note: record.note || '',
    status: record.status,
    tags_text: (record.tags || []).join(', '),
    assets: record.assets.map(asset => ({
      file_id: asset.file_id,
      sort_order: asset.sort_order,
      file: asset.file,
    })),
  }
  选中的上传目录.value = null
  选中的上传目录路径.value = '全部文件'
  showDialog.value = true
}

function validateCollectionForm(): boolean {
  if (isAssetType.value && form.value.assets.length === 0) {
    ElMessage.error(`"${getTypeLabel(form.value.type)}"类型至少需要上传一个附件`)
    return false
  }
  if (!hasCoreContent.value && form.value.assets.length === 0) {
    ElMessage.error('标题、正文、备注或附件至少填写一项')
    return false
  }
  return true
}

async function saveCollection(keepDialogOpen = false) {
  if (!validateCollectionForm()) {
    return
  }
  dialogLoading.value = true
  try {
    const payload = buildPayloadFromForm()
    const targetVisibleCount = Math.max(
      collections.value.length + (isEdit.value ? 0 : 1),
      pagination.value.pageSize || COLLECTION_LIST_PAGE_SIZE,
    )
    if (isEdit.value) {
      await 更新资料(currentId.value, payload)
      ElMessage.success('资料已更新')
      showDialog.value = false
    } else {
      await 创建资料(payload)
      ElMessage.success(keepDialogOpen ? '资料已创建，可继续录入' : '资料已创建')
      if (keepDialogOpen) {
        form.value = createEmptyForm()
      } else {
        showDialog.value = false
      }
    }
    await Promise.all([reloadCollections(targetVisibleCount, { silent: true }), loadTags()])
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '保存资料失败'))
  } finally {
    dialogLoading.value = false
  }
}

async function removeCollection(id: string) {
  const mode = showRecycleBin.value ? 'permanent' : 'soft'
  const confirmed = await requestDeleteConfirm([id], mode)
  if (!confirmed) {
    return
  }

  try {
    await 删除资料(id, showRecycleBin.value)
    ElMessage.success(showRecycleBin.value ? '资料已永久删除' : '资料已移至回收站')
    const targetVisibleCount = Math.max(collections.value.length - 1, pagination.value.pageSize || COLLECTION_LIST_PAGE_SIZE)
    await Promise.all([reloadCollections(targetVisibleCount, { silent: true }), loadTags()])
  } catch (error) {
    ElMessage.error(获取API错误消息(error, showRecycleBin.value ? '永久删除资料失败' : '删除资料失败'))
  }
}

/** 回收站里恢复单条资料（归档状态改由编辑弹窗维护） */
async function restoreCollection(record: MaterialRecord) {
  try {
    await 恢复资料(record.id)
    ElMessage.success('资料已恢复')
    await Promise.all([
      reloadCollections(Math.max(collections.value.length - 1, pagination.value.pageSize || COLLECTION_LIST_PAGE_SIZE), { silent: true }),
      loadTags(),
    ])
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '恢复资料失败'))
  }
}

async function batchDeleteSelectedCollections() {
  const targetIds = collections.value
    .filter(record => selectedCollectionIdSet.value.has(record.id))
    .map(record => record.id)

  if (targetIds.length === 0) {
    exitMultiSelect()
    return
  }

  const mode = showRecycleBin.value ? 'permanent' : 'soft'
  const confirmed = await requestDeleteConfirm(targetIds, mode)
  if (!confirmed) {
    return
  }

  try {
    await Promise.all(targetIds.map(id => 删除资料(id, showRecycleBin.value)))
    ElMessage.success(showRecycleBin.value ? `已永久删除 ${targetIds.length} 条资料` : `已移至回收站 ${targetIds.length} 条资料`)
    exitMultiSelect()
    const targetVisibleCount = Math.max(collections.value.length - targetIds.length, pagination.value.pageSize || COLLECTION_LIST_PAGE_SIZE)
    await Promise.all([reloadCollections(targetVisibleCount, { silent: true }), loadTags()])
  } catch (error) {
    ElMessage.error(获取API错误消息(error, showRecycleBin.value ? '批量永久删除失败' : '批量删除失败'))
  }
}

async function openUploadPicker() {
  uploadInputRef.value?.click()
}

async function handleUploadChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (files.length === 0) {
    return
  }

  uploadLoading.value = true
  try {
    const folderId = 选中的上传目录.value
    for (const file of files) {
      const uploaded = await 上传文件(file, folderId)
      form.value.assets.push({
        file_id: uploaded.id,
        sort_order: form.value.assets.length,
        file: uploaded,
      })
    }
    ElMessage.success(`已上传 ${files.length} 个附件`)
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '上传附件失败'))
  } finally {
    uploadLoading.value = false
    input.value = ''
  }
}

function removeAsset(index: number) {
  form.value.assets.splice(index, 1)
}

function moveAsset(index: number, direction: -1 | 1) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= form.value.assets.length) {
    return
  }
  const [item] = form.value.assets.splice(index, 1)
  form.value.assets.splice(targetIndex, 0, item)
}

onMounted(async () => {
  await Promise.all([reloadCollections(COLLECTION_LIST_PAGE_SIZE), loadTags()])
})

watch(
  () => route.query.open,
  async (value) => {
    if (typeof value !== 'string' || !value || openedTargetId.value === value) return
    openedTargetId.value = value
    try {
      openEditDialog(await 获取资料(value))
    } catch (error) {
      ElMessage.error(获取API错误消息(error, '关联资料不存在或已删除'))
    }
  },
  { immediate: true },
)

useIntersectionObserver(loadMoreTriggerRef, (entries) => {
  if (entries.some((entry) => entry.isIntersecting)) void fetchNextPage()
}, { root: pageContainerRef, rootMargin: '0px 0px 240px 0px' })

watch(collections, (items) => {
  const idSet = new Set(items.map(item => item.id))
  multiSelectedIds.value = multiSelectedIds.value.filter(id => idSet.has(id))
  if (isMultiSelectMode.value && multiSelectedIds.value.length === 0) {
    isMultiSelectMode.value = false
  }
})

watchDebounced(
  () => filters.value.keyword,
  (value) => {
    应用关键词(value.trim())
  },
  { debounce: 300 },
)

watch(showDeleteConfirm, (value) => {
  if (!value && deleteConfirmResolver) {
    pendingDeleteIds.value = []
    deleteMode.value = 'soft'
    dontAskAgain.value = false
    deleteConfirmResolver(false)
    deleteConfirmResolver = null
  }
})

watch(showDialog, (visible) => {
  if (!visible) {
    showFolderPickerDialog.value = false
    return
  }
  void 初始化默认上传目录()
})
</script>

<template>
  <div
    class="manager-page material-manager"
    :class="{ 'is-recycle': showRecycleBin, 'is-multi-select': isMultiSelectMode }"
  >
    <header class="manager-head">
      <div>
        <button
          v-if="props.showBack"
          class="manager-back"
          type="button"
          @click="router.push(props.backTo)"
        >
          ← 返回
        </button>
        <h1>{{ 页头标题 }}</h1>
        <p>{{ 页头统计 }}</p>
      </div>
      <div class="manager-head-actions">
        <ElButton v-if="!showRecycleBin" type="primary" class="manager-create" @click="openCreateDialog">
          <ElIcon><Plus /></ElIcon>
          <span>新增资料</span>
        </ElButton>
      </div>
    </header>

    <div class="manager-toolbar">
      <div class="manager-mode-nav" role="group" aria-label="资料视图切换">
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
          :width="300"
          trigger="click"
          popper-class="manager-popover"
        >
          <template #reference>
            <button
              type="button"
              class="manager-filter-button"
              :class="{ 'is-active': activeFilterCount > 0 }"
              aria-label="筛选资料"
            >
              <ElIcon><Filter /></ElIcon>
              <span>筛选</span>
              <small v-if="activeFilterCount">{{ activeFilterCount }}</small>
            </button>
          </template>
          <div class="manager-filter-panel">
            <div class="manager-filter-group">
              <label>类型</label>
              <div class="manager-filter-chips">
                <button
                  type="button"
                  class="manager-filter-chip"
                  :class="{ 'is-active': !filters.type }"
                  :aria-pressed="!filters.type"
                  @click="切换类型('')"
                >
                  全部
                </button>
                <button
                  v-for="item in typeOptions"
                  :key="item.value"
                  type="button"
                  class="manager-filter-chip"
                  :class="{ 'is-active': filters.type === item.value }"
                  :aria-pressed="filters.type === item.value"
                  @click="切换类型(item.value)"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>
            <div v-if="tagOptions.length" class="manager-filter-group">
              <label>标签</label>
              <div class="manager-filter-chips manager-filter-chips--tall">
                <button
                  v-for="item in tagOptions"
                  :key="item.name"
                  type="button"
                  class="manager-filter-chip"
                  :class="{ 'is-active': filters.tag === item.name }"
                  :aria-pressed="filters.tag === item.name"
                  @click="切换标签(item.name)"
                >
                  {{ item.name }}
                  <span class="material-chip-count">{{ item.count }}</span>
                </button>
              </div>
            </div>
            <div class="manager-filter-footer">
              <span>{{ activeFilterCount ? `已选 ${activeFilterCount} 个条件` : '未设置筛选条件' }}</span>
              <ElButton text size="small" @click="resetAllFilters">清除筛选</ElButton>
            </div>
          </div>
        </ElPopover>

        <label class="manager-search">
          <ElIcon><Search /></ElIcon>
          <input
            v-model="filters.keyword"
            type="search"
            placeholder="搜索标题、正文、备注"
            aria-label="搜索资料"
            maxlength="200"
          >
        </label>
      </div>
    </div>

    <div class="manager-tabs-row">
      <nav class="manager-tabs" aria-label="资料状态">
        <button
          v-for="页签 in 状态页签"
          :key="页签.label"
          type="button"
          class="manager-tab"
          :class="{ 'is-active': !showRecycleBin && filters.status === 页签.value }"
          :aria-pressed="!showRecycleBin && filters.status === 页签.value"
          @click="切换状态页签(页签.value)"
        >
          {{ 页签.label }} <small>{{ 页签.count }}</small>
        </button>
      </nav>
      <button
        type="button"
        class="manager-tab"
        :class="{ 'is-active': showRecycleBin }"
        :aria-pressed="showRecycleBin"
        @click="toggleRecycleBin"
      >
        回收站 <small>{{ 统计.回收站 }}</small>
      </button>
    </div>

    <div
      ref="pageContainerRef"
      v-loading="initialLoading || refreshing"
      class="manager-list-body"
      :class="{ 'is-multi-select': isMultiSelectMode }"
      :aria-busy="initialLoading || refreshing || loadingMore"
    >
      <!-- 列表视图 -->
      <div
        v-if="视图 === 'table' && collections.length"
        class="manager-table"
        :class="{ 'is-multi-select': isMultiSelectMode }"
        :style="{ '--manager-grid-columns': 网格列 }"
        role="table"
        aria-label="资料列表"
      >
        <div class="manager-row manager-row-head" role="row">
          <div v-if="isMultiSelectMode" class="material-check-cell" role="columnheader">
            <ElCheckbox
              class="material-check"
              :model-value="allVisibleSelected"
              :indeterminate="部分选中"
              aria-label="全选当前页"
              @update:model-value="toggleSelectAllVisibleCollections"
            />
          </div>
          <div
            v-for="列 in 展示列"
            :key="列.value"
            :class="`material-col-${列.value}`"
            role="columnheader"
          >
            <button
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
              @click="表头排序(列.value)"
            >
              <span>{{ 列标题(列) }}</span>
              <ElIcon><SortDirectionIcon :direction="排序图标方向(列排序字段(列.value))" /></ElIcon>
            </button>
          </div>
          <div class="manager-column-actions manager-fixed-actions" role="columnheader">
            <span>操作</span>
            <ElPopover
              placement="bottom-end"
              :width="170"
              trigger="click"
              popper-class="manager-popover"
            >
              <template #reference>
                <button type="button" title="设置显示列" aria-label="设置显示列">
                  <ElIcon>
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </ElIcon>
                </button>
              </template>
              <div class="manager-column-settings">
                <label v-for="列 in 资料列" :key="列.value">
                  <input
                    type="checkbox"
                    :checked="可见列.includes(列.value)"
                    :disabled="列.value === 'title'"
                    @change="切换列显示(列.value)"
                  >
                  {{ 列标题(列) }}
                </label>
              </div>
            </ElPopover>
          </div>
        </div>

        <div
          v-for="record in collections"
          :key="record.id"
          class="manager-row"
          :class="{ 'is-selected': isSelected(record.id) }"
          role="row"
          @touchstart.passive="处理条目按下(record, $event)"
          @touchmove="处理条目移动(record, $event)"
          @touchend="处理条目抬起(record)"
          @touchcancel="处理条目抬起(record)"
          @mousedown="处理条目按下(record, $event)"
          @mousemove="处理条目移动(record, $event)"
          @mouseup="处理条目抬起(record)"
          @mouseleave="处理条目抬起(record)"
          @click="handleItemClick(record)"
        >
          <div v-if="isMultiSelectMode" class="material-check-cell" role="cell" @click.stop>
            <ElCheckbox
              class="material-check"
              :model-value="isSelected(record.id)"
              :aria-label="`选择 ${getDisplayTitle(record)}`"
              @update:model-value="toggleMultiSelect(record)"
            />
          </div>

          <div
            v-for="列 in 展示列"
            :key="列.value"
            class="manager-cell"
            :class="`material-col-${列.value}`"
            role="cell"
          >
            <span
              v-if="列.value === 'title'"
              class="material-title"
              :class="{ 'is-disabled': showRecycleBin }"
            >
              {{ getDisplayTitle(record) }}
            </span>

            <span v-else-if="列.value === 'content'" class="material-preview">
              {{ getPreviewText(record) }}
            </span>

            <span v-else-if="列.value === 'type'" class="manager-status">
              <i :class="类型圆点(record)" />
              {{ getTypeLabel(record.type) }}
            </span>

            <template v-else-if="列.value === 'tags'">
              <div v-if="record.tags?.length" class="material-tags">
                <span v-for="tag in record.tags" :key="tag" class="material-tag">{{ tag }}</span>
              </div>
              <span v-else class="manager-muted">无标签</span>
            </template>

            <span v-else-if="列.value === 'assets'" class="manager-muted">
              {{ record.assets.length ? `${record.assets.length} 个` : '—' }}
            </span>

            <ElTooltip
              v-else
              :content="格式化完整时间(记录时间(record))"
              placement="top"
              popper-class="manager-date-tooltip"
            >
              <span class="manager-date">{{ 格式化相对时间(记录时间(record)) }}</span>
            </ElTooltip>
          </div>

          <div class="manager-fixed-actions" role="cell" @click.stop>
            <div class="manager-ops">
              <template v-if="showRecycleBin">
                <ElTooltip content="恢复资料" placement="top">
                  <button type="button" title="恢复资料" aria-label="恢复资料" @click="restoreCollection(record)">
                    <ElIcon><RefreshLeft /></ElIcon>
                  </button>
                </ElTooltip>
                <ElTooltip content="永久删除" placement="top">
                  <button
                    type="button"
                    class="manager-delete"
                    title="永久删除"
                    aria-label="永久删除"
                    @click="removeCollection(record.id)"
                  >
                    <ElIcon><Delete /></ElIcon>
                  </button>
                </ElTooltip>
              </template>
              <template v-else>
                <ElTooltip content="编辑资料" placement="top">
                  <button type="button" title="编辑资料" aria-label="编辑资料" @click="openEditDialog(record)">
                    <ElIcon><PencilEditIcon /></ElIcon>
                  </button>
                </ElTooltip>
                <ElTooltip content="移入回收站" placement="top">
                  <button
                    type="button"
                    class="manager-delete"
                    title="移入回收站"
                    aria-label="移入回收站"
                    @click="removeCollection(record.id)"
                  >
                    <ElIcon><Delete /></ElIcon>
                  </button>
                </ElTooltip>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 卡片视图 -->
      <div v-else-if="视图 === 'cards' && collections.length" class="manager-cards">
        <article
          v-for="record in collections"
          :key="record.id"
          class="manager-card material-card"
          :class="{ 'is-selected': isSelected(record.id) }"
          @touchstart.passive="处理条目按下(record, $event)"
          @touchmove="处理条目移动(record, $event)"
          @touchend="处理条目抬起(record)"
          @touchcancel="处理条目抬起(record)"
          @mousedown="处理条目按下(record, $event)"
          @mousemove="处理条目移动(record, $event)"
          @mouseup="处理条目抬起(record)"
          @mouseleave="处理条目抬起(record)"
          @click="handleItemClick(record)"
        >
          <ElCheckbox
            v-if="isMultiSelectMode"
            class="material-check material-card__check"
            :model-value="isSelected(record.id)"
            :aria-label="`选择 ${getDisplayTitle(record)}`"
            @click.stop
            @update:model-value="toggleMultiSelect(record)"
          />

          <div class="material-card__kicker">
            <span class="manager-status">
              <i :class="类型圆点(record)" />
              {{ getTypeLabel(record.type) }}
            </span>
            <template v-if="record.assets.length">
              <span>·</span>
              <span>{{ record.assets.length }} 个附件</span>
            </template>
          </div>

          <h3>
            <span class="material-title" :class="{ 'is-disabled': showRecycleBin }">
              {{ getDisplayTitle(record) }}
            </span>
          </h3>
          <p>{{ getPreviewText(record) }}</p>

          <div v-if="record.tags?.length" class="material-card__tags">
            <span v-for="tag in record.tags" :key="tag" class="material-tag">{{ tag }}</span>
          </div>

          <footer @click.stop>
            <ElTooltip :content="格式化完整时间(记录时间(record))" placement="top" popper-class="manager-date-tooltip">
              <span>{{ 格式化相对时间(记录时间(record)) }}</span>
            </ElTooltip>
            <div class="manager-ops">
              <template v-if="showRecycleBin">
                <ElTooltip content="恢复资料" placement="top">
                  <button type="button" title="恢复资料" aria-label="恢复资料" @click="restoreCollection(record)">
                    <ElIcon><RefreshLeft /></ElIcon>
                  </button>
                </ElTooltip>
                <ElTooltip content="永久删除" placement="top">
                  <button
                    type="button"
                    class="manager-delete"
                    title="永久删除"
                    aria-label="永久删除"
                    @click="removeCollection(record.id)"
                  >
                    <ElIcon><Delete /></ElIcon>
                  </button>
                </ElTooltip>
              </template>
              <template v-else>
                <ElTooltip content="编辑资料" placement="top">
                  <button type="button" title="编辑资料" aria-label="编辑资料" @click="openEditDialog(record)">
                    <ElIcon><PencilEditIcon /></ElIcon>
                  </button>
                </ElTooltip>
                <ElTooltip content="移入回收站" placement="top">
                  <button
                    type="button"
                    class="manager-delete"
                    title="移入回收站"
                    aria-label="移入回收站"
                    @click="removeCollection(record.id)"
                  >
                    <ElIcon><Delete /></ElIcon>
                  </button>
                </ElTooltip>
              </template>
            </div>
          </footer>
        </article>
      </div>

      <div v-if="!initialLoading && !collections.length" class="manager-empty">{{ 空状态描述 }}</div>

      <div
        v-if="collections.length"
        class="manager-list-status"
        :class="{ 'manager-list-status--end': !loadingMore && !hasMoreCollections }"
        role="status"
      >
        <span v-if="loadingMore">正在加载更早的资料…</span>
        <button v-else-if="hasMoreCollections" type="button" @click="fetchNextPage">加载更多</button>
        <span v-else>已显示全部资料</span>
      </div>
      <div
        v-if="collections.length && hasMoreCollections"
        ref="loadMoreTriggerRef"
        class="material-load-trigger"
        aria-hidden="true"
      />
    </div>

    <BaseDialog
      v-model="showDeleteConfirm"
      class="manager-dialog"
      modal-class="manager-dialog-overlay"
      width="420px"
      style="max-width: 92vw"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <template #header>
        <div class="manager-dialog-header">
          <i />
          <strong>确认删除</strong>
          <span>{{ deleteMode === 'permanent' ? '删除后无法恢复' : '可在回收站中找回' }}</span>
        </div>
      </template>
      <div class="manager-dialog-form material-confirm">
        <div class="material-confirm__body">
          <ElIcon :size="30" color="var(--el-color-danger)"><WarningFilled /></ElIcon>
          <span>
            {{
              deleteMode === 'permanent'
                ? (pendingDeleteIds.length > 1 ? `确定永久删除选中的 ${pendingDeleteIds.length} 条资料吗？此操作不可恢复。` : '确定永久删除这条资料吗？此操作不可恢复。')
                : (pendingDeleteIds.length > 1 ? `确定将选中的 ${pendingDeleteIds.length} 条资料移至回收站吗？` : '确定将这条资料移至回收站吗？')
            }}
          </span>
        </div>
        <ElCheckbox v-model="dontAskAgain" class="material-confirm__check">
          本次都不再询问（刷新后恢复）
        </ElCheckbox>
      </div>
      <template #footer>
        <div class="manager-dialog-footer">
          <span>{{ deleteMode === 'permanent' ? '永久删除后数据不可恢复' : '删除后可在回收站恢复' }}</span>
          <ElButton @click="cancelDeleteConfirm">取消</ElButton>
          <ElButton type="danger" @click="confirmDeleteConfirm">
            {{ deleteMode === 'permanent' ? '永久删除' : '移至回收站' }}
          </ElButton>
        </div>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="showDialog"
      class="manager-dialog material-dialog"
      modal-class="manager-dialog-overlay"
      width="760px"
      style="max-width: 96vw"
    >
      <template #header>
        <div class="manager-dialog-header">
          <i />
          <strong>{{ isEdit ? '编辑资料' : '新增资料' }}</strong>
          <span>{{ isEdit ? '保存后立即更新资料库列表' : '支持网页链接、文本、图片和文件' }}</span>
        </div>
      </template>

      <div class="manager-dialog-form material-form">
        <ElForm label-position="top">
          <div class="material-form__grid">
            <ElFormItem label="类型">
              <ElSelect v-model="form.type">
                <ElOption v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="状态">
              <ElSelect v-model="form.status">
                <ElOption v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </ElSelect>
            </ElFormItem>
          </div>

          <ElFormItem>
            <template #label>
              <span>标题<span v-if="shouldShowAnyContentRequiredMark" class="material-required">*</span></span>
            </template>
            <ElInput v-model="form.title" placeholder="资料标题，可留空" maxlength="300" />
          </ElFormItem>

          <ElFormItem>
            <template #label>
              <span>正文<span v-if="shouldShowAnyContentRequiredMark" class="material-required">*</span></span>
            </template>
            <ElInput v-model="form.content_text" type="textarea" :rows="5" placeholder="网页正文或手动粘贴内容" />
          </ElFormItem>
          <ElFormItem>
            <template #label>
              <span>备注<span v-if="shouldShowAnyContentRequiredMark" class="material-required">*</span></span>
            </template>
            <ElInput v-model="form.note" type="textarea" :rows="4" placeholder="补充备注、整理思路、后续动作" />
          </ElFormItem>

          <div class="manager-form-section">标签</div>
          <ElFormItem>
            <TagInlineInput v-model="form.tags_text" :existing-tags="allExistingTags" placeholder="标签，用逗号分隔" />
            <div v-if="availableTags.length > 0" class="material-existing-tags">
              <button
                v-for="tag in availableTags"
                :key="tag"
                type="button"
                class="manager-filter-chip"
                @click="form.tags_text = addTagToForm(form.tags_text, tag)"
              >
                {{ tag }}
              </button>
            </div>
          </ElFormItem>

          <div class="manager-form-section">
            <span>附件<span v-if="shouldShowAssetRequiredMark" class="material-required">*</span></span>
          </div>
          <ElFormItem>
            <div class="asset-panel">
              <div v-if="isAssetType && form.assets.length === 0" class="material-form__hint material-form__hint--danger">
                {{ getTypeLabel(form.type) }}类型至少需要上传一个附件
              </div>
              <div class="asset-toolbar">
                <button type="button" class="asset-folder-summary" title="选择上传目录" @click="打开目录选择弹窗">
                  {{ 当前上传目录标签 }}
                </button>
                <ElButton :loading="uploadLoading" @click="openUploadPicker">
                  <ElIcon><Upload /></ElIcon>
                  <span>上传附件</span>
                </ElButton>
                <input
                  ref="uploadInputRef"
                  class="hidden-upload"
                  type="file"
                  multiple
                  @change="handleUploadChange"
                >
              </div>

              <div v-if="form.assets.length === 0" class="asset-empty">
                暂无附件
              </div>

              <div v-else class="asset-list">
                <div v-for="(asset, index) in form.assets" :key="asset.file_id" class="asset-item">
                  <div class="asset-info">
                    <a :href="asset.file.url" target="_blank" class="asset-name">
                      {{ asset.file.original_name }}
                    </a>
                    <div class="asset-meta">
                      {{ asset.file.mime_type }} · {{ Math.max(1, Math.round(asset.file.size / 1024)) }} KB
                    </div>
                  </div>
                  <div class="asset-actions">
                    <ElButton text :disabled="index === 0" @click="moveAsset(index, -1)">上移</ElButton>
                    <ElButton text :disabled="index === form.assets.length - 1" @click="moveAsset(index, 1)">下移</ElButton>
                    <ElButton text type="danger" @click="removeAsset(index)">移除</ElButton>
                  </div>
                </div>
              </div>
            </div>
          </ElFormItem>
        </ElForm>
      </div>

      <template #footer>
        <div class="manager-dialog-footer">
          <span>标题、正文、备注或附件至少填写一项</span>
          <template v-if="isEdit">
            <ElButton @click="showDialog = false">取消</ElButton>
            <ElButton type="primary" :loading="dialogLoading" @click="saveCollection()">
              保存修改
            </ElButton>
          </template>
          <template v-else>
            <ElButton :disabled="dialogLoading" @click="saveCollection(true)">再创</ElButton>
            <ElButton type="primary" :loading="dialogLoading" @click="saveCollection()">
              创建资料
            </ElButton>
          </template>
        </div>
      </template>
    </BaseDialog>

    <FolderPickerDialog
      v-model="showFolderPickerDialog"
      title="选择上传目录"
      :initial-folder-id="选中的上传目录"
      @confirm="应用上传目录选择"
    />

    <!-- 多选工具条：长按进入多选后浮在底部 -->
    <div
      v-if="isMultiSelectMode && multiSelectedIds.length"
      class="material-selection-bar"
      role="status"
    >
      <span class="material-selection-bar__count">已选 {{ multiSelectedIds.length }} 项</span>
      <div class="material-selection-bar__actions">
        <ElButton @click="toggleSelectAllVisibleCollections">
          {{ allVisibleSelected ? '取消全选' : '全选当前页' }}
        </ElButton>
        <ElButton type="danger" plain @click="batchDeleteSelectedCollections">
          {{ showRecycleBin ? '批量永久删除' : '批量删除' }}
        </ElButton>
        <ElButton text @click="exitMultiSelect">取消选择</ElButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================================
   页头、工具栏与页签由 manager.css 提供，这里只补资料库专属部分
   ========================================================================== */

/* 表格列由脚本按「可见列 + 操作列」内联输出，多选时最前面额外插入复选框列 */

/* 长按多选时禁止文本选择，避免移动端长按弹出选中菜单 */
.material-manager .manager-row,
.material-manager .material-card {
  -webkit-touch-callout: none;
  user-select: none;
}

.material-manager .material-check-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.material-manager .manager-row.is-selected {
  --manager-row-bg: var(--manager-active);
  background: var(--manager-active);
}

.material-manager .material-col-title,
.material-manager .material-col-content {
  min-width: 0;
}

.material-manager .material-title {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--manager-ink);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-manager .material-title.is-disabled {
  color: var(--manager-ink-2);
}

/* 能打开编辑弹窗时，悬停整行或卡片给标题加下划线（回收站与多选模式不加） */
.material-manager:not(.is-recycle):not(.is-multi-select) .manager-row:hover .material-title,
.material-manager:not(.is-recycle):not(.is-multi-select) .material-card:hover .material-title {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.material-manager .material-preview {
  display: block;
  overflow: hidden;
  min-width: 0;
  color: var(--manager-muted);
  font-size: 11.5px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-manager .material-tags {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}

.material-manager .material-tag {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: 18px;
  padding: 0 5px;
  border-radius: 3px;
  background: var(--manager-hover);
  color: var(--manager-muted);
  font-size: 10.5px;
  line-height: 1;
  white-space: nowrap;
}

.material-manager .material-chip-count {
  margin-left: 4px;
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: 9.5px;
  opacity: 0.72;
}

/* 多选工具条：长按进入多选后固定在底部居中，列表底部留出空间避免遮住最后一条 */
.material-manager .manager-list-body.is-multi-select {
  padding-bottom: 84px;
}

.material-manager .material-selection-bar {
  position: fixed;
  left: 50%;
  bottom: calc(20px + env(safe-area-inset-bottom));
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(720px, calc(100vw - 32px));
  padding: 8px 12px;
  border: 1px solid var(--manager-line);
  border-radius: 8px;
  background: var(--manager-bg);
  box-shadow: 0 12px 32px rgb(0 0 0 / 16%);
  color: var(--manager-ink-2);
  font-size: 12px;
  transform: translateX(-50%);
}

.material-manager .material-selection-bar__count {
  color: var(--manager-ink);
  font-weight: 500;
  white-space: nowrap;
}

.material-manager .material-selection-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
}

.material-manager .material-selection-bar__actions :deep(.el-button) {
  margin-left: 0;
  border-radius: 5px;
  font-size: 12px;
}

/* 复选框列 */
.material-manager .material-check {
  margin-right: 0;
  height: auto;
}

.material-manager .material-check :deep(.el-checkbox__label) {
  display: none;
}

/* ==========================================================================
   卡片视图
   ========================================================================== */
.material-manager .material-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 15px 42px 13px 16px;
}

.material-manager .material-card.is-selected {
  border-color: var(--el-color-primary);
  box-shadow: inset 0 0 0 1px var(--el-color-primary);
}

.material-manager .material-card__check {
  position: absolute;
  top: 14px;
  right: 14px;
}

.material-manager .material-card__kicker {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--manager-muted);
  font-size: 11px;
}

.material-manager .material-card__kicker > span:not(.manager-status) {
  color: var(--manager-placeholder);
}

.material-manager .material-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}

.material-manager .material-card h3 .material-title {
  font-size: 13px;
}

/* 卡片高度随栅格拉伸，页脚统一贴底（压过 manager.css 的 12px） */
.material-manager .material-card footer {
  margin-top: auto;
}

.material-manager .material-card footer .manager-ops {
  margin-left: auto;
}

/* 加载更多触发器 */
.material-manager .material-load-trigger {
  width: 100%;
  height: 1px;
}

/* ==========================================================================
   弹窗（弹窗被 teleport 到 body，样式依赖渲染时的 scoped 属性）
   ========================================================================== */
.material-confirm__body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 2px 0 14px;
  color: var(--manager-ink-2);
  font-size: 12.5px;
  line-height: 1.7;
}

.material-confirm__check :deep(.el-checkbox__label) {
  color: var(--el-text-color-placeholder);
  font-size: 11.5px;
}

.material-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
}

.material-required {
  margin-left: 2px;
  color: var(--el-color-danger);
}

.material-form__hint {
  margin: 0 0 12px;
  color: var(--el-text-color-placeholder);
  font-size: 11.5px;
  line-height: 1.6;
}

.material-form__hint--danger {
  color: var(--el-color-danger);
}

.material-existing-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.asset-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.asset-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.asset-folder-summary {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 9px;
  overflow: hidden;
  border: 1px solid var(--manager-line);
  border-radius: 5px;
  background: var(--manager-bg);
  color: var(--manager-ink-2);
  font-size: 12px;
  line-height: 28px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.14s;
}

.asset-folder-summary:hover {
  border-color: var(--el-border-color-dark, #d4d7de);
}

.asset-toolbar :deep(.el-button) {
  margin-left: 0;
  border-radius: 5px;
  font-size: 12px;
}

.asset-empty {
  width: 100%;
  padding: 14px;
  border: 1px dashed var(--manager-line);
  border-radius: 6px;
  color: var(--el-text-color-placeholder);
  font-size: 11.5px;
}

.asset-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.asset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--manager-line);
  border-radius: 6px;
  background: var(--el-fill-color-extra-light);
}

.asset-info {
  min-width: 0;
}

.asset-name {
  color: var(--el-color-primary);
  font-size: 12px;
  text-decoration: none;
}

.asset-name:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.asset-meta {
  margin-top: 3px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.asset-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.asset-actions :deep(.el-button) {
  margin-left: 0;
  font-size: 11.5px;
}

.hidden-upload {
  display: none;
}

/* ==========================================================================
   窄屏：收起次要列，卡片单列排布
   ========================================================================== */
@media (max-width: 768px) {
  /* 窄屏工具栏换行：视图切换独占一行，筛选与搜索分到下一行 */
  .material-manager .manager-toolbar {
    flex-wrap: wrap;
    row-gap: 8px;
  }

  .material-manager .manager-filters {
    flex: 1 1 100%;
  }

  /* 网格列由内联 style 提供，窄屏用 !important 覆盖成「标题 + 操作」两列 */
  .material-manager .manager-table {
    --manager-grid-columns: minmax(0, 1fr) 84px !important;
  }

  .material-manager .manager-table.is-multi-select {
    --manager-grid-columns: 28px minmax(0, 1fr) 84px !important;
  }

  .material-manager .material-col-content,
  .material-manager .material-col-type,
  .material-manager .material-col-tags,
  .material-manager .material-col-assets,
  .material-manager .material-col-date {
    display: none;
  }

  .material-manager .manager-list-body.is-multi-select {
    padding-bottom: 116px;
  }

  .material-manager .material-selection-bar {
    bottom: calc(12px + env(safe-area-inset-bottom));
    width: calc(100vw - 24px);
    flex-wrap: wrap;
    row-gap: 8px;
  }

  .material-manager .material-selection-bar__actions {
    flex: 1 1 100%;
    margin-left: 0;
  }

  .material-form__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .asset-item {
    flex-direction: column;
    align-items: stretch;
  }

  .asset-actions {
    justify-content: flex-start;
  }
}
</style>
