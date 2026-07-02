### Task 13: Frontend — Clubes Pages

**Files:**
- Create: `frontend/src/components/clubes/ClubCard.tsx`
- Create: `frontend/src/components/clubes/ClubGrid.tsx`
- Create: `frontend/src/app/clubes/page.tsx`
- Create: `frontend/src/app/clubes/[id]/page.tsx`

- [ ] **Step 1: Create `frontend/src/components/clubes/ClubCard.tsx`**

```tsx
import Link from "next/link";
import type { Club } from "@/types";

export default function ClubCard({ club }: { club: Club }) {
  return (
    <Link href={`/clubes/${club.id}`}>
      <div className="p-5 rounded-xl border border-white/10 bg-[#0a1628]/60 hover:bg-[#0a1628] transition h-full">
        <h3 className="text-lg font-bold mb-1">{club.nombre}</h3>
        <p className="text-yellow-400 text-sm mb-2">{club.apodo}</p>
        <p className="text-gray-400 text-xs">{club.ciudad} · {club.estadio}</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/clubes/ClubGrid.tsx`**

```tsx
import type { Club } from "@/types";
import ClubCard from "./ClubCard";

export default function ClubGrid({ clubes }: { clubes: Club[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clubes.map((club) => (
        <ClubCard key={club.id} club={club} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/app/clubes/page.tsx`**

```tsx
import { getClubes } from "@/lib/api";
import ClubGrid from "@/components/clubes/ClubGrid";

export default async function ClubesPage() {
  const clubes = await getClubes();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Clubes</h1>
      <p className="text-gray-400 mb-8">Todos los clubes de la Liga Paraguaya de Fútbol.</p>
      {clubes.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No hay clubes disponibles.</p>
      ) : (
        <ClubGrid clubes={clubes} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/app/clubes/[id]/page.tsx`**

```tsx
import { getClub } from "@/lib/api";
import { notFound } from "next/navigation";

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let club;
  try {
    club = await getClub(id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{club.nombre}</h1>
      <p className="text-yellow-400 text-lg mb-6">{club.apodo}</p>

      <div className="grid grid-cols-2 gap-6 p-6 rounded-xl border border-white/10 bg-[#0a1628]/60">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Ciudad</p>
          <p className="font-medium">{club.ciudad}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Estadio</p>
          <p className="font-medium">{club.estadio}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Colores</p>
          <div className="flex gap-2">
            {club.colores.map((color) => (
              <span key={color} className="px-3 py-1 rounded-full bg-white/10 text-sm capitalize">
                {color}
              </span>
            ))}
          </div>
        </div>
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
git add -A && git commit -m "feat(frontend): clubes pages"
```

---


