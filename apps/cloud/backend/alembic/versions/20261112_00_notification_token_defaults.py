"""为推送令牌添加默认文本类型。"""

from alembic import op
import sqlalchemy as sa

revision = "20261112_00"
down_revision = "20261111_00"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "notification_tokens",
        sa.Column("default_content_type", sa.String(16), nullable=False, server_default="text"),
    )
    op.alter_column("notification_tokens", "default_content_type", server_default=None)


def downgrade() -> None:
    op.drop_column("notification_tokens", "default_content_type")
