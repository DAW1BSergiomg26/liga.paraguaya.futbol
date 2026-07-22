"use client";

import { useEffect, useRef } from "react";
import { initGSAP, gsap, ScrollTrigger } from "@/lib/gsap";

export default function StripesBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const redRef = useRef<HTMLDivElement>(null);
  const whiteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let raf: number | null = null;

    function onMouse(e: MouseEvent) {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 24;
        const y = (e.clientY / window.innerHeight - 0.5) * 24;
        container!.style.transform = `translate(${x}px, ${y}px)`;
        raf = null;
      });
    }

    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    initGSAP();
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const red = redRef.current;
    const white = whiteRef.current;
    if (!red || !white) return;

    const tweens = [
      gsap.to(red, {
        yPercent: -30,
        ease: "none",
        scrollTrigger: { scrub: true },
      }),
      gsap.to(white, {
        yPercent: -15,
        ease: "none",
        scrollTrigger: { scrub: true },
      }),
    ];

    return () => {
      tweens.forEach((t) => t.kill());
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="stripes-bg" aria-hidden="true">
      <div
        ref={redRef}
        className="stripe-red"
        style={{
          position: "absolute",
          inset: "-30% 0",
          backgroundImage: `repeating-linear-gradient(
            115deg,
            rgba(213, 43, 30, 0.08) 0px,
            rgba(213, 43, 30, 0.08) 40px,
            transparent 40px,
            transparent 80px,
            transparent 80px,
            transparent 120px
          )`,
          willChange: "transform",
        }}
      />
      <div
        ref={whiteRef}
        className="stripe-white"
        style={{
          position: "absolute",
          inset: "-15% 0",
          backgroundImage: `repeating-linear-gradient(
            115deg,
            transparent 0px,
            transparent 40px,
            rgba(245, 246, 250, 0.04) 40px,
            rgba(245, 246, 250, 0.04) 80px,
            transparent 80px,
            transparent 120px
          )`,
          willChange: "transform",
        }}
      />
    </div>
  );
}
