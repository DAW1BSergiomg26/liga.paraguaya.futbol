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
