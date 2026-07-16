# Estadísticas Históricas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/historial` section that surfaces existing historical standings (TablaPosicion, temporadas 2020–2026) as three views: tablas por año, ranking agregado (campeones + all-time + títulos), y rendimiento por club.

**Architecture:** Nuevos endpoints bajo `/api/v1/historial` servidos por `HistorialService` que agrega `TablaPosicion` en Python (sin nuevos modelos). El frontend renderiza 3 tabs en `/historial` con componentes auxiliares y gráficos Recharts. Reutiliza `GET /api/v1/tabla` y `GET /api/v1/tabla/torneos` para la vista de tablas por año.

**Tech Stack:** FastAPI, SQLAlchemy async, Pydantic v2, pytest-asyncio, httpx.ASGITransport; Next.js App Router, TanStack Query, Tailwind, Recharts, GSAP ScrollReveal.

## Global Constraints

- Python 3.12+, async/await en todo el backend.
- SQLAlchemy 2.0+ estilo `mapped_column` (ver `club.py`, `tabla.py`).
- Frontend: Next.js App Router, directiva `"use client"`, React Query para data fetching.
- Tailwind classes del proyecto: `bg-bg-secundario`, `text-texto-principal`, `border-borde-sutil`, `text-apf-rojo`, `bg-bg-noche`, `text-texto-secundario`, `text-apf-dorado`.
- JWT/auth NO requerido para estos endpoints (son públicos, igual que `/api/v1/tabla`).
- Test pattern: `pytest-asyncio`, `httpx.AsyncClient` con `ASGITransport`, fixtures `client` y `db_session` de `conftest.py`.
- Sin nuevas dependencias — solo librerías ya instaladas (Recharts ya está).
- Datos históricos se cargan en startup vía `seed_tabla_historico` desde `data/partidos_historicos/temporada_*.json` (tabla final, `jornada=0`).

---

### Task 1: Backend Schemas

**Files:**
- Create: `backend/app/schemas/historial.py`

**Interfaces:**
- Produces: `CampeonOut`, `RankingClubOut`, `ClubTemporadaOut` (usados por Service y API en Tasks 2-3).

- [ ] **Step 1: Create schemas**

```python
# backend/app/schemas/historial.py
from pydantic import BaseModel


class CampeonOut(BaseModel):
    ano: int
    torneo: str
    club_id: str
    club: str
    escudo: str | None = None
    puntos: int


class RankingClubOut(BaseModel):
    club_id: str
    club: str
    escudo: str | None = None
    pj: int
    pg: int
    pe: int
    pp: int
    gf: int
    gc: int
    dg: int
    puntos: int
    titulos: int
    torneos_jugados: int


class ClubTemporadaOut(BaseModel):
    ano: int
    torneo: str
    posicion: int
    puntos: int
    dg: int
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/schemas/historial.py
git commit -m "feat: add Historial Pydantic schemas"
```

---

### Task 2: HistorialService (con TDD)

**Files:**
- Create: `backend/app/services/historial_service.py`
- Create: `backend/tests/test_historial_service.py`

**Interfaces:**
- Consumes: `TablaPosicion`, `Club` modelos; `AsyncSession`.
- Produces: `HistorialService` con `get_campeones()`, `get_ranking_clubes()`, `get_club_historial(club_id)`.

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_historial_service.py
import pytest

from sqlalchemy import select

from backend.app.models.club import Club
from backend.app.models.tabla import TablaPosicion
from backend.app.services.historial_service import HistorialService


