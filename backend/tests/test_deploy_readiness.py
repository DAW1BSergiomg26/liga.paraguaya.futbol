from backend.app.core.database import _async_url


def test_async_url_postgresql_prefix():
    assert _async_url("postgresql://u:p@host/db") == "postgresql+asyncpg://u:p@host/db"


def test_async_url_postgres_prefix():
    # Railway a veces inyecta DATABASE_URL como postgres://
    assert _async_url("postgres://u:p@host/db") == "postgresql+asyncpg://u:p@host/db"


def test_async_url_sqlite_unchanged():
    assert _async_url("sqlite+aiosqlite:///./data/liga.db") == "sqlite+aiosqlite:///./data/liga.db"
