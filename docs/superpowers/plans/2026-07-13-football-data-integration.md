# Football-Data.org Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar datos reales de la liga paraguaya desde Football-Data.org, reemplazando datos mock con fallback automatico.

**Architecture:** Servicio directo `FootballDataService` que consume la API de Football-Data.org, mapea los datos a modelos locales, y sincroniza con la DB cada 10 minutos via cron job.

**Tech Stack:** Python 3.12+, httpx, SQLAlchemy async, FastAPI, pytest, respx (para mocks de httpx)

## Global Constraints

- Python 3.12+
- FastAPI >= 0.115.0
- SQLAlchemy[asyncio] >= 2.0.0
- httpx >= 0.27.0
- pytest >= 8.0.0
- respx >= 0.21.0
- API key de Football-Data.org se guarda en `.env` como `FOOTBALL_DATA_API_KEY`
- Rate limit: 10 requests/min (free tier)
- Competition code para liga paraguaya: verificar `PA1` o `PD1`

## File Structure

```
backend/app/
├── services/
│   ├── football_config.py       # Configuracion y mapeos
│   ├── football_data_service.py # Servicio principal
│   └── football_mapper.py       # Transformacion API -> modelos
├── models/
│   └── goleador.py              # Modelo de goleadores
├── schemas/
│   └── goleador.py              # Schemas Pydantic
├── api/
│   └── goleadores.py            # Endpoints
└── core/
    └── database.py              # Ya existe, registrar modelo

backend/tests/
├── test_football_config.py
├── test_goleador_model.py
├── test_goleador_schema.py
├── test_football_data_service.py
├── test_football_mapper.py
└── test_goleadores_api.py
```

---

### Task 1: Configuracion y Mapeo de IDs

**Files:**
- Create: `backend/app/services/football_config.py`
- Test: `backend/tests/test_football_config.py`

**Interfaces:**
- Consumes: Ninguno (primera task)
- Produces: `TEAM_MAP`, `API_BASE_URL`, `COMPETITION_CODE`, `get_api_key()`

- [ ] **Step 1: Crear test para la configuracion**

```python
# backend/tests/test_football_config.py
import os
import pytest
from backend.app.services.football_config import TEAM_MAP, API_BASE_URL, COMPETITION_CODE, get_api_key

def test_team_map_has_12_clubs():
    assert len(TEAM_MAP) == 12

def test_team_map_values_are_strings():
    for key, value in TEAM_MAP.items():
        assert isinstance(value, str)

def test_api_base_url_is_valid():
    assert API_BASE_URL.startswith("https://")

def test_competition_code_is_string():
    assert isinstance(COMPETITION_CODE, str)
    assert len(COMPETITION_CODE) > 0

def test_get_api_key_reads_env(monkeypatch):
    monkeypatch.setenv("FOOTBALL_DATA_API_KEY", "test-key-123")
    assert get_api_key() == "test-key-123"

def test_get_api_key_raises_if_missing(monkeypatch):
    monkeypatch.delenv("FOOTBALL_DATA_API_KEY", raising=False)
    with pytest.raises(ValueError):
        get_api_key()
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `python -m pytest backend/tests/test_football_config.py -v`
Expected: FAIL con "cannot import name 'TEAM_MAP'"

- [ ] **Step 3: Crear el modulo de configuracion**

```python
# backend/app/services/football_config.py
import os

API_BASE_URL = "https://api.football-data.org/v4"
COMPETITION_CODE = "PA1"

TEAM_MAP = {
    "Club Olimpia": "olimpia",
    "Cerro Porteno": "cerro-porteno",
    "Club Libertad": "libertad",
    "Club Guarani": "guarani",
    "Club Nacional": "nacional",
    "Sportivo Luqueno": "luqueno",
    "Club Sportivo San Lorenzo": "san-lorenzo",
    "Deportivo Santani": "santani",
    "Sportivo Trinidense": "trinidense",
    "General Diaz": "general-diaz",
    "Deportivo Capiata": "deportivo-capiata",
    "Ameliano": "ameliano",
}

