"""通过 Resend 发送邮件，不自动重试，避免重复发信。"""

import logging
import ssl

import certifi
import httpx
from .schemas import 邮件渠道配置, 邮件发送请求, 邮件发送结果

logger = logging.getLogger(__name__)


class 邮件发送错误(Exception):
    """可向调用方展示的邮件错误。"""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


async def 发送邮件(body: 邮件发送请求, *, config: 邮件渠道配置, idempotency_key: str) -> 邮件发送结果:
    """受理成功后返回邮件编号；同一业务重试时应复用幂等键。"""
    payload = body.model_dump(mode="json", exclude_none=True)
    payload["from"] = str(config.from_address)
    if config.reply_to:
        payload["reply_to"] = config.reply_to
    try:
        # 生产容器的 SSL_CERT_FILE 指向 MinIO 自签证书；外部邮件 API 使用公共 CA。
        async with httpx.AsyncClient(
            timeout=15.0,
            verify=ssl.create_default_context(cafile=certifi.where()),
            trust_env=False,
        ) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {config.api_key.get_secret_value()}",
                    "Idempotency-Key": idempotency_key,
                },
                json=payload,
            )
    except httpx.RequestError as exc:
        logger.warning("邮件请求异常：类型=%s，幂等键=%s", type(exc).__name__, idempotency_key)
        raise 邮件发送错误("邮件服务连接失败或超时，结果未确定；请先在 Resend 日志确认是否受理，再决定是否重试", 504) from exc
    if not response.is_success:
        # 不记录上游响应正文，避免收件地址、正文或密钥进入日志。
        logger.warning("邮件服务拒绝请求：状态码=%s，幂等键=%s", response.status_code, idempotency_key)
        if response.status_code == 429:
            raise 邮件发送错误("邮件服务发送频率或额度受限，请稍后重试", 429)
        raise 邮件发送错误("邮件服务拒绝发送，请在 Resend 检查密钥、域名、额度及发送日志")
    try:
        message_id = response.json()["id"]
        if not isinstance(message_id, str) or not message_id:
            raise ValueError("邮件编号为空")
    except (ValueError, KeyError, TypeError) as exc:
        logger.error("邮件服务响应缺少有效编号：幂等键=%s", idempotency_key)
        raise 邮件发送错误("邮件服务响应异常，结果未确定；请先在 Resend 日志确认是否受理") from exc
    logger.info("邮件已受理：编号=%s，收件人数=%s，幂等键=%s", message_id, len(body.to), idempotency_key)
    return 邮件发送结果(id=message_id)
