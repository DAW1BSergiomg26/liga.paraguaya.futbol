# Task 7 Report: Modify /tabla page layout

## Changes Made

- **Modified**: `frontend/src/app/tabla/page.tsx`
  - Added `import Sidebar from "@/components/sidebar/Sidebar"` at line 9
  - Wrapped table content in grid: `lg:grid lg:grid-cols-[1fr_320px] lg:gap-8`
  - Left column: table/empty state; Right column: `<Sidebar />` with `mt-8 lg:mt-0`
  - Hero section remains outside the grid (full-width)

## Verification

- `npx tsc --noEmit`: Only pre-existing error (`useLiveScore` hook), no new errors

## Commit

- `5a3b175` - `feat(frontend): add sidebar layout to /tabla page`
