import assert from 'node:assert/strict'
import { test } from 'node:test'
import { 待办当日重复活跃 } from '../src/helpers/recurrence.ts'

const calendar = { workdays: new Set(['2026-10-10']), holidays: new Set(['2026-10-01']) }
function 检查(type, anchor, day, interval = 1, end = null) {
  return 待办当日重复活跃({ recurrence_type: type, recurrence_interval: interval, start_date: anchor, end_date: end, created_at: '2026-03-28T09:00:00' }, new Date(`${day}T12:00:00`), calendar)
}

test('常规重复使用统一间隔与锚点，无开始时间时使用创建日期', () => {
  assert.equal(检查('daily', '2026-03-28', '2026-03-29', 2), false)
  assert.equal(检查('custom', '2026-03-28', '2026-03-30', 2), true)
  assert.equal(检查('weekly', null, '2026-04-04'), true)
  assert.equal(检查('weekly', null, '2026-04-04', 2), false)
  assert.equal(检查('weekly', null, '2026-04-11', 2), true)
  assert.equal(检查('daily', '2026-03-28', '2026-03-27'), false)
  assert.equal(检查('daily', '2026-03-28', '2026-04-02', 1, '2026-04-01'), false)
})

test('月底缺日和闰日必须跳过，而不是压缩到月底', () => {
  assert.equal(检查('monthly', '2026-01-31', '2026-02-28'), false)
  assert.equal(检查('monthly', '2026-01-31', '2026-03-31'), true)
  assert.equal(检查('yearly', '2024-02-29', '2025-02-28'), false)
  assert.equal(检查('yearly', '2024-02-29', '2028-02-29'), true)
})

test('工作日仍遵循调休数据，周末和法定节假日互不混用', () => {
  assert.equal(检查('workday', '2026-01-01', '2026-10-10'), true)
  assert.equal(检查('weekend', '2026-01-01', '2026-10-10'), true)
  assert.equal(检查('workday', '2026-01-01', '2026-10-01'), false)
  assert.equal(检查('holiday', '2026-01-01', '2026-10-01'), true)
  assert.equal(检查('none', '2026-01-01', '2026-10-01'), false)
})
