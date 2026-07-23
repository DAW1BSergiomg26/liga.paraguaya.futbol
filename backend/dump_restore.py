"""
Volcado completo: Neon (produccion) -> JSON -> PostgreSQL local (Docker).

Uso:
    cd backend
    $env:PYTHONPATH=".."
    $env:PROD_DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname"
    python dump_restore.py

El script:
  1. Lee TODAS las tablas de la BD de produccion (Neon) via psycopg2 sync
  2. Las guarda en data/export/ como JSON
  3. TRUNCATE + INSERT en la BD local (PostgreSQL en Docker, puerto 5432)

Requisitos:
    - psycopg2-binary instalado (pip install psycopg2-binary)
    - PostgreSQL local corriendo en Docker (docker-compose up postgres)
    - PROD_DATABASE_URL apuntando a Neon (SIN ?sslmode= en la URL, usar sslmode en params)
"""

from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime
from pathlib import Path

PROD_DB_URL = os.environ.get("PROD_DATABASE_URL", "")
LOCAL_DB_URL = os.environ.get(
    "LOCAL_DATABASE_URL",
    "postgresql://liga:liga_password@localhost:5432/liga",
)

EXPORT_DIR = Path(__file__).resolve().parent.parent / "data" / "export"

# Orden de tablas respetando FKs
TABLE_ORDER = [
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


def _serialize(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if hasattr(value, "__class__") and value.__class__.__name__ == "Decimal":
        return float(value)
    return value


def _get_connection(url: str):
    """Create a psycopg2 connection from a PostgreSQL URL."""
    try:
        import psycopg2
    except ImportError:
        print("ERROR: psycopg2 no instalado. Ejecuta: pip install psycopg2-binary")
        sys.exit(1)

    # Parse URL: postgresql://user:pass@host:port/dbname?params
    from urllib.parse import urlparse
    parsed = urlparse(url)
    dbname = parsed.path.lstrip("/")
    params = {
        "host": parsed.hostname,
        "port": parsed.port or 5432,
        "user": parsed.username,
        "password": parsed.password,
        "dbname": dbname,
    }
    # Pass sslmode if present in URL query string
    if parsed.query:
        from urllib.parse import parse_qs
        qs = parse_qs(parsed.query)
        if "sslmode" in qs:
            params["sslmode"] = qs["sslmode"][0]

    return psycopg2.connect(**params)


def _get_table_columns(conn, table_name: str) -> list[str]:
    """Get column names for a table using information_schema."""
    cur = conn.cursor()
    cur.execute(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = %s ORDER BY ordinal_position",
        (table_name,),
    )
    cols = [row[0] for row in cur.fetchall()]
    cur.close()
    return cols


def _table_exists(conn, table_name: str) -> bool:
    cur = conn.cursor()
    cur.execute(
        "SELECT 1 FROM information_schema.tables WHERE table_name = %s",
        (table_name,),
    )
    exists = cur.fetchone() is not None
    cur.close()
    return exists


def dump_from_production(prod_url: str) -> int:
    """Read all tables from production DB and save to JSON files."""
    print(f"=== DUMP desde produccion ===")
    print(f"URL: {prod_url[:50]}...")
    print(f"Destino: {EXPORT_DIR}\n")

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    conn = _get_connection(prod_url)
    total = 0

    for table in TABLE_ORDER:
        if not _table_exists(conn, table):
            print(f"  - {table:20s} -> no existe, salteado")
            continue

        cols = _get_table_columns(conn, table)
        if not cols:
            print(f"  - {table:20s} -> sin columnas, salteado")
            continue

        cur = conn.cursor()
        cols_str = ", ".join(f'"{c}"' for c in cols)
        cur.execute(f"SELECT {cols_str} FROM {table}")
        rows = cur.fetchall()
        cur.close()

        records = []
        for row in rows:
            record = {}
            for i, col_name in enumerate(cols):
                record[col_name] = _serialize(row[i])
            records.append(record)

        out_file = EXPORT_DIR / f"{table}.json"
        out_file.write_text(
            json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"  OK {table:20s} -> {len(records)} filas")
        total += len(records)

    conn.close()
    print(f"\nDump completo: {total} filas en {len(TABLE_ORDER)} tablas\n")
    return total


def restore_to_local(local_url: str) -> int:
    """TRUNCATE + INSERT all tables from JSON into local PostgreSQL."""
    print(f"=== RESTORE a PostgreSQL local ===")
    print(f"URL: {local_url}\n")

    if not EXPORT_DIR.exists():
        print(f"ERROR: no existe {EXPORT_DIR}. Corre dump primero.")
        sys.exit(1)

    conn = _get_connection(local_url)
    conn.autocommit = False
    total = 0

    try:
        # TRUNCATE all tables in reverse order
        print("Limpiando tablas (TRUNCATE CASCADE)...")
        cur = conn.cursor()
        for table in reversed(TABLE_ORDER):
            if _table_exists(conn, table):
                cur.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")
        conn.commit()
        cur.close()
        print("  Tablas limpiadas.\n")

        # Insert in order
        print("Insertando datos:")
        for table in TABLE_ORDER:
            path = EXPORT_DIR / f"{table}.json"
            if not path.exists():
                print(f"  - {table:20s} -> sin archivo, salteado")
                continue

            records = json.loads(path.read_text(encoding="utf-8"))
            if not records:
                print(f"  - {table:20s} -> vacio (0 filas)")
                continue

            cols = _get_table_columns(conn, table)
            if not cols:
                print(f"  - {table:20s} -> sin columnas, salteado")
                continue

            cur = conn.cursor()
            cols_str = ", ".join(f'"{c}"' for c in cols)
            placeholders = ", ".join(["%s"] * len(cols))

            inserted = 0
            for record in records:
                values = [record.get(col) for col in cols]
                try:
                    cur.execute(
                        f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders})",
                        values,
                    )
                    inserted += 1
                except Exception as e:
                    # Skip individual row errors, continue with rest
                    conn.rollback()
                    # Re-begin transaction for next rows
                    cur.close()
                    cur = conn.cursor()
                    # Try without this record
                    continue

            conn.commit()
            cur.close()
            print(f"  OK {table:20s} -> {inserted} filas")
            total += inserted

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    print(f"\nRestore completo: {total} filas importadas a PostgreSQL local\n")
    return total


def main():
    if not PROD_DB_URL:
        print("ERROR: PROD_DATABASE_URL no definida.")
        print("Uso: $env:PROD_DATABASE_URL='postgresql://...' python dump_restore.py")
        sys.exit(1)

    # Step 1: Dump from Neon
    dump_from_production(PROD_DB_URL)

    # Step 2: Restore to local
    restore_to_local(LOCAL_DB_URL)

    print("¡Listo! Tu PostgreSQL local ahora tiene los datos de produccion.")
    print("Reinicia el backend: docker-compose up -d --build backend")


if __name__ == "__main__":
    main()
