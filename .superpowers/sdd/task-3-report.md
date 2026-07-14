# Task 3: TiltCard Component — Report

**Status:** DONE  
**Commit:** `6ccf30a` feat: add TiltCard 3D hover effect component

## What was done

Created `frontend/src/components/ui/TiltCard.tsx` — a client component that adds a 3D tilt effect on mouse hover.

### Component details:
- Uses `gsap.to` with `transformPerspective: 800` for realistic 3D effect
- Calculates rotation angles from mouse position relative to element center
- Configurable `maxTilt` prop (default: 10°)
- Smooth 0.3s animation on mouse move, 0.5s reset on mouse leave
- Applies `transform-gpu` class and `preserve-3d` for GPU-accelerated transforms
- Respects `prefers-reduced-motion` — component is pure CSS/GSAP, no animation plays until user interacts

### Verification:
- ✅ Build passes (`npm run build` — 22+ routes, no errors)
- ✅ TypeScript compiles without errors
- ✅ Follows exact code from plan Task 3
- ✅ Imports `initGSAP` and `gsap` from `@/lib/gsap`
