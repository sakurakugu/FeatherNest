"""友链相关 Schema。"""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.shared.kernel.pagination import PaginatedResponse

友链排序字段 = Literal[
    "name", "url", "description", "status", "category", "contact_name",
    "is_auto_exchange", "created_at", "updated_at", "deleted_at",
]


class 友链创建(BaseModel):
    """创建友链请求。"""

    name: str = Field(max_length=100)
    url: str = Field(max_length=500)
    description: str | None = Field(default=None, max_length=200)
    logo_url: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=50)
    contact_email: str | None = Field(default=None, max_length=255)
    contact_name: str | None = Field(default=None, max_length=100)
    status: Literal["pending", "approved", "rejected"] = "approved"


class 友链更新(BaseModel):
    """更新友链请求。"""

    name: str | None = Field(default=None, max_length=100)
    url: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=200)
    logo_url: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=50)
    status: str | None = None
    contact_email: str | None = Field(default=None, max_length=255)
    contact_name: str | None = Field(default=None, max_length=100)


class 友链信息(BaseModel):
    """友链数据响应。"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    url: str
    description: str | None = None
    logo_url: str | None = None
    category: str | None = None
    status: str
    is_auto_exchange: bool
    is_deleted: bool = False
    deleted_at: datetime | None = None
    contact_email: str | None = None
    contact_name: str | None = None
    created_at: datetime
    updated_at: datetime


class 友链公开信息(BaseModel):
    """公开可见的友链信息。"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    url: str
    description: str | None = None
    logo_url: str | None = None
    category: str | None = None


class 友链分类统计(BaseModel):
    """当前视图的分类数量，空字符串表示未分类。"""

    category: str
    count: int


class 友链列表统计(BaseModel):
    """当前列表各状态数量与两个视图的总量，不受筛选影响。"""

    total: int = 0
    pending: int = 0
    approved: int = 0
    rejected: int = 0
    active_total: int = 0
    recycle_bin: int = 0
    categories: list[友链分类统计] = Field(default_factory=list)


class 友链列表响应(PaginatedResponse[友链信息]):
    """管理端友链列表及标签数量。"""

    counts: 友链列表统计


class 友链交换请求(BaseModel):
    """友链交换申请请求。"""

    name: str = Field(max_length=100)
    url: str = Field(max_length=500)
    description: str | None = Field(default=None, max_length=200)
    logo_url: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=50)
    contact_email: str | None = Field(default=None, max_length=255)
    contact_name: str | None = Field(default=None, max_length=100)
    my_site_url: str = Field(max_length=500)
