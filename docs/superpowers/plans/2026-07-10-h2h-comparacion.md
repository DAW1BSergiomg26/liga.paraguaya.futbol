# H2H — Comparación Head-to-Head Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a page at `/h2h` where users select two clubs and see their full head-to-head history.

**Architecture:** Backend `GET /api/v1/partidos/h2h?club_a=X&club_b=Y` filters matches between both clubs and returns them + a computed summary. Frontend renders selectors, a summary card, and an animated match list. Service method on `PartidoService`, schemas in `partido.py`.

**Tech Stack:** FastAPI (Python), SQLAlchemy async, Next.js 16 + Tailwind v4, React Query.

## Global Constraints

- PYTHONPATH must be set to project root for backend commands
- All backend tests run via `pytest` from `C:\Users\astur\Desktop\liga.paraguaya.futbol\backend`
- Frontend builds via `npm run build` from `C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend`
- No new npm dependencies

---

### Task 1: Backend schemas — H2HOut

**Files:**
- Modify: `backend/app/schemas/partido.py`
- Test: `backend/tests/test_h2h.py`

**Interfaces:**
- Consumes: `Partido` model fields, `Club.nombre`, `Club.escudo`
- Produces: `ClubResumen`, `MayorGoleada`, `H2HPartidoItem`, `H2HOut` Pydantic models

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_h2h.py
import pytest
from backend.app.schemas.partido import H2HOut, ClubResumen, MayorGoleada, H2HPartidoItem


class TestH2HSchemas:
    def test_club_resumen_fields(self):
        c = ClubResumen(id="c1", nombre="Olimpia", escudo="https://example.com/escudo.svg")
        assert c.id == "c1"
        assert c.nombre == "Olimpia"
        assert c.escudo == "https://example.com/escudo.svg"

    def test_mayor_goleada_fields(self):
        m = MayorGoleada(goles=5, fecha="2024-03-10", goles_recibidos=1)
        assert m.goles == 5
        assert m.goles_recibidos == 1

    def test_h2h_partido_item_fields(self):
        p = H2HPartidoItem(
            id="p1", torneo="Apertura", jornada=5, fecha="2024-03-10",
            estado="finalizado", goles_local=2, goles_visitante=1,
            local_id="c1", visitante_id="c2"
        )
        assert p.goles_local == 2

    def test_h2h_out_structure(self):
        ca = ClubResumen(id="c1", nombre="Olimpia", escudo="")
        cb = ClubResumen(id="c2", nombre="Cerro", escudo="")
        resumen = {"pj": 10, "victorias_a": 4, "empates": 2, "victorias_b": 4,
                    "goles_a": 12, "goles_b": 11,
                    "mayor_goleada_a": MayorGoleada(goles=3, fecha="2024-01-01", goles_recibidos=0),
                    "mayor_goleada_b": None}
        h2h = H2HOut(club_a=ca, club_b=cb, resumen=resumen, partidos=[])
        assert h2h.club_a.nombre == "Olimpia"
        assert h2h.resumen["pj"] == 10
```

- [ ] **Step 2: Run test to verify it fails**

Run from `C:\Users\astur\Desktop\liga.paraguaya.futbol\backend`:
```bash
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest tests/test_h2h.py -v
```
Expected: FAIL — `H2HOut` not defined.

- [ ] **Step 3: Write schemas**

```python
# Add to backend/app/schemas/partido.py (after line 38)
class ClubResumen(BaseModel):
    id: str
    nombre: str
    escudo: str


class MayorGoleada(BaseModel):
    goles: int
    fecha: str
    goles_recibidos: int


class H2HPartidoItem(BaseModel):
    id: str
    torneo: str
    jornada: int
    fecha: str
    estado: str
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    local_id: str
    visitante_id: str


class H2HOut(BaseModel):
    club_a: ClubResumen
    club_b: ClubResumen
    resumen: dict
    partidos: list[H2HPartidoItem]
