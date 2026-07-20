# Task 4: GSAP Animation on Formation Change

## Status: DONE

## Changes Applied
- Added `useEffect` and `useRef` to React imports
- Added `initGSAP` and `gsap` imports from `@/lib/gsap`
- Added `voronoiGroupRef` for the SVG `<g>` element
- Added `useEffect` that animates Voronoi cell paths on formation change using GSAP `to` with `attr.d` interpolation
- Wrapped Voronoi `<path>` elements in `<g ref={voronoiGroupRef}>`
- Respects `prefers-reduced-motion` media query (falls back to instant `gsap.set`)

## Commit
`4138d79` — `feat(tactico): add GSAP animation for Voronoi cells on formation change`

## Verification
- TypeScript compile (`tsc --noEmit`): PASS
- Next.js production build: PASS

## Concerns
None.
