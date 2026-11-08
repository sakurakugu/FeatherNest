import { EventSourceParserStream } from 'eventsource-parser/stream'
import type { 聊天附件, 聊天消息 } from './types'

const 支持图片扩展名 = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.bmp',
  '.tiff',
  '.tif',
  '.heic',
  '.heif',
  '.svg',
])

export function 生成消息ID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function 获取文件扩展名(fileName: string): string {
  const extensionStart = fileName.lastIndexOf('.')
  if (extensionStart === -1) {
    return ''
  }
  return fileName.slice(extensionStart).toLowerCase()
}

export function 是否支持附件(file: File): boolean {
  const mimeType = file.type.toLowerCase()
  if (mimeType.startsWith('image/')) return true
  if (mimeType === 'application/pdf') return true
  const extension = 获取文件扩展名(file.name)
  return extension === '.pdf' || 支持图片扩展名.has(extension)
}

export function 格式化文件大小(sizeInBytes: number): string {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
}

export function 生成附件(file: File): 聊天附件 {
  return {
    id: 生成消息ID(),
    file,
    filename: file.name,
    mediaType: file.type || 'application/octet-stream',
    size: file.size,
    url: URL.createObjectURL(file),
  }
}

export function 释放附件地址(attachments: readonly 聊天附件[]): void {
  for (const attachment of attachments) {
    if (attachment.url?.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url)
    }
  }
}

export function 转为接口消息(messages: 聊天消息[]) {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    parts: [
      ...(message.content ? [{ type: 'text', text: message.content }] : []),
      ...(message.attachments ?? []).map((attachment) => ({
        type: 'file',
        filename: attachment.filename,
        mediaType: attachment.mediaType,
        url: attachment.url,
      })),
    ],
  }))
}

export async function 读取聊天事件流(
  response: Response,
  onDelta: (text: string) => void | Promise<void>,
): Promise<void> {
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (contentType !== 'text/event-stream' || !response.body) {
    await response.body?.cancel().catch(() => undefined)
    throw new Error('聊天接口未返回 SSE 事件流')
  }

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream({ onError: 'terminate', maxBufferSize: 1024 * 1024 }))
    .getReader()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        throw new Error('聊天事件流意外结束，未收到完成标记')
      }
      if (value.data === '[DONE]') return

      const payload: unknown = JSON.parse(value.data)
      if (
        !payload ||
        typeof payload !== 'object' ||
        !('delta' in payload) ||
        typeof payload.delta !== 'string'
      ) {
        throw new Error('聊天事件缺少有效的文本增量')
      }
      await onDelta(payload.delta)
    }
  } finally {
    // 完成、停止或解析失败都释放底层流，避免连接继续占用资源。
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}
