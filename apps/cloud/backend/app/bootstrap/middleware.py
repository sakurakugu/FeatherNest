"""应用中间件与异常处理注册。"""

from __future__ import annotations

import secrets
from datetime import datetime, timezone
from logging import Logger
from time import perf_counter
from typing import Awaitable, Callable, cast

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from starlette.responses import Response

from app.modules.auth.cookies import 从请求获取会话ID
from app.modules.auth.sessions import get_session
from app.modules.auth.rate_limit import 登录限流器 as limiter
from app.modules.system.monitoring import SLOW_REQUEST_THRESHOLD_MS, 记录请求事件
from app.shared.kernel.config import settings
from app.shared.kernel.validation import 请求校验异常处理器

监控排除路径 = frozenset({
    "/api/health",
    "/api/v1/health",
    "/api/v1/system/status",
})


def 注册中间件(app: FastAPI, *, app_logger: Logger) -> None:
    """注册中间件和异常处理器。"""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.limiter = limiter
    rate_limit_handler = cast(
        Callable[[Request, Exception], Response | Awaitable[Response]],
        _rate_limit_exceeded_handler,
    )
    validation_exception_handler = cast(
        Callable[[Request, Exception], Response | Awaitable[Response]],
        请求校验异常处理器,
    )
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    @app.middleware("http")
    async def CSRF保护中间件(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        """对携带登录 Session 的写操作执行 CSRF 校验。"""
        if request.method in {"GET", "HEAD", "OPTIONS", "TRACE"}:
            return await call_next(request)

        session_id = 从请求获取会话ID(request)
        if session_id is None:
            return await call_next(request)

        csrf_cookie = request.cookies.get(settings.AUTH_CSRF_COOKIE_NAME)
        csrf_header = request.headers.get(settings.AUTH_CSRF_HEADER_NAME)
        session = await get_session(session_id)
        if session is None:
            return Response(status_code=401, content='{"detail":"登录已失效"}', media_type="application/json")
        if (
            not csrf_cookie or not csrf_header
            or not secrets.compare_digest(csrf_header.encode(), session.csrf_token.encode())
            or not secrets.compare_digest(csrf_cookie.encode(), session.csrf_token.encode())
        ):
            app_logger.warning("CSRF 校验失败：%s %s", request.method, request.url.path)
            return Response(
                status_code=403,
                content='{"detail":"CSRF 校验失败"}',
                media_type="application/json",
            )

        return await call_next(request)

    @app.middleware("http")
    async def 请求监控中间件(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        """记录最近错误和慢请求摘要。"""
        if request.url.path in 监控排除路径:
            return await call_next(request)

        started_at = perf_counter()
        happened_at = datetime.now(timezone.utc)

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((perf_counter() - started_at) * 1000, 1)
            detail: str | None = type(exc).__name__
            if str(exc):
                detail = f"{detail}: {exc}"
            await 记录请求事件(
                method=request.method,
                path=request.url.path,
                status_code=500,
                duration_ms=duration_ms,
                happened_at=happened_at,
                detail=detail,
            )
            app_logger.exception(
                "接口异常 %s %s，耗时 %.1f ms",
                request.method,
                request.url.path,
                duration_ms,
            )
            raise

        duration_ms = round((perf_counter() - started_at) * 1000, 1)
        detail = "服务器内部错误" if response.status_code >= 500 else None
        await 记录请求事件(
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            happened_at=happened_at,
            detail=detail,
        )

        if response.status_code >= 500:
            app_logger.error(
                "接口返回异常状态 %s %s，状态码 %s，耗时 %.1f ms",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )
        elif duration_ms >= SLOW_REQUEST_THRESHOLD_MS:
            app_logger.warning(
                "慢请求 %s %s，状态码 %s，耗时 %.1f ms",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )

        return response
