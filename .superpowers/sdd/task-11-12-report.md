# Task 11-12: UI Components + Query Provider and Home Page

## Completed

### Task 11 — UI Components + Query Provider

| File | Status |
|------|--------|
| `frontend/src/components/ui/LoadingSpinner.tsx` | Created — spinner with "Cargando..." text |
| `frontend/src/components/ui/ErrorMessage.tsx` | Created — red error message display |
| `frontend/src/app/providers.tsx` | Created — TanStack Query client provider (use client) |
| `frontend/src/app/loading.tsx` | Created — delegates to LoadingSpinner |
| `frontend/src/app/error.tsx` | Created — error boundary with reset button (use client) |
| `frontend/src/app/not-found.tsx` | Created — 404 page with link to home |
| `frontend/src/app/layout.tsx` | Updated — wrapped children with `<Providers>`, added Navbar + Footer |

### Task 12 — Home Page

| File | Status |
|------|--------|
| `frontend/src/app/page.tsx` | Replaced — Server Component fetching clubes, partidos, tabla via SSR |

### Home Page Features
- Hero section with status indicator ("Backend activo correctamente")
- 3 quick stat cards (clubes, partidos, equipos en tabla)
- Top 4 rows from tabla de posiciones
- Quick links to /clubes and /partidos

### Build
- `npm run build` succeeded with no errors
- Routes: `/` (page) and `/_not-found`

### Commit
`2e4eabc` — `feat(frontend): UI components, query provider, and home page`
