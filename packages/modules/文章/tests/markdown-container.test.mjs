import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ configFile: false, server: { middlewareMode: true } })
after(() => server.close())
const { renderArticleMarkdown } = await server.ssrLoadModule('/packages/modules/文章/src/markdown.ts')

test('提示块使用原有皮肤与转义标题，正文继续按 Markdown 渲染', () => {
  const { html } = renderArticleMarkdown(':::note[<标题>]\n**正文**\n:::')
  assert.match(html, /admonition bdm-note/)
  assert.match(html, /data-admonition-type="note"/)
  assert.match(html, /&lt;标题&gt;/)
  assert.match(html, /<strong>正文<\/strong>/)
  assert.match(html, /archive-admonition__content/)
})

test('代码围栏里的容器标记不会被解释为提示块', () => {
  for (const fence of ['```', '~~~']) {
    const { html } = renderArticleMarkdown(`${fence}text\n:::note\n代码\n:::\n${fence}`)
    assert.doesNotMatch(html, /class="admonition/)
    assert.match(html, /:::note/)
  }
})

test('不同长度围栏支持嵌套，列表与引用中也能使用提示块', () => {
  const { html } = renderArticleMarkdown('::::note[外层]\n:::warning[内层]\n内容\n:::\n::::')
  assert.equal((html.match(/class="admonition /g) ?? []).length, 2)
  const quote = renderArticleMarkdown('> :::tip\n> 内容\n> :::').html
  assert.match(quote, /<blockquote>/)
  assert.match(quote, /admonition bdm-tip/)
})

test('未知容器不转换，标题索引保持原有约定', () => {
  const { html, headings } = renderArticleMarkdown(':::unknown\n普通内容\n:::\n\n# 标题')
  assert.doesNotMatch(html, /class="admonition/)
  assert.equal(headings[0].id, 'heading-1')
})
