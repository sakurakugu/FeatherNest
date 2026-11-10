<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core'
/* global Event, TouchEvent, MouseEvent, clearTimeout, Blob, URL, IntersectionObserver */
import {
  Plus,
  Filter,
  Sort,
  ArrowUp,
  ArrowDown,
  Lightning,
  Document,
  Delete,
  Download,
  Edit,
  MoreFilled,
  RefreshLeft,
  Search,
} from '@element-plus/icons-vue'
import { 获取API错误消息 } from '@feathernest/api'
import { BaseDialog, type ContentTabItem } from '@feathernest/ui'
import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElIcon,
  ElInput,
  ElMessage,
  ElOption,
  ElPopconfirm,
  ElPopover,
  ElSelect,
  ElSkeleton,
} from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  删除文章 as removeArticle,
  恢复文章 as requestRestoreArticle,
  全部文章筛选值,
  创建文章草稿,
  文章转待办,
  文章转资料,
  更新文章,
  未分类文章筛选值,
  根据ID获取我的文章,
  获取我的文章分类列表,
  获取我的文章列表,
  获取全部标签列表,
} from '../../api'
import MarkdownRenderer from '../../components/Markdown渲染器.vue'
import { 构建文章传输负载 } from '../../transfer'
import type {
  ArticleListResponse,
  ArticleOrganizationState,
  ArticleRecord,
  CategoryRecord,
  TagRecord,
  ArticleManagerQuery,
  ArticleSortField,
} from '../../types'

const props = withDefaults(
  defineProps<{
    showBack?: boolean
    backTo?: string
  }>(),
  {
    showBack: false,
    backTo: '/',
  },
)

const emit = defineEmits<{ 'article-count-change': [count: number] }>()
const router = useRouter()
const route = useRoute()
const pageContainerRef = ref<globalThis.HTMLDivElement | null>(null)
const splitListRef = ref<globalThis.HTMLDivElement | null>(null)
const articles = ref<ArticleRecord[]>([])
const categories = ref<CategoryRecord[]>([])
const initialLoading = ref(true)
const refreshing = ref(false)
const loadingMore = ref(false)
const pagination = ref({ page: 0, pageSize: 10, total: 0, pageCount: 0 })
const allArticleTotal = ref(0)
const showTransferDialog = ref(false)
const exportingArticles = ref(false)
type ArticleListMode = 'active-card' | 'active-table' | 'active-split' | 'deleted'
const currentListMode = ref<ArticleListMode>('active-table')
const selectedArticle = ref<ArticleRecord | null>(null)
const selectedCategoryId = ref<string>(全部文章筛选值)
const selectedOrganizationState = ref<ArticleOrganizationState | ''>('')
const tags = ref<TagRecord[]>([])
const selectedStatus = ref<ArticleManagerQuery['status'] | ''>('')
const selectedTagId = ref('')
const sortBy = ref<ArticleSortField | ''>('')
const sortOrder = ref<'asc' | 'desc'>('desc')
const showQuickDialog = ref(false)
const filterCount = computed(
  () =>
    Number(!!selectedOrganizationState.value) +
    Number(!!selectedStatus.value) +
    Number(!!selectedTagId.value),
)
const managerQuery = computed<ArticleManagerQuery>(() => ({
  status: selectedStatus.value || undefined,
  tag_id: selectedTagId.value || undefined,
  sort_by: sortBy.value || 'last_edited_at',
  sort_order: sortBy.value ? sortOrder.value : 'desc',
}))
const sortOptions: { value: ArticleSortField; label: string }[] = [
  { value: 'title', label: '文章标题' },
  { value: 'status', label: '发布状态' },
  { value: 'organization_state', label: '整理状态' },
  { value: 'category', label: '分类' },
  { value: 'tags', label: '标签' },
  { value: 'word_count', label: '字数' },
  { value: 'last_edited_at', label: '最近编辑' },
]
let listRequestVersion = 0
const searchText = ref('')
const appliedSearch = ref('')
const quickContent = ref('')
const quickSaving = ref(false)
const showConvertDialog = ref(false)
const converting = ref(false)
const convertingArticle = ref<ArticleRecord | null>(null)
const convertTarget = ref<'todo' | 'material'>('todo')
const convertTitle = ref('')
const convertContent = ref('')
const convertNote = ref('')
const convertMaterialType = ref<'text' | 'link'>('text')

const CREATE_BUTTON_LONG_PRESS_MS = 600
const ARTICLE_TRANSFER_VERSION = 2
const ARTICLE_EXPORT_PAGE_SIZE = 50
const ARTICLE_LIST_PAGE_SIZE = 10

let createButtonLongPressTimer: ReturnType<typeof setTimeout> | null = null
let ignoreNextCreateClick = false

const hasMoreArticles = computed(() => pagination.value.page < pagination.value.pageCount)
const showSkeleton = computed(() => initialLoading.value && articles.value.length === 0)
const isArticleListEmpty = computed(() => !initialLoading.value && articles.value.length === 0)
const isRecycleBinMode = computed(() => currentListMode.value === 'deleted')
const isTableViewMode = computed(() => currentListMode.value === 'active-table')
const activeCategoryId = computed(() => selectedCategoryId.value)
const exportArticleTotal = computed(() => (isRecycleBinMode.value ? 0 : allArticleTotal.value))
const emptyDescription = computed(() =>
  isRecycleBinMode.value ? '回收站里还没有文章' : '还没有文章',
)
const 路由前缀 = computed(() => (route.path.startsWith('/admin') ? '/admin' : ''))
const uncategorizedArticleTotal = computed(() => {
  const categorizedTotal = categories.value.reduce(
    (total, category) => total + (category.article_count ?? 0),
    0,
  )
  return Math.max(allArticleTotal.value - categorizedTotal, 0)
})
const articleListModeOptions = [
  { value: 'active-table', label: '列表' },
  { value: 'active-card', label: '卡片' },
  { value: 'active-split', label: '分栏' },
] as const satisfies readonly { value: ArticleListMode; label: string }[]

const categoryFilterOptions = computed<ContentTabItem[]>(() => [
  { value: 全部文章筛选值, label: '全部', count: allArticleTotal.value },
  ...(uncategorizedArticleTotal.value > 0
    ? [{ value: 未分类文章筛选值, label: '未分类', count: uncategorizedArticleTotal.value }]
    : []),
  ...categories.value.map((category) => ({
    value: category.id,
    label: category.name,
    count: category.article_count ?? 0,
  })),
])

function resolve文章路径(path: '/articles' | '/articles/edit', articleId?: string) {
  const fullPath = `${路由前缀.value}${path}`
  return articleId ? `${fullPath}/${articleId}` : fullPath
}

function getStatusLabel(status: ArticleRecord['status']): string {
  if (status === 'public') return '公开'
  if (status === 'login_required') return '登录可见'
  return '未发布'
}

function formatArticleDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

