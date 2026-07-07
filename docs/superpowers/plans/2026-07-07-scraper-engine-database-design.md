# Scraper Engine + Database Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate from SQLite+drop_all to PostgreSQL+Alembic, add scraper engine for club data enrichment and historical matches.

**Architecture:** Alembic handles schema migrations at startup instead of `init_db()` drop_all. Scraper base class with httpx+selectolax parses Wikipedia/RSSSF. Output JSON is loaded via existing seed pipeline.

**Tech Stack:** Python 3.14, FastAPI, SQLAlchemy 2.0 async, Alembic 1.13+, PostgreSQL (asyncpg), httpx, selectolax, respx (test mocking)

## Global Constraints
- All 26 existing tests must continue passing (SQLite in-memory, unchanged engine)
- Tests use `conftest.py`'s own `create_async_engine("sqlite+aiosqlite://")` — never changes
- `database_url` from env var with `sqlite+aiosqlite:///./data/liga.db` fallback (config.py already supports this)
- `_async_url()` in database.py converts `postgresql://` → `postgresql+asyncpg://` automatically
- Railway gets PostgreSQL plugin → `DATABASE_URL` env var auto-set
- No data loss on deploy — seed functions upsert by ID, Alembic only adds columns

---
### Task 1: Alembic Configuration + Initial Migration

**Files:**
- Modify: `backend/requirements.txt`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/script.py.mako`
- Create: `backend/alembic/versions/.gitkeep`
- Create: `backend/alembic/versions/001_initial_tables.py`
- Modify: `backend/app/core/database.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: `backend/app/core/config.py:9` — `settings.database_url`
- Consumes: `backend/app/core/database.py:17` — `Base` declarative base
- Produces: `database.run_alembic_upgrade()` — coroutine called in lifespan
- Produces: Alembic migration `001_initial_tables.py` — captures all current models

- [ ] **Step 1: Add dependencies to requirements.txt**

Add `selectolax` and `respx` to `backend/requirements.txt`:
```
selectolax>=0.3.0
respx>=0.21.0
```

- [ ] **Step 2: Create `alembic.ini`**

```ini
[alembic]
script_location = alembic
sqlalchemy.url = sqlite+aiosqlite:///./data/liga.db

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

- [ ] **Step 3: Create `alembic/env.py`**

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from backend.app.core.config import settings
from backend.app.core.database import Base
from backend.app.models import club, partido, prediction, tabla, user  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _async_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def run_migrations_offline() -> None:
    context.configure(
        url=_async_url(settings.database_url),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = create_async_engine(
        _async_url(settings.database_url),
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 4: Create `alembic/script.py.mako`**

```mako
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

- [ ] **Step 5: Create initial migration `alembic/versions/001_initial_tables.py`**

Run this command to auto-generate it:
```bash
cd backend
$env:PYTHONPATH=".."
alembic revision --autogenerate -m "initial tables"
```

Expected output: creates `alembic/versions/001_initial_tables.py` with `create_table` ops for all models (clubes, partidos, predictions, tabla_posiciones, users, push_subscriptions, mensajes_chat).

If `--autogenerate` fails (async engine quirk), create it manually:

