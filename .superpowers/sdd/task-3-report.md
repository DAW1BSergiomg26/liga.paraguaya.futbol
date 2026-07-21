# Task 3 Report: Fix simulator lambda bug

## Status: DONE

## Summary

Fixed the Poisson model bug in `simulator_service.py` line 110 where the away
team's expected goals (`lambda_away`) incorrectly used `avg_gf` (league average
goals FOR) instead of `avg_gc` (league average goals CONCEDED). The away team's
expected goals should depend on how many the home team concedes on average.

**Fix:**
```python
# before
lambda_away = away_attack * home_defense * avg_gf
# after
lambda_away = away_attack * home_defense * avg_gc
```

## TDD Process

1. Wrote `backend/tests/test_simulator_fix.py` (2 tests).
2. Ran tests → **FAILED** on logic (obtained home probability 40.13 instead of
   expected corrected value), confirming the test catches the bug.
3. Applied the one-line fix.
4. Ran tests → **PASSED** (2/2).
5. Ran full suite → **194 passed** (requirement was 190+).

## Deviations from the task brief (and why)

The provided test skeleton in the brief was not directly runnable against the real
codebase. I corrected it so the test is meaningful and genuinely validates the bug:

- **Method name:** brief calls `SimulatorService.predecir_partido`, but the actual
  service method is `SimulatorService.simulate_match` (`predecir_partido` is a
  separate FastAPI route that delegates to `simulate_match`). Using the wrong name
  would have failed with `AttributeError` rather than testing the logic.
- **Result access:** brief uses `result["probabilidad_local"]` (dict subscript), but
  `simulate_match` returns a Pydantic `SimulationResultOut` model. Changed to
  attribute access (`result.probabilidad_local`).
- **Assertion values:** brief asserts `≈0.33` for each outcome with asymmetric
  averages (avg_gf=2.0, avg_gc=1.0). With symmetric club stats and the *correct*
  formula the true Poisson result is ~62% home / 19% draw / 18% away. Corrected the
  expected values to the genuine corrected output (with a ±5% tolerance). The brief's
  `0.33` was a placeholder that does not reflect correct Poisson math.
- **Total check:** probabilities are returned as percentages (×100), so the
  `total == approx(1.0)` check was adjusted to `approx(100.0)`.

These changes preserve the brief's intent (verify away lambda uses `avg_gc`, expose
the bug with asymmetric averages) while making the test correct and executable.

## Commits
- `e68cc3b` fix: usar avg_gc para lambda visitante en modelo Poisson

## Test summary
`test_simulator_fix.py`: 2 passed. Full suite: 194 passed.

## Concerns
- The brief's and task description's literal test code would not run against the
  real code (wrong method name, dict access, incorrect expected values). If strict
  byte-for-byte adherence to the brief was required, the tests as originally written
  would fail for non-logic reasons. I prioritized a *correct, passing* test that
  genuinely covers the bug. Worth confirming this deviation is acceptable.
- No other callers of `lambda_away` / the fixed line were affected; change is
  localized and the full regression suite is green.
