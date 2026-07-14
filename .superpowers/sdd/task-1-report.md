# Task 1 Report: GSAP Config + ScrollReveal Foundation

**Status:** DONE

## What I Implemented

1. **`frontend/src/lib/gsap.ts`** — Central GSAP configuration with `initGSAP()` that registers ScrollTrigger plugin (idempotent, one-time initialization). Exports `gsap`, `ScrollTrigger`, and `initGSAP`.

2. **`frontend/src/components/ui/ScrollReveal.tsx`** — Reusable scroll reveal component with 5 variants (`from-left`, `from-right`, `from-bottom`, `scale-up`, `clip-reveal`). Accepts `children`, `variant`, `delay`, `stagger`, `duration`, `className`. Respects `prefers-reduced-motion` by skipping animations entirely. Cleans up tweens on unmount.

3. **`frontend/src/components/ui/ScrollReveal.test.tsx`** — 3 tests covering rendering children, className application, and multi-child stagger rendering.

4. **`frontend/vitest.config.ts`** — Vitest configuration with `@/` path alias resolution and jsdom environment (did not exist previously, needed for tests to work).

## Test Results

```
✓ src/components/ui/ScrollReveal.test.tsx (3 tests) 179ms
  ✓ renders children
  ✓ applies className
  ✓ renders multiple children with stagger

Test Files  1 passed (1)
Tests       3 passed (3)
```

## Build Result

Build passes with no errors. 22+ routes generated.

## Files Changed

| File | Action |
|------|--------|
| `frontend/src/lib/gsap.ts` | Created |
| `frontend/src/components/ui/ScrollReveal.tsx` | Created |
| `frontend/src/components/ui/ScrollReveal.test.tsx` | Created |
| `frontend/vitest.config.ts` | Created (new - needed for tests to run) |

## Deviations from Plan

- **Added `vitest.config.ts`**: The plan assumed vitest would resolve `@/` aliases automatically, but no vitest config existed in the project. Created one with path alias and jsdom environment.
- **Added `jsdom` and `@testing-library/jest-dom`**: These were missing dev dependencies needed for tests to run. Installed via `npm install -D`.
- **Fixed test assertions**: The plan's `toHaveClass` matcher required `@testing-library/jest-dom/vitest` import. The `div > div` selector for stagger test was adjusted to account for the wrapper div.
- **Added `matchMedia` mock**: Required for GSAP's ScrollTrigger in jsdom environment.

## Commit

- `b762bdb` — `feat: add GSAP config and ScrollReveal component`
