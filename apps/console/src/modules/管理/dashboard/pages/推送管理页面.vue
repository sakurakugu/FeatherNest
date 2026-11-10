<script setup lang="ts">
import { Message, Plus, RefreshRight } from '@element-plus/icons-vue'
import { 解析当前API基地址 } from '@feathernest/api'
import { PageSectionShell } from '@feathernest/ui'
import {
  ElAlert,
  ElButton,
  ElCard,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { 获取API错误消息 } from '../../../../shared/api'
import {
  创建推送渠道,
  创建推送令牌,
  删除推送渠道,
  删除推送令牌,
  获取推送渠道,
  获取推送令牌,
  测试推送渠道,
  更新推送渠道,
  更新推送令牌状态,
} from '../../api'
import type { PushChannel, PushProvider, PushToken, PushTokenCreated } from '../../types'

const channels = ref<PushChannel[]>([])
const tokens = ref<PushToken[]>([])
const loading = ref(true)
const saving = ref(false)
const channelDialog = ref(false)
const editingChannel = ref<PushChannel | null>(null)
const tokenName = ref('')
const tokenChannelIds = ref<string[]>([])
const tokenSaving = ref(false)
const createdToken = ref<PushTokenCreated | null>(null)
const channelForm = reactive({ name: '', provider: 'bark' as PushProvider, configJson: '' })
const wxpusherForm = reactive({ appToken: '', uids: '', topicIds: '', contentType: '' })

const providerOptions: Array<{ label: string; value: PushProvider }> = [
  { label: 'Bark', value: 'bark' },
  { label: 'Server 酱', value: 'serverchan' },
  { label: 'PushPlus', value: 'pushplus' },
  { label: 'WXPusher', value: 'wxpusher' },
  { label: '企业微信机器人', value: 'wecom' },
  { label: '飞书机器人', value: 'feishu' },
  { label: '钉钉机器人', value: 'dingtalk' },
  { label: '通用 Webhook', value: 'webhook' },
]

const configExamples: Record<PushProvider, string> = {
  bark: '{\n  "device_key": "你的设备推送密钥",\n  "server_url": "https://api.day.app"\n}',
  serverchan: '{\n  "send_key": "你的 SendKey"\n}',
  pushplus: '{\n  "token": "你的 Token",\n  "template": "markdown"\n}',
  wxpusher: '{\n  "app_token": "你的 AppToken",\n  "uids": "UID_xxx,UID_yyy",\n  "topic_ids": "123,456",\n  "content_type": "1"\n}',
  wecom: '{\n  "key": "企业微信机器人 Webhook 中的 key"\n}',
  feishu: '{\n  "webhook_url": "https://open.feishu.cn/open-apis/bot/v2/hook/..."\n}',
  dingtalk: '{\n  "webhook_url": "https://oapi.dingtalk.com/robot/send?access_token=...",\n  "secret": "可选的加签密钥"\n}',
  webhook: '{\n  "url": "https://example.com/notify",\n  "method": "POST",\n  "headers": "{}",\n  "body_template": "{\\"title\\":\\"{{title}}\\",\\"content\\":\\"{{content}}\\"}"\n}',
}

const sendEndpoint = computed(() => `${解析当前API基地址().replace(/\/+$/, '')}/notifications/send`)
const curlExample = computed(() => `curl -X POST '${sendEndpoint.value}' \\\n+  -H 'Authorization: Bearer <推送令牌>' \\\n+  -H 'Content-Type: application/json' \\\n+  -d '{"channel_ids":["<渠道ID>"],"title":"任务完成","content":"脚本已执行完成"}'`)

function providerLabel(provider: PushProvider): string {
  return providerOptions.find((item) => item.value === provider)?.label ?? provider
}

function formatDate(value: string | null): string {
  if (!value) return '从未调用'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

async function reload() {
  loading.value = true
  try {
    const [channelData, tokenData] = await Promise.all([获取推送渠道(), 获取推送令牌()])
    channels.value = channelData
    tokens.value = tokenData
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '推送配置加载失败'))
  } finally {
    loading.value = false
  }
}

function openCreateChannel() {
  editingChannel.value = null
  channelForm.name = ''
  channelForm.provider = 'bark'
  channelForm.configJson = configExamples.bark
  resetWxpusherForm()
  wxpusherForm.contentType = '1'
  channelDialog.value = true
}

