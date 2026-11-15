<script setup lang="ts">
import '@feathernest/ui/styles/manager.css'
/* global HTMLInputElement, KeyboardEvent, MouseEvent */
import {
  BellFilled,
  Close,
  Delete,
  Filter,
  Hide,
  Plus,
  RefreshLeft,
  Search,
  View,
} from '@element-plus/icons-vue'
import { PencilEditIcon, SortDirectionIcon } from '@feathernest/ui'
import { ElButton, ElIcon, ElPopover, ElTooltip } from 'element-plus'
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  reactive,
  ref,
} from 'vue'
import { useInfiniteScroll, useStorage } from '@vueuse/core'
import { 获取API错误消息 } from '../../../../shared/api'
import {
  创建公告 as 请求创建公告,
  删除公告 as 请求删除公告,
  恢复公告 as 请求恢复公告,
  更新公告 as 请求更新公告,
  清空公告回收站 as 请求清空公告回收站,
  获取公告列表 as 请求获取公告列表,
} from '../../api'
import type { AnnouncementPayload, AnnouncementRecord } from '../../types'

const emit = defineEmits<{ 'announcement-count-change': [count: number] }>()

type 标签值 = 'all' | 'active' | 'inactive'
type 正文筛选值 = 'all' | 'has' | 'empty'
type 排序字段值 = 'created_at' | 'updated_at' | 'title' | 'deleted_at'
type 排序方向值 = 'asc' | 'desc'
type 删除模式值 = 'delete' | 'purge' | 'empty'

interface 提示项 {
  id: number
  文案: string
  操作文案?: string
  操作?: () => void | Promise<void>
}

interface 删除文案 {
  kicker: string
  title: string
  desc: string
  confirm: string
}

const 正文选项: Array<{ 值: 正文筛选值; 标签: string }> = [
  { 值: 'all', 标签: '全部' },
  { 值: 'has', 标签: '有正文' },
  { 值: 'empty', 标签: '仅标题' },
]

// 列表状态
const 加载中 = ref(false)
const 加载失败 = ref(false)
const 失败请求为追加 = ref(false)
const 公告列表 = ref<AnnouncementRecord[]>([])
const 总数 = ref(0)
const 页数 = ref(1)
const 当前页 = ref(1)
const 每页条数 = 20
const 列表容器 = ref<HTMLElement | null>(null)
const 加载更多中 = ref(false)
const 视图 = ref<'table' | 'cards'>('table')
const 当前标签 = ref<标签值>('all')
const 回收站模式 = ref(false)
const 搜索词 = ref('')
const 已应用搜索 = ref('')
const 正文筛选 = ref<正文筛选值>('all')
const 排序字段 = ref<排序字段值 | ''>('')
const 排序方向 = ref<排序方向值>('desc')
const 筛选打开 = ref(false)
const 生效总数 = ref(0)
const 下架总数 = ref(0)
const 回收站总数 = ref(0)
const 新鲜ID = ref<string | null>(null)
const 公告列 = [
  { value: 'title', label: '公告' },
  { value: 'content', label: '内容' },
  { value: 'status', label: '状态' },
  { value: 'date', label: '创建时间 / 删除时间' },
  { value: 'updated_at', label: '更新时间' },
] as const
type 公告列值 = (typeof 公告列)[number]['value']
const 可见公告列 = useStorage<公告列值[]>('feathernest.announcement.columns', [
  'title',
  'content',
  'status',
  'date',
])
const 公告表格最小宽度 = computed(() => {
  const 宽度 = 公告列
    .filter((column) => 可见公告列.value.includes(column.value))
    .map((column) => (column.value === 'title' || column.value === 'content' ? 180 : 120))
  return `${宽度.reduce((总宽, 列宽) => 总宽 + 列宽 + 16, 88)}px`
})
const 公告表格列 = computed(() => {
  const columns = 公告列.filter((column) => 可见公告列.value.includes(column.value))
  return [
    ...columns.map((column) =>
      column.value === 'title' || column.value === 'content' ? 'minmax(180px, 1fr)' : '120px',
    ),
    '88px',
  ].join(' ')
})

function 切换公告列(column: 公告列值) {
  if (column === 'title') return
  可见公告列.value = 可见公告列.value.includes(column)
    ? 可见公告列.value.filter((item) => item !== column)
    : [...可见公告列.value, column]
}

// 排序项跟随回收站模式：列表按创建时间，回收站按删除时间
const 排序选项 = computed<Array<{ 值: 排序字段值; 标签: string }>>(() =>
  回收站模式.value
    ? [
        { 值: 'deleted_at', 标签: '删除时间' },
        { 值: 'title', 标签: '公告标题' },
      ]
    : [
        { 值: 'created_at', 标签: '创建时间' },
        { 值: 'updated_at', 标签: '更新时间' },
        { 值: 'title', 标签: '公告标题' },
      ],
)

// 弹窗与表单
const 弹窗打开 = ref(false)
const 编辑中 = ref<AnnouncementRecord | null>(null)
const 保存中 = ref(false)
const 标题错误 = ref(false)
const 表单 = reactive<AnnouncementPayload>({
  title: '',
  content: '',
  is_active: true,
})

// 删除气泡
const 删除气泡可见 = ref(false)
const 删除模式 = ref<删除模式值>('delete')
const 删除目标 = ref<AnnouncementRecord | null>(null)
const 删除锚点 = ref<HTMLElement | null>(null)
const 删除气泡 = ref<HTMLElement | null>(null)
const 删除气泡位置 = reactive({ top: 0, left: 0, above: false, arrowLeft: 0 })

// 提示
const 提示列表 = ref<提示项[]>([])
let 提示序号 = 0
const 提示计时器 = new Map<number, number>()

const 标题输入 = ref<HTMLInputElement | null>(null)
const 筛选容器 = ref<HTMLElement | null>(null)

let 搜索定时器: number | undefined
let 新鲜定时器: number | undefined
let 请求序号 = 0
let 上次焦点: HTMLElement | null = null

const 未删除总数 = computed(() => 生效总数.value + 下架总数.value)
const 还有更多 = computed(() => 当前页.value < 页数.value)
const 筛选条件数 = computed(() => (正文筛选.value === 'all' ? 0 : 1))
const 页头统计 = computed(() =>
  回收站模式.value
    ? `共 ${回收站总数.value} 条已删除公告 · 删除后保留 30 天`
    : `共 ${未删除总数.value} 条公告 · ${生效总数.value} 条生效中`,
)
const 删除气泡文案 = computed<删除文案>(() => {
  if (删除模式.value === 'empty') {
    return {
      kicker: '清空回收站',
      title: `清空回收站（${回收站总数.value} 条）`,
      desc: '回收站里的公告会被全部清除，无法恢复。',
      confirm: '清空回收站',
    }
  }
  if (删除模式.value === 'purge') {
    return {
      kicker: '彻底删除',
      title: 删除目标.value?.title || '',
      desc: '这次无法恢复，公告会被永久删除。',
      confirm: '彻底删除',
    }
  }
  return {
    kicker: '移入回收站',
    title: 删除目标.value?.title || '',
    desc: '保留 30 天，期间可以随时从回收站恢复。',
    confirm: '移入回收站',
  }
})
const 空状态 = computed(() => {
  if (加载失败.value) return { 标题: '公告加载失败', 说明: '请稍后重试，或检查后端服务是否正常' }
  if (回收站模式.value) {
    if (已应用搜索.value) return { 标题: '没有匹配的公告', 说明: '换个关键字试试' }
    return { 标题: '回收站是空的', 说明: '删除的公告会在这里保留 30 天' }
  }
  if (已应用搜索.value || 正文筛选.value !== 'all') {
    return { 标题: '没有符合条件的公告', 说明: '换个关键字，或清除筛选条件' }
  }
  return { 标题: '还没有公告', 说明: '从「新建公告」开始，发布第一条站点通知' }
})

