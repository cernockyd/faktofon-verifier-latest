from datetime import datetime
from typing import Any

from dateutil.relativedelta import relativedelta

from src.schema import Duration, Patch


def format_duration(duration: Duration) -> str:
    """Convert a Duration object into a human-readable string."""
    parts: list[str] = []

    if duration.years:
        parts.append(f"{duration.years} year{'s' if duration.years != 1 else ''}")
    if duration.months:
        parts.append(f"{duration.months} month{'s' if duration.months != 1 else ''}")
    if duration.days:
        parts.append(f"{duration.days} day{'s' if duration.days != 1 else ''}")
    if duration.hours:
        parts.append(f"{duration.hours} hour{'s' if duration.hours != 1 else ''}")

    return ", ".join(parts) if parts else "0 hours"


def get_date_before_duration(date: datetime, duration: Duration) -> datetime:
    """Return the datetime before the given duration from now."""
    delta = relativedelta(
        years=int(duration.years or 0),
        months=int(duration.months or 0),
        days=int(duration.days or 0),
        hours=(duration.hours or 0),
    )
    return date - delta


def new_record_patch(path: list[str | int], id: str, value: Any) -> list[Patch]:
    patch_order = Patch(
        op="add",
        path=path + ["order"],
        value=id,
    )
    patch_record = Patch(
        op="add",
        path=path + ["record", id],
        value=value,
    )
    return [patch_order, patch_record]
