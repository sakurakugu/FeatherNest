<script setup lang="ts">
import '@feathernest/ui/styles/manager.css'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useInfiniteScroll, useStorage, watchDebounced } from '@vueuse/core'
import {
  ElButton,
  ElIcon,
  ElImageViewer,
  ElInput,
  ElMessage,
  ElPopconfirm,
  ElPopover,
  ElSkeleton,
  ElTooltip,
} from 'element-plus'
import { Delete, Filter, Plus, RefreshLeft, Search } from '@element-plus/icons-vue'
import { 获取API错误消息 } from '@feathernest/api'
import {
  BaseDialog,
  PencilEditIcon,
  SortDirectionIcon,
  格式化完整时间,
  格式化相对时间,
} from '@feathernest/ui'
import { 上传动态图片, 删除动态图片, 获取动态图片, 获取我的动态, 重新排序动态图片 } from '../api'
import { 解析管理文件URL地址 } from '../managedFile'
import { 使用动态存储 } from '../store'
import type { MomentImageRecord, MomentSortField, UserMoment } from '../types'
import { 使用保存快捷键 } from '../使用保存快捷键'
import MomentImageComposer from '../components/动态图片编辑器.vue'

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

const emit = defineEmits<{ 'moment-count-change': [count: number] }>()
const router = useRouter()
const store = 使用动态存储()

const 每页条数 = 20
const 动态图片上限 = 20

/* ==========================================================================
   列表状态
   ========================================================================== */
const 列表 = ref<UserMoment[]>([])
const 总数 = ref(0)
const 当前页 = ref(1)
const 页数 = ref(1)
const 初次加载 = ref(true)
const 刷新中 = ref(false)
const 加载更多中 = ref(false)
const 加载失败 = ref(false)
const 失败请求为追加 = ref(false)
const 列表容器 = ref<HTMLElement | null>(null)
const 视图 = useStorage<'table' | 'cards'>('feathernest.moment-manager.view', 'table')
const 回收站模式 = ref(false)
const 已发布总数 = ref(0)
const 有图总数 = ref(0)
const 回收站总数 = ref(0)

/* ==========================================================================
   筛选与排序
   ========================================================================== */
const 搜索词 = ref('')
const 已应用搜索 = ref('')
const 内容选项 = [
  { value: 'all', label: '全部' },
  { value: 'images', label: '含图片' },
  { value: 'text', label: '纯文字' },
] as const
type 内容筛选值 = (typeof 内容选项)[number]['value']
const 当前内容 = ref<内容筛选值>('all')
const 排序字段 = ref<MomentSortField | ''>('')
const 排序方向 = ref<'asc' | 'desc'>('desc')
const 排序选项 = computed<Array<{ value: MomentSortField; label: string }>>(() => {
  const 公共选项: Array<{ value: MomentSortField; label: string }> = [
    { value: 'content', label: '内容长度' },
    { value: 'image_count', label: '图片数量' },
    { value: 'word_count', label: '字数' },
    { value: 'view_count', label: '浏览量' },
    { value: 'like_count', label: '点赞数' },
    { value: 'title', label: '标题' },
  ]
  return 回收站模式.value
    ? [
        { value: 'deleted_at', label: '删除时间' },
        { value: 'published_at', label: '发布时间' },
        ...公共选项,
      ]
    : [
        { value: 'published_at', label: '发布时间' },
        { value: 'last_edited_at', label: '最近编辑' },
        ...公共选项,
      ]
})
const 是否筛选 = computed(() => Boolean(已应用搜索.value) || 当前内容.value !== 'all')
const 内容页签 = computed<Array<{ value: 内容筛选值; label: string; count: number }>>(() => [
  { value: 'all', label: '全部', count: 已发布总数.value },
  { value: 'images', label: '含图片', count: 有图总数.value },
  { value: 'text', label: '纯文字', count: Math.max(已发布总数.value - 有图总数.value, 0) },
])

/* ==========================================================================
   列配置
   ========================================================================== */
