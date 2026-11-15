"""验证静态生成遇到暂时断连时恢复，并保留永久失败信息。"""

import importlib.util
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import AsyncMock, patch

from playwright.async_api import Error, TimeoutError, async_playwright

模块规格 = importlib.util.spec_from_file_location("静态生成", Path(__file__).resolve().parents[1] / "generate-static.py")
静态生成 = importlib.util.module_from_spec(模块规格)
模块规格.loader.exec_module(静态生成)


class 静态请求测试(unittest.IsolatedAsyncioTestCase):
    async def test_真实接口首次断开连接后恢复(self):
        class 测试接口(BaseHTTPRequestHandler):
            请求次数 = 0

            def do_GET(self):
                type(self).请求次数 += 1
                if self.请求次数 == 1:
                    self.close_connection = True
                    return
                内容 = b'{"ok":true}'
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(内容)))
                self.end_headers()
                self.wfile.write(内容)

            def log_message(self, *_args):
                pass

        服务器 = ThreadingHTTPServer(("127.0.0.1", 0), 测试接口)
        threading.Thread(target=服务器.serve_forever, daemon=True).start()
        try:
            async with async_playwright() as 引擎:
                客户端 = await 引擎.request.new_context()
                try:
                    响应 = await 静态生成.请求公开资源(客户端, f"http://127.0.0.1:{服务器.server_port}/articles/1")
                    self.assertEqual(await 响应.json(), {"ok": True})
                    self.assertEqual(测试接口.请求次数, 2)
                finally:
                    await 客户端.dispose()
        finally:
            await 静态生成.asyncio.to_thread(服务器.shutdown)
            服务器.server_close()

    async def test_断连后恢复(self):
        响应 = AsyncMock(status=200, ok=True)
        客户端 = AsyncMock()
        客户端.get.side_effect = [Error("socket hang up"), 响应]
        with patch.object(静态生成.asyncio, "sleep", new_callable=AsyncMock):
            self.assertIs(await 静态生成.请求公开资源(客户端, "https://example.test/articles/1"), 响应)
        self.assertEqual(客户端.get.await_count, 2)

    async def test_连续超时有限退出且隐藏签名(self):
        客户端 = AsyncMock()
        客户端.get.side_effect = TimeoutError("超时 https://example.test/files/1?signature=私密签名")
        with patch.object(静态生成.asyncio, "sleep", new_callable=AsyncMock):
            with self.assertRaisesRegex(RuntimeError, "尝试 3 次") as 捕获:
                await 静态生成.请求公开资源(客户端, "https://example.test/files/1?signature=私密签名")
        self.assertEqual(客户端.get.await_count, 3)
        self.assertNotIn("私密签名", str(捕获.exception))

    async def test_业务错误不重试(self):
        for 状态 in (401, 403, 404, 500):
            with self.subTest(状态=状态):
                客户端 = AsyncMock()
                客户端.get.return_value = AsyncMock(status=状态, ok=False)
                响应 = await 静态生成.请求公开资源(客户端, "https://example.test/articles/1")
                self.assertEqual(响应.status, 状态)
                客户端.get.assert_awaited_once()

    async def test_网关错误可恢复(self):
        客户端 = AsyncMock()
        临时响应 = AsyncMock(status=502, ok=False)
        正常响应 = AsyncMock(status=200, ok=True)
        客户端.get.side_effect = [临时响应, 正常响应]
        with patch.object(静态生成.asyncio, "sleep", new_callable=AsyncMock):
            self.assertIs(await 静态生成.请求公开资源(客户端, "https://example.test/feed"), 正常响应)
        临时响应.dispose.assert_awaited_once()

    async def test_非暂时异常立即失败(self):
        客户端 = AsyncMock()
        客户端.get.side_effect = Error("证书错误")
        with self.assertRaisesRegex(RuntimeError, "尝试 1 次"):
            await 静态生成.请求公开资源(客户端, "https://example.test/feed")
        客户端.get.assert_awaited_once()

    async def test_代理失败记录接口并中断请求(self):
        路由 = AsyncMock()
        失败请求 = []
        with patch.object(静态生成, "请求公开资源", side_effect=RuntimeError("SSG 请求失败：/articles/1")):
            await 静态生成.转发接口(路由, AsyncMock(), "https://example.test/articles/1", 失败请求)
        self.assertEqual(失败请求, ["SSG 请求失败：/articles/1"])
        路由.abort.assert_awaited_once()
        路由.fulfill.assert_not_awaited()

    async def test_匿名会话401允许通过(self):
        路由 = AsyncMock()
        失败请求 = []
        with patch.object(静态生成, "请求公开资源", return_value=AsyncMock(status=401, ok=False)):
            await 静态生成.转发接口(路由, AsyncMock(), "https://example.test/api/v1/users/me", 失败请求)
        self.assertEqual(失败请求, [])
        路由.fulfill.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
