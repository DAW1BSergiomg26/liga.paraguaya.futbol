import time
from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.models.api_key import APIKey

RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX = 100


class RateLimiter:
    def __init__(self):
        self._windows: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str) -> tuple[bool, int, int]:
        now = time.monotonic()
        cutoff = now - RATE_LIMIT_WINDOW
        window = [t for t in self._windows[key] if t > cutoff]
        self._windows[key] = window
        remaining = RATE_LIMIT_MAX - len(window)
        if len(window) >= RATE_LIMIT_MAX:
            reset_in = int(RATE_LIMIT_WINDOW - (now - window[0]))
            return False, 0, reset_in
        self._windows[key].append(now)
        return True, remaining, 0


rate_limiter = RateLimiter()


async def rate_limit_info(x_api_key: str, db: AsyncSession | None = None) -> dict:
    if db is None:
        async with async_session() as db:
            return await _rate_limit_impl(db, x_api_key)
    return await _rate_limit_impl(db, x_api_key)


async def _rate_limit_impl(db: AsyncSession, x_api_key: str) -> dict:
    result = await db.execute(select(APIKey).where(APIKey.key == x_api_key))
    api_key = result.scalar_one_or_none()
    if not api_key or not api_key.is_active:
        return _err(401, "INVALID_API_KEY", "API Key invÃ¡lida o desactivada")

    ok, remaining, reset_in = rate_limiter.check(x_api_key)
    if not ok:
        return _err(
            429, "RATE_LIMIT_EXCEEDED",
            f"LÃ­mite de requests excedido. EsperÃ¡ {reset_in} segundos.",
            reset_in,
        )

    api_key.requests_count += 1
    api_key.last_used_at = datetime.now(timezone.utc)
    await db.commit()

    return {"ok": True, "remaining": remaining, "reset_in": reset_in}


def _err(status: int, code: str, msg: str, reset_in: int = 0) -> dict:
    return {
        "ok": False,
        "status_code": status,
        "body": {"success": False, "error": {"code": code, "message": msg, "status": status}},
        "reset_in": reset_in,
    }
