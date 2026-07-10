# Sidebar de Noticias y Navegador de Ligas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a right sidebar with league navigator and RSS news feed to /tabla and /clubes pages.

**Architecture:** Backend FastAPI parses RSS feeds from ABC Color and Última Hora via feedparser/httpx and exposes GET /api/v1/noticias. Frontend has a static data file with 20 leagues, three new sidebar components (Sidebar, NavegadorLigas, FeedNoticias), and modified page layouts using CSS grid.

**Tech Stack:** Python (feedparser, httpx), FastAPI, Next.js 16, Tailwind v4, @tanstack/react-query

## Global Constraints

- All design tokens from `globals.css` (bg-bg-secundario, py-rojo, texto-principal, etc.) — no hardcoded hex
- Frontend API calls via existing `fetchJSON` pattern in `frontend/src/lib/api.ts`
- Backend router prefix `/api/v1/noticias` — matches existing API conventions
- Barlow Condensed for headings (`.titulo-modulo` class), Inter for body
- Mobile-first: sidebar stacks below content on <1024px
- Backend tests with pytest + httpx AsyncClient

---

### Task 1: Backend — RSS news endpoint

**Files:**
- Modify: `backend/requirements.txt`
- Create: `backend/app/api/noticias.py`
- Modify: `backend/app/main.py` (register router)
- Create: `backend/tests/test_noticias.py`

**Interfaces:**
- Produces: `GET /api/v1/noticias` → `{ noticias: NoticiaOut[], fuentes: string[], actualizado: string }`

- [ ] **Step 1: Add feedparser to requirements.txt**

Insert before `pywebpush` (alphabetical order):

```
feedparser>=6.0.0
```

- [ ] **Step 2: Create `backend/app/api/noticias.py`**

```python
from datetime import datetime, timezone

import feedparser
import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/noticias", tags=["noticias"])

FUENTES = [
    {"nombre": "ABC Color", "url": "https://www.abc.com.py/rss/deportes.xml"},
    {"nombre": "Última Hora", "url": "https://www.ultimahora.com/rss/deportes.xml"},
]

MAX_NOTICIAS = 5
TIMEOUT = 10


async def _fetch_fuente(nombre: str, url: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(url)
            resp.raise_for_status()
    except Exception:
        return []

    feed = feedparser.parse(resp.text)
    items = []
    for entry in feed.entries[:5]:
        pub_date = None
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            pub_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc).isoformat()
        items.append({
            "titulo": entry.get("title", ""),
            "fuente": nombre,
            "url": entry.get("link", ""),
            "pub_date": pub_date,
            "resumen": entry.get("summary", "")[:300],
        })
    return items


@router.get("")
async def get_noticias():
    todas = []
    for fuente in FUENTES:
        items = await _fetch_fuente(fuente["nombre"], fuente["url"])
        todas.extend(items)

    todas.sort(key=lambda x: x.get("pub_date") or "", reverse=True)

    return {
        "noticias": todas[:MAX_NOTICIAS],
        "fuentes": [f["nombre"] for f in FUENTES],
        "actualizado": datetime.now(timezone.utc).isoformat(),
    }
```

- [ ] **Step 3: Register the router in `main.py`**

Add after `from backend.app.api.cron import router as cron_router`:
```python
from backend.app.api.noticias import router as noticias_router
```

Add after `app.include_router(cron_router)`:
```python
app.include_router(noticias_router)
```

- [ ] **Step 4: Create `backend/tests/test_noticias.py`**

```python
import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.main import app


@pytest.mark.asyncio
async def test_noticias_endpoint_returns_ok():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/noticias")
    assert resp.status_code == 200
    data = resp.json()
    assert "noticias" in data
    assert "fuentes" in data
    assert "actualizado" in data
    assert isinstance(data["noticias"], list)
    assert isinstance(data["fuentes"], list)
```

- [ ] **Step 5: Run the test**

```bash
cd backend && pip install -r requirements.txt && python -m pytest tests/test_noticias.py -v
```
Expected: PASS (the endpoint returns the expected JSON shape; RSS feeds may be empty in test env but structure is validated).

- [ ] **Step 6: Commit**

```bash
git add backend/requirements.txt backend/app/api/noticias.py backend/app/main.py backend/tests/test_noticias.py
git commit -m "feat(backend): add RSS news endpoint GET /api/v1/noticias"
```

---

### Task 2: Frontend — static league data file

