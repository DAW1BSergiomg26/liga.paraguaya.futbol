"use client";

import { useEffect, useRef } from "react";

export default function StripesBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf: number | null = null;

    function onMouse(e: MouseEvent) {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 24;
        const y = (e.clientY / window.innerHeight - 0.5) * 24;
        el!.style.transform = `translate(${x}px, ${y}px)`;
        raf = null;
      });
    }

    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="stripes-bg" aria-hidden="true" />;
}
