"""每日检查友链并汇总通知。"""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select, text
from app.modules.friend_links.backlink import 检测回链
from app.modules.friend_links.models import 友链, 友链状态
from app.modules.notifications.models import 推送渠道
from app.modules.notifications.service import _发送单渠道
from app.shared.db.session import async_session_factory

logger = logging.getLogger(__name__)
时区 = ZoneInfo("Asia/Shanghai")
任务: asyncio.Task | None = None

async def 每日处理():
    now = datetime.now(时区)
    if now.hour < 21:
        return
    day = now.date()
    async with async_session_factory() as db:
        locked = (await db.execute(text("SELECT pg_try_advisory_xact_lock(779328401)"))).scalar_one()
        if not locked:
            return
        exists = (await db.execute(text("SELECT 1 FROM friend_link_daily_jobs WHERE day = :day"), {"day": day})).scalar_one_or_none()
        if exists:
            return
        links = (await db.execute(select(友链).where(友链.is_deleted.is_(False), 友链.backlink_url.is_not(None), 友链.status.in_([友链状态.pending, 友链状态.approved])).with_for_update())).scalars().all()
        for link in links:
            if link.backlink_checked_on == day:
                continue
            result = await 检测回链(link.url, link.backlink_url)
            link.backlink_checked_on = day
            if result is True:
                link.backlink_missing_days = 0
                if link.status == 友链状态.pending:
                    link.backlink_days += 1
                    if link.backlink_days >= 30:
                        link.status = 友链状态.approved
                        link.is_auto_exchange = True
                        link.auto_approved_on = day
            elif result is False:
                link.backlink_days = 0
                link.backlink_missing_days += 1
                if link.status == 友链状态.approved and link.is_auto_exchange and link.backlink_missing_days >= 3:
                    link.status = 友链状态.pending
                    link.is_auto_exchange = False
        await db.flush()
        pending = (await db.execute(select(友链).where(友链.is_deleted.is_(False), 友链.status == 友链状态.pending))).scalars().all()
        approved = (await db.execute(select(友链).where(友链.is_deleted.is_(False), 友链.auto_approved_on == day))).scalars().all()
        channels = (await db.execute(select(推送渠道).where(推送渠道.enabled.is_(True), 推送渠道.id.in_(select(text("channel_id")).select_from(text("friend_link_notification_channels")).where(text("is_default = true")))))).scalars().all()
        lines = []
        if pending:
            lines.append(f"待审核 {len(pending)} 项：" + "、".join(x.name for x in pending[:20]))
        if approved:
            lines.append(f"今日自动通过 {len(approved)} 项：" + "、".join(x.name for x in approved[:20]))
        if lines:
            for channel in channels:
                await db.execute(text("INSERT INTO friend_link_notification_outbox (day, channel_id, content) VALUES (:day, :channel_id, :content)"), {"day": day, "channel_id": channel.id, "content": "\n".join(lines)})
        await db.execute(text("INSERT INTO friend_link_daily_jobs(day) VALUES (:day)"), {"day": day})
        await db.commit()
        # 失败或中断的发送留待下一天的汇总任务重试。
        for channel in channels:
            rows = (await db.execute(text("SELECT day, content FROM friend_link_notification_outbox WHERE channel_id = :channel_id AND sent = false AND day <= :day ORDER BY day"), {"channel_id": channel.id, "day": day})).all()
            if not rows:
                continue
            content = "\n\n".join(f"{row.day}：\n{row.content}" for row in rows)
            try:
                result = await _发送单渠道(channel, "友链每日汇总", content)
                if not result.success:
                    logger.warning("友链汇总推送失败，明日重试：%s", channel.name)
                    continue
                await db.execute(text("UPDATE friend_link_notification_outbox SET sent = true WHERE channel_id = :channel_id AND sent = false AND day <= :day"), {"channel_id": channel.id, "day": day})
                await db.commit()
            except Exception:
                await db.rollback()
                logger.exception("友链汇总推送异常，明日重试：%s", channel.name)

async def _循环():
    while True:
        try:
            await 每日处理()
        except Exception:
            logger.exception("友链每日任务失败")
        await asyncio.sleep(60)

def 启动友链每日任务():
    global 任务
    任务 = asyncio.create_task(_循环())

async def 停止友链每日任务():
    global 任务
    if 任务:
        任务.cancel()
        try:
            await 任务
        except asyncio.CancelledError:
            pass
        任务 = None