@pytest.fixture
async def seed_historial(db_session):
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="Decano", colores=[], estadio="MF", escudo="o.png"),
        Club(id="cerro", nombre="Club Cerro Porteño", ciudad="Asunción", apodo="Ciclón", colores=[], estadio="GPR", escudo="c.png"),
        Club(id="libertad", nombre="Club Libertad", ciudad="Asunción", apodo="Gumarelo", colores=[], estadio="NL", escudo="l.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()

    rows = [
        TablaPosicion(torneo="Torneo Apertura 2024", jornada=0, club_id="libertad", posicion=1, pj=22, pg=14, pe=6, pp=2, gf=42, gc=16, dg=26, puntos=48),
        TablaPosicion(torneo="Torneo Apertura 2024", jornada=0, club_id="olimpia", posicion=2, pj=22, pg=13, pe=5, pp=4, gf=40, gc=20, dg=20, puntos=44),
        TablaPosicion(torneo="Torneo Apertura 2024", jornada=0, club_id="cerro", posicion=3, pj=22, pg=12, pe=5, pp=5, gf=35, gc=25, dg=10, puntos=41),
        TablaPosicion(torneo="Torneo Clausura 2024", jornada=0, club_id="olimpia", posicion=1, pj=22, pg=15, pe=4, pp=3, gf=45, gc=18, dg=27, puntos=49),
        TablaPosicion(torneo="Torneo Clausura 2024", jornada=0, club_id="libertad", posicion=2, pj=22, pg=14, pe=4, pp=4, gf=40, gc=20, dg=20, puntos=46),
        TablaPosicion(torneo="Torneo Clausura 2024", jornada=0, club_id="cerro", posicion=3, pj=22, pg=10, pe=6, pp=6, gf=30, gc=28, dg=2, puntos=36),
    ]
    for r in rows:
        db_session.add(r)
    await db_session.flush()


@pytest.mark.asyncio
async def test_get_campeones(db_session, seed_historial):
    svc = HistorialService(db_session)
    camp = await svc.get_campeones()
    assert len(camp) == 2
    assert camp[0].torneo == "Torneo Clausura 2024"
    assert camp[0].club_id == "olimpia"
    assert camp[0].ano == 2024
    assert camp[1].torneo == "Torneo Apertura 2024"
    assert camp[1].club_id == "libertad"


@pytest.mark.asyncio
async def test_get_ranking_clubes(db_session, seed_historial):
    svc = HistorialService(db_session)
    ranking = await svc.get_ranking_clubes()
    by_id = {r.club_id: r for r in ranking}
    assert by_id["libertad"].puntos == 94  # 48 + 46
    assert by_id["olimpia"].puntos == 93   # 44 + 49
    assert by_id["libertad"].titulos == 1
    assert by_id["olimpia"].titulos == 1
    assert by_id["cerro"].titulos == 0
    # orden por puntos desc
    assert ranking[0].club_id == "libertad"


@pytest.mark.asyncio
async def test_get_club_historial(db_session, seed_historial):
    svc = HistorialService(db_session)
    hist = await svc.get_club_historial("olimpia")
    assert len(hist) == 2
    assert hist[0].torneo == "Torneo Clausura 2024"  # mas reciente primero
    assert hist[1].torneo == "Torneo Apertura 2024"


@pytest.mark.asyncio
async def test_get_club_historial_inexistente(db_session):
    svc = HistorialService(db_session)
    assert await svc.get_club_historial("no-existe") == []
```

- [ ] **Step 2: Run test to verify it fails**

Run: `$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol" ; python -m pytest backend/tests/test_historial_service.py -q`
Expected: FAIL (ModuleNotFoundError: historial_service)

- [ ] **Step 3: Write minimal implementation**

```python
# backend/app/services/historial_service.py
import re
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.club import Club
from backend.app.models.tabla import TablaPosicion
from backend.app.schemas.historial import (
    CampeonOut,
    ClubTemporadaOut,
    RankingClubOut,
)


def _parse_ano(torneo: str) -> int:
    m = re.search(r"(\d{4})", torneo)
    return int(m.group(1)) if m else 0


def _order(torneo: str) -> int:
    low = torneo.lower()
    if "apertura" in low:
        return 0
    if "regular" in low:
        return 1
    if "clausura" in low:
        return 2
    return 3


def _sort_key(torneo: str):
    return (_parse_ano(torneo), _order(torneo))


class HistorialService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_campeones(self) -> list[CampeonOut]:
        result = await self.db.execute(select(TablaPosicion.torneo).distinct())
        torneos = result.scalars().all()
        campeones = []
        for torneo in torneos:
            row = await self.db.execute(
                select(TablaPosicion)
                .where(TablaPosicion.torneo == torneo)
                .where(TablaPosicion.posicion == 1)
                .order_by(TablaPosicion.puntos.desc())
                .limit(1)
            )
            t = row.scalar_one_or_none()
            if not t:
                continue
            club = (await self.db.execute(select(Club).where(Club.id == t.club_id))).scalar_one_or_none()
            campeones.append(CampeonOut(
                ano=_parse_ano(torneo),
                torneo=torneo,
                club_id=t.club_id,
                club=club.nombre if club else t.club_id,
                escudo=club.escudo if club else None,
                puntos=t.puntos,
            ))
        campeones.sort(key=lambda c: _sort_key(c.torneo))
        campeones.reverse()
        return campeones

    async def get_ranking_clubes(self) -> list[RankingClubOut]:
        result = await self.db.execute(select(TablaPosicion))
        rows = result.scalars().all()

        agg: dict[str, dict] = {}
        titulos: dict[str, int] = {}
        for t in rows:
            a = agg.setdefault(t.club_id, {
                "pj": 0, "pg": 0, "pe": 0, "pp": 0,
                "gf": 0, "gc": 0, "dg": 0, "puntos": 0, "torneos_jugados": 0,
            })
            a["pj"] += t.pj
            a["pg"] += t.pg
            a["pe"] += t.pe
            a["pp"] += t.pp
            a["gf"] += t.gf
            a["gc"] += t.gc
            a["dg"] += t.dg
            a["puntos"] += t.puntos
            a["torneos_jugados"] += 1
            if t.posicion == 1:
                titulos[t.club_id] = titulos.get(t.club_id, 0) + 1

        club_rows = (await self.db.execute(select(Club))).scalars().all()
        club_map = {c.id: c for c in club_rows}

        out = []
        for club_id, a in agg.items():
            c = club_map.get(club_id)
            out.append(RankingClubOut(
                club_id=club_id,
                club=c.nombre if c else club_id,
                escudo=c.escudo if c else None,
                pj=a["pj"], pg=a["pg"], pe=a["pe"], pp=a["pp"],
                gf=a["gf"], gc=a["gc"], dg=a["dg"], puntos=a["puntos"],
                titulos=titulos.get(club_id, 0),
                torneos_jugados=a["torneos_jugados"],
            ))
        out.sort(key=lambda r: (r.puntos, r.titulos), reverse=True)
        return out

    async def get_club_historial(self, club_id: str) -> list[ClubTemporadaOut]:
        result = await self.db.execute(
            select(TablaPosicion)
            .where(TablaPosicion.club_id == club_id)
        )
        rows = result.scalars().all()
        out = [
            ClubTemporadaOut(
                ano=_parse_ano(t.torneo),
                torneo=t.torneo,
                posicion=t.posicion,
                puntos=t.puntos,
                dg=t.dg,
            )
            for t in rows
        ]
        out.sort(key=lambda r: _sort_key(r.torneo))
        out.reverse()
        return out
```

- [ ] **Step 4: Run test to verify it passes**

Run: `$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol" ; python -m pytest backend/tests/test_historial_service.py -q`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/historial_service.py backend/tests/test_historial_service.py
git commit -m "feat: add HistorialService with campeones, ranking, club historial"
```

---

### Task 3: API Router + main.py (con TDD)

**Files:**
- Create: `backend/app/api/historial.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_historial_api.py`

**Interfaces:**
- Consumes: `HistorialService`, `get_db`.
- Produces: router `/api/v1/historial` con 3 endpoints (campeones, ranking-clubes, club/{club_id}).

- [ ] **Step 1: Write the failing endpoint test**

```python
# backend/tests/test_historial_api.py
import pytest

from sqlalchemy import select

from backend.app.models.club import Club
from backend.app.models.tabla import TablaPosicion


@pytest.fixture
async def seed_historial(db_session):
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="Decano", colores=[], estadio="MF", escudo="o.png"),
        Club(id="libertad", nombre="Club Libertad", ciudad="Asunción", apodo="Gumarelo", colores=[], estadio="NL", escudo="l.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()
    rows = [
        TablaPosicion(torneo="Torneo Apertura 2024", jornada=0, club_id="libertad", posicion=1, pj=22, pg=14, pe=6, pp=2, gf=42, gc=16, dg=26, puntos=48),
        TablaPosicion(torneo="Torneo Apertura 2024", jornada=0, club_id="olimpia", posicion=2, pj=22, pg=13, pe=5, pp=4, gf=40, gc=20, dg=20, puntos=44),
        TablaPosicion(torneo="Torneo Clausura 2024", jornada=0, club_id="olimpia", posicion=1, pj=22, pg=15, pe=4, pp=3, gf=45, gc=18, dg=27, puntos=49),
    ]
    for r in rows:
        db_session.add(r)
    await db_session.flush()


@pytest.mark.asyncio
async def test_campeones_endpoint(client, db_session, seed_historial):
    resp = await client.get("/api/v1/historial/campeones")
    assert resp.status_code == 200
    data = resp.json()
    assert data[0]["torneo"] == "Torneo Clausura 2024"
    assert data[0]["club"] == "Club Olimpia"


@pytest.mark.asyncio
async def test_ranking_endpoint(client, db_session, seed_historial):
    resp = await client.get("/api/v1/historial/ranking-clubes")
    assert resp.status_code == 200
    data = resp.json()
    assert data[0]["club_id"] == "olimpia"  # 49+44=93 vs libertad 48
    assert data[0]["titulos"] == 1


@pytest.mark.asyncio
async def test_club_historial_endpoint(client, db_session, seed_historial):
    resp = await client.get("/api/v1/historial/club/olimpia")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["torneo"] == "Torneo Clausura 2024"


@pytest.mark.asyncio
async def test_club_historial_inexistente(client, db_session):
    resp = await client.get("/api/v1/historial/club/xyz")
    assert resp.status_code == 200
    assert resp.json() == []
```

- [ ] **Step 2: Run test to verify it fails**

Run: `$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol" ; python -m pytest backend/tests/test_historial_api.py -q`
Expected: FAIL (404 — router no registrado)

- [ ] **Step 3: Create API router**

```python
# backend/app/api/historial.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.historial import (
    CampeonOut,
    ClubTemporadaOut,
    RankingClubOut,
)
from backend.app.services.historial_service import HistorialService

router = APIRouter(prefix="/api/v1/historial", tags=["historial"])


@router.get("/campeones", response_model=list[CampeonOut])
async def campeones(db: AsyncSession = Depends(get_db)):
    return await HistorialService(db).get_campeones()


@router.get("/ranking-clubes", response_model=list[RankingClubOut])
async def ranking_clubes(db: AsyncSession = Depends(get_db)):
    return await HistorialService(db).get_ranking_clubes()


@router.get("/club/{club_id}", response_model=list[ClubTemporadaOut])
async def club_historial(club_id: str, db: AsyncSession = Depends(get_db)):
    return await HistorialService(db).get_club_historial(club_id)
```

- [ ] **Step 4: Register router in main.py**

Add to the import block (after line 17 `transferencias_router`):
```python
from backend.app.api.historial import router as historial_router
```
Add to the include_router block (after line 107 `transferencias_router`):
```python
app.include_router(historial_router)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol" ; python -m pytest backend/tests/test_historial_api.py -q`
Expected: 4 passed

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/historial.py backend/app/main.py backend/tests/test_historial_api.py
git commit -m "feat: add Historial API endpoints (campeones, ranking-clubes, club)"
```

---

### Task 4: Frontend Types + API

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`

**Interfaces:**
- Consumes: endpoints de Task 3.
- Produces: tipos TS + funciones api usadas por Tasks 5-8.

- [ ] **Step 1: Add types to types/index.ts (al final del archivo)**

```typescript
// === Estadísticas Históricas ===
export interface CampeonHistorico {
  ano: number;
  torneo: string;
  club_id: string;
  club: string;
  escudo: string | null;
  puntos: number;
}

export interface RankingClubHistorico {
  club_id: string;
  club: string;
  escudo: string | null;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  puntos: number;
  titulos: number;
  torneos_jugados: number;
}

export interface ClubTemporadaHistorica {
  ano: number;
  torneo: string;
  posicion: number;
  puntos: number;
  dg: number;
}
```

- [ ] **Step 2: Add API functions to lib/api.ts (al final del archivo)**

```typescript
export async function getCampeones(): Promise<CampeonHistorico[]> {
  return apiFetch<CampeonHistorico[]>("/api/v1/historial/campeones");
}

export async function getRankingClubes(): Promise<RankingClubHistorico[]> {
  return apiFetch<RankingClubHistorico[]>("/api/v1/historial/ranking-clubes");
}

export async function getClubHistorial(clubId: string): Promise<ClubTemporadaHistorica[]> {
  return apiFetch<ClubTemporadaHistorica[]>(`/api/v1/historial/club/${clubId}`);
}
```

- [ ] **Step 3: Build verification**

Run: `cd frontend && npm run build`
Expected: 0 errores

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/lib/api.ts
git commit -m "feat: add Historial TypeScript types + API functions"
```

---

### Task 5: HistorialTabs + página /historial (shell)

**Files:**
- Create: `frontend/src/components/historial/HistorialTabs.tsx`
- Create: `frontend/src/app/historial/page.tsx`

**Interfaces:**
- Consumes: nada (estado local de tab).
- Produces: shell con tabs que renderiza el componente activo (Tasks 6-8 lo llenan).

- [ ] **Step 1: Create HistorialTabs**

```tsx
// frontend/src/components/historial/HistorialTabs.tsx
"use client";

const TABS = [
  { key: "tablas", label: "Tablas por año" },
  { key: "ranking", label: "Ranking agregado" },
  { key: "club", label: "Rendimiento por club" },
];

export default function HistorialTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            active === t.key
              ? "bg-apf-rojo text-white"
              : "bg-bg-secundario text-texto-secundario hover:text-texto-principal"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create /historial page shell**

```tsx
// frontend/src/app/historial/page.tsx
"use client";

import { useState } from "react";
import HistorialTabs from "@/components/historial/HistorialTabs";
import TablaPorAnio from "@/components/historial/TablaPorAnio";
import RankingAgregado from "@/components/historial/RankingAgregado";
import RendimientoClub from "@/components/historial/RendimientoClub";

export default function HistorialPage() {
  const [tab, setTab] = useState("tablas");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-texto-principal">Estadísticas Históricas</h1>
        <p className="text-texto-secundario mt-1">Temporadas 2020–2026 de la Primera División paraguaya</p>
      </div>

      <HistorialTabs active={tab} onChange={setTab} />

      {tab === "tablas" && <TablaPorAnio />}
      {tab === "ranking" && <RankingAgregado />}
      {tab === "club" && <RendimientoClub />}
    </div>
  );
}
```

- [ ] **Step 3: Build verification (espera fallo de imports faltantes)**

Run: `cd frontend && npm run build`
Expected: FAIL (no existen TablaPorAnio/RankingAgregado/RendimientoClub). Se corrige en Tasks 6-8.

- [ ] **Step 4: NO commit aún** (se commitea al finalizar Task 8 con los 3 componentes).

---

### Task 6: TablaPorAnio

**Files:**
- Create: `frontend/src/components/historial/TablaPorAnio.tsx`

**Interfaces:**
- Consumes: `getTorneos`, `getTabla` (de `@/lib/api`), `TablaRow` type.
- Produces: tabla de standing final de un torneo histórico con selector de año + torneo.

- [ ] **Step 1: Create TablaPorAnio**

```tsx
// frontend/src/components/historial/TablaPorAnio.tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTabla, getTorneos } from "@/lib/api";
import type { TablaRow } from "@/types";
import ScrollReveal from "@/components/ui/ScrollReveal";

function anoDeTorneo(t: string): number {
  const m = t.match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : 0;
}

export default function TablaPorAnio() {
  const { data: torneos } = useQuery<string[]>({
    queryKey: ["torneos-historial"],
    queryFn: () => getTorneos(),
    staleTime: 300_000,
  });

  const anos = useMemo(() => {
    if (!torneos) return [];
    return Array.from(new Set(torneos.map(anoDeTorneo))).sort((a, b) => b - a);
  }, [torneos]);

  const [ano, setAno] = useState<number | "">("");
  const [torneo, setTorneo] = useState("");

  const torneosDelAno = useMemo(() => {
    if (ano === "") return [];
    return (torneos || []).filter((t) => anoDeTorneo(t) === ano);
  }, [torneos, ano]);

  // Al cambiar de año, resetear torneo
  function seleccionarAno(a: number) {
    setAno(a);
    setTorneo("");
  }

  const { data: filas, isLoading } = useQuery<TablaRow[]>({
    queryKey: ["tabla-historial", torneo],
    queryFn: () => getTabla(torneo),
    enabled: torneo !== "",
    staleTime: 300_000,
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm"
          value={ano}
          onChange={(e) => seleccionarAno(Number(e.target.value))}
        >
          <option value="">Seleccioná un año</option>
          {anos.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm disabled:opacity-50"
          value={torneo}
          disabled={ano === ""}
          onChange={(e) => setTorneo(e.target.value)}
        >
          <option value="">Seleccioná un torneo</option>
          {torneosDelAno.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {torneo === "" ? (
        <p className="text-texto-secundario text-center py-12">Elegí un año y torneo para ver la tabla final.</p>
      ) : isLoading ? (
        <div className="h-64 bg-bg-secundario rounded-xl animate-pulse" />
      ) : !filas || filas.length === 0 ? (
        <p className="text-texto-secundario text-center py-12">Sin datos para este torneo.</p>
      ) : (
        <ScrollReveal variant="from-bottom" stagger={0.03}>
          <div className="overflow-x-auto bg-bg-secundario border border-borde-sutil rounded-xl">
            <table className="w-full text-sm text-texto-principal">
              <thead className="text-texto-secundario">
                <tr className="border-b border-borde-sutil">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Club</th>
                  <th className="px-2 py-2">PJ</th>
                  <th className="px-2 py-2">PG</th>
                  <th className="px-2 py-2">PE</th>
                  <th className="px-2 py-2">PP</th>
                  <th className="px-2 py-2">GF</th>
                  <th className="px-2 py-2">GC</th>
                  <th className="px-2 py-2">DG</th>
                  <th className="px-2 py-2">PTS</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.club_id} className="border-b border-borde-sutil/50">
                    <td className="px-3 py-2">{f.posicion}</td>
                    <td className="px-3 py-2 font-medium flex items-center gap-2">
                      {f.escudo ? (
                        <img src={f.escudo} alt="" className="w-5 h-5 object-contain" />
                      ) : null}
                      {f.club}
                    </td>
                    <td className="px-2 py-2 text-center">{f.pj}</td>
                    <td className="px-2 py-2 text-center">{f.pg}</td>
                    <td className="px-2 py-2 text-center">{f.pe}</td>
                    <td className="px-2 py-2 text-center">{f.pp}</td>
                    <td className="px-2 py-2 text-center">{f.gf}</td>
                    <td className="px-2 py-2 text-center">{f.gc}</td>
                    <td className="px-2 py-2 text-center">{f.dg}</td>
                    <td className="px-2 py-2 text-center font-bold text-apf-dorado">{f.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build verification (fallan RendimientoClub/RankingAgregado)**

Run: `cd frontend && npm run build`
Expected: FAIL por componentes faltantes (Tasks 7-8 los crean).

- [ ] **Step 3: NO commit aún.**

---

### Task 7: RankingAgregado

**Files:**
- Create: `frontend/src/components/historial/RankingAgregado.tsx`

**Interfaces:**
- Consumes: `getCampeones`, `getRankingClubes` (de `@/lib/api`).
- Produces: lista de campeones por año + tabla all-time + BarChart de títulos.

- [ ] **Step 1: Create RankingAgregado**

```tsx
// frontend/src/components/historial/RankingAgregado.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getCampeones, getRankingClubes } from "@/lib/api";
import type { CampeonHistorico, RankingClubHistorico } from "@/types";

const COLORS = ["#CC001C", "#00619E", "#FFCC00", "#1a4731", "#8B5CF6", "#F97316"];

export default function RankingAgregado() {
  const { data: campeones, isLoading: l1 } = useQuery<CampeonHistorico[]>({
    queryKey: ["campeones"],
    queryFn: () => getCampeones(),
    staleTime: 300_000,
  });
  const { data: ranking, isLoading: l2 } = useQuery<RankingClubHistorico[]>({
    queryKey: ["ranking-clubes"],
    queryFn: () => getRankingClubes(),
    staleTime: 300_000,
  });

  if (l1 || l2) {
    return <div className="h-40 bg-bg-secundario rounded-xl animate-pulse" />;
  }

  const topTitulos = (ranking || [])
    .filter((r) => r.titulos > 0)
    .slice(0, 8)
    .map((r) => ({ name: r.club, titulos: r.titulos }));

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold text-texto-principal mb-4">Campeones por año</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(campeones || []).map((c) => (
            <div key={c.torneo} className="bg-bg-secundario border border-borde-sutil rounded-xl p-4 flex items-center gap-3">
              {c.escudo ? (
                <img src={c.escudo} alt="" className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-bg-noche" />
              )}
              <div>
                <p className="text-texto-secundario text-xs">{c.torneo}</p>
                <p className="text-texto-principal font-semibold">{c.club}</p>
                <p className="text-apf-dorado text-sm">{c.puntos} pts</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-texto-principal mb-4">Tabla all-time</h2>
        <div className="overflow-x-auto bg-bg-secundario border border-borde-sutil rounded-xl">
          <table className="w-full text-sm text-texto-principal">
            <thead className="text-texto-secundario">
              <tr className="border-b border-borde-sutil">
                <th className="px-3 py-2 text-left">Club</th>
                <th className="px-2 py-2 text-center">Títulos</th>
                <th className="px-2 py-2 text-center">PJ</th>
                <th className="px-2 py-2 text-center">GF</th>
                <th className="px-2 py-2 text-center">GC</th>
                <th className="px-2 py-2 text-center">DG</th>
                <th className="px-2 py-2 text-center">PTS</th>
              </tr>
            </thead>
            <tbody>
              {(ranking || []).map((r) => (
                <tr key={r.club_id} className="border-b border-borde-sutil/50">
                  <td className="px-3 py-2 font-medium flex items-center gap-2">
                    {r.escudo ? <img src={r.escudo} alt="" className="w-5 h-5 object-contain" /> : null}
                    {r.club}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-apf-dorado">{r.titulos}</td>
                  <td className="px-2 py-2 text-center">{r.pj}</td>
                  <td className="px-2 py-2 text-center">{r.gf}</td>
                  <td className="px-2 py-2 text-center">{r.gc}</td>
                  <td className="px-2 py-2 text-center">{r.dg}</td>
                  <td className="px-2 py-2 text-center font-bold">{r.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {topTitulos.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-texto-principal mb-4">Títulos por club</h2>
          <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topTitulos}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="titulos" radius={[4, 4, 0, 0]}>
                  {topTitulos.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build verification (falla RendimientoClub)**

Run: `cd frontend && npm run build`
Expected: FAIL por RendimientoClub faltante (Task 8 lo crea).

- [ ] **Step 3: NO commit aún.**

---

### Task 8: RendimientoClub

**Files:**
- Create: `frontend/src/components/historial/RendimientoClub.tsx`

**Interfaces:**
- Consumes: `getClubes`, `getClubHistorial` (de `@/lib/api`).
- Produces: selector de club + grid temporada-a-temporada + LineChart de posición.

- [ ] **Step 1: Create RendimientoClub**

```tsx
// frontend/src/components/historial/RendimientoClub.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getClubes, getClubHistorial } from "@/lib/api";
import type { Club, ClubTemporadaHistorica } from "@/types";

export default function RendimientoClub() {
  const [clubId, setClubId] = useState("");
  const { data: clubes } = useQuery<Club[]>({
    queryKey: ["clubes-historial"],
    queryFn: () => getClubes(),
    staleTime: 300_000,
  });

  const { data: historial, isLoading } = useQuery<ClubTemporadaHistorica[]>({
    queryKey: ["club-historial", clubId],
    queryFn: () => getClubHistorial(clubId),
    enabled: clubId !== "",
    staleTime: 300_000,
  });

  const chartData = (historial || []).map((h) => ({
    temporada: h.torneo,
    posicion: h.posicion,
  }));

  return (
    <div>
      <select
        value={clubId}
        onChange={(e) => setClubId(e.target.value)}
        className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm mb-8"
      >
        <option value="">Seleccioná un club</option>
        {(clubes || []).map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>

      {clubId === "" ? (
        <p className="text-texto-secundario text-center py-12">Elegí un club para ver su historial.</p>
      ) : isLoading ? (
        <div className="h-40 bg-bg-secundario rounded-xl animate-pulse" />
      ) : !historial || historial.length === 0 ? (
        <p className="text-texto-secundario text-center py-12">Sin datos históricos para este club.</p>
      ) : (
        <div className="space-y-10">
          <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6">
            <h3 className="text-texto-principal font-semibold mb-4">Posición por temporada</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" />
                <XAxis dataKey="temporada" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis reversed domain={[1, "dataMax"]} tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="posicion" stroke="#CC001C" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto bg-bg-secundario border border-borde-sutil rounded-xl">
            <table className="w-full text-sm text-texto-principal">
              <thead className="text-texto-secundario">
                <tr className="border-b border-borde-sutil">
                  <th className="px-3 py-2 text-left">Temporada</th>
                  <th className="px-2 py-2 text-center">Posición</th>
                  <th className="px-2 py-2 text-center">PTS</th>
                  <th className="px-2 py-2 text-center">DG</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.torneo} className="border-b border-borde-sutil/50">
                    <td className="px-3 py-2">{h.torneo}</td>
                    <td className="px-2 py-2 text-center font-bold">{h.posicion}</td>
                    <td className="px-2 py-2 text-center">{h.puntos}</td>
                    <td className="px-2 py-2 text-center">{h.dg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build verification**

Run: `cd frontend && npm run build`
Expected: 0 errores, ruta `/historial` presente.

- [ ] **Step 3: Commit (incluye Tasks 5-8)**

```bash
git add frontend/src/components/historial/ frontend/src/app/historial/
git commit -m "feat: add /historial section with Tablas, Ranking and Rendimiento tabs"
```

---

### Task 9: Navbar link + build final

**Files:**
- Modify: `frontend/src/components/layout/Navbar.tsx`

**Interfaces:**
- Consumes: ruta `/historial` (Task 5).

- [ ] **Step 1: Add Historial link**

In `Navbar.tsx`, en el array de links (alrededor de la línea 76, después de Transferencias), agregar:
```typescript
    { href: "/historial", label: "Historial" },
```

- [ ] **Step 2: Build verification**

Run: `cd frontend && npm run build`
Expected: 0 errores.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/Navbar.tsx
git commit -m "feat: add Historial link to Navbar"
```

---

### Task 10: Handoff + push

**Files:**
- Modify: `Handoff.md`

**Interfaces:**
- Documenta el módulo completo.

- [ ] **Step 1: Run full backend suite**

Run: `$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol" ; python -m pytest backend/tests/ -q`
Expected: nuevos tests de historial pasan, sin regresiones.

- [ ] **Step 2: Add Transferencias-like section to Handoff.md**

Agregar antes de la sección "### GSAP Experience":

```markdown
### Estadísticas Históricas (Julio 2026)
- [x] `HistorialService` — agrega TablaPosicion: campeones por torneo, ranking all-time, historial por club
- [x] 3 API endpoints: `/api/v1/historial/campeones`, `/api/v1/historial/ranking-clubes`, `/api/v1/historial/club/{id}`
- [x] Schemas Pydantic: CampeonOut, RankingClubOut, ClubTemporadaOut
- [x] Frontend types + API functions
- [x] Sección `/historial` con 3 tabs: Tablas por año, Ranking agregado, Rendimiento por club
- [x] Recharts: barchart de títulos, linechart de posición por temporada
- [x] Navbar link a Historial
- [x] Tests backend (service + api) pasando

> Nota: los datos históricos son tablas finales por torneo (2020–2026). No incluye resultados fecha por fecha ni goleadores históricos (sin datos en JSON).
```

También actualizar el roadmap del usuario: item 5 de `📋 Estadísticas históricas` a `✅ Estadísticas históricas`.

- [ ] **Step 3: Commit + push**

```bash
git add Handoff.md
git commit -m "docs: update Handoff.md with Estadisticas Historicas module"
git push origin main
```
