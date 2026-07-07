import asyncio
import subprocess
import sys
from pathlib import Path

from sqlalchemy import text as sa_text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.app.core.config import settings


def _async_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


engine = create_async_engine(_async_url(settings.database_url), echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_connection():
    async with engine.begin() as conn:
        yield conn


async def run_alembic_upgrade():
    import os as _os
    backend_dir = Path(__file__).resolve().parent.parent.parent
    env = {k: v for k, v in _os.environ.items() if not k.startswith("PYTHON")}
    env["PYTHONPATH"] = str(backend_dir.parent)

    async def _run_alembic(*args: str) -> tuple[int, str, str]:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, "-m", "alembic", *args,
            cwd=str(backend_dir), env=env,
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        out, err = await proc.communicate()
        return proc.returncode or 0, out.decode(), err.decode()

    # Try normal upgrade
    code, stdout, stderr = await _run_alembic("upgrade", "head")
    if code == 0:
        out = stdout.strip()
        if out:
            sys.stderr.write(f"Alembic: {out}\n")
            sys.stderr.flush()
        # Verify columns exist
        if not await _check_column_exists("clubes", "sitio_web"):
            sys.stderr.write("Alembic upgrade succeeded but columns missing — attempting stamp+upgrade\n")
        else:
            return

    # Stamp to first revision and retry
    sys.stderr.write(f"Alembic upgrade handling...\n")
    sys.stderr.flush()
    code2, _, _ = await _run_alembic("stamp", "e89293bef80c")
    if code2 != 0:
        sys.stderr.write("Alembic stamp failed, trying raw SQL fallback\n")
        sys.stderr.flush()
        await _ensure_columns_exist()
        return

    code3, stdout3, stderr3 = await _run_alembic("upgrade", "head")
    if code3 != 0:
        sys.stderr.write(f"Alembic retry failed ({stderr3.strip()[:200]}), trying raw SQL fallback\n")
        sys.stderr.flush()
    out = stdout3.strip()
    if out:
        sys.stderr.write(f"Alembic: {out}\n")
        sys.stderr.flush()
    if not await _check_column_exists("clubes", "sitio_web"):
        await _ensure_columns_exist()
        await _run_alembic("stamp", "6fbc92ce284a")


async def _check_column_exists(table: str, column: str) -> bool:
    try:
        async with engine.begin() as conn:
            result = await conn.execute(
                sa_text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name = :table AND column_name = :column"
                ),
                {"table": table, "column": column},
            )
            return result.scalar() is not None
    except Exception:
        return False


async def _ensure_columns_exist():
    club_columns = [
        ("sitio_web", "VARCHAR(500) NOT NULL DEFAULT ''"),
        ("descripcion", "VARCHAR(2000) NOT NULL DEFAULT ''"),
        ("titulos_liga", "INTEGER NOT NULL DEFAULT 0"),
        ("titulos_info", "JSON NOT NULL DEFAULT '[]'"),
    ]
    partido_columns = [
        ("temporada", "VARCHAR(20) NOT NULL DEFAULT ''"),
    ]
    async with engine.begin() as conn:
        for col, dtype in club_columns:
            exists = await conn.execute(
                sa_text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name = 'clubes' AND column_name = :col"
                ),
                {"col": col},
            )
            if not exists.scalar():
                await conn.execute(sa_text(f"ALTER TABLE clubes ADD COLUMN {col} {dtype}"))
                sys.stderr.write(f"Added missing column clubes.{col}\n")
        for col, dtype in partido_columns:
            exists = await conn.execute(
                sa_text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name = 'partidos' AND column_name = :col"
                ),
                {"col": col},
            )
            if not exists.scalar():
                await conn.execute(sa_text(f"ALTER TABLE partidos ADD COLUMN {col} {dtype}"))
                sys.stderr.write(f"Added missing column partidos.{col}\n")
    sys.stderr.flush()


async def init_db():
    async with engine.begin() as conn:
        from backend.app.models import club, partido, prediction, tabla, user
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
