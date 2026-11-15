"""认证接口共享限流器，使用 Redis 在多进程间累计请求次数。"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.shared.kernel.config import settings

登录限流器 = Limiter(key_func=get_remote_address, storage_uri=settings.REDIS_URL)