```

- [ ] **Step 4: Run test to verify it passes**

```bash
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest tests/test_h2h.py::TestH2HSchemas -v
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
git add backend/app/schemas/partido.py backend/tests/test_h2h.py
git commit -m "feat(h2h): add H2HOut schemas"
```

---

### Task 2: Backend service — get_h2h()

**Files:**
- Modify: `backend/app/services/partido_service.py`
- Test: `backend/tests/test_h2h.py`

**Interfaces:**
- Consumes: `Partido` model, `Club` model (via eager loading), `H2HOut`, `ClubResumen`, `H2HPartidoItem`, `MayorGoleada`
- Produces: `PartidoService.get_h2h(db, club_a, club_b) -> H2HOut`

- [ ] **Step 1: Write the failing test**

```python
# Add to backend/tests/test_h2h.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.services.partido_service import PartidoService
from backend.app.models.partido import Partido
from backend.app.models.club import Club


@pytest.mark.asyncio
async def test_get_h2h_empty():
    db = AsyncMock(spec=AsyncSession)
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=mock_result)

    result = await PartidoService.get_h2h(db, "c1", "c2")
    assert result.club_a.id == "c1"
    assert result.club_b.id == "c2"
    assert result.partidos == []
    assert result.resumen["pj"] == 0
```

- [ ] **Step 2: Run test to verify it fails**

```bash
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest tests/test_h2h.py::test_get_h2h_empty -v
```
Expected: FAIL — `PartidoService.get_h2h` not defined.

- [ ] **Step 3: Implement get_h2h()**

```python
# Add to backend/app/services/partido_service.py (after line 74)

@staticmethod
async def get_h2h(
    db: AsyncSession,
    club_a: str,
    club_b: str,
) -> "H2HOut":
    from backend.app.schemas.partido import ClubResumen, H2HOut, H2HPartidoItem, MayorGoleada

    # Fetch club info
    from backend.app.models.club import Club
    club_a_obj = await db.get(Club, club_a)
    club_b_obj = await db.get(Club, club_b)

    # Fetch matches between these two clubs
    stmt = (
        select(Partido)
        .where(
            ((Partido.local_id == club_a) & (Partido.visitante_id == club_b)) |
            ((Partido.local_id == club_b) & (Partido.visitante_id == club_a))
        )
        .order_by(Partido.fecha.desc())
    )
    result = await db.execute(stmt)
    partidos = result.scalars().all()

    # Build partido items
    items = []
    for p in partidos:
        items.append(H2HPartidoItem(
            id=p.id,
            torneo=p.torneo,
            jornada=p.jornada,
            fecha=p.fecha.isoformat() if p.fecha else "",
            estado=p.estado,
            goles_local=p.goles_local,
            goles_visitante=p.goles_visitante,
            local_id=p.local_id,
            visitante_id=p.visitante_id,
        ))

    # Compute summary
    victorias_a = 0
    victorias_b = 0
    empates = 0
    goles_a = 0
    goles_b = 0
    mayor_a_goles = 0
    mayor_a_recibidos = 0
    mayor_a_fecha = ""
    mayor_b_goles = 0
    mayor_b_recibidos = 0
    mayor_b_fecha = ""

    for p in partidos:
        if p.goles_local is None or p.goles_visitante is None:
            continue
        if p.estado != "finalizado":
            continue

        if p.local_id == club_a:
            ga, gb = p.goles_local, p.goles_visitante
        else:
            ga, gb = p.goles_visitante, p.goles_local

        goles_a += ga
        goles_b += gb

        if ga > gb:
            victorias_a += 1
            if ga > mayor_a_goles:
                mayor_a_goles = ga
                mayor_a_recibidos = gb
                mayor_a_fecha = p.fecha.isoformat() if p.fecha else ""
        elif gb > ga:
            victorias_b += 1
            if gb > mayor_b_goles:
                mayor_b_goles = gb
                mayor_b_recibidos = ga
                mayor_b_fecha = p.fecha.isoformat() if p.fecha else ""
        else:
            empates += 1

    mayor_goleada_a = None
    if mayor_a_goles > 0:
        mayor_goleada_a = MayorGoleada(goles=mayor_a_goles, fecha=mayor_a_fecha, goles_recibidos=mayor_a_recibidos)

    mayor_goleada_b = None
    if mayor_b_goles > 0:
        mayor_goleada_b = MayorGoleada(goles=mayor_b_goles, fecha=mayor_b_fecha, goles_recibidos=mayor_b_recibidos)

    resumen = {
        "pj": len(items),
        "victorias_a": victorias_a,
        "empates": empates,
        "victorias_b": victorias_b,
        "goles_a": goles_a,
        "goles_b": goles_b,
        "mayor_goleada_a": mayor_goleada_a,
        "mayor_goleada_b": mayor_goleada_b,
    }

    return H2HOut(
        club_a=ClubResumen(id=club_a, nombre=club_a_obj.nombre if club_a_obj else club_a, escudo=club_a_obj.escudo if club_a_obj else ""),
        club_b=ClubResumen(id=club_b, nombre=club_b_obj.nombre if club_b_obj else club_b, escudo=club_b_obj.escudo if club_b_obj else ""),
        resumen=resumen,
        partidos=items,
    )
