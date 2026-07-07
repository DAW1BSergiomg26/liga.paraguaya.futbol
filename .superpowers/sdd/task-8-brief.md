# Task 8: Frontend partidos pages — prediction integration

**Files:**
- Modify: `frontend/src/app/partidos/page.tsx`
- Modify: `frontend/src/app/partidos/[id]/page.tsx`

## Steps

- [ ] **Modify `frontend/src/app/partidos/page.tsx`** — add "Predecir" button and PredictionModal

Add these imports after the existing ones (add after line 10):
```tsx
import { useState, useEffect } from "react";
import { getSavedToken, setAuthToken } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import PredictionModal from "@/components/PredictionModal";
```

In the `PartidosContent` function, add state after `const clubMap...` block (after line 51):
```tsx
const queryClient = useQueryClient();
const [userToken, setUserToken] = useState<string | null>(null);
const [predictionPartido, setPredictionPartido] = useState<Partido | null>(null);

useEffect(() => {
  const token = getSavedToken();
  if (token) {
    setAuthToken(token);
    setUserToken(token);
  }
}, []);
```

In the table header row, add a new `<th>` after the Estado column:
```tsx
<th className="text-center py-3 px-2">Estado</th>
<th className="text-center py-3 px-2">Pronóstico</th>
<th className="text-center py-3 px-2">Jornada</th>
```

In the table body, add a new `<td>` after the EstadoBadge column:
```tsx
<td className="py-3 px-2 text-center">
  <EstadoBadge estado={p.estado} />
</td>
<td className="py-3 px-2 text-center">
  {userToken && p.estado === "programado" && (
    <button
      onClick={() => setPredictionPartido(p)}
      className="text-xs px-2 py-1 rounded-lg bg-[#1a2a3a] border border-white/10 text-[#76e4f7] hover:bg-[#76e4f7] hover:text-black transition"
    >
      🔮 Predecir
    </button>
  )}
</td>
```

Before the closing `</div>` of the table section and after the table, add the modal:
```tsx
      {predictionPartido && (
        <PredictionModal
          partido={predictionPartido}
          clubLocal={clubMap.get(predictionPartido.local_id) || predictionPartido.local_id}
          clubVisitante={clubMap.get(predictionPartido.visitante_id) || predictionPartido.visitante_id}
          onClose={() => setPredictionPartido(null)}
          onSuccess={() => {
            setPredictionPartido(null);
            queryClient.invalidateQueries({ queryKey: ["predicciones"] });
          }}
        />
      )}
```

- [ ] **Modify `frontend/src/app/partidos/[id]/page.tsx`** — show user's prediction

Add imports after existing ones (after line 9):
```tsx
import { useEffect, useState } from "react";
import { getSavedToken, setAuthToken, misPredicciones } from "@/lib/api";
import type { PredictionDetail } from "@/types";
```

Add state after `const id = params.id as string;` (after line 13):
```tsx
const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
const [loggedIn, setLoggedIn] = useState(false);

useEffect(() => {
  const token = getSavedToken();
  if (token) {
    setAuthToken(token);
    setLoggedIn(true);
    misPredicciones().then((preds) => {
      const found = preds.find((p) => p.partido_id === id);
      if (found) setPrediction(found);
    }).catch(() => {});
  }
}, [id]);
```

After the main detail card (after line 111), add the prediction section:
```tsx
      {prediction && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold mb-4">🔮 Tu predicción</h2>
          <div className={`p-4 rounded-xl border ${
            prediction.puntos === 3 ? "border-green-500/50 bg-green-900/20" :
            prediction.puntos === 2 ? "border-yellow-500/50 bg-yellow-900/20" :
            prediction.puntos === 0 && prediction.estado === "finalizado" ? "border-red-500/50 bg-red-900/20" :
            "border-white/10 bg-[#0a1628]/60"
          }`}>
            <div className="flex items-center justify-center gap-4 text-2xl font-bold">
              <span>{partido.local_nombre}</span>
              <span className="text-[#76e4f7]">{prediction.goles_local} - {prediction.goles_visitante}</span>
              <span>{prediction.visitante_nombre}</span>
            </div>
            {prediction.puntos > 0 && (
              <p className="text-center mt-2 font-semibold text-green-400">+{prediction.puntos} pts</p>
            )}
          </div>
        </section>
      )}
```

- [ ] **Verify TypeScript compiles**

```powershell
cd C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend && npx tsc --noEmit 2>&1
```
Expected: no errors

- [ ] **Commit**

```powershell
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
git add frontend/src/app/partidos/page.tsx frontend/src/app/partidos/[id]/page.tsx
git commit -m "feat: integrate prediction button and display in partidos"
```
