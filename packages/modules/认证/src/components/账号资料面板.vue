<script setup lang="ts">
import { SwitchButton } from '@element-plus/icons-vue'
import { UniversalAvatar } from '@feathernest/ui'
import { ElButton, ElCard, ElForm, ElFormItem, ElInput, ElMessage, ElText } from 'element-plus'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { ref } from 'vue'
import { 使用个人资料编辑器 } from '../使用个人资料编辑器'

const props = withDefaults(defineProps<{
  /** 退出登录或修改密码后的跳转位置 */
  sessionEndRedirect?: RouteLocationRaw
}>(), {
  sessionEndRedirect: () => ({ path: '/' }),
})

const router = useRouter()
const loggingOut = ref(false)
const {
  auth,
  avatarPreviewUrl,
  changePassword,
  emailInvalid,
  passwordForm,
  profileForm,
  saveProfile,
  savingPassword,
  savingProfile,
  syncFormFromUser,
} = 使用个人资料编辑器({
  notifier: {
    error: (message) => ElMessage.error(message),
    success: (message) => ElMessage.success(message),
  },
})

/** 用户信息恢复后由父页面调用，把表单同步为最新资料。 */
defineExpose({ syncFormFromUser })

async function handleChangePassword() {
  // 修改密码会撤销全部会话，成功后需要重新登录
  if (await changePassword()) {
    await router.replace(props.sessionEndRedirect)
  }
}

async function handleLogout() {
  loggingOut.value = true
  let errorMessage = ''
  try {
    try {
      await auth.登出()
    } catch (error: any) {
      errorMessage = error?.response?.data?.detail || '退出登录失败'
    }
    await router.replace(props.sessionEndRedirect)
    if (errorMessage) {
      ElMessage.error(errorMessage)
    }
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <ElCard header="基础信息">
    <div class="avatar-block">
      <UniversalAvatar
        :src="avatarPreviewUrl"
        :text="(profileForm.username || 'U').charAt(0)"
        :size="72"
        alt="头像预览"
        class="avatar-preview"
        background="var(--theme-accent-gradient)"
      />
      <div class="avatar-block__content">
        <div class="avatar-block__title">头像</div>
        <ElInput v-model="profileForm.avatar_url" placeholder="请输入头像链接" />
      </div>
    </div>

    <ElForm label-width="100px" @submit.prevent="saveProfile">
      <ElFormItem label="用户名">
        <ElInput v-model="profileForm.username" />
      </ElFormItem>
      <ElFormItem label="邮箱">
        <ElInput v-model="profileForm.email" />
        <ElText v-if="emailInvalid" type="danger" class="field-tip">邮箱格式不正确</ElText>
      </ElFormItem>
      <ElFormItem label="简介">
        <ElInput v-model="profileForm.bio" type="textarea" :rows="4" />
      </ElFormItem>
      <div class="form-actions">
        <ElButton type="primary" native-type="submit" :loading="savingProfile">保存资料</ElButton>
      </div>
    </ElForm>
  </ElCard>

  <ElCard header="修改密码">
    <ElForm label-width="100px" @submit.prevent="handleChangePassword">
      <ElFormItem label="当前密码">
        <ElInput v-model="passwordForm.current_password" type="password" show-password />
      </ElFormItem>
      <ElFormItem label="新密码">
        <ElInput v-model="passwordForm.new_password" type="password" show-password />
      </ElFormItem>
      <ElFormItem label="确认新密码">
        <ElInput v-model="passwordForm.confirm_password" type="password" show-password />
      </ElFormItem>
      <div class="form-actions">
        <ElButton type="primary" native-type="submit" :loading="savingPassword">更新密码</ElButton>
      </div>
    </ElForm>
  </ElCard>

  <div class="account-actions">
    <ElButton plain :icon="SwitchButton" :loading="loggingOut" @click="handleLogout">
      {{ loggingOut ? '退出中' : '退出登录' }}
    </ElButton>
  </div>
</template>

<style scoped>
.avatar-block {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  margin-bottom: 24px;
}

.avatar-block__content {
  display: grid;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.avatar-block__title {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.avatar-preview {
  flex-shrink: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.field-tip {
  margin-top: 6px;
}

.account-actions {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-card) {
  border-radius: 12px;
}

@media (max-width: 640px) {
  .avatar-block {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
