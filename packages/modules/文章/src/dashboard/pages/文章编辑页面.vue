<script setup lang="ts">
import { Delete, DocumentAdd, EditPen, MagicStick, Select } from '@element-plus/icons-vue'
import api, { 获取API错误消息 } from '@feathernest/api'
import { PageSectionShell } from '@feathernest/ui'
import {
  ElButton,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSkeleton,
  ElSpace,
  ElTag,
} from 'element-plus'
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import {
  AI润色文章正文,
  上传文章图片,
  创建分类,
  创建文章,
  创建文章草稿,
  创建标签,
  删除文章,
  更新文章,
  根据ID获取我的文章,
  生成文章AI元信息建议,
  获取文章图片,
} from '../../api'
import MarkdownRenderer from '../../components/Markdown渲染器.vue'
import {
  大纲图标 as OutlineIcon,
  属性图标 as PropertiesIcon,
} from '../../components/MilkdownMarkdown工具栏/MilkdownMarkdown工具栏图标'
import type {
  MilkdownMarkdownImagePayload,
  MilkdownMarkdown编辑器实例,
} from '../../components/MilkdownMarkdown编辑器.vue'
import MilkdownMarkdownEditor from '../../components/MilkdownMarkdown编辑器.vue'
import { 删除文件 as 删除管理文件 } from '../../files-api'
import { 解析管理文件URL地址 } from '../../managedFile'
import { renderArticleMarkdown } from '../../markdown'
import { 使用文章分类存储 } from '../../taxonomy'
import { 使用文章主题状态 } from '../../theme'
import { 从Markdown首行提取文章标题 } from '../../title'
import type {
  ArticleAIContentPolishResult,
  ArticleAIMetadataSuggestion,
  ArticleAIRequestPayload,
  ArticleDraftPayload,
  ArticleEditorPayload,
  ArticleImageRecord,
  ArticleRecord,
  ArticleUpdatePayload,
} from '../../types'
import { 使用保存快捷键 } from '../../使用保存快捷键'
import { 使用视口 } from '../../使用视口'
import ArticleImagePanel from '../components/文章图片面板.vue'
import { 使用编辑器快捷键 } from '../composables/使用编辑器快捷键'
import { 下载文章Markdown } from '../文章Markdown导出'

const props = withDefaults(
  defineProps<{
    showBack?: boolean
    backTo?: string
    embedded?: boolean
    split?: boolean
    splitEdit?: boolean
    articleId?: string
  }>(),
  {
    showBack: false,
    backTo: '/articles',
    embedded: false,
    split: false,
    articleId: '',
  },
)

const emit = defineEmits<{
  close: []
  saved: [article: ArticleRecord]
  deleted: [id: string]
}>()

const route = useRoute()
const router = useRouter()
const themeStore = 使用文章主题状态()
const articleTaxonomyStore = 使用文章分类存储()
const 路由前缀 = computed(() => (route.path.startsWith('/admin') ? '/admin' : ''))

const MarkdownMindmap = defineAsyncComponent(() => import('../../components/Markdown思维导图.vue'))

const currentArticleId = ref('')
const isEdit = computed(() => currentArticleId.value.length > 0)
const loading = ref(false)
const saving = ref(false)
const loadFailed = ref(false)
const saveFailed = ref(false)
const propertiesVisible = ref(true)
const exporting = ref(false)
const visibility = ref<'private' | 'public' | 'login_required'>('private')
const savedVisibility = ref(visibility.value)
const visibilityOptions = [
  { value: 'public', label: '公开' },
  { value: 'login_required', label: '登录可见' },
  { value: 'private', label: '私有' },
] as const
let autoSaveTimer: ReturnType<typeof setTimeout> | undefined
let pendingSave: Promise<boolean> | null = null
const saveStateText = computed(() =>
  loadFailed.value
    ? '加载失败'
    : saveFailed.value
      ? '保存失败，点击重试'
      : saving.value
        ? '保存中…'
        : isDirty.value
          ? '未保存'
          : currentArticleId.value
            ? '已保存'
            : '尚未保存',
)
const deletingArticle = ref(false)
const formatting = ref(false)
const uploadingImageCount = ref(0)
// 控制台多标签：本页被 KeepAlive 保留时，失活期间不应跟随全局路由重建表单
const 页面是否激活 = ref(true)
const 页面路由名称 = String(route.name ?? '')
const 本页路由路径 = ref(route.path)
const editorId = 'article-editor'
const editorRef = ref<MilkdownMarkdown编辑器实例>()
const editorWrapperRef = ref<globalThis.HTMLDivElement | null>(null)
const outlineListRef = ref<globalThis.HTMLDivElement | null>(null)
const outlineIndicatorRef = ref<globalThis.HTMLDivElement | null>(null)
const markdownOverlayRef = ref<globalThis.HTMLDivElement | null>(null)
const htmlOverlayRef = ref<globalThis.HTMLDivElement | null>(null)
const editorTheme = computed(() => (themeStore.isDark.value ? 'dark' : 'light'))
const isUploadingImages = computed(() => uploadingImageCount.value > 0)
const { isMobileViewport } = 使用视口()
type 预览类型 = 'preview' | 'html' | 'mindmap'
type 预览布局模式 = 'hidden' | 'split' | 'full'

const previewType = ref<预览类型>('preview')
const previewLayoutMode = ref<预览布局模式>('hidden')
const scrollSyncEnabled = ref(true)
const isMarkdownPreviewVisible = computed(
  () => previewType.value === 'preview' && previewLayoutMode.value !== 'hidden',
)
const isMarkdownSplitVisible = computed(
  () => previewType.value === 'preview' && previewLayoutMode.value === 'split',
)
const isMarkdownFullVisible = computed(
  () => previewType.value === 'preview' && previewLayoutMode.value === 'full',
)
const isHtmlPreviewVisible = computed(
  () => previewType.value === 'html' && previewLayoutMode.value !== 'hidden',
)
const isHtmlSplitVisible = computed(
  () => previewType.value === 'html' && previewLayoutMode.value === 'split',
)
const isHtmlFullVisible = computed(
  () => previewType.value === 'html' && previewLayoutMode.value === 'full',
)
const isMindmapPreviewVisible = computed(
  () => previewType.value === 'mindmap' && previewLayoutMode.value !== 'hidden',
)
const isMindmapSplitVisible = computed(
  () => previewType.value === 'mindmap' && previewLayoutMode.value === 'split',
)
const isMindmapFullVisible = computed(
  () => previewType.value === 'mindmap' && previewLayoutMode.value === 'full',
)
const previewEnabled = computed({
  get: () => previewLayoutMode.value !== 'hidden',
  set: (enabled: boolean) => {
    previewLayoutMode.value = enabled ? 'split' : 'hidden'
  },
})
const activePreviewLayoutMode = computed<'split' | 'full'>({
  get: () => (previewLayoutMode.value === 'full' ? 'full' : 'split'),
  set: (mode) => {
    previewLayoutMode.value = mode
  },
})
const outlineVisible = ref(props.embedded)
const 编辑器内容区顶部偏移 = ref(0)
const 编辑器工具栏底部偏移 = ref(0)
const 编辑器内容区底部偏移 = ref(0)
const 编辑器内容区覆盖样式 = computed(() => ({
  '--editor-content-top-offset': `${编辑器内容区顶部偏移.value}px`,
  '--editor-preview-top-offset': `${编辑器工具栏底部偏移.value}px`,
  '--editor-content-bottom-offset': `${编辑器内容区底部偏移.value}px`,
}))
let 编辑器尺寸观察器: globalThis.ResizeObserver | null = null
let 滚动同步清理列表: Array<() => void> = []
let 滚动同步帧 = 0
let 滚动同步初始化帧 = 0
let 大纲活动监听清理: (() => void) | null = null
let 大纲活动更新帧 = 0
let 大纲活动滚动计时器 = 0
let 当前滚动同步来源: 'editor' | 'preview' | null = null
let 文章加载序号 = 0
let 文章图片加载序号 = 0
const 站内文件链接正则 = /(https?:\/\/[^\s"'<>)]*\/files\/[^\s"'<>)]*|\/files\/[^\s"'<>)]*)/g

interface SelectOption {
  label: string
  value: string
}

interface 文章大纲项 {
  id: string
  index: number
  level: number
  line: number
  text: string
}

const form = ref<ArticleEditorPayload>(buildEmptyForm())
const savedForm = ref<ArticleEditorPayload>(cloneFormPayload(form.value))
const articleImages = ref<ArticleImageRecord[]>([])
const articleImagesLoading = ref(false)
const deletingArticleImages = ref(false)
const selectedUnusedArticleImageIds = ref<string[]>([])
const articleImagePanelExpanded = ref(false)
const aiDrawerVisible = ref(false)
const aiLoading = ref(false)
const aiMetadataSuggestion = ref<ArticleAIMetadataSuggestion | null>(null)
const aiPolishResult = ref<ArticleAIContentPolishResult | null>(null)
const aiStatusMessage = ref('')

const categories = ref<SelectOption[]>([])
const tags = ref<SelectOption[]>([])
const isDirty = computed(
  () =>
    buildFormSnapshot(form.value) !== buildFormSnapshot(savedForm.value) ||
    visibility.value !== savedVisibility.value,
)
const 已使用文章图片路径集合 = computed(() =>
  收集已使用文章图片路径(form.value.content, form.value.cover_url),
)
const 文章图片列表项 = computed(() =>
  articleImages.value.map((image) => {
    const 图片路径 = 规范化站内文件路径(image.url)
    return {
      ...image,
      isUsed:
        image.used_by_publication ||
        (图片路径 !== null && 已使用文章图片路径集合.value.has(图片路径)),
    }
  }),
)
const 未使用文章图片列表 = computed(() => 文章图片列表项.value.filter((image) => !image.isUsed))
const 已使用文章图片数量 = computed(
  () => 文章图片列表项.value.length - 未使用文章图片列表.value.length,
)
const htmlPreviewContent = computed(() => renderArticleMarkdown(form.value.content).html)
const 文章大纲列表 = computed(() => 提取Markdown大纲(form.value.content))
const 当前可见大纲序号集合 = ref<Set<number>>(new Set())
const 文章图片桌面摘要 = computed(
  () =>
    `共 ${文章图片列表项.value.length} 张，已使用 ${已使用文章图片数量.value} 张，未使用 ${未使用文章图片列表.value.length} 张`,
)
const 文章图片移动端摘要 = computed(() =>
  未使用文章图片列表.value.length > 0
    ? `共 ${文章图片列表项.value.length} 张，未使用 ${未使用文章图片列表.value.length} 张`
    : `共 ${文章图片列表项.value.length} 张`,
)
const 已有分类名称列表 = computed(() => categories.value.map((item) => item.label))
const 已有标签名称列表 = computed(() => tags.value.map((item) => item.label))
const AI建议分类已存在 = computed(() => {
  const categoryName = aiMetadataSuggestion.value?.category_name?.trim()
  return Boolean(categoryName && categories.value.some((item) => item.label === categoryName))
})
const AI建议新标签列表 = computed(() => {
  const suggestion = aiMetadataSuggestion.value
  if (!suggestion) {
    return []
  }
  const existingNames = new Set(tags.value.map((item) => item.label))
  return suggestion.tag_names.filter((name) => !existingNames.has(name))
})

interface SaveArticleOptions {
  redirectAfterSave: boolean
  syncRouteAfterSave?: boolean
}

使用保存快捷键({
  enabled: () =>
    页面是否激活.value &&
    !loading.value &&
    !saving.value &&
    !formatting.value &&
    !isUploadingImages.value,
  onSave: () => {
    if (!isDirty.value) {
      ElMessage.info('没有可保存的更改')
      return
    }

    return saveArticle({ redirectAfterSave: false, syncRouteAfterSave: true })
  },
})

使用编辑器快捷键({
  editorRoot: editorWrapperRef,
  editorId,
  enabled: () =>
    页面是否激活.value &&
    !loading.value &&
    !saving.value &&
    !formatting.value &&
    !isUploadingImages.value,
  onFormatAndSave: formatAndSaveArticle,
  onRedo: () => editorRef.value?.redo(),
})

function getRouteArticleId(): string {
  if (props.embedded) return props.articleId
  const routeArticleId = route.params.id

  if (typeof routeArticleId === 'string') {
    return routeArticleId
  }

  if (Array.isArray(routeArticleId)) {
    return routeArticleId[0] ?? ''
  }

  return ''
}