ENDPOINTS = {
    "matches": f"/competitions/{COMPETITION_CODE}/matches",
    "standings": f"/competitions/{COMPETITION_CODE}/standings",
    "scorers": f"/competitions/{COMPETITION_CODE}/scorers",
}

def get_api_key() -> str:
    key = os.environ.get("FOOTBALL_DATA_API_KEY")
    if not key:
        raise ValueError(
            "FOOTBALL_DATA_API_KEY no esta configurada. "
            "Obteni tu key gratis en https://www.football-data.org/client/register"
        )
    return key
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `python -m pytest backend/tests/test_football_config.py -v`
Expected: 6 tests PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/football_config.py backend/tests/test_football_config.py
git commit -m "feat(football-data): add config and team ID mapping"
```

---

### Task 2: Modelo de Goleadores

**Files:**
- Create: `backend/app/models/goleador.py`
- Test: `backend/tests/test_goleador_model.py`

**Interfaces:**
- Consumes: `Base` de `backend/app/core/database`
- Produces: `Goleador` model class

- [ ] **Step 1: Crear test para el modelo**

```python
# backend/tests/test_goleador_model.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from backend.app.core.database import Base
from backend.app.models.goleador import Goleador

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_goleador_creation(db_session):
    goleador = Goleador(
        id="test-001",
        nombre="Juan Perez",
        club_id="olimpia",
        goles=10,
        asistencias=5,
        torneo="Apertura 2026",
        temporada="2026"
    )
    db_session.add(goleador)
    db_session.commit()
    result = db_session.query(Goleador).filter_by(id="test-001").first()
    assert result is not None
    assert result.nombre == "Juan Perez"
    assert result.goles == 10

def test_goleador_defaults(db_session):
    goleador = Goleador(
        id="test-002",
        nombre="Maria Lopez",
        club_id="libertad",
        torneo="Apertura 2026",
        temporada="2026"
    )
    db_session.add(goleador)
    db_session.commit()
    result = db_session.query(Goleador).filter_by(id="test-002").first()
    assert result.goles == 0
    assert result.asistencias == 0
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `python -m pytest backend/tests/test_goleador_model.py -v`
Expected: FAIL con "ModuleNotFoundError"

- [ ] **Step 3: Crear el modelo**

```python
# backend/app/models/goleador.py
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base

class Goleador(Base):
    __tablename__ = "goleadores"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    club_id: Mapped[str] = mapped_column(ForeignKey("clubes.id"))
    goles: Mapped[int] = mapped_column(Integer, default=0)
    asistencias: Mapped[int] = mapped_column(Integer, default=0)
    torneo: Mapped[str] = mapped_column(String(100))
    temporada: Mapped[str] = mapped_column(String(20))
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `python -m pytest backend/tests/test_goleador_model.py -v`
Expected: 2 tests PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/goleador.py backend/tests/test_goleador_model.py
git commit -m "feat(football-data): add Goleador model"
```

---

### Task 3: Schema de Goleadores

**Files:**
- Create: `backend/app/schemas/goleador.py`
- Test: `backend/tests/test_goleador_schema.py`

**Interfaces:**
- Consumes: `Goleador` model
- Produces: `GoleadorOut`, `GoleadoresListOut` schemas

- [ ] **Step 1: Crear test para los schemas**

