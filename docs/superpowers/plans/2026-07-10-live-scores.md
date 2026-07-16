# Live Scores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show live scores and minute counter on the `/partidos` list page via a batch endpoint.

**Architecture:** New `GET /api/v1/partidos/marcadores` endpoint returns all `en_vivo` scores in one dict. Frontend polls it with a new `useLiveScores` hook and overlays scores on the existing table for live matches.

**Tech Stack:** FastAPI (backend), React + TanStack Query (frontend)

## Global Constraints

- Reuse existing `MarcadorOut` schema (defined in `backend/app/api/partidos.py`)
- No new frontend deps
- Follow existing patterns: `PartidoService` static methods, async client tests, hooks in `hooks/` dir

---

### Task 1: Backend service method + endpoint + tests

**Files:**
- Modify: `backend/app/services/partido_service.py` (add `get_en_vivo`)
- Modify: `backend/app/api/partidos.py` (add `GET /marcadores`)
- Create: `backend/tests/test_marcadores.py`

**Interfaces:**
- Consumes: `Partido` model with `estado`, `goles_local`, `goles_visitante`, `fecha`, `id` fields
- Produces: `PartidoService.get_en_vivo(db) -> list[Partido]` (scalar list, raw ORM objects), `GET /api/v1/partidos/marcadores -> dict[str, MarcadorOut]`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_marcadores.py`:

```python
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime, timezone

from backend.app.services.partido_service import PartidoService


class TestMarcadorEndpoint:
    @pytest.mark.asyncio
    async def test_marcadores_empty_when_no_en_vivo(self, client: AsyncClient):
        resp = await client.get("/api/v1/partidos/marcadores")
        assert resp.status_code == 200
        assert resp.json() == {}


class TestGetEnVivo:
    @pytest.mark.asyncio
    async def test_get_en_vivo_empty(self):
        db = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        db.execute = AsyncMock(return_value=mock_result)

        result = await PartidoService.get_en_vivo(db)
        assert result == []

    @pytest.mark.asyncio
    async def test_get_en_vivo_filters_only_en_vivo(self):
        from backend.app.models.partido import Partido

        db = AsyncMock(spec=AsyncSession)
        live = MagicMock(spec=Partido, id="p1", estado="en_vivo", goles_local=1, goles_visitante=0,
                         fecha=date.today())
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [live]
        db.execute = AsyncMock(return_value=mock_result)

        result = await PartidoService.get_en_vivo(db)
        assert len(result) == 1
        assert result[0].id == "p1"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && $env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest tests/test_marcadores.py -v`
Expected: FAIL with "PartidoService has no attribute 'get_en_vivo'"

- [ ] **Step 3: Add `get_en_vivo` to `PartidoService`**

Add to `backend/app/services/partido_service.py` before `get_h2h`:

```python
@staticmethod
async def get_en_vivo(db: AsyncSession) -> list[Partido]:
    stmt = select(Partido).where(Partido.estado == "en_vivo")
    result = await db.execute(stmt)
    return list(result.scalars().all())