async function loadEditorOptions() {
  await articleTaxonomyStore.ensureLoaded(false, 'all')
  const categoryRecords = articleTaxonomyStore.categories
  const tagRecords = articleTaxonomyStore.tags
  categories.value = categoryRecords.map((category) => ({
    label: category.name,
    value: category.id,
  }))
  tags.value = tagRecords.map((tag) => ({ label: tag.name, value: tag.id }))
}

async function handleCreateCategory() {
  try {
    const { value } = await ElMessageBox.prompt('请输入新分类名称', '新增分类', {
      confirmButtonText: '创建',
      cancelButtonText: '取消',
      inputPattern: /^\S.{0,98}$/,
      inputErrorMessage: '分类名称不能为空且最多 100 个字符',
    })
    const category = await 创建分类(value.trim())
    articleTaxonomyStore.upsertCategory(category)
    categories.value.push({ label: category.name, value: category.id })
    form.value.category_id = category.id
    ElMessage.success('分类创建成功')
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(获取API错误消息(error, '创建分类失败'))
  }
}

async function handleCreateTag() {
  try {
    const { value } = await ElMessageBox.prompt('请输入新标签名称', '新增标签', {
      confirmButtonText: '创建',
      cancelButtonText: '取消',
      inputPattern: /^\S.{0,58}$/,
      inputErrorMessage: '标签名称不能为空且最多 60 个字符',
    })
    const tag = await 创建标签(value.trim())
    articleTaxonomyStore.upsertTag(tag)
    tags.value.push({ label: tag.name, value: tag.id })
    if (!form.value.tag_ids.includes(tag.id)) {
      form.value.tag_ids.push(tag.id)
    }
    ElMessage.success('标签创建成功')
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(获取API错误消息(error, '创建标签失败'))
  }
}

function toggleTag(tagId: string) {
  const index = form.value.tag_ids.indexOf(tagId)
  if (index === -1) {
    form.value.tag_ids.push(tagId)
  } else {
    form.value.tag_ids.splice(index, 1)
  }
}

function handleTitleKeydown(event: globalThis.Event | globalThis.KeyboardEvent) {
  if (!(event instanceof globalThis.KeyboardEvent) || event.key !== 'Enter' || event.isComposing) return
  event.preventDefault()
  editorRef.value?.focus()
}

async function 构建文章AI请求(): Promise<ArticleAIRequestPayload | null> {
  try {
    await loadEditorOptions()
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '加载分类和标签失败，无法生成 AI 请求'))
    return null
  }

  const content = (editorRef.value?.getMarkdown() ?? form.value.content).trim()
  if (!content) {
    ElMessage.warning('请先填写正文内容')
    return null
  }
  return {
    title: form.value.title,
    content,
    excerpt: form.value.excerpt,
    category_names: 已有分类名称列表.value,
    tag_names: 已有标签名称列表.value,
  }
}

function 打开AI工具面板() {
  aiDrawerVisible.value = true
}

async function 生成AI元信息建议() {
  const payload = await 构建文章AI请求()
  if (!payload) {
    return
  }

  void 打开AI工具面板()
  aiLoading.value = true
  aiStatusMessage.value = '正在生成元信息建议...'
  try {
    aiMetadataSuggestion.value = await 生成文章AI元信息建议(payload)
    aiStatusMessage.value = '元信息建议已生成，可选择应用。'
    ElMessage.success('AI 元信息建议已生成')
  } catch (error) {
    const message = 获取API错误消息(error, '生成 AI 元信息建议失败')
    aiStatusMessage.value = message
    ElMessage.error(message)
  } finally {
    aiLoading.value = false
  }
}

async function 生成AI润色正文() {
  const payload = await 构建文章AI请求()
  if (!payload) {
    return
  }

  void 打开AI工具面板()
  aiLoading.value = true
  aiStatusMessage.value = '正在润色正文...'
  console.info('[ArticleAI] 开始润色正文', {
    contentLength: payload.content.length,
    title: payload.title || '',
  })
  try {
    const result = await AI润色文章正文(payload)
    console.info('[ArticleAI] 润色正文完成', {
      contentLength: result.content.length,
      summaryLength: result.summary.length,
    })
    aiPolishResult.value = result
    if (!result.content.trim()) {
      aiStatusMessage.value = 'AI 返回了空正文，请重试或缩短正文后再试。'
      ElMessage.warning(aiStatusMessage.value)
      return
    }
    aiStatusMessage.value =
      result.content.trim() === payload.content.trim()
        ? 'AI 已返回润色结果，但正文与当前内容基本一致。'
        : '正文润色结果已生成，可预览后替换。'
    ElMessage.success('AI 润色结果已生成')
  } catch (error) {
    const message = 获取API错误消息(error, 'AI 润色正文失败')
    console.error('[ArticleAI] 润色正文失败', error)
    aiStatusMessage.value = message
    ElMessage.error(message)
  } finally {
    aiLoading.value = false
  }
}

async function 确保分类存在(categoryName: string): Promise<string | null> {
  const normalizedName = categoryName.trim()
  if (!normalizedName) {
    return null
  }

  const existing = categories.value.find((item) => item.label === normalizedName)
  if (existing) {
    return existing.value
  }

  const category = await 创建分类(normalizedName)
  articleTaxonomyStore.upsertCategory(category)
  categories.value.push({ label: category.name, value: category.id })
  return category.id
}

async function 确保标签存在(tagName: string): Promise<string | null> {
  const normalizedName = tagName.trim()
  if (!normalizedName) {
    return null
  }

  const existing = tags.value.find((item) => item.label === normalizedName)
  if (existing) {
    return existing.value
  }

  const tag = await 创建标签(normalizedName)
  articleTaxonomyStore.upsertTag(tag)
  tags.value.push({ label: tag.name, value: tag.id })
  return tag.id
}

function 应用AI标题() {
  const title = aiMetadataSuggestion.value?.title.trim()
  if (!title) {
    return
  }
  form.value.title = title
}

function 应用AI摘要() {
  const excerpt = aiMetadataSuggestion.value?.excerpt.trim()
  if (!excerpt) {
    return
  }
  form.value.excerpt = excerpt
}

async function 应用AI分类() {
  const categoryName = aiMetadataSuggestion.value?.category_name?.trim()
  if (!categoryName) {
    return
  }

  try {
    const categoryId = await 确保分类存在(categoryName)
    if (categoryId) {
      form.value.category_id = categoryId
      ElMessage.success('已应用 AI 分类')
    }
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '应用 AI 分类失败'))
  }
}

async function 应用AI标签() {
  const suggestion = aiMetadataSuggestion.value
  if (!suggestion || suggestion.tag_names.length === 0) {
    return
  }

  try {
    const tagIds: Array<string | null> = []
    const normalizedNames = Array.from(
      new Set(suggestion.tag_names.map((name) => name.trim()).filter(Boolean)),
    )
    for (const name of normalizedNames) {
      tagIds.push(await 确保标签存在(name))
    }
    const mergedIds = new Set(form.value.tag_ids)
    for (const tagId of tagIds) {
      if (tagId) {
        mergedIds.add(tagId)
      }
    }
    form.value.tag_ids = [...mergedIds]
    ElMessage.success('已应用 AI 标签')
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '应用 AI 标签失败'))
  }
}

async function 应用AI全部元信息() {
  应用AI标题()
  应用AI摘要()
  await 应用AI分类()
  await 应用AI标签()
}

async function 替换为AI润色正文() {
  const polishedContent = aiPolishResult.value?.content
  if (!polishedContent) {
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定用 AI 润色结果替换当前正文？替换后仍需手动保存文章。',
      '替换正文',
      {
        type: 'warning',
        confirmButtonText: '替换',
        cancelButtonText: '取消',
      },
    )
    editorRef.value?.setMarkdown(polishedContent)
    form.value.content = polishedContent
    await nextTick()
    ElMessage.success('已替换为 AI 润色正文')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(获取API错误消息(error, '替换正文失败'))
    }
  }
}

function applyArticleToForm(article: ArticleRecord) {
  form.value = {
    title: article.title,
    content: article.content,
    excerpt: article.excerpt || '',
    cover_url: article.cover_url || '',
    category_id: article.category?.id || null,
    tag_ids: article.tags.map((tag) => tag.id),
  }
}

function buildEmptyForm(): ArticleEditorPayload {
  return {
    title: '',
    content: '',
    excerpt: '',
    cover_url: '',
    category_id: null,
    tag_ids: [],
  }
}

function cloneFormPayload(payload: ArticleEditorPayload): ArticleEditorPayload {
  return {
    ...payload,
    tag_ids: [...payload.tag_ids],
  }
}

function 提取Markdown大纲(content: string): 文章大纲项[] {
  const outline: 文章大纲项[] = []
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  let fence: { marker: string; length: number } | null = null

  lines.forEach((line, lineIndex) => {
    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})/)
    if (fenceMatch) {
      const markerText = fenceMatch[2] ?? ''
      if (fence && markerText[0] === fence.marker && markerText.length >= fence.length) {
        fence = null
      } else if (!fence) {
        fence = {
          marker: markerText[0] ?? '',
          length: markerText.length,
        }
      }
      return
    }

    if (fence) {
      return
    }

    const headingMatch = line.match(/^(#{1,6})[ \t]+(.+?)(?:[ \t]+#+[ \t]*)?$/)
    if (!headingMatch) {
      return
    }

    const headingText = 清理大纲标题文本(headingMatch[2] ?? '')
    if (!headingText) {
      return
    }

    outline.push({
      id: `article-editor-outline-${lineIndex + 1}-${outline.length}`,
      index: outline.length,
      level: headingMatch[1]?.length ?? 1,
      line: lineIndex + 1,
      text: headingText,
    })
  })

  return outline
}

