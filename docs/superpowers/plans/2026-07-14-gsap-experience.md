# GSAP Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate GSAP, ScrollTrigger, SplitType, sparticles, canvas-confetti, and Framer Motion to create a cinematic visual experience across the entire site.

**Architecture:** Central GSAP configuration in `lib/gsap.ts` with reusable components (ScrollReveal, CountUp, TiltCard) and page-specific integrations (CinematicHero, ParallaxStripes). All animations respect `prefers-reduced-motion`.

**Tech Stack:** GSAP 3.15, @gsap/react, ScrollTrigger, SplitType, sparticles, canvas-confetti, Framer Motion 12

## Global Constraints

- Mobile-first: all animations must perform well on 4G connections
- `prefers-reduced-motion: reduce` disables ALL animations
- GSAP `will-change: transform` only on actively animating elements
- No new dependencies — all libraries already in package.json
- Spanish comments, English code
- Dark mode only (site is dark-first)
- Timezone: America/Asuncion (UTC-4)
- Colors: rojo #CC001C, azul #00619E, dorado #FFCC00, negro #0A0A0A

---

### Task 1: GSAP Configuration + ScrollReveal Foundation

**Files:**
- Create: `frontend/src/lib/gsap.ts`
- Create: `frontend/src/components/ui/ScrollReveal.tsx`
- Create: `frontend/src/components/ui/ScrollReveal.test.tsx`

**Interfaces:**
- Produces: `initGSAP()` function, `ScrollRevealProps` type, `ScrollReveal` component

- [ ] **Step 1: Create GSAP configuration**

```typescript
// frontend/src/lib/gsap.ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let initialized = false;

export function initGSAP() {
  if (initialized) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.defaults({ fastScrollEnd: true });
  initialized = true;
}

export { gsap, ScrollTrigger };
```

- [ ] **Step 2: Create ScrollReveal component**

```tsx
// frontend/src/components/ui/ScrollReveal.tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { initGSAP, gsap } from "@/lib/gsap";

export type RevealVariant =
  | "from-left"
  | "from-right"
  | "from-bottom"
  | "scale-up"
  | "clip-reveal";

interface ScrollRevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  stagger?: number;
  duration?: number;
  className?: string;
}

const variantDefaults: Record<RevealVariant, gsap.TweenVars> = {
  "from-left": { x: -30, opacity: 0 },
  "from-right": { x: 30, opacity: 0 },
  "from-bottom": { y: 40, opacity: 0 },
  "scale-up": { scale: 0.9, opacity: 0 },
  "clip-reveal": { clipPath: "inset(100% 0 0 0)" },
};

export default function ScrollReveal({
  children,
  variant = "from-bottom",
  delay = 0,
  stagger = 0,
  duration = 0.6,
  className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initGSAP();
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      gsap.set(el, { clearProps: "all" });
      return;
    }

    const from = variantDefaults[variant];
    const children = el.children;
    const hasStagger = stagger > 0 && children.length > 1;

    const targets = hasStagger ? Array.from(children) : el;

    gsap.set(targets, from);

    const tween = gsap.to(targets, {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      clipPath: "inset(0% 0 0 0)",
      duration,
      delay,
      stagger: hasStagger ? stagger : 0,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true,
      },
    });

    return () => {
      tween.kill();
    };
  }, [variant, delay, stagger, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create test for ScrollReveal**

```tsx
// frontend/src/components/ui/ScrollReveal.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ScrollReveal from "./ScrollReveal";

