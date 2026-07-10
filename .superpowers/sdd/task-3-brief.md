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

Replace the Resultado cell (lines 156-165 in original):

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

Add animated pulse to EstadoBadge for en_vivo (modify the `en_vivo` style at line 20):

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
