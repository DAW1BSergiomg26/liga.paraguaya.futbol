# Task 6 Report: Frontend PredictionModal component

**Status:** ✅ Complete

## Steps

- [x] Created `frontend/src/components/PredictionModal.tsx` with the exact content from the brief
- [x] Verified TypeScript compiles (`npx tsc --noEmit` — no errors)
- [x] Committed as `e710a7b` with message "feat: add PredictionModal component"

## Details

- Component uses `"use client"` directive for client-side interactivity
- Imports `crearPrediccion` from `@/lib/api` and `Partido` type from `@/types` — both verified existing
- Validates goal inputs are non-negative integers before submission
- Shows loading state (`saving`) and error state
- Calls `onSuccess` callback after successful API call