const 动态列 = [
  { value: 'title', label: '动态', width: 'minmax(180px, 1.4fr)', minWidth: 180 },
  { value: 'content', label: '内容', width: 'minmax(200px, 2fr)', minWidth: 200 },
  { value: 'images', label: '图片', width: '128px', minWidth: 128 },
  { value: 'words', label: '字数', width: '76px', minWidth: 76 },
  { value: 'stats', label: '浏览 / 点赞', width: '112px', minWidth: 112 },
  { value: 'date', label: '发布时间', width: '140px', minWidth: 140 },
  { value: 'updated_at', label: '最近编辑', width: '140px', minWidth: 140 },
] as const
type 动态列值 = (typeof 动态列)[number]['value']
const 可见列 = useStorage<动态列值[]>('feathernest.moment-manager.columns.v2', [
  'title',
  'content',
  'images',
  'words',
  'date',
])
const 展示列 = computed(() => 动态列.filter((列) => 可见列.value.includes(列.value)))
const 网格列 = computed(() => [...展示列.value.map((列) => 列.width), '96px'].join(' '))
const 表格最小宽度 = computed(
  () => `${展示列.value.reduce((总宽, 列) => 总宽 + 列.minWidth + 16, 96)}px`,
)

function 切换列(列: 动态列值) {
  if (列 === 'title') return
  可见列.value = 可见列.value.includes(列)
    ? 可见列.value.filter((项) => 项 !== 列)
    : [...可见列.value, 列]
}

function 列标题(列: (typeof 动态列)[number]) {
  if (列.value === 'date') return 回收站模式.value ? '删除时间' : '发布时间'
  return 列.label
}

function 列排序字段(列值: 动态列值): MomentSortField | null {
  if (列值 === 'title') return 'title'
  if (列值 === 'content') return 'content'
  if (列值 === 'images') return 'image_count'
  if (列值 === 'words') return 'word_count'
  if (列值 === 'stats') return 'view_count'
  if (列值 === 'date') return 回收站模式.value ? 'deleted_at' : 'published_at'
  return 'last_edited_at'
}

function 表头排序(列值: 动态列值) {
  const 字段 = 列排序字段(列值)
  if (字段) 切换排序(字段)
}

/* ==========================================================================
   页头与空状态
   ========================================================================== */
const 页头统计 = computed(() =>
  回收站模式.value
    ? `共 ${回收站总数.value} 条已删除动态 · 删除后保留 30 天`
    : `共 ${已发布总数.value} 条动态 · ${有图总数.value} 条含图片`,
)
const 还有更多 = computed(() => 当前页.value < 页数.value)
const 空状态文案 = computed(() => {
  if (加载失败.value) return '动态加载失败，请稍后重试'
  if (回收站模式.value) return 已应用搜索.value ? '回收站里没有匹配的动态' : '回收站暂无动态'
  if (是否筛选.value) return '暂无符合条件的动态'
  return '还没有发布过动态，点右上角「写动态」开始记录吧'
})

/* ==========================================================================
   数据请求
   ========================================================================== */
let 请求序号 = 0

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
    const 数据 = await 获取我的动态(请求页, 每页条数, 回收站模式.value, {
      keyword: 已应用搜索.value || undefined,
      hasImages: 当前内容.value === 'all' ? undefined : 当前内容.value === 'images',
      sortBy: 排序字段.value || undefined,
      sortOrder: 排序字段.value ? 排序方向.value : undefined,
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
    console.error('[动态管理] 加载动态列表失败', { page: 请求页, 追加, 错误 })
    ElMessage.error(获取API错误消息(错误, '加载动态失败'))
  } finally {
    if (序号 === 请求序号) {
      刷新中.value = false
      加载更多中.value = false
      初次加载.value = false
    }
  }
}

/** 角标统计：已发布、含图片与回收站数量 */
async function 刷新统计() {
  try {
    const [全部, 有图, 回收站] = await Promise.all([
      获取我的动态(1, 1, false),
      获取我的动态(1, 1, false, { hasImages: true }),
      获取我的动态(1, 1, true),
    ])
    已发布总数.value = 全部.total
    有图总数.value = 有图.total
    回收站总数.value = 回收站.total
    emit('moment-count-change', 全部.total)
  } catch (错误) {
    console.error('[动态管理] 加载动态统计失败', 错误)
  }
}

/* ==========================================================================
   筛选 / 排序 / 回收站
   ========================================================================== */
function 切换内容(值: 内容筛选值) {
  if (当前内容.value === 值) return
  当前内容.value = 值
}

