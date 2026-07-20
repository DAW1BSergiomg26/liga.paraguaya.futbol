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
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


engine = create_async_engine(
    _async_url(settings.database_url),
    echo=settings.debug,
    pool_pre_ping=True,
    pool_recycle=300,
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_connection():
    async with engine.begin() as conn:
        yield conn


def _is_postgres() -> bool:
    return _async_url(settings.database_url).startswith("postgresql+")


async def run_alembic_upgrade():
    if _is_postgres():
        # En Postgres el esquema ya se crea con create_all (ver init_db).
        # No corremos Alembic en runtime: sus migraciones usan PRAGMA/ALTER
        # incompatibles con Postgres y rompen el arranque del contenedor.
        sys.stderr.write("Postgres detectado: se omite Alembic en runtime (create_all gestiona el esquema)\n")
        sys.stderr.flush()
        return

    import os as _os
    backend_dir = Path(__file__).resolve().parent.parent.parent
    env = {k: v for k, v in _os.environ.items() if not k.startswith("PYTHON")}
    env["PYTHONPATH"] = str(backend_dir.parent)

    def _run_alembic(*args: str) -> tuple[int, str, str]:
        proc = subprocess.run(
            [sys.executable, "-m", "alembic", *args],
            cwd=str(backend_dir), env=env,
            capture_output=True, text=True,
        )
        return proc.returncode, proc.stdout, proc.stderr

    # Try normal upgrade
    code, stdout, stderr = await asyncio.to_thread(_run_alembic, "upgrade", "head")
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
    code2, _, _ = await asyncio.to_thread(_run_alembic, "stamp", "e89293bef80c")
    if code2 != 0:
        sys.stderr.write("Alembic stamp failed, trying raw SQL fallback\n")
        sys.stderr.flush()
        await _ensure_columns_exist()
        return

    code3, stdout3, stderr3 = await asyncio.to_thread(_run_alembic, "upgrade", "head")
    if code3 != 0:
        sys.stderr.write(f"Alembic retry failed ({stderr3.strip()[:200]}), trying raw SQL fallback\n")
        sys.stderr.flush()
    out = stdout3.strip()
    if out:
        sys.stderr.write(f"Alembic: {out}\n")
        sys.stderr.flush()
    if not await _check_column_exists("clubes", "sitio_web"):
        await _ensure_columns_exist()
        await asyncio.to_thread(_run_alembic, "stamp", "6fbc92ce284a")


async def _check_column_exists(table: str, column: str) -> bool:
    try:
        async with engine.begin() as conn:
            result = await conn.execute(sa_text(f"PRAGMA table_info({table})"))
            rows = result.fetchall()
            return any(row[1] == column for row in rows)
    except Exception:
        return False


async def _ensure_columns_exist():
    club_columns = [
        ("sitio_web", "VARCHAR(500) NOT NULL DEFAULT ''"),
        ("descripcion", "VARCHAR(2000) NOT NULL DEFAULT ''"),
        ("titulos_liga", "INTEGER NOT NULL DEFAULT 0"),
        ("titulos_info", "JSON NOT NULL DEFAULT '[]'"),
        ("titulos_internacionales", "JSON NOT NULL DEFAULT '[]'"),
    ]
    partido_columns = [
        ("temporada", "VARCHAR(20) NOT NULL DEFAULT ''"),
    ]
    user_columns = [
        ("hashed_password", "VARCHAR(256)"),
    ]
    async with engine.begin() as conn:
        for col, dtype in club_columns:
            result = await conn.execute(sa_text("PRAGMA table_info(clubes)"))
            rows = result.fetchall()
            if not any(row[1] == col for row in rows):
                await conn.execute(sa_text(f"ALTER TABLE clubes ADD COLUMN {col} {dtype}"))
                sys.stderr.write(f"Added missing column clubes.{col}\n")
        for col, dtype in partido_columns:
            result = await conn.execute(sa_text("PRAGMA table_info(partidos)"))
            rows = result.fetchall()
            if not any(row[1] == col for row in rows):
                await conn.execute(sa_text(f"ALTER TABLE partidos ADD COLUMN {col} {dtype}"))
                sys.stderr.write(f"Added missing column partidos.{col}\n")
        for col, dtype in user_columns:
            result = await conn.execute(sa_text("PRAGMA table_info(users)"))
            rows = result.fetchall()
            if not any(row[1] == col for row in rows):
                await conn.execute(sa_text(f"ALTER TABLE users ADD COLUMN {col} {dtype}"))
                sys.stderr.write(f"Added missing column users.{col}\n")
    sys.stderr.flush()


async def init_db():
    # Registra todos los modelos antes de crear el esquema.
    from backend.app import models  # noqa: F401  (importa models/__init__ y goleador)
    import backend.app.models.goleador  # noqa: F401  (no exportado en __init__)

    async with engine.begin() as conn:
        if _is_postgres():
            # En Postgres NO borramos datos: solo creamos tablas faltantes.
            # El esquema ya fue poblado (import_data.py / seed).
            await conn.run_sync(Base.metadata.create_all)
        else:
            from backend.app.models import club, partido, prediction, tabla, user
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
