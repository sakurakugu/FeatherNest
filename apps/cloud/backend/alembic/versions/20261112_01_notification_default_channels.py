"""拆分推送令牌的允许渠道与默认渠道。"""

import sqlalchemy as sa
from alembic import op

revision = "20261112_01"
down_revision = "20261112_00"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("notification_tokens", sa.Column("default_channel_ids", sa.JSON(), nullable=True))
    op.execute("UPDATE notification_tokens SET default_channel_ids = channel_ids")
    op.alter_column("notification_tokens", "default_channel_ids", nullable=False)


def downgrade() -> None:
    op.drop_column("notification_tokens", "default_channel_ids")