**Files:**
- Create: `frontend/src/data/ligas.ts`

**Interfaces:**
- Produces: `export const ligas: Liga[]` with 20 entries

- [ ] **Step 1: Create `frontend/src/data/ligas.ts`**

```typescript
export interface Liga {
  id: string;
  nombre: string;
  icono: string;
  urlResultados: string;
  urlPosiciones: string;
  urlCalendario: string;
}

export const ligas: Liga[] = [
  { id: "mundial", nombre: "Mundial 2026", icono: "🏆", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/fifa.world", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/fifa.world", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/fifa.world" },
  { id: "libertadores", nombre: "CONMEBOL Libertadores", icono: "🏆", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/conmebol.libertadores", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/conmebol.libertadores", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/conmebol.libertadores" },
  { id: "sudamericana", nombre: "CONMEBOL Sudamericana", icono: "🏆", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/conmebol.sudamericana", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/conmebol.sudamericana", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/conmebol.sudamericana" },
  { id: "liga-py", nombre: "Liga Paraguaya", icono: "🇵🇾", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/par.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/par.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/par.1" },
  { id: "liga-arg", nombre: "Liga Profesional Argentina", icono: "🇦🇷", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/arg.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/arg.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/arg.1" },
  { id: "la-liga", nombre: "LALIGA", icono: "🇪🇸", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/esp.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/esp.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/esp.1" },
  { id: "premier", nombre: "Premier League", icono: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/eng.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/eng.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/eng.1" },
  { id: "serie-a", nombre: "Serie A", icono: "🇮🇹", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/ita.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/ita.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/ita.1" },
  { id: "bundesliga", nombre: "Bundesliga", icono: "🇩🇪", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/ger.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/ger.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/ger.1" },
  { id: "ligue-1", nombre: "Ligue 1", icono: "🇫🇷", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/fra.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/fra.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/fra.1" },
  { id: "eredivisie", nombre: "Eredivisie", icono: "🇳🇱", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/ned.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/ned.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/ned.1" },
  { id: "liga-portugal", nombre: "Liga Portugal", icono: "🇵🇹", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/por.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/por.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/por.1" },
  { id: "mls", nombre: "Major League Soccer", icono: "🇺🇸", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/usa.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/usa.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/usa.1" },
  { id: "liga-mx", nombre: "Liga MX", icono: "🇲🇽", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/mex.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/mex.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/mex.1" },
  { id: "brasileirao", nombre: "Campeonato Brasileño", icono: "🇧🇷", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/bra.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/bra.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/bra.1" },
  { id: "chile", nombre: "Liga Chilena", icono: "🇨🇱", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/chi.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/chi.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/chi.1" },
  { id: "uruguay", nombre: "Campeonato Uruguayo", icono: "🇺🇾", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/uru.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/uru.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/uru.1" },
  { id: "colombia", nombre: "Colombia Primera A", icono: "🇨🇴", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/col.1", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/col.1", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/col.1" },
  { id: "ucl", nombre: "UEFA Champions League", icono: "⭐", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/uefa.champions", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/uefa.champions", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/uefa.champions" },
  { id: "uel", nombre: "UEFA Europa League", icono: "⭐", urlResultados: "https://espndeportes.espn.com/futbol/resultados/_/liga/uefa.europa", urlPosiciones: "https://espndeportes.espn.com/futbol/posiciones/_/liga/uefa.europa", urlCalendario: "https://espndeportes.espn.com/futbol/calendario/_/liga/uefa.europa" },
];
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/data/ligas.ts
git commit -m "feat(frontend): add static league data for sidebar navigator"
```

---

### Task 3: Frontend — API function for news

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/types/index.ts`

**Interfaces:**
- Consumes: `GET /api/v1/noticias` from Task 1
- Produces: `Noticia` type + `getNoticias()` export

- [ ] **Step 1: Add Noticia type to `frontend/src/types/index.ts`**

```typescript
export interface Noticia {
  titulo: string;
  fuente: string;
  url: string;
  pub_date: string | null;
  resumen: string;
}

