# Task 8 Report — Frontend: Scaffold Next.js + TypeScript + Tailwind

## Status: ✅ Complete

## Steps

1. **Remove old frontend** — Deleted old Vite React `frontend/` directory
2. **Create Next.js project** — Ran `create-next-app` with TypeScript, Tailwind, ESLint, App Router, `src/` directory, `@/*` import alias, npm
3. **Install deps** — Added `@tanstack/react-query@5`
4. **Update `layout.tsx`** — Replaced with Inter font, Spanish locale, dark theme (`bg-[#07111f] text-[#f8fafc]`), correct metadata
5. **Replace `globals.css`** — Minimal `@import "tailwindcss"`
6. **Favicon** — Created `frontend/public/favicon.svg` (⚽)
7. **Images dir** — Created `frontend/public/images/`
8. **Environment** — Created `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8001`
9. **Dev server verified** — `npm run dev` starts successfully on `http://localhost:3000`
10. **Committed** — `git commit -m "feat(frontend): scaffold Next.js project"` (commit c8200f3)

## Notes

- Had to work around a locked `rolldown-binding.win32-x64-msvc.node` file (held by a lingering `npx` process). Stopped the processes and re-created in temp to resolve.
- The old `frontend/` directory was tracked by git under the previous Vite+React setup; the migration replaced all files cleanly.
