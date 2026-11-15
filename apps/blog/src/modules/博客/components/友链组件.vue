<script setup lang="ts">
import { 获取名称缩写, 获取网站图标 } from '@feathernest/module-blog/friend-links/icon'
import { BlogTwikooPanel, FriendLinkIcon } from '@feathernest/module-blog/widgets'
import { Icon } from '@iconify/vue'
import { ElEmpty, ElSkeleton } from 'element-plus'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 交换友链, 获取公开友链 } from '../../../modules/友链/api'
import type { FriendLinkRecord } from '../../../modules/友链/types'
import { 使用设置存储 } from '../../../shared/stores/settings'
import CopyButton from './复制按钮.vue'

const friendLinks = ref<FriendLinkRecord[]>([])
const loading = ref(true)
const settings = 使用设置存储()
const route = useRoute()

const selectedCategory = ref<string>('all')
const searchKeyword = computed(() => {
  return typeof route.query.search === 'string' ? route.query.search.trim() : ''
})

const normalizedSearchKeyword = computed(() => searchKeyword.value.toLocaleLowerCase('zh-CN'))

const allCategories = computed(() => {
  const cats = new Set<string>()
  for (const link of friendLinks.value) {
    if (link.category) cats.add(link.category)
  }
  return [...cats].sort((a, b) => a.localeCompare(b, 'zh-CN'))
})

const filteredLinks = computed(() => {
  return friendLinks.value.filter((link) => {
    if (selectedCategory.value !== 'all' && link.category !== selectedCategory.value) {
      return false
    }

    if (!normalizedSearchKeyword.value) {
      return true
    }

    const keyword = normalizedSearchKeyword.value
    return [
      link.name,
      link.url,
      link.description ?? '',
    ].some(field => field.toLocaleLowerCase('zh-CN').includes(keyword))
  })
})

async function loadFriendLinks() {
  try {
    friendLinks.value = await 获取公开友链()
  } catch (error) {
    console.error('[友链组件] 加载公开友链失败', error)
    friendLinks.value = []
  } finally {
    loading.value = false
  }
}

const site = {
  name: 'Sakurakuguの小窝',
  desc: '个人网站',
  url: 'https://www.sakurakugu.com',
  avatar: 'https://www.sakurakugu.com/头像.avif',
}

/** 本站信息的四个字段，左栏展示并供一键复制 */
const 本站字段 = [
  { label: '站点名称', value: site.name },
  { label: '站点描述', value: site.desc },
  { label: '站点链接', value: site.url },
  { label: '头像链接', value: site.avatar },
]

// ========== 友链申请 ==========
const 申请 = ref({
  名称: '',
  链接: '',
  简介: '',
  头像: '',
  联系人: '',
  邮箱: '',
  友链页: '',
})

const 步骤 = ref(1)
const 错误 = ref<{ 名称?: boolean; 链接?: boolean; 邮箱?: boolean }>({})

type 结果类型 = 'success' | 'pending' | 'error'
const 结果 = ref<{ 类型: 结果类型; 标题: string; 描述: string } | null>(null)
const 提交中 = ref(false)

/** 头像预览：优先用手填的头像链接，没填就从站点链接取 favicon */
const 头像加载失败 = ref(false)
const 头像地址 = computed(() => {
  const 直接 = 申请.value.头像.trim()
  if (直接) return 直接
  const 链接 = 申请.value.链接.trim()
  return 链接是否合法(链接) ? 获取网站图标(链接) : ''
})

watch(头像地址, () => {
  头像加载失败.value = false
})

/** 「获取」带出来的头像链接：站点链接一变就跟着重算，别留着旧域名 */
const 头像自动获取 = ref(false)

watch(
  () => 申请.value.链接,
  () => {
    if (!头像自动获取.value) return
    const 链接 = 申请.value.链接.trim()
    申请.value.头像 = 链接是否合法(链接) ? 获取网站图标(链接) : ''
  },
)

function 链接是否合法(url: string) {
  return /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(url.trim())
}