```python
# backend/tests/test_goleador_schema.py
from backend.app.schemas.goleador import GoleadorOut, GoleadoresListOut

def test_goleador_out_from_dict():
    data = {
        "id": "test-001",
        "nombre": "Juan Perez",
        "club_id": "olimpia",
        "club_nombre": "Club Olimpia",
        "goles": 10,
        "asistencias": 5,
        "torneo": "Apertura 2026",
        "temporada": "2026"
    }
    goleador = GoleadorOut(**data)
    assert goleador.id == "test-001"
    assert goleador.goles == 10

def test_goleadores_list_out():
    goleadores = [
        GoleadorOut(
            id=f"test-{i}",
            nombre=f"Jugador {i}",
            club_id="olimpia",
            club_nombre="Club Olimpia",
            goles=10 - i,
            asistencias=i,
            torneo="Apertura 2026",
            temporada="2026"
        )
        for i in range(3)
    ]
    result = GoleadoresListOut(goleadores=goleadores, total=3)
    assert result.total == 3
    assert len(result.goleadores) == 3
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `python -m pytest backend/tests/test_goleador_schema.py -v`
Expected: FAIL con "ModuleNotFoundError"

- [ ] **Step 3: Crear los schemas**

```python
# backend/app/schemas/goleador.py
from pydantic import BaseModel

class GoleadorOut(BaseModel):
    id: str
    nombre: str
    club_id: str
    club_nombre: str = ""
    goles: int = 0
    asistencias: int = 0
    torneo: str
    temporada: str

    class Config:
        from_attributes = True

class GoleadoresListOut(BaseModel):
    goleadores: list[GoleadorOut]
    total: int
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `python -m pytest backend/tests/test_goleador_schema.py -v`
Expected: 2 tests PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/app/schemas/goleador.py backend/tests/test_goleador_schema.py
git commit -m "feat(football-data): add Goleador schemas"
```

---

### Task 4: FootballDataService - Fetch Partidos

**Files:**
- Create: `backend/app/services/football_data_service.py`
- Test: `backend/tests/test_football_data_service.py`

**Interfaces:**
- Consumes: `TEAM_MAP`, `API_BASE_URL`, `ENDPOINTS`, `get_api_key()` de `football_config.py`
- Produces: `FootballDataService.fetch_partidos()`, `fetch_tabla()`, `fetch_goleadores()`

- [ ] **Step 1: Crear test para fetch_partidos**

```python
# backend/tests/test_football_data_service.py
import pytest
import respx
import httpx
from backend.app.services.football_data_service import FootballDataService

@pytest.fixture
def mock_api():
    with respx.mock:
        yield

def test_fetch_partidos_success(mock_api):
    mock_response = {
        "matches": [
            {
                "id": 12345,
                "homeTeam": {"name": "Club Olimpia"},
                "awayTeam": {"name": "Cerro Porteno"},
                "score": {"fullTime": {"home": 2, "away": 1}},
                "status": "FINISHED",
                "matchday": 1,
                "utcDate": "2026-01-31T20:00:00Z"
            }
        ]
    }
    respx.get("https://api.football-data.org/v4/competitions/PA1/matches").mock(
        return_value=httpx.Response(200, json=mock_response)
    )
    result = FootballDataService.fetch_partidos()
    assert len(result) == 1
    assert result[0]["local"] == "olimpia"
    assert result[0]["visitante"] == "cerro-porteno"
    assert result[0]["goles_local"] == 2

def test_fetch_partidos_maps_team_names(mock_api):
    mock_response = {
        "matches": [
            {
                "id": 12346,
                "homeTeam": {"name": "Club Libertad"},
                "awayTeam": {"name": "Sportivo Luqueno"},
                "score": {"fullTime": {"home": 0, "away": 0}},
                "status": "FINISHED",
                "matchday": 1,
                "utcDate": "2026-01-31T22:00:00Z"
            }
        ]
    }
    respx.get("https://api.football-data.org/v4/competitions/PA1/matches").mock(
        return_value=httpx.Response(200, json=mock_response)
    )
    result = FootballDataService.fetch_partidos()
    assert result[0]["local"] == "libertad"
    assert result[0]["visitante"] == "luqueno"
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `python -m pytest backend/tests/test_football_data_service.py -v`
Expected: FAIL con "ModuleNotFoundError"

- [ ] **Step 3: Crear el servicio**

