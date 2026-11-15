"""安全地检测友链页面中的本站回链。"""
from __future__ import annotations

import asyncio
import ipaddress
import logging
import socket
from urllib.parse import urljoin, urlsplit

import aiohttp
from bs4 import BeautifulSoup

from app.core.config import settings

logger = logging.getLogger(__name__)
最大页面字节数 = 1024 * 1024


def 主机(url: str) -> str:
    return (urlsplit(url).hostname or "").lower().rstrip(".").removeprefix("www.")


def 同站点(first: str, second: str) -> bool:
    return bool(主机(first)) and 主机(first) == 主机(second)


class 公网解析器(aiohttp.abc.AbstractResolver):
    """解析并固定公网地址，阻止 DNS 重绑定和内网访问。"""
    async def resolve(self, host: str, port: int = 0, family: int = socket.AF_UNSPEC):
        results = await asyncio.get_running_loop().getaddrinfo(host, port, family=family, type=socket.SOCK_STREAM)
        addresses = []
        for item in results:
            address = item[4][0]
            if not ipaddress.ip_address(address).is_global:
                raise ValueError("解析结果包含非公网地址")
            addresses.append({"hostname": host, "host": address, "port": port, "family": item[0], "proto": item[2], "flags": 0})
        if not addresses:
            raise ValueError("域名没有公网地址")
        return addresses

    async def close(self):
        pass


async def 检测回链(site_url: str, backlink_url: str) -> bool | None:
    """返回有回链、无回链或检测失败；网络错误不清零。"""
    try:
        current = backlink_url
        connector = aiohttp.TCPConnector(resolver=公网解析器(), use_dns_cache=False)
        async with aiohttp.ClientSession(connector=connector, timeout=aiohttp.ClientTimeout(total=12), trust_env=False) as client:
            for _ in range(4):
                parsed = urlsplit(current)
                if parsed.scheme not in {"http", "https"} or parsed.username is not None or not 同站点(site_url, current):
                    raise ValueError("回链地址或跳转目标不属于申请网站")
                # IP 字面量可能绕过解析器，必须单独检查。
                try:
                    address = ipaddress.ip_address(parsed.hostname or "")
                except ValueError:
                    pass
                else:
                    if not address.is_global:
                        raise ValueError("不允许访问非公网地址")
                async with client.get(current, allow_redirects=False, headers={"User-Agent": "FeatherNest-FriendLink/1.0"}) as response:
                    if response.status in {301, 302, 303, 307, 308}:
                        location = response.headers.get("Location")
                        if not location:
                            raise ValueError("跳转缺少地址")
                        current = urljoin(current, location)
                        continue
                    response.raise_for_status()
                    data = await response.content.read(最大页面字节数 + 1)
                    if len(data) > 最大页面字节数:
                        raise ValueError("页面过大")
                    html = data.decode(response.charset or "utf-8", errors="replace")
                    for link in BeautifulSoup(html, "html.parser").find_all("a", href=True):
                        target = urljoin(current, str(link["href"]))
                        parsed_target = urlsplit(target)
                        if parsed_target.scheme in {"http", "https"} and parsed_target.username is None and 同站点(settings.SITE_URL, target):
                            return True
                    return False
            raise ValueError("跳转次数过多")
    except (aiohttp.ClientError, asyncio.TimeoutError, OSError, ValueError, UnicodeError, LookupError) as exc:
        logger.info("友链回链检测失败：%s，原因：%s", backlink_url, type(exc).__name__)
        return None