function 校验第一步() {
  const 新错误: typeof 错误.value = {}
  if (!申请.value.名称.trim()) 新错误.名称 = true
  const 链接 = 申请.value.链接.trim()
  if (!链接 || !链接是否合法(链接)) 新错误.链接 = true
  错误.value = 新错误
  return Object.keys(新错误).length === 0
}

function 校验第二步() {
  const 新错误: typeof 错误.value = {}
  const 邮箱 = 申请.value.邮箱.trim()
  // 邮箱选填，但填了就得像邮箱
  if (邮箱 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(邮箱)) 新错误.邮箱 = true
  错误.value = 新错误
  return Object.keys(新错误).length === 0
}

function 进入下一步(目标: number) {
  const 通过 = 目标 === 2 ? 校验第一步() : 校验第二步()
  if (!通过) return
  步骤.value = 目标
}

function 清除错误(字段: keyof typeof 错误.value) {
  错误.value[字段] = false
}

function 回到步骤(序号: number) {
  // 提交之后就不让再回来改了，想改就点「再申请一个」
  if (结果.value) return
  步骤.value = 序号
  错误.value = {}
}

function 获取头像() {
  const 链接 = 申请.value.链接.trim()
  if (!链接是否合法(链接)) {
    错误.value = { ...错误.value, 链接: true }
    return
  }
  申请.value.头像 = 获取网站图标(链接)
  头像自动获取.value = true
}