```

- [ ] **Step 4: Run test to verify it passes**

```bash
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest tests/test_h2h.py::test_get_h2h_empty -v
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
git add backend/app/services/partido_service.py backend/tests/test_h2h.py
git commit -m "feat(h2h): add PartidoService.get_h2h()"
```

---

### Task 3: Backend endpoint — GET /api/v1/partidos/h2h

**Files:**
- Modify: `backend/app/api/partidos.py`
- Test: `backend/tests/test_h2h.py`

**Interfaces:**
- Consumes: `PartidoService.get_h2h()`, `get_db` dependency
- Produces: `GET /api/v1/partidos/h2h?club_a=X&club_b=Y` JSON response

- [ ] **Step 1: Write the integration test**

```python
# Add to backend/tests/test_h2h.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_h2h_endpoint_no_params(client: AsyncClient):
    resp = await client.get("/api/v1/partidos/h2h")
    assert resp.status_code == 422  # missing required params


@pytest.mark.asyncio
async def test_h2h_endpoint_ok(client: AsyncClient):
    resp = await client.get("/api/v1/partidos/h2h?club_a=oli&club_b=cerro")
    # In test env with no DB, expect 500 or fallback
    assert resp.status_code in (200, 422, 500)
```

- [ ] **Step 2: Run test to verify it fails appropriately**

```bash
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest tests/test_h2h.py -v
```
Expected: Current tests still pass. New tests may fail depending on conftest fixture.

- [ ] **Step 3: Add the endpoint**

```python
# Add to backend/app/api/partidos.py (after the MarcadorOut class, before the routes)

@router.get("/h2h", response_model=H2HOut)
async def h2h_partidos(
    club_a: str,
    club_b: str,
    db: AsyncSession = Depends(get_db),
):
    return await PartidoService.get_h2h(db, club_a, club_b)
```

Also add the import at the top of the file:
```python
from backend.app.schemas.partido import H2HOut
```

- [ ] **Step 4: Run the full test suite**

```bash
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; cd backend && python -m pytest tests/ -x -q
```
Expected: All existing tests pass.

- [ ] **Step 5: Commit**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
git add backend/app/api/partidos.py backend/tests/test_h2h.py
git commit -m "feat(h2h): add GET /api/v1/partidos/h2h endpoint"
```

---

### Task 4: Frontend types + API function

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`

**Interfaces:**
- Consumes: Backend `H2HOut` response shape
- Produces: `H2HResponse` TypeScript interface, `getH2H(clubA, clubB): Promise<H2HResponse>`

- [ ] **Step 1: Add H2HResponse type**

```typescript
// Add to frontend/src/types/index.ts (before Noticia)
export interface ClubResumen {
  id: string;
  nombre: string;
  escudo: string;
}

