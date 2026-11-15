"""邮件发送接口模型。"""

from pydantic import BaseModel, EmailStr, Field, NameEmail, SecretStr, field_validator


class 邮件发送请求(BaseModel):
    """供后台与内部业务复用的邮件内容。"""

    to: list[EmailStr] = Field(min_length=1, max_length=50, description="收件人邮箱")
    subject: str = Field(min_length=1, max_length=998, description="邮件主题")
    text: str = Field(min_length=1, max_length=100_000, description="纯文本正文")
    html: str | None = Field(default=None, max_length=100_000, description="可选的 HTML 正文")

    @field_validator("subject", "text")
    @classmethod
    def 校验非空内容(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("邮件主题和正文不能为空")
        return value

    @field_validator("subject")
    @classmethod
    def 校验主题(cls, value: str) -> str:
        if "\r" in value or "\n" in value:
            raise ValueError("邮件主题不能包含换行")
        return value


class 邮件渠道配置(BaseModel):
    """从加密推送渠道配置解析出的邮件参数。"""

    api_key: SecretStr
    from_address: NameEmail
    to: list[EmailStr] = Field(min_length=1, max_length=50)
    reply_to: EmailStr | None = None

    @field_validator("api_key")
    @classmethod
    def 校验密钥(cls, value: SecretStr) -> SecretStr:
        key = value.get_secret_value().strip()
        if not key or not key.isascii() or any(c.isspace() for c in key):
            raise ValueError("Resend 密钥格式不正确")
        return SecretStr(key)

    @classmethod
    def 从渠道配置(cls, config: dict[str, str]) -> "邮件渠道配置":
        return cls.model_validate({
            "api_key": config.get("api_key", ""),
            "from_address": config.get("from_address", ""),
            "to": [value.strip() for value in config.get("to", "").split(",") if value.strip()],
            "reply_to": config.get("reply_to", "").strip() or None,
        })


class 邮件发送结果(BaseModel):
    id: str = Field(description="Resend 已受理邮件的编号，不代表已投递到收件箱")
