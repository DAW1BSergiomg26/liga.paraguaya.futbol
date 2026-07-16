### Task 6: Agregar sección "Significado del Escudo" en club detail page

**Files:**
- Modify: `frontend/src/app/clubes/[id]/page.tsx`

- [ ] **Step 1: Agregar import del data file**

Agregar después de los imports existentes:

```typescript
import { ESCUDOS_DATA } from "@/data/escudos";
```

- [ ] **Step 2: Agregar la sección en el JSX**

Antes del bloque de títulos internacionales (antes de `{club.titulos_internacionales?.length > 0`), insertar:

```tsx
{ESCUDOS_DATA[club.nombre] && (
  <div className="mt-6 p-6 rounded-xl border border-borde-sutil bg-bg-secundario/60 relative overflow-hidden">
    <div
      className="absolute inset-0 opacity-[0.07] bg-contain bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${ESCUDOS_DATA[club.nombre].imagen})` }}
    />
    <div className="relative z-10">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-apf-rojo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Significado del Escudo
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed">
        {ESCUDOS_DATA[club.nombre].texto}
      </p>
      {ESCUDOS_DATA[club.nombre].detalles && (
        <div className="flex flex-wrap gap-2 mt-4">
          {ESCUDOS_DATA[club.nombre].detalles!.map((d, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-xs border border-borde-sutil text-texto-secundario bg-bg-terciario/50">
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: Build para verificar**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/clubes/[id]/page.tsx
git commit -m "feat: agregar sección Significado del Escudo en detalle de cada club"
```

---

