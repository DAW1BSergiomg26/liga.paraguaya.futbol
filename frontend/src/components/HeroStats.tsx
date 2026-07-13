"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const EASE_DURATION = 1500;

/* ---------- deterministic sparkle positions ---------- */
const SPARKLE_POSITIONS = [
  { left: 35, top: 22 }, { left: 72, top: 48 }, { left: 28, top: 65 },
  { left: 58, top: 18 }, { left: 45, top: 75 },
];

/* ---------- 7 trophies — pre-computed orbit positions (r=42, 360/7° spacing) ---------- */
const TROPHY_POSITIONS = [
  { left: "50%",   top: "8%"    },
  { left: "82.8%", top: "23.8%"  },
  { left: "91%",   top: "59.3%"  },
  { left: "68.2%", top: "87.8%"  },
  { left: "31.8%", top: "87.8%"  },
  { left: "9%",    top: "59.3%"  },
  { left: "17.2%", top: "23.8%"  },
];

/* ---------- 12 ambient lights — pre-computed (r=43, 30° spacing) ---------- */
const AMBIENT_POSITIONS = [
  { left: "93%",   top: "50%"   },
  { left: "87.2%", top: "71.5%"  },
  { left: "71.5%", top: "87.2%"  },
  { left: "50%",   top: "93%"    },
  { left: "28.5%", top: "87.2%"  },
  { left: "12.8%", top: "71.5%"  },
  { left: "7%",    top: "50%"    },
  { left: "12.8%", top: "28.5%"  },
  { left: "28.5%", top: "12.8%"  },
  { left: "50%",   top: "7%"     },
  { left: "71.5%", top: "12.8%"  },
  { left: "87.2%", top: "28.5%"  },
];

/* ---------- Tricolor cycle (rojo → blanco → azul) ---------- */
const TRICOLOR_GLOW: [string, string][] = [
  ["rgba(213,43,30,0.5)",  "rgba(213,43,30,0.15)"],
  ["rgba(255,255,255,0.5)","rgba(255,255,255,0.1)"],
  ["rgba(0,56,168,0.5)",   "rgba(0,56,168,0.15)"],
];

