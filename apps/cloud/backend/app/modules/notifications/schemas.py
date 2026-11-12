"""推送网关接口模型。"""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

推送平台 = Literal["bark", "serverchan", "pushplus", "wxpusher", "wecom", "feishu", "dingtalk", "webhook"]
推送文本类型 = Literal["text", "markdown", "html"]


class 推送渠道创建(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    provider: 推送平台
    config: dict[str, str]
    enabled: bool = True

    @field_validator("name")
    @classmethod
    def 规范化名称(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("渠道名称不能为空")
        return normalized


class 推送渠道更新(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    config: dict[str, str] | None = None
    enabled: bool | None = None

    @field_validator("name")
    @classmethod
    def 规范化名称(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("渠道名称不能为空")
        return normalized


class 推送渠道信息(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    provider: 推送平台
    enabled: bool
    has_config: bool = True
    created_at: datetime
    updated_at: datetime


class 推送令牌创建(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    channel_ids: list[UUID] = Field(min_length=1, max_length=20)
    default_channel_ids: list[UUID] = Field(min_length=1, max_length=20)
    default_content_type: 推送文本类型 = "text"

    @field_validator("name")
    @classmethod
    def 规范化名称(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("令牌名称不能为空")
        return normalized

    @field_validator("channel_ids", "default_channel_ids")
    @classmethod
    def 渠道不能重复(cls, value: list[UUID]) -> list[UUID]:
        if len(value) != len(set(value)):
            raise ValueError("推送渠道不能重复")
        return value


class 推送令牌更新(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    channel_ids: list[UUID] | None = Field(default=None, min_length=1, max_length=20)
    default_channel_ids: list[UUID] | None = Field(default=None, min_length=1, max_length=20)
    default_content_type: 推送文本类型 | None = None
    enabled: bool | None = None

    @field_validator("name", "channel_ids", "default_channel_ids", "default_content_type", "enabled")
    @classmethod
    def 更新值不能为空(cls, value):
        if value is None:
            raise ValueError("令牌更新字段不能为 null")
        return value

    @field_validator("name")
    @classmethod
    def 规范化名称(cls, value: str) -> str:
        return 推送令牌创建.规范化名称(value)

    @field_validator("channel_ids", "default_channel_ids")
    @classmethod
    def 渠道不能重复(cls, value: list[UUID]) -> list[UUID]:
        return 推送令牌创建.渠道不能重复(value)


class 推送令牌信息(BaseModel):
    id: UUID
    name: str
    channel_ids: list[UUID]
    default_channel_ids: list[UUID]
    default_content_type: 推送文本类型
    enabled: bool
    last_used_at: datetime | None
    created_at: datetime


class 推送令牌创建响应(推送令牌信息):
    token: str


class 推送消息(BaseModel):
    channel_ids: list[UUID] | None = Field(default=None, min_length=1, max_length=20)
    content_type: 推送文本类型 | None = None
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=20000)

    @field_validator("title", "content")
    @classmethod
    def 去除首尾空白(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("消息标题和正文不能为空")
        return normalized

    @field_validator("channel_ids")
    @classmethod
    def 渠道不能重复(cls, value: list[UUID] | None) -> list[UUID] | None:
        if value is not None and len(value) != len(set(value)):
            raise ValueError("推送渠道不能重复")
        return value


class 推送结果项(BaseModel):
    channel_id: UUID
    name: str
    success: bool
    error: str | None = None


class 推送发送响应(BaseModel):
    results: list[推送结果项]
