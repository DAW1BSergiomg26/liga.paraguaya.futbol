"use client";

import { useEffect, useRef, useMemo } from "react";
import { initGSAP, gsap } from "@/lib/gsap";
import type { ClubRadar } from "@/types";

const AXES = [
  { key: "ataque", label: "Ataque" },
  { key: "defensa", label: "Defensa" },
  { key: "rendimiento", label: "Rendimiento" },
  { key: "palmares", label: "Palmarés" },
  { key: "gol_individual", label: "Gol Individual" },
  { key: "actividad_mercado", label: "Actividad Mercado" },
] as const;

const SIZE = 500;
const CENTER = SIZE / 2;
const MAX_RADIUS = 180;
const LEVELS = 5;

function getAxisAngle(index: number): number {
  return -Math.PI / 2 + (index * Math.PI * 2) / (AXES.length);
}

function getPolygonPath(values: number[], maxVal: number): string {
  const points = values.map((v, i) => {
    const angle = getAxisAngle(i);
    const r = (v / maxVal) * MAX_RADIUS;
    return {
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle),
    };
  });
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
}

interface RadarProps {
  clubA: ClubRadar;
  clubB: ClubRadar;
}

export default function RadarComparativo({ clubA, clubB }: RadarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathARef = useRef<SVGPathElement>(null);
  const pathBRef = useRef<SVGPathElement>(null);

  const metricKeys = AXES.map((a) => a.key);
  const valuesA = metricKeys.map((k) => clubA.metricas[k]);
  const valuesB = metricKeys.map((k) => clubB.metricas[k]);

  const finalPathA = useMemo(() => getPolygonPath(valuesA, 100), [valuesA]);
  const finalPathB = useMemo(() => getPolygonPath(valuesB, 100), [valuesB]);
  const zeroPath = useMemo(() => getPolygonPath([0, 0, 0, 0, 0, 0], 100), []);

  useEffect(() => {
    initGSAP();
    const pathA = pathARef.current;
    const pathB = pathBRef.current;
    if (!pathA || !pathB) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      gsap.set(pathA, { attr: { d: finalPathA } });
      gsap.set(pathB, { attr: { d: finalPathB } });
      return;
    }

    gsap.set(pathA, { attr: { d: zeroPath } });
    gsap.set(pathB, { attr: { d: zeroPath } });

    const tl = gsap.timeline();
    tl.to(pathA, {
      attr: { d: finalPathA },
      duration: 0.8,
      ease: "power2.out",
    });
    tl.to(
      pathB,
      { attr: { d: finalPathB }, duration: 0.8, ease: "power2.out" },
      "<0.1"
    );

    return () => {
      tl.kill();
    };
  }, [finalPathA, finalPathB, zeroPath]);

  return (
    <div className="flex flex-col items-center gap-6">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[500px]"
      >
        {/* Concentric hexagons */}
        {Array.from({ length: LEVELS }).map((_, i) => {
          const level = ((i + 1) / LEVELS) * 100;
          const pts = Array.from({ length: AXES.length }).map((_, j) => {
            const angle = getAxisAngle(j);
            const r = (level / 100) * MAX_RADIUS;
            return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
          });
          return (
            <polygon
              key={i}
              points={pts.join(" ")}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines + labels */}
        {AXES.map((axis, i) => {
          const angle = getAxisAngle(i);
          const x2 = CENTER + MAX_RADIUS * Math.cos(angle);
          const y2 = CENTER + MAX_RADIUS * Math.sin(angle);
          const labelX = CENTER + (MAX_RADIUS + 24) * Math.cos(angle);
          const labelY = CENTER + (MAX_RADIUS + 24) * Math.sin(angle);
          return (
            <g key={axis.key}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-texto-secundario text-[11px] font-medium"
              >
                {axis.label}
              </text>
            </g>
          );
        })}

        {/* Club A polygon */}
        <path
          ref={pathARef}
          d={zeroPath}
          fill="#CC001C"
          fillOpacity={0.25}
          stroke="#CC001C"
          strokeWidth={2}
        />

        {/* Club B polygon */}
        <path
          ref={pathBRef}
          d={zeroPath}
          fill="#00619E"
          fillOpacity={0.25}
          stroke="#00619E"
          strokeWidth={2}
        />

        {/* Axis dots for Club A */}
        {valuesA.map((v, i) => {
          const angle = getAxisAngle(i);
          const r = (v / 100) * MAX_RADIUS;
          return (
            <circle
              key={`a-${i}`}
              cx={CENTER + r * Math.cos(angle)}
              cy={CENTER + r * Math.sin(angle)}
              r={4}
              fill="#CC001C"
              stroke="#0A0E1A"
              strokeWidth={2}
            />
          );
        })}

        {/* Axis dots for Club B */}
        {valuesB.map((v, i) => {
          const angle = getAxisAngle(i);
          const r = (v / 100) * MAX_RADIUS;
          return (
            <circle
              key={`b-${i}`}
              cx={CENTER + r * Math.cos(angle)}
              cy={CENTER + r * Math.sin(angle)}
              r={4}
              fill="#00619E"
              stroke="#0A0E1A"
              strokeWidth={2}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#CC001C]" />
          <span className="text-texto-secundario">{clubA.nombre}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#00619E]" />
          <span className="text-texto-secundario">{clubB.nombre}</span>
        </div>
      </div>

      {/* Stats table */}
      <div className="w-full max-w-[500px] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde-sutil">
              <th className="p-2 text-left text-texto-secundario">Métrica</th>
              <th className="p-2 text-right text-texto-secundario">{clubA.nombre}</th>
              <th className="p-2 text-right text-texto-secundario">{clubB.nombre}</th>
            </tr>
          </thead>
          <tbody>
            {AXES.map((axis) => (
              <tr key={axis.key} className="border-b border-borde-sutil">
                <td className="p-2 text-texto-principal">{axis.label}</td>
                <td className="p-2 text-right font-mono text-[#CC001C]">
                  {clubA.metricas[axis.key].toFixed(1)}
                </td>
                <td className="p-2 text-right font-mono text-[#00619E]">
                  {clubB.metricas[axis.key].toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
