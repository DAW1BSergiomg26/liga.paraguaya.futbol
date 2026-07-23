"""
Exporta todas las tablas de la base de datos local (SQLite) a archivos JSON limpios.

Uso:
    cd backend
    $env:PYTHONPATH=".."
    python export_data.py

Por defecto lee la DB local definida en config.database_url. Si esa URL usa el
driver asincrono (aiosqlite), el script crea un engine sincrono aparte con el
driver sqlite3 apuntando al MISMO archivo, para evitar conflictos de greenlet.

Los JSON se guardan en ../data/export/ (una carpeta por encima de backend, junto
a los JSON de origen del proyecto). Cada tabla va en su propio archivo:
    clubes.json, partidos.json, tabla_posiciones.json, goleadores.json,
    noticias.json, transferencias.json, users.json, predictions.json,
    mensajes_chat.json, api_keys.json, push_subscriptions.json

Nota: "Historial" no es una tabla propia; se deriva de tabla_posiciones
(campeones por torneo). Exportar tabla_posiciones cubre esos datos.
"""

from __future__ import annotations

import json
import re
from datetime import date, datetime
from pathlib import Path

from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy import Table
from sqlalchemy.orm import declarative_base

from backend.app.core.config import settings


def _serialize(value):
    """Convierte valores de SQLAlchemy a tipos serializables por JSON."""
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


def _build_sync_url(db_url: str) -> str:
    """Convierte una URL async de aiosqlite a una URL sync de sqlite3."""
    # sqlite+aiosqlite:////ruta/absoluta/liga.db  ->  sqlite:////ruta/absoluta/liga.db
    return re.sub(r"^sqlite\+aiosqlite:", "sqlite:", db_url)


def main() -> None:
    db_url = settings.database_url
    print(f"Leyendo desde: {db_url}")

    sync_url = _build_sync_url(db_url)
    engine = create_engine(sync_url, future=True)
    print(f"Engine sync: {sync_url}\n")

    output_dir = Path(__file__).resolve().parent.parent / "data" / "export"
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Destino: {output_dir}\n")

    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    preferred_order = [
        "clubes",
        "partidos",
        "tabla_posiciones",
        "goleadores",
        "noticias",
        "transferencias",
        "users",
        "predictions",
        "mensajes_chat",
        "api_keys",
        "push_subscriptions",
    ]
    ordered = [t for t in preferred_order if t in table_names]
    ordered += [t for t in table_names if t not in preferred_order]

    Base = declarative_base()
    metadata = Base.metadata

    total = 0
    for name in ordered:
        try:
            table = Table(name, metadata, autoload_with=engine)
            with engine.connect() as conn:
                result = conn.execute(select(table))
                rows = [dict(r._mapping) for r in result]

            clean = [{k: _serialize(v) for k, v in rec.items()} for rec in rows]
            out_file = output_dir / f"{name}.json"
            out_file.write_text(
                json.dumps(clean, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(f"  OK {name:20s} -> {len(clean)} filas")
            total += len(clean)
        except Exception as e:  # noqa: BLE001 - reportar y seguir con las demas
            print(f"  X  {name:20s} -> error: {e}")

    engine.dispose()
    print(f"\nListo. {len(ordered)} tablas exportadas, {total} filas en total.")
    print(f"Carpeta: {output_dir}")


if __name__ == "__main__":
    main()
