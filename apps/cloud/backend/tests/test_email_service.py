"""邮件发送服务与接口边界测试，所有外部请求均使用模拟传输。"""

import unittest
from unittest.mock import patch

import httpx
from pydantic import ValidationError

from app.integrations.email import service
from app.integrations.email.schemas import 邮件发送请求, 邮件渠道配置


class 邮件服务测试(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.config = 邮件渠道配置.从渠道配置({
            "api_key": "re_test_secret",
            "from_address": "FeatherNest <noreply@sakurakugu.com>",
            "to": "receiver@example.com",
            "reply_to": "reply@sakurakugu.com",
        })
        self.body = 邮件发送请求(to=["receiver@example.com"], subject="测试", text="正文")

    async def _发送(self, handler):
        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        with patch.object(service.httpx, "AsyncClient", return_value=client):
            return await service.发送邮件(self.body, config=self.config, idempotency_key="test-email-1")

    async def test_发送参数与幂等键(self):
        import json

        def handler(request):
            self.assertEqual(str(request.url), "https://api.resend.com/emails")
            self.assertEqual(request.headers["Idempotency-Key"], "test-email-1")
            payload = json.loads(request.content)
            self.assertEqual(payload["from"], "FeatherNest <noreply@sakurakugu.com>")
            self.assertEqual(payload["reply_to"], "reply@sakurakugu.com")
            self.assertEqual(payload["to"], ["receiver@example.com"])
            self.assertEqual(payload["text"], "正文")
            self.assertNotIn("html", payload)
            return httpx.Response(200, json={"id": "email-123"})

        result = await self._发送(handler)
        self.assertEqual(result.id, "email-123")

    def test_配置校验与密钥脱敏(self):
        self.assertNotIn("re_test_secret", repr(self.config))
        for changes in [{"api_key": ""}, {"api_key": "错误密钥"}, {"from_address": "错误地址"}, {"to": "错误地址"}, {"reply_to": "错误地址"}]:
            with self.subTest(changes=changes):
                with self.assertRaises(ValidationError):
                    邮件渠道配置.从渠道配置({
                        "api_key": "re_test_secret", "from_address": "noreply@sakurakugu.com", "to": "receiver@example.com",
                    } | changes)

    async def test_限流与上游错误不泄露响应(self):
        for upstream, expected in [(429, 429), (401, 502), (422, 502), (500, 502)]:
            with self.subTest(upstream=upstream):
                with self.assertRaises(service.邮件发送错误) as error:
                    await self._发送(lambda request: httpx.Response(upstream, text="敏感响应内容"))
                self.assertEqual(error.exception.status_code, expected)
                self.assertNotIn("敏感响应内容", str(error.exception))

    async def test_超时不会自动重试(self):
        requests = []

        def handler(request):
            requests.append(request)
            raise httpx.ReadTimeout("测试超时", request=request)

        with self.assertRaises(service.邮件发送错误) as error:
            await self._发送(handler)
        self.assertEqual(error.exception.status_code, 504)
        self.assertEqual(len(requests), 1)

    async def test_异常成功响应应报错(self):
        for payload in [{}, {"id": None}, {"id": 123}]:
            with self.subTest(payload=payload):
                with self.assertRaises(service.邮件发送错误):
                    await self._发送(lambda request: httpx.Response(200, json=payload))

    def test_拒绝非法邮箱空正文与主题换行(self):
        for change in [{"to": ["错误邮箱"]}, {"text": " "}, {"subject": "标题\r\n伪造头"}]:
            with self.subTest(change=change):
                with self.assertRaises(ValidationError):
                    邮件发送请求.model_validate(self.body.model_dump() | change)



if __name__ == "__main__":
    unittest.main()