/* ==========================================================================
   数据请求
   ========================================================================== */
async function 拉取公告(追加 = false) {
  const 序号 = ++请求序号
  const 请求页 = 追加 ? 当前页.value + 1 : 1
  if (追加) 加载更多中.value = true
  else {
    加载中.value = true
    加载更多中.value = false
    if (列表容器.value) 列表容器.value.scrollTop = 0
  }
  加载失败.value = false
  try {
    const 数据 = await 请求获取公告列表({
      page: 请求页,
      pageSize: 每页条数,
      isDeleted: 回收站模式.value,
      isActive:
        回收站模式.value || 当前标签.value === 'all' ? undefined : 当前标签.value === 'active',
      search: 已应用搜索.value || undefined,
      contentState: 正文筛选.value,
      sortBy: 排序字段.value || (回收站模式.value ? 'deleted_at' : 'created_at'),
      sortOrder: 排序字段.value ? 排序方向.value : 'desc',
    })
    if (序号 !== 请求序号) return

    const 服务端页数 = Math.max(1, 数据.pages)
    公告列表.value = 追加 ? [...公告列表.value, ...数据.items] : 数据.items
    当前页.value = 请求页
    总数.value = 数据.total
    emit('announcement-count-change', 数据.active_total)
    页数.value = 服务端页数
    生效总数.value = 数据.active_total
    下架总数.value = 数据.inactive_total
    回收站总数.value = 数据.trash_total
  } catch (错误) {
    if (序号 !== 请求序号) return
    加载失败.value = true
    失败请求为追加.value = 追加
    console.error('获取公告列表失败', { page: 请求页, 追加, 错误 })
    提示(获取API错误消息(错误, '获取公告列表失败'))
  } finally {
    if (序号 === 请求序号) {
      加载中.value = false
      加载更多中.value = false
    }
  }
}

function 切换标签(标签: 标签值) {
  if (当前标签.value === 标签) return
  当前标签.value = 标签
  当前页.value = 1
  void 拉取公告()
}

function 切换回收站() {
  回收站模式.value = !回收站模式.value
  当前标签.value = 'all'
  搜索词.value = ''
  已应用搜索.value = ''
  当前页.value = 1
  关闭删除气泡()
  筛选打开.value = false
  排序字段.value = ''
  排序方向.value = 'desc'
  void 拉取公告()
}

function 处理搜索输入() {
  window.clearTimeout(搜索定时器)
  搜索定时器 = window.setTimeout(() => {
    const 关键词 = 搜索词.value.trim()
    if (关键词 === 已应用搜索.value) return
    已应用搜索.value = 关键词
    当前页.value = 1
    void 拉取公告()
  }, 300)
}

function 切换排序(字段: 排序字段值) {
  if (排序字段.value !== 字段) {
    排序字段.value = 字段
    排序方向.value = 'asc'
  } else if (排序方向.value === 'asc') {
    排序方向.value = 'desc'
  } else {
    排序字段.value = ''
  }
  当前页.value = 1
  void 拉取公告()
}

function 切换正文(值: 正文筛选值) {
  正文筛选.value = 值
  当前页.value = 1
  void 拉取公告()
}

function 清除筛选() {
  if (正文筛选.value === 'all') return
  正文筛选.value = 'all'
  当前页.value = 1
  void 拉取公告()
}

function 加载更多公告() {
  if (加载中.value || 加载更多中.value || !还有更多.value) return
  void 拉取公告(true)
}

useInfiniteScroll(列表容器, 加载更多公告, {
  distance: 160,
  canLoadMore: () => 还有更多.value && !加载中.value && !加载更多中.value && !加载失败.value,
})

function 排序图标方向(字段: 排序字段值): 'asc' | 'desc' | '' {
  if (排序字段.value !== 字段) return ''
  return 排序方向.value
}

/* ==========================================================================
   新建 / 编辑
   ========================================================================== */
function 打开新建() {
  编辑中.value = null
  表单.title = ''
  表单.content = ''
  表单.is_active = true
  标题错误.value = false
  筛选打开.value = false
  关闭删除气泡()
  打开弹窗()
}

function 打开编辑(公告: AnnouncementRecord) {
  编辑中.value = 公告
  表单.title = 公告.title
  表单.content = 公告.content
  表单.is_active = 公告.is_active
  标题错误.value = false
  筛选打开.value = false
  关闭删除气泡()
  打开弹窗()
}

function 打开弹窗() {
  上次焦点 = document.activeElement as HTMLElement | null
  弹窗打开.value = true
  void nextTick(() => 标题输入.value?.focus())
}

function 关闭弹窗() {
  弹窗打开.value = false
  const 目标 = 上次焦点
  上次焦点 = null
  void nextTick(() => 目标?.focus())
}

async function 保存公告() {
  if (保存中.value) return
  const 标题 = 表单.title.trim()
  if (!标题) {
    标题错误.value = true
    提示('请输入公告标题')
    void nextTick(() => 标题输入.value?.focus())
    return
  }

  保存中.value = true
  const 内容 = 表单.content.trim()
  const 当前编辑 = 编辑中.value
  try {
    if (当前编辑) {
      const 更新后 = await 请求更新公告(当前编辑.id, {
        title: 标题,
        content: 内容,
        is_active: 表单.is_active,
      })
      提示('公告已更新')
      标记新鲜(更新后.id)
    } else {
      const 创建后 = await 请求创建公告({
        title: 标题,
        content: 内容,
        is_active: 表单.is_active,
      })
      当前标签.value = 'all'
      回收站模式.value = false
      正文筛选.value = 'all'
      搜索词.value = ''
      已应用搜索.value = ''
      当前页.value = 1
      提示('公告已创建')
      标记新鲜(创建后.id)
    }
    关闭弹窗()
    await 拉取公告()
  } catch (错误) {
    提示(获取API错误消息(错误, 当前编辑 ? '更新公告失败' : '创建公告失败'))
  } finally {
    保存中.value = false
  }
}

/* ==========================================================================
   状态切换 / 恢复 / 删除
   ========================================================================== */
async function 切换公告状态(公告: AnnouncementRecord) {
  try {
    await 请求更新公告(公告.id, {
      title: 公告.title,
      content: 公告.content,
      is_active: !公告.is_active,
    })
    提示(公告.is_active ? `公告已下架：${公告.title}` : `公告已上架：${公告.title}`)
    标记新鲜(公告.id)
    await 拉取公告()
  } catch (错误) {
    提示(获取API错误消息(错误, '更新公告状态失败'))
  }
}

