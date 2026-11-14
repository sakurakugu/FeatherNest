"""用户相关 Schema。"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.shared.kernel.validation import 校验用户名


class 用户信息(BaseModel):
    """用户信息公开数据。"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    email: str
    avatar_url: str | None = None
    bio: str | None = None
    created_at: datetime


class 用户更新(BaseModel):
    """用户资料更新请求。"""

    username: str | None = Field(default=None, min_length=2, max_length=50)
    email: EmailStr | None = None
    bio: str | None = None
    avatar_url: str | None = None

    @field_validator("username")
    @classmethod
    def 校验用户名字段(cls, value: str | None) -> str | None:
        """规范化用户名。"""
        if value is None:
            return None
        return 校验用户名(value)


class 用户修改密码(BaseModel):
    """用户修改自己密码请求。"""

    current_password: str = Field(min_length=6, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)
