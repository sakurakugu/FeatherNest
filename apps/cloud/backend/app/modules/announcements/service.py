"""公告模块服务。"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import delete, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import 用户
from app.modules.announcements.models import Announcement
from app.modules.announcements.schemas import (
    AnnouncementCreate,
    AnnouncementListRead,
    AnnouncementPublicRead,
    AnnouncementRead,
    AnnouncementUpdate,
)
from app.shared.kernel.soft_delete import 可软删除对象


async def 列出公开公告(
    db: AsyncSession,
    *,
    limit: int,
) -> list[AnnouncementPublicRead]:
    """获取当前生效的公告列表。"""
    result = await db.execute(
        select(Announcement)
        .where(Announcement.is_active.is_(True), Announcement.is_deleted.is_(False))
        .order_by(desc(Announcement.created_at))
        .limit(limit)
    )
    announcements = result.scalars().all()
    return [AnnouncementPublicRead.model_validate(item) for item in announcements]


async def 获取最新公开公告(db: AsyncSession) -> AnnouncementPublicRead | None:
    """获取最新的生效公告。"""
    result = await db.execute(
        select(Announcement)
        .where(Announcement.is_active.is_(True), Announcement.is_deleted.is_(False))
        .order_by(desc(Announcement.created_at))
        .limit(1)
    )
    announcement = result.scalar_one_or_none()
    return AnnouncementPublicRead.model_validate(announcement) if announcement is not None else None


async def 列出公告(
    db: AsyncSession,
    *,
    page: int,
    page_size: int,
    is_deleted: bool = False,
    is_active: bool | None = None,
    search: str | None = None,
    content_state: str = "all",
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> AnnouncementListRead:
    """获取公告分页列表，状态筛选、搜索与排序都在分页前执行。"""
    query = select(Announcement).where(Announcement.is_deleted.is_(is_deleted))
    if is_active is not None:
        query = query.where(Announcement.is_active.is_(is_active))
    if search and search.strip():
        keyword = f"%{search.strip()}%"
        query = query.where(
            or_(Announcement.title.ilike(keyword), Announcement.content.ilike(keyword))
        )
    if content_state == "has":
        query = query.where(func.trim(Announcement.content) != "")
    elif content_state == "empty":
        query = query.where(func.trim(Announcement.content) == "")

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    排序列 = {
        "title": Announcement.title,
        "created_at": Announcement.created_at,
        "updated_at": Announcement.updated_at,
        "deleted_at": Announcement.deleted_at,
    }[sort_by]
    排序表达式 = 排序列.asc() if sort_order == "asc" else 排序列.desc()
    result = await db.execute(
        query.order_by(排序表达式, Announcement.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = result.scalars().all()
    pages = (total + page_size - 1) // page_size if page_size > 0 else 1

    active_result = await db.execute(
        select(func.count())
        .select_from(Announcement)
        .where(Announcement.is_deleted.is_(False), Announcement.is_active.is_(True))
    )
    inactive_result = await db.execute(
        select(func.count())
        .select_from(Announcement)
        .where(Announcement.is_deleted.is_(False), Announcement.is_active.is_(False))
    )
    trash_result = await db.execute(
        select(func.count()).select_from(Announcement).where(Announcement.is_deleted.is_(True))
    )
    active_total = active_result.scalar() or 0
    inactive_total = inactive_result.scalar() or 0
    trash_total = trash_result.scalar() or 0

    return AnnouncementListRead(
        items=[AnnouncementRead.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
        active_total=active_total,
        inactive_total=inactive_total,
        trash_total=trash_total,
    )


async def 获取公告或404(db: AsyncSession, announcement_id: UUID) -> Announcement:
    """获取单个公告。"""
    result = await db.execute(
        select(Announcement).where(
            Announcement.id == announcement_id,
            Announcement.is_deleted.is_(False),
        )
    )
    announcement = result.scalar_one_or_none()
    if announcement is None:
        raise HTTPException(status_code=404, detail="公告不存在")
    return announcement


async def 获取已删公告或404(db: AsyncSession, announcement_id: UUID) -> Announcement:
    """获取回收站中的公告。"""
    result = await db.execute(
        select(Announcement).where(
            Announcement.id == announcement_id,
            Announcement.is_deleted.is_(True),
        )
    )
    announcement = result.scalar_one_or_none()
    if announcement is None:
        raise HTTPException(status_code=404, detail="公告不存在或未被删除")
    return announcement


def 应用公告删除状态(announcement: 可软删除对象, *, now: datetime | None = None) -> None:
    """将公告标记为已删除。"""
    announcement.is_deleted = True
    announcement.deleted_at = now or datetime.now(timezone.utc)


def 恢复公告删除状态(announcement: 可软删除对象) -> None:
    """恢复公告的删除状态。"""
    announcement.is_deleted = False
    announcement.deleted_at = None


async def 创建公告(db: AsyncSession, body: AnnouncementCreate, current_user: 用户) -> Announcement:
    """创建公告。"""
    announcement = Announcement(
        title=body.title,
        content=body.content,
        is_active=body.is_active,
        created_by=current_user.id,
    )
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)
    return announcement


async def 更新公告(
    db: AsyncSession,
    announcement_id: UUID,
    body: AnnouncementUpdate,
) -> Announcement:
    """更新公告。"""
    announcement = await 获取公告或404(db, announcement_id)

    if body.title is not None:
        announcement.title = body.title
    if body.content is not None:
        announcement.content = body.content
    if body.is_active is not None:
        announcement.is_active = body.is_active

    await db.commit()
    await db.refresh(announcement)
    return announcement


async def 删除公告(db: AsyncSession, announcement_id: UUID, *, permanent: bool) -> None:
    """删除公告。"""
    if permanent:
        announcement = await 获取已删公告或404(db, announcement_id)
        await db.delete(announcement)
        await db.commit()
        return

    announcement = await 获取公告或404(db, announcement_id)
    应用公告删除状态(announcement)
    await db.commit()


async def 恢复公告(db: AsyncSession, announcement_id: UUID) -> Announcement:
    """从回收站恢复公告。"""
    announcement = await 获取已删公告或404(db, announcement_id)
    恢复公告删除状态(announcement)
    await db.commit()
    await db.refresh(announcement)
    return announcement


async def 清空公告回收站(db: AsyncSession) -> int:
    """永久删除回收站中的全部公告，返回删除数量。"""
    result = await db.execute(delete(Announcement).where(Announcement.is_deleted.is_(True)))
    await db.commit()
    return getattr(result, "rowcount", 0) or 0