function 切换排序(字段: MomentSortField) {
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

function 排序图标方向(字段: MomentSortField | '' | null): 'asc' | 'desc' | '' {
  if (!字段 || 排序字段.value !== 字段) return ''
  return 排序方向.value
}

function 当前排序列标签() {
  return 排序选项.value.find((项) => 项.value === 排序字段.value)?.label || '发布时间'
}

function 清除排序() {
  排序字段.value = ''
  排序方向.value = 'desc'
}

function 切换回收站() {
  回收站模式.value = !回收站模式.value
  当前内容.value = 'all'
  排序字段.value = ''
  排序方向.value = 'desc'
  搜索词.value = ''
  已应用搜索.value = ''
}

watch([回收站模式, 当前内容, 已应用搜索, 排序字段, 排序方向], () => {
  void 拉取列表()
})

watchDebounced(
  搜索词,
  (值) => {
    已应用搜索.value = 值.trim()
  },
  { debounce: 300 },
)

useInfiniteScroll(列表容器, () => 拉取列表(true), {
  distance: 160,
  canLoadMore: () =>
    还有更多.value && !初次加载.value && !刷新中.value && !加载更多中.value && !加载失败.value,
})

/* ==========================================================================
   撰写弹窗
   ========================================================================== */
const 撰写弹窗打开 = ref(false)
const 编辑中 = ref<UserMoment | null>(null)
const 草稿表单 = ref({ title: '', content: '' })
const 图片列表 = ref<MomentImageRecord[]>([])
const 草稿加载中 = ref(false)
const 图片加载中 = ref(false)
const 图片上传中 = ref(false)
const 图片展开 = ref(false)
const 提交中 = ref(false)
const 预览图片地址 = ref('')

const 是否编辑已发布 = computed(() => 编辑中.value !== null)
const 当前草稿ID = computed(() => store.draft?.id || '')
const 当前编辑动态ID = computed(() =>
  是否编辑已发布.value ? 编辑中.value?.id || '' : 当前草稿ID.value,
)
const 正文字数 = computed(() => 草稿表单.value.content.length)
const 超出字数 = computed(() => 正文字数.value > 1000)

let 自动保存定时器: number | null = null

function 停止自动保存() {
  if (自动保存定时器) {
    window.clearTimeout(自动保存定时器)
    自动保存定时器 = null
  }
}

/** 未发布内容输入后自动落草稿，避免关闭弹窗丢内容 */
function 安排自动保存() {
  if (是否编辑已发布.value) {
    停止自动保存()
    return
  }
  停止自动保存()
  自动保存定时器 = window.setTimeout(async () => {
    if (是否编辑已发布.value) return
    if (!草稿表单.value.content.trim() && !草稿表单.value.title.trim()) return
    try {
      await store.保存草稿({
        title: 草稿表单.value.title,
        content: 草稿表单.value.content,
      })
    } catch (错误) {
      console.error('[动态管理] 草稿自动保存失败', 错误)
    }
  }, 1000)
}

async function 加载草稿() {
  草稿加载中.value = true
  try {
    const 草稿 = await store.获取草稿()
    if (是否编辑已发布.value) return
    if (草稿) {
      草稿表单.value = { title: 草稿.title || '', content: 草稿.content }
      await 加载图片(草稿.id)
      图片展开.value = 图片列表.value.length > 0
      return
    }
    草稿表单.value = { title: '', content: '' }
    图片列表.value = []
    图片展开.value = false
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '加载草稿失败'))
  } finally {
    草稿加载中.value = false
  }
}

async function 加载图片(动态ID: string) {
  if (!动态ID) {
    图片列表.value = []
    return
  }
  图片加载中.value = true
  try {
    图片列表.value = await 获取动态图片(动态ID)
  } catch (错误) {
    图片列表.value = []
    ElMessage.error(获取API错误消息(错误, '加载动态图片失败'))
  } finally {
    图片加载中.value = false
  }
}

async function 确保草稿ID(): Promise<string> {
  if (当前编辑动态ID.value) return 当前编辑动态ID.value
  const 草稿 = await store.保存草稿({
    title: 草稿表单.value.title,
    content: 草稿表单.value.content,
  })
  return 草稿.id
}

async function 打开撰写() {
  停止自动保存()
  编辑中.value = null
  草稿表单.value = { title: '', content: '' }
  图片列表.value = []
  图片展开.value = false
  撰写弹窗打开.value = true
  await 加载草稿()
}

async function 打开编辑(动态: UserMoment) {
  if (回收站模式.value) return
  停止自动保存()
  编辑中.value = 动态
  草稿表单.value = { title: 动态.title || '', content: 动态.content }
  图片列表.value = 动态.images
  图片展开.value = 动态.images.length > 0
  撰写弹窗打开.value = true
  await 加载图片(动态.id)
}

function 重置撰写状态() {
  停止自动保存()
  编辑中.value = null
  草稿表单.value = { title: '', content: '' }
  图片列表.value = []
  图片展开.value = false
}

