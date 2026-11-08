import api from '@feathernest/api'
export { 开发者登录操作, type DeveloperLoginAction } from '@feathernest/module-auth'
import type { DeviceLoginResponse } from '@feathernest/domain/auth'
import { 设置存储的手机令牌 } from '@/shared/auth/device-token'

export async function 开发者快捷登录(): Promise<void> {
  const { data } = await api.post<DeviceLoginResponse>('/auth/device/dev-login', {
    device_name: 'FeatherNest Phone',
    device_type: 'phone',
    scope: 'full_client',
    platform: navigator.platform || 'phone',
  })
  await 设置存储的手机令牌(data.token)
}