function openEditChannel(channel: PushChannel) {
  editingChannel.value = channel
  channelForm.name = channel.name
  channelForm.provider = channel.provider
  channelForm.configJson = ''
  resetWxpusherForm()
  channelDialog.value = true
}

function changeProvider(provider: PushProvider) {
  channelForm.configJson = configExamples[provider]
  resetWxpusherForm()
}

function resetWxpusherForm() {
  wxpusherForm.appToken = ''
  wxpusherForm.uids = ''
  wxpusherForm.topicIds = ''
  wxpusherForm.contentType = '1'
}

async function saveChannel() {
  if (!channelForm.name.trim()) {
    ElMessage.warning('请填写渠道名称')
    return
  }
  let config: Record<string, string> | undefined
  if (channelForm.provider === 'wxpusher') {
    const wxpusherConfig: Record<string, string> = {}
    if (wxpusherForm.appToken.trim()) wxpusherConfig.app_token = wxpusherForm.appToken.trim()
    if (wxpusherForm.uids.trim()) wxpusherConfig.uids = wxpusherForm.uids.trim()
    if (wxpusherForm.topicIds.trim()) wxpusherConfig.topic_ids = wxpusherForm.topicIds.trim()
    if (wxpusherForm.contentType) wxpusherConfig.content_type = wxpusherForm.contentType
    if (Object.keys(wxpusherConfig).length) {
      config = wxpusherConfig
    }
  } else if (channelForm.configJson.trim()) {
    try {
      config = JSON.parse(channelForm.configJson) as Record<string, string>
    } catch {
      ElMessage.warning('配置必须是有效的 JSON 对象')
      return
    }
    if (!config || Array.isArray(config) || typeof config !== 'object' || Object.values(config).some((value) => typeof value !== 'string')) {
      ElMessage.warning('配置必须是字符串键值组成的 JSON 对象')
      return
    }
  } else if (!editingChannel.value) {
    ElMessage.warning('请填写渠道配置')
    return
  }
  saving.value = true
  try {
    if (editingChannel.value) {
      await 更新推送渠道(editingChannel.value.id, {
        name: channelForm.name.trim(),
        ...(config ? { config } : {}),
      })
    } else {
      await 创建推送渠道({ name: channelForm.name.trim(), provider: channelForm.provider, config: config! })
    }
    channelDialog.value = false
    ElMessage.success('推送渠道已保存')
    await reload()
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '推送渠道保存失败'))
  } finally {
    saving.value = false
  }
}

async function testChannel(channel: PushChannel) {
  try {
    const result = await 测试推送渠道(channel.id)
    if (result.success) ElMessage.success(`测试消息已发送到「${channel.name}」`)
    else ElMessage.error(result.error || '推送测试失败')
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '推送测试失败'))
  }
}

async function toggleChannel(channel: PushChannel, enabled: boolean) {
  try {
    await 更新推送渠道(channel.id, { enabled })
    await reload()
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '渠道状态更新失败'))
    await reload()
  }
}

async function removeChannel(channel: PushChannel) {
  try {
    await 删除推送渠道(channel.id)
    ElMessage.success('推送渠道已删除')
    await reload()
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '推送渠道删除失败'))
  }
}

async function createToken() {
  if (!tokenName.value.trim() || !tokenChannelIds.value.length) {
    ElMessage.warning('请填写令牌名称并至少选择一个渠道')
    return
  }
  tokenSaving.value = true
  try {
    createdToken.value = await 创建推送令牌({ name: tokenName.value.trim(), channel_ids: tokenChannelIds.value })
    tokenName.value = ''
    tokenChannelIds.value = []
    ElMessage.success('推送令牌已创建，请立即复制保存')
    await reload()
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '推送令牌创建失败'))
  } finally {
    tokenSaving.value = false
  }
}

async function toggleToken(token: PushToken, enabled: boolean) {
  try {
    await 更新推送令牌状态(token.id, enabled)
    ElMessage.success(enabled ? '令牌已启用' : '令牌已停用')
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '令牌状态更新失败'))
    await reload()
  }
}

async function removeToken(token: PushToken) {
  try {
    await 删除推送令牌(token.id)
    ElMessage.success('推送令牌已撤销')
    await reload()
  } catch (error) {
    ElMessage.error(获取API错误消息(error, '推送令牌撤销失败'))
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败，请手动选择')
  }
}

onMounted(reload)
</script>

