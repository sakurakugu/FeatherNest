"""区分友链汇总的允许渠道和默认渠道。"""
from alembic import op
import sqlalchemy as sa

revision = "20261115_01"
down_revision = "20261115_00"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("friend_link_notification_channels", sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.true()))


def downgrade():
    op.drop_column("friend_link_notification_channels", "is_default")
