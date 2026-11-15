"""认证边界的回归测试。"""

import logging
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from limits.storage import MemoryStorage
from limits.strategies import FixedWindowRateLimiter

from app.bootstrap.middleware import 注册中间件
from app.core.config import Settings
from app.modules.auth.api import router
from app.modules.auth.rate_limit import 登录限流器
from app.modules.auth.sessions import 会话数据
from app.modules.auth.device_models import 设备会话范围
from app.shared.auth.device_deps import 从设备令牌可选获取当前用户
from app.shared.db.session import get_db
from starlette.requests import Request


class 认证安全测试(unittest.IsolatedAsyncioTestCase):
    """确认伪造 CSRF、权限提升和暴力登录受到限制。"""

    async def test_MCP只读令牌不能用于管理API(self):
        request = Request({"type": "http", "headers": []})
        session = SimpleNamespace(scope=设备会话范围.mcp_readonly)
        with patch("app.shared.auth.device_deps.解析设备会话可选", AsyncMock(return_value=session)):
            with self.assertRaises(HTTPException) as error:
                await 从设备令牌可选获取当前用户(request, AsyncMock())
        self.assertEqual(error.exception.status_code, 403)

    async def test_修改密码同时撤销网页和设备会话(self):
        from app.modules.users.profile import 修改当前用户密码
        user = SimpleNamespace(id="owner", password_hash="old")
        body = SimpleNamespace(current_password="old-password", new_password="new-password")
        with patch("app.modules.users.profile.验证密码", return_value=True), patch(
            "app.modules.users.profile.哈希密码", return_value="new-hash"
        ), patch("app.modules.users.profile.撤销用户会话", AsyncMock()) as revoke_web, patch(
            "app.modules.users.profile.吊销全部用户设备会话", AsyncMock()
        ) as revoke_devices:
            db = AsyncMock()
            await 修改当前用户密码(db, user, body)
        revoke_web.assert_awaited_once_with("owner")
        revoke_devices.assert_awaited_once_with(db, current_user=user)

    def _构建应用(self):
        app = FastAPI()
        app.include_router(router, prefix="/api/v1")
        app.dependency_overrides[get_db] = lambda: None

        @app.post("/write")
        async def 写操作():
            return {"ok": True}

        注册中间件(app, app_logger=logging.getLogger("认证安全测试"))
        return app

    def test_CSRF必须绑定服务端会话(self):
        app = self._构建应用()
        session = 会话数据("session", "user", "server-token")
        with patch("app.bootstrap.middleware.get_session", AsyncMock(return_value=session)), patch(
            "app.bootstrap.middleware.记录请求事件", AsyncMock()
        ), TestClient(app) as client:
            client.cookies.set("session_id", "session")
            client.cookies.set("csrf_token", "forged")
            response = client.post("/write", headers={"X-CSRF-Token": "forged"})
            self.assertEqual(response.status_code, 403)
            client.cookies.set("csrf_token", "server-token")
            self.assertEqual(client.post("/write", headers={"X-CSRF-Token": "server-token"}).status_code, 200)

    def test_过期会话拒绝写操作(self):
        with patch("app.bootstrap.middleware.get_session", AsyncMock(return_value=None)), patch(
            "app.bootstrap.middleware.记录请求事件", AsyncMock()
        ), TestClient(self._构建应用()) as client:
            client.cookies.set("session_id", "expired")
            self.assertEqual(client.post("/write").status_code, 401)

    def test_无Cookie请求仍能使用设备鉴权(self):
        with patch("app.bootstrap.middleware.记录请求事件", AsyncMock()), TestClient(self._构建应用()) as client:
            self.assertEqual(client.post("/write", headers={"Authorization": "Bearer device"}).status_code, 200)

    def test_登录第六次请求受到限流(self):
        storage = MemoryStorage()
        with patch.object(登录限流器, "_storage", storage), patch.object(
            登录限流器, "_limiter", FixedWindowRateLimiter(storage)
        ), patch("app.modules.auth.api.login_user", AsyncMock(side_effect=HTTPException(401))), patch(
            "app.bootstrap.middleware.记录请求事件", AsyncMock()
        ), TestClient(self._构建应用()) as client:
            codes = [client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrong"}).status_code for _ in range(6)]
        self.assertEqual(codes, [401] * 5 + [429])

    def test_生产配置拒绝默认密钥和调试模式(self):
        settings = Settings(_env_file=None, APP_ENV="production", AUTH_COOKIE_SECURE=True)
        with self.assertRaises(ValueError):
            settings.校验生产安全配置()
        settings.AUTH_SECRET_KEY = "a" * 64
        settings.校验生产安全配置()
        settings.APP_DEBUG = True
        with self.assertRaises(ValueError):
            settings.校验生产安全配置()

    def test_首次生产账号禁止默认密码(self):
        settings = Settings(_env_file=None, APP_ENV="production")
        with self.assertRaises(ValueError):
            settings.校验初始管理员密码()

    def test_开发保留本地来源生产默认移除本地HTTP(self):
        settings = Settings(_env_file=None, CORS_ORIGINS="", APP_ENV="development")
        self.assertIn("http://localhost", settings.cors_origins_list)
        self.assertIn("http://localhost:5173", settings.cors_origins_list)
        settings.APP_ENV = "production"
        self.assertNotIn("http://localhost", settings.cors_origins_list)
