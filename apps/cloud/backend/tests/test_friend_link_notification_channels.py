"""友链汇总渠道配置测试。"""
import unittest
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

from fastapi import HTTPException

from app.modules.notifications.api import 友链推送渠道配置, 保存友链推送渠道


class 友链渠道配置测试(unittest.IsolatedAsyncioTestCase):
    async def test_默认渠道必须在允许范围内(self):
        db = Mock()
        db.execute = AsyncMock()
        with self.assertRaises(HTTPException):
            await 保存友链推送渠道(友链推送渠道配置(channel_ids=[uuid4()], default_channel_ids=[uuid4()]), None, db)
        db.execute.assert_not_called()

    async def test_保存允许和默认渠道(self):
        first, second = uuid4(), uuid4()
        db = Mock()
        db.execute = AsyncMock(return_value=Mock(scalars=Mock(return_value=Mock(all=Mock(return_value=[Mock(), Mock()])))))
        result = await 保存友链推送渠道(友链推送渠道配置(channel_ids=[first, second], default_channel_ids=[second]), None, db)
        self.assertEqual(result, {"channel_ids": [first, second], "default_channel_ids": [second]})
        inserts = db.execute.call_args_list[2:]
        self.assertEqual([call.args[1]["is_default"] for call in inserts], [False, True])
