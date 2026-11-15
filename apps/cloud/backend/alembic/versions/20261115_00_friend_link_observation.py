"""增加友链自动审核所需的观察记录。"""
from alembic import op
import sqlalchemy as sa

revision = "20261115_00"
down_revision = "20261114_00"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("friend_links", sa.Column("backlink_url", sa.String(500), nullable=True))
    op.add_column("friend_links", sa.Column("backlink_days", sa.Integer(), server_default="0", nullable=False))
    op.add_column("friend_links", sa.Column("backlink_missing_days", sa.Integer(), server_default="0", nullable=False))
    op.add_column("friend_links", sa.Column("backlink_checked_on", sa.Date(), nullable=True))
    op.add_column("friend_links", sa.Column("auto_approved_on", sa.Date(), nullable=True))
    op.create_table("friend_link_daily_jobs", sa.Column("day", sa.Date(), primary_key=True))
    op.create_table("friend_link_notification_channels", sa.Column("channel_id", sa.Uuid(), sa.ForeignKey("notification_channels.id", ondelete="CASCADE"), primary_key=True))
    op.create_table("friend_link_notification_outbox", sa.Column("day", sa.Date(), primary_key=True), sa.Column("channel_id", sa.Uuid(), sa.ForeignKey("notification_channels.id", ondelete="CASCADE"), primary_key=True), sa.Column("content", sa.Text(), nullable=False), sa.Column("sent", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade():
    op.drop_table("friend_link_notification_outbox")
    op.drop_table("friend_link_notification_channels")
    op.drop_table("friend_link_daily_jobs")
    for column in ("auto_approved_on", "backlink_checked_on", "backlink_missing_days", "backlink_days", "backlink_url"):
        op.drop_column("friend_links", column)
