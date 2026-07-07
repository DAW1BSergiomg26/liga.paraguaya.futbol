# Task 9 Report: Integrate Chat + Push into Partido Page

## Changes Made

### `frontend/src/lib/api.ts`
- Added `authHeaders()` helper function (reusing existing `authToken`/`getSavedToken` pattern)
- Added `getChatHistory()` function to fetch paginated chat messages for a partido
- Added `MensajeChat` TypeScript interface

### `frontend/src/app/partidos/[id]/page.tsx`
- Added `ChatWidget` import from `@/components/ChatWidget`
- Added `<ChatWidget partidoId={partido.id} />` after the prediction section

## Verification
- `npm run build` passed (compiled successfully, TypeScript check passed)
- All pages generated correctly

## Commit
`06a2145` - `feat: integrate chat widget into partido detail page`
