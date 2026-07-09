"use client";
import { ComparisonData } from "@/types";

interface Props { data: ComparisonData }

export default function ComparisonCard({ data }: Props) {
  return (
    <div className="max-w-[80%] rounded-2xl p-4 bg-bg-secundario border border-borde-sutil text-sm space-y-3">
      <p className="text-py-rojo font-semibold text-xs uppercase tracking-wider">Comparación</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-xs font-bold text-white truncate">{data.club1.nombre}</p>
          <p className="text-xs text-gray-400">{data.club1.titulos} ligas</p>
          <p className="text-xs text-gray-400">Fundado {data.club1.fundacion}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-white truncate">{data.club2.nombre}</p>
          <p className="text-xs text-gray-400">{data.club2.titulos} ligas</p>
          <p className="text-xs text-gray-400">Fundado {data.club2.fundacion}</p>
        </div>
      </div>
      <ul className="space-y-1">
        {data.advantages.map((a, i) => (
          <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
            <span className="text-py-rojo mt-0.5">•</span>
            {a}
          </li>
        ))}
      </ul>
    </div>
  );
}