async function 恢复公告记录(公告: AnnouncementRecord) {
  try {
    await 请求恢复公告(公告.id)
    提示(`公告已恢复：${公告.title}`)
    标记新鲜(公告.id)
    await 拉取公告()
  } catch (错误) {
    提示(获取API错误消息(错误, '恢复公告失败'))
  }
}

function 请求删除(公告: AnnouncementRecord, 来自回收站: boolean, 事件: MouseEvent) {
  const 锚点 = 事件.currentTarget as HTMLElement
  const 模式: 删除模式值 = 来自回收站 ? 'purge' : 'delete'
  if (删除气泡可见.value && 删除模式.value === 模式 && 删除目标.value?.id === 公告.id) {
    关闭删除气泡()
    return
  }
  删除模式.value = 模式
  删除目标.value = 公告
  删除锚点.value = 锚点
  显示删除气泡()
}

function 请求清空(事件: MouseEvent) {
  if (!回收站总数.value) {
    提示('回收站已经是空的')
    return
  }
  if (删除气泡可见.value && 删除模式.value === 'empty') {
    关闭删除气泡()
    return
  }
  删除模式.value = 'empty'
  删除目标.value = null
  删除锚点.value = 事件.currentTarget as HTMLElement
  显示删除气泡()
}

function 显示删除气泡() {
  删除气泡可见.value = true
  void nextTick(() => {
    定位删除气泡()
    requestAnimationFrame(定位删除气泡)
  })
}

function 定位删除气泡() {
  const 锚点 = 删除锚点.value
  const 气泡 = 删除气泡.value
  if (!锚点 || !气泡) return
  const 位置 = 锚点.getBoundingClientRect()
  const 宽 = 288
  const 高 = 气泡.offsetHeight
  let 上边 = 位置.bottom + 8
  let 朝上 = false
  if (上边 + 高 > window.innerHeight - 12) {
    上边 = 位置.top - 高 - 8
    朝上 = true
  }
  上边 = Math.max(12, 上边)
  const 左边 = Math.max(12, Math.min(位置.right - 宽, window.innerWidth - 宽 - 12))
  删除气泡位置.top = 上边
  删除气泡位置.left = 左边
  删除气泡位置.above = 朝上
  删除气泡位置.arrowLeft = Math.min(Math.max(14, 位置.left + 位置.width / 2 - 左边 - 4), 宽 - 22)
}

function 关闭删除气泡() {
  删除气泡可见.value = false
  删除目标.value = null
  删除锚点.value = null
}

async function 执行删除() {
  const 模式 = 删除模式.value
  const 目标 = 删除目标.value
  const 清空数量 = 回收站总数.value
  关闭删除气泡()
  try {
    if (模式 === 'empty') {
      await 请求清空公告回收站()
      提示(`已清空回收站（${清空数量} 条）`)
    } else if (模式 === 'purge' && 目标) {
      await 请求删除公告(目标.id, true)
      提示(`已永久删除：${目标.title}`)
    } else if (目标) {
      await 请求删除公告(目标.id, false)
      提示(`已移入回收站：${目标.title}`, {
        label: '撤销',
        run: () => 撤销删除(目标),
      })
    }
    await 拉取公告()
  } catch (错误) {
    提示(获取API错误消息(错误, 模式 === 'purge' || 模式 === 'empty' ? '删除失败' : '删除失败'))
  }
}

async function 撤销删除(公告: AnnouncementRecord) {
  try {
    await 请求恢复公告(公告.id)
    提示('已恢复到公告列表')
    标记新鲜(公告.id)
    await 拉取公告()
  } catch (错误) {
    提示(获取API错误消息(错误, '撤销删除失败'))
  }
}

/* ==========================================================================
   提示
   ========================================================================== */
function 提示(文案: string, 操作?: { label: string; run: () => void | Promise<void> }) {
  const id = (提示序号 += 1)
  提示列表.value.push({
    id,
    文案,
    操作文案: 操作?.label,
    操作: 操作?.run,
  })
  const 计时器 = window.setTimeout(() => 移除提示(id), 操作 ? 5200 : 2800)
  提示计时器.set(id, 计时器)
}

function 移除提示(id: number) {
  const 计时器 = 提示计时器.get(id)
  if (计时器) window.clearTimeout(计时器)
  提示计时器.delete(id)
  提示列表.value = 提示列表.value.filter((项) => 项.id !== id)
}

async function 执行提示操作(项: 提示项) {
  移除提示(项.id)
  await 项.操作?.()
}

function 标记新鲜(id: string) {
  新鲜ID.value = id
  window.clearTimeout(新鲜定时器)
  新鲜定时器 = window.setTimeout(() => {
    新鲜ID.value = null
  }, 2400)
}

/* ==========================================================================
   时间与文本
   ========================================================================== */
function 补零(值: number) {
  return String(值).padStart(2, '0')
}

function 完整时间(时间: string | null) {
  if (!时间) return '—'
  const 日期 = new Date(时间)
  if (Number.isNaN(日期.getTime())) return '—'
  return `${日期.getFullYear()}-${补零(日期.getMonth() + 1)}-${补零(日期.getDate())} ${补零(日期.getHours())}:${补零(日期.getMinutes())}`
}

function 短日期(时间: string | null) {
  if (!时间) return '—'
  const 日期 = new Date(时间)
  if (Number.isNaN(日期.getTime())) return '—'
  if (日期.getFullYear() === new Date().getFullYear()) {
    return `${补零(日期.getMonth() + 1)}-${补零(日期.getDate())}`
  }
  return `${日期.getFullYear()}-${补零(日期.getMonth() + 1)}-${补零(日期.getDate())}`
}

function 相对时间(时间: string | null) {
  if (!时间) return '—'
  const 时间戳 = new Date(时间).getTime()
  if (Number.isNaN(时间戳)) return '—'
  const 差值 = Date.now() - 时间戳
  const 分钟数 = Math.floor(差值 / 60000)
  if (分钟数 < 1) return '刚刚'
  if (分钟数 < 60) return `${分钟数} 分钟前`
  const 今天零点 = new Date().setHours(0, 0, 0, 0)
  const 目标零点 = new Date(时间戳).setHours(0, 0, 0, 0)
  const 天数 = Math.round((今天零点 - 目标零点) / 86400000)
  if (天数 <= 0) return `${Math.floor(差值 / 3600000)} 小时前`
  if (天数 === 1) return '昨天'
  if (天数 < 7) return `${天数} 天前`
  return 短日期(时间)
}

function 内容字数(内容: string) {
  return 内容.replace(/\s/g, '').length
}

function 公告时间(公告: AnnouncementRecord) {
  return 回收站模式.value ? 公告.deleted_at || 公告.created_at : 公告.created_at
}

/* ==========================================================================
   全局事件
   ========================================================================== */
function 处理全局鼠标按下(事件: MouseEvent) {
  const 目标 = 事件.target as Node | null
  if (!目标) return
  if (!删除气泡可见.value) return
  if (删除气泡.value?.contains(目标)) return
  if (删除锚点.value?.contains(目标)) return
  关闭删除气泡()
}

function 处理全局点击(事件: MouseEvent) {
  if (!筛选打开.value) return
  const 目标 = 事件.target as Node | null
  if (!目标) return
  if (筛选容器.value?.contains(目标)) return
  筛选打开.value = false
}

