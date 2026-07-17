"use client";
import Image from "next/image";
import { MiniTableData } from "@/types";
import { useState } from "react";

interface Props { data: MiniTableData }

export default function MiniTableCard({ data }: Props) {
  const [escudoErrors, setEscudoErrors] = useState<Record<string, boolean>>({});

  return (
    <div className="max-w-[80%] rounded-2xl p-4 bg-bg-secundario border border-borde-sutil text-sm space-y-2">
      <p className="text-apf-rojo font-semibold text-xs uppercase tracking-wider">
        {data.torneo} · J{data.jornada}
      </p>
      <div className="space-y-1">
        {data.clubes.map((c) => {
          const isHighlighted = data.club_destacado && data.club_destacado.nombre === c.nombre;
          return (
            <div
              key={c.pos}
              className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${isHighlighted ? "bg-apf-rojo/10 border border-[#76e4f7]/30" : ""}`}
            >
              <span className="w-5 text-center font-bold text-gray-400">{c.pos}</span>
              {c.escudo && !escudoErrors[c.nombre] && (
                <Image src={c.escudo} alt="" width={16} height={16} loading="lazy" className="w-4 h-4 object-contain" onError={() => setEscudoErrors(prev => ({ ...prev, [c.nombre]: true }))} />
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