function 清理大纲标题文本(value: string): string {
  return value
    .replace(/\\([\\`*_[\]{}()#+\-.!>])/g, '$1')
    .replace(/!\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]+/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function 获取大纲层级类(level: number): string {
  return `article-editor-outline__item--level-${Math.min(level, 4)}`
}

async function 跳转到大纲项(item: 文章大纲项) {
  outlineVisible.value = true
  await nextTick()
  const jumped = editorRef.value?.scrollToHeading(item.index, item.line) ?? false
  if (!jumped) {
    ElMessage.warning('暂时无法定位到对应标题')
  }
  调度大纲活动更新()
}

function 清理大纲活动监听() {
  大纲活动监听清理?.()
  大纲活动监听清理 = null
  if (大纲活动更新帧) {
    window.cancelAnimationFrame(大纲活动更新帧)
    大纲活动更新帧 = 0
  }
  if (大纲活动滚动计时器) {
    window.clearTimeout(大纲活动滚动计时器)
    大纲活动滚动计时器 = 0
  }
}

function 初始化大纲活动监听() {
  清理大纲活动监听()

  if (!outlineVisible.value) {
    当前可见大纲序号集合.value = new Set()
    return
  }

  const 滚动容器 = editorRef.value?.getScrollElement()
  if (!滚动容器) {
    当前可见大纲序号集合.value = new Set()
    return
  }

  const 处理滚动 = () => 调度大纲活动更新()
  滚动容器.addEventListener('scroll', 处理滚动, { passive: true })
  大纲活动监听清理 = () => 滚动容器.removeEventListener('scroll', 处理滚动)
  调度大纲活动更新()
}

function 调度大纲活动更新() {
  if (!outlineVisible.value) {
    当前可见大纲序号集合.value = new Set()
    return
  }

  if (大纲活动更新帧) {
    window.cancelAnimationFrame(大纲活动更新帧)
  }

  大纲活动更新帧 = window.requestAnimationFrame(() => {
    大纲活动更新帧 = 0
    更新当前可见大纲项()
  })
}

function 更新当前可见大纲项() {
  const 滚动容器 = editorRef.value?.getScrollElement()
  const outlineItems = 文章大纲列表.value
  if (!outlineVisible.value || !滚动容器 || outlineItems.length === 0) {
    当前可见大纲序号集合.value = new Set()
    return
  }

  const 源码输入框 = 滚动容器.querySelector('.milkdown-markdown-editor__source')
  const visibleIndexes =
    源码输入框 instanceof globalThis.HTMLTextAreaElement
      ? 获取源码模式可见大纲序号(滚动容器, 源码输入框, outlineItems)
      : 获取可视编辑模式可见大纲序号(滚动容器)

  当前可见大纲序号集合.value = visibleIndexes
  void nextTick(() => 更新大纲活动指示器())
  调度滚动大纲到活动项()
}

function 更新大纲活动指示器() {
  const indicator = outlineIndicatorRef.value
  const listElement = outlineListRef.value
  if (!indicator || !listElement) {
    return
  }

  const activeElements = Array.from(
    listElement.querySelectorAll('.article-editor-outline__item.is-active'),
  ).filter(
    (element): element is globalThis.HTMLElement => element instanceof globalThis.HTMLElement,
  )

  if (activeElements.length === 0) {
    indicator.style.opacity = '0'
    return
  }

  const firstElement = activeElements[0]
  const lastElement = activeElements[activeElements.length - 1]
  const top = firstElement.offsetTop
  const height = lastElement.offsetTop + lastElement.offsetHeight - firstElement.offsetTop

  indicator.style.top = `${top}px`
  indicator.style.height = `${height}px`
  indicator.style.opacity = '1'
}

function 获取可视编辑模式可见大纲序号(滚动容器: globalThis.HTMLElement): Set<number> {
  const visibleIndexes = new Set<number>()
  const 标题元素列表 = Array.from(滚动容器.querySelectorAll('h1, h2, h3, h4, h5, h6')).filter(
    (element): element is globalThis.HTMLElement => element instanceof globalThis.HTMLElement,
  )
  const 容器矩形 = 滚动容器.getBoundingClientRect()

  标题元素列表.forEach((element, index) => {
    const 元素矩形 = element.getBoundingClientRect()
    if (元素矩形.bottom >= 容器矩形.top && 元素矩形.top <= 容器矩形.bottom) {
      visibleIndexes.add(index)
    }
  })

  if (visibleIndexes.size > 0 || 标题元素列表.length === 0) {
    return visibleIndexes
  }

  let 最近序号 = 0
  let 最近距离 = Number.POSITIVE_INFINITY
  标题元素列表.forEach((element, index) => {
    const distance = Math.abs(element.getBoundingClientRect().top - 容器矩形.top)
    if (distance < 最近距离) {
      最近距离 = distance
      最近序号 = index
    }
  })
  visibleIndexes.add(最近序号)
  return visibleIndexes
}

function 获取源码模式可见大纲序号(
  滚动容器: globalThis.HTMLElement,
  textarea: globalThis.HTMLTextAreaElement,
  outlineItems: 文章大纲项[],
): Set<number> {
  const visibleIndexes = new Set<number>()
  const lineHeight = 获取文本域行高(textarea)
  const 标题区域高度 = Math.max(0, textarea.offsetTop - 滚动容器.offsetTop)
  const 正文滚动顶部 = Math.max(0, 滚动容器.scrollTop - 标题区域高度)
  const 正文可见底部 = Math.max(
    正文滚动顶部,
    滚动容器.scrollTop + 滚动容器.clientHeight - 标题区域高度,
  )
  const startLine = Math.max(1, Math.floor(正文滚动顶部 / lineHeight) + 1)
  const endLine = Math.max(startLine, Math.ceil(正文可见底部 / lineHeight))

  for (const item of outlineItems) {
    if (item.line >= startLine && item.line <= endLine) {
      visibleIndexes.add(item.index)
    }
  }

  if (visibleIndexes.size > 0) {
    return visibleIndexes
  }

  const 最近项 = outlineItems.reduce((current, item) => {
    const currentDistance = Math.abs(current.line - startLine)
    const itemDistance = Math.abs(item.line - startLine)
    return itemDistance < currentDistance ? item : current
  }, outlineItems[0])
  if (最近项) {
    visibleIndexes.add(最近项.index)
  }
  return visibleIndexes
}

function 获取文本域行高(textarea: globalThis.HTMLTextAreaElement): number {
  const computedStyle = window.getComputedStyle(textarea)
  const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight)
  if (Number.isFinite(parsedLineHeight) && parsedLineHeight > 0) {
    return parsedLineHeight
  }

  const parsedFontSize = Number.parseFloat(computedStyle.fontSize)
  return Number.isFinite(parsedFontSize) && parsedFontSize > 0 ? parsedFontSize * 1.75 : 24
}

function 调度滚动大纲到活动项() {
  if (大纲活动滚动计时器) {
    window.clearTimeout(大纲活动滚动计时器)
  }

  大纲活动滚动计时器 = window.setTimeout(() => {
    大纲活动滚动计时器 = 0
    const 大纲列表元素 = outlineListRef.value
    const activeElement = 大纲列表元素?.querySelector('.article-editor-outline__item.is-active')
    if (
      !(大纲列表元素 instanceof globalThis.HTMLElement) ||
      !(activeElement instanceof globalThis.HTMLElement)
    ) {
      return
    }

    const 列表矩形 = 大纲列表元素.getBoundingClientRect()
    const 活动项矩形 = activeElement.getBoundingClientRect()
    if (活动项矩形.top >= 列表矩形.top && 活动项矩形.bottom <= 列表矩形.bottom) {
      return
    }

    大纲列表元素.scrollTo({
      top: activeElement.offsetTop - 大纲列表元素.clientHeight / 2 + activeElement.clientHeight / 2,
      behavior: 'smooth',
    })
  }, 80)
}

function resetEditorForm() {
  form.value = buildEmptyForm()
}

function 清空文章图片状态() {
  articleImages.value = []
  selectedUnusedArticleImageIds.value = []
}

function 规范化站内文件路径(url: string | null | undefined): string | null {
  const trimmedUrl = url?.trim()
  if (!trimmedUrl) {
    return null
  }

  try {
    const parsedUrl = new window.URL(trimmedUrl, window.location.origin)
    if (!parsedUrl.pathname.startsWith('/files/')) {
      return null
    }
    return decodeURIComponent(parsedUrl.pathname)
  } catch {
    const [path] = trimmedUrl.split('?')
    if (!path?.startsWith('/files/')) {
      return null
    }
    return decodeURIComponent(path)
  }
}

function 收集已使用文章图片路径(content: string, coverUrl: string): Set<string> {
  const paths = new Set<string>()
  const normalizedCoverUrl = 规范化站内文件路径(coverUrl)
  if (normalizedCoverUrl) {
    paths.add(normalizedCoverUrl)
  }

  for (const match of content.matchAll(站内文件链接正则)) {
    const normalizedPath = 规范化站内文件路径(match[0])
    if (normalizedPath) {
      paths.add(normalizedPath)
    }
  }

  return paths
}

async function 同步文章图片(articleId: string) {
  const 当前加载序号 = ++文章图片加载序号

  if (!articleId) {
    articleImagesLoading.value = false
    清空文章图片状态()
    return
  }

  articleImagesLoading.value = true
  try {
    const images = await 获取文章图片(articleId)
    if (当前加载序号 !== 文章图片加载序号) {
      return
    }
    articleImages.value = images
  } catch (error) {
    if (当前加载序号 !== 文章图片加载序号) {
      return
    }

    清空文章图片状态()
    ElMessage.error(获取API错误消息(error, '加载文章图片失败'))
  } finally {
    if (当前加载序号 === 文章图片加载序号) {
      articleImagesLoading.value = false
    }
  }
}

async function syncArticleByRoute(articleId: string) {
  const 当前加载序号 = ++文章加载序号

  currentArticleId.value = articleId
  loadFailed.value = false
  saveFailed.value = false
  visibility.value = 'private'
  if (!articleId) {
    loading.value = false
    resetEditorForm()
    清空文章图片状态()
    markFormSaved()
    return
  }

  loading.value = true
  try {
    const article = await 根据ID获取我的文章(articleId)
    if (当前加载序号 !== 文章加载序号) {
      return
    }

    currentArticleId.value = article.id
    visibility.value = article.status
    applyArticleToForm(article)
    await 同步文章图片(article.id)
    markFormSaved()
  } catch (error) {
    if (当前加载序号 !== 文章加载序号) {
      return
    }

    currentArticleId.value = ''
    loadFailed.value = true
    resetEditorForm()
    清空文章图片状态()
    markFormSaved()
    ElMessage.error(获取API错误消息(error, '加载文章失败'))
  } finally {
    if (当前加载序号 === 文章加载序号) {
      loading.value = false
    }
  }
}

async function syncEditorStateFromRoute(force = false) {
  const routeArticleId = getRouteArticleId()
  if (!force && routeArticleId === currentArticleId.value) {
    return
  }

  await syncArticleByRoute(routeArticleId)
}

/**
 * 判断本次离开是否来自控制台标签切换（一次性标记，读取后立即消费）。
 * 标记由 apps/console 的控制台标签栏写入，键名与那边保持一致；
 * 标签切换时本页会被 KeepAlive 保留，不应弹出未保存确认。
 */
function 是否为控制台标签切换(): boolean {
  try {
    const 标记 = window.sessionStorage.getItem('dashboard-tab-switch')
    if (!标记) {
      return false
    }
    window.sessionStorage.removeItem('dashboard-tab-switch')
    return true
  } catch {
    return false
  }
}

onMounted(() => {
  本页路由路径.value = route.path
  previewType.value = 'preview'
  previewLayoutMode.value = props.embedded || isMobileViewport.value ? 'hidden' : 'split'
  if (props.embedded && isMobileViewport.value) {
    propertiesVisible.value = true
    outlineVisible.value = false
  }

  void loadEditorOptions().catch((error) => {
    ElMessage.error(获取API错误消息(error, '加载分类和标签失败'))
  })
  void syncEditorStateFromRoute(true)
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// 控制台多标签下页面会随标签切换失活/激活，记录激活状态用于跳过路由重建
onActivated(() => {
  页面是否激活.value = true
  本页路由路径.value = route.path
})

onDeactivated(() => {
  页面是否激活.value = false
})

onBeforeUnmount(() => {
  clearTimeout(autoSaveTimer)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  编辑器尺寸观察器?.disconnect()
  if (滚动同步初始化帧) {
    window.cancelAnimationFrame(滚动同步初始化帧)
    滚动同步初始化帧 = 0
  }
  清理滚动同步监听()
  清理大纲活动监听()
})

watch(
  () => editorRef.value,
  async () => {
    await nextTick()
    初始化编辑器内容区尺寸观察()
    初始化大纲活动监听()
  },
  { flush: 'post' },
)

watch(
  isMobileViewport,
  async () => {
    if (isMobileViewport.value) {
      propertiesVisible.value = true
      outlineVisible.value = false
    }
    await nextTick()
    初始化编辑器内容区尺寸观察()
  },
  { flush: 'post' },
)

watch(outlineVisible, (visible) => {
  if (visible && isMobileViewport.value) propertiesVisible.value = false
})
watch(propertiesVisible, (visible) => {
  if (visible && isMobileViewport.value) outlineVisible.value = false
})

watch([previewType, previewLayoutMode], async (_, [previousType, previousLayout]) => {
  const previousPreview = previousType === 'html' ? htmlOverlayRef.value : markdownOverlayRef.value
  const ratio = previousLayout === 'full' && previousPreview
    ? 获取滚动比例(previousPreview)
    : editorRef.value?.getScrollRatio() ?? 0
  清理滚动同步监听()
  await nextTick()
  初始化编辑器内容区尺寸观察()
  editorRef.value?.setScrollRatio(ratio)
  const preview = 获取预览滚动容器()
  if (preview) 设置滚动比例(preview, ratio)
  await 调度滚动同步监听初始化()
})
watch(scrollSyncEnabled, 调度滚动同步监听初始化)

watch(
  () => editorRef.value,
  async () => {
    await 调度滚动同步监听初始化()
  },
  { flush: 'post' },
)

watch(
  () => form.value.content,
  async () => {
    await nextTick()
    将编辑器滚动同步到预览()
    调度大纲活动更新()
  },
  { flush: 'post' },
)

watch(outlineVisible, async () => {
  await nextTick()
  初始化大纲活动监听()
})

watch(
  () => getRouteArticleId(),
  (routeArticleId, previousRouteArticleId) => {
    if (routeArticleId === previousRouteArticleId) {
      return
    }
    // 标签切换时本页被 KeepAlive 保留：失活或路由不再属于本标签时不要重建表单
    if (!页面是否激活.value) {
      return
    }
    if (String(route.name ?? '') !== 页面路由名称) {
      return
    }
    if (route.path !== 本页路由路径.value) {
      return
    }
    void syncEditorStateFromRoute()
  },
)

onBeforeRouteLeave(async () => {
  if (props.embedded) return prepareToLeave()
  if (deletingArticle.value) {
    return true
  }

  // 控制台标签切换：页面实例会被保留，直接放行，避免误判为丢失内容
  if (是否为控制台标签切换()) {
    return true
  }

  if (saving.value || formatting.value || isUploadingImages.value) {
    ElMessage.warning(
      isUploadingImages.value
        ? '图片仍在上传，请稍后'
        : formatting.value
          ? '正在美化内容，请稍后'
          : '正在保存，请稍后',
    )
    return false
  }

  if (!isDirty.value) {
    return true
  }

  try {
    await ElMessageBox.confirm('当前文章有未保存内容，是否先保存再退出？', '未保存内容', {
      confirmButtonText: '保存并退出',
      cancelButtonText: '直接退出',
      distinguishCancelAndClose: true,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      type: 'warning',
    })
    return await saveArticle({ redirectAfterSave: false, syncRouteAfterSave: false })
  } catch (action: unknown) {
    return action === 'cancel'
  }
})

function buildFormSnapshot(payload: ArticleEditorPayload): string {
  return JSON.stringify({
    ...payload,
    category_id: payload.category_id ?? null,
    tag_ids: [...payload.tag_ids].sort(),
  })
}

function markFormSaved() {
  savedForm.value = cloneFormPayload(form.value)
  savedVisibility.value = visibility.value
}

function isSameTagIds(currentTagIds: string[], previousTagIds: string[]): boolean {
  return JSON.stringify([...currentTagIds].sort()) === JSON.stringify([...previousTagIds].sort())
}

function buildUpdatePayload(
  currentPayload: ArticleEditorPayload,
  previousPayload: ArticleEditorPayload,
): ArticleUpdatePayload {
  const payload: ArticleUpdatePayload = {}

  if (currentPayload.title !== previousPayload.title) {
    payload.title = currentPayload.title
  }
  if (currentPayload.content !== previousPayload.content) {
    payload.content = currentPayload.content
  }
  if (currentPayload.excerpt !== previousPayload.excerpt) {
    payload.excerpt = currentPayload.excerpt
  }
  if (currentPayload.cover_url !== previousPayload.cover_url) {
    payload.cover_url = currentPayload.cover_url
  }
  if (currentPayload.category_id !== previousPayload.category_id) {
    payload.category_id = currentPayload.category_id
  }
  if (!isSameTagIds(currentPayload.tag_ids, previousPayload.tag_ids)) {
    payload.tag_ids = [...currentPayload.tag_ids]
  }

  return payload
}

function 尝试从内容补全标题() {
  if (form.value.title.trim()) {
    return
  }

  const extractedTitle = 从Markdown首行提取文章标题(form.value.content)
  if (!extractedTitle) {
    return
  }

  form.value.title = extractedTitle
}

function buildDraftPayload(): ArticleDraftPayload {
  尝试从内容补全标题()
  return {
    title: form.value.title,
    content: form.value.content,
    excerpt: form.value.excerpt,
    cover_url: form.value.cover_url,
    category_id: form.value.category_id,
    tag_ids: [...form.value.tag_ids],
  }
}

async function syncEditorRoute(articleId: string) {
  if (props.embedded) return
  if (!articleId) {
    return
  }
  if (
    !['DesktopArticleEditor', 'ArticleEditor'].includes(String(route.name ?? '')) ||
    getRouteArticleId() === articleId
  ) {
    return
  }

  await router.replace({
    name: String(route.name ?? '') === 'ArticleEditor' ? 'ArticleEditor' : 'DesktopArticleEditor',
    params: { id: articleId },
  })
}

async function ensureDraftArticleForImageUpload(): Promise<string> {
  if (pendingSave && !(await pendingSave)) throw new Error('保存草稿失败，无法上传图片')
  if (currentArticleId.value) {
    return currentArticleId.value
  }

  const draft = await 创建文章草稿(buildDraftPayload())
  currentArticleId.value = draft.id
  await syncEditorRoute(draft.id)
  return draft.id
}

function 同步编辑器内容区尺寸() {
  const 编辑器容器 = editorWrapperRef.value
  if (!编辑器容器) {
    return
  }

  const 内容区元素 = 编辑器容器.querySelector('.milkdown-markdown-editor__content')
  const 工具栏元素 = 编辑器容器.querySelector('.milkdown-markdown-editor__toolbar')
  const 容器矩形 = 编辑器容器.getBoundingClientRect()

  if (工具栏元素 instanceof globalThis.HTMLElement) {
    const 工具栏矩形 = 工具栏元素.getBoundingClientRect()
    编辑器工具栏底部偏移.value = Math.max(0, 工具栏矩形.bottom - 容器矩形.top)
  } else {
    编辑器工具栏底部偏移.value = 0
  }

  if (内容区元素 instanceof globalThis.HTMLElement) {
    const 内容区矩形 = 内容区元素.getBoundingClientRect()

    编辑器内容区顶部偏移.value = Math.max(0, 内容区矩形.top - 容器矩形.top)
    编辑器内容区底部偏移.value = Math.max(0, 容器矩形.bottom - 内容区矩形.bottom)
    return
  }

  const 页脚元素 = 编辑器容器.querySelector('.milkdown-markdown-editor__footer')

  编辑器内容区顶部偏移.value = 编辑器工具栏底部偏移.value
  编辑器内容区底部偏移.value =
    页脚元素 instanceof globalThis.HTMLElement ? 页脚元素.offsetHeight : 0
}

function 初始化编辑器内容区尺寸观察() {
  编辑器尺寸观察器?.disconnect()
  编辑器尺寸观察器 = null

  const 编辑器容器 = editorWrapperRef.value
  if (!编辑器容器) {
    return
  }

  同步编辑器内容区尺寸()

  if (typeof window.ResizeObserver === 'undefined') {
    return
  }

  编辑器尺寸观察器 = new window.ResizeObserver(() => {
    同步编辑器内容区尺寸()
  })
  编辑器尺寸观察器.observe(编辑器容器)

  const 工具栏元素 = 编辑器容器.querySelector('.milkdown-markdown-editor__toolbar')
  const 标题区域元素 = 编辑器容器.querySelector('.article-editor-title-area')
  const 内容区元素 = 编辑器容器.querySelector('.milkdown-markdown-editor__content')
  const 页脚元素 = 编辑器容器.querySelector('.milkdown-markdown-editor__footer')

  if (工具栏元素 instanceof globalThis.HTMLElement) {
    编辑器尺寸观察器.observe(工具栏元素)
  }
  if (标题区域元素 instanceof globalThis.HTMLElement) {
    编辑器尺寸观察器.observe(标题区域元素)
  }
  if (内容区元素 instanceof globalThis.HTMLElement) {
    编辑器尺寸观察器.observe(内容区元素)
  }
  if (页脚元素 instanceof globalThis.HTMLElement) {
    编辑器尺寸观察器.observe(页脚元素)
  }
}

function 获取预览滚动容器(): globalThis.HTMLElement | null {
  if (isMarkdownPreviewVisible.value) {
    return markdownOverlayRef.value
  }

  if (isHtmlPreviewVisible.value) {
    return htmlOverlayRef.value
  }

  return null
}

function 获取滚动比例(元素: globalThis.HTMLElement): number {
  const 最大滚动距离 = 元素.scrollHeight - 元素.clientHeight
  if (最大滚动距离 <= 0) {
    return 0
  }

  return 元素.scrollTop / 最大滚动距离
}

function 设置滚动比例(元素: globalThis.HTMLElement, 滚动比例: number) {
  const 最大滚动距离 = 元素.scrollHeight - 元素.clientHeight
  const 规范比例 = Math.min(1, Math.max(0, 滚动比例))
  元素.scrollTop = 最大滚动距离 <= 0 ? 0 : 最大滚动距离 * 规范比例
}

function 清理滚动同步监听() {
  for (const 清理 of 滚动同步清理列表) {
    清理()
  }

  滚动同步清理列表 = []
  当前滚动同步来源 = null
  if (滚动同步帧) {
    window.cancelAnimationFrame(滚动同步帧)
    滚动同步帧 = 0
  }
}

function 初始化滚动同步监听() {
  if (滚动同步初始化帧) {
    window.cancelAnimationFrame(滚动同步初始化帧)
    滚动同步初始化帧 = 0
  }

  清理滚动同步监听()

  if (!scrollSyncEnabled.value) {
    return
  }

  const 编辑器实例 = editorRef.value
  const 编辑器滚动容器 = 编辑器实例?.getScrollElement()
  const 预览滚动容器 = 获取预览滚动容器()

  if (!编辑器实例 || !编辑器滚动容器 || !预览滚动容器) {
    return
  }

  const 同步到预览 = () => {
    if (previewLayoutMode.value !== 'split' || 当前滚动同步来源 === 'preview') {
      return
    }

    当前滚动同步来源 = 'editor'
    window.cancelAnimationFrame(滚动同步帧)
    滚动同步帧 = window.requestAnimationFrame(() => {
      设置滚动比例(预览滚动容器, 编辑器实例.getScrollRatio())
      当前滚动同步来源 = null
      滚动同步帧 = 0
    })
  }

  const 同步到编辑器 = () => {
    if (当前滚动同步来源 === 'editor') {
      return
    }

    当前滚动同步来源 = 'preview'
    window.cancelAnimationFrame(滚动同步帧)
    滚动同步帧 = window.requestAnimationFrame(() => {
      编辑器实例.setScrollRatio(获取滚动比例(预览滚动容器))
      当前滚动同步来源 = null
      滚动同步帧 = 0
    })
  }

  编辑器滚动容器.addEventListener('scroll', 同步到预览, { passive: true })
  预览滚动容器.addEventListener('scroll', 同步到编辑器, { passive: true })
  滚动同步清理列表 = [
    () => 编辑器滚动容器.removeEventListener('scroll', 同步到预览),
    () => 预览滚动容器.removeEventListener('scroll', 同步到编辑器),
  ]

  if (previewLayoutMode.value === 'split') 将编辑器滚动同步到预览()
}

async function 调度滚动同步监听初始化() {
  await nextTick()
  if (滚动同步初始化帧) {
    window.cancelAnimationFrame(滚动同步初始化帧)
  }

  滚动同步初始化帧 = window.requestAnimationFrame(() => {
    滚动同步初始化帧 = 0
    初始化编辑器内容区尺寸观察()
    初始化滚动同步监听()
  })
}

function handleEditorReady() {
  void 调度滚动同步监听初始化()
  void nextTick(() => 初始化大纲活动监听())
}

function handleEditorModeChange() {
  void 调度滚动同步监听初始化()
  void nextTick(() => 初始化大纲活动监听())
}

function handleEditorUploadError(error: unknown) {
  ElMessage.error(获取API错误消息(error, '图片上传失败'))
}

function 将编辑器滚动同步到预览() {
  if (!scrollSyncEnabled.value || previewLayoutMode.value === 'full') {
    return
  }

  const 编辑器实例 = editorRef.value
  const 预览滚动容器 = 获取预览滚动容器()
  if (!编辑器实例 || !预览滚动容器) {
    return
  }

  设置滚动比例(预览滚动容器, 编辑器实例.getScrollRatio())
}

async function 恢复预览滚动位置() {
  await nextTick()
  const preview = 获取预览滚动容器()
  if (preview && editorRef.value) 设置滚动比例(preview, editorRef.value.getScrollRatio())
}

function handleBeforeUnload(event: globalThis.BeforeUnloadEvent) {
  if (!isDirty.value && !isUploadingImages.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

function 转义Markdown图片说明文本(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\r?\n/g, ' ')
    .trim()
}

function 提取图片说明文件名(value: string): string {
  const trimmedValue = value.trim()
  const lastDotIndex = trimmedValue.lastIndexOf('.')
  if (lastDotIndex > 0) {
    return trimmedValue.slice(0, lastDotIndex)
  }
  return trimmedValue
}

async function handleEditorImageUpload(files: File[]): Promise<MilkdownMarkdownImagePayload[]> {
  if (files.length === 0) {
    return []
  }

  uploadingImageCount.value += 1

  try {
    const articleId = await ensureDraftArticleForImageUpload()
    const uploadedFiles = await Promise.all(files.map((file) => 上传文章图片(articleId, file)))
    await 同步文章图片(articleId)
    return uploadedFiles.map((file) => ({
      url: file.url,
      alt: 转义Markdown图片说明文本(提取图片说明文件名(file.original_name)),
      title: '',
    }))
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '图片上传失败'))
    throw error
  } finally {
    uploadingImageCount.value = Math.max(0, uploadingImageCount.value - 1)
  }
}

function 获取本地错误消息(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 获取API错误消息(error, fallback)
}

async function formatArticleContent(): Promise<boolean> {
  if (!editorRef.value) {
    ElMessage.error('编辑器尚未就绪，请稍后再试')
    return false
  }

  formatting.value = true
  try {
    const formattedContent = editorRef.value.formatMarkdown()
    if (formattedContent === null) {
      ElMessage.error('编辑器尚未就绪，请稍后再试')
      return false
    }

    form.value.content = formattedContent
    await nextTick()
    return true
  } catch (error) {
    console.error('美化 Markdown 内容失败', error)
    ElMessage.error(获取本地错误消息(error, '美化失败'))
    return false
  } finally {
    formatting.value = false
  }
}

async function formatAndSaveArticle(): Promise<boolean> {
  if (!(await formatArticleContent())) {
    return false
  }

  if (!isDirty.value) {
    ElMessage.info('没有可保存的更改')
    return false
  }

  return saveArticle({ redirectAfterSave: false, syncRouteAfterSave: true })
}

async function saveArticle(options: SaveArticleOptions): Promise<boolean> {
  if (pendingSave) return pendingSave
  pendingSave = persistArticle(options)
  try {
    return await pendingSave
  } finally {
    pendingSave = null
  }
}

async function persistArticle(options: SaveArticleOptions): Promise<boolean> {
  clearTimeout(autoSaveTimer)
  if (loadFailed.value) return false
  if (editorRef.value) form.value.content = editorRef.value.getMarkdown()
  if (!props.embedded) 尝试从内容补全标题()

  if (!props.embedded && !form.value.title.trim()) {
    ElMessage.warning('请填写标题')
    return false
  }
  if (isUploadingImages.value) {
    ElMessage.warning('图片仍在上传，请稍后')
    return false
  }

  const snapshot = cloneFormPayload(form.value)
  const visibilitySnapshot = visibility.value
  let article: ArticleRecord

  saving.value = true
  saveFailed.value = false
  try {
    if (isEdit.value) {
      article = await 更新文章(
        currentArticleId.value,
        buildUpdatePayload(snapshot, savedForm.value),
      )
    } else {
      article = await (props.embedded ? 创建文章草稿(snapshot) : 创建文章(snapshot))
      currentArticleId.value = article.id
    }
    if (props.embedded) {
      if (visibilitySnapshot !== 'private') {
        await api.post(`/articles/blog/${article.id}/publish`, {
          expected_revision: article.revision,
          visibility: visibilitySnapshot,
        })
        article = await 根据ID获取我的文章(article.id)
      } else if (article.status !== 'private') {
        await api.post(`/articles/blog/${article.id}/withdraw`)
        article = await 根据ID获取我的文章(article.id)
      }
    }
    console.info('[文章写作] 保存完成', { articleId: article.id, status: article.status })
    savedForm.value = snapshot
    savedVisibility.value = visibilitySnapshot
    emit('saved', article)
    if (!props.embedded) ElMessage.success('保存成功')
  } catch (error) {
    saveFailed.value = true
    console.error('[文章写作] 保存失败', { articleId: currentArticleId.value, error })
    ElMessage.error(获取API错误消息(error, '保存失败'))
    return false
  } finally {
    saving.value = false
    if (props.embedded && !saveFailed.value && isDirty.value) scheduleAutoSave()
  }

  if (options.redirectAfterSave) {
    await router.push(`${路由前缀.value}/articles`)
    return true
  }

  if (options.syncRouteAfterSave !== false) {
    await syncEditorRoute(article.id)
  }

  return true
}

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer)
  if (
    !props.embedded ||
    loading.value ||
    loadFailed.value ||
    !isDirty.value ||
    isUploadingImages.value ||
    formatting.value
  )
    return
  autoSaveTimer = setTimeout(() => {
    void saveArticle({ redirectAfterSave: false, syncRouteAfterSave: false })
  }, 1600)
}

watch([form, visibility, isUploadingImages, formatting], scheduleAutoSave, { deep: true })

async function prepareToLeave(): Promise<boolean> {
  clearTimeout(autoSaveTimer)
  if (loading.value || formatting.value || isUploadingImages.value) {
    ElMessage.warning('文章仍在处理，请稍后')
    return false
  }
  // Markdown 变更通知有延迟，离开前直接读取编辑器以保存最后一次输入。
  if (!loadFailed.value && editorRef.value) form.value.content = editorRef.value.getMarkdown()
  if (pendingSave && !(await pendingSave)) return false
  while (isDirty.value) {
    if (!(await saveArticle({ redirectAfterSave: false, syncRouteAfterSave: false }))) return false
  }
  return true
}

async function closeWriting() {
  if (await prepareToLeave()) emit('close')
}

async function saveWriting() {
  await saveArticle({ redirectAfterSave: false, syncRouteAfterSave: false })
}

async function exportWriting() {
  if (editorRef.value) form.value.content = editorRef.value.getMarkdown()
  exporting.value = true
  try {
    await 下载文章Markdown(form.value.title, form.value.content)
  } catch (error) {
    console.error('[文章写作] 另存为失败', error)
    ElMessage.error(获取API错误消息(error, '另存为失败'))
  } finally {
    exporting.value = false
  }
}

function showWritingPreview(mode: 预览布局模式) {
  if (editorRef.value) form.value.content = editorRef.value.getMarkdown()
  previewType.value = 'preview'
  previewLayoutMode.value = mode
}

defineExpose({ prepareToLeave, closeWriting })

async function save() {
  await saveArticle({ redirectAfterSave: true, syncRouteAfterSave: false })
}

async function updateArticleAndStay() {
  await saveArticle({ redirectAfterSave: false, syncRouteAfterSave: true })
}

async function deleteCurrentArticle() {
  if (!currentArticleId.value) {
    ElMessage.warning('当前文章尚未创建，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定将文章《${form.value.title || '未命名'}》移入回收站？`,
      '删除文章',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
      },
    )
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(获取API错误消息(error, '删除文章失败'))
    }
    return
  }

  deletingArticle.value = true
  try {
    await 删除文章(currentArticleId.value, false)
    markFormSaved()
    ElMessage.success('文章已移入回收站')
    if (props.embedded) {
      emit('deleted', currentArticleId.value)
      emit('close')
      return
    }
    await router.push(`${路由前缀.value}/articles`)
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '删除文章失败'))
  } finally {
    deletingArticle.value = false
  }
}

