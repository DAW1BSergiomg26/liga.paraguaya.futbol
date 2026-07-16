"use client";
import { H2HData } from "@/types";

interface Props { data: H2HData }

export default function H2HCard({ data }: Props) {
  const total = data.wins1 + data.draws + data.wins2;
  const pct1 = total ? Math.round((data.wins1 / total) * 100) : 0;
  const pctD = total ? Math.round((data.draws / total) * 100) : 0;
  const pct2 = total ? Math.round((data.wins2 / total) * 100) : 0;

  return (
    <div className="max-w-[80%] rounded-2xl p-4 bg-bg-secundario border border-borde-sutil text-sm space-y-3">
      <p className="text-apf-rojo font-semibold text-xs uppercase tracking-wider">Historial</p>
      <div className="flex items-center justify-between gap-2">
        <div className="text-center flex-1">
          <p className="text-xs font-bold text-white truncate">{data.club1.nombre}</p>
          <p className="text-lg font-bold text-white">{data.wins1}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">vs</p>
          <p className="text-xs text-gray-400">{data.draws}E</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-xs font-bold text-white truncate">{data.club2.nombre}</p>
          <p className="text-lg font-bold text-white">{data.wins2}</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
        <div className="h-full bg-green-500" style={{ width: `${pct1}%` }} />
        <div className="h-full bg-yellow-500" style={{ width: `${pctD}%` }} />
        <div className="h-full bg-red-500" style={{ width: `${pct2}%` }} />
      </div>
      {data.ultimos.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400">Últimos enfrentamientos:</p>
          {data.ultimos.map((u, i) => (
            <div key={i} className="flex justify-between text-xs text-gray-300">
              <span>{u.fecha}</span>
              <span className="font-semibold text-white">{u.goles1} - {u.goles2}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
