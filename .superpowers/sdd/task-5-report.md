# Task 5 Report: Frontend types + API functions

**Status:** ✅ Complete

## Changes

### `frontend/src/types/index.ts`
- Added `User`, `PredictionCreate`, `PredictionDetail`, `LeaderboardEntry` interfaces

### `frontend/src/lib/api.ts`
- Updated import to include new types
- Added `authToken` module-level variable
- Added `setAuthToken`, `getSavedToken`, `authFetchJSON` (shared helpers)
- Added `loginWithProvider`, `crearPrediccion`, `misPredicciones`, `getLeaderboard` (public API functions)

## Verification
- `npx tsc --noEmit` passed with zero errors
- Commit: `b4dbdd8`