function 处理按键(事件: KeyboardEvent) {
  if (事件.key !== 'Escape') return
  if (弹窗打开.value) {
    事件.preventDefault()
    关闭弹窗()
    return
  }
  if (删除气泡可见.value) {
    事件.preventDefault()
    关闭删除气泡()
    return
  }
  if (筛选打开.value) 筛选打开.value = false
}

function 处理窗口尺寸() {
  if (删除气泡可见.value) 关闭删除气泡()
}

let 上次拉取时间 = 0
onMounted(() => {
  上次拉取时间 = Date.now()
  void 拉取公告()
  document.addEventListener('mousedown', 处理全局鼠标按下)
  document.addEventListener('click', 处理全局点击)
  document.addEventListener('keydown', 处理按键)
  window.addEventListener('resize', 处理窗口尺寸)
})

onActivated(() => {
  if (Date.now() - 上次拉取时间 > 30_000) {
    void 拉取公告()
  }
})

onDeactivated(() => {
  关闭删除气泡()
  筛选打开.value = false
  弹窗打开.value = false
})

onBeforeUnmount(() => {
  window.clearTimeout(搜索定时器)
  window.clearTimeout(新鲜定时器)
  for (const 计时器 of 提示计时器.values()) window.clearTimeout(计时器)
  提示计时器.clear()
  document.removeEventListener('mousedown', 处理全局鼠标按下)
  document.removeEventListener('click', 处理全局点击)
  document.removeEventListener('keydown', 处理按键)
  window.removeEventListener('resize', 处理窗口尺寸)
})
</script>

