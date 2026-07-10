# Task 2: Frontend `useLiveScores` hook — Report

## What I Implemented

Created `frontend/src/hooks/useLiveScores.ts` — a React hook that polls the batch live scores endpoint `GET /api/v1/partidos/marcadores` every 30 seconds and returns `Record<string, LiveScore>`.

The hook mirrors the existing per-match `useLiveScore` hook pattern but:
- Takes no arguments (fetches all live matches)
- Returns a keyed record instead of a single score object
- Uses `|| ""` fallback for `NEXT_PUBLIC_API_URL` (matches brief exactly)

## What I Tested

- **TypeScript compilation:** Passed (no type errors)
- **Next.js build:** Passed — `npm run build` completed successfully with 15 static pages generated
- **Linter:** No warnings or errors reported

## Build Output

```
✓ Compiled successfully in 2.9s
✓ Generating static pages using 11 workers (15/15) in 783ms
```

## Files Changed

| File | Action |
|------|--------|
| `frontend/src/hooks/useLiveScores.ts` | Created |

## Self-Review Findings

- **Consistency with existing hook:** Follows the same patterns — `cancelled` flag cleanup, interval-based polling, silent error handling, 30s poll interval.
- **Minor divergence from existing hook:** The existing `useLiveScore` (singular) has `minuto: number | null` while the brief specifies `minuto: number` (non-nullable) for the batch hook. This matches the task brief exactly — the batch endpoint may guarantee `minuto` is always present, or the brief intentionally simplified the type. Either way, the implementation matches the spec as written.
- **URL construction:** Uses `process.env.NEXT_PUBLIC_API_URL || ""` (empty string fallback) rather than the existing hook's `process.env.NEXT_PUBLIC_API_URL` (no fallback). This is a minor style difference — if `NEXT_PUBLIC_API_URL` is undefined, the existing hook would produce `undefined/api/v1/...` while this one correctly produces `/api/v1/...`. The new approach is more robust.

## Issues or Concerns

None. The implementation is a clean, direct port of the brief with no deviations.
