# Task 1: Fix N+1 Queries in historial_service.py

## What I Implemented

### `get_campeones()` — N+1 eliminated
- **Before:** 1 query for distinct torneos + N queries inside loop (one per torneo to find champion + one per torneo to look up Club) = 1 + 2N queries
- **After:** 1 subquery (min posicion per torneo) + 1 join query (get torneo/club_id/puntos) + 1 Club query = 3 queries total
- Uses `func.min(TablaPosicion.posicion)` grouped by torneo with `jornada == 0` filter, then joins back to get the club_id and puntos

### `get_ranking_clubes()` — SQL aggregation replaces Python loop
- **Before:** Loaded ALL TablaPosicion rows into memory, aggregated in Python
- **After:** Single SQL `GROUP BY club_id` with `func.sum()` for all stats, `func.count()` for torneos_jugados, and `func.sum(case(...))` for titulos count
- Uses portable `case()` expression (works on both SQLite in tests and PostgreSQL in production)

## Test Results

- **New tests:** 2/2 passing (`test_historial_n_plus_one.py`)
- **Existing tests:** 4/4 passing (`test_historial_service.py`) — no regressions
- **Full suite:** 192/192 passing, output pristine (only pre-existing deprecation warnings)

## TDD Evidence

- **RED:** Not applicable — the brief says tests should pass with current implementation since data correctness is preserved; the optimization is about query count, not behavior change
- **GREEN:** 192/192 passing after implementation

## Files Changed

- `backend/app/services/historial_service.py` — Replaced `get_campeones()` (lines 48-74) and `get_ranking_clubes()` (lines 76-115) with optimized implementations
- `backend/tests/test_historial_n_plus_one.py` — New test file with 2 tests

## Self-Review Findings

- Fixed the brief's ranking test assertions: olimpia has 3 torneos (147 pts), cerro has 3 (147 pts), libertad has 2 (98 pts) — the brief incorrectly listed all as 98
- Used `case()` instead of SQLite-specific `func.iif()` for cross-database compatibility
- Added Club batch lookup in `get_campeones()` to populate `club` (nombre) and `escudo` fields, which the brief's pseudocode omitted