```python
# backend/app/services/football_data_service.py
import logging
from datetime import datetime
from typing import Optional
import httpx
from backend.app.services.football_config import API_BASE_URL, ENDPOINTS, TEAM_MAP, get_api_key

logger = logging.getLogger(__name__)

class FootballDataError(Exception):
    pass

class RateLimitError(FootballDataError):
    pass

class DataNotFoundError(FootballDataError):
    pass

class FootballDataService:

    @staticmethod
    def _make_request(endpoint: str) -> dict:
        api_key = get_api_key()
        url = f"{API_BASE_URL}{endpoint}"
        headers = {"X-Auth-Token": api_key}
        try:
            response = httpx.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                raise RateLimitError("Rate limit excedido.")
            elif e.response.status_code == 404:
                raise DataNotFoundError(f"No se encontraron datos para: {endpoint}")
            else:
                raise FootballDataError(f"Error HTTP {e.response.status_code}")

    @staticmethod
    def fetch_partidos() -> list[dict]:
        data = FootballDataService._make_request(ENDPOINTS["matches"])
        partidos = []
        for match in data.get("matches", []):
            home_name = match["homeTeam"]["name"]
            away_name = match["awayTeam"]["name"]
            local_id = TEAM_MAP.get(home_name, home_name.lower().replace(" ", "-"))
            visitante_id = TEAM_MAP.get(away_name, away_name.lower().replace(" ", "-"))
            score = match.get("score", {}).get("fullTime", {})
            status_map = {
                "FINISHED": "finalizado",
                "IN_PLAY": "en_vivo",
                "PAUSED": "en_vivo",
                "SCHEDULED": "programado",
                "TIMED": "programado",
            }
            partidos.append({
                "id_api": match["id"],
                "local": local_id,
                "visitante": visitante_id,
                "goles_local": score.get("home"),
                "goles_visitante": score.get("away"),
                "estado": status_map.get(match.get("status", ""), "programado"),
                "jornada": match.get("matchday", 1),
                "fecha": match.get("utcDate", ""),
            })
        return partidos
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `python -m pytest backend/tests/test_football_data_service.py -v`
Expected: 2 tests PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/football_data_service.py backend/tests/test_football_data_service.py
git commit -m "feat(football-data): add FootballDataService with fetch_partidos"
```

---

### Task 5: FootballMapper - Transformar Datos

**Files:**
- Create: `backend/app/services/football_mapper.py`
- Test: `backend/tests/test_football_mapper.py`

**Interfaces:**
- Consumes: Datos crudos de `FootballDataService`
- Produces: `map_partido()`, `map_tabla()`, `map_goleador()`

- [ ] **Step 1: Crear test para el mapper**

```python
# backend/tests/test_football_mapper.py
from backend.app.services.football_mapper import FootballMapper

def test_map_partido():
    raw = {
        "id_api": 12345,
        "local": "olimpia",
        "visitante": "cerro-porteno",
        "goles_local": 2,
        "goles_visitante": 1,
        "estado": "finalizado",
        "jornada": 1,
        "fecha": "2026-01-31T20:00:00Z",
    }
    result = FootballMapper.map_partido(raw)
    assert result["id"] == "fd-12345"
    assert result["local_id"] == "olimpia"
    assert result["torneo"] == "Primera Division Paraguaya"

def test_map_tabla():
    raw = {
        "stage": "REGULAR_SEASON",
        "table": [
            {
                "position": 1,
                "team": {"name": "Club Olimpia", "id": 1001},
                "playedGames": 10,
                "won": 7,
                "draw": 2,
                "lost": 1,
                "goalsFor": 20,
                "goalsAgainst": 8,
                "points": 23,
            }
        ]
    }
    result = FootballMapper.map_tabla(raw)
    assert len(result) == 1
    assert result[0]["posicion"] == 1
    assert result[0]["club_id"] == "olimpia"
    assert result[0]["puntos"] == 23

def test_map_goleador():
    raw = {
        "player": {"name": "Juan Perez", "id": 2001},
        "team": {"name": "Club Olimpia", "id": 1001},
        "goals": 10,
        "assists": 5,
    }
    result = FootballMapper.map_goleador(raw, "Apertura 2026")
    assert result["id"] == "fd-2001"
    assert result["nombre"] == "Juan Perez"
    assert result["goles"] == 10
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `python -m pytest backend/tests/test_football_mapper.py -v`
Expected: FAIL con "ModuleNotFoundError"

- [ ] **Step 3: Crear el mapper**

```python
# backend/app/services/football_mapper.py
from backend.app.services.football_config import TEAM_MAP

