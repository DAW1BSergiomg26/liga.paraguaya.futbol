# Task 9 & 10 Report: API Client, Types, and Layout Components

## Status: Complete

### Task 9 — API Client + Types
- Created `frontend/src/types/index.ts` with `Club`, `Partido`, `PartidoDetail`, and `TablaRow` interfaces
- Created `frontend/src/lib/api.ts` with `fetchJSON` helper and typed functions: `getClubes`, `getClub`, `getPartidos`, `getPartido`, `getTabla`
- API base URL reads from `NEXT_PUBLIC_API_URL` env var, fallback to `http://localhost:8001`
- Created `frontend/.env.local` with default API URL

### Task 10 — Layout Components
- Created `frontend/src/components/layout/Navbar.tsx` with logo "⚽ Liga PY" and links to `/clubes`, `/partidos`, `/tabla`
- Created `frontend/src/components/layout/Footer.tsx` with project info and GitHub link
- Updated `frontend/src/app/layout.tsx` to include `Navbar`, `Footer`, and `flex flex-col` layout
- Updated `frontend/src/app/globals.css` with body reset styles

### Build Verification
- `npm run build` completed successfully with 0 errors

### Commit
- `16608e0` — `feat(frontend): API client, types, and layout components`
