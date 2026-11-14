<script setup lang="ts">
import { Histogram, Refresh } from '@element-plus/icons-vue'
import { 获取API错误消息 } from '@feathernest/api'
import { 获取博客统计, 获取仪表盘统计, type BlogStats, type DashboardStats } from '@feathernest/domain/system'
import { 使用待办存储 } from '@feathernest/domain/todos'
import { TodoHeatmap } from '@feathernest/module-todos'
import { AppIconButton, PageSectionShell } from '@feathernest/ui'
import { ElAlert, ElCard, ElSkeleton, ElStatistic, ElTooltip } from 'element-plus'
import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import type { EChartsOption } from 'echarts'
import VChart from 'vue-echarts'

withDefaults(
  defineProps<{
    showBack?: boolean
    backTo?: string
  }>(),
  {
    showBack: false,
    backTo: '/',
  },
)

const loading = ref(false)
const loadError = ref('')
const todoStore = 使用待办存储()
const { todos } = storeToRefs(todoStore)
const stats = ref<Pick<
  DashboardStats,
  | 'total_todos'
  | 'total_articles'
  | 'total_views'
  | 'recent_views'
  | 'current_month_bill_income_cent'
  | 'current_month_bill_expense_cent'
  | 'current_month_bill_net_cent'
  | 'current_month_bill_record_count'
> | null>(null)
const blogStats = ref<BlogStats | null>(null)
const blogStatsError = ref(false)
const chartOption = ref<EChartsOption>({})

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent])

function buildChartOption(data: DashboardStats): EChartsOption {
  const color = typeof window === 'undefined'
    ? '#18a058'
    : window.getComputedStyle(document.documentElement).getPropertyValue('--el-color-primary').trim() || '#18a058'
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.recent_views.map((item) => item.date) },
    yAxis: { type: 'value' },
    series: [{ data: data.recent_views.map((item) => item.count), type: 'bar', itemStyle: { color } }],
  }
}

async function loadStats() {
  if (loading.value) return

  loading.value = true
  loadError.value = ''
  console.info('[数据统计] 开始加载')
  try {
    const [dashboardStats, , blogStatsResult] = await Promise.all([
      获取仪表盘统计(),
      todoStore.fetchTodos(),
      获取博客统计(),
    ])
    stats.value = dashboardStats
    blogStats.value = blogStatsResult
    chartOption.value = buildChartOption(dashboardStats)
    console.info('[数据统计] 加载完成')
  } catch (error) {
    loadError.value = 获取API错误消息(error, '数据统计加载失败，请重试')
    console.error('[数据统计] 加载失败', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadStats()
})

watch(() => stats.value?.recent_views, (views) => {
  if (stats.value && views) chartOption.value = buildChartOption(stats.value)
})
</script>

<template>
  <div class="data-stats-page">
    <PageSectionShell title="综合统计" :icon="Histogram" :show-back="showBack" :to="backTo">
      <template #actions>
        <ElTooltip :content="loadError ? '重试' : '刷新'">
          <AppIconButton
            :label="loadError ? '重试加载数据统计' : '刷新数据统计'"
            :disabled="loading"
            @click="loadStats"
          >
            <Refresh />
          </AppIconButton>
        </ElTooltip>
      </template>
      <ElAlert v-if="loadError" :title="loadError" type="error" :closable="false" show-icon />
      <ElSkeleton v-else :loading="loading" animated>
        <div v-if="stats" class="stats-summary">
          <ElCard shadow="never"><ElStatistic title="待办" :value="stats.total_todos" /></ElCard>
          <ElCard shadow="never"><ElStatistic title="已发布文章" :value="stats.total_articles" /></ElCard>
          <ElCard shadow="never"><ElStatistic title="文章浏览量" :value="stats.total_views" /></ElCard>
          <ElCard shadow="never"><ElStatistic title="文章分类" :value="blogStats?.total_categories ?? 0" /></ElCard>
          <ElCard shadow="never"><ElStatistic title="文章标签" :value="blogStats?.total_tags ?? 0" /></ElCard>
          <ElCard shadow="never"><ElStatistic title="文章总字数" :value="blogStats?.total_words ?? 0" /></ElCard>
          <ElCard shadow="never">
            <ElStatistic
              title="本月收入"
              :value="stats.current_month_bill_income_cent / 100"
              :precision="2"
            >
              <template #suffix>元</template>
            </ElStatistic>
          </ElCard>
          <ElCard shadow="never">
            <ElStatistic
              title="本月支出"
              :value="stats.current_month_bill_expense_cent / 100"
              :precision="2"
            >
              <template #suffix>元</template>
            </ElStatistic>
          </ElCard>
          <ElCard shadow="never">
            <ElStatistic
              title="本月结余"
              :value="stats.current_month_bill_net_cent / 100"
              :precision="2"
            >
              <template #suffix>元</template>
            </ElStatistic>
          </ElCard>
          <ElCard shadow="never">
            <ElStatistic title="本月记账笔数" :value="stats.current_month_bill_record_count" />
          </ElCard>
        </div>
        <ElAlert v-if="blogStatsError" title="博客统计加载失败，请刷新页面重试" type="error" :closable="false" show-icon />
        <ElCard header="最近7天文章访问趋势" style="margin: 24px 0">
          <VChart v-if="stats?.recent_views.length" :option="chartOption" style="height: 300px" autoresize />
          <div v-else style="text-align: center; padding: 40px; color: #999">暂无数据</div>
        </ElCard>
        <TodoHeatmap :todos="todos" />
      </ElSkeleton>
    </PageSectionShell>
  </div>
</template>

<style scoped>
.data-stats-page {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stats-summary :deep(.el-card) {
  min-width: 0;
  border-radius: 8px;
}

.stats-summary :deep(.el-statistic__content) {
  overflow-wrap: anywhere;
}

@media (max-width: 1100px) {
  .stats-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .data-stats-page {
    padding: 16px;
  }

  .stats-summary {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
