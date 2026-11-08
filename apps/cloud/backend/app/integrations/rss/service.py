"""RSS 生成服务。"""

from __future__ import annotations

from datetime import datetime, timezone
from email.utils import format_datetime
from xml.etree.ElementTree import Element, SubElement, tostring

from app.core.config import settings
from app.modules.feed.schemas import FeedItemRead


def _格式化RFC822(dt: datetime) -> str:
    """将 datetime 格式化为 RSS 标准的 RFC 822 时间字符串。"""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return format_datetime(dt)


def 构建RSS_XML(
    items: list[FeedItemRead],
    *,
    title: str = "Sakurakuguの小窝",
    description: str = "动态流",
) -> str:
    """根据 Feed 条目构建 RSS 2.0 XML。"""
    site_url = settings.SITE_URL.rstrip("/")
    now = _格式化RFC822(datetime.now(timezone.utc))

    rss = Element("rss", version="2.0")
    channel = SubElement(rss, "channel")
    for name, text in {
        "title": title,
        "link": site_url,
        "description": description,
        "lastBuildDate": now,
        "language": "zh-CN",
    }.items():
        SubElement(channel, name).text = text
    for raw in items:
        item = FeedItemRead.model_validate(raw) if isinstance(raw, dict) else raw
        if item.type != "article" or item.article is None:
            continue

        article = item.article
        link = f"{site_url}/blog/{article.slug}"
        pub_date = _格式化RFC822(item.published_at)
        node = SubElement(channel, "item")
        for name, text in {
            "title": article.title,
            "link": link,
            "description": article.excerpt or "",
            "pubDate": pub_date,
        }.items():
            SubElement(node, name).text = text
        SubElement(node, "guid", isPermaLink="true").text = link

    return tostring(rss, encoding="utf-8", xml_declaration=True).decode("utf-8")
