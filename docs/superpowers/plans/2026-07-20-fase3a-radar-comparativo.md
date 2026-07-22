# Fase 3A — Radar de Stats Comparativo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Comparar Clubes" tab with a D3.js hexagonal radar chart comparing 6 normalized metrics between two clubs.

**Architecture:** Backend endpoint computes normalized 0-100 scores for 6 metrics across 2 selected clubs. Frontend renders an SVG hexagonal radar chart with two overlaid polygons using D3-scale + GSAP animation.

**Tech Stack:** FastAPI, SQLAlchemy async, Pydantic, D3-scale (already installed), GSAP (already installed), React, TypeScript, Tailwind CSS, Playwright.

## Global Constraints

- **Spanish (castellano)** for all communication
- **TDD mandatory:** tests BEFORE implementation in each change
- **Verification mandatory:** `python -m pytest backend/tests/ -v` (174+ must pass) and `cd frontend && npm run build` (clean) before reporting success
- **No paid tiers:** free tiers only (Render free, Neon free, Vercel free)
- **No fallback to dead backend** in `frontend/src/lib/api.ts`
- **APF colors:** `#CC001C` (rojo), `#00619E` (azul), `#FFCC00` (dorado), `#0A0A0A` (negro)
- **No new D3 dependencies:** `d3-scale` already installed; use raw trigonometry for polygon geometry

---

## File Structure

### Backend (create/modify)
- `backend/app/schemas/historial.py` — Add `MetricaRadar`, `ClubRadar`, `ComparacionClubOut`
- `backend/app/services/historial_service.py` — Add `comparar_clubes()` + in-memory TTL cache
- `backend/app/api/historial.py` — Add `GET /comparar` endpoint
- `backend/tests/test_historial_comparar.py` — **CREATE** (TDD)

### Frontend (create/modify)
- `frontend/src/types/index.ts` — Add `MetricaRadar`, `ClubRadar`, `ComparacionClubesResponse`
- `frontend/src/lib/api.ts` — Add `getComparacionClubes()`
- `frontend/src/components/historial/RadarComparativo.tsx` — **CREATE** D3 SVG radar
- `frontend/src/components/historial/CompararClubes.tsx` — **CREATE** page wrapper
- `frontend/src/components/historial/HistorialTabs.tsx` — Add 4th tab
- `frontend/src/app/historial/page.tsx` — Render `CompararClubes`
- `frontend/e2e/radar-comparativo.spec.ts` — **CREATE** E2E tests

---

### Task 1: Backend Pydantic Schemas

**Files:**
- Modify: `backend/app/schemas/historial.py`
- Test: N/A (schema-only, validated by service tests in Task 2)

**Interfaces:**
- Produces: `MetricaRadar`, `ClubRadar`, `ComparacionClubOut` (used by Tasks 2, 4)

- [ ] **Step 1: Add schema classes**

Append to `backend/app/schemas/historial.py`:

```python
class MetricaRadar(BaseModel):
    ataque: float = 0.0
    defensa: float = 0.0
    rendimiento: float = 0.0
    palmares: float = 0.0
    gol_individual: float = 0.0
    actividad_mercado: float = 0.0


class ClubRadar(BaseModel):
    club_id: str
    nombre: str
    escudo: str | None = None
    metricas: MetricaRadar


class ComparacionClubOut(BaseModel):
    club_a: ClubRadar
    club_b: ClubRadar
```

- [ ] **Step 2: Verify import works**

Run: `cd backend && python -c "from backend.app.schemas.historial import ComparacionClubOut; print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/historial.py
git commit -m "feat(backend): add radar comparison schemas"
```

---

### Task 2: Backend Tests TDD (Write Failing Tests)

**Files:**
- Create: `backend/tests/test_historial_comparar.py`
- Test: same file

**Interfaces:**
- Consumes: `ComparacionClubOut` from Task 1, `HistorialService` from existing code
- Produces: tests that define the contract for Task 3

- [ ] **Step 1: Create test file with seed fixture and 7 tests**

Create `backend/tests/test_historial_comparar.py`:

