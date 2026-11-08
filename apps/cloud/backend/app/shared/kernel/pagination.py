"""共享分页结构。"""

from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T", default=Any)


class PaginatedResponse(BaseModel, Generic[T]):
    """通用分页响应。"""

    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int
