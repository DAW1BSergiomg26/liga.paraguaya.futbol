# Task 5: FeedNoticias component

**Status:** Complete

## Steps performed

1. Created `frontend/src/components/sidebar/FeedNoticias.tsx` with:
   - `"use client"` directive
   - `useQuery` from `@tanstack/react-query` calling `getNoticias()` with 5min staleTime and 1 retry
   - `formatearFecha` helper for relative time display (es-PY locale)
   - Skeleton loading state (3 animated pulse bars)
   - Error state → "No hay noticias disponibles"
   - Empty state → "No hay noticias disponibles"
   - News items with red left border (`border-py-rojo`), title, source, and relative time

2. Verified with `npx tsc --noEmit` — only pre-existing error (useLiveScore module not found)

3. Committed with: `feat(frontend): add FeedNoticias component with RSS news`
