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
    const split = new SplitType(title, { types: "chars,words" });

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
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background image (claro y reconocible) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-45"
        style={{ backgroundImage: "url('/fondoweb.png')" }}
        aria-hidden
      />
      {/* Overlay suave para legibilidad del texto */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-noche/70 to-bg-primario/80" />

      {/* Borde tricolor Paraguay (fino y redondeado) a todo el cuadro */}
      <div
        className="pointer-events-none absolute inset-0 z-[5] rounded-3xl"
        style={{ boxShadow: "inset 0 0 0 2px #D52B1E, inset 0 0 0 4px #FFFFFF, inset 0 0 0 6px #0038A8" }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <h1
          ref={titleRef}
          className="hero-title-glow font-barlow text-[2.6rem] md:text-[4.3rem] lg:text-[5.2rem] font-bold uppercase tracking-wider"
        >
          Liga Paraguaya de Fútbol
        </h1>

        <p className="hero-sub-glow mt-4 text-xl md:text-2xl max-w-2xl mx-auto">
          Estadísticas en vivo del fútbol paraguayo
        </p>

        {/* Animated stats */}
        <div
          ref={statsRef}
          className="mt-12 flex flex-wrap justify-center gap-8 md:gap-16"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="hero-title-glow font-barlow text-4xl md:text-[3.4rem] font-bold">
                 <CountUp end={stat.value} duration={2.5} />
               </div>
               <div className="text-texto-apagado text-sm md:text-base tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
