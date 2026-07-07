# Scraper Engine + Database Migration — Design Spec

## Overview
Migrate from SQLite to PostgreSQL on Railway, add Alembic migrations, build a scraper engine to enrich club data (websites, history, titles) and import historical match results from RSSSF/Wikipedia.

## Architecture

### Database Layer
```
Local Dev: SQLite (sqlite+aiosqlite:///./liga.db)
Tests:     SQLite in-memory (sqlite+aiosqlite://)
Production: PostgreSQL on Railway (via DATABASE_URL env var)
Migrator:  Alembic (async-compatible)
```

**Config precedence** (backend/app/core/config.py):
1. `DATABASE_URL` env var (Railway PostgreSQL)
2. `sqlite+aiosqlite:///./liga.db` fallback for local dev

### Alembic Setup
```
backend/
  alembic/
    env.py           ← async SQLAlchemy, reads config.database_url
    script.py.mako
    versions/        ← auto-generated migration files
  alembic.ini        ← template, url overridden at runtime
```

**Startup flow** (main.py lifespan):
1. Run `alembic upgrade head` via subprocess to apply pending migrations
2. Seed missing data (clubes, partidos, tabla) as before — safe because seed functions upsert by ID

### Scraper Engine

```
backend/scripts/
  __init__.py
  scraper_base.py       → AsyncClient + rate limit + disk cache + selectolax parsing
  scraper_clubes.py     → Wikipedia → club data enrichment
  scraper_historico.py  → RSSSF → historical match results
  seed.py               ← existing, updated to handle new fields
```

**scraper_base.py**:
- `httpx.AsyncClient` with 1 req/s rate limiter, 3 retry attempts
- `.cache/scraper/` directory for HTML cache (avoids re-fetching in dev)
- `selectolax` parser (Rust-based, ~10x faster than BeautifulSoup)

**scraper_clubes.py**:
For each club in `clubes_paraguay.json`, fetch Wikipedia page:
- Parse `sitio_web` from infobox
- Parse `descripcion` from first paragraph
- Parse `titulos_liga` and `titulos_info` from honours/achievements table
- Output: enriched `clubes_paraguay.json`

**scraper_historico.py**:
Parse RSSSF Paraguay yearly tables:
- Extract per-season standings: `{torneo, año, club, pos, pj, pg, pe, pp, gf, gc, pts}`
- Output: `data/partidos_historicos/{torneo_slug}.json`
- Covers 1906–2025

## Models

### Club — New Fields
```python
sitio_web: str          # Official website URL
descripcion: str        # Short history paragraph
titulos_liga: int       # First division title count
titulos_info: JSON      # [{"torneo": "...", "anio": YYYY, "cantidad": N}, ...]
```

### Partido — New Field
```python
temporada: str          # "1906", "2005", "2024" — enables historical filtering
```

## Seed Strategy

| Data | Source | Method |
|------|--------|--------|
| Clubes | `clubes_paraguay.json` | Upsert by ID |
| Partidos demo | `partidos_demo.json` | Upsert by ID |
| Tabla demo | `tabla_posiciones_demo.json` | Upsert by (torneo, jornada, club_id) |
| Partidos históricos | `partidos_historicos/*.json` | Upsert by ID |

No data loss on deploy — existing rows are preserved, only missing rows are inserted.

## API Impact
No breaking changes. Existing endpoints return same shapes with new fields populated where available.

## Railway PostgreSQL Setup
1. In Railway dashboard, add **PostgreSQL plugin** to the project
2. `DATABASE_URL` and `DATABASE_PUBLIC_URL` env vars are auto-set
3. No code changes needed — `config.py` reads `DATABASE_URL` with SQLite fallback

## Testing
- All 26 existing tests must continue passing (SQLite in-memory, untouched)
- New tests for scraper parsing (mock HTTP responses via `respx` or `httpx` mock transport)
- New tests for Alembic migrations (verify upgrade + downgrade with SQLite)
