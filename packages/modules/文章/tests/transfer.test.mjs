import assert from 'node:assert/strict'
import { File } from 'node:buffer'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ configFile: false, server: { middlewareMode: true } })
after(() => server.close())
const { 读取文章迁移文件, 构建文章传输负载 } = await server.ssrLoadModule(
  '/packages/modules/文章/src/transfer.ts',
)

test('JSON 导出后可再次导入，保留正文、分类标签、整理状态和时间', async () => {
  const article = {
    id: 'source-id',
    title: '迁移测试',
    slug: 'transfer',
    content: '# 正文\n**内容**',
    excerpt: '摘要',
    cover_url: '/cover.png',
    status: 'public',
    organization_state: 'archived',
    archived_at: '2026-11-01T00:00:00Z',
    converted_items: [],
    view_count: 3,
    like_count: 2,
    author: { id: 'author-id', username: '作者', avatar_url: null },
    category: { id: 'category-id', name: '随笔', slug: 'essays' },
    tags: [{ id: 'tag-id', name: '测试', slug: 'test' }],
    created_at: '2026-10-01T00:00:00Z',
    last_edited_at: '2026-10-02T00:00:00Z',
    updated_at: '2026-10-03T00:00:00Z',
    published_at: '2026-10-02T00:00:00Z',
  }
  const payload = 构建文章传输负载(2, [article])
  const imported = await 读取文章迁移文件([
    new File(['\uFEFF', JSON.stringify(payload)], '文章.JSON'),
  ])
  assert.deepEqual(imported, payload.articles)
  assert.equal(imported[0].source_article_id, article.id)
  assert.deepEqual(imported[0].category, { name: '随笔', slug: 'essays' })
  assert.equal(imported[0].last_edited_at, article.last_edited_at)
})

test('多选 Markdown 使用一级标题或文件名，保留原文并进入待整理', async () => {
  const imported = await 读取文章迁移文件([
    new File(['# 一级标题 ###\n\n正文'], '文件名.md'),
    new File(['## 二级标题\n正文'], '随手记.markdown'),
  ])
  assert.deepEqual(imported, [
    { title: '一级标题', content: '# 一级标题 ###\n\n正文', organization_state: 'inbox' },
    { title: '随手记', content: '## 二级标题\n正文', organization_state: 'inbox' },
  ])
})

test('拒绝损坏、版本不符、无文章或字段无效的 JSON，以及空文档和不支持的格式', async () => {
  for (const content of [
    '{',
    '{}',
    '{"version":1,"articles":[]}',
    '{"version":2,"articles":[]}',
    '{"version":2,"articles":[{"title":"缺少正文"}]}',
  ]) {
    await assert.rejects(读取文章迁移文件([new File([content], '备份.json')]), /备份|JSON/)
  }
  await assert.rejects(读取文章迁移文件([new File(['  '], '空白.md')]), /内容为空/)
  await assert.rejects(读取文章迁移文件([new File(['正文'], '文章.txt')]), /格式不支持/)
  await assert.rejects(
    读取文章迁移文件([new File(['# 有效'], '有效.md'), new File(['{'], '损坏.json')]),
    /JSON/,
  )
})
