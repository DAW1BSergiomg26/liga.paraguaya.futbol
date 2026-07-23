"use client";

import type { InsightTactico } from "@/types";
import { iconMap } from "@/lib/iconMap";

interface InsightsPanelProps {
  tendencias: InsightTactico[];
}

export default function InsightsPanel({ tendencias }: InsightsPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white">Tendencias IA</h3>
      {tendencias.map((tendencia, idx) => {
        const Icon = iconMap[tendencia.icono];
        return (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 bg-bg-terciario rounded-lg border border-borde-sutil"
          >
            {Icon ? (
              <Icon className="w-5 h-5 text-apf-rojo shrink-0 mt-0.5" />
            ) : (
              <span className="text-xl">{tendencia.icono}</span>
            )}
            <div>
              <p className="text-sm text-white">{tendencia.texto}</p>
              {tendencia.metrica && (
                <p className="text-xs text-py-rojo mt-1 font-bold">{tendencia.metrica}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