class FootballMapper:

    @staticmethod
    def map_partido(raw: dict) -> dict:
        return {
            "id": f"fd-{raw['id_api']}",
            "torneo": "Primera Division Paraguaya",
            "local_id": raw["local"],
            "visitante_id": raw["visitante"],
            "goles_local": raw.get("goles_local"),
            "goles_visitante": raw.get("goles_visitante"),
            "estado": raw.get("estado", "programado"),
            "jornada": raw.get("jornada", 1),
            "fecha": raw.get("fecha", ""),
            "temporada": "2026",
        }

    @staticmethod
    def map_tabla(raw: dict) -> list[dict]:
        rows = []
        for entry in raw.get("table", []):
            team_name = entry["team"]["name"]
            club_id = TEAM_MAP.get(team_name, team_name.lower().replace(" ", "-"))
            rows.append({
                "posicion": entry["position"],
                "club_id": club_id,
                "torneo": "Primera Division Paraguaya",
                "temporada": "2026",
                "pj": entry.get("playedGames", 0),
                "pg": entry.get("won", 0),
                "pe": entry.get("draw", 0),
                "pp": entry.get("lost", 0),
                "gf": entry.get("goalsFor", 0),
                "gc": entry.get("goalsAgainst", 0),
                "dg": entry.get("goalsFor", 0) - entry.get("goalsAgainst", 0),
                "puntos": entry.get("points", 0),
            })
        return rows

    @staticmethod
    def map_goleador(raw: dict, torneo: str) -> dict:
        player = raw.get("player", {})
        team = raw.get("team", {})
        team_name = team.get("name", "")
        club_id = TEAM_MAP.get(team_name, team_name.lower().replace(" ", "-"))
        return {
            "id": f"fd-{player.get('id', 0)}",
            "nombre": player.get("name", ""),
            "club_id": club_id,
            "goles": raw.get("goals", 0),
            "asistencias": raw.get("assists", 0) or 0,
            "torneo": torneo,
            "temporada": "2026",
        }
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `python -m pytest backend/tests/test_football_mapper.py -v`
Expected: 3 tests PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/football_mapper.py backend/tests/test_football_mapper.py
git commit -m "feat(football-data): add FootballMapper for data transformation"
```

---

### Task 6: GoleadorService y Endpoints API

**Files:**
- Create: `backend/app/services/goleador_service.py`
- Create: `backend/app/api/goleadores.py`
- Modify: `backend/app/main.py` (registrar router)
- Test: `backend/tests/test_goleadores_api.py`

**Interfaces:**
- Consumes: `Goleador` model, `GoleadorOut` schema, `FootballDataService`
- Produces: `GET /api/goleadores`, `GET /api/sync/status`, `POST /api/sync/force`

- [ ] **Step 1: Crear test para la API**

```python
# backend/tests/test_goleadores_api.py
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.anyio
async def test_get_goleadores(client):
    response = await client.get("/api/goleadores")
    assert response.status_code == 200
    data = response.json()
    assert "goleadores" in data
    assert "total" in data

@pytest.mark.anyio
async def test_get_goleadores_with_torneo(client):
    response = await client.get("/api/goleadores?torneo=Apertura+2026")
    assert response.status_code == 200
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `python -m pytest backend/tests/test_goleadores_api.py -v`
Expected: FAIL con 404 o "Not Found"

- [ ] **Step 3: Crear GoleadorService**

