# Task 5: Frontend types + API functions

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`

## Steps

- [ ] **Add types to `frontend/src/types/index.ts`**

Append after the `TablaRow` interface:

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  image: string;
  username: string;
  puntos: number;
  token: string;
}

export interface PredictionCreate {
  partido_id: string;
  goles_local: number;
  goles_visitante: number;
}

export interface PredictionDetail {
  id: string;
  user_id: string;
  partido_id: string;
  goles_local: number;
  goles_visitante: number;
  puntos: number;
  created_at: string;
  torneo: string;
  jornada: number;
  local_id: string;
  visitante_id: string;
  local_nombre: string;
  visitante_nombre: string;
  goles_real_local: number | null;
  goles_real_visitante: number | null;
  estado: string;
}

export interface LeaderboardEntry {
  username: string;
  name: string;
  image: string;
  puntos: number;
  aciertos: number;
  predicciones: number;
}
```

- [ ] **Add API functions to `frontend/src/lib/api.ts`**

Update the import line to include new types:
```typescript
import type { Club, ClubDetail, Partido, PartidoDetail, PartidoPage, TablaRow, User, PredictionCreate, PredictionDetail, LeaderboardEntry } from "@/types";
```

Add before `updatePartido` function:

```typescript
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem("user_token", token);
  else localStorage.removeItem("user_token");
}

export function getSavedToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("user_token");
}

async function authFetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const token = authToken || getSavedToken();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}

export async function loginWithProvider(data: {
  email: string;
  name: string;
  image?: string;
  provider: string;
  provider_id: string;
}): Promise<User> {
  return authFetchJSON<User>("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function crearPrediccion(data: PredictionCreate): Promise<PredictionDetail> {
  return authFetchJSON<PredictionDetail>("/api/v1/predicciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function misPredicciones(): Promise<PredictionDetail[]> {
  return authFetchJSON<PredictionDetail[]>("/api/v1/predicciones/mis");
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return fetchJSON<LeaderboardEntry[]>("/api/v1/leaderboard");
}
```

- [ ] **Verify TypeScript compiles**

```powershell
cd C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend && npx tsc --noEmit 2>&1
```
Expected: no errors

- [ ] **Commit**

```powershell
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
git add frontend/src/types/index.ts frontend/src/lib/api.ts
git commit -m "feat: add user, prediction types and API functions"
```
