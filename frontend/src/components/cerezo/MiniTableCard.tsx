"use client";
import { MiniTableData } from "@/types";

interface Props { data: MiniTableData }

export default function MiniTableCard({ data }: Props) {
  return (
    <div className="max-w-[80%] rounded-2xl p-4 bg-bg-secundario border border-borde-sutil text-sm space-y-2">
      <p className="text-py-rojo font-semibold text-xs uppercase tracking-wider">
        {data.torneo} · J{data.jornada}
      </p>
      <div className="space-y-1">
        {data.clubes.map((c) => {
          const isHighlighted = data.club_destacado && data.club_destacado.nombre === c.nombre;
          return (
            <div
              key={c.pos}
              className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${isHighlighted ? "bg-py-rojo/10 border border-[#76e4f7]/30" : ""}`}
            >
              <span className="w-5 text-center font-bold text-gray-400">{c.pos}</span>
              {c.escudo && (
                <img src={c.escudo} alt="" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
              )}
              <span className="flex-1 text-white truncate">{c.nombre}</span>
              <span className="text-gray-400 w-6 text-right">{c.pj}</span>
              <span className="text-white font-bold w-6 text-right">{c.pts}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