```python
import pytest
from sqlalchemy import select

from backend.app.models.club import Club
from backend.app.models.tabla import TablaPosicion
from backend.app.models.goleador import Goleador
from backend.app.models.transferencia import Transferencia
from backend.app.services.historial_service import HistorialService


@pytest.fixture
async def seed_comparar(db_session):
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="Decano", colores=[], estadio="MF", escudo="o.png"),
        Club(id="libertad", nombre="Club Libertad", ciudad="Asunción", apodo="Gumarelo", colores=[], estadio="NL", escudo="l.png"),
        Club(id="cerro", nombre="Club Cerro Porteño", ciudad="Asunción", apodo="Ciclón", colores=[], estadio="GPR", escudo="c.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()

    tabla_rows = [
        TablaPosicion(torneo="Apertura 2024", jornada=0, club_id="olimpia", posicion=2, pj=22, pg=13, pe=5, pp=4, gf=40, gc=20, dg=20, puntos=44),
        TablaPosicion(torneo="Apertura 2024", jornada=0, club_id="libertad", posicion=1, pj=22, pg=14, pe=6, pp=2, gf=42, gc=16, dg=26, puntos=48),
        TablaPosicion(torneo="Apertura 2024", jornada=0, club_id="cerro", posicion=3, pj=22, pg=12, pe=5, pp=5, gf=35, gc=25, dg=10, puntos=41),
        TablaPosicion(torneo="Clausura 2024", jornada=0, club_id="olimpia", posicion=1, pj=22, pg=15, pe=4, pp=3, gf=45, gc=18, dg=27, puntos=49),
        TablaPosicion(torneo="Clausura 2024", jornada=0, club_id="libertad", posicion=2, pj=22, pg=14, pe=4, pp=4, gf=40, gc=20, dg=20, puntos=46),
        TablaPosicion(torneo="Clausura 2024", jornada=0, club_id="cerro", posicion=3, pj=22, pg=10, pe=6, pp=6, gf=30, gc=28, dg=2, puntos=36),
    ]
    for r in tabla_rows:
        db_session.add(r)
    await db_session.flush()

    goleadores = [
        Goleador(id="g1", nombre="Golero A", club_id="olimpia", goles=15, asistencias=3, torneo="Apertura 2024", temporada="2024"),
        Goleador(id="g2", nombre="Golero B", club_id="olimpia", goles=10, asistencias=5, torneo="Clausura 2024", temporada="2024"),
        Goleador(id="g3", nombre="Golero C", club_id="libertad", goles=12, asistencias=2, torneo="Apertura 2024", temporada="2024"),
        Goleador(id="g4", nombre="Golero D", club_id="libertad", goles=8, asistencias=1, torneo="Clausura 2024", temporada="2024"),
    ]
    for g in goleadores:
        db_session.add(g)
    await db_session.flush()

    transferencias = [
        Transferencia(jugador_nombre="Ref1", club_destino_id="olimpia", fecha="2024-01-15", tipo="compra", estado="confirmada", monto=500000),
        Transferencia(jugador_nombre="Ref2", club_destino_id="libertad", fecha="2024-02-01", tipo="compra", estado="confirmada", monto=300000),
        Transferencia(jugador_nombre="Ref3", club_destino_id="libertad", fecha="2024-03-01", tipo="compra", estado="confirmada", monto=200000),
    ]
    for t in transferencias:
        db_session.add(t)
    await db_session.flush()


@pytest.mark.asyncio
async def test_comparar_clubes_normalizacion(db_session, seed_comparar):
    svc = HistorialService(db_session)
    result = await svc.comparar_clubes("olimpia", "libertad")
    for metrica in [result.club_a.metricas, result.club_b.metricas]:
        assert 0 <= metrica.ataque <= 100
        assert 0 <= metrica.defensa <= 100
        assert 0 <= metrica.rendimiento <= 100
        assert 0 <= metrica.palmares <= 100
        assert 0 <= metrica.gol_individual <= 100
        assert 0 <= metrica.actividad_mercado <= 100


@pytest.mark.asyncio
async def test_comparar_clubes_diferentes(db_session, seed_comparar):
    svc = HistorialService(db_session)
    result = await svc.comparar_clubes("olimpia", "libertad")
    assert result.club_a.club_id == "olimpia"
    assert result.club_b.club_id == "libertad"
    assert result.club_a.metricas.ataque != result.club_b.metricas.ataque


@pytest.mark.asyncio
async def test_comparar_clubes_palmares(db_session, seed_comparar):
    svc = HistorialService(db_session)
    result = await svc.comparar_clubes("olimpia", "libertad")
    assert result.club_a.metricas.palmares == 100.0  # olimpia has 1 title, libertad has 1
    assert result.club_b.metricas.palmares == 100.0  # both have 1 title = 1/1 * 100


@pytest.mark.asyncio
async def test_comparar_clubes_sin_goleadores(db_session, seed_comparar):
    svc = HistorialService(db_session)
    result = await svc.comparar_clubes("olimpia", "cerro")
    assert result.club_b.metricas.gol_individual == 0.0  # cerro has no goleadores


@pytest.mark.asyncio
async def test_comparar_clubes_pj_zero(db_session):
    clubs = [
        Club(id="nuevo", nombre="Club Nuevo", ciudad="Test", apodo="Test", colores=[], estadio="Test", escudo="t.png"),
        Club(id="otro", nombre="Club Otro", ciudad="Test", apodo="Test", colores=[], estadio="Test", escudo="t2.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()
    svc = HistorialService(db_session)
    result = await svc.comparar_clubes("nuevo", "otro")
    assert result.club_a.metricas.ataque == 0.0
    assert result.club_a.metricas.defensa == 0.0
    assert result.club_a.metricas.rendimiento == 0.0


@pytest.mark.asyncio
async def test_comparar_clubes_endpoint(client, db_session, seed_comparar):
    resp = await client.get("/api/v1/historial/comparar?club_a=olimpia&club_b=libertad")
    assert resp.status_code == 200
    data = resp.json()
    assert "club_a" in data
    assert "club_b" in data
    assert data["club_a"]["club_id"] == "olimpia"
    assert "metricas" in data["club_a"]
    assert "ataque" in data["club_a"]["metricas"]


@pytest.mark.asyncio
async def test_comparar_clubes_endpoint_missing_param(client, db_session, seed_comparar):
    resp = await client.get("/api/v1/historial/comparar?club_a=olimpia")
    assert resp.status_code == 422
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest backend/tests/test_historial_comparar.py -v`
Expected: FAIL (all tests fail because `comparar_clubes` method doesn't exist yet)

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_historial_comparar.py
git commit -m "test(backend): add failing tests for historial comparar endpoint"
```

---

### Task 3: Backend Service Implementation

**Files:**
- Modify: `backend/app/services/historial_service.py`
- Test: `backend/tests/test_historial_comparar.py` (from Task 2)

**Interfaces:**
- Consumes: `MetricaRadar`, `ClubRadar`, `ComparacionClubOut` from Task 1
- Produces: `HistorialService.comparar_clubes(club_a_id, club_b_id) -> ComparacionClubOut` (used by Task 4)

- [ ] **Step 1: Add imports and cache variables**

Add to top of `backend/app/services/historial_service.py` after existing imports:

```python
import time
from backend.app.models.goleador import Goleador
from backend.app.models.transferencia import Transferencia
from backend.app.schemas.historial import (
    CampeonOut,
    ClubRadar,
    ClubTemporadaOut,
    ComparacionClubOut,
    MetricaRadar,
    RankingClubOut,
)

_CACHE: dict[tuple[str, str], tuple[float, ComparacionClubOut]] = {}
_CACHE_TTL = 30  # seconds
```

- [ ] **Step 2: Add comparar_clubes method to HistorialService**

Append to end of `HistorialService` class:

```python
    async def comparar_clubes(self, club_a_id: str, club_b_id: str) -> ComparacionClubOut:
        cache_key = tuple(sorted([club_a_id, club_b_id]))
        now = time.time()
        if cache_key in _CACHE:
            cached_time, cached_result = _CACHE[cache_key]
            if now - cached_time < _CACHE_TTL:
                return cached_result

        # 1. Aggregated tabla stats per club
        result = await self.db.execute(select(TablaPosicion))
        rows = result.scalars().all()

        agg: dict[str, dict] = {}
        titulos: dict[str, int] = {}
        for t in rows:
            a = agg.setdefault(t.club_id, {"pj": 0, "gf": 0, "gc": 0, "puntos": 0})
            a["pj"] += t.pj
            a["gf"] += t.gf
            a["gc"] += t.gc
            a["puntos"] += t.puntos
            if t.posicion == 1:
                titulos[t.club_id] = titulos.get(t.club_id, 0) + 1

        # 2. Goals per player aggregated by club
        goleadores_result = await self.db.execute(select(Goleador))
        goleadores = goleadores_result.scalars().all()
        goles_por_club: dict[str, int] = {}
        for g in goleadores:
            goles_por_club[g.club_id] = goles_por_club.get(g.club_id, 0) + g.goles

        # 3. Transfer spending per club
        transfer_result = await self.db.execute(
            select(Transferencia).where(
                Transferencia.monto.isnot(None),
                Transferencia.estado.in_(["confirmada", "oficial"]),
            )
        )
        transferencias = transfer_result.scalars().all()
        monto_por_club: dict[str, float] = {}
        for t in transferencias:
            if t.club_destino_id:
                monto_por_club[t.club_destino_id] = monto_por_club.get(t.club_destino_id, 0) + (t.monto or 0)
            if t.club_origen_id:
                monto_por_club[t.club_origen_id] = monto_por_club.get(t.club_origen_id, 0) + (t.monto or 0)

        # 4. Compute league maximums for normalization
        all_club_ids = set(agg.keys()) | set(goles_por_club.keys()) | set(monto_por_club.keys()) | set(titulos.keys())
        max_ataque = 0.0
        max_defensa_inv = 0.0
        max_titulos = max(titulos.values()) if titulos else 1
        max_goles = max(goles_por_club.values()) if goles_por_club else 1
        max_monto = max(monto_por_club.values()) if monto_por_club else 1

        for cid in all_club_ids:
            a = agg.get(cid, {"pj": 0, "gf": 0, "gc": 0, "puntos": 0})
            pj = a["pj"]
            if pj > 0:
                ataque_rate = a["gf"] / pj
                defensa_inv = 1 - (a["gc"] / pj)
                if ataque_rate > max_ataque:
                    max_ataque = ataque_rate
                if defensa_inv > max_defensa_inv:
                    max_defensa_inv = defensa_inv

        # Avoid division by zero
        if max_ataque == 0:
            max_ataque = 1
        if max_defensa_inv == 0:
            max_defensa_inv = 1
        if max_titulos == 0:
            max_titulos = 1
        if max_goles == 0:
            max_goles = 1
        if max_monto == 0:
            max_monto = 1

        def _build_metricas(club_id: str) -> MetricaRadar:
            a = agg.get(club_id, {"pj": 0, "gf": 0, "gc": 0, "puntos": 0})
            pj = a["pj"]
            if pj > 0:
                ataque = min(100.0, (a["gf"] / pj) / max_ataque * 100)
                defensa = min(100.0, max(0, (1 - a["gc"] / pj)) / max_defensa_inv * 100)
                rendimiento = min(100.0, a["puntos"] / (pj * 3) * 100)
            else:
                ataque = defensa = rendimiento = 0.0

            palmares = min(100.0, titulos.get(club_id, 0) / max_titulos * 100)
            gol_ind = min(100.0, goles_por_club.get(club_id, 0) / max_goles * 100)
            merc = min(100.0, monto_por_club.get(club_id, 0) / max_monto * 100)

            return MetricaRadar(
                ataque=round(ataque, 2),
                defensa=round(defensa, 2),
                rendimiento=round(rendimiento, 2),
                palmares=round(palmares, 2),
                gol_individual=round(gol_ind, 2),
                actividad_mercado=round(merc, 2),
            )

        club_rows = (await self.db.execute(select(Club))).scalars().all()
        club_map = {c.id: c for c in club_rows}

        def _build_club(club_id: str) -> ClubRadar:
            c = club_map.get(club_id)
            return ClubRadar(
                club_id=club_id,
                nombre=c.nombre if c else club_id,
                escudo=c.escudo if c else None,
                metricas=_build_metricas(club_id),
            )

        comparison = ComparacionClubOut(
            club_a=_build_club(club_a_id),
            club_b=_build_club(club_b_id),
        )

        _CACHE[cache_key] = (now, comparison)
        return comparison
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `cd backend && python -m pytest backend/tests/test_historial_comparar.py -v`
Expected: All 7 tests PASS

- [ ] **Step 4: Commit**

```bash
git add backend/app/services/historial_service.py
git commit -m "feat(backend): implement comparar_clubes with normalization and cache"
```

---

### Task 4: Backend Endpoint

**Files:**
- Modify: `backend/app/api/historial.py`
- Test: `backend/tests/test_historial_comparar.py` (endpoint tests already in Task 2)

**Interfaces:**
- Consumes: `ComparacionClubOut`, `HistorialService.comparar_clubes()` from Task 3
- Produces: `GET /api/v1/historial/comparar` endpoint (consumed by frontend Task 7)

- [ ] **Step 1: Add import and endpoint**

Add to imports in `backend/app/api/historial.py`:

```python
from backend.app.schemas.historial import (
    CampeonOut,
    ClubTemporadaOut,
    ComparacionClubOut,
    RankingClubOut,
)
```

Add endpoint at end of file:

```python
@router.get("/comparar", response_model=ComparacionClubOut)
async def comparar_clubes(
    club_a: str,
    club_b: str,
    db: AsyncSession = Depends(get_db),
):
    return await HistorialService(db).comparar_clubes(club_a, club_b)
```

- [ ] **Step 2: Run tests to verify endpoint works**

Run: `cd backend && python -m pytest backend/tests/test_historial_comparar.py -v`
Expected: All 7 tests PASS (endpoint tests from Task 2 should now pass)

- [ ] **Step 3: Run full backend test suite**

Run: `cd backend && python -m pytest backend/tests/ -v`
Expected: All 174+ tests PASS (no regressions)

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/historial.py
git commit -m "feat(backend): add GET /historial/comparar endpoint"
```

---

### Task 5: Frontend Types and API Function

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`
- Test: `cd frontend && npm run build` (TypeScript compilation)

**Interfaces:**
- Consumes: Backend endpoint contract from Task 4
- Produces: TypeScript types and `getComparacionClubes()` function (used by Tasks 8, 9)

- [ ] **Step 1: Add TypeScript interfaces**

Add to `frontend/src/types/index.ts` before the closing `// === Simulador de Partidos` section (after line 414):

```typescript
// === Comparación de Clubes (Radar) ===
export interface MetricaRadar {
  ataque: number;
  defensa: number;
  rendimiento: number;
  palmares: number;
  gol_individual: number;
  actividad_mercado: number;
}

export interface ClubRadar {
  club_id: string;
  nombre: string;
  escudo: string | null;
  metricas: MetricaRadar;
}

export interface ComparacionClubesResponse {
  club_a: ClubRadar;
  club_b: ClubRadar;
}
```

- [ ] **Step 2: Add API function**

Add to `frontend/src/lib/api.ts` after `getClubHistorial`:

```typescript
export async function getComparacionClubes(clubA: string, clubB: string): Promise<ComparacionClubesResponse> {
  return apiFetch<ComparacionClubesResponse>(
    `/api/v1/historial/comparar?club_a=${encodeURIComponent(clubA)}&club_b=${encodeURIComponent(clubB)}`
  );
}
```

Also add `ComparacionClubesResponse` to the import from `@/types` at top of file:

```typescript
import type { Club, ClubDetail, Partido, PartidoDetail, PartidoPage, TablaRow, User, PredictionCreate, PredictionDetail, LeaderboardEntry, Noticia, NoticiasPaginatedResponse, H2HResponse, EquipoTactico, AnalisisPartido, EquipoResumenTactico, AuthUser, TokenResponse, CampeonHistorico, RankingClubHistorico, ClubTemporadaHistorica, EstadisticasTransferencias, SimulationInput, SimulationResultOut, ComparacionClubesResponse } from "@/types";
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/lib/api.ts
git commit -m "feat(frontend): add radar comparison types and API function"
```

---

### Task 6: Frontend RadarComparativo Component

**Files:**
- Create: `frontend/src/components/historial/RadarComparativo.tsx`
- Test: Manual visual + `npm run build`

**Interfaces:**
- Consumes: `ClubRadar` from Task 5
- Produces: `<RadarComparativo clubA={...} clubB={...} />` (used by Task 7)

- [ ] **Step 1: Create RadarComparativo component**

Create `frontend/src/components/historial/RadarComparativo.tsx`:

```tsx
"use client";

import { useEffect, useRef, useMemo } from "react";
import { initGSAP, gsap } from "@/lib/gsap";
import type { ClubRadar } from "@/types";

const AXES = [
  { key: "ataque", label: "Ataque" },
  { key: "defensa", label: "Defensa" },
  { key: "rendimiento", label: "Rendimiento" },
  { key: "palmares", label: "Palmarés" },
  { key: "gol_individual", label: "Gol Individual" },
  { key: "actividad_mercado", label: "Actividad Mercado" },
] as const;

const SIZE = 500;
const CENTER = SIZE / 2;
const MAX_RADIUS = 180;
const LEVELS = 5;

function getAxisAngle(index: number): number {
  return -Math.PI / 2 + (index * Math.PI * 3) / (AXES.length);
}

function getPolygonPath(values: number[], maxVal: number): string {
  const points = values.map((v, i) => {
    const angle = getAxisAngle(i);
    const r = (v / maxVal) * MAX_RADIUS;
    return {
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle),
    };
  });
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
}

interface RadarProps {
  clubA: ClubRadar;
  clubB: ClubRadar;
}

export default function RadarComparativo({ clubA, clubB }: RadarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathARef = useRef<SVGPathElement>(null);
  const pathBRef = useRef<SVGPathElement>(null);

  const metricKeys = AXES.map((a) => a.key);
  const valuesA = metricKeys.map((k) => clubA.metricas[k]);
  const valuesB = metricKeys.map((k) => clubB.metricas[k]);

  const finalPathA = useMemo(() => getPolygonPath(valuesA, 100), [valuesA]);
  const finalPathB = useMemo(() => getPolygonPath(valuesB, 100), [valuesB]);
  const zeroPath = useMemo(() => getPolygonPath([0, 0, 0, 0, 0, 0], 100), []);

  useEffect(() => {
    initGSAP();
    const pathA = pathARef.current;
    const pathB = pathBRef.current;
    if (!pathA || !pathB) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      gsap.set(pathA, { attr: { d: finalPathA } });
      gsap.set(pathB, { attr: { d: finalPathB } });
      return;
    }

    gsap.set(pathA, { attr: { d: zeroPath } });
    gsap.set(pathB, { attr: { d: zeroPath } });

    const tl = gsap.timeline();
    tl.to(pathA, {
      attr: { d: finalPathA },
      duration: 0.8,
      ease: "power2.out",
    });
    tl.to(
      pathB,
      { attr: { d: finalPathB }, duration: 0.8, ease: "power2.out" },
      "<0.1"
    );

    return () => {
      tl.kill();
    };
  }, [finalPathA, finalPathB, zeroPath]);

  return (
    <div className="flex flex-col items-center gap-6">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[500px]"
      >
        {/* Concentric hexagons */}
        {Array.from({ length: LEVELS }).map((_, i) => {
          const level = ((i + 1) / LEVELS) * 100;
          const pts = Array.from({ length: AXES.length }).map((_, j) => {
            const angle = getAxisAngle(j);
            const r = (level / 100) * MAX_RADIUS;
            return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
          });
          return (
            <polygon
              key={i}
              points={pts.join(" ")}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines + labels */}
        {AXES.map((axis, i) => {
          const angle = getAxisAngle(i);
          const x2 = CENTER + MAX_RADIUS * Math.cos(angle);
          const y2 = CENTER + MAX_RADIUS * Math.sin(angle);
          const labelX = CENTER + (MAX_RADIUS + 24) * Math.cos(angle);
          const labelY = CENTER + (MAX_RADIUS + 24) * Math.sin(angle);
          return (
            <g key={axis.key}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-texto-secundario text-[11px] font-medium"
              >
                {axis.label}
              </text>
            </g>
          );
        })}

        {/* Club A polygon */}
        <path
          ref={pathARef}
          d={zeroPath}
          fill="#CC001C"
          fillOpacity={0.25}
          stroke="#CC001C"
          strokeWidth={2}
        />

        {/* Club B polygon */}
        <path
          ref={pathBRef}
          d={zeroPath}
          fill="#00619E"
          fillOpacity={0.25}
          stroke="#00619E"
          strokeWidth={2}
        />

        {/* Axis dots for Club A */}
        {valuesA.map((v, i) => {
          const angle = getAxisAngle(i);
          const r = (v / 100) * MAX_RADIUS;
          return (
            <circle
              key={`a-${i}`}
              cx={CENTER + r * Math.cos(angle)}
              cy={CENTER + r * Math.sin(angle)}
              r={4}
              fill="#CC001C"
              stroke="#0A0E1A"
              strokeWidth={2}
            />
          );
        })}

        {/* Axis dots for Club B */}
        {valuesB.map((v, i) => {
          const angle = getAxisAngle(i);
          const r = (v / 100) * MAX_RADIUS;
          return (
            <circle
              key={`b-${i}`}
              cx={CENTER + r * Math.cos(angle)}
              cy={CENTER + r * Math.sin(angle)}
              r={4}
              fill="#00619E"
              stroke="#0A0E1A"
              strokeWidth={2}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#CC001C]" />
          <span className="text-texto-secundario">{clubA.nombre}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#00619E]" />
          <span className="text-texto-secundario">{clubB.nombre}</span>
        </div>
      </div>

      {/* Stats table */}
      <div className="w-full max-w-[500px] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde-sutil">
              <th className="p-2 text-left text-texto-secundario">Métrica</th>
              <th className="p-2 text-right text-texto-secundario">{clubA.nombre}</th>
              <th className="p-2 text-right text-texto-secundario">{clubB.nombre}</th>
            </tr>
          </thead>
          <tbody>
            {AXES.map((axis) => (
              <tr key={axis.key} className="border-b border-borde-sutil">
                <td className="p-2 text-texto-principal">{axis.label}</td>
                <td className="p-2 text-right font-mono text-[#CC001C]">
                  {clubA.metricas[axis.key].toFixed(1)}
                </td>
                <td className="p-2 text-right font-mono text-[#00619E]">
                  {clubB.metricas[axis.key].toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/historial/RadarComparativo.tsx
git commit -m "feat(frontend): add RadarComparativo D3 SVG component"
```

---

### Task 7: Frontend CompararClubes Wrapper + Tabs Integration

**Files:**
- Create: `frontend/src/components/historial/CompararClubes.tsx`
- Modify: `frontend/src/components/historial/HistorialTabs.tsx`
- Modify: `frontend/src/app/historial/page.tsx`
- Test: `cd frontend && npm run build`

**Interfaces:**
- Consumes: `RadarComparativo` from Task 6, `getComparacionClubes()` and `getClubes()` from Task 5
- Produces: Fully integrated "Comparar Clubes" tab on the historial page

- [ ] **Step 1: Create CompararClubes wrapper**

Create `frontend/src/components/historial/CompararClubes.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClubes, getComparacionClubes } from "@/lib/api";
import RadarComparativo from "./RadarComparativo";
import { StatsSkeleton } from "@/components/ui/Skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import type { Club, ComparacionClubesResponse } from "@/types";

export default function CompararClubes() {
  const [clubAId, setClubAId] = useState("");
  const [clubBId, setClubBId] = useState("");

  const { data: clubes } = useQuery<Club[]>({
    queryKey: ["clubes"],
    queryFn: () => getClubes(),
  });

  const canCompare = clubAId !== "" && clubBId !== "" && clubAId !== clubBId;

  const { data, isLoading, error } = useQuery<ComparacionClubesResponse>({
    queryKey: ["comparar", clubAId, clubBId],
    queryFn: () => getComparacionClubes(clubAId, clubBId),
    enabled: canCompare,
  });

  return (
    <div className="space-y-8">
      {/* Club selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <div>
          <label className="block text-sm text-texto-secundario mb-1">Club A</label>
          <select
            value={clubAId}
            onChange={(e) => setClubAId(e.target.value)}
            className="w-full p-3 rounded-lg bg-bg-terciario border border-borde-sutil text-texto-principal text-sm"
          >
            <option value="">Seleccionar club...</option>
            {(clubes || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-texto-secundario mb-1">Club B</label>
          <select
            value={clubBId}
            onChange={(e) => setClubBId(e.target.value)}
            className="w-full p-3 rounded-lg bg-bg-terciario border border-borde-sutil text-texto-principal text-sm"
          >
            <option value="">Seleccionar club...</option>
            {(clubes || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {clubAId && clubBId && clubAId === clubBId && (
        <p className="text-center text-empate text-sm">Seleccioná dos clubes diferentes para comparar.</p>
      )}

      {/* Results */}
      {isLoading && <StatsSkeleton />}
      {error && <ErrorMessage message={error instanceof Error ? error.message : "Error al cargar comparación"} />}
      {data && <RadarComparativo clubA={data.club_a} clubB={data.club_b} />}
    </div>
  );
}
```

- [ ] **Step 2: Add 4th tab to HistorialTabs**

Modify `frontend/src/components/historial/HistorialTabs.tsx`:

```typescript
const TABS = [
  { key: "tablas", label: "Tablas por año" },
  { key: "ranking", label: "Ranking agregado" },
  { key: "club", label: "Rendimiento por club" },
  { key: "comparar", label: "Comparar Clubes" },
];
```

- [ ] **Step 3: Add import and render in historial page**

Modify `frontend/src/app/historial/page.tsx`:

Add import:
```typescript
import CompararClubes from "@/components/historial/CompararClubes";
```

Add render inside the tab content area (after `{tab === "club" && <RendimientoClub />}`):
```tsx
{tab === "comparar" && <CompararClubes />}
```

- [ ] **Step 4: Verify build passes**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/historial/CompararClubes.tsx frontend/src/components/historial/HistorialTabs.tsx frontend/src/app/historial/page.tsx
git commit -m "feat(frontend): add Comparar Clubes tab with selectors"
```

---

### Task 8: E2E Tests

**Files:**
- Create: `frontend/e2e/radar-comparativo.spec.ts`
- Test: Run the e2e tests

**Interfaces:**
- Consumes: Complete feature from Tasks 1-7

- [ ] **Step 1: Create Playwright test**

Create `frontend/e2e/radar-comparativo.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Radar Comparativo", () => {
  test("shows comparar tab and selects clubs", async ({ page }) => {
    await page.goto("http://localhost:3000/historial");
    await page.waitForLoadState("networkidle");

    // Click "Comparar Clubes" tab
    const compararTab = page.getByRole("button", { name: /Comparar Clubes/i });
    await compararTab.click();

    // Two select dropdowns should be visible
    const selects = page.locator("select");
    await expect(selects).toHaveCount(2);

    // Select first club in first dropdown
    await selects.nth(0).selectOption({ index: 1 });

    // Select second club in second dropdown (different from first)
    await selects.nth(1).selectOption({ index: 2 });

    // Radar SVG should render with polygon paths
    await page.waitForTimeout(1500); // Wait for API + animation
    const svgPaths = page.locator("svg polygon");
    await expect(svgPaths.first()).toBeVisible();
  });

  test("shows error when same club selected twice", async ({ page }) => {
    await page.goto("http://localhost:3000/historial");
    await page.waitForLoadState("networkidle");

    const compararTab = page.getByRole("button", { name: /Comparar Clubes/i });
    await compararTab.click();

    const selects = page.locator("select");
    await selects.nth(0).selectOption({ index: 1 });
    await selects.nth(1).selectOption({ index: 1 }); // Same club

    const warning = page.getByText(/clubes diferentes/i);
    await expect(warning).toBeVisible();
  });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `cd frontend && npx playwright test e2e/radar-comparativo.spec.ts`
Expected: Tests pass (assuming dev server or production build is running)

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/radar-comparativo.spec.ts
git commit -m "test(e2e): add radar comparativo Playwright tests"
```

---

### Task 9: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full backend test suite**

Run: `cd backend && python -m pytest backend/tests/ -v`
Expected: All 174+ tests PASS (including the 7 new comparar tests)

- [ ] **Step 2: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Clean build, no errors

- [ ] **Step 3: Run E2E tests**

Run: `cd frontend && npx playwright test`
Expected: All tests pass (existing + new radar tests)

- [ ] **Step 4: Final commit (if any remaining changes)**

```bash
git add -A
git status
# Only commit if there are unstaged changes
```