function formatArticleDateTime(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

function formatArticleWordCount(count: number | null | undefined) {
  return `${Math.max(0, count ?? 0).toLocaleString()} 字`
}

function getArticlePublishDate(article: ArticleRecord) {
  return formatArticleDate(article.created_at)
}

function getArticleEditDate(article: ArticleRecord) {
  return formatArticleDateTime(article.last_edited_at || article.updated_at || article.created_at)
}

function applyArticlePage(data: ArticleListResponse, append: boolean) {
  articles.value = append ? [...articles.value, ...data.items] : data.items
  pagination.value = {
    page: data.page,
    pageSize: data.page_size,
    total: data.total,
    pageCount: data.pages,
  }
}

function 重置无效分类筛选() {
  if (selectedCategoryId.value === 未分类文章筛选值 && uncategorizedArticleTotal.value <= 0) {
    selectedCategoryId.value = 全部文章筛选值
    return
  }
  if (
    selectedCategoryId.value !== 全部文章筛选值 &&
    selectedCategoryId.value !== 未分类文章筛选值 &&
    !categories.value.some((category) => category.id === selectedCategoryId.value)
  ) {
    selectedCategoryId.value = 全部文章筛选值
  }
}

async function reloadCategories() {
  categories.value = await 获取我的文章分类列表(isRecycleBinMode.value)
  重置无效分类筛选()
}

async function requestArticlePage(page: number, append: boolean, requestVersion: number) {
  const data = await 获取我的文章列表(
    page,
    pagination.value.pageSize || ARTICLE_LIST_PAGE_SIZE,
    isRecycleBinMode.value,
    activeCategoryId.value,
    selectedOrganizationState.value || undefined,
    appliedSearch.value || undefined,
    managerQuery.value,
  )
  if (requestVersion === listRequestVersion) applyArticlePage(data, append)
}

async function 获取指定可见数量的文章(targetVisibleCount: number) {
  const pageSize = pagination.value.pageSize || ARTICLE_LIST_PAGE_SIZE
  const queryParams = [
    isRecycleBinMode.value,
    activeCategoryId.value,
    selectedOrganizationState.value || undefined,
    appliedSearch.value || undefined,
    managerQuery.value,
  ] as const
  const firstPage = await 获取我的文章列表(1, pageSize, ...queryParams)
  const items = [...firstPage.items]
  let currentPage = firstPage.page

  while (items.length < targetVisibleCount && currentPage < firstPage.pages) {
    currentPage += 1
    const data = await 获取我的文章列表(currentPage, pageSize, ...queryParams)
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

async function 刷新全部文章数量(requestVersion: number, totalFromCurrentPage: number) {
  if (
    activeCategoryId.value === 全部文章筛选值 &&
    !selectedOrganizationState.value &&
    !appliedSearch.value &&
    !selectedStatus.value &&
    !selectedTagId.value
  ) {
    allArticleTotal.value = totalFromCurrentPage
    if (!isRecycleBinMode.value) emit('article-count-change', totalFromCurrentPage)
    return
  }

  const data = await 获取我的文章列表(1, 1, isRecycleBinMode.value, 全部文章筛选值)
  if (requestVersion !== listRequestVersion) return
  allArticleTotal.value = data.total
  if (!isRecycleBinMode.value) emit('article-count-change', data.total)
}

async function reloadArticles(
  targetVisibleCount = ARTICLE_LIST_PAGE_SIZE,
  options: { silent?: boolean } = {},
) {
  const requestVersion = ++listRequestVersion
  const silent = options.silent ?? !initialLoading.value
  if (silent) {
    refreshing.value = true
  } else {
    initialLoading.value = true
  }
  loadingMore.value = false
  try {
    const data = await 获取指定可见数量的文章(targetVisibleCount)
    if (requestVersion !== listRequestVersion) return
    await 刷新全部文章数量(requestVersion, data.total)
    if (requestVersion !== listRequestVersion) return
    articles.value = data.items
    pagination.value = {
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      pageCount: data.pageCount,
    }
  } catch (error) {
    console.error('加载文章列表失败', { query: managerQuery.value, error })
    ElMessage.error(获取API错误消息(error, '加载文章失败'))
  } finally {
    if (requestVersion === listRequestVersion) {
      refreshing.value = false
      initialLoading.value = false
    }
  }
}

async function fetchNextPage() {
  if (initialLoading.value || refreshing.value || loadingMore.value || !hasMoreArticles.value) {
    return
  }
  const requestVersion = listRequestVersion
  loadingMore.value = true
  try {
    await requestArticlePage(pagination.value.page + 1, true, requestVersion)
  } catch (error) {
    console.error('加载更多文章失败', { page: pagination.value.page + 1, error })
    ElMessage.error(获取API错误消息(error, '加载更多文章失败'))
  } finally {
    if (requestVersion === listRequestVersion) loadingMore.value = false
  }
}

async function deleteArticle(id: string) {
  const targetVisibleCount = Math.max(
    articles.value.length - 1,
    pagination.value.pageSize || ARTICLE_LIST_PAGE_SIZE,
  )
  await removeArticle(id, isRecycleBinMode.value)
  ElMessage.success(isRecycleBinMode.value ? '已永久删除' : '已移入回收站')
  await reloadCategories()
  await reloadArticles(targetVisibleCount, { silent: true })
}

async function restoreArticle(id: string) {
  const targetVisibleCount = Math.max(
    articles.value.length - 1,
    pagination.value.pageSize || ARTICLE_LIST_PAGE_SIZE,
  )
  await requestRestoreArticle(id)
  ElMessage.success('已恢复文章')
  await reloadCategories()
  await reloadArticles(targetVisibleCount, { silent: true })
}

async function saveQuickArticle() {
  const content = quickContent.value.trim()
  if (!content) return
  quickSaving.value = true
  try {
    await 创建文章草稿({ content, organization_state: 'inbox' })
    quickContent.value = ''
    showQuickDialog.value = false
    ElMessage.success('已存入待整理')
    await reloadCategories()
    await reloadArticles(ARTICLE_LIST_PAGE_SIZE, { silent: true })
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '保存失败'))
  } finally {
    quickSaving.value = false
  }
}

async function changeOrganizationState(article: ArticleRecord, state: ArticleOrganizationState) {
  if (article.organization_state === state) return
  try {
    await 更新文章(article.id, { organization_state: state })
    ElMessage.success('整理状态已更新')
    await reloadArticles(Math.max(articles.value.length, ARTICLE_LIST_PAGE_SIZE), { silent: true })
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '更新整理状态失败'))
  }
}

async function openConvertDialog(article: ArticleRecord, target: 'todo' | 'material') {
  convertingArticle.value = article
  convertTarget.value = target
  convertTitle.value = article.title
  convertContent.value = article.excerpt || ''
  convertNote.value = ''
  convertMaterialType.value = 'text'
  try {
    const detail = await 根据ID获取我的文章(article.id)
    if (convertingArticle.value?.id !== article.id) return
    convertContent.value = detail.content
    showConvertDialog.value = true
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '读取文章正文失败'))
  }
}

async function submitConversion() {
  const article = convertingArticle.value
  if (!article || !convertTitle.value.trim()) {
    ElMessage.warning('请填写标题')
    return
  }
  converting.value = true
  try {
    if (convertTarget.value === 'todo') {
      await 文章转待办(article.id, {
        title: convertTitle.value.trim(),
        description: convertContent.value || null,
      })
    } else {
      await 文章转资料(article.id, {
        title: convertTitle.value.trim(),
        content_text: convertContent.value || null,
        note: convertNote.value || null,
        type: convertMaterialType.value,
      })
    }
    showConvertDialog.value = false
    ElMessage.success(convertTarget.value === 'todo' ? '已生成待办' : '已生成资料')
    await reloadArticles(Math.max(articles.value.length, ARTICLE_LIST_PAGE_SIZE), { silent: true })
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '转换失败'))
  } finally {
    converting.value = false
  }
}

