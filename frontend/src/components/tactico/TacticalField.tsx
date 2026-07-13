"use client";

import { useState } from "react";
import PlayerDot from "./PlayerDot";
import FormationSelector from "./FormationSelector";
import type { JugadorTactico } from "@/types";

interface TacticalFieldProps {
  jugadores: JugadorTactico[];
  formacionPrincipal: string;
  formacionesDisponibles: string[];
  colorEquipo?: string;
  titulo?: string;
}

const FORMACIONES_POSICIONES: Record<string, { x: number; y: number }[]> = {
  "4-3-3": [
    { x: 0.5, y: 0.95 },
    { x: 0.85, y: 0.75 },
    { x: 0.65, y: 0.8 },
    { x: 0.35, y: 0.8 },
    { x: 0.15, y: 0.75 },
    { x: 0.65, y: 0.55 },
    { x: 0.5, y: 0.6 },
    { x: 0.35, y: 0.55 },
    { x: 0.85, y: 0.35 },
    { x: 0.5, y: 0.25 },
    { x: 0.15, y: 0.35 },
  ],
  "4-4-2": [
    { x: 0.5, y: 0.95 },
    { x: 0.85, y: 0.75 },
    { x: 0.65, y: 0.8 },
    { x: 0.35, y: 0.8 },
    { x: 0.15, y: 0.75 },
    { x: 0.85, y: 0.5 },
    { x: 0.65, y: 0.55 },
    { x: 0.35, y: 0.55 },
    { x: 0.15, y: 0.5 },
    { x: 0.55, y: 0.25 },
    { x: 0.45, y: 0.25 },
  ],
  "4-2-3-1": [
    { x: 0.5, y: 0.95 },
    { x: 0.85, y: 0.75 },
    { x: 0.65, y: 0.8 },
    { x: 0.35, y: 0.8 },
    { x: 0.15, y: 0.75 },
    { x: 0.5, y: 0.6 },
    { x: 0.5, y: 0.55 },
    { x: 0.85, y: 0.4 },
    { x: 0.5, y: 0.4 },
    { x: 0.15, y: 0.4 },
    { x: 0.5, y: 0.2 },
  ],
  "3-5-2": [
    { x: 0.5, y: 0.95 },
    { x: 0.7, y: 0.8 },
    { x: 0.5, y: 0.82 },
    { x: 0.3, y: 0.8 },
    { x: 0.9, y: 0.55 },
    { x: 0.65, y: 0.6 },
    { x: 0.5, y: 0.62 },
    { x: 0.35, y: 0.6 },
    { x: 0.1, y: 0.55 },
    { x: 0.55, y: 0.25 },
    { x: 0.45, y: 0.25 },
  ],
  "3-4-3": [
    { x: 0.5, y: 0.95 },
    { x: 0.7, y: 0.8 },
    { x: 0.5, y: 0.82 },
    { x: 0.3, y: 0.8 },
    { x: 0.85, y: 0.5 },
    { x: 0.65, y: 0.55 },
    { x: 0.35, y: 0.55 },
    { x: 0.15, y: 0.5 },
    { x: 0.85, y: 0.3 },
    { x: 0.5, y: 0.2 },
    { x: 0.15, y: 0.3 },
  ],
  "5-3-2": [
    { x: 0.5, y: 0.95 },
    { x: 0.9, y: 0.7 },
    { x: 0.7, y: 0.78 },
    { x: 0.5, y: 0.8 },
    { x: 0.3, y: 0.78 },
    { x: 0.1, y: 0.7 },
    { x: 0.65, y: 0.55 },
    { x: 0.5, y: 0.58 },
    { x: 0.35, y: 0.55 },
    { x: 0.55, y: 0.25 },
    { x: 0.45, y: 0.25 },
  ],
};

export default function TacticalField({
  jugadores,
  formacionPrincipal,
  formacionesDisponibles,
  colorEquipo = "#1e40af",
  titulo,
}: TacticalFieldProps) {
  const [formacion, setFormacion] = useState(formacionPrincipal);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const posiciones = FORMACIONES_POSICIONES[formacion] || FORMACIONES_POSICIONES["4-3-3"];

  const jugadoresConPosicion = jugadores.map((j, i) => ({
    ...j,
    x: posiciones[i]?.x ?? j.x,
    y: posiciones[i]?.y ?? j.y,
  }));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {titulo && <h3 className="text-lg font-bold text-white">{titulo}</h3>}
        <FormationSelector
          formaciones={formacionesDisponibles}
          actual={formacion}
          onChange={setFormacion}
        />
      </div>

      <div className="relative w-full aspect-[2/3] bg-[#2d5a27] rounded-xl border-4 border-white/20 overflow-hidden shadow-2xl">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/30" />
          <div className="absolute top-1/2 left-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
          <div className="absolute top-0 left-[20%] right-[20%] h-[30%] border-b-2 border-x-2 border-white/30" />
          <div className="absolute bottom-0 left-[20%] right-[20%] h-[30%] border-t-2 border-x-2 border-white/30" />
          <div className="absolute top-0 left-[35%] right-[35%] h-[15%] border-b-2 border-x-2 border-white/30" />
          <div className="absolute bottom-0 left-[35%] right-[35%] h-[15%] border-t-2 border-x-2 border-white/30" />
          <div className="absolute top-0 left-[42%] right-[42%] h-[5%] border-b-2 border-x-2 border-white/40" />
          <div className="absolute bottom-0 left-[42%] right-[42%] h-[5%] border-t-2 border-x-2 border-white/40" />
        </div>

        {jugadoresConPosicion.map((jugador) => (
          <PlayerDot
            key={jugador.id}
            id={jugador.id}
            nombre={jugador.nombre}
            posicion={jugador.posicion}
            numero={jugador.numero}
            x={jugador.x}
            y={jugador.y}
            color={selectedPlayer === jugador.nombre ? "#ef4444" : colorEquipo}
            onClick={setSelectedPlayer}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {["POR", "DFC", "LD", "LI", "MC", "MCD", "MCO", "MD", "MI", "ED", "EI", "DC"].map((pos) => (
          <span key={pos} className="text-xs px-2 py-1 bg-bg-terciario rounded text-texto-secundario">
            {pos}
          </span>
        ))}
      </div>
    </div>
  );
}
