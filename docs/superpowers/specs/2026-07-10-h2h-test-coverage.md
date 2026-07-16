# H2H Service Test Coverage

## Purpose

Add mock-based unit tests for `PartidoService.get_h2h()` covering its aggregation logic: wins counting, goal totals, mayor goleada determination, and filtering rules.

## Scope

Service-level tests only (`PartidoService.get_h2h()`). No endpoint-level tests beyond existing `test_h2h_endpoint_ok`.

## Test Plan

### File: `backend/tests/test_h2h.py`

#### New test: `test_get_h2h_with_multiple_matches`

- 3 finalized matches: club_a wins 2-0 (local), club_b wins 3-1 (local), draw 1-1
- Verify: victorias_a=1, victorias_b=1, empates=1
- Verify: goles_a=3, goles_b=4
- Verify: mayor_goleada_a has goles=2, mayor_goleada_b has goles=3
- Verify: partidos list has 3 items, ordered by fecha desc

#### New test: `test_get_h2h_skips_non_finalized_and_null_scores`

- Mix of finalized (2), en_vivo (1), programado (1), and finalized with null goles (1)
- Verify: only the 2 valid finalized matches count toward stats
- Verify: pj=2, partidos list has all 5 (raw matches, not filtered)

#### New test: `test_get_h2h_mayor_goleada_updates_properly`

- Club_a has wins of 1-0, 4-1, 2-0 — biggest is 4-1
- Club_b has wins of 2-0, 5-0 — biggest is 5-0
- Verify both mayor goleadas are correct

#### New test: `test_get_h2h_side_attribution`

- club_a="olimpia", club_b="cerro"
- Match 1: local=olimpia, visitante=cerro, goles=2-1 (club_a win)
- Match 2: local=cerro, visitante=olimpia, goles=0-3 (club_a win as visitante)
- Verify: both wins attributed to club_a, victorias_a=2, victorias_b=0

#### New test: `test_get_h2h_with_objects_instead_of_ids` (if Partido objects have `local_id`/`visitante_id` attributes)

- Verify that service works with mock Partido objects (same pattern as test_marcadores.py)

## Implementation Notes

- Use `MagicMock(spec=Partido, ...)` with explicit `id`, `local_id`, `visitante_id`, `goles_local`, `goles_visitante`, `estado`, `fecha`, `torneo`, `jornada`
- Mock `db.get(Club, "id")` returns a `MagicMock(spec=Club)` with `nombre` and `escudo`
- Mock `db.execute` returns a mock result via `MagicMock` chain
- Follow existing pattern from `test_marcadores.py::TestGetEnVivo::test_get_en_vivo_filters_only_en_vivo`
- Club mocks return objects when called, not when `await db.get(...)` fails
