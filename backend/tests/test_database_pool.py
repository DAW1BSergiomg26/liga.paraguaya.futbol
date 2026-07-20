"""Tests for database pool configuration (Neon connection recycling).

Verifies that the async engine has pool_pre_ping=True and pool_recycle=300
to handle Neon's serverless connection closing behavior.
"""

import pytest
from sqlalchemy.ext.asyncio import create_async_engine

from backend.app.core.database import _async_url


class TestAsyncUrl:
    """Test the URL conversion helper."""

    def test_postgresql_conversion(self):
        assert _async_url("postgresql://user:pass@host/db") == "postgresql+asyncpg://user:pass@host/db"

    def test_postgres_conversion(self):
        assert _async_url("postgres://user:pass@host/db") == "postgresql+asyncpg://user:pass@host/db"

    def test_already_asyncpg_unchanged(self):
        url = "postgresql+asyncpg://user:pass@host/db"
        assert _async_url(url) == url

    def test_sqlite_unchanged(self):
        url = "sqlite+aiosqlite:///./test.db"
        assert _async_url(url) == url


class TestEnginePoolConfig:
    """Test that the engine is created with correct pool settings for Neon."""

    def test_engine_has_pre_ping(self):
        """pool_pre_ping=True ensures dead connections are detected before reuse."""
        from backend.app.core.database import engine
        assert engine.pool._pre_ping is True

    def test_engine_has_pool_recycle(self):
        """pool_recycle=300 forces connection recycling before Neon kills them."""
        from backend.app.core.database import engine
        assert engine.pool._recycle == 300

    @pytest.mark.asyncio
    async def test_engine_connects_successfully(self):
        """Basic connectivity check — engine must connect without error."""
        from backend.app.core.database import engine
        async with engine.connect() as conn:
            result = await conn.execute(__import__('sqlalchemy').text("SELECT 1"))
            assert result.scalar() == 1