describe("ScrollReveal", () => {
  it("renders children", () => {
    render(
      <ScrollReveal>
        <div>Test content</div>
      </ScrollReveal>
    );
    expect(screen.getByText("Test content")).toBeDefined();
  });

  it("applies className", () => {
    const { container } = render(
      <ScrollReveal className="custom-class">
        <div>Content</div>
      </ScrollReveal>
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders multiple children with stagger", () => {
    const { container } = render(
      <ScrollReveal stagger={0.05}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </ScrollReveal>
    );
    expect(container.querySelectorAll("div > div").length).toBe(3);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `cd frontend && npx vitest run src/components/ui/ScrollReveal.test.tsx`
Expected: 3/3 PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/gsap.ts frontend/src/components/ui/ScrollReveal.tsx frontend/src/components/ui/ScrollReveal.test.tsx
git commit -m "feat: add GSAP config and ScrollReveal component"
```

---

### Task 2: CountUp Component

**Files:**
- Create: `frontend/src/components/ui/CountUp.tsx`

**Interfaces:**
- Produces: `CountUp` component (end: number, duration: number, suffix?: string)

- [ ] **Step 1: Create CountUp component**

```tsx
// frontend/src/components/ui/CountUp.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { initGSAP, gsap } from "@/lib/gsap";

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export default function CountUp({
  end,
  duration = 2,
  suffix = "",
  prefix = "",
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    initGSAP();
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setValue(end);
      return;
    }

    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: end,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        setValue(Math.round(obj.val));
      },
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        once: true,
      },
    });

    return () => {
      tween.kill();
    };
  }, [end, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {value.toLocaleString("es-PY")}
      {suffix}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ui/CountUp.tsx
git commit -m "feat: add CountUp animated number component"
```

---

### Task 3: TiltCard Component

**Files:**
- Create: `frontend/src/components/ui/TiltCard.tsx`

**Interfaces:**
- Produces: `TiltCard` wrapper with 3D tilt on hover

- [ ] **Step 1: Create TiltCard component**

```tsx
// frontend/src/components/ui/TiltCard.tsx
"use client";

import { useRef, type ReactNode } from "react";
import { initGSAP, gsap } from "@/lib/gsap";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

export default function TiltCard({
  children,
  className = "",
  maxTilt = 10,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    initGSAP();

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    gsap.to(el, {
      rotateX,
      rotateY,
      duration: 0.3,
      ease: "power2.out",
      transformPerspective: 800,
    });
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    gsap.to(el, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  return (
    <div
      ref={ref}
      className={`transform-gpu ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ui/TiltCard.tsx
git commit -m "feat: add TiltCard 3D hover effect component"
```

---

### Task 4: ParallaxStripes Enhancement

**Files:**
- Modify: `frontend/src/components/layout/StripesBackground.tsx`

**Interfaces:**
- Consumes: GSAP ScrollTrigger from `lib/gsap.ts`
- Produces: Parallax movement on scroll

- [ ] **Step 1: Read current StripesBackground**

Read: `frontend/src/components/layout/StripesBackground.tsx`

- [ ] **Step 2: Add GSAP parallax to StripesBackground**

Add `useGSAP` import and ScrollTrigger parallax effect:

```tsx
// Add to imports
"use client";
import { useEffect, useRef } from "react";
import { initGSAP, gsap, ScrollTrigger } from "@/lib/gsap";

// Inside the component, after the return:
useEffect(() => {
  initGSAP();
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReduced) return;

  const redStripes = document.querySelectorAll(".stripe-red");
  const whiteStripes = document.querySelectorAll(".stripe-white");

  const tweens = [
    gsap.to(redStripes, {
      yPercent: -30,
      ease: "none",
      scrollTrigger: { scrub: true },
    }),
    gsap.to(whiteStripes, {
      yPercent: -15,
      ease: "none",
      scrollTrigger: { scrub: true },
    }),
  ];

  return () => {
    tweens.forEach((t) => t.kill());
  };
}, []);
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/StripesBackground.tsx
git commit -m "feat: add GSAP parallax to stripes background"
```

---

### Task 5: CinematicHero Component

**Files:**
- Create: `frontend/src/components/hero/CinematicHero.tsx`

**Interfaces:**
- Consumes: gsap, SplitType, sparticles, CountUp
- Produces: Full-screen hero with cinematic entrance

- [ ] **Step 1: Create CinematicHero component**

```tsx
// frontend/src/components/hero/CinematicHero.tsx
"use client";

import { useEffect, useRef } from "react";
import SplitType from "split-type";
import { initGSAP, gsap, ScrollTrigger } from "@/lib/gsap";
import CountUp from "@/components/ui/CountUp";

const stats = [
  { label: "PARTIDOS", value: 348 },
  { label: "GOLES", value: 892 },
  { label: "EQUIPOS", value: 19 },
];

export default function CinematicHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initGSAP();
    const hero = heroRef.current;
    const title = titleRef.current;
    const stats = statsRef.current;
    if (!hero || !title || !stats) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    // Split title text
    const split = new SplitType(title, { types: "chars, words" });

    // Initial state
    gsap.set(split.chars, { opacity: 0, y: 20 });
    gsap.set(stats.children, { opacity: 0, y: 30 });

    // Timeline
    const tl = gsap.timeline({ delay: 0.3 });

    tl.to(split.chars, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.02,
      ease: "power2.out",
    }).to(
      stats.children,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
      },
      "-=0.3"
    );

    // Scroll-triggered fade out
    gsap.to(hero, {
      scale: 0.95,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      split.revert();
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-noche to-bg-primario" />

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <h1
          ref={titleRef}
          className="font-barlow text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wider text-texto-principal"
        >
          Liga Paraguaya de Fútbol
        </h1>

        <p className="mt-4 text-texto-secundario text-lg md:text-xl max-w-2xl mx-auto">
          Estadísticas en vivo del fútbol paraguayo
        </p>

        {/* Animated stats */}
        <div
          ref={statsRef}
          className="mt-12 flex flex-wrap justify-center gap-8 md:gap-16"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-barlow text-3xl md:text-5xl font-bold text-apf-dorado">
                <CountUp end={stat.value} duration={2.5} />
              </div>
              <div className="text-texto-apagado text-xs md:text-sm tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-texto-apagado">
        <span className="text-xs tracking-widest">SCROLL</span>
        <div className="w-px h-8 bg-gradient-to-b from-texto-apagado to-transparent" />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/hero/CinematicHero.tsx
git commit -m "feat: add CinematicHero with SplitType text reveal and counters"
```

---

### Task 6: Integrate Hero into Home Page

**Files:**
- Modify: `frontend/src/app/page.tsx`

**Interfaces:**
- Consumes: CinematicHero from Task 5

- [ ] **Step 1: Read current home page**

Read: `frontend/src/app/page.tsx`

- [ ] **Step 2: Replace hero section with CinematicHero**

Replace the existing hero section with:
```tsx
import CinematicHero from "@/components/hero/CinematicHero";

// In the JSX, replace the hero:
<CinematicHero />
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat: integrate CinematicHero into home page"
```

---

### Task 7: Page Transitions with Framer Motion

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Create: `frontend/src/components/ui/PageTransition.tsx`

**Interfaces:**
- Consumes: framer-motion AnimatePresence
- Produces: PageTransition wrapper

- [ ] **Step 1: Create PageTransition component**

```tsx
// frontend/src/components/ui/PageTransition.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Add PageTransition to layout**

Read: `frontend/src/app/layout.tsx`

Wrap the main content with PageTransition:
```tsx
import PageTransition from "@/components/ui/PageTransition";

// Inside the body, wrap the main content:
<main>
  <PageTransition>{children}</PageTransition>
</main>
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/PageTransition.tsx frontend/src/app/layout.tsx
git commit -m "feat: add Framer Motion page transitions"
```

---

### Task 8: Apply ScrollReveal to Table Page

**Files:**
- Modify: `frontend/src/app/tabla/page.tsx`

**Interfaces:**
- Consumes: ScrollReveal from Task 1

- [ ] **Step 1: Read tabla page**

Read: `frontend/src/app/tabla/page.tsx`

- [ ] **Step 2: Wrap standings rows with ScrollReveal**

Add ScrollReveal around the table rows:
```tsx
import ScrollReveal from "@/components/ui/ScrollReveal";

// Wrap the table body rows:
<ScrollReveal variant="from-left" stagger={0.05}>
  {/* existing table rows */}
</ScrollReveal>
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/tabla/page.tsx
git commit -m "feat: add scroll reveal animations to standings table"
```

---

### Task 9: Apply ScrollReveal to Goleadores Page

**Files:**
- Modify: `frontend/src/app/goleadores/page.tsx`

**Interfaces:**
- Consumes: ScrollReveal from Task 1, CountUp from Task 2

- [ ] **Step 1: Read goleadores page**

Read: `frontend/src/app/goleadores/page.tsx`

- [ ] **Step 2: Wrap scorer list with ScrollReveal**

```tsx
import ScrollReveal from "@/components/ui/ScrollReveal";

// Wrap the scorer items:
<ScrollReveal variant="from-bottom" stagger={0.03}>
  {/* existing scorer list items */}
</ScrollReveal>
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/goleadores/page.tsx
git commit -m "feat: add scroll reveal animations to goleadores page"
```

---

### Task 10: Apply ScrollReveal to Noticias Page

**Files:**
- Modify: `frontend/src/app/noticias/page.tsx`
- Modify: `frontend/src/components/noticia/NoticiaGrid.tsx`

**Interfaces:**
- Consumes: ScrollReveal from Task 1

- [ ] **Step 1: Wrap NoticiaGrid with ScrollReveal**

```tsx
import ScrollReveal from "@/components/ui/ScrollReveal";

// In NoticiaGrid.tsx, wrap the grid:
<ScrollReveal variant="scale-up" stagger={0.05}>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {noticias.map((noticia, i) => (
      <NoticiaCard key={noticia.id} noticia={noticia} />
    ))}
  </div>
</ScrollReveal>
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/noticia/NoticiaGrid.tsx
git commit -m "feat: add scroll reveal animations to noticias grid"
```

---

### Task 11: Apply ScrollReveal to Clubes Page

**Files:**
- Modify: `frontend/src/app/clubes/page.tsx`

**Interfaces:**
- Consumes: ScrollReveal from Task 1, TiltCard from Task 3

- [ ] **Step 1: Read clubes page**

Read: `frontend/src/app/clubes/page.tsx`

- [ ] **Step 2: Wrap club cards with ScrollReveal + TiltCard**

```tsx
import ScrollReveal from "@/components/ui/ScrollReveal";
import TiltCard from "@/components/ui/TiltCard";

// Wrap club grid:
<ScrollReveal variant="from-bottom" stagger={0.04}>
  {clubes.map(club => (
    <TiltCard key={club.id}>
      {/* existing club card */}
    </TiltCard>
  ))}
</ScrollReveal>
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/clubes/page.tsx
git commit -m "feat: add scroll reveal and 3D tilt to clubes page"
```

---

### Task 12: Glow Effect for Table Leader

**Files:**
- Modify: `frontend/src/app/globals.css`

**Interfaces:**
- Produces: `.glow-lider` CSS class

- [ ] **Step 1: Add glow-lider animation to globals.css**

```css
/* Add to globals.css */
.glow-lider {
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255, 204, 0, 0.3),
                0 0 10px rgba(255, 204, 0, 0.1);
  }
  50% {
    box-shadow: 0 0 15px rgba(255, 204, 0, 0.5),
                0 0 30px rgba(255, 204, 0, 0.2);
  }
}
```

- [ ] **Step 2: Apply glow-lider to standings leader row**

Modify the standings table component to apply `.glow-lider` class to position 1 row.

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/globals.css
git commit -m "feat: add golden glow animation for table leader"
```

---

### Task 13: Final Verification + Lighthouse Check

**Files:** None (verification only)

- [ ] **Step 1: Full build verification**

Run: `cd frontend && npm run build`
Expected: 0 errors, 22+ routes

- [ ] **Step 2: Verify all animations respect reduced motion**

Open DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`
Navigate through: /, /tabla, /goleadores, /noticias, /clubes
Expected: No animations play, content still accessible

- [ ] **Step 3: Verify on mobile viewport**

Open DevTools → Toggle device toolbar → iPhone 14
Navigate through all pages
Expected: Animations perform smoothly, no jank

- [ ] **Step 4: Run existing backend tests (no regressions)**

Run: `cd backend && python -m pytest -v --tb=short 2>&1 | head -30`
Expected: All tests pass

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: GSAP cinematic experience complete - ScrollReveal, Hero, Parallax, Tilt, Transitions"
```

---

*Plan generado via writing-plans · 2026-07-14*
*liga.paraguaya.futbol · GSAP Experience Implementation*
