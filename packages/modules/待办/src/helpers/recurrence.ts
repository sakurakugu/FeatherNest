import { RRule } from 'rrule'
import type { Todo } from '../types'

const 频率 = { daily: RRule.DAILY, custom: RRule.DAILY, weekly: RRule.WEEKLY, monthly: RRule.MONTHLY, yearly: RRule.YEARLY }
const 规则缓存 = new Map<string, InstanceType<typeof RRule>>()

function 日历日期(date: Date): Date {
  // 使用浮动的 UTC 年月日，避免夏令时把间隔天数变成 23 或 25 小时。
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

export function 待办当日重复活跃(
  todo: Pick<Todo, 'recurrence_type' | 'recurrence_interval' | 'start_date' | 'end_date' | 'created_at'>,
  date: Date,
  calendar: { workdays: ReadonlySet<string>; holidays: ReadonlySet<string> },
): boolean {
  const type = todo.recurrence_type
  if (type === 'none') return false
  const anchor = 日历日期(new Date(todo.start_date || todo.created_at))
  const target = 日历日期(date)
  if (!Number.isFinite(anchor.getTime()) || target < anchor) return false
  if (todo.end_date && target > 日历日期(new Date(todo.end_date))) return false
  const key = target.toISOString().slice(0, 10)
  const weekday = target.getUTCDay()
  if (type === 'workday') return calendar.workdays.has(key) || (!calendar.holidays.has(key) && weekday >= 1 && weekday <= 5)
  if (type === 'holiday') return calendar.holidays.has(key)
  if (type === 'weekend') return weekday === 0 || weekday === 6
  const cacheKey = `${anchor.toISOString()}:${type}:${todo.recurrence_interval}`
  let rule = 规则缓存.get(cacheKey)
  if (!rule) {
    if (规则缓存.size >= 512) 规则缓存.clear()
    rule = new RRule({ freq: 频率[type], dtstart: anchor, interval: Math.max(1, todo.recurrence_interval) }, true)
    规则缓存.set(cacheKey, rule)
  }
  return rule.between(target, target, true).length > 0
}
