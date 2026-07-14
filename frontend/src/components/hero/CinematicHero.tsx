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
