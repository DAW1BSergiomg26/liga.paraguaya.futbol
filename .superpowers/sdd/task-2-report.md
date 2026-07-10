# Task 2 Report — Backend service `get_h2h()`

## What was implemented

Added `PartidoService.get_h2h(db, club_a, club_b) -> H2HOut` to `backend/app/services/partido_service.py`. Method:
1. Fetches `Club` objects for both IDs via `db.get()`
2. Queries `Partido` table for matches between the two clubs (any direction), ordered by date desc
3. Builds `H2HPartidoItem` list from results
4. Computes summary stats (wins, draws, goals, biggest wins) from finalized matches
5. Returns an `H2HOut` with club summaries, resumen dict, and partidos list

## TDD Evidence

**RED** — Before implementation:
```
FAILED test_get_h2h_empty - AttributeError: type object 'PartidoService' has no attribute 'get_h2h'
```

**GREEN** — After implementation:
```
5 passed in 0.05s
```

## Files changed

| File | Change |
|------|--------|
| `backend/app/services/partido_service.py` | Added imports (`Club`, schemas) and `get_h2h()` static method |
| `backend/tests/test_h2h.py` | Added `TestH2HService` class with `test_get_h2h_empty` test |

## Self-review findings

- Matches existing code patterns: `@staticmethod`, `AsyncSession`, `select()` usage, `result.scalars().all()` pattern
- Schema imports fine at top-level (same as existing `PartidoOut`/`PartidoDetailOut`)
- Test uses `AsyncMock` + `MagicMock` correctly, following unittest.mock patterns
- Edge cases handled: None goles, non-finalized matches, missing Club records (falls back to raw id / empty escudo)
- **No concerns** — implementation straightforward, test covers the empty path

## Concerns

None.
