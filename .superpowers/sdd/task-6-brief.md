### Task 6: Frontend — Sidebar wrapper component

**Files:**
- Create: `frontend/src/components/sidebar/Sidebar.tsx`

**Interfaces:**
- Produces: `<Sidebar />` component (composes NavegadorLigas + FeedNoticias)

- [ ] **Step 1: Create `frontend/src/components/sidebar/Sidebar.tsx`**

```tsx
import NavegadorLigas from "./NavegadorLigas";
import FeedNoticias from "./FeedNoticias";

export default function Sidebar() {
  return (
    <aside className="space-y-6">
      <NavegadorLigas />
      <FeedNoticias />
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/sidebar/Sidebar.tsx
git commit -m "feat(frontend): add Sidebar wrapper component"
```

---
