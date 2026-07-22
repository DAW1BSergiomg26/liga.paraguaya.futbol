"""
Importa los datos exportados (data/export/*.json) a la base de datos de produccion.

Uso:
    cd backend
    $env:PYTHONPATH=".."
    $env:DATABASE_URL="postgresql://<neon>.../neondb"   # SIN ?sslmode (asyncpg lo rechaza)
    python import_data.py

Comportamiento:
    - Limpia las tablas (TRUNCATE ... CASCADE) antes de insertar para evitar
      duplicados en re-ejecuciones. NO toca alembic_version.
    - Inserta en orden de dependencias (clubes -> users -> ... -> partidos ->
      tabla_posiciones -> transferencias -> noticias -> predictions -> ...).
    - Usa los modelos del proyecto para respetar tipos (date/datetime).
    - TRUNCATE en Postgres requiere transaccion; se hace por fuera de la sesion ORM.

Regla: la DATABASE_URL NO debe llevar ?sslmode= / ssl=true (asyncpg los rechaza).
El codigo de database.py ya convierte postgres:// -> postgresql+asyncpg://.
"""

from __future__ import annotations

import asyncio
import json
from datetime import date, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.database import async_session, engine
from backend.app import models  # noqa: F401 - registra todos los modelos
from backend.app.models.club import Club
from backend.app.models.user import User
from backend.app.models.goleador import Goleador
from backend.app.models.partido import Partido
from backend.app.models.tabla import TablaPosicion
from backend.app.models.transferencia import Transferencia
from backend.app.models.noticia import Noticia
from backend.app.models.prediction import Prediction
from backend.app.models.mensaje_chat import MensajeChat
from backend.app.models.api_key import APIKey
from backend.app.models.push_subscription import PushSubscription


EXPORT_DIR = Path(__file__).resolve().parent.parent / "data" / "export"

# Orden de insercion respetando FKs:
# clubes <- (partidos, tabla_posiciones, goleadores, transferencias)
# users  <- (predictions, mensajes_chat, push_subscriptions)
# partidos <- (predictions, mensajes_chat)
ORDER = [
    "clubes",
    "users",
    "goleadores",
    "partidos",
    "tabla_posiciones",
    "transferencias",
    "noticias",
    "predictions",
    "mensajes_chat",
    "api_keys",
    "push_subscriptions",
]

MODEL_MAP = {
    "clubes": Club,
    "users": User,
    "goleadores": Goleador,
    "partidos": Partido,
    "tabla_posiciones": TablaPosicion,
    "transferencias": Transferencia,
    "noticias": Noticia,
    "predictions": Prediction,
    "mensajes_chat": MensajeChat,
    "api_keys": APIKey,
    "push_subscriptions": PushSubscription,
}


def _coerce(model_cls, record: dict) -> dict:
    """Convierte strings ISO a date/datetime segun el tipo de columna."""
    out: dict[str, Any] = {}
    for col in model_cls.__table__.columns:
        if col.name not in record:
            continue
        value = record[col.name]
        if value is None:
            out[col.name] = None
            continue
        py_type = col.type.python_type
        if py_type is date and not isinstance(value, date):
            out[col.name] = date.fromisoformat(str(value)[:10])
        elif py_type is datetime and not isinstance(value, datetime):
            out[col.name] = datetime.fromisoformat(str(value))
        else:
            out[col.name] = value
    return out


def _clean_for_insert(model_cls, record: dict) -> dict:
    """Quita el id autoincrement si viene en el JSON para que la DB lo genere."""
    data = _coerce(model_cls, record)
    pk_cols = [c for c in model_cls.__table__.columns if c.primary_key]
    for pk in pk_cols:
        # Si es autoincrement (ej. tabla_posiciones.id) y el valor es un int generico,
        # lo quitamos para evitar conflictos de secuencia en Postgres.
        if pk.autoincrement and isinstance(data.get(pk.name), int):
            data.pop(pk.name, None)
    return data


async def _truncate_all() -> None:
    # TRUNCATE con CASCADE limpia todo respetando FKs. No incluye alembic_version.
    # En SQLite (pruebas locales) no existe TRUNCATE: usamos DELETE en orden inverso.
    tables = ", ".join(ORDER)
    is_sqlite = engine.dialect.name == "sqlite"
    async with engine.begin() as conn:
        if is_sqlite:
            for name in reversed(ORDER):
                await conn.execute(text(f"DELETE FROM {name}"))
        else:
            await conn.execute(text(f"TRUNCATE TABLE {tables} RESTART IDENTITY CASCADE"))


async def _import_table(name: str, session: AsyncSession) -> int:
    path = EXPORT_DIR / f"{name}.json"
    if not path.exists():
        print(f"  - {name:20s} -> sin archivo, salteado")
        return 0
    records = json.loads(path.read_text(encoding="utf-8"))
    if not records:
        print(f"  - {name:20s} -> vacio (0 filas)")
        return 0

    model_cls = MODEL_MAP[name]
    objetos = [model_cls(**_clean_for_insert(model_cls, r)) for r in records]
    session.add_all(objetos)
    await session.flush()
    print(f"  OK {name:20s} -> {len(objetos)} filas")
    return len(objetos)


async def main() -> None:
    db_url = settings.database_url
    print(f"Conectando a: {db_url}")
    if "sslmode" in db_url or "ssl=true" in db_url:
        raise SystemExit(
            "ERROR: DATABASE_URL contiene parametros de SSL incompatibles con "
            "asyncpg (?sslmode= / ssl=true). Eliminalos de la URL de Neon."
        )

    if not EXPORT_DIR.exists():
        raise SystemExit(f"ERROR: no existe {EXPORT_DIR}. Corre primero export_data.py")

    total = 0
    async with async_session() as session:
        print("Limpiando tablas (TRUNCATE CASCADE, sin tocar alembic_version)...")
        await _truncate_all()
        await session.commit()

        print("Insertando en orden de dependencias:")
        for name in ORDER:
            count = await _import_table(name, session)
            total += count
        await session.commit()

    print(f"\nListo. {total} filas importadas a produccion.")


if __name__ == "__main__":
    asyncio.run(main())
