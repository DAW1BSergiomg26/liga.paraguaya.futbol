"use client";
import { PredictionData } from "@/types";

interface Props { data: PredictionData }

export default function PredictionCard({ data }: Props) {
  const confidenceColors: Record<string, string> = {
    alta: "text-green-400",
    media: "text-yellow-400",
    baja: "text-gray-400",
  };

  return (
    <div className="max-w-[80%] rounded-2xl p-4 bg-bg-secundario border border-borde-sutil text-sm space-y-3">
      <p className="text-apf-rojo font-semibold text-xs uppercase tracking-wider">Predicción</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden flex">
          <div className="h-full bg-green-500" style={{ width: `${data.local_win_pct}%` }} />
          <div className="h-full bg-yellow-500" style={{ width: `${data.draw_pct}%` }} />
          <div className="h-full bg-red-500" style={{ width: `${data.visitor_win_pct}%` }} />
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-300">
        <span>Local {data.local_win_pct}%</span>
        <span>Empate {data.draw_pct}%</span>
        <span>Visitante {data.visitor_win_pct}%</span>
      </div>
      <div className={`text-xs ${confidenceColors[data.confidence] || "text-gray-400"}`}>
        Confianza: {data.confidence}
        {data.total_partidos !== undefined && ` · ${data.total_partidos} partidos`}
      </div>
    </div>
  );
}
