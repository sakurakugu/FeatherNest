"""推送渠道管理和脚本发送接口。"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.schemas import (
    推送渠道创建,
    推送渠道信息,
    推送渠道更新,
    推送令牌创建,
    推送令牌创建响应,
    推送令牌信息,
    推送令牌更新,
    推送消息,
    推送发送响应,
)
from app.modules.notifications.service import (
    创建渠道,
    创建令牌,
    删除渠道,
    删除令牌,
    列出渠道,
    列出令牌,
    重置令牌,
    更新令牌,
    测试渠道,
    更新渠道,
    发送消息,
    验证令牌,
)
from app.modules.users.models import 用户
from app.shared.auth.deps import 要求当前用户
from app.shared.db.session import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/channels", response_model=list[推送渠道信息])
async def 获取推送渠道(_: 用户 = Depends(要求当前用户), db: AsyncSession = Depends(get_db)):
    return await 列出渠道(db)


@router.post("/channels", response_model=推送渠道信息, status_code=status.HTTP_201_CREATED)
async def 新建推送渠道(body: 推送渠道创建, _: 用户 = Depends(要求当前用户), db: AsyncSession = Depends(get_db)):
    return await 创建渠道(db, body)


@router.patch("/channels/{channel_id}", response_model=推送渠道信息)
async def 编辑推送渠道(channel_id: UUID, body: 推送渠道更新, _: 用户 = Depends(要求当前用户), db: AsyncSession = Depends(get_db)):
    return await 更新渠道(db, channel_id, body)


@router.delete("/channels/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def 移除推送渠道(channel_id: UUID, _: 用户 = Depends(要求当前用户), db: AsyncSession = Depends(get_db)):
    await 删除渠道(db, channel_id)


@router.post("/channels/{channel_id}/test")
async def 发送推送测试(channel_id: UUID, _: 用户 = Depends(要求当前用户), db: AsyncSession = Depends(get_db)):
    return await 测试渠道(db, channel_id)


@router.get("/tokens", response_model=list[推送令牌信息])
async def 获取推送令牌(_: 用户 = Depends(要求当前用户), db: AsyncSession = Depends(get_db)):
    return await 列出令牌(db)


@router.post("/tokens", response_model=推送令牌创建响应, status_code=status.HTTP_201_CREATED)
async def 新建推送令牌(body: 推送令牌创建, _: 用户 = Depends(要求当前用户), db: AsyncSession = Depends(get_db)):
    return await 创建令牌(db, body)


@router.patch("/tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
async def 编辑推送令牌(token_id: UUID, body: 推送令牌更新, _: 用户 = Depends(要求当前用户), db: AsyncSession = Depends(get_db)):
    await 更新令牌(db, token_id, body)


@router.post("/tokens/{token_id}/reset", response_model=推送令牌创建响应)
async def 重置推送令牌(token_id: UUID, _: 用户 = Depends(要求当前用户), db: AsyncSession = Depends(get_db)):
    return await 重置令牌(db, token_id)


@router.delete("/tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
async def 移除推送令牌(token_id: UUID, _: 用户 = Depends(要求当前用户), db: AsyncSession = Depends(get_db)):
    await 删除令牌(db, token_id)


@router.post("/send", response_model=推送发送响应)
async def 发送推送消息(
    body: 推送消息,
    authorization: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
):
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="需要推送令牌")
    token_value = authorization.removeprefix("Bearer ").strip()
    if not token_value:
        raise HTTPException(status_code=401, detail="需要推送令牌")
    token = await 验证令牌(db, token_value)
    return {"results": await 发送消息(db, token, body)}
