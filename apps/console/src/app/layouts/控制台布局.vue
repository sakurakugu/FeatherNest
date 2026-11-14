<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { 获取我的文章列表 } from '@feathernest/module-articles'
import { 获取待办列表 } from '@feathernest/domain/todos'
import { 获取文娱列表 } from '@feathernest/module-media'
import { 获取已发布动态 } from '@feathernest/module-moments'
import { 获取资料列表 } from '@feathernest/module-materials'
import { 获取设备会话列表 } from '@feathernest/domain/auth'
import { 获取公告列表, 获取推送令牌 } from '../../modules/管理/api'
import { 获取已发布博客总数 } from '@feathernest/module-blog'
import { 获取友链列表 } from '../../modules/友链/api'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppConsoleLayout from '../components/layout/应用控制台布局.vue'
import ConsoleTabBar from '../components/layout/控制台标签栏.vue'
import type { 控制台菜单项 } from '../components/layout/ConsoleLayout'
import { 过滤仪表盘菜单项 } from '../navigation/dashboard-navigation'
import { 是否控制台标签操作进行中 } from '../router/dashboard-tab-operation'
import { 控制台标签缓存上限, 使用控制台标签存储 } from '../stores/dashboard-tabs'

const route = useRoute()
const router = useRouter()
const tabsStore = 使用控制台标签存储()

const articleCount = ref<number>()
const todoCount = ref<number>()
const announcementCount = ref<number>()
const friendLinkCount = ref<number>()
const pushCount = ref<number>()
const mediaCount = ref<number>()
const publishedBlogCount = ref<number>()
const momentCount = ref<number>()
const organizedMaterialCount = ref<number>()
const activeDeviceCount = ref<number>()
const menuOptions = computed<控制台菜单项[]>(() =>
  过滤仪表盘菜单项().map((item) => ({
    ...item,
    count: ({
      '/admin/articles': articleCount.value,
      '/admin/todos': todoCount.value,
      '/admin/announcements': announcementCount.value,
      '/admin/friend-links': friendLinkCount.value,
      '/admin/push': pushCount.value,
      '/admin/media': mediaCount.value,
      '/admin/blog': publishedBlogCount.value,
      '/admin/moments': momentCount.value,
      '/admin/materials': organizedMaterialCount.value,
      '/admin/account': activeDeviceCount.value,
    } as Record<string, number | undefined>)[item.key],
  })),
)

async function 更新菜单数量<T>(读取: () => Promise<T>, 更新: (数据: T) => void) {
  try {
    更新(await 读取())
  } catch (error) {
    console.error('读取侧栏数量失败', error)
  }
}

void 更新菜单数量(() => 获取我的文章列表(1, 1), (data) => { articleCount.value = data.total })
void 更新菜单数量(async () => (await 获取待办列表()).length, (count) => { todoCount.value = count })
void 更新菜单数量(() => 获取公告列表({ page: 1, pageSize: 1 }), (data) => {
  announcementCount.value = data.active_total
})
void 更新菜单数量(() => 获取友链列表(1, 1), (data) => { friendLinkCount.value = data.total })
void 更新菜单数量(async () => (await 获取推送令牌()).length, (count) => { pushCount.value = count })
void 更新菜单数量(async () => (await 获取文娱列表({ page: 1, page_size: 1 })).total, (count) => {
  mediaCount.value = count
})
void 更新菜单数量(获取已发布博客总数, (count) => {
  publishedBlogCount.value = count
})
void 更新菜单数量(async () => (await 获取已发布动态(1, 1)).total, (count) => { momentCount.value = count })
void 更新菜单数量(async () => (await 获取资料列表({ page: 1, page_size: 1, status: 'archived' })).total, (count) => {
  organizedMaterialCount.value = count
})
void 更新菜单数量(async () => (await 获取设备会话列表()).filter((session) => !session.revoked_at).length, (count) => {
  activeDeviceCount.value = count
})

tabsStore.init(router, route)

watch(
  () => route.fullPath,
  () => {
    // 关闭标签会先导航、导航成功后再落标签状态，这段路由变化不参与标签同步
    if (是否控制台标签操作进行中()) {
      return
    }
    tabsStore.syncRoute(route)
  },
  { immediate: true },
)

/**
 * 标签页 KeepAlive 缓存键：标签 + 页面标识 + 实例版本。
 * 切换标签能命中缓存保留页面状态；刷新标签或同一标签换页面时键变化，页面会重新创建。
 */
const 标签缓存键 = computed(() => {
  const 标签 = tabsStore.getTabByPath(route.path) ?? tabsStore.activeTab
  const 页面标识 = route.matched[route.matched.length - 1]?.path ?? route.path
  return `${标签?.id ?? '未归属标签'}::${页面标识}::${标签?.实例版本 ?? 0}`
})
</script>

<template>
  <AppConsoleLayout title="控制台" storage-key="dashboard_sider_mode" :menu-items="menuOptions">
    <div class="dashboard-workspace">
      <ConsoleTabBar />
      <div class="dashboard-workspace__body">
        <RouterView v-slot="{ Component }">
          <KeepAlive :max="控制台标签缓存上限">
            <component
              :is="Component"
              :key="标签缓存键"
              @article-count-change="articleCount = $event"
              @announcement-count-change="announcementCount = $event"
              @friend-link-count-change="friendLinkCount = $event"
              @push-count-change="pushCount = $event"
              @media-count-change="mediaCount = $event"
              @published-blog-count-change="publishedBlogCount = $event"
              @moment-count-change="momentCount = $event"
              @organized-material-count-change="organizedMaterialCount = $event"
              @active-device-count-change="activeDeviceCount = $event"
            />
          </KeepAlive>
        </RouterView>
      </div>
    </div>
  </AppConsoleLayout>
</template>

<style scoped>
.dashboard-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.dashboard-workspace__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.dashboard-workspace__body :deep(> *) {
  height: 100%;
}
</style>
