"use client";
import { ClubDetailData } from "@/types";
import { useState } from "react";

interface Props { data: ClubDetailData }

export default function ClubCard({ data }: Props) {
  const [showTitulos, setShowTitulos] = useState(false);
  const { club, titulos } = data;

  return (
    <div className="max-w-[80%] rounded-2xl p-4 bg-bg-secundario border border-borde-sutil text-sm space-y-3">
      <div className="flex items-center gap-3">
        {club.escudo && (
          <img
            src={club.escudo}
            alt={club.nombre}
            className="w-10 h-10 object-contain rounded"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
          />
        )}
        <div>
          <p className="text-py-rojo font-bold">{club.nombre}</p>
          <p className="text-xs text-gray-400">{club.ciudad}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-gray-400">Estadio:</span> <span className="text-white">{club.estadio}</span></div>
        <div><span className="text-gray-400">Capacidad:</span> <span className="text-white">{club.capacidad.toLocaleString()}</span></div>
        <div><span className="text-gray-400">Fundación:</span> <span className="text-white">{club.fundacion}</span></div>
        <div><span className="text-gray-400">Títulos de liga:</span> <span className="text-white">{club.titulos_liga}</span></div>
      </div>
      <button
        onClick={() => setShowTitulos(!showTitulos)}
        className="text-xs text-py-rojo hover:underline"
      >
        {showTitulos ? "Ocultar títulos" : `Ver ${titulos.length} título(s)`}
      </button>
      {showTitulos && (
        <ul className="space-y-1 text-xs">
          {titulos.map((t, i) => (
            <li key={i} className="flex justify-between text-gray-300">
              <span>{t.torneo}</span>
              <span className="text-white font-semibold">{t.cantidad}</span>
            </li>
          ))}
        </ul>
      )}
      {club.descripcion && (
        <p className="text-xs text-gray-400 italic">{club.descripcion}</p>
      )}
    </div>
  );
}