<template>
  <div class="manager-page announcement-manager" :class="{ 'is-card-view': 视图 === 'cards' }">
    <header class="manager-head">
      <div class="page-head-main">
        <h1>{{ 回收站模式 ? '回收站' : '公告管理' }}</h1>
        <p>{{ 页头统计 }}</p>
      </div>
      <div class="manager-head-actions">
        <ElButton v-if="!回收站模式" class="ann-create" type="primary" @click="打开新建">
          <ElIcon><Plus /></ElIcon>
          <span>新建公告</span>
        </ElButton>
        <ElButton
          v-else
          class="ann-clear"
          type="danger"
          plain
          :disabled="回收站总数 === 0"
          @click="请求清空"
        >
          <ElIcon><Delete /></ElIcon>
          <span>清空回收站</span>
        </ElButton>
      </div>
    </header>

    <div class="manager-toolbar">
      <div class="manager-mode-nav" role="group" aria-label="公告视图切换">
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
        <div ref="筛选容器" class="filter-wrap">
          <button
            class="manager-filter-button"
            :class="{ 'is-active': 筛选条件数 > 0 }"
            type="button"
            :aria-expanded="筛选打开"
            @click="筛选打开 = !筛选打开"
          >
            <ElIcon><Filter /></ElIcon>
            <span>筛选</span>
            <small v-if="筛选条件数">{{ 筛选条件数 }}</small>
          </button>
          <div v-if="筛选打开" class="filter-pop manager-popover">
            <div class="manager-filter-group">
              <label>正文</label>
              <div class="manager-filter-chips">
                <button
                  v-for="选项 in 正文选项"
                  :key="选项.值"
                  class="manager-filter-chip"
                  :class="{ 'is-active': 正文筛选 === 选项.值 }"
                  type="button"
                  :aria-pressed="正文筛选 === 选项.值"
                  @click="切换正文(选项.值)"
                >
                  {{ 选项.标签 }}
                </button>
              </div>
            </div>
            <div class="manager-filter-group">
              <label>排序</label>
              <div class="manager-sort-options">
                <button
                  v-for="选项 in 排序选项"
                  :key="选项.值"
                  class="manager-filter-chip manager-sort-option"
                  :class="{ 'is-active': 排序字段 === 选项.值 }"
                  type="button"
                  :aria-label="`${选项.标签}，${排序字段 === 选项.值 ? (排序方向 === 'asc' ? '升序' : '降序') : '未排序'}`"
                  :aria-pressed="排序字段 === 选项.值"
                  @click="切换排序(选项.值)"
                >
                  <span>{{ 选项.标签 }}</span>
                  <ElIcon><SortDirectionIcon :direction="排序图标方向(选项.值)" /></ElIcon>
                </button>
              </div>
            </div>
            <div class="manager-filter-footer">
              <span class="hint">{{
                筛选条件数 ? `已选 ${筛选条件数} 个条件` : '未设置筛选条件'
              }}</span>
              <button class="text-btn" type="button" @click="清除筛选">清除筛选</button>
            </div>
          </div>
        </div>

        <label class="manager-search">
          <ElIcon><Search /></ElIcon>
          <input
            v-model="搜索词"
            type="search"
            placeholder="搜索公告标题或内容"
            aria-label="搜索公告"
            @input="处理搜索输入"
          />
        </label>
      </div>
    </div>

    <div class="manager-tabs-row">
      <nav class="manager-tabs" aria-label="公告状态">
        <button
          class="manager-tab"
          :class="{ 'is-active': 当前标签 === 'all' }"
          type="button"
          @click="切换标签('all')"
        >
          全部<small>{{ 未删除总数 }}</small>
        </button>
        <button
          class="manager-tab"
          :class="{ 'is-active': 当前标签 === 'active' }"
          type="button"
          @click="切换标签('active')"
        >
          生效中<small>{{ 生效总数 }}</small>
        </button>
        <button
          class="manager-tab"
          :class="{ 'is-active': 当前标签 === 'inactive' }"
          type="button"
          @click="切换标签('inactive')"
        >
          已下架<small>{{ 下架总数 }}</small>
        </button>
      </nav>
      <button
        class="manager-tab"
        :class="{ 'is-active': 回收站模式 }"
        type="button"
        :aria-pressed="回收站模式"
        @click="切换回收站"
      >
        回收站<small>{{ 回收站总数 }}</small>
      </button>
    </div>

    <div ref="列表容器" v-loading="加载中" class="manager-list-body" @scroll.passive="关闭删除气泡">
      <div v-if="!加载中 && !公告列表.length" class="empty">
        <ElIcon class="empty-icon"><BellFilled /></ElIcon>
        <strong>{{ 空状态.标题 }}</strong>
        <span>{{ 空状态.说明 }}</span>
      </div>

      <template v-else-if="公告列表.length">
        <div class="manager-table" :style="{ minWidth: 公告表格最小宽度 }">
          <div
            class="manager-row manager-row-head"
            :style="{ '--manager-grid-columns': 公告表格列 }"
          >
            <button
              v-if="可见公告列.includes('title')"
              class="manager-sort-heading"
              :class="{ 'is-active': 排序字段 === 'title' }"
              type="button"
              @click="切换排序('title')"
            >
              <span>公告</span
              ><ElIcon><SortDirectionIcon :direction="排序图标方向('title')" /></ElIcon>
            </button>
            <span v-if="可见公告列.includes('content')" class="col-content">内容</span>
            <span v-if="可见公告列.includes('status')">状态</span>
            <button
              v-if="可见公告列.includes('date')"
              class="manager-sort-heading"
              :class="{ 'is-active': 排序字段 === (回收站模式 ? 'deleted_at' : 'created_at') }"
              type="button"
              @click="切换排序(回收站模式 ? 'deleted_at' : 'created_at')"
            >
              <span>{{ 回收站模式 ? '删除时间' : '创建时间' }}</span>
              <ElIcon
                ><SortDirectionIcon
                  :direction="排序图标方向(回收站模式 ? 'deleted_at' : 'created_at')"
              /></ElIcon>
            </button>
            <button
              v-if="可见公告列.includes('updated_at')"
              class="manager-sort-heading"
              :class="{ 'is-active': 排序字段 === 'updated_at' }"
              type="button"
              @click="切换排序('updated_at')"
            >
              <span>更新时间</span>
              <ElIcon><SortDirectionIcon :direction="排序图标方向('updated_at')" /></ElIcon>
            </button>
            <div class="manager-column-actions">
              <span>操作</span>
              <ElPopover
                popper-class="manager-popover"
                placement="bottom-end"
                :width="180"
                trigger="click"
              >
                <template #reference>
                  <button type="button" title="设置显示列" aria-label="设置显示列">
                    <ElIcon
                      ><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" /></svg
                    ></ElIcon>
                  </button>
                </template>
                <div class="manager-column-settings">
                  <label v-for="column in 公告列" :key="column.value">
                    <input
                      type="checkbox"
                      :checked="可见公告列.includes(column.value)"
                      :disabled="column.value === 'title'"
                      @change="切换公告列(column.value)"
                    />
                    {{ column.label }}
                  </label>
                </div>
              </ElPopover>
            </div>
          </div>

          <div
            v-for="公告 in 公告列表"
            :key="公告.id"
            class="manager-row"
            :style="{ '--manager-grid-columns': 公告表格列 }"
            :class="{ 'is-fresh': 公告.id === 新鲜ID }"
          >
            <div v-if="可见公告列.includes('title')" class="manager-title">
              <button v-if="!回收站模式" type="button" @click="打开编辑(公告)">
                {{ 公告.title }}
              </button>
              <span v-else class="title-text">{{ 公告.title }}</span>
              <small v-if="!公告.content.trim()">仅标题</small>
            </div>
            <span
              v-if="可见公告列.includes('content')"
              class="manager-excerpt col-content"
              :class="{ 'is-empty': !公告.content.trim() }"
              :title="公告.content"
            >
              {{ 公告.content.trim() ? 公告.content : '仅标题' }}
            </span>
            <span v-if="可见公告列.includes('status')" class="manager-status">
              <i :class="公告.is_active ? 'on' : 'off'" />{{ 公告.is_active ? '生效中' : '已下架' }}
            </span>
            <ElTooltip
              v-if="可见公告列.includes('date')"
              :content="完整时间(公告时间(公告))"
              placement="top"
              popper-class="manager-date-tooltip"
              ><span class="manager-date">{{ 相对时间(公告时间(公告)) }}</span></ElTooltip
            >
            <ElTooltip
              v-if="可见公告列.includes('updated_at')"
              :content="完整时间(公告.updated_at)"
              placement="top"
              popper-class="manager-date-tooltip"
              ><span class="manager-date">{{ 相对时间(公告.updated_at) }}</span></ElTooltip
            >
            <div class="manager-ops">
              <template v-if="回收站模式">
                <button
                  type="button"
                  title="恢复公告"
                  aria-label="恢复公告"
                  @click="恢复公告记录(公告)"
                >
                  <ElIcon><RefreshLeft /></ElIcon>
                </button>
                <button
                  class="danger"
                  type="button"
                  title="彻底删除"
                  aria-label="彻底删除"
                  @click="请求删除(公告, true, $event)"
                >
                  <ElIcon><Delete /></ElIcon>
                </button>
              </template>
              <template v-else>
                <button
                  type="button"
                  title="编辑公告"
                  aria-label="编辑公告"
                  @click="打开编辑(公告)"
                >
                  <ElIcon><PencilEditIcon /></ElIcon>
                </button>
                <button
                  type="button"
                  :title="公告.is_active ? '下架公告' : '上架公告'"
                  :aria-label="公告.is_active ? '下架公告' : '上架公告'"
                  @click="切换公告状态(公告)"
                >
                  <ElIcon><component :is="公告.is_active ? View : Hide" /></ElIcon>
                </button>
                <button
                  class="danger"
                  type="button"
                  title="移入回收站"
                  aria-label="移入回收站"
                  @click="请求删除(公告, false, $event)"
                >
                  <ElIcon><Delete /></ElIcon>
                </button>
              </template>
            </div>
          </div>
        </div>

        <div class="manager-cards">
          <article
            v-for="公告 in 公告列表"
            :key="公告.id"
            class="manager-card"
            :class="{ 'is-fresh': 公告.id === 新鲜ID }"
          >
            <div class="card-kicker">
              <span class="manager-status">
                <i :class="公告.is_active ? 'on' : 'off'" />{{
                  公告.is_active ? '生效中' : '已下架'
                }}
              </span>
              <span>·</span>
              <span>{{ 内容字数(公告.content) }} 字</span>
              <ElTooltip
                v-if="回收站模式"
                :content="完整时间(公告.deleted_at)"
                placement="top"
                popper-class="manager-date-tooltip"
                ><span>删除于 {{ 相对时间(公告.deleted_at) }}</span></ElTooltip
              >
            </div>
            <h3>
              <button v-if="!回收站模式" type="button" @click="打开编辑(公告)">
                {{ 公告.title }}
              </button>
              <span v-else class="title-text">{{ 公告.title }}</span>
            </h3>
            <p :class="{ 'is-empty': !公告.content.trim() }">
              {{ 公告.content.trim() ? 公告.content : '这条公告只有标题。' }}
            </p>
            <footer>
              <ElTooltip placement="top" popper-class="manager-date-tooltip">
                <template #content>
                  <div>创建于 {{ 完整时间(公告.created_at) }}</div>
                  <div>编辑于 {{ 完整时间(公告.updated_at) }}</div>
                </template>
                <span class="card-created-at">创建于 {{ 相对时间(公告.created_at) }}</span>
              </ElTooltip>
              <div class="manager-ops">
                <template v-if="回收站模式">
                  <button
                    type="button"
                    title="恢复公告"
                    aria-label="恢复公告"
                    @click="恢复公告记录(公告)"
                  >
                    <ElIcon><RefreshLeft /></ElIcon>
                  </button>
                  <button
                    class="danger"
                    type="button"
                    title="彻底删除"
                    aria-label="彻底删除"
                    @click="请求删除(公告, true, $event)"
                  >
                    <ElIcon><Delete /></ElIcon>
                  </button>
                </template>
                <template v-else>
                  <button
                    type="button"
                    title="编辑公告"
                    aria-label="编辑公告"
                    @click="打开编辑(公告)"
                  >
                    <ElIcon><PencilEditIcon /></ElIcon>
                  </button>
                  <button
                    type="button"
                    :title="公告.is_active ? '下架公告' : '上架公告'"
                    :aria-label="公告.is_active ? '下架公告' : '上架公告'"
                    @click="切换公告状态(公告)"
                  >
                    <ElIcon><component :is="公告.is_active ? View : Hide" /></ElIcon>
                  </button>
                  <button
                    class="danger"
                    type="button"
                    title="移入回收站"
                    aria-label="移入回收站"
                    @click="请求删除(公告, false, $event)"
                  >
                    <ElIcon><Delete /></ElIcon>
                  </button>
                </template>
              </div>
            </footer>
          </article>
        </div>
      </template>
      <div
        v-if="公告列表.length"
        class="manager-list-status"
        :class="{ 'manager-list-status--end': !还有更多 && !加载更多中 && !加载失败 }"
      >
        <button v-if="加载失败" type="button" @click="拉取公告(失败请求为追加)">
          加载失败，点击重试
        </button>
        <span v-else>{{
          加载更多中 ? '正在加载更多公告…' : 还有更多 ? '向下滚动加载更多' : '已显示全部公告'
        }}</span>
      </div>
    </div>

    <!-- 删除确认气泡 -->
    <div
      v-if="删除气泡可见"
      ref="删除气泡"
      class="popconfirm"
      :class="{ 'popconfirm--above': 删除气泡位置.above }"
      :style="{ top: `${删除气泡位置.top}px`, left: `${删除气泡位置.left}px` }"
      role="dialog"
      aria-modal="false"
    >
      <div class="popconfirm-arrow" :style="{ left: `${删除气泡位置.arrowLeft}px` }" />
      <p class="pop-kicker"><i />{{ 删除气泡文案.kicker }}</p>
      <p class="pop-title">{{ 删除气泡文案.title }}</p>
      <p class="pop-desc">{{ 删除气泡文案.desc }}</p>
      <div class="pop-foot">
        <button class="btn btn--ghost" type="button" @click="关闭删除气泡">取消</button>
        <button class="btn btn--danger" type="button" @click="执行删除">
          {{ 删除气泡文案.confirm }}
        </button>
      </div>
    </div>

    <!-- 新建 / 编辑公告 -->
    <div v-if="弹窗打开" class="overlay" @mousedown.self="关闭弹窗">
      <section
        class="panel form-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-editor-title"
      >
        <header class="panel-head">
          <span class="dot" />
          <h2 id="announcement-editor-title">{{ 编辑中 ? '编辑公告' : '新建公告' }}</h2>
          <span class="panel-sub">{{
            编辑中 ? '修改后立即同步到公告中心' : '发布后会出现在博客公告中心'
          }}</span>
          <button class="icon-btn" type="button" aria-label="关闭" @click="关闭弹窗">
            <ElIcon><Close /></ElIcon>
          </button>
        </header>
        <div class="form-body">
          <div class="field">
            <label class="field-label" for="announcement-title-input">
              <span>标题 <em>*</em></span>
              <span class="counter">{{ 表单.title.length }} / 200</span>
            </label>
            <input
              id="announcement-title-input"
              ref="标题输入"
              v-model="表单.title"
              type="text"
              maxlength="200"
              placeholder="一句话说清这条公告讲什么"
              :class="{ 'is-error': 标题错误 }"
              autocomplete="off"
              @input="标题错误 = false"
              @keydown.enter.prevent="保存公告"
            />
          </div>
          <div class="field">
            <label class="field-label" for="announcement-content-input">
              <span>内容</span>
              <span class="counter">{{ 表单.content.length }} / 2000</span>
            </label>
            <textarea
              id="announcement-content-input"
              v-model="表单.content"
              maxlength="2000"
              placeholder="补充说明，留空也可以发布（列表里会显示为仅标题）"
              @keydown.ctrl.enter.prevent="保存公告"
              @keydown.meta.enter.prevent="保存公告"
            />
            <span class="field-hint">内容会按纯文本展示，暂不支持 Markdown。</span>
          </div>
          <div class="switch-row">
            <div class="switch-copy">
              <strong>立即生效</strong>
              <span>关闭后公告会保存为「已下架」，之后可以在列表里重新上架。</span>
            </div>
            <button
              class="switch"
              :class="{ 'is-on': 表单.is_active }"
              type="button"
              role="switch"
              :aria-checked="表单.is_active"
              aria-label="立即生效"
              @click="表单.is_active = !表单.is_active"
            />
          </div>
        </div>
        <footer class="panel-foot">
          <span class="foot-hint">保存后立即同步到公告中心</span>
          <ElButton text :disabled="保存中" @click="关闭弹窗">取消</ElButton>
          <ElButton type="primary" :loading="保存中" @click="保存公告">
            {{ 保存中 ? '保存中…' : 编辑中 ? '保存修改' : '创建公告' }}
          </ElButton>
        </footer>
      </section>
    </div>

    <!-- 轻提示 -->
    <div class="toasts" aria-live="polite">
      <div v-for="项 in 提示列表" :key="项.id" class="toast">
        <span class="toast-text">{{ 项.文案 }}</span>
        <button v-if="项.操作" class="toast-action" type="button" @click="执行提示操作(项)">
          {{ 项.操作文案 }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.announcement-manager {
  --announcement-border-strong: var(--el-border-color-dark);
  --announcement-border-panel: #e6e6e6;
  --announcement-border-pop: #e4e4e4;
  --announcement-switch-off: #ddd;
  --announcement-danger: #a33b3b;
  --announcement-danger-dark: #8f2f2f;
  --announcement-danger-line: #e5cccc;
  --announcement-danger-soft: #fdf6f6;
  --announcement-primary-soft: #fdf2f6;
}

/* ==========================================================================
   页头与工具行
   ========================================================================== */

.announcement-manager .page-head-main {
  min-width: 0;
}

/* 页头按钮与友链 / 文章管理保持一致，使用 Element 按钮 */

.announcement-manager .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--manager-line);
  border-radius: 5px;
  background: var(--manager-bg);
  color: var(--manager-ink-2);
  font-size: 12.5px;
  white-space: nowrap;
  transition:
    border-color 0.14s,
    color 0.14s,
    background 0.14s,
    opacity 0.14s;
}