<template>
  <div class="push-page">
    <PageSectionShell title="推送管理" :icon="Message" title-tag="h2">
      <template #header-extra>
        <ElButton :loading="loading" @click="reload"><RefreshRight /><span>刷新</span></ElButton>
      </template>

      <ElAlert
        class="page-alert"
        type="info"
        title="脚本统一调用 FeatherNest 的发送接口，第三方平台凭据由这里集中管理。令牌仅在创建时显示一次。"
        :closable="false"
      />

      <ElCard shadow="never" class="section-card">
        <template #header>
          <div class="section-heading">
            <span>推送渠道</span>
            <ElButton type="primary" :icon="Plus" @click="openCreateChannel">添加渠道</ElButton>
          </div>
        </template>
        <ElTable v-loading="loading" :data="channels" row-key="id">
          <ElTableColumn prop="name" label="名称" min-width="150" />
          <ElTableColumn label="平台" min-width="150">
            <template #default="scope">{{ providerLabel(scope.row.provider) }}</template>
          </ElTableColumn>
          <ElTableColumn label="渠道 ID" min-width="270">
            <template #default="scope">
              <div class="channel-id"><code>{{ scope.row.id }}</code><ElButton link type="primary" @click="copy(scope.row.id)">复制</ElButton></div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" width="100">
            <template #default="scope"><ElTag :type="scope.row.enabled ? 'success' : 'info'">{{ scope.row.enabled ? '启用' : '停用' }}</ElTag></template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="270" fixed="right">
            <template #default="scope">
              <div class="row-actions">
                <ElButton link type="primary" @click="testChannel(scope.row as PushChannel)">测试</ElButton>
                <ElButton link type="primary" @click="openEditChannel(scope.row as PushChannel)">编辑</ElButton>
                <ElButton link type="danger" @click="removeChannel(scope.row as PushChannel)">删除</ElButton>
                <ElSwitch
                  :model-value="scope.row.enabled"
                  inline-prompt
                  active-text="开"
                  inactive-text="关"
                  @change="(value) => toggleChannel(scope.row as PushChannel, Boolean(value))"
                />
              </div>
            </template>
          </ElTableColumn>
          <template #empty><ElEmpty description="还没有推送渠道" /></template>
        </ElTable>
      </ElCard>

      <ElCard shadow="never" class="section-card">
        <template #header><div class="section-heading"><span>脚本调用令牌</span></div></template>
        <ElForm inline class="token-form">
          <ElFormItem label="令牌名称"><ElInput v-model="tokenName" placeholder="例如：备份脚本" maxlength="100" /></ElFormItem>
          <ElFormItem label="允许渠道">
            <ElSelect v-model="tokenChannelIds" multiple collapse-tags placeholder="选择可发送渠道" style="min-width: 280px">
              <ElOption v-for="channel in channels" :key="channel.id" :label="channel.name" :value="channel.id" :disabled="!channel.enabled" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem><ElButton type="primary" :loading="tokenSaving" :disabled="!channels.length" @click="createToken">创建令牌</ElButton></ElFormItem>
        </ElForm>
        <ElAlert
          v-if="createdToken"
          class="token-result"
          type="warning"
          title="新令牌只显示这一次，请立即复制并放入脚本的密钥管理中。"
          :closable="false"
        >
          <div class="token-value"><code>{{ createdToken.token }}</code><ElButton size="small" @click="copy(createdToken.token)">复制令牌</ElButton></div>
        </ElAlert>
        <ElTable v-loading="loading" :data="tokens" row-key="id">
          <ElTableColumn prop="name" label="名称" min-width="150" />
          <ElTableColumn label="允许渠道" min-width="200">
            <template #default="scope">
              <ElTag v-for="id in scope.row.channel_ids" :key="id" class="channel-tag">{{ channels.find((item) => item.id === id)?.name || '已删除渠道' }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="最近调用" min-width="160">
            <template #default="scope">{{ formatDate(scope.row.last_used_at) }}</template>
          </ElTableColumn>
          <ElTableColumn label="状态" width="100">
            <template #default="scope"><ElSwitch :model-value="scope.row.enabled" @change="(value) => toggleToken(scope.row as PushToken, Boolean(value))" /></template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="90" fixed="right">
            <template #default="scope"><ElButton link type="danger" @click="removeToken(scope.row as PushToken)">撤销</ElButton></template>
          </ElTableColumn>
          <template #empty><ElEmpty description="还没有调用令牌" /></template>
        </ElTable>
      </ElCard>

      <ElCard shadow="never" class="section-card">
        <template #header><div class="section-heading"><span>调用示例</span></div></template>
        <p class="endpoint-line"><strong>POST</strong> <code>{{ sendEndpoint }}</code></p>
        <pre class="code-sample">{{ curlExample }}</pre>
        <ElButton size="small" @click="copy(curlExample)">复制 cURL 示例</ElButton>
      </ElCard>

      <ElDialog v-model="channelDialog" :title="editingChannel ? '编辑推送渠道' : '添加推送渠道'" width="min(620px, 94vw)" destroy-on-close>
        <ElForm label-position="top">
          <ElFormItem label="渠道名称" required><ElInput v-model="channelForm.name" maxlength="100" placeholder="例如：手机推送" /></ElFormItem>
          <ElFormItem label="推送平台" required>
            <ElSelect v-model="channelForm.provider" :disabled="Boolean(editingChannel)" @change="changeProvider">
              <ElOption v-for="item in providerOptions" :key="item.value" :label="item.label" :value="item.value" />
            </ElSelect>
          </ElFormItem>
          <template v-if="channelForm.provider === 'wxpusher'">
            <ElFormItem label="AppToken" :required="!editingChannel">
              <ElInput v-model="wxpusherForm.appToken" type="password" show-password autocomplete="new-password" placeholder="WXPusher 应用令牌" />
            </ElFormItem>
            <ElFormItem label="UID">
              <ElInput v-model="wxpusherForm.uids" :placeholder="editingChannel ? '填写以更新 UID；留空保留现有值' : 'UID_xxx,UID_yyy'" />
            </ElFormItem>
            <ElFormItem label="主题 ID">
              <ElInput v-model="wxpusherForm.topicIds" :placeholder="editingChannel ? '填写以更新主题 ID；留空保留现有值' : '多个 ID 用英文逗号分隔，例如 123,456'" />
            </ElFormItem>
            <ElFormItem label="发送类型">
              <ElSelect v-model="wxpusherForm.contentType" :placeholder="editingChannel ? '留空保留现有类型' : '选择发送类型'">
                <ElOption label="文本" value="1" />
                <ElOption label="HTML" value="2" />
                <ElOption label="Markdown" value="3" />
              </ElSelect>
            </ElFormItem>
            <p class="form-hint">UID 和主题 ID 至少配置一种；每次最多 2000 个 UID 或 5 个主题 ID。编辑时仅更新填写的项目，留空保留原配置。</p>
          </template>
          <template v-else>
            <ElFormItem :label="editingChannel ? '替换配置（留空保留现有密钥）' : '平台配置'" required>
              <ElInput v-model="channelForm.configJson" :placeholder="configExamples[channelForm.provider]" />
            </ElFormItem>
            <p class="form-hint">配置以 JSON 字符串键值保存并加密。{{ channelForm.provider === 'webhook' || channelForm.provider === 'feishu' || channelForm.provider === 'dingtalk' ? 'Webhook 地址必须使用 HTTPS 且不能指向内网。' : '' }}</p>
          </template>
        </ElForm>
        <template #footer>
          <ElButton @click="channelDialog = false">取消</ElButton>
          <ElButton type="primary" :loading="saving" @click="saveChannel">保存</ElButton>
        </template>
      </ElDialog>
    </PageSectionShell>
  </div>
</template>

<style scoped>
.push-page { height: 100%; overflow-y: auto; padding: 24px; box-sizing: border-box; }
.page-alert, .section-card { margin-bottom: 16px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-weight: 600; }
.row-actions { display: flex; align-items: center; gap: 10px; }
.token-form { margin-bottom: 8px; }
.token-result { margin: 12px 0 18px; }
.token-value { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
.token-value code, .endpoint-line code { overflow-wrap: anywhere; }
.channel-tag { margin: 2px 4px 2px 0; }
.channel-id { display: flex; align-items: center; gap: 8px; }
.channel-id code { font-size: 12px; }
.endpoint-line { margin: 0 0 12px; }
.code-sample { overflow-x: auto; padding: 14px; background: var(--el-fill-color-light); border-radius: 6px; line-height: 1.55; white-space: pre; }
.form-hint { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.6; }
@media (max-width: 700px) {
  .push-page { padding: 16px; }
  .token-value { align-items: flex-start; flex-direction: column; }
  .row-actions { flex-wrap: wrap; }
}
</style>