function 取错误信息(异常: unknown) {
  const 详情 = (异常 as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  if (typeof 详情 === 'string') return 详情
  if (Array.isArray(详情) && 详情.length > 0) {
    const 首条 = 详情[0] as { msg?: string }
    if (首条?.msg) return 首条.msg
  }
  return '提交失败，请稍后再试'
}

async function 提交申请() {
  if (!校验第一步() || !校验第二步()) {
    步骤.value = 1
    return
  }

  提交中.value = true
  try {
    const 响应 = await 交换友链({
      name: 申请.value.名称.trim(),
      url: 申请.value.链接.trim(),
      description: 申请.value.简介.trim() || null,
      logo_url: 申请.value.头像.trim() || null,
      contact_name: 申请.value.联系人.trim() || null,
      contact_email: 申请.value.邮箱.trim() || null,
      // 没填友链页就用站点链接兜底，后端会去抓这个页面找本站链接
      my_site_url: 申请.value.友链页.trim() || 申请.value.链接.trim(),
    })

    if (响应.auto_approved) {
      结果.value = {
        类型: 'success',
        标题: '申请已自动通过',
        描述: '检测到你的友链页已经挂上本站链接，友链已添加，刷新列表就能看到。',
      }
      void loadFriendLinks()
    } else {
      结果.value = {
        类型: 'pending',
        标题: '已提交，等待审核',
        描述: 响应.message || '没检测到本站链接，先放在待审核里，加好后会尽快通过。',
      }
    }
  } catch (异常) {
    console.error('[友链组件] 提交友链申请失败', 异常)
    结果.value = {
      类型: 'error',
      标题: '提交失败',
      描述: 取错误信息(异常),
    }
  } finally {
    提交中.value = false
  }
}

function 重置申请() {
  申请.value = { 名称: '', 链接: '', 简介: '', 头像: '', 联系人: '', 邮箱: '', 友链页: '' }
  头像自动获取.value = false
  错误.value = {}
  结果.value = null
  步骤.value = 1
  void 重新计算高度()
}

// ========== 双栏时锁住右栏高度，切换步骤不跳 ==========
const 表单区 = ref<HTMLElement | null>(null)
const 信息网格 = ref<HTMLElement | null>(null)
const 最小高度 = ref(0)

let 尺寸观察: ResizeObserver | null = null
let 上次宽度 = 0

const 是双栏 = () => window.matchMedia('(min-width: 992px)').matches

async function 重新计算高度(回到第一步 = false) {
  if (!信息网格.value || !表单区.value) return

  // 竖屏单列时放手让内容自己撑，左栏也随之缩紧
  if (!是双栏()) {
    最小高度.value = 0
    return
  }

  const 原步骤 = 步骤.value
  最小高度.value = 0

  if (回到第一步 && 原步骤 !== 1) {
    步骤.value = 1
    await nextTick()
  }

  最小高度.value = 表单区.value.scrollHeight

  if (步骤.value !== 原步骤) {
    步骤.value = 原步骤
    await nextTick()
  }
}

onMounted(async () => {
  void loadFriendLinks()

  await nextTick()
  await 重新计算高度()

  尺寸观察 = new ResizeObserver((entries) => {
    const 宽度 = entries[0]?.contentRect.width ?? 0
    if (Math.abs(宽度 - 上次宽度) < 1) return
    上次宽度 = 宽度
    void 重新计算高度(true)
  })

  if (信息网格.value) {
    上次宽度 = 信息网格.value.getBoundingClientRect().width
    尺寸观察.observe(信息网格.value)
  }
})

onUnmounted(() => {
  尺寸观察?.disconnect()
  尺寸观察 = null
})
</script>

<template>
  <div id="friend-links" class="friend-links-section">
    <div class="friend-links-card">
      <!-- 标题区 -->
      <div class="header-wrap">
        <div class="header-row">
          <div class="header-icon">
            <Icon icon="material-symbols:group" />
          </div>
          <div class="header-title">
            友情链接
          </div>
        </div>
        <p class="header-desc">
          这里是我的朋友们，欢迎互相访问交流
        </p>
      </div>

      <!-- 友链列表 -->
      <div class="friend-links-body">
        <ElSkeleton :loading="loading" animated>
          <div v-if="friendLinks.length > 0">
            <!-- 分类筛选 -->
            <div class="category-filter">
              <button
                :class="['filter-btn', { active: selectedCategory === 'all' }]"
                @click="selectedCategory = 'all'"
              >
                全部
              </button>
              <button
                v-for="cat in allCategories"
                :key="cat"
                :class="['filter-btn', { active: selectedCategory === cat }]"
                @click="selectedCategory = cat"
              >
                {{ cat }}
              </button>
            </div>

            <div v-if="filteredLinks.length > 0" class="friends-grid">
              <a
                v-for="friendLink in filteredLinks"
                :key="friendLink.id"
                :href="friendLink.url"
                target="_blank"
                rel="noopener noreferrer"
                class="friend-card group"
              >
                <div class="friend-card-bg" aria-hidden="true" />
                <div class="friend-avatar">
                  <FriendLinkIcon
                    :name="friendLink.name"
                    :url="friendLink.url"
                    :logo-url="friendLink.logo_url"
                    style="width: 100%; height: 100%; font-size: inherit; border-radius: inherit"
                  />
                </div>
                <div class="friend-info">
                  <div class="friend-title-row">
                    <div class="friend-name">
                      {{ friendLink.name }}
                    </div>
                    <Icon icon="material-symbols:arrow-outward-rounded" class="friend-arrow" />
                  </div>
                  <div class="friend-desc" :title="friendLink.description || '暂无描述'">
                    {{ friendLink.description || '暂无描述' }}
                  </div>
                  <div v-if="friendLink.category" class="friend-tags">
                    <span class="friend-tag">{{ friendLink.category }}</span>
                  </div>
                </div>
              </a>
            </div>
            <ElEmpty v-else :description="searchKeyword ? '没有匹配的友链' : '暂无友链'" />
          </div>
          <ElEmpty v-else description="暂无友链" />
        </ElSkeleton>
      </div>
    </div>

    <!-- 底部内容 -->
    <div class="bottom-card friend-links-card">
      <div ref="信息网格" class="info-grid">
        <!-- 左栏：本站信息 -->
        <div class="info-panel site-panel">
          <div class="panel-inner">
            <div class="panel-head">
              <span class="panel-icon">
                <Icon icon="lucide:link" />
              </span>
              <h3>本站信息</h3>
            </div>

            <div class="site-head">
              <div class="avatar-wrap">
                <div class="site-avatar">
                  <img :src="site.avatar" :alt="site.name" loading="lazy" decoding="async">
                </div>
                <div class="verify-badge">
                  <svg class="verify-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="site-name">{{ site.name }}</h3>
                <p class="site-desc">{{ site.desc }}</p>
              </div>
            </div>

            <div class="copy-list">
              <div
                v-for="item in 本站字段"
                :key="item.label"
                class="copy-row"
              >
                <div class="min-w-0">
                  <p class="copy-label">{{ item.label }}</p>
                  <p class="copy-value">{{ item.value }}</p>
                </div>
                <CopyButton
                  class="copy-btn"
                  :text="item.value"
                  :无障碍标签="`复制${item.label}`"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 右栏：申请友链（三步折叠） -->
        <div class="info-panel form-panel">
          <div class="panel-inner">
            <div class="panel-head">
              <span class="panel-icon">
                <Icon icon="material-symbols:add-rounded" />
              </span>
              <h3>申请友链</h3>
            </div>

            <div
              ref="表单区"
              class="apply-body"
              :class="{ 'is-submitted': 结果 }"
              :style="最小高度 ? { minHeight: `${最小高度}px` } : undefined"
            >
              <!-- 第 1 步：填写站点信息 -->
              <div class="tstep" :class="{ 'is-open': 步骤 === 1 }">
                <div class="tstep-left">
                  <span class="tnum">1</span>
                  <span class="tline" />
                </div>
                <div class="tstep-body">
                  <button class="tstep-head" type="button" @click="回到步骤(1)">
                    填写信息
                    <Icon icon="material-symbols:chevron-right-rounded" class="chev" />
                  </button>
                  <div v-show="步骤 === 1" class="tstep-content">
                    <div class="field">
                      <label>站点名称 <i class="req">*</i></label>
                      <input
                        v-model="申请.名称"
                        :class="{ 'is-invalid': 错误.名称 }"
                        placeholder="例如：某某的小站"
                        autocomplete="off"
                        @input="清除错误('名称')"
                      >
                    </div>
                    <div class="field">
                      <label>站点链接 <i class="req">*</i></label>
                      <input
                        v-model="申请.链接"
                        :class="{ 'is-invalid': 错误.链接 }"
                        placeholder="https://example.com"
                        autocomplete="off"
                        @input="清除错误('链接')"
                      >
                    </div>
                    <div class="field">
                      <label>一句话简介 <span class="opt">选填</span></label>
                      <input
                        v-model="申请.简介"
                        placeholder="例如：记录代码与生活的角落"
                        autocomplete="off"
                      >
                    </div>
                    <div class="field">
                      <label>头像链接 <span class="opt">选填</span></label>
                      <div class="avatar-row">
                        <div class="avatar-preview">
                          <img
                            v-if="头像地址 && !头像加载失败"
                            :src="头像地址"
                            alt=""
                            @error="头像加载失败 = true"
                          >
                          <span v-else-if="申请.名称.trim()">{{ 获取名称缩写(申请.名称) }}</span>
                          <Icon v-else icon="material-symbols:image-outline" />
                        </div>
                        <input
                          v-model="申请.头像"
                          placeholder="留空自动取图标"
                          autocomplete="off"
                          @input="头像自动获取 = false"
                        >
                        <button class="avatar-fetch" type="button" @click="获取头像">获取</button>
                      </div>
                    </div>
                    <button class="apply-btn" type="button" @click="进入下一步(2)">
                      进入下一步
                      <Icon icon="material-symbols:arrow-forward-rounded" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- 第 2 步：核验信息 -->
              <div class="tstep" :class="{ 'is-open': 步骤 === 2 }">
                <div class="tstep-left">
                  <span class="tnum">2</span>
                  <span class="tline" />
                </div>
                <div class="tstep-body">
                  <button class="tstep-head" type="button" @click="回到步骤(2)">
                    联系方式
                    <Icon icon="material-symbols:chevron-right-rounded" class="chev" />
                  </button>
                  <div v-show="步骤 === 2" class="tstep-content">
                    <div class="field">
                      <label>联系名称 <span class="opt">选填</span></label>
                      <input
                        v-model="申请.联系人"
                        placeholder="张三"
                        autocomplete="off"
                      >
                    </div>
                    <div class="field">
                      <label>联系邮箱 <span class="opt">选填</span></label>
                      <input
                        v-model="申请.邮箱"
                        :class="{ 'is-invalid': 错误.邮箱 }"
                        type="email"
                        placeholder="example@qq.com"
                        autocomplete="off"
                        @input="清除错误('邮箱')"
                      >
                    </div>
                    <p class="tstep-text">
                      用于发邮箱提示已添加友链，不会公开展示。
                    </p>
                    <button class="apply-btn" type="button" @click="进入下一步(3)">
                      进入下一步
                      <Icon icon="material-symbols:arrow-forward-rounded" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- 第 3 步：等结果 -->
              <div class="tstep" :class="{ 'is-open': 步骤 === 3 }">
                <div class="tstep-left">
                  <span class="tnum">3</span>
                </div>
                <div class="tstep-body">
                  <button class="tstep-head" type="button" @click="回到步骤(3)">
                    提交申请
                    <Icon icon="material-symbols:chevron-right-rounded" class="chev" />
                  </button>
                  <div v-show="步骤 === 3" class="tstep-content">
                    <template v-if="!结果">
                      <div class="field">
                        <label>你的友链页面 <span class="opt">选填</span></label>
                        <input
                          v-model="申请.友链页"
                          placeholder="https://example.com/friends"
                          autocomplete="off"
                        >
                      </div>
                      <p class="tstep-text">
                        用于自动通过友链，否则要等一会。
                      </p>
                      <button class="apply-btn" type="button" :disabled="提交中" @click="提交申请">
                        <span v-if="提交中" class="spinner" />
                        {{ 提交中 ? '提交中…' : '提交申请' }}
                      </button>
                    </template>
                    <div v-else class="apply-result" :class="`is-${结果.类型}`">
                      <div class="result-icon">
                        <Icon :icon="结果.类型 === 'success'
                          ? 'material-symbols:check-rounded'
                          : 结果.类型 === 'pending'
                            ? 'material-symbols:schedule-rounded'
                            : 'material-symbols:error-outline-rounded'" />
                      </div>
                      <div>
                        <p class="result-title">{{ 结果.标题 }}</p>
                        <p class="result-desc">{{ 结果.描述 }}</p>
                        <button class="link-btn" type="button" @click="重置申请">再申请一个</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BlogTwikooPanel
      class="friend-links-comment-panel"
      path="/friends"
      title="友链评论区"
      empty-description="友链评论区尚未配置 Twikoo 服务地址"
      :hide-admin-entry="true"
      :visibility="settings.commentVisibility"
    />
  </div>
</template>

<style scoped>
.friend-links-section {
  width: 100%;
}

.bottom-card {
  margin-top: 1rem;
}

.friend-links-comment-panel {
  margin-top: 1rem;
}

.friend-links-card {
  background: var(--card-bg-transparent);
  border-radius: var(--radius-large);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s, border-color 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(18px);
  box-shadow: 0 10px 30px rgba(148, 163, 184, 0.14);
  padding: 1.5rem;
}

.dark .friend-links-card {
  border-color: rgba(148, 163, 184, 0.16);
  box-shadow: 0 12px 28px rgba(2, 6, 23, 0.28);
}

.header-wrap {
  margin-bottom: 1rem;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.header-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.5rem;
}

.header-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.header-desc {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.625;
  margin-bottom: 1rem;
}

.friend-links-body :deep(.el-empty) {
  padding: 2rem 0;
}

.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filter-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: var(--btn-regular-bg);
  color: var(--btn-content);
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.filter-btn:hover {
  background: var(--btn-regular-bg-hover);
}

.filter-btn.active {
  background: var(--primary);
  color: #fff;
}

.filter-btn.active:hover {
  background: var(--primary);
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.friend-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem;
  border-radius: 0.75rem;
  border: 1px solid var(--line-divider);
  text-decoration: none;
  overflow: hidden;
  transition: all 0.3s;
}

.friend-card:hover {
  border-color: var(--primary);
  background: var(--card-bg-transparent);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.friend-card-bg {
  position: absolute;
  inset: 0;
  background: var(--primary);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.friend-card:hover .friend-card-bg {
  opacity: 0.05;
}

.friend-avatar {
  position: relative;
  width: 4rem;
  height: 4rem;
  flex-shrink: 0;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #f4f4f5;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.3s;
}

.dark .friend-avatar {
  background: #27272a;
  border-color: rgba(255, 255, 255, 0.05);
}

.friend-card:hover .friend-avatar {
  transform: scale(1.05);
}

.friend-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.125rem;
}

.friend-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.friend-name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 1rem;
  transition: color 0.3s;
}

.friend-card:hover .friend-name {
  color: var(--primary);
}

.friend-arrow {
  font-size: 1.125rem;
  color: var(--primary);
  opacity: 0;
  transform: translateX(-0.5rem);
  transition: all 0.3s;
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

.friend-card:hover .friend-arrow {
  opacity: 1;
  transform: translateX(0);
}

.friend-desc {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25rem;
}

.friend-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.friend-tag {
  font-size: 0.65rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-tertiary);
}

.dark .friend-tag {
  background: rgba(255, 255, 255, 0.05);
}

/* 底部内容 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: stretch;
}

@media (min-width: 992px) {
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.info-panel {
  border-radius: 1rem;
  border: 1px solid var(--line-divider);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-inner {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.panel-head h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.panel-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  display: grid;
  place-items: center;
  font-size: 0.875rem;
  color: var(--primary);
  background: rgba(var(--el-color-primary-rgb), 0.12);
}

/* ========== 左栏：本站信息 ========== */
.site-panel {
  padding: 0;
}

.site-panel .panel-inner {
  padding: 1.5rem;
}

.site-panel .panel-head {
  margin-bottom: 1.35rem;
}

.site-head {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.site-avatar {
  width: 5rem;
  height: 5rem;
  border-radius: 0.375rem;
  overflow: hidden;
  box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
}

.site-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.verify-badge {
  position: absolute;
  bottom: -0.25rem;
  right: -0.25rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px var(--card-bg-transparent);
}

.verify-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: #fff;
}

.site-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.site-desc {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin-top: 0.2rem;
}

.copy-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.copy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-radius: 0.65rem;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.75rem 0.9rem;
}

