"""通知推送网关服务测试。"""

from __future__ import annotations

import hashlib
import json
import unittest
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch
from urllib.parse import parse_qs
from uuid import UUID

import httpx
from fastapi import HTTPException

from app.modules.notifications.models import 推送渠道, 推送令牌
from app.modules.notifications.schemas import 推送令牌更新, 推送消息, 推送结果项
from app.modules.notifications.service import 创建令牌, 删除渠道, 发送消息, 更新令牌, _加密配置, _校验公开HTTPS地址, _响应成功, _构建请求, _发送单渠道, _解密配置, 重置令牌


class 推送服务测试(unittest.IsolatedAsyncioTestCase):
    async def test_重置令牌会替换密钥并保留权限状态(self) -> None:
        token_id = UUID("018f0000-0000-7000-8000-000000000004")
        channel_id = UUID("018f0000-0000-7000-8000-000000000005")
        created_at = datetime.now(UTC)
        token = 推送令牌(
            id=token_id,
            name="备份脚本",
            token_hash="a" * 64,
            default_content_type="html",
            channel_ids=[str(channel_id)],
            default_channel_ids=[str(channel_id)],
            enabled=False,
            last_used_at=created_at,
            created_at=created_at,
        )

        class FakeSession:
            async def get(self, model, item_id):
                return token

        with patch("app.modules.notifications.service.secrets.token_urlsafe", return_value="new-secret"):
            result = await 重置令牌(FakeSession(), token_id)

        self.assertEqual(token.token_hash, hashlib.sha256(b"fn_push_new-secret").hexdigest())
        self.assertNotEqual(token.token_hash, "a" * 64)
        self.assertFalse(token.enabled)
        self.assertEqual(token.channel_ids, [str(channel_id)])
        self.assertIsNone(token.last_used_at)
        self.assertEqual(result["token"], "fn_push_new-secret")
        self.assertEqual(result["channel_ids"], [channel_id])
        self.assertEqual(result["default_content_type"], "html")

    def test_渠道密钥配置加密后可还原(self) -> None:
        config = {"token": "secret-value", "template": "markdown"}

        ciphertext = _加密配置(config)

        self.assertNotIn("secret-value", ciphertext)
        self.assertEqual(_解密配置(ciphertext), config)

    def test_平台请求校验结果码(self) -> None:
        self.assertTrue(_响应成功("pushplus", {"code": 200}))
        self.assertFalse(_响应成功("pushplus", {"code": 500}))
        self.assertTrue(_响应成功("wecom", {"errcode": 0}))
        self.assertFalse(_响应成功("feishu", {"code": 999}))
        self.assertTrue(_响应成功("wxpusher", {"success": True, "code": 1000, "data": [{"code": 1000}]}))
        self.assertTrue(_响应成功("wxpusher", {"code": 1000, "msg": "处理成功", "data": []}))
        self.assertTrue(_响应成功("wxpusher", {"code": 1000, "msg": "处理成功"}))
        self.assertFalse(_响应成功("wxpusher", {"code": 1000, "data": [{"code": 1001}]}))
        self.assertFalse(_响应成功("wxpusher", {"success": False, "code": 1001, "data": []}))

    async def test_Webhook拒绝内网地址(self) -> None:
        with patch("app.modules.notifications.service.socket.getaddrinfo", return_value=[(None, None, None, None, ("127.0.0.1", 443))]):
            with self.assertRaises(HTTPException):
                await _校验公开HTTPS地址("https://example.test/hook")

    async def test_Server酱使用标题和正文表单字段(self) -> None:
        async def handle(request: httpx.Request) -> httpx.Response:
            self.assertEqual(request.url.host, "sctapi.ftqq.com")
            self.assertEqual(parse_qs((await request.aread()).decode()), {"title": ["标题"], "desp": ["正文"]})
            return httpx.Response(200, json={"code": 0})

        async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as client:
            response = await _构建请求(client, "serverchan", {"send_key": "sendkey"}, "标题", "正文")

        self.assertEqual(response.status_code, 200)

    async def test_WXPusher使用UID和Topic列表创建推送任务(self) -> None:
        async def handle(request: httpx.Request) -> httpx.Response:
            self.assertEqual(str(request.url), "https://wxpusher.zjiecode.com/api/send/message")
            self.assertEqual(
                json.loads(await request.aread()),
                {
                    "appToken": "AT_secret",
                    "content": "正文",
                    "summary": "标题",
                    "contentType": 3,
                    "uids": ["UID_one", "UID_two"],
                    "topicIds": [123, 456],
                },
            )
            return httpx.Response(200, json={"success": True, "code": 1000, "data": [{"code": 1000}]})

        async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as client:
            response = await _构建请求(
                client,
                "wxpusher",
                {"app_token": "AT_secret", "uids": "UID_one, UID_two", "topic_ids": "123, 456", "content_type": "3"},
                "标题",
                "正文",
                "markdown",
            )

        self.assertTrue(_响应成功("wxpusher", response.json()))

    async def test_Webhook接受成功状态下的纯文本响应(self) -> None:
        channel = 推送渠道(
            id="018f0000-0000-7000-8000-000000000001",
            name="自定义推送",
            provider="webhook",
            config_ciphertext=_加密配置({"url": "https://example.test/hook"}),
            enabled=True,
        )

        async def handle(_: httpx.Request) -> httpx.Response:
            return httpx.Response(200, text="ok")

        client = httpx.AsyncClient(transport=httpx.MockTransport(handle))
        with patch("app.modules.notifications.service._校验公开HTTPS地址", return_value=None), patch(
            "app.modules.notifications.service.httpx.AsyncClient", return_value=client
        ):
            result = await _发送单渠道(channel, "标题", "内容")

        self.assertTrue(result.success)

    async def test_推送平台连接失败时返回网络诊断(self) -> None:
        channel = 推送渠道(
            id="018f0000-0000-7000-8000-000000000002",
            name="微信推送",
            provider="wxpusher",
            config_ciphertext=_加密配置({"app_token": "AT_secret", "uids": "UID_test"}),
            enabled=True,
        )

        async def handle(_: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("connection failed")

        client = httpx.AsyncClient(transport=httpx.MockTransport(handle))
        with patch("app.modules.notifications.service.httpx.AsyncClient", return_value=client):
            result = await _发送单渠道(channel, "标题", "内容")

        self.assertFalse(result.success)
        self.assertEqual(result.error, "无法连接推送平台，请检查服务器网络或 DNS")

    async def test_WXPusher业务失败时返回平台错误码和说明(self) -> None:
        channel = 推送渠道(
            id="018f0000-0000-7000-8000-000000000003",
            name="微信推送",
            provider="wxpusher",
            config_ciphertext=_加密配置({"app_token": "AT_secret", "uids": "UID_test"}),
            enabled=True,
        )

        async def handle(_: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"success": False, "code": 1001, "msg": "appToken无效"})

        client = httpx.AsyncClient(transport=httpx.MockTransport(handle))
        with patch("app.modules.notifications.service.httpx.AsyncClient", return_value=client):
            result = await _发送单渠道(channel, "标题", "内容")

        self.assertFalse(result.success)
        self.assertEqual(result.error, "WXPusher 返回失败（code=1001）：appToken无效")

    async def test_令牌编辑保留密钥并保存默认配置(self) -> None:
        channel_id = UUID("018f0000-0000-7000-8000-000000000005")
        token = 推送令牌(name="旧名称", token_hash="密钥哈希", channel_ids=[], default_channel_ids=[], default_content_type="text", enabled=True)
        db = AsyncMock()
        db.get.return_value = token
        result = MagicMock()
        result.scalars.return_value.all.return_value = [推送渠道(id=channel_id, enabled=True)]
        db.execute.return_value = result
        await 更新令牌(db, token.id, 推送令牌更新(name=" 新名称 ", channel_ids=[channel_id], default_channel_ids=[channel_id], default_content_type="html"))
        self.assertEqual(token.name, "新名称")
        self.assertEqual(token.channel_ids, [str(channel_id)])
        self.assertEqual(token.default_content_type, "html")
        self.assertEqual(token.token_hash, "密钥哈希")
        db.execute.reset_mock()
        await 更新令牌(db, token.id, 推送令牌更新(name="再次改名", channel_ids=[channel_id], default_content_type="text"))
        db.execute.assert_not_awaited()
        self.assertEqual(token.name, "再次改名")

    async def test_默认渠道和类型以及调用方覆盖(self) -> None:
        ids = [UUID("018f0000-0000-7000-8000-000000000005"), UUID("018f0000-0000-7000-8000-000000000006")]
        channels = [推送渠道(id=value, name=f"渠道{index}", enabled=True) for index, value in enumerate(ids)]
        token = 推送令牌(channel_ids=[str(value) for value in ids], default_channel_ids=[str(ids[0])], default_content_type="html")
        db = AsyncMock()
        result = MagicMock()
        result.scalars.return_value.all.return_value = channels[:1]
        db.execute.return_value = result

        async def send(channel, title, content, content_type):
            return 推送结果项(channel_id=channel.id, name=channel.name, success=True)

        with patch("app.modules.notifications.service._发送单渠道", side_effect=send) as mocked:
            results = await 发送消息(db, token, 推送消息(title="标题", content="正文"))
            self.assertEqual([item.channel_id for item in results], ids[:1])
            mocked.assert_awaited_once_with(channels[0], "标题", "正文", "html")
            self.assertTrue(all(call.args[3] == "html" for call in mocked.call_args_list))
            mocked.reset_mock()
            result.scalars.return_value.all.return_value = channels[1:]
            results = await 发送消息(db, token, 推送消息(title="标题", content="正文", channel_ids=ids[1:], content_type="markdown"))
            self.assertEqual(len(results), 1)
            mocked.assert_awaited_once_with(channels[1], "标题", "正文", "markdown")

        with self.assertRaises(HTTPException) as error:
            await 发送消息(db, token, 推送消息(title="标题", content="正文", channel_ids=[UUID("018f0000-0000-7000-8000-000000000007")]))
        self.assertEqual(error.exception.status_code, 403)

    async def test_平台收到明确的文本类型(self) -> None:
        for content_type, number, template in [("text", 1, "txt"), ("html", 2, "html"), ("markdown", 3, "markdown")]:
            for provider, config in [("wxpusher", {"app_token": "secret", "uids": "UID_test", "content_type": "3"}), ("pushplus", {"token": "secret", "template": "markdown"})]:
                with self.subTest(provider=provider, content_type=content_type):
                    client = AsyncMock()
                    await _构建请求(client, provider, config, "标题", "正文", content_type)
                    payload = client.post.call_args.kwargs["json"]
                    self.assertEqual(payload["contentType" if provider == "wxpusher" else "template"], number if provider == "wxpusher" else template)

    async def test_纯文本渠道转换富文本内容(self) -> None:
        client = AsyncMock()
        with patch("app.modules.notifications.service._校验公开HTTPS地址"):
            await _构建请求(client, "bark", {"device_key": "secret"}, "标题", "<p>正文</p>", "html")
        self.assertEqual(client.post.call_args.kwargs["json"]["body"], "正文")

    def test_消息参数校验(self) -> None:
        from pydantic import ValidationError

        for payload in [{"channel_ids": []}, {"content_type": "invalid"}]:
            with self.subTest(payload=payload), self.assertRaises(ValidationError):
                推送消息(title="标题", content="正文", **payload)
        for payload in [{"name": " "}, {"channel_ids": []}, {"default_channel_ids": []}, {"default_channel_ids": None}, {"enabled": None}]:
            with self.subTest(payload=payload), self.assertRaises(ValidationError):
                推送令牌更新(**payload)

    async def test_默认渠道必须在允许范围内(self) -> None:
        a = UUID("018f0000-0000-7000-8000-000000000005")
        b = UUID("018f0000-0000-7000-8000-000000000006")
        from app.modules.notifications.schemas import 推送令牌创建

        db = AsyncMock()
        with self.assertRaises(HTTPException) as error:
            await 创建令牌(db, 推送令牌创建(name="测试", channel_ids=[a], default_channel_ids=[b]))
        self.assertEqual(error.exception.status_code, 400)
        token = 推送令牌(channel_ids=[str(a), str(b)], default_channel_ids=[str(a)])
        db.get.return_value = token
        with self.assertRaises(HTTPException) as error:
            await 更新令牌(db, token.id, 推送令牌更新(channel_ids=[b]))
        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(token.channel_ids, [str(a), str(b)])
        with self.assertRaises(HTTPException):
            await 更新令牌(db, token.id, 推送令牌更新(default_channel_ids=[UUID("018f0000-0000-7000-8000-000000000007")]))
        result = MagicMock()
        result.scalars.return_value.all.return_value = [推送渠道(id=b, enabled=True)]
        db.execute.return_value = result
        await 更新令牌(db, token.id, 推送令牌更新(channel_ids=[b], default_channel_ids=[b]))
        self.assertEqual(token.channel_ids, [str(b)])
        self.assertEqual(token.default_channel_ids, [str(b)])

    async def test_删除渠道同步移除默认与允许配置(self) -> None:
        channel_id = UUID("018f0000-0000-7000-8000-000000000005")
        token = 推送令牌(channel_ids=[str(channel_id)], default_channel_ids=[str(channel_id)], enabled=True)
        db = AsyncMock()
        db.get.return_value = 推送渠道(id=channel_id)
        result = MagicMock()
        result.scalars.return_value.all.return_value = [token]
        db.execute.return_value = result
        await 删除渠道(db, channel_id)
        self.assertEqual(token.channel_ids, [])
        self.assertEqual(token.default_channel_ids, [])
        self.assertFalse(token.enabled)
        with self.assertRaises(HTTPException) as error:
            await 发送消息(db, token, 推送消息(title="标题", content="正文"))
        self.assertEqual(error.exception.status_code, 400)