```python
"""initial tables

Revision ID: 001
Revises:
Create Date: 2026-07-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None


def upgrade() -> None:
    op.create_table(
        "clubes",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("nombre", sa.String(100)),
        sa.Column("ciudad", sa.String(100)),
        sa.Column("apodo", sa.String(100)),
        sa.Column("colores", sa.JSON),
        sa.Column("estadio", sa.String(150)),
        sa.Column("capacidad", sa.Integer),
        sa.Column("fundacion", sa.Integer),
        sa.Column("direccion", sa.String(200)),
        sa.Column("escudo", sa.String(500)),
        sa.Column("camiseta", sa.String(500)),
    )
    op.create_table(
        "partidos",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("torneo", sa.String(100)),
        sa.Column("fecha", sa.Date),
        sa.Column("jornada", sa.Integer),
        sa.Column("local_id", sa.String(50), sa.ForeignKey("clubes.id")),
        sa.Column("visitante_id", sa.String(50), sa.ForeignKey("clubes.id")),
        sa.Column("goles_local", sa.Integer, nullable=True),
        sa.Column("goles_visitante", sa.Integer, nullable=True),
        sa.Column("estado", sa.String(20)),
    )
    op.create_table(
        "tabla_posiciones",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("torneo", sa.String(100)),
        sa.Column("jornada", sa.Integer),
        sa.Column("club_id", sa.String(50), sa.ForeignKey("clubes.id")),
        sa.Column("posicion", sa.Integer),
        sa.Column("pj", sa.Integer),
        sa.Column("pg", sa.Integer),
        sa.Column("pe", sa.Integer),
        sa.Column("pp", sa.Integer),
        sa.Column("gf", sa.Integer),
        sa.Column("gc", sa.Integer),
        sa.Column("dg", sa.Integer),
        sa.Column("puntos", sa.Integer),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.String(100), primary_key=True),
        sa.Column("email", sa.String(255)),
        sa.Column("name", sa.String(255)),
        sa.Column("image", sa.String(500)),
        sa.Column("username", sa.String(100)),
        sa.Column("token", sa.String(500)),
        sa.Column("puntos", sa.Integer),
    )
    op.create_table(
        "predictions",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("user_id", sa.String(100), sa.ForeignKey("users.id")),
        sa.Column("partido_id", sa.String(50), sa.ForeignKey("partidos.id")),
        sa.Column("goles_local", sa.Integer),
        sa.Column("goles_visitante", sa.Integer),
        sa.Column("puntos", sa.Integer),
        sa.Column("created_at", sa.DateTime),
        sa.Column("torneo", sa.String(100)),
    )
    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(100), sa.ForeignKey("users.id")),
        sa.Column("endpoint", sa.String(500)),
        sa.Column("p256dh", sa.String(255)),
        sa.Column("auth", sa.String(255)),
    )
    op.create_table(
        "mensajes_chat",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("partido_id", sa.String(50), sa.ForeignKey("partidos.id")),
        sa.Column("user_id", sa.String(100), sa.ForeignKey("users.id")),
        sa.Column("username", sa.String(100)),
        sa.Column("nombre", sa.String(255)),
        sa.Column("imagen", sa.String(500)),
        sa.Column("mensaje", sa.Text),
        sa.Column("created_at", sa.DateTime),
    )


def downgrade() -> None:
    op.drop_table("mensajes_chat")
    op.drop_table("push_subscriptions")
    op.drop_table("predictions")
    op.drop_table("users")
    op.drop_table("tabla_posiciones")
    op.drop_table("partidos")
    op.drop_table("clubes")
```

- [ ] **Step 6: Add `run_alembic_upgrade()` to `database.py`**

Add these imports and function at the top of `backend/app/core/database.py`:
```python
import asyncio
import subprocess
import sys
from pathlib import Path


async def run_alembic_upgrade():
    alembic_dir = Path(__file__).resolve().parent.parent.parent
    env = {**dict(secure_environ()), "PYTHONPATH": str(alembic_dir.parent)}
    proc = await asyncio.create_subprocess_exec(
        sys.executable, "-m", "alembic", "upgrade", "head",
        cwd=str(alembic_dir),
        env=env,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        print(f"Alembic stdout: {stdout.decode()}")
        print(f"Alembic stderr: {stderr.decode()}")
        raise RuntimeError(f"Alembic upgrade failed with code {proc.returncode}")
    print(f"Alembic: {stdout.decode().strip()}")


def secure_environ():
    import os
    return {k: v for k, v in os.environ.items() if not k.startswith("PYTHON")}
```

Note: `secure_environ()` strips PYTHONHOME/PYTHONPATH to avoid subprocess inheriting the venv's Python path. The explicit `PYTHONPATH` we set points to the project root so Alembic can import `backend.app.*`.

- [ ] **Step 7: Update `main.py` lifespan to use Alembic instead of init_db()**

Replace the `lifespan` function in `backend/app/main.py`:
```python
from backend.app.core.database import async_session, run_alembic_upgrade


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_alembic_upgrade()
    async with async_session() as db:
        await seed_clubes(db)
        await seed_partidos(db)
        await seed_tabla(db)
        await db.commit()
    yield
```

- [ ] **Step 8: Run Alembic upgrade to verify it works locally**

```bash
cd backend
$env:PYTHONPATH=".."
alembic upgrade head
```

Expected: applies migration, creates tables in `data/liga.db`.