watch(
  未使用文章图片列表,
  (unusedImages) => {
    const unusedIds = new Set(unusedImages.map((image) => image.id))
    selectedUnusedArticleImageIds.value = selectedUnusedArticleImageIds.value.filter((id) =>
      unusedIds.has(id),
    )
  },
  { immediate: true },
)

function 切换未使用文章图片选择(imageId: string, checked: boolean) {
  if (checked) {
    if (!selectedUnusedArticleImageIds.value.includes(imageId)) {
      selectedUnusedArticleImageIds.value = [...selectedUnusedArticleImageIds.value, imageId]
    }
    return
  }

  selectedUnusedArticleImageIds.value = selectedUnusedArticleImageIds.value.filter(
    (id) => id !== imageId,
  )
}

function 选中全部未使用文章图片() {
  selectedUnusedArticleImageIds.value = 未使用文章图片列表.value.map((image) => image.id)
}

function 清空未使用文章图片选择() {
  selectedUnusedArticleImageIds.value = []
}

function 切换文章图片面板展开状态() {
  articleImagePanelExpanded.value = !articleImagePanelExpanded.value
}

function 获取文章图片预览地址(image: ArticleImageRecord): string {
  return 解析管理文件URL地址(image.thumbnail_url || image.preview_url || image.url)
}

