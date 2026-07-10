### Task 8: Modify /clubes page layout

**Files:**
- Modify: `frontend/src/app/clubes/page.tsx`

- [ ] **Step 1: Modify layout to add sidebar**

Current layout:
```tsx
export default function ClubesPage() {
  // ...hooks...

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Clubes</h1>

      {isLoading && <CardSkeleton count={6} />}
      {error && <ErrorMessage message={error.message} />}
      {clubes && clubes.length === 0 && <div>...</div>}
      {clubes && clubes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ...
        </div>
      )}
    </div>
  );
}
```

Change to:
```tsx
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-8">Clubes</h1>

          {isLoading && <CardSkeleton count={6} />}
          {error && <ErrorMessage message={error.message} />}
          {clubes && clubes.length === 0 && (
            <div className="text-center py-16 text-texto-secundario">
              No hay clubes registrados
            </div>
          )}
          {clubes && clubes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ...
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

- [ ] **Step 2: Run frontend build check**

```bash
cd frontend && npx next build 2>&1 | tail -20
```
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/clubes/page.tsx
git commit -m "feat(frontend): add sidebar layout to /clubes page"
```