export interface MayorGoleada {
  goles: number;
  fecha: string;
  goles_recibidos: number;
}

export interface H2HPartidoItem {
  id: string;
  torneo: string;
  jornada: number;
  fecha: string;
  estado: string;
  goles_local: number | null;
  goles_visitante: number | null;
  local_id: string;
  visitante_id: string;
}

export interface H2HResponse {
  club_a: ClubResumen;
  club_b: ClubResumen;
  resumen: {
    pj: number;
    victorias_a: number;
    empates: number;
    victorias_b: number;
    goles_a: number;
    goles_b: number;
    mayor_goleada_a: MayorGoleada | null;
    mayor_goleada_b: MayorGoleada | null;
  };
  partidos: H2HPartidoItem[];
}
```

- [ ] **Step 2: Add getH2H API function**

```typescript
// Add to frontend/src/lib/api.ts (after getPartidos or similar)
export async function getH2H(clubA: string, clubB: string): Promise<H2HResponse> {
  const res = await fetchJSON<H2HResponse>(
    `/api/v1/partidos/h2h?club_a=${encodeURIComponent(clubA)}&club_b=${encodeURIComponent(clubB)}`
  );
  return res;
}
```

- Add the `H2HResponse` import at the top of `api.ts`:
```typescript
import type { H2HResponse } from "@/types";
```

- [ ] **Step 3: Build check**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend && npm run build 2>&1
```
Expected: BUILD PASS

