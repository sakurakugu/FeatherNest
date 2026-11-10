"""通知推送网关服务测试。"""

from __future__ import annotations

import json
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs

import httpx
from fastapi import HTTPException

from app.modules.notifications.models import 推送渠道
from app.modules.notifications.service import _加密配置, _校验公开HTTPS地址, _响应成功, _构建请求, _发送单渠道, _解密配置


class 推送服务测试(unittest.IsolatedAsyncioTestCase):
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
