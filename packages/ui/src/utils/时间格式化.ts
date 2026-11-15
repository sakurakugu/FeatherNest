/** 控制台管理页通用的时间格式化：列表显示相对时间，悬浮提示显示完整时间。 */

function 补零(值: number) {
  return String(值).padStart(2, '0')
}

/** 完整时间：2026-11-11 10:28 */
export function 格式化完整时间(值: string | null | undefined): string {
  if (!值) return '—'
  const 日期 = new Date(值)
  if (Number.isNaN(日期.getTime())) return '—'
  return `${日期.getFullYear()}-${补零(日期.getMonth() + 1)}-${补零(日期.getDate())} ${补零(日期.getHours())}:${补零(日期.getMinutes())}`
}

/** 短日期：今年显示 11-11，跨年显示 2025-11-11 */
export function 格式化短日期(值: string | null | undefined): string {
  if (!值) return '—'
  const 日期 = new Date(值)
  if (Number.isNaN(日期.getTime())) return '—'
  const 月日 = `${补零(日期.getMonth() + 1)}-${补零(日期.getDate())}`
  if (日期.getFullYear() === new Date().getFullYear()) {
    return 月日
  }
  return `${日期.getFullYear()}-${月日}`
}

/** 相对时间：刚刚 / N 分钟前 / N 小时前 / 昨天 / N 天前，超过一周回退到短日期 */
export function 格式化相对时间(值: string | null | undefined): string {
  if (!值) return '—'
  const 时间戳 = new Date(值).getTime()
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
  return 格式化短日期(值)
}