.dark .copy-row {
  background: rgba(255, 255, 255, 0.05);
}

.copy-label {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  margin-bottom: 0.2rem;
}

.copy-value {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 15rem;
}

.copy-btn {
  flex-shrink: 0;
  width: 1.9rem;
  height: 1.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: rgba(0, 0, 0, 0.1);
  color: var(--btn-content);
  transition: opacity 0.2s;
  cursor: pointer;
  border: none;
  padding: 0;
}

.dark .copy-btn {
  background: rgba(255, 255, 255, 0.1);
}

.copy-btn:hover {
  opacity: 0.8;
}

/* ========== 右栏：三步向导 ========== */
.form-panel .panel-inner {
  padding: 1.25rem 1.35rem;
}

.apply-body {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.tstep {
  display: flex;
  gap: 0.875rem;
}

.tstep-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.tnum {
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tline {
  width: 2px;
  flex: 1;
  margin: 0.35rem 0;
  border-radius: 2px;
  background: color-mix(in srgb, var(--text-primary) 15%, transparent);
}

.tstep-body {
  flex: 1;
  min-width: 0;
  padding-bottom: 1rem;
}

.tstep:last-child .tstep-body {
  padding-bottom: 0;
}

.tstep:not(.is-open) .tstep-body {
  padding-bottom: 0.5rem;
}

.tstep-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0;
  margin: 0;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.75rem;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
}

.tstep:not(.is-open) .tstep-head {
  color: var(--text-tertiary);
}

.tstep-head .chev {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--text-tertiary);
  transition: transform 0.25s;
}

