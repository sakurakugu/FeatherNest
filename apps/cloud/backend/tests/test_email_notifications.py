"""邮件推送渠道的配置、更新和内容转换测试。"""

import unittest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi import HTTPException

from app.integrations.email.schemas import 邮件发送结果
from app.integrations.email.service import 邮件发送错误
from app.modules.notifications import service
from app.modules.notifications.models import 推送渠道
from app.modules.notifications.schemas import 推送渠道更新


class 邮件推送测试(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.config = {
            "api_key": "re_test_secret",
            "from_address": "FeatherNest <noreply@sakurakugu.com>",
            "to": "owner@example.com,second@example.com",
        }
        self.channel = 推送渠道(
            id=uuid4(), name="邮件通知", provider="resend", enabled=True,
            config_ciphertext=service._加密配置(self.config),
        )

    async def test_渠道配置校验(self):
        await service._校验渠道配置("resend", self.config)
        for changes in [{"to": "错误邮箱"}, {"api_key": ""}, {"reply_to": "错误邮箱"}]:
            with self.subTest(changes=changes):
                with self.assertRaises(HTTPException) as error:
                    await service._校验渠道配置("resend", self.config | changes)
                self.assertEqual(error.exception.status_code, 400)
                self.assertNotIn("re_test_secret", str(error.exception.detail))

    async def test_三种内容均通过邮件服务发送(self):
        for content_type, content, expected_html in [
            ("text", "纯文本正文", None),
            ("markdown", "**通知正文**", "<p><strong>通知正文</strong></p>"),
            ("html", "<p>通知正文</p>", "<p>通知正文</p>"),
        ]:
            with self.subTest(content_type=content_type):
                with patch.object(service, "发送邮件", new_callable=AsyncMock, return_value=邮件发送结果(id="email-1")) as send:
                    result = await service._发送单渠道(self.channel, "通知主题", content, content_type)
                    self.assertTrue(result.success)
                    body = send.call_args.args[0]
                    self.assertEqual(body.subject, "通知主题")
                    self.assertEqual(body.to, ["owner@example.com", "second@example.com"])
                    self.assertEqual(body.html, expected_html)
                    if content_type != "text":
                        self.assertEqual(body.text, "通知正文")
                    self.assertTrue(send.call_args.kwargs["idempotency_key"].startswith(f"push/{self.channel.id}/"))

    async def test_上游失败返回渠道失败(self):
        with patch.object(service, "发送邮件", side_effect=邮件发送错误("邮件额度受限", 429)):
            result = await service._发送单渠道(self.channel, "测试", "正文")
        self.assertFalse(result.success)
        self.assertEqual(result.error, "邮件额度受限")

    async def test_部分更新保留原密钥(self):
        db = AsyncMock()
        db.get.return_value = self.channel
        await service.更新渠道(db, self.channel.id, 推送渠道更新(config={"to": "new@example.com"}))
        updated = service._解密配置(self.channel.config_ciphertext)
        self.assertEqual(updated["api_key"], self.config["api_key"])
        self.assertEqual(updated["from_address"], self.config["from_address"])
        self.assertEqual(updated["to"], "new@example.com")
        self.assertNotIn("re_test_secret", self.channel.config_ciphertext)


if __name__ == "__main__":
    unittest.main()