.announcement-manager .btn:hover:not(:disabled) {
  border-color: var(--announcement-border-strong);
  color: var(--manager-ink);
}

.announcement-manager .btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.announcement-manager .btn .el-icon {
  font-size: 14px;
}

.announcement-manager .btn--primary {
  border-color: var(--el-color-primary, #e3769b);
  background: var(--el-color-primary, #e3769b);
  color: #fff;
}

.announcement-manager .btn--primary:hover:not(:disabled) {
  border-color: var(--el-color-primary-dark-2, #d46288);
  background: var(--el-color-primary-dark-2, #d46288);
  color: #fff;
}

.announcement-manager .btn--danger {
  border-color: var(--announcement-danger-line);
  color: var(--announcement-danger);
}

.announcement-manager .btn--danger:hover:not(:disabled) {
  border-color: var(--announcement-danger-line);
  background: var(--announcement-danger-soft);
  color: var(--announcement-danger-dark);
}

.announcement-manager .btn--ghost {
  border-color: transparent;
  background: transparent;
  color: var(--manager-ink-2);
}

.announcement-manager .btn--ghost:hover:not(:disabled) {
  border-color: transparent;
  background: var(--manager-active);
  color: var(--manager-ink);
}

.announcement-manager .icon-btn {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  color: var(--manager-muted);
  transition:
    background 0.12s,
    color 0.12s;
}

.announcement-manager .icon-btn:hover {
  background: var(--manager-active);
  color: var(--manager-ink);
}

.announcement-manager .filter-wrap {
  position: relative;
  display: inline-flex;
}

.announcement-manager .filter-pop {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  width: 300px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  padding: 14px;
  border: 1px solid var(--manager-line);
  border-radius: 8px;
  background: var(--manager-bg);
  animation: announcement-pop-in 0.13s ease-out;
}

.announcement-manager .manager-filter-chip .el-icon {
  font-size: 11px;
}

.announcement-manager .manager-filter-footer .hint {
  color: var(--manager-placeholder);
  font-size: 11px;
}

.announcement-manager .text-btn {
  color: var(--manager-muted);
  font-size: 11.5px;
}

.announcement-manager .text-btn:hover {
  color: var(--el-color-primary, #e3769b);
}

/* ==========================================================================
   列表
   ========================================================================== */

.announcement-manager .manager-row.is-fresh {
  animation: announcement-fresh-bg 2.2s ease-out;
}

.announcement-manager .manager-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.announcement-manager .manager-title button,
.announcement-manager .manager-title .title-text {
  overflow: hidden;
  max-width: 100%;
  color: var(--manager-ink);
  font-weight: 500;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-manager .manager-title button:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.announcement-manager .manager-title small {
  flex: none;
  color: var(--manager-placeholder);
  font-size: 10.5px;
}

.announcement-manager .manager-excerpt {
  display: block;
  overflow: hidden;
  min-width: 0;
  color: var(--manager-muted);
  font-size: 11.5px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-manager .manager-excerpt.is-empty {
  color: var(--manager-placeholder);
  font-style: italic;
}

.announcement-manager .manager-status i.on {
  background: var(--manager-success);
}

.announcement-manager .manager-ops button.danger {
  color: var(--el-color-danger);
}

.announcement-manager .manager-ops button.danger:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.announcement-manager .manager-ops .el-icon {
  font-size: 14px;
}

.announcement-manager .manager-row > .manager-ops {
  position: sticky;
  right: 0;
  z-index: 2;
  align-self: stretch;
  align-items: center;
  width: 88px;
  margin-left: 0;
  background: var(--manager-bg);
}

.announcement-manager .manager-row:not(.manager-row-head):hover > .manager-ops {
  background: var(--manager-hover);
}

/* ==========================================================================
   卡片视图
   ========================================================================== */
.announcement-manager .manager-cards {
  display: none;
}

.announcement-manager.is-card-view .manager-table {
  display: none;
}

.announcement-manager.is-card-view .manager-cards {
  display: grid;
}

.announcement-manager .manager-card.is-fresh {
  animation: announcement-fresh-bg 2.2s ease-out;
}

.announcement-manager .card-kicker {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--manager-muted);
  font-size: 11px;
}

.announcement-manager .card-kicker > span:not(.manager-status) {
  color: var(--manager-placeholder);
}

.announcement-manager .manager-card h3 button,
.announcement-manager .manager-card h3 .title-text {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--manager-ink);
  font: inherit;
  font-weight: 500;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-manager .manager-card h3 button:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.announcement-manager .manager-card p.is-empty {
  color: var(--manager-placeholder);
  font-style: italic;
}

.announcement-manager .manager-card footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
}

.announcement-manager .card-created-at {
  justify-self: start;
  line-height: 1.5;
}

/* ==========================================================================
   空状态
   ========================================================================== */
.announcement-manager .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 280px;
  color: var(--manager-placeholder);
}

.announcement-manager .empty-icon {
  font-size: 28px;
}

.announcement-manager .empty strong {
  color: var(--manager-ink-2);
  font-size: 13px;
  font-weight: 500;
}

.announcement-manager .empty span {
  font-size: 12px;
}

/* ==========================================================================
   弹窗
   ========================================================================== */
.announcement-manager .overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(23, 23, 23, 0.16);
  animation: announcement-overlay-in 0.14s ease-out;
}

.announcement-manager .panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - 48px);
  overflow: hidden;
  border: 1px solid var(--announcement-border-panel);
  border-radius: 10px;
  background: var(--manager-bg);
  animation: announcement-panel-in 0.16s cubic-bezier(0.2, 0.7, 0.3, 1);
}

.announcement-manager .form-panel {
  max-width: 600px;
}

.announcement-manager .panel-head {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: none;
  height: 52px;
  padding: 0 18px 0 20px;
  border-bottom: 1px solid var(--manager-line-soft);
}

.announcement-manager .panel-head h2 {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.announcement-manager .panel-sub {
  color: var(--manager-placeholder);
  font-size: 11.5px;
}

.announcement-manager .panel-head .icon-btn {
  margin-left: auto;
}

.announcement-manager .dot {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--el-color-primary, #e3769b);
}

.announcement-manager .form-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 20px 12px;
}

.announcement-manager .field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.announcement-manager .field-label {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--manager-ink-2);
  font-size: 12px;
}

