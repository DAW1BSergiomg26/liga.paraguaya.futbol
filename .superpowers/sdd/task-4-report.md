# Task 4 Report: ParallaxStripes Enhancement

**Date:** 2026-07-14
**Status:** DONE

## What Was Done

Enhanced `StripesBackground.tsx` with GSAP ScrollTrigger parallax effect. The original component had a single `stripes-bg` div with CSS gradients for all stripe colors. Since parallax requires differential movement per color, the component was refactored to use separate child elements for red and white stripes, each with its own scroll-driven animation.

### Changes

**`frontend/src/components/layout/StripesBackground.tsx`:**
- Added GSAP imports (`initGSAP`, `gsap`, `ScrollTrigger`) from `@/lib/gsap`
- Split the single gradient background into two child `<div>` layers: `.stripe-red` (yPercent: -30, faster) and `.stripe-white` (yPercent: -15, slower)
- Added `useEffect` that creates ScrollTrigger scrub tweens for each layer
- Respects `prefers-reduced-motion` — skips parallax if reduced motion is preferred
- Tweens are cleaned up on unmount
- Kept existing mouse-follow parallax on the container

**`frontend/src/app/globals.css`:**
- Removed the repeating-linear-gradient from `.stripes-bg` (now in child elements)
- Added `overflow: hidden` to `.stripes-bg` to clip the oversized child layers
- Kept the radial-gradient vignette overlay on `.stripes-bg`

### Build Verification

- `npm run build` passed with 0 errors, 22+ routes generated
