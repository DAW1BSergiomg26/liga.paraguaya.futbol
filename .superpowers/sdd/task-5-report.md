# Task 5: Backend Tests — Report

**Status: DONE**

## Commits

- `7a986d2` — feat: add Transferencia API tests (11 tests)

## Test Results: 11/11 passing

```
test_list_transferencias_empty PASSED
test_create_transferencia_as_admin PASSED
test_create_transferencia_requires_admin PASSED
test_create_transferencia_same_club_fails PASSED
test_get_transferencia_by_id PASSED
test_filter_by_tipo PASSED
test_filter_by_jugador PASSED
test_mercado_endpoint PASSED
test_estadisticas_endpoint PASSED
test_historial_endpoint PASSED
test_delete_transferencia PASSED
```

## Coverage

Tests exercise the full Transferencia API surface:
- **CRUD**: list (empty + populated), create, read by ID, delete
- **Auth**: admin-only creation (403 for non-admin)
- **Validation**: same club origin/destino rejection (400)
- **Filters**: by `tipo` and `jugador` query params
- **Special endpoints**: `/mercado`, `/estadisticas`, `/historial/{club_id}`

## Concerns

- None. All tests pass cleanly against the existing API implementation.
