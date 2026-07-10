### Task 7: Modify /tabla page layout

**Files:**
- Modify: `frontend/src/app/tabla/page.tsx`

- [ ] **Step 1: Modify layout to add sidebar**

The current outer container is:
```tsx
<div className="max-w-6xl mx-auto px-4 py-12">
```

Replace it with a grid container:
```tsx
<div className="max-w-6xl mx-auto px-4 py-12">
  <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
    <div>
      {/* existing content */}
    </div>
    <div className="mt-8 lg:mt-0">
      <Sidebar />
    </div>
  </div>
</div>
```

Specifically, the file currently looks like:

```tsx
export default function TablaPage() {
  // ...hooks...

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="bg-gradient-to-br from-bg-secundario/80 to-bg-primario ...">
        ...hero header...
      </div>

      {isLoading && <TableSkeleton rows={12} cols={10} />}
      {error && <ErrorMessage message={error.message} />}
      {tabla && tabla.length === 0 && <div>...</div>}
      {tabla && tabla.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-borde-sutil">
          <table>
            ...
          </table>
        </div>
      )}
    </div>
  );
}
```

Change the return to wrap content in a grid. The sidebar goes below the hero but alongside the table:

```tsx
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="bg-gradient-to-br from-bg-secundario/80 to-bg-primario ...">
        ...hero header... (unchanged)
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div>
          {isLoading && <TableSkeleton rows={12} cols={10} />}
          {error && <ErrorMessage message={error.message} />}
          {tabla && tabla.length === 0 && (
            <div className="text-center py-16 text-texto-secundario">
              No hay datos para este torneo
            </div>
          )}
          {tabla && tabla.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-borde-sutil">
              <table>...</table>
            </div>
          )}
        </div>

        <div className="mt-8 lg:mt-0">
          <Sidebar />
        </div>
      </div>
    </div>
  );
```

Add the Sidebar import at the top:
```tsx
import Sidebar from "@/components/sidebar/Sidebar";
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/tabla/page.tsx
git commit -m "feat(frontend): add sidebar layout to /tabla page"
```

---