function handleArticleAction(article: ArticleRecord, action: string) {
  if (action === 'todo' || action === 'material') openConvertDialog(article, action)
  if (action === 'inbox' || action === 'organized' || action === 'archived')
    void changeOrganizationState(article, action)
  const converted = article.converted_items.find((item) => item.id === action)
  if (converted)
    void router.push(
      `${路由前缀.value}/${converted.target_type === 'todo' ? 'todos' : 'materials'}?open=${encodeURIComponent(converted.target_id)}`,
    )
}

async function selectArticle(article: ArticleRecord) {
  selectedArticle.value = article
  try {
    const detail = await 根据ID获取我的文章(article.id)
    if (selectedArticle.value?.id === article.id) selectedArticle.value = detail
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '读取文章正文失败'))
  }
}

function clearCreateButtonLongPress() {
  if (createButtonLongPressTimer !== null) {
    clearTimeout(createButtonLongPressTimer)
    createButtonLongPressTimer = null
  }
}

function openTransferDialog() {
  showTransferDialog.value = true
}

function startCreateButtonLongPress(event: Event) {
  if (event instanceof MouseEvent && event.button !== 0) {
    return
  }
  clearCreateButtonLongPress()
  createButtonLongPressTimer = setTimeout(() => {
    ignoreNextCreateClick = true
    openTransferDialog()
  }, CREATE_BUTTON_LONG_PRESS_MS)
}

function cancelCreateButtonLongPress() {
  clearCreateButtonLongPress()
}

function handleCreateButtonClick() {
  clearCreateButtonLongPress()
  if (ignoreNextCreateClick) {
    ignoreNextCreateClick = false
    return
  }
  void router.push(resolve文章路径('/articles/edit'))
}

async function fetchAllMyArticles(): Promise<ArticleRecord[]> {
  const firstPage = await 获取我的文章列表(1, ARTICLE_EXPORT_PAGE_SIZE)
  const summaryArticles = [...firstPage.items]

  for (let page = 2; page <= firstPage.pages; page += 1) {
    const data = await 获取我的文章列表(page, ARTICLE_EXPORT_PAGE_SIZE)
    summaryArticles.push(...data.items)
  }

  return Promise.all(summaryArticles.map((article) => 根据ID获取我的文章(article.id)))
}

function downloadBackupFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function exportArticles() {
  exportingArticles.value = true
  try {
    const allArticles = await fetchAllMyArticles()
    if (allArticles.length === 0) {
      ElMessage.warning('当前没有可备份的文章')
      return
    }

    const payload = 构建文章传输负载(ARTICLE_TRANSFER_VERSION, allArticles)
    const today = new Date().toISOString().slice(0, 10)
    downloadBackupFile(`articles-${today}.json`, JSON.stringify(payload, null, 2))
    ElMessage.success(`已备份 ${payload.total} 篇文章`)
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '文章备份失败'))
  } finally {
    exportingArticles.value = false
  }
}

onMounted(() => {
  void reloadCategories()
  void reloadArticles()
  void 获取全部标签列表()
    .then((items) => {
      tags.value = items
    })
    .catch((error) => {
      ElMessage.error(获取API错误消息(error, '加载标签失败'))
    })
})

onBeforeUnmount(() => {
  clearCreateButtonLongPress()
})

watch(
  [
    isRecycleBinMode,
    selectedCategoryId,
    selectedOrganizationState,
    appliedSearch,
    selectedStatus,
    selectedTagId,
    sortBy,
    sortOrder,
  ],
  ([nextDeleted], [previousDeleted]) => {
    pagination.value = { page: 0, pageSize: ARTICLE_LIST_PAGE_SIZE, total: 0, pageCount: 0 }
    if (nextDeleted !== previousDeleted) void reloadCategories()
    void reloadArticles(ARTICLE_LIST_PAGE_SIZE, { silent: true })
  },
)

watch(
  () => [uncategorizedArticleTotal.value, categories.value] as const,
  () => {
    重置无效分类筛选()
  },
)

watch([currentListMode, articles], ([mode, items]) => {
  if (mode !== 'active-split') return
  if (!items.some((item) => item.id === selectedArticle.value?.id)) {
    selectedArticle.value = null
    if (items[0]) void selectArticle(items[0])
  }
})

function changeSort(field: ArticleSortField) {
  if (sortBy.value !== field) {
    sortBy.value = field
    sortOrder.value = 'asc'
  } else if (sortOrder.value === 'asc') {
    sortOrder.value = 'desc'
  } else {
    sortBy.value = ''
  }
}

function clearFilters() {
  selectedStatus.value = ''
  selectedTagId.value = ''
  selectedOrganizationState.value = ''
}

function selectCategory(value: ContentTabItem['value']) {
  if (isRecycleBinMode.value) currentListMode.value = 'active-table'
  selectedCategoryId.value = String(value)
}

function openRecycleBin() {
  currentListMode.value = 'deleted'
  selectedCategoryId.value = 全部文章筛选值
}

function openArticlePreview(article: ArticleRecord) {
  void selectArticle(article)
  currentListMode.value = 'active-split'
}

useInfiniteScroll(pageContainerRef, fetchNextPage, {
  distance: 240,
  canLoadMore: () =>
    currentListMode.value !== 'active-split' &&
    hasMoreArticles.value &&
    !refreshing.value &&
    !initialLoading.value,
})
useInfiniteScroll(splitListRef, fetchNextPage, {
  distance: 160,
  canLoadMore: () =>
    currentListMode.value === 'active-split' &&
    hasMoreArticles.value &&
    !refreshing.value &&
    !initialLoading.value,
})
</script>