async function 回到草稿() {
  停止自动保存()
  编辑中.value = null
  草稿表单.value = { title: '', content: '' }
  图片列表.value = []
  图片展开.value = false
  await 加载草稿()
}

/** 退出已发布动态的编辑：关闭弹窗后由 @closed 清理表单状态 */
function 取消编辑() {
  停止自动保存()
  撰写弹窗打开.value = false
}

async function 保存草稿() {
  if (!草稿表单.value.content.trim()) {
    ElMessage.warning('内容不能为空')
    return
  }
  try {
    停止自动保存()
    await store.保存草稿({
      title: 草稿表单.value.title,
      content: 草稿表单.value.content,
    })
    ElMessage.success('草稿已保存')
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '保存草稿失败'))
  }
}

async function 清空草稿() {
  停止自动保存()
  try {
    if (当前草稿ID.value && 图片列表.value.length > 0) {
      await Promise.allSettled(
        图片列表.value.map((图片) => 删除动态图片(当前草稿ID.value, 图片.id)),
      )
    }
    await store.保存草稿({ title: '', content: '' })
    草稿表单.value = { title: '', content: '' }
    图片列表.value = []
    图片展开.value = false
    ElMessage.success('草稿已清空')
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '清空草稿失败'))
  }
}

async function 提交() {
  if (!草稿表单.value.content.trim()) {
    ElMessage.warning('内容不能为空')
    return
  }
  if (超出字数.value) {
    ElMessage.warning('内容超过 1000 字限制')
    return
  }
  if (提交中.value) return
  提交中.value = true
  停止自动保存()
  try {
    if (是否编辑已发布.value && 编辑中.value) {
      await store.更新动态(编辑中.value.id, {
        title: 草稿表单.value.title,
        content: 草稿表单.value.content,
      })
      ElMessage.success('动态已更新')
    } else {
      await store.发布({
        title: 草稿表单.value.title,
        content: 草稿表单.value.content,
      })
      ElMessage.success('动态已发布')
    }
    重置撰写状态()
    撰写弹窗打开.value = false
    await 拉取列表()
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, 是否编辑已发布.value ? '更新动态失败' : '发布动态失败'))
  } finally {
    提交中.value = false
  }
}

async function 保存快捷键触发() {
  if (是否编辑已发布.value) {
    await 提交()
    return
  }
  await 保存草稿()
}

使用保存快捷键({
  enabled: () => 撰写弹窗打开.value && !提交中.value,
  onSave: 保存快捷键触发,
})

/* ==========================================================================
   图片
   ========================================================================== */
async function 上传图片(文件列表: globalThis.File[]) {
  const 图片文件 = 文件列表.filter((文件) => 文件.type.startsWith('image/'))
  if (图片文件.length === 0) {
    ElMessage.warning('只能上传图片文件')
    return
  }
  const 剩余数量 = 动态图片上限 - 图片列表.value.length
  if (剩余数量 <= 0) {
    ElMessage.warning(`单条动态最多只能上传 ${动态图片上限} 张图片`)
    return
  }
  const 待上传 = 图片文件.slice(0, 剩余数量)
  if (待上传.length < 图片文件.length) {
    ElMessage.warning(`最多还能上传 ${剩余数量} 张图片`)
  }
  图片展开.value = true
  图片上传中.value = true
  try {
    const 动态ID = await 确保草稿ID()
    for (const 文件 of 待上传) {
      await 上传动态图片(动态ID, 文件)
    }
    await 加载图片(动态ID)
    ElMessage.success(`已上传 ${待上传.length} 张图片`)
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '图片上传失败'))
  } finally {
    图片上传中.value = false
  }
}

async function 删除图片(图片ID: string) {
  if (!当前编辑动态ID.value) return
  try {
    await 删除动态图片(当前编辑动态ID.value, 图片ID)
    图片列表.value = 图片列表.value.filter((图片) => 图片.id !== 图片ID)
    ElMessage.success('图片已删除')
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '删除图片失败'))
  }
}

async function 重排图片(图片ID列表: string[]) {
  if (!当前编辑动态ID.value) return
  try {
    图片列表.value = await 重新排序动态图片(当前编辑动态ID.value, 图片ID列表)
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '图片排序失败'))
  }
}

/* ==========================================================================
   删除 / 恢复
   ========================================================================== */
async function 执行删除(动态: UserMoment) {
  const 永久删除 = 回收站模式.value
  try {
    await store.删除动态(动态.id, 永久删除)
    ElMessage.success(永久删除 ? '已永久删除' : '已移入回收站')
    await 拉取列表()
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, 永久删除 ? '永久删除失败' : '移入回收站失败'))
  }
}