export interface NoticiasResponse {
  noticias: Noticia[];
  fuentes: string[];
  actualizado: string;
}
```

- [ ] **Step 2: Add getNoticias to `frontend/src/lib/api.ts`**

Add to the import line (before `Club`):
```typescript
import type { ..., Noticia, NoticiasResponse } from "@/types";
```

Add after `getLeaderboard()`:
```typescript
export async function getNoticias(): Promise<NoticiasResponse> {
  return fetchJSON<NoticiasResponse>("/api/v1/noticias");
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/types/index.ts
git commit -m "feat(frontend): add Noticia type and getNoticias API function"
```

---

### Task 4: Frontend — NavegadorLigas component

**Files:**
- Create: `frontend/src/components/sidebar/NavegadorLigas.tsx`

**Interfaces:**
- Consumes: `ligas` from Task 2
- Produces: `<NavegadorLigas />` component

- [ ] **Step 1: Create `frontend/src/components/sidebar/NavegadorLigas.tsx`**

```tsx
import { ligas } from "@/data/ligas";

function LinkLiga({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-texto-secundario hover:text-py-rojo transition-colors duration-150"
    >
      {children}
    </a>
  );
}

export default function NavegadorLigas() {
  return (
    <div className="bg-bg-secundario rounded-xl border border-borde-sutil p-4">
      <h3 className="font-barlow text-lg font-semibold uppercase tracking-wide text-texto-principal mb-3">
        Otras Ligas
      </h3>
      <div className="space-y-3">
        {ligas.map((liga) => (
          <div key={liga.id}>
            <div className="flex items-start gap-2">
              <span className="text-base shrink-0 mt-0.5">{liga.icono}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-texto-principal truncate">
                  {liga.nombre}
                </p>
                <div className="flex gap-2 mt-0.5">
                  <LinkLiga href={liga.urlResultados}>Resultados</LinkLiga>
                  <span className="text-borde-sutil">·</span>
                  <LinkLiga href={liga.urlPosiciones}>Posiciones</LinkLiga>
                  <span className="text-borde-sutil">·</span>
                  <LinkLiga href={liga.urlCalendario}>Calendario</LinkLiga>
                </div>
              </div>
            </div>
            {liga.id !== ligas[ligas.length - 1].id && (
              <hr className="mt-3 border-borde-sutil" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/sidebar/NavegadorLigas.tsx
git commit -m "feat(frontend): add NavegadorLigas component"
```

---

### Task 5: Frontend — FeedNoticias component

**Files:**
- Create: `frontend/src/components/sidebar/FeedNoticias.tsx`

**Interfaces:**
- Consumes: `getNoticias()` from Task 3
- Produces: `<FeedNoticias />` component

- [ ] **Step 1: Create `frontend/src/components/sidebar/FeedNoticias.tsx`**

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { getNoticias } from "@/lib/api";

function formatearFecha(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const ahora = new Date();
  const diffMs = ahora.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Hace ${diffHr}h`;
  const diffDias = Math.floor(diffHr / 24);
  if (diffDias < 7) return `Hace ${diffDias}d`;
  return d.toLocaleDateString("es-PY", { day: "numeric", month: "short" });
}

export default function FeedNoticias() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["noticias"],
    queryFn: getNoticias,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="bg-bg-secundario rounded-xl border border-borde-sutil p-4">
        <h3 className="font-barlow text-lg font-semibold uppercase tracking-wide text-texto-principal mb-3">
          Noticias
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-1.5">
              <div className="h-3 bg-texto-principal/5 rounded w-full" />
              <div className="h-2 bg-texto-principal/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bg-secundario rounded-xl border border-borde-sutil p-4">
        <h3 className="font-barlow text-lg font-semibold uppercase tracking-wide text-texto-principal mb-3">
          Noticias
        </h3>
        <p className="text-texto-apagado text-sm">No hay noticias disponibles</p>
      </div>
    );
  }

  const noticias = data?.noticias ?? [];

  if (noticias.length === 0) {
    return (
      <div className="bg-bg-secundario rounded-xl border border-borde-sutil p-4">
        <h3 className="font-barlow text-lg font-semibold uppercase tracking-wide text-texto-principal mb-3">
          Noticias
        </h3>
        <p className="text-texto-apagado text-sm">No hay noticias disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secundario rounded-xl border border-borde-sutil p-4">
      <h3 className="font-barlow text-lg font-semibold uppercase tracking-wide text-texto-principal mb-3">
        Noticias
      </h3>
      <div className="space-y-4">
        {noticias.map((n, i) => (
          <a
            key={i}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-l-2 border-py-rojo pl-3 hover:border-py-rojo/70 transition-colors group"
          >
            <p className="text-sm text-texto-principal group-hover:text-py-rojo transition-colors leading-snug">
              {n.titulo}
            </p>
            <p className="text-xs text-texto-secundario mt-1">
              {n.fuente}
              {n.pub_date ? ` · ${formatearFecha(n.pub_date)}` : ""}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/sidebar/FeedNoticias.tsx
git commit -m "feat(frontend): add FeedNoticias component with RSS news"
```

---

### Task 6: Frontend — Sidebar wrapper component

**Files:**
- Create: `frontend/src/components/sidebar/Sidebar.tsx`

**Interfaces:**
- Produces: `<Sidebar />` component (composes NavegadorLigas + FeedNoticias)

- [ ] **Step 1: Create `frontend/src/components/sidebar/Sidebar.tsx`**

```tsx
import NavegadorLigas from "./NavegadorLigas";
import FeedNoticias from "./FeedNoticias";

export default function Sidebar() {
  return (
    <aside className="space-y-6">
      <NavegadorLigas />
      <FeedNoticias />
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/sidebar/Sidebar.tsx
git commit -m "feat(frontend): add Sidebar wrapper component"
```

---

### Task 7: Modify /tabla page layout

**Files:**
- Modify: `frontend/src/app/tabla/page.tsx`

- [ ] **Step 1: Modify layout to add sidebar**

The current outer container is:
```tsx
<div className="max-w-6xl mx-auto px-4 py-12">
```

Replace it with a grid container:
```tsx
<div className="max-w-6xl mx-auto px-4 py-12">
  <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
    <div>
      {/* existing content */}
    </div>
    <div className="mt-8 lg:mt-0">
      <Sidebar />
    </div>
  </div>
</div>
```

Specifically, the file currently looks like:

```tsx
export default function TablaPage() {
  // ...hooks...

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="bg-gradient-to-br from-bg-secundario/80 to-bg-primario ...">
        ...hero header...
      </div>

      {isLoading && <TableSkeleton rows={12} cols={10} />}
      {error && <ErrorMessage message={error.message} />}
      {tabla && tabla.length === 0 && <div>...</div>}
      {tabla && tabla.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-borde-sutil">
          <table>
            ...
          </table>
        </div>
      )}
    </div>
  );
}
```

Change the return to wrap content in a grid. The sidebar goes below the hero but alongside the table:

```tsx
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="bg-gradient-to-br from-bg-secundario/80 to-bg-primario ...">
        ...hero header... (unchanged)
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div>
          {isLoading && <TableSkeleton rows={12} cols={10} />}
          {error && <ErrorMessage message={error.message} />}
          {tabla && tabla.length === 0 && (
            <div className="text-center py-16 text-texto-secundario">
              No hay datos para este torneo
            </div>
          )}
          {tabla && tabla.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-borde-sutil">
              <table>...</table>
            </div>
          )}
        </div>

        <div className="mt-8 lg:mt-0">
          <Sidebar />
        </div>
      </div>
    </div>
  );
```

Add the Sidebar import at the top:
```tsx
import Sidebar from "@/components/sidebar/Sidebar";
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/tabla/page.tsx
git commit -m "feat(frontend): add sidebar layout to /tabla page"
```

---

### Task 8: Modify /clubes page layout

**Files:**
- Modify: `frontend/src/app/clubes/page.tsx`

- [ ] **Step 1: Modify layout to add sidebar**

Current layout:
```tsx
export default function ClubesPage() {
  // ...hooks...

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Clubes</h1>

      {isLoading && <CardSkeleton count={6} />}
      {error && <ErrorMessage message={error.message} />}
      {clubes && clubes.length === 0 && <div>...</div>}
      {clubes && clubes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ...
        </div>
      )}
    </div>
  );
}
```

Change to:
```tsx
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-8">Clubes</h1>

          {isLoading && <CardSkeleton count={6} />}
          {error && <ErrorMessage message={error.message} />}
          {clubes && clubes.length === 0 && (
            <div className="text-center py-16 text-texto-secundario">
              No hay clubes registrados
            </div>
          )}
          {clubes && clubes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ...
            </div>
          )}
        </div>

        <div className="mt-8 lg:mt-0">
          <Sidebar />
        </div>
      </div>
    </div>
  );
```

Add the Sidebar import at the top:
```tsx
import Sidebar from "@/components/sidebar/Sidebar";
```

- [ ] **Step 2: Run frontend build check**

```bash
cd frontend && npx next build 2>&1 | tail -20
```
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/clubes/page.tsx
git commit -m "feat(frontend): add sidebar layout to /clubes page"
```
