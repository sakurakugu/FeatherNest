"""在匿名浏览器中生成博客静态页面，保留现有客户端交互。"""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
import re
from html import unescape
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qsl, quote, unquote, urlencode, urlsplit, urlunsplit
from xml.sax.saxutils import escape

from playwright.async_api import async_playwright

博客目录 = Path(__file__).resolve().parents[1]
产物目录 = 博客目录 / "dist"
静态栏目 = ["/", "/blog", "/archive", "/announcements", "/friends", "/about", "/guestbook", "/sponsor", "/media", "/gallery", "/rss"]


class 构建服务器(SimpleHTTPRequestHandler):
    模板: bytes

    def do_GET(self):
        # 始终从原始 SPA 模板渲染，避免后续页面读取已经生成的首页。
        if urlsplit(self.path).path == "/" or urlsplit(self.path).path.startswith(("/blog", "/moments")) or not Path(urlsplit(self.path).path).suffix:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(self.模板)
        else:
            super().do_GET()

    def log_message(self, *_args):
        pass


def 页面输出路径(路由: str) -> Path:
    目标 = (产物目录 / unquote(路由).lstrip("/") / "index.html").resolve()
    目标.relative_to(产物目录.resolve())
    return 目标


async def 生成():
    接口基址 = os.environ.get("SSG_API_BASE_URL", "http://localhost:8000/api/v1").rstrip("/")
    站点地址 = os.environ.get("SITE_URL", "https://www.sakurakugu.com").rstrip("/")
    for 名称, 地址 in [("SSG_API_BASE_URL", 接口基址), ("SITE_URL", 站点地址)]:
        if urlsplit(地址).scheme not in ("http", "https") or not urlsplit(地址).netloc:
            raise ValueError(f"{名称} 必须为完整的 HTTP 地址")
    构建服务器.模板 = (产物目录 / "index.html").read_bytes()
    服务器 = ThreadingHTTPServer(("127.0.0.1", 0), partial(构建服务器, directory=str(产物目录)))
    threading.Thread(target=服务器.serve_forever, daemon=True).start()
    本地地址 = f"http://127.0.0.1:{服务器.server_port}"
    路由清单 = {路由: None for 路由 in 静态栏目}
    try:
        async with async_playwright() as p:
            浏览器 = await p.chromium.launch(headless=True)
            上下文 = await 浏览器.new_context(viewport={"width": 1440, "height": 1000}, service_workers="block")

            async def 读取接口(路径):
                响应 = await 上下文.request.get(接口基址 + 路径, timeout=30000)
                if not 响应.ok:
                    raise RuntimeError(f"SSG 接口失败：{路径}，HTTP {响应.status}")
                return await 响应.json()

            页码 = 1
            while True:
                文章分页 = await 读取接口(f"/articles?page={页码}&page_size=50")
                for 文章 in 文章分页["items"]:
                    if 文章["status"] == "public":
                        路由清单[f'/blog/{quote(文章["slug"], safe="")}'] = 文章
                if 页码 >= 文章分页["pages"]:
                    break
                页码 += 1

            页码 = 1
            while True:
                动态分页 = await 读取接口(f"/feed?page={页码}&page_size=50")
                for 条目 in 动态分页["items"]:
                    if 条目["type"] == "moment":
                        路由清单[f'/moments/{条目["source_id"]}'] = None
                if 页码 >= 动态分页["pages"]:
                    break
                页码 += 1

            文件映射 = {}
            失败请求 = []
            页面错误 = []

            async def 代理请求(route):
                请求 = route.request
                地址 = urlsplit(请求.url)
                if 地址.path == "/api/v1/stats/pageview":
                    await route.fulfill(status=204)
                elif 地址.path.startswith("/api/v1/"):
                    if 请求.method != "GET":
                        失败请求.append(f"静态生成期间出现写请求：{请求.method} {地址.path}")
                        await route.abort()
                        return
                    响应 = await 上下文.request.get(接口基址 + 地址.path.removeprefix("/api/v1") + (f"?{地址.query}" if 地址.query else ""), timeout=30000)
                    if not 响应.ok and not (地址.path == "/api/v1/users/me" and 响应.status == 401):
                        失败请求.append(f"{地址.path}：HTTP {响应.status}")
                    await route.fulfill(response=响应)
                elif 请求.resource_type in ("image", "media", "font") or 地址.netloc != urlsplit(本地地址).netloc:
                    # HTML 保留资源 URL；构建无需下载图片、评论脚本和第三方数据。
                    await route.abort()
                else:
                    await route.continue_()

            await 上下文.route("**/*", 代理请求)
            页面 = await 上下文.new_page()
            页面.on("pageerror", lambda 错误: 页面错误.append(str(错误)))
            for 路由, 文章 in 路由清单.items():
                失败请求.clear()
                页面错误.clear()
                await 页面.goto(本地地址 + 路由, wait_until="networkidle", timeout=60000)
                await 页面.locator(".blog-home").wait_for()
                if 文章:
                    await 页面.locator(".article-markdown-preview").wait_for()
                    await 页面.locator(".post-container").wait_for()
                await 页面.evaluate("() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))")
                if 失败请求 or 页面错误:
                    raise RuntimeError(f"SSG 页面失败：{路由}\n" + "\n".join(失败请求 + 页面错误))
                标题 = f'{文章["title"]} · Sakurakuguの小窝' if 文章 else "Sakurakuguの小窝"
                描述 = (文章.get("excerpt") or 文章["title"]) if 文章 else "Sakurakugu 的文章、生活记录与作品分享"
                await 页面.evaluate("""({ title, description, canonical }) => {
                    document.title = title
                    for (const [tag, attribute, key, content] of [
                        ['meta', 'name', 'description', description],
                        ['meta', 'property', 'og:title', title],
                        ['meta', 'property', 'og:description', description],
                        ['meta', 'property', 'og:url', canonical],
                        ['link', 'rel', 'canonical', canonical],
                    ]) {
                        let node = document.head.querySelector(`${tag}[${attribute}="${key}"]`)
                        if (!node) { node = document.createElement(tag); document.head.append(node) }
                        node.setAttribute(attribute, key)
                        node.setAttribute(tag === 'link' ? 'href' : 'content', content)
                    }
                }""", {"title": 标题, "description": 描述, "canonical": 站点地址 + ("/blog" if 路由 == "/" else 路由)})
                目标 = 页面输出路径(路由)
                目标.parent.mkdir(parents=True, exist_ok=True)
                内容 = (await 页面.content()).replace(本地地址, 站点地址)
                # 公开文件继续由后端检查可见性，静态 HTML 不保留会过期的签名。
                for 匹配 in set(re.findall(r'(?:https?://[^\s"<>]+)?/files/[^\s"<>]+', 内容)):
                    地址 = urlsplit(unescape(匹配))
                    参数 = parse_qsl(地址.query)
                    if not any(键 == "signature" for 键, _ in 参数):
                        continue
                    查询 = urlencode([(键, 值) for 键, 值 in 参数 if 键 not in ("signature", "expires")])
                    稳定地址 = urlunsplit((地址.scheme, 地址.netloc, 地址.path, 查询, 地址.fragment))
                    if 稳定地址 not in 文件映射:
                        源地址 = urlunsplit((urlsplit(接口基址).scheme, urlsplit(接口基址).netloc, 地址.path, 地址.query, ""))
                        验证地址 = urlunsplit((urlsplit(接口基址).scheme, urlsplit(接口基址).netloc, 地址.path, 查询, ""))
                        响应 = await 上下文.request.get(验证地址, timeout=30000)
                        文件映射[稳定地址] = 稳定地址
                        if not 响应.ok:
                            # 老数据可能只支持签名访问；把已在公开页面展示的资源一并静态化。
                            源响应 = await 上下文.request.get(源地址, timeout=30000)
                            if 源响应.ok:
                                文件名 = hashlib.sha256((地址.path + "?" + 查询).encode()).hexdigest() + Path(地址.path).suffix
                                文件路径 = 产物目录 / "ssg-assets" / 文件名
                                文件路径.parent.mkdir(exist_ok=True)
                                文件路径.write_bytes(await 源响应.body())
                                文件映射[稳定地址] = "/ssg-assets/" + 文件名
                            elif 源响应.status == 404:
                                print(f"[SSG] 源站文件已不存在：{地址.path}", flush=True)
                            else:
                                raise RuntimeError(f"SSG 公开资源读取失败：{地址.path}，HTTP {源响应.status}")
                    内容 = 内容.replace(匹配, escape(文件映射[稳定地址], {'"': '&quot;'}))
                目标.write_text(内容, encoding="utf-8")
                print(f"[SSG] 已生成 {路由}", flush=True)
            await 浏览器.close()
        地图条目 = [f"  <url><loc>{escape(站点地址 + 路由)}</loc></url>" for 路由 in 路由清单 if 路由 != "/"]
        (产物目录 / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(地图条目) + "\n</urlset>\n", encoding="utf-8")
        (产物目录 / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: {站点地址}/sitemap.xml\n", encoding="utf-8")
        (产物目录 / "ssg-manifest.json").write_text(json.dumps({"routes": list(路由清单), "articles": sum(文章 is not None for 文章 in 路由清单.values())}, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[SSG] 完成：{len(路由清单)} 个页面，接口：{接口基址}", flush=True)
    finally:
        服务器.shutdown()
        服务器.server_close()


if __name__ == "__main__":
    asyncio.run(生成())