async function 执行恢复(动态: UserMoment) {
  try {
    await store.恢复动态(动态.id)
    ElMessage.success('已恢复动态')
    await 拉取列表()
  } catch (错误) {
    ElMessage.error(获取API错误消息(错误, '恢复动态失败'))
  }
}

/* ==========================================================================
   展示辅助
   ========================================================================== */
function 图片地址(图片: MomentImageRecord) {
  return 解析管理文件URL地址(图片.thumbnail_url || 图片.preview_url || 图片.url)
}

function 预览地址(图片: MomentImageRecord) {
  return 解析管理文件URL地址(图片.preview_url || 图片.url)
}

function 摘要(内容: string) {
  const 单行 = 内容.replace(/\s+/g, ' ').trim()
  return 单行.length > 80 ? `${单行.slice(0, 80)}…` : 单行
}

function 内容字数(内容: string) {
  return 内容.replace(/\s/g, '').length
}

/* ==========================================================================
   生命周期
   ========================================================================== */
onMounted(() => {
  void 拉取列表()
})

onBeforeUnmount(() => {
  停止自动保存()
})
</script>

<template>
  <div class="manager-page moment-manager">
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
        <h1>{{ 回收站模式 ? '回收站' : '动态管理' }}</h1>
        <p>{{ 页头统计 }}</p>
      </div>
      <div class="manager-head-actions">
        <ElButton v-if="!回收站模式" type="primary" class="manager-create" @click="打开撰写">
          <ElIcon><Plus /></ElIcon>
          <span>写动态</span>
        </ElButton>
      </div>
    </header>

    <div class="manager-toolbar">
      <div class="manager-mode-nav" role="group" aria-label="动态视图切换">
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
              :class="{ 'is-active': Boolean(排序字段) }"
              aria-label="排序动态"
            >
              <ElIcon><Filter /></ElIcon>
              <span>排序</span>
            </button>
          </template>
          <div class="manager-filter-panel">
            <div class="manager-filter-group">
              <label>排序</label>
              <div class="manager-sort-options">
                <button
                  v-for="选项 in 排序选项"
                  :key="选项.value"
                  type="button"
                  class="manager-filter-chip manager-sort-option"
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
            </div>
            <div class="manager-filter-footer">
              <span>{{
                排序字段
                  ? `按${当前排序列标签()}${排序方向 === 'asc' ? '升序' : '降序'}`
                  : '未设置排序条件'
              }}</span>
              <ElButton text size="small" @click="清除排序">清除排序</ElButton>
            </div>
          </div>
        </ElPopover>

        <label class="manager-search">
          <ElIcon><Search /></ElIcon>
          <input
            v-model="搜索词"
            type="search"
            placeholder="搜索动态标题或内容"
            aria-label="搜索动态"
            maxlength="200"
          />
        </label>
      </div>
    </div>

    <div class="manager-tabs-row">
      <nav class="manager-tabs" aria-label="动态内容">
        <button
          v-for="页签 in 内容页签"
          :key="页签.value"
          type="button"
          class="manager-tab"
          :class="{ 'is-active': 当前内容 === 页签.value }"
          :aria-pressed="当前内容 === 页签.value"
          @click="切换内容(页签.value)"
        >
          {{ 页签.label }} <small>{{ 页签.count }}</small>
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

    <ElSkeleton :loading="初次加载 && !列表.length" animated>
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
          aria-label="动态列表"
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
                @click="表头排序(列.value)"
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
                  <label v-for="列 in 动态列" :key="列.value">
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

          <div v-for="动态 in 列表" :key="动态.id" class="manager-row" role="row">
            <div v-for="列 in 展示列" :key="列.value" role="cell" class="manager-cell">
              <div v-if="列.value === 'title'" class="moment-title-cell">
                <button
                  type="button"
                  class="moment-title"
                  :disabled="回收站模式"
                  @click="打开编辑(动态)"
                >
                  {{ 动态.title || '无标题' }}
                </button>
              </div>

              <span v-else-if="列.value === 'content'" class="moment-excerpt" :title="动态.content">
                {{ 摘要(动态.content) || '（空内容）' }}
              </span>

              <div v-else-if="列.value === 'images'" class="moment-image-cell">
                <template v-if="动态.images.length">
                  <button
                    v-for="图片 in 动态.images.slice(0, 3)"
                    :key="图片.id"
                    type="button"
                    class="moment-image-thumb"
                    :title="图片.original_name"
                    :aria-label="`查看图片：${图片.original_name}`"
                    @click="预览图片地址 = 预览地址(图片)"
                  >
                    <img :src="图片地址(图片)" :alt="图片.original_name" loading="lazy" />
                  </button>
                  <span v-if="动态.images.length > 3" class="moment-image-more">
                    +{{ 动态.images.length - 3 }}
                  </span>
                </template>
                <span v-else class="moment-count">—</span>
              </div>

              <span v-else-if="列.value === 'words'" class="moment-count">
                {{ 内容字数(动态.content) }} 字
              </span>

              <span v-else-if="列.value === 'stats'" class="moment-stats">
                浏览 {{ 动态.view_count }} · 赞 {{ 动态.like_count }}
              </span>

              <ElTooltip
                v-else-if="列.value === 'date'"
                :content="格式化完整时间(回收站模式 ? 动态.deleted_at : 动态.published_at)"
                placement="top"
                popper-class="manager-date-tooltip"
              >
                <span class="manager-date">
                  {{ 格式化相对时间(回收站模式 ? 动态.deleted_at : 动态.published_at) }}
                </span>
              </ElTooltip>

              <ElTooltip
                v-else
                :content="格式化完整时间(动态.last_edited_at)"
                placement="top"
                popper-class="manager-date-tooltip"
              >
                <span class="manager-date">
                  {{ 格式化相对时间(动态.last_edited_at) }}
                </span>
              </ElTooltip>
            </div>

            <div role="cell" class="manager-fixed-actions">
              <div class="manager-ops">
                <template v-if="回收站模式">
                  <ElTooltip content="恢复动态" placement="top">
                    <button
                      type="button"
                      title="恢复动态"
                      aria-label="恢复动态"
                      @click="执行恢复(动态)"
                    >
                      <ElIcon><RefreshLeft /></ElIcon>
                    </button>
                  </ElTooltip>
                  <ElPopconfirm
                    title="确定要彻底删除这条动态吗？"
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                    @confirm="执行删除(动态)"
                  >
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
                  <ElTooltip content="编辑动态" placement="top">
                    <button
                      type="button"
                      title="编辑动态"
                      aria-label="编辑动态"
                      @click="打开编辑(动态)"
                    >
                      <ElIcon><PencilEditIcon /></ElIcon>
                    </button>
                  </ElTooltip>
                  <ElPopconfirm
                    title="确定要把这条动态移入回收站吗？"
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                    @confirm="执行删除(动态)"
                  >
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

        <!-- 卡片视图 -->
        <div v-else-if="视图 === 'cards' && 列表.length" class="manager-cards">
          <article v-for="动态 in 列表" :key="动态.id" class="manager-card moment-card">
            <div class="moment-card-kicker">
              <span class="manager-status">
                <i :class="动态.images.length ? 'manager-dot--primary' : 'manager-dot--muted'" />
                {{ 动态.images.length ? `图文 · ${动态.images.length} 张` : '纯文字' }}
              </span>
              <span>·</span>
              <span>{{ 内容字数(动态.content) }} 字</span>
              <span>·</span>
              <ElTooltip
                :content="格式化完整时间(回收站模式 ? 动态.deleted_at : 动态.published_at)"
                placement="top"
                popper-class="manager-date-tooltip"
              >
                <span>
                  {{ 回收站模式 ? '删除于' : '发布于' }}
                  {{ 格式化相对时间(回收站模式 ? 动态.deleted_at : 动态.published_at) }}
                </span>
              </ElTooltip>
            </div>
            <h3>
              <button type="button" :disabled="回收站模式" @click="打开编辑(动态)">
                {{ 动态.title || '无标题' }}
              </button>
            </h3>
            <p>{{ 摘要(动态.content) || '（空内容）' }}</p>
            <div class="moment-card-media" :class="{ 'is-empty': !动态.images.length }">
              <template v-if="动态.images.length">
                <button
                  v-for="图片 in 动态.images.slice(0, 3)"
                  :key="图片.id"
                  type="button"
                  class="moment-card-thumb"
                  :title="图片.original_name"
                  :aria-label="`查看图片 ${图片.original_name}`"
                  @click="预览图片地址 = 预览地址(图片)"
                >
                  <img :src="图片地址(图片)" :alt="图片.original_name" loading="lazy" />
                </button>
              </template>
              <span v-else class="moment-card-media-empty">纯文字动态</span>
            </div>
            <footer>
              <span>浏览 {{ 动态.view_count }} · 赞 {{ 动态.like_count }}</span>
              <div class="manager-ops">
                <template v-if="回收站模式">
                  <ElTooltip content="恢复动态" placement="top">
                    <button
                      type="button"
                      title="恢复动态"
                      aria-label="恢复动态"
                      @click="执行恢复(动态)"
                    >
                      <ElIcon><RefreshLeft /></ElIcon>
                    </button>
                  </ElTooltip>
                  <ElPopconfirm
                    title="确定要彻底删除这条动态吗？"
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                    @confirm="执行删除(动态)"
                  >
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
                  <ElTooltip content="编辑动态" placement="top">
                    <button
                      type="button"
                      title="编辑动态"
                      aria-label="编辑动态"
                      @click="打开编辑(动态)"
                    >
                      <ElIcon><PencilEditIcon /></ElIcon>
                    </button>
                  </ElTooltip>
                  <ElPopconfirm
                    title="确定要把这条动态移入回收站吗？"
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                    @confirm="执行删除(动态)"
                  >
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
            </footer>
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
            <button type="button" @click="拉取列表(失败请求为追加)">重试</button>
          </template>
          <span v-else-if="加载更多中">正在加载更多动态…</span>
          <button v-else-if="还有更多" type="button" @click="拉取列表(true)">加载更多</button>
          <span v-else-if="列表.length">已显示全部 {{ 总数 }} 条动态</span>
        </div>
      </div>
    </ElSkeleton>

    <ElImageViewer
      v-if="预览图片地址"
      :url-list="[预览图片地址]"
      teleported
      @close="预览图片地址 = ''"
    />

    <BaseDialog
      v-model="撰写弹窗打开"
      class="manager-dialog moment-dialog"
      modal-class="manager-dialog-overlay"
      width="820px"
      style="max-width: 94vw"
      :close-on-click-modal="!提交中"
      :close-on-press-escape="!提交中"
      :show-close="!提交中"
      @closed="重置撰写状态"
    >
      <template #header>
        <div class="manager-dialog-header">
          <i />
          <strong>{{ 是否编辑已发布 ? '编辑动态' : '写动态' }}</strong>
          <span>{{
            是否编辑已发布 ? '保存后立即更新到博客动态' : '发布后会出现在博客动态流'
          }}</span>
        </div>
      </template>

      <div class="manager-dialog-form moment-form">
        <div class="moment-field">
          <label class="moment-field-label" for="moment-title-input">
            <span>标题（可选）</span>
            <span class="counter">{{ 草稿表单.title.length }} / 100</span>
          </label>
          <ElInput
            id="moment-title-input"
            v-model="草稿表单.title"
            maxlength="100"
            placeholder="给这条动态起个标题，留空也可以"
            @input="安排自动保存"
          />
        </div>

        <div class="moment-field">
          <label class="moment-field-label" for="moment-content-input">
            <span>内容 <em>*</em></span>
            <span class="counter" :class="{ 'is-over': 超出字数 }">{{ 正文字数 }} / 1000</span>
          </label>
          <ElInput
            id="moment-content-input"
            v-model="草稿表单.content"
            type="textarea"
            :rows="8"
            maxlength="1000"
            resize="vertical"
            placeholder="随手写点什么，支持 Markdown"
            @input="安排自动保存"
          />
        </div>

        <MomentImageComposer
          :expanded="图片展开"
          :items="图片列表"
          :loading="图片加载中"
          :uploading="图片上传中"
          :max-count="动态图片上限"
          @toggle="图片展开 = !图片展开"
          @upload-files="上传图片"
          @delete="删除图片"
          @reorder="重排图片"
        />

        <div class="moment-draft-bar">
          <ElButton
            text
            :icon="RefreshLeft"
            :loading="草稿加载中"
            @click="是否编辑已发布 ? 回到草稿() : 加载草稿()"
          >
            {{ 是否编辑已发布 ? '回到草稿' : '刷新草稿' }}
          </ElButton>
          <span class="hint">{{
            是否编辑已发布
              ? '正在编辑已发布动态，切换会回到未发布草稿'
              : '输入内容会自动保存到草稿，不会丢失'
          }}</span>
        </div>
      </div>

      <template #footer>
        <div class="manager-dialog-footer">
          <span>{{ 是否编辑已发布 ? '保存后立即同步到博客' : 'Ctrl + S 可快速保存草稿' }}</span>
          <ElPopconfirm
            v-if="!是否编辑已发布"
            title="确定要清空当前草稿吗？"
            confirm-button-text="确定"
            cancel-button-text="取消"
            @confirm="清空草稿"
          >
            <template #reference>
              <ElButton text>清空草稿</ElButton>
            </template>
          </ElPopconfirm>
          <ElButton @click="是否编辑已发布 ? 取消编辑() : (撰写弹窗打开 = false)">
            {{ 是否编辑已发布 ? '退出编辑' : '关闭' }}
          </ElButton>
          <ElButton v-if="!是否编辑已发布" :loading="store.saving" @click="保存草稿">
            保存草稿
          </ElButton>
          <ElButton
            type="primary"
            :loading="提交中"
            :disabled="!草稿表单.content.trim() || 超出字数"
            @click="提交"
          >
            {{ 是否编辑已发布 ? '保存修改' : '发布' }}
          </ElButton>
        </div>
      </template>
    </BaseDialog>
  </div>