/* ---------- Elegant trophy component ---------- */
function ElegantTrophy({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cup body - tapered vessel */}
      <path
        d="M14 8 L34 8 L31 38 L17 38 Z"
        fill="url(#trophy-gold)"
        stroke="rgba(212,175,55,0.5)"
        strokeWidth="0.5"
      />
      {/* Left handle */}
      <path
        d="M14 12 C8 12, 6 18, 10 22 C12 24, 14 22, 14 20"
        fill="none"
        stroke="url(#trophy-gold)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Right handle */}
      <path
        d="M34 12 C40 12, 42 18, 38 22 C36 24, 34 22, 34 20"
        fill="none"
        stroke="url(#trophy-gold)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Stem */}
      <rect x="21" y="38" width="6" height="8" rx="1" fill="url(#trophy-gold)" />
      {/* Base tier 1 */}
      <rect x="16" y="46" width="16" height="4" rx="1.5" fill="url(#trophy-gold)" />
      {/* Base tier 2 */}
      <rect x="13" y="50" width="22" height="3" rx="1" fill="url(#trophy-gold)" />
      {/* Rim highlight */}
      <rect x="15" y="9" width="18" height="1.5" rx="0.75" fill="rgba(255,255,255,0.35)" />
      {/* Inner cup shadow */}
      <path
        d="M17 11 L31 11 L29.5 35 L18.5 35 Z"
        fill="url(#trophy-inner)"
      />
      {/* Specular highlight on cup */}
      <path
        d="M18 10 L22 10 L21 34 L19 34 Z"
        fill="rgba(255,255,255,0.12)"
      />
      {/* Star on cup */}
      <path
        d="M24 16 L25.5 20 L30 20.5 L26.5 23.5 L27.5 28 L24 25.5 L20.5 28 L21.5 23.5 L18 20.5 L22.5 20 Z"
        fill="rgba(255,255,255,0.25)"
        stroke="rgba(212,175,55,0.4)"
        strokeWidth="0.3"
      />
      <defs>
        <linearGradient id="trophy-gold" x1="24" y1="8" x2="24" y2="53">
          <stop offset="0%" stopColor="#C9A84C" />
          <stop offset="30%" stopColor="#D4AF37" />
          <stop offset="60%" stopColor="#B8962E" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        <linearGradient id="trophy-inner" x1="24" y1="11" x2="24" y2="35">
          <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AnimatedNumber({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min((now - start) / EASE_DURATION, 1);
      setVal(Math.floor((1 - (1 - t) * (1 - t)) * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target]);

  return <span>{val.toLocaleString()}</span>;
}

export default function HeroStats({
  clubesCount,
  partidosTotal,
  equiposCount,
  torneoLabel,
  hasErrors,
  errClubes,
  errPartidos,
  errTorneos,
  errTabla,
}: {
  clubesCount: number;
  partidosTotal: number;
  equiposCount: number;
  torneoLabel: string | null;
  hasErrors: boolean;
  errClubes: string | null;
  errPartidos: string | null;
  errTorneos: string | null;
  errTabla: string | null;
}) {
  return (
    <>
      <section className="mb-12 p-8 rounded-2xl border border-borde-marca bg-bg-secundario/80 shadow-xl">
        <div className="flex items-center justify-between gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-apf-rojo text-sm font-bold uppercase tracking-widest mb-3">
              Proyecto DAW · Next.js + FastAPI
            </p>
            <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-4 titulo-modulo text-gradient-shine animate-shine">
              Liga Paraguaya de Fútbol
            </h1>
            <p className="text-texto-secundario max-w-xl text-lg">
              Plataforma de datos, clubes, partidos y tabla de posiciones del fútbol paraguayo.
            </p>
            {torneoLabel && (
              <p className="text-texto-apagado text-sm mt-2">
                Temporada actual: <span className="text-texto-principal font-medium">{torneoLabel}</span>
              </p>
            )}
            {hasErrors ? (
              <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-derrota/20 text-derrota border border-derrota/30 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-derrota shadow-lg shadow-derrota/50" />
                Error de conexión con el backend
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-victoria/20 text-victoria border border-victoria/30 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-victoria shadow-lg shadow-victoria/50" />
                Backend activo correctamente
              </div>
            )}
          </div>

          {/* ---------- Trophy orbit + ambient glow ---------- */}
          <div className="hidden md:flex flex-shrink-0 w-64 h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 items-center justify-center [perspective:1200px]">
            {/* Rotating orbit layer */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full animate-[ball-orbit_24s_linear_infinite]">
                {/* Subtle ring glow */}
                <div className="absolute inset-4 rounded-full border border-dorado-medalla/10 animate-[ring-breathe_4s_ease-in-out_infinite]" />
                <div className="absolute inset-8 rounded-full border border-dorado-medalla/5" />

                {/* Trofeos — 7 copas sin texto */}
                {TROPHY_POSITIONS.map((pos, i) => (
                  <div
                    key={`trophy-${i}`}
                    className="absolute group/trophy"
                    style={{ left: pos.left, top: pos.top, transform: "translate(-50%, -50%)" }}
                  >
                    <div
                      className="relative animate-[trophy-float_4s_ease-in-out_infinite] cursor-pointer"
                      style={{ animationDelay: `${i * 0.55}s` }}
                    >
                      <ElegantTrophy className="w-8 h-10 lg:w-9 lg:h-11 xl:w-10 xl:h-12 drop-shadow-[0_2px_6px_rgba(212,175,55,0.25)]" />
                      {/* Hover glow */}
                      <div className="absolute inset-[-8px] rounded-full bg-dorado-medalla/0 group-hover/trophy:bg-dorado-medalla/10 blur-lg transition-all duration-700" />
                    </div>
                  </div>
                ))}

                {/* Luces tricolor — 12 puntos de luz ambiental */}
                {AMBIENT_POSITIONS.map((pos, i) => {
                  const [glow, ambient] = TRICOLOR_GLOW[i % 3];
                  return (
                    <div
                      key={`light-${i}`}
                      className="absolute rounded-full animate-[ambient-glow_3s_ease-in-out_infinite]"
                      style={{
                        left: pos.left,
                        top: pos.top,
                        transform: "translate(-50%, -50%)",
                        width: "4px",
                        height: "4px",
                        backgroundColor: glow,
                        boxShadow: `0 0 8px 3px ${ambient}, 0 0 20px 6px ${ambient}`,
                        animationDelay: `${i * 0.25}s`,
                      }}
                    />
                  );
                })}

                {/* Center glow accent */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,transparent_70%)] animate-[ring-breathe_5s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>

            {/* ---------- Map (centered, on top) ---------- */}
            <div className="relative z-10 w-48 h-48 lg:w-60 lg:h-60 xl:w-72 xl:h-72 [perspective:900px]">
              <div className="relative w-full h-full transition-all duration-700 ease-out hover:scale-105 cursor-pointer group">
                <Image
                  src="/albirroparaguay.png"
                  alt="Mapa del Paraguay - Albirroja"
                  fill
                  className="object-contain animate-[map-glow-trace_5s_ease-in-out_infinite] transition-all duration-700 group-hover:scale-105"
                  priority
                />
                {/* Halo tricolor rotating */}
                <div className="absolute inset-[-10px] pointer-events-none">
                  <div className="w-full h-full animate-[ball-orbit_8s_linear_infinite] rounded-[40%_60%_55%_45%/55%_45%_55%_45%] border border-dorado-medalla/15 bg-[conic-gradient(from_0deg,rgba(213,43,30,0.3),rgba(212,175,55,0.15),rgba(0,56,168,0.3),rgba(212,175,55,0.15),rgba(213,43,30,0.3))] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:xor] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] p-[1px]" />
                </div>
                {/* Sparkles (fixed positions, no Math.random) */}
                {SPARKLE_POSITIONS.map((pos, i) => (
                  <div
                    key={`sparkle-${i}`}
                    className="absolute w-1 h-1 bg-dorado-medalla/60 rounded-full pointer-events-none animate-[sparkle-burst_3s_ease-in-out_infinite]"
                    style={{
                      left: `${pos.left}%`,
                      top: `${pos.top}%`,
                      animationDelay: `${i * 0.7}s`,
                    }}
                  />
                ))}
                <div className="absolute inset-0 rounded-[40%_60%_55%_45%/55%_45%_55%_45%] opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-dorado-medalla/10 via-transparent to-dorado-medalla/5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {errClubes && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
          Error al cargar clubes: {errClubes}
        </div>
      )}
      {errPartidos && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
          Error al cargar partidos: {errPartidos}
        </div>
      )}
      {errTorneos && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
          Error al cargar torneos: {errTorneos}
        </div>
      )}
      {errTabla && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
          Error al cargar tabla: {errTabla}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="p-6 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
          <p className="text-3xl font-bold text-apf-rojo">
            <AnimatedNumber target={clubesCount} />
          </p>
          <p className="text-texto-secundario mt-1">Clubes</p>
        </div>
        <div className="p-6 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
          <p className="text-3xl font-bold text-apf-rojo">
            <AnimatedNumber target={partidosTotal} />
          </p>
          <p className="text-texto-secundario mt-1">Partidos</p>
        </div>
        <div className="p-6 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
          <p className="text-3xl font-bold text-apf-rojo">
            <AnimatedNumber target={equiposCount} />
          </p>
          <p className="text-texto-secundario mt-1">Equipos en tabla</p>
        </div>
      </div>
    </>
  );
}
