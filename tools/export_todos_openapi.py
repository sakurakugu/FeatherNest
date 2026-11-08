"""从真实路由导出待办接口契约，无需启动服务或连接数据库。"""

from __future__ import annotations

import json
import sys
from pathlib import Path


def 导出待办接口契约() -> dict:
    """仅导出待办和完成历史接口，路径相对于客户端的 API 基地址。"""
    from fastapi.openapi.utils import get_openapi
    from fastapi.routing import APIRoute

    from app.modules.stats.api import router as stats_router
    from app.modules.todos.api import router as todos_router

    routes = [
        *todos_router.routes,
        *[
            route for route in stats_router.routes
            if isinstance(route, APIRoute) and route.path == "/stats/todos/completion-history"
        ],
    ]
    return get_openapi(title="待办接口契约", version="1.0.0", routes=routes)


def 导出全部接口契约() -> dict:
    """复用正式路由装配，不运行应用生命周期或连接数据库。"""
    from fastapi import FastAPI
    from app.api.v1.router import API_V1_PREFIX, register_v1_routers

    app = FastAPI(title="FeatherNest接口契约", version="1.0.0")
    register_v1_routers(app, include_dev_auth=False)
    schema = app.openapi()
    schema["paths"] = {path.removeprefix(API_V1_PREFIX): value for path, value in schema["paths"].items()}
    return schema


def main() -> None:
    """将接口契约写入指定文件，供 TypeScript 类型生成器读取。"""
    backend_dir = Path(__file__).resolve().parents[1] / "apps" / "cloud" / "backend"
    sys.path.insert(0, str(backend_dir))
    output_path = Path(sys.argv[1])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    schema = 导出全部接口契约() if "--all" in sys.argv else 导出待办接口契约()
    output_path.write_text(json.dumps(schema, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[接口类型生成] 已导出 {len(schema['paths'])} 个接口路径")


if __name__ == "__main__":
    main()
