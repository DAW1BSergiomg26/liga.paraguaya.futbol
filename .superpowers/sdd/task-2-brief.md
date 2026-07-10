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
