"use client";

import type { InsightTactico } from "@/types";

interface InsightsPanelProps {
  tendencias: InsightTactico[];
}

export default function InsightsPanel({ tendencias }: InsightsPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white">Tendencias IA</h3>
      {tendencias.map((tendencia, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 p-3 bg-bg-terciario rounded-lg border border-borde-sutil"
        >
          <span className="text-xl">{tendencia.icono}</span>
          <div>
            <p className="text-sm text-white">{tendencia.texto}</p>
            {tendencia.metrica && (
              <p className="text-xs text-py-rojo mt-1 font-bold">{tendencia.metrica}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