</template>

<style scoped>
/* ==========================================================================
   列表
   ========================================================================== */
.moment-manager .moment-title-cell {
  min-width: 0;
}

.moment-manager .moment-title {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--manager-ink);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.moment-manager .moment-title:not(:disabled):hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.moment-manager .moment-title:disabled {
  cursor: default;
}

.moment-manager .moment-excerpt {
  display: block;
  overflow: hidden;
  min-width: 0;
  color: var(--manager-muted);
  font-size: 11.5px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.moment-manager .moment-count,
.moment-manager .moment-stats {
  color: var(--manager-muted);
  font-size: 11.5px;
  white-space: nowrap;
}

.moment-manager .moment-image-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.moment-manager .moment-image-thumb {
  flex: none;
  width: 30px;
  height: 30px;
  overflow: hidden;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  cursor: zoom-in;
}

.moment-manager .moment-image-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.moment-manager .moment-image-more {
  color: var(--manager-placeholder);
  font-size: 11px;
  white-space: nowrap;
}

/* ==========================================================================
   卡片视图
   ========================================================================== */
.moment-manager .moment-card {
  display: flex;
  flex-direction: column;
  /* 卡片统一高度，避免有无图片时同排高度参差 */
  min-height: 255px;
}

/* 卡片高度随栅格拉伸，页脚统一贴底（提高权重压过 manager.css 的 12px） */
.moment-manager .manager-cards .manager-card footer {
  margin-top: auto;
}

/* 页脚改成贴底后，用正文与图片的下边距保证最小间距 */
.moment-manager .manager-cards .manager-card p {
  margin-bottom: 12px;
}

.moment-manager .moment-card-kicker {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--manager-muted);
  font-size: 11px;
}

