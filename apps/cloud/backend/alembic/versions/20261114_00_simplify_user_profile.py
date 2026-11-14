"""精简用户资料：移除昵称、角色、启用状态、邮箱判重键与用户设置表。

Revision ID: 20261114_00
Revises: 20261112_01
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20261114_00"
down_revision = "20261112_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """升级数据库结构。"""
    op.drop_table("user_settings")
    op.drop_index("uq_users_single_admin", table_name="users", if_exists=True)
    # 邮箱判重键的唯一约束与索引会随列一并删除
    op.drop_column("users", "email_identity")
    op.drop_column("users", "nickname")
    op.drop_column("users", "role")
    op.drop_column("users", "is_active")
    op.execute("DROP TYPE IF EXISTS userrole")


def downgrade() -> None:
    """回滚数据库结构（昵称内容无法恢复，回填为用户名）。"""
    user_role = postgresql.ENUM("admin", "user", name="userrole")
    user_role.create(op.get_bind(), checkfirst=True)
    op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column(
        "users",
        sa.Column(
            "role",
            postgresql.ENUM("admin", "user", name="userrole", create_type=False),
            nullable=False,
            server_default="user",
        ),
    )
    op.add_column("users", sa.Column("nickname", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("email_identity", sa.String(length=255), nullable=True))
    op.execute("UPDATE users SET nickname = username, email_identity = lower(email)")
    op.alter_column("users", "email_identity", nullable=False)
    op.create_unique_constraint("uq_users_email_identity", "users", ["email_identity"])
    op.create_index("ix_users_email_identity", "users", ["email_identity"], unique=False)
    op.alter_column("users", "is_active", server_default=None)
    op.alter_column("users", "role", server_default=None)
    op.create_table(
        "user_settings",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("show_private_articles_on_home", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.execute("INSERT INTO user_settings (user_id) SELECT id FROM users")
