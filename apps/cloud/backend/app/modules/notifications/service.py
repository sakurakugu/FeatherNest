"""推送渠道管理与消息转发。"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import secrets
import socket
import time
from ipaddress import ip_address
from urllib.parse import parse_qsl, quote, urlencode, urlsplit, urlunsplit
from uuid import UUID

import httpx
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.notifications.models import 推送渠道, 推送令牌
from app.modules.notifications.schemas import (
    推送渠道创建,
    推送渠道更新,
    推送令牌创建,
    推送消息,
    推送结果项,
)
from app.shared.kernel.logger import get_logger
from app.shared.db.timestamps import utcnow

logger = get_logger(__name__)
渠道必填配置: dict[str, set[str]] = {
    "bark": {"device_key"},
    "serverchan": {"send_key"},
    "pushplus": {"token"},
    "wxpusher": {"app_token"},
    "wecom": {"key"},
    "feishu": {"webhook_url"},
    "dingtalk": {"webhook_url"},
    "webhook": {"url"},
}


def _加密器() -> Fernet:
    digest = hashlib.sha256(settings.AUTH_SECRET_KEY.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def _加密配置(config: dict[str, str]) -> str:
    return _加密器().encrypt(json.dumps(config, ensure_ascii=False).encode("utf-8")).decode("ascii")


def _解密配置(ciphertext: str) -> dict[str, str]:
    try:
        return json.loads(_加密器().decrypt(ciphertext.encode("ascii")))
    except (InvalidToken, ValueError, json.JSONDecodeError) as exc:
        logger.error("推送渠道配置解密失败")
        raise HTTPException(status_code=400, detail="推送配置无法解密，请重新保存") from exc


async def _校验渠道配置(provider: str, config: dict[str, str]) -> None:
    missing = 渠道必填配置[provider] - {key for key, value in config.items() if value.strip()}
    if missing:
        raise HTTPException(status_code=400, detail=f"渠道配置缺少必填项：{', '.join(sorted(missing))}")
    if provider in {"feishu", "dingtalk", "webhook"}:
        await _校验公开HTTPS地址(config["webhook_url"] if provider != "webhook" else config["url"])
    if provider == "webhook":
        method = config.get("method", "POST").upper()
        if method not in {"POST", "PUT", "PATCH", "GET"}:
            raise HTTPException(status_code=400, detail="通用 Webhook 仅支持 POST、PUT、PATCH 或 GET")
        try:
            headers = json.loads(config.get("headers", "{}"))
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Webhook 请求头必须是 JSON 对象") from exc
        if not isinstance(headers, dict) or any(not isinstance(key, str) or not isinstance(value, str) for key, value in headers.items()):
            raise HTTPException(status_code=400, detail="Webhook 请求头必须是字符串键值组成的 JSON 对象")
    if provider == "wxpusher":
        uids = [item.strip() for item in config.get("uids", "").split(",") if item.strip()]
        topic_ids = [item.strip() for item in config.get("topic_ids", "").split(",") if item.strip()]
        if not uids and not topic_ids:
            raise HTTPException(status_code=400, detail="WXPusher 至少需要填写 UID 或 Topic ID")
        if len(uids) > 2000 or len(topic_ids) > 5:
            raise HTTPException(status_code=400, detail="WXPusher 单次最多支持 2000 个 UID 或 5 个 Topic ID")
        if any(not item.isdecimal() or int(item) <= 0 for item in topic_ids):
            raise HTTPException(status_code=400, detail="WXPusher Topic ID 必须是正整数")
        if config.get("content_type", "1") not in {"1", "2", "3"}:
            raise HTTPException(status_code=400, detail="WXPusher content_type 只能是 1、2 或 3")


async def _校验公开HTTPS地址(url: str) -> None:
    parsed = urlsplit(url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise HTTPException(status_code=400, detail="Webhook 地址必须是有效的 HTTPS URL")
    try:
        records = await asyncio.to_thread(socket.getaddrinfo, parsed.hostname, parsed.port or 443)
        addresses = {ip_address(item[4][0]) for item in records}
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Webhook 域名无法解析") from exc
    if not addresses or any(not address.is_global for address in addresses):
        raise HTTPException(status_code=400, detail="Webhook 地址不能指向内网或本机")


async def 列出渠道(db: AsyncSession) -> list[dict]:
    channels = (await db.execute(select(推送渠道).order_by(推送渠道.created_at))).scalars().all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "provider": item.provider,
            "enabled": item.enabled,
            "has_config": bool(item.config_ciphertext),
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
        for item in channels
    ]


async def 创建渠道(db: AsyncSession, body: 推送渠道创建) -> dict:
    await _校验渠道配置(body.provider, body.config)
    channel = 推送渠道(
        name=body.name,
        provider=body.provider,
        config_ciphertext=_加密配置(body.config),
        enabled=body.enabled,
    )
    db.add(channel)
    try:
        await db.flush()
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="渠道名称已存在") from exc
    return {
        "id": channel.id,
        "name": channel.name,
        "provider": channel.provider,
        "enabled": channel.enabled,
        "has_config": True,
        "created_at": channel.created_at,
        "updated_at": channel.updated_at,
    }


async def 更新渠道(db: AsyncSession, channel_id: UUID, body: 推送渠道更新) -> dict:
    channel = await db.get(推送渠道, channel_id)
    if channel is None:
        raise HTTPException(status_code=404, detail="推送渠道不存在")
    if body.name is not None:
        channel.name = body.name
    if body.config is not None:
        config = body.config
        if channel.provider == "wxpusher":
            config = {**_解密配置(channel.config_ciphertext), **config}
        await _校验渠道配置(channel.provider, config)
        channel.config_ciphertext = _加密配置(config)
    if body.enabled is not None:
        channel.enabled = body.enabled
    try:
        await db.flush()
    except IntegrityError as exc:
        raise HTTPException(status_code=409, detail="渠道名称已存在") from exc
    return {
        "id": channel.id,
        "name": channel.name,
        "provider": channel.provider,
        "enabled": channel.enabled,
        "has_config": bool(channel.config_ciphertext),
        "created_at": channel.created_at,
        "updated_at": channel.updated_at,
    }


async def 删除渠道(db: AsyncSession, channel_id: UUID) -> None:
    channel = await db.get(推送渠道, channel_id)
    if channel is None:
        raise HTTPException(status_code=404, detail="推送渠道不存在")
    tokens = (await db.execute(select(推送令牌))).scalars().all()
    for token in tokens:
        token.channel_ids = [item for item in token.channel_ids if item != str(channel_id)]
        if not token.channel_ids:
            token.enabled = False
    await db.delete(channel)


async def 测试渠道(db: AsyncSession, channel_id: UUID) -> 推送结果项:
    channel = await db.get(推送渠道, channel_id)
    if channel is None:
        raise HTTPException(status_code=404, detail="推送渠道不存在")
    return await _发送单渠道(channel, "FeatherNest 推送测试", "推送渠道配置测试成功。")


async def 列出令牌(db: AsyncSession) -> list[dict]:
    items = (await db.execute(select(推送令牌).order_by(推送令牌.created_at.desc()))).scalars().all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "channel_ids": [UUID(value) for value in item.channel_ids],
            "enabled": item.enabled,
            "last_used_at": item.last_used_at,
            "created_at": item.created_at,
        }
        for item in items
    ]


async def 创建令牌(db: AsyncSession, body: 推送令牌创建) -> dict:
    channels = (await db.execute(select(推送渠道).where(推送渠道.id.in_(body.channel_ids)))).scalars().all()
    if len(channels) != len(body.channel_ids):
        raise HTTPException(status_code=400, detail="包含不存在的推送渠道")
    if any(not channel.enabled for channel in channels):
        raise HTTPException(status_code=400, detail="不能授权已停用的推送渠道")
    token_value = f"fn_push_{secrets.token_urlsafe(32)}"
    token = 推送令牌(
        name=body.name,
        token_hash=hashlib.sha256(token_value.encode()).hexdigest(),
        channel_ids=[str(value) for value in body.channel_ids],
        enabled=True,
    )
    db.add(token)
    await db.flush()
    return {
        "id": token.id,
        "name": token.name,
        "channel_ids": body.channel_ids,
        "enabled": token.enabled,
        "last_used_at": token.last_used_at,
        "created_at": token.created_at,
        "token": token_value,
    }


async def 设置令牌状态(db: AsyncSession, token_id: UUID, enabled: bool) -> None:
    token = await db.get(推送令牌, token_id)
    if token is None:
        raise HTTPException(status_code=404, detail="推送令牌不存在")
    token.enabled = enabled


async def 删除令牌(db: AsyncSession, token_id: UUID) -> None:
    token = await db.get(推送令牌, token_id)
    if token is None:
        raise HTTPException(status_code=404, detail="推送令牌不存在")
    await db.delete(token)


async def 验证令牌(db: AsyncSession, token_value: str) -> 推送令牌:
    digest = hashlib.sha256(token_value.encode()).hexdigest()
    token = (await db.execute(select(推送令牌).where(推送令牌.token_hash == digest))).scalar_one_or_none()
    if token is None or not token.enabled:
        raise HTTPException(status_code=401, detail="推送令牌无效或已停用")
    token.last_used_at = utcnow()
    return token


async def 发送消息(db: AsyncSession, token: 推送令牌, body: 推送消息) -> list[推送结果项]:
    permitted = set(token.channel_ids)
    requested = {str(item) for item in body.channel_ids}
    if not requested.issubset(permitted):
        raise HTTPException(status_code=403, detail="推送令牌无权使用请求中的渠道")
    channels = (
        await db.execute(select(推送渠道).where(推送渠道.id.in_(body.channel_ids), 推送渠道.enabled.is_(True)))
    ).scalars().all()
    by_id = {item.id: item for item in channels}
    enabled_results = await asyncio.gather(*(_发送单渠道(channel, body.title, body.content) for channel in channels))
    results_by_id = {item.channel_id: item for item in enabled_results}
    results = []
    for channel_id in body.channel_ids:
        channel = by_id.get(channel_id)
        if channel is None:
            results.append(推送结果项(channel_id=channel_id, name="", success=False, error="渠道不存在或已停用"))
        else:
            results.append(results_by_id[channel_id])
    return results


async def _发送单渠道(channel: 推送渠道, title: str, content: str) -> 推送结果项:
    config = _解密配置(channel.config_ciphertext)
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=False, trust_env=False) as client:
            response = await _构建请求(client, channel.provider, config, title, content)
        response.raise_for_status()
        payload = response.json() if response.content and channel.provider != "webhook" else {}
        if not isinstance(payload, dict):
            if channel.provider == "wxpusher":
                logger.warning(
                    "WXPusher 返回非对象响应 channel_id=%s status_code=%s",
                    channel.id,
                    response.status_code,
                )
                return 推送结果项(
                    channel_id=channel.id,
                    name=channel.name,
                    success=False,
                    error=f"WXPusher 返回了无法识别的响应格式（HTTP {response.status_code}）",
                )
            raise ValueError("推送平台返回了非对象响应")
        if not _响应成功(channel.provider, payload):
            if channel.provider == "wxpusher":
                code = payload.get("code", "未知")
                message = payload.get("msg") or payload.get("message")
                error = f"WXPusher 返回失败（code={code}）"
                if isinstance(message, str) and message:
                    error += f"：{message[:200]}"
                logger.warning("WXPusher 推送失败 channel_id=%s code=%s", channel.id, code)
                return 推送结果项(channel_id=channel.id, name=channel.name, success=False, error=error)
            raise ValueError("推送平台返回失败状态")
    except httpx.ConnectError as exc:
        logger.warning("推送渠道连接失败 channel_id=%s provider=%s error_type=%s", channel.id, channel.provider, type(exc).__name__)
        return 推送结果项(channel_id=channel.id, name=channel.name, success=False, error="无法连接推送平台，请检查服务器网络或 DNS")
    except httpx.TimeoutException as exc:
        logger.warning("推送渠道请求超时 channel_id=%s provider=%s error_type=%s", channel.id, channel.provider, type(exc).__name__)
        return 推送结果项(channel_id=channel.id, name=channel.name, success=False, error="推送平台响应超时")
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "推送平台返回 HTTP 错误 channel_id=%s provider=%s status_code=%s",
            channel.id,
            channel.provider,
            exc.response.status_code,
        )
        return 推送结果项(
            channel_id=channel.id,
            name=channel.name,
            success=False,
            error=f"推送平台返回 HTTP {exc.response.status_code}",
        )
    except json.JSONDecodeError:
        logger.warning(
            "推送平台返回无效 JSON channel_id=%s provider=%s status_code=%s",
            channel.id,
            channel.provider,
            response.status_code,
        )
        error = (
            f"WXPusher 返回了非 JSON 响应（HTTP {response.status_code}）"
            if channel.provider == "wxpusher"
            else "推送平台请求失败"
        )
        return 推送结果项(channel_id=channel.id, name=channel.name, success=False, error=error)
    except (httpx.HTTPError, ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        logger.warning("推送渠道发送失败 channel_id=%s provider=%s error_type=%s", channel.id, channel.provider, type(exc).__name__)
        return 推送结果项(channel_id=channel.id, name=channel.name, success=False, error="推送平台请求失败")
    logger.info("推送发送成功 channel_id=%s provider=%s", channel.id, channel.provider)
    return 推送结果项(channel_id=channel.id, name=channel.name, success=True)


async def _构建请求(client: httpx.AsyncClient, provider: str, config: dict[str, str], title: str, content: str) -> httpx.Response:
    if provider == "bark":
        base = config.get("server_url", "https://api.day.app").rstrip("/")
        await _校验公开HTTPS地址(base)
        return await client.post(f"{base}/{quote(config['device_key'], safe='')}", json={"title": title, "body": content})
    if provider == "serverchan":
        return await client.post(f"https://sctapi.ftqq.com/{quote(config['send_key'], safe='')}.send", data={"title": title, "desp": content})
    if provider == "pushplus":
        return await client.post("https://www.pushplus.plus/send", json={"token": config["token"], "title": title, "content": content, "template": config.get("template", "markdown")})
    if provider == "wxpusher":
        body: dict[str, object] = {
            "appToken": config["app_token"],
            "content": content,
            "summary": title[:100],
            "contentType": int(config.get("content_type", "1")),
        }
        uids = [item.strip() for item in config.get("uids", "").split(",") if item.strip()]
        topic_ids = [int(item.strip()) for item in config.get("topic_ids", "").split(",") if item.strip()]
        if uids:
            body["uids"] = uids
        if topic_ids:
            body["topicIds"] = topic_ids
        return await client.post("https://wxpusher.zjiecode.com/api/send/message", json=body)
    if provider == "wecom":
        url = f"https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key={quote(config['key'], safe='')}"
        return await client.post(url, json={"msgtype": "text", "text": {"content": f"{title}\n{content}"}})
    if provider == "feishu":
        await _校验公开HTTPS地址(config["webhook_url"])
        return await client.post(config["webhook_url"], json={"msg_type": "text", "content": {"text": f"{title}\n{content}"}})
    if provider == "dingtalk":
        url = config["webhook_url"]
        await _校验公开HTTPS地址(url)
        secret = config.get("secret", "")
        if secret:
            timestamp = str(int(time.time() * 1000))
            sign = base64.b64encode(hmac.new(secret.encode(), f"{timestamp}\n{secret}".encode(), hashlib.sha256).digest()).decode()
            parsed = urlsplit(url)
            query = dict(parse_qsl(parsed.query, keep_blank_values=True))
            query.update({"timestamp": timestamp, "sign": sign})
            url = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment))
        return await client.post(url, json={"msgtype": "text", "text": {"content": f"{title}\n{content}"}})
    if provider == "webhook":
        url = config["url"]
        await _校验公开HTTPS地址(url)
        headers = json.loads(config.get("headers", "{}"))
        template = config.get("body_template", '{"title":"{{title}}","content":"{{content}}"}')
        body = template.replace("{{title}}", json.dumps(title, ensure_ascii=False)[1:-1]).replace("{{content}}", json.dumps(content, ensure_ascii=False)[1:-1])
        return await client.request(config.get("method", "POST").upper(), url, content=body, headers={"Content-Type": "application/json", **headers})
    raise ValueError("未知推送平台")


def _响应成功(provider: str, payload: dict) -> bool:
    if provider == "wxpusher":
        if payload.get("code") != 1000:
            return False
        data = payload.get("data")
        return data is None or (isinstance(data, list) and all(isinstance(item, dict) and item.get("code") == 1000 for item in data))
    if provider in {"serverchan", "pushplus"}:
        return str(payload.get("code")) in {"0", "200"}
    if provider in {"wecom", "dingtalk"}:
        return int(payload.get("errcode", 0)) == 0
    if provider == "feishu":
        return int(payload.get("code", 0)) == 0
    return True