<template>
  <div
    ref="pageContainerRef"
    class="article-manager"
    :class="{ 'is-split': currentListMode === 'active-split' }"
  >
    <section class="article-page">
      <header class="article-page-head">
        <div>
          <button
            v-if="props.showBack"
            class="article-back"
            type="button"
            @click="router.push(props.backTo)"
          >
            返回
          </button>
          <h1>{{ isRecycleBinMode ? '回收站' : '文章管理' }}</h1>
          <p>共 {{ allArticleTotal }} 篇文章</p>
        </div>
        <div class="page-actions">
          <ElButton v-if="!isRecycleBinMode" class="article-action" @click="showQuickDialog = true">
            <ElIcon><Lightning /></ElIcon><span>快速记录</span>
          </ElButton>
          <ElButton v-if="!isRecycleBinMode" class="article-action" @click="openTransferDialog">
            <ElIcon><Download /></ElIcon><span>备份</span>
          </ElButton>
          <div
            v-if="!isRecycleBinMode"
            class="create-button-wrapper"
            @touchstart.passive="startCreateButtonLongPress"
            @touchmove="cancelCreateButtonLongPress"
            @touchend="cancelCreateButtonLongPress"
            @touchcancel="cancelCreateButtonLongPress"
            @mousedown="startCreateButtonLongPress"
            @mouseup="cancelCreateButtonLongPress"
            @mouseleave="cancelCreateButtonLongPress"
            @contextmenu.prevent
          >
            <ElButton
              class="article-action article-action--create"
              type="primary"
              title="长按可打开文章备份"
              @click="handleCreateButtonClick"
            >
              <ElIcon><Plus /></ElIcon><span>写文章</span>
            </ElButton>
          </div>
        </div>
      </header>

      <ElSkeleton :loading="showSkeleton" animated>
        <div v-loading="refreshing" class="article-list">
          <div class="article-toolbar">
            <div class="article-mode-nav" aria-label="文章视图切换">
              <button
                v-for="item in articleListModeOptions"
                :key="item.value"
                class="article-mode-nav__item"
                :class="{ 'is-active': currentListMode === item.value }"
                type="button"
                :title="item.label"
                @click="currentListMode = item.value"
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
                    <path v-if="item.value === 'active-table'" d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
                    <template v-else-if="item.value === 'active-card'">
                      <rect x="3" y="4" width="8" height="7" rx="1" />
                      <rect x="13" y="4" width="8" height="7" rx="1" />
                      <rect x="3" y="13" width="8" height="7" rx="1" />
                      <rect x="13" y="13" width="8" height="7" rx="1" />
                    </template>
                    <template v-else>
                      <rect x="3" y="4" width="18" height="16" rx="1" />
                      <path d="M9 4v16" />
                    </template>
                  </svg>
                </ElIcon>
                <span>{{ item.label }}</span>
              </button>
            </div>
            <div class="article-filters">
              <ElPopover placement="bottom-end" :width="260" trigger="click">
                <template #reference
                  ><button type="button" class="article-sort-control" aria-label="排序设置">
                    <ElIcon><Sort /></ElIcon
                    ><span>{{ sortOptions.find((item) => item.value === sortBy)?.label || '默认排序' }}</span
                    ><ElIcon
                      ><component :is="sortBy ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : Sort"
                    /></ElIcon></button
                ></template>
                <div class="article-filter-panel">
                  <label>排序字段</label>
                  <ElSelect v-model="sortBy" aria-label="排序字段"
                    ><ElOption label="默认排序" value="" /><ElOption
                      v-for="item in sortOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                  /></ElSelect>
                  <label>排序方向</label>
                  <ElSelect v-model="sortOrder" :disabled="!sortBy" aria-label="排序方向"
                    ><ElOption label="升序" value="asc" /><ElOption label="降序" value="desc"
                  /></ElSelect>
                </div>
              </ElPopover>
              <label class="manager-search"
                ><ElIcon><Search /></ElIcon
                ><input
                  v-model="searchText"
                  placeholder="搜索文章标题或正文"
                  aria-label="搜索文章"
                  @input="appliedSearch = searchText.trim()"
              /></label>
            </div>
          </div>
          <div class="article-tabs-row">
            <nav class="article-tabs" aria-label="文章分类">
              <button
                v-for="category in categoryFilterOptions"
                :key="category.value"
                type="button"
                class="article-tab"
                :class="{ 'is-active': !isRecycleBinMode && selectedCategoryId === category.value }"
                @click="selectCategory(category.value)"
              >
                {{ category.label }} <small>{{ category.count }}</small>
              </button>
              <button
                type="button"
                class="article-tab"
                :class="{ 'is-active': isRecycleBinMode }"
                @click="openRecycleBin"
              >
                回收站
              </button>
            </nav>
            <ElPopover placement="bottom-end" :width="300" trigger="click">
              <template #reference
                ><button
                  type="button"
                  class="article-filter-button"
                  :class="{ 'is-active': filterCount > 0 }"
                  aria-label="筛选文章"
                >
                  <ElIcon><Filter /></ElIcon><span>筛选</span
                  ><small v-if="filterCount">{{ filterCount }}</small>
                </button></template
              >
              <div class="article-filter-panel">
                <label>发布状态</label>
                <ElSelect v-model="selectedStatus" aria-label="筛选发布状态"
                  ><ElOption label="全部发布状态" value="" /><ElOption
                    label="未发布"
                    value="private" /><ElOption label="公开" value="public" /><ElOption
                    label="登录可见"
                    value="login_required" /><ElOption label="待更新发布" value="pending"
                /></ElSelect>
                <label>整理状态</label>
                <ElSelect v-model="selectedOrganizationState" aria-label="筛选整理状态"
                  ><ElOption label="全部整理状态" value="" /><ElOption
                    label="待整理"
                    value="inbox" /><ElOption label="已整理" value="organized" /><ElOption
                    label="已归档"
                    value="archived"
                /></ElSelect>
                <label>标签</label>
                <ElSelect v-model="selectedTagId" filterable aria-label="筛选标签"
                  ><ElOption label="全部标签" value="" /><ElOption
                    v-for="tag in tags"
                    :key="tag.id"
                    :label="tag.name"
                    :value="tag.id"
                /></ElSelect>
                <ElButton text @click="clearFilters">清除筛选</ElButton>
              </div>
            </ElPopover>
          </div>

          <div v-if="isTableViewMode || isRecycleBinMode" class="manager-table">
            <div class="manager-row manager-row-head">
              <button
                v-for="column in [
                  { value: 'title', label: '文章', class: '' },
                  { value: 'status', label: '状态', class: '' },
                  { value: 'category', label: '分类 / 标签', class: 'manager-tax' },
                  { value: 'word_count', label: '字数', class: 'manager-words' },
                  { value: 'last_edited_at', label: '最近编辑', class: 'manager-date' },
                ] as const"
                :key="column.value"
                type="button"
                class="manager-sort-heading"
                :class="column.class"
                @click="changeSort(column.value)"
              >
                {{ column.label
                }}<ElIcon
                  ><component
                    :is="
                      sortBy === column.value ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : Sort
                    "
                /></ElIcon></button
              ><span>操作</span>
            </div>
            <div v-for="article in articles" :key="article.id" class="manager-row">
              <div class="manager-title">
                <button
                  type="button"
                  :disabled="isRecycleBinMode"
                  @click="openArticlePreview(article)"
                >
                  {{ article.title || '未命名' }}</button
                ><small v-if="article.has_unpublished_changes && article.status !== 'private'"
                  >· 待更新</small
                >
              </div>
              <span class="manager-status"
                ><i :class="`manager-dot--${article.status}`" />{{
                  getStatusLabel(article.status)
                }}</span
              >
              <span class="manager-tax"
                >{{ article.category?.name || '未分类' }}
                <em v-for="tag in article.tags.slice(0, 2)" :key="tag.id">{{ tag.name }}</em></span
              >
              <span class="manager-words">{{ formatArticleWordCount(article.word_count) }}</span>
              <span class="manager-date">{{ getArticleEditDate(article) }}</span>
              <div class="manager-ops">
                <button
                  v-if="isRecycleBinMode"
                  type="button"
                  title="恢复"
                  aria-label="恢复"
                  @click="restoreArticle(article.id)"
                >
                  <ElIcon><RefreshLeft /></ElIcon>
                </button>
                <button
                  v-else
                  type="button"
                  title="编辑"
                  aria-label="编辑"
                  @click="router.push(resolve文章路径('/articles/edit', article.id))"
                >
                  <ElIcon><Edit /></ElIcon>
                </button>
                <ElDropdown
                  v-if="!isRecycleBinMode"
                  trigger="click"
                  @command="(action: string) => handleArticleAction(article, action)"
                >
                  <button type="button" title="更多" aria-label="更多">
                    <ElIcon><MoreFilled /></ElIcon>
                  </button>
                  <template #dropdown
                    ><ElDropdownMenu
                      ><ElDropdownItem command="inbox">待整理</ElDropdownItem
                      ><ElDropdownItem command="organized">已整理</ElDropdownItem
                      ><ElDropdownItem command="archived">归档</ElDropdownItem
                      ><ElDropdownItem command="todo">转待办</ElDropdownItem
                      ><ElDropdownItem command="material">转资料</ElDropdownItem
                      ><ElDropdownItem
                        v-for="item in article.converted_items"
                        :key="item.id"
                        :command="item.id"
                        >查看{{ item.target_type === 'todo' ? '待办' : '资料' }}</ElDropdownItem
                      ></ElDropdownMenu
                    ></template
                  >
                </ElDropdown>
                <ElPopconfirm
                  :title="
                    isRecycleBinMode
                      ? `确定永久删除文章《${article.title || '未命名'}》？`
                      : `确定将文章《${article.title || '未命名'}》移入回收站？`
                  "
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                  @confirm="deleteArticle(article.id)"
                >
                  <template #reference
                    ><button
                      type="button"
                      :title="isRecycleBinMode ? '彻底删除' : '移入回收站'"
                      :aria-label="isRecycleBinMode ? '彻底删除' : '移入回收站'"
                    >
                      <ElIcon><Delete /></ElIcon></button
                  ></template>
                </ElPopconfirm>
              </div>
            </div>
          </div>

          <div v-else-if="currentListMode === 'active-split'" class="article-split">
            <div ref="splitListRef" class="article-split-list">
              <button
                v-for="article in articles"
                :key="article.id"
                type="button"
                class="article-split-item"
                :class="{ 'is-active': selectedArticle?.id === article.id }"
                @click="selectArticle(article)"
              >
                <strong>{{ article.title }}</strong>
                <span>{{ article.excerpt || '暂无摘要' }}</span>
                <small
                  >{{ getStatusLabel(article.status) }} · {{ article.category?.name || '未分类' }} ·
                  {{ getArticlePublishDate(article) }}</small
                >
              </button>
              <div class="article-list-status">
                {{
                  loadingMore
                    ? '正在加载更多文章...'
                    : hasMoreArticles
                      ? '向下滚动加载更多'
                      : '已显示全部文章'
                }}
              </div>
            </div>
            <div v-if="selectedArticle" class="article-split-detail">
              <div class="article-detail-inner">
                <small class="article-detail-kicker"
                  ><ElIcon><Document /></ElIcon>文章预览</small
                >
                <h2>{{ selectedArticle.title }}</h2>
                <div class="article-split-meta">
                  <span class="manager-status"
                    ><i :class="`manager-dot--${selectedArticle.status}`" />{{
                      getStatusLabel(selectedArticle.status)
                    }}</span
                  >
                  <span>{{ selectedArticle.category?.name || '未分类' }}</span>
                  <span>{{ formatArticleWordCount(selectedArticle.word_count) }}</span>
                  <span>更新于 {{ getArticleEditDate(selectedArticle) }}</span>
                </div>
                <div class="article-detail-tags">
                  <span v-for="tag in selectedArticle.tags" :key="tag.id"># {{ tag.name }}</span>
                </div>
                <MarkdownRenderer
                  class="article-split-content"
                  :content="selectedArticle.content || selectedArticle.excerpt || '暂无正文'"
                />
                <div class="article-detail-actions">
                  <ElButton
                    class="article-action"
                    @click="router.push(resolve文章路径('/articles/edit', selectedArticle.id))"
                    ><ElIcon><Edit /></ElIcon><span>编辑文章</span></ElButton
                  >
                </div>
              </div>
            </div>
          </div>
          <div v-else class="manager-cards">
            <article v-for="article in articles" :key="article.id" class="manager-card">
              <span class="manager-status"
                ><i :class="`manager-dot--${article.status}`" />{{
                  article.has_unpublished_changes && article.status !== 'private'
                    ? '待更新发布'
                    : getStatusLabel(article.status)
                }}</span
              >
              <h3>
                <button
                  type="button"
                  @click="openArticlePreview(article)"
                >
                  {{ article.title || '未命名' }}
                </button>
              </h3>
              <p>{{ article.excerpt || '暂无摘要' }}</p>
              <footer>
                <span>{{ article.category?.name || '未分类' }}</span
                ><span>{{ formatArticleWordCount(article.word_count) }}</span
                ><span>{{ getArticlePublishDate(article) }}</span>
                <div class="manager-ops">
                  <button
                    type="button"
                    title="编辑"
                    aria-label="编辑"
                    @click="router.push(resolve文章路径('/articles/edit', article.id))"
                  >
                    <ElIcon><Edit /></ElIcon>
                  </button>
                  <ElDropdown
                    trigger="click"
                    @command="(action: string) => handleArticleAction(article, action)"
                    ><button type="button" title="更多" aria-label="更多">
                      <ElIcon><MoreFilled /></ElIcon></button
                    ><template #dropdown
                      ><ElDropdownMenu
                        ><ElDropdownItem command="inbox">待整理</ElDropdownItem
                        ><ElDropdownItem command="organized">已整理</ElDropdownItem
                        ><ElDropdownItem command="archived">归档</ElDropdownItem
                        ><ElDropdownItem command="todo">转待办</ElDropdownItem
                        ><ElDropdownItem command="material">转资料</ElDropdownItem
                        ><ElDropdownItem
                          v-for="item in article.converted_items"
                          :key="item.id"
                          :command="item.id"
                          >查看{{ item.target_type === 'todo' ? '待办' : '资料' }}</ElDropdownItem
                        ></ElDropdownMenu
                      ></template
                    ></ElDropdown
                  >
                  <ElPopconfirm
                    :title="`确定将文章《${article.title || '未命名'}》移入回收站？`"
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                    @confirm="deleteArticle(article.id)"
                    ><template #reference
                      ><button type="button" title="移入回收站" aria-label="移入回收站">
                        <ElIcon><Delete /></ElIcon></button></template
                  ></ElPopconfirm>
                </div>
              </footer>
            </article>
          </div>

          <ElEmpty v-if="isArticleListEmpty" :description="emptyDescription" />

          <div v-if="loadingMore && currentListMode !== 'active-split'" class="article-list-status">
            正在加载更早的文章...
          </div>
          <div
            v-else-if="
              articles.length > 0 && !hasMoreArticles && currentListMode !== 'active-split'
            "
            class="article-list-status article-list-status--end"
          >
            已显示全部文章
          </div>
        </div>
      </ElSkeleton>
    </section>

    <BaseDialog v-model="showQuickDialog" title="快速记录" width="480px" style="max-width: 94vw">
      <div class="article-filter-panel">
        <ElInput
          v-model="quickContent"
          type="textarea"
          :rows="6"
          placeholder="快速记录想法或信息"
          maxlength="20000"
        /><ElButton
          type="primary"
          :loading="quickSaving"
          :disabled="!quickContent.trim()"
          @click="saveQuickArticle"
          >存入待整理</ElButton
        >
      </div>
    </BaseDialog>

    <BaseDialog
      v-model="showConvertDialog"
      :title="convertTarget === 'todo' ? '生成待办' : '生成资料'"
      width="520px"
      style="max-width: 94vw"
    >
      <div class="article-convert-form">
        <ElInput v-model="convertTitle" maxlength="300" placeholder="标题" />
        <ElSelect
          v-if="convertTarget === 'material'"
          v-model="convertMaterialType"
          aria-label="资料类型"
          ><ElOption label="文本" value="text" /><ElOption label="链接" value="link"
        /></ElSelect>
        <ElInput
          v-model="convertContent"
          type="textarea"
          :rows="8"
          :placeholder="
            convertTarget === 'material' && convertMaterialType === 'link' ? '链接地址' : '内容'
          "
        />
        <ElInput
          v-if="convertTarget === 'material'"
          v-model="convertNote"
          type="textarea"
          :rows="2"
          placeholder="备注"
        />
        <div class="article-convert-actions">
          <ElButton @click="showConvertDialog = false">取消</ElButton>
          <ElButton type="primary" :loading="converting" @click="submitConversion">创建</ElButton>
        </div>
      </div>
    </BaseDialog>

    <BaseDialog v-model="showTransferDialog" title="文章备份" width="460px" style="max-width: 90vw">
      <div class="article-transfer-dialog">
        <div class="article-transfer-tip">
          长按“写文章”可打开此弹窗。系统会自动拉取当前账号下的全部文章详情，并导出为 JSON
          文件，包含正文、摘要、封面、可见性、分类、标签与时间信息。
        </div>
        <div class="article-transfer-count">当前可备份 {{ exportArticleTotal }} 篇文章</div>
        <ElButton
          class="article-transfer-action"
          type="primary"
          plain
          :loading="exportingArticles"
          @click="exportArticles"
        >
          <span class="article-transfer-action-content">
            <span class="article-transfer-action-head">
              <ElIcon><Download /></ElIcon>
              <span class="article-transfer-action-label">完整备份</span>
            </span>
            <span class="article-transfer-action-desc"
              >导出当前用户的全部文章详情为 JSON 文件，适合本地长期留档</span
            >
          </span>
        </ElButton>
        <div class="article-transfer-note">
          当前版本先提供导出备份，确保你能把所有文章正文完整留在本地。
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

