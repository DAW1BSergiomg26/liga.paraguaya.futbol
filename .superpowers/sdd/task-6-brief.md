# Task 6: Frontend PredictionModal component

**Files:**
- Create: `frontend/src/components/PredictionModal.tsx`

## Steps

- [ ] **Create `frontend/src/components/PredictionModal.tsx`**

```tsx
"use client";

import { useState } from "react";
import { crearPrediccion } from "@/lib/api";
import type { Partido } from "@/types";

interface PredictionModalProps {
  partido: Partido;
  clubLocal: string;
  clubVisitante: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PredictionModal({
  partido,
  clubLocal,
  clubVisitante,
  onClose,
  onSuccess,
}: PredictionModalProps) {
  const [golesLocal, setGolesLocal] = useState("");
  const [golesVisitante, setGolesVisitante] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const gl = Number(golesLocal);
    const gv = Number(golesVisitante);
    if (!Number.isInteger(gl) || !Number.isInteger(gv) || gl < 0 || gv < 0) {
      setError("Los goles deben ser números enteros no negativos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await crearPrediccion({
        partido_id: partido.id,
        goles_local: gl,
        goles_visitante: gv,
      });
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-8 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold mb-2">🔮 Tu predicción</h3>
        <p className="text-sm text-gray-400 mb-6">
          {partido.torneo} · Jornada {partido.jornada}
        </p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-right">
            <p className="text-white font-medium text-lg">{clubLocal}</p>
          </div>
          <input
            type="number"
            min="0"
            value={golesLocal}
            onChange={(e) => setGolesLocal(e.target.value)}
            className="w-16 px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-center text-xl font-bold"
          />
          <span className="text-gray-400 text-lg">vs</span>
          <input
            type="number"
            min="0"
            value={golesVisitante}
            onChange={(e) => setGolesVisitante(e.target.value)}
            className="w-16 px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-center text-xl font-bold"
          />
          <div className="text-left">
            <p className="text-white font-medium text-lg">{clubVisitante}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 text-red-300 text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl bg-[#76e4f7] text-black font-semibold hover:bg-[#5ac8df] transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar predicción"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
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
git add frontend/src/components/PredictionModal.tsx
git commit -m "feat: add PredictionModal component"
```
