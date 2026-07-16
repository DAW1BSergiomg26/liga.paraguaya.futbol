import asyncio

import backend.app.main as main
from backend.app.core.database import _async_url


async def test_sync_loop_skips_without_api_key(monkeypatch):
    monkeypatch.setattr(main.settings, "api_football_key", "")
    task = asyncio.create_task(main.sync_loop())
    done, _ = await asyncio.wait({task}, timeout=1.0)
    assert task in done  # completó (no entró en loop de 600s)


def test_async_url_postgresql_prefix():
    assert _async_url("postgresql://u:p@host/db") == "postgresql+asyncpg://u:p@host/db"


def test_async_url_postgres_prefix():
    # Railway a veces inyecta DATABASE_URL como postgres://
    assert _async_url("postgres://u:p@host/db") == "postgresql+asyncpg://u:p@host/db"


def test_async_url_sqlite_unchanged():
    assert _async_url("sqlite+aiosqlite:///./data/liga.db") == "sqlite+aiosqlite:///./data/liga.db"
