### Task 4: Frontend types + API function

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`

**Interfaces:**
- Consumes: Backend `H2HOut` response shape (ClubResumen, MayorGoleada, H2HPartidoItem, H2HOut)
- Produces: `H2HResponse` TypeScript interface, `getH2H(clubA, clubB): Promise<H2HResponse>`

#### Step 1: Add H2HResponse type

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

#### Step 2: Add getH2H API function

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

#### Step 3: Build check

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend && npm run build 2>&1
```
Expected: BUILD PASS

#### Step 4: Commit

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
git add frontend/src/types/index.ts frontend/src/lib/api.ts
git commit -m "feat(h2h): add H2HResponse type and getH2H API"
```