.tstep.is-open .tstep-head .chev {
  transform: rotate(90deg);
}

.tstep-content {
  padding-top: 0.15rem;
}

/* 字段 */
.field {
  margin-bottom: 0.55rem;
}

.field label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.field label .req {
  color: var(--el-color-danger);
  font-style: normal;
}

.field label .opt {
  font-weight: 400;
  color: var(--text-tertiary);
}

.field input {
  width: 100%;
  height: 2.25rem;
  padding: 0 0.65rem;
  font-family: inherit;
  font-size: 0.8125rem;
  line-height: 1.2;
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.045);
  border: 1px solid var(--line-divider);
  border-radius: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}

.dark .field input {
  background: rgba(255, 255, 255, 0.07);
}

.field input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.75;
}

.field input:focus {
  outline: none;
  background: var(--card-bg-transparent);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.14);
}

.field input.is-invalid {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

/* 头像：预览框 + 输入 + 获取 */
.avatar-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar-preview {
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border-radius: 0.45rem;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.045);
  border: 1px solid var(--line-divider);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.dark .avatar-preview {
  background: rgba(255, 255, 255, 0.07);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-preview .iconify {
  font-size: 0.95rem;
  color: var(--text-tertiary);
}

.avatar-row input {
  flex: 1;
  width: auto;
  min-width: 0;
}

.avatar-fetch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 2.25rem;
  padding: 0 0.7rem;
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--primary);
  background: rgba(var(--el-color-primary-rgb), 0.1);
  border: none;
  border-radius: 0.45rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.avatar-fetch:hover {
  background: rgba(var(--el-color-primary-rgb), 0.18);
}

/* 步骤按钮 */
.apply-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  height: 2.25rem;
  margin-top: 0.35rem;
  padding: 0 1rem;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fff;
  background: var(--primary);
  border: none;
  border-radius: 0.55rem;
  cursor: pointer;
  transition: filter 0.2s, transform 0.15s;
}