.moment-manager .moment-card-kicker > span:not(.manager-status) {
  color: var(--manager-placeholder);
}

.moment-manager .moment-card h3 button {
  display: block;
  overflow: hidden;
  max-width: 100%;
  color: var(--manager-ink);
  font: inherit;
  font-weight: 500;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.moment-manager .moment-card h3 button:not(:disabled):hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.moment-manager .moment-card-media {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  margin-bottom: 12px;
}

/* 纯文字动态保留同样的图片区高度，避免同排卡片出现大块空白 */
.moment-manager .moment-card-media.is-empty {
  align-items: center;
  justify-content: center;
  min-height: 64px;
  border: 1px dashed var(--manager-line);
  border-radius: 6px;
  color: var(--manager-placeholder);
  font-size: 11px;
}

.moment-manager .moment-card-thumb {
  flex: none;
  width: 64px;
  height: 64px;
  overflow: hidden;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  cursor: zoom-in;
}

.moment-manager .moment-card-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ==========================================================================
   撰写弹窗（弹窗被 teleport 到 body，这里只挂表单内部元素的样式）
   ========================================================================== */
.moment-form {
  display: flex;
  flex-direction: column;
}

.moment-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.moment-field-label {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
}

.moment-field-label em {
  color: var(--el-color-danger);
  font-style: normal;
}

.moment-field-label .counter {
  margin-left: auto;
  color: var(--el-text-color-placeholder);
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: 10.5px;
}

.moment-field-label .counter.is-over {
  color: var(--el-color-danger);
}

.moment-field :deep(.el-input),
.moment-field :deep(.el-textarea) {
  width: 100%;
}

.moment-field :deep(.el-input__wrapper),
.moment-field :deep(.el-textarea__inner) {
  border-radius: 5px;
  font-size: 12px;
}

.moment-draft-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.moment-draft-bar .hint {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

/* 窄屏：搜索框自适应宽度，卡片缩略图略小 */
@media (max-width: 640px) {
  .moment-manager .manager-search {
    width: auto;
  }

  .moment-manager .moment-card-thumb {
    width: 56px;
    height: 56px;
  }
}
</style>