function 格式化文章图片大小(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function 格式化文章图片时间(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

async function 删除选中未使用文章图片() {
  if (selectedUnusedArticleImageIds.value.length === 0) {
    return
  }

  await ElMessageBox.confirm(
    `确定删除选中的 ${selectedUnusedArticleImageIds.value.length} 张未使用图片？删除后无法恢复。`,
    '删除未使用图片',
    {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    },
  )

  deletingArticleImages.value = true
  try {
    const 选中ID集合 = new Set(selectedUnusedArticleImageIds.value)
    const 删除结果 = await Promise.allSettled(
      selectedUnusedArticleImageIds.value.map((imageId) =>
        删除管理文件(currentArticleId.value, imageId),
      ),
    )
    const 删除成功数量 = 删除结果.filter((item) => item.status === 'fulfilled').length
    const 删除失败数量 = 删除结果.length - 删除成功数量

    if (删除成功数量 > 0) {
      articleImages.value = articleImages.value.filter((image) => !选中ID集合.has(image.id))
      清空未使用文章图片选择()
    }

    if (删除失败数量 === 0) {
      ElMessage.success(`已删除 ${删除成功数量} 张未使用图片`)
      return
    }

    ElMessage.warning(`成功删除 ${删除成功数量} 张，另有 ${删除失败数量} 张删除失败`)
    await 同步文章图片(currentArticleId.value)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(获取API错误消息(error, '删除文章图片失败'))
    }
  } finally {
    deletingArticleImages.value = false
  }
}
</script>

<template>
  <div
    class="page-container"
    :class="{
      'writing-sheet': props.embedded,
      'writing-sheet--split-edit': props.splitEdit,
      'writing-sheet--no-props': !propertiesVisible,
      'writing-sheet--no-outline': !outlineVisible,
    }"
  >
    <header v-if="props.embedded && !props.split" class="writing-head">
      <button class="writing-back" type="button" @click="closeWriting">← <span>列表</span></button>
      <span class="writing-divider" />
      <span class="writing-name">{{ form.title || '未命名草稿' }}</span>
      <button
        class="writing-save-state"
        :class="{ 'is-dirty': isDirty || saveFailed }"
        type="button"
        :disabled="loading || saving"
        @click="saveWriting"
      >
        {{ saveStateText }}
      </button>
      <div class="writing-head-actions">
        <div class="writing-pane-switch" role="group" aria-label="书写、预览与双屏">
          <button
            type="button"
            :class="{ 'is-active': previewLayoutMode === 'hidden' }"
            @click="showWritingPreview('hidden')"
          >
            书写
          </button>
          <button
            type="button"
            :class="{ 'is-active': previewLayoutMode === 'full' }"
            @click="showWritingPreview('full')"
          >
            预览
          </button>
          <button
            type="button"
            :class="{ 'is-active': previewLayoutMode === 'split' }"
            @click="showWritingPreview('split')"
          >
            双屏
          </button>
        </div>
        <button
          class="writing-panel-toggle"
          type="button"
          title="文章大纲"
          aria-label="文章大纲"
          :aria-pressed="outlineVisible"
          @click="outlineVisible = !outlineVisible"
        >
          <OutlineIcon />
        </button>
        <button
          class="writing-panel-toggle"
          type="button"
          title="文章属性"
          aria-label="文章属性"
          :aria-pressed="propertiesVisible"
          @click="propertiesVisible = !propertiesVisible"
        >
          <PropertiesIcon />
        </button>
        <ElButton
          size="small"
          :disabled="loading || loadFailed || saving || isUploadingImages"
          :loading="exporting"
          @click="exportWriting"
          >另存为</ElButton
        >
        <ElButton
          size="small"
          type="primary"
          :disabled="loading || loadFailed || saving || isUploadingImages"
          :loading="saving"
          @click="saveWriting"
          >保存</ElButton
        >
      </div>
    </header>
    <PageSectionShell
      class="article-editor-shell"
      :title="isEdit ? '编辑文章' : '写文章'"
      :icon="isEdit ? EditPen : DocumentAdd"
      title-tag="h2"
      :show-back="props.showBack"
      :to="props.backTo"
    >
      <ElSkeleton :loading="loading" animated>
        <ElForm
          label-position="top"
          :class="{ 'writing-form': props.embedded }"
          :inert="props.embedded && loadFailed"
        >
          <ElFormItem class="editor-form-item">
            <div
              class="editor-workspace"
              :class="{ 'editor-workspace--outline-visible': outlineVisible }"
            >
              <aside v-if="outlineVisible" class="article-editor-outline" aria-label="文章大纲">
                <div class="article-editor-outline__header">
                  <span>大纲</span>
                  <ElTag size="small" effect="plain">{{ 文章大纲列表.length }}</ElTag>
                </div>
                <div
                  v-if="文章大纲列表.length > 0"
                  ref="outlineListRef"
                  class="article-editor-outline__list"
                >
                  <button
                    v-for="item in 文章大纲列表"
                    :key="item.id"
                    class="article-editor-outline__item"
                    :class="[
                      获取大纲层级类(item.level),
                      { 'is-active': 当前可见大纲序号集合.has(item.index) },
                    ]"
                    type="button"
                    :title="item.text"
                    :aria-current="当前可见大纲序号集合.has(item.index) ? 'true' : undefined"
                    @click="跳转到大纲项(item)"
                  >
                    <span class="article-editor-outline__marker">H{{ item.level }}</span>
                    <span class="article-editor-outline__text">{{ item.text }}</span>
                  </button>
                  <div
                    ref="outlineIndicatorRef"
                    class="article-editor-outline__indicator"
                    aria-hidden="true"
                  />
                </div>
                <div v-else class="article-editor-outline__empty">当前正文没有 Markdown 标题。</div>
              </aside>
              <div
                ref="editorWrapperRef"
                class="editor-wrapper"
                :class="{
                  'editor-wrapper--markdown-split': isMarkdownSplitVisible,
                  'editor-wrapper--markdown-full': isMarkdownFullVisible,
                  'editor-wrapper--html-split': isHtmlSplitVisible,
                  'editor-wrapper--html-full': isHtmlFullVisible,
                  'editor-wrapper--mindmap-split': isMindmapSplitVisible,
                  'editor-wrapper--mindmap-full': isMindmapFullVisible,
                }"
                :style="编辑器内容区覆盖样式"
              >
                <MilkdownMarkdownEditor
                  :id="editorId"
                  ref="editorRef"
                  v-model="form.content"
                  class="article-milkdown-editor"
                  :theme="editorTheme"
                  placeholder="在此编写 Markdown 内容..."
                  :upload-images="handleEditorImageUpload"
                  :format-content="formatArticleContent"
                  v-model:scroll-sync="scrollSyncEnabled"
                  v-model:preview-enabled="previewEnabled"
                  v-model:preview-layout-mode="activePreviewLayoutMode"
                  v-model:preview-type="previewType"
                  v-model:outline-visible="outlineVisible"
                  v-model:properties-visible="propertiesVisible"
                  :show-properties-toggle="props.embedded"
                  :show-scroll-sync="previewEnabled"
                  show-preview-toggle
                  show-outline-toggle
                  show-ai-tools
                  fullscreen-root-selector=".editor-wrapper"
                  @ready="handleEditorReady"
                  @upload-error="handleEditorUploadError"
                  @mode-change="handleEditorModeChange"
                  @open-ai-tools="打开AI工具面板"
                >
                  <template #content-header>
                    <div class="article-editor-title-area">
                      <div class="article-editor-title-area__editor">
                        <ElInput
                          v-model="form.title"
                          class="article-editor-title-input"
                          placeholder="文章标题"
                          size="large"
                          @keydown="handleTitleKeydown"
                        />
                      </div>
                    </div>
                  </template>
                </MilkdownMarkdownEditor>

                <div
                  v-if="isMarkdownPreviewVisible"
                  ref="markdownOverlayRef"
                  class="markdown-editor-overlay"
                >
                  <div class="markdown-editor-overlay__title" :title="form.title || '未命名文章'">
                    {{ form.title || '未命名文章' }}
                  </div>
                  <MarkdownRenderer
                    class="markdown-editor-overlay__content article-markdown-preview"
                    :content="form.content"
                    :debounce-ms="180"
                    @rendered="恢复预览滚动位置"
                  />
                </div>

                <div v-if="isHtmlPreviewVisible" ref="htmlOverlayRef" class="html-editor-overlay">
                  <pre
                    class="html-editor-overlay__content"
                  ><code>{{ htmlPreviewContent }}</code></pre>
                </div>

                <div v-if="isMindmapPreviewVisible" class="mindmap-editor-overlay">
                  <MarkdownMindmap :content="form.content" :title="form.title" height="100%" />
                </div>
              </div>
            </div>
          </ElFormItem>

          <aside
            class="article-editor-properties"
            :aria-label="props.embedded ? '文章属性' : undefined"
          >
            <template v-if="props.embedded">
              <div class="writing-props-title">文章属性</div>
              <div class="writing-publication-state">
                {{ visibility === 'public' ? '已公开发布，保存后同步更新' : visibility === 'login_required' ? '已发布为登录可见，保存后同步更新' : '私有文章，保存后仅自己可见' }}
              </div>
            </template>
            <ElFormItem v-if="props.embedded" label="可见性">
              <div class="article-editor-chips" role="group" aria-label="可见性">
                <button
                  v-for="item in visibilityOptions"
                  :key="item.value"
                  class="article-editor-chip"
                  :class="{ 'is-active': visibility === item.value }"
                  type="button"
                  :aria-pressed="visibility === item.value"
                  @click="visibility = item.value"
                >
                  {{ item.label }}
                </button>
              </div>
            </ElFormItem>
            <div class="article-editor-metadata-grid">
              <ElFormItem>
                <template #label>
                  <div class="article-editor-metadata-label">
                    <span>分类</span>
                    <ElButton link type="primary" size="small" @click="handleCreateCategory"
                      >+ 新增</ElButton
                    >
                  </div>
                </template>
                <ElSelect v-model="form.category_id" placeholder="选择分类" clearable>
                  <ElOption
                    v-for="item in categories"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem>
                <template #label>
                  <div class="article-editor-metadata-label">
                    <span>标签</span>
                    <ElButton link type="primary" size="small" @click="handleCreateTag"
                      >+ 新增</ElButton
                    >
                  </div>
                </template>
                <div class="article-editor-chips" role="group" aria-label="标签">
                  <button
                    v-for="item in tags"
                    :key="item.value"
                    class="article-editor-chip"
                    :class="{ 'is-active': form.tag_ids.includes(item.value) }"
                    type="button"
                    :aria-pressed="form.tag_ids.includes(item.value)"
                    @click="toggleTag(item.value)"
                  >
                    {{ item.label }}
                  </button>
                  <span v-if="tags.length === 0" class="article-editor-tags-empty">暂无标签</span>
                </div>
              </ElFormItem>
            </div>

            <ElFormItem label="摘要">
              <ElInput
                v-model="form.excerpt"
                type="textarea"
                placeholder="文章摘要（可选）"
                :rows="2"
              />
            </ElFormItem>

            <ElFormItem label="封面图 URL">
              <ElInput v-model="form.cover_url" placeholder="https://..." />
            </ElFormItem>

            <ArticleImagePanel
              :expanded="articleImagePanelExpanded"
              :current-article-id="currentArticleId"
              :loading="articleImagesLoading"
              :deleting="deletingArticleImages"
              :items="文章图片列表项"
              :desktop-summary="文章图片桌面摘要"
              :mobile-summary="文章图片移动端摘要"
              :selected-ids="selectedUnusedArticleImageIds"
              :unused-count="未使用文章图片列表.length"
              :resolve-preview-url="获取文章图片预览地址"
              :format-size="格式化文章图片大小"
              :format-time="格式化文章图片时间"
              @toggle="切换文章图片面板展开状态"
              @refresh="同步文章图片(currentArticleId)"
              @select-all-unused="选中全部未使用文章图片"
              @clear-selection="清空未使用文章图片选择"
              @delete-selected="删除选中未使用文章图片"
              @selection-change="切换未使用文章图片选择"
            />

            <div v-if="props.embedded && props.split" class="writing-props-actions">
              <ElButton
                size="small"
                :disabled="loading || loadFailed || saving || isUploadingImages"
                :loading="exporting"
                @click="exportWriting"
                >另存为</ElButton
              >
              <ElButton
                size="small"
                type="primary"
                :disabled="loading || loadFailed || saving || isUploadingImages"
                :loading="saving"
                @click="saveWriting"
                >保存</ElButton
              >
            </div>
            <ElButton
              v-if="props.embedded && isEdit"
              class="writing-delete"
              text
              type="danger"
              :loading="deletingArticle"
              :disabled="saving || formatting || isUploadingImages"
              @click="deleteCurrentArticle"
              >移入回收站</ElButton
            >
            <div v-if="!props.embedded" class="article-editor-actions">
              <div class="article-editor-buttons">
                <ElButton
                  v-if="isEdit"
                  type="danger"
                  plain
                  :icon="Delete"
                  :loading="deletingArticle"
                  :disabled="saving || formatting || isUploadingImages"
                  @click="deleteCurrentArticle"
                >
                  删除
                </ElButton>
                <div class="article-editor-buttons__main">
                  <ElButton @click="router.back()">取消</ElButton>
                  <ElButton
                    plain
                    :icon="Select"
                    :loading="saving || formatting || isUploadingImages"
                    :disabled="deletingArticle"
                    @click="save"
                  >
                    保存并退出
                  </ElButton>
                  <ElButton
                    type="primary"
                    :loading="saving || formatting || isUploadingImages"
                    :disabled="deletingArticle"
                    @click="updateArticleAndStay"
                  >
                    {{ isEdit ? '保存文章' : '创建文章' }}
                  </ElButton>
                </div>
              </div>
            </div>
          </aside>
        </ElForm>
      </ElSkeleton>
    </PageSectionShell>
    <ElDrawer v-model="aiDrawerVisible" title="AI 辅助" size="520px" class="article-ai-drawer">
      <div class="article-ai-panel">
        <div class="article-ai-panel__actions">
          <ElButton plain :icon="MagicStick" :loading="aiLoading" @click="生成AI元信息建议">
            生成元信息
          </ElButton>
          <ElButton plain :icon="MagicStick" :loading="aiLoading" @click="生成AI润色正文">
            润色正文
          </ElButton>
        </div>

        <div v-if="aiStatusMessage" class="article-ai-status">
          {{ aiStatusMessage }}
        </div>

        <section v-if="aiMetadataSuggestion" class="article-ai-section">
          <div class="article-ai-section__header">
            <h3>元信息建议</h3>
            <ElButton type="primary" plain size="small" @click="应用AI全部元信息"
              >全部应用</ElButton
            >
          </div>

          <div class="article-ai-field">
            <div class="article-ai-field__label">
              <span>标题</span>
              <ElButton link type="primary" size="small" @click="应用AI标题">应用</ElButton>
            </div>
            <p>{{ aiMetadataSuggestion.title }}</p>
          </div>

          <div class="article-ai-field">
            <div class="article-ai-field__label">
              <span>摘要</span>
              <ElButton link type="primary" size="small" @click="应用AI摘要">应用</ElButton>
            </div>
            <p>{{ aiMetadataSuggestion.excerpt }}</p>
          </div>

          <div class="article-ai-field">
            <div class="article-ai-field__label">
              <span>分类</span>
              <ElButton link type="primary" size="small" @click="应用AI分类">应用</ElButton>
            </div>
            <ElSpace wrap>
              <ElTag v-if="aiMetadataSuggestion.category_name" effect="plain">
                {{ aiMetadataSuggestion.category_name }}
              </ElTag>
              <ElTag
                v-if="aiMetadataSuggestion.category_name && !AI建议分类已存在"
                type="warning"
                effect="plain"
              >
                将新建
              </ElTag>
              <span v-if="!aiMetadataSuggestion.category_name" class="article-ai-muted"
                >未建议分类</span
              >
            </ElSpace>
          </div>

          <div class="article-ai-field">
            <div class="article-ai-field__label">
              <span>标签</span>
              <ElButton link type="primary" size="small" @click="应用AI标签">应用</ElButton>
            </div>
            <ElSpace wrap>
              <ElTag
                v-for="tagName in aiMetadataSuggestion.tag_names"
                :key="tagName"
                effect="plain"
              >
                {{ tagName }}
              </ElTag>
              <ElTag v-if="AI建议新标签列表.length > 0" type="warning" effect="plain">
                {{ AI建议新标签列表.length }} 个将新建
              </ElTag>
            </ElSpace>
          </div>

          <div v-if="aiMetadataSuggestion.reason" class="article-ai-field">
            <div class="article-ai-field__label">
              <span>依据</span>
            </div>
            <p>{{ aiMetadataSuggestion.reason }}</p>
          </div>
        </section>

        <section v-if="aiPolishResult" class="article-ai-section">
          <div class="article-ai-section__header">
            <h3>正文润色</h3>
            <ElButton type="primary" plain size="small" @click="替换为AI润色正文"
              >替换正文</ElButton
            >
          </div>
          <p v-if="aiPolishResult.summary" class="article-ai-summary">
            {{ aiPolishResult.summary }}
          </p>
          <pre class="article-ai-content-preview">{{ aiPolishResult.content }}</pre>
        </section>

        <div v-if="!aiMetadataSuggestion && !aiPolishResult" class="article-ai-empty">
          生成结果会显示在这里。
        </div>
      </div>
    </ElDrawer>
  </div>