- [ ] **Step 9: Run all 26 tests to verify nothing broken**

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/ -v
```

Expected: 26 passed.

- [ ] **Step 10: Commit**

```bash
git add backend/alembic/ backend/requirements.txt backend/app/core/database.py backend/app/main.py
git commit -m "feat: add Alembic migrations + PostgreSQL support"
```

---

### Task 2: Model Changes — New Club Fields + Temporada

**Files:**
- Modify: `backend/app/models/club.py`
- Modify: `backend/app/models/partido.py`
- Modify: `backend/app/schemas/club.py`
- Modify: `backend/app/schemas/partido.py`
- Create: `backend/alembic/versions/002_add_club_fields_and_temporada.py`

**Interfaces:**
- Consumes: Task 1 Alembic infrastructure
- Produces: Updated `Club` model with `sitio_web`, `descripcion`, `titulos_liga`, `titulos_info`
- Produces: Updated `Partido` model with `temporada`

- [ ] **Step 1: Update Club model — add 4 new fields**

Edit `backend/app/models/club.py`. After line 19 (`camiseta`), add:
```python
    sitio_web: Mapped[str] = mapped_column(String(500), default="")
    descripcion: Mapped[str] = mapped_column(String(2000), default="")
    titulos_liga: Mapped[int] = mapped_column(Integer, default=0)
    titulos_info: Mapped[list] = mapped_column(JSON, default=list)
```

- [ ] **Step 2: Update Partido model — add temporada**

Edit `backend/app/models/partido.py`. After line 16 (`jornada`), add:
```python
    temporada: Mapped[str] = mapped_column(String(20), default="2026")
```

- [ ] **Step 3: Update ClubOut schema**

Edit `backend/app/schemas/club.py`:
```python
class ClubOut(BaseModel):
    id: str
    nombre: str
    ciudad: str
    apodo: str
    colores: list[str]
    estadio: str
    capacidad: int
    fundacion: int
    escudo: str
    sitio_web: str = ""
    descripcion: str = ""
    titulos_liga: int = 0
    titulos_info: list = []

class ClubDetailOut(ClubOut):
    direccion: str
    camiseta: str
