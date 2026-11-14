"""用户公共校验与数据处理。"""

from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import 用户


def 规范化用户名输入(value: str) -> str:
    """规范化用户名输入。"""
    normalized = value.strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="用户名不能为空")
    return normalized


async def 获取用户或404(db: AsyncSession, user_id: UUID) -> 用户:
    """按 ID 获取用户。"""
    target = await db.get(用户, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return target


async def 确保用户名可用(
    db: AsyncSession,
    username: str,
    *,
    exclude_user_id: UUID | None = None,
) -> None:
    """校验用户名是否可用。"""
    query = select(用户).where(用户.username == username)
    if exclude_user_id is not None:
        query = query.where(用户.id != exclude_user_id)
    exists = await db.execute(query)
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="用户名已被使用")


async def 确保邮箱可用(
    db: AsyncSession,
    email: object,
    *,
    exclude_user_id: UUID | None = None,
) -> None:
    """校验邮箱是否可用。"""
    query = select(用户).where(用户.email == str(email))
    if exclude_user_id is not None:
        query = query.where(用户.id != exclude_user_id)
    exists = await db.execute(query)
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="邮箱已被使用")


async def 确保用户名或邮箱可用于创建(
    db: AsyncSession,
    *,
    username: str,
    email: object,
) -> None:
    """校验创建用户时用户名或邮箱是否冲突。"""
    exists = await db.execute(
        select(用户).where(
            (用户.username == username) | (用户.email == str(email))
        )
    )
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="用户名或邮箱已被使用")
