import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElLoading } from 'element-plus'
import { 配置全局消息 } from '@feathernest/app-core'
import { 使用博客外观存储 } from '@feathernest/module-blog/store'
import { 初始化应用外壳 } from '../../console/src/app/bootstrap'
import App from './App.vue'
import router from './app/router'
import './shared/styles/element-plus'
import '@feathernest/theme/base.css'
import '@feathernest/theme/element-plus.css'
import 'virtual:uno.css'
import './shared/styles/app.css'
const app = createApp(App)
const pinia = createPinia()
配置全局消息()
app.use(ElLoading).use(pinia)
使用博客外观存储(pinia).init()
app.use(router)
void 初始化应用外壳(pinia)
  .then(() => router.isReady())
  .then(() => app.mount('#app'))
