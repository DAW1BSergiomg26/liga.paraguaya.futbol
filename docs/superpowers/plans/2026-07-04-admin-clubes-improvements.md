# Admin Panel + Clubes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement task-by-task.

**Goal:** Add pagination, save feedback, and input validation to the admin panel; populate missing club crests and kits.

**Architecture:** Backend pagination via offset/limit on existing partidos endpoint; frontend pagination component with toast notification system; data-only changes to clubes JSON.

**Tech Stack:** FastAPI, SQLAlchemy async, Next.js 14+, React Query, Tailwind CSS

## Global Constraints

- All new backend schemas inherit `PartidoOut` / use `from_attributes`
- Backend tests use SQLite in-memory (`sqlite+aiosqlite://`)
- Frontend follows existing patterns: `useQuery` from `@tanstack/react-query`, Tailwind classes
- No new npm/pip dependencies
- Data for escudos/camisetas from Wikipedia Commons only (public domain)

---
## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/app/schemas/partido.py` | Modify | Add `PartidoPage` schema |
| `backend/app/services/partido_service.py` | Modify | Add `get_all_paginated()` method |
| `backend/app/api/partidos.py` | Modify | Support `page`/`per_page` query params |
| `backend/tests/test_partidos.py` | Modify | Add pagination tests |
| `frontend/src/types/index.ts` | Modify | Add `PartidoPage` interface |
| `frontend/src/lib/api.ts` | Modify | Update `getPartidos()` for pagination |
| `frontend/src/components/Pagination.tsx` | Create | Reusable pagination nav component |
| `frontend/src/app/admin/partidos/page.tsx` | Modify | Pagination, toast, validation |
| `data/clubes_paraguay.json` | Modify | Populate escudos + camisetas URLs |

---

### Task 1: Backend pagination schema + service + endpoint

**Files:**
- Modify: `backend/app/schemas/partido.py`
- Modify: `backend/app/services/partido_service.py`
- Modify: `backend/app/api/partidos.py`

**Interfaces:**
- Consumes: `PartidoOut` schema
- Produces: `PartidoPage` schema, `PartidoService.get_all_paginated()`, paginated `GET /api/v1/partidos`

- [ ] **Add `PartidoPage` schema to `backend/app/schemas/partido.py`**

After existing imports, add:

```python
from pydantic import BaseModel


class PartidoPage(BaseModel):
    data: list[PartidoOut]
    total: int
    page: int
    per_page: int
    total_pages: int
```

- [ ] **Add `get_all_paginated()` to `backend/app/services/partido_service.py`**

Add this method to `PartidoService`:

```python
@staticmethod
async def get_all_paginated(
    db: AsyncSession,
    torneo: Optional[str] = None,
    estado: Optional[str] = None,
    page: int = 1,
    per_page: int = 25,
) -> tuple[list[PartidoOut], int]:
    from sqlalchemy import func
    base = select(Partido)
    if torneo:
        base = base.where(Partido.torneo == torneo)
    if estado:
        base = base.where(Partido.estado == estado)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = base.order_by(Partido.fecha.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(stmt)
    partidos = result.scalars().all()
    return [PartidoOut.model_validate(p) for p in partidos], total
```

- [ ] **Update endpoint in `backend/app/api/partidos.py`**

Replace `listar_partidos` with:

```python
@router.get("", response_model=PartidoPage)
async def listar_partidos(
    page: int = 1,
    per_page: int = 25,
    torneo: Optional[str] = None,
    estado: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    if page < 1:
        page = 1
    if per_page < 1:
        per_page = 25
    if per_page > 100:
        per_page = 100
    partidos, total = await PartidoService.get_all_paginated(
        db, torneo=torneo, estado=estado, page=page, per_page=per_page
    )
    return PartidoPage(
        data=partidos,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page if total > 0 else 1,
    )
```

Update imports if needed: `from backend.app.schemas.partido import PartidoDetailOut, PartidoOut, PartidoPage`

- [ ] **Run tests to verify existing ones still pass**

```bash
cd backend && python -m pytest tests/test_partidos.py -v
```
Expected: 3 passed

---

