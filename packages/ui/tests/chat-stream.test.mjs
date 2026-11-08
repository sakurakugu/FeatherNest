import assert from 'node:assert/strict'
import { setImmediate } from 'node:timers/promises'
import { test } from 'node:test'
import { 读取聊天事件流 } from '../src/components/AIChatWidget/chat.ts'

const encoder = new TextEncoder()

function 创建响应(text, chunkSize = 8) {
  const bytes = encoder.encode(text)
  return new Response(
    new ReadableStream({
      start(controller) {
        for (let index = 0; index < bytes.length; index += chunkSize) {
          controller.enqueue(bytes.slice(index, index + chunkSize))
        }
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } },
  )
}

test('逐字节分块仍能保留中文、表情和文本中的空白', async () => {
  const chunks = []
  const events = [{ delta: '你好 🌱' }, { delta: '\n' }]
    .map((payload) => `data: ${JSON.stringify(payload)}\n\n`)
    .join('')
  await 读取聊天事件流(创建响应(`${events}data: [DONE]\n\n`, 1), (text) => {
    chunks.push(text)
  })
  assert.deepEqual(chunks, ['你好 🌱', '\n'])
})

test('按完整事件合并多行 data，处理 CRLF 和事件元信息', async () => {
  const chunks = []
  await 读取聊天事件流(
    创建响应(
      ': 心跳\r\nretry: 1000\r\nid: 42\r\nevent: message\r\ndata: {\r\ndata: "delta": "内容"}\r\n\r\ndata: [DONE]\r\n\r\n',
      1,
    ),
    (text) => {
      chunks.push(text)
    },
  )
  assert.deepEqual(chunks, ['内容'])
})

test('支持单独的 CR 分隔符及同一分块中的多个事件', async () => {
  const chunks = []
  await 读取聊天事件流(
    创建响应('data: {"delta":"第一段"}\r\rdata: {"delta":"第二段"}\r\rdata: [DONE]\r\r', 1024),
    (text) => {
      chunks.push(text)
    },
  )
  assert.deepEqual(chunks, ['第一段', '第二段'])
})

test('收到完成标记后取消未关闭的连接，不再消费后续事件', async () => {
  let cancelled = false
  const chunks = []
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: [DONE]\n\ndata: {"delta":"不应显示"}\n\n'))
    },
    cancel() {
      cancelled = true
    },
  })
  await 读取聊天事件流(
    new Response(body, {
      headers: { 'Content-Type': 'text/event-stream' },
    }),
    (text) => {
      chunks.push(text)
    },
  )
  await setImmediate()
  assert.deepEqual(chunks, [])
  assert.equal(cancelled, true)
  assert.equal(body.locked, false)
})

test('正常 EOF 不能冒充完成，已有增量仍交给调用方', async () => {
  const chunks = []
  await assert.rejects(
    读取聊天事件流(创建响应('data: {"delta":"部分内容"}\n\n'), (text) => {
      chunks.push(text)
    }),
    /未收到完成标记/,
  )
  assert.deepEqual(chunks, ['部分内容'])
})

test('未结束的事件不应被拼成回复', async () => {
  const chunks = []
  await assert.rejects(
    读取聊天事件流(创建响应('data: {"delta":"不完整"}'), (text) => {
      chunks.push(text)
    }),
    /未收到完成标记/,
  )
  assert.deepEqual(chunks, [])
})

for (const data of ['不是 JSON', '0:"旧协议"', '{}', '{"delta":42}', 'null', '"文本"']) {
  test(`拒绝无效的聊天数据：${data}`, async () => {
    await assert.rejects(读取聊天事件流(创建响应(`data: ${data}\n\n`), () => {}))
  })
}

test('拒绝非 SSE 响应和空响应体', async () => {
  for (const response of [
    new Response('{"delta":"错误格式"}', { headers: { 'Content-Type': 'application/json' } }),
    new Response(null, { headers: { 'Content-Type': 'text/event-stream' } }),
  ]) {
    await assert.rejects(
      读取聊天事件流(response, () => {}),
      /未返回 SSE/,
    )
  }
})

test('保留主动停止产生的 AbortError，并释放流锁', async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.error(new DOMException('用户停止', 'AbortError'))
    },
  })
  await assert.rejects(
    读取聊天事件流(
      new Response(body, {
        headers: { 'Content-Type': 'text/event-stream' },
      }),
      () => {},
    ),
    { name: 'AbortError' },
  )
  await setImmediate()
  assert.equal(body.locked, false)
})

test('消费回调失败时也会取消底层连接', async () => {
  let cancelled = false
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"delta":"文本"}\n\n'))
    },
    cancel() {
      cancelled = true
    },
  })
  await assert.rejects(
    读取聊天事件流(
      new Response(body, {
        headers: { 'Content-Type': 'text/event-stream' },
      }),
      () => {
        throw new Error('消费失败')
      },
    ),
    /消费失败/,
  )
  await setImmediate()
  assert.equal(cancelled, true)
})

test('心跳不会产生回复内容', async () => {
  const chunks = []
  await 读取聊天事件流(创建响应(': 心跳\n\ndata: [DONE]\n\n'), (text) => {
    chunks.push(text)
  })
  assert.deepEqual(chunks, [])
})
