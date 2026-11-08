import assert from 'node:assert/strict'
import { test } from 'node:test'
import { 标准化待办传输项, 解析待办传输负载, 获取待办传输指纹 } from '../src/helpers/transfer.ts'

test('导入结构校验拒绝空标题与无效负载', () => {
  for (const item of [null, [], {}, { title: '  ' }, { title: 3 }]) {
    assert.equal(标准化待办传输项(item), null)
  }
  assert.throws(() => 解析待办传输负载('{}'), /格式不正确/)
  assert.throws(() => 解析待办传输负载('[{}]'), /没有可用/)
  assert.throws(() => 解析待办传输负载('{'), SyntaxError)
})

test('导入保留宽容默认值、边界与非循环任务进度规则', () => {
  const item = 标准化待办传输项({ title: ' 测试 ', importance: 101, urgency: -3, tags: [null, ' 中文 ', ''], recurrence_type: '未知', times_per_interval: 8, interval_progress: 5 })
  assert.equal(item.title, '测试')
  assert.equal(item.importance, 100)
  assert.equal(item.urgency, 0)
  assert.deepEqual(item.tags, ['中文'])
  assert.equal(item.status, 'todo')
  assert.equal(item.times_per_interval, 1)
  assert.equal(item.interval_progress, 0)
  assert.equal(item.recurrence_count, 0)
})

test('导入处理非有限数值、日期和每周期进度上界', () => {
  const item = 标准化待办传输项({ title: '测试', recurrence_type: 'custom', importance: Infinity, urgency: NaN, times_per_interval: 2.4, interval_progress: 99, recurrence_count: -8, recurrence_interval: 999, start_date: '无效', end_date: '2026-10-30T00:00:00Z' })
  assert.equal(item.importance, 33)
  assert.equal(item.urgency, 33)
  assert.equal(item.times_per_interval, 2)
  assert.equal(item.interval_progress, 2)
  assert.equal(item.recurrence_count, -1)
  assert.equal(item.recurrence_interval, 365)
  assert.equal(item.start_date, undefined)
  assert.equal(item.end_date, '2026-10-30T00:00:00.000Z')
})

test('数组与对象导入跳过无效项，指纹忽略标签顺序与时区表示差异', () => {
  const items = 解析待办传输负载('{"todos":[{}, {"title":"有效"}]}')
  assert.equal(items.length, 1)
  assert.equal(解析待办传输负载('[{"title":"有效"}]').length, 1)
  assert.equal(获取待办传输指纹({ ...items[0], tags: ['b', 'a', 'a'], start_date: '2026-10-30T08:00:00+08:00' }), 获取待办传输指纹({ ...items[0], tags: ['a', 'b'], start_date: '2026-10-30T00:00:00Z' }))
})
