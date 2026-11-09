import api from '@feathernest/api'
export { 开发者登录操作, type DeveloperLoginAction } from '@feathernest/module-auth/dev-login'
export async function 开发者快捷登录(): Promise<void> {
  await api.post('/auth/dev-login')
}