```python
# backend/app/services/goleador_service.py
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.goleador import Goleador
from backend.app.schemas.goleador import GoleadorOut, GoleadoresListOut

class GoleadorService:

    @staticmethod
    async def get_all(
        db: AsyncSession,
        torneo: Optional[str] = None,
        limit: int = 20,
    ) -> GoleadoresListOut:
        stmt = select(Goleador)
        if torneo:
            stmt = stmt.where(Goleador.torneo == torneo)
        stmt = stmt.order_by(Goleador.goles.desc()).limit(limit)
        result = await db.execute(stmt)
        goleadores = result.scalars().all()
        return GoleadoresListOut(
            goleadores=[GoleadorOut.model_validate(g) for g in goleadores],
            total=len(goleadores),
        )
```

- [ ] **Step 4: Crear el router de goleadores**

```python
# backend/app/api/goleadores.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.services.goleador_service import GoleadorService

router = APIRouter(prefix="/api", tags=["goleadores"])

@router.get("/goleadores")
async def get_goleadores(
    torneo: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await GoleadorService.get_all(db, torneo=torneo, limit=limit)

@router.get("/sync/status")
async def get_sync_status():
    return {"status": "not_implemented"}

@router.post("/sync/force")
async def force_sync():
    return {"status": "not_implemented"}
```

- [ ] **Step 5: Registrar router en main.py**

Agregar al final de `backend/app/main.py`:
```python
from backend.app.api.goleadores import router as goleadores_router
app.include_router(goleadores_router)
```

- [ ] **Step 6: Ejecutar test y verificar que pasa**

Run: `python -m pytest backend/tests/test_goleadores_api.py -v`
Expected: 2 tests PASSED

- [ ] **Step 7: Commit**

```bash
git add backend/app/services/goleador_service.py backend/app/api/goleadores.py backend/app/main.py backend/tests/test_goleadores_api.py
git commit -m "feat(football-data): add GoleadorService and API endpoints"
```

---

### Task 7: Cron Job de Sincronizacion

**Files:**
- Modify: `backend/app/services/football_data_service.py` (agregar sync_all)
- Modify: `backend/app/main.py` (agregar background task)
- Test: `backend/tests/test_sync_cron.py`

**Interfaces:**
- Consumes: `FootballDataService`, `FootballMapper`, DB session
- Produces: `sync_all()`, background task en startup

- [ ] **Step 1: Crear test para sync**

```python
# backend/tests/test_sync_cron.py
import pytest
from unittest.mock import patch, MagicMock
from backend.app.services.football_data_service import FootballDataService

def test_sync_all_calls_fetch():
    with patch.object(FootballDataService, 'fetch_partidos') as mock_fetch:
        mock_fetch.return_value = []
        with patch.object(FootballDataService, 'fetch_tabla') as mock_tabla:
            mock_tabla.return_value = []
            with patch.object(FootballDataService, 'fetch_goleadores') as mock_goleadores:
                mock_goleadores.return_value = []
                result = FootballDataService.sync_all()
                assert mock_fetch.called
                assert mock_tabla.called
                assert mock_goleadores.called
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `python -m pytest backend/tests/test_sync_cron.py -v`
Expected: FAIL con "AttributeError: type object 'FootballDataService' has no attribute 'sync_all'"

- [ ] **Step 3: Agregar sync_all al servicio**

Agregar al final de `football_data_service.py`:
```python
    @staticmethod
    def sync_all() -> dict:
        results = {"partidos": 0, "tabla": 0, "goleadores": 0, "errors": []}
        try:
            partidos = FootballDataService.fetch_partidos()
            results["partidos"] = len(partidos)
        except Exception as e:
            results["errors"].append(f"partidos: {str(e)}")
        try:
            tabla = FootballDataService.fetch_tabla()
            results["tabla"] = len(tabla)
        except Exception as e:
            results["errors"].append(f"tabla: {str(e)}")
        try:
            goleadores = FootballDataService.fetch_goleadores()
            results["goleadores"] = len(goleadores)
        except Exception as e:
            results["errors"].append(f"goleadores: {str(e)}")
        return results
