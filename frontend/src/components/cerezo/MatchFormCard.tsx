"use client";
import { MatchFormData } from "@/types";

interface Props { data: MatchFormData }

const resultColors: Record<string, string> = {
  G: "bg-green-600",
  E: "bg-yellow-600",
  P: "bg-red-600",
};

export default function MatchFormCard({ data }: Props) {
  const total = data.wins + data.draws + data.losses;
  return (
    <div className="max-w-[80%] rounded-2xl p-4 bg-bg-secundario border border-borde-sutil text-sm space-y-3">
      <p className="text-apf-rojo font-semibold text-xs uppercase tracking-wider">Últimos Partidos</p>
      <div className="flex gap-1.5">
        {data.last5.map((m, i) => (
          <div
            key={i}
            className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white ${resultColors[m.resultado] || "bg-gray-600"}`}
            title={`${m.goles_local ?? "?"} - ${m.goles_visit ?? "?"}`}
          >
            {m.resultado}
          </div>
        ))}
      </div>
      <div className="flex gap-3 text-xs text-gray-300">
        <span className="text-green-400">{data.wins}G</span>
        <span className="text-yellow-400">{data.draws}E</span>
        <span className="text-red-400">{data.losses}P</span>
        <span className="text-gray-500">{total} partidos</span>
      </div>
    </div>
  );
}
