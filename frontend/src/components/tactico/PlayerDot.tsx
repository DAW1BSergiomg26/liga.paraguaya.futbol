"use client";

interface PlayerDotProps {
  id: string;
  nombre: string;
  posicion: string;
  numero: number;
  x: number;
  y: number;
  color: string;
  onClick?: (id: string) => void;
}

export default function PlayerDot({ nombre, posicion, numero, x, y, color, onClick }: PlayerDotProps) {
  return (
    <div
      className="absolute flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-110 group"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
      onClick={() => onClick?.(nombre)}
    >
      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
          <div className="font-bold">{nombre}</div>
          <div className="text-gray-400">{posicion} · #{numero}</div>
        </div>
      </div>

      <div
        className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white/30"
        style={{ backgroundColor: color }}
      >
        {numero}
      </div>

      <div className="text-[10px] text-white mt-1 bg-black/50 px-1 rounded">
        {nombre.split(" ").pop()}
      </div>
    </div>
  );
}
