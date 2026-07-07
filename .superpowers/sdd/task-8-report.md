# Task 8 Report: Frontend partidos pages — prediction integration

## Files Modified

- `frontend/src/app/partidos/page.tsx` (180→220 lines)
- `frontend/src/app/partidos/[id]/page.tsx` (113→152 lines)

## Changes Made

### `partidos/page.tsx`
- Added imports: `useState`, `useEffect`, `getSavedToken`, `setAuthToken`, `useQueryClient`, `PredictionModal`
- Added `queryClient`, `userToken`, and `predictionPartido` state + `useEffect` to load auth token
- Added "Pronóstico" column header between Estado and Jornada
- Added "🔮 Predecir" button cell (visible only when logged in and partido is "programado")
- Added `<PredictionModal>` component at the bottom of the page

### `partidos/[id]/page.tsx`
- Added imports: `useEffect`, `useState`, `getSavedToken`, `setAuthToken`, `misPredicciones`, `PredictionDetail`
- Added `prediction` state + `useEffect` to fetch user's prediction for this partido
- Added prediction display section below the detail card showing the user's predicted score, with color-coded border based on points earned

## Verification
- `npx tsc --noEmit` — clean, no errors
- Commit: `1172b73` with message `feat: integrate prediction button and display in partidos`
