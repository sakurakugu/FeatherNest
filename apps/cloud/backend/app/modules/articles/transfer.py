"""文章迁移：在同一事务中导入正文、分类、标签及原始时间。"""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.articles.crud import 创建文章草稿
from app.modules.articles.models import 分类, 标签
from app.modules.articles.schemas import 分类创建, 标签创建, 文章草稿创建, 文章迁移请求
from app.modules.articles.taxonomy import 创建分类, 创建标签
from app.modules.users.models import 用户

logger = logging.getLogger(__name__)


async def 导入文章(db: AsyncSession, body: 文章迁移请求, user: 用户) -> int:
    categories = {item.name: item for item in (await db.execute(select(分类))).scalars()}
    tags = {item.name: item for item in (await db.execute(select(标签))).scalars()}
    for item in body.articles:
        category_id = None
        if item.category:
            name = item.category.name
            if name not in categories:
                categories[name] = await 创建分类(db, 分类创建(name=name))
            category_id = categories[name].id
        tag_ids = []
        for tag in item.tags:
            if tag.name not in tags:
                tags[tag.name] = await 创建标签(db, 标签创建(name=tag.name))
            tag_id = tags[tag.name].id
            if tag_id not in tag_ids:
                tag_ids.append(tag_id)
        article = await 创建文章草稿(db, 文章草稿创建(
            title=item.title,
            content=item.content,
            excerpt=item.excerpt,
            cover_url=item.cover_url,
            organization_state=item.organization_state,
            category_id=category_id,
            tag_ids=tag_ids,
        ), user)
        if item.created_at is not None:
            article.created_at = item.created_at
        if item.last_edited_at is not None:
            article.last_edited_at = item.last_edited_at
        if item.updated_at is not None:
            article.updated_at = item.updated_at
        if item.organization_state == "archived" and item.archived_at is not None:
            article.archived_at = item.archived_at
        article.import_metadata = item.model_dump(mode="json", exclude={
            "title", "content", "excerpt", "cover_url", "category", "tags",
            "organization_state", "created_at", "last_edited_at", "updated_at", "archived_at",
        })
    await db.flush()
    logger.info("文章迁移已导入：user_id=%s count=%s", user.id, len(body.articles))
    return len(body.articles)
