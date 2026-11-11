import { strToU8, zip, type Zippable } from 'fflate'
import { 解析管理文件URL地址 } from '../managedFile'

export async function 下载文章Markdown(title: string, content: string) {
  const filename = (Array.from(title, (char) => char.charCodeAt(0) < 32 ? '_' : char).join('').trim() || '未命名文章').replace(/[<>:"/\\|?*]/g, '_').replace(/[. ]+$/, '') || '未命名文章'
  const urls = new Set(Array.from(content.matchAll(/https?:\/\/[^\s"'<>)]*\/files\/[^\s"'<>)]*|\/files\/[^\s"'<>)]*|(?:blob:|data:image\/)[^\s"'<>)]*/g), (match) => match[0]))
  const files: Zippable = {}
  let markdown = content
  let imageCount = 0
  for (const url of urls) {
    const response = await fetch(解析管理文件URL地址(url), { credentials: 'include' })
    if (!response.ok) throw new Error(`下载文章图片失败（${response.status}）`)
    const blob = await response.blob()
    if (!blob.type.startsWith('image/')) continue
    imageCount += 1
    const extension = blob.type.split('/')[1]!.split('+')[0]!
    const path = `images/${imageCount}.${extension}`
    files[path] = new Uint8Array(await blob.arrayBuffer())
    markdown = markdown.replaceAll(url, path)
  }
  let download: Blob
  let downloadName: string
  if (imageCount) {
    files[`${filename}.md`] = strToU8(markdown)
    const archive = await new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
      zip(files, (error, data) => error ? reject(error) : resolve(data))
    })
    download = new Blob([archive], { type: 'application/zip' })
    downloadName = `${filename}.zip`
  } else {
    download = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    downloadName = `${filename}.md`
  }
  const objectUrl = URL.createObjectURL(download)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = downloadName
  link.click()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  console.info('[文章写作] 另存为完成', { imageCount, filename: downloadName })
}
