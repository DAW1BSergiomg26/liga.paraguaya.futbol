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
