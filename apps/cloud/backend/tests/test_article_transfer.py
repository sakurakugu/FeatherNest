"""文章迁移的数据恢复与发布隔离测试。"""

import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

from pydantic import ValidationError

from app.modules.articles.models import 文章
from app.modules.articles.schemas import 文章迁移请求
from app.modules.articles.transfer import 导入文章
from app.utils.uuid import generate_uuid7


class 文章迁移测试(unittest.IsolatedAsyncioTestCase):
    async def test_复用分类标签并恢复时间_原发布信息不自动发布(self):
        category = SimpleNamespace(id=generate_uuid7(), name="随笔")
        tag = SimpleNamespace(id=generate_uuid7(), name="已有标签")
        new_tag = SimpleNamespace(id=generate_uuid7(), name="新标签")
        db = AsyncMock()
        db.execute.side_effect = [
            Mock(scalars=Mock(return_value=[category])),
            Mock(scalars=Mock(return_value=[tag])),
        ]
        user = SimpleNamespace(id=generate_uuid7())
        created = [文章(blog=None), 文章(blog=None)]
        payload = {
            "title": "迁移文章", "content": "# 原始正文", "excerpt": "摘要",
            "cover_url": "/cover.png", "organization_state": "archived",
            "category": {"name": "随笔", "slug": "old-slug"},
            "tags": [{"name": "已有标签"}, {"name": "新标签"}, {"name": "新标签"}],
            "created_at": "2026-10-01T00:00:00Z",
            "last_edited_at": "2026-10-02T00:00:00Z",
            "updated_at": "2026-10-03T00:00:00Z",
            "archived_at": "2026-10-04T00:00:00Z",
            "status": "public", "source_article_id": "原始文章", "view_count": 42,
        }
        body = 文章迁移请求.model_validate({"version": 2, "articles": [payload, payload]})
        with (
            patch("app.modules.articles.transfer.创建分类", new_callable=AsyncMock) as create_category,
            patch("app.modules.articles.transfer.创建标签", new_callable=AsyncMock, return_value=new_tag) as create_tag,
            patch("app.modules.articles.transfer.创建文章草稿", new_callable=AsyncMock, side_effect=created) as create_article,
        ):
            self.assertEqual(await 导入文章(db, body, user), 2)
        create_category.assert_not_awaited()
        create_tag.assert_awaited_once()
        draft = create_article.await_args_list[0].args[1]
        self.assertEqual(draft.category_id, category.id)
        self.assertEqual(draft.tag_ids, [tag.id, new_tag.id])
        self.assertEqual(draft.content, payload["content"])
        self.assertEqual(draft.cover_url, payload["cover_url"])
        self.assertEqual(draft.organization_state, "archived")
        for article in created:
            self.assertEqual(article.status, "private")
            self.assertIsNone(article.published_at)
            self.assertEqual(article.view_count, 0)
            self.assertEqual(article.last_edited_at, datetime(2026, 10, 2, tzinfo=timezone.utc))
            self.assertEqual(article.updated_at, datetime(2026, 10, 3, tzinfo=timezone.utc))
            self.assertEqual(article.archived_at, datetime(2026, 10, 4, tzinfo=timezone.utc))
            self.assertEqual(article.import_metadata["status"], "public")
            self.assertEqual(article.import_metadata["source_article_id"], "原始文章")
        db.commit.assert_not_awaited()

    async def test_多个文章复用本次新建分类(self):
        db = AsyncMock()
        db.execute.return_value = Mock(scalars=Mock(return_value=[]))
        category = SimpleNamespace(id=generate_uuid7(), name="新分类")
        body = 文章迁移请求.model_validate({"articles": [
            {"title": title, "content": title, "category": {"name": "新分类"}}
            for title in ("第一篇", "第二篇")
        ]})
        with (
            patch("app.modules.articles.transfer.创建分类", new_callable=AsyncMock, return_value=category) as create_category,
            patch("app.modules.articles.transfer.创建文章草稿", new_callable=AsyncMock, side_effect=[文章(), 文章()]),
        ):
            self.assertEqual(await 导入文章(db, body, SimpleNamespace(id=generate_uuid7())), 2)
        create_category.assert_awaited_once()

    def test_请求校验拒绝不支持的版本_非法整理状态和损坏字段(self):
        for payload in (
            {"version": 1, "articles": [{"title": "标题", "content": "正文"}]},
            {"articles": []},
            {"articles": [{"title": "标题"}]},
            {"articles": [{"title": "标题", "content": "正文", "organization_state": "错误状态"}]},
            {"articles": [{"title": "标题", "content": "正文", "category": {"name": "x" * 101}}]},
        ):
            with self.subTest(payload=payload), self.assertRaises(ValidationError):
                文章迁移请求.model_validate(payload)