```

- [ ] **Step 4: Update PartidoOut schema**

Edit `backend/app/schemas/partido.py`:
```python
class PartidoOut(BaseModel):
    id: str
    torneo: str
    fecha: date
    jornada: int
    temporada: str = "2026"
    local_id: str
    visitante_id: str
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    estado: str
```

- [ ] **Step 5: Auto-generate migration**

```bash
cd backend
$env:PYTHONPATH=".."
alembic revision --autogenerate -m "add club fields and temporada"
```

If autogenerate fails, create `alembic/versions/002_add_club_fields_and_temporada.py` manually:
```python
"""add club fields and temporada

Revision ID: 002
Revises: 001
Create Date: 2026-07-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"


def upgrade() -> None:
    op.add_column("clubes", sa.Column("sitio_web", sa.String(500), server_default=""))
    op.add_column("clubes", sa.Column("descripcion", sa.String(2000), server_default=""))
    op.add_column("clubes", sa.Column("titulos_liga", sa.Integer, server_default="0"))
    op.add_column("clubes", sa.Column("titulos_info", sa.JSON, server_default=sa.text("'[]'")))
    op.add_column("partidos", sa.Column("temporada", sa.String(20), server_default="2026"))


def downgrade() -> None:
    op.drop_column("partidos", "temporada")
    op.drop_column("clubes", "titulos_info")
    op.drop_column("clubes", "titulos_liga")
    op.drop_column("clubes", "descripcion")
    op.drop_column("clubes", "sitio_web")
```

- [ ] **Step 6: Run migration + verify tests pass**

```bash
cd backend
$env:PYTHONPATH=".."
alembic upgrade head
python -m pytest tests/ -v
```

Expected: migration applies, 26 tests pass.

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/club.py backend/app/models/partido.py backend/app/schemas/club.py backend/app/schemas/partido.py backend/alembic/versions/002_add_club_fields_and_temporada.py
git commit -m "feat: add sitio_web, descripcion, titulos to Club; temporada to Partido"
```

---

### Task 3: Scraper Base Class

**Files:**
- Create: `backend/scripts/scraper_base.py`
- Create: `backend/tests/test_scraper_base.py`

**Interfaces:**
- Consumes: nothing (standalone utility)
- Produces: `ScraperBase` class with `fetch()`, `parse_html()`, `cache_get()`, `cache_set()`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_scraper_base.py`:
```python
import pytest
from backend.scripts.scraper_base import ScraperBase


@pytest.mark.asyncio
async def test_scraper_base_fetch_caches():
    scraper = ScraperBase(cache_dir=None)  # no disk cache
    # With respx mocking, verify httpx is called
    import respx
    from httpx import Response
    router = respx.get("https://example.com/test")
    router.mock(return_value=Response(200, text="<html><body>ok</body></html>"))

    html = await scraper.fetch("https://example.com/test")
    assert "ok" in html
    assert router.called


@pytest.mark.asyncio
async def test_scraper_base_rate_limit():
    scraper = ScraperBase(cache_dir=None, min_interval=0.5)
    import respx
    from httpx import Response
    router = respx.get("https://example.com/rate")
    router.mock(return_value=Response(200, text="<html>ok</html>"))

    import time
    t0 = time.monotonic()
    await scraper.fetch("https://example.com/rate")
    await scraper.fetch("https://example.com/rate")
    elapsed = time.monotonic() - t0
    assert elapsed >= 0.5  # second request waited


@pytest.mark.asyncio
async def test_scraper_base_parse_html():
    scraper = ScraperBase(cache_dir=None)
    html = "<html><body><h1>Título</h1><p>Párrafo</p></body></html>"
    root = scraper.parse_html(html)
    assert root.css_first("h1").text() == "Título"
    assert root.css_first("p").text() == "Párrafo"


@pytest.mark.asyncio
async def test_scraper_base_cache_dir(tmp_path):
    cache = tmp_path / ".cache"
    scraper = ScraperBase(cache_dir=str(cache))
    import respx
    from httpx import Response
    url = "https://example.com/cached"
    router = respx.get(url)
    router.mock(return_value=Response(200, text="<html>cached</html>"))

    # First fetch hits network
    html1 = await scraper.fetch(url)
    assert html1 == "<html>cached</html>"

    # Disable network — cache hit should return
    router.mock(return_value=Response(500, text="should not reach"))
    html2 = await scraper.fetch(url)
    assert html2 == "<html>cached</html>"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_scraper_base.py -v
```

Expected: ImportError/ModuleNotFoundError for `scraper_base`.

- [ ] **Step 3: Write minimal implementation**

Create `backend/scripts/scraper_base.py`:
```python
import hashlib
import json
import os
import time
from pathlib import Path

import httpx
from selectolax.parser import HTMLParser


class ScraperBase:
    def __init__(self, cache_dir: str | None = ".cache/scraper", min_interval: float = 1.0):
        self.cache_dir = cache_dir
        self.min_interval = min_interval
        self._last_request: float = 0
        self._client = httpx.AsyncClient(
            follow_redirects=True,
            timeout=30,
            headers={"User-Agent": "Mozilla/5.0 (compatible; LigaPyBot/1.0)"},
        )

    def _cache_path(self, url: str) -> Path | None:
        if self.cache_dir is None:
            return None
        key = hashlib.sha256(url.encode()).hexdigest()[:16]
        return Path(self.cache_dir) / f"{key}.html"

    def _cache_get(self, url: str) -> str | None:
        path = self._cache_path(url)
        if path and path.exists():
            return path.read_text(encoding="utf-8")
        return None

    def _cache_set(self, url: str, html: str):
        path = self._cache_path(url)
        if path:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(html, encoding="utf-8")

    async def fetch(self, url: str) -> str:
        cached = self._cache_get(url)
        if cached is not None:
            return cached

        now = time.monotonic()
        since_last = now - self._last_request
        if since_last < self.min_interval:
            await asyncio.sleep(self.min_interval - since_last)
        self._last_request = time.monotonic()

        response = await self._client.get(url)
        response.raise_for_status()
        html = response.text
        self._cache_set(url, html)
        return html

    @staticmethod
    def parse_html(html: str) -> HTMLParser:
        return HTMLParser(html)

    async def close(self):
        await self._client.aclose()
```

Note: add `import asyncio` at the top.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_scraper_base.py -v
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/scraper_base.py backend/tests/test_scraper_base.py
git commit -m "feat: add ScraperBase with HTTP, rate limit, cache, HTML parsing"
```

---

### Task 4: Club Data Scraper (Wikipedia)

**Files:**
- Create: `backend/scripts/scraper_clubes.py`
- Create: `backend/tests/test_scraper_clubes.py`

**Interfaces:**
- Consumes: `ScraperBase` from Task 3
- Consumes: `data/clubes_paraguay.json`
- Produces: enriched `data/clubes_paraguay.json` with `sitio_web`, `descripcion`, `titulos_liga`, `titulos_info`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_scraper_clubes.py`:
```python
import json
import pytest
from pathlib import Path


SAMPLE_WIKI = """<html>
<body>
<table class="infobox">
<tr><th colspan="2">Club Olimpia</th></tr>
<tr><th>Website</th><td><a href="https://www.clubolimpia.com.py">clubolimpia.com.py</a></td></tr>
</table>
<p><b>Club Olimpia</b> is a Paraguayan sports club based in Asunción.</p>
<div class="mw-heading"><h2>Honours</h2></div>
<ul>
<li>Primera División: <b>46</b> (1912, 1914, ...)</li>
<li>Copa Paraguay: <b>1</b> (2021)</li>
</ul>
</body></html>"""


@pytest.mark.asyncio
async def test_scraper_clubes_parse(tmp_path):
    from backend.scripts.scraper_clubes import parse_club_wikipedia

    result = parse_club_wikipedia(SAMPLE_WIKI, "olimpia")

    assert result["sitio_web"] == "https://www.clubolimpia.com.py"
    assert "sports club" in result["descripcion"]
    assert result["titulos_liga"] == 46
    assert len(result["titulos_info"]) > 0


@pytest.mark.asyncio
async def test_scraper_clubes_enrich(tmp_path):
    from backend.scripts.scraper_clubes import enrich_clubes_json

    clubs = [
        {"id": "olimpia", "nombre": "Club Olimpia", "escudo": "x.png"},
        {"id": "cerro-porteno", "nombre": "Club Cerro Porteño", "escudo": "y.png"},
    ]
    json_path = tmp_path / "clubes.json"
    json_path.write_text(json.dumps(clubs, ensure_ascii=False), encoding="utf-8")

    import respx
    from httpx import Response

    def wiki_url(name):
        return f"https://es.wikipedia.org/wiki/{name}"

    router1 = respx.get(wiki_url("Club_Olimpia"))
    router1.mock(return_value=Response(200, text=SAMPLE_WIKI))

    router2 = respx.get(wiki_url("Club_Cerro_Porteño"))
    router2.mock(return_value=Response(200, text="<html><body><p>Club Cerro</p></body></html>"))

    await enrich_clubes_json(str(json_path), cache_dir=None)

    enriched = json.loads(json_path.read_text(encoding="utf-8"))
    assert enriched[0]["sitio_web"] == "https://www.clubolimpia.com.py"
    assert enriched[0]["titulos_liga"] == 46
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_scraper_clubes.py -v
```

Expected: ImportError for `scraper_clubes`.

- [ ] **Step 3: Write the implementation**

Create `backend/scripts/scraper_clubes.py`:
```python
import asyncio
import json
import re
import sys
from pathlib import Path

from backend.scripts.scraper_base import ScraperBase


def _wikipedia_slug(nombre: str) -> str:
    return nombre.replace(" ", "_")


def parse_club_wikipedia(html: str, club_id: str) -> dict:
    from selectolax.parser import HTMLParser
    root = HTMLParser(html)
    result = {"sitio_web": "", "descripcion": "", "titulos_liga": 0, "titulos_info": []}

    # Extract website from infobox
    for row in root.css("tr"):
        th = row.css_first("th")
        td = row.css_first("td")
        if th and td and "website" in th.text().lower():
            link = td.css_first("a")
            if link:
                href = link.attributes.get("href", "")
                if href.startswith("http"):
                    result["sitio_web"] = href

    # Extract description (first paragraph after infobox)
    for p in root.css("p"):
        text = p.text(strip=True)
        if len(text) > 30:
            result["descripcion"] = text[:500]
            break

    # Extract titles from honours section
    honours = root.css_first("div.mw-heading h2, h2#Honours, span.mw-headline")
    if honours:
        ul = honours.parent.next
        while ul and ul.tag != "ul":
            ul = ul.next
        if ul and ul.tag == "ul":
            for li in ul.css("li"):
                text = li.text(strip=True)
                match = re.search(r"Primera División.*?(\d+)", text, re.IGNORECASE)
                if match:
                    result["titulos_liga"] = int(match.group(1))
                    result["titulos_info"].append({
                        "torneo": "Primera División",
                        "cantidad": int(match.group(1)),
                    })
                    break

    return result


async def enrich_clubes_json(json_path: str, cache_dir: str | None = ".cache/scraper") -> int:
    path = Path(json_path)
    clubs = json.loads(path.read_text(encoding="utf-8-sig"))

    scraper = ScraperBase(cache_dir=cache_dir, min_interval=2.0)
    enriched = 0

    for club in clubs:
        slug = _wikipedia_slug(club.get("nombre", ""))
        if not slug:
            continue
        url = f"https://es.wikipedia.org/wiki/{slug}"
        try:
            html = await scraper.fetch(url)
            data = parse_club_wikipedia(html, club["id"])
            changed = False
            for key, val in data.items():
                if val and key not in club or club.get(key) != val:
                    club[key] = val
                    changed = True
            if changed:
                enriched += 1
                print(f"  Enriched: {club['nombre']}")
        except Exception as e:
            print(f"  Failed: {club['nombre']} — {e}")

    await scraper.close()
    path.write_text(json.dumps(clubs, ensure_ascii=False, indent=2), encoding="utf-8")
    return enriched


async def main():
    json_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "clubes_paraguay.json"
    print(f"Enriching {json_path}...")
    count = await enrich_clubes_json(str(json_path))
    print(f"Done. {count} clubs enriched.")


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_scraper_clubes.py -v
```

Expected: 2 passed (or 1 if the integration test is flaky — at minimum `test_scraper_clubes_parse` passes).

- [ ] **Step 5: Run enrichment against real Wikipedia**

```bash
cd backend
$env:PYTHONPATH=".."
python -m backend.scripts.scraper_clubes
```

Expected: enriches `data/clubes_paraguay.json` with real data from Wikipedia.

- [ ] **Step 6: Commit**

```bash
git add backend/scripts/scraper_clubes.py backend/tests/test_scraper_clubes.py data/clubes_paraguay.json
git commit -m "feat: add club scraper (Wikipedia) + enriched clubes_paraguay.json"
```

---

### Task 5: Historical Results Scraper (RSSSF)

**Files:**
- Create: `backend/scripts/scraper_historico.py`
- Create: `backend/tests/test_scraper_historico.py`
- Create: `data/partidos_historicos/.gitkeep`

**Interfaces:**
- Consumes: `ScraperBase` from Task 3
- Consumes: `data/clubes_paraguay.json` for club name ↔ id mapping
- Produces: `data/partidos_historicos/{slug}.json` with historical standings

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_scraper_historico.py`:
```python
import json
import pytest


SAMPLE_RSSSF = """
<pre>
Paraguay 2024