</template>

<style scoped>
@import '@feathernest/ui/styles/media.css';

.page-container {
  height: 100%;
  overflow-y: auto;
  padding: 0;
  box-sizing: border-box;
}

.article-editor-shell :deep(.page-section-shell__header) {
  display: none;
}

.editor-form-item:deep(.el-form-item__label) {
  display: none;
}

.editor-form-item:deep(.el-form-item__content) {
  display: block;
  width: 100%;
  line-height: normal;
}

.article-editor-metadata-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.article-editor-metadata-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.article-editor-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.article-editor-chip {
  height: 26px;
  padding: 0 9px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
}

.article-editor-chip:hover {
  border-color: var(--el-text-color-placeholder);
  color: var(--el-text-color-primary);
}

.article-editor-chip.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.article-editor-tags-empty {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.page-container,
.page-container :deep(*) {
  scrollbar-width: thin;
  scrollbar-color: #d4d4d4 transparent;
}

.page-container::-webkit-scrollbar,
.page-container :deep(*::-webkit-scrollbar) {
  width: 9px;
  height: 9px;
}

.page-container::-webkit-scrollbar-track,
.page-container :deep(*::-webkit-scrollbar-track) {
  background: transparent;
}

.page-container::-webkit-scrollbar-thumb,
.page-container :deep(*::-webkit-scrollbar-thumb) {
  border: 3px solid transparent;
  border-radius: 99px;
  background-clip: content-box;
  background-color: #d4d4d4;
}

.editor-workspace {
  --article-editor-title-area-height: 69px;
  --article-editor-title-color: var(--el-text-color-primary);
  --article-editor-panel-bg: var(--card-bg-transparent, var(--el-bg-color-overlay));
  --article-editor-panel-bg-color: rgba(255, 255, 255, var(--overlay-card-opacity, 0.68));
  --article-editor-text-primary: var(--text-primary, var(--el-text-color-primary));
  --article-editor-text-secondary: var(--text-secondary, var(--el-text-color-secondary));
  --article-editor-text-tertiary: var(--text-tertiary, var(--el-text-color-placeholder));
  --article-editor-border: var(--border-color, var(--el-border-color));
  --article-editor-hover-bg: var(
    --bg-hover,
    color-mix(in srgb, var(--el-color-primary) 8%, transparent)
  );
  --milkdown-markdown-editor-bg: var(--article-editor-panel-bg);
  --milkdown-markdown-editor-bg-color: var(--article-editor-panel-bg-color);
  --milkdown-markdown-editor-toolbar-bg: var(--article-editor-panel-bg);
  --milkdown-markdown-editor-toolbar-bg-color: var(--article-editor-panel-bg-color);
  --milkdown-markdown-editor-content-bg: var(--article-editor-panel-bg);
  --milkdown-markdown-editor-content-bg-color: var(--article-editor-panel-bg-color);
  display: flex;
  align-items: stretch;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.dark .editor-workspace {
  --article-editor-panel-bg-color: rgba(15, 23, 42, var(--overlay-card-opacity, 0.62));
  --article-editor-title-color: #f8fafc;
}

.article-editor-outline {
  display: flex;
  flex: 0 0 260px;
  flex-direction: column;
  max-height: 720px;
  border: 1px solid var(--article-editor-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--article-editor-panel-bg, var(--el-bg-color-overlay));
  background-color: var(--article-editor-panel-bg-color, var(--el-bg-color-overlay));
  color: var(--article-editor-text-primary);
}

.article-editor-outline__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid var(--article-editor-border);
  color: var(--article-editor-title-color);
  font-size: 14px;
  font-weight: 600;
}

.article-editor-outline__list {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  padding: 8px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.article-editor-outline__item {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  min-height: 32px;
  border: none;
  border-radius: 6px;
  padding: 0 8px;
  background: transparent;
  color: var(--article-editor-text-secondary);
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.article-editor-outline__item:hover,
.article-editor-outline__item:focus-visible {
  outline: none;
  background: var(--article-editor-hover-bg);
  color: var(--el-color-primary);
}

.article-editor-outline__item.is-active {
  color: var(--el-color-primary);
}

.article-editor-outline__item.is-active .article-editor-outline__marker {
  color: var(--el-color-primary);
}

.article-editor-outline__indicator {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 0;
  z-index: 0;
  height: 0;
  border-radius: 6px;
  opacity: 0;
  pointer-events: none;
  background: var(--article-editor-hover-bg);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  transition:
    top 0.18s ease,
    height 0.18s ease,
    opacity 0.14s ease;
}

.article-editor-outline__item--level-2 {
  padding-left: 18px;
}

.article-editor-outline__item--level-3 {
  padding-left: 28px;
}

.article-editor-outline__item--level-4 {
  padding-left: 38px;
}

.article-editor-outline__marker {
  flex: 0 0 auto;
  min-width: 24px;
  color: var(--article-editor-text-tertiary);
  font-size: 11px;
  font-weight: 700;
}

.article-editor-outline__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-editor-outline__empty {
  padding: 18px 12px;
  color: var(--article-editor-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.editor-wrapper {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  border-radius: 12px;
  overflow: hidden;
  background: var(--article-editor-panel-bg);
  background-color: var(--article-editor-panel-bg-color);
}

.article-editor-title-area {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  flex: 0 0 var(--article-editor-title-area-height);
  width: 100%;
  height: var(--article-editor-title-area-height);
  min-height: var(--article-editor-title-area-height);
  box-sizing: border-box;
  overflow: hidden;
  background: var(--article-editor-panel-bg);
  background-color: var(--article-editor-panel-bg-color);
}

.article-editor-title-area__editor {
  min-width: 0;
  min-height: var(--article-editor-title-area-height);
  padding: 14px 18px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.article-editor-title-input :deep(.el-input__wrapper) {
  min-height: 40px;
  padding: 0;
  box-shadow: none;
  background: transparent;
}

.article-editor-title-input :deep(.el-input__inner) {
  height: 40px;
  color: var(--el-text-color-primary);
  font-size: 22px;
  font-weight: 700;
  line-height: 40px;
}

.article-editor-title-input :deep(.el-input__inner)::placeholder {
  color: var(--el-text-color-placeholder);
  font-weight: 600;
}

.editor-wrapper.milkdown-markdown-editor--page-fullscreen,
.editor-wrapper:fullscreen {
  --article-editor-panel-bg: var(--el-bg-color);
  --article-editor-panel-bg-color: var(--el-bg-color);
  --milkdown-markdown-editor-bg: var(--el-bg-color);
  --milkdown-markdown-editor-bg-color: var(--el-bg-color);
  --milkdown-markdown-editor-toolbar-bg: var(--el-bg-color-overlay);
  --milkdown-markdown-editor-toolbar-bg-color: var(--el-bg-color-overlay);
  --milkdown-markdown-editor-content-bg: var(--el-bg-color);
  --milkdown-markdown-editor-content-bg-color: var(--el-bg-color);
  position: fixed;
  inset: 0;
  z-index: 3000;
  width: 100vw !important;
  height: 100dvh !important;
  border-radius: 0;
  background: var(--el-bg-color);
  background-color: var(--el-bg-color);
}

.editor-wrapper:fullscreen {
  position: fixed;
}

.editor-wrapper.milkdown-markdown-editor--page-fullscreen :deep(.milkdown-markdown-editor),
.editor-wrapper:fullscreen :deep(.milkdown-markdown-editor) {
  width: 100% !important;
  height: 100% !important;
  border-radius: 0;
  background: var(--el-bg-color);
  background-color: var(--el-bg-color);
}

.editor-wrapper--markdown-split :deep(.milkdown-markdown-editor__content),
.editor-wrapper--html-split :deep(.milkdown-markdown-editor__content),
.editor-wrapper--mindmap-split :deep(.milkdown-markdown-editor__content) {
  flex: 1 1 auto;
  width: 50% !important;
  max-width: 50%;
}

.editor-wrapper--markdown-split :deep(.milkdown-markdown-editor),
.editor-wrapper--html-split :deep(.milkdown-markdown-editor),
.editor-wrapper--mindmap-split :deep(.milkdown-markdown-editor) {
  background: var(--article-editor-panel-bg);
  background-color: var(--article-editor-panel-bg-color);
}

.editor-wrapper--markdown-full :deep(.milkdown-markdown-editor__content),
.editor-wrapper--html-full :deep(.milkdown-markdown-editor__content),
.editor-wrapper--mindmap-full :deep(.milkdown-markdown-editor__content) {
  visibility: hidden;
  pointer-events: none;
}

.markdown-editor-overlay,
.html-editor-overlay,
.mindmap-editor-overlay {
  position: absolute;
  inset: var(--editor-preview-top-offset, var(--editor-content-top-offset, 0px)) 0
    var(--editor-content-bottom-offset, 24px) 0;
  z-index: 2;
}

.markdown-editor-overlay {
  display: flex;
  flex-direction: column;
  overflow: auto;
  background: var(--article-editor-panel-bg);
  background-color: var(--article-editor-panel-bg-color);
}

.editor-wrapper--markdown-split .markdown-editor-overlay,
.editor-wrapper--html-split .html-editor-overlay,
.editor-wrapper--mindmap-split .mindmap-editor-overlay {
  left: 50%;
  border-left: 1px solid
    color-mix(in srgb, var(--el-border-color) 88%, var(--el-text-color-secondary));
  box-shadow: inset 1px 0 0
    color-mix(in srgb, var(--article-editor-panel-bg-color) 70%, transparent);
}

.markdown-editor-overlay__title {
  flex: 0 0 auto;
  min-height: var(--article-editor-title-area-height);
  padding: 14px 18px;
  box-sizing: border-box;
  overflow: hidden;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--article-editor-title-color, var(--el-text-color-primary));
  font-size: 22px;
  font-weight: 700;
  line-height: 40px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.markdown-editor-overlay__content {
  flex: 1 1 auto;
  min-height: 0;
  padding: 20px 24px;
  box-sizing: border-box;
}

.html-editor-overlay {
  overflow: auto;
  background: var(--article-editor-panel-bg);
  background-color: var(--article-editor-panel-bg-color);
}

.html-editor-overlay__content {
  min-height: 100%;
  margin: 0;
  padding: 20px 24px;
  box-sizing: border-box;
  color: var(--el-text-color-primary);
  font:
    13px/1.7 ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    'Liberation Mono',
    monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.dark .html-editor-overlay__content {
  color: #ffffff;
}

.mindmap-editor-overlay :deep(.markdown-mindmap) {
  min-height: 100%;
  height: 100%;
  border: none;
  border-radius: 0;
}

.article-milkdown-editor {
  width: 100%;
  height: 720px;
}

.article-milkdown-editor:deep(.milkdown-markdown-editor__toolbar-scroll) {
  gap: 1px;
}

.article-editor-actions {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.article-editor-status {
  margin-bottom: 0;
}

.article-editor-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 1;
  min-width: min(100%, 420px);
}

.article-editor-buttons__main {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}

.article-editor-buttons :deep(.el-icon + span) {
  margin-left: 3px;
}

.article-ai-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.article-ai-panel__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.article-ai-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.article-ai-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.article-ai-section__header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.article-ai-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.article-ai-field__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.article-ai-field p,
.article-ai-summary {
  margin: 0;
  color: var(--el-text-color-primary);
  line-height: 1.7;
}

.article-ai-muted,
.article-ai-empty {
  color: var(--el-text-color-secondary);
}

.article-ai-status {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.article-ai-empty {
  padding: 32px 0;
  text-align: center;
}

.article-ai-content-preview {
  max-height: 420px;
  margin: 0;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-primary);
  font:
    13px/1.7 ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    'Liberation Mono',
    monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (--mobile-viewport) {
  .article-editor-metadata-grid {
    grid-template-columns: 1fr;
  }

  .editor-workspace {
    flex-direction: column;
  }

  .article-editor-outline {
    flex: none;
    max-height: 260px;
  }

  .markdown-editor-overlay__content,
  .html-editor-overlay__content {
    padding: 16px;
  }

  .article-milkdown-editor {
    height: 560px;
  }

  .article-editor-actions {
    align-items: stretch;
  }

  .article-editor-buttons {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .article-editor-buttons__main {
    width: 100%;
  }

  .article-ai-panel__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .article-ai-panel__actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }
}
</style>

<style scoped>
/* 稿纸沿用文章管理的细线、留白和中性色。 */
.page-container.writing-sheet {
  --writing-bg: var(--el-bg-color, #fff);
  --writing-ink: var(--el-text-color-primary, #171717);
  --writing-muted: var(--el-text-color-secondary, #8a8a8a);
  --writing-line: var(--el-border-color-lighter, #e8e8e8);
  --writing-soft: var(--el-fill-color-light, #fafafa);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--writing-line);
  border-radius: 11px;
  background: var(--writing-bg);
  color: var(--writing-ink);
  font:
    13px/1.5 'PingFang SC',
    'Microsoft YaHei',
    system-ui,
    sans-serif;
}
.writing-head {
  display: flex;
  align-items: center;
  flex: none;
  gap: 10px;
  min-height: 54px;
  padding: 8px 14px 8px 10px;
  border-bottom: 1px solid var(--writing-line);
}
.writing-head button {
  cursor: pointer;
  font: inherit;
}
.writing-back,
.writing-panel-toggle {
  flex: none;
  padding: 5px 8px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--writing-muted);
}
.writing-back:hover,
.writing-panel-toggle:hover,
.writing-panel-toggle[aria-pressed='true'] {
  background: var(--writing-soft);
  color: var(--writing-ink);
}
.writing-divider {
  width: 1px;
  height: 16px;
  background: var(--writing-line);
}
.writing-name {
  min-width: 0;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}
.writing-save-state {
  flex: none;
  padding: 3px 7px;
  border: 0;
  border-radius: 3px;
  background: var(--writing-soft);
  color: var(--writing-muted);
  font-size: 10.5px !important;
}
.writing-panel-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}
.writing-save-state.is-dirty {
  background: color-mix(in srgb, #e3769b 10%, var(--writing-bg));
  color: #d46288;
}
.writing-head-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.writing-head-actions .el-button {
  margin: 0;
  border-radius: 5px;
  font-size: 12px;
}
.writing-head-actions .el-button--primary {
  --el-button-bg-color: #e3769b;
  --el-button-border-color: #e3769b;
  --el-button-hover-bg-color: #d46288;
  --el-button-hover-border-color: #d46288;
}
.writing-pane-switch {
  display: flex;
  flex: none;
  padding: 2px;
  border: 1px solid var(--writing-line);
  border-radius: 6px;
}
.writing-pane-switch button {
  padding: 3px 9px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--writing-muted);
  font-size: 12px;
}
.writing-pane-switch button.is-active {
  background: var(--writing-soft);
  color: var(--writing-ink);
}
.writing-sheet .article-editor-shell {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  gap: 0;
}
.writing-sheet :deep(.page-section-shell__body) {
  display: flex;
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 0;
}
.writing-sheet :deep(.el-skeleton) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 24px;
}
.writing-sheet :deep(.el-skeleton__content) {
  display: flex;
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 0;
}
.writing-form {
  display: grid;
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 0;
  grid-template-columns: 168px minmax(0, 1fr) 264px;
  grid-template-rows: auto minmax(0, 1fr) auto;
}
.writing-sheet--no-props .writing-form {
  grid-template-columns: 168px minmax(0, 1fr) 0;
}
.writing-sheet--no-props .article-editor-properties {
  display: none;
}
.writing-sheet--no-outline .writing-form {
  grid-template-columns: 0 minmax(0, 1fr) 264px;
}
.writing-sheet--no-outline.writing-sheet--no-props .writing-form {
  grid-template-columns: 0 minmax(0, 1fr) 0;
}
.writing-sheet .editor-form-item {
  min-width: 0;
  min-height: 0;
  margin: 0;
  display: contents;
}
.writing-sheet .editor-form-item :deep(.el-form-item__content) {
  display: contents;
}
.writing-sheet .editor-workspace {
  --article-editor-panel-bg: var(--writing-bg);
  --article-editor-panel-bg-color: var(--writing-bg);
  --article-editor-border: var(--writing-line);
  --article-editor-text-primary: var(--writing-ink);
  --article-editor-text-secondary: var(--writing-muted);
  --article-editor-title-color: var(--writing-ink);
  --article-editor-hover-bg: var(--writing-soft);
  display: contents;
}
.writing-sheet .article-editor-outline {
  grid-column: 1;
  grid-row: 2;
  min-width: 0;
  max-height: none;
  border-top: 0;
  border-bottom: 0;
  border-left: 0;
  border-right: 1px solid var(--writing-line);
  border-radius: 0;
  background: var(--writing-soft);
}
.writing-sheet .article-editor-outline__header {
  min-height: 42px;
  border: 0;
  color: var(--writing-muted);
  font-size: 11px;
  font-weight: 400;
}
.writing-sheet .article-editor-outline__item {
  min-height: 29px;
  gap: 5px;
  font-size: 11.5px;
}
.writing-sheet .article-editor-outline__marker {
  min-width: 18px;
  font-size: 9.5px;
  font-weight: 400;
}
.writing-sheet .article-editor-outline__empty {
  font-size: 11px;
}
.writing-sheet .editor-wrapper {
  display: contents;
}
.writing-sheet .editor-wrapper.milkdown-markdown-editor--page-fullscreen,
.writing-sheet .editor-wrapper:fullscreen {
  display: block;
}
.writing-sheet :deep(.milkdown-markdown-editor) {
  display: contents;
}
.writing-sheet .editor-wrapper.milkdown-markdown-editor--page-fullscreen :deep(.milkdown-markdown-editor),
.writing-sheet .editor-wrapper:fullscreen :deep(.milkdown-markdown-editor) {
  display: flex;
}
.writing-sheet :deep(.article-milkdown-editor) {
  display: contents;
}
.writing-sheet :deep(.milkdown-markdown-editor__toolbar) {
  grid-column: 1 / -1;
  grid-row: 1;
  min-width: 0;
  border: 0;
  border-bottom: 1px solid var(--writing-line);
  border-radius: 0;
}
.writing-sheet :deep(.milkdown-markdown-editor__content) {
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
  min-height: 0;
  height: 100%;
  border-radius: 0;
}
.writing-sheet :deep(.milkdown-markdown-editor__footer) {
  grid-column: 1 / -1;
  grid-row: 3;
  border: 0;
  border-top: 1px solid var(--writing-line);
  border-radius: 0;
}
.writing-sheet .markdown-editor-overlay,
.writing-sheet .html-editor-overlay,
.writing-sheet .mindmap-editor-overlay {
  position: relative;
  inset: auto;
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
  min-height: 0;
}
.writing-sheet :deep(.milkdown-markdown-editor__toolbar) {
  border-radius: 0;
}
.writing-sheet :deep(.milkdown-markdown-editor__content-header) {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
}
.writing-sheet .article-editor-title-area {
  display: block;
  height: auto;
  min-height: 0;
  overflow: visible;
}
.writing-sheet .article-editor-title-area__editor {
  min-height: 0;
  padding: 44px 40px 0;
  border: 0;
}
.writing-sheet .article-editor-title-input :deep(.el-input__inner) {
  height: 44px;
  font-size: 29px;
  font-weight: 600;
  line-height: 1.36;
}
.writing-sheet :deep(.ProseMirror) {
  --markdown-content-font-size: 16px;
  --markdown-content-line-height: 1.92;
  --markdown-content-paragraph-margin: 0 0 1.1em;
  --markdown-content-h2-font-size: 1.3em;
  --markdown-content-h3-font-size: 1.1em;
  --markdown-content-heading-margin: 2.1em 0 0.72em;
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  padding: 26px 40px 96px;
}
.writing-sheet :deep(.milkdown-markdown-editor__source) {
  max-width: 700px;
  min-height: 300px;
  margin: 0 auto;
  padding: 26px 40px 96px;
  font-size: 15px;
  line-height: 1.92;
}
.writing-sheet .markdown-editor-overlay__title {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  padding: 44px 40px 22px;
  border: 0;
  font-size: 29px;
  line-height: 1.36;
  white-space: normal;
  overflow-wrap: anywhere;
}
.writing-sheet .markdown-editor-overlay__content {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  padding: 26px 40px 96px;
  font-size: 17px;
  line-height: 2.02;
}
.writing-sheet .article-editor-properties {
  grid-column: 3;
  grid-row: 2;
  min-width: 0;
  padding: 18px 16px 28px;
  overflow-y: auto;
  border-left: 1px solid var(--writing-line);
  scrollbar-width: thin;
}
.writing-props-title {
  margin-bottom: 18px;
  color: var(--writing-muted);
  font-size: 11px;
}
.writing-sheet .article-editor-metadata-grid {
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
}
.writing-sheet .article-editor-properties :deep(.el-form-item) {
  margin-bottom: 16px;
}
.writing-sheet .article-editor-properties :deep(.el-form-item__label) {
  margin-bottom: 7px;
  color: var(--writing-muted);
  font-size: 11.5px;
  line-height: 1.5;
}
.writing-sheet .article-editor-properties :deep(.el-input__wrapper),
.writing-sheet .article-editor-properties :deep(.el-select__wrapper),
.writing-sheet .article-editor-properties :deep(.el-textarea__inner) {
  border-radius: 5px;
  font-size: 12px;
}
.writing-publication-state {
  margin-bottom: 20px;
  color: var(--writing-muted);
  font-size: 12px;
}
.writing-props-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.writing-props-actions .el-button {
  flex: 1;
  margin: 0;
}
.writing-delete {
  margin-top: 18px;
  font-size: 12px;
}
@container (max-width: 1050px) {
  .writing-form {
    grid-template-columns: 136px minmax(0, 1fr) 238px;
  }
  .writing-sheet--no-props .writing-form {
    grid-template-columns: 136px minmax(0, 1fr) 0;
  }
  .writing-sheet--no-outline .writing-form {
    grid-template-columns: 0 minmax(0, 1fr) 238px;
  }
  .writing-sheet--no-outline.writing-sheet--no-props .writing-form {
    grid-template-columns: 0 minmax(0, 1fr) 0;
  }
  .writing-name {
    max-width: 100px;
  }
}
@container (max-width: 800px) {
  .writing-form {
    grid-template-columns: minmax(0, 1fr);
  }
  .writing-sheet .article-editor-outline,
  .writing-sheet .article-editor-properties {
    grid-column: 1;
    grid-row: 2;
    z-index: 5;
    width: min(320px, 88%);
    height: 100%;
    max-height: none;
    border: 1px solid var(--writing-line);
    border-radius: 0;
    box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
  }
  .writing-sheet .article-editor-outline {
    justify-self: start;
    border-right: 1px solid var(--writing-line);
  }
  .writing-sheet .article-editor-properties {
    justify-self: end;
    border-left: 1px solid var(--writing-line);
    padding: 14px 12px 18px;
  }
  .writing-sheet .article-editor-outline__header {
    flex: none;
  }
  .writing-sheet :deep(.milkdown-markdown-editor__footer) {
    position: sticky;
    bottom: 0;
    z-index: 8;
    align-self: end;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    padding: 0 8px;
    overflow: hidden;
  }
  .writing-sheet :deep(.milkdown-markdown-editor__footer-left) {
    flex: none;
  }
  .writing-sheet :deep(.milkdown-markdown-editor__footer-right) {
    flex: 1;
    flex-wrap: nowrap;
    gap: 6px;
    overflow: hidden;
  }
  .writing-sheet :deep(.milkdown-markdown-editor__footer-item) {
    min-height: 28px;
    font-size: 10px;
  }
  .writing-sheet--no-outline .article-editor-outline,
  .writing-sheet--no-props .article-editor-properties {
    display: none;
  }
  .writing-head {
    flex-wrap: nowrap;
    gap: 4px;
    min-height: 46px;
    padding: 5px 7px;
  }
  .writing-head-actions {
    flex-wrap: nowrap;
    gap: 3px;
    min-width: 0;
  }
  .writing-head-actions .el-button { padding: 5px 7px; }
  .writing-pane-switch button { padding-right: 6px; padding-left: 6px; }
  .writing-panel-toggle { width: 25px; height: 26px; padding: 3px; }
  .writing-divider { display: none; }
  .writing-name {
    display: none;
  }
  .writing-sheet .article-editor-title-area__editor {
    padding: 32px 24px 0;
  }
  .writing-sheet :deep(.ProseMirror),
  .writing-sheet :deep(.milkdown-markdown-editor__source),
  .writing-sheet .markdown-editor-overlay__content {
    padding-right: 24px;
    padding-left: 24px;
  }
}
@container (max-width: 620px) {
  .writing-form {
    grid-template-columns: minmax(0, 1fr);
  }
  .writing-head-actions {
    flex: 0 1 auto;
    justify-content: flex-end;
  }
}
@container (max-width: 420px) {
  .writing-save-state { display: none; }
  .writing-head-actions .el-button { padding: 4px 5px; font-size: 10px; }
  .writing-pane-switch button { padding-right: 4px; padding-left: 4px; font-size: 10px; }
}
</style>
