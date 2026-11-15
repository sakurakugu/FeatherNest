"""友链申请安全测试。"""
import unittest
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.main import app
from app.modules.friend_links.schemas import 友链交换请求
from app.modules.friend_links.service import 交换友链
from app.modules.friend_links.models import 友链状态
from app.shared.db.session import get_db

class 友链申请测试(unittest.IsolatedAsyncioTestCase):
    def test_拒绝非法输入(self):
        for url in ("javascript:alert(1)", "http://127.0.0.1/", "http://[::1]/", "http://localhost/", "https://example.com\\@evil.com"):
            with self.subTest(url=url), self.assertRaises(ValidationError):
                友链交换请求(name="网站", url=url, backlink_url="https://example.com/friends")
        with self.assertRaises(ValidationError):
            友链交换请求(name="  ", url="https://example.com", backlink_url="https://example.com/friends")
        with self.assertRaises(ValidationError):
            友链交换请求(name="网站", url="https://example.com", backlink_url="https://example.com/friends", contact_email="错误邮箱")

    async def test_申请始终待审核(self):
        db = Mock()
        db.execute = AsyncMock(return_value=Mock(scalar_one_or_none=Mock(return_value=None)))
        db.flush = AsyncMock()
        body = 友链交换请求(name="网站", url="https://example.com", backlink_url="https://example.com/friends")
        with patch("app.modules.friend_links.service.友链信息.model_validate", return_value={}):
            result = await 交换友链(db, body)
        self.assertFalse(result["auto_approved"])
        self.assertEqual(db.add.call_args.args[0].status, 友链状态.pending)

    def test_申请接口限流(self):
        async def 模拟数据库():
            yield None
        app.dependency_overrides[get_db] = 模拟数据库
        try:
            with patch("app.modules.friend_links.api.交换友链_service", new=AsyncMock(return_value={"message": "等待审核"})):
                client = TestClient(app, client=(str(uuid4()), 1234))
                responses = [client.post("/api/v1/friend-links/exchange", json={"name": "网站", "url": "https://example.com", "backlink_url": "https://example.com/friends"}) for _ in range(3)]
            self.assertEqual([r.status_code for r in responses], [200, 200, 429])
        finally:
            app.dependency_overrides.pop(get_db, None)