### Task 2: Backend tests for pagination

**Files:**
- Modify: `backend/tests/test_partidos.py`

- [ ] **Add pagination tests**

Add after the existing tests:

```python
@pytest.mark.asyncio
async def test_listar_partidos_paginado(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/partidos?page=1&per_page=10")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "total" in data
    assert "page" in data
    assert "per_page" in data
    assert "total_pages" in data
    assert len(data["data"]) == 1
    assert data["total"] == 1
    assert data["page"] == 1
    assert data["per_page"] == 10
    assert data["total_pages"] == 1


@pytest.mark.asyncio
async def test_listar_partidos_pagina_vacia(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/partidos?page=99&per_page=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 0
    assert data["page"] == 99
```

- [ ] **Run tests**

```bash
cd backend && python -m pytest tests/test_partidos.py -v
```
Expected: 5 passed

- [ ] **Commit**

```bash
git add backend/app/schemas/partido.py backend/app/services/partido_service.py backend/app/api/partidos.py backend/tests/test_partidos.py
git commit -m "feat: add pagination to partidos endpoint"
```

---

### Task 3: Frontend types + API update

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`

- [ ] **Add `PartidoPage` interface to `frontend/src/types/index.ts`**

Add after `TablaRow`:

```typescript
export interface PartidoPage {
  data: Partido[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
```

- [ ] **Update `getPartidos()` in `frontend/src/lib/api.ts`**

Replace the existing function:

```typescript
export async function getPartidos(
  torneo?: string,
  estado?: string,
  page?: number,
  per_page?: number
): Promise<PartidoPage> {
  const params = new URLSearchParams();
  if (torneo) params.set("torneo", torneo);
  if (estado) params.set("estado", estado);
  if (page) params.set("page", page.toString());
  if (per_page) params.set("per_page", per_page.toString());
  const qs = params.toString();
  return fetchJSON<PartidoPage>(`/api/v1/partidos${qs ? `?${qs}` : ""}`);
}
```

Update the import to include `PartidoPage`:

```typescript
import type { Club, ClubDetail, Partido, PartidoDetail, PartidoPage, TablaRow } from "@/types";
```

- [ ] **Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit 2>&1
```
Expected: no errors

- [ ] **Commit**

```bash
git add frontend/src/types/index.ts frontend/src/lib/api.ts
git commit -m "feat: add PartidoPage type and update API function"
```

---

### Task 4: Pagination component

**Files:**
- Create: `frontend/src/components/Pagination.tsx`

- [ ] **Create `frontend/src/components/Pagination.tsx`**

```tsx
"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Anterior
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="text-gray-500 px-1">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
              p === page
                ? "bg-[#76e4f7] text-black"
                : "border border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Siguiente
      </button>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add frontend/src/components/Pagination.tsx
git commit -m "feat: add Pagination component"
```

---

### Task 5: Admin page integration (pagination + toast + validation)

**Files:**
- Modify: `frontend/src/app/admin/partidos/page.tsx`

- [ ] **Rewrite `frontend/src/app/admin/partidos/page.tsx`**

Replace entire file content:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPartidos, updatePartido, getClubes } from "@/lib/api";
import type { Partido, PartidoPage } from "@/types";
import Pagination from "@/components/Pagination";

export default function AdminPartidosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ goles_local: "", goles_visitante: "", estado: "programado" });
  const [filtroTorneo, setFiltroTorneo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const key = localStorage.getItem("admin_api_key");
    if (!key) router.push("/admin");
    else setApiKey(key);
  }, [router]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const { data: pageData, isLoading } = useQuery<PartidoPage>({
    queryKey: ["partidos", filtroTorneo, filtroEstado, page],
    queryFn: () => getPartidos(filtroTorneo || undefined, filtroEstado || undefined, page, 20),
    enabled: !!apiKey,
  });

  const { data: clubes } = useQuery({
    queryKey: ["clubes"],
    queryFn: () => getClubes(),
    enabled: !!apiKey,
  });

  const clubMap = new Map(clubes?.map((c) => [c.id, c.nombre]) || []);

  function startEdit(p: Partido) {
    setEditingId(p.id);
    setForm({
      goles_local: p.goles_local?.toString() ?? "",
      goles_visitante: p.goles_visitante?.toString() ?? "",
      estado: p.estado,
    });
    setError("");
  }

  function validarGoles(val: string): boolean {
    if (val === "") return true;
    const n = Number(val);
    return Number.isInteger(n) && n >= 0;
  }

  async function handleSave(id: string) {
    if (!apiKey) return;
    if (!validarGoles(form.goles_local) || !validarGoles(form.goles_visitante)) {
      setError("Los goles deben ser números enteros no negativos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updatePartido(
        id,
        {
          goles_local: form.goles_local !== "" ? Number(form.goles_local) : null,
          goles_visitante: form.goles_visitante !== "" ? Number(form.goles_visitante) : null,
          estado: form.estado,
        },
        apiKey
      );
      await queryClient.invalidateQueries({ queryKey: ["partidos"] });
      setEditingId(null);
      showToast("success", "Partido actualizado correctamente");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
      setError(msg);
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  }

  function handleFilterChange(type: "torneo" | "estado", value: string) {
    if (type === "torneo") setFiltroTorneo(value);
    else setFiltroEstado(value);
    setPage(1);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin - Partidos</h1>
        <button
          onClick={() => { localStorage.removeItem("admin_api_key"); router.push("/admin"); }}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Cerrar sesión
        </button>
      </div>

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
          toast.type === "success"
            ? "bg-green-900/80 text-green-200 border border-green-700/50"
            : "bg-red-900/80 text-red-200 border border-red-700/50"
        }`}>
          {toast.type === "success" ? "✓ " : "✗ "}{toast.message}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <select
          value={filtroTorneo}
          onChange={(e) => handleFilterChange("torneo", e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-sm"
        >
          <option value="">Todos los torneos</option>
          <option value="Apertura 2026">Apertura 2026</option>
          <option value="Clausura 2026">Clausura 2026</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => handleFilterChange("estado", e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="programado">Programado</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-900/30 text-red-300 text-sm">{error}</div>}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando partidos...</div>
      ) : (
        <>
          <div className="space-y-2">
            {(pageData?.data || []).map((p) => (
              <div
                key={p.id}
                className={`p-4 rounded-xl border border-white/10 transition-colors ${
                  editingId === p.id ? "bg-[#0a2a1a]/60 border-green-700/30" : "bg-[#0a1628]/60"
                }`}
              >
                {editingId === p.id ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-400">
                      {p.torneo} · Jornada {p.jornada} · {new Date(p.fecha).toLocaleDateString("es-PY")}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white font-medium w-40 text-right">{clubMap.get(p.local_id) || p.local_id}</span>
                      <input
                        type="number"
                        min="0"
                        className="w-16 px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-center"
                        value={form.goles_local}
                        onChange={(e) => setForm({ ...form, goles_local: e.target.value })}
                      />
                      <span className="text-gray-400">vs</span>
                      <input
                        type="number"
                        min="0"
                        className="w-16 px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-center"
                        value={form.goles_visitante}
                        onChange={(e) => setForm({ ...form, goles_visitante: e.target.value })}
                      />
                      <span className="text-white font-medium w-40">{clubMap.get(p.visitante_id) || p.visitante_id}</span>
                      <select
                        value={form.estado}
                        onChange={(e) => setForm({ ...form, estado: e.target.value })}
                        className="px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-sm"
                      >
                        <option value="programado">Programado</option>
                        <option value="finalizado">Finalizado</option>
                      </select>
                      <button
                        onClick={() => handleSave(p.id)}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg bg-[#76e4f7] text-black font-semibold text-sm hover:bg-[#5ac8df] transition disabled:opacity-50"
                      >
                        {saving ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startEdit(p)} className="w-full text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium w-40 text-right">{clubMap.get(p.local_id) || p.local_id}</span>
                        <span className="text-white font-bold">
                          {p.goles_local !== null ? `${p.goles_local} - ${p.goles_visitante}` : "vs"}
                        </span>
                        <span className="text-white font-medium w-40">{clubMap.get(p.visitante_id) || p.visitante_id}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500">{p.torneo} · J{p.jornada}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          p.estado === "finalizado"
                            ? "bg-green-900/30 text-green-300"
                            : "bg-yellow-900/30 text-yellow-300"
                        }`}>
                          {p.estado}
                        </span>
                        <span className="text-[#76e4f7] text-xs">Editar</span>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>

          {pageData && (
            <Pagination
              page={pageData.page}
              totalPages={pageData.total_pages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit 2>&1
```
Expected: no errors

- [ ] **Commit**

```bash
git add frontend/src/app/admin/partidos/page.tsx
git commit -m "feat: integrate pagination, toast, and validation in admin panel"
```

---

### Task 6: Populate missing club escudos and camisetas

**Files:**
- Modify: `data/clubes_paraguay.json`

- [ ] **Update `data/clubes_paraguay.json` with URLs for escudo and camiseta**

Set each club's `escudo` and `camiseta`:

| Club | escudo | camiseta |
|------|--------|----------|
| Olimpia | ✅ ya tiene | ✅ ya tiene |
| Cerro Porteño | ✅ ya tiene | `https://upload.wikimedia.org/wikipedia/commons/4/4f/Escudo_Cerro_Porte%C3%B1o.png` |
| Libertad | ✅ ya tiene | `https://upload.wikimedia.org/wikipedia/commons/0/0d/Escudo_del_Club_Libertad.png` |
| Guaraní | ✅ ya tiene | `https://upload.wikimedia.org/wikipedia/commons/1/1a/Guaran%C3%AD_Logo_2018.png` (actualizar) |
| Nacional | ✅ ya tiene | `https://upload.wikimedia.org/wikipedia/commons/a/a3/Escudo_Nacional_Paraguay.png` |
| Recoleta | `https://upload.wikimedia.org/wikipedia/en/4/4e/Deportivo_Recoleta_logo.png` | `https://upload.wikimedia.org/wikipedia/en/4/4e/Deportivo_Recoleta_logo.png` |
| Rubio Ñu | `https://upload.wikimedia.org/wikipedia/en/7/76/Club_Rubio_%C3%91u_logo.png` | `https://upload.wikimedia.org/wikipedia/en/7/76/Club_Rubio_%C3%91u_logo.png` |
| 2 de Mayo | `https://upload.wikimedia.org/wikipedia/commons/b/b4/Escudo_Oficial_del_Club_2_de_Mayo_de_Paraguay.svg` | `https://upload.wikimedia.org/wikipedia/commons/b/b4/Escudo_Oficial_del_Club_2_de_Mayo_de_Paraguay.svg` |
| Ameliano | `https://upload.wikimedia.org/wikipedia/en/e/e5/Club_Sportivo_Ameliano.png` | `https://upload.wikimedia.org/wikipedia/en/e/e5/Club_Sportivo_Ameliano.png` |
| Luqueño | `https://upload.wikimedia.org/wikipedia/commons/1/15/EscudoLuque2022.png` | `https://upload.wikimedia.org/wikipedia/commons/1/15/EscudoLuque2022.png` |
| San Lorenzo | `https://upload.wikimedia.org/wikipedia/commons/3/3d/Escudo_Sportivo_San_Lorenzo.png` | `https://upload.wikimedia.org/wikipedia/commons/3/3d/Escudo_Sportivo_San_Lorenzo.png` |
| Trinidense | `https://upload.wikimedia.org/wikipedia/commons/2/2a/Club_Sportivo_Trinidense.svg` | `https://upload.wikimedia.org/wikipedia/commons/2/2a/Club_Sportivo_Trinidense.svg` |

- [ ] **Commit**

```bash
git add data/clubes_paraguay.json
git commit -m "feat: populate missing escudos and camisetas for all clubs"
```

---

### Task 7: Run full test suite

- [ ] **Run backend tests**

```bash
cd backend && python -m pytest tests/ -v 2>&1
```
Expected: all tests pass

- [ ] **Run frontend type check**

```bash
cd frontend && npx tsc --noEmit 2>&1
```
Expected: no errors

- [ ] **Commit any fixes if needed**
