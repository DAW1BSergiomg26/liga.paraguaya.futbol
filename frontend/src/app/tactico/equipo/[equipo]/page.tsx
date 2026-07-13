"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useTacticoEquipo } from "@/hooks/useTactico";
import TacticalField from "@/components/tactico/TacticalField";
import StatsPanel from "@/components/tactico/StatsPanel";
import InsightsPanel from "@/components/tactico/InsightsPanel";
import PageHeader from "@/components/ui/PageHeader";

export default function EquipoTacticoPage() {
  const params = useParams();
  const equipoId = params.equipo as string;
  const { data: equipo, isLoading, error } = useTacticoEquipo(equipoId);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-bg-terciario rounded-xl" />
          <div className="h-96 bg-bg-terciario rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !equipo) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-derrota">Equipo no encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        titulo={equipo.nombre}
        subtitulo={`Analisis tactico · ${equipo.formacion_principal}`}
        accion={
          <div className="relative w-20 h-20">
            {equipo.escudo ? (
              <Image src={equipo.escudo} alt={equipo.nombre} fill className="object-contain" />
            ) : (
              <div className="w-20 h-20 bg-bg-terciario rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {equipo.nombre.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TacticalField
            jugadores={equipo.jugadores}
            formacionPrincipal={equipo.formacion_principal}
            formacionesDisponibles={equipo.formaciones_disponibles}
            colorEquipo="#D52B1E"
            titulo={equipo.nombre}
          />
        </div>

        <div className="space-y-6">
          <StatsPanel stats={equipo.stats} />
          <InsightsPanel tendencias={equipo.tendencias} />
        </div>
      </div>

      {equipo.ultimos_partidos.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-white mb-4">Ultimos Partidos</h3>
          <div className="space-y-2">
            {equipo.ultimos_partidos.map((partido, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 bg-bg-terciario rounded-lg border border-borde-sutil"
              >
                <span className="text-sm text-texto-secundario w-24">{partido.fecha}</span>
                <span className="text-sm text-white flex-1">vs {partido.rival}</span>
                <span
                  className={`text-sm font-bold ${
                    partido.resultado.includes("V")
                      ? "text-victoria"
                      : partido.resultado.includes("E")
                      ? "text-empate"
                      : "text-derrota"
                  }`}
                >
                  {partido.resultado}
                </span>
                <span className="text-xs text-texto-secundario">{partido.formacion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
