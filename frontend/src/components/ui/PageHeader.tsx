"use client";

import type { ReactNode } from "react";

interface PageHeaderProps {
  titulo: string;
  subtitulo?: string | ReactNode;
  accion?: ReactNode;
  children?: ReactNode;
}

export default function PageHeader({
  titulo,
  subtitulo,
  accion,
  children,
}: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secundario/80 to-bg-primario border border-borde-sutil mb-8 p-8">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 15.5 190 L 63.8 190 L 83.5 190 L 92.3 181.2 L 103.3 176.8 L 114.3 174.6 L 120.9 170.2 L 125.2 163.7 L 129.6 157.1 L 136.2 148.3 L 142.8 141.7 L 151.6 135.1 L 158.2 130.7 L 164.8 124.1 L 169.1 119.8 L 173.5 113.2 L 180.1 104.4 L 184.5 97.8 L 184.5 91.2 L 180.1 82.4 L 180.1 75.9 L 180.1 69.3 L 180.1 64.9 L 175.7 58.3 L 173.5 53.9 L 169.1 47.3 L 164.8 42.9 L 158.2 36.3 L 151.6 32 L 147.2 25.4 L 142.8 21 L 136.2 16.6 L 129.6 12.2 L 125.2 10 L 120.9 12.2 L 114.3 16.6 L 107.7 18.8 L 103.3 21 L 98.9 25.4 L 92.3 32 L 92.3 38.5 L 85.7 47.3 L 81.3 53.9 L 74.8 60.5 L 70.4 64.9 L 63.8 69.3 L 59.4 75.9 L 55 82.4 L 48.4 86.8 L 48.4 91.2 L 41.8 97.8 L 37.4 104.4 L 33 108.8 L 26.5 113.2 L 26.5 119.8 L 19.9 126.3 L 19.9 135.1 L 19.9 141.7 L 15.5 152.7 L 15.5 163.7 L 15.5 174.6 L 15.5 185.6 L 15.5 190 Z"
          fill="currentColor"
          className="text-apf-rojo/5"
        />
      </svg>
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold titulo-modulo text-gradient-shine">
            {titulo}
          </h1>
          {subtitulo && typeof subtitulo === "string" ? (
            <p className="text-texto-secundario text-sm mt-1">{subtitulo}</p>
          ) : (
            subtitulo
          )}
        </div>
        {accion && <div>{accion}</div>}
      </div>
      {children}
    </div>
  );
}
