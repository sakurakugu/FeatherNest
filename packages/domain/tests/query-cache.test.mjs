import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isCancelledError } from '@tanstack/query-core'
import { 待办查询缓存 } from '../src/todos/query-cache.ts'

test('相同请求去重，不同列表独立，失败不自动重试', async () => {
  const cache = new 待办查询缓存({ gcTime: 0 })
  try {
    let count = 0
    const request = async () => { count++; await new Promise((resolve) => setTimeout(resolve, 10)); return [1] }
    assert.deepEqual(await Promise.all([cache.查询(['todos'], request), cache.查询(['todos'], request)]), [[1], [1]])
    assert.equal(count, 1)
    await cache.查询(['deleted-todos'], request)
    assert.equal(count, 2)
    let failures = 0
    await assert.rejects(cache.查询(['error'], async () => { failures++; throw new Error('失败') }))
    assert.equal(failures, 1)
  } finally { cache.清空() }
})

test('环境清空会取消请求、清除缓存并使旧结果失效', async () => {
  const cache = new 待办查询缓存({ gcTime: 0 })
  const version = cache.获取版本()
  let signal
  const task = cache.查询(['todos'], (value) => {
    signal = value
    return new Promise((_, reject) => value.addEventListener('abort', () => reject(new DOMException('取消', 'AbortError')), { once: true }))
  })
  const rejected = assert.rejects(task, isCancelledError)
  cache.清空()
  await rejected
  assert.equal(signal.aborted, true)
  assert.equal(cache.是否当前版本(version), false)
  assert.equal(cache.client.getQueryCache().getAll().length, 0)
})

test('变更使缓存失效，下一次读取不会复用变更前的数据', async () => {
  const cache = new 待办查询缓存({ gcTime: 0 })
  try {
    await cache.查询(['todos'], async () => [1])
    const version = cache.获取版本()
    cache.失效()
    assert.equal(cache.是否当前版本(version), false)
    assert.deepEqual(await cache.查询(['todos'], async () => [2]), [2])
  } finally { cache.清空() }
})
