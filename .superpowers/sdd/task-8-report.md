## Task 8: E2E Playwright Tests for Radar Comparison Feature

**Status:** ✅ Complete

**Commit:** `bd322ba` — `test(e2e): add Playwright tests for radar comparison feature`

**File created:** `frontend/e2e/radar-comparativo.spec.ts` (145 lines)

**Test summary:** 6 Playwright tests covering tab visibility, select loading, radar rendering, same-club warning, metrics table, and console error checks.

**Fix applied:** Replaced non-existent `toHaveCountGreaterThan` matcher with `expect.poll(...).toBeGreaterThan()` and added missing `selectB` declaration in the same-club warning test.

**Report:** `.superpowers/sdd/task-8-report.md`
