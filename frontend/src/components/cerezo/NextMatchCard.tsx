"use client";
import { NextMatchData } from "@/types";

interface Props { data: NextMatchData }

export default function NextMatchCard({ data }: Props) {
  return (
    <div className="max-w-[80%] rounded-2xl p-4 bg-bg-secundario border border-borde-sutil text-sm space-y-2">
      <p className="text-apf-rojo font-semibold text-xs uppercase tracking-wider">Próximo Partido</p>
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="text-center">
          <p className="text-xs font-bold text-white">{data.club}</p>
        </div>
        <p className="text-xs text-gray-400 font-bold">VS</p>
        <div className="text-center">
          <p className="text-xs font-bold text-white">{data.rival}</p>
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs text-gray-300">{data.fecha}</p>
        <p className="text-xs text-gray-400">{data.torneo}</p>
        {data.estadio && <p className="text-xs text-gray-500">{data.estadio}</p>}
      </div>
    </div>
  );
}