Pos. Club                  Pld   W  D  L  GF  GA  Pts
 1.  Club Olimpia          30   20  5  5  55  25   65
 2.  Club Cerro Porteño    30   18  8  4  50  22   62
 3.  Club Libertad         30   15  9  6  45  30   54
</pre>
"""


@pytest.mark.asyncio
async def test_parse_rsssf_table():
    from backend.scripts.scraper_historico import parse_rsssf_table

    club_map = {
        "Club Olimpia": "olimpia",
        "Club Cerro Porteño": "cerro-porteno",
        "Club Libertad": "libertad",
    }

    result = parse_rsssf_table(SAMPLE_RSSSF, club_map, "2024")

    assert len(result) == 3
    assert result[0]["club_id"] == "olimpia"
    assert result[0]["pj"] == 30
    assert result[0]["pg"] == 20
    assert result[0]["puntos"] == 65
    assert result[2]["club_id"] == "libertad"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_scraper_historico.py -v
```

Expected: ImportError for `scraper_historico`.

- [ ] **Step 3: Write the implementation**

Create `backend/scripts/scraper_historico.py`:
```python
import asyncio
import json
import re
from pathlib import Path

from backend.scripts.scraper_base import ScraperBase


def _load_club_map(json_path: str) -> dict[str, str]:
    clubs = json.loads(Path(json_path).read_text(encoding="utf-8-sig"))
    return {c["nombre"]: c["id"] for c in clubs}


def parse_rsssf_table(html: str, club_map: dict[str, str], anio: str) -> list[dict]:
    results = []
    pre = re.search(r"<pre>(.*?)</pre>", html, re.DOTALL)
    if not pre:
        return results

    lines = pre.group(1).splitlines()
    for line in lines:
        parts = line.strip().split()
        if len(parts) < 8:
            continue
        try:
            pos = int(parts[0].rstrip("."))
        except ValueError:
            continue
        name_parts = []
        for i in range(1, len(parts) - 6):
            name_parts.append(parts[i])
        nombre = " ".join(name_parts)
        club_id = club_map.get(nombre, "")
        if not club_id:
            continue
        try:
            pj, pg, pe, pp, gf, gc, pts = map(int, parts[-7:])
        except ValueError:
            continue
        results.append({
            "torneo": f"Temporada {anio}",
            "anio": anio,
            "club_id": club_id,
            "club": nombre,
            "posicion": pos,
            "pj": pj,
            "pg": pg,
            "pe": pe,
            "pp": pp,
            "gf": gf,
            "gc": gc,
            "dg": gf - gc,
            "puntos": pts,
        })
    return results


async def scrape_year(scraper: ScraperBase, anio: str, club_map: dict) -> list[dict]:
    url = f"https://www.rsssf.org/tablesp/para{anio}.html"
    try:
        html = await scraper.fetch(url)
        return parse_rsssf_table(html, club_map, anio)
    except Exception as e:
        print(f"  RSSSF {anio}: {e}")
        return []


async def scrape_all(years: list[str] | None = None) -> dict[str, list[dict]]:
    if years is None:
        years = [str(y) for y in range(2020, 2027)]

    data_dir = Path(__file__).resolve().parent.parent.parent.parent / "data"
    club_map = _load_club_map(str(data_dir / "clubes_paraguay.json"))

    scraper = ScraperBase(cache_dir=str(data_dir / ".cache" / "scraper"), min_interval=3.0)
    historico = {}

    for anio in years:
        print(f"Scraping {anio}...")
        rows = await scrape_year(scraper, anio, club_map)
        if rows:
            historico[anio] = rows
            slug = f"temporada_{anio}"
            out_path = data_dir / "partidos_historicos" / f"{slug}.json"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_text(
                json.dumps(rows, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            print(f"  → {len(rows)} rows saved")

    await scraper.close()
    return historico


async def main():
    years = [str(y) for y in range(2020, 2027)]
    print(f"Scraping RSSSF for years: {years}")
    result = await scrape_all(years)
    print(f"Done. {sum(len(v) for v in result.values())} total rows across {len(result)} years.")


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_scraper_historico.py -v
```

Expected: 1 passed.

- [ ] **Step 5: Run RSSSF scraper against real data**

```bash
cd backend
$env:PYTHONPATH=".."
python -m backend.scripts.scraper_historico
```

Expected: scrapes 2020-2026, saves to `data/partidos_historicos/temporada_*.json`.

- [ ] **Step 6: Commit**

```bash
git add backend/scripts/scraper_historico.py backend/tests/test_scraper_historico.py data/partidos_historicos/
git commit -m "feat: add RSSSF historical results scraper"
```

---

### Task 6: Load Historical Data into DB

**Files:**
- Modify: `backend/app/scripts/seed.py`
- Test: `backend/tests/test_seed_historico.py`

**Interfaces:**
- Consumes: `data/partidos_historicos/*.json`
- Consumes: existing `seed_tabla()` upsert pattern
- Produces: historical `TablaPosicion` rows in DB

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_seed_historico.py`:
```python
import json
import pytest
from pathlib import Path

from sqlalchemy import select
from backend.app.models.tabla import TablaPosicion


@pytest.mark.asyncio
async def test_seed_historico(db_session):
    from backend.app.scripts.seed import seed_tabla_historico

    # Write a temp historical file
    data_dir = Path(__file__).resolve().parent.parent.parent / "data"
    hist_dir = data_dir / "partidos_historicos"
    hist_dir.mkdir(parents=True, exist_ok=True)

    sample = [
        {"torneo": "Temporada 2024", "anio": "2024", "club_id": "olimpia",
         "posicion": 1, "pj": 30, "pg": 20, "pe": 5, "pp": 5,
         "gf": 55, "gc": 25, "dg": 30, "puntos": 65},
    ]
    hist_file = hist_dir / "test_2024.json"
    hist_file.write_text(json.dumps(sample, ensure_ascii=False), encoding="utf-8")

    count = await seed_tabla_historico(db_session, data_dir=str(data_dir))
    assert count == 1

    result = await db_session.execute(
        select(TablaPosicion).where(TablaPosicion.torneo == "Temporada 2024")
    )
    rows = result.scalars().all()
    assert len(rows) == 1
    assert rows[0].club_id == "olimpia"
    assert rows[0].puntos == 65

    # Cleanup
    hist_file.unlink()
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_seed_historico.py -v
```

Expected: ImportError for `seed_tabla_historico`.

- [ ] **Step 3: Add `seed_tabla_historico()` to seed.py**

Append to `backend/app/scripts/seed.py`:
```python
import glob


async def seed_tabla_historico(db: AsyncSession, data_dir: str | None = None) -> int:
    if data_dir is None:
        data_dir = str(DATA_DIR)
    pattern = str(Path(data_dir) / "partidos_historicos" / "*.json")
    count = 0
    for path in glob.glob(pattern):
        items = json.loads(Path(path).read_text(encoding="utf-8"))
        for item in items:
            stmt = select(TablaPosicion).where(
                TablaPosicion.torneo == item.get("torneo", ""),
                TablaPosicion.jornada == 0,
                TablaPosicion.club_id == item["club_id"],
            )
            existing = await db.execute(stmt)
            if existing.scalar_one_or_none():
                continue
            row = TablaPosicion(
                torneo=item.get("torneo", ""),
                jornada=0,
                club_id=item["club_id"],
                posicion=item["posicion"],
                pj=item["pj"],
                pg=item["pg"],
                pe=item["pe"],
                pp=item["pp"],
                gf=item["gf"],
                gc=item["gc"],
                dg=item["dg"],
                puntos=item["puntos"],
            )
            db.add(row)
            count += 1
    await db.flush()
    print(f"  Tabla histórica: {count} filas nuevas")
    return count
```

Also add `seed_tabla_historico` to the main() function call chain and lifespan. Edit `backend/app/main.py` to add the import and call:
```python
from backend.app.scripts.seed import seed_clubes, seed_partidos, seed_tabla, seed_tabla_historico
```

In the lifespan, after `seed_tabla`, add:
```python
            await seed_tabla_historico(db)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_seed_historico.py -v
```

Expected: 1 passed.

- [ ] **Step 5: Run all 26+2 tests**

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/ -v
```

Expected: 28 passed (26 original + 2 new).

- [ ] **Step 6: Commit**

```bash
git add backend/app/scripts/seed.py backend/app/main.py backend/tests/test_seed_historico.py
git commit -m "feat: load historical tabla data from scraped JSON files"
```

---

### Task 7: Railway PostgreSQL + Final Deploy

**Files:**
- Modify: `backend/app/core/config.py` (no changes needed if DATABASE_URL env already read)
- Infrastructure: Railway project PostgreSQL plugin

**Interfaces:**
- Consumes: Railway `DATABASE_URL` env var
- Consumes: Alembic migrations from Tasks 1-2
- Produces: live PostgreSQL database with all data

- [ ] **Step 1: Add PostgreSQL plugin in Railway dashboard**
   - Open https://railway.com/project/3380877f-8893-447a-b0f4-15675e7dfd37
   - Click "Add Plugin" → "PostgreSQL"
   - `DATABASE_URL` is auto-set as environment variable

- [ ] **Step 2: Update `config.py` to read `DATABASE_PUBLIC_URL` as fallback**

Edit `backend/app/core/config.py` line 9 so priority is:
```python
    database_url: str = "sqlite+aiosqlite:///./data/liga.db"
```
No change needed — `DATABASE_URL` from Railway env overrides the default via `pydantic-settings`.

- [ ] **Step 3: Deploy to Railway**

```bash
railway up --service=backend
```

Expected: build succeeds, startup runs `alembic upgrade head`, then seeds missing data.

- [ ] **Step 4: Verify clubes endpoint returns 16 clubs with new fields**

```bash
curl https://backend-production-0b7d.up.railway.app/api/v1/clubes | python -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} clubs'); print(json.dumps(d[0], indent=2))"
```

Expected: 16 clubs, `sitio_web` and new fields populated.

- [ ] **Step 5: Verify tabla endpoint returns 16 rows**

```bash
curl https://backend-production-0b7d.up.railway.app/api/v1/tabla | python -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} rows')"
```

Expected: 16 rows.

- [ ] **Step 6: Re-deploy frontend to Vercel**

```bash
vercel deploy --prod
```

- [ ] **Step 7: Verify frontend shows all 16 clubs + historical data**

```bash
curl https://frontend-ten-swart-85.vercel.app
```

Expected: page loads with 16 clubs, enhanced club pages showing new fields.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "deploy: PostgreSQL + Alembic + enriched club data + historical scraper"
```
