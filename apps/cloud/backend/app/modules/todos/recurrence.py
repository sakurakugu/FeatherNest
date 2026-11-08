"""常规日历重复规则；调休与剩余次数由业务层处理。"""

from datetime import date, datetime, time
from functools import lru_cache

from dateutil.rrule import DAILY, MONTHLY, WEEKLY, YEARLY, rrule

常规重复频率 = {"daily": DAILY, "custom": DAILY, "weekly": WEEKLY, "monthly": MONTHLY, "yearly": YEARLY}


@lru_cache(maxsize=1024)
def 获取日历重复规则(anchor: date, recurrence_type: str, interval: int) -> rrule:
    """使用无时区日历日期，保持月底缺日和非闰年跳过语义。"""
    return rrule(
        常规重复频率[recurrence_type],
        dtstart=datetime.combine(anchor, time.min),
        interval=max(1, interval),
    )


def 日历规则当日活跃(anchor: date, recurrence_type: str, interval: int, day: date) -> bool:
    """判断该日期是否正好是规则中的一次发生。"""
    target = datetime.combine(day, time.min)
    return 获取日历重复规则(anchor, recurrence_type, interval).before(target, inc=True) == target


def 日历规则下次日期(anchor: date, recurrence_type: str, interval: int, day: date) -> date | None:
    """查找不早于目标日的下一次发生。"""
    result = 获取日历重复规则(anchor, recurrence_type, interval).after(datetime.combine(day, time.min), inc=True)
    return result.date() if result else None