```

- [ ] **Step 4: Agregar cron job en main.py**

Agregar al final de `main.py`:
```python
import asyncio
import logging
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

async def sync_loop():
    while True:
        try:
            from backend.app.services.football_data_service import FootballDataService
            result = FootballDataService.sync_all()
            logger.info(f"Sync result: {result}")
        except Exception as e:
            logger.error(f"Sync failed: {e}")
        await asyncio.sleep(600)

@asynccontextmanager
async def lifespan(app):
    task = asyncio.create_task(sync_loop())
    yield
    task.cancel()
```

Actualizar la definicion de `app` para usar el lifespan.

- [ ] **Step 5: Ejecutar test y verificar que pasa**

Run: `python -m pytest backend/tests/test_sync_cron.py -v`
Expected: 1 test PASSED

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/football_data_service.py backend/app/main.py backend/tests/test_sync_cron.py
git commit -m "feat(football-data): add sync cron job"
```

---

### Task 8: Frontend - Componente de Goleadores

**Files:**
- Create: `frontend/src/components/GoleadoresList.tsx`
- Create: `frontend/src/app/goleadores/page.tsx`
- Modify: `frontend/src/components/layout/Navbar.tsx` (agregar link)

**Interfaces:**
- Consumes: API `GET /api/goleadores`
- Produces: Pagina de goleadores visible en `/goleadores`

- [ ] **Step 1: Crear componente GoleadoresList**

```tsx
// frontend/src/components/GoleadoresList.tsx
"use client";

import { useQuery } from "@tanstack/react-query";

interface Goleador {
  id: string;
  nombre: string;
  club_id: string;
  club_nombre: string;
  goles: number;
  asistencias: number;
}

export default function GoleadoresList({ torneo }: { torneo?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["goleadores", torneo],
    queryFn: () =>
      fetch(`/api/goleadores${torneo ? `?torneo=${torneo}` : ""}`).then((r) =>
        r.json()
      ),
  });

  if (isLoading) return <div className="text-center py-8">Cargando goleadores...</div>;

  return (
    <div className="space-y-2">
      {data?.goleadores?.map((g: Goleador, i: number) => (
        <div
          key={g.id}
          className="flex items-center justify-between p-3 bg-bg-secundario rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-texto-terciario w-8">{i + 1}</span>
            <div>
              <p className="font-medium">{g.nombre}</p>
              <p className="text-sm text-texto-terciario">{g.club_id}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-victoria">{g.goles}</p>
            <p className="text-xs text-texto-terciario">{g.asistencias} asist.</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Crear pagina de goleadores**

```tsx
// frontend/src/app/goleadores/page.tsx
import GoleadoresList from "@/components/GoleadoresList";

export default function GoleadoresPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Goleadores</h1>
      <GoleadoresList />
    </main>
  );
}
```

- [ ] **Step 3: Agregar link al Navbar**

En `frontend/src/components/layout/Navbar.tsx`, agregar:
```tsx
<Link href="/goleadores" className="...">
  Goleadores
</Link>
```

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build`
Expected: Build exitoso sin errores

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/GoleadoresList.tsx frontend/src/app/goleadores/page.tsx frontend/src/components/layout/Navbar.tsx
git commit -m "feat(football-data): add Goleadores frontend page"
```

---

### Task 9: Verificacion Final

- [ ] **Step 1: Ejecutar todos los tests del backend**

Run: `python -m pytest backend/tests/ -v`
Expected: Todos los tests pasan

- [ ] **Step 2: Verificar build del frontend**

Run: `cd frontend && npm run build`
Expected: Build exitoso

- [ ] **Step 3: Probar la API manualmente**

Run: `python -m uvicorn backend.app.main:app --reload`
Abrir: `http://localhost:8000/docs`
Verificar que los endpoints `/api/goleadores`, `/api/sync/status`, `/api/sync/force` existen

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat(football-data): complete integration with Football-Data.org"
```
