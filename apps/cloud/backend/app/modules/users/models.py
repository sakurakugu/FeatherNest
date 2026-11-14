"""用户模块相关模型。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.db.session import Base
from app.utils.uuid import generate_uuid7

if TYPE_CHECKING:
    from app.modules.articles.models import 文章
    from app.modules.bills.models import BillAccount, BillCategory, BillRecord, BillTemplate
    from app.modules.materials.models import 资料
    from app.modules.files.models import File, FileFolder
    from app.modules.media.models import 文娱条目
    from app.modules.moments.models import 动态
    from app.modules.todos.models import Todo


def utcnow() -> datetime:
    """返回当前 UTC 时间。"""
    return datetime.now(timezone.utc)


class 用户(Base):
    """用户模型。"""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=generate_uuid7)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    bio: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    articles: Mapped[list["文章"]] = relationship(back_populates="author", cascade="all, delete-orphan")
    materials: Mapped[list["资料"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    media_items: Mapped[list["文娱条目"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    todos: Mapped[list["Todo"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    bill_accounts: Mapped[list["BillAccount"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    bill_categories: Mapped[list["BillCategory"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    bill_records: Mapped[list["BillRecord"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    bill_templates: Mapped[list["BillTemplate"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    file_folders: Mapped[list["FileFolder"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="FileFolder.user_id",
    )
    files: Mapped[list["File"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="File.user_id",
    )
    moments: Mapped[list["动态"]] = relationship(back_populates="user", cascade="all, delete-orphan")
