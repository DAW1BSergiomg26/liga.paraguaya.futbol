### Task 15: Frontend — Tabla Page

**Files:**
- Create: `frontend/src/components/tabla/StandingsTable.tsx`
- Create: `frontend/src/app/tabla/page.tsx`

- [ ] **Step 1: Create `frontend/src/components/tabla/StandingsTable.tsx`**

```tsx
import type { TablaRow } from "@/types";

export default function StandingsTable({ rows }: { rows: TablaRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a1628]/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-gray-400 uppercase text-xs">
            <th className="p-4 text-left">Pos</th>
            <th className="p-4 text-left">Club</th>
            <th className="p-4">PJ</th>
            <th className="p-4">PG</th>
            <th className="p-4">PE</th>
            <th className="p-4">PP</th>
            <th className="p-4">GF</th>
            <th className="p-4">GC</th>
            <th className="p-4">DG</th>
            <th className="p-4">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.club_id} className="border-b border-white/5 hover:bg-white/5 transition">
              <td className="p-4 font-bold">{row.posicion}</td>
              <td className="p-4 font-medium">{row.club}</td>
              <td className="p-4 text-center">{row.pj}</td>
              <td className="p-4 text-center">{row.pg}</td>
              <td className="p-4 text-center">{row.pe}</td>
              <td className="p-4 text-center">{row.pp}</td>
              <td className="p-4 text-center">{row.gf}</td>
              <td className="p-4 text-center">{row.gc}</td>
              <td className="p-4 text-center">{row.dg}</td>
              <td className="p-4 text-center font-bold text-[#76e4f7]">{row.puntos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/app/tabla/page.tsx`**

```tsx
import { getTabla } from "@/lib/api";
import StandingsTable from "@/components/tabla/StandingsTable";

export default async function TablaPage() {
  const tabla = await getTabla();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Tabla de Posiciones</h1>
      <p className="text-gray-400 mb-8">Clasificación actual de la Liga Paraguaya de Fútbol.</p>

      {tabla.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No hay datos de tabla disponibles.</p>
      ) : (
        <StandingsTable rows={tabla} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```powershell
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(frontend): tabla page"
```

---