.announcement-manager .field-label em {
  color: var(--el-color-primary, #e3769b);
  font-style: normal;
}

.announcement-manager .field-label .counter {
  margin-left: auto;
  color: var(--manager-placeholder);
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: 10.5px;
}

.announcement-manager .field input[type='text'],
.announcement-manager .field textarea {
  width: 100%;
  padding: 9px 10px;
  border: 1px solid var(--manager-line);
  border-radius: 5px;
  background: var(--manager-bg);
  color: var(--manager-ink);
  font-size: 13px;
  outline: 0;
  transition: border-color 0.14s;
}

.announcement-manager .field input[type='text']:focus,
.announcement-manager .field textarea:focus {
  border-color: var(--el-color-primary, #e3769b);
}

.announcement-manager .field input[type='text'].is-error {
  border-color: var(--announcement-danger);
}

.announcement-manager .field input[type='text']::placeholder,
.announcement-manager .field textarea::placeholder {
  color: var(--manager-placeholder);
}

.announcement-manager .field textarea {
  min-height: 150px;
  resize: vertical;
  line-height: 1.8;
}

.announcement-manager .field-hint {
  color: var(--manager-placeholder);
  font-size: 11px;
}

.announcement-manager .switch-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0 0;
  border-top: 1px dashed var(--manager-line-soft);
}

.announcement-manager .switch-copy {
  flex: 1;
  min-width: 0;
}

.announcement-manager .switch-copy strong {
  display: block;
  font-size: 12.5px;
  font-weight: 500;
}

.announcement-manager .switch-copy span {
  display: block;
  margin-top: 3px;
  color: var(--manager-placeholder);
  font-size: 11px;
}

.announcement-manager .switch {
  position: relative;
  width: 36px;
  height: 20px;
  flex: none;
  border-radius: 999px;
  background: var(--announcement-switch-off);
  transition: background 0.16s;
}

.announcement-manager .switch::after {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--manager-bg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  transition: transform 0.16s;
  content: '';
}

.announcement-manager .switch.is-on {
  background: var(--el-color-primary, #e3769b);
}

.announcement-manager .switch.is-on::after {
  transform: translateX(16px);
}

.announcement-manager .panel-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  padding: 12px 20px;
  border-top: 1px solid var(--manager-line-soft);
  background: var(--manager-bg);
}

.announcement-manager .panel-foot .foot-hint {
  margin-right: auto;
  color: var(--manager-placeholder);
  font-size: 11px;
}

/* 底部按钮与添加友链弹窗保持一致 */
.announcement-manager .panel-foot .el-button {
  margin-left: 0;
  border-radius: 5px;
  font-size: 12px;
}

/* ==========================================================================
   删除确认气泡
   ========================================================================== */
.announcement-manager .popconfirm {
  position: fixed;
  z-index: 2100;
  width: 288px;
  padding: 12px 14px 10px;
  border: 1px solid var(--announcement-border-pop);
  border-radius: 8px;
  background: var(--manager-bg);
  animation: announcement-pop-in 0.13s ease-out;
}

.announcement-manager .popconfirm--above {
  animation-name: announcement-pop-in-up;
}

.announcement-manager .popconfirm-arrow {
  position: absolute;
  top: -5px;
  width: 8px;
  height: 8px;
  border-top: 1px solid var(--announcement-border-pop);
  border-left: 1px solid var(--announcement-border-pop);
  background: var(--manager-bg);
  transform: rotate(45deg);
}

.announcement-manager .popconfirm--above .popconfirm-arrow {
  top: auto;
  bottom: -5px;
  border-top: 0;
  border-left: 0;
  border-right: 1px solid var(--announcement-border-pop);
  border-bottom: 1px solid var(--announcement-border-pop);
}

.announcement-manager .pop-kicker {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: var(--manager-muted);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.announcement-manager .pop-kicker i {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--el-color-primary, #e3769b);
}

.announcement-manager .pop-title {
  overflow: hidden;
  margin: 7px 0 0;
  color: var(--manager-ink);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-manager .pop-desc {
  margin: 5px 0 0;
  color: var(--manager-muted);
  font-size: 11.5px;
  line-height: 1.6;
}

.announcement-manager .pop-foot {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px solid var(--manager-line-soft);
}

.announcement-manager .pop-foot .btn {
  height: 22px;
  padding: 0 7px;
  font-size: 11px;
}

/* ==========================================================================
   轻提示
   ========================================================================== */
.announcement-manager .toasts {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2200;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.announcement-manager .toast {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 240px;
  max-width: 380px;
  padding: 10px 12px 10px 14px;
  border: 1px solid var(--manager-line);
  border-radius: 7px;
  background: var(--manager-bg);
  color: var(--manager-ink-2);
  font-size: 12.5px;
  pointer-events: auto;
  animation: announcement-toast-in 0.18s ease-out;
}

.announcement-manager .toast-text {
  flex: 1;
  min-width: 0;
}

.announcement-manager .toast-action {
  flex: none;
  color: var(--el-color-primary, #e3769b);
  font-size: 12px;
  font-weight: 500;
}

.announcement-manager .toast-action:hover {
  color: var(--el-color-primary-dark-2, #d46288);
  text-decoration: underline;
  text-underline-offset: 3px;
}

@keyframes announcement-pop-in {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes announcement-pop-in-up {
  from {
    opacity: 0;
    transform: translateY(3px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes announcement-overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes announcement-panel-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes announcement-toast-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes announcement-fresh-bg {
  0% {
    background: var(--announcement-primary-soft);
  }
  100% {
    background: transparent;
  }
}

/* ==========================================================================
   响应式
   ========================================================================== */

@media (max-width: 900px) {
  .announcement-manager {
    padding: 20px 16px 0;
  }
}

@media (max-width: 640px) {
  .announcement-manager .manager-head {
    gap: 14px;
  }

  .announcement-manager .manager-head-actions {
    flex: none;
  }

  .announcement-manager .manager-toolbar {
    flex-wrap: nowrap;
    gap: 8px;
  }

  .announcement-manager .manager-mode-nav button {
    flex: 1;
    justify-content: center;
  }

  .announcement-manager .manager-filters {
    flex: 1;
    width: auto;
    min-width: 0;
    margin-left: 0;
  }

  .announcement-manager .filter-wrap {
    flex: none;
  }

  .announcement-manager .filter-pop {
    right: auto;
    left: 0;
    max-width: calc(100vw - 32px);
  }

  .announcement-manager .manager-search {
    flex: 1;
    min-width: 0;
    margin-left: 0;
  }

  .announcement-manager .manager-search input {
    width: 100%;
    min-width: 0;
  }

  .announcement-manager .manager-tabs {
    gap: 18px;
  }

  .announcement-manager .overlay {
    align-items: flex-end;
    padding: 12px;
  }

  .announcement-manager .panel {
    max-height: calc(100vh - 24px);
    border-radius: 10px 10px 0 0;
  }

  .announcement-manager .panel-sub {
    display: none;
  }

  .announcement-manager .toasts {
    right: 12px;
    left: 12px;
    bottom: 12px;
  }

  .announcement-manager .toast {
    min-width: 0;
    max-width: none;
  }
}

@media (max-width: 640px) and (orientation: portrait) {
  .announcement-manager .manager-mode-nav {
    display: inline-flex;
  }
}

/* 手机横屏保留列表视图，允许横向滚动查看所选列 */
@media (max-width: 640px) and (orientation: landscape) {
  .announcement-manager .manager-toolbar {
    align-items: center;
    flex-direction: row;
  }

  .announcement-manager .manager-filters {
    align-items: center;
    flex-direction: row;
    width: auto;
    margin-left: auto;
  }

  .announcement-manager .filter-wrap {
    width: auto;
  }

  .announcement-manager .manager-filter-button {
    width: auto;
  }

  .announcement-manager .manager-search {
    width: 180px;
  }

  .announcement-manager .manager-search input {
    width: 100%;
  }

  .announcement-manager .manager-table {
    display: block;
  }

  .announcement-manager .manager-list-body {
    overflow-x: auto;
  }
}

@media (max-width: 640px) and (orientation: portrait) {
  .announcement-manager .manager-table {
    min-width: 0;
  }

  .announcement-manager .manager-list-body {
    overflow-x: auto;
  }
}

/* 低高度横屏：压缩页头与工具行，优先留出列表空间 */
@media (max-width: 900px) and (orientation: landscape) and (max-height: 480px) {
  .announcement-manager {
    padding: 6px 16px 0;
  }

  .announcement-manager .manager-head {
    align-items: center;
    gap: 10px;
  }

  .announcement-manager .manager-head h1 {
    font-size: 18px;
  }

  .announcement-manager .manager-head p {
    display: none;
  }

  .announcement-manager .manager-head-actions {
    width: auto;
    flex: 0 0 auto;
  }

  .announcement-manager .manager-head-actions .el-button {
    flex: 0 0 auto;
    height: 28px;
  }

  .announcement-manager .manager-toolbar {
    margin-top: 6px;
  }

  .announcement-manager .manager-tabs-row {
    margin-top: 4px;
  }

  .announcement-manager .manager-row {
    min-height: 40px;
  }

  .announcement-manager .manager-row-head {
    min-height: 26px;
  }
}
html.dark .announcement-manager {
  --announcement-border-panel: #3a3a3a;
  --announcement-border-pop: #3a3a3a;
  --announcement-switch-off: #4a4a4a;
  --announcement-danger: #d98a8a;
  --announcement-danger-dark: #e6a3a3;
  --announcement-danger-line: #5a3a3a;
  --announcement-danger-soft: #2a1c1c;
  --announcement-primary-soft: #2a1c22;
}
</style>
