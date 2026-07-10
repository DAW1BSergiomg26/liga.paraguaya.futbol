# Task 4 Report: Frontend types + API function

## What I implemented
- Added `ClubResumen`, `MayorGoleada`, `H2HPartidoItem`, `H2HResponse` TypeScript interfaces to `frontend/src/types/index.ts` before the `Noticia` interface
- Added `H2HResponse` to the type import in `frontend/src/lib/api.ts`
- Added `getH2H(clubA, clubB)` async API function that calls `GET /api/v1/partidos/h2h` with query params

## Files changed
- `frontend/src/types/index.ts` — 4 new exported interfaces (48 lines added)
- `frontend/src/lib/api.ts` — added `H2HResponse` to import, added `getH2H` function

## Build output
```
✓ Compiled successfully in 2.4s
  Running TypeScript ...
  Finished TypeScript in 3.3s ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (14/14) in 682ms
```
**Status: PASS**

## Self-review findings
- Interfaces match the backend `H2HOut` response shape exactly
- `getH2H` follows existing conventions: `encodeURIComponent()` for params, `fetchJSON<T>()` for the request
- No unused imports or types

## Concerns
- None
