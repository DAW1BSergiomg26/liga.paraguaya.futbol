# Task 3 Report: Frontend — API function for news

**Status:** Done

## Changes

### `frontend/src/types/index.ts`
- Added `Noticia` interface (titulo, fuente, url, pub_date, resumen)
- Added `NoticiasResponse` interface (noticias, fuentes, actualizado)

### `frontend/src/lib/api.ts`
- Added `Noticia` and `NoticiasResponse` to the type import
- Added `getNoticias()` function that calls `GET /api/v1/noticias`

## Verification
- `npx tsc --noEmit` passes (only pre-existing error about `@/hooks/useLiveScore`)
- Commit `9dee40a` with message: `feat(frontend): add Noticia type and getNoticias API function`
