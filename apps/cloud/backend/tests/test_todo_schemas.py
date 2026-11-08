"""待办接口的枚举校验与生成契约测试。"""

from __future__ import annotations

import unittest
from datetime import datetime, timezone
from uuid import uuid4

from fastapi.openapi.utils import get_openapi
from pydantic import ValidationError

from app.modules.system.schemas import 待办完成历史日信息
from app.modules.todos.api import router
from app.modules.todos.models import RecurrenceType, TodoStatus
from app.modules.todos.schemas import TodoCreate, TodoRead, TodoUpdate


class 待办接口契约测试(unittest.TestCase):
    """确保接口校验与前端生成类型使用同一套枚举及空值定义。"""

    def test_所有循环类型都能按接口字符串解析(self) -> None:
        for recurrence_type in RecurrenceType:
            with self.subTest(recurrence_type=recurrence_type):
                body = TodoCreate(title="测试待办", recurrence_type=recurrence_type.value)
                self.assertEqual(body.recurrence_type, recurrence_type)
                self.assertEqual(body.model_dump(mode="json")["recurrence_type"], recurrence_type.value)

    def test_非法枚举由Pydantic拒绝(self) -> None:
        for schema, payload in [
            (TodoCreate, {"title": "测试待办", "recurrence_type": "invalid"}),
            (TodoUpdate, {"recurrence_type": "invalid"}),
            (TodoUpdate, {"status": "invalid"}),
        ]:
            with self.subTest(payload=payload), self.assertRaises(ValidationError):
                schema.model_validate(payload)

    def test_更新请求保留未传字段与显式空值的区别(self) -> None:
        self.assertEqual(TodoUpdate().model_dump(exclude_unset=True), {})
        self.assertEqual(
            TodoUpdate(description=None, start_date=None, status=TodoStatus.done)
            .model_dump(mode="json", exclude_unset=True),
            {"description": None, "start_date": None, "status": "done"},
        )

    def test_保留循环字段组合校验(self) -> None:
        for payload in [
            {"title": "测试待办", "recurrence_count": 2},
            {"title": "测试待办", "times_per_interval": 2},
        ]:
            with self.subTest(payload=payload), self.assertRaises(ValidationError):
                TodoCreate.model_validate(payload)
        with self.assertRaises(ValidationError):
            TodoUpdate(times_per_interval=2, interval_progress=3)

    def test_响应默认字段也必须出现在输出契约中(self) -> None:
        now = datetime.now(timezone.utc)
        response = TodoRead(
            id=uuid4(), title="测试待办", status=TodoStatus.todo,
            importance=33, urgency=33, is_pinned=False, is_deleted=False,
            created_at=now, updated_at=now,
        )
        schema = TodoRead.model_json_schema(mode="serialization")
        self.assertEqual(set(schema["required"]), set(schema["properties"]))
        self.assertEqual(set(response.model_dump()), set(schema["properties"]))
        self.assertIsNone(response.description)
        self.assertEqual(response.recurrence_type, RecurrenceType.none)
        history_schema = 待办完成历史日信息.model_json_schema(mode="serialization")
        self.assertIn("items", history_schema["required"])

    def test_OpenAPI公开实际枚举和请求空值(self) -> None:
        schema = get_openapi(title="待办契约测试", version="1.0.0", routes=router.routes)
        schemas = schema["components"]["schemas"]
        self.assertEqual(schemas["TodoStatus"]["enum"], [item.value for item in TodoStatus])
        self.assertEqual(schemas["RecurrenceType"]["enum"], [item.value for item in RecurrenceType])
        self.assertEqual(schemas["TodoCreate"]["required"], ["title"])
        self.assertIn({"type": "null"}, schemas["TodoUpdate"]["properties"]["description"]["anyOf"])
        status_filter = next(
            param for param in schema["paths"]["/todos"]["get"]["parameters"]
            if param["name"] == "status"
        )
        self.assertIn({"$ref": "#/components/schemas/TodoStatus"}, status_filter["schema"]["anyOf"])


if __name__ == "__main__":
    unittest.main()
