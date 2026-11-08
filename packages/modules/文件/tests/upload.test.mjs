import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const source = await readFile(new URL('../src/core/upload.ts', import.meta.url), 'utf8')
test('文件上传使用 p-limit 并发队列并汇总 allSettled 结果', () => {
  assert.match(source, /pLimit\(4\)/)
  assert.match(source, /上传并发限制\(\(\) => requestUploadFile/)
  assert.match(source, /Promise\.allSettled\(tasks\)/)
  assert.match(source, /确保目录路径\(/)
})
