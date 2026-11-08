import pLimit from 'p-limit'
import {
  创建文件夹 as requestCreateFolder,
  上传文件 as requestUploadFile,
} from '../api'
import { 写入文件夹索引, 构建文件夹键 } from './shared'
import type { FileTreeNode } from '../types'
import type { 带目录路径文件 } from './shared'

const 上传并发限制 = pLimit(4)

export interface 上传执行结果 {
  成功数量: number
  失败原因: unknown[]
}

function 构建文件夹索引(source: FileTreeNode[]) {
  const lookup = new Map<string, string>()
  写入文件夹索引(source, lookup)
  return lookup
}

async function 确保目录路径(
  relativeDirectory: string,
  currentFolderId: string | null,
  lookup: Map<string, string>,
) {
  let parentId = currentFolderId
  const segments = relativeDirectory.split('/').map((item) => item.trim()).filter(Boolean)

  for (const segment of segments) {
    const folderKey = 构建文件夹键(parentId, segment)
    let folderId = lookup.get(folderKey) ?? null
    if (!folderId) {
      const createdFolder = await requestCreateFolder(segment, parentId)
      folderId = createdFolder.id
      lookup.set(folderKey, folderId)
    }
    parentId = folderId
  }

  return parentId
}

export async function 执行文件上传(files: globalThis.File[], currentFolderId: string | null): Promise<上传执行结果> {
  const results = await Promise.allSettled(files.map((file) => 上传并发限制(() => requestUploadFile(file, currentFolderId))))
  const 失败原因 = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result) => result.reason)

  return {
    成功数量: results.length - 失败原因.length,
    失败原因,
  }
}

export async function 执行目录上传(
  files: 带目录路径文件[],
  currentFolderId: string | null,
  tree: FileTreeNode[],
): Promise<上传执行结果> {
  const folderLookup = 构建文件夹索引(tree)
  // 目录创建保持串行，文件上传使用全局并发队列，避免同一路径重复创建。
  const tasks: Promise<unknown>[] = []
  for (const file of files) {
    try {
      const relativePath = (file.webkitRelativePath || file.name).replace(/\\/g, '/')
      const segments = relativePath.split('/').filter(Boolean)
      const folderId = await 确保目录路径(segments.slice(0, -1).join('/'), currentFolderId, folderLookup)
      const task = 上传并发限制(() => requestUploadFile(file, folderId))
      // 提前注册拒绝处理；最终由 allSettled 汇总错误。
      void task.catch(() => {})
      tasks.push(task)
    } catch (error) {
      const task = Promise.reject(error)
      void task.catch(() => {})
      tasks.push(task)
    }
  }
  const results = await Promise.allSettled(tasks)
  const 失败原因 = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected').map((result) => result.reason)
  const 成功数量 = results.length - 失败原因.length
  if (失败原因.length) console.warn('[文件上传] 部分目录文件上传失败', { 成功数量, 失败数量: 失败原因.length })

  return {
    成功数量,
    失败原因,
  }
}