.apply-btn:hover:not(:disabled) {
  filter: brightness(1.06);
}

.apply-btn:disabled {
  opacity: 0.75;
  cursor: progress;
}

.tstep-text {
  margin: 0 0 0.55rem;
  font-size: 0.75rem;
  line-height: 1.65;
  color: var(--text-tertiary);
}

.spinner {
  width: 0.85em;
  height: 0.85em;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: friend-spin 0.7s linear infinite;
}

@keyframes friend-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 结果态 */
.apply-result {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.35rem;
  padding: 0.9rem;
  border-radius: 0.7rem;
  border: 1px solid transparent;
}

.apply-result.is-success {
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
  border-color: color-mix(in srgb, var(--el-color-success) 28%, transparent);
}

.apply-result.is-pending {
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
  border-color: color-mix(in srgb, var(--el-color-warning) 28%, transparent);
}

.apply-result.is-error {
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
  border-color: color-mix(in srgb, var(--el-color-danger) 28%, transparent);
}

.result-icon {
  width: 1.6rem;
  height: 1.6rem;
  flex-shrink: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1rem;
}

.is-success .result-icon {
  background: var(--el-color-success);
}

.is-pending .result-icon {
  background: var(--el-color-warning);
}

.is-error .result-icon {
  background: var(--el-color-danger);
}

