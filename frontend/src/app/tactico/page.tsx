"use client";

import Link from "next/link";
import Image from "next/image";
import { useTacticoEquipos } from "@/hooks/useTactico";
import PageHeader from "@/components/ui/PageHeader";

export default function TacticoPage() {
  const { data: equipos, isLoading, error } = useTacticoEquipos();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        titulo="Analisis Tactico IA"
        subtitulo="Formaciones, estadisticas avanzadas e insights inteligentes"
      />

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-bg-terciario rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-derrota">Error al cargar los equipos</p>
        </div>
      )}

      {equipos && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipos.map((equipo) => (
            <Link
              key={equipo.id}
              href={`/tactico/equipo/${equipo.id}`}
              className="block bg-bg-secundario border border-borde-sutil rounded-xl p-6 hover:border-py-rojo transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  {equipo.escudo ? (
                    <Image
                      src={equipo.escudo}
                      alt={equipo.nombre}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-bg-terciario rounded-full flex items-center justify-center text-xl font-bold text-white">
                      {equipo.nombre.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{equipo.nombre}</h3>
                  <p className="text-sm text-texto-secundario">
                    Formacion: {equipo.formacion}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
