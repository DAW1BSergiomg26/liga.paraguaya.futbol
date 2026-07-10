# Task 1 Report: Bugfix — Texto en espejo en flip cards

## What was implemented

Added a CSS rule forcing GPU composition on children of `.carta-club-dorso` to fix mirrored text on WebKit/Safari:

```css
.carta-club-dorso > * {
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}
```

This was placed right after the `.carta-club-dorso` block (line 181 in the final file). The rule forces each direct child into its own compositing layer, preventing Safari's renderer from incorrectly mirroring text when `backface-visibility: hidden` and `rotateY(180deg)` interact.

## What was tested

- Visual inspection of `ClubCard.tsx` confirmed **no inline transforms** (no `scaleX`, `scale(-1,1)`, or rogue `style` attributes)
- Full `npm run build` — **compiled successfully** with no errors or warnings (TypeScript, static generation all passing)

## Files changed

- `frontend/src/app/globals.css` — Added 4 lines (CSS rule block for `.carta-club-dorso > *`)

## Self-review findings

- The existing flip card CSS uses the standard `rotateY(180deg)` technique, which is correct. The bug is a WebKit compositing quirk, not a logic error.
- ClubCard.tsx uses `className="carta-club-cara carta-club-dorso"` on the backface div — no inline style overrides.
- Build succeeds with zero warnings.
- The `translateZ(0)` approach is minimal, safe, and well-documented for forcing GPU compositing in WebKit.

## Issues or concerns

None. The fix is minimal and low-risk.
