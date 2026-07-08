# Task 2: EntityExtractor — Report

**Status:** DONE

## Commits

- `a263508` feat: Cerezo EntityExtractor — club alias matching + fecha parsing

## Test Summary

```
tests/test_cerezo_entity_extractor.py::test_extract_club_by_name   PASSED
tests/test_cerezo_entity_extractor.py::test_extract_club_by_alias  PASSED
tests/test_cerezo_entity_extractor.py::test_extract_two_clubs      PASSED
tests/test_cerezo_entity_extractor.py::test_extract_fecha_keyword  PASSED
tests/test_cerezo_entity_extractor.py::test_extract_no_clubes      PASSED
```

5/5 passed in 0.03s.

## Files

- `backend/app/services/cerezo/entity_extractor.py` — CerezoEntityExtractor with club alias matching (32 aliases), fecha keywords (11 keywords), and torneo name extraction (Apertura/Clausura + optional year)
- `backend/tests/test_cerezo_entity_extractor.py` — 5 TDD tests covering club by name, alias, two clubs, fecha keyword, and no-club edge case

## Process

Followed TDD strictly:
1. Wrote failing tests (RED — verified ModuleNotFoundError)
2. Implemented minimal class (GREEN — 5/5 pass)
3. Committed

## Concerns

None.
