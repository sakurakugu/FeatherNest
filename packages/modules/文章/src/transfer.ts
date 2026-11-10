import type {
  ArticleAuthor,
  ArticleRecord,
  ArticleStatus,
  ArticleOrganizationState,
  ArticleConversion,
  CategoryRecord,
  TagRecord,
} from './types'

export interface ArticleTransferCategory {
  name: string
  slug: string
}

export interface ArticleTransferTag {
  name: string
  slug: string
}

export interface ArticleTransferItem {
  source_article_id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  cover_url?: string
  status: ArticleStatus
  organization_state: ArticleOrganizationState
  archived_at: string | null
  converted_items: ArticleConversion[]
  view_count: number
  like_count: number
  author: ArticleAuthor
  category: ArticleTransferCategory | null
  tags: ArticleTransferTag[]
  published_at?: string
  created_at: string
  last_edited_at: string
  updated_at: string
}

export interface ArticleTransferPayload {
  version: number
  exported_at: string
  total: number
  articles: ArticleTransferItem[]
}

export interface ArticleImportItem {
  title: string
  content: string
  [key: string]: unknown
}

export async function 读取文章迁移文件(files: File[]): Promise<ArticleImportItem[]> {
  const articles: ArticleImportItem[] = []
  for (const file of files) {
    const text = (await file.text()).replace(/^\uFEFF/, '')
    if (/\.json$/i.test(file.name)) {
      let payload: unknown
      try {
        payload = JSON.parse(text)
      } catch {
        throw new Error(`文件“${file.name}”不是有效的 JSON`)
      }
      if (
        typeof payload !== 'object' ||
        payload === null ||
        !('version' in payload) ||
        payload.version !== 2 ||
        !('articles' in payload) ||
        !Array.isArray(payload.articles) ||
        payload.articles.length === 0 ||
        !payload.articles.every(
          (item: unknown) =>
            typeof item === 'object' &&
            item !== null &&
            'title' in item &&
            typeof item.title === 'string' &&
            'content' in item &&
            typeof item.content === 'string',
        )
      ) {
        throw new Error(`文件“${file.name}”不是有效的文章备份（版本 2）`)
      }
      articles.push(...payload.articles)
    } else if (/\.(md|markdown)$/i.test(file.name)) {
      if (!text.trim()) throw new Error(`文件“${file.name}”内容为空`)
      const heading = text.match(/^#\s+(.+?)\s*#*\s*$/m)
      articles.push({
        title: heading?.[1] || file.name.replace(/\.(md|markdown)$/i, ''),
        content: text,
        organization_state: 'inbox',
      })
    } else {
      throw new Error(`文件“${file.name}”格式不支持，请选择 Markdown 或 JSON`)
    }
  }
  return articles
}

function 转换为传输分类(category: CategoryRecord | null): ArticleTransferCategory | null {
  if (!category) {
    return null
  }
  return {
    name: category.name,
    slug: category.slug,
  }
}

function 转换为传输标签(tags: TagRecord[]): ArticleTransferTag[] {
  return tags.map((tag) => ({
    name: tag.name,
    slug: tag.slug,
  }))
}

export function 转换为文章传输项(article: ArticleRecord): ArticleTransferItem {
  return {
    source_article_id: article.id,
    title: article.title,
    slug: article.slug,
    content: article.content,
    excerpt: article.excerpt ?? undefined,
    cover_url: article.cover_url ?? undefined,
    status: article.status,
    organization_state: article.organization_state,
    archived_at: article.archived_at,
    converted_items: article.converted_items,
    view_count: article.view_count,
    like_count: article.like_count,
    author: article.author,
    category: 转换为传输分类(article.category),
    tags: 转换为传输标签(article.tags),
    published_at: article.published_at ?? undefined,
    created_at: article.created_at,
    last_edited_at: article.last_edited_at,
    updated_at: article.updated_at,
  }
}

export function 构建文章传输负载(
  version: number,
  articles: ArticleRecord[],
): ArticleTransferPayload {
  return {
    version,
    exported_at: new Date().toISOString(),
    total: articles.length,
    articles: articles.map((article) => 转换为文章传输项(article)),
  }
}
