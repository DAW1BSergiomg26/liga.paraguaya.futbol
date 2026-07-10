"use client";

import type { ReactNode } from "react";
import Image from "next/image";

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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secundario/80 to-bg-primario border border-borde-sutil mb-8 p-8 flex items-center justify-between gap-4">
      {/* Contenido principal del encabezado */}
      <div className="relative z-10 flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      {/* Imagen de la albirroja integrada perfectamente a la derecha */}
      <div className="relative hidden md:block w-24 h-24 flex-shrink-0 opacity-85 select-none pointer-events-none">
        <Image
          src="/albirrojaparaguay.png"
          alt="Albirroja Paraguay"
          fill
          className="object-contain"
          priority
        />
      </div>

      {children}
    </div>
  );
}
