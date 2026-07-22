# Task 5 — Disclaimer text + teamIndex for Voronoi overlay

## Status: DONE

## Changes

### `frontend/src/lib/voronoi.ts`
- Added `teamIndex: number` to `VoronoiPath` interface
- Added `teamSplit: number = 11` parameter to `computeVoronoiPaths`
- Added `teamIndex: i < teamSplit ? 0 : 1` to return value
- Added `_teamSplit: number = 11` parameter to `computeCellCentroids` for signature consistency

### `frontend/src/components/tactico/TacticalField.tsx`
- Replaced hardcoded `cell.cellIndex < 11` checks with `cell.teamIndex === 0` for fill/stroke colors
- Added honesty disclaimer `<p>` outside the field div, visible when Voronoi is active

### `frontend/src/lib/__tests__/voronoi.test.ts`
- Added "assigns teamIndex correctly with default split" test
- Added "respects custom teamSplit" test

## Test Results
- **Voronoi tests:** 8/8 passed (including 2 new)
- **Other tests:** 17/21 passed — 4 pre-existing failures unrelated to this task

## TS Compile
- Clean, no errors

## Commit
- SHA: pending
