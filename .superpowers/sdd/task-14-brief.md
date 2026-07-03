### Task 14: Frontend — Partidos Pages

**Files:**
- Create: `frontend/src/components/partidos/MatchCard.tsx`
- Create: `frontend/src/components/partidos/ScoreBadge.tsx`
- Create: `frontend/src/app/partidos/page.tsx`
- Create: `frontend/src/app/partidos/[id]/page.tsx`

- [ ] **Step 1: Create `frontend/src/components/partidos/ScoreBadge.tsx`**

```tsx
export default function ScoreBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    programado: "bg-yellow-900/30 text-yellow-300 border-yellow-500/30",
    en_vivo: "bg-green-900/30 text-green-300 border-green-500/30",
    finalizado: "bg-blue-900/30 text-blue-300 border-blue-500/30",
    suspendido: "bg-red-900/30 text-red-300 border-red-500/30",
  };
  const cls = colors[estado] || colors.programado;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>
      {estado.replace("_", " ")}
    </span>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/partidos/MatchCard.tsx`**

```tsx
import Link from "next/link";
import type { Partido } from "@/types";
import ScoreBadge from "./ScoreBadge";

export default function MatchCard({ partido }: { partido: Partido }) {
  return (
    <Link href={`/partidos/${partido.id}`}>
      <div className="p-5 rounded-xl border border-white/10 bg-[#0a1628]/60 hover:bg-[#0a1628] transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">{partido.torneo}</span>
          <ScoreBadge estado={partido.estado} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-right flex-1">{partido.local_id}</span>
          <span className="text-lg font-bold text-[#76e4f7]">
            {partido.goles_local !== null ? `${partido.goles_local} - ${partido.goles_visitante}` : "vs"}
          </span>
          <span className="font-medium flex-1">{partido.visitante_id}</span>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">{partido.fecha}</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Create `frontend/src/app/partidos/page.tsx`**

```tsx
import { getPartidos } from "@/lib/api";
import MatchCard from "@/components/partidos/MatchCard";

export default async function PartidosPage() {
  const partidos = await getPartidos();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Partidos</h1>
      <p className="text-gray-400 mb-8">Calendario de partidos de la Liga Paraguaya.</p>

      {partidos.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No hay partidos disponibles.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {partidos.map((p) => (
            <MatchCard key={p.id} partido={p} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/app/partidos/[id]/page.tsx`**

```tsx
import { getPartido } from "@/lib/api";
import { notFound } from "next/navigation";
import ScoreBadge from "@/components/partidos/ScoreBadge";

export default async function PartidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let partido;
  try {
    partido = await getPartido(id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <p className="text-sm text-gray-400 mb-2">{partido.torneo} · Jornada {partido.jornada}</p>
      <h1 className="text-2xl font-bold mb-6">
        {partido.local_nombre} vs {partido.visitante_nombre}
      </h1>

      <div className="p-8 rounded-xl border border-white/10 bg-[#0a1628]/60 text-center mb-6">
        <div className="flex items-center justify-center gap-8 mb-4">
          <span className="text-xl font-bold">{partido.local_nombre}</span>
          <span className="text-4xl font-bold text-[#76e4f7]">
            {partido.goles_local !== null ? `${partido.goles_local} - ${partido.goles_visitante}` : "vs"}
          </span>
          <span className="text-xl font-bold">{partido.visitante_nombre}</span>
        </div>
        <ScoreBadge estado={partido.estado} />
        <p className="text-gray-500 text-sm mt-4">{partido.fecha}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```powershell
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(frontend): partidos pages"
```

---


