# Task 3 Report: Integrate live scores into `/partidos` list page

## What I implemented
- Added `useMemo` to React imports and `useLiveScores` hook import
- Added `const liveScores = useLiveScores();` hook call in `PartidosContent`
- Added `sorted` useMemo to sort rows: en_vivo (0), programado (1), finalizado (2)
- Updated Resultado cell to show live scores for `en_vivo` matches (with fallback to `p.goles_*` or `?`)
- Added minute counter below the score for live matches
- Added `animate-pulse` to the `en_vivo` EstadoBadge style
- Replaced `.map()` with `.sorted.map()` in the JSX

## Build result
**PASS** — Compiled successfully, TypeScript passed, all pages generated.

## Files changed
- `frontend/src/app/partidos/page.tsx` — 24 insertions, 6 deletions

## Self-review findings
- Fixed TypeScript error: `order` object needed `Record<string, number>` type annotation to satisfy strict indexing
- No logic concerns — the hook is a no-op when no live scores exist (returns `{}`), so `liveScores[p.id]` will be `undefined` for non-live matches, which is handled by the conditional checks

## Issues or concerns
None.