```

- [ ] **Step 4: Add endpoint to `backend/app/api/partidos.py`**

Add before `get /h2h`:

```python
@router.get("/marcadores")
async def marcadores_en_vivo(db: AsyncSession = Depends(get_db)):
    partidos = await PartidoService.get_en_vivo(db)
    now = datetime.now(timezone.utc)
    result = {}
    for p in partidos:
        minuto = 0
        if isinstance(p.fecha, date):
            match_start = datetime.combine(p.fecha, datetime.min.time(), tzinfo=timezone.utc)
            delta = now - match_start
            minuto = min(max(int(delta.total_seconds() // 60), 0), 120)
        result[p.id] = MarcadorOut(
            goles_local=p.goles_local,
            goles_visitante=p.goles_visitante,
            minuto=minuto,
        )
    return result
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && $env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest tests/test_marcadores.py -v`
Expected: PASS (2 passed)

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/partido_service.py backend/app/api/partidos.py backend/tests/test_marcadores.py
git commit -m "feat: add GET /api/v1/partidos/marcadores batch endpoint"
```

---

### Task 2: Frontend `useLiveScores` hook

**Files:**
- Create: `frontend/src/hooks/useLiveScores.ts`

**Interfaces:**
- Consumes: `GET /api/v1/partidos/marcadores` returning `Record<string, {goles_local, goles_visitante, minuto}>`
- Produces: `useLiveScores() -> Record<string, LiveScore>` with polling every 30s

- [ ] **Step 1: Write the hook**

Create `frontend/src/hooks/useLiveScores.ts`:

```typescript
import { useState, useEffect } from "react";

interface LiveScore {
  goles_local: number | null;
  goles_visitante: number | null;
  minuto: number;
}

const POLL_INTERVAL = 30_000;

export function useLiveScores(): Record<string, LiveScore> {
  const [scores, setScores] = useState<Record<string, LiveScore>>({});

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${base}/api/v1/partidos/marcadores`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setScores(data);
        }
      } catch {
        // ignore poll errors
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return scores;
}
```

- [ ] **Step 2: Verify build still passes**

Run: `cd frontend && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useLiveScores.ts
git commit -m "feat: add useLiveScores hook for batch live score polling"
```

---

### Task 3: Integrate live scores into `/partidos` list page

**Files:**
- Modify: `frontend/src/app/partidos/page.tsx`

- [ ] **Step 1: Add import and hook call**

Add at the top of `frontend/src/app/partidos/page.tsx`:

```typescript
import { useLiveScores } from "@/hooks/useLiveScores";
```

Inside `PartidosContent()` after the existing hooks:

```typescript
const liveScores = useLiveScores();
```

- [ ] **Step 2: Sort rows: en_vivo first, then programado, then finalizado**

Replace the `.map()` with a sorted variant. After `const partidos = partidosPage?.data;` add:

```typescript
const sorted = useMemo(() => {
  if (!partidos) return [];
  const order = { en_vivo: 0, programado: 1, finalizado: 2 };
  return [...partidos].sort(
    (a, b) => (order[a.estado] ?? 9) - (order[b.estado] ?? 9)
  );
}, [partidos]);
```

Add `useMemo` import to existing react import:

```typescript
import { useState, useEffect, useMemo } from "react";
```

Replace `{partidos.map((p) => {` with `{sorted.map((p) => {`.

- [ ] **Step 3: Show live score and minute for en_vivo rows**

Replace the Resultado cell (lines 156-165):

```typescript
<td className="py-3 px-2 text-center">
  <Link
    href={`/partidos/${p.id}`}
    className="text-white font-bold hover:text-py-rojo transition"
  >
    {p.estado === "en_vivo" && liveScores[p.id]
      ? `${liveScores[p.id].goles_local ?? p.goles_local ?? "?"} - ${liveScores[p.id].goles_visitante ?? p.goles_visitante ?? "?"}`
      : tieneResultado
        ? `${p.goles_local} - ${p.goles_visitante}`
        : "vs"}
  </Link>
  {p.estado === "en_vivo" && liveScores[p.id] && liveScores[p.id].minuto > 0 && (
    <div className="text-xs text-red-400 mt-0.5">
      {liveScores[p.id].minuto}'
    </div>
  )}
</td>
```

Add animated pulse to EstadoBadge for en_vivo (modify the `en_vivo` style in `EstadoBadge`):

```typescript
en_vivo: "bg-red-900/30 text-red-300 animate-pulse",
```

- [ ] **Step 4: Build to verify**

Run: `cd frontend && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/partidos/page.tsx
git commit -m "feat: show live scores and minute on partidos list page"
```

---

## Spec Coverage

| Spec Requirement | Task |
|---|---|
| `GET /api/v1/partidos/marcadores` endpoint | Task 1 |
| `PartidoService.get_en_vivo()` | Task 1 |
| Hook `useLiveScores()` polling every 30s | Task 2 |
| Live scores on list page for en_vivo | Task 3 |
| Minute counter below score | Task 3 |
| en_vivo rows sorted first | Task 3 |
| Badge animate-pulse for en_vivo | Task 3 |