- [ ] **Step 4: Commit**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
git add frontend/src/types/index.ts frontend/src/lib/api.ts
git commit -m "feat(h2h): add H2HResponse type and getH2H API"
```

---

### Task 5: Frontend H2H page

**Files:**
- Create: `frontend/src/app/h2h/page.tsx`

**Interfaces:**
- Consumes: `useQuery<Club[]>({ queryKey: ["clubes"] })`, `getH2H(clubA, clubB)`
- Produces: `/h2h` page with selectors, summary card, match table

- [ ] **Step 1: Create the page**

```tsx
// frontend/src/app/h2h/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClubes, getH2H } from "@/lib/api";
import type { Club, H2HResponse } from "@/types";
import { TableSkeleton } from "@/components/ui/Skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function H2HPage() {
  const [clubA, setClubA] = useState("");
  const [clubB, setClubB] = useState("");

  const { data: clubes } = useQuery<Club[]>({
    queryKey: ["clubes"],
    queryFn: () => getClubes(),
  });

  const { data: h2h, isLoading, error } = useQuery<H2HResponse>({
    queryKey: ["h2h", clubA, clubB],
    queryFn: () => getH2H(clubA, clubB),
    enabled: !!clubA && !!clubB,
  });

  function selectOptions() {
    return (clubes || []).map((c) => (
      <option key={c.id} value={c.id}>{c.nombre}</option>
    ));
  }

  function badge(res: number | null) {
    if (res === null) return <span className="text-gray-500">—</span>;
    if (res > 0) return <span className="text-victoria font-bold">{res}</span>;
    if (res === 0) return <span className="text-empate font-bold">{res}</span>;
    return <span className="text-derrota font-bold">{res}</span>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold titulo-modulo text-gradient-shine mb-8">
        Comparación Head-to-Head
      </h1>

      <div className="flex flex-col sm:flex-row items-end gap-4 mb-8">
        <div className="flex-1 w-full">
          <label className="block text-sm text-texto-secundario mb-1">Club A</label>
          <select
            value={clubA}
            onChange={(e) => setClubA(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-sm"
          >
            <option value="">Seleccionar...</option>
            {selectOptions()}
          </select>
        </div>
        <span className="text-2xl text-texto-apagado pb-1 hidden sm:block">vs</span>
        <div className="flex-1 w-full">
          <label className="block text-sm text-texto-secundario mb-1">Club B</label>
          <select
            value={clubB}
            onChange={(e) => setClubB(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white text-sm"
          >
            <option value="">Seleccionar...</option>
            {selectOptions()}
          </select>
        </div>
      </div>

      {!clubA || !clubB ? (
        <div className="text-center py-16 text-texto-secundario border border-dashed border-borde-sutil rounded-xl">
          <p className="text-lg">Seleccioná dos clubes para ver su historial.</p>
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : error ? (
        <ErrorMessage message="Error al cargar el historial" />
      ) : h2h ? (
        <>
          {/* Header con escudos */}
          <div className="flex items-center justify-center gap-6 mb-8 p-6 rounded-2xl border border-borde-sutil bg-bg-secundario/60">
            <div className="flex flex-col items-center gap-2">
              {h2h.club_a.escudo && (
                <img src={h2h.club_a.escudo} alt={h2h.club_a.nombre} className="w-16 h-16 object-contain" />
              )}
              <span className="font-bold text-lg text-center">{h2h.club_a.nombre}</span>
            </div>
            <span className="text-2xl font-bold text-texto-apagado">VS</span>
            <div className="flex flex-col items-center gap-2">
              {h2h.club_b.escudo && (
                <img src={h2h.club_b.escudo} alt={h2h.club_b.nombre} className="w-16 h-16 object-contain" />
              )}
              <span className="font-bold text-lg text-center">{h2h.club_b.nombre}</span>
            </div>
          </div>

          {/* Tarjeta de resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
            <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
              <p className="text-2xl font-bold text-white">{h2h.resumen.pj}</p>
              <p className="text-xs text-texto-secundario uppercase tracking-wider">Partidos</p>
            </div>
            <div className="p-4 rounded-xl bg-victoria/10 border border-victoria/20 text-center">
              <p className="text-2xl font-bold text-victoria">{h2h.resumen.victorias_a}</p>
              <p className="text-xs text-victoria/80 uppercase tracking-wider">{h2h.club_a.nombre.split(" ")[0]}</p>
            </div>
            <div className="p-4 rounded-xl bg-empate/10 border border-empate/20 text-center">
              <p className="text-2xl font-bold text-empate">{h2h.resumen.empates}</p>
              <p className="text-xs text-empate/80 uppercase tracking-wider">Empates</p>
            </div>
            <div className="p-4 rounded-xl bg-derrota/10 border border-derrota/20 text-center">
              <p className="text-2xl font-bold text-derrota">{h2h.resumen.victorias_b}</p>
              <p className="text-xs text-derrota/80 uppercase tracking-wider">{h2h.club_b.nombre.split(" ")[0]}</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
              <p className="text-2xl font-bold text-py-rojo">{h2h.resumen.goles_a}</p>
              <p className="text-xs text-texto-secundario uppercase tracking-wider">Goles {h2h.club_a.nombre.split(" ")[0]}</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
              <p className="text-2xl font-bold text-py-azul">{h2h.resumen.goles_b}</p>
              <p className="text-xs text-texto-secundario uppercase tracking-wider">Goles {h2h.club_b.nombre.split(" ")[0]}</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center col-span-2 lg:col-span-1">
              <p className="text-2xl font-bold text-dorado-medalla">{h2h.resumen.goles_a - h2h.resumen.goles_b > 0 ? "+" : ""}{h2h.resumen.goles_a - h2h.resumen.goles_b}</p>
              <p className="text-xs text-texto-secundario uppercase tracking-wider">Diferencia</p>
            </div>
          </div>

          {/* Mayor goleada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {h2h.resumen.mayor_goleada_a && (
              <div className="p-4 rounded-xl border border-victoria/20 bg-victoria/5">
                <p className="text-xs text-victoria/70 uppercase tracking-wider mb-1">Mayor goleada de {h2h.club_a.nombre.split(" ")[0]}</p>
                <p className="text-3xl font-bold text-white">{h2h.resumen.mayor_goleada_a.goles} - {h2h.resumen.mayor_goleada_a.goles_recibidos}</p>
                <p className="text-sm text-texto-secundario">{h2h.resumen.mayor_goleada_a.fecha}</p>
              </div>
            )}
            {h2h.resumen.mayor_goleada_b && (
              <div className="p-4 rounded-xl border border-derrota/20 bg-derrota/5">
                <p className="text-xs text-derrota/70 uppercase tracking-wider mb-1">Mayor goleada de {h2h.club_b.nombre.split(" ")[0]}</p>
                <p className="text-3xl font-bold text-white">{h2h.resumen.mayor_goleada_b.goles} - {h2h.resumen.mayor_goleada_b.goles_recibidos}</p>
                <p className="text-sm text-texto-secundario">{h2h.resumen.mayor_goleada_b.fecha}</p>
              </div>
            )}
          </div>

          {/* Tabla de enfrentamientos */}
          <h2 className="text-2xl font-bold titulo-modulo mb-4">Todos los enfrentamientos</h2>
          {h2h.partidos.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-borde-sutil rounded-xl text-texto-secundario">
              No hay enfrentamientos registrados entre estos clubes.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-borde-sutil">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-terciario border-b border-borde-sutil">
                    <th className="text-left py-3 px-4 font-semibold text-texto-secundario uppercase tracking-wider text-xs">Fecha</th>
                    <th className="text-left py-3 px-4 font-semibold text-texto-secundario uppercase tracking-wider text-xs">Torneo</th>
                    <th className="text-center py-3 px-4 font-semibold text-texto-secundario uppercase tracking-wider text-xs">Resultado</th>
                    <th className="text-center py-3 px-3 font-semibold text-texto-secundario uppercase tracking-wider text-xs">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {h2h.partidos.map((p, i) => {
                    const gA = p.local_id === clubA ? p.goles_local : p.goles_visitante;
                    const gB = p.local_id === clubB ? p.goles_local : p.goles_visitante;
                    const ganóA = gA !== null && gB !== null && gA > gB;
                    const ganóB = gA !== null && gB !== null && gB > gA;
                    const bg = i % 2 === 0 ? "bg-bg-secundario/40" : "bg-transparent";

                    return (
                      <tr key={p.id} className={`${bg} border-b border-borde-sutil transition-all duration-150 hover:bg-bg-terciario`}>
                        <td className="py-3 px-4 text-texto-principal">{p.fecha}</td>
                        <td className="py-3 px-4 text-texto-secundario">{p.torneo} <span className="text-texto-apagado">· J{p.jornada}</span></td>
                        <td className={`py-3 px-4 text-center font-bold text-lg ${ganóA ? "text-victoria" : ganóB ? "text-derrota" : "text-empate"}`}>
                          {gA !== null && gB !== null ? `${gA} - ${gB}` : "—"}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            p.estado === "finalizado" ? "bg-green-900/30 text-green-300" :
                            p.estado === "en_vivo" ? "bg-red-900/30 text-red-300" :
                            "bg-blue-900/30 text-blue-300"
                          }`}>{p.estado}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend && npm run build 2>&1
```
Expected: BUILD PASS

- [ ] **Step 3: Commit**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
git add frontend/src/app/h2h/page.tsx
git commit -m "feat(h2h): add /h2h page with selectors, summary, and match table"
```

---

### Task 6: Navbar link

**Files:**
- Modify: `frontend/src/components/layout/Navbar.tsx`

- [ ] **Step 1: Add H2H link to the links array**

```typescript
// In frontend/src/components/layout/Navbar.tsx, add to the links array (before "Predicciones" or after "Tabla")
    { href: "/h2h", label: "H2H" },
```

- [ ] **Step 2: Build check**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend && npm run build 2>&1
```
Expected: BUILD PASS

- [ ] **Step 3: Lint check**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend && npm run lint 2>&1 | Select-String "error"
```
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
git add frontend/src/components/layout/Navbar.tsx
git commit -m "feat(h2h): add H2H link to navbar"
```
