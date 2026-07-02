### Task 9: Frontend — API Client + Types

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/lib/api.ts`

**Interfaces:**
- Consumes: Backend API at `NEXT_PUBLIC_API_URL`
- Produces: Typed API client functions and TypeScript interfaces

- [ ] **Step 1: Create `frontend/src/types/index.ts`**

```typescript
export interface Club {
  id: string;
  nombre: string;
  ciudad: string;
  apodo: string;
  colores: string[];
  estadio: string;
}

export interface Partido {
  id: string;
  torneo: string;
  fecha: string;
  jornada: number;
  local_id: string;
  visitante_id: string;
  goles_local: number | null;
  goles_visitante: number | null;
  estado: string;
}

export interface PartidoDetail extends Partido {
  local_nombre: string;
  visitante_nombre: string;
}

export interface TablaRow {
  posicion: number;
  club_id: string;
  club: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  puntos: number;
}
```

- [ ] **Step 2: Create `frontend/src/lib/api.ts`**

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

import type { Club, Partido, PartidoDetail, TablaRow } from "@/types";

export async function getClubes(ciudad?: string): Promise<Club[]> {
  const params = ciudad ? `?ciudad=${encodeURIComponent(ciudad)}` : "";
  return fetchJSON<Club[]>(`/api/v1/clubes${params}`);
}

export async function getClub(id: string): Promise<Club> {
  return fetchJSON<Club>(`/api/v1/clubes/${id}`);
}

export async function getPartidos(torneo?: string, estado?: string): Promise<Partido[]> {
  const params = new URLSearchParams();
  if (torneo) params.set("torneo", torneo);
  if (estado) params.set("estado", estado);
  const qs = params.toString();
  return fetchJSON<Partido[]>(`/api/v1/partidos${qs ? `?${qs}` : ""}`);
}

export async function getPartido(id: string): Promise<PartidoDetail> {
  return fetchJSON<PartidoDetail>(`/api/v1/partidos/${id}`);
}

export async function getTabla(torneo?: string): Promise<TablaRow[]> {
  const params = torneo ? `?torneo=${encodeURIComponent(torneo)}` : "";
  return fetchJSON<TablaRow[]>(`/api/v1/tabla${params}`);
}
```

- [ ] **Step 3: Add `.env.local` for development**

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(frontend): API client and TypeScript types"
```

---