<style scoped>
@import '@feathernest/ui/styles/media.css';

.page-container {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
}

.page-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

.create-button-wrapper {
  display: flex;
  flex: 0 0 auto;
}

.article-mode-nav {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.article-mode-nav__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 68px;
  height: 30px;
  padding: 0 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  transition:
    background-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
  white-space: nowrap;
}

.article-mode-nav__item:hover {
  color: var(--el-color-primary);
}

.article-mode-nav__item.is-active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.article-card {
  border-radius: 8px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-quick-entry,
.article-filters,
.article-derived,
.article-convert-form {
  display: flex;
  gap: 8px;
}

.article-quick-entry {
  align-items: flex-end;
}
.article-quick-entry .el-textarea {
  flex: 1;
}
.article-filters {
  align-items: center;
}
.article-state-filter {
  width: 160px;
  flex: none;
}
.article-search {
  max-width: 420px;
}
.article-derived {
  align-items: center;
  margin-bottom: 10px;
}
.article-convert-form {
  flex-direction: column;
}
.article-convert-actions {
  display: flex;
  justify-content: flex-end;
}

.article-tabs {
  margin-bottom: 4px;
}

.article-table-wrapper {
  width: 100%;
}

.article-table {
  width: 100%;
}

.article-table-title-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.article-table-cover {
  width: 72px;
  height: 48px;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.article-table-cover :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-table-title-meta {
  min-width: 0;
}

.article-table-title {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-table-excerpt {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-table-placeholder {
  color: var(--el-text-color-placeholder);
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.article-card-inner {
  position: relative;
}

.article-actions {
  margin-left: auto;
}

.article-cover {
  margin-bottom: 12px;
}

.article-cover img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.article-title {
  margin: 0;
  font-size: 20px;
  line-height: 1.4;
}

.article-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.article-status-tag {
  flex: 0 0 auto;
}

.article-excerpt {
  margin: 0 0 12px;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.article-meta-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.article-meta-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #999;
  font-size: 12px;
}

.article-load-trigger {
  height: 1px;
}

.article-list-status {
  padding: 4px 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  text-align: center;
}

.article-list-status--end {
  color: var(--el-text-color-placeholder);
}

.article-transfer-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.article-transfer-tip,
.article-transfer-note {
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.7;
}

.article-transfer-count {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.article-transfer-action {
  height: auto;
  min-height: 132px;
  margin-left: 0;
  padding: 18px 16px;
  justify-content: flex-start;
  white-space: normal;
  text-align: left;
}

.article-transfer-action:hover,
.article-transfer-action:focus-visible {
  transform: translateY(-1px);
}

.article-transfer-action-content {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.article-transfer-action-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.article-transfer-action-head .el-icon {
  font-size: 16px;
}

.article-transfer-action-label {
  font-size: 15px;
  font-weight: 600;
}

.article-transfer-action-desc {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

/* 文章管理页面使用独立的颜色和组件样式，避免受其他模块样式影响。 */
.article-page {
  --article-ink: #171717;
  --article-muted: #8a8a8a;
  --article-line: #e8e8e8;
  color: var(--article-ink);
  font-size: 13px;
}

.article-page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}
.article-page-head h1 {
  margin: 0;
  color: var(--article-ink);
  font-size: 21px;
  font-weight: 600;
  line-height: 1.3;
}
.article-page-head p {
  margin: 6px 0 0;
  color: var(--article-muted);
  font-size: 12px;
}
.article-back {
  margin: 0 0 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--article-muted);
  cursor: pointer;
}
.article-page :deep(.el-button) {
  border-radius: 5px;
  font-size: 12px;
}
.article-page :deep(.el-button--primary) {
  --el-button-bg-color: #171717;
  --el-button-border-color: #171717;
  --el-button-hover-bg-color: #333;
  --el-button-hover-border-color: #333;
}
.article-list {
  gap: 0;
}
.article-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}
.article-mode-nav {
  gap: 2px;
  padding: 2px;
  border-color: var(--article-line);
  border-radius: 6px;
  background: #fff;
}
.article-mode-nav__item {
  min-width: 58px;
  height: 26px;
  border-radius: 4px;
  color: var(--article-muted);
  font-size: 12px;
}
.article-mode-nav__item:hover {
  color: var(--article-ink);
}
.article-mode-nav__item.is-active {
  background: #f0f0f0;
  color: var(--article-ink);
  box-shadow: none;
}
.article-filters {
  margin-left: auto;
}
.article-search {
  width: 260px;
}
.article-quick-entry {
  margin-top: 16px;
}
.article-tabs {
  margin: 20px 0 2px;
}
.article-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.article-table :deep(th.el-table__cell) {
  height: 34px;
  padding: 0;
  background: #fff;
  color: #a3a3a3;
  font-size: 11px;
  font-weight: 400;
}
.article-table :deep(td.el-table__cell) {
  height: 50px;
  padding: 6px 0;
  border-bottom-color: #f0f0f0;
}
.article-table :deep(.el-table__row:hover > td.el-table__cell) {
  background: #fafafa;
}
.article-table-title {
  color: var(--article-ink);
  font-size: 13px;
  font-weight: 500;
}
.article-table-excerpt {
  color: var(--article-muted);
  font-size: 11px;
}
.article-table-cover {
  width: 48px;
  height: 34px;
  border-radius: 4px;
}
.article-table :deep(.el-tag) {
  border: 0;
  background: transparent;
  color: #525252;
}
.article-table :deep(.el-button.is-link) {
  color: #737373;
}
.article-table :deep(.el-button.is-link:hover) {
  color: #171717;
}
.article-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(272px, 100%), 1fr));
  gap: 12px;
  margin-top: 18px;
}
.article-card {
  border: 1px solid var(--article-line);
  border-radius: 7px;
  box-shadow: none;
}
.article-card:hover {
  transform: none;
  border-color: #c9c9c9;
  box-shadow: none;
}
.article-card :deep(.el-card__body) {
  padding: 15px 16px 13px;
}
.article-title {
  color: var(--article-ink);
  font-size: 13.5px;
  font-weight: 500;
}
.article-excerpt {
  margin: 6px 0 12px;
  color: var(--article-muted);
  font-size: 11.5px;
  line-height: 1.7;
}
.article-meta {
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}
.article-cover img {
  height: 140px;
  border-radius: 4px;
}
.article-card :deep(.el-tag) {
  border: 0;
  background: transparent;
  color: #737373;
}
.article-split {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 2px;
}
.article-split-list {
  flex: 0 0 336px;
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-right: 1px solid var(--article-line);
}
.article-split-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  padding: 13px 16px;
  border: 0;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  text-align: left;
  cursor: pointer;
}
.article-split-item:hover {
  background: #fafafa;
}
.article-split-item.is-active {
  background: #f4f4f4;
}
.article-split-item strong,
.article-split-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.article-split-item strong {
  font-size: 12.5px;
  font-weight: 500;
}
.article-split-item span,
.article-split-item small {
  color: var(--article-muted);
  font-size: 11px;
}
.article-split-detail {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.article-detail-inner {
  max-width: 680px;
  margin: 0 auto;
  padding: 32px 40px 56px;
}
.article-split-detail > small,
.article-split-meta {
  color: var(--article-muted);
  font-size: 11px;
}
.article-split-detail h2 {
  margin: 12px 0;
  font-size: 24px;
}
.article-split-content {
  margin: 24px 0 0;
  padding-top: 24px;
  border-top: 1px solid var(--article-line);
  color: var(--article-ink);
  font-size: 14px;
  line-height: 1.95;
  overflow-wrap: anywhere;
}

.article-manager {
  --manager-bg: var(--el-bg-color, #fff);
  --manager-ink: var(--el-text-color-primary, #171717);
  --manager-muted: var(--el-text-color-secondary, #8a8a8a);
  --manager-line: var(--el-border-color-lighter, #e8e8e8);
  --manager-hover: var(--el-fill-color-light, #fafafa);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  padding: 26px 24px 48px;
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
.article-manager .article-page,
.article-manager :deep(.el-skeleton) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
.article-manager .article-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.article-manager .article-list,
.article-manager .article-split-list,
.article-manager .article-split-detail {
  scrollbar-width: thin;
  scrollbar-color: #d4d4d4 transparent;
}
.article-manager .article-list::-webkit-scrollbar,
.article-manager .article-split-list::-webkit-scrollbar,
.article-manager .article-split-detail::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}
.article-manager .article-list::-webkit-scrollbar-track,
.article-manager .article-split-list::-webkit-scrollbar-track,
.article-manager .article-split-detail::-webkit-scrollbar-track {
  background: transparent;
}
.article-manager .article-list::-webkit-scrollbar-thumb,
.article-manager .article-split-list::-webkit-scrollbar-thumb,
.article-manager .article-split-detail::-webkit-scrollbar-thumb {
  border: 3px solid transparent;
  border-radius: 99px;
  background-clip: content-box;
  background-color: #d4d4d4;
}
.article-manager *,
.article-manager *::before,
.article-manager *::after {
  box-sizing: border-box;
}
.article-manager .article-page {
  --article-ink: var(--manager-ink);
  --article-muted: var(--manager-muted);
  --article-line: var(--manager-line);
  color: var(--manager-ink);
}
.article-manager .article-page-head h1 {
  color: var(--manager-ink);
}
.article-manager .article-page :deep(.el-button--primary) {
  --el-button-bg-color: var(--el-color-primary);
  --el-button-border-color: var(--el-color-primary);
  --el-button-hover-bg-color: var(--el-color-primary-light-3);
  --el-button-hover-border-color: var(--el-color-primary-light-3);
}
.article-manager .article-mode-nav {
  background: var(--manager-bg);
  border-color: var(--manager-line);
}
.article-manager .article-mode-nav__item {
  color: var(--manager-muted);
}
.article-manager .article-mode-nav__item.is-active {
  color: var(--manager-ink);
  background: var(--manager-hover);
}
.article-manager .manager-search {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 250px;
  height: 30px;
  padding: 0 9px;
  border: 1px solid var(--manager-line);
  border-radius: 5px;
  color: var(--manager-muted);
}
.article-manager .manager-search:focus-within {
  border-color: var(--el-color-primary);
}
.article-manager .manager-search input {
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
.article-manager .article-tabs-row {
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin-top: 20px;
  border-bottom: 1px solid var(--manager-line);
}
.article-manager .article-tabs {
  display: flex;
  flex: 1;
  gap: 22px;
  min-width: 0;
  margin: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  overscroll-behavior-x: contain;
}
.article-manager .article-tabs::-webkit-scrollbar {
  height: 0;
}
.article-manager .article-tab {
  position: relative;
  flex: none;
  height: 34px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--manager-muted);
  font: inherit;
  font-size: 12.5px;
  white-space: nowrap;
  cursor: pointer;
}
.article-manager .article-tab.is-active {
  color: var(--manager-ink);
  font-weight: 500;
}
.article-manager .article-tab.is-active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--el-color-primary);
  content: '';
}
.article-manager .article-tab small {
  margin-left: 4px;
  color: var(--manager-muted);
  font-size: 10.5px;
}
.article-manager .manager-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px 200px 64px 150px 80px;
  align-items: center;
  gap: 16px;
  min-height: 50px;
  border-bottom: 1px solid var(--manager-line);
}
.article-manager .manager-row:not(.manager-row-head):hover {
  background: var(--manager-hover);
}
.article-manager .manager-row-head {
  min-height: 34px;
  color: var(--manager-muted);
  font-size: 11px;
}
.article-manager .manager-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.article-manager .manager-title button,
.article-manager .manager-card h3 button {
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
.article-manager .manager-title button:hover,
.article-manager .manager-card h3 button:hover {
  text-decoration: underline;
}
.article-manager .manager-title small,
.article-manager .manager-tax em {
  color: var(--manager-muted);
  font-size: 11px;
  font-style: normal;
  white-space: nowrap;
}
.article-manager .manager-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--manager-ink);
  font-size: 12px;
  white-space: nowrap;
}
.article-manager .manager-status i {
  width: 5px;
  height: 5px;
  flex: none;
  border-radius: 50%;
  background: #aaa;
}
.article-manager .manager-status i.manager-dot--public {
  background: #3f9c6d;
}
.article-manager .manager-status i.manager-dot--login_required {
  background: #c08a3e;
}
.article-manager .manager-tax {
  overflow: hidden;
  color: var(--manager-muted);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.article-manager .manager-tax em {
  margin-left: 8px;
}
.article-manager .manager-words,
.article-manager .manager-date {
  color: var(--manager-muted);
  font-family: inherit;
  font-size: 12.5px;
  line-height: 1.5;
  white-space: nowrap;
}
.article-manager .manager-ops {
  display: flex;
  justify-content: flex-end;
  gap: 1px;
  margin-left: auto;
}
.article-manager .manager-ops button {
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
.article-manager .manager-ops button:hover {
  background: var(--manager-hover);
  color: var(--el-color-primary);
}
.article-manager .manager-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(272px, 100%), 1fr));
  gap: 12px;
  margin-top: 18px;
}
.article-manager .manager-card {
  min-width: 0;
  padding: 15px 16px 13px;
  border: 1px solid var(--manager-line);
  border-radius: 7px;
  background: var(--manager-bg);
}
.article-manager .manager-card:hover {
  border-color: var(--el-color-primary);
}
.article-manager .manager-card h3 {
  margin: 9px 0 0;
  font-size: 13.5px;
  line-height: 1.5;
}
.article-manager .manager-card h3 button {
  display: block;
  max-width: 100%;
  margin: 0;
  text-indent: 0;
}
.article-manager .manager-card p {
  display: -webkit-box;
  overflow: hidden;
  min-height: 39px;
  margin: 6px 0 0;
  color: var(--manager-muted);
  font-size: 11.5px;
  line-height: 1.7;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.article-manager .manager-card footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--manager-line);
  color: var(--manager-muted);
  font-size: 11px;
  white-space: nowrap;
}
.article-manager .manager-card footer > span {
  flex: none;
}
.article-manager .manager-card footer > span:first-child {
  flex: 0 1 auto;
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
}
.article-manager .manager-card footer .manager-ops {
  flex: none;
}
.article-manager .article-split-list {
  border-color: var(--manager-line);
}
.article-manager .article-split-item {
  background: var(--manager-bg);
  color: var(--manager-ink);
  border-color: var(--manager-line);
}
.article-manager .article-split-item:hover,
.article-manager .article-split-item.is-active {
  background: var(--manager-hover);
}
.article-manager .article-split-content {
  color: var(--manager-ink);
}

.article-action :deep(> span) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.article-action .el-icon {
  font-size: 15px;
}
.article-action--create .el-icon {
  font-size: 16px;
}
.article-manager .article-action--create {
  font-size: 12px;
}
.article-action :deep(.el-icon + span) {
  margin-left: 0;
}
.article-filter-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.article-filter-panel label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.article-filter-button,
.article-sort-control,
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
.article-filter-button {
  flex: none;
  align-self: center;
  height: 30px;
  padding: 0 9px;
  border: 1px solid var(--manager-line);
  border-radius: 5px;
  font-size: 12px;
}
.article-filter-button.is-active,
.article-filter-button:hover,
.article-sort-control:hover {
  color: var(--manager-ink);
  border-color: var(--el-color-primary);
}
.article-filter-button small {
  padding: 0 4px;
  border-radius: 3px;
  background: var(--manager-hover);
}
.article-sort-control {
  height: 30px;
  padding: 0 6px;
  font-size: 12px;
  white-space: nowrap;
}
.manager-sort-heading {
  justify-content: flex-start;
  padding: 0;
  font-size: 11px;
  text-align: left;
}
.manager-sort-heading:hover {
  color: var(--manager-ink);
}
.manager-sort-heading .el-icon {
  flex: none;
  font-size: 12px;
}
.article-manager.is-split {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 0;
}
.article-manager.is-split .article-page,
.article-manager.is-split :deep(.el-skeleton) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
.article-manager.is-split .article-list {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.article-manager.is-split .article-page-head,
.article-manager.is-split .article-toolbar,
.article-manager.is-split .article-tabs-row {
  flex: none;
}
.article-manager.is-split .article-tabs-row {
  margin-top: 8px;
}
.article-detail-kicker {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--manager-muted);
  font-size: 11px;
}
.article-split-meta {
  display: flex;
  align-items: center;
  gap: 8px 0;
  flex-wrap: wrap;
}
.article-split-meta > span + span::before {
  margin: 0 10px;
  color: var(--manager-line);
  content: '|';
}
.article-detail-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.article-detail-tags span {
  padding: 2px 7px;
  border: 1px solid var(--manager-line);
  border-radius: 4px;
  color: var(--manager-muted);
  font-size: 11px;
}
.article-detail-actions {
  margin-top: 32px;
  padding-top: 18px;
  border-top: 1px solid var(--manager-line);
}
.article-split-item {
  font: inherit;
}
.article-split-item span {
  display: -webkit-box;
  white-space: normal;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.7;
}
.article-split-item strong {
  max-width: 100%;
}
.article-split-list,
.article-split-detail {
  scrollbar-width: thin;
}

@media (max-width: 900px) {
  .article-manager .manager-row {
    grid-template-columns: minmax(0, 1fr) 82px 80px;
    gap: 8px;
  }
  .article-manager .manager-tax,
  .article-manager .manager-words,
  .article-manager .manager-date {
    display: none;
  }
}

@media (--mobile-viewport) {
  .article-page-head {
    flex-wrap: wrap;
  }
  .article-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .article-filters {
    margin-left: 0;
  }
  .article-split {
    flex-direction: column;
  }
  .article-split-list {
    flex-basis: auto;
    flex: 1;
    max-height: none;
    overflow-y: auto;
    border-right: 0;
    border-bottom: 1px solid var(--article-line);
  }
  .article-split-detail {
    display: none;
  }
  .article-manager {
    padding: 20px 16px 32px;
  }
  .article-manager .manager-search {
    flex: 1;
    width: auto;
    min-width: 120px;
  }
  .article-manager .article-tabs {
    gap: 18px;
  }
  .article-quick-entry {
    align-items: stretch;
    flex-direction: column;
  }
  .article-filters {
    flex-wrap: wrap;
  }
  .article-search {
    max-width: none;
    width: 100%;
  }
  .page-container {
    padding: 16px;
  }

  .page-container :deep(.page-header-shell__header) {
    flex-direction: column;
    align-items: stretch;
  }

  .page-actions {
    justify-content: stretch;
    flex-wrap: wrap;
  }

  .article-mode-nav {
    width: 100%;
  }

  .article-mode-nav__item {
    flex: 1 1 0;
    min-width: 0;
  }

  .create-button-wrapper {
    flex: 1 1 0;
  }

  .page-actions :deep(.el-button) {
    flex: 1 1 0;
  }

  .article-card-inner {
    padding-top: 0;
  }

  .article-header {
    flex-wrap: wrap;
  }

  .article-table-wrapper {
    max-width: 100%;
    overflow-x: hidden;
  }

  .article-table-title-cell {
    gap: 8px;
  }

  .article-table-cover {
    width: 48px;
    height: 36px;
  }

  .article-table-title {
    font-size: 13px;
  }

  .article-table-excerpt {
    display: none;
  }

  .article-table :deep(.el-table__cell) {
    padding: 8px 0;
  }

  .article-table :deep(.el-button) {
    padding: 0 4px;
  }
}
</style>