.result-title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.result-desc {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.link-btn {
  margin-top: 0.5rem;
  padding: 0;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* 提交后前两步变淡只读 */
.is-submitted .tstep:not(:last-child) {
  opacity: 0.55;
  pointer-events: none;
}

.is-submitted .tstep:not(:last-child) .tline {
  opacity: 0.6;
}

.min-w-0 {
  min-width: 0;
}

:deep(.el-skeleton) {
  width: 100%;
}

/* 竖屏 / 窄屏：左栏缩回紧凑版 */
@media (max-width: 991px) {
  .site-panel .panel-inner {
    padding: 1rem 1.1rem;
  }

  .site-panel .panel-head {
    margin-bottom: 1rem;
  }

  .site-head {
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .site-avatar {
    width: 3rem;
    height: 3rem;
  }

  .site-name {
    font-size: 1rem;
  }

  .site-desc {
    font-size: 0.75rem;
    margin-top: 0.1rem;
  }

  .copy-list {
    gap: 0.5rem;
  }

  .copy-row {
    padding: 0.5rem 0.7rem;
    border-radius: 0.5rem;
  }

  .copy-label {
    font-size: 0.625rem;
    margin-bottom: 0.1rem;
  }

  .copy-value {
    font-size: 0.75rem;
    max-width: 12rem;
  }

  .copy-btn {
    width: 1.7rem;
    height: 1.7rem;
  }
}
</style>
