"""Tests for Postgres schema synchronization.

Verifies that _check_column_exists_postgres and _ensure_schema_postgres
correctly detect missing columns and apply ALTER TABLE fixes for Postgres.
These functions fix the root cause of 500 errors in production: Alembic
migrations were never applied and init_db() was removed from the lifespan.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestCheckColumnExistsPostgres:
    """Test _check_column_exists_postgres with information_schema."""

    @pytest.mark.asyncio
    async def test_returns_true_when_column_exists(self):
        from backend.app.core.database import _check_column_exists_postgres

        mock_result = MagicMock()
        mock_result.fetchone.return_value = (1,)

        mock_conn = AsyncMock()
        mock_conn.execute.return_value = mock_result

        mock_begin = AsyncMock()
        mock_begin.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_begin.__aexit__ = AsyncMock(return_value=False)

        with patch("backend.app.core.database.engine") as mock_engine:
            mock_engine.begin.return_value = mock_begin
            result = await _check_column_exists_postgres("clubes", "sitio_web")

        assert result is True
        mock_conn.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_false_when_column_missing(self):
        from backend.app.core.database import _check_column_exists_postgres

        mock_result = MagicMock()
        mock_result.fetchone.return_value = None

        mock_conn = AsyncMock()
        mock_conn.execute.return_value = mock_result

        mock_begin = AsyncMock()
        mock_begin.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_begin.__aexit__ = AsyncMock(return_value=False)

        with patch("backend.app.core.database.engine") as mock_engine:
            mock_engine.begin.return_value = mock_begin
            result = await _check_column_exists_postgres("clubes", "nonexistent")

        assert result is False

    @pytest.mark.asyncio
    async def test_returns_false_on_exception(self):
        from backend.app.core.database import _check_column_exists_postgres

        mock_conn = AsyncMock()
        mock_conn.execute.side_effect = Exception("connection lost")

        mock_begin = AsyncMock()
        mock_begin.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_begin.__aexit__ = AsyncMock(return_value=False)

        with patch("backend.app.core.database.engine") as mock_engine:
            mock_engine.begin.return_value = mock_begin
            result = await _check_column_exists_postgres("clubes", "sitio_web")

        assert result is False


def _alter_table_calls(mock_conn):
    """Extract ALTER TABLE calls from mock connection execute list."""
    calls = []
    for call in mock_conn.execute.call_args_list:
        arg = call[0][0] if call[0] else None
        if arg is not None and hasattr(arg, "text") and "ALTER TABLE" in arg.text:
            calls.append(arg.text)
    return calls


class TestEnsureSchemaPostgres:
    """Test _ensure_schema_postgres adds missing columns via ALTER TABLE."""

    @pytest.mark.asyncio
    async def test_adds_missing_club_columns(self):
        """Missing clubes columns must be added via ALTER TABLE."""
        from backend.app.core.database import _ensure_schema_postgres

        mock_conn = AsyncMock()
        mock_begin = AsyncMock()
        mock_begin.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_begin.__aexit__ = AsyncMock(return_value=False)

        call_count = 0

        async def fake_check(table, col):
            nonlocal call_count
            call_count += 1
            # First 5 checks (clubes) return False (missing)
            # Then partidos/users checks return True (already exist)
            return call_count > 5

        with patch("backend.app.core.database.engine") as mock_engine, \
             patch("backend.app.core.database._check_column_exists_postgres", side_effect=fake_check):
            mock_engine.begin.return_value = mock_begin
            await _ensure_schema_postgres()

        alters = _alter_table_calls(mock_conn)
        club_alters = [t for t in alters if "ALTER TABLE clubes" in t]
        assert len(club_alters) == 5

    @pytest.mark.asyncio
    async def test_skips_existing_columns(self):
        """Columns that already exist must NOT be altered."""
        from backend.app.core.database import _ensure_schema_postgres

        mock_conn = AsyncMock()
        mock_begin = AsyncMock()
        mock_begin.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_begin.__aexit__ = AsyncMock(return_value=False)

        with patch("backend.app.core.database.engine") as mock_engine, \
             patch("backend.app.core.database._check_column_exists_postgres", return_value=True):
            mock_engine.begin.return_value = mock_begin
            await _ensure_schema_postgres()

        alters = _alter_table_calls(mock_conn)
        assert len(alters) == 0

    @pytest.mark.asyncio
    async def test_adds_user_admin_column(self):
        """is_admin must be added to users table if missing."""
        from backend.app.core.database import _ensure_schema_postgres

        mock_conn = AsyncMock()
        mock_begin = AsyncMock()
        mock_begin.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_begin.__aexit__ = AsyncMock(return_value=False)

        call_count = 0

        async def fake_check(table, col):
            nonlocal call_count
            call_count += 1
            # clubes checks (1-5): exist; partidos (6): exists;
            # users hashed_password (7): exists; users is_admin (8): MISSING
            return call_count != 8

        with patch("backend.app.core.database.engine") as mock_engine, \
             patch("backend.app.core.database._check_column_exists_postgres", side_effect=fake_check):
            mock_engine.begin.return_value = mock_begin
            await _ensure_schema_postgres()

        alters = _alter_table_calls(mock_conn)
        user_alters = [t for t in alters if "ALTER TABLE users ADD COLUMN is_admin" in t]
        assert len(user_alters) == 1


class TestRunAlembicUpgradePostgres:
    """Test that run_alembic_upgrade calls _ensure_schema_postgres for Postgres."""

    @pytest.mark.asyncio
    async def test_postgres_path_calls_ensure_schema(self):
        from backend.app.core.database import run_alembic_upgrade

        with patch("backend.app.core.database._is_postgres", return_value=True), \
             patch("backend.app.core.database._ensure_schema_postgres", new_callable=AsyncMock) as mock_ensure:
            await run_alembic_upgrade()

        mock_ensure.assert_called_once()

    @pytest.mark.asyncio
    async def test_sqlite_path_does_not_call_ensure_schema(self):
        from backend.app.core.database import run_alembic_upgrade

        mock_to_thread = AsyncMock(return_value=(0, "", ""))

        with patch("backend.app.core.database._is_postgres", return_value=False), \
             patch("backend.app.core.database._ensure_schema_postgres", new_callable=AsyncMock) as mock_ensure, \
             patch("backend.app.core.database.asyncio") as mock_asyncio:
            mock_asyncio.to_thread = mock_to_thread
            await run_alembic_upgrade()

        mock_ensure.assert_not_called()
