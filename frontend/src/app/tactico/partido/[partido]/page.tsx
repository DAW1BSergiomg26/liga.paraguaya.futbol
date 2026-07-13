"use client";

import { useParams } from "next/navigation";
import { useTacticoPartido } from "@/hooks/useTacticoPartido";
import TacticalField from "@/components/tactico/TacticalField";
import StatsPanel from "@/components/tactico/StatsPanel";
import PageHeader from "@/components/ui/PageHeader";

export default function PartidoTacticoPage() {
  const params = useParams();
  const partidoId = params.partido as string;
  const { data: analisis, isLoading, error } = useTacticoPartido(partidoId);

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

  if (error || !analisis) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-derrota">Partido no encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        titulo={`${analisis.local.nombre} vs ${analisis.visitante.nombre}`}
        subtitulo="Analisis tactico comparativo"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <TacticalField
          jugadores={analisis.local.jugadores}
          formacionPrincipal={analisis.local.formacion}
          formacionesDisponibles={[analisis.local.formacion]}
          colorEquipo="#D52B1E"
          titulo={analisis.local.nombre}
        />
        <TacticalField
          jugadores={analisis.visitante.jugadores}
          formacionPrincipal={analisis.visitante.formacion}
          formacionesDisponibles={[analisis.visitante.formacion]}
          colorEquipo="#0038A8"
          titulo={analisis.visitante.nombre}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-bold text-white mb-4">{analisis.local.nombre}</h3>
          <StatsPanel stats={analisis.stats.local} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-4">{analisis.visitante.nombre}</h3>
          <StatsPanel stats={analisis.stats.visitante} />
        </div>
      </div>

      <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Prediccion IA</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-bg-terciario rounded-lg">
            <div className="text-2xl font-bold text-victoria">{(analisis.prediccion_ia.gana_local * 100).toFixed(0)}%</div>
            <div className="text-sm text-texto-secundario mt-1">Victoria Local</div>
          </div>
          <div className="p-4 bg-bg-terciario rounded-lg">
            <div className="text-2xl font-bold text-empate">{(analisis.prediccion_ia.empate * 100).toFixed(0)}%</div>
            <div className="text-sm text-texto-secundario mt-1">Empate</div>
          </div>
          <div className="p-4 bg-bg-terciario rounded-lg">
            <div className="text-2xl font-bold text-py-azul">{(analisis.prediccion_ia.gana_visitante * 100).toFixed(0)}%</div>
            <div className="text-sm text-texto-secundario mt-1">Victoria Visitante</div>
          </div>
        </div>
        <p className="text-center text-sm text-texto-secundario mt-4">
          Confianza: {analisis.prediccion_ia.confianza}
        </p>
      </div>
    </div>
  );
}
